function fetchStatus() {
    fetch('/status')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            // Update phone interface values
            document.getElementById('pm25').textContent = d.pm25.toFixed(1);
            document.getElementById('pm10').textContent = d.pm10.toFixed(1);
            document.getElementById('temp').textContent = d.temp.toFixed(1) + '°C';
            
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            document.getElementById('update-time').textContent = hours + ':' + minutes;
        })
        .catch(function() {
            document.getElementById('pm25').textContent = '--';
            document.getElementById('pm10').textContent = '--';
            document.getElementById('temp').textContent = '--';
        });
}

function connect() {
    var btn = document.getElementById('connect-btn');
    var msg = document.getElementById('status-msg');
    btn.disabled = true;
    btn.textContent = 'Verbonden';
    msg.textContent = 'Je bent verbonden met het netwerk.';
}

fetchStatus();
setInterval(fetchStatus, 5000);
