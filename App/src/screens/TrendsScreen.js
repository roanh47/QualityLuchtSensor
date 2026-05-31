import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import GlassCard from '../components/GlassCard';
import AmbientBg from '../components/AmbientBg';
import Icon from '../components/Icon';
import LineChart from '../components/LineChart';
import { STATUS_LEVELS, generateTrendData } from '../theme';

const RANGE_POINTS = { day: 24, week: 7, month: 30 };

export default function TrendsScreen({ theme, statusLvl, enabledMetrics, proMode, demoMode, sensorData }) {
  const status = STATUS_LEVELS[statusLvl - 1] || STATUS_LEVELS[0];
  const statusColor = theme[status.colorKey];
  const [range, setRange] = useState('week');
  const [tick, setTick] = useState(0);
  const historyRef = useRef([]);
  const sd = sensorData || {};

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      historyRef.current.push({
        pm25: sd.pm25 ?? 0,
        pm10: sd.pm10 ?? 0,
        temp: sd.temp ?? 0,
        nox: sd.nox ?? 0,
        label: h + ':' + m,
      });
      const max = RANGE_POINTS[range] || 7;
      if (historyRef.current.length > max) {
        historyRef.current = historyRef.current.slice(-max);
      }
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [range, sd.pm25, sd.pm10, sd.temp, sd.nox]);

  const hist = historyRef.current;
  const mainData = hist.map((p, i) => ({
    x: i,
    v: +((p.pm25 + p.pm10 * 0.5 + p.temp * 0.5 + p.nox / 500) / 4).toFixed(1),
    label: p.label,
  }));

  const currentValues = {
    pm25: sd.pm25 ?? 0,
    no2: sd.pm10 != null ? sd.pm10 * 0.5 : 0,
    temp: sd.temp ?? 0,
    gas: sd.nox ?? 0,
  };

  const cards = [
    enabledMetrics.pm25 && { k: 'pm25', label: 'PM2.5', sub: 'Fijnstof', unit: 'µg/m³', color: theme.s3, v: currentValues.pm25 },
    enabledMetrics.no2  && { k: 'no2',  label: 'NO₂',   sub: 'Stikstofdioxide', unit: 'µg/m³', color: theme.s4, v: currentValues.no2 },
    enabledMetrics.temp && { k: 'temp', label: 'Temperatuur', sub: 'Buitenlucht', unit: '°C', color: theme.accent, v: currentValues.temp },
    enabledMetrics.gas  && { k: 'gas',  label: 'NOx', sub: 'Stikstofoxiden',    unit: 'ticks',  color: theme.s1, v: currentValues.gas },
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

        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
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
          <LineChart data={mainData} color={statusColor} width={300} height={140} theme={theme} />
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
                  else if (c.k === 'no2') val = (p.pm10 || 0) * 0.5;
                  else if (c.k === 'temp') val = p.temp || 0;
                  else if (c.k === 'gas') val = p.nox || 0;
                  return { x: i, v: val, label: p.label };
                })} color={c.color} width={300} height={110} theme={theme} />
              </GlassCard>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
