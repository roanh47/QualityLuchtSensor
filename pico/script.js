(function() {
  var state = {
    tab: 'overzicht',
    themeKey: 'sky',
    proMode: false,
    statusLvl: 2,
    prevStatusLvl: 2,
    sensorData: { pm25: 0, pm10: 0, temp: 0, gas: 0 },
    enabledMetrics: { pm25: true, pm10: true, temp: true, gas: true },
    selectedSymptoms: [],
    goldPhase: 'GOLD 3',
    worseningAlert: false,
  };

  var theme = THEMES[state.themeKey];
  applyTheme();

  function applyTheme() {
    theme = THEMES[state.themeKey];
    var t = theme;
    document.body.style.setProperty('--bg-a', t.bgA);
    document.body.style.setProperty('--bg-b', t.bgB);
    document.body.style.setProperty('--bg-c', t.bgC);
    document.body.style.setProperty('--ink', t.ink);
    document.body.style.setProperty('--ink-soft', t.inkSoft);
    document.body.style.setProperty('--ink-muted', t.inkMuted);
    document.body.style.setProperty('--glass-bg', t.glassBg);
    document.body.style.setProperty('--glass-border', t.glassBorder);
    document.body.style.setProperty('--accent', t.accent);
    document.body.style.setProperty('--s1', t.s1);
    document.body.style.setProperty('--s2', t.s2);
    document.body.style.setProperty('--s3', t.s3);
    document.body.style.setProperty('--s4', t.s4);
    document.body.style.setProperty('--s5', t.s5);
    document.getElementById('ambient-bg').style.background = 'linear-gradient(180deg,' + t.bgA + ',' + t.bgB + ' 60%,' + t.bgC + ')';
    document.querySelectorAll('.theme-btn').forEach(function(b) { b.classList.remove('active'); });
    var btn = document.querySelector('.theme-btn-' + state.themeKey);
    if (btn) btn.classList.add('active');
  }

  function showPage(name) {
    state.tab = name;
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
    var pg = document.getElementById('page-' + name);
    if (pg) pg.classList.add('active');
    var navBtn = document.querySelector('[data-page="' + name + '"]');
    if (navBtn) navBtn.classList.add('active');
    renderNavIcons();
    if (name === 'trends') renderTrendChart();
    updateDateDisplay();
  }

  function renderNavIcons() {
    document.getElementById('nav-home').innerHTML = Icon('home', 22, state.tab === 'overzicht' ? theme.accent : 'currentColor');
    document.getElementById('nav-trends').innerHTML = Icon('trend', 22, state.tab === 'trends' ? theme.accent : 'currentColor');
    document.getElementById('nav-profile').innerHTML = Icon('user', 22, state.tab === 'profiel' ? theme.accent : 'currentColor');
  }

  function updateDateDisplay() {
    var days = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
    var months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
    var now = new Date();
    var d = days[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()];
    var el = document.getElementById('greeting-date');
    if (el) el.textContent = d;
    var el2 = document.getElementById('trends-date');
    if (el2) el2.textContent = d;
  }

  function loadProfile() {
    fetch('/settings')
      .then(function(r) { return r.json(); })
      .then(function(s) {
        document.getElementById('input-name').value = s.naam || '';
        document.getElementById('input-age').value = s.leeftijd || '50 jaar';
        document.getElementById('input-copd').value = s.copd || 'GOLD 3';
        document.getElementById('display-name').textContent = s.naam || 'Patient';
        document.getElementById('toggle-pro').checked = s.promode === true;
        state.proMode = s.promode === true;
        state.themeKey = s.themekey || 'sky';
        state.goldPhase = s.copd || 'GOLD 3';
        state.enabledMetrics.pm25 = s.showpm25 !== false;
        state.enabledMetrics.pm10 = s.showpm10 !== false;
        state.enabledMetrics.temp = s.showtemp !== false;
        state.enabledMetrics.gas = s.showgas !== false;
        state.selectedSymptoms = s.symptoms || [];
        document.getElementById('show-pm25').checked = s.showpm25 !== false;
        document.getElementById('show-pm10').checked = s.showpm10 !== false;
        document.getElementById('show-temp').checked = s.showtemp !== false;
        document.getElementById('show-gas').checked = s.showgas !== false;
        applyTheme();
        updateThresholds();
        updateUI();
      })
      .catch(function() {
        document.getElementById('input-name').value = '';
        document.getElementById('input-age').value = '50 jaar';
        document.getElementById('input-copd').value = 'GOLD 3';
        document.getElementById('display-name').textContent = 'Patient';
        document.getElementById('toggle-pro').checked = false;
        state.proMode = false;
        state.themeKey = 'sky';
        state.goldPhase = 'GOLD 3';
        state.enabledMetrics = { pm25: true, pm10: true, temp: true, gas: true };
        state.selectedSymptoms = [];
        document.getElementById('show-pm25').checked = true;
        document.getElementById('show-pm10').checked = true;
        document.getElementById('show-temp').checked = true;
        document.getElementById('show-gas').checked = true;
        applyTheme();
        updateThresholds();
        updateUI();
      });
  }

  function saveProfile() {
    var naam = document.getElementById('input-name').value.trim();
    var data = {
      naam: naam,
      leeftijd: document.getElementById('input-age').value,
      copd: document.getElementById('input-copd').value,
      promode: state.proMode,
      themekey: state.themeKey,
      showpm25: state.enabledMetrics.pm25,
      showpm10: state.enabledMetrics.pm10,
      showtemp: state.enabledMetrics.temp,
      showgas: state.enabledMetrics.gas,
      symptoms: state.selectedSymptoms
    };
    fetch('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function() {
      document.getElementById('display-name').textContent = naam || 'Patient';
      showPage('overzicht');
    }).catch(function() {
      document.getElementById('display-name').textContent = naam || 'Patient';
      showPage('overzicht');
    });
  }

  function updateThresholds() {
    var t = GOLD_THRESHOLDS[state.goldPhase] || GOLD_THRESHOLDS['GOLD 3'];
    document.getElementById('thresh-green').textContent = '< ' + t.green;
    document.getElementById('thresh-yellow').textContent = t.green + ' – ' + t.yellow;
    document.getElementById('thresh-orange').textContent = t.yellow + ' – ' + t.orange;
    document.getElementById('thresh-red').textContent = t.orange + ' – ' + t.red;
    document.getElementById('thresh-purple').textContent = '> ' + t.red;
  }

  function updateVisibility() {
    var metricsSection = document.getElementById('metrics-section');
    metricsSection.style.display = state.proMode ? 'block' : 'none';
    document.getElementById('card-pm25').style.display = state.enabledMetrics.pm25 ? 'block' : 'none';
    document.getElementById('card-pm10').style.display = state.enabledMetrics.pm10 ? 'block' : 'none';
    document.getElementById('card-temp').style.display = state.enabledMetrics.temp ? 'block' : 'none';
    document.getElementById('card-gas').style.display = state.enabledMetrics.gas ? 'block' : 'none';
  }

  function updateUI() {
    var status = STATUS_LEVELS[state.statusLvl - 1];
    var statusColor = theme[status.colorKey];
    var now = new Date();
    var timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    document.getElementById('status-title').textContent = status.title;
    document.getElementById('status-title').style.color = statusColor;
    document.getElementById('status-advice').textContent = status.advice;
    document.getElementById('status-icon-wrap').innerHTML = Icon(status.icon, 16, '#fff');
    document.getElementById('status-icon-wrap').style.background = statusColor + '50';
    document.getElementById('update-time').textContent = timeStr;

    var alertBanner = document.getElementById('worsening-alert');
    if (state.worseningAlert && alertBanner) {
      alertBanner.style.display = 'block';
      alertBanner.textContent = 'Lucht wordt slechter, ga naar binnen';
    } else if (alertBanner) {
      alertBanner.style.display = 'none';
    }

    updateVisibility();

    document.getElementById('temp-m-display').textContent = state.sensorData.temp.toFixed(1);
    document.getElementById('temp-hint-pro').textContent = getTempHint(state.sensorData.temp);

    document.getElementById('pm25-display').textContent = state.sensorData.pm25.toFixed(1);
    var pct25 = Math.min(100, (state.sensorData.pm25 / 25) * 100);
    document.getElementById('bar-pm25').style.width = pct25 + '%';

    document.getElementById('pm10-display').textContent = state.sensorData.pm10.toFixed(1);
    var pct10 = Math.min(100, (state.sensorData.pm10 / 50) * 100);
    document.getElementById('bar-pm10').style.width = pct10 + '%';

    document.getElementById('gas-display').textContent = state.sensorData.gas.toFixed(0);
    var pctGas = Math.min(100, (state.sensorData.gas / 1000) * 100);
    document.getElementById('bar-gas').style.width = pctGas + '%';

    updateThresholdDisplay();

    var symSub = document.getElementById('symptom-sub');
    if (symSub) symSub.textContent = state.statusLvl >= 3 ? 'Meer benauwd dan gisteren' : 'Stabiel — geen nieuwe klachten';

    renderSymptoms();
  }

  function updateThresholdDisplay() {
    var t = GOLD_THRESHOLDS[state.goldPhase] || GOLD_THRESHOLDS['GOLD 3'];
    document.getElementById('norm-pm25').textContent = 'geel ' + t.yellow + ' | oranje ' + t.orange + ' | rood ' + t.red + ' µg/m³';
    document.getElementById('norm-pm10').textContent = 'WHO 24u grens 45 µg/m³';
    document.getElementById('norm-gas').textContent = 'grens 1000 ppm';
  }

  function getTempHint(temp) {
    if (temp < 8) return 'Koud — draag een sjaal voor je mond.';
    if (temp < 18) return 'Mild — prettig om te wandelen.';
    return 'Aangenaam — geniet van buiten.';
  }

  function renderSymptoms() {
    var container = document.getElementById('symptom-tags');
    if (!container) return;
    var count = state.statusLvl >= 3 ? 3 : 2;
    var html = '';
    for (var i = 0; i < count && i < SYMPTOMS.length; i++) {
      var s = SYMPTOMS[i];
      html += '<div class="symptom-tag"><span class="symptom-tag-dot" style="background:' + (i === 0 && state.statusLvl >= 3 ? theme.s4 : theme.s2) + '"></span>' + s.label + '</div>';
    }
    container.innerHTML = html;
  }

  function renderSymptomPills() {
    var container = document.getElementById('symptom-pills');
    if (!container) return;
    var html = '';
    SYMPTOMS.forEach(function(s) {
      var sel = state.selectedSymptoms.indexOf(s.id) !== -1;
      html += '<div class="symptom-pill' + (sel ? ' selected' : '') + '" data-id="' + s.id + '">' + s.label + '</div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.symptom-pill').forEach(function(p) {
      p.addEventListener('click', function() {
        var id = p.getAttribute('data-id');
        var idx = state.selectedSymptoms.indexOf(id);
        if (idx === -1) state.selectedSymptoms.push(id);
        else state.selectedSymptoms.splice(idx, 1);
        p.classList.toggle('selected', state.selectedSymptoms.indexOf(id) !== -1);
      });
    });
  }

  function renderThemeButtons() {
    var container = document.getElementById('theme-options');
    if (!container) return;
    var html = '';
    ['sky', 'forest', 'dusk'].forEach(function(key) {
      html += '<div class="theme-btn theme-btn-' + key + (state.themeKey === key ? ' active' : '') + '" data-theme="' + key + '"></div>';
    });
    container.innerHTML = html;
    container.querySelectorAll('.theme-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        state.themeKey = b.getAttribute('data-theme');
        applyTheme();
        updateUI();
      });
    });
  }

  function fetchStatus() {
    fetch('/status')
      .then(function(r) {
        console.log('status response:', r.status);
        return r.json();
      })
      .then(function(d) {
        console.log('status data:', JSON.stringify(d));
        state.sensorData = {
          pm25: d.pm25 || 0,
          pm10: d.pm10 || 0,
          temp: d.temp || 0,
          gas: d.gas || 0
        };
        state.prevStatusLvl = state.statusLvl;
        state.statusLvl = d.statusLevel || 1;
        console.log('level:', state.statusLvl, 'pm25:', state.sensorData.pm25, 'temp:', state.sensorData.temp);
        if (state.statusLvl > state.prevStatusLvl && state.prevStatusLvl > 0) {
          state.worseningAlert = true;
          setTimeout(function() { state.worseningAlert = false; updateUI(); }, 10000);
        }
        pushTrend(state.sensorData.pm25);
        updateUI();
      })
      .catch(function(err) {
        console.error('fetchStatus error:', err);
        state.sensorData = { pm25: 0, pm10: 0, temp: 0, gas: 0 };
        updateUI();
      });
  }

  var trendData = { pm25: [] };
  var MAX_TREND = 30;

  function pushTrend(pm25v) {
    trendData.pm25.push(pm25v);
    if (trendData.pm25.length > MAX_TREND) trendData.pm25.shift();
  }

  function makePath(values, maxVal, W, H, pad) {
    if (values.length < 2) return '';
    var pts = values.map(function(v, i) {
      var xPos = pad + (i / (MAX_TREND - 1)) * (W - 2 * pad);
      var yPos = H - pad - (v / maxVal) * (H - 2 * pad);
      return xPos.toFixed(1) + ',' + yPos.toFixed(1);
    });
    return 'M' + pts.join('L');
  }

  function renderTrendChart() {
    var el = document.getElementById('trend-chart');
    if (!el || trendData.pm25.length < 2) return;
    var W = 300, H = 100, pad = 6;
    var maxVal = Math.max(50, Math.max.apply(null, trendData.pm25));
    var threshY = (H - pad - (25 / maxVal) * (H - 2 * pad)).toFixed(1);
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'
      + '<line x1="' + pad + '" y1="' + threshY + '" x2="' + (W - pad) + '" y2="' + threshY + '" stroke="#ff6b6b" stroke-width="1" stroke-dasharray="4,3"/>'
      + '<path d="' + makePath(trendData.pm25, maxVal, W, H, pad) + '" fill="none" stroke="' + theme.accent + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
      + '</svg>';
  }

  document.getElementById('bottom-nav').addEventListener('click', function(e) {
    var btn = e.target.closest('.nav-item');
    if (btn) showPage(btn.getAttribute('data-page'));
  });

  document.getElementById('input-copd').addEventListener('change', function(e) {
    state.goldPhase = e.target.value;
    updateThresholds();
  });

  document.getElementById('toggle-pro').addEventListener('change', function(e) {
    state.proMode = e.target.checked;
    updateVisibility();
    updateUI();
  });

  document.getElementById('show-pm25').addEventListener('change', function(e) {
    state.enabledMetrics.pm25 = e.target.checked;
    updateVisibility();
  });

  document.getElementById('show-pm10').addEventListener('change', function(e) {
    state.enabledMetrics.pm10 = e.target.checked;
    updateVisibility();
  });

  document.getElementById('show-temp').addEventListener('change', function(e) {
    state.enabledMetrics.temp = e.target.checked;
    updateVisibility();
  });

  document.getElementById('show-gas').addEventListener('change', function(e) {
    state.enabledMetrics.gas = e.target.checked;
    updateVisibility();
  });

  document.getElementById('save-btn').addEventListener('click', saveProfile);

  document.getElementById('symptom-add-btn').addEventListener('click', function() {
    state.selectedSymptoms = [];
    renderSymptomPills();
    document.getElementById('symptom-modal').style.display = 'flex';
  });

  document.getElementById('modal-save').addEventListener('click', function() {
    document.getElementById('symptom-modal').style.display = 'none';
  });

  document.getElementById('symptom-modal').addEventListener('click', function(e) {
    if (e.target === this) document.getElementById('symptom-modal').style.display = 'none';
  });

  loadProfile();
  renderThemeButtons();
  renderNavIcons();
  updateDateDisplay();
  updateUI();
  fetchStatus();
  setInterval(fetchStatus, 5000);

})();
