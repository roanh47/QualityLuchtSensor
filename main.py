print("hello van main.py")

from machine import Pin, UART, ADC
from time import sleep_ms
import network
import socket
import gc
import utime

# UART / sensor setup
uart = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))
buf = bytearray()
sensor = ADC(Pin(26))

pm25 = 0.0
pm10 = 0.0
temp = 0.0

def lees_temperatuur_c():
    waarde = sensor.read_u16()
    spanning = waarde * (3.3 / 65535)
    temperatuur = (spanning - 0.5) * 100
    return temperatuur

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

        if ((frame[2] + frame[3] + frame[4] + frame[5] + frame[6] + frame[7]) & 0xFF) != frame[8]:
            continue

        pm25 = (frame[2] + (frame[3] << 8)) / 10
        pm10 = (frame[4] + (frame[5] << 8)) / 10
        temp = lees_temperatuur_c()
        print("PM2.5:", pm25, "ug/m3 | PM10:", pm10, "ug/m3 | Temp:", round(temp, 1), "C")


# Network / webserver setup
SSID = "TEST4"

# Verkrijg AP interface (AP-configuratie gebeurt in boot.py)
ap = network.WLAN(network.AP_IF)
print('Access Point status (active):', ap.active())
print('IP-config:', ap.ifconfig())
AP_IP = ap.ifconfig()[0]
print('Open deze URL op je telefoon/laptop: http://{}/'.format(AP_IP))

def status_json():
    uptime = utime.ticks_ms() // 1000
    free = gc.mem_free()
    ip = AP_IP
    return '{{"uptime": {}, "mem": {}, "ip": "{}", "pm25": {}, "pm10": {}, "temp": {}}}'.format(uptime, free, ip, pm25, pm10, temp)


INDEX_PAGE = """<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Hello</title>
    <style>body{font-family: Arial; padding:20px}</style>
</head>
<body>
    <h1>Hello World</h1>
    <p>De Pico W webserver werkt.</p>
</body>
</html>
"""


def send_response(cl, status, content_type, body, extra_headers=''):
    if isinstance(body, str):
        body = body.encode('utf-8')
    header = (
        'HTTP/1.0 {}\r\n'
        'Content-Type: {}\r\n'
        'Content-Length: {}\r\n'
        'Connection: close\r\n'
        '{}'
        '\r\n'
    ).format(status, content_type, len(body), extra_headers)
    cl.send(header.encode('utf-8'))
    cl.send(body)


def parse_path(request_bytes):
    try:
        first_line = request_bytes.decode('utf-8', 'ignore').split('\r\n', 1)[0]
        parts = first_line.split()
        if len(parts) >= 2:
            return parts[1]
    except Exception as e:
        print('Fout bij parsen request:', e)
    return '/'


# Start eenvoudige HTTP-server (non-blocking accept zodat UART kan blijven werken)
addr = socket.getaddrinfo('0.0.0.0', 80)[0][-1]
s = socket.socket()
s.bind(addr)
s.listen(5)
s.settimeout(0.2)
print('Luister op', addr)
try:
    while True:
        try:
            cl, addr = s.accept()
        except OSError:
            cl = None

        if cl:
            print('Client verbonden vanaf', addr)
            try:
                cl.settimeout(1.0)
                request = cl.recv(1024)
                print('Request bytes:', len(request) if request else 0)
                path = parse_path(request or b'')
                print('Pad:', path)

                if path == '/status':
                    res = status_json()
                    send_response(cl, '200 OK', 'application/json; charset=utf-8', res)
                elif path == '/' or path == '/index.html':
                    send_response(cl, '200 OK', 'text/html; charset=utf-8', INDEX_PAGE)
                else:
                    send_response(cl, '404 Not Found', 'text/plain; charset=utf-8', 'Niet gevonden')
            except Exception as e:
                print('Fout bij request:', e)
            finally:
                cl.close()

        # Verwerk UART/sensor data
        process_uart()
        sleep_ms(50)
except KeyboardInterrupt:
    s.close()
    print('Server gestopt')

# Zorg dat we niet continu groeiende geheugen gebruiken
# (eventueel extra cleanup hier)
