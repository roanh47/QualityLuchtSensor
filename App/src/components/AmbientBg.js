import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';

export default function AmbientBg({ theme, statusColor }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <RadialGradient id="g1" cx="80%" cy="20%" r="65%">
            <Stop offset="0%" stopColor={statusColor || theme.s2} stopOpacity="0.3" />
            <Stop offset="60%" stopColor={statusColor || theme.s2} stopOpacity="0.08" />
            <Stop offset="100%" stopColor={statusColor || theme.s2} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="g2" cx="25%" cy="85%" r="55%">
            <Stop offset="0%" stopColor={theme.accent} stopOpacity="0.25" />
            <Stop offset="60%" stopColor={theme.accent} stopOpacity="0.06" />
            <Stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="g3" cx="40%" cy="40%" r="45%">
            <Stop offset="0%" stopColor={theme.bgC || theme.bgB} stopOpacity="0.2" />
            <Stop offset="60%" stopColor={theme.bgC || theme.bgB} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={theme.bgC || theme.bgB} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={theme.bgA} />
        <Ellipse cx="80%" cy="20%" rx="65%" ry="65%" fill="url(#g1)" />
        <Ellipse cx="25%" cy="85%" rx="55%" ry="55%" fill="url(#g2)" />
        <Ellipse cx="40%" cy="40%" rx="45%" ry="45%" fill="url(#g3)" />
      </Svg>
    </View>
  );
}
