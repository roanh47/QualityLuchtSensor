import React, { useState } from 'react';
import { View, Text } from 'react-native';

export default function LineChart({ data, color, height = 140, theme, showValue = true }) {
  const [containerWidth, setContainerWidth] = useState(0);
  if (!data || data.length === 0) return null;

  const pts = data;
  
  const vs = pts.map(d => d.v);
  const mn = Math.min(...vs);
  const mx = Math.max(...vs);
  const range = mx - mn || 1;
  
  const padL = 12, padR = 12, padT = 16, padB = 24;
  const chartH = height - padT - padB;
  
  // Use measured width or fallback
  const chartWidth = containerWidth || 300;
  const chartW = chartWidth - padL - padR;
  
  const mappedPts = pts.map((d, i) => {
    const x = padL + (pts.length > 1 ? (i / (pts.length - 1)) * chartW : chartW / 2);
    const y = padT + (1 - (d.v - mn) / range) * chartH;
    return { x, y, ...d };
  });

  const lastPt = mappedPts[mappedPts.length - 1];
  const currentVal = lastPt ? lastPt.v : null;

  // Pick time labels: first, last, and spread evenly in between (max ~5 labels)
  const maxLabels = Math.min(5, pts.length);
  const labelIndices = [];
  if (pts.length <= maxLabels) {
    for (let i = 0; i < pts.length; i++) labelIndices.push(i);
  } else {
    for (let i = 0; i < maxLabels; i++) {
      labelIndices.push(Math.round(i * (pts.length - 1) / (maxLabels - 1)));
    }
  }

  return (
    <View style={{ width: '100%', height }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <View style={{ width: chartWidth, height: height - padB }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
          <View key={i} style={{
            position: 'absolute',
            left: padL, right: padR,
            top: padT + chartH * frac,
            height: 1,
            backgroundColor: theme.inkMuted + '22',
          }} />
        ))}
        
        {/* Line segments */}
        {mappedPts.slice(1).map((p, i) => (
          <View key={i} style={{
            position: 'absolute',
            left: mappedPts[i].x,
            top: mappedPts[i].y,
            width: Math.sqrt((p.x - mappedPts[i].x) ** 2 + (p.y - mappedPts[i].y) ** 2),
            height: 2.5,
            backgroundColor: color,
            transform: [{ rotate: `${Math.atan2(p.y - mappedPts[i].y, p.x - mappedPts[i].x) * 180 / Math.PI}deg` }],
            transformOrigin: 'left center',
          }} />
        ))}
        
        {/* Data points */}
        {mappedPts.map((p, i) => (
          <View key={i} style={{
            position: 'absolute',
            left: p.x - 5,
            top: p.y - 5,
            width: i === mappedPts.length - 1 ? 12 : 8,
            height: i === mappedPts.length - 1 ? 12 : 8,
            borderRadius: i === mappedPts.length - 1 ? 6 : 4,
            backgroundColor: i === mappedPts.length - 1 ? '#fff' : color,
            borderWidth: 2,
            borderColor: color,
          }} />
        ))}
      </View>
      
      {/* Time axis labels - only show selected labels */}
      <View style={{ width: chartWidth, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: padL }}>
        {labelIndices.map((idx) => (
          <Text key={idx} style={{ 
            fontSize: 9, color: theme.inkMuted,
            position: 'absolute',
            left: mappedPts[idx].x - 16,
            width: 32,
            textAlign: 'center',
          }}>
            {mappedPts[idx].label || ''}
          </Text>
        ))}
      </View>
      
      {/* Current value */}
      {showValue && currentVal != null && (
        <View style={{ 
          position: 'absolute', right: 16, top: 8,
          backgroundColor: color + '22',
          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: color }}>
            {currentVal % 1 === 0 ? currentVal : currentVal.toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  );
}
