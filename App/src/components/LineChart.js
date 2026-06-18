import React, { useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

export default function LineChart({ data, color, height = 140, theme, showValue = true }) {
  const [containerWidth, setContainerWidth] = useState(0);
  if (!data || data.length === 0) return null;

  const chartWidth = Math.max(100, containerWidth || 300);
  const pts = data;
  const vs = pts.map(d => d.v);
  const mn = Math.min(...vs);
  const mx = Math.max(...vs);
  // Add a tiny pad so min/max points don't sit exactly on the edge
  const rangeRaw = mx - mn || 1;
  const padY = rangeRaw === 0 ? 1 : rangeRaw * 0.05;
  const minY = mn - padY;
  const maxY = mx + padY;
  const range = maxY - minY || 1;

  const padL = 12;
  const padR = 12;
  const padT = 18;
  const padB = 28;
  const chartH = height - padT - padB;
  const chartW = chartWidth - padL - padR;

  const mappedPts = useMemo(() => {
    return pts.map((d, i) => {
      const x = padL + (pts.length > 1 ? (i / (pts.length - 1)) * chartW : chartW / 2);
      const y = padT + (1 - (d.v - minY) / range) * chartH;
      return {
        x: Math.max(padL, Math.min(chartWidth - padR, x)),
        y: Math.max(padT, Math.min(height - padB, y)),
        v: d.v,
        label: d.label,
      };
    });
  }, [pts, chartW, chartH, minY, range, chartWidth, height]);

  const pathD = mappedPts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const lastPt = mappedPts[mappedPts.length - 1];
  const currentVal = lastPt ? lastPt.v : null;

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
    <View style={{ width: '100%', height, overflow: 'hidden' }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <Svg width={chartWidth} height={height}>
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = padT + chartH * frac;
          return (
            <Line
              key={`g${i}`}
              x1={padL}
              y1={y}
              x2={chartWidth - padR}
              y2={y}
              stroke={theme.inkMuted}
              strokeOpacity={0.13}
              strokeWidth={1}
            />
          );
        })}

        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {mappedPts.map((p, i) => {
          const isLast = i === mappedPts.length - 1;
          return (
            <Circle
              key={`p${i}`}
              cx={p.x}
              cy={p.y}
              r={isLast ? 5 : 3}
              fill={isLast ? '#fff' : color}
              stroke={color}
              strokeWidth={2}
            />
          );
        })}

        {labelIndices.map((idx, li) => {
          const p = mappedPts[idx];
          const label = p.label || '';
          const textWidth = Math.min(46, chartW / labelIndices.length);
          let x = p.x;
          if (idx === 0) x = Math.min(p.x + 4, chartWidth - padR - textWidth / 2);
          else if (idx === pts.length - 1) x = Math.max(p.x - 4, padL + textWidth / 2);
          return (
            <SvgText
              key={`l${li}`}
              x={x}
              y={height - 8}
              fontSize={9}
              fill={theme.inkMuted}
              textAnchor="middle"
              fontWeight="500"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>

      {showValue && currentVal != null && (
        <View style={{
          position: 'absolute', right: 16, top: 6,
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
