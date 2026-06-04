import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import GlassCard from '../components/GlassCard';
import StatusHero from '../components/StatusHero';
import MetricCard from '../components/MetricCard';
import SymptomRow from '../components/SymptomRow';
import AmbientBg from '../components/AmbientBg';
import Icon from '../components/Icon';
import { STATUS_LEVELS, SYMPTOMS, getTempHint, PM25_THRESHOLDS, PM10_THRESHOLDS, NOX_THRESHOLDS, TEMP_THRESHOLDS, ALL_THRESHOLDS, calcSensorLevel } from '../theme';

export default function OverviewScreen({ theme, statusLvl, proMode, demoMode, enabledMetrics, sensorData, onDisconnect, timeStr, goldStage, selectedSymptoms, setSelectedSymptoms, symptomIntensity, setSymptomIntensity, patientName }) {
  const status = STATUS_LEVELS.find(s => s.key === statusLvl) || STATUS_LEVELS[1];
  const statusColor = theme[status.colorKey];
  const [symptomOpen, setSymptomOpen] = useState(false);
  const [thresholdsOpen, setThresholdsOpen] = useState(false);
  const [compareGold, setCompareGold] = useState(null); // null = eigen niveau
  const sd = sensorData || {};

  const goldCfg = PM25_THRESHOLDS[goldStage] || PM25_THRESHOLDS['GOLD 3'];
  const pm10Cfg = PM10_THRESHOLDS[goldStage] || PM10_THRESHOLDS['GOLD 3'];
  const noxCfg = NOX_THRESHOLDS[goldStage] || NOX_THRESHOLDS['GOLD 3'];

  const metrics = {
    pm25: { v: sd.pm25 ?? '--', unit: 'µg/m³', norm: goldCfg.red, label: 'PM2.5', sub: 'Fijnstof — grenswaarde ' + goldCfg.red + ' µg/m³ (' + goldStage + ')' },
    pm10: { v: sd.pm10 ?? '--', unit: 'µg/m³', norm: pm10Cfg.red, label: 'PM10', sub: 'Grof stof — grenswaarde ' + pm10Cfg.red + ' µg/m³ (' + goldStage + ')' },
    temp: { v: sd.temp ?? '--', unit: '°C', norm: TEMP_THRESHOLDS[goldStage]?.hot?.red ?? 34, label: 'Temperatuur', sub: 'Buitenlucht' },
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
          onPress={() => { setThresholdsOpen(false); setCompareGold(null); }}
        >
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            padding: 18, paddingBottom: 40,
            maxHeight: '85%',
          }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)', alignSelf: 'center', marginBottom: 18 }} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.ink, letterSpacing: -0.3, marginBottom: 4 }}>
              Grenswaarden
            </Text>
            <Text style={{ fontSize: 13, color: theme.inkSoft, marginBottom: 12, lineHeight: 18 }}>
              Drempelwaarden per COPD fase. Jouw fase is {goldStage}.
            </Text>

            {/* Dropdown om ander GOLD niveau te vergelijken */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.inkSoft }}>Vergelijk met:</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity
                  onPress={() => setCompareGold(null)}
                  style={{
                    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10,
                    backgroundColor: compareGold === null ? theme.accent : 'rgba(0,0,0,0.06)',
                  }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: compareGold === null ? '#fff' : theme.inkSoft }}>
                    {goldStage} (jouw fase)
                  </Text>
                </TouchableOpacity>
                {['GOLD 1', 'GOLD 2', 'GOLD 3', 'GOLD 4'].filter(g => g !== goldStage).map(g => (
                  <TouchableOpacity key={g} onPress={() => setCompareGold(g)}
                    style={{
                      paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10,
                      backgroundColor: compareGold === g ? theme.accent : 'rgba(0,0,0,0.06)',
                    }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: compareGold === g ? '#fff' : theme.inkSoft }}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {/* Welk niveau wordt getoond */}
              {(() => {
                const viewGold = compareGold || goldCfg;
                const viewStage = compareGold || goldStage;
                const isComparing = compareGold !== null;
                return (
                  <>
                    {isComparing && (
                      <View style={{ backgroundColor: `${theme.accent}12`, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: theme.accent }}>
                          Je bekijkt nu {compareGold} — jouw eigen {goldStage} waarden worden niet aangepast.
                        </Text>
                      </View>
                    )}

                    {/* Per sensor tonen */}
                    {[
                      { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', thresholds: PM25_THRESHOLDS[viewStage] },
                      { key: 'pm10', label: 'PM10', unit: 'µg/m³', thresholds: PM10_THRESHOLDS[viewStage] },
                      { key: 'nox', label: 'NOx', unit: 'ticks', thresholds: NOX_THRESHOLDS[viewStage] },
                    ].map(sensor => (
                      <View key={sensor.key} style={{ marginBottom: 14 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.ink, marginBottom: 6 }}>
                          {sensor.label} ({viewStage})
                        </Text>
                        {[
                          { level: 'Uitstekend', max: sensor.thresholds.green, color: theme.s1 },
                          { level: 'Goed', max: sensor.thresholds.yellow, color: theme.s2 },
                          { level: 'Voorzichtig', max: sensor.thresholds.orange, color: theme.s3 },
                          { level: 'Gevaarlijk', max: sensor.thresholds.red, color: theme.s4 },
                        ].map((r, i) => (
                          <View key={r.level} style={{
                            flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 8,
                            backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent',
                            borderRadius: 6,
                          }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color, marginRight: 8 }} />
                            <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: theme.ink }}>{r.level}</Text>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.inkSoft }}>≤ {r.max} {sensor.unit}</Text>
                          </View>
                        ))}
                      </View>
                    ))}

                    {/* Temperatuur */}
                    <View key="temp" style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: theme.ink, marginBottom: 6 }}>
                        Temperatuur ({viewStage})
                      </Text>
                      <Text style={{ fontSize: 11, color: theme.inkMuted, marginBottom: 4 }}>
                        Kou en warmte zijn beide gevaarlijk voor COPD-patiënten.
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.inkSoft, marginBottom: 4 }}>Kou:</Text>
                      {[
                        { level: 'Uitstekend', range: `≥ ${TEMP_THRESHOLDS[viewStage].cold.green}°C`, color: theme.s1 },
                        { level: 'Goed', range: `${TEMP_THRESHOLDS[viewStage].cold.yellow}–${TEMP_THRESHOLDS[viewStage].cold.green}°C`, color: theme.s2 },
                        { level: 'Voorzichtig', range: `${TEMP_THRESHOLDS[viewStage].cold.orange}–${TEMP_THRESHOLDS[viewStage].cold.yellow}°C`, color: theme.s3 },
                        { level: 'Gevaarlijk', range: `< ${TEMP_THRESHOLDS[viewStage].cold.orange}°C`, color: theme.s4 },
                      ].map((r, i) => (
                        <View key={r.level} style={{
                          flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 8,
                          backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent',
                          borderRadius: 6,
                        }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color, marginRight: 8 }} />
                          <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: theme.ink }}>{r.level}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.inkSoft }}>{r.range}</Text>
                        </View>
                      ))}
                      <Text style={{ fontSize: 12, fontWeight: '600', color: theme.inkSoft, marginTop: 6, marginBottom: 4 }}>Warmte:</Text>
                      {[
                        { level: 'Uitstekend', range: `≤ ${TEMP_THRESHOLDS[viewStage].hot.green}°C`, color: theme.s1 },
                        { level: 'Goed', range: `${TEMP_THRESHOLDS[viewStage].hot.green}–${TEMP_THRESHOLDS[viewStage].hot.yellow}°C`, color: theme.s2 },
                        { level: 'Voorzichtig', range: `${TEMP_THRESHOLDS[viewStage].hot.yellow}–${TEMP_THRESHOLDS[viewStage].hot.orange}°C`, color: theme.s3 },
                        { level: 'Gevaarlijk', range: `> ${TEMP_THRESHOLDS[viewStage].hot.orange}°C`, color: theme.s4 },
                      ].map((r, i) => (
                        <View key={r.level} style={{
                          flexDirection: 'row', alignItems: 'center', paddingVertical: 5, paddingHorizontal: 8,
                          backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent',
                          borderRadius: 6,
                        }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: r.color, marginRight: 8 }} />
                          <Text style={{ flex: 1, fontSize: 12, fontWeight: '500', color: theme.ink }}>{r.level}</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.inkSoft }}>{r.range}</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={{ fontSize: 11, color: theme.inkMuted, lineHeight: 16, marginBottom: 16 }}>
                      De overall status wordt bepaald door de slechtste van alle 4 sensoren. Als 1 sensor "gevaarlijk" aangeeft, is de totaalstatus "gevaarlijk".
                    </Text>
                  </>
                );
              })()}
            </ScrollView>

            <TouchableOpacity onPress={() => { setThresholdsOpen(false); setCompareGold(null); }}
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
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
