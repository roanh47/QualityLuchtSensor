print("▶️ Booting...")
# boot.py
# Minimal boot script: configureer de Pico W als Access Point
import network
import time

SSID = "QualityLuchtSensor™"

ap = network.WLAN(network.AP_IF)
ap.active(False)
time.sleep(0.5)
ap.active(True)
ap.ifconfig(('192.168.4.1', '255.255.255.0', '192.168.4.1', '192.168.4.1'))
ap.config(ssid=SSID, security=0)
time.sleep(1)
print('Access Point geactiveerd:', SSID)
print('IP-config:', ap.ifconfig())
