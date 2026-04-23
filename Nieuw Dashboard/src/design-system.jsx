// Design system — Liquid Glass voor COPD dashboard
// Tokens, status-logica, dummy data, SVG iconen

// ─── Color themes ─────────────────────────────────────────────
const THEMES = {
  sky: {
    name: 'Hemelblauw',
    // achtergrond gradient (achter het glas)
    bgA: '#c9e0f5', bgB: '#e8d5ea', bgC: '#f8e4c9',
    ink: '#1a2332',
    inkSoft: 'rgba(26,35,50,0.62)',
    inkMuted: 'rgba(26,35,50,0.42)',
    // glass
    glassBg: 'rgba(255,255,255,0.55)',
    glassBorder: 'rgba(255,255,255,0.9)',
    glassShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 -1px 0 rgba(255,255,255,0.15) inset, 0 10px 40px rgba(30,50,80,0.12)',
    // statussen (COPD-advies)
    s1: '#3ba776', // Uitstekend
    s2: '#b5a730', // Goed
    s3: '#d48837', // Voorzichtig
    s4: '#c94a3a', // Blijf binnen
    accent: '#2b6fd6',
  },
  forest: {
    name: 'Dennenbos',
    bgA: '#d4e4d0', bgB: '#b8dbd0', bgC: '#f0e9cf',
    ink: '#1c2820',
    inkSoft: 'rgba(28,40,32,0.62)',
    inkMuted: 'rgba(28,40,32,0.42)',
    glassBg: 'rgba(255,255,255,0.55)',
    glassBorder: 'rgba(255,255,255,0.9)',
    glassShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 -1px 0 rgba(255,255,255,0.15) inset, 0 10px 40px rgba(30,60,40,0.12)',
    s1: '#3ba776',
    s2: '#b5a730',
    s3: '#d48837',
    s4: '#c94a3a',
    accent: '#2f8558',
  },
  dusk: {
    name: 'Schemer',
    bgA: '#f3c8b4', bgB: '#d9b5d4', bgC: '#a5bce0',
    ink: '#1f1a2e',
    inkSoft: 'rgba(31,26,46,0.64)',
    inkMuted: 'rgba(31,26,46,0.44)',
    glassBg: 'rgba(255,255,255,0.52)',
    glassBorder: 'rgba(255,255,255,0.85)',
    glassShadow: '0 1px 0 rgba(255,255,255,0.55) inset, 0 -1px 0 rgba(255,255,255,0.15) inset, 0 10px 40px rgba(50,40,80,0.14)',
    s1: '#3ba776',
    s2: '#b5a730',
    s3: '#d48837',
    s4: '#c94a3a',
    accent: '#7a3fc4',
  },
};

// ─── Status levels ────────────────────────────────────────────
const STATUS_LEVELS = [
  {
    key: 1,
    title: 'Uitstekend',
    advice: 'Perfect moment om naar buiten te gaan.',
    longAdvice: 'De luchtkwaliteit is goed en je symptomen zijn stabiel. Een wandeling wordt aanbevolen.',
    colorKey: 's1',
    icon: 'sun',
  },
  {
    key: 2,
    title: 'Goed',
    advice: 'Je kan veilig naar buiten.',
    longAdvice: 'De lucht is acceptabel. Houd rekening met korte activiteiten en neem je inhaler mee.',
    colorKey: 's2',
    icon: 'cloud-sun',
  },
  {
    key: 3,
    title: 'Voorzichtig',
    advice: 'Beperk je tijd buiten.',
    longAdvice: 'De fijnstofwaarden zijn verhoogd. Vermijd inspanning en drukke wegen. Korte boodschap kan wel.',
    colorKey: 's3',
    icon: 'cloud',
  },
  {
    key: 4,
    title: 'Blijf binnen',
    advice: 'Ga vandaag niet naar buiten.',
    longAdvice: 'Lucht- en symptoomwaarden zijn te hoog. Blijf binnen, ventileer kort en volg je behandelplan.',
    colorKey: 's4',
    icon: 'alert',
  },
];

// ─── Metric labels (no dummy values, real-time only) ──────
const METRICS_BY_STATUS = {
  1: {
    pm25:  { v: 0,  unit: 'µg/m³', norm: 15, label: 'PM2.5',       sub: 'Fijnstof' },
    no2:   { v: 0,  unit: 'µg/m³', norm: 40, label: 'NO₂',          sub: 'Stikstofdioxide' },
    temp:  { v: 0,  unit: '°C',    norm: null, label: 'Temperatuur', sub: 'Buitenlucht' },
    gas:   { v: 0,  unit: 'ppm',   norm: 1000, label: 'Gas',        sub: 'LPG/CO/NO2' },
  },
  2: {
    pm25:  { v: 0,  unit: 'µg/m³', norm: 15, label: 'PM2.5',       sub: 'Fijnstof' },
    no2:   { v: 0,  unit: 'µg/m³', norm: 40, label: 'NO₂',          sub: 'Stikstofdioxide' },
    temp:  { v: 0,  unit: '°C',    norm: null, label: 'Temperatuur', sub: 'Buitenlucht' },
    gas:   { v: 0,  unit: 'ppm',   norm: 1000, label: 'Gas',        sub: 'LPG/CO/NO2' },
  },
  3: {
    pm25:  { v: 0,  unit: 'µg/m³', norm: 15, label: 'PM2.5',       sub: 'Fijnstof' },
    no2:   { v: 0,  unit: 'µg/m³', norm: 40, label: 'NO₂',          sub: 'Stikstofdioxide' },
    temp:  { v: 0,  unit: '°C',    norm: null, label: 'Temperatuur', sub: 'Buitenlucht' },
    gas:   { v: 0,  unit: 'ppm',   norm: 1000, label: 'Gas',        sub: 'LPG/CO/NO2' },
  },
  4: {
    pm25:  { v: 0,  unit: 'µg/m³', norm: 15, label: 'PM2.5',       sub: 'Fijnstof' },
    no2:   { v: 0,  unit: 'µg/m³', norm: 40, label: 'NO₂',          sub: 'Stikstofdioxide' },
    temp:  { v: 0,  unit: '°C',    norm: null, label: 'Temperatuur', sub: 'Buitenlucht' },
    gas:   { v: 0,  unit: 'ppm',   norm: 1000, label: 'Gas',        sub: 'LPG/CO/NO2' },
  },
};

// ─── Trend data (7 points, laatste = nu) ─────────────────────
function trendFor(metric, statusLvl) {
  const base = METRICS_BY_STATUS[statusLvl][metric].v;
  const seeds = [0.7, 0.5, 0.9, 0.65, 0.8, 0.95, 1.0];
  return seeds.map((s, i) => ({
    x: i,
    v: +(base * (0.55 + s * 0.55)).toFixed(1),
    label: ['Ma','Di','Wo','Do','Vr','Za','Zo'][i],
  }));
}

// Symptoom log (mock)
const SYMPTOMS = [
  { id: 'benauwd', label: 'Benauwd' },
  { id: 'hoest',   label: 'Hoesten' },
  { id: 'slijm',   label: 'Slijm' },
  { id: 'moe',     label: 'Moe' },
  { id: 'piep',    label: 'Piepende ademhaling' },
];

// ─── SVG Icon set (eenvoudig, clean) ─────────────────────────
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.8 }) => {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    sun:   <g {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></g>,
    'cloud-sun': <g {...p}><path d="M13 4v2M4.9 7.9l1.4 1.4M3 14h2M19.1 7.9l-1.4 1.4M13 10a3 3 0 0 1 3 3"/><path d="M7 18h10a3 3 0 0 0 0-6 4 4 0 0 0-7.9-1A3 3 0 0 0 7 18z"/></g>,
    cloud: <g {...p}><path d="M7 18h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6-1A4 4 0 0 0 7 18z"/></g>,
    alert: <g {...p}><path d="M12 3L2 20h20L12 3z"/><path d="M12 10v5M12 18v.5"/></g>,
    wind:  <g {...p}><path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h17"/></g>,
    drop:  <g {...p}><path d="M12 3s-6 7-6 12a6 6 0 0 0 12 0c0-5-6-12-6-12z"/></g>,
    thermo:<g {...p}><path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0z"/></g>,
    dust:  <g {...p}><circle cx="6" cy="7" r="1.5"/><circle cx="13" cy="5" r="2"/><circle cx="18" cy="11" r="1.5"/><circle cx="9" cy="13" r="2"/><circle cx="15" cy="17" r="1.5"/><circle cx="6" cy="18" r="1.2"/></g>,
    chart: <g {...p}><path d="M3 3v18h18"/><path d="M7 14l3-4 3 2 5-7"/></g>,
    home:  <g {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"/></g>,
    user:  <g {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></g>,
    plus:  <g {...p}><path d="M12 5v14M5 12h14"/></g>,
    check: <g {...p}><path d="M4 12l5 5L20 6"/></g>,
    chevron: <g {...p}><path d="M9 6l6 6-6 6"/></g>,
    chevronDown: <g {...p}><path d="M6 9l6 6 6-6"/></g>,
    refresh:<g {...p}><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/></g>,
    bell:  <g {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 0 0 4 0"/></g>,
    settings:<g {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></g>,
    trend: <g {...p}><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></g>,
    lung:  <g {...p}><path d="M12 3v10M8 9c0 3-3 5-5 9 0 2 2 3 4 2s3-3 3-5V9"/><path d="M16 9c0 3 3 5 5 9 0 2-2 3-4 2s-3-3-3-5V9"/></g>,
    info:  <g {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v.1M11 12h1v4h1"/></g>,
    star:  <g {...p}><path d="M12 3l2.6 6 6.4.6-4.8 4.4 1.5 6.4L12 17l-5.7 3.4 1.5-6.4L3 9.6l6.4-.6z"/></g>,
    close: <g {...p}><path d="M6 6l12 12M6 18L18 6"/></g>,
    edit:  <g {...p}><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
};

Object.assign(window, { THEMES, STATUS_LEVELS, METRICS_BY_STATUS, SYMPTOMS, trendFor, Icon });
