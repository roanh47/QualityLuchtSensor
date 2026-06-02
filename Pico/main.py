print("▶️  Starting main.py")

from machine import Pin, UART, ADC, I2C
import network
import socket
import gc
import utime
import uasyncio as asyncio
import ujson

try:
    import aioble
    import bluetooth
    _BLE_SUPPORT = True
except ImportError:
    print("aioble module not found. BLE won't work.")
    _BLE_SUPPORT = False

if _BLE_SUPPORT:
    _SERVICE_UUID = bluetooth.UUID('0000FFE0-0000-1000-8000-00805F9B34FB')
    _PM25_UUID = bluetooth.UUID('0000FFE1-0000-1000-8000-00805F9B34FB')
    _PM10_UUID = bluetooth.UUID('0000FFE2-0000-1000-8000-00805F9B34FB')
    _TEMP_UUID = bluetooth.UUID('0000FFE3-0000-1000-8000-00805F9B34FB')
    _NOX_UUID = bluetooth.UUID('0000FFE4-0000-1000-8000-00805F9B34FB')
    _STATUS_UUID = bluetooth.UUID('0000FFE5-0000-1000-8000-00805F9B34FB')

    _ble_service = aioble.Service(_SERVICE_UUID)
    _pm25_char = aioble.Characteristic(_ble_service, _PM25_UUID, read=True, notify=True)
    _pm10_char = aioble.Characteristic(_ble_service, _PM10_UUID, read=True, notify=True)
    _temp_char = aioble.Characteristic(_ble_service, _TEMP_UUID, read=True, notify=True)
    _nox_char = aioble.Characteristic(_ble_service, _NOX_UUID, read=True, notify=True)
    _status_char = aioble.Characteristic(_ble_service, _STATUS_UUID, read=True, notify=True)
    aioble.register_services(_ble_service)

uart = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))
buf = bytearray()
sensor = ADC(Pin(26))
i2c = I2C(1, scl=Pin(3), sda=Pin(2), freq=100000)

SGP41_ADDR = 0x59

pico_led = Pin("LED", Pin.OUT)
rode_led = Pin(15, Pin.OUT)

PM25_COPD_DREMPEL = 25.0

pm25 = 0.0
pm10 = 0.0
temp = 0.0
gas_nox = 0
gas_connected = False
gas_raw = ""

DEFAULT_SETTINGS = {"naam":"","leeftijd":"50 jaar","copd":"GOLD 3","promode":False,"themekey":"sky","showpm25":True,"showpm10":True,"showtemp":True,"showgas":True,"symptoms":[]}

GOLD_THRESHOLDS = {"GOLD 1":{"green":5,"yellow":10,"orange":20,"red":25},"GOLD 2":{"green":4,"yellow":8,"orange":16,"red":20},"GOLD 3":{"green":3,"yellow":6,"orange":12,"red":16},"GOLD 4":{"green":2,"yellow":5,"orange":10,"red":14}}

NOX_THRESHOLDS = {"green": 18000, "yellow": 25000, "orange": 35000, "red": 45000}

def calc_nox_level(nox):
    if nox >= NOX_THRESHOLDS["red"]: return 5
    if nox >= NOX_THRESHOLDS["orange"]: return 4
    if nox >= NOX_THRESHOLDS["yellow"]: return 3
    if nox >= NOX_THRESHOLDS["green"]: return 2
    return 1

def calc_status_level(v, g):
    t = GOLD_THRESHOLDS.get(g, GOLD_THRESHOLDS["GOLD 3"])
    if v >= t["red"]: return 5
    if v >= t["orange"]: return 4
    if v >= t["yellow"]: return 3
    if v >= t["green"]: return 2
    return 1

def calc_combined_status(pm25, gold, nox):
    pm_level = calc_status_level(pm25, gold)
    nox_level = calc_nox_level(nox)
    return max(pm_level, nox_level)

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

def test_gas_sensor():
    global gas_connected, gas_raw
    try:
        devices = i2c.scan()
        gas_raw = "I2C devices: " + str([hex(d) for d in devices])
        if SGP41_ADDR in devices:
            gas_connected = True
            gas_raw += " | SGP41 found at 0x59"
            print("[GAS] Connected -", gas_raw)
        else:
            gas_connected = False
            print("[GAS] NOT connected -", gas_raw)
    except Exception as e:
        gas_connected = False
        gas_raw = "I2C error: " + str(e)
        print("[GAS] I2C error -", gas_raw)

def init_gas_sensor():
    global gas_connected
    if not gas_connected:
        return
    try:
        # sgp41_execute_conditioning (0x2612) + default RH/Temp params per datasheet
        i2c.writeto(SGP41_ADDR, bytes([0x26, 0x12, 0x80, 0x00, 0xA2, 0x66, 0x66, 0x93]))
        utime.sleep_ms(50)
        _ = i2c.readfrom(SGP41_ADDR, 3)
        print("[GAS] Conditioning done")
    except Exception as e:
        print("[GAS] Conditioning error:", e)

def read_gas_sensor():
    global gas_nox
    if not gas_connected:
        return
    try:
        # sgp41_measure_raw_signals (0x2619) + default RH/Temp params per datasheet
        i2c.writeto(SGP41_ADDR, bytes([0x26, 0x19, 0x80, 0x00, 0xA2, 0x66, 0x66, 0x93]))
        utime.sleep_ms(50)
        data = i2c.readfrom(SGP41_ADDR, 6)
        # NOx raw signal is in bytes 3 and 4
        gas_nox = (data[3] << 8) | data[4]
    except Exception as e:
        print("[GAS] Read error:", e)

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
        read_gas_sensor()
        rode_led.value(1 if pm25 >= PM25_COPD_DREMPEL else 0)
        print("PM2.5:", pm25, "| PM10:", pm10, "| Temp:", round(temp, 1), "| NOx:", gas_nox)
        return True
    return False

print("[GAS] Testing connection...")
test_gas_sensor()
init_gas_sensor()

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
    level = calc_combined_status(pm25, settings.get("copd", "GOLD 3"), gas_nox)
    return '{"pm25":%s,"pm10":%s,"temp":%s,"nox":%d,"statusLevel":%d}' % (pm25, pm10, round(temp, 1), gas_nox, level)

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

async def ble_task():
    if not _BLE_SUPPORT:
        return
    print("BLE Started. Broadcasting as 'QualityLuchtSensor'")
    while True:
        try:
            async with await aioble.advertise(
                250_000,
                name="QualityLuchtSensor",
                services=[_SERVICE_UUID],
                appearance=0x0000,
            ) as connection:
                print("BLE Client Connected:", connection.device)
                while connection.is_connected():
                    stat = calc_combined_status(pm25, settings.get("copd", "GOLD 3"), gas_nox)
                    _pm25_char.write(str(round(pm25, 1)).encode())
                    _pm10_char.write(str(round(pm10, 1)).encode())
                    _temp_char.write(str(round(temp, 1)).encode())
                    _nox_char.write(str(gas_nox).encode())
                    _status_char.write(str(stat).encode())
                    
                    await asyncio.sleep_ms(2000)
                print("BLE Client Disconnected")
        except Exception as e:
            print("BLE Error:", e)
            await asyncio.sleep_ms(5000)

async def main():
    if _BLE_SUPPORT:
        asyncio.create_task(ble_task())
    asyncio.create_task(dns_task())
    asyncio.create_task(uart_task())
    await asyncio.start_server(handle_client, "0.0.0.0", 80, backlog=5)
    print("HTTP listening on port 80")
    while True:
        await asyncio.sleep(3600)

asyncio.run(main())
