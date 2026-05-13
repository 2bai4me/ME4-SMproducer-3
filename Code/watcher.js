#!/usr/bin/env node
/**
 * Watcher-App für ME4 SM Producer
 * Überwacht Backend (Port 3001) und Frontend (Port 5173)
 * Startet Services automatisch neu wenn sie down sind
 * 
 * Nutzung: node watcher.js
 * Manager: Ghost
 */

const http = require('http');
const { spawn, exec } = require('child_process');
const path = require('path');

// ─── KONFIGURATION ───
const SERVICES = [
  {
    name: 'Backend (Pipeline)',
    port: 3001,
    url: 'http://localhost:3001/api/projects/settings',
    checkInterval: 5000,  // alle 5 Sekunden prüfen
    startCmd: 'node',
    startArgs: ['src/server.js'],
    cwd: 'C:\\Users\\uwean\\Entwicklung\\ME4-SMproducer-3\\Code\\services\\smproducer-pipeline',
    isRunning: false,
    process: null
  },
  {
    name: 'Frontend (Vite)',
    port: 5173,
    url: 'http://localhost:5173',
    checkInterval: 5000,
    startCmd: 'npx',
    startArgs: ['vite', '--host', '0.0.0.0', '--port', '5173'],
    cwd: 'C:\\Users\\uwean\\Entwicklung\\ME4-SMproducer-3\\Code',
    isRunning: false,
    process: null
  }
];

const LOG_FILE = 'C:\\Users\\uwean\\Entwicklung\\ME4-SMproducer-3\\Code\\watcher.log';
const fs = require('fs');

// ─── HILFSFUNKTIONEN ───

function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const line = `[${ts}] ${msg}\n`;
  process.stdout.write(line);
  try { 
    if (!fs.existsSync(path.dirname(LOG_FILE))) {
      fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, line); 
  } catch (e) { 
    process.stderr.write(`LOG ERROR: ${e.message}\n`);
  }
}

function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
  });
}

function startService(service) {
  if (service.process) {
    try { service.process.kill(); } catch (e) {}
  }

  log(`🔄 Starte ${service.name}...`);
  
  const proc = spawn(service.startCmd, service.startArgs, {
    cwd: service.cwd,
    windowsHide: true,
    detached: false
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(l => { if (l.trim()) log(`  [${service.name}] ${l.trim()}`); });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(l => { if (l.trim()) log(`  [${service.name}] ERR: ${l.trim()}`); });
  });

  proc.on('exit', (code) => {
    log(`⚠️  ${service.name} beendet (Code ${code})`);
    service.isRunning = false;
    service.process = null;
  });

  service.process = proc;
  service.isRunning = true;
  log(`✅ ${service.name} gestartet (PID: ${proc.pid})`);
}

// ─── WATCHER-LOOP ───

async function watchService(service) {
  const isUp = await checkPort(service.port);
  
  if (!isUp && !service.isRunning) {
    log(`❌ ${service.name} ist DOWN (Port ${service.port})`);
    startService(service);
  } else if (isUp && !service.isRunning) {
    log(`✅ ${service.name} ist wieder UP (Port ${service.port})`);
    service.isRunning = true;
  }

  setTimeout(() => watchService(service), service.checkInterval);
}

// ─── STATUS-HTTP-SERVER ───

const statusServer = http.createServer((req, res) => {
  if (req.url === '/') {
    const status = SERVICES.map(s => ({
      name: s.name,
      port: s.port,
      isRunning: s.isRunning,
      pid: s.process ? s.process.pid : null
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ watcher: 'active', services: status, timestamp: new Date().toISOString() }, null, 2));
  } else if (req.url === '/restart') {
    SERVICES.forEach(s => {
      if (s.process) s.process.kill();
      s.isRunning = false;
    });
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Restarting all services...');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// ─── START ───

log('═'.repeat(50));
log('👻 ME4 SM Producer Watcher gestartet');
log('═'.repeat(50));
log('');
log('Überwachte Services:');
SERVICES.forEach(s => log(`  • ${s.name} (Port ${s.port})`));
log('');
log('Status-API: http://localhost:3457');
log('Restart:   http://localhost:3457/restart');
log('');

// Services initial starten
SERVICES.forEach(s => startService(s));

// Watcher-Loops starten
setTimeout(() => {
  SERVICES.forEach(s => watchService(s));
}, 3000);

// Status-Server starten
statusServer.listen(3457, () => {
  log('📊 Status-Server läuft auf http://localhost:3457');
});

// Graceful shutdown
process.on('SIGINT', () => {
  log('\n🛑 Watcher beendet...');
  SERVICES.forEach(s => { if (s.process) s.process.kill(); });
  statusServer.close();
  process.exit(0);
});
