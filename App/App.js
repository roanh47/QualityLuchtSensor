import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, AppRegistry, StatusBar, SafeAreaView } from 'react-native';
import { THEMES, pm25ToStatusLvl } from './src/theme';
import TabBar from './src/components/TabBar';
import ConnectScreen from './src/screens/ConnectScreen';
import OverviewScreen from './src/screens/OverviewScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import * as BLE from './src/ble/BLEManager';

const App = () => {
  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState('home');
  const [themeKey, setThemeKey] = useState('sky');
  const [proMode, setProMode] = useState(false);
  const [statusLvl, setStatusLvl] = useState(2);
  const [enabledMetrics, setEnabledMetrics] = useState({
    pm25: true, no2: true, temp: true, gas: true,
  });
  const [sensorData, setSensorData] = useState({
    pm25: 21.3, pm10: 38.7, temp: 14.2, nox: 120,
  });
  const [timeStr, setTimeStr] = useState('--:--');
  const statusInterval = useRef(null);

  const theme = THEMES[themeKey];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0')
      );
    };
    updateTime();
    statusInterval.current = setInterval(updateTime, 30000);
    return () => {
      if (statusInterval.current) clearInterval(statusInterval.current);
    };
  }, []);

  const handleSensorData = useCallback((data) => {
    setSensorData({
      pm25: data.pm25 || sensorData.pm25,
      pm10: data.pm10 || sensorData.pm10,
      temp: data.temp || sensorData.temp,
      nox: data.nox || sensorData.nox,
    });
    if (data.pm25) {
      const level = data.statusLevel || pm25ToStatusLvl(data.pm25);
      setStatusLvl(Math.min(level, 4));
    }
  }, []);

  const handleConnected = useCallback(() => {
    setConnected(true);
    BLE.setOnDataCallback(handleSensorData);
    BLE.setOnDisconnectCallback(() => setConnected(false));
  }, [handleSensorData]);

  const handleDisconnect = useCallback(async () => {
    await BLE.disconnectDevice();
    setConnected(false);
  }, []);

  if (!connected) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <ConnectScreen onConnected={handleConnected} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgA }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, position: 'relative' }}>
        {tab === 'home' && (
          <OverviewScreen
            theme={theme}
            statusLvl={statusLvl}
            proMode={proMode}
            enabledMetrics={enabledMetrics}
            sensorData={sensorData}
            onDisconnect={handleDisconnect}
            timeStr={timeStr}
          />
        )}
        {tab === 'trends' && (
          <TrendsScreen
            theme={theme}
            statusLvl={statusLvl}
            enabledMetrics={enabledMetrics}
            proMode={proMode}
            sensorData={sensorData}
          />
        )}
        {tab === 'profile' && (
          <ProfileScreen
            theme={theme}
            statusLvl={statusLvl}
            proMode={proMode}
            setProMode={setProMode}
            enabledMetrics={enabledMetrics}
            setEnabledMetrics={setEnabledMetrics}
            currentTheme={themeKey}
            setThemeKey={setThemeKey}
            onDisconnect={handleDisconnect}
          />
        )}
        <TabBar tab={tab} setTab={setTab} theme={theme} />
      </View>
    </SafeAreaView>
  );
};

AppRegistry.registerComponent('main', () => App);
