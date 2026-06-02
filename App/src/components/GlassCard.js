import React from 'react';
import { View, TouchableOpacity } from 'react-native';

export default function GlassCard({ children, style, theme, radius = 24, onPress }) {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component
      onPress={onPress}
      activeOpacity={0.8}
      style={[{
        borderRadius: radius,
        backgroundColor: theme.glassBg,
        borderWidth: 0,
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 30,
      }, style]}
    >
      {children}
    </Component>
  );
}
