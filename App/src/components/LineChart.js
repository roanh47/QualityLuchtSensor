import React from 'react';
import { View, Text } from 'react-native';

export default function LineChart({ data, color, width = 300, height = 140, theme }) {
  if (!data || data.length === 0) return null;

  const vs = data.map(d => d.v);
  const mn = Math.min(...vs) * 0.9;
  const mx = Math.max(...vs) * 1.05;
  const padL = 2, padR = 2, padT = 14, padB = 24;

  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * (width - padL - padR);
    const y = padT + (1 - (d.v - mn) / Math.max(0.01, mx - mn)) * (height - padT - padB);
    return { x, y, ...d };
  });

  const last = pts[pts.length - 1];

  return (
    <View style={{ width: '100%', height }}>
      <View style={{ flex: 1, position: 'relative' }}>
        {pts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <View style={{
                position: 'absolute',
                left: pts[i - 1].x, top: pts[i - 1].y,
                width: Math.sqrt((p.x - pts[i - 1].x) ** 2 + (p.y - pts[i - 1].y) ** 2),
                height: 2.2,
                backgroundColor: color,
                transform: [{ rotate: `${Math.atan2(p.y - pts[i - 1].y, p.x - pts[i - 1].x) * 180 / Math.PI}deg` }],
                transformOrigin: 'left center',
              }} />
            )}
            <View style={{
              position: 'absolute', left: p.x - 3, top: p.y - 3, width: 6, height: 6, borderRadius: 3,
              backgroundColor: i === pts.length - 1 ? '#fff' : color,
              borderWidth: i === pts.length - 1 ? 2 : 0,
              borderColor: color,
            }} />
          </React.Fragment>
        ))}
        {pts.map((p, i) => (
          <Text key={i} style={{
            position: 'absolute', left: p.x - 10, top: height - 18, width: 20,
            fontSize: 9, color: theme.inkMuted, textAlign: 'center',
          }}>
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
