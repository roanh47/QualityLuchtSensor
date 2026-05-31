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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }, style]}
    >
      {children}
    </Component>
  );
}
