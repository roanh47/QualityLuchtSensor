export const THEMES = {
  sky: {
    name: 'Hemelblauw',
    bgA: '#c9e0f5', bgB: '#e8d5ea', bgC: '#f8e4c9',
    ink: '#1a2332',
    inkSoft: 'rgba(26,35,50,0.62)',
    inkMuted: 'rgba(26,35,50,0.42)',
    glassBg: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(255,255,255,0.85)',
    s1: '#3ba776',
    s2: '#b5a730',
    s3: '#d48837',
    s4: '#c94a3a',
    accent: '#2b6fd6',
  },
  forest: {
    name: 'Dennenbos',
    bgA: '#d4e4d0', bgB: '#b8dbd0', bgC: '#f0e9cf',
    ink: '#1c2820',
    inkSoft: 'rgba(28,40,32,0.62)',
    inkMuted: 'rgba(28,40,32,0.42)',
    glassBg: 'rgba(255,255,255,0.72)',
    glassBorder: 'rgba(255,255,255,0.85)',
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
    s1: '#3ba776',
    s2: '#b5a730',
    s3: '#d48837',
    s4: '#c94a3a',
    accent: '#7a3fc4',
  },
};

export const STATUS_LEVELS = [
  { key: 1, title: 'Uitstekend', advice: 'Perfect moment om naar buiten te gaan.', longAdvice: 'De luchtkwaliteit is goed en je symptomen zijn stabiel. Een wandeling wordt aanbevolen.', colorKey: 's1', icon: 'sun' },
  { key: 2, title: 'Goed', advice: 'Je kan veilig naar buiten.', longAdvice: 'De lucht is acceptabel. Houd rekening met korte activiteiten en neem je inhaler mee.', colorKey: 's2', icon: 'cloud-sun' },
  { key: 3, title: 'Voorzichtig', advice: 'Beperk je tijd buiten.', longAdvice: 'De fijnstofwaarden zijn verhoogd. Vermijd inspanning en drukke wegen. Korte boodschap kan wel.', colorKey: 's3', icon: 'cloud' },
  { key: 4, title: 'Blijf binnen', advice: 'Ga vandaag niet naar buiten.', longAdvice: 'Lucht- en symptoomwaarden zijn te hoog. Blijf binnen, ventileer kort en volg je behandelplan.', colorKey: 's4', icon: 'alert' },
];

export const SYMPTOMS = [
  { id: 'benauwd', label: 'Benauwd' },
  { id: 'hoest', label: 'Hoesten' },
  { id: 'slijm', label: 'Slijm' },
  { id: 'moe', label: 'Moe' },
  { id: 'piep', label: 'Piepende ademhaling' },
];

const DEVICE_NAME = 'QualityLuchtSensor';
export const BLE_CONFIG = {
  SERVICE_UUID: '0000FFE0-0000-1000-8000-00805F9B34FB',
  PM25_CHAR_UUID: '0000FFE1-0000-1000-8000-00805F9B34FB',
  PM10_CHAR_UUID: '0000FFE2-0000-1000-8000-00805F9B34FB',
  TEMP_CHAR_UUID: '0000FFE3-0000-1000-8000-00805F9B34FB',
  NOX_CHAR_UUID: '0000FFE4-0000-1000-8000-00805F9B34FB',
  STATUS_CHAR_UUID: '0000FFE5-0000-1000-8000-00805F9B34FB',
  DEVICE_NAME,
};

export function getTempHint(temp) {
  if (temp < 8) return 'Koud — draag een sjaal voor je mond.';
  if (temp < 18) return 'Mild — prettig om te wandelen.';
  return 'Aangenaam — geniet van buiten.';
}

export function pm25ToStatusLvl(pm25) {
  if (pm25 < 15) return 1;
  if (pm25 < 25) return 2;
  if (pm25 < 50) return 3;
  return 4;
}

export function generateTrendData(currentValue, points = 7) {
  const seeds = [0.7, 0.5, 0.9, 0.65, 0.8, 0.95, 1.0];
  const labels = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
  return seeds.slice(0, points).map((s, i) => ({
    x: i,
    v: +(currentValue * (0.55 + s * 0.55)).toFixed(1),
    label: labels[i % 7],
  }));
}
