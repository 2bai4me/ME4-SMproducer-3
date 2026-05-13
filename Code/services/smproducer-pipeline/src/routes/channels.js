/**
 * Channel Routes – CRUD operations for channels and their configurations.
 */

import { Router } from 'express';
import { openGlobalDB, openChannelDB, getRootDir, closeChannelCaches } from '../db/manager.js';
import { LLMClient } from '../llm/client.js';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

let XLSX = null;
async function getXLSX() {
  if (!XLSX) XLSX = await import('xlsx');
  return XLSX;
}

const router = Router();

/** GET /api/channels – List all channels */
router.get('/', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openGlobalDB(rootDir);
    const channels = db.prepare('SELECT * FROM channels ORDER BY created_at DESC').all();
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/channels – Create a new channel */
router.post('/', (req, res) => {
  try {
    const { prefix, title, description } = req.body;
    if (!prefix || !title) {
      return res.status(400).json({ error: 'prefix und title sind Pflichtfelder' });
    }

    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openGlobalDB(rootDir);

    // Insert into global DB
    const stmt = db.prepare('INSERT INTO channels (prefix, title, description) VALUES (?, ?, ?)');
    const result = stmt.run(prefix, title, description || '');

    // Create channel folder and subfolders
    const chanDir = path.join(rootDir, prefix);
    fs.mkdirSync(path.join(chanDir, 'Vorlagen', 'intro'), { recursive: true });
    fs.mkdirSync(path.join(chanDir, 'Vorlagen', 'hauptteil'), { recursive: true });
    fs.mkdirSync(path.join(chanDir, 'Vorlagen', 'outro'), { recursive: true });
    fs.mkdirSync(path.join(chanDir, 'Vorlagen', 'hintergrund'), { recursive: true });

    // Initialize channel database
    openChannelDB(rootDir, prefix);

    res.status(201).json({ id: result.lastInsertRowid, prefix, title, description });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: `Kanal-Präfix "${req.body.prefix}" existiert bereits` });
    }
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/channels/:prefix – Entfernt Kanal-Ordner, alle Projekte, und DB-Eintrag */
router.delete('/:prefix', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openGlobalDB(rootDir);

    db.prepare('DELETE FROM channels WHERE prefix = ?').run(req.params.prefix);

    // Erst DB-Caches schließen, dann Ordner löschen
    closeChannelCaches(rootDir, req.params.prefix);

    // Kanal-Ordner komplett löschen (enthält kanal.db + alle projekt.db)
    const chanDir = path.join(rootDir, req.params.prefix);
    if (fs.existsSync(chanDir)) {
      fs.rmSync(chanDir, { recursive: true, force: true });
    }

    res.json({ ok: true, geloescht: { kanal: req.params.prefix, ordner: chanDir } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── IMP-19: Kriterien-File-Import (Excel → Vorschau) ──────────────

/** POST /api/channels/kriterien-import/:prefix – Excel parsen & Vorschau */
router.post('/kritparse/:prefix', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    const xlsx = await getXLSX();
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return res.status(400).json({ error: 'Kein Arbeitsblatt' });
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    if (rows.length === 0) return res.status(400).json({ error: 'Keine Datenzeilen' });

    const headers = Object.keys(rows[0]);
    let suggestedMapping = null;
    try {
      const llm = new LLMClient(req.app.locals.globalDB);
      const llmMapping = await llm.chatJSON({
        systemPrompt: 'Ordne Excel-Spalten den Feldern typ (audio|research|slides), keyword, kategorie, prompt_snippet zu. Gib NUR JSON zurück.',
        userPrompt: `Spalten: ${headers.join(', ')}\nBeispieldaten: ${JSON.stringify(rows.slice(0,3))}\n\nOrdne zu. "Kanal" → typ (default: research).`,
        jsonSchema: '{"typ":"<Spaltenname>","keyword":"<Spaltenname>","kategorie":"<Spaltenname>","prompt_snippet":"<Spaltenname>"}',
      });
      if (llmMapping?.keyword) suggestedMapping = llmMapping;
    } catch (_) {}

    res.json({ headers, sampleRows: rows.slice(0,3), totalRows: rows.length, suggestedMapping, allRows: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── YouTube Transcript Download ──────────────────────────────────

router.post('/transcript', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL fehlt' });
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    const text = transcript.map(t => t.text).join(' ');
    res.json({ text, segments: transcript.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Channel DB: Criteria (legacy :type routes) ───────────────────

/** GET /api/channels/:prefix/kriterien/:type */
router.get('/:prefix/kriterien/:type', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);

    // GET /kriterien/import liefert alle Einträge aus der kriterien-Tabelle
    if (req.params.type === 'import') {
      const rows = db.prepare('SELECT * FROM kriterien ORDER BY sort_order').all();
      return res.json(rows);
    }

    const table = `kriterien_${req.params.type}`;
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY sort_order`).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/channels/:prefix/kriterien/import – JSON-Import */
router.post('/:prefix/kriterien/import', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const { kriterien } = req.body;

    if (!Array.isArray(kriterien) || kriterien.length === 0) {
      return res.status(400).json({ error: 'kriterien muss ein nicht-leeres Array sein' });
    }

    let imported = 0;
    let updated = 0;
    const errors = [];
    const stmt = db.prepare('INSERT OR REPLACE INTO kriterien (typ, keyword, kategorie, prompt_snippet) VALUES (?, ?, ?, ?)');

    for (let i = 0; i < kriterien.length; i++) {
      const k = kriterien[i];
      const typ = (k.typ || '').toLowerCase();
      if (!['audio', 'research', 'slides'].includes(typ)) {
        errors.push(`Zeile ${i + 1}: Ungültiger typ "${k.typ}"`);
        continue;
      }
      if (!k.keyword?.trim()) {
        errors.push(`Zeile ${i + 1}: Keyword fehlt`);
        continue;
      }
      try {
        // Prüfen ob Eintrag schon existiert (für Meldung)
        const existing = db.prepare('SELECT id FROM kriterien WHERE typ = ? AND keyword = ?').get(typ, k.keyword.trim());
        stmt.run(typ, k.keyword.trim(), (k.kategorie || '').trim(), (k.prompt_snippet || k.promptteil || '').trim());
        if (existing) updated++;
        else imported++;
      } catch (err) {
        errors.push(`Zeile ${i + 1}: ${err.message}`);
      }
    }
    return res.json({ imported, updated, errors, total: kriterien.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/channels/:prefix/kriterien/:type/:id */
router.delete('/:prefix/kriterien/:type/:id', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const table = `kriterien_${req.params.type}`;
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Channel DB: Prompt Templates ───────────────────────────────────

router.get('/:prefix/prompts', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const rows = db.prepare('SELECT * FROM prompt_templates').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── KON-02: Prompt-Generate (LLM-optimierter Prompt) ─────────────
// MUSS vor /:prefix/prompts stehen, sonst schluckt Express die Route

/** POST /api/channels/:prefix/prompt-generate – LLM-optimierten Prompt generieren */
router.post('/:prefix/prompt-generate', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const chanDB = openChannelDB(rootDir, req.params.prefix);
    const { bereich, template, extra, kriterien } = req.body;

    if (!bereich || !template) {
      return res.status(400).json({ error: 'bereich und template sind Pflichtfelder' });
    }

    // Lade Variablen aus Kanal-DB
    const variablen = chanDB.prepare('SELECT * FROM kanal_variablen').all();

    // Ersetze {{variablen}} im Template
    let resolved = template;
    for (const v of variablen) {
      resolved = resolved.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'), v.value || `[${v.name}]`);
    }

    // Baue System-Prompt für LLM
    const systemPrompt = [
      `Du bist ein Prompt-Engineer für Social-Media-Videoproduktion.`,
      `Bereich: ${bereich}`,
      `Optimiere den folgenden Prompt für maximale Qualität und Präzision.`,
      `Erhalte alle {{variablen}}-Platzhalter unverändert.`,
      `Füge keine neuen Platzhalter hinzu.`,
      `Antworte NUR mit dem optimierten Prompt, ohne Erklärungen.`,
    ].join('\n');

    const userMessage = [
      `=== PROMPT-TEMPLATE (aufgelöst) ===`,
      resolved,
      extra ? `\n=== ZUSATZTEXT ===\n${extra}` : '',
      kriterien?.length ? `\n=== KRITERIEN-SNIPPETS ===\n${kriterien.join('\n')}` : '',
      `\nOptimiere diesen Prompt.`,
    ].join('\n');

    const llm = new LLMClient(req.app.locals.globalDB);
    const optimized = await llm.chat({ systemPrompt, userPrompt: userMessage });

    res.json({ optimized, resolved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/prompts', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const { id, section, template } = req.body;

    if (!id || !section) {
      return res.status(400).json({ error: 'id und section sind Pflichtfelder' });
    }

    db.prepare('INSERT OR REPLACE INTO prompt_templates (id, section, template) VALUES (?, ?, ?)')
      .run(id, section, template || '');
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:prefix/prompts/:id', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    db.prepare('DELETE FROM prompt_templates WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Channel DB: Variables ─────────────────────────────────────────

router.get('/:prefix/variablen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const rows = db.prepare('SELECT * FROM kanal_variablen').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/variablen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const { id, name, value, description } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'id und name sind Pflichtfelder' });
    }

    db.prepare('INSERT OR REPLACE INTO kanal_variablen (id, tech_name, placeholder, wert, beschreibung) VALUES (?, ?, ?, ?, ?)')
      .run(id, name, '{{' + name + '}}', value || '', description || '');
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:prefix/variablen/:id', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    db.prepare('DELETE FROM kanal_variablen WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Channel DB: Video Templates ────────────────────────────────────

router.get('/:prefix/vorlagen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const rows = db.prepare("SELECT * FROM video_vorlagen ORDER BY type, label").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/channels/:prefix/vorlagen – Vorlage mit Datei-Upload */
router.post('/:prefix/vorlagen', upload.single('file'), async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const prefix = req.params.prefix;
    const { id, type, label, media_type, aspect } = req.body;

    if (!id || !type || !label) {
      return res.status(400).json({ error: 'id, type, label sind Pflichtfelder' });
    }

    let file_path = '';
    let datei_groesse = 0;
    let datei_format = '';
    let dauer_sekunden = 0;

    if (req.file) {
      const typeFolderMap = { intro: 'intro', hauptteil: 'hauptteil', outro: 'outro' };
      const subFolder = typeFolderMap[type] || 'sonstiges';
      const vorlagenDir = path.join(rootDir, prefix, 'Vorlagen', subFolder);
      fs.mkdirSync(vorlagenDir, { recursive: true });

      const ext = path.extname(req.file.originalname).toLowerCase();
      const baseName = path.basename(req.file.originalname, ext);
      const safeName = `${prefix}_${baseName}${ext}`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const targetPath = path.join(vorlagenDir, safeName);

      fs.writeFileSync(targetPath, req.file.buffer);

      file_path = path.relative(rootDir, targetPath).replace(/\\/g, '/');
      datei_groesse = req.file.size;
      datei_format = ext.replace('.', '');

      // Dauer für Video/Audio ermitteln (vereinfacht: aus req.body)
      dauer_sekunden = parseFloat(req.body.dauer_sekunden) || 0;
    } else if (req.body.file_path) {
      file_path = req.body.file_path;
    } else {
      return res.status(400).json({ error: 'Keine Datei hochgeladen und kein file_path angegeben' });
    }

    const db = openChannelDB(rootDir, prefix);
    const kategorie = req.body.kategorie || '';
    db.prepare(`INSERT OR REPLACE INTO video_vorlagen (id, type, kategorie, label, file_path, media_type, aspect, datei_groesse, datei_format, dauer_sekunden)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, type, kategorie, label, file_path, media_type || 'image', aspect || '16:9', datei_groesse, datei_format, dauer_sekunden);
    res.status(201).json({ id, type, kategorie, label, file_path, media_type: media_type || 'image', aspect: aspect || '16:9', datei_groesse, datei_format, dauer_sekunden });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Channel DB: Marketing Contacts ─────────────────────────────────

router.get('/:prefix/kontakte', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const rows = db.prepare('SELECT * FROM marketing_kontakte').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/kontakte', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const { id, name, channel, contact_info, status } = req.body;
    if (!id || !name || !channel) {
      return res.status(400).json({ error: 'id, name, channel sind Pflichtfelder' });
    }
    db.prepare(`INSERT OR REPLACE INTO marketing_kontakte (id, name, channel, contact_info, status)
                VALUES (?, ?, ?, ?, ?)`)
      .run(id, name, channel, contact_info || '', status || 'pending');
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:prefix/kontakte/:id', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    db.prepare('DELETE FROM marketing_kontakte WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PLAT-01: Plattform-Zugangsdaten ──────────────────────────────

/** GET /api/channels/:prefix/plattformen */
router.get('/:prefix/plattformen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const rows = db.prepare('SELECT * FROM plattform_zugang ORDER BY plattform').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/channels/:prefix/plattformen */
router.post('/:prefix/plattformen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const { id, plattform, label, api_key, api_secret, access_token, username, is_active } = req.body;
    if (!id || !plattform) return res.status(400).json({ error: 'id und plattform sind Pflichtfelder' });
    db.prepare(`INSERT OR REPLACE INTO plattform_zugang (id, plattform, label, api_key, api_secret, access_token, username, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, plattform, label || '', api_key || '', api_secret || '', access_token || '', username || '', is_active ?? 1);
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/channels/:prefix/plattformen/:id */
router.delete('/:prefix/plattformen/:id', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    db.prepare('DELETE FROM plattform_zugang WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Channel DB: Settings (Key-Value) ───────────────────────────────

/** GET /api/channels/:prefix/settings – Alle Channel-Settings */
router.get('/:prefix/settings', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const rows = db.prepare('SELECT * FROM channel_settings').all();
    // Return as key-value object for convenience
    const obj = {};
    for (const r of rows) obj[r.key] = r.value;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/channels/:prefix/settings – Ein Setting speichern */
router.post('/:prefix/settings', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'key ist Pflichtfeld' });
    }

    db.prepare('INSERT OR REPLACE INTO channel_settings (key, value) VALUES (?, ?)')
      .run(key, value ?? '');
    res.status(201).json({ key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/channels/:prefix/settings/:key – Ein Setting löschen */
router.delete('/:prefix/settings/:key', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    db.prepare('DELETE FROM channel_settings WHERE key = ?').run(req.params.key);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stammdaten-Import (Excel) ────────────────────────────────────

/**
 * IMP-17: Kriterien-Import mit KI-Format-Prüfung.
 *
 * Flow:
 * 1. Upload → Spalten automatisch erkennen (prefix, title, description)
 * 2. Falls kein Match → LLM schlägt Mapping vor
 * 3. Frontend zeigt Popup → Nutzer bestätigt/korrigiert
 * 4. Erneuter POST mit confirmedMapping → Import mit bestätigtem Mapping
 */

const KNOWN_COLUMNS = {
  prefix: ['prefix', 'kuerzel', 'kürzel', 'kanal', 'channel', 'id', 'code', 'schluessel', 'schlüssel'],
  title: ['title', 'titel', 'name', 'bezeichnung', 'label'],
  description: ['description', 'beschreibung', 'beschreibung', 'info', 'details', 'notiz', 'notizen', 'text', 'kommentar'],
};

/**
 * Versucht Spalten automatisch zu erkennen.
 * @returns {{ prefix: string, title: string, description: string } | null}
 */
function autoDetectColumns(headers) {
  const mapping = {};
  for (const [field, candidates] of Object.entries(KNOWN_COLUMNS)) {
    for (const h of headers) {
      const hl = h.toLowerCase().trim();
      if (candidates.some(c => hl === c || hl.includes(c) || c.includes(hl))) {
        mapping[field] = h;
        break;
      }
    }
  }
  // Mindestens prefix und title müssen erkennbar sein
  if (mapping.prefix && mapping.title) {
    mapping.description = mapping.description || '';
    return mapping;
  }
  return null;
}

/** POST /api/channels/import – Kanäle aus Excel (.xlsx) importieren */
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    const xlsx = await getXLSX();
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: 'Excel-Datei enthält kein Arbeitsblatt' });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Excel-Datei enthält keine Datenzeilen' });
    }

    const headers = Object.keys(rows[0]);
    const rootDir = getRootDir(req.app.locals.globalDB);

    // ─── Mapping bestimmen ──────────────────────────────────────
    let mapping;

    // 1. Bestätigtes Mapping vom Frontend?
    if (req.body.confirmedMapping) {
      try {
        mapping = typeof req.body.confirmedMapping === 'string'
          ? JSON.parse(req.body.confirmedMapping)
          : req.body.confirmedMapping;
      } catch {
        return res.status(400).json({ error: 'confirmedMapping ist kein gültiges JSON' });
      }
    } else {
      // 2. Automatische Erkennung
      mapping = autoDetectColumns(headers);
    }

    // 3. KI-Erkennung, wenn Auto-Erkennung fehlschlägt
    if (!mapping || !mapping.prefix || !mapping.title) {
      try {
        const llm = new LLMClient(req.app.locals.globalDB);
        const sampleRows = rows.slice(0, 3).map(r => {
          const obj = {};
          headers.forEach(h => { obj[h] = String(r[h] || '').substring(0, 80); });
          return obj;
        });

        const llmMapping = await llm.chatJSON({
          systemPrompt: [
            'Du bist ein Daten-Mapping-Assistent.',
            'Analysiere die Excel-Spalten und ordne sie den Zielfeldern zu.',
            'Zielfelder: prefix (Kanal-Kürzel, max 10 Zeichen), title (Kanal-Titel), description (Beschreibung, 4-5 Sätze)',
            'Gib NUR gültiges JSON zurück.',
          ].join('\n'),
          userPrompt: [
            '=== EXCEL-SPALTEN ===',
            headers.join(', '),
            '',
            '=== BEISPIELDATEN (erste 3 Zeilen) ===',
            JSON.stringify(sampleRows, null, 2),
            '',
            'Ordne die Spalten den Feldern prefix, title, description zu.',
            'Falls eine Spalte nicht existiert, setze den Wert auf null.',
          ].join('\n'),
          jsonSchema: '{"prefix": "<Spaltenname>", "title": "<Spaltenname>", "description": "<Spaltenname oder null>"}',
        });

        // Prüfe ob LLM-Antwort gültige Spaltennamen enthält
        if (llmMapping.prefix && llmMapping.title &&
            headers.includes(llmMapping.prefix) && headers.includes(llmMapping.title)) {
          mapping = {
            prefix: llmMapping.prefix,
            title: llmMapping.title,
            description: headers.includes(llmMapping.description) ? llmMapping.description : '',
          };
        } else {
          // LLM konnte nicht helfen – erkannte Spalten zurückgeben
          return res.json({
            needsReview: true,
            headers,
            sampleRows: rows.slice(0, 3),
            allRows: rows,
            message: 'Spalten konnten nicht automatisch zugeordnet werden. Bitte manuell mappen.',
          });
        }

        // Mapping via KI gefunden – Vorschau zurückgeben
        return res.json({
          needsReview: true,
          headers,
          sampleRows: rows.slice(0, 3),
          allRows: rows,
          suggestedMapping: mapping,
          message: 'KI hat eine Spaltenzuordnung vorgeschlagen. Bitte prüfen und bestätigen.',
        });
      } catch (llmErr) {
        // LLM nicht verfügbar – manuelle Zuordnung nötig
        return res.json({
          needsReview: true,
          headers,
          sampleRows: rows.slice(0, 3),
          allRows: rows,
          message: `Automatische Erkennung fehlgeschlagen. LLM-Fehler: ${llmErr.message}`,
        });
      }
    }

    // ─── Import mit Mapping durchführen ─────────────────────────
    const db = openGlobalDB(rootDir);
    let imported = 0;
    const errors = [];

    const stmt = db.prepare('INSERT INTO channels (prefix, title, description) VALUES (?, ?, ?)');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const prefix = String(row[mapping.prefix] || '').trim();
      const title = String(row[mapping.title] || '').trim();
      const description = mapping.description
        ? String(row[mapping.description] || '').trim()
        : '';

      if (!prefix || !title) {
        errors.push(`Zeile ${i + 2}: Prefix oder Titel fehlt`);
        continue;
      }

      try {
        stmt.run(prefix, title, description);

        const chanDir = path.join(rootDir, prefix);
        fs.mkdirSync(path.join(chanDir, 'Vorlagen', 'intro'), { recursive: true });
        fs.mkdirSync(path.join(chanDir, 'Vorlagen', 'hauptteil'), { recursive: true });
        fs.mkdirSync(path.join(chanDir, 'Vorlagen', 'outro'), { recursive: true });
        fs.mkdirSync(path.join(chanDir, 'Vorlagen', 'hintergrund'), { recursive: true });

        openChannelDB(rootDir, prefix);

        imported++;
      } catch (rowErr) {
        if (rowErr.message?.includes('UNIQUE')) {
          errors.push(`Zeile ${i + 2}: Prefix "${prefix}" existiert bereits`);
        } else {
          errors.push(`Zeile ${i + 2}: ${rowErr.message}`);
        }
      }
    }

    const message = imported === 0 && errors.length > 0
      ? 'Keine Kanäle importiert'
      : `${imported} Kanal${imported !== 1 ? 'e' : ''} importiert`;

    res.json({ imported, errors, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Kanal-Archivierung (IMP-19: ZIP + Verschieben) ─────────────────

/** PUT /api/channels/:prefix/archive – Kanal zippen und ins Archiv verschieben */
router.put('/:prefix/archive', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openGlobalDB(rootDir);

    const channel = db.prepare('SELECT * FROM channels WHERE prefix = ?').get(req.params.prefix);
    if (!channel) {
      return res.status(404).json({ error: `Kanal "${req.params.prefix}" nicht gefunden` });
    }

    if (channel.status === 'archiviert') {
      return res.status(200).json({ ok: true, status: 'archiviert', message: `Kanal "${req.params.prefix}" war bereits archiviert` });
    }

    const chanDir = path.join(rootDir, req.params.prefix);

    // IMP-19: DB-Caches vor ZIP schliessen (Windows file locking)
    closeChannelCaches(rootDir, req.params.prefix);

    // IMP-19: Ordner zippen und ins Archiv verschieben
    if (fs.existsSync(chanDir)) {
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip();

      // ZIP aus Kanal-Ordner erstellen (nur DB + Vorlagen, keine WAL/SHM)
      const zipDir = (dir, zipPath) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const zipEntry = path.join(zipPath, entry.name);
          if (entry.isDirectory()) {
            zipDir(fullPath, zipEntry);
          } else {
            // Skip WAL/SHM files (temporary SQLite files)
            if (!entry.name.endsWith('-wal') && !entry.name.endsWith('-shm')) {
              zip.addLocalFile(fullPath, path.dirname(zipEntry));
            }
          }
        }
      };
      zipDir(chanDir, req.params.prefix);

      // Archiv-Verzeichnis erstellen
      const archivDir = path.join(rootDir, '_archiv');
      fs.mkdirSync(archivDir, { recursive: true });

      // ZIP speichern
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const zipName = `${req.params.prefix}_${timestamp}.zip`;
      const zipPath = path.join(archivDir, zipName);
      zip.writeZip(zipPath);

      // Ordner löschen (nach erfolgreichem ZIP)
      fs.rmSync(chanDir, { recursive: true, force: true });
    }

    // Status in DB aktualisieren
    db.prepare('UPDATE channels SET status = ? WHERE prefix = ?').run('archiviert', req.params.prefix);
    res.json({ ok: true, status: 'archiviert', prefix: req.params.prefix });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/channels/:prefix/archive – Archiv-Status abfragen */
router.get('/:prefix/archive', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openGlobalDB(rootDir);
    const channel = db.prepare('SELECT prefix, status FROM channels WHERE prefix = ?').get(req.params.prefix);
    if (!channel) {
      return res.status(404).json({ error: `Kanal "${req.params.prefix}" nicht gefunden` });
    }
    res.json({ prefix: channel.prefix, status: channel.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PUT /api/channels/:prefix/restore – Kanal aus Archiv wiederherstellen */
router.put('/:prefix/restore', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openGlobalDB(rootDir);
    const prefix = req.params.prefix;

    const channel = db.prepare('SELECT * FROM channels WHERE prefix = ?').get(prefix);
    if (!channel) {
      return res.status(404).json({ error: `Kanal "${prefix}" nicht gefunden` });
    }

    if (channel.status !== 'archiviert') {
      return res.status(200).json({ ok: true, status: channel.status, message: `Kanal "${prefix}" ist nicht archiviert` });
    }

    // ZIP im Archiv suchen und entpacken
    const archivDir = path.join(rootDir, '_archiv');
    const chanDir = path.join(rootDir, prefix);
    let restored = false;

    if (fs.existsSync(archivDir)) {
      const files = fs.readdirSync(archivDir).filter(f => f.startsWith(prefix + '_') && f.endsWith('.zip'));
      if (files.length > 0) {
        const zipPath = path.join(archivDir, files[0]);
        const AdmZip = (await import('adm-zip')).default;
        const zip = new AdmZip(zipPath);
        fs.mkdirSync(chanDir, { recursive: true });
        zip.extractAllTo(chanDir, true);
        restored = true;
      }
    }

    db.prepare('UPDATE channels SET status = ? WHERE prefix = ?').run('active', prefix);
    res.json({ ok: true, status: 'active', prefix, restored });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// CHAT-01: Kriterien-CRUD für KI-Chat-Assistent
// ═══════════════════════════════════════════════

/**
 * SERVICE: smproducer-pipeline / channels / kriterien
 * ZWECK: Kriterien-Verwaltung via Chat (CHAT-01)
 * DB: Kanal-DB (<prefix>.db), Tabelle kriterien
 * CONSTRAINTS: typ muss 'audio','research','slides' sein; keyword+prompt_snippet Pflicht
 */

/** GET /api/channels/:prefix/kriterien – Kriterien laden, optional ?typ=audio */
router.get('/:prefix/kriterien', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const typ = req.query.typ;
    let rows;
    if (typ && ['audio','research','slides'].includes(typ)) {
      rows = db.prepare('SELECT * FROM kriterien WHERE typ = ? ORDER BY kategorie, keyword').all(typ);
    } else {
      rows = db.prepare('SELECT * FROM kriterien ORDER BY typ, kategorie, keyword').all();
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/channels/:prefix/kriterien – Kriterium erstellen (via Chat oder UI) */
router.post('/:prefix/kriterien', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const { typ, keyword, kategorie, prompt_snippet } = req.body;
    if (!typ || !['audio','research','slides'].includes(typ)) {
      return res.status(400).json({ error: 'Ungültiger typ. Erlaubt: audio, research, slides' });
    }
    if (!keyword || !prompt_snippet) {
      return res.status(400).json({ error: 'keyword und prompt_snippet sind Pflichtfelder' });
    }
    const result = db.prepare(
      'INSERT INTO kriterien (typ, keyword, kategorie, prompt_snippet) VALUES (?, ?, ?, ?)'
    ).run(typ, keyword, kategorie || '', prompt_snippet);
    res.status(201).json({ id: result.lastInsertRowid, typ, keyword, kategorie: kategorie || '', prompt_snippet });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(409).json({ error: `Kriterium "${req.body.keyword}" existiert bereits für typ "${req.body.typ}"` });
    }
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/channels/:prefix/kriterien/:id – Kriterium löschen (via Chat) */
router.delete('/:prefix/kriterien/:id', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openChannelDB(rootDir, req.params.prefix);
    const existing = db.prepare('SELECT * FROM kriterien WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Kriterium nicht gefunden' });
    }
    db.prepare('DELETE FROM kriterien WHERE id = ?').run(req.params.id);
    res.json({ ok: true, deleted: existing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
