(function() {
  var state = {
    tab: 'overzicht',
    themeKey: 'sky',
    proMode: false,
    statusLvl: 2,
    sensorData: { pm25: 0, pm10: 0, temp: 0, gas: 0 },
    enabledMetrics: { pm25: true, pm10: true, temp: true, gas: true },
    selectedSymptoms: [],
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
    try {
      var naam = localStorage.getItem('naam') || '';
      var leeftijd = localStorage.getItem('leeftijd') || '50 jaar';
      var copd = localStorage.getItem('copd') || 'GOLD 3';
      var pro = localStorage.getItem('promode') === 'true';
      var themekey = localStorage.getItem('themekey') || 'sky';
      var pm25On = localStorage.getItem('showpm25') !== 'false';
      var pm10On = localStorage.getItem('showpm10') !== 'false';
      var tempOn = localStorage.getItem('showtemp') !== 'false';
      var gasOn = localStorage.getItem('showgas') !== 'false';
      document.getElementById('input-name').value = naam;
      document.getElementById('input-age').value = leeftijd;
      document.getElementById('input-copd').value = copd;
      document.getElementById('display-name').textContent = naam || 'Patient';
      document.getElementById('toggle-pro').checked = pro;
      state.proMode = pro;
      state.themeKey = themekey;
      state.enabledMetrics.pm25 = pm25On;
      state.enabledMetrics.pm10 = pm10On;
      state.enabledMetrics.temp = tempOn;
      state.enabledMetrics.gas = gasOn;
      document.getElementById('show-pm25').checked = pm25On;
      document.getElementById('show-pm10').checked = pm10On;
      document.getElementById('show-temp').checked = tempOn;
      document.getElementById('show-gas').checked = gasOn;
      applyTheme();
    } catch(e) {}
  }

  function saveProfile() {
    var naam = document.getElementById('input-name').value.trim();
    try {
      localStorage.setItem('naam', naam);
      localStorage.setItem('leeftijd', document.getElementById('input-age').value);
      localStorage.setItem('copd', document.getElementById('input-copd').value);
      localStorage.setItem('promode', state.proMode);
      localStorage.setItem('themekey', state.themeKey);
      localStorage.setItem('showpm25', state.enabledMetrics.pm25);
      localStorage.setItem('showpm10', state.enabledMetrics.pm10);
      localStorage.setItem('showtemp', state.enabledMetrics.temp);
      localStorage.setItem('showgas', state.enabledMetrics.gas);
    } catch(e) {}
    document.getElementById('display-name').textContent = naam || 'Patient';
    showPage('overzicht');
  }

  function updateUI() {
    var status = STATUS_LEVELS[state.statusLvl - 1];
    var statusColor = theme[status.colorKey];
    var now = new Date();
    var timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    document.getElementById('status-title').textContent = status.title;
    document.getElementById('status-title').style.color = statusColor;
    document.getElementById('status-advice').textContent = status.advice;
    document.getElementById('status-icon-wrap').innerHTML = Icon('sun', 16, '#fff');
    document.getElementById('status-icon-wrap').style.background = statusColor + '50';
    document.getElementById('update-time').textContent = timeStr;

    document.getElementById('temp-display').textContent = state.sensorData.temp.toFixed(1);
    document.getElementById('temp-m-display').textContent = state.sensorData.temp.toFixed(1);
    document.getElementById('temp-hint').textContent = getTempHint(state.sensorData.temp);

    document.getElementById('pm25-display').textContent = state.sensorData.pm25.toFixed(1);
    var pct25 = Math.min(100, (state.sensorData.pm25 / 25) * 100);
    document.getElementById('bar-pm25').style.width = pct25 + '%';

    document.getElementById('pm10-display').textContent = state.sensorData.pm10.toFixed(1);
    var pct10 = Math.min(100, (state.sensorData.pm10 / 25) * 100);
    document.getElementById('bar-pm10').style.width = pct10 + '%';

    document.getElementById('gas-display').textContent = state.sensorData.gas.toFixed(0);
    var pctGas = Math.min(100, (state.sensorData.gas / 1000) * 100);
    document.getElementById('bar-gas').style.width = pctGas + '%';

    document.getElementById('temp-icon').innerHTML = Icon('thermo', 28, theme.accent);

    var symSub = document.getElementById('symptom-sub');
    if (symSub) symSub.textContent = state.statusLvl >= 3 ? 'Meer benauwd dan gisteren' : 'Stabiel — geen nieuwe klachten';

    var metricsSection = document.getElementById('metrics-section');
    metricsSection.style.display = state.proMode ? 'block' : 'none';

    renderSymptoms();
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
    fetch('http://192.168.4.1/status')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        state.sensorData = {
          pm25: d.pm25 || 0,
          pm10: d.pm10 || 0,
          temp: d.temp || 0,
          gas: d.gas || 0
        };
        if (d.pm25 >= 25) state.statusLvl = 4;
        else if (d.pm25 >= 15) state.statusLvl = 3;
        else if (d.pm25 >= 10) state.statusLvl = 2;
        else state.statusLvl = 1;
        pushTrend(state.sensorData.pm25);
        updateUI();
      })
      .catch(function() {
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

  document.getElementById('toggle-pro').addEventListener('change', function(e) {
    state.proMode = e.target.checked;
    updateUI();
  });

  document.getElementById('show-pm25').addEventListener('change', function(e) {
    state.enabledMetrics.pm25 = e.target.checked;
  });

  document.getElementById('show-pm10').addEventListener('change', function(e) {
    state.enabledMetrics.pm10 = e.target.checked;
  });

  document.getElementById('show-temp').addEventListener('change', function(e) {
    state.enabledMetrics.temp = e.target.checked;
  });

  document.getElementById('show-gas').addEventListener('change', function(e) {
    state.enabledMetrics.gas = e.target.checked;
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