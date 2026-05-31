import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import GlassCard from '../components/GlassCard';
import Icon from '../components/Icon';
import { BLE_CONFIG } from '../theme';
import * as BLE from '../ble/BLEManager';

export default function ConnectScreen({ onConnected }) {
  const [devices, setDevices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [permissions, setPermissions] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    return () => {
      BLE.stopScan();
    };
  }, []);

  const requestPerms = async () => {
    const ok = await BLE.requestPermissions();
    setPermissions(ok);
    if (!ok) Alert.alert('Toestemming nodig', 'Bluetooth-toestemming is nodig om verbinding te maken met de sensor.');
    return ok;
  };

  const startScan = useCallback(async () => {
    const ok = await requestPerms();
    if (!ok) return;
    setScanning(true);
    setDevices([]);
    BLE.startScan(
      (device) => {
        setDevices(prev => {
          const exists = prev.find(d => d.id === device.id);
          if (exists) return prev;
          return [...prev, device];
        });
      },
      (error) => {
        console.log('Scan error:', error);
        setScanning(false);
      }
    );
    setTimeout(() => {
      BLE.stopScan();
      setScanning(false);
    }, 10000);
  }, []);

  const connect = useCallback(async (device) => {
    setConnecting(true);
    BLE.stopScan();
    setScanning(false);
    try {
      await BLE.connectToDevice(device);
      onConnected();
    } catch (e) {
      Alert.alert('Verbinding mislukt', 'Kan geen verbinding maken met het apparaat: ' + e.message);
    } finally {
      setConnecting(false);
    }
  }, [onConnected]);

  const renderDevice = ({ item }) => {
    const rssi = item.rssi || 0;
    const signalStrength = rssi > -50 ? 'Sterk' : rssi > -70 ? 'Gemiddeld' : 'Zwak';
    return (
      <TouchableOpacity
        onPress={() => connect(item)}
        disabled={connecting}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
          backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16,
          marginBottom: 8,
        }}
      >
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: '#fff', opacity: 0.9,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="bluetooth" size={22} color="#2b6fd6" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a2332' }}>
            QualityLuchtSensor™
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(26,35,50,0.62)', marginTop: 2 }}>
            Signaal: {signalStrength} ({rssi} dBm)
          </Text>
        </View>
        <View style={{
          paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12,
          backgroundColor: '#2b6fd6',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#fff' }}>
            Verbind
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{
      flex: 1,
      backgroundColor: '#c9e0f5',
    }}>
      <View style={{
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 80,
      }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <TouchableOpacity onPress={() => {
            const next = tapCount + 1;
            setTapCount(next);
            if (next >= 5) {
              setTapCount(0);
              onConnected(true);
            }
          }} style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: 'rgba(255,255,255,0.5)',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.9)',
          }}>
            <Icon name="bluetooth" size={36} color="#2b6fd6" />
          </TouchableOpacity>
          <Text style={{ fontSize: 26, fontWeight: '700', color: '#1a2332', letterSpacing: -0.5 }}>
            QualityLuchtSensor™
          </Text>
          <Text style={{ fontSize: 14, color: 'rgba(26,35,50,0.62)', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
            Maak verbinding met je sensor via Bluetooth
          </Text>
        </View>

        {devices.length === 0 && !scanning && (
          <TouchableOpacity
            onPress={startScan}
            style={{
              paddingVertical: 16, borderRadius: 16,
              backgroundColor: '#2b6fd6',
              alignItems: 'center',
              shadowColor: '#2b6fd6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
              Zoek naar sensor
            </Text>
          </TouchableOpacity>
        )}

        {scanning && (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color="#2b6fd6" />
            <Text style={{ fontSize: 14, color: 'rgba(26,35,50,0.62)', marginTop: 12 }}>
              Zoeken naar QualityLuchtSensor™...
            </Text>
          </View>
        )}

        {connecting && (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color="#3ba776" />
            <Text style={{ fontSize: 14, color: 'rgba(26,35,50,0.62)', marginTop: 12 }}>
              Verbinding maken...
            </Text>
          </View>
        )}

        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={item => item.id}
          style={{ flex: 1, marginTop: 16 }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        {devices.length > 0 && !scanning && !connecting && (
          <TouchableOpacity
            onPress={startScan}
            style={{
              paddingVertical: 12, borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.4)',
              alignItems: 'center', marginBottom: 20,
              borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.9)',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a2332' }}>
              Opnieuw zoeken
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
