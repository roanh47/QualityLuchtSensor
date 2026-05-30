import React from 'react';
import { View, Text } from 'react-native';
import GlassCard from './GlassCard';
import Icon from './Icon';

export default function MetricCard({ label, sub, value, unit, norm, color, theme, enabled = true }) {
  const pct = norm ? Math.min(100, (value / norm) * 100) : 0;
  return (
    <GlassCard theme={theme} radius={22} style={{ padding: 14, opacity: enabled ? 1 : 0.5, flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <View>
          <Text style={{ fontSize: 11.5, fontWeight: '600', color: theme.inkSoft, letterSpacing: 0.2 }}>
            {label}
          </Text>
          <Text style={{ fontSize: 10, color: theme.inkMuted, marginTop: 1 }}>{sub}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: theme.ink, letterSpacing: -0.5 }}>
          {value}
        </Text>
        <Text style={{ fontSize: 11, color: theme.inkSoft, fontWeight: '500' }}>{unit}</Text>
      </View>
      {norm > 0 && (
        <View style={{ marginTop: 8 }}>
          <View style={{ height: 3, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <View style={{
              height: '100%', width: `${pct}%`,
              backgroundColor: color, borderRadius: 2,
            }} />
          </View>
          <Text style={{ fontSize: 9.5, color: theme.inkMuted, marginTop: 3, fontWeight: '500' }}>
            grenswaarde {norm} {unit}
          </Text>
        </View>
      )}
    </GlassCard>
  );
}
