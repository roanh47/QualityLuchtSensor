// Trends screen — grafieken over tijd + tijdsbereik switcher

const TimeRangeSwitcher = ({ range, setRange, theme }) => {
  const opts = [
    { value: 'day',   label: 'Dag' },
    { value: 'week',  label: 'Week' },
    { value: 'month', label: 'Maand' },
  ];
  return <Segmented options={opts} value={range} onChange={setRange} theme={theme} />;
};

const TrendCard = ({ metricKey, label, sub, unit, color, data, theme, range, statusLvl }) => {
  const cur = data[data.length - 1].v;
  const prev = data[data.length - 2].v;
  const delta = cur - prev;
  const pct = ((delta / prev) * 100).toFixed(0);
  const up = delta > 0;

  return (
    <Glass theme={theme} radius={22} style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.inkSoft, letterSpacing: 0.2 }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: theme.ink, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{cur}</div>
            <div style={{ fontSize: 11, color: theme.inkSoft, fontWeight: 500 }}>{unit}</div>
          </div>
        </div>
        <div style={{
          padding: '4px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
          background: up ? `${theme.s4}18` : `${theme.s1}18`,
          color: up ? theme.s4 : theme.s1,
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <span style={{ fontSize: 10 }}>{up ? '↑' : '↓'}</span>
          {Math.abs(+pct)}%
        </div>
      </div>
      <LineChart data={data} color={color} width={300} height={110} showLabels={true} theme={theme} />
    </Glass>
  );
};

const TrendsScreen = ({ theme, statusLvl, enabledMetrics, proMode, sensorData }) => {
  const status = STATUS_LEVELS[statusLvl - 1];
  const statusColor = theme[status.colorKey];
  const [range, setRange] = React.useState('week');

  // Real-time values from sensor
  const currentValues = {
    pm25: sensorData.pm25,
    no2: sensorData.pm10 * 0.5,  // approximated from PM10
    temp: sensorData.temp,
    gas: sensorData.gas,
  };

  const cards = [
    enabledMetrics.pm25 && { k: 'pm25', label: 'PM2.5', sub: 'Fijnstof', unit: 'µg/m³', color: theme.s3, v: currentValues.pm25 },
    enabledMetrics.no2  && { k: 'no2',  label: 'NO₂',   sub: 'Stikstofdioxide', unit: 'µg/m³', color: theme.s4, v: currentValues.no2 },
    enabledMetrics.temp && { k: 'temp', label: 'Temperatuur', sub: 'Buitenlucht', unit: '°C', color: theme.accent, v: currentValues.temp },
    enabledMetrics.gas  && { k: 'gas',  label: 'Gas', sub: 'LPG/CO/NO2',    unit: 'ppm',  color: theme.s1, v: currentValues.gas },
  ].filter(Boolean);

  // Real-time health score based on actual sensor values
  const avgData = React.useMemo(() => {
    if (cards.length === 0) return [];
    let score = 0;
    let n = 0;
    for (const c of cards) {
      const v = c.v;
      if (c.k === 'pm25') { score += Math.min(150, (v / 15) * 50); n++; }
      else if (c.k === 'no2') { score += Math.min(150, (v / 40) * 50); n++; }
      else if (c.k === 'temp') { score += Math.min(100, Math.abs(v - 18) * 3.5); n++; }
      else if (c.k === 'gas')  { score += Math.min(100, (v / 1000) * 100); n++; }
    }
    const avg = +(score / Math.max(1, n)).toFixed(1);
    // Return single point for real-time display
    return [{ x: 0, v: avg, label: 'Nu' }];
  }, [sensorData, enabledMetrics]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <AmbientBg theme={theme} statusColor={statusColor} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'auto', padding: '100px 16px 110px' }}>
        {/* Header area */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.ink, letterSpacing: -0.6 }}>Trends</div>
          <div style={{ fontSize: 13, color: theme.inkSoft, marginTop: 3 }}>
            {proMode ? 'Bekijk elke sensor apart' : 'Hoe ging deze week in het algemeen'}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <TimeRangeSwitcher range={range} setRange={setRange} theme={theme} />
        </div>

        {/* Status summary card */}
        <Glass theme={theme} radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${statusColor}22`, color: statusColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={status.icon} size={20} color={statusColor} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: theme.inkSoft, fontWeight: 500 }}>Actuele luchtkwaliteit</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: statusColor, letterSpacing: -0.3 }}>
                {status.title}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.ink, letterSpacing: -0.3 }}>
                {avgData[0]?.v || 0}
              </div>
              <div style={{ fontSize: 10.5, color: theme.inkMuted, fontWeight: 500 }}>score</div>
            </div>
          </div>
        </Glass>

        {/* Algemene grafiek — altijd zichtbaar in normaal EN pro modus */}
        <Glass theme={theme} radius={22} style={{ padding: 16, marginBottom: proMode ? 10 : 0 }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, letterSpacing: -0.3 }}>
              Was het goed om buiten te zijn?
            </div>
            <div style={{ fontSize: 12, color: theme.inkSoft, marginTop: 3 }}>
              Gemiddelde van alle sensoren — lager = beter
            </div>
          </div>
          <LineChart data={avgData} color={statusColor} width={300} height={140} showLabels={true} theme={theme} />
          <div style={{
            display: 'flex', gap: 6, marginTop: 12, paddingTop: 12,
            borderTop: '0.5px solid rgba(0,0,0,0.08)',
          }}>
            {avgData.map((d, i) => {
              const lvl = d.v < 30 ? 1 : d.v < 60 ? 2 : d.v < 90 ? 3 : 4;
              const c = theme[`s${lvl}`];
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 24, borderRadius: 6, background: c,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 10, fontWeight: 700,
                  }}>{lvl <= 2 ? '✓' : '!'}</div>
                  <div style={{ fontSize: 10, color: theme.inkMuted, marginTop: 3, fontWeight: 600 }}>{d.label}</div>
                </div>
              );
            })}
          </div>
        </Glass>

        {proMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: theme.inkSoft, letterSpacing: 0.4, textTransform: 'uppercase', padding: '0 4px' }}>
              Per sensor
            </div>
            {cards.map(c => (
              <TrendCard key={c.k} metricKey={c.k} label={c.label} sub={c.sub} unit={c.unit} color={c.color}
                data={trendFor(c.k, statusLvl)} theme={theme} range={range} statusLvl={statusLvl} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { TrendsScreen });
