/**
 * Project Routes – Project CRUD, workflow steps, artifact management
 */

import { Router } from 'express';
import { openGlobalDB, openProjectDB, getRootDir, closeChannelCaches } from '../db/manager.js';
import { createLLMClient } from '../llm/client.js';
import { createMCPClient } from '../mcp/client.js';
import path from 'node:path';
import fs from 'node:fs';
import AdmZip from 'adm-zip';

const router = Router();

// ─── Utilities ──────────────────────────────────────────────────────

function generateProjectId(prefix) {
  const now = new Date();
  const Y = String(now.getFullYear());
  const M = String(now.getMonth() + 1).padStart(2, '0');
  const D = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${prefix}-${Y}${M}${D}_${h}${m}${s}`;
}

function createProjectFolders(rootDir, prefix, projectId) {
  const base = path.join(rootDir, prefix, projectId);
  const folders = ['1. Thema', '2. Recherche', '3. Audio', '4. Slides', '5. Video', '6. Upload'];
  for (const f of folders) {
    fs.mkdirSync(path.join(base, f), { recursive: true });
  }
  return base;
}

// ─── Settings ───────────────────────────────────────────────────────

router.get('/settings', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = req.app.locals.globalDB;
    const settings = db.prepare('SELECT * FROM app_settings').all();
    const providers = db.prepare('SELECT * FROM llm_providers').all();
    const tts = db.prepare('SELECT * FROM tts_profiles').all();
    res.json({ rootDir, settings, providers, tts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', (req, res) => {
  try {
    const db = req.app.locals.globalDB;
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key ist Pflichtfeld' });
    db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
    res.json({ key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings/providers', (req, res) => {
  try {
    const db = req.app.locals.globalDB;
    const { id, position, provider, api_key, endpoint, is_active } = req.body;
    if (!provider) return res.status(400).json({ error: 'provider ist Pflichtfeld' });

    if (id) {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      db.prepare(`UPDATE llm_providers SET position=?, provider=?, api_key=?, endpoint=?, is_active=?, updated_at=? WHERE id=?`)
        .run(position || 1, provider, api_key || '', endpoint || '', is_active ? 1 : 0, now, id);
    } else {
      db.prepare('INSERT INTO llm_providers (position, provider, api_key, endpoint, is_active) VALUES (?, ?, ?, ?, ?)')
        .run(position || 1, provider, api_key || '', endpoint || '', is_active ? 1 : 0);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings/tts', (req, res) => {
  try {
    const db = req.app.locals.globalDB;
    const { id, voice, speed, mood } = req.body;
    if (!voice) return res.status(400).json({ error: 'voice ist Pflichtfeld' });
    if (id) {
      db.prepare('UPDATE tts_profiles SET voice=?, speed=?, mood=? WHERE id=?').run(voice, speed || 1.0, mood || 'neutral', id);
    } else {
      db.prepare('INSERT INTO tts_profiles (voice, speed, mood) VALUES (?, ?, ?)').run(voice, speed || 1.0, mood || 'neutral');
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/settings/tts/:id', (req, res) => {
  try {
    const db = req.app.locals.globalDB;
    db.prepare('DELETE FROM tts_profiles WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/settings/providers/:id', (req, res) => {
  try {
    const db = req.app.locals.globalDB;
    db.prepare('DELETE FROM llm_providers WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Project CRUD ───────────────────────────────────────────────────

/** GET /api/projects/:prefix – List all projects for a channel */
router.get('/:prefix', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const chanDir = path.join(rootDir, req.params.prefix);
    if (!fs.existsSync(chanDir)) {
      return res.json([]);
    }
    const entries = fs.readdirSync(chanDir, { withFileTypes: true });
    const projects = entries
      .filter(e => e.isDirectory() && e.name !== 'Vorlagen' && !e.name.endsWith('.db'))
      .map(e => ({ id: e.name, prefix: req.params.prefix }));

    // Enrich with meta from project DB
    for (const p of projects) {
      try {
        const pdb = openProjectDB(rootDir, req.params.prefix, p.id);
        const meta = pdb.prepare('SELECT * FROM projekt_meta ORDER BY id DESC LIMIT 1').get();
        if (meta) {
          p.title = meta.title;
          p.status = meta.status;
          p.created_at = meta.created_at;
        }
      } catch (_) { /* project DB may not exist yet */ }
    }

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/projects/:prefix – Create a new project */
router.post('/:prefix', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const prefix = req.params.prefix;
    const projectId = generateProjectId(prefix);

    createProjectFolders(rootDir, prefix, projectId);
    const pdb = openProjectDB(rootDir, prefix, projectId);

    // Initialize meta
    pdb.prepare('INSERT INTO projekt_meta (title, kanal_prefix) VALUES (?, ?)')
      .run(req.body.title || '', prefix);

    res.status(201).json({ id: projectId, prefix, title: req.body.title || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/projects/:prefix/:projectId */
router.delete('/:prefix/:projectId', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const projDir = path.join(rootDir, req.params.prefix, req.params.projectId);
    if (fs.existsSync(projDir)) {
      fs.rmSync(projDir, { recursive: true, force: true });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Step 1: Thema ─────────────────────────────────────────────────

/** GET /api/projects/:prefix/:projectId/thema */
router.get('/:prefix/:projectId/thema', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const meta = pdb.prepare('SELECT * FROM projekt_meta ORDER BY id DESC LIMIT 1').get();
    const quellen = pdb.prepare('SELECT * FROM thema_quellen').all();
    const ergebnisse = pdb.prepare('SELECT * FROM thema_ergebnisse').all();
    res.json({ meta, quellen, ergebnisse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/projects/:prefix/:projectId/thema/quellen */
router.post('/:prefix/:projectId/thema/quellen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { type, content } = req.body;
    if (!type || !content) {
      return res.status(400).json({ error: 'type und content sind Pflichtfelder' });
    }
    const result = pdb.prepare('INSERT INTO thema_quellen (type, content) VALUES (?, ?)')
      .run(type, content);
    res.status(201).json({ id: result.lastInsertRowid, type, content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/projects/:prefix/:projectId/thema/analyse-preview – Prompt-Vorschau ohne Analyse */
router.post('/:prefix/:projectId/thema/analyse-preview', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    let promptTemplate = '';
    let categories = [];
    try {
      const { openChannelDB } = await import('../db/manager.js');
      const cdb = openChannelDB(rootDir, req.params.prefix);
      categories = cdb.prepare("SELECT DISTINCT kategorie FROM kriterien WHERE typ = 'research' AND kategorie != ''").all();
      const tmpl = cdb.prepare(
        "SELECT template FROM prompt_templates WHERE section = 'thema' UNION ALL SELECT template FROM prompt_templates WHERE section IN ('Thema','Research','research') LIMIT 1"
      ).get();
      if (tmpl?.template) promptTemplate = tmpl.template;
    } catch (_) {}

    const catNames = categories.map(c => typeof c === 'string' ? c : c.kategorie).join(', ') || 'Allgemein';
    const systemPrompt = promptTemplate
      ? promptTemplate.replace(/\{\{kategorien\}\}/g, catNames)
      : `Du bist ein präziser Themen-Analyst für Social-Media-Videos. Extrahiere 2-3 Themen.\nKategorien: ${catNames}`;

    const userPrompt = req.body.text
      ? `Quelle (text):\n${req.body.text}`
      : '(Keine Quellen)';

    res.json({ systemPrompt, userPrompt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/projects/:prefix/:projectId/thema/analyse-block – Ein Block analysieren + sofort speichern */
router.post('/:prefix/:projectId/thema/analyse-block', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { content, blockNum, totalBlocks } = req.body;
    if (!content) return res.status(400).json({ error: 'Kein Inhalt' });

    // Tags und Prompt-Template aus Channel-Settings laden
    let tags = ['LLM','Bild','Video','Audio','Robotik','3D','Code','Hardware','Voice','Sonstiges'];
    let promptTemplate = '';
    try {
      const { openChannelDB } = await import('../db/manager.js');
      const cdb = openChannelDB(rootDir, req.params.prefix);
      const tmpl = cdb.prepare("SELECT template FROM prompt_templates WHERE section='thema' LIMIT 1").get();
      if (tmpl?.template) promptTemplate = tmpl.template;
      const tagRow = cdb.prepare("SELECT value FROM channel_settings WHERE key='kategorien_tags'").get();
      if (tagRow?.value) tags = JSON.parse(tagRow.value);
    } catch (_) {}

    const llm = createLLMClient(req.app.locals.globalDB);
    const tagsStr = tags.join(', ');
    let systemPrompt = (promptTemplate || 'Extrahiere das ERSTE KI-Thema. Nur JSON: {"title":"...","description":"...","tags":"tag1, tag2"}')
      .replace(/\{\{kategorien\}\}/g, tagsStr)
      .replace(/\{\{tags\}\}/g, tagsStr)
      .replace(/\{\{tag\}\}/g, tagsStr);
    
    // Immer Tags anhängen falls nicht schon im Template
    if (!systemPrompt.includes(tagsStr)) {
      systemPrompt = systemPrompt + `\nErlaubte Kategorien/Tags: ${tagsStr}. Ein Thema kann mehrere Tags haben.`;
    }

    const response = await llm.chat({ systemPrompt, userPrompt: `Quelle:\n${content}` });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.json({ skipped: true, reason: 'Kein JSON' });

    const topic = JSON.parse(jsonMatch[0]);
    if (!topic.title) return res.json({ skipped: true, reason: 'Kein Titel' });

    // Speichern (keine Duplikat-Prüfung – das macht die Konsolidierung am Ende)
    const topicTags = topic.tags || topic.category || 'Sonstiges';
    const sourceInfo = `[Quelle: Manuell]\n${content.substring(0, 2000)}`;
    const fullDesc = (topic.description || '') + '\n\n---\n' + sourceInfo;
    const r = pdb.prepare('INSERT INTO thema_ergebnisse (title, description, category) VALUES (?, ?, ?)').run(
      topic.title.slice(0, 80), fullDesc, Array.isArray(topicTags) ? topicTags.join(', ') : topicTags
    );
    res.json({ saved: true, id: r.lastInsertRowid, title: topic.title, description: fullDesc, tags: Array.isArray(topicTags) ? topicTags.join(', ') : topicTags });
  } catch (e) {
    res.json({ skipped: true, reason: e.message });
  }
});

/** POST /api/projects/:prefix/:projectId/thema/konsolidieren – Duplikate zusammenführen */
router.post('/:prefix/:projectId/thema/konsolidieren', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const all = pdb.prepare('SELECT * FROM thema_ergebnisse ORDER BY id').all();
    if (all.length === 0) return res.json({ merged: 0, total: 0 });

    // Nach Produktname gruppieren (erste 30 Zeichen normalisiert)
    const groups = {};
    for (const t of all) {
      const key = t.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }

    let merged = 0;
    for (const [key, items] of Object.entries(groups)) {
      if (items.length <= 1) continue;
      // Ersten behalten, Beschreibungen mergen
      const first = items[0];
      const allDescs = items.map(t => t.description).filter(Boolean);
      const mergedDesc = allDescs.join('\n\n');
      pdb.prepare('UPDATE thema_ergebnisse SET description = ? WHERE id = ?').run(mergedDesc, first.id);
      // Rest löschen
      for (let i = 1; i < items.length; i++) {
        pdb.prepare('DELETE FROM thema_ergebnisse WHERE id = ?').run(items[i].id);
        merged++;
      }
    }

    const remaining = pdb.prepare('SELECT COUNT(*) as c FROM thema_ergebnisse').get().c;
    res.json({ merged, total: remaining, message: `${merged} Duplikate zusammengeführt, ${remaining} Themen übrig` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST /api/projects/:prefix/:projectId/thema/analyse – Trigger LLM topic extraction */
router.post('/:prefix/:projectId/thema/analyse', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const quellen = pdb.prepare('SELECT * FROM thema_quellen').all();

    if (quellen.length === 0) {
      return res.status(400).json({ error: 'Keine Quellen vorhanden. Bitte zuerst Quellen erfassen.' });
    }

    // Collect source content
    const sourceText = quellen.map(q => `[${q.type}] ${q.content}`).join('\n\n');

    // Build categories list from channel DB
    let categories = [];
    let promptTemplate = '';
    try {
      const { openChannelDB } = await import('../db/manager.js');
      const cdb = openChannelDB(rootDir, req.params.prefix);
      categories = cdb.prepare("SELECT DISTINCT kategorie FROM kriterien WHERE typ = 'research' AND kategorie != ''").all();

      // Lade Prompt-Template für Bereich "thema" (bevorzugt) oder "research"
      const tmpl = cdb.prepare(
        "SELECT template FROM prompt_templates WHERE section = 'thema' UNION ALL SELECT template FROM prompt_templates WHERE section IN ('Thema','Research','research') LIMIT 1"
      ).get();
      if (tmpl?.template) promptTemplate = tmpl.template;
    } catch (_) { /* no categories yet */ }

    // JEDE Quelle einzeln analysieren, dann Ergebnisse kombinieren
    const llm = createLLMClient(req.app.locals.globalDB);
    const catNames = categories.map(c => typeof c === 'string' ? c : c.kategorie).join(', ') || 'Allgemein';

    const systemPrompt = promptTemplate
      ? promptTemplate.replace(/\{\{kategorien\}\}/g, catNames)
      : `Du bist ein präziser Themen-Analyst für Social-Media-Videos. Extrahiere aus dem gegebenen Quellmaterial 2-3 konkrete Video-Themenvorschläge.
WICHTIG:
- Jedes Thema MUSS auf den Quellen basieren (keine Erfindungen!)
- Wenn kein verwertbares Thema gefunden wird, gib ein leeres Array zurück
- Ordne jedes Thema einer der folgenden Kategorien zu: ${catNames}
- Titel: max 80 Zeichen, prägnant
- Beschreibung: max 360 Zeichen, aussagekräftig`;

    let allTopics = [];
    let usedLLM = false;

    // Jede Quelle einzeln analysieren
    for (const quelle of quellen) {
      const content = quelle.content?.trim();
      if (!content || content.length < 10) continue;

      console.log(`[Analyse] Starte Circle-Verfahren für Quelle ${quelle.type} (${content.length} Zeichen)`);

      // Text in ~3000-Zeichen-Blöcke teilen (Circle-Verfahren)
      const blockSize = 3000;
      const blocks = [];
      for (let i = 0; i < content.length; i += blockSize) {
        blocks.push(content.slice(i, i + blockSize));
      }
      console.log(`[Analyse] ${blocks.length} Blöcke à ${blockSize} Zeichen`);

      let blockNum = 0;
      for (const block of blocks) {
        blockNum++;
        const userPrompt = `Quelle (${quelle.type}):\n${block}`;
        try {
          console.log(`[Analyse] Block ${blockNum}/${blocks.length} – LLM-Aufruf...`);
          const response = await llm.chat({ systemPrompt, userPrompt });
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const topic = JSON.parse(jsonMatch[0]);
            if (topic.title) {
              console.log(`[Analyse] Block ${blockNum}: Thema gefunden: "${topic.title}"`);
              allTopics.push({
                title: (topic.title || 'Unbenannt').slice(0, 80),
                description: (topic.description || '').slice(0, 360),
                category: topic.category || 'Allgemein'
              });
              usedLLM = true;
            } else {
              console.log(`[Analyse] Block ${blockNum}: Kein title im JSON, übersprungen`);
            }
          } else {
            console.log(`[Analyse] Block ${blockNum}: Kein JSON in Antwort gefunden`);
          }
        } catch (llmErr) {
          console.error(`[Analyse] Block ${blockNum}: LLM-Fehler:`, llmErr.message);
        }
      }
      console.log(`[Analyse] Quelle ${quelle.type} abgeschlossen. Themen gesamt: ${allTopics.length}`);
    }

    // Duplikate zusammenführen (ähnliche Titel)
    const topics = [];
    const seen = new Set();
    for (const t of allTopics) {
      const key = t.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
      if (!seen.has(key)) {
        seen.add(key);
        topics.push(t);
      }
    }

    // Store results
    const insert = pdb.prepare('INSERT INTO thema_ergebnisse (title, description, category) VALUES (?, ?, ?)');
    const results = [];
    for (const t of topics) {
      const r = insert.run(t.title, t.description, t.category);
      results.push({ id: r.lastInsertRowid, ...t, selected: 0 });
    }
    // Update analysed_at
    const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
    pdb.prepare('UPDATE thema_quellen SET analysed_at = ? WHERE analysed_at IS NULL').run(ts);

    // Log prompt
    pdb.prepare('INSERT INTO prompt_log (step, prompt, response) VALUES (?, ?, ?)')
      .run('thema', sourceText.slice(0, 2000), JSON.stringify(results).slice(0, 2000));

    res.json(results);
  } catch (err) {
    try {
      const r2 = getRootDir(req.app.locals.globalDB);
      const db2 = openProjectDB(r2, req.params.prefix, req.params.projectId);
      db2.prepare('INSERT INTO error_log (service, message) VALUES (?, ?)').run('thema-analyse', err.message);
    } catch (_) { /* ignore logging errors */ }
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/projects/:prefix/:projectId/thema/ergebnisse/:id */
router.patch('/:prefix/:projectId/thema/ergebnisse/:id', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { selected, category } = req.body;
    if (selected !== undefined) {
      pdb.prepare('UPDATE thema_ergebnisse SET selected = ? WHERE id = ?')
        .run(selected ? 1 : 0, req.params.id);
    }
    if (category !== undefined) {
      pdb.prepare('UPDATE thema_ergebnisse SET category = ? WHERE id = ?')
        .run(category, req.params.id);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/projects/:prefix/:projectId/meta – Titel/Beschreibung speichern */
router.patch('/:prefix/:projectId/meta', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { title, description, status } = req.body;
    if (title) pdb.prepare('UPDATE projekt_meta SET title = ? WHERE id = 1').run(title);
    if (description !== undefined) pdb.prepare('UPDATE projekt_meta SET description = ? WHERE id = 1').run(description);
    if (status) pdb.prepare('UPDATE projekt_meta SET status = ? WHERE id = 1').run(status);
    const meta = pdb.prepare('SELECT * FROM projekt_meta WHERE id = 1').get();
    res.json({ ok: true, meta });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** POST /api/projects/:prefix/:projectId/thema/zusammenfassen */
router.post('/:prefix/:projectId/thema/zusammenfassen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const selected = pdb.prepare('SELECT * FROM thema_ergebnisse WHERE selected = 1').all();

    if (selected.length === 0) {
      return res.status(400).json({ error: 'Keine Themen ausgewählt.' });
    }

    const titles = selected.map(t => t.title).join(' | ');
    const combinedTitle = titles.length > 120 ? titles.slice(0, 117) + '...' : titles;
    const combinedDesc = selected.map(t => t.description).join('\n\n');

    pdb.prepare('UPDATE projekt_meta SET title = ?, description = ? WHERE id = 1').run(combinedTitle, combinedDesc);

    res.json({
      titel: combinedTitle,
      beschreibung: combinedDesc.slice(0, 500),
      projekt_id: req.params.projectId,
      themen: selected.map(s => s.title)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Step 2: Research ───────────────────────────────────────────────

router.get('/:prefix/:projectId/research', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { openChannelDB } = await import('../db/manager.js');
    const cdb = openChannelDB(rootDir, req.params.prefix);
    const meta = pdb.prepare('SELECT * FROM projekt_meta ORDER BY id DESC LIMIT 1').get();
    const notizen = pdb.prepare('SELECT * FROM research_notizen').all();
    const selected = pdb.prepare('SELECT * FROM research_kriterien_selected').all();
    // Kriterien-Details aus Channel-DB laden
    const kriterien = [];
    for (const s of selected) {
      const k = cdb.prepare("SELECT * FROM kriterien WHERE id = ? AND typ = 'research'").get(s.kriterium_id);
      if (k) kriterien.push(k);
    }
    res.json({ meta, notizen, selectedKriterien: selected.map(s => s.kriterium_id), kriterien });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/:projectId/research/notizen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { notebook_title, notebook_description, content } = req.body;
    const r = pdb.prepare(`INSERT INTO research_notizen (notebook_title, notebook_description, content)
                          VALUES (?, ?, ?)`).run(notebook_title || '', notebook_description || '', content || '');
    res.status(201).json({ id: r.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/:projectId/research/kriterien', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { openChannelDB } = await import('../db/manager.js');
    const cdb = openChannelDB(rootDir, req.params.prefix);
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids muss ein Array sein' });

    pdb.prepare('DELETE FROM research_kriterien_selected').run();
    const insert = pdb.prepare('INSERT OR IGNORE INTO research_kriterien_selected (kriterium_id) VALUES (?)');
    for (const id of ids) insert.run(id);

    // Kriterien-Text aus Channel-DB sammeln und in projekt_meta speichern
    let kriterienText = '';
    for (const id of ids) {
      const k = cdb.prepare("SELECT prompt_snippet FROM kriterien WHERE id = ? AND typ = 'research'").get(id);
      if (k?.prompt_snippet) kriterienText += k.prompt_snippet + String.fromCharCode(10);
    }
    pdb.prepare('UPDATE projekt_meta SET kriterien_text = ? WHERE id = 1').run(kriterienText.trim());

    res.json({ selected: ids, kriterien_text: kriterienText.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
/** POST /api/projects/:prefix/:projectId/audio/kriterien – Auswahl speichern (wie Research) */
router.post('/:prefix/:projectId/audio/kriterien', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { openChannelDB } = await import('../db/manager.js');
    const cdb = openChannelDB(rootDir, req.params.prefix);
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids muss ein Array sein' });

    pdb.exec('CREATE TABLE IF NOT EXISTS audio_kriterien_selected (kriterium_id TEXT PRIMARY KEY)');
    pdb.prepare('DELETE FROM audio_kriterien_selected').run();
    const insert = pdb.prepare('INSERT OR IGNORE INTO audio_kriterien_selected (kriterium_id) VALUES (?)');
    for (const id of ids) insert.run(id);

    let kriterienText = '';
    for (const id of ids) {
      const k = cdb.prepare("SELECT prompt_snippet FROM kriterien WHERE id = ? AND typ = 'audio'").get(id);
      if (k?.prompt_snippet) kriterienText += k.prompt_snippet + String.fromCharCode(10);
    }
    pdb.prepare('UPDATE projekt_meta SET kriterien_text = ? WHERE id = 1').run(kriterienText.trim());

    res.json({ selected: ids, kriterien_text: kriterienText.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ─── Step 3: Audio ──────────────────────────────────────────────────

router.get('/:prefix/:projectId/audio', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const konfig = pdb.prepare('SELECT * FROM audio_konfig ORDER BY id DESC LIMIT 1').get();
    const spuren = pdb.prepare('SELECT * FROM audio_spuren').all();
    const transkript = pdb.prepare('SELECT * FROM transkript').all();
    res.json({ konfig, spuren, transkript });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/:projectId/audio/upload', async (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { datei_pfad, sprecher_anzahl } = req.body;

    if (!datei_pfad) {
      return res.status(400).json({ error: 'datei_pfad ist Pflichtfeld' });
    }

    if (!fs.existsSync(datei_pfad)) {
      return res.status(400).json({ error: `Datei nicht gefunden: ${datei_pfad}` });
    }

    const speakerCount = sprecher_anzahl || 2;

    // ─── Schritt 1: Datei-Analyse & Kopie ──────────────────────
    const projektDir = path.join(rootDir, req.params.prefix, req.params.projectId, '3. Audio');
    fs.mkdirSync(projektDir, { recursive: true });

    const origExt = path.extname(datei_pfad);
    const origName = path.basename(datei_pfad);
    const newName = `${req.params.projectId}-nblm-Rohdaten${origExt}`;
    const targetPath = path.join(projektDir, newName);

    // Original-Statistiken
    const origStat = fs.statSync(datei_pfad);
    const fileSizeMB = (origStat.size / (1024 * 1024)).toFixed(2);

    // Audio-Dauer ermitteln
    let durationMin = 0;
    let audioFormat = origExt.replace('.', '').toUpperCase();
    try {
      const mm = await import('music-metadata');
      const meta = await mm.parseFile(datei_pfad);
      durationMin = meta.format.duration ? (meta.format.duration / 60).toFixed(1) : 0;
      if (meta.format.container) audioFormat = meta.format.container.toUpperCase();
    } catch (_) {
      // Dauer konnte nicht ermittelt werden
    }

    // Datei kopieren (nicht verschieben – Original bleibt erhalten)
    fs.copyFileSync(datei_pfad, targetPath);

    const fileAnalysis = {
      original_name: origName,
      original_path: datei_pfad,
      target_name: newName,
      target_path: targetPath,
      target_dir: projektDir,
      size_mb: parseFloat(fileSizeMB),
      duration_min: parseFloat(durationMin),
      format: audioFormat,
    };

    console.log('[Audio] Analyse:', JSON.stringify(fileAnalysis));

    // In DB speichern (mit Zielpfad)
    const r = pdb.prepare('INSERT INTO audio_konfig (datei_pfad, sprecher_anzahl) VALUES (?, ?)')
      .run(targetPath, speakerCount);

    // ─── Schritt 2-4: MCP-Verarbeitung ────────────────────────
    const mcp = createMCPClient();

    const [transkript, spuren] = await Promise.all([
      mcp.transcribe(targetPath).catch(err => {
        console.error('[Audio] Transkription fehlgeschlagen:', err.message);
        return mcp._mockTranscription(targetPath);
      }),
      mcp.separateSpeakers(targetPath, speakerCount).catch(err => {
        console.error('[Audio] Sprechertrennung fehlgeschlagen:', err.message);
        return mcp._mockSpeakerSeparation(targetPath, speakerCount);
      })
    ]);

    // Validierung: Sprecheranzahl prüfen (F-UB02)
    let speakerWarning = null;
    if (spuren.length < speakerCount) {
      speakerWarning = `Erwartet: ${speakerCount} Sprecher. Erhalten: ${spuren.length} Spuren.`;
    }

    // Speaker-Spuren in DB speichern
    const spurenInsert = pdb.prepare('INSERT INTO audio_spuren (sprecher, datei_pfad) VALUES (?, ?)');
    for (const s of spuren) {
      spurenInsert.run(s.speaker, s.file_path);
    }

    // Transkript in DB speichern
    const transInsert = pdb.prepare('INSERT INTO transkript (start_time, end_time, speaker, text) VALUES (?, ?, ?, ?)');
    for (const t of transkript) {
      transInsert.run(t.start_time || t.start, t.end_time || t.end, t.speaker, t.text);
    }

    // Transkript-Datei im Projekt-Ordner ablegen
    fs.writeFileSync(
      path.join(projektDir, 'transkript.json'),
      JSON.stringify(transkript, null, 2),
      'utf-8'
    );

    const response = {
      id: r.lastInsertRowid,
      sprecher_anzahl: speakerCount,
      file_analysis: fileAnalysis,
      transkript,
      spuren,
    };

    if (speakerWarning) {
      response.warning = speakerWarning;
    }

    res.json(response);
  } catch (err) {
    // Error-Log in Projekt-DB
    try {
      const r2 = getRootDir(req.app.locals.globalDB);
      const db2 = openProjectDB(r2, req.params.prefix, req.params.projectId);
      db2.prepare('INSERT INTO error_log (service, message) VALUES (?, ?)').run('audio-upload', err.message);
    } catch (_) { /* ignore logging errors */ }
    res.status(500).json({ error: err.message });
  }
});

// ─── Step 4: Slides ─────────────────────────────────────────────────

router.get('/:prefix/:projectId/slides', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const ergebnisse = pdb.prepare('SELECT * FROM slides_ergebnisse').all();
    const timing = pdb.prepare('SELECT * FROM slides_timing').all();
    res.json({ ergebnisse, timing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/:projectId/slides/timing', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { table } = req.body; // Array of { slide_id, file_name, start_time, end_time }

    if (!Array.isArray(table)) {
      return res.status(400).json({ error: 'table muss ein Array sein' });
    }

    pdb.prepare('DELETE FROM slides_timing').run();
    const insert = pdb.prepare('INSERT INTO slides_timing (slide_id, file_name, start_time, end_time) VALUES (?, ?, ?, ?)');
    for (const row of table) {
      insert.run(row.slide_id || 0, row.file_name || '', row.start_time || '', row.end_time || '');
    }
    res.json({ count: table.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/projects/:prefix/:projectId/slides/upload-zip – ZIP extrahieren & validieren (F-UB04) */
router.post('/:prefix/:projectId/slides/upload-zip', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { file_path } = req.body;

    if (!file_path) {
      return res.status(400).json({ error: 'file_path ist Pflichtfeld' });
    }

    if (!fs.existsSync(file_path)) {
      return res.status(400).json({ error: `Datei nicht gefunden: ${file_path}` });
    }

    // Prüfen ob es eine ZIP-Datei ist
    if (!file_path.toLowerCase().endsWith('.zip')) {
      return res.status(400).json({ error: 'Nur ZIP-Dateien werden unterstützt (F-UB04)' });
    }

    // Zielverzeichnis: Projektordner / 4. Slides
    const slidesDir = path.join(rootDir, req.params.prefix, req.params.projectId, '4. Slides');
    fs.mkdirSync(slidesDir, { recursive: true });

    // ZIP lesen und validieren
    const zip = new AdmZip(file_path);
    const entries = zip.getEntries();

    if (entries.length === 0) {
      return res.status(400).json({ error: 'ZIP-Datei ist leer' });
    }

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const invalidFiles = [];
    const extractedFiles = [];

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const ext = path.extname(entry.entryName).toLowerCase();
      if (!validExtensions.includes(ext)) {
        invalidFiles.push(entry.entryName);
        continue;
      }

      // Dateiname bereinigen (nur Basename)
      const baseName = path.basename(entry.entryName);
      const destPath = path.join(slidesDir, baseName);

      // Überschreiben falls existiert
      fs.writeFileSync(destPath, entry.getData());
      extractedFiles.push(baseName);
    }

    // F-UB04: ZIP ohne JPEG/PNG → Fehler
    if (extractedFiles.length === 0) {
      return res.status(400).json({
        error: 'ZIP-Datei enthält keine gültigen Bilddateien (.jpg, .jpeg, .png, .webp, .gif). (F-UB04)',
        invalidFiles
      });
    }

    // Slides-Ergebnisse in DB speichern
    pdb.prepare('DELETE FROM slides_ergebnisse').run();
    pdb.prepare('INSERT INTO slides_ergebnisse (zip_pfad, slide_count) VALUES (?, ?)')
      .run(file_path, extractedFiles.length);

    // Error-Log für invalide Dateien
    if (invalidFiles.length > 0) {
      try {
        pdb.prepare('INSERT INTO error_log (service, message) VALUES (?, ?)')
          .run('slides-upload-zip', `Übersprungene Nicht-Bild-Dateien: ${invalidFiles.join(', ')}`);
      } catch (_) { /* ignore */ }
    }

    res.json({
      slideCount: extractedFiles.length,
      files: extractedFiles,
      warnings: invalidFiles.length > 0
        ? [`${invalidFiles.length} Nicht-Bild-Dateien wurden übersprungen: ${invalidFiles.join(', ')}`]
        : []
    });
  } catch (err) {
    try {
      const r2 = getRootDir(req.app.locals.globalDB);
      const db2 = openProjectDB(r2, req.params.prefix, req.params.projectId);
      db2.prepare('INSERT INTO error_log (service, message) VALUES (?, ?)').run('slides-upload-zip', err.message);
    } catch (_) { /* ignore */ }
    res.status(500).json({ error: err.message });
  }
});

// ─── Step 5: Video ──────────────────────────────────────────────────

router.get('/:prefix/:projectId/video', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const konfig = pdb.prepare('SELECT * FROM video_konfig ORDER BY id DESC LIMIT 1').get();
    const timeline = pdb.prepare('SELECT * FROM video_timeline').all();
    res.json({ konfig, timeline });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/:projectId/video/konfig', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { format, plattform } = req.body;
    if (!format || !plattform) {
      return res.status(400).json({ error: 'format und plattform sind Pflichtfelder' });
    }
    pdb.prepare('DELETE FROM video_konfig').run();
    const r = pdb.prepare('INSERT INTO video_konfig (format, plattform) VALUES (?, ?)').run(format, plattform);
    res.status(201).json({ id: r.lastInsertRowid, format, plattform });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/:projectId/video/timeline', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items muss ein Array sein' });
    }
    pdb.prepare('DELETE FROM video_timeline').run();
    const insert = pdb.prepare(`INSERT INTO video_timeline (element_type, element_id, datei_pfad, start_seconds, duration_seconds)
                               VALUES (?, ?, ?, ?, ?)`);
    for (const item of items) {
      insert.run(item.element_type, item.element_id || '', item.datei_pfad || '', item.start_seconds || 0, item.duration_seconds || 0);
    }
    res.json({ count: items.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Step 6: Upload ─────────────────────────────────────────────────

router.get('/:prefix/:projectId/upload', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const daten = pdb.prepare('SELECT * FROM upload_daten ORDER BY id DESC LIMIT 1').get();
    res.json(daten || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/:projectId/upload', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { titel, beschreibung, video_pfad, thumbnail_pfad, upload_zeit, veroeffentlichung_zeit } = req.body;
    pdb.prepare('DELETE FROM upload_daten').run();
    const r = pdb.prepare(`INSERT INTO upload_daten (titel, beschreibung, video_pfad, thumbnail_pfad, upload_zeit, veroeffentlichung_zeit)
                          VALUES (?, ?, ?, ?, ?, ?)`)
      .run(titel || '', beschreibung || '', video_pfad || '', thumbnail_pfad || '', upload_zeit || null, veroeffentlichung_zeit || null);
    res.status(201).json({ id: r.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:prefix/:projectId/upload/publish', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const pdb = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    pdb.prepare("UPDATE upload_daten SET status = 'published', upload_zeit = ? WHERE status = 'pending'").run(now);
    res.json({ status: 'published', message: 'Upload erfolgreich ausgelöst.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/projects/:prefix/:projectId/archive – Projekt in Archiv verschieben */
router.post('/:prefix/:projectId/archive', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const projDir = path.join(rootDir, req.params.prefix, req.params.projectId);
    const archivDir = path.join(rootDir, req.params.prefix, '_archiv');

    if (!fs.existsSync(projDir)) {
      return res.status(404).json({ error: 'Projekt-Ordner nicht gefunden' });
    }

    // Erst DB-Caches schließen, dann verschieben
    closeChannelCaches(rootDir, req.params.prefix);

    // Archiv-Ordner anlegen
    fs.mkdirSync(archivDir, { recursive: true });

    // Projekt-Ordner ins Archiv kopieren, dann Original löschen (Windows-sicher)
    const target = path.join(archivDir, req.params.projectId);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
    fs.cpSync(projDir, target, { recursive: true });
    fs.rmSync(projDir, { recursive: true, force: true });

    // Eintrag in globaler DB aktualisieren (optional)
    const db = openGlobalDB(rootDir);
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)")
      .run(`archived_${req.params.projectId}`, new Date().toISOString());

    res.json({ ok: true, archiviert: target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// IMP-18: Projekt-Variablen für Prompt-Engineer
// ═══════════════════════════════════════════════

/** GET /api/projects/:prefix/:projectId/variablen – Variablen laden, optional ?bereich=Audio */
router.get('/:prefix/:projectId/variablen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const bereich = req.query.bereich;
    let rows;
    if (bereich && ['Thema','Research','Audio','Slides','Thumbnail'].includes(bereich)) {
      rows = db.prepare('SELECT * FROM projekt_variablen WHERE bereich = ? ORDER BY name').all(bereich);
    } else {
      rows = db.prepare('SELECT * FROM projekt_variablen ORDER BY bereich, name').all();
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/projects/:prefix/:projectId/variablen – Variable erstellen/aktualisieren */
router.post('/:prefix/:projectId/variablen', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    const { id, name, value, description, bereich } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'id und name sind Pflichtfelder' });
    }

    db.prepare(
      'INSERT OR REPLACE INTO projekt_variablen (id, name, value, description, bereich) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, value || '', description || '', bereich || 'Audio');
    res.status(201).json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/projects/:prefix/:projectId/variablen/:id – Variable löschen */
router.delete('/:prefix/:projectId/variablen/:id', (req, res) => {
  try {
    const rootDir = getRootDir(req.app.locals.globalDB);
    const db = openProjectDB(rootDir, req.params.prefix, req.params.projectId);
    db.prepare('DELETE FROM projekt_variablen WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
