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
import { saveDataPoint, loadHistory, cleanupOldHistory, shareCSV, pointsToCSV } from './src/utils/HistoryManager';

// Bereken overall status op basis van ALLE 4 sensoren (max niveau)
// 0=wachten, 1=uitstekend, 2=goed, 3=voorzichtig, 4=gevaarlijk
function calcCombinedStatus(sd, goldStage) {
  if (!sd || (sd.pm25 == null && sd.pm10 == null && sd.temp == null && sd.nox == null)) return 0;
  const lvl = calcOverallQuality(sd.pm25, sd.pm10, sd.temp, sd.nox, goldStage);
  return lvl;
}

const STORAGE_KEY = '@profile';

const VALIDATION_RANGES = {
  pm25: { min: 0, max: 200 },
  pm10: { min: 0, max: 400 },
  temp: { min: -10, max: 50 },
  nox:  { min: 0, max: 200000 },
};

function validateReading(data) {
  const issues = [];
  if (data.pm25 != null && (data.pm25 < VALIDATION_RANGES.pm25.min || data.pm25 > VALIDATION_RANGES.pm25.max))
    issues.push(`PM2.5 (${data.pm25.toFixed(1)}) buiten bereik — normaal 0-200 µg/m³`);
  if (data.pm10 != null && (data.pm10 < VALIDATION_RANGES.pm10.min || data.pm10 > VALIDATION_RANGES.pm10.max))
    issues.push(`PM10 (${data.pm10.toFixed(1)}) buiten bereik — normaal 0-400 µg/m³`);
  if (data.temp != null && (data.temp < VALIDATION_RANGES.temp.min || data.temp > VALIDATION_RANGES.temp.max))
    issues.push(`Temperatuur (${data.temp.toFixed(1)}) buiten bereik — normaal -10 tot 50 °C`);
  if (data.nox != null && (data.nox < VALIDATION_RANGES.nox.min || data.nox > VALIDATION_RANGES.nox.max))
    issues.push(`NOx (${data.nox.toFixed(0)}) buiten bereik — normaal 0-200.000 ticks`);
  return issues;
}

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
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [validationIssues, setValidationIssues] = useState([]);
  const [writeInterval, setWriteInterval] = useState(10);
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
    if (validationEnabled) {
      const issues = validateReading(data);
      setValidationIssues(issues);
      if (issues.length > 0) {
        console.warn('Sensor validatie:', issues.join('; '));
      }
    } else {
      setValidationIssues([]);
    }
    setSensorData(prev => {
      const valid = (v) => v != null && !isNaN(v);
      return {
        pm25: valid(data.pm25) ? data.pm25 : (valid(prev?.pm25) ? prev.pm25 : null),
        pm10: valid(data.pm10) ? data.pm10 : (valid(prev?.pm10) ? prev.pm10 : null),
        temp: valid(data.temp) ? data.temp : (valid(prev?.temp) ? prev.temp : null),
        nox: valid(data.nox)  ? data.nox  : (valid(prev?.nox)  ? prev.nox  : null),
      };
    });
  }, [validationEnabled]);

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

  // Demo mode: genereer historische en realtime data
  useEffect(() => {
    if (!demoMode) return;
    // Genereer 48 uur aan demo data (elke 30 min een punt = 96 punten)
    const now = Date.now();
    for (let i = 95; i >= 0; i--) {
      const ts = now - i * 1800000;
      const key = '@history_' + new Date(ts).toISOString().slice(0, 10);
      try {
        AsyncStorage.getItem(key).then(existing => {
          const pts = existing ? JSON.parse(existing) : [];
          pts.push({
            pm25: Math.max(0.1, Math.random() * 8),
            pm10: Math.max(0.5, Math.random() * 15),
            temp: Math.max(-5, 15 + (Math.random() - 0.5) * 6),
            nox: Math.max(5000, 10000 + (Math.random() - 0.48) * 4000),
            label: new Date(ts).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
            ts,
          });
          AsyncStorage.setItem(key, JSON.stringify(pts));
        });
      } catch (_) {}
    }
    const base = { pm25: 4.2, pm10: 8.5, temp: 18.3, nox: 12000 };
    setSensorData({ ...base });
    const interval = setInterval(() => {
      const next = {
        pm25: Math.max(0.1, Math.random() * 8),
        pm10: Math.max(0.5, Math.random() * 15),
        temp: Math.max(-5, 15 + (Math.random() - 0.5) * 6),
        nox: Math.max(5000, 10000 + (Math.random() - 0.48) * 4000),
      };
      setSensorData(next);
      saveDataPoint(next);
    }, 10000);
    return () => clearInterval(interval);
  }, [demoMode]);

  // Sla sensordata op elke N seconden op in AsyncStorage
  useEffect(() => {
    if (!sensorData || !connected) return;
    const ms = Math.max(1000, (writeInterval || 10) * 1000);
    const saveInterval = setInterval(() => {
      saveDataPoint(sensorData);
    }, ms);

    saveDataPoint(sensorData);

    return () => clearInterval(saveInterval);
  }, [connected, sensorData, writeInterval]);

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
          if (p.validationEnabled != null) setValidationEnabled(p.validationEnabled);
          if (p.writeInterval) setWriteInterval(p.writeInterval);
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
      validationEnabled, writeInterval,
    })).catch(() => {});
  }, [themeKey, proMode, goldStage, enabledMetrics, patientName, patientAge, profileLoaded, validationEnabled, writeInterval]);

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
            validationIssues={validationIssues}
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
            validationEnabled={validationEnabled}
            setValidationEnabled={setValidationEnabled}
            writeInterval={writeInterval}
            setWriteInterval={setWriteInterval}
          />
        )}
        <TabBar tab={tab} setTab={setTab} theme={theme} />
      </View>
    </SafeAreaView>
  );
};

AppRegistry.registerComponent('main', () => App);
