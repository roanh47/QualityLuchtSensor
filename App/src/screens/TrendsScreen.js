import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import GlassCard from '../components/GlassCard';
import AmbientBg from '../components/AmbientBg';
import Icon from '../components/Icon';
import LineChart from '../components/LineChart';
import { STATUS_LEVELS, PM10_THRESHOLDS, NOX_THRESHOLDS, calcOverallQuality } from '../theme';
import { loadHistory, shareCSV } from '../utils/HistoryManager';

const RANGE_POINTS = { day: 60, week: 42, month: 60 };

export default function TrendsScreen({ theme, statusLvl, enabledMetrics, proMode, demoMode, sensorData, goldStage }) {
  const status = STATUS_LEVELS.find(s => s.key === statusLvl) || STATUS_LEVELS[1];
  const statusColor = theme[status.colorKey];
  const [range, setRange] = useState('week');
  const [tick, setTick] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const historyRef = useRef(null);
  const lastPushRef = useRef(0);
  const sdRef = useRef(sensorData || {});

  // Keep sdRef in sync with latest sensorData
  sdRef.current = sensorData || {};

  // Laad opgeslagen geschiedenis bij openen Trends tab
  useEffect(() => {
    if (historyLoaded) return;
    (async () => {
      const days = range === 'day' ? 1 : range === 'week' ? 7 : 30;
      const saved = await loadHistory(days);
      if (saved.length > 0) {
        historyRef.current = saved;
      }
      setHistoryLoaded(true);
      setTick(t => t + 1);
    })();
  }, [range, historyLoaded]);

  // Seed history with initial points so chart is not empty
  useEffect(() => {
    if (!sensorData) return;
    if (historyRef.current === null) {
      historyRef.current = [];
    }
    if (historyLoaded && historyRef.current.length === 0) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      historyRef.current.push({
        pm25: sensorData.pm25 ?? 0,
        pm10: sensorData.pm10 ?? 0,
        temp: sensorData.temp ?? 0,
        nox: sensorData.nox ?? 0,
        label: h + ':' + m,
        ts: Date.now(),
      });
      setTick(t => t + 1);
    }
  }, [sensorData, historyLoaded]);

  // Collect a data point every 5 seconds for realtime updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (historyRef.current === null) return;
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = sdRef.current;
      historyRef.current.push({
        pm25: s.pm25 ?? 0,
        pm10: s.pm10 ?? 0,
        temp: s.temp ?? 0,
        nox: s.nox ?? 0,
        label: h + ':' + m,
        ts: now.getTime(),
      });
      const max = RANGE_POINTS[range] || 7;
      if (historyRef.current.length > max) {
        historyRef.current = historyRef.current.slice(-max);
      }
      setTick(t => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [range]);

  // Bereken overall kwaliteit op basis van ALLE 4 sensoren
  function calcCombined(v_pm25, v_pm10, v_temp, v_nox) {
    return calcOverallQuality(v_pm25, v_pm10, v_temp, v_nox, goldStage);
  }

  const hist = historyRef.current || [];
  const mainData = hist.map((p, i) => {
    const level = calcCombined(p.pm25, p.pm10, p.temp, p.nox);
    return {
      x: i,
      v: level,
      level: level,
      label: p.label,
    };
  });

  const currentValues = {
    pm25: sdRef.current.pm25 ?? 0,
    pm10: sdRef.current.pm10 ?? 0,
    temp: sdRef.current.temp ?? 0,
    nox: sdRef.current.nox ?? 0,
  };

  const cards = [
    enabledMetrics.pm25 && { k: 'pm25', label: 'PM2.5', sub: 'Fijnstof', unit: 'µg/m³', color: theme.s3, v: currentValues.pm25 },
    enabledMetrics.pm10  && { k: 'pm10',  label: 'PM10',   sub: 'Grof stof', unit: 'µg/m³', color: theme.s4, v: currentValues.pm10 },
    enabledMetrics.temp && { k: 'temp', label: 'Temperatuur', sub: 'Buitenlucht', unit: '°C', color: theme.accent, v: currentValues.temp },
    enabledMetrics.nox  && { k: 'nox',  label: 'NOx', sub: 'Stikstofoxiden',    unit: 'ticks',  color: theme.s1, v: currentValues.nox },
  ].filter(Boolean);

  const rangeOpts = [
    { value: 'day', label: 'Dag' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Maand' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <AmbientBg theme={theme} statusColor={statusColor} />
      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 16, paddingBottom: 110 }}
      >
        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: theme.ink, letterSpacing: -0.6 }}>Trends</Text>
          <Text style={{ fontSize: 13, color: theme.inkSoft, marginTop: 3 }}>
            {proMode ? 'Bekijk elke sensor apart' : 'Hoe ging deze week in het algemeen'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
            {rangeOpts.map(opt => (
              <TouchableOpacity key={opt.value} onPress={() => setRange(opt.value)}
                style={{
                  paddingVertical: 7, paddingHorizontal: 14, borderRadius: 8,
                  backgroundColor: range === opt.value ? '#fff' : 'rgba(120,120,128,0.14)',
                  shadowColor: range === opt.value ? '#000' : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 3,
                  elevation: range === opt.value ? 2 : 0,
                }}>
                <Text style={{
                  fontSize: 13, fontWeight: '600',
                  color: range === opt.value ? theme.ink : theme.inkSoft,
                }}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => shareCSV(hist)}
            style={{
              paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8,
              backgroundColor: theme.accent + '18',
            }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.accent }}>CSV</Text>
          </TouchableOpacity>
        </View>

        <GlassCard theme={theme} radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: `${statusColor}22`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={status.icon} size={20} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: theme.inkSoft, fontWeight: '500' }}>Actuele luchtkwaliteit</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: statusColor, letterSpacing: -0.3 }}>
                {status.title}
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard theme={theme} radius={22} style={{ padding: 16, marginBottom: proMode ? 10 : 0 }}>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.ink, letterSpacing: -0.3 }}>
              Was het goed om buiten te zijn?
            </Text>
            <Text style={{ fontSize: 12, color: theme.inkSoft, marginTop: 3 }}>
              Gemiddelde van alle sensoren — lager = beter
            </Text>
          </View>
          <LineChart data={mainData} color={statusColor} height={140} theme={theme} />
        </GlassCard>

        {proMode && (
          <>
            <Text style={{
              fontSize: 11, fontWeight: '700', color: theme.inkSoft,
              letterSpacing: 0.4, textTransform: 'uppercase',
              paddingHorizontal: 4, marginTop: 10, marginBottom: 10,
            }}>
              Per sensor
            </Text>
            {cards.map(c => (
              <GlassCard key={c.k} theme={theme} radius={22} style={{ padding: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: theme.inkSoft, letterSpacing: 0.2 }}>
                      {c.label}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                      <Text style={{ fontSize: 24, fontWeight: '700', color: theme.ink, letterSpacing: -0.5 }}>
                        {typeof c.v === 'number' ? c.v.toFixed(1) : c.v}
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.inkSoft, fontWeight: '500' }}>{c.unit}</Text>
                    </View>
                  </View>
                </View>
                <LineChart data={hist.map((p, i) => {
                  let val = 0;
                  if (c.k === 'pm25') val = p.pm25 || 0;
                  else if (c.k === 'pm10') val = p.pm10 || 0;
                  else if (c.k === 'temp') val = p.temp || 0;
                  else if (c.k === 'nox') val = p.nox || 0;
                  return { x: i, v: val, label: p.label };
                })} color={c.color} height={110} theme={theme} />
              </GlassCard>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
