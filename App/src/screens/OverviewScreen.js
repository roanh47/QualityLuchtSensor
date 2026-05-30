import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import GlassCard from '../components/GlassCard';
import StatusHero from '../components/StatusHero';
import MetricCard from '../components/MetricCard';
import SymptomRow from '../components/SymptomRow';
import AmbientBg from '../components/AmbientBg';
import Icon from '../components/Icon';
import { STATUS_LEVELS, SYMPTOMS, getTempHint } from '../theme';

export default function OverviewScreen({ theme, statusLvl, proMode, enabledMetrics, sensorData, onDisconnect, timeStr }) {
  const status = STATUS_LEVELS[statusLvl - 1] || STATUS_LEVELS[0];
  const statusColor = theme[status.colorKey];
  const [symptomOpen, setSymptomOpen] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [intensity, setIntensity] = useState(2);

  const metrics = {
    pm25: { v: sensorData.pm25, unit: 'µg/m³', norm: 25, label: 'PM2.5', sub: 'Fijnstof' },
    no2: { v: sensorData.pm10 * 0.5, unit: 'µg/m³', norm: 25, label: 'NO₂', sub: 'Stikstofdioxide' },
    temp: { v: sensorData.temp, unit: '°C', norm: 30, label: 'Temperatuur', sub: 'Buitenlucht' },
    gas: { v: sensorData.nox, unit: 'ticks', norm: 45000, label: 'NOx', sub: 'Stikstofoxiden' },
  };
  const metricColors = { pm25: theme.s3, no2: theme.s4, temp: theme.accent, gas: theme.s1 };

  const tempHint = getTempHint(sensorData.temp);

  const now = new Date();
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const dateStr = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;

  const toggleSymptom = (id) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <AmbientBg theme={theme} statusColor={statusColor} />
      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={{ paddingTop: 60, paddingHorizontal: 16, paddingBottom: 110 }}
      >
        <View style={{ paddingVertical: 4 }}>
          <Text style={{ fontSize: 12, color: theme.inkSoft, fontWeight: '500' }}>{dateStr}</Text>
          <Text style={{ fontSize: 22, fontWeight: '700', color: theme.ink, letterSpacing: -0.4, marginTop: 1 }}>
            Hallo, Patient
          </Text>
        </View>

        <StatusHero statusLvl={statusLvl} theme={theme} proMode={proMode} timeStr={timeStr} />

        {!proMode ? (
          <GlassCard theme={theme} radius={22} style={{ padding: 16, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{
                width: 56, height: 56, borderRadius: 16,
                backgroundColor: `${theme.accent}18`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="thermo" size={28} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: theme.inkSoft, fontWeight: '500' }}>Buitentemperatuur</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                  <Text style={{ fontSize: 28, fontWeight: '700', color: theme.ink, letterSpacing: -0.5 }}>
                    {sensorData.temp.toFixed(1)}
                  </Text>
                  <Text style={{ fontSize: 14, color: theme.inkSoft, fontWeight: '500' }}>°C</Text>
                </View>
                <Text style={{ fontSize: 12, color: theme.inkSoft, marginTop: 2, lineHeight: 16 }}>
                  {tempHint}
                </Text>
              </View>
            </View>
          </GlassCard>
        ) : (
          <>
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingVertical: 8, paddingHorizontal: 4,
            }}>
              <Text style={{
                fontSize: 13, fontWeight: '600', color: theme.inkSoft,
                letterSpacing: 0.3, textTransform: 'uppercase',
              }}>
                Live metingen
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name="refresh" size={11} color={theme.inkMuted} />
                <Text style={{ fontSize: 11, color: theme.inkMuted }}>{timeStr}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {enabledMetrics.pm25 && (
                <View style={{ width: '47%' }}>
                  <MetricCard {...metrics.pm25} color={metricColors.pm25} theme={theme} />
                </View>
              )}
              {enabledMetrics.no2 && (
                <View style={{ width: '47%' }}>
                  <MetricCard {...metrics.no2} color={metricColors.no2} theme={theme} />
                </View>
              )}
              {enabledMetrics.temp && (
                <View style={{ width: '47%' }}>
                  <MetricCard {...metrics.temp} color={metricColors.temp} theme={theme} />
                </View>
              )}
              {enabledMetrics.gas && (
                <View style={{ width: '47%' }}>
                  <MetricCard {...metrics.gas} color={metricColors.gas} theme={theme} />
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ marginTop: 12 }}>
          <SymptomRow theme={theme} statusLvl={statusLvl} onAdd={() => setSymptomOpen(true)} />
        </View>

        <TouchableOpacity
          onPress={onDisconnect}
          style={{
            marginTop: 16, marginBottom: 20, padding: 12, borderRadius: 14,
            backgroundColor: 'rgba(201,74,58,0.12)', alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: theme.s4 }}>
            Ontkoppel apparaat
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={symptomOpen} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setSymptomOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            padding: 18, paddingBottom: 40,
          }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)', alignSelf: 'center', marginBottom: 18 }} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.ink, letterSpacing: -0.3 }}>
              Symptomen loggen
            </Text>
            <Text style={{ fontSize: 13, color: theme.inkSoft, marginTop: 4, marginBottom: 16 }}>
              Hoe voel je je nu?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {SYMPTOMS.map(s => {
                const on = selectedSymptoms.includes(s.id);
                return (
                  <TouchableOpacity key={s.id} onPress={() => toggleSymptom(s.id)}
                    style={{
                      paddingVertical: 9, paddingHorizontal: 14, borderRadius: 18,
                      backgroundColor: on ? theme.accent : 'rgba(255,255,255,0.6)',
                      borderWidth: 0.5, borderColor: on ? theme.accent : 'rgba(0,0,0,0.08)',
                    }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: on ? '#fff' : theme.ink }}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.ink, marginBottom: 8 }}>Intensiteit</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 3, 4].map(i => (
                  <TouchableOpacity key={i} onPress={() => setIntensity(i)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: intensity >= i ? theme[STATUS_LEVELS[i - 1].colorKey] : 'rgba(0,0,0,0.04)',
                    }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: intensity >= i ? '#fff' : theme.inkSoft }}>
                      {['Licht', 'Matig', 'Hoog', 'Zwaar'][i - 1]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity onPress={() => setSymptomOpen(false)}
              style={{
                paddingVertical: 14, borderRadius: 16, backgroundColor: theme.accent, alignItems: 'center',
                shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16,
                elevation: 8,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Opslaan</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
