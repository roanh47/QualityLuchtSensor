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
let monitorSubscription = null;
let onDataCallback = null;
let onDisconnectCallback = null;

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
    startMonitoring();
    return connectedDevice;
  } catch (error) {
    throw error;
  }
}

export async function disconnectDevice() {
  if (monitorSubscription) {
    monitorSubscription.remove();
    monitorSubscription = null;
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

function parseSensorData(base64Value) {
  try {
    const raw = atob(base64Value);
    const values = raw.split(',').map(Number);
    if (values.length >= 5) {
      return {
        pm25: values[0],
        pm10: values[1],
        temp: values[2],
        nox: values[3],
        statusLevel: values[4],
      };
    }
  } catch (e) {
  }
  return null;
}

async function readAllCharacteristics() {
  if (!connectedDevice) return;
  try {
    const services = await connectedDevice.services();
    for (const service of services) {
      if (service.uuid.toUpperCase() === BLE_CONFIG.SERVICE_UUID) {
        const characteristics = await service.characteristics();
        const data = {};
        for (const char of characteristics) {
          const charData = await char.read();
          const uuid = char.uuid.toUpperCase();
          const decodedValue = atob(charData.value);
          
          if (uuid === BLE_CONFIG.PM25_CHAR_UUID) data.pm25 = parseFloat(decodedValue);
          else if (uuid === BLE_CONFIG.PM10_CHAR_UUID) data.pm10 = parseFloat(decodedValue);
          else if (uuid === BLE_CONFIG.TEMP_CHAR_UUID) data.temp = parseFloat(decodedValue);
          else if (uuid === BLE_CONFIG.NOX_CHAR_UUID) data.nox = parseFloat(decodedValue);
          else if (uuid === BLE_CONFIG.STATUS_CHAR_UUID) data.statusLevel = parseInt(decodedValue, 10);
        }
        if (onDataCallback && data.pm25 !== undefined) onDataCallback(data);
      }
    }
  } catch (e) {
    console.log('Read characteristics error:', e);
  }
}

function startMonitoring() {
  if (!connectedDevice) return;
  readAllCharacteristics();
  const interval = setInterval(readAllCharacteristics, 5000);
  monitorSubscription = { remove: () => clearInterval(interval) };
}

export function clear() {
  if (monitorSubscription) monitorSubscription.remove();
  monitorSubscription = null;
  connectedDevice = null;
  onDataCallback = null;
  onDisconnectCallback = null;
  const m = getManager();
  if (m) m.destroy();
  manager = null;
}
