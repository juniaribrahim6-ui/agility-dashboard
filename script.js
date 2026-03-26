// --- Konfigurasi Chart ---
const ctx = document.getElementById('activityChart').getContext('2d');
const activityChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Akselerasi (g)',
            borderColor: '#00D4FF',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            borderWidth: 2,
            data: [],
            fill: true,
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { min: 0, max: 25, grid: { color: '#222' }, ticks: { color: '#888' } },
            x: { grid: { display: false }, ticks: { display: false } }
        },
        plugins: { legend: { display: false } }
    }
});

// --- State Global ---
let isTraining = false;
let startTime;
let timerInterval;
let simInterval; // Untuk menampung interval simulasi
let stats = {
    pLeft: 0, pRight: 0, kLeft: 0, kRight: 0,
    peakPL: 0, peakPR: 0, peakKL: 0, peakKR: 0,
    maxSpeed: 0
};

// --- Fungsi Utama Update UI ---
function updateUI(type, accel) {
    if (!isTraining) return;

    const time = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    
    let currentSpeed = parseFloat((accel * 0.25).toFixed(1)); 
    if(currentSpeed > stats.maxSpeed) stats.maxSpeed = currentSpeed;

    if (type === 'punch_l') { 
        stats.pLeft++; 
        stats.peakPL = Math.max(stats.peakPL, accel);
        document.getElementById('punch-left').innerText = stats.pLeft;
        document.getElementById('peak-pl').innerText = stats.peakPL;
        document.getElementById('speed-pl').innerText = currentSpeed;
    } 
    else if (type === 'punch_r') { 
        stats.pRight++; 
        stats.peakPR = Math.max(stats.peakPR, accel);
        document.getElementById('punch-right').innerText = stats.pRight;
        document.getElementById('peak-pr').innerText = stats.peakPR;
        document.getElementById('speed-pr').innerText = currentSpeed;
    }
    else if (type === 'kick_l') { 
        stats.kLeft++; 
        stats.peakKL = Math.max(stats.peakKL, accel);
        document.getElementById('kick-left').innerText = stats.kLeft;
        document.getElementById('peak-kl').innerText = stats.peakKL;
        document.getElementById('speed-kl').innerText = currentSpeed;
    }
    else if (type === 'kick_r') { 
        stats.kRight++; 
        stats.peakKR = Math.max(stats.peakKR, accel);
        document.getElementById('kick-right').innerText = stats.kRight;
        document.getElementById('peak-kr').innerText = stats.peakKR;
        document.getElementById('speed-kr').innerText = currentSpeed;
    }

    const totalHits = stats.pLeft + stats.pRight + stats.kLeft + stats.kRight;
    document.getElementById('total-min').innerText = totalHits;
    
    let score = Math.min(100, (totalHits * 0.8) + (Math.max(stats.peakPL, stats.peakPR, stats.peakKL, stats.peakKR) * 2));
    document.getElementById('perf-score').innerText = Math.floor(score);
    document.getElementById('score-fill').style.width = score + "%";

    if (activityChart.data.labels.length > 20) {
        activityChart.data.labels.shift();
        activityChart.data.datasets[0].data.shift();
    }
    activityChart.data.labels.push(time);
    activityChart.data.datasets[0].data.push(accel);
    activityChart.update('none');
}

// --- LOGIKA SIMULASI (UNTUK PROTOTIPE) ---
function startSimulation() {
    simInterval = setInterval(() => {
        if (!isTraining) return;

        // Tentukan secara acak apakah ada serangan masuk (probabilitas 30%)
        if (Math.random() > 0.7) {
            const types = ['punch_l', 'punch_r', 'kick_l', 'kick_r'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            const randomAccel = parseFloat((Math.random() * (20 - 5) + 5).toFixed(1)); // G-Force antara 5-20
            
            updateUI(randomType, randomAccel);
        } else {
            // Jika tidak ada serangan, tetap update chart dengan noise kecil (0-1g)
            const time = new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
            const noise = parseFloat((Math.random() * 1.5).toFixed(1));
            
            if (activityChart.data.labels.length > 20) {
                activityChart.data.labels.shift();
                activityChart.data.datasets[0].data.shift();
            }
            activityChart.data.labels.push(time);
            activityChart.data.datasets[0].data.push(noise);
            activityChart.update('none');
        }
    }, 500); // Simulasi cek data setiap 500ms
}

// --- Kontrol Tombol ---
document.getElementById('btn-start').onclick = () => {
    isTraining = true;
    startTime = Date.now();
    resetDisplay();
    
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;
    
    // Jalankan Timer Visual
    timerInterval = setInterval(() => {
        let elapsed = Math.floor((Date.now() - startTime) / 1000);
        let m = String(Math.floor(elapsed / 60)).padStart(2, '0');
        let s = String(elapsed % 60).padStart(2, '0');
        document.getElementById('timer-display').innerText = `${m}:${s}`;
    }, 1000);

    // Jalankan Simulasi Data
    startSimulation();
};

document.getElementById('btn-stop').onclick = () => {
    isTraining = false;
    clearInterval(timerInterval);
    clearInterval(simInterval); // Berhentikan simulasi
    
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;
    showRecap();
};

function resetDisplay() {
    stats = { pLeft: 0, pRight: 0, kLeft: 0, kRight: 0, peakPL: 0, peakPR: 0, peakKL: 0, peakKR: 0, maxSpeed: 0 };
    const ids = ['punch-left', 'punch-right', 'kick-left', 'kick-right', 'peak-pl', 'peak-pr', 'peak-kl', 'peak-kr', 'speed-pl', 'speed-pr', 'speed-kl', 'speed-kr', 'total-min', 'perf-score'];
    ids.forEach(id => { if(document.getElementById(id)) document.getElementById(id).innerText = '0'; });
    document.getElementById('score-fill').style.width = "0%";
    activityChart.data.labels = [];
    activityChart.data.datasets[0].data = [];
    activityChart.update();
}

function showRecap() {
    const total = stats.pLeft + stats.pRight + stats.kLeft + stats.kRight;
    const avgPower = ((stats.peakPL + stats.peakPR + stats.peakKL + stats.peakKR) / 4).toFixed(2);
    const duration = document.getElementById('timer-display').innerText;

    document.getElementById('recap-body').innerHTML = `
        <tr><td>Total Serangan</td><td>${total} Hits</td></tr>
        <tr><td>Rata-rata Power</td><td>${avgPower} g</td></tr>
        <tr><td>Kecepatan Tertinggi</td><td>${stats.maxSpeed} m/s</td></tr>
        <tr><td>Waktu Latihan</td><td>${duration}</td></tr>
    `;
}

// --- WebSocket Tetap Aktif (Bisa simulasi & data asli barengan) ---
function initConnection() {
    const statusEl = document.getElementById('connection-status');
    const socket = new WebSocket(`ws://${window.location.host}`);
    socket.onopen = () => {
        statusEl.classList.replace('disconnected', 'connected');
        statusEl.innerHTML = '<span class="dot"></span> PERANGKAT TERHUBUNG';
    };
    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            updateUI(data.type, parseFloat(data.accel));
        } catch (e) {}
    };
    socket.onclose = () => {
        statusEl.classList.replace('connected', 'disconnected');
        statusEl.innerHTML = '<span class="dot"></span> PERANGKAT TERPUTUS';
        setTimeout(initConnection, 2000);
    };
}

initConnection();