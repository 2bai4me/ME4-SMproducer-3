const http = require('http');
const net = require('net');

// ─── KONFIGURATION ───
const SERVICES = [
  { name: 'Backend (Pipeline)', port: 3001, url: '/api/projects/settings' },
  { name: 'Frontend (Vite)', port: 5173, url: '/' }
];

const WATCHER_PORT = 3457;
const CHECK_INTERVAL = 5000;

// ─── STATUS ───
let serviceStatus = {};

// ─── HILFSFUNKTIONEN ───

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, 'localhost');
  });
}

async function checkAll() {
  for (const svc of SERVICES) {
    const isUp = await checkPort(svc.port);
    serviceStatus[svc.name] = {
      port: svc.port,
      status: isUp ? 'UP' : 'DOWN',
      lastCheck: new Date().toISOString()
    };
  }
}

// ─── STATUS-HTTP-SERVER ───

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.url === '/' || req.url === '/status') {
    await checkAll();
    const allUp = Object.values(serviceStatus).every(s => s.status === 'UP');
    
    res.writeHead(200);
    res.end(JSON.stringify({
      watcher: 'active',
      overall: allUp ? 'ALL UP' : 'SOME DOWN',
      timestamp: new Date().toISOString(),
      services: serviceStatus
    }, null, 2));
  } else if (req.url === '/health') {
    await checkAll();
    const allUp = Object.values(serviceStatus).every(s => s.status === 'UP');
    res.writeHead(allUp ? 200 : 503);
    res.end(JSON.stringify({ healthy: allUp }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// ─── START ───

server.listen(WATCHER_PORT, () => {
  console.log(`[Watcher] Status: http://localhost:${WATCHER_PORT}`);
  console.log(`[Watcher] Health: http://localhost:${WATCHER_PORT}/health`);
});

// Initiale Prüfung
checkAll().then(() => {
  console.log('[Watcher] Initial check done');
});

// Regelmäßige Prüfung
setInterval(checkAll, CHECK_INTERVAL);
