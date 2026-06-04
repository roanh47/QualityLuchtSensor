import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, AppRegistry, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, pm25ToStatusLvl, NOX_THRESHOLDS, calcOverallQuality } from './src/theme';
import TabBar from './src/components/TabBar';
import ConnectScreen from './src/screens/ConnectScreen';
import OverviewScreen from './src/screens/OverviewScreen';
import TrendsScreen from './src/screens/TrendsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import * as BLE from './src/ble/BLEManager';
import { saveDataPoint, loadHistory, cleanupOldHistory } from './src/utils/HistoryManager';

// Bereken overall status op basis van ALLE 4 sensoren (max niveau)
// 0=wachten, 1=uitstekend, 2=goed, 3=voorzichtig, 4=gevaarlijk
function calcCombinedStatus(sd, goldStage) {
  if (!sd || (sd.pm25 == null && sd.pm10 == null && sd.temp == null && sd.nox == null)) return 0;
  const lvl = calcOverallQuality(sd.pm25, sd.pm10, sd.temp, sd.nox, goldStage);
  return lvl;
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

  // Sla sensordata op elke 30 seconden op in AsyncStorage
  useEffect(() => {
    if (!sensorData || !connected) return;
    const saveInterval = setInterval(() => {
      saveDataPoint(sensorData);
    }, 30 * 1000); // elke 30 seconden

    // Sla ook meteen op als eerste punt
    saveDataPoint(sensorData);

    return () => clearInterval(saveInterval);
  }, [connected, sensorData]);

  // Laad opgeslagen profiel bij startup + ruim oude geschiedenis op
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
      cleanupOldHistory(); // ruim data ouder dan 30 dagen op
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
