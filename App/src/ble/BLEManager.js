import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { BLE_CONFIG } from '../theme';

let manager = null;

function getManager() {
  if (!manager) {
    try {
      manager = new BleManager();
    } catch (e) {
      console.warn('BleManager init failed:', e);
    }
  }
  return manager;
}

let connectedDevice = null;
let monitorSubscriptions = [];
let pollInterval = null;
let cachedChars = [];
let onDataCallback = null;
let onDisconnectCallback = null;
let disconnectSubscription = null;
// Laatst ontvangen waarden per karakteristiek
const latestValues = {};

export async function requestPermissions() {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return (
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted' &&
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted'
      );
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === 'granted';
  }
  return true;
}

export function startScan(onDeviceFound, onError) {
  const m = getManager();
  if (!m) return;
  m.startDeviceScan(
    [BLE_CONFIG.SERVICE_UUID],
    null,
    (error, device) => {
      if (error) {
        onError && onError(error);
        return;
      }
      if (device && device.name && device.name.includes(BLE_CONFIG.DEVICE_NAME)) {
        onDeviceFound(device);
      }
    }
  );
}

export function stopScan() {
  const m = getManager();
  if (m) m.stopDeviceScan();
}

export async function connectToDevice(device) {
  try {
    console.log('[BLE] Connecting to', device.id, device.name);
    connectedDevice = await device.connect();
    console.log('[BLE] Connected, discovering services...');
    await connectedDevice.discoverAllServicesAndCharacteristics();
    console.log('[BLE] Services discovered');
    // Luister naar onverwachtse disconnect van de Pico
    disconnectSubscription = connectedDevice.onDisconnected((err) => {
      console.log('Device disconnected:', err ? err.message : 'unknown');
      removeSubscriptions();
      if (disconnectSubscription) {
        disconnectSubscription.remove();
        disconnectSubscription = null;
      }
      connectedDevice = null;
      if (onDisconnectCallback) onDisconnectCallback();
    });
    await subscribeToNotifications();
    return connectedDevice;
  } catch (error) {
    throw error;
  }
}

export async function disconnectDevice() {
  removeSubscriptions();
  if (disconnectSubscription) {
    disconnectSubscription.remove();
    disconnectSubscription = null;
  }
  if (connectedDevice) {
    await connectedDevice.cancelConnection();
    connectedDevice = null;
  }
  if (onDisconnectCallback) onDisconnectCallback();
}

export function isConnected() {
  return connectedDevice !== null;
}

export function setOnDataCallback(callback) {
  onDataCallback = callback;
}

export function setOnDisconnectCallback(callback) {
  onDisconnectCallback = callback;
}

function removeSubscriptions() {
  for (const sub of monitorSubscriptions) {
    if (sub) sub.remove();
  }
  monitorSubscriptions = [];
  stopPollFallback();
  cachedChars = [];
}

// Poll fallback: als monitor niet werkt, lees periodiek
function startPollFallback() {
  stopPollFallback();
  if (!connectedDevice || cachedChars.length === 0) return;
  pollInterval = setInterval(async () => {
    if (!connectedDevice) { stopPollFallback(); return; }
    for (const { char: c, uuid: fullUUID } of cachedChars) {
      try {
        const val = await c.read();
        if (val && val.value) {
          const parsed = parseSingleChar(fullUUID, val.value);
          if (parsed !== undefined) {
            latestValues[fullUUID] = parsed;
          }
        }
      } catch (_) {}
    }
    notifyDataIfReady();
  }, 1000);
}

function stopPollFallback() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
}

// Helper: map verkorte UUID (evt. "FFE1") naar volledige UUID
const CHAR_UUID_MAP = {};
const ALL_CHAR_UUIDS = [
  BLE_CONFIG.PM25_CHAR_UUID,
  BLE_CONFIG.PM10_CHAR_UUID,
  BLE_CONFIG.TEMP_CHAR_UUID,
  BLE_CONFIG.NOX_CHAR_UUID,
  BLE_CONFIG.STATUS_CHAR_UUID,
];
for (const full of ALL_CHAR_UUIDS) {
  const short = full.split('-')[0]; // "0000FFE1"
  CHAR_UUID_MAP[short] = full;
  CHAR_UUID_MAP[full] = full;
  // Ook lowercase variants
  CHAR_UUID_MAP[full.toLowerCase()] = full;
  CHAR_UUID_MAP[short.toLowerCase()] = full;
}

function resolveUUID(raw) {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  // Direct match
  if (CHAR_UUID_MAP[upper]) return CHAR_UUID_MAP[upper];
  // Kort formaat: "0000FFE1" of "FFE1"
  const short = upper.replace(/^0000/, '');
  if (CHAR_UUID_MAP['0000' + short]) return CHAR_UUID_MAP['0000' + short];
  // Fallback: check of het einde overeenkomt
  for (const full of ALL_CHAR_UUIDS) {
    if (full.toUpperCase().endsWith(upper) || upper.endsWith(full.split('-')[0].replace('0000', ''))) {
      return full;
    }
  }
  return null;
}

function parseSingleChar(uuid, base64Value) {
  try {
    console.log(`[BLE] parseSingleChar uuid=${uuid} raw=${base64Value}`);
    const decoded = atob(base64Value);
    console.log(`[BLE] decoded="${decoded}"`);
    if (!decoded) return undefined;
    if (uuid === BLE_CONFIG.PM25_CHAR_UUID) return parseFloat(decoded);
    if (uuid === BLE_CONFIG.PM10_CHAR_UUID) return parseFloat(decoded);
    if (uuid === BLE_CONFIG.TEMP_CHAR_UUID) return parseFloat(decoded);
    if (uuid === BLE_CONFIG.NOX_CHAR_UUID) return parseFloat(decoded);
    if (uuid === BLE_CONFIG.STATUS_CHAR_UUID) return parseInt(decoded, 10);
  } catch (e) {
    console.log('[BLE] parseSingleChar error:', e.message);
  }
  return undefined;
}

async function subscribeToNotifications() {
  if (!connectedDevice) return;
  removeSubscriptions();
  stopPollFallback();
  cachedChars = [];
  Object.keys(latestValues).forEach(k => delete latestValues[k]);

  try {
    const services = await connectedDevice.services();
    console.log('[BLE] Discovered services:', services.length);
    for (const service of services) {
      console.log('[BLE] Service:', service.uuid);
      const characteristics = await service.characteristics();
      console.log('[BLE] Chars in service:', characteristics.length);
      for (const char of characteristics) {
        const fullUUID = resolveUUID(char.uuid);
        if (!fullUUID) {
          console.log('[BLE] Skipping non-matching char:', char.uuid);
          continue;
        }

        console.log(`[BLE] Matched char: ${char.uuid} -> ${fullUUID} (notifiable=${char.isNotifiable})`);

        // Eerste waarde direct uitlezen (Pico heeft beginwaarden klaarstaan)
        try {
          const initRead = await char.read();
          if (initRead && initRead.value) {
            console.log(`[BLE] Init read ${fullUUID} = ${initRead.value}`);
            const val = parseSingleChar(fullUUID, initRead.value);
            if (val !== undefined) latestValues[fullUUID] = val;
          }
        } catch (e) {
          console.log('[BLE] Init read failed for', fullUUID, e.message);
        }

        // Cache voor poll fallback
        cachedChars.push({ char, uuid: fullUUID });

        // Subscribe op notifications — Pico pusht elke 1s
        try {
          const sub = char.monitor((error, updatedChar) => {
            if (error) {
              console.log('[BLE] Monitor error for', fullUUID, ':', error);
              return;
            }
            if (!updatedChar || !updatedChar.value) {
              console.log('[BLE] Monitor: no value for', fullUUID);
              return;
            }
            console.log(`[BLE] Monitor update: ${fullUUID} = ${updatedChar.value}`);
            const val = parseSingleChar(fullUUID, updatedChar.value);
            if (val !== undefined) {
              latestValues[fullUUID] = val;
              notifyDataIfReady();
            }
          });
          monitorSubscriptions.push(sub);
          console.log('[BLE] Monitor subscription added for', fullUUID);
        } catch (e) {
          console.log('[BLE] Monitor setup failed for', fullUUID, e.message);
        }
      }
    }

    // Eerste callback met init waarden
    notifyDataIfReady();

    // Start poll fallback (leest characteristics elke 1s als backup)
    if (monitorSubscriptions.length === 0 && cachedChars.length > 0) {
      console.log('[BLE] No monitors active, starting poll fallback');
      startPollFallback();
    } else {
      console.log('[BLE]', monitorSubscriptions.length, 'monitors active, no poll needed');
    }
  } catch (e) {
    console.log('Subscribe error:', e);
  }
}

export function clear() {
  removeSubscriptions();
  stopPollFallback();
  if (disconnectSubscription) {
    disconnectSubscription.remove();
    disconnectSubscription = null;
  }
  connectedDevice = null;
  onDataCallback = null;
  onDisconnectCallback = null;
  Object.keys(latestValues).forEach(k => delete latestValues[k]);
  const m = getManager();
  if (m) m.destroy();
  manager = null;
}
