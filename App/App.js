import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, AppRegistry, StatusBar, SafeAreaView } from 'react-native';
import { THEMES, pm25ToStatusLvl } from './src/theme';
import TabBar from './src/components/TabBar';
import ConnectScreen from './src/screens/ConnectScreen';
import OverviewScreen from './src/screens/OverviewScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import * as BLE from './src/ble/BLEManager';

const GOLD_THRESHOLDS = {
  'GOLD 1': { pm25: [20, 35, 60], baseline: 0 },
  'GOLD 2': { pm25: [15, 25, 45], baseline: 1 },
  'GOLD 3': { pm25: [10, 18, 30], baseline: 1 },
  'GOLD 4': { pm25: [5, 10, 20], baseline: 2 },
};

function calcStatusLvl(sd, goldStage) {
  const cfg = GOLD_THRESHOLDS[goldStage] || GOLD_THRESHOLDS['GOLD 3'];
  if (!sd) return Math.min(4, cfg.baseline + 2);
  const pm25 = sd.pm25;
  if (pm25 == null) return Math.min(4, cfg.baseline + 2);
  if (pm25 < cfg.pm25[0]) return Math.max(1, cfg.baseline);
  if (pm25 < cfg.pm25[1]) return Math.max(1, cfg.baseline + 1);
  if (pm25 < cfg.pm25[2]) return Math.min(4, cfg.baseline + 2);
  return 4;
}

const App = () => {
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [tab, setTab] = useState('home');
  const [themeKey, setThemeKey] = useState('sky');
  const [proMode, setProMode] = useState(false);
  const [goldStage, setGoldStage] = useState('GOLD 3');
  const [statusLvl, setStatusLvl] = useState(3);
  const [enabledMetrics, setEnabledMetrics] = useState({
    pm25: true, no2: true, temp: true, gas: true,
  });
  const [sensorData, setSensorData] = useState(null);
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

  useEffect(() => {
    setStatusLvl(calcStatusLvl(sensorData, goldStage));
  }, [sensorData, goldStage]);

  const handleSensorData = useCallback((data) => {
    setSensorData({
      pm25: data.pm25 ?? sensorData?.pm25,
      pm10: data.pm10 ?? sensorData?.pm10,
      temp: data.temp ?? sensorData?.temp,
      nox: data.nox ?? sensorData?.nox,
    });
  }, []);

  const handleConnected = useCallback((demo) => {
    if (demo) {
      setDemoMode(true);
      setConnected(true);
      setSensorData(null);
      return;
    }
    setConnected(true);
    BLE.setOnDataCallback(handleSensorData);
    BLE.setOnDisconnectCallback(() => setConnected(false));
  }, [handleSensorData]);

  const handleDisconnect = useCallback(async () => {
    setDemoMode(false);
    setSensorData(null);
    if (BLE.isConnected()) await BLE.disconnectDevice();
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
            demoMode={demoMode}
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
            demoMode={demoMode}
            sensorData={sensorData}
          />
        )}
        {tab === 'profile' && (
          <ProfileScreen
            theme={theme}
            statusLvl={statusLvl}
            proMode={proMode}
            demoMode={demoMode}
            setProMode={setProMode}
            enabledMetrics={enabledMetrics}
            setEnabledMetrics={setEnabledMetrics}
            currentTheme={themeKey}
            setThemeKey={setThemeKey}
            goldStage={goldStage}
            setGoldStage={setGoldStage}
            onDisconnect={handleDisconnect}
          />
        )}
        <TabBar tab={tab} setTab={setTab} theme={theme} />
      </View>
    </SafeAreaView>
  );
};

AppRegistry.registerComponent('main', () => App);
