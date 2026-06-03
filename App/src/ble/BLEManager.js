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
    connectedDevice = await device.connect();
    await connectedDevice.discoverAllServicesAndCharacteristics();
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
}

function notifyDataIfReady() {
  if (!onDataCallback) return;
  const pm25 = latestValues[BLE_CONFIG.PM25_CHAR_UUID];
  const pm10 = latestValues[BLE_CONFIG.PM10_CHAR_UUID];
  const temp = latestValues[BLE_CONFIG.TEMP_CHAR_UUID];
  const nox = latestValues[BLE_CONFIG.NOX_CHAR_UUID];
  const statusLevel = latestValues[BLE_CONFIG.STATUS_CHAR_UUID];
  // Fire zodra we minimaal PM2.5 hebben (eerste meetronde binnen)
  if (pm25 !== undefined) {
    onDataCallback({ pm25, pm10, temp, nox, statusLevel });
  }
}

function parseSingleChar(uuid, base64Value) {
  try {
    const decoded = atob(base64Value);
    if (!decoded) return undefined;
    if (uuid === BLE_CONFIG.PM25_CHAR_UUID) return parseFloat(decoded);
    if (uuid === BLE_CONFIG.PM10_CHAR_UUID) return parseFloat(decoded);
    if (uuid === BLE_CONFIG.TEMP_CHAR_UUID) return parseFloat(decoded);
    if (uuid === BLE_CONFIG.NOX_CHAR_UUID) return parseFloat(decoded);
    if (uuid === BLE_CONFIG.STATUS_CHAR_UUID) return parseInt(decoded, 10);
  } catch (e) {}
  return undefined;
}

async function subscribeToNotifications() {
  if (!connectedDevice) return;
  removeSubscriptions();
  Object.keys(latestValues).forEach(k => delete latestValues[k]);

  try {
    const services = await connectedDevice.services();
    for (const service of services) {
      if (service.uuid.toUpperCase() === BLE_CONFIG.SERVICE_UUID) {
        const characteristics = await service.characteristics();

        for (const char of characteristics) {
          const uuid = char.uuid.toUpperCase();
          if (
            uuid !== BLE_CONFIG.PM25_CHAR_UUID &&
            uuid !== BLE_CONFIG.PM10_CHAR_UUID &&
            uuid !== BLE_CONFIG.TEMP_CHAR_UUID &&
            uuid !== BLE_CONFIG.NOX_CHAR_UUID &&
            uuid !== BLE_CONFIG.STATUS_CHAR_UUID
          ) continue;

          // Eerste waarde direct uitlezen (Pico heeft beginwaarden klaarstaan)
          try {
            const initRead = await char.read();
            if (initRead && initRead.value) {
              const val = parseSingleChar(uuid, initRead.value);
              if (val !== undefined) latestValues[uuid] = val;
            }
          } catch (_) {}

          // Subscribe op notifications — Pico pusht elke 1s
          const sub = char.monitor((error, updatedChar) => {
            if (error) {
              console.log('Monitor error:', error);
              return;
            }
            if (!updatedChar || !updatedChar.value) return;
            const val = parseSingleChar(uuid, updatedChar.value);
            if (val !== undefined) {
              latestValues[uuid] = val;
              notifyDataIfReady();
            }
          });
          monitorSubscriptions.push(sub);
        }
        break;
      }
    }
  } catch (e) {
    console.log('Subscribe error:', e);
  }
}

export function clear() {
  removeSubscriptions();
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
