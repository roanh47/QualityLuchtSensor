import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, G, Line, Rect } from 'react-native-svg';

const paths = {
  sun: <G><Circle cx="12" cy="12" r="4"/><Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></G>,
  'cloud-sun': <G><Path d="M13 4v2M4.9 7.9l1.4 1.4M3 14h2M19.1 7.9l-1.4 1.4M13 10a3 3 0 0 1 3 3"/><Path d="M7 18h10a3 3 0 0 0 0-6 4 4 0 0 0-7.9-1A3 3 0 0 0 7 18z"/></G>,
  cloud: <G><Path d="M7 18h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6-1A4 4 0 0 0 7 18z"/></G>,
  alert: <G><Path d="M12 3L2 20h20L12 3z"/><Path d="M12 10v5M12 18v.5"/></G>,
  wind: <G><Path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h17"/></G>,
  thermo: <G><Path d="M14 14.76V5a2 2 0 1 0-4 0v9.76A4 4 0 1 0 14 14.76z"/></G>,
  dust: <G><Circle cx="6" cy="7" r="1.5"/><Circle cx="13" cy="5" r="2"/><Circle cx="18" cy="11" r="1.5"/><Circle cx="9" cy="13" r="2"/><Circle cx="15" cy="17" r="1.5"/><Circle cx="6" cy="18" r="1.2"/></G>,
  home: <G><Path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"/></G>,
  user: <G><Circle cx="12" cy="8" r="4"/><Path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></G>,
  plus: <G><Path d="M12 5v14M5 12h14"/></G>,
  trend: <G><Path d="M3 17l6-6 4 4 8-8"/><Path d="M14 7h7v7"/></G>,
  check: <G><Path d="M4 12l5 5L20 6"/></G>,
  close: <G><Path d="M6 6l12 12M6 18L18 6"/></G>,
  edit: <G><Path d="M4 20h4l10-10-4-4L4 16v4z"/><Path d="M13.5 6.5l4 4"/></G>,
  settings: <G><Circle cx="12" cy="12" r="3"/><Path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></G>,
  refresh: <G><Path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8"/><Path d="M21 3v5h-5M3 21v-5h5"/></G>,
  bluetooth: <G><Path d="M6 7l12 10-6 5V2l6 5-12 10"/></G>,
  'chevron-right': <G><Path d="M9 6l6 6-6 6"/></G>,
  chemical: <G><Path d="M8 3v6l-3 5v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5l-3-5V3"/><Path d="M8 3h8"/><Path d="M10 3v5a2 2 0 0 1-.6 1.4L7 12M14 3v5a2 2 0 0 0 .6 1.4L17 12"/></G>,
  chart: <G><Path d="M3 3v18h18"/><Path d="M7 14l3-4 3 2 5-7"/></G>,
};

export default function Icon({ name, size = 20, color = '#000', strokeWidth = 1.8 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <G stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {paths[name] || null}
      </G>
    </Svg>
  );
}
