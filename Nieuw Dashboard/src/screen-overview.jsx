// Overview screen — home page met status + waarden

// Reactive localStorage hook — luistert naar een custom event + de native storage event
// zodat wijzigingen in het Profiel-scherm direct doorkomen op Overzicht.
function useStoredName() {
  const read = () => { try { return localStorage.getItem('zc-name') || 'Jan Dekker'; } catch { return 'Jan Dekker'; } };
  const [name, setName] = React.useState(read);
  React.useEffect(() => {
    const update = () => setName(read());
    window.addEventListener('zc-name-changed', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('zc-name-changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return name;
}

const StatusHero = ({ status, theme, proMode, metrics }) => {
  const statusColor = theme[status.colorKey];
  return (
    <Glass theme={theme} radius={28} style={{ padding: '20px 20px 22px', marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 14,
          background: `${statusColor}`, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 10px ${statusColor}50`,
        }}>
          <Icon name={status.icon} size={16} color="#fff" />
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: theme.inkSoft }}>
          Advies om naar buiten te gaan
        </div>
      </div>
      <div style={{
        fontSize: 38, fontWeight: 700, color: statusColor, letterSpacing: -0.8, lineHeight: 1.05,
      }}>{status.title}</div>
      <div style={{ fontSize: 15, color: theme.ink, marginTop: 8, lineHeight: 1.4, fontWeight: 500 }}>
        {status.advice}
      </div>
      {!proMode && (
        <div style={{ fontSize: 13, color: theme.inkSoft, marginTop: 6, lineHeight: 1.45 }}>
          {status.longAdvice}
        </div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginTop: 14,
        paddingTop: 12, borderTop: `0.5px solid rgba(0,0,0,0.08)`,
        fontSize: 11.5, color: theme.inkMuted, fontWeight: 500,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#3ba776', animation: 'pulse 2s infinite' }} />
          Live • laatste update 09:40
        </span>
        <span style={{ marginLeft: 'auto' }}>Apparaat verbonden</span>
      </div>
    </Glass>
  );
};

const MetricCard = ({ metric, theme, color, statusLvl, enabled = true, onToggle, showToggle = false }) => {
  const overLimit = metric.norm && metric.v > metric.norm;
  return (
    <Glass theme={theme} radius={22} style={{ padding: '14px 14px 12px', opacity: enabled ? 1 : 0.5, flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: theme.inkSoft, letterSpacing: 0.2 }}>
            {metric.label}
          </div>
          <div style={{ fontSize: 10, color: theme.inkMuted, marginTop: 1 }}>{metric.sub}</div>
        </div>
        {showToggle ? (
          <Toggle on={enabled} onChange={onToggle} theme={theme} size="sm" />
        ) : overLimit ? (
          <div style={{
            width: 18, height: 18, borderRadius: 9,
            background: `${color}22`, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="alert" size={11} color={color} strokeWidth={2.2} />
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
        <div style={{ fontSize: 26, fontWeight: 700, color: theme.ink, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
          {metric.v}
        </div>
        <div style={{ fontSize: 11, color: theme.inkSoft, fontWeight: 500 }}>{metric.unit}</div>
      </div>
      {metric.norm && (
        <div style={{ marginTop: 8 }}>
          <div style={{ height: 3, background: 'rgba(0,0,0,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${Math.min(100, (metric.v / metric.norm) * 100)}%`,
              background: color, borderRadius: 2, transition: 'width .4s',
            }} />
          </div>
          <div style={{ fontSize: 9.5, color: theme.inkMuted, marginTop: 3, fontWeight: 500 }}>
            grenswaarde {metric.norm} {metric.unit}
          </div>
        </div>
      )}
    </Glass>
  );
};

const SymptomRow = ({ theme, statusLvl, onAdd }) => (
  <Glass theme={theme} radius={22} style={{ padding: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>Symptomen vandaag</div>
        <div style={{ fontSize: 11.5, color: theme.inkSoft, marginTop: 2 }}>
          {statusLvl >= 3 ? 'Meer benauwd dan gisteren' : 'Stabiel — geen nieuwe klachten'}
        </div>
      </div>
      <div onClick={onAdd} style={{
        width: 30, height: 30, borderRadius: 15, background: theme.accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        boxShadow: `0 2px 8px ${theme.accent}50`,
      }}>
        <Icon name="plus" size={16} color="#fff" strokeWidth={2.4} />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {SYMPTOMS.slice(0, statusLvl >= 3 ? 3 : 2).map((s, i) => (
        <div key={s.id} style={{
          padding: '6px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
          background: 'rgba(255,255,255,0.5)', color: theme.ink,
          border: '0.5px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: i === 0 && statusLvl >= 3 ? theme.s4 : theme.s2 }} />
          {s.label}
        </div>
      ))}
    </div>
  </Glass>
);

const MiniTrend = ({ theme, statusLvl }) => {
  const data = trendFor('pm25', statusLvl);
  return (
    <Glass theme={theme} radius={22} style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>Luchtkwaliteit</div>
          <div style={{ fontSize: 11, color: theme.inkSoft, marginTop: 1 }}>laatste 7 dagen</div>
        </div>
        <div style={{ fontSize: 11, color: theme.inkSoft, fontWeight: 600 }}>PM2.5</div>
      </div>
      <LineChart data={data} color={theme.accent} width={300} height={90} showLabels={true} theme={theme} />
    </Glass>
  );
};

// NORMAL mode overview — groot status, 1 rustige kaart, actieknop
const OverviewNormal = ({ theme, statusLvl, setTab, openSymptom, sensorData }) => {
  const status = STATUS_LEVELS[statusLvl - 1];
  const statusColor = theme[status.colorKey];
  const userName = useStoredName();
  const firstName = userName.trim().split(/\s+/)[0] || 'Jan';

  // Get current time for display
  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
    }}>
      <AmbientBg theme={theme} statusColor={statusColor} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10, overflow: 'auto',
        padding: '60px 16px 110px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ padding: '4px 0 2px' }}>
          <div style={{ fontSize: 12, color: theme.inkSoft, fontWeight: 500 }}>Dinsdag 21 april</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: theme.ink, letterSpacing: -0.4, marginTop: 1 }}>Hallo, {firstName}</div>
        </div>
        <StatusHero status={status} theme={theme} proMode={false} metrics={{}} />

        {/* Alleen temperatuur als simpele contextuele info — geen fijnstof cijfers in Normaal modus */}
        <Glass theme={theme} radius={22} style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `${theme.accent}18`, color: theme.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="thermo" size={28} color={theme.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: theme.inkSoft, fontWeight: 500 }}>Buitentemperatuur</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: theme.ink, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>
                  {sensorData.temp.toFixed(1)}
                </div>
                <div style={{ fontSize: 14, color: theme.inkSoft, fontWeight: 500 }}>°C</div>
              </div>
              <div style={{ fontSize: 12, color: theme.inkSoft, marginTop: 2, lineHeight: 1.3 }}>
                {sensorData.temp < 8 ? 'Koud — draag een sjaal voor je mond.' :
                 sensorData.temp < 18 ? 'Mild — prettig om te wandelen.' :
                 'Aangenaam — geniet van buiten.'}
              </div>
            </div>
          </div>
        </Glass>

        <SymptomRow theme={theme} statusLvl={statusLvl} onAdd={openSymptom} />
      </div>
    </div>
  );
};

// PRO mode — alle ruwe waarden, sparklines, dichter geïnformeerd
const OverviewPro = ({ theme, statusLvl, enabledMetrics, setTab, openSymptom, sensorData }) => {
  const status = STATUS_LEVELS[statusLvl - 1];
  const statusColor = theme[status.colorKey];
  const userName = useStoredName();
  const firstName = userName.trim().split(/\s+/)[0] || 'Jan';

  // Create live metrics from real sensor data
  const metrics = {
    pm25: { v: sensorData.pm25, unit: 'µg/m³', norm: 25, label: 'PM2.5', sub: 'Fijnstof' },
    no2: { v: sensorData.pm10 * 0.5, unit: 'µg/m³', norm: 25, label: 'NO₂', sub: 'Stikstofdioxide' },  // Approximated from PM10
    temp: { v: sensorData.temp, unit: '°C', norm: 30, label: 'Temperatuur', sub: 'Buitenlucht' },
    hum: { v: sensorData.gas, unit: 'ppm', norm: 1000, label: 'Gas', sub: 'LPG/CO/NO2' },
  };
  const metricColors = {
    pm25: theme.s3,
    no2: theme.s4,
    temp: theme.accent,
    hum: theme.s1,
  };

  // Get current time for display
  const now = new Date();
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <AmbientBg theme={theme} statusColor={statusColor} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10, overflow: 'auto',
        padding: '60px 16px 110px', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ padding: '4px 0 2px' }}>
          <div style={{ fontSize: 12, color: theme.inkSoft, fontWeight: 500 }}>Dinsdag 21 april</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: theme.ink, letterSpacing: -0.4, marginTop: 1 }}>Hallo, {firstName}</div>
        </div>
        <StatusHero status={status} theme={theme} proMode={true} metrics={metrics} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.inkSoft, letterSpacing: 0.3, textTransform: 'uppercase' }}>
            Live metingen
          </div>
          <div style={{ fontSize: 11, color: theme.inkMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="refresh" size={11} color={theme.inkMuted} />
            {timeStr}
          </div>
        </div>

        {/* 2x2 grid metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {enabledMetrics.pm25 && <MetricCard metric={metrics.pm25} theme={theme} color={metricColors.pm25} statusLvl={statusLvl} />}
          {enabledMetrics.no2 && <MetricCard metric={metrics.no2} theme={theme} color={metricColors.no2} statusLvl={statusLvl} />}
          {enabledMetrics.temp && <MetricCard metric={metrics.temp} theme={theme} color={metricColors.temp} statusLvl={statusLvl} />}
          {enabledMetrics.gas && <MetricCard metric={metrics.hum} theme={theme} color={metricColors.hum} statusLvl={statusLvl} />}
        </div>

        <MiniTrend theme={theme} statusLvl={statusLvl} />

        <SymptomRow theme={theme} statusLvl={statusLvl} onAdd={openSymptom} />
      </div>
    </div>
  );
};

Object.assign(window, { OverviewNormal, OverviewPro, StatusHero, MetricCard, SymptomRow });
