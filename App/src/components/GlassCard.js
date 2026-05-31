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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }, style]}
    >
      {children}
    </Component>
  );
}
