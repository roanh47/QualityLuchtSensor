// Main phone — navigeert tussen Overview / Trends / Profile, bevat nav header + tab bar
// en "Log symptoom" modal.

const TopBar = ({ theme, tab, statusLvl }) => {
  const status = STATUS_LEVELS[statusLvl - 1];
  const statusColor = theme[status.colorKey];
  const titles = { home: 'Hallo, Jan', trends: ' ', profile: ' ' };

  // Greeting wordt nu in de scroll-container van het scherm zelf gerenderd,
  // zodat hij netjes mee-scrollt en niet over content heen blijft staan.
  return null;
};

const SymptomModal = ({ open, onClose, theme }) => {
  const [selected, setSelected] = React.useState([]);
  const [intensity, setIntensity] = React.useState(2);
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(30px) saturate(200%)',
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: '18px 20px 40px', animation: 'slideUp .3s ease',
      }}>
        <div style={{
          width: 40, height: 4, borderRadius: 2,
          background: 'rgba(0,0,0,0.18)', margin: '0 auto 18px',
        }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: theme.ink, letterSpacing: -0.3 }}>
          Symptomen loggen
        </div>
        <div style={{ fontSize: 13, color: theme.inkSoft, marginTop: 4, marginBottom: 16 }}>
          Hoe voel je je nu?
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {SYMPTOMS.map(s => {
            const on = selected.includes(s.id);
            return (
              <div key={s.id} onClick={() => setSelected(on ? selected.filter(x => x !== s.id) : [...selected, s.id])}
                style={{
                  padding: '9px 14px', borderRadius: 18, fontSize: 14, fontWeight: 500,
                  cursor: 'pointer',
                  background: on ? theme.accent : 'rgba(255,255,255,0.6)',
                  color: on ? '#fff' : theme.ink,
                  border: `0.5px solid ${on ? theme.accent : 'rgba(0,0,0,0.08)'}`,
                  transition: 'all .15s',
                }}>
                {s.label}
              </div>
            );
          })}
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink, marginBottom: 8 }}>Intensiteit</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} onClick={() => setIntensity(i)} style={{
                flex: 1, padding: '10px 0', borderRadius: 12, textAlign: 'center',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: intensity >= i ? theme[STATUS_LEVELS[i-1].colorKey] : 'rgba(0,0,0,0.04)',
                color: intensity >= i ? '#fff' : theme.inkSoft,
                transition: 'all .15s',
              }}>
                {['Licht', 'Matig', 'Hoog', 'Zwaar'][i-1]}
              </div>
            ))}
          </div>
        </div>
        <div onClick={onClose} style={{
          padding: '14px 0', borderRadius: 16,
          background: theme.accent, color: '#fff',
          textAlign: 'center', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', boxShadow: `0 4px 16px ${theme.accent}40`,
        }}>
          Opslaan
        </div>
      </div>
    </div>
  );
};

// Complete phone-in-a-box app
const PhoneApp = ({ theme, themeKey, setThemeKey, statusLvl, setStatusLvl, proMode, setProMode, textScale, setTextScale, enabledMetrics, setEnabledMetrics, sensorData, initialTab = 'home' }) => {
  const [tab, setTab] = React.useState(initialTab);
  const [symptomOpen, setSymptomOpen] = React.useState(false);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', fontSize: `${textScale * 100}%`, maxWidth: '100%' }}>
      <TopBar theme={theme} tab={tab} statusLvl={statusLvl} />
      {tab === 'home' && (proMode
        ? <OverviewPro theme={theme} statusLvl={statusLvl} enabledMetrics={enabledMetrics} setTab={setTab} openSymptom={() => setSymptomOpen(true)} sensorData={sensorData} />
        : <OverviewNormal theme={theme} statusLvl={statusLvl} setTab={setTab} openSymptom={() => setSymptomOpen(true)} sensorData={sensorData} />
      )}
      {tab === 'trends' && <TrendsScreen theme={theme} statusLvl={statusLvl} enabledMetrics={enabledMetrics} proMode={proMode} sensorData={sensorData} />}
      {tab === 'profile' && <ProfileScreen theme={theme} statusLvl={statusLvl} proMode={proMode} setProMode={setProMode}
        enabledMetrics={enabledMetrics} setEnabledMetrics={setEnabledMetrics}
        currentTheme={themeKey} setThemeKey={setThemeKey}
        textScale={textScale} setTextScale={setTextScale} />}

      <TabBar tab={tab} setTab={setTab} theme={theme} />
      <SymptomModal open={symptomOpen} onClose={() => setSymptomOpen(false)} theme={theme} />
    </div>
  );
};

Object.assign(window, { PhoneApp, TopBar, SymptomModal });
