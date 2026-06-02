// Glass primitives — liquid glass kaarten, pillen, knoppen.
// Elke kaart bestaat uit: blurred bg + subtle inner highlight + border.

const Glass = ({ children, style = {}, theme, radius = 24, intensity = 1, onClick }) => (
  <div onClick={onClick} style={{
    position: 'relative',
    borderRadius: radius,
    background: theme.glassBg,
    backdropFilter: `blur(${22 * intensity}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${22 * intensity}px) saturate(180%)`,
    boxShadow: theme.glassShadow,
    border: `0.5px solid ${theme.glassBorder}`,
    ...style,
  }}>
    {/* top highlight */}
    <div style={{
      position: 'absolute', top: 0, left: 8, right: 8, height: 1,
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
      borderRadius: 1, pointerEvents: 'none',
    }} />
    {children}
  </div>
);

// A softer bottom sheet-style glass (more prominent blur, stronger vibrance)
const GlassSheet = ({ children, style = {}, theme, radius = 32 }) => (
  <div style={{
    position: 'relative',
    borderRadius: radius,
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(30px) saturate(200%)',
    WebkitBackdropFilter: 'blur(30px) saturate(200%)',
    boxShadow: '0 -1px 0 rgba(255,255,255,0.6) inset, 0 20px 60px rgba(0,0,0,0.1)',
    border: `0.5px solid ${theme.glassBorder}`,
    ...style,
  }}>{children}</div>
);

// The ambient gradient background that "liquid glass" sits on top of.
// Has soft animated blobs to make blur effects visible.
const AmbientBg = ({ theme, statusColor }) => (
  <div style={{
    position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0,
    background: `linear-gradient(180deg, ${theme.bgA}, ${theme.bgB} 60%, ${theme.bgC})`,
  }}>
    <div style={{
      position: 'absolute', top: -60, right: -80, width: 280, height: 280, borderRadius: '50%',
      background: `radial-gradient(circle, ${statusColor}50, transparent 70%)`,
      filter: 'blur(30px)',
    }} />
    <div style={{
      position: 'absolute', bottom: 100, left: -60, width: 240, height: 240, borderRadius: '50%',
      background: `radial-gradient(circle, ${theme.accent}35, transparent 70%)`,
      filter: 'blur(40px)',
    }} />
    <div style={{
      position: 'absolute', top: '40%', left: '30%', width: 180, height: 180, borderRadius: '50%',
      background: `radial-gradient(circle, ${theme.bgC}aa, transparent 70%)`,
      filter: 'blur(30px)',
    }} />
  </div>
);

// Toggle — liquid glass iOS-style
const Toggle = ({ on, onChange, theme, size = 'md' }) => {
  const W = size === 'sm' ? 40 : 50;
  const H = size === 'sm' ? 24 : 30;
  const K = H - 4;
  return (
    <div onClick={() => onChange && onChange(!on)}
      style={{
        width: W, height: H, borderRadius: H / 2, cursor: 'pointer', position: 'relative',
        background: on ? theme.accent : 'rgba(120,120,128,0.22)',
        transition: 'background .22s ease', flexShrink: 0,
        boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.06)',
      }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? W - K - 2 : 2,
        width: K, height: K, borderRadius: '50%', background: '#fff',
        transition: 'left .22s cubic-bezier(.3,1.4,.5,1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(0,0,0,0.04)',
      }} />
    </div>
  );
};

// Segmented control (Normaal / Pro)
const Segmented = ({ options, value, onChange, theme }) => (
  <div style={{
    display: 'inline-flex', background: 'rgba(120,120,128,0.14)',
    borderRadius: 10, padding: 2, gap: 2, position: 'relative',
  }}>
    {options.map(o => (
      <div key={o.value} onClick={() => onChange(o.value)}
        style={{
          padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'all .18s',
          background: value === o.value ? '#fff' : 'transparent',
          color: value === o.value ? theme.ink : theme.inkSoft,
          boxShadow: value === o.value ? '0 1px 3px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)' : 'none',
        }}>
        {o.label}
      </div>
    ))}
  </div>
);

// Tab bar — bottom, floating glass with 3 icons
const TabBar = ({ tab, setTab, theme }) => {
  const items = [
    { id: 'home',    label: 'Overzicht', icon: 'home' },
    { id: 'trends',  label: 'Trends',    icon: 'trend' },
    { id: 'profile', label: 'Profiel',   icon: 'user' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 22, left: 20, right: 20, zIndex: 40,
      display: 'flex',
    }}>
      <Glass theme={theme} radius={28} style={{ flex: 1, padding: '6px 6px', display: 'flex' }}>
        {items.map(it => {
          const active = tab === it.id;
          return (
            <div key={it.id} onClick={() => setTab(it.id)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 2, padding: '8px 0', borderRadius: 22,
                cursor: 'pointer', color: active ? theme.accent : theme.inkSoft,
                background: active ? 'rgba(255,255,255,0.65)' : 'transparent',
                transition: 'all .2s',
              }}>
              <Icon name={it.icon} size={22} />
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.1 }}>{it.label}</div>
            </div>
          );
        })}
      </Glass>
    </div>
  );
};

// Mini sparkline / ring
const Ring = ({ v, max, color, size = 56, stroke = 5, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, v / max);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(0,0,0,0.07)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
};

// Sparkline (tiny)
const Sparkline = ({ data, color, width = 80, height = 26 }) => {
  if (!data || data.length === 0) return null;
  const vs = data.map(d => d.v);
  const mn = Math.min(...vs), mx = Math.max(...vs);
  const pad = 2;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - pad*2) + pad;
    const y = height - pad - ((d.v - mn) / Math.max(0.01, mx - mn)) * (height - pad*2);
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const areaPath = path + ` L${pts[pts.length-1][0]},${height} L${pts[0][0]},${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sp-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.3"/>
          <stop offset="1" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sp-${color.replace('#','')})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Line chart (bigger, for trends screen) — responsive via viewBox
const LineChart = ({ data, color, width = 300, height = 140, showLabels = true, theme }) => {
  if (!data || data.length === 0) return null;
  const vs = data.map(d => d.v);
  const mn = Math.min(...vs) * 0.9;
  const mx = Math.max(...vs) * 1.05;
  const padL = 2, padR = 2, padT = 14, padB = showLabels ? 24 : 6;
  const pts = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * (width - padL - padR);
    const y = padT + (1 - (d.v - mn) / Math.max(0.01, mx - mn)) * (height - padT - padB);
    return [x, y, d];
  });
  const path = pts.map((p, i) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const prev = pts[i-1];
    const cx1 = prev[0] + (p[0] - prev[0]) / 2;
    return `Q${cx1},${prev[1]} ${(prev[0]+p[0])/2},${(prev[1]+p[1])/2} T${p[0]},${p[1]}`;
  }).join(' ');
  const area = path + ` L${pts[pts.length-1][0]},${height - padB} L${pts[0][0]},${height - padB} Z`;
  const gid = `ln-${color.replace('#','')}-${Math.round(width)}-${Math.round(height)}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
      style={{ display: 'block', width: '100%', height, overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35"/>
          <stop offset="1" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={0} x2={width} y1={padT + f*(height-padT-padB)} y2={padT + f*(height-padT-padB)}
          stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4"/>
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="4" fill="#fff" stroke={color} strokeWidth="2"/>
      {showLabels && pts.map((p, i) => (
        <text key={i} x={p[0]} y={height - 6} fontSize="10" textAnchor="middle" fill={theme.inkMuted}
          fontFamily="-apple-system, system-ui">{p[2].label}</text>
      ))}
    </svg>
  );
};

Object.assign(window, { Glass, GlassSheet, AmbientBg, Toggle, Segmented, TabBar, Ring, Sparkline, LineChart });
