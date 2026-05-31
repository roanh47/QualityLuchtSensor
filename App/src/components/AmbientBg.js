import React from 'react';
import { View } from 'react-native';

export default function AmbientBg({ theme, statusColor }) {
  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: theme.bgA,
    }}>
      <View style={{
        position: 'absolute', top: -160, right: -160, width: 500, height: 500, borderRadius: 250,
        backgroundColor: statusColor || theme.s2,
        opacity: 0.18,
      }} />
      <View style={{
        position: 'absolute', bottom: 60, left: -140, width: 440, height: 440, borderRadius: 220,
        backgroundColor: theme.accent,
        opacity: 0.12,
      }} />
      <View style={{
        position: 'absolute', top: '30%', left: '20%', width: 360, height: 360, borderRadius: 180,
        backgroundColor: theme.bgC || theme.bgB,
        opacity: 0.15,
      }} />
      <View style={{
        position: 'absolute', bottom: '15%', right: -80, width: 300, height: 300, borderRadius: 150,
        backgroundColor: theme.bgB,
        opacity: 0.1,
      }} />
    </View>
  );
}
