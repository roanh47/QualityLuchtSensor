import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import GlassCard from '../components/GlassCard';
import StatusHero from '../components/StatusHero';
import MetricCard from '../components/MetricCard';
import SymptomRow from '../components/SymptomRow';
import AmbientBg from '../components/AmbientBg';
import Icon from '../components/Icon';
import { STATUS_LEVELS, SYMPTOMS, getTempHint, PM10_THRESHOLDS, NOX_THRESHOLDS } from '../theme';

export default function OverviewScreen({ theme, statusLvl, proMode, demoMode, enabledMetrics, sensorData, onDisconnect, timeStr, goldStage, selectedSymptoms, setSelectedSymptoms, symptomIntensity, setSymptomIntensity, patientName }) {
  const status = STATUS_LEVELS.find(s => s.key === statusLvl) || STATUS_LEVELS[1];
  const statusColor = theme[status.colorKey];
  const [symptomOpen, setSymptomOpen] = useState(false);
  const [thresholdsOpen, setThresholdsOpen] = useState(false);
  const sd = sensorData || {};

  const GOLD_THRESHOLDS = {
    'GOLD 1': { green: 5, yellow: 10, orange: 20, red: 25 },
    'GOLD 2': { green: 4, yellow: 8, orange: 16, red: 20 },
    'GOLD 3': { green: 3, yellow: 6, orange: 12, red: 16 },
    'GOLD 4': { green: 2, yellow: 5, orange: 10, red: 14 },
  };
  const goldCfg = GOLD_THRESHOLDS[goldStage] || GOLD_THRESHOLDS['GOLD 3'];
  const pm10Cfg = PM10_THRESHOLDS[goldStage] || PM10_THRESHOLDS['GOLD 3'];
  const noxCfg = NOX_THRESHOLDS[goldStage] || NOX_THRESHOLDS['GOLD 3'];

  const metrics = {
    pm25: { v: sd.pm25 ?? '--', unit: 'µg/m³', norm: goldCfg.red, label: 'PM2.5', sub: 'Fijnstof — grenswaarde ' + goldCfg.red + ' µg/m³ (' + goldStage + ')' },
    pm10: { v: sd.pm10 ?? '--', unit: 'µg/m³', norm: pm10Cfg.red, label: 'PM10', sub: 'Grof stof — grenswaarde ' + pm10Cfg.red + ' µg/m³ (' + goldStage + ')' },
    temp: { v: sd.temp ?? '--', unit: '°C', norm: 30, label: 'Temperatuur', sub: 'Buitenlucht' },
    nox: { v: sd.nox ?? '--', unit: 'ticks', norm: noxCfg.red, label: 'NOx', sub: 'Stikstofoxiden — grenswaarde ' + noxCfg.red + ' ticks (' + goldStage + ')' },
  };
  const metricColors = { pm25: theme.s3, pm10: theme.s4, temp: theme.accent, nox: theme.s1 };

  const tempHint = sd.temp != null ? getTempHint(sd.temp) : '--';

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
            Hallo, {patientName || 'Patient'}
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
                    {sd.temp != null ? sd.temp.toFixed(1) : '--'}
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
                <View style={{ width: '48%', flexGrow: 1 }}>
                  <MetricCard {...metrics.pm25} color={metricColors.pm25} theme={theme} />
                </View>
              )}
              {enabledMetrics.pm10 && (
                <View style={{ width: '48%', flexGrow: 1 }}>
                  <MetricCard {...metrics.pm10} color={metricColors.pm10} theme={theme} />
                </View>
              )}
              {enabledMetrics.temp && (
                <View style={{ width: '48%', flexGrow: 1 }}>
                  <MetricCard {...metrics.temp} color={metricColors.temp} theme={theme} />
                </View>
              )}
              {enabledMetrics.nox && (
                <View style={{ width: '48%', flexGrow: 1 }}>
                  <MetricCard {...metrics.nox} color={metricColors.nox} theme={theme} />
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ marginTop: 12 }}>
          <SymptomRow theme={theme} onAdd={() => setSymptomOpen(true)} selectedSymptoms={selectedSymptoms} intensity={symptomIntensity} />
        </View>

        <GlassCard theme={theme} radius={22} style={{ marginTop: 16, marginBottom: 20, padding: 14 }}>
          <TouchableOpacity onPress={() => setThresholdsOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name="info" size={14} color={theme.inkSoft} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.inkSoft }}>
              Bekijk grenswaarden voor {goldStage}
            </Text>
          </TouchableOpacity>
        </GlassCard>
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
                  <TouchableOpacity key={i} onPress={() => setSymptomIntensity(i)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                      backgroundColor: symptomIntensity >= i ? theme[STATUS_LEVELS[i - 1].colorKey] : 'rgba(0,0,0,0.04)',
                    }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: symptomIntensity >= i ? '#fff' : theme.inkSoft }}>
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

      <Modal visible={thresholdsOpen} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setThresholdsOpen(false)}
        >
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            padding: 18, paddingBottom: 40,
          }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)', alignSelf: 'center', marginBottom: 18 }} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.ink, letterSpacing: -0.3, marginBottom: 4 }}>
              Grenswaarden
            </Text>
            <Text style={{ fontSize: 13, color: theme.inkSoft, marginBottom: 16, lineHeight: 18 }}>
              Drempelwaarden per COPD fase. Jouw huidige fase is {goldStage} (gemarkeerd).
            </Text>

            {/* Alle GOLD niveaus tonen */}
            {['GOLD 1', 'GOLD 2', 'GOLD 3', 'GOLD 4'].map((gStage) => {
              const cfg = GOLD_THRESHOLDS[gStage];
              const isCurrent = gStage === goldStage;
              return (
                <View key={gStage} style={{
                  marginBottom: 14,
                  borderWidth: isCurrent ? 1.5 : 0,
                  borderColor: isCurrent ? theme.accent : 'transparent',
                  borderRadius: 14,
                  padding: isCurrent ? 10 : 0,
                  backgroundColor: isCurrent ? `${theme.accent}08` : 'transparent',
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isCurrent ? theme.accent : theme.ink, marginBottom: 6 }}>
                    PM2.5 ({gStage}){isCurrent ? '  ← Jouw fase' : ''}
                  </Text>
                  {[
                    { level: 'Uitstekend', max: cfg.green, color: theme.s1 },
                    { level: 'Goed', max: cfg.yellow, color: theme.s2 },
                    { level: 'Voorzichtig', max: cfg.orange, color: theme.s3 },
                    { level: 'Gevaarlijk', max: cfg.red, color: theme.s4 },
                  ].map((r, i) => (
                    <View key={r.level} style={{
                      flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 8,
                      backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent',
                      borderRadius: 6,
                    }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color, marginRight: 8 }} />
                      <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: theme.ink }}>{r.level}</Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.inkSoft }}>≤ {r.max} µg/m³</Text>
                    </View>
                  ))}
                </View>
              );
            })}

            <View style={{ marginBottom: 14, marginTop: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.ink, marginBottom: 6 }}>NOx (Stikstofoxiden — zelfde voor alle fases)</Text>
              {[
                { level: 'Uitstekend', max: NOX_THRESHOLDS.green, color: theme.s1 },
                { level: 'Goed', max: NOX_THRESHOLDS.yellow, color: theme.s2 },
                { level: 'Voorzichtig', max: NOX_THRESHOLDS.orange, color: theme.s3 },
                { level: 'Gevaarlijk', max: NOX_THRESHOLDS.red, color: theme.s4 },
              ].map((r, i) => (
                <View key={r.level} style={{
                  flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 8,
                  backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent',
                  borderRadius: 6,
                }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color, marginRight: 8 }} />
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: theme.ink }}>{r.level}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.inkSoft }}>≤ {r.max} ticks</Text>
                </View>
              ))}
            </View>

            <Text style={{ fontSize: 11, color: theme.inkMuted, lineHeight: 16, marginBottom: 16 }}>
              De uiteindelijke status is het hoogste niveau van PM2.5 en NOx. Bij een PM2.5 van 14 µg/m³ en NOx van 20000 is de status bijvoorbeeld 'Voorzichtig'.
            </Text>

            <TouchableOpacity onPress={() => setThresholdsOpen(false)}
              style={{
                paddingVertical: 14, borderRadius: 16, backgroundColor: theme.accent, alignItems: 'center',
                shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16,
                elevation: 8,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Sluiten</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
