print("hallo van boot.py")
# boot.py
# Minimal boot script: configureer de Pico W als Access Point
import network
import time

SSID = "TEST4"

ap = network.WLAN(network.AP_IF)
ap.active(True)
# Gebruik 'ssid' parameter op Pico W; geen authmode nodig voor open AP
# Stel WPA2-wachtwoord in (min. 8 tekens)
ap.config(ssid=SSID, password="4test123")
ap.ifconfig(('192.168.4.1', '255.255.255.0', '192.168.4.1', '8.8.8.8'))
# korte pauze zodat interface opkomt
time.sleep(1)
print('Access Point geactiveerd:', SSID)
print('IP-config:', ap.ifconfig())

