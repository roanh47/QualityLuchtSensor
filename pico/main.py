print("▶️  Starting main.py")

from machine import Pin, UART, ADC
import network
import socket
import gc
import utime
import uasyncio as asyncio

import ujson

# ── Sensor setup ─────────────────────────────────────────────────────────────

uart = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))
buf = bytearray()
sensor = ADC(Pin(26))

pico_led = Pin("LED", Pin.OUT)
rode_led  = Pin(15, Pin.OUT)

# PM2.5 grens voor COPD-patiënten (EU 24u-limiet; >25 µg/m³ verhoogt exacerbatierisico)
PM25_COPD_DREMPEL = 25.0

pm25 = 0.0
pm10 = 0.0
temp = 0.0

DEFAULT_SETTINGS = {
    "naam": "",
    "leeftijd": "50 jaar",
    "copd": "GOLD 3",
    "promode": False,
    "themekey": "sky",
    "showpm25": True,
    "showpm10": True,
    "showtemp": True,
    "showgas": True,
    "symptoms": []
}

GOLD_THRESHOLDS = {
    "GOLD 1": {"green": 5, "yellow": 10, "orange": 20, "red": 25},
    "GOLD 2": {"green": 4, "yellow": 8, "orange": 16, "red": 20},
    "GOLD 3": {"green": 3, "yellow": 6, "orange": 12, "red": 16},
    "GOLD 4": {"green": 2, "yellow": 5, "orange": 10, "red": 14}
}

def calc_status_level(pm25_val, gold_phase):
    t = GOLD_THRESHOLDS.get(gold_phase, GOLD_THRESHOLDS["GOLD 3"])
    if pm25_val >= t["red"]:
        return 5
    if pm25_val >= t["orange"]:
        return 4
    if pm25_val >= t["yellow"]:
        return 3
    if pm25_val >= t["green"]:
        return 2
    return 1

def load_settings():
    try:
        with open("settings.json", "r") as f:
            return ujson.loads(f.read())
    except:
        return dict(DEFAULT_SETTINGS)

def save_settings(data):
    with open("settings.json", "w") as f:
        f.write(ujson.dumps(data))

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
        print("PM2.5:", pm25, "ug/m3 | PM10:", pm10, "ug/m3 | Temp:", round(temp, 1), "C")
        return True
    return False


# ── Network ───────────────────────────────────────────────────────────────────

ap = network.WLAN(network.AP_IF)
AP_IP = ap.ifconfig()[0]
print("AP IP:", AP_IP)


# ── DNS server ────────────────────────────────────────────────────────────────
# Responds to every DNS query with AP_IP so the OS detects a captive portal.

async def dns_task():
    udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    udp.setblocking(False)
    udp.bind(("0.0.0.0", 53))
    ip_bytes = bytes(int(x) for x in AP_IP.split("."))
    print("DNS listening on port 53")
    while True:
        try:
            data, addr = udp.recvfrom(512)
            # Build a minimal DNS A-record response pointing to AP_IP
            resp = (
                data[:2]                        # transaction ID (echo)
                + b"\x81\x80"                   # flags: response, no error
                + data[4:6]                     # QDCOUNT (echo)
                + b"\x00\x01"                   # ANCOUNT = 1
                + b"\x00\x00\x00\x00"           # NSCOUNT, ARCOUNT = 0
                + data[12:]                     # question section (echo)
                + b"\xc0\x0c"                   # answer name pointer
                + b"\x00\x01\x00\x01"           # TYPE A, CLASS IN
                + b"\x00\x00\x00\x3c"           # TTL 60 s
                + b"\x00\x04"                   # RDLENGTH 4
                + ip_bytes                      # the IP
            )
            udp.sendto(resp, addr)
        except OSError:
            pass
        await asyncio.sleep_ms(10)


# ── HTTP server ───────────────────────────────────────────────────────────────

def status_json():
    level = calc_status_level(pm25, settings.get("copd", "GOLD 3"))
    return '{{"uptime":{},"mem":{},"ip":"{}","pm25":{},"pm10":{},"temp":{},"statusLevel":{}}}'.format(
        utime.ticks_ms() // 1000, gc.mem_free(), AP_IP, pm25, pm10, round(temp, 1), level)

def read_file(path):
    with open(path, "r") as f:
        return f.read()

REDIRECT = "HTTP/1.1 302 Found\r\nLocation: http://{}/\r\nContent-Length: 0\r\nConnection: close\r\n\r\n".format(AP_IP)

async def handle_client(reader, writer):
    try:
        raw = await asyncio.wait_for(reader.read(2048), timeout=3)
        try:
            request_text = raw.decode("utf-8", "ignore")
            first_line = request_text.split("\r\n")[0]
            method = first_line.split(" ")[0]
            path = first_line.split(" ")[1]
        except Exception:
            method = "GET"
            path = "/"
        if "?" in path:
            path = path.split("?")[0]

        print(method, path)

        cors = ""
        cors_headers = "Access-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n"
        if method == "OPTIONS":
            body = ""
            ct = "text/plain; charset=utf-8"
            cors = cors_headers
        elif method == "POST" and path == "/settings":
            body_text = request_text.split("\r\n\r\n", 1)
            if len(body_text) > 1:
                try:
                    new_settings = ujson.loads(body_text[1])
                    settings.update(new_settings)
                    save_settings(settings)
                    body = '{"ok":true}'
                    ct = "application/json; charset=utf-8"
                    cors = cors_headers
                except Exception as e:
                    print("JSON error:", e)
                    body = '{"ok":false}'
                    ct = "application/json; charset=utf-8"
                    cors = cors_headers
            else:
                body = '{"ok":false}'
                ct = "application/json; charset=utf-8"
                cors = cors_headers
        elif method == "GET" and path == "/settings":
            body = ujson.dumps(settings)
            ct = "application/json; charset=utf-8"
            cors = cors_headers
        elif path in ("/", "/index.html"):
            body = read_file("index.html")
            ct = "text/html; charset=utf-8"
        elif path == "/style.css":
            body = read_file("style.css")
            ct = "text/css; charset=utf-8"
        elif path == "/script.js":
            body = read_file("script.js")
            ct = "application/javascript; charset=utf-8"
        elif path == "/status":
            body = status_json()
            ct = "application/json; charset=utf-8"
            cors = cors_headers
        else:
            # Redirect everything else — this is what triggers the captive portal popup
            writer.write(REDIRECT.encode())
            await writer.drain()
            writer.close()
            return

        body_bytes = body.encode("utf-8")
        resp = "HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\n{}Connection: close\r\n\r\n".format(
            ct, len(body_bytes), cors)
        writer.write(resp.encode("utf-8"))
        writer.write(body_bytes)
        await writer.drain()
    except Exception as e:
        print("HTTP error:", e)
    finally:
        writer.close()


# ── Main ──────────────────────────────────────────────────────────────────────

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
