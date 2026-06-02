// Profile screen — patient info, pro modus, waarden toggles, instellingen

const ProfileField = ({ label, value, theme, editable = true }) => (
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: theme.inkSoft, letterSpacing: 0.2, marginBottom: 6, textTransform: 'uppercase' }}>
      {label}
    </div>
    <div style={{
      padding: '10px 12px', borderRadius: 12,
      background: 'rgba(255,255,255,0.5)',
      border: '0.5px solid rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 14, color: theme.ink, fontWeight: 500,
    }}>
      <span>{value}</span>
      {editable && <Icon name="chevronDown" size={14} color={theme.inkMuted} />}
    </div>
  </div>
);

const MetricToggleRow = ({ label, sub, icon, color, enabled, onToggle, theme }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 4px',
  }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: `${color}18`, color: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={18} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>{label}</div>
      <div style={{ fontSize: 11.5, color: theme.inkSoft, marginTop: 1 }}>{sub}</div>
    </div>
    <Toggle on={enabled} onChange={onToggle} theme={theme} />
  </div>
);

const DeviceInfoModal = ({ open, onClose, theme }) => {
  if (!open) return null;
  const rows = [
    { label: 'Model', value: 'ZelfCheck Sensor v2' },
    { label: 'Serienummer', value: 'ZC-24-08472' },
    { label: 'Firmware', value: '1.4.2' },
    { label: 'Batterij', value: '78%' },
    { label: 'Verbinding', value: 'Wi-Fi · thuis' },
    { label: 'Laatste sync', value: '2 minuten geleden' },
    { label: 'Locatie', value: 'Woonkamer' },
    { label: 'Sensoren', value: 'PM2.5 · NO\u2082 · Temp · RH' },
  ];
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(30px) saturate(200%)',
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: '18px 20px 34px', animation: 'slideUp .3s ease',
        maxHeight: '85%', overflow: 'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.18)', margin: '0 auto 18px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${theme.s1}18`, color: theme.s1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="check" size={22} color={theme.s1} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: theme.ink, letterSpacing: -0.3 }}>ZelfCheck apparaat</div>
            <div style={{ fontSize: 12.5, color: theme.s1, fontWeight: 600, marginTop: 2 }}>● Verbonden</div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.55)', borderRadius: 16,
          border: '0.5px solid rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: 14,
        }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 14px',
              borderBottom: i < rows.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: theme.inkSoft, fontWeight: 500 }}>{r.label}</span>
              <span style={{ fontSize: 13.5, color: theme.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, color: theme.inkSoft, lineHeight: 1.5, padding: '0 4px 14px' }}>
          Het ZelfCheck apparaat meet elke 5 minuten de luchtkwaliteit in jouw omgeving. Plaats het op ooghoogte, weg van ramen en ventilatieroosters, voor de beste meting.
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            flex: 1, padding: '13px 0', borderRadius: 14,
            background: 'rgba(0,0,0,0.05)', color: theme.ink,
            textAlign: 'center', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Opnieuw koppelen</div>
          <div onClick={onClose} style={{
            flex: 1, padding: '13px 0', borderRadius: 14,
            background: theme.accent, color: '#fff',
            textAlign: 'center', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: `0 4px 14px ${theme.accent}40`,
          }}>Sluiten</div>
        </div>
      </div>
    </div>
  );
};

const ProfileScreen = ({ theme, statusLvl, proMode, setProMode, enabledMetrics, setEnabledMetrics, currentTheme, setThemeKey, textScale, setTextScale }) => {
  const status = STATUS_LEVELS[statusLvl - 1];
  const statusColor = theme[status.colorKey];
  const [age, setAge] = React.useState(() => {
    try { return localStorage.getItem('zc-age') || '68'; } catch { return '68'; }
  });
  const [goldStage, setGoldStage] = React.useState(() => {
    try { return localStorage.getItem('zc-gold') || 'GOLD 3'; } catch { return 'GOLD 3'; }
  });
  const [deviceOpen, setDeviceOpen] = React.useState(false);
  const [name, setName] = React.useState(() => {
    try { return localStorage.getItem('zc-name') || 'Jan Dekker'; } catch { return 'Jan Dekker'; }
  });
  const [editingName, setEditingName] = React.useState(false);
  const nameInputRef = React.useRef(null);
  React.useEffect(() => { try { localStorage.setItem('zc-age', age); } catch {} }, [age]);
  React.useEffect(() => { try { localStorage.setItem('zc-gold', goldStage); } catch {} }, [goldStage]);
  React.useEffect(() => {
    try { localStorage.setItem('zc-name', name); } catch {}
    try { window.dispatchEvent(new Event('zc-name-changed')); } catch {}
  }, [name]);
  React.useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const initials = (name.trim() || 'JD').split(/\s+/).map(p => p[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
  const commitName = () => {
    const trimmed = name.trim();
    if (!trimmed) setName('Jan Dekker');
    setEditingName(false);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <AmbientBg theme={theme} statusColor={statusColor} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, overflow: 'auto', padding: '100px 16px 110px' }}>

        {/* Header with avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: '0 4px' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 30,
            background: `linear-gradient(135deg, ${theme.accent}, ${statusColor})`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, letterSpacing: -0.5,
            boxShadow: `0 4px 14px ${theme.accent}40`,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <input
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                onBlur={commitName}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') commitName(); }}
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  background: 'rgba(255,255,255,0.7)',
                  borderRadius: 8, padding: '2px 8px', margin: '-2px 0 0 -8px',
                  fontSize: 22, fontWeight: 700, color: theme.ink, letterSpacing: -0.4,
                  fontFamily: 'inherit',
                  boxShadow: `0 0 0 1.5px ${theme.accent}`,
                }}
              />
            ) : (
              <div
                onClick={() => setEditingName(true)}
                style={{
                  fontSize: 22, fontWeight: 700, color: theme.ink, letterSpacing: -0.4,
                  cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >{name}</div>
            )}
            <div style={{ fontSize: 13, color: theme.inkSoft, marginTop: 1 }}>COPD {goldStage} • {age} jaar</div>
          </div>
          <div
            onClick={() => setEditingName(v => !v)}
            style={{
              width: 34, height: 34, borderRadius: 17,
              background: editingName ? theme.accent : 'rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '0.5px solid rgba(0,0,0,0.06)',
              cursor: 'pointer', flexShrink: 0,
            }}>
            <Icon name={editingName ? 'check' : 'edit'} size={16} color={editingName ? '#fff' : theme.inkSoft} />
          </div>
        </div>

        {/* Patient info */}
        <Glass theme={theme} radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.inkSoft, letterSpacing: 0.4, marginBottom: 12, textTransform: 'uppercase' }}>
            Patiëntgegevens
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {/* Leeftijd — invoerveld */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.inkSoft, letterSpacing: 0.2, marginBottom: 6, textTransform: 'uppercase' }}>
                Leeftijd
              </div>
              <div style={{
                padding: '6px 12px', borderRadius: 12,
                background: 'rgba(255,255,255,0.5)',
                border: '0.5px solid rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <input
                  type="number" min="0" max="120" value={age}
                  onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  style={{
                    flex: 1, width: '100%', border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 14, fontWeight: 600, color: theme.ink, padding: '4px 0',
                    fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
                  }}
                />
                <span style={{ fontSize: 13, color: theme.inkSoft, fontWeight: 500 }}>jaar</span>
              </div>
            </div>

            {/* COPD fase — dropdown */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.inkSoft, letterSpacing: 0.2, marginBottom: 6, textTransform: 'uppercase' }}>
                COPD fase
              </div>
              <div style={{
                padding: '0 12px', borderRadius: 12,
                background: 'rgba(255,255,255,0.5)',
                border: '0.5px solid rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', position: 'relative',
              }}>
                <select
                  value={goldStage}
                  onChange={(e) => setGoldStage(e.target.value)}
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    fontSize: 14, fontWeight: 600, color: theme.ink, padding: '10px 0',
                    fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="GOLD 1">GOLD 1</option>
                  <option value="GOLD 2">GOLD 2</option>
                  <option value="GOLD 3">GOLD 3</option>
                  <option value="GOLD 4">GOLD 4</option>
                </select>
                <Icon name="chevronDown" size={14} color={theme.inkMuted} />
              </div>
            </div>
          </div>
        </Glass>

        {/* Pro modus — de belangrijkste toggle uit de epic */}
        <Glass theme={theme} radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: `${theme.accent}18`, color: theme.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="settings" size={20} color={theme.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>Pro modus</div>
              <div style={{ fontSize: 11.5, color: theme.inkSoft, marginTop: 2, lineHeight: 1.35 }}>
                {proMode
                  ? 'Toon alle ruwe meetwaarden, grafieken en drempels.'
                  : 'Alleen status en eenvoudig advies. Aanbevolen.'}
              </div>
            </div>
            <Toggle on={proMode} onChange={setProMode} theme={theme} />
          </div>
        </Glass>

        {/* Waarden kiezen — altijd zichtbaar, zodat patiënt kan kiezen welke relevant zijn */}
        <Glass theme={theme} radius={22} style={{ padding: '10px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.inkSoft, letterSpacing: 0.4, marginTop: 4, marginBottom: 2, textTransform: 'uppercase' }}>
            Waarden voor jou
          </div>
          <div style={{ fontSize: 11.5, color: theme.inkSoft, padding: '0 4px 8px', lineHeight: 1.35 }}>
            Kies welke metingen voor jouw situatie van toepassing zijn.
          </div>
            <MetricToggleRow label="PM2.5" sub="Fijnstof" icon="dust" color={theme.s3}
              enabled={enabledMetrics.pm25} onToggle={(v) => setEnabledMetrics({ ...enabledMetrics, pm25: v })} theme={theme} />
            <div style={{ height: 0.5, background: 'rgba(0,0,0,0.06)' }} />
            <MetricToggleRow label="NO₂" sub="Stikstofdioxide" icon="wind" color={theme.s4}
              enabled={enabledMetrics.no2} onToggle={(v) => setEnabledMetrics({ ...enabledMetrics, no2: v })} theme={theme} />
            <div style={{ height: 0.5, background: 'rgba(0,0,0,0.06)' }} />
            <MetricToggleRow label="Temperatuur" sub="Buitenlucht" icon="thermo" color={theme.accent}
              enabled={enabledMetrics.temp} onToggle={(v) => setEnabledMetrics({ ...enabledMetrics, temp: v })} theme={theme} />
            <div style={{ height: 0.5, background: 'rgba(0,0,0,0.06)' }} />
          <MetricToggleRow label="Gas" sub="LPG/CO/NO2" icon="wind" color={theme.s1}
            enabled={enabledMetrics.gas} onToggle={(v) => setEnabledMetrics({ ...enabledMetrics, gas: v })} theme={theme} />
        </Glass>

        {/* Toegankelijkheid — verborgen, blok 'Weergave' per wens verwijderd */}
        {false && (
        <Glass theme={theme} radius={22} style={{ padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.inkSoft, letterSpacing: 0.4, marginBottom: 10, textTransform: 'uppercase' }}>
            Weergave
          </div>

          {/* Thema picker */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink, marginBottom: 8 }}>Kleurthema</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(THEMES).map(([key, t]) => (
                <div key={key} onClick={() => setThemeKey(key)}
                  style={{
                    flex: 1, padding: 2, borderRadius: 14,
                    border: currentTheme === key ? `1.5px solid ${theme.accent}` : '1.5px solid transparent',
                    cursor: 'pointer', transition: 'border-color .15s',
                  }}>
                  <div style={{
                    height: 44, borderRadius: 11, position: 'relative', overflow: 'hidden',
                    background: `linear-gradient(135deg, ${t.bgA}, ${t.bgB}, ${t.bgC})`,
                  }}>
                    <div style={{
                      position: 'absolute', top: 6, left: 6, right: 6, bottom: 6,
                      borderRadius: 7, background: 'rgba(255,255,255,0.45)',
                      backdropFilter: 'blur(8px)',
                      border: '0.5px solid rgba(255,255,255,0.8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9.5, fontWeight: 600, color: t.ink,
                    }}>{t.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tekstgrootte */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>Tekstgrootte</div>
              <div style={{ fontSize: 12, color: theme.inkSoft, fontWeight: 500 }}>{Math.round(textScale * 100)}%</div>
            </div>
            <input type="range" min="0.9" max="1.3" step="0.05" value={textScale}
              onChange={(e) => setTextScale(+e.target.value)}
              style={{ width: '100%', accentColor: theme.accent }} />
          </div>
        </Glass>
        )}

        {/* Apparaat — klikbaar, opent info modal */}
        <Glass theme={theme} radius={22} style={{ padding: 14, cursor: 'pointer' }} onClick={() => setDeviceOpen(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${theme.s1}18`, color: theme.s1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="check" size={18} color={theme.s1} strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>ZelfCheck apparaat</div>
              <div style={{ fontSize: 11.5, color: theme.inkSoft, marginTop: 1 }}>Verbonden • Batterij 78%</div>
            </div>
            <Icon name="chevron" size={16} color={theme.inkMuted} />
          </div>
        </Glass>
      </div>
      <DeviceInfoModal open={deviceOpen} onClose={() => setDeviceOpen(false)} theme={theme} />
    </div>
  );
};

Object.assign(window, { ProfileScreen });
