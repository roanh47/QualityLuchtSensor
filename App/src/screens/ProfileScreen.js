import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import GlassCard from '../components/GlassCard';
import Toggle from '../components/Toggle';
import AmbientBg from '../components/AmbientBg';
import Icon from '../components/Icon';
import { STATUS_LEVELS, SYMPTOMS, THEMES } from '../theme';

export default function ProfileScreen({
  theme, statusLvl, proMode, demoMode, setProMode,
  enabledMetrics, setEnabledMetrics,
  currentTheme, setThemeKey,
  goldStage, setGoldStage,
  onDisconnect,
  patientName, setPatientName, patientAge, setPatientAge,
}) {
  const status = STATUS_LEVELS.find(s => s.key === statusLvl) || STATUS_LEVELS[1];
  const statusColor = theme[status.colorKey];
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [showGoldPicker, setShowGoldPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingName]);

  const name = patientName;
  const setName = setPatientName;
  const age = patientAge;
  const setAge = setPatientAge;

  const initials = (name.trim() || 'PA').split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const goldOptions = ['GOLD 1', 'GOLD 2', 'GOLD 3', 'GOLD 4'];

  const metricConfig = [
    { key: 'pm25', label: 'PM2.5', sub: 'Fijnstof', color: theme.s3, icon: 'dust' },
    { key: 'pm10', label: 'PM10', sub: 'Grof stof', color: theme.s4, icon: 'wind' },
    { key: 'temp', label: 'Temperatuur', sub: 'Buitenlucht', color: theme.accent, icon: 'thermo' },
    { key: 'nox', label: 'NOx', sub: 'Stikstofoxiden', color: theme.s1, icon: 'chemical' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <AmbientBg theme={theme} statusColor={statusColor} />
      <ScrollView
        style={{ flex: 1, zIndex: 10 }}
        contentContainerStyle={{ paddingTop: 100, paddingHorizontal: 16, paddingBottom: 110 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18, paddingHorizontal: 4 }}>
          <View style={{
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: theme.accent,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: theme.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 14,
            elevation: 8,
          }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5 }}>
              {initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <TextInput
                ref={inputRef}
                value={name}
                onChangeText={setName}
                onBlur={() => setEditingName(false)}
                onSubmitEditing={() => setEditingName(false)}
                style={{
                  fontSize: 22, fontWeight: '700', color: theme.ink, letterSpacing: -0.4,
                  padding: 0, margin: 0,
                  borderBottomWidth: 1.5, borderBottomColor: theme.accent,
                }}
              />
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: theme.ink, letterSpacing: -0.4 }}>
                  {name}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 13, color: theme.inkSoft, marginTop: 1 }}>
              COPD {goldStage} • {age} jaar
            </Text>
          </View>
          <TouchableOpacity onPress={() => setEditingName(v => !v)}
            style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: editingName ? theme.accent : 'rgba(255,255,255,0.6)',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
            }}>
            <Icon name={editingName ? 'check' : 'edit'} size={16} color={editingName ? '#fff' : theme.inkSoft} />
          </TouchableOpacity>
        </View>

        <GlassCard theme={theme} radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <Text style={{
            fontSize: 11, fontWeight: '700', color: theme.inkSoft,
            letterSpacing: 0.4, marginBottom: 12, textTransform: 'uppercase',
          }}>
            Patiëntgegevens
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 11, fontWeight: '600', color: theme.inkSoft,
                letterSpacing: 0.2, marginBottom: 6, textTransform: 'uppercase',
              }}>
                Leeftijd
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12,
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
              }}>
                <TextInput
                  value={age}
                  onChangeText={t => setAge(t.replace(/[^0-9]/g, '').slice(0, 3))}
                  keyboardType="numeric"
                  style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.ink, padding: 0 }}
                />
                <Text style={{ fontSize: 13, color: theme.inkSoft, fontWeight: '500' }}>jaar</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 11, fontWeight: '600', color: theme.inkSoft,
                letterSpacing: 0.2, marginBottom: 6, textTransform: 'uppercase',
              }}>
                COPD fase
              </Text>
              <TouchableOpacity onPress={() => setShowGoldPicker(true)}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.5)',
                  borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
                }}>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.ink }}>
                  {goldStage}
                </Text>
                <Icon name="chevron-right" size={14} color={theme.inkMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>

        <GlassCard theme={theme} radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 38, height: 38, borderRadius: 11,
              backgroundColor: `${theme.accent}18`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="settings" size={20} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: theme.ink }}>Pro modus</Text>
              <Text style={{ fontSize: 11.5, color: theme.inkSoft, marginTop: 2, lineHeight: 16 }}>
                {proMode ? 'Toon alle ruwe meetwaarden, grafieken en drempels.' : 'Alleen status en eenvoudig advies. Aanbevolen.'}
              </Text>
            </View>
            <Toggle on={proMode} onChange={setProMode} theme={theme} />
          </View>
        </GlassCard>

        <GlassCard theme={theme} radius={22} style={{ paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 }}>
          <Text style={{
            fontSize: 11, fontWeight: '700', color: theme.inkSoft,
            letterSpacing: 0.4, marginTop: 10, marginBottom: 2, textTransform: 'uppercase',
            paddingHorizontal: 4,
          }}>
            Waarden voor jou
          </Text>
          <Text style={{
            fontSize: 11.5, color: theme.inkSoft, marginBottom: 8, lineHeight: 16,
            paddingHorizontal: 4,
          }}>
            Kies welke metingen voor jouw situatie van toepassing zijn.
          </Text>
          {metricConfig.map((m, i) => (
            <React.Fragment key={m.key}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4,
              }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 10,
                  backgroundColor: `${m.color}18`,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name={m.icon} size={18} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: theme.ink }}>{m.label}</Text>
                  <Text style={{ fontSize: 11.5, color: theme.inkSoft, marginTop: 1 }}>{m.sub}</Text>
                </View>
                <Toggle
                  on={enabledMetrics[m.key]}
                  onChange={(v) => setEnabledMetrics({ ...enabledMetrics, [m.key]: v })}
                  theme={theme}
                />
              </View>
              {i < metricConfig.length - 1 && <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginLeft: 50 }} />}
            </React.Fragment>
          ))}
        </GlassCard>

        <GlassCard theme={theme} radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <Text style={{
            fontSize: 11, fontWeight: '700', color: theme.inkSoft,
            letterSpacing: 0.4, marginBottom: 10, textTransform: 'uppercase',
          }}>
            Kleurthema
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Object.entries(THEMES).map(([key, t]) => (
              <TouchableOpacity key={key} onPress={() => setThemeKey(key)}
                style={{
                  flex: 1, borderRadius: 14, overflow: 'hidden',
                  borderWidth: currentTheme === key ? 2 : 0,
                  borderColor: currentTheme === key ? theme.accent : 'transparent',
                }}>
                <View style={{
                  height: 44,
                  backgroundColor: t.bgA,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: t.ink, textAlign: 'center' }}>
                    {t.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        <TouchableOpacity onPress={() => setDeviceOpen(true)}>
          <GlassCard theme={theme} radius={22} style={{ padding: 14, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: `${theme.s1}18`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="check" size={18} color={theme.s1} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.ink }}>QualityLuchtSensor™</Text>
                <Text style={{ fontSize: 11.5, color: theme.inkSoft, marginTop: 1 }}>Verbonden • Bluetooth</Text>
              </View>
              <Icon name="chevron-right" size={16} color={theme.inkMuted} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDisconnect}
          style={{
            paddingVertical: 14, borderRadius: 16,
            backgroundColor: 'rgba(201,74,58,0.12)',
            alignItems: 'center', marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.s4 }}>
            Ontkoppel apparaat
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={deviceOpen} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setDeviceOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            padding: 18, paddingBottom: 34, maxHeight: '85%',
          }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)', alignSelf: 'center', marginBottom: 18 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: `${theme.s1}18`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="check" size={22} color={theme.s1} strokeWidth={2.4} />
              </View>
              <View>
                <Text style={{ fontSize: 19, fontWeight: '700', color: theme.ink, letterSpacing: -0.3 }}>
                  QualityLuchtSensor™
                </Text>
                <Text style={{ fontSize: 12.5, color: theme.s1, fontWeight: '600', marginTop: 2 }}>
                  ● Verbonden via Bluetooth
                </Text>
              </View>
            </View>
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 16,
              borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 14,
            }}>
              {[
                { label: 'Apparaat', value: 'QualityLuchtSensor™' },
                { label: 'Verbinding', value: 'Bluetooth LE' },
                { label: 'Signaalsterkte', value: 'Goed' },
                { label: 'Sensoren', value: 'PM2.5 · PM10 · Temp · NOx' },
              ].map((r, i) => (
                <View key={r.label} style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 11, paddingHorizontal: 14,
                  borderBottomWidth: i < 3 ? 0.5 : 0,
                  borderBottomColor: 'rgba(0,0,0,0.06)',
                }}>
                  <Text style={{ fontSize: 13, color: theme.inkSoft, fontWeight: '500' }}>{r.label}</Text>
                  <Text style={{ fontSize: 13.5, color: theme.ink, fontWeight: '600' }}>{r.value}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity onPress={() => { setDeviceOpen(false); onDisconnect(); }}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 14,
                  backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center',
                }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.ink }}>
                  Ontkoppel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDeviceOpen(false)}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 14,
                  backgroundColor: theme.accent, alignItems: 'center',
                  shadowColor: theme.accent, shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25, shadowRadius: 14, elevation: 8,
                }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
                  Sluiten
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showGoldPicker} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
          activeOpacity={1}
          onPress={() => setShowGoldPicker(false)}
        >
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            padding: 18, paddingBottom: 40,
          }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)', alignSelf: 'center', marginBottom: 18 }} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: theme.ink, letterSpacing: -0.3, marginBottom: 16 }}>
              COPD Fase
            </Text>
            {goldOptions.map(opt => (
              <TouchableOpacity key={opt} onPress={() => { setGoldStage(opt); setShowGoldPicker(false); }}
                style={{
                  paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12,
                  backgroundColor: goldStage === opt ? theme.accent : 'rgba(255,255,255,0.5)',
                  marginBottom: 6,
                }}>
                <Text style={{
                  fontSize: 16, fontWeight: '600',
                  color: goldStage === opt ? '#fff' : theme.ink,
                }}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
