import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function LineChart({ data, color, height = 140, theme, showValue = true }) {
  if (!data || data.length === 0) return null;

  const pts = data;
  
  // Make chart wide so points have actual space between them (120px per point)
  const chartWidth = Math.max(600, pts.length * 120);
  
  const vs = pts.map(d => d.v);
  const mn = Math.min(...vs);
  const mx = Math.max(...vs);
  const range = mx - mn || 1;
  
  const padL = 16, padR = 16, padT = 16, padB = 32;
  const chartH = height - padT - padB;
  const chartW = chartWidth - padL - padR;
  
  // Show start, middle, end time labels
  const labelIndices = pts.length <= 3 
    ? pts.map((_, i) => i)
    : [0, Math.floor(pts.length / 2), pts.length - 1];
  
  const mappedPts = pts.map((d, i) => {
    // Evenly spaced by index, not by time - time labels show actual time
    const x = padL + (pts.length > 1 ? (i / (pts.length - 1)) * chartW : chartW / 2);
    const y = padT + (1 - (d.v - mn) / range) * chartH;
    return { x, y, ...d };
  });

  const lastPt = mappedPts[mappedPts.length - 1];
  const currentVal = lastPt ? lastPt.v : null;

  return (
    <View style={{ width: '100%', height }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: chartWidth }}>
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
          
          {/* Data points with scrolling */}
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
      </ScrollView>
      
      {/* Time axis labels - show every point's time */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ width: chartWidth, paddingHorizontal: 0 }}>
        <View style={{ width: chartWidth, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0 }}>
          {mappedPts.map((p, i) => (
            <Text key={i} style={{ 
              fontSize: 9, color: theme.inkMuted, 
              minWidth: 40, textAlign: 'center',
              marginLeft: i === 0 ? 0 : 40, // align with point
            }}>
              {p.label || ''}
            </Text>
          ))}
        </View>
      </ScrollView>
      
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
