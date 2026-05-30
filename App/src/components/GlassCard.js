import React from 'react';
import { View, TouchableOpacity } from 'react-native';

export default function GlassCard({ children, style, theme, radius = 24, intensity = 1, onPress }) {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component
      onPress={onPress}
      activeOpacity={0.8}
      style={[{
        borderRadius: radius,
        backgroundColor: theme.glassBg,
        borderWidth: 0.5,
        borderColor: theme.glassBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 40,
        elevation: 8,
        overflow: 'hidden',
      }, style]}
    >
      <View style={{
        position: 'absolute', top: 0, left: 8, right: 8, height: 1,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 1,
      }} />
      {children}
    </Component>
  );
}
