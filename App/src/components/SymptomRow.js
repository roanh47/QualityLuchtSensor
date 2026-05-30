import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import GlassCard from './GlassCard';
import Icon from './Icon';
import { SYMPTOMS } from '../theme';

export default function SymptomRow({ theme, statusLvl, onAdd }) {
  return (
    <GlassCard theme={theme} radius={22} style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: theme.ink }}>Symptomen vandaag</Text>
          <Text style={{ fontSize: 11.5, color: theme.inkSoft, marginTop: 2 }}>
            {statusLvl >= 3 ? 'Meer benauwd dan gisteren' : 'Stabiel — geen nieuwe klachten'}
          </Text>
        </View>
        <TouchableOpacity onPress={onAdd} style={{
          width: 30, height: 30, borderRadius: 15, backgroundColor: theme.accent,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: theme.accent,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Icon name="plus" size={16} color="#fff" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {SYMPTOMS.slice(0, statusLvl >= 3 ? 3 : 2).map((s, i) => (
          <View key={s.id} style={{
            paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)',
            flexDirection: 'row', alignItems: 'center', gap: 5,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === 0 && statusLvl >= 3 ? theme.s4 : theme.s2 }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.ink }}>{s.label}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}
