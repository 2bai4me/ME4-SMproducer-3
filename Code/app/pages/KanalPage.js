/**
 * KanalPage – Kanal-Setup: CRUD, Kriterien, Prompts, Variablen, Vorlagen
 */

import { state, toast, esc, uid, watch, showAIOverlay, hideAIOverlay } from '../shared/state.js';
import { api } from '../shared/api.js';
import { createAccordion } from '../components/organisms/ServiceAccordion.js';

export default async function KanalPage(container) {
  container.innerHTML = `
    <div class="workspace-header">
      <h1 class="workspace-title">Kanal-Setup</h1>
      <p class="workspace-subtitle">Kanäle verwalten, Kriterien, Prompts und Vorlagen definieren</p>
    </div>
    <div class="service-accordion" id="kanal-accordion"></div>
  `;

  const acc = document.getElementById('kanal-accordion');

  const channels = state.channels;
  const activePrefix = state.activeChannelPrefix;

  // Microservice 1: Kanal auswählen / anlegen
  const channelList = channels.filter(c => c.status !== 'archiviert').map(c => `
    <option value="${c.prefix}" ${c.prefix === activePrefix ? 'selected' : ''}>${c.prefix} – ${c.title}</option>
  `).join('');

  createAccordion(acc, {
    number: 1,
    title: 'Kanal wählen / anlegen',
    status: activePrefix ? 'done' : 'none',
    open: true,
    body: `
      <button class="btn btn-secondary btn-sm mb-4" id="btn-import-channels">📥 Stammdaten importieren (.xlsx)</button>
      <div class="form-group">
        <label class="form-label">Aktiver Kanal</label>
        <select class="form-select" id="kanal-select">
          <option value="">-- Neuen Kanal anlegen --</option>
          ${channelList}
        </select>
      </div>
      <div id="new-channel-form" style="display:none;">
        <div class="form-group">
          <label class="form-label">Kanal-Präfix (eindeutig)</label>
          <input class="form-input" id="new-prefix" placeholder="z.B. technews">
        </div>
        <div class="form-group">
          <label class="form-label">Kanal-Titel</label>
          <input class="form-input" id="new-title" placeholder="z.B. Tech News Daily">
        </div>
        <div class="form-group">
          <label class="form-label">Beschreibung (4-5 Sätze)</label>
          <textarea class="form-textarea" id="new-description" rows="4" placeholder="Beschreiben Sie den Kanal und seine Zielgruppe..."></textarea>
        </div>
        <button class="btn btn-primary" id="btn-create-channel">Kanal anlegen</button>
        <button class="btn btn-secondary btn-sm" id="btn-cancel-channel">Abbrechen</button>
      </div>
      ${activePrefix ? `<div class="flex gap-2 mt-4"><button class="btn btn-warning btn-sm" id="btn-archive-channel">📦 Kanal "${activePrefix}" archivieren</button><select class="form-select" id="kanal-provider" style="font-size:0.8rem;max-width:180px;margin-left:8px;" title="KI-Provider für diesen Kanal"><option value="">−</option></select><span class="text-xs text-muted" style="align-self:center;margin-left:8px;">Zum Löschen: Einstellungen → 📺 Kanal-Anlage</span></div>` : ''}
    `
  });

  // Microservice 2: Kriterien (Research, Audio, Slides)
  if (activePrefix) {
    createAccordion(acc, {
      number: 2,
      title: 'Kriterien verwalten',
      status: 'none',
      body: `
        <div class="flex gap-2 mb-4">
          <button class="btn btn-primary btn-sm" id="btn-import-krit">📥 Import (.xlsx) – alle Bereiche</button>
        </div>
        <div class="form-group">
          <label class="form-label">Bereich</label>
          <select class="form-select" id="krit-type">
            <option value="research">Research</option>
            <option value="audio">Audio</option>
            <option value="slides">Slides</option>
          </select>
        </div>
        <div id="kriterien-editor">
          <p class="text-muted text-sm">Kriterien werden geladen...</p>
        </div>
        <div class="card mt-4" id="new-krit-form" style="display:none;">
          <div class="card-header">Neues Kriterium</div>
          <div class="form-group">
            <label class="form-label">Keyword</label>
            <input class="form-input" id="krit-keyword" placeholder="Schlagwort">
          </div>
          <div class="form-group">
            <label class="form-label">Kategorie</label>
            <input class="form-input" id="krit-category" placeholder="z.B. LLM, Technologie">
          </div>
          <div class="form-group">
            <label class="form-label">Prompt-Snippet</label>
            <textarea class="form-textarea" id="krit-promptteil" placeholder="Der Satz, der in den Prompt eingefügt wird..."></textarea>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" id="btn-save-krit">Speichern</button>
            <button class="btn btn-secondary btn-sm" id="btn-cancel-krit">Abbrechen</button>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button class="btn btn-primary btn-sm" id="btn-new-krit">+ Neues Kriterium</button>
        </div>
        <input type="file" id="krit-import-file" accept=".xlsx,.xls,.csv,.txt" style="display:none;">
        
        <!-- Import-Wizard (mehrstufig) -->
        <div class="modal-overlay" id="import-modal" style="background:rgba(0,0,0,0.65); backdrop-filter:blur(6px); position:fixed; inset:0; z-index:9999; display:none; align-items:center; justify-content:center;">
          <div class="modal-content" style="background:#ffffff; color:#1a1a2e; border:1px solid #d0d5dd; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,0.3); max-width:800px; width:95%; max-height:90vh; overflow-y:auto; padding:2rem;">
            <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <h3 id="import-modal-title" style="font-size:1.25rem; font-weight:700; color:#1a1a2e; margin:0;">📋 Schritt 1/3: Spalten zuordnen</h3>
              <button class="modal-close" id="import-modal-close" style="background:transparent; border:1px solid #d0d5dd; color:#6b7280; width:36px; height:36px; border-radius:8px; cursor:pointer; font-size:1.1rem;">✕</button>
            </div>
            <div id="import-step-indicator" style="display:flex;gap:0.5rem;margin-bottom:1.5rem;">
              <div class="step-dot active" data-step="1" style="flex:1;height:4px;background:#0f446b;border-radius:2px;"></div>
              <div class="step-dot" data-step="2" style="flex:1;height:4px;background:#e5e7eb;border-radius:2px;"></div>
              <div class="step-dot" data-step="3" style="flex:1;height:4px;background:#e5e7eb;border-radius:2px;"></div>
            </div>
            <div id="import-modal-body" style="min-height:150px;"></div>
            <div class="modal-footer" id="import-modal-footer" style="display:flex; justify-content:space-between; gap:0.75rem; margin-top:1.5rem; padding-top:1rem; border-top:1px solid #e5e7eb;">
              <button class="btn btn-secondary btn-sm" id="import-cancel" style="padding:10px 20px; background:#e5e7eb; color:#374151; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Abbrechen</button>
              <button class="btn btn-primary btn-sm" id="import-next" style="padding:10px 20px; background:#0f446b; color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Weiter →</button>
            </div>
          </div>
        </div>
      `
    });

    // Microservice 3: Prompt-Master
    createAccordion(acc, {
      number: 3,
      title: 'Prompt-Master (Generator)',
      status: 'none',
      body: `
        <p class="text-muted text-sm mb-4">Definieren Sie Prompt-Templates mit Variablen für die verschiedenen Schritte.</p>
        <div class="form-group">
          <label class="form-label">Bereich</label>
          <select class="form-select" id="prompt-section">
            <option value="thema">Schritt 1: Thema</option>
            <option value="research">Schritt 2: Research</option>
            <option value="audio">Schritt 3: Audio</option>
            <option value="slides">Schritt 4: Slides</option>
            <option value="thumbnail">Schritt 6: Thumbnail</option>
          </select>
        </div>
        <div id="prompt-editor-container">
          <p class="text-muted text-sm">Prompt-Template wird geladen...</p>
        </div>
      `
    });

    // Microservice 5: Vorlagen
    // Microservice 4: Kanal-Variablen (F-K06)
    createAccordion(acc, {
      number: 4,
      title: 'Variablen',
      status: 'none',
      body: `
        <p class="text-muted text-sm mb-4">Definieren Sie Variablen, die in Prompt-Templates mit <code>{{name}}</code> verwendet werden können.</p>
        <div id="variablen-list"></div>
        <div class="card mt-4" id="new-variable-form" style="display:none;">
          <div class="card-header">Neue Variable</div>
          <div class="form-group">
            <label class="form-label">Name (technisch, z.B. "zielgruppe")</label>
            <input class="form-input" id="var-name" placeholder="zielgruppe">
          </div>
          <div class="form-group">
            <label class="form-label">Wert</label>
            <input class="form-input" id="var-value" placeholder="Tech-Enthusiasten zwischen 20-35">
          </div>
          <div class="form-group">
            <label class="form-label">Beschreibung (optional)</label>
            <input class="form-input" id="var-description" placeholder="Zielgruppe des Kanals">
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" id="btn-save-variable">Speichern</button>
            <button class="btn btn-secondary btn-sm" id="btn-cancel-variable">Abbrechen</button>
          </div>
        </div>
        <button class="btn btn-primary btn-sm mt-3" id="btn-new-variable">+ Neue Variable</button>
      `
    });

    createAccordion(acc, {
      number: 5,
      title: 'Video-Vorlagen',
      status: 'none',
      body: `
        <p class="text-muted text-sm mb-4">Verwalten Sie Intro, Outro, Hintergrund-Vorlagen für die Video-Erstellung.</p>
        <div id="vorlagen-list"></div>
        <div class="card mt-4" id="new-vorlage-form" style="display:none;">
          <div class="card-header">Neue Vorlage</div>
          <div class="form-group">
            <label class="form-label">Typ</label>
            <select class="form-select" id="vorlage-type">
              <option value="intro">Intro</option>
              <option value="hauptteil">Hauptteil</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bezeichnung</label>
            <input class="form-input" id="vorlage-label" placeholder="z.B. Standard Intro Blau">
          </div>
          <div class="form-group">
            <label class="form-label">Datei hochladen</label>
            <input type="file" id="vorlage-file" accept="image/*,video/*" style="padding:8px;border:1px solid #d0d5dd;border-radius:6px;width:100%;">
            <span class="form-hint">Datei wird automatisch im Vorlagen-Ordner abgelegt und mit Kanal-Präfix umbenannt.</span>
          </div>
          <div class="form-group">
            <label class="form-label">Medientyp</label>
            <select class="form-select" id="vorlage-media">
              <option value="image">Bild</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Kategorie</label>
            <select class="form-select" id="vorlage-kategorie">
              <option value="">-- keine --</option>
              <option value="Hintergrund">Hintergrund</option>
              <option value="Slides">Slides</option>
              <option value="Sprecher">Sprecher</option>
              <option value="Intro-Video">Intro-Video</option>
              <option value="Intro-Bild">Intro-Bild</option>
              <option value="Outro-Video">Outro-Video</option>
              <option value="Outro-Bild">Outro-Bild</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Dauer (Sekunden, optional)</label>
            <input class="form-input" id="vorlage-dauer" type="number" min="0" step="0.1" placeholder="z.B. 5.0" style="max-width:120px;">
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" id="btn-save-vorlage">Speichern</button>
            <button class="btn btn-secondary btn-sm" id="btn-cancel-vorlage">Abbrechen</button>
          </div>
        </div>
        <button class="btn btn-primary btn-sm mt-3" id="btn-new-vorlage">+ Neue Vorlage</button>
      `
    });

    // Microservice 6: Marketing-Kontakte
    createAccordion(acc, {
      number: 6,
      title: 'Marketing-Kontakte',
      status: 'none',
      body: `
        <p class="text-muted text-sm mb-4">Kontakte für das Videomarketing verwalten.</p>
        <div id="kontakte-list"></div>
        <div class="card mt-4" id="new-kontakt-form" style="display:none;">
          <div class="card-header">Neuer Kontakt</div>
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" id="kontakt-name" placeholder="Name der Person / Organisation">
          </div>
          <div class="form-group">
            <label class="form-label">Kanal</label>
            <select class="form-select" id="kontakt-channel">
              <option value="Email">Email</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter/X">Twitter/X</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Andere">Andere</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Kontakt-Info (Email, URL, Telefon)</label>
            <input class="form-input" id="kontakt-info" placeholder="z.B. max@example.com">
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" id="btn-save-kontakt">Speichern</button>
            <button class="btn btn-secondary btn-sm" id="btn-cancel-kontakt">Abbrechen</button>
          </div>
        </div>
        <button class="btn btn-primary btn-sm mt-3" id="btn-new-kontakt">+ Neuer Kontakt</button>
      `
    });

    // PLAT-01: Plattform-Zugangsdaten
    createAccordion(acc, {
      number: 7,
      title: 'Plattformen',
      status: 'none',
      body: `
        <p class="text-muted text-sm mb-4">Zugangsdaten für Social-Media-Plattformen pro Kanal verwalten.</p>
        <div id="plattformen-list"></div>
        <div class="card mt-4" id="new-plattform-form" style="display:none;">
          <div class="card-header">Neue Plattform</div>
          <div class="form-group">
            <label class="form-label">Plattform</label>
            <select class="form-select" id="plattform-name">
              <option value="YouTube">YouTube</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Xing">Xing</option>
              <option value="Facebook">Facebook</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bezeichnung (optional)</label>
            <input class="form-input" id="plattform-label" placeholder="z.B. Hauptaccount">
          </div>
          <div class="form-group">
            <label class="form-label">API-Key</label>
            <input class="form-input" id="plattform-apikey" placeholder="API-Key / Client-ID">
          </div>
          <div class="form-group">
            <label class="form-label">API-Secret</label>
            <input class="form-input" id="plattform-apisecret" placeholder="API-Secret / Client-Secret">
          </div>
          <div class="form-group">
            <label class="form-label">Access-Token</label>
            <input class="form-input" id="plattform-token" placeholder="Bearer-Token oder Access-Token">
          </div>
          <div class="form-group">
            <label class="form-label">Username (falls zutreffend)</label>
            <input class="form-input" id="plattform-username" placeholder="@username">
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" id="btn-save-plattform">Speichern</button>
            <button class="btn btn-secondary btn-sm" id="btn-cancel-plattform">Abbrechen</button>
          </div>
        </div>
        <button class="btn btn-primary btn-sm mt-3" id="btn-new-plattform">+ Neue Plattform</button>
      `
    });

    // TAG-01: Kategorien/Tags verwalten
    createAccordion(acc, {
      number: 8,
      title: 'Kategorien/Tags',
      status: 'none',
      body: `
        <p class="text-muted text-sm mb-4">Kategorien/Tags für Themen-Extraktion und Filter verwalten.</p>
        <div id="tags-list" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:1rem;"></div>
        <div style="display:flex;gap:8px;">
          <input id="new-tag-input" placeholder="Neuer Tag (z.B. Medizin)" style="flex:1;padding:6px 10px;border:1px solid #d0d5dd;border-radius:6px;font-size:0.85rem;">
          <button class="btn btn-primary btn-sm" id="btn-add-tag">+ Hinzufügen</button>
        </div>
      `
    });


  // ─── Wire: Channel CRUD ──────────────────────────────────────────
  document.getElementById('kanal-select')?.addEventListener('change', (e) => {
    const prefix = e.target.value;
    if (prefix) {
      const ch = state.channels.find(c => c.prefix === prefix);
      if (ch) state.selectedChannel = ch;
      document.getElementById('new-channel-form').style.display = 'none';
    } else {
      document.getElementById('new-channel-form').style.display = 'block';
    }
  });

  document.getElementById('btn-cancel-channel')?.addEventListener('click', () => {
    document.getElementById('new-channel-form').style.display = 'none';
    document.getElementById('kanal-select').value = activePrefix || '';
  });

  document.getElementById('btn-create-channel')?.addEventListener('click', async () => {
    const prefix = document.getElementById('new-prefix')?.value?.trim();
    const title = document.getElementById('new-title')?.value?.trim();
    const description = document.getElementById('new-description')?.value?.trim();

    if (!prefix || !title) return toast('Prefix und Titel sind Pflichtfelder', 'error');

    try {
      await api.createChannel({ prefix, title, description });
      toast(`Kanal "${prefix}" angelegt`);
      state.channels = await api.getChannels();
      window.dispatchEvent(new CustomEvent('channel-created'));
      const ch = state.channels.find(c => c.prefix === prefix);
      if (ch) state.selectedChannel = ch;
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('btn-import-channels')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const result = await api.importChannels(file);

        // IMP-17: KI-Format-Prüfung – Mapping-Bestätigung anzeigen
        if (result.needsReview) {
          showImportMappingPopup(file, result);
          return;
        }

        toast(`${result.imported} Kanäle importiert, ${result.errors.length} Fehler`, result.errors.length > 0 ? 'warning' : 'success');
        if (result.errors.length > 0) {
          console.warn('Import-Fehler:', result.errors);
        }
        state.channels = await api.getChannels();
        window.dispatchEvent(new CustomEvent('channel-created'));
      } catch (err) {
        toast(`Import fehlgeschlagen: ${err.message}`, 'error');
      }
    };
    input.click();
  });

  document.getElementById('btn-archive-channel')?.addEventListener('click', async () => {
    if (!confirm(`Kanal "${activePrefix}" wirklich archivieren? Der Kanal-Ordner wird gezippt und ins Archiv verschoben.`)) return;
    try {
      const result = await api.archiveChannel(activePrefix);
      toast(`Kanal "${activePrefix}" archiviert ✅`, 'success');
      state.channels = await api.getChannels();
      state.selectedChannel = state.channels[0] || null;
    } catch (err) { toast(err.message, 'error'); }
  });

  // ─── Wire: Kriterien ─────────────────────────────────────────────
  document.getElementById('krit-type')?.addEventListener('change', () => loadKriterien());
  document.getElementById('btn-new-krit')?.addEventListener('click', () => {
    document.getElementById('new-krit-form').style.display = 'block';
  });
  document.getElementById('btn-cancel-krit')?.addEventListener('click', () => {
    document.getElementById('new-krit-form').style.display = 'none';
    ['krit-keyword','krit-category','krit-promptteil'].forEach(id => document.getElementById(id).value = '');
  });
  document.getElementById('btn-save-krit')?.addEventListener('click', async () => {
    const typ = document.getElementById('krit-type').value;
    const keyword = document.getElementById('krit-keyword')?.value?.trim();
    const kategorie = document.getElementById('krit-category')?.value?.trim();
    const prompt_snippet = document.getElementById('krit-promptteil')?.value?.trim();

    if (!keyword) return toast('Keyword ist Pflichtfeld', 'error');
    if (!prompt_snippet) return toast('Prompt-Snippet ist Pflichtfeld', 'error');

    try {
      await api.saveKriterium(activePrefix, { typ, keyword, kategorie, prompt_snippet });
      toast('Kriterium gespeichert', 'success');
      document.getElementById('new-krit-form').style.display = 'none';
      ['krit-keyword','krit-category','krit-promptteil'].forEach(id => document.getElementById(id).value = '');
      loadKriterien();
    } catch (err) { toast(err.message, 'error'); }
  });

  // ─── Wire: Kriterien-Import (mehrstufiger Wizard) ──────────────
  let importStep = 1;
  let importAllRows = null;
  let importMapping = null;
  let importCorrected = null;

  document.getElementById('btn-import-krit')?.addEventListener('click', () => {
    document.getElementById('krit-import-file').click();
  });

  document.getElementById('krit-import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleKritImport(file);
    e.target.value = '';
  });

  async function handleKritImport(file) {
    const modal = document.getElementById('import-modal');
    const body = document.getElementById('import-modal-body');
    const title = document.getElementById('import-modal-title');
    const nextBtn = document.getElementById('import-next');

    importStep = 1;
    body.innerHTML = '<p style="color:#1a1a2e;">🔍 Datei wird analysiert...</p>';
    title.textContent = '📋 Schritt 1/3: Spalten zuordnen';
    updateStepIndicator(1);
    nextBtn.textContent = 'Weiter →';
    nextBtn.style.background = '#0f446b';
    nextBtn.style.display = '';
    nextBtn.disabled = false;
    modal.style.display = 'flex';

    try {
      const result = await api.parseKriterienFile(state.activeChannelPrefix, file);
      importAllRows = result.allRows || result.sampleRows || [];
      importMapping = result.suggestedMapping || {};
      importCorrected = result.correctedRows || null;

      if (importAllRows.length === 0) {
        body.innerHTML = '<p style="color:#dc2626;">❌ Datei ist leer.</p>';
        nextBtn.style.display = 'none';
        return;
      }

      const headers = result.headers || Object.keys(importAllRows[0]);

      // KI-Vorschlag für Mapping einholen
      body.innerHTML = '<p style="color:#1a1a2e;">🤖 KI analysiert Spalten für optimale Zuordnung...</p>';
      try {
        showAIOverlay('KI analysiert Import', 'Die KI ordnet die Excel-Spalten den richtigen Zielfeldern zu (typ, keyword, kategorie, prompt_snippet).');
        const mapResp = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: 'Du ordnest Excel-Spalten den Zielfeldern zu. Zielfelder: typ (audio|research|slides), keyword, kategorie, prompt_snippet. Analysiere SpaltenNAMEN und BeispielWERTE. Gib NUR JSON zurück: {"typ":"<Spaltenname>","keyword":"<Spaltenname>","kategorie":"<Spaltenname>","prompt_snippet":"<Spaltenname>"}',
            userMessage: `Spalten: ${headers.join(', ')}\nBeispieldaten (erste 3 Zeilen):\n${JSON.stringify(importAllRows.slice(0,3))}\n\nOrdne zu. "Kanal" oder "Präfix" → typ (default: research).`,
          }),
        });
        if (mapResp.ok) {
          const mapData = await mapResp.json();
          if (mapData.response) {
            const jsonMatch = mapData.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const kiMapping = JSON.parse(jsonMatch[0]);
              // Nur gültige Spaltennamen übernehmen
              for (const [key, val] of Object.entries(kiMapping)) {
                if (headers.includes(val)) importMapping[key] = val;
              }
            }
          }
        }
      } catch (_) { /* KI nicht verfügbar – Fallback auf Heuristik */ }
      hideAIOverlay();

      // Schritt 1: Mapping anzeigen
      const targets = ['typ', 'keyword', 'kategorie', 'prompt_snippet'];
      const targetLabels = { typ: 'Typ (audio/research/slides)', keyword: 'Keyword (eindeutig)', kategorie: 'Kategorie', prompt_snippet: 'Prompt / Textschnipsel' };

      const mappingRows = targets.map(t => {
        const mapped = importMapping[t] || '';
        const options = ['', ...headers].map(h => `<option value="${h}" ${h === mapped ? 'selected' : ''}>${h || '-- automatisch --'}</option>`).join('');
        return `<tr>
          <td style="font-weight:600;padding:8px;">${targetLabels[t]}</td>
          <td style="padding:8px;color:#6b7280;">←</td>
          <td style="padding:8px;"><select class="import-mapping-select" data-target="${t}" style="padding:6px;border:1px solid #d0d5dd;border-radius:4px;width:100%;background:#fff;">${options}</select></td>
        </tr>`;
      }).join('');

      body.innerHTML = `
        <p style="color:#374151;margin-bottom:0.25rem;"><strong>${importAllRows.length} Zeilen</strong> erkannt</p>
        <p style="color:#6b7280;font-size:0.8rem;margin-bottom:1rem;">🤖 KI-Vorschlag. Du kannst per Dropdown ändern. <em>Tipp: Enthält deine Datei eine Spalte für den Typ (audio/research/slides), kannst du alle Typen auf einmal importieren.</em></p>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr><th style="text-align:left;padding:8px;border-bottom:2px solid #e5e7eb;">Zielfeld</th><th></th><th style="text-align:left;padding:8px;border-bottom:2px solid #e5e7eb;">Excel-Spalte (KI-Vorschlag)</th></tr></thead>
          <tbody>${mappingRows}</tbody>
        </table>
        <p style="color:#6b7280;font-size:0.8rem;margin-top:0.5rem;">Vorschau erste Zeile: <code style="background:#f3f4f6;padding:2px 6px;border-radius:3px;">${esc(JSON.stringify(importAllRows[0]).substring(0,120))}</code></p>
      `;

      nextBtn.onclick = () => showStep2();
    } catch (err) {
      body.innerHTML = `<p style="color:#dc2626;font-weight:600;">❌ Fehler: ${err.message}</p>`;
      nextBtn.style.display = 'none';
    }
  }

  function updateStepIndicator(step) {
    document.querySelectorAll('#import-step-indicator .step-dot').forEach(d => {
      d.style.background = parseInt(d.dataset.step) <= step ? '#0f446b' : '#e5e7eb';
    });
  }

  function getCurrentMapping() {
    const m = {};
    document.querySelectorAll('.import-mapping-select').forEach(s => {
      if (s.value) m[s.dataset.target] = s.value;
    });
    return m;
  }

  function showStep2() {
    importStep = 2;
    const title = document.getElementById('import-modal-title');
    const body = document.getElementById('import-modal-body');
    const nextBtn = document.getElementById('import-next');

    const mapping = getCurrentMapping();
    if (!mapping.keyword) {
      body.innerHTML = '<p style="color:#dc2626;">❌ Bitte mindestens das Feld "Keyword" zuordnen.</p>';
      return;
    }

    title.textContent = '📋 Schritt 2/3: Daten prüfen';
    updateStepIndicator(2);
    nextBtn.textContent = '🤖 KI-Korrektur starten →';
    nextBtn.style.background = '#7c3aed';

    const mapped = importAllRows.map(row => ({
      typ: mapping.typ ? String(row[mapping.typ] || 'research').toLowerCase() : 'research',
      keyword: mapping.keyword ? String(row[mapping.keyword] || '') : '',
      kategorie: mapping.kategorie ? String(row[mapping.kategorie] || '') : '',
      prompt_snippet: mapping.prompt_snippet ? String(row[mapping.prompt_snippet] || '') : '',
    })).filter(r => r.keyword);

    importMapping = mapping;
    importCorrected = mapped;

    const preview = buildImportTable(mapped.slice(0, 50), false);
    body.innerHTML = `
      <p style="color:#374151;margin-bottom:0.5rem;"><strong>${mapped.length} Zeilen</strong> nach Mapping:</p>
      <p style="color:#6b7280;font-size:0.8rem;margin-bottom:1rem;">Mapping: ${Object.entries(mapping).filter(([_,v])=>v).map(([k,v])=>k+' ← '+v).join(', ')}</p>
      <div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:8px;">${preview}</div>
    `;

    nextBtn.onclick = () => showStep3(mapped, mapping);
  }

  async function showStep3(mapped, mapping) {
    importStep = 3;
    const title = document.getElementById('import-modal-title');
    const body = document.getElementById('import-modal-body');
    const nextBtn = document.getElementById('import-next');

    title.textContent = '📋 Schritt 3/3: KI-Korrektur';
    updateStepIndicator(3);
    body.innerHTML = '<p style="color:#1a1a2e;">🤖 KI prüft Rechtschreibung & Grammatik...</p>';
    nextBtn.textContent = '⏳ Prüfe...';
    nextBtn.disabled = true;
    nextBtn.style.background = '#0f446b';

    try {
      // KI-Korrektur: nur prompt_snippet Texte senden (batch à 5)
      const batchSize = 5;
      const toCorrect = mapped.slice(0, batchSize);
      const snippets = toCorrect.map(r => r.prompt_snippet);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      const resp = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: 'Korrigiere Rechtschreibung und Grammatik. Gib NUR ein JSON-Array mit den korrigierten Texten zurück. Reihenfolge beibehalten.',
          userMessage: `Korrigiere diese ${snippets.length} Texte:\n${JSON.stringify(snippets)}\n\nGib ein JSON-String-Array mit den korrigierten Texten zurück.`,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      if (!text) throw new Error('Leere Antwort vom Server');
      const data = JSON.parse(text);
      let corrected = mapped;

      if (data.response) {
        try {
          const jsonMatch = data.response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // Neues Format: Array von Strings (korrigierte prompt_snippets)
            if (parsed.length > 0 && typeof parsed[0] === 'string') {
              corrected = mapped.map((row, i) => ({
                ...row,
                prompt_snippet: parsed[i] || row.prompt_snippet
              }));
            } else if (parsed.length > 0) {
              // Altes Format: Array von Objekten
              corrected = parsed;
            }
          }
        } catch (_) {}
      }

      importCorrected = corrected;

      let changes = 0;
      const previewRows = corrected.slice(0, 50).map((row, i) => {
        const orig = mapped[i];
        const changed = orig && row.prompt_snippet !== orig.prompt_snippet;
        if (changed) changes++;
        return { ...row, _changed: changed };
      });

      const allKeys = Object.keys(previewRows[0] || {}).filter(k => k !== '_changed');

      body.innerHTML = `
        <p style="color:#374151;margin-bottom:0.5rem;">🤖 KI-Korrektur abgeschlossen: <strong>${changes} Änderungen</strong> gefunden</p>
        <p style="color:#6b7280;font-size:0.8rem;margin-bottom:1rem;">Korrigierte Felder sind <span style="background:#fef3c7;padding:1px 4px;border-radius:2px;">gelb markiert</span></p>
        <div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:8px;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
            <thead><tr>${allKeys.map(k=>`<th style="padding:6px 8px;border-bottom:2px solid #e5e7eb;text-align:left;">${esc(k)}</th>`).join('')}</tr></thead>
            <tbody>${previewRows.map(r=>`<tr>${allKeys.map(k=>`<td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;${r._changed && k==='prompt_snippet'?'background:#fef3c7':''}">${esc(String(r[k]||'').substring(0,80))}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
      `;

      nextBtn.textContent = '✅ Importieren';
      nextBtn.disabled = false;
      nextBtn.style.background = '#059669';
      nextBtn.onclick = () => doImport();
    } catch (err) {
      const errMsg = err.name === 'AbortError' ? 'Zeitüberschreitung – KI braucht zu lange' : `Server-Fehler: ${esc(err.message)}`;
      body.innerHTML = `
        <p style="color:#92400e;margin-bottom:0.5rem;">⚠️ KI-Korrektur nicht verfügbar</p>
        <p style="color:#6b7280;font-size:0.85rem;margin-bottom:1rem;">${errMsg}</p>
        <p style="color:#374151;font-size:0.85rem;">Du kannst trotzdem importieren (Daten werden unkorrigiert übernommen).</p>
      `;
      nextBtn.textContent = '✅ Trotzdem importieren';
      nextBtn.disabled = false;
      nextBtn.style.background = '#f59e0b';
      importCorrected = mapped;
      nextBtn.onclick = () => doImport();

      // Alte Retry-Buttons entfernen, dann neuen hinzufügen
      document.querySelectorAll('#import-retry-btn').forEach(b => b.remove());
      const retryBtn = document.createElement('button');
      retryBtn.id = 'import-retry-btn';
      retryBtn.textContent = '🔄 Neu versuchen';
      retryBtn.style.cssText = 'padding:10px 20px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-left:8px;';
      retryBtn.onclick = () => showStep3(mapped, importMapping);
      nextBtn.parentNode.appendChild(retryBtn);
    }
  }

  async function doImport() {
    const nextBtn = document.getElementById('import-next');
    nextBtn.disabled = true;
    nextBtn.textContent = '⏳ Importiere...';

    try {
      const result = await api.importKriterien(state.activeChannelPrefix, importCorrected || []);
      const msg = `${result.imported || 0} neu, ${result.updated || 0} aktualisiert${result.errors?.length ? ', ' + result.errors.length + ' Fehler' : ''}`;
      toast(msg, result.errors?.length ? 'warning' : 'success');
      document.getElementById('import-modal').style.display = 'none';
      loadKriterien();
    } catch (err) {
      toast('Import fehlgeschlagen: ' + err.message, 'error');
      nextBtn.disabled = false;
      nextBtn.textContent = '✅ Importieren';
    }
  }

  function parseTabularData(text) {
    // Try tab-separated, comma-separated, or semicolon-separated
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return [];
    
    // Detect delimiter
    const first = lines[0];
    let delim = '\t';
    if (first.split(';').length > first.split('\t').length) delim = ';';
    if (first.split(',').length > first.split(delim).length) delim = ',';
    
    return lines.map(l => l.split(delim).map(c => c.trim().replace(/^"|"$/g, '')));
  }

  async function analyzeWithKI(text, header, rows) {
    const sample = rows.slice(0, 10).map(r => r.join(' | ')).join('\n');
    const result = await api.callLLM({
      systemPrompt: `Du analysierst Tabellendaten für Kriterien-Import. Erkannte Spalten: ${header.join(', ')}. Erwartet werden: typ (audio/research/slides), keyword, kategorie, prompt_snippet. Ordne die vorhandenen Spalten den erwarteten zu. Wenn typ fehlt, verwende den aktuell ausgewählten Typ. Gib NUR ein JSON-Array zurück: [{"typ":"audio","keyword":"...","kategorie":"...","prompt_snippet":"..."},...]`,
      userMessage: `Rohdaten (erste 10 Zeilen):\n${sample}\n\nKonvertiere in das Zielformat.`
    });

    try {
      // Extract JSON from response
      const jsonMatch = result.response?.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (_) {}
    
    // Fallback: use headers as-is
    return rows.map(r => {
      const obj = {};
      header.forEach((h, i) => { obj[h] = r[i] || ''; });
      return obj;
    });
  }

  function buildImportTable(rows, kiUsed) {
    if (rows.length === 0) return '<p>Keine Daten</p>';
    const keys = Object.keys(rows[0]);
    return `
      <table class="data-table">
        <thead><tr>${keys.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(r => `<tr>${keys.map(k => `<td>${esc(String(r[k] || ''))}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `;
  }

  // Modal close/cancel
  document.getElementById('import-modal-close')?.addEventListener('click', () => {
    document.getElementById('import-modal').style.display = 'none';
    importAllRows = null; importMapping = null; importCorrected = null;
  });
  document.getElementById('import-cancel')?.addEventListener('click', () => {
    document.getElementById('import-modal').style.display = 'none';
    importAllRows = null; importMapping = null; importCorrected = null;
  });

  // ─── Wire: Prompts ───────────────────────────────────────────────
  document.getElementById('prompt-section')?.addEventListener('change', () => loadPromptEditor());

  // ─── Wire: Variablen (F-K06) ─────────────────────────────────────
  document.getElementById('btn-new-variable')?.addEventListener('click', () => {
    document.getElementById('new-variable-form').style.display = 'block';
  });
  document.getElementById('btn-cancel-variable')?.addEventListener('click', () => {
    document.getElementById('new-variable-form').style.display = 'none';
    ['var-name','var-value','var-description'].forEach(id => document.getElementById(id).value = '');
  });
  document.getElementById('btn-save-variable')?.addEventListener('click', async () => {
    const name = document.getElementById('var-name')?.value?.trim();
    const value = document.getElementById('var-value')?.value?.trim();
    const description = document.getElementById('var-description')?.value?.trim();
    if (!name) return toast('Name ist Pflichtfeld', 'error');
    try {
      await api.saveVariable(state.activeChannelPrefix, { id: uid(), name, value, description });
      toast('Variable gespeichert', 'success');
      document.getElementById('new-variable-form').style.display = 'none';
      ['var-name','var-value','var-description'].forEach(id => document.getElementById(id).value = '');
      loadVariablenList();
    } catch (err) { toast(err.message, 'error'); }
  });

  // ─── Wire: Vorlagen ──────────────────────────────────────────────
  document.getElementById('btn-new-vorlage')?.addEventListener('click', () => {
    document.getElementById('new-vorlage-form').style.display = 'block';
  });
  document.getElementById('btn-cancel-vorlage')?.addEventListener('click', () => {
    document.getElementById('new-vorlage-form').style.display = 'none';
    document.getElementById('vorlage-label').value = '';
    document.getElementById('vorlage-file').value = '';
  });
  document.getElementById('btn-save-vorlage')?.addEventListener('click', async () => {
    const type = document.getElementById('vorlage-type')?.value;
    const label = document.getElementById('vorlage-label')?.value?.trim();
    const fileInput = document.getElementById('vorlage-file');
    const file = fileInput?.files[0];
    const media_type = document.getElementById('vorlage-media')?.value;

    if (!label) return toast('Bezeichnung ist Pflichtfeld', 'error');
    if (!file) return toast('Bitte eine Datei auswählen', 'error');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('id', uid());
      formData.append('type', type);
      formData.append('label', label);
      formData.append('media_type', media_type);
      formData.append('kategorie', document.getElementById('vorlage-kategorie')?.value || '');
      formData.append('dauer_sekunden', document.getElementById('vorlage-dauer')?.value || '0');
      formData.append('aspect', '16:9');
      await api.uploadVorlage(activePrefix, formData);
      toast('Vorlage hochgeladen & gespeichert');
      document.getElementById('new-vorlage-form').style.display = 'none';
      document.getElementById('vorlage-label').value = '';
      document.getElementById('vorlage-file').value = '';
      loadVorlagen();
    } catch (err) { toast(err.message, 'error'); }
  });

  // ─── Wire: Kontakte ──────────────────────────────────────────────
  document.getElementById('btn-new-kontakt')?.addEventListener('click', () => {
    document.getElementById('new-kontakt-form').style.display = 'block';
  });
  document.getElementById('btn-cancel-kontakt')?.addEventListener('click', () => {
    document.getElementById('new-kontakt-form').style.display = 'none';
    ['kontakt-name','kontakt-info'].forEach(id => document.getElementById(id).value = '');
  });
  document.getElementById('btn-save-kontakt')?.addEventListener('click', async () => {
    const name = document.getElementById('kontakt-name')?.value?.trim();
    const channel = document.getElementById('kontakt-channel')?.value;
    const contact_info = document.getElementById('kontakt-info')?.value?.trim();

    if (!name) return toast('Name ist Pflichtfeld', 'error');

    try {
      await api.saveKontakt(activePrefix, { id: uid(), name, channel, contact_info, status: 'pending' });
      toast('Kontakt gespeichert');
      document.getElementById('new-kontakt-form').style.display = 'none';
      ['kontakt-name','kontakt-info'].forEach(id => document.getElementById(id).value = '');
      loadKontakte();
    } catch (err) { toast(err.message, 'error'); }
  });

  // ─── Wire: Plattformen (PLAT-01) ────────────────────────────────
  document.getElementById('btn-new-plattform')?.addEventListener('click', () => {
    document.getElementById('new-plattform-form').style.display = 'block';
  });
  document.getElementById('btn-cancel-plattform')?.addEventListener('click', () => {
    document.getElementById('new-plattform-form').style.display = 'none';
  });
  document.getElementById('btn-save-plattform')?.addEventListener('click', async () => {
    const plattform = document.getElementById('plattform-name')?.value;
    const label = document.getElementById('plattform-label')?.value?.trim();
    if (!plattform) return toast('Plattform auswählen', 'error');
    try {
      await api.savePlattform(activePrefix, {
        id: uid(), plattform, label,
        api_key: document.getElementById('plattform-apikey')?.value?.trim() || '',
        api_secret: document.getElementById('plattform-apisecret')?.value?.trim() || '',
        access_token: document.getElementById('plattform-token')?.value?.trim() || '',
        username: document.getElementById('plattform-username')?.value?.trim() || '',
        is_active: 1
      });
      toast('Plattform gespeichert', 'success');
      document.getElementById('new-plattform-form').style.display = 'none';
      loadPlattformen();
    } catch (err) { toast(err.message, 'error'); }
  });

  // ─── Initial load ─────────────────────────────────────────────────
  if (activePrefix) {
    loadKriterien();
    loadPromptEditor();
    loadVariablenList();
    loadVorlagen();
    loadKontakte();
    loadPlattformen();
    loadTags();
  }

  // F-K06: Variablen laden und verwalten
  async function loadVariablenList() {
    const el = document.getElementById('variablen-list');
    if (!el) return;
    try {
      const variablen = await api.getVariablen(state.activeChannelPrefix);
      if (variablen.length === 0) {
        el.innerHTML = '<p class="text-muted text-sm">Keine Variablen definiert. Nutzen Sie <code>{{name}}</code> in Prompt-Templates.</p>';
        return;
      }
      el.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
          <thead><tr>
            <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e5e7eb;color:#6b7280;">Name</th>
            <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e5e7eb;color:#6b7280;">Wert</th>
            <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #e5e7eb;color:#6b7280;">Beschreibung</th>
            <th style="width:60px;"></th>
          </tr></thead>
          <tbody>
            ${variablen.map(v => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:6px 8px;font-family:monospace;font-weight:500;color:#0f446b;">{{${esc(v.name || v.tech_name || '')}}}</td>
                <td style="padding:6px 8px;color:#374151;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(v.value || v.wert || '')}">${esc((v.value || v.wert || '').substring(0, 60))}</td>
                <td style="padding:6px 8px;color:#6b7280;font-size:0.78rem;">${esc(v.description || v.beschreibung || '-')}</td>
                <td style="padding:6px 8px;text-align:center;">
                  <button data-delete-var="${esc(v.id)}" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:0.9rem;" title="Löschen">🗑</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      // Wire delete buttons
      el.querySelectorAll('[data-delete-var]').forEach(btn => {
        btn.onclick = async () => {
          const id = btn.dataset.deleteVar;
          if (!confirm('Variable wirklich löschen?')) return;
          try {
            await api.deleteVariable(state.activeChannelPrefix, id);
            toast('Variable gelöscht', 'success');
            loadVariablenList();
          } catch (err) { toast(err.message, 'error'); }
        };
      });
    } catch (err) {
      el.innerHTML = `<p class="text-muted">Fehler: ${err.message}</p>`;
    }
  }

  // TAG-01: Tags laden und verwalten
  async function loadTags() {
    const el = document.getElementById('tags-list');
    if (!el) return;
    try {
      const settings = await api.getChannelSettings(state.activeChannelPrefix);
      const raw = settings?.kategorien_tags || '[]';
      const tags = JSON.parse(raw);
      el.innerHTML = tags.map(t => `
        <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#e8f0f8;border-radius:12px;font-size:0.8rem;">
          ${esc(t)}
          <button data-del-tag="${esc(t)}" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:0.9rem;">×</button>
        </span>
      `).join('');
      el.querySelectorAll('[data-del-tag]').forEach(btn => {
        btn.onclick = async () => {
          const del = btn.dataset.delTag;
          const newTags = tags.filter(t => t !== del);
          await api.saveChannelSetting(state.activeChannelPrefix, 'kategorien_tags', JSON.stringify(newTags));
          loadTags();
        };
      });
    } catch (_) {}
  }
  document.getElementById('btn-add-tag')?.addEventListener('click', async () => {
    const input = document.getElementById('new-tag-input');
    const val = input?.value?.trim();
    if (!val) return;
    try {
      const settings = await api.getChannelSettings(state.activeChannelPrefix);
      const tags = JSON.parse(settings?.kategorien_tags || '[]');
      if (!tags.includes(val)) {
        tags.push(val);
        await api.saveChannelSetting(state.activeChannelPrefix, 'kategorien_tags', JSON.stringify(tags));
        input.value = '';
        loadTags();
        toast('Tag hinzugefügt', 'success');
      }
    } catch (err) { toast(err.message, 'error'); }
  });
}

/**
 * IMP-17: Popup für KI-Format-Prüfung beim Kanal-Import.
 * Zeigt die vom LLM vorgeschlagene Spaltenzuordnung und erlaubt Korrektur.
 * @param {File} file – Die originale Excel-Datei
 * @param {object} result – API-Response mit { headers, sampleRows, suggestedMapping, message }
 */
async function showImportMappingPopup(file, result) {
  const { headers, sampleRows, suggestedMapping } = result;

  // Mapping-Editor HTML
  const headerOptions = headers.map(h => `<option value="${h}">${h}</option>`).join('');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'background: rgba(0,0,0,0.65); backdrop-filter: blur(6px); position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center;';
  overlay.innerHTML = `
    <div class="modal modal-lg" style="background:#ffffff; color:#1a1a2e; border:1px solid #d0d5dd; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,0.3); max-width:750px; width:95%; max-height:90vh; overflow-y:auto; padding:2rem;">
      <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h3 class="modal-title" style="font-size:1.25rem; font-weight:700; color:#1a1a2e; margin:0;">📋 Spaltenzuordnung prüfen</h3>
        <button class="modal-close" id="map-close" style="background:transparent; border:1px solid #d0d5dd; color:#6b7280; width:36px; height:36px; border-radius:8px; cursor:pointer; font-size:1.1rem; display:flex; align-items:center; justify-content:center;">✕</button>
      </div>
      <div class="modal-body" style="min-height:200px;">
        <p style="font-size:0.9rem; color:#6b7280; margin-bottom:1rem;">${result.message}</p>
        <div style="max-height:200px;overflow-y:auto;margin-bottom:1rem;">
          <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
            <thead><tr>${headers.map(h => `<th style="padding:4px 8px;border-bottom:2px solid var(--border-color);text-align:left;">${h}</th>`).join('')}</tr></thead>
            <tbody>
              ${(sampleRows || []).slice(0, 3).map(row => `
                <tr>${headers.map(h => `<td style="padding:4px 8px;border-bottom:1px solid var(--border-color);">${String(row[h] || '').substring(0, 60)}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1rem;">
          <div class="form-group">
            <label class="form-label" style="font-weight:600; color:#1a1a2e;">Prefix (Kürzel)</label>
            <select class="form-select" id="map-prefix" style="width:100%; padding:8px; border:1px solid #d0d5dd; border-radius:6px; background:#fff; color:#1a1a2e;">${headerOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600; color:#1a1a2e;">Titel</label>
            <select class="form-select" id="map-title" style="width:100%; padding:8px; border:1px solid #d0d5dd; border-radius:6px; background:#fff; color:#1a1a2e;">${headerOptions}</select>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight:600; color:#1a1a2e;">Beschreibung (optional)</label>
            <select class="form-select" id="map-desc" style="width:100%; padding:8px; border:1px solid #d0d5dd; border-radius:6px; background:#fff; color:#1a1a2e;">
              <option value="">-- Keine --</option>
              ${headerOptions}
            </select>
          </div>
        </div>
      </div>
      <div class="modal-actions" style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:1.5rem; padding-top:1rem; border-top:1px solid #e5e7eb;">
        <button class="btn btn-primary" id="map-confirm" style="padding:10px 20px; background:#0f446b; color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer;">✅ Importieren</button>
        <button class="btn btn-secondary" id="map-cancel" style="padding:10px 20px; background:#e5e7eb; color:#374151; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Abbrechen</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Vorbelegung mit KI-Vorschlag
  if (suggestedMapping) {
    const prefixSel = overlay.querySelector('#map-prefix');
    const titleSel = overlay.querySelector('#map-title');
    const descSel = overlay.querySelector('#map-desc');
    if (suggestedMapping.prefix) prefixSel.value = suggestedMapping.prefix;
    if (suggestedMapping.title) titleSel.value = suggestedMapping.title;
    if (suggestedMapping.description) descSel.value = suggestedMapping.description;
  }

  overlay.querySelector('#map-cancel').onclick = () => overlay.remove();
  overlay.querySelector('#map-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.querySelector('#map-confirm').onclick = async () => {
    const mapping = {
      prefix: overlay.querySelector('#map-prefix').value,
      title: overlay.querySelector('#map-title').value,
      description: overlay.querySelector('#map-desc').value || '',
    };

    if (!mapping.prefix || !mapping.title) {
      toast('Prefix und Titel müssen zugewiesen werden', 'error');
      return;
    }

    overlay.querySelector('#map-confirm').disabled = true;
    overlay.querySelector('#map-confirm').textContent = '⏳ Importiere...';

    try {
      const importResult = await api.importChannels(file, mapping);
      toast(`${importResult.imported} Kanäle importiert, ${importResult.errors.length} Fehler`,
        importResult.errors.length > 0 ? 'warning' : 'success');
      if (importResult.errors.length > 0) {
        console.warn('Import-Fehler:', importResult.errors);
      }
      state.channels = await api.getChannels();
      window.dispatchEvent(new CustomEvent('channel-created'));
      overlay.remove();
    } catch (err) {
      toast(`Import fehlgeschlagen: ${err.message}`, 'error');
      overlay.querySelector('#map-confirm').disabled = false;
      overlay.querySelector('#map-confirm').textContent = '✅ Importieren';
    }
  };
}

async function loadKriterien() {
  const el = document.getElementById('kriterien-editor');
  const type = document.getElementById('krit-type')?.value || 'research';
  if (!el) return;

  try {
    const kriterien = await api.getKriterien(state.activeChannelPrefix, type);
    if (kriterien.length === 0) {
      el.innerHTML = '<p class="text-muted text-sm">Keine Kriterien in diesem Bereich.</p>';
      return;
    }

    // Nach Kategorie gruppieren
    const groups = {};
    for (const k of kriterien) {
      const cat = k.kategorie || 'Ohne Kategorie';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(k);
    }

    const catOrder = Object.keys(groups).sort();

    el.innerHTML = catOrder.map(cat => `
      <div style="margin-bottom:1.5rem;">
        <h4 style="font-size:0.85rem;font-weight:700;color:#0f446b;margin:0 0 0.5rem 0;padding:6px 10px;background:#e8f0f8;border-radius:6px;">📁 ${esc(cat)} <span style="font-weight:400;color:#6b7280;">(${groups[cat].length})</span></h4>
        <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
          <thead><tr>
            <th style="text-align:left;padding:4px 8px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;">Keyword</th>
            <th style="text-align:left;padding:4px 8px;border-bottom:2px solid #e5e7eb;color:#6b7280;font-weight:600;">Prompt-Snippet</th>
            <th style="width:80px;text-align:center;padding:4px 8px;border-bottom:2px solid #e5e7eb;color:#6b7280;"></th>
          </tr></thead>
          <tbody>
            ${groups[cat].map(k => `
              <tr class="krit-row" data-krit-id="${esc(k.id)}" style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:4px 8px;font-weight:500;color:#1a1a2e;">${esc(k.keyword)}</td>
                <td style="padding:4px 8px;color:#374151;max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc((k.promptteil || k.prompt_snippet || ''))}">${esc((k.promptteil || k.prompt_snippet || '(leer)'))}</td>
                <td style="padding:4px 8px;text-align:center;white-space:nowrap;">
                  <button class="btn-edit-krit" data-edit-krit="${esc(k.id)}" style="background:none;border:none;cursor:pointer;font-size:0.9rem;padding:2px 6px;" title="Bearbeiten">✏️</button>
                  <button data-delete-krit="${esc(k.id)}" style="background:none;border:none;cursor:pointer;font-size:0.9rem;padding:2px 6px;color:#dc2626;" title="Löschen">🗑</button>
                </td>
              </tr>
              <tr class="krit-edit-row" id="krit-edit-${esc(k.id)}" style="display:none;background:#f9fafb;">
                <td colspan="3" style="padding:8px;">
                  <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <input id="krit-edit-keyword-${esc(k.id)}" value="${esc(k.keyword)}" placeholder="Keyword" style="flex:1;min-width:120px;padding:4px 8px;border:1px solid #d0d5dd;border-radius:4px;font-size:0.8rem;">
                    <input id="krit-edit-kategorie-${esc(k.id)}" value="${esc(k.kategorie || '')}" placeholder="Kategorie" style="flex:1;min-width:100px;padding:4px 8px;border:1px solid #d0d5dd;border-radius:4px;font-size:0.8rem;">
                    <textarea id="krit-edit-snippet-${esc(k.id)}" rows="2" placeholder="Prompt-Snippet" style="flex:2;min-width:200px;padding:4px 8px;border:1px solid #d0d5dd;border-radius:4px;font-size:0.8rem;">${esc((k.promptteil || k.prompt_snippet || ''))}</textarea>
                    <button data-save-edit="${esc(k.id)}" style="padding:4px 12px;background:#0f446b;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;">Speichern</button>
                    <button data-cancel-edit="${esc(k.id)}" style="padding:4px 12px;background:#e5e7eb;color:#374151;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;">Abbrechen</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `).join('');

    // Wire delete buttons
    el.querySelectorAll('[data-delete-krit]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.deleteKrit;
        const row = btn.closest('tr');
        const keyword = row?.querySelector('td')?.textContent?.trim() || id;
        if (!confirm(`Kriterium "${keyword}" wirklich löschen?`)) return;
        try {
          await api.deleteKriterium(state.activeChannelPrefix, btn.dataset.deleteKrit);
          toast('Kriterium gelöscht', 'success');
          loadKriterien();
        } catch (err) { toast(err.message, 'error'); }
      };
    });

    // Wire edit buttons
    el.querySelectorAll('[data-edit-krit]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.editKrit;
        const editRow = document.getElementById('krit-edit-' + id);
        editRow.style.display = editRow.style.display === 'none' ? '' : 'none';
      };
    });

    // Wire cancel edit
    el.querySelectorAll('[data-cancel-edit]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.cancelEdit;
        document.getElementById('krit-edit-' + id).style.display = 'none';
      };
    });

    // Wire save edit
    el.querySelectorAll('[data-save-edit]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.saveEdit;
        const keyword = document.getElementById('krit-edit-keyword-' + id)?.value?.trim();
        const kategorie = document.getElementById('krit-edit-kategorie-' + id)?.value?.trim();
        const prompt_snippet = document.getElementById('krit-edit-snippet-' + id)?.value?.trim();
        if (!keyword) return toast('Keyword ist Pflichtfeld', 'error');
        try {
          // Delete old + create new (simplified update)
          await api.deleteKriterium(state.activeChannelPrefix, id);
          await api.saveKriterium(state.activeChannelPrefix, { typ: type, keyword, kategorie, prompt_snippet });
          toast('Kriterium aktualisiert', 'success');
          loadKriterien();
        } catch (err) { toast(err.message, 'error'); }
      };
    });
  } catch (err) {
    el.innerHTML = `<p class="text-muted">Fehler: ${err.message}</p>`;
  }
}

async function loadPromptEditor() {
  const el = document.getElementById('prompt-editor-container');
  const section = document.getElementById('prompt-section')?.value || 'thema';
  if (!el) return;

  try {
    const prompts = await api.getPrompts(state.activeChannelPrefix);
    const current = prompts.find(p => p.section === section);

    // Alle Variablen laden: Kanal + Projekt (falls aktiv)
    let variablen = await api.getVariablen(state.activeChannelPrefix);
    // Projekt-Variablen hinzufügen
    if (state.activeProjectId) {
      try {
        const resp = await fetch(`http://localhost:3001/api/variablen/${state.activeChannelPrefix}/${state.activeProjectId}`);
        const allVars = await resp.json();
        if (Array.isArray(allVars)) {
          // Projekt- und Global-Variablen in gleiches Format bringen
          for (const v of allVars) {
            if (v.table_name === 'projekt_variablen' || v.table_name === 'global_variablen') {
              variablen.push({ tech_name: v.tech_name || v.name, wert: v.wert || v.value || '', beschreibung: v.beschreibung || v.description || '' });
            }
          }
        }
      } catch (_) {}
    }

    el.innerHTML = `
      <div class="prompt-editor">
        <!-- MESM-UI-407a: Design/Preview-Tabs -->
        <div class="prompt-tabs" style="display:flex;background:var(--color-bg-card);border-radius:var(--radius-md);padding:2px;margin-bottom:var(--space-4);">
          <button class="prompt-tab active" data-prompt-tab="design" style="flex:1;">
            ✏️ Design
          </button>
          <button class="prompt-tab" data-prompt-tab="preview" style="flex:1;">
            👁 Preview
          </button>
        </div>

        <div id="prompt-design-view">
          <div class="variable-chips mb-4">
            <span class="text-xs text-muted">Verfügbare Variablen: </span>
            ${variablen.map(v => {
              const vname = v.tech_name || v.name;
              const vval = v.wert || v.value || '';
              return `
              <span class="variable-chip" data-var="${esc(vname)}" title="${esc(v.beschreibung || v.description || '')} = ${esc(vval || '(leer)')}">
                {{${esc(vname)}}} <small style="color:#059669;font-size:0.6rem;">${esc(vval.substring(0,15))}${vval.length>15?'…':''}</small>
              </span>`;
            }).join('')}
            <!-- Runtime-Variablen -->
            <span class="variable-chip runtime-chip" data-var="nb_desc" title="Projekt-Beschreibung (Laufzeit)">{{nb_desc}} <small style="color:#f59e0b;font-size:0.6rem;">runtime</small></span>
            <span class="variable-chip runtime-chip" data-var="nb_title" title="Projekt-Titel (Laufzeit)">{{nb_title}} <small style="color:#f59e0b;font-size:0.6rem;">runtime</small></span>
            <span class="variable-chip runtime-chip" data-var="kriterien" title="Gewählte Kriterien (Laufzeit)">{{kriterien}} <small style="color:#f59e0b;font-size:0.6rem;">runtime</small></span>
            <span class="variable-chip runtime-chip" data-var="kategorien" title="Kanal-Kategorien (Laufzeit)">{{kategorien}} <small style="color:#f59e0b;font-size:0.6rem;">runtime</small></span>
            ${variablen.length === 0 ? '<span class="text-xs text-muted">Keine Variablen definiert</span>' : ''}
          </div>
          <div class="form-group">
            <label class="form-label">Design-Ansicht (mit {{Platzhaltern}})</label>
            <textarea class="form-textarea" id="prompt-template" rows="6" style="font-family:var(--font-mono);">${esc(current?.template || '')}</textarea>
          </div>
        </div>

        <div id="prompt-preview-view" style="display:none;">
          <div class="form-group">
            <label class="form-label">Preview – Variablen aufgelöst</label>
            <div class="preview-text" id="prompt-preview"></div>
          </div>
        </div>

        <div style="display:flex;gap:var(--space-2);">
          <button class="btn btn-primary btn-sm" id="btn-save-prompt">Prompt speichern</button>
          <button class="btn btn-accent btn-sm" id="btn-optimize-prompt" title="KI optimiert den Prompt für die Zielstruktur">🤖 KI-optimieren</button>
          <button class="btn btn-secondary btn-sm" id="btn-resolve-preview">Preview aktualisieren</button>
        </div>
      </div>
    `;

    // Wire prompt tabs
    el.querySelectorAll('.prompt-tab').forEach(tab => {
      tab.onclick = () => {
        el.querySelectorAll('.prompt-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const designView = document.getElementById('prompt-design-view');
        const previewView = document.getElementById('prompt-preview-view');
        if (tab.dataset.promptTab === 'design') {
          if (designView) designView.style.display = 'block';
          if (previewView) previewView.style.display = 'none';
        } else {
          if (designView) designView.style.display = 'none';
          if (previewView) previewView.style.display = 'block';
          updatePreview();
        }
      };
    });

    // Wire variable chips
    el.querySelectorAll('.variable-chip').forEach(chip => {
      chip.onclick = () => {
        const vname = chip.dataset.var;
        const textarea = document.getElementById('prompt-template');
        if (textarea) {
          const pos = textarea.selectionStart;
          const before = textarea.value.slice(0, pos);
          const after = textarea.value.slice(pos);
          textarea.value = before + `{{${vname}}}` + after;
        }
      };
    });

    // Preview
    const updatePreview = async () => {
      const template = document.getElementById('prompt-template')?.value || '';
      let preview = template;
      for (const v of variablen) {
        const vname = v.tech_name || v.name;
        const vval = v.wert || v.value || '';
        preview = preview.replace(
          new RegExp(`\\{\\{${vname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g'),
          `<span class="resolved-var">${esc(vval || '(leer)')}</span>`
        );
      }
      // TAG-01: Tags aus Channel-Settings auflösen
      try {
        const settings = await api.getChannelSettings(state.activeChannelPrefix);
        const tags = JSON.parse(settings?.kategorien_tags || '[]');
        const tagsStr = tags.join(', ');
        preview = preview.replace(/\{\{tags\}\}/g, `<span class="resolved-var">${esc(tagsStr)}</span>`);
        preview = preview.replace(/\{\{tag\}\}/g, `<span class="resolved-var">${esc(tagsStr)}</span>`);
        preview = preview.replace(/\{\{kategorien\}\}/g, `<span class="resolved-var">${esc(tagsStr)}</span>`);
      } catch (_) {}
      // Laufzeit-Variablen – versuche sie aus dem Projekt zu füllen
      let kriterienText = '';
      let nbDesc = '';
      let projektTitel = '';
      let projektBeschreibung = '';
      if (state.activeProjectId) {
        try {
          const research = await api.getResearch(state.activeChannelPrefix, state.activeProjectId);
          // Kriterien-Text aus den gewählten Kriterien bauen (prompt_snippet)
          if (research?.kriterien && research.kriterien.length > 0) {
            kriterienText = research.kriterien.map(k => (k.promptteil || k.prompt_snippet || '')).filter(Boolean).join('\n');
          }
          // nb_desc = nur Beschreibung, projekt_titel = Titel
          if (research?.meta) {
            projektTitel = research.meta.title || '';
            nbDesc = research.meta.description || '';
            projektBeschreibung = research.meta.description || '';
          }
        } catch (_) {}
      }
      // nb_desc auflösen (nur Beschreibung)
      if (nbDesc) {
        preview = preview.replace(/\{\{nb_desc\}\}/g, `<span class="resolved-var">${esc(nbDesc)}</span>`);
      } else {
        preview = preview.replace(/\{\{nb_desc\}\}/g, `<span class="runtime-var" title="Wird zur Laufzeit gefüllt">{{nb_desc}}</span>`);
      }
      // kriterien auflösen (Prompt-Snippets der selektierten Kriterien)
      if (kriterienText) {
        preview = preview.replace(/\{\{kriterien\}\}/g, `<span class="resolved-var">${esc(kriterienText)}</span>`);
        preview = preview.replace(/\{\{kriterien_text\}\}/g, `<span class="resolved-var">${esc(kriterienText)}</span>`);
      } else {
        preview = preview.replace(/\{\{kriterien\}\}/g, `<span class="runtime-var" title="Keine Kriterien gewählt">{{kriterien}}</span>`);
        preview = preview.replace(/\{\{kriterien_text\}\}/g, `<span class="runtime-var" title="Keine Kriterien gewählt">{{kriterien_text}}</span>`);
      }
      // projekt_titel / projekt_beschreibung aus projekt_meta
      if (projektTitel) {
        preview = preview.replace(/\{\{projekt_titel\}\}/g, `<span class="resolved-var">${esc(projektTitel)}</span>`);
      }
      if (projektBeschreibung) {
        preview = preview.replace(/\{\{projekt_beschreibung\}\}/g, `<span class="resolved-var">${esc(projektBeschreibung)}</span>`);
      }
      // Alle verbleibenden {{...}} rot markieren (unaufgelöst)
      preview = preview.replace(/\{\{(.+?)\}\}/g, '<span class="unresolved-var">{{$1}}</span>');
      const pv = document.getElementById('prompt-preview');
      if (pv) pv.innerHTML = preview || '<em class="text-muted">Prompt leer</em>';
    };

    document.getElementById('btn-resolve-preview')?.addEventListener('click', updatePreview);
    document.getElementById('prompt-template')?.addEventListener('input', updatePreview);
    updatePreview();

    // Auto-Save: beim Verlassen des Template-Feldes speichern
    const templateEl = document.getElementById('prompt-template');
    const savePromptFn = async () => {
      const template = templateEl?.value || '';
      if (!template.trim()) return;
      const id = current?.id || uid();
      try {
        await api.savePrompt(state.activeChannelPrefix, { id, section, template });
      } catch (_) { /* silent */ }
    };
    templateEl?.addEventListener('blur', savePromptFn);

    // Optimize-Button: KI schreibt Prompt für Zielstruktur um
    const optBtn = document.getElementById('btn-optimize-prompt');
    if (optBtn) {
      optBtn.onclick = async () => {
        const currentText = templateEl?.value?.trim();
        if (!currentText) return toast('Bitte erst einen Prompt schreiben', 'error');

        // Zielstruktur pro Bereich
        const targetStructures = {
          thema: 'JSON: { "topics": [{ "title": "...", "description": "...", "category": "..." }] }',
          research: 'JSON: { "research": [{ "keyword": "...", "kategorie": "...", "prompt_snippet": "..." }] }',
          audio: 'JSON: { "transcript": [{ "start": "00:00", "end": "00:00", "speaker": "A", "text": "..." }] }',
          slides: 'JSON: { "slides": [{ "filename": "...", "start_time": "0", "end_time": "5" }] }',
          thumbnail: 'JSON: { "thumbnails": [{ "variant": "A", "description": "..." }] }',
        };
        const target = targetStructures[section] || 'strukturiertes JSON';

        optBtn.disabled = true;
        optBtn.textContent = '⏳ Optimiere...';

        try {
          const resp = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemPrompt: `Du bist ein Prompt-Engineer. Optimiere den gegebenen Prompt so, dass das LLM-Ergebnis DIREKT im Zielformat zurückkommt. Zielstruktur: ${target}. Ergänze KEINE Erklärungen, nur den optimierten Prompt.`,
              userMessage: `Original-Prompt:\n${currentText}\n\nOptimiere diesen Prompt. Der Prompt soll das LLM anweisen, direkt validierbares JSON in dieser Struktur zurückzugeben: ${target}`,
            }),
          });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const data = await resp.json();
          const optimized = data.response || data.text || currentText;

          templateEl.value = optimized;
          updatePreview();
          toast('Prompt optimiert!', 'success');
        } catch (err) {
          toast('Optimierung fehlgeschlagen: ' + err.message, 'error');
        }
        optBtn.disabled = false;
        optBtn.textContent = '🤖 KI-optimieren';
      };
    }

    // Save-Button: manuell speichern + Auto-Save bei blur
    const saveBtn = document.getElementById('btn-save-prompt');
    if (saveBtn) {
      saveBtn.style.display = '';
      saveBtn.onclick = async () => {
        await savePromptFn();
        toast('Prompt gespeichert', 'success');
      };
    }
  } catch (err) {
    el.innerHTML = `<p class="text-muted">Fehler: ${err.message}</p>`;
  }
}

async function loadVorlagen() {
  const el = document.getElementById('vorlagen-list');
  if (!el) return;

  try {
    const vorlagen = await api.getVorlagen(state.activeChannelPrefix);
    if (vorlagen.length === 0) {
      el.innerHTML = '<p class="text-muted text-sm">Keine Vorlagen definiert.</p>';
      return;
    }

    // Nach Typ gruppieren
    const groups = { intro: [], hauptteil: [], outro: [] };
    for (const v of vorlagen) {
      if (groups[v.type]) groups[v.type].push(v);
    }
    const typeLabels = { intro: '🎬 Intro', hauptteil: '📄 Hauptteil', outro: '🎬 Outro' };

    const fmtSize = (bytes) => bytes ? (bytes / (1024*1024)).toFixed(1) + ' MB' : '';
    const fmtDuration = (s) => s ? s + 's' : '';

    el.innerHTML = Object.entries(groups).map(([type, items]) => {
      if (items.length === 0) return '';
      return `
        <div style="margin-bottom:1rem;">
          <h4 style="font-size:0.85rem;font-weight:700;color:#0f446b;margin:0 0 0.5rem 0;padding:6px 10px;background:#e8f0f8;border-radius:6px;">${typeLabels[type] || type} <span style="font-weight:400;color:#6b7280;">(${items.length})</span></h4>
          <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
            <thead><tr>
              <th style="text-align:left;padding:4px 8px;border-bottom:2px solid #e5e7eb;">Name</th>
              <th style="text-align:left;padding:4px 8px;border-bottom:2px solid #e5e7eb;">Kat.</th>
              <th style="text-align:left;padding:4px 8px;border-bottom:2px solid #e5e7eb;">Format</th>
              <th style="text-align:right;padding:4px 8px;border-bottom:2px solid #e5e7eb;">Größe</th>
              <th style="text-align:right;padding:4px 8px;border-bottom:2px solid #e5e7eb;">Dauer</th>
              <th style="width:30px;"></th>
            </tr></thead>
            <tbody>
            ${items.map(v => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:4px 8px;font-weight:500;">${esc(v.label)}</td>
                <td style="padding:4px 8px;color:#6b7280;">${esc(v.kategorie || '-')}</td>
                <td style="padding:4px 8px;color:#6b7280;">${esc(v.datei_format || '-')} · ${esc(v.media_type || '')}</td>
                <td style="padding:4px 8px;text-align:right;color:#6b7280;">${fmtSize(v.datei_groesse) || '-'}</td>
                <td style="padding:4px 8px;text-align:right;color:#6b7280;">${fmtDuration(v.dauer_sekunden) || '-'}</td>
                <td style="padding:4px 8px;"><button data-delete-vorlage="${esc(v.id)}" style="background:none;border:none;color:#dc2626;cursor:pointer;">🗑</button></td>
              </tr>
            `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    el.querySelectorAll('[data-delete-vorlage]').forEach(btn => {
      btn.onclick = async () => {
        try {
          await api.deleteVorlage(state.activeChannelPrefix, btn.dataset.deleteVorlage);
          toast('Vorlage gelöscht');
          loadVorlagen();
        } catch (err) { toast(err.message, 'error'); }
      };
    });
  } catch (err) {
    el.innerHTML = `<p class="text-muted">Fehler: ${err.message}</p>`;
  }
}

async function loadKontakte() {
  const el = document.getElementById('kontakte-list');
  if (!el) return;

  try {
    const kontakte = await api.getKontakte(state.activeChannelPrefix);
    if (kontakte.length === 0) {
      el.innerHTML = '<p class="text-muted text-sm">Keine Marketing-Kontakte definiert.</p>';
      return;
    }
    el.innerHTML = kontakte.map(k => `
      <div class="card" style="padding:var(--space-3);margin-bottom:var(--space-2);">
        <div class="flex justify-between items-center">
          <div>
            <strong>${esc(k.name)}</strong>
            <span class="badge badge-ki" style="margin-left:var(--space-2);">${esc(k.channel)}</span>
            <span class="badge ${k.status === 'sent' ? 'badge-success' : 'badge-warning'}" style="margin-left:var(--space-1);">${esc(k.status)}</span>
          </div>
          <button class="btn btn-danger btn-sm" data-delete-kontakt="${esc(k.id)}">🗑</button>
        </div>
        <span class="text-sm text-muted" style="display:block;margin-top:var(--space-1);">${esc(k.contact_info)}</span>
      </div>
    `).join('');

    el.querySelectorAll('[data-delete-kontakt]').forEach(btn => {
      btn.onclick = async () => {
        try {
          await api.deleteKontakt(state.activeChannelPrefix, btn.dataset.deleteKontakt);
          toast('Kontakt gelöscht');
          loadKontakte();
        } catch (err) { toast(err.message, 'error'); }
      };
    });
  } catch (err) {
    el.innerHTML = `<p class="text-muted">Fehler: ${err.message}</p>`;
  }
}

/* ─── PLAT-01: Plattform-Zugangsdaten laden ──────────────────── */
async function loadPlattformen() {
  const el = document.getElementById('plattformen-list');
  if (!el) return;
  try {
    const plattformen = await api.getPlattformen(state.activeChannelPrefix);
    if (plattformen.length === 0) {
      el.innerHTML = '<p class="text-muted text-sm">Keine Plattformen konfiguriert.</p>';
      return;
    }
    el.innerHTML = plattformen.map(p => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:4px;font-size:0.85rem;">
        <span style="font-weight:600;min-width:90px;">${esc(p.plattform)}</span>
        <span style="color:#6b7280;flex:1;">${esc(p.label || p.username || '-')}</span>
        <span style="font-size:0.7rem;color:#9ca3af;">Key: ${p.api_key ? '••••' + p.api_key.slice(-4) : '(kein)'}</span>
        <button data-del-plattform="${esc(p.id)}" style="background:none;border:none;color:#dc2626;cursor:pointer;">🗑</button>
      </div>
    `).join('');
    el.querySelectorAll('[data-del-plattform]').forEach(btn => {
      btn.onclick = async () => {
        try {
          await api.deletePlattform(state.activeChannelPrefix, btn.dataset.delPlattform);
          toast('Plattform gelöscht');
          loadPlattformen();
        } catch (err) { toast(err.message, 'error'); }
      };
    });
  } catch (err) {
    el.innerHTML = `<p class="text-muted">Fehler: ${err.message}</p>`;
  }
  }
}

// ─── Settings Modal (rendered from main.js) ─────────────────────────
let settingsTab = 'general';

export async function renderSettingsForm(el, closeFn) {
  if (!el) return;
  const close = closeFn || (() => { state.settingsOpen = false; });

  try {
    const settings = await api.getSettings();
    const providers = settings.providers || [];
    const tts = settings.tts || [];
    const helpUrl = settings.settings?.find(s => s.key === 'help_url')?.value || '';

    // CHAT-04: Chat-Prompts aus Channel-Settings laden
    if (state.activeChannelPrefix) {
      try {
        const chSettings = await api.getChannelSettings(state.activeChannelPrefix);
        settings.chat_prompts = chSettings?.chat_prompts || '[]';
      } catch (_) { settings.chat_prompts = '[]'; }
    } else {
      settings.chat_prompts = '[]';
    }

    const render = async (tab) => {
      settingsTab = tab;
      // Frische Provider/TTS-Daten laden beim Re-rendern
      let freshProviders = providers;
      let freshTTS = tts;
      try {
        const fresh = await api.getSettings();
        freshProviders = fresh.providers || providers;
        freshTTS = fresh.tts || tts;
      } catch (_) {}
      let channels = [];
      if (tab === 'channels' || tab === 'chatprompts') {
        try { channels = await api.getChannels(); } catch (_) { channels = []; }
      }
      el.innerHTML = buildSettingsHTML(settings.rootDir, helpUrl, freshProviders, freshTTS, tab, channels, settings.chat_prompts);
      wireSettingsEvents(el, settings, close, render);
    };

    await render('general');
  } catch (err) {
    el.innerHTML = `<div class="error-state"><p>Fehler beim Laden: ${esc(err.message)}</p><button class="btn btn-primary btn-sm mt-3" id="btn-retry-settings">Neu laden</button></div>`;
    document.getElementById('btn-retry-settings')?.addEventListener('click', () => renderSettingsForm(el, closeFn));
  }
}

function buildSettingsHTML(rootDir, helpUrl, providers, tts, tab, channels = [], chatPrompts = '[]') {
  const tabs = [
    { id: 'general', label: '📁 Allgemein' },
    { id: 'providers', label: '🤖 LLM-Provider' },
    { id: 'tts', label: '🔊 TTS-Profile' },
    { id: 'channels', label: '📺 Kanal-Anlage' },
    { id: 'chatprompts', label: '💬 Chat-Prompts' }
  ];

  const tabNav = tabs.map(t =>
    `<button class="settings-tab ${tab === t.id ? 'active' : ''}" data-tab="${t.id}">${t.label}</button>`
  ).join('');

  let body = '';
  if (tab === 'general') {
    body = `
      <div class="form-group">
        <label class="form-label">Daten-Verzeichnis (Root)</label>
        <input class="form-input" id="set-rootdir" value="${esc(rootDir || '')}" placeholder="Pfad zum MESM_DATA-Ordner">
        <span class="form-hint">Enthält global.db, alle Kanäle und Projekte. Wird beim Start automatisch erkannt.</span>
      </div>
      <div class="form-group">
        <label class="form-label">Hilfe-URL</label>
        <input class="form-input" id="set-helpurl" value="${esc(helpUrl)}" placeholder="https://...">
      </div>
      <div class="form-group">
        <label class="toggle-switch">
          <input type="checkbox" id="set-show-info" checked>
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span>Info-Reiter in Sidebar anzeigen (Strg+Klick auf Elemente)</span>
        </label>
      </div>
      <div class="form-group">
        <label class="toggle-switch">
          <input type="checkbox" id="set-inspector" checked>
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
          <span>KI-Element-Inspektor (Strg+Hovern → Element-ID anzeigen, Mausrad für Ebenen, Klick kopiert)</span>
        </label>
      </div>
      <div class="form-group">
        <label class="form-label">Datenbank-Info</label>
        <div class="info-card">
          <div><strong>📍 global.db</strong> – persistiert immer (Einstellungen, Kanalliste, Provider, TTS)</div>
          <div><strong>📁 kanal.db</strong> – löschbar bei Kanal-Löschung (Kriterien, Prompts, Variablen, Vorlagen)</div>
          <div><strong>📦 projekt.db</strong> – archivierbar nach Veröffentlichung (alle Projektdaten + Artefakte)</div>
        </div>
      </div>
    `;
  } else if (tab === 'providers') {
    body = `
      <div id="provider-list">
        ${providers.length === 0 ? '<p class="text-muted text-sm">Keine LLM-Provider konfiguriert.</p>' : providers.map(p => `
          <div class="card" style="padding:var(--space-3);margin-bottom:var(--space-2);">
            <div class="flex justify-between items-center">
              <div>
                <strong>${esc(p.provider)}</strong>
                ${p.position ? `<span class="text-xs text-muted" style="margin-left:var(--space-2);">Pos: ${p.position}</span>` : ''}
              </div>
              <div class="flex gap-2 items-center">
                <button class="btn btn-sm ${p.is_active ? 'btn-success' : 'btn-secondary'}" data-toggle-provider="${esc(p.id)}" title="${p.is_active ? 'Deaktivieren' : 'Aktivieren'}">
                  ${p.is_active ? '✅ Aktiv' : '⏸ Inaktiv'}
                </button>
                <button class="btn btn-danger btn-sm" data-delete-provider="${esc(p.id)}" title="Löschen">🗑</button>
              </div>
            </div>
            <code style="font-size:var(--text-xs);display:block;margin-top:var(--space-1);">Key: ${p.api_key ? '••••' + p.api_key.slice(-4) : '(kein)'} · ${p.endpoint ? esc(p.endpoint) : 'default'}</code>
          </div>
        `).join('')}
      </div>
      <div class="card mt-4" style="padding:var(--space-4);">
        <h4 style="margin-bottom:var(--space-3);">Provider hinzufügen / bearbeiten</h4>
        <input type="hidden" id="edit-provider-id" value="">
        <div class="form-group">
          <label class="form-label">Provider</label>
          <select class="form-select" id="set-provider">
            <option value="">-- Wählen --</option>
            <option value="Kimi">Kimi (Moonshot AI)</option>
            <option value="DeepSeek">DeepSeek</option>
            <option value="LM Studio">LM Studio (lokal)</option>
            <option value="OpenAI">OpenAI</option>
            <option value="Anthropic">Anthropic Claude</option>
            <option value="Gemini">Gemini</option>
            <option value="Other">Anderer (manuell)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">API-Key</label>
          <input class="form-input" id="set-apikey" placeholder="sk-...">
        </div>
        <div class="form-group">
          <label class="form-label">Endpoint URL</label>
          <input class="form-input" id="set-endpoint" placeholder="https://api.example.com/v1 (optional)">
        </div>
        <div class="form-group">
          <label class="form-label">Position (Priorität 1-99)</label>
          <input class="form-input" id="set-position" type="number" value="1" min="1" max="99" style="max-width:100px;">
        </div>
        <button class="btn btn-primary btn-sm" id="btn-save-provider">💾 Provider speichern</button>
        <button class="btn btn-secondary btn-sm" id="btn-clear-provider-form" style="margin-left:var(--space-2);">Formular leeren</button>
      </div>
    `;
  } else if (tab === 'tts') {
    body = `
      <div id="tts-list">
        ${tts.length === 0 ? '<p class="text-muted text-sm">Keine TTS-Profile konfiguriert.</p>' : tts.map(t => `
          <div class="card" style="padding:var(--space-3);margin-bottom:var(--space-2);">
            <div class="flex justify-between items-center">
              <div>
                <strong>${esc(t.voice)}</strong>
                <span class="badge badge-ki" style="margin-left:var(--space-2);">Speed: ${t.speed || 1.0}</span>
                <span class="badge badge-ki" style="margin-left:var(--space-1);">Mood: ${esc(t.mood || 'neutral')}</span>
              </div>
              <button class="btn btn-danger btn-sm" data-delete-tts="${esc(t.id)}" title="Löschen">🗑</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="card mt-4" style="padding:var(--space-4);">
        <h4 style="margin-bottom:var(--space-3);">TTS-Profil hinzufügen</h4>
        <div class="form-group">
          <label class="form-label">Stimme (Voice-ID)</label>
          <input class="form-input" id="set-tts-voice" placeholder="z.B. de-DE-KatjaNeural">
          <span class="form-hint">Microsoft Azure TTS: de-DE-KatjaNeural, de-DE-ConradNeural, en-US-JennyNeural etc.</span>
        </div>
        <div class="form-group">
          <label class="form-label">Geschwindigkeit: <span id="tts-speed-value">1.0</span>x</label>
          <input type="range" class="range-slider" id="set-tts-speed" min="0.5" max="2.0" step="0.1" value="1.0">
          <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--color-text-dim);">
            <span>0.5x Langsam</span><span>1.0x Normal</span><span>2.0x Schnell</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Stimmung</label>
          <select class="form-select" id="set-tts-mood" style="max-width:200px;">
            <option value="neutral">Neutral</option>
            <option value="fröhlich">Fröhlich</option>
            <option value="ernst">Ernst</option>
            <option value="begeistert">Begeistert</option>
          </select>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-save-tts">💾 TTS-Profil speichern</button>
      </div>
    `;
  } else if (tab === 'channels') {
    body = `
      <h3 style="margin-bottom:var(--space-4);">Kanal verwalten</h3>
      <div class="card" style="padding:var(--space-4);margin-bottom:var(--space-4);">
        <h4 style="margin-bottom:var(--space-3);">Neuen Kanal anlegen / bearbeiten</h4>
        <input type="hidden" id="edit-channel-id" value="">
        <div class="form-group">
          <label class="form-label">Präfix (z.B. "LUYB")</label>
          <input class="form-input" id="set-channel-prefix" placeholder="LUYB">
        </div>
        <div class="form-group">
          <label class="form-label">Titel (z.B. "Level Up Your Business")</label>
          <input class="form-input" id="set-channel-title" placeholder="Level Up Your Business">
        </div>
        <div class="form-group">
          <label class="form-label">Beschreibung</label>
          <textarea class="form-textarea" id="set-channel-desc" rows="3" placeholder="Beschreiben Sie den Kanal und seine Zielgruppe..."></textarea>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-primary btn-sm" id="btn-save-channel">Kanal anlegen</button>
          <button class="btn btn-secondary btn-sm" id="btn-cancel-channel-edit" style="display:none;">Abbrechen</button>
        </div>
      </div>
      <div id="channel-list">
        ${channels.length === 0 ? '<p class="text-muted text-sm">Keine Kanäle vorhanden.</p>' : channels.map(c => `
          <div class="card" style="padding:var(--space-3);margin-bottom:var(--space-2);${c.status==='archiviert'?'opacity:0.6;background:#fef3c7;':''}">
            <div class="flex justify-between items-center">
              <div>
                <strong>${esc(c.prefix)}</strong>
                <span style="margin-left:var(--space-2);color:var(--color-text);">${esc(c.title)}</span>
                ${c.status === 'archiviert' ? '<span class="badge" style="margin-left:8px;background:#f59e0b;color:#fff;font-size:0.7rem;">archiviert</span>' : ''}
              </div>
              <div class="flex gap-2 items-center">
                ${c.status === 'archiviert' 
                  ? `<button class="btn btn-sm btn-success" data-restore-channel="${esc(c.prefix)}" title="Wiederherstellen">📤 Wiederherstellen</button>`
                  : `<button class="btn btn-sm btn-secondary" data-edit-channel="${esc(c.id)}" data-prefix="${esc(c.prefix)}" data-title="${esc(c.title)}" data-desc="${esc(c.description || '')}" title="Bearbeiten">✏️ Bearbeiten</button>`
                }
                <button class="btn btn-danger btn-sm" data-delete-channel="${esc(c.id)}" data-prefix="${esc(c.prefix)}" title="Löschen">🗑</button>
              </div>
            </div>
            ${c.description ? `<p class="text-xs text-muted mt-1">${esc(c.description)}</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'chatprompts') {
    let prompts = [];
    try {
      prompts = typeof chatPrompts === 'string' ? JSON.parse(chatPrompts || '[]') : (chatPrompts || []);
    } catch (_) { prompts = []; }

    body = `
      <h3 style="margin-bottom:1rem;">💬 Vordefinierte Chat-Prompts</h3>
      <p style="color:#6b7280;font-size:0.85rem;margin-bottom:1rem;">Diese Prompts erscheinen als Schnellauswahl im Chat (📋-Button).</p>
      <div id="chatprompts-list" style="margin-bottom:1rem;">
        ${prompts.length === 0 ? '<p style="color:#9ca3af;">Keine Prompts definiert.</p>' : prompts.map((p, i) => `
          <div class="chatprompt-row" data-idx="${i}" style="display:flex;gap:8px;align-items:center;padding:8px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:4px;">
            <span class="chatprompt-label" style="flex:1;font-size:0.85rem;cursor:pointer;" title="Klicken zum Bearbeiten">${esc(p.label)}</span>
            <span class="chatprompt-text-preview" style="flex:2;font-size:0.8rem;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;" title="Klicken zum Bearbeiten">${esc(p.text.substring(0, 50))}</span>
            <button data-edit-chatprompt="${i}" style="background:none;border:none;color:#0f446b;cursor:pointer;font-size:0.9rem;" title="Bearbeiten">✏️</button>
            <button data-del-chatprompt="${i}" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:0.9rem;" title="Löschen">🗑</button>
          </div>
          <div class="chatprompt-edit" data-edit-idx="${i}" style="display:none;padding:8px;margin-bottom:8px;background:#f9fafb;border-radius:6px;">
            <input class="edit-chatprompt-label" value="${esc(p.label)}" placeholder="Anzeigename" style="width:100%;padding:4px 8px;border:1px solid #d0d5dd;border-radius:4px;font-size:0.85rem;margin-bottom:4px;">
            <textarea class="edit-chatprompt-text" rows="2" placeholder="Prompt-Text" style="width:100%;padding:4px 8px;border:1px solid #d0d5dd;border-radius:4px;font-size:0.85rem;margin-bottom:4px;">${esc(p.text)}</textarea>
            <button data-save-edit-chatprompt="${i}" style="padding:4px 12px;background:#0f446b;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;">Speichern</button>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px;">
        <input id="new-chatprompt-label" placeholder="Anzeigename (z.B. Rechtschreibung verbessern)" style="flex:1;padding:6px 10px;border:1px solid #d0d5dd;border-radius:6px;font-size:0.85rem;">
        <input id="new-chatprompt-text" placeholder="Prompt-Text" style="flex:2;padding:6px 10px;border:1px solid #d0d5dd;border-radius:6px;font-size:0.85rem;">
        <button id="btn-add-chatprompt" style="padding:6px 14px;background:#0f446b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;">+ Hinzufügen</button>
      </div>
    `;
  }

  return `
    <div class="settings-tabs-nav">${tabNav}</div>
    <div class="settings-tab-content">${body}</div>
    <div class="settings-footer">
      <button class="btn btn-primary" id="btn-save-all-settings">💾 Alle Einstellungen speichern</button>
      <button class="btn btn-secondary" id="btn-close-settings-footer">Schließen</button>
    </div>
  `;
}

function wireSettingsEvents(el, settings, close, rerender) {
  // Tab navigation
  el.querySelectorAll('.settings-tab').forEach(btn => {
    btn.onclick = () => rerender(btn.dataset.tab);
  });

  // Close buttons
  document.getElementById('btn-close-settings-footer')?.addEventListener('click', close);

  // Save all
  document.getElementById('btn-save-all-settings')?.addEventListener('click', async () => {
    const rootDir = document.getElementById('set-rootdir')?.value?.trim();
    const helpUrl = document.getElementById('set-helpurl')?.value?.trim();
    try {
      if (rootDir) await api.saveSetting({ key: 'root_dir', value: rootDir });
      if (helpUrl !== undefined) await api.saveSetting({ key: 'help_url', value: helpUrl });
      toast('Einstellungen gespeichert', 'success');
      close();
    } catch (err) { toast(err.message, 'error'); }
  });

  // ─── General: Toggle-Buttons ────────────────────────────
  const infoToggle = document.getElementById('set-show-info');
  if (infoToggle) {
    infoToggle.checked = state.infoEnabled;
    infoToggle.addEventListener('change', () => {
      state.infoEnabled = infoToggle.checked;
    });
  }

  const inspectorToggle = document.getElementById('set-inspector');
  if (inspectorToggle) {
    inspectorToggle.checked = state.inspectorEnabled;
    inspectorToggle.addEventListener('change', () => {
      state.inspectorEnabled = inspectorToggle.checked;
    });
  }

  // ─── Provider events ─────────────────────────────────
  document.getElementById('btn-save-provider')?.addEventListener('click', async () => {
    const provider = document.getElementById('set-provider')?.value;
    const api_key = document.getElementById('set-apikey')?.value?.trim();
    const endpoint = document.getElementById('set-endpoint')?.value?.trim();
    const position = parseInt(document.getElementById('set-position')?.value || '1');
    const editId = document.getElementById('edit-provider-id')?.value;

    if (!provider) return toast('Bitte Provider auswählen', 'error');

    try {
      await api.saveProvider({
        id: editId || undefined,
        provider,
        api_key,
        endpoint,
        position,
        is_active: 1
      });
      toast(`Provider ${provider} gespeichert`, 'success');
      rerender('providers');
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('btn-clear-provider-form')?.addEventListener('click', () => {
    document.getElementById('edit-provider-id').value = '';
    document.getElementById('set-provider').value = '';
    document.getElementById('set-apikey').value = '';
    document.getElementById('set-endpoint').value = '';
    document.getElementById('set-position').value = '1';
  });

  el.querySelectorAll('[data-delete-provider]').forEach(btn => {
    btn.onclick = async () => {
      const pid = btn.dataset.deleteProvider;
      if (!confirm(`Provider wirklich löschen?`)) return;
      try {
        await api.deleteProvider(pid);
        settings.providers = (settings.providers || []).filter(p => String(p.id) !== pid);
        toast('Provider gelöscht', 'success');
        rerender('providers');
      } catch (err) { toast(err.message, 'error'); }
    };
  });

  el.querySelectorAll('[data-toggle-provider]').forEach(btn => {
    btn.onclick = async () => {
      const pid = btn.dataset.toggleProvider;
      const prov = (settings.providers || []).find(p => String(p.id) === pid);
      if (!prov) return;
      try {
        const newActive = (prov.is_active == 1 || prov.is_active === true) ? 0 : 1;
        await api.saveProvider({ ...prov, is_active: newActive });
        prov.is_active = newActive; // UI-State synchron halten
        toast(`Provider ${newActive ? 'aktiviert' : 'deaktiviert'}`, 'success');
        rerender('providers');
      } catch (err) { toast(err.message, 'error'); }
    };
  });

  // ─── TTS events ──────────────────────────────────────
  // Live update range slider label
  document.getElementById('set-tts-speed')?.addEventListener('input', function() {
    const label = document.getElementById('tts-speed-value');
    if (label) label.textContent = parseFloat(this.value).toFixed(1);
  });

  document.getElementById('btn-save-tts')?.addEventListener('click', async () => {
    const voice = document.getElementById('set-tts-voice')?.value?.trim();
    const speed = parseFloat(document.getElementById('set-tts-speed')?.value || '1.0');
    const mood = document.getElementById('set-tts-mood')?.value || 'neutral';

    if (!voice) return toast('Bitte Voice-ID eingeben', 'error');

    try {
      await api.saveTTS({ voice, speed, mood });
      toast(`TTS-Profil ${voice} gespeichert`, 'success');
      document.getElementById('set-tts-voice').value = '';
      rerender('tts');
    } catch (err) { toast(err.message, 'error'); }
  });

  el.querySelectorAll('[data-delete-tts]').forEach(btn => {
    btn.onclick = async () => {
      const tid = btn.dataset.deleteTts;
      if (!confirm(`TTS-Profil wirklich löschen?`)) return;
      try {
        await api.deleteTTS(tid);
        toast('TTS-Profil gelöscht', 'success');
        rerender('tts');
      } catch (err) { toast(err.message, 'error'); }
    };
  });

  // ─── Channel events ──────────────────────────────────
  document.getElementById('btn-save-channel')?.addEventListener('click', async () => {
    const prefix = document.getElementById('set-channel-prefix')?.value?.trim();
    const title = document.getElementById('set-channel-title')?.value?.trim();
    const description = document.getElementById('set-channel-desc')?.value?.trim();
    const editId = document.getElementById('edit-channel-id')?.value;

    if (!prefix || !title) return toast('Präfix und Titel sind Pflichtfelder', 'error');

    try {
      if (editId) {
        await api.updateChannel(editId, { prefix, title, description });
        toast(`Kanal "${prefix}" aktualisiert`, 'success');
      } else {
        await api.createChannel({ prefix, title, description });
        toast(`Kanal "${prefix}" angelegt`, 'success');
        window.dispatchEvent(new CustomEvent('channel-created'));
      }
      document.getElementById('edit-channel-id').value = '';
      document.getElementById('set-channel-prefix').value = '';
      document.getElementById('set-channel-title').value = '';
      document.getElementById('set-channel-desc').value = '';
      document.getElementById('btn-save-channel').textContent = 'Kanal anlegen';
      const cancelBtn = document.getElementById('btn-cancel-channel-edit');
      if (cancelBtn) cancelBtn.style.display = 'none';
      await rerender('channels');
    } catch (err) { toast(err.message, 'error'); }
  });

  document.getElementById('btn-cancel-channel-edit')?.addEventListener('click', () => {
    document.getElementById('edit-channel-id').value = '';
    document.getElementById('set-channel-prefix').value = '';
    document.getElementById('set-channel-title').value = '';
    document.getElementById('set-channel-desc').value = '';
    document.getElementById('btn-save-channel').textContent = 'Kanal anlegen';
    const cancelBtn = document.getElementById('btn-cancel-channel-edit');
    if (cancelBtn) cancelBtn.style.display = 'none';
  });

  el.querySelectorAll('[data-edit-channel]').forEach(btn => {
    btn.onclick = () => {
      document.getElementById('edit-channel-id').value = btn.dataset.editChannel;
      document.getElementById('set-channel-prefix').value = btn.dataset.prefix;
      document.getElementById('set-channel-title').value = btn.dataset.title;
      document.getElementById('set-channel-desc').value = btn.dataset.desc;
      document.getElementById('btn-save-channel').textContent = 'Kanal aktualisieren';
      const cancelBtn = document.getElementById('btn-cancel-channel-edit');
      if (cancelBtn) cancelBtn.style.display = 'inline-block';
      document.getElementById('set-channel-prefix').focus();
    };
  });

  el.querySelectorAll('[data-delete-channel]').forEach(btn => {
    btn.onclick = async () => {
      const prefix = btn.dataset.prefix;
      if (!confirm(`Kanal "${prefix}" wirklich löschen? Alle zugehörigen Projekte und Daten werden entfernt!`)) return;
      try {
        await api.deleteChannel(prefix);
        toast('Kanal gelöscht', 'success');
        await rerender('channels');
      } catch (err) { toast(err.message, 'error'); }
    };
  });

  // IMP-21: Restore-Button für archivierte Kanäle
  el.querySelectorAll('[data-restore-channel]').forEach(btn => {
    btn.onclick = async () => {
      const prefix = btn.dataset.restoreChannel;
      try {
        const result = await api.restoreChannel(prefix);
        toast(`Kanal "${prefix}" wiederhergestellt`, 'success');
        await rerender('channels');
      } catch (err) { toast(err.message, 'error'); }
    };
  });

  // ─── Chatprompts events ──────────────────────────────────
  document.getElementById('btn-add-chatprompt')?.addEventListener('click', async () => {
    const label = document.getElementById('new-chatprompt-label')?.value?.trim();
    const text = document.getElementById('new-chatprompt-text')?.value?.trim();
    if (!label || !text) return toast('Bitte Anzeigename und Prompt-Text ausfüllen', 'error');
    try {
      const raw = settings.chat_prompts || '[]';
      const prompts = JSON.parse(raw);
      prompts.push({ label, text });
      settings.chat_prompts = JSON.stringify(prompts);
      await api.saveChannelSetting(state.activeChannelPrefix, 'chat_prompts', settings.chat_prompts);
      toast('Prompt hinzugefügt', 'success');
      rerender('chatprompts');
    } catch (err) { toast(err.message, 'error'); }
  });

  el.querySelectorAll('[data-del-chatprompt]').forEach(btn => {
    btn.onclick = async () => {
      const idx = parseInt(btn.dataset.delChatprompt);
      try {
        const prompts = JSON.parse(settings.chat_prompts || '[]');
        prompts.splice(idx, 1);
        settings.chat_prompts = JSON.stringify(prompts);
        await api.saveChannelSetting(state.activeChannelPrefix, 'chat_prompts', settings.chat_prompts);
        toast('Prompt gelöscht', 'success');
        rerender('chatprompts');
      } catch (err) { toast(err.message, 'error'); }
    };
  });

  // Edit-Button: Zeige Edit-Formular
  el.querySelectorAll('[data-edit-chatprompt]').forEach(btn => {
    btn.onclick = () => {
      const idx = btn.dataset.editChatprompt;
      const editRow = el.querySelector(`[data-edit-idx="${idx}"]`);
      if (editRow) editRow.style.display = editRow.style.display === 'none' ? 'block' : 'none';
    };
  });

  // Save-Edit-Button
  el.querySelectorAll('[data-save-edit-chatprompt]').forEach(btn => {
    btn.onclick = async () => {
      const idx = parseInt(btn.dataset.saveEditChatprompt);
      const row = el.querySelector(`[data-edit-idx="${idx}"]`);
      const label = row?.querySelector('.edit-chatprompt-label')?.value?.trim();
      const text = row?.querySelector('.edit-chatprompt-text')?.value?.trim();
      if (!label || !text) return toast('Bitte beide Felder ausfüllen', 'error');
      try {
        const prompts = JSON.parse(settings.chat_prompts || '[]');
        if (prompts[idx]) { prompts[idx].label = label; prompts[idx].text = text; }
        settings.chat_prompts = JSON.stringify(prompts);
        await api.saveChannelSetting(state.activeChannelPrefix, 'chat_prompts', settings.chat_prompts);
        toast('Prompt aktualisiert', 'success');
        rerender('chatprompts');
      } catch (err) { toast(err.message, 'error'); }
    };
  });
}
