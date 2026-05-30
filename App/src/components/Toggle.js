import React from 'react';
import { TouchableOpacity, View } from 'react-native';

export default function Toggle({ on, onChange, theme, size = 'md' }) {
  const W = size === 'sm' ? 40 : 50;
  const H = size === 'sm' ? 24 : 30;
  const K = H - 4;
  return (
    <TouchableOpacity
      onPress={() => onChange && onChange(!on)}
      style={{
        width: W, height: H, borderRadius: H / 2,
        backgroundColor: on ? theme.accent : 'rgba(120,120,128,0.22)',
        justifyContent: 'center',
        padding: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 0.06,
        shadowRadius: 0.5,
      }}
    >
      <View style={{
        width: K, height: K, borderRadius: K / 2,
        backgroundColor: '#fff',
        alignSelf: on ? 'flex-end' : 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
      }} />
    </TouchableOpacity>
  );
}
