import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, AppRegistry, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, pm25ToStatusLvl } from './src/theme';
import TabBar from './src/components/TabBar';
import ConnectScreen from './src/screens/ConnectScreen';
import OverviewScreen from './src/screens/OverviewScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import * as BLE from './src/ble/BLEManager';

const GOLD_THRESHOLDS = {
  'GOLD 1': { green: 5, yellow: 10, orange: 20, red: 25 },
  'GOLD 2': { green: 4, yellow: 8, orange: 16, red: 20 },
  'GOLD 3': { green: 3, yellow: 6, orange: 12, red: 16 },
  'GOLD 4': { green: 2, yellow: 5, orange: 10, red: 14 },
};

const NOX_THRESHOLDS = { green: 18000, yellow: 25000, orange: 35000, red: 45000 };

function calcNoxLevel(nox) {
  if (nox >= NOX_THRESHOLDS.red) return 5;
  if (nox >= NOX_THRESHOLDS.orange) return 4;
  if (nox >= NOX_THRESHOLDS.yellow) return 3;
  if (nox >= NOX_THRESHOLDS.green) return 2;
  return 1;
}

function calcStatusLevel(pm25, goldStage) {
  const t = GOLD_THRESHOLDS[goldStage] || GOLD_THRESHOLDS['GOLD 3'];
  if (pm25 >= t.red) return 5;
  if (pm25 >= t.orange) return 4;
  if (pm25 >= t.yellow) return 3;
  if (pm25 >= t.green) return 2;
  return 1;
}

function calcCombinedStatus(sd, goldStage) {
  if (!sd || (sd.pm25 == null && sd.nox == null && sd.pm10 == null)) return 0; // geen data
  const pmLevel = calcStatusLevel(sd.pm25 ?? 0, goldStage);
  const noxLevel = calcNoxLevel(sd.nox ?? 0);
  return Math.max(pmLevel, noxLevel);
}

const STORAGE_KEY = '@profile';

const App = () => {
  const [connected, setConnected] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [tab, setTab] = useState('home');
  const [themeKey, setThemeKey] = useState('sky');
  const [proMode, setProMode] = useState(false);
  const [goldStage, setGoldStage] = useState('GOLD 3');
  const [statusLvl, setStatusLvl] = useState(0);
  const [enabledMetrics, setEnabledMetrics] = useState({
    pm25: true, pm10: true, temp: true, nox: true,
  });
  const [patientName, setPatientName] = useState('Patient');
  const [patientAge, setPatientAge] = useState('68');
  const [sensorData, setSensorData] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomIntensity, setSymptomIntensity] = useState(2);
  const [timeStr, setTimeStr] = useState('--:--');
  const statusInterval = useRef(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

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
    setStatusLvl(calcCombinedStatus(sensorData, goldStage));
  }, [sensorData, goldStage]);

  const handleSensorData = useCallback((data) => {
    setSensorData(prev => {
      const valid = (v) => v != null && !isNaN(v);
      return {
        pm25: valid(data.pm25) ? data.pm25 : (valid(prev?.pm25) ? prev.pm25 : null),
        pm10: valid(data.pm10) ? data.pm10 : (valid(prev?.pm10) ? prev.pm10 : null),
        temp: valid(data.temp) ? data.temp : (valid(prev?.temp) ? prev.temp : null),
        nox: valid(data.nox)  ? data.nox  : (valid(prev?.nox)  ? prev.nox  : null),
      };
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

  // Demo mode: genereer realistische sensorwaarden
  useEffect(() => {
    if (!demoMode) return;
    // Start meteen met demo data
    const base = { pm25: 4.2, pm10: 8.5, temp: 18.3, nox: 12000 };
    setSensorData({ ...base });
    const interval = setInterval(() => {
      setSensorData(prev => ({
        pm25: Math.max(0.1, (prev?.pm25 ?? base.pm25) + (Math.random() - 0.48) * 0.8),
        pm10: Math.max(0.5, (prev?.pm10 ?? base.pm10) + (Math.random() - 0.48) * 1.2),
        temp: Math.max(-10, (prev?.temp ?? base.temp) + (Math.random() - 0.5) * 0.3),
        nox: Math.max(5000, (prev?.nox ?? base.nox) + (Math.random() - 0.48) * 800),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [demoMode]);

  // Laad opgeslagen profiel bij startup
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (p.themeKey) setThemeKey(p.themeKey);
          if (p.proMode != null) setProMode(p.proMode);
          if (p.goldStage) setGoldStage(p.goldStage);
          if (p.enabledMetrics) setEnabledMetrics(p.enabledMetrics);
          if (p.patientName) setPatientName(p.patientName);
          if (p.patientAge) setPatientAge(p.patientAge);
        }
      } catch (_) {}
      setProfileLoaded(true);
    })();
  }, []);

  // Sla profiel op bij wijzigingen
  useEffect(() => {
    if (!profileLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      themeKey, proMode, goldStage, enabledMetrics, patientName, patientAge,
    })).catch(() => {});
  }, [themeKey, proMode, goldStage, enabledMetrics, patientName, patientAge, profileLoaded]);

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
            goldStage={goldStage}
            selectedSymptoms={selectedSymptoms}
            setSelectedSymptoms={setSelectedSymptoms}
            symptomIntensity={symptomIntensity}
            setSymptomIntensity={setSymptomIntensity}
            patientName={patientName}
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
            goldStage={goldStage}
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
            patientName={patientName}
            setPatientName={setPatientName}
            patientAge={patientAge}
            setPatientAge={setPatientAge}
          />
        )}
        <TabBar tab={tab} setTab={setTab} theme={theme} />
      </View>
    </SafeAreaView>
  );
};

AppRegistry.registerComponent('main', () => App);
