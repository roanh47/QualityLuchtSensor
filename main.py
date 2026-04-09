print("hello van main.py")

from machine import Pin, UART, ADC
from time import sleep_ms

uart = UART(0, baudrate=9600, tx=Pin(0), rx=Pin(1))
buf = bytearray()
sensor = ADC(Pin(26))

def lees_temperatuur_c():
    waarde = sensor.read_u16()
    spanning = waarde * (3.3 / 65535)
    temperatuur = (spanning - 0.5) * 100
    return temperatuur

while True:
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

    sleep_ms(50)
