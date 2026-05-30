import React from 'react';
import { View, Text } from 'react-native';
import GlassCard from './GlassCard';
import Icon from './Icon';
import { STATUS_LEVELS } from '../theme';

const LEVELS = STATUS_LEVELS;

export default function StatusHero({ statusLvl, theme, proMode, timeStr }) {
  const status = LEVELS[statusLvl - 1] || LEVELS[0];
  const statusColor = theme[status.colorKey];
  return (
    <GlassCard theme={theme} radius={28} style={{ padding: 20, marginTop: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <View style={{
          width: 28, height: 28, borderRadius: 14,
          backgroundColor: statusColor,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: statusColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        }}>
          <Icon name={status.icon} size={16} color="#fff" />
        </View>
        <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 0.4, color: theme.inkSoft }}>
          ADVIES OM NAAR BUITEN TE GAAN
        </Text>
      </View>
      <Text style={{ fontSize: 38, fontWeight: '700', color: statusColor, letterSpacing: -0.8, lineHeight: 42 }}>
        {status.title}
      </Text>
      <Text style={{ fontSize: 15, color: theme.ink, marginTop: 8, lineHeight: 21, fontWeight: '500' }}>
        {status.advice}
      </Text>
      {!proMode && (
        <Text style={{ fontSize: 13, color: theme.inkSoft, marginTop: 6, lineHeight: 19 }}>
          {status.longAdvice}
        </Text>
      )}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14,
        paddingTop: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.08)',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#3ba776' }} />
          <Text style={{ fontSize: 11.5, color: theme.inkMuted, fontWeight: '500' }}>
            Live • {timeStr}
          </Text>
        </View>
        <Text style={{ marginLeft: 'auto', fontSize: 11.5, color: theme.inkMuted, fontWeight: '500' }}>
          Bluetooth verbonden
        </Text>
      </View>
    </GlassCard>
  );
}
