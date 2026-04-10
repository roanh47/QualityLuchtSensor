// ── Page navigation ──────────────────────────────────────────────────────────

function showPage(name) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('page-' + name).classList.add('active');
    document.querySelector('[onclick="showPage(\'' + name + '\')"]').classList.add('active');
}

// ── Profile (saved in localStorage) ─────────────────────────────────────────

function loadProfile() {
    try {
        var naam = localStorage.getItem('naam') || '';
        var leeftijd = localStorage.getItem('leeftijd') || '50 jaar';
        var copd = localStorage.getItem('copd') || 'GOLD 3';
        document.getElementById('input-naam').value = naam;
        document.getElementById('input-leeftijd').value = leeftijd;
        document.getElementById('input-copd').value = copd;
        document.getElementById('display-name').textContent = naam || 'Patient naam';
    } catch(e) {}
}

function saveProfile() {
    var naam = document.getElementById('input-naam').value.trim();
    try {
        localStorage.setItem('naam', naam);
        localStorage.setItem('leeftijd', document.getElementById('input-leeftijd').value);
        localStorage.setItem('copd', document.getElementById('input-copd').value);
    } catch(e) {}
    document.getElementById('display-name').textContent = naam || 'Patient naam';
    showPage('overzicht');
}

// ── Chart ─────────────────────────────────────────────────────────────────────

var chartData = { pm25: [], pm10: [], temp: [] };
var MAX_POINTS = 30;

function pushData(pm25v, pm10v, tempv) {
    chartData.pm25.push(pm25v);
    chartData.pm10.push(pm10v);
    chartData.temp.push(tempv);
    if (chartData.pm25.length > MAX_POINTS) {
        chartData.pm25.shift();
        chartData.pm10.shift();
        chartData.temp.shift();
    }
}

function makePath(values, maxVal, W, H, pad) {
    if (values.length < 2) return '';
    var pts = values.map(function(v, i) {
        var xPos = pad + (i / (MAX_POINTS - 1)) * (W - 2 * pad);
        var yPos = H - pad - (v / maxVal) * (H - 2 * pad);
        return xPos.toFixed(1) + ',' + yPos.toFixed(1);
    });
    return 'M' + pts.join('L');
}

function drawChart() {
    var el = document.getElementById('chart');
    if (!el || chartData.pm25.length < 2) return;
    var W = 300, H = 100, pad = 6;
    var maxVal = Math.max(50,
        Math.max.apply(null, chartData.pm25),
        Math.max.apply(null, chartData.pm10));
    var threshY = (H - pad - (25 / maxVal) * (H - 2 * pad)).toFixed(1);

    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">'
        // threshold line at 25 µg/m³
        + '<line x1="' + pad + '" y1="' + threshY + '" x2="' + (W - pad) + '" y2="' + threshY
        + '" stroke="#ff6b6b" stroke-width="1" stroke-dasharray="4,3"/>'
        // PM10 line
        + '<path d="' + makePath(chartData.pm10, maxVal, W, H, pad)
        + '" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" opacity="0.7"/>'
        // PM2.5 line
        + '<path d="' + makePath(chartData.pm25, maxVal, W, H, pad)
        + '" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
        + '</svg>';
}

// ── Sensor data ───────────────────────────────────────────────────────────────

function fetchStatus() {
    fetch('/status')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            document.getElementById('pm25').textContent = d.pm25.toFixed(1);
            document.getElementById('pm10').textContent = d.pm10.toFixed(1);
            document.getElementById('temp').textContent = d.temp.toFixed(1);
            var now = new Date();
            document.getElementById('update-time').textContent =
                String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
            document.getElementById('status-label').textContent = d.pm25 >= 25 ? 'Slecht' : 'Goed';
            pushData(d.pm25, d.pm10, d.temp);
            drawChart();
        })
        .catch(function() {
            document.getElementById('pm25').textContent = '--';
            document.getElementById('pm10').textContent = '--';
            document.getElementById('temp').textContent = '--';
        });
}

// ── Init ──────────────────────────────────────────────────────────────────────

loadProfile();
fetchStatus();
setInterval(fetchStatus, 5000);
