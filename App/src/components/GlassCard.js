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
        borderWidth: 0.5,
        borderColor: theme.glassBorder,
        shadowColor: 'rgba(0,0,0,0.12)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 40,
      }, style]}
    >
      {children}
    </Component>
  );
}
