/**
 * ME4-SMproducer Pipeline Service – Server Entry Point
 *
 * Orchestriert den gesamten Video-Produktionsablauf.
 * REST API für Frontend, SQLite-Persistenz, MCP-Integration.
 */

import express from 'express';
import cors from 'cors';
import path from 'node:path';

const defaultResearchTemplate = 'Du bist ein Recherche-Assistent. Erstelle einen umfassenden Such-Prompt fuer NotebookLM.\n\n## Projekt\n{{nb_desc}}\n\n## Suchkriterien\n{{kriterien}}\n\n## Aufgabe\nFormuliere einen detaillierten Prompt fuer die Quellensuche in NotebookLM. Der Prompt soll:\n- Alle relevanten Suchbegriffe enthalten\n- Verschiedene Perspektiven abdecken\n- Konkrete Forschungsfragen stellen\n- Auf Deutsch formuliert sein\n\nGib NUR den fertigen Prompt zurueck, keine Erklaerungen.';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openGlobalDB, getRootDir, setRootDir, closeAll } from './db/manager.js';
import channelRoutes from './routes/channels.js';
import projectRoutes from './routes/projects.js';
import { LLMClient } from './llm/client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.SMPRODUCER_PIPELINE_PORT || 3001;

const app = express();

// ─── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static file serving (frontend build output) ────────────────────
const frontendDist = path.resolve(__dirname, '..', '..', '..', 'dist');
app.use(express.static(frontendDist));

// Serve uploaded files from MESM_DATA
app.use('/data', (req, res, next) => {
  try {
    const db = app.locals.globalDB;
    if (!db) return next();
    const rootDir = getRootDir(db);
    express.static(rootDir)(req, res, next);
  } catch (_) {
    next();
  }
});

// ─── Initialize Global DB ──────────────────────────────────────────
const defaultRoot = path.resolve(__dirname, '..', '..', '..', '..', 'MESM_DATA');
fs.mkdirSync(defaultRoot, { recursive: true });
const globalDB = openGlobalDB(defaultRoot);
app.locals.globalDB = globalDB;

// Ensure root_dir is set in DB
const existing = globalDB.prepare("SELECT value FROM app_settings WHERE key = 'root_dir'").get();
if (!existing) {
  setRootDir(globalDB, defaultRoot);
}

// ─── API Routes ─────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const rootDir = getRootDir(globalDB);
  const version = globalDB.prepare("SELECT value FROM app_settings WHERE key='app_version'").get()?.value || '2.01.000';
  res.json({
    status: 'ok',
    service: 'smproducer-pipeline',
    version,
    rootDir,
    channels: globalDB.prepare('SELECT COUNT(*) as c FROM channels').get().c
  });
});

// IMP-19: Kriterien-File-Parse
app.post('/api/kriterien-parse/test', (req, res) => {
  res.json({ ok: true });
});
app.post('/api/kriterien-parse/:prefix', (req, res) => {
  res.json({ ok: true, prefix: req.params.prefix });
});

app.use('/api/channels', channelRoutes);

// Research Prompt generieren (direkt auf app wegen Express 5 Router-Bug)
app.post('/api/projects/:prefix/:projectId/research/generate-prompt', async (req, res) => {
  const { createLLMClient } = await import('./llm/client.js');
  const { openProjectDB, openChannelDB, getRootDir } = await import('./db/manager.js');
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const cdb = openChannelDB(rootDir, req.params.prefix);

    const meta = pdb.prepare('SELECT * FROM projekt_meta ORDER BY id DESC LIMIT 1').get();
    const nbDesc = meta?.description || '';
    const projektTitel = meta?.title || '';

    const selectedIds = pdb.prepare('SELECT kriterium_id FROM research_kriterien_selected').all().map(r => r.kriterium_id);
    let kriterienText = meta?.kriterien_text || '';
    if (!kriterienText && selectedIds.length > 0) {
      for (const id of selectedIds) {
        const k = cdb.prepare("SELECT prompt_snippet FROM kriterien WHERE id = ? AND typ = 'research'").get(id);
        if (k?.prompt_snippet) kriterienText += k.prompt_snippet + '\n';
      }
    }
    const extra = req.body.extraText || '';
    if (extra) kriterienText += 'Zusatz: ' + extra + '\n';

    const defaultResearchTemplate = 'Erstelle einen kompakten Recherche-Prompt. Nur Fakten, keine Listen von Einzelkriterien.';
    let template = defaultResearchTemplate;
    const tmpl = cdb.prepare("SELECT template FROM prompt_templates WHERE section='research' ORDER BY rowid DESC LIMIT 1").get();
    if (tmpl?.template) template = tmpl.template;

    // Aus den Kriterien die Kern-Keywords extrahieren
    const keywords = kriterienText.split('\n').map(s => s.replace(/^(Suche nach|Analysiere|Untersuche|Finde|Recherchiere)\s*/i,'').replace(/Quellen\s*(zu|zum|für|bei)\s*/i,'').trim()).filter(Boolean);
    const keywordSummary = [...new Set(keywords)].join(', ');

    let prompt = template.replace(/\{\{nb_desc\}\}/g, nbDesc).replace(/\{\{kriterien\}\}/g, kriterienText || 'Keine');
    prompt = prompt.replace(/\{\{projekt_titel\}\}/g, projektTitel);
    prompt = prompt.replace(/\{\{projekt_beschreibung\}\}/g, meta?.description || '');

    const variablen = cdb.prepare('SELECT tech_name, wert FROM kanal_variablen').all();
    for (const v of variablen) {
      prompt = prompt.replace(new RegExp(`\\{\\{${v.tech_name}\\}\\}`, 'g'), v.wert || '');
    }

    const llm = createLLMClient(req.app.locals.globalDB);
    let optimized = prompt;
    try {
      const llmPromise = llm.chat({
        systemPrompt: `Du erstellst Recherche-Prompts für NotebookLM. Der Prompt besteht aus zwei Teilen:\n1. KOMPAKTE Zusammenfassung des Themas (3-4 Sätze, nur Fakten)\n2. VOLLSTÄNDIGE Liste aller Suchkriterien/Fokusbereiche – jedes einzelne Kriterium muss erhalten bleiben, nichts weglassen. Alle technischen Namen und Produktnamen MÜSSEN enthalten sein.\n\nAntworte NUR mit dem fertigen Prompt.`,
        userPrompt: prompt, temperature: 0.3
      });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
      const result = await Promise.race([llmPromise, timeoutPromise]);
      if (result && result.length > 50 && !result.includes('[THEMA]')) optimized = result;
    } catch (_) { /* LLM down/timeout → Template direkt */ }
    res.json({ resolved: optimized, original: prompt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Audio: Prompt generieren (direkt wegen Express 5 Router-Bug)
app.post('/api/projects/:prefix/:projectId/audio/generate-prompt', async (req, res) => {
  const { openProjectDB, openChannelDB, getRootDir } = await import('./db/manager.js');
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const cdb = openChannelDB(rootDir, req.params.prefix);

    const { extra_text } = req.body;
    const meta = pdb.prepare('SELECT * FROM projekt_meta ORDER BY id DESC LIMIT 1').get();

    const selected = pdb.prepare('SELECT kriterium_id FROM audio_kriterien_selected').all();
    let kriterienText = '';
    if (selected.length > 0) {
      for (const s of selected) {
        const k = cdb.prepare("SELECT prompt_snippet FROM kriterien WHERE id = ? AND typ = 'audio'").get(s.kriterium_id);
        if (k?.prompt_snippet) kriterienText += '- ' + k.prompt_snippet + '\n';
      }
    }
    if (extra_text) kriterienText += 'Zusatz: ' + extra_text + '\n';

    let template = 'Erstelle einen Audio-Prompt.\n\nTitel: {{projekt_titel}}\nBeschreibung: {{projekt_beschreibung}}\nKriterien: {{audio_kriterien}}';
    const tmpl = cdb.prepare("SELECT template FROM prompt_templates WHERE section='audio' ORDER BY rowid DESC LIMIT 1").get();
    if (tmpl?.template) template = tmpl.template;

    let prompt = template.replace(/\{\{audio_kriterien\}\}/g, kriterienText || 'Keine');
    prompt = prompt.replace(/\{\{projekt_titel\}\}/g, meta?.title || '');
    prompt = prompt.replace(/\{\{projekt_beschreibung\}\}/g, meta?.description || '');

    const variablen = cdb.prepare('SELECT tech_name, wert FROM kanal_variablen').all();
    for (const v of variablen) {
      prompt = prompt.replace(new RegExp(`\\{\\{${v.tech_name}\\}\\}`, 'g'), v.wert || '');
    }

    try {
      const projVars = pdb.prepare("SELECT tech_name, wert FROM projekt_variablen WHERE bereich = 'Audio'").all();
      for (const v of projVars) {
        prompt = prompt.replace(new RegExp(`\\{\\{${v.tech_name}\\}\\}`, 'g'), v.wert || '');
      }
    } catch (_) {}

    let promptClean = prompt.replace(/{{nb_title}}/g, meta?.title || "");
    promptClean = promptClean.replace(/{{nb_desc}}/g, meta?.description || "");
    promptClean = promptClean.replace(/{{kriterien}}/g, kriterienText || "Keine");
    promptClean = promptClean.replace(/{{.*?}}/g, "").trim();

    pdb.prepare('INSERT INTO prompt_log (step, prompt, response) VALUES (?, ?, ?)')
      .run('audio', template.slice(0, 2000), promptClean.slice(0, 2000));

    res.json({ prompt: promptClean, resolved: promptClean });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api/projects', projectRoutes);

// Direct workaround for Express 5 routing bug (projects POST routes hang)
app.post('/api/analyse-preview/:prefix/:projectId', async (req, res) => {
  try {
    const { openChannelDB, getRootDir } = await import('./db/manager.js');
    const { createLLMClient } = await import('./llm/client.js');
    const rootDir = getRootDir(req.app.locals.globalDB);
    let promptTemplate = '', tags = ['Allgemein'];
    try {
      const cdb = openChannelDB(rootDir, req.params.prefix);
      const tmpl = cdb.prepare("SELECT template FROM prompt_templates WHERE section='thema' LIMIT 1").get();
      if (tmpl?.template) promptTemplate = tmpl.template;
      const tagRow = cdb.prepare("SELECT value FROM channel_settings WHERE key='kategorien_tags'").get();
      if (tagRow?.value) tags = JSON.parse(tagRow.value);
    } catch (_) {}
    const tagsStr = tags.join(', ');
    const jsonSchema = '{ "topics": [{ "title": "string", "description": "string", "tags": "tag1, tag2" }] }';
    const systemPrompt = (promptTemplate || `Du bist ein Themen-Analyst. Tags: ${tagsStr}`)
      .replace(/\{\{tags\}\}/g, tagsStr)
      .replace(/\{\{tag\}\}/g, tagsStr)
      .replace(/\{\{kategorien\}\}/g, tagsStr)
      + '\nDu bist ein JSON-Generator. Antworte ausschließlich mit gültigem JSON, keine Erklärungen.';
    const userPrompt = `Quelle (text):\n${req.body.text || ''}\n\nANTWORTE AUSSCHLIESSLICH MIT VALIDEM JSON. Format: ${jsonSchema}`;
    res.json({ systemPrompt, userPrompt, jsonSchema });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CHAT-01/02: KI-Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { systemPrompt, userMessage } = req.body;
    if (!userMessage) return res.status(400).json({ error: 'userMessage is required' });
    const llm = new LLMClient(app.locals.globalDB);
    const response = await llm.chat({ systemPrompt: systemPrompt || 'Du bist ein hilfreicher Assistent.', userPrompt: userMessage });
    res.json({ response });
  } catch (err) {
    console.error('[chat] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// YouTube Transcript download
app.post('/api/youtube-transcript', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL fehlt' });
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    const text = transcript.map(t => t.text).join(' ');
    res.json({ text, segments: transcript.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// NotebookLM Agent starten
app.post('/api/notebooklm/create', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title) return res.status(400).json({ error: 'Titel fehlt' });

    const { chromium } = await import('playwright');
    const browser = await chromium.connectOverCDP('http://localhost:9222');
    const contexts = browser.contexts();
    const page = contexts[0]?.pages()[0] || await browser.newPage();

    await page.goto('https://notebooklm.google.com/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Neues Notebook erstellen
    let clicked = false;
    for (const sel of ['button:has-text("Neues Notizbuch")', 'button:has-text("New notebook")', 'text=Neues Notizbuch']) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click(); clicked = true; break; }
      } catch (_) {}
    }

    if (clicked) {
      await page.waitForTimeout(2000);
      await page.keyboard.type(title);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      if (content) await page.keyboard.type(content);
    }

    res.json({ ok: true, title, message: clicked ? 'Notebook erstellt' : 'NotebookLM geöffnet – bitte manuell klicken' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Unified Variables – Alle Variablen aus allen DBs
app.get('/api/variablen/:prefix/:projectId', async (req, res) => {
  try {
    const allVars = [];
    const { openGlobalDB, openChannelDB, openProjectDB, getRootDir } = await import('./db/manager.js');
    const rootDir = getRootDir(app.locals.globalDB);

    // Global
    try {
      const db = openGlobalDB(rootDir);
      const rows = db.prepare('SELECT tech_name, placeholder, table_name, bereich, beschreibung, var_typ, wert FROM global_variablen').all();
      rows.forEach(r => allVars.push({ ...r, database: 'global.db' }));
    } catch (_) {}

    // Kanal
    try {
      const db = openChannelDB(rootDir, req.params.prefix);
      const rows = db.prepare('SELECT tech_name, placeholder, table_name, bereich, beschreibung, var_typ, wert FROM kanal_variablen').all();
      rows.forEach(r => allVars.push({ ...r, database: req.params.prefix + '.db' }));
    } catch (_) {}

    // Projekt
    if (req.params.projectId && req.params.projectId !== 'no-project') {
    try {
      const db = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
      const rows = db.prepare('SELECT tech_name, placeholder, table_name, bereich, beschreibung, var_typ, wert FROM projekt_variablen').all();
      rows.forEach(r => allVars.push({ ...r, database: 'Projekt.db' }));
    } catch (_) {}
    }

    // Laufzeit-Variablen – mit echten Werten aus der DB füllen
    let nbDesc = '', nbTitle = '', kriterienWert = '', tagsWert = '';
    try {
      const projDb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
      const pmeta = projDb.prepare('SELECT * FROM projekt_meta ORDER BY id DESC LIMIT 1').get();
      if (pmeta) {
        nbDesc = pmeta.description || '';
        nbTitle = pmeta.title || '';
        kriterienWert = pmeta.kriterien_text || '';
      }
    } catch (_) {}
    try {
      const cdb2 = openChannelDB(rootDir, req.params.prefix);
      const settings = cdb2.prepare("SELECT value FROM channel_settings WHERE key='kategorien_tags'").get();
      if (settings?.value) {
        try { tagsWert = JSON.parse(settings.value).join(', '); } catch { tagsWert = settings.value; }
      }
    } catch (_) {}

    allVars.push({ tech_name: 'nb_desc', placeholder: '{{nb_desc}}', table_name: 'projekt_meta', bereich: 'Research', beschreibung: 'Projekt-Beschreibung', var_typ: 'runtime', wert: nbDesc, database: 'Projekt.db' });
    allVars.push({ tech_name: 'nb_title', placeholder: '{{nb_title}}', table_name: 'projekt_meta', bereich: 'Research', beschreibung: 'Projekt-Titel', var_typ: 'runtime', wert: nbTitle, database: 'Projekt.db' });
    allVars.push({ tech_name: 'kriterien', placeholder: '{{kriterien}}', table_name: 'projekt_meta', bereich: 'Research', beschreibung: 'Prompt-Snippets der gewählten Kriterien', var_typ: 'runtime', wert: kriterienWert, database: 'Projekt.db' });
    allVars.push({ tech_name: 'kriterien_text', placeholder: '{{kriterien_text}}', table_name: 'projekt_meta', bereich: 'Research', beschreibung: 'Gespeicherter Kriterien-Text', var_typ: 'db', wert: kriterienWert, database: 'Projekt.db' });
    allVars.push({ tech_name: 'tags', placeholder: '{{tags}}', table_name: 'channel_settings', bereich: 'Kanal', beschreibung: 'Kategorien-Tags des Kanals', var_typ: 'runtime', wert: tagsWert, database: req.params.prefix + '.db' });

    res.json(allVars);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// NotebookLM Workflow – Notebook + Deep Research + Download (nach ARCH-02 zurückgestellt)
// Research Prompt generieren (direkt auf app wegen Express 5 Router-Bug)
// NotebookLM Service Integration → ME4-Service-NotebookLM (Port 8765)
const NBLM_URL = 'http://localhost:8765';

app.post('/api/notebooklm/workflow', async (req, res) => {
  const { title, description, mode } = req.body;
  if (!title) return res.status(400).json({ error: 'Titel fehlt' });

  try {
    // 1. Notebook erstellen
    const nbRes = await fetch(`${NBLM_URL}/api/notebooks`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title })
    });
    if (!nbRes.ok) throw new Error('Notebook erstellen fehlgeschlagen: HTTP ' + nbRes.status);
    const nbData = await nbRes.json();
    const notebookId = nbData.notebook_id || nbData.id;
    
    // 2. Quelle hinzufügen (Beschreibung)
    if (description) {
      await fetch(`${NBLM_URL}/api/notebooks/${notebookId}/sources`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ text: description })
      });
    }

    // 3. Deep Research starten
    const researchRes = await fetch(`${NBLM_URL}/api/notebooks/${notebookId}/research`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ query: title, mode: mode || 'deep' })
    });
    if (!researchRes.ok) throw new Error('Research fehlgeschlagen: HTTP ' + researchRes.status);
    const rData = await researchRes.json();

    res.json({ ok: true, notebookId, taskId: rData.task_id, message: 'Notebook erstellt, Deep Research gestartet' });
  } catch (err) {
    res.json({ ok: false, error: err.message, hint: 'ME4-Service-NotebookLM nicht erreichbar (Port 8765). In WSL starten: .venv/bin/python main.py' });
  }
});

// ─── SPA fallback – only for GET requests not matching /api ─────────
app.get('/{*path}', (req, res) => {
  // Skip API routes that weren't matched (404 for API)
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: `Route not found: ${req.path}` });
  }
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ message: 'ME4-SMproducer API running. Frontend not built yet.' });
  }
});

// ─── Error handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Pipeline Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Auto-Checkpoint: WAL-Dateien bereinigen (verhindert Hänger nach Crash) ──
setTimeout(async () => {
  try {
    const entries = fs.readdirSync(defaultRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
      const dbPath = path.join(defaultRoot, entry.name, entry.name + '.db');
      const walPath = dbPath + '-wal';
      if (fs.existsSync(dbPath) && fs.existsSync(walPath)) {
        try {
          const Database = (await import('better-sqlite3')).default;
          const db = new Database(dbPath);
          db.pragma('wal_checkpoint(TRUNCATE)');
          db.close();
        } catch (e) {
          try { fs.unlinkSync(walPath); } catch (_) {}
          try { fs.unlinkSync(dbPath + '-shm'); } catch (_) {}
        }
      }
    }
    console.log('[startup] WAL-Checkpoint abgeschlossen');
  } catch (_) {}
}, 1000);

// ─── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[smproducer-pipeline] Listening on http://localhost:${PORT}`);
  console.log(`[smproducer-pipeline] Data directory: ${getRootDir(globalDB)}`);
});

// ─── Crash-Prevention: Unbehandelte Fehler nicht crashen lassen ─────
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason?.message || reason);
});

// ─── Graceful shutdown ─────────────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n[smproducer-pipeline] Shutting down...');
  closeAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeAll();
  process.exit(0);
});

export default app;
