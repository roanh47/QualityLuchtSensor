print("▶️  Starting main.py")

from machine import Pin, UART, ADC
import network
import socket
import gc
import utime
import uasyncio as asyncio
import ujson

uart = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))
buf = bytearray()
sensor = ADC(Pin(26))

pico_led = Pin("LED", Pin.OUT)
rode_led = Pin(15, Pin.OUT)

PM25_COPD_DREMPEL = 25.0

pm25 = 0.0
pm10 = 0.0
temp = 0.0

DEFAULT_SETTINGS = {"naam":"","leeftijd":"50 jaar","copd":"GOLD 3","promode":False,"themekey":"sky","showpm25":True,"showpm10":True,"showtemp":True,"showgas":True,"symptoms":[]}

GOLD_THRESHOLDS = {"GOLD 1":{"green":5,"yellow":10,"orange":20,"red":25},"GOLD 2":{"green":4,"yellow":8,"orange":16,"red":20},"GOLD 3":{"green":3,"yellow":6,"orange":12,"red":16},"GOLD 4":{"green":2,"yellow":5,"orange":10,"red":14}}

def calc_status_level(v, g):
    t = GOLD_THRESHOLDS.get(g, GOLD_THRESHOLDS["GOLD 3"])
    if v >= t["red"]: return 5
    if v >= t["orange"]: return 4
    if v >= t["yellow"]: return 3
    if v >= t["green"]: return 2
    return 1

def load_settings():
    try:
        with open("settings.json", "r") as f:
            raw = f.read()
            if raw:
                return ujson.loads(raw)
    except:
        pass
    return dict(DEFAULT_SETTINGS)

def save_settings(data):
    try:
        with open("settings.json", "w") as f:
            f.write(ujson.dumps(data))
    except Exception as e:
        print("Save err:", e)

settings = load_settings()

def lees_temperatuur_c():
    waarde = sensor.read_u16()
    spanning = waarde * (3.3 / 65535)
    return (spanning - 0.5) * 100

def process_uart():
    global buf, pm25, pm10, temp
    data = uart.read()
    if data:
        buf.extend(data)
    while len(buf) >= 10:
        if buf[0] != 0xAA or buf[1] != 0xC0 or buf[9] != 0xAB:
            buf.pop(0)
            continue
        frame = buf[:10]
        buf = buf[10:]
        if ((frame[2]+frame[3]+frame[4]+frame[5]+frame[6]+frame[7]) & 0xFF) != frame[8]:
            continue
        pm25 = (frame[2] + (frame[3] << 8)) / 10
        pm10 = (frame[4] + (frame[5] << 8)) / 10
        temp = lees_temperatuur_c()
        rode_led.value(1 if pm25 >= PM25_COPD_DREMPEL else 0)
        print("PM2.5:", pm25, "| PM10:", pm10, "| Temp:", round(temp, 1))
        return True
    return False

ap = network.WLAN(network.AP_IF)
AP_IP = ap.ifconfig()[0]
print("AP IP:", AP_IP)

async def dns_task():
    udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    udp.setblocking(False)
    udp.bind(("0.0.0.0", 53))
    ip_bytes = bytes(int(x) for x in AP_IP.split("."))
    while True:
        try:
            data, addr = udp.recvfrom(512)
            resp = data[:2] + b"\x81\x80" + data[4:6] + b"\x00\x01\x00\x00\x00\x00" + data[12:] + b"\xc0\x0c\x00\x01\x00\x01\x00\x00\x00\x3c\x00\x04" + ip_bytes
            udp.sendto(resp, addr)
        except OSError:
            pass
        await asyncio.sleep_ms(10)

def status_json():
    level = calc_status_level(pm25, settings.get("copd", "GOLD 3"))
    return '{"pm25":%s,"pm10":%s,"temp":%s,"statusLevel":%d}' % (pm25, pm10, round(temp, 1), level)

def read_file(path):
    with open(path, "r") as f:
        return f.read()

async def handle_client(reader, writer):
    try:
        raw = await asyncio.wait_for(reader.read(1024), timeout=3)
        if not raw:
            writer.close()
            return
        request_text = raw.decode("utf-8", "ignore")
        first_line = request_text.split("\r\n")[0]
        parts = first_line.split(" ")
        method = parts[0] if len(parts) > 0 else "GET"
        path = parts[1] if len(parts) > 1 else "/"
        if "?" in path:
            path = path.split("?")[0]

        print(method, path)

        body = ""
        ct = "text/plain"

        if method == "POST" and path == "/settings":
            body_text = request_text.split("\r\n\r\n", 1)
            if len(body_text) > 1:
                try:
                    new_settings = ujson.loads(body_text[1])
                    settings.update(new_settings)
                    save_settings(settings)
                    body = '{"ok":true}'
                    gc.collect()
                except:
                    body = '{"ok":false}'
            else:
                body = '{"ok":false}'
            ct = "application/json"
        elif method == "GET" and path == "/settings":
            body = ujson.dumps(settings)
            ct = "application/json"
        elif path in ("/", "/index.html"):
            body = read_file("index.html")
            ct = "text/html"
        elif path == "/style.css":
            body = read_file("style.css")
            ct = "text/css"
        elif path == "/script.js":
            body = read_file("script.js")
            ct = "application/javascript"
        elif path == "/status":
            body = status_json()
            ct = "application/json"
        else:
            writer.write(("HTTP/1.1 302 Found\r\nLocation: http://%s/\r\nContent-Length: 0\r\nConnection: close\r\n\r\n" % AP_IP).encode())
            await writer.drain()
            writer.close()
            return

        body_bytes = body.encode("utf-8")
        resp = "HTTP/1.1 200 OK\r\nContent-Type: %s\r\nContent-Length: %d\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n" % (ct, len(body_bytes))
        writer.write(resp.encode("utf-8"))
        writer.write(body_bytes)
        await writer.drain()
    except Exception as e:
        print("HTTP err:", e)
    finally:
        writer.close()

async def uart_task():
    while True:
        if process_uart():
            pico_led.on()
            await asyncio.sleep_ms(100)
            pico_led.off()
        await asyncio.sleep_ms(50)

async def main():
    asyncio.create_task(dns_task())
    asyncio.create_task(uart_task())
    await asyncio.start_server(handle_client, "0.0.0.0", 80, backlog=5)
    print("HTTP listening on port 80")
    while True:
        await asyncio.sleep(3600)

asyncio.run(main())
