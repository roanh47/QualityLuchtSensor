function fetchStatus() {
    fetch('/status')
        .then(function(r) { return r.json(); })
        .then(function(d) {
            document.getElementById('pm25').textContent = d.pm25.toFixed(1);
            document.getElementById('pm10').textContent = d.pm10.toFixed(1);
            document.getElementById('temp').textContent = d.temp.toFixed(1);
            var now = new Date();
            document.getElementById('update-info').textContent =
                'Bijgewerkt om ' + now.getHours() + ':' +
                String(now.getMinutes()).padStart(2, '0') + ':' +
                String(now.getSeconds()).padStart(2, '0');
        })
        .catch(function() {
            document.getElementById('update-info').textContent = 'Geen verbinding met sensor';
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
