import React from 'react';
import { View, Text, useWindowDimensions, ScrollView } from 'react-native';

export default function LineChart({ data, color, height = 140, theme }) {
  const { width: screenWidth } = useWindowDimensions();
  const baseWidth = screenWidth - 64; // account for card padding + screen padding
  
  if (!data || data.length === 0) return null;

  // No downsampling — show every point with wide spacing
  const pts = data;
  const minChartWidth = 600; // at least 600px wide for readability
  const pointSpacing = 50; // 50px between each point
  const chartWidth = Math.max(minChartWidth, pts.length * pointSpacing + 40);
  
  const vs = pts.map(d => d.v);
  const mn = Math.min(...vs) * 0.9;
  const mx = Math.max(...vs) * 1.05;
  const padL = 20, padR = 20, padT = 14, padB = 24;

  const mappedPts = pts.map((d, i) => {
    const x = padL + (i / Math.max(1, pts.length - 1)) * (chartWidth - padL - padR);
    const y = padT + (1 - (d.v - mn) / Math.max(0.01, mx - mn)) * (height - padT - padB);
    return { x, y, ...d };
  });

  const labelWidth = 40;
  const labelStep = 1; // show every label since we have space

  return (
    <View style={{ width: '100%', height }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: chartWidth, height }}>
          {mappedPts.map((p, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <View style={{
                  position: 'absolute',
                  left: mappedPts[i - 1].x, top: mappedPts[i - 1].y,
                  width: Math.sqrt((p.x - mappedPts[i - 1].x) ** 2 + (p.y - mappedPts[i - 1].y) ** 2),
                  height: 2.2,
                  backgroundColor: color,
                  transform: [{ rotate: `${Math.atan2(p.y - mappedPts[i - 1].y, p.x - mappedPts[i - 1].x) * 180 / Math.PI}deg` }],
                  transformOrigin: 'left center',
                }} />
              )}
              <View style={{
                position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4,
                backgroundColor: i === mappedPts.length - 1 ? '#fff' : color,
                borderWidth: i === mappedPts.length - 1 ? 2.5 : 0,
                borderColor: color,
              }} />
            </React.Fragment>
          ))}
          {mappedPts.map((p, i) => (
            <Text key={i} style={{
              position: 'absolute', left: p.x - 20, top: height - 18, width: 40,
              fontSize: 8, color: theme.inkMuted, textAlign: 'center',
            }}>
              {p.label}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
