const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3000;

// Sajikan file statis dari folder public
app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
    console.log('✅ Client Terhubung');
    ws.on('message', (message) => {
        // Teruskan data dari ESP32 ke Dashboard
        wss.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(message.toString());
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server Dashboard Agility Ready di http://localhost:${PORT}`);
});