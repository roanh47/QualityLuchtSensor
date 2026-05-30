import React from 'react';
import { View } from 'react-native';

export default function AmbientBg({ theme, statusColor }) {
  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: theme.bgA,
    }}>
      <View style={{
        flex: 1,
        backgroundImage: undefined,
      }}>
        <View style={{
          position: 'absolute', top: -60, right: -80, width: 280, height: 280, borderRadius: 140,
          backgroundColor: statusColor || theme.s2,
          opacity: 0.3,
        }} />
        <View style={{
          position: 'absolute', bottom: 100, left: -60, width: 240, height: 240, borderRadius: 120,
          backgroundColor: theme.accent,
          opacity: 0.2,
        }} />
        <View style={{
          position: 'absolute', top: '40%', left: '30%', width: 180, height: 180, borderRadius: 90,
          backgroundColor: theme.bgC || theme.bgB,
          opacity: 0.5,
        }} />
      </View>
    </View>
  );
}
