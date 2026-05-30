import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import GlassCard from './GlassCard';
import Icon from './Icon';

const TABS = [
  { id: 'home', label: 'Overzicht', icon: 'home' },
  { id: 'trends', label: 'Trends', icon: 'trend' },
  { id: 'profile', label: 'Profiel', icon: 'user' },
];

export default function TabBar({ tab, setTab, theme }) {
  return (
    <View style={{
      position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 40,
    }}>
      <GlassCard theme={theme} radius={28} style={{ padding: 6, flexDirection: 'row' }}>
        {TABS.map(it => {
          const active = tab === it.id;
          return (
            <TouchableOpacity
              key={it.id}
              onPress={() => setTab(it.id)}
              style={{
                flex: 1, alignItems: 'center', gap: 2,
                paddingVertical: 8, borderRadius: 22,
                backgroundColor: active ? 'rgba(255,255,255,0.65)' : 'transparent',
              }}
            >
              <Icon name={it.icon} size={22} color={active ? theme.accent : theme.inkSoft} />
              <Text style={{
                fontSize: 10.5, fontWeight: '600', letterSpacing: 0.1,
                color: active ? theme.accent : theme.inkSoft,
              }}>
                {it.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </GlassCard>
    </View>
  );
}
