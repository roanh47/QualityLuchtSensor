// ── Page navigation ──────────────────────────────────────────────────────────

function showPage(name) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('page-' + name).classList.add('active');
    document.querySelector('[onclick="showPage(\'' + name + '\')"]').classList.add('active');
}

// ── Profile (saved in localStorage) ─────────────────────────────────────────

function loadProfile() {
    var naam = localStorage.getItem('naam') || '';
    var leeftijd = localStorage.getItem('leeftijd') || '50 jaar';
    var copd = localStorage.getItem('copd') || 'GOLD 3';

    document.getElementById('input-naam').value = naam;
    document.getElementById('input-leeftijd').value = leeftijd;
    document.getElementById('input-copd').value = copd;
    document.getElementById('display-name').textContent = naam || 'Patient naam';
}

function saveProfile() {
    var naam = document.getElementById('input-naam').value.trim();
    localStorage.setItem('naam', naam);
    localStorage.setItem('leeftijd', document.getElementById('input-leeftijd').value);
    localStorage.setItem('copd', document.getElementById('input-copd').value);
    document.getElementById('display-name').textContent = naam || 'Patient naam';
    showPage('overzicht');
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
