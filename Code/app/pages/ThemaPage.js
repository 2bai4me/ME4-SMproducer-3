/**
 * ThemaPage – Schritt 1: Quellenanalyse, Themenvorschläge, Zusammenfassung
 *
 * MESM-UI-401: YouTube-URL-Input + Embed-Iframe (Mockup: iframe erscheint bei gültiger URL)
 * MESM-UI-402: Website-URL-Input (Mockup: Input-Feld für Website-URL)
 * MESM-UI-403: FileUpload-Dropzone im Quelltext-Panel
 * MESM-UI-404: Dashboard-BG-Effekt (Grid 40×40 + Radial-Maske folgt Mausposition)
 * MESM-UI-405: Progress-Bar beim Analysieren (crimson-Fill, Prozent-Anzeige)
 * MESM-UI-406: KI-Button absolut im Textarea (sendet Text an Chat-Sidebar)
 * MESM-UI-407: Analyse-Ergebnis-Cards (3 Cards, 1 hervorgehoben deep-blue)
 * MESM-UI-408: Projektstart-Form (Titel+Copy, Nummer+Copy, 2 Buttons)
 * MESM-UI-409: Button-Lade-Animation (Rocket/Spinner rotiert 360°)
 */

import { state, toast, esc, uid, showAIOverlay, hideAIOverlay } from '../shared/state.js';
import { api } from '../shared/api.js';
import { createAccordion } from '../components/organisms/ServiceAccordion.js';

/* SVG Icons */
const TARGET_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
const FILETEXT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`;
const PLAY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const ROCKET_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.2 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4l.5 3.5"/><path d="M11 9l3-3-2-3"/></svg>`;
const YT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29.94 29.94 0 0 0 1 11.75a29.94 29.94 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29.94 29.94 0 0 0 .46-5.25 29.94 29.94 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`;
const LINK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
const UPLOAD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

export default async function ThemaPage(container) {
  if (!state.activeChannelPrefix) {
    // Auto-select first channel if available
    if (state.channels.length > 0) {
      state.selectedChannel = state.channels[0];
      state.activeChannelPrefix = state.channels[0].prefix;
    } else {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📺</div><div class="empty-state-title">Kein Kanal ausgewählt</div><div class="empty-state-text">Bitte wählen Sie zuerst einen Kanal im Navigator aus oder legen Sie einen neuen Kanal an.</div></div>';
      return;
    }
  }

  container.innerHTML = `
    <div class="workspace-header">
      <h1 class="workspace-title">Schritt 1: Thema</h1>
      <p class="workspace-subtitle">Quellen erfassen, Themen extrahieren, Projekt starten</p>
    </div>
    <div class="service-accordion" id="thema-accordion"></div>
  `;

  const acc = document.getElementById('thema-accordion');

  /* ─── Accordion 1: Kanal ─────────────────────────────────── */
  // Projekte für diesen Kanal laden
  let projects = [];
  try { projects = await api.getProjects(state.activeChannelPrefix); } catch (_) {}

  createAccordion(acc, {
    number: 1,
    title: 'Kanal & Projekt',
    status: state.activeProjectId ? 'done' : 'none',
    open: true,
    body: `
      <div class="form-group">
        <label class="form-label">Wahl des Kanals</label>
        <select class="form-select" id="thema-channel-select">
          ${state.channels.map(c => `<option value="${esc(c.prefix)}" ${state.activeChannelPrefix === c.prefix ? 'selected' : ''}>${esc(c.prefix)} – ${esc(c.title)}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn btn-primary btn-sm" id="btn-new-project">+ Neues Projekt</button>
        <select class="form-select" id="existing-project-select" style="font-size:0.8rem;flex:1;">
          <option value="">-- Bestehendes Projekt öffnen (${projects.length}) --</option>
          ${projects.map(p => `<option value="${p.id}" ${p.id === state.activeProjectId ? 'selected' : ''}>${p.id} – ${p.title||'Ohne Titel'}</option>`).join('')}
        </select>
      </div>
      ${state.activeProjectId ? `<div style="margin-top:8px;font-size:0.8rem;color:#059669;">✅ Aktives Projekt: ${state.activeProjectId}</div>` : '<div style="margin-top:8px;font-size:0.8rem;color:#dc2626;">⚠ Kein Projekt ausgewählt</div>'}
    `
  });

  /* ─── Accordion 2: Quelltext ─────────────────────────────── */
  const quelltextBody = `
    <div data-section="thema-quelltext">
      <!-- Manueller Text mit Dashboard-BG -->
      <div class="form-group">
        <label class="form-label" style="display:flex;align-items:center;gap:var(--space-2);">
          ${FILETEXT_ICON} Manueller Text
        </label>
        <!-- MESM-UI-404: Dashboard-BG-Effekt Container -->
        <div class="dashboard-bg-container rounded-lg" id="dashboard-bg-container" style="border-radius:var(--radius-lg);border:1px solid var(--color-border);">
          <div class="dashboard-bg"></div>
          <div style="position:relative;z-index:1;padding:1px;">
            <!-- MESM-UI-406: KI-Button absolut positioniert -->
            <button class="ki-send-btn" id="btn-ki-send" title="An KI senden"
              style="position:absolute;top:12px;right:16px;z-index:20;padding:2px 8px;border-radius:var(--radius-sm);font-size:0.625rem;font-weight:700;border:none;cursor:pointer;background:var(--color-border);color:var(--color-text-muted);transition:all var(--transition-fast);">
              KI
            </button>
            <button id="btn-kompakt" title="Text in Kapitel gliedern – KI-Lösungen als Überschriften"
              style="position:absolute;top:12px;right:70px;z-index:20;padding:2px 8px;border-radius:var(--radius-sm);font-size:0.625rem;font-weight:700;border:none;cursor:pointer;background:#e8f0f8;color:#0f446b;">
              📝 Teilen
            </button>
            <textarea class="form-textarea" id="quelle-text" rows="8"
              placeholder="Fügen Sie hier Ihren Text ein oder nutzen Sie die weiteren Quellen-Typen..."
              style="border:none;background:transparent;box-shadow:none;min-height:160px;"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- YouTube URL -->
      <div class="form-group mt-4">
        <label class="form-label" style="display:flex;align-items:center;gap:var(--space-2);">
          ${YT_ICON} YouTube (URL)
        </label>
        <div style="display:flex;gap:var(--space-2);">
          <input class="form-input" id="youtube-url" placeholder="https://www.youtube.com/watch?v=..." style="flex:1;">
          <button class="btn btn-secondary btn-sm" id="btn-add-youtube">Hinzufügen</button>
        </div>
        <!-- MESM-UI-401: YouTube Embed Iframe -->
        <div id="youtube-embed-container" style="margin-top:var(--space-3);display:none;">
          <div class="youtube-embed" style="aspect-ratio:16/9;border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--color-border);">
            <iframe id="youtube-iframe" width="100%" height="100%" frameborder="0" allowfullscreen style="display:none;"></iframe>
            <div id="youtube-placeholder" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-text-dim);font-size:var(--text-sm);">YouTube-Video laden...</div>
          </div>
        </div>
      </div>

      <!-- Website URL -->
      <div class="form-group mt-4">
        <label class="form-label" style="display:flex;align-items:center;gap:var(--space-2);">
          ${LINK_ICON} Website (URL)
        </label>
        <div style="display:flex;gap:var(--space-2);">
          <input class="form-input" id="website-url" placeholder="https://..." style="flex:1;">
          <button class="btn btn-secondary btn-sm" id="btn-add-website">Hinzufügen</button>
        </div>
      </div>

      <!-- File Upload Dropzone -->
      <div class="form-group mt-4">
        <label class="form-label" style="display:flex;align-items:center;gap:var(--space-2);">
          ${UPLOAD_ICON} Datei-Upload
        </label>
        <div class="file-dropzone" id="thema-file-dropzone">
          <div class="dropzone-icon">📁</div>
          <div class="dropzone-text">Dateien hier ablegen oder klicken zum Auswählen</div>
        </div>
        <div id="thema-file-list" class="mt-2"></div>
      </div>

      <!-- MESM-UI-405: Progress Bar -->
      <div id="analyse-progress-container" style="display:none;margin-top:var(--space-4);">
        <div class="progress-bar">
          <div class="progress-bar-fill" id="analyse-progress-fill" style="width:0%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:var(--space-1);font-size:var(--text-xs);color:var(--color-text-dim);">
          <span>Analysiere Quellen...</span>
          <span id="analyse-progress-text">0%</span>
        </div>
      </div>

      <!-- Analyse starten Button + Prompt-Vorschau -->
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button class="btn btn-secondary" id="btn-prompt-preview" style="display:flex;align-items:center;gap:6px;">
          🔍 Prompt anzeigen
        </button>
        <button class="btn btn-primary" id="btn-analyse-start" style="display:flex;align-items:center;gap:var(--space-2);">
          ${PLAY_ICON} Analyse starten
        </button>
      </div>
    </div>
  `;

  createAccordion(acc, {
    number: 2,
    title: 'Quelltext',
    status: 'none',
    body: quelltextBody
  });

  /* ─── Accordion 3: Ergebnisse ────────────────────────────── */
  createAccordion(acc, {
    number: 3,
    title: 'Ergebnisse',
    status: 'none',
    body: `<div id="thema-ergebnisse-container"><p class="text-muted text-sm">Noch keine Analyse durchgeführt.</p></div>`
  });

  /* ─── Accordion 4: Projektstart ──────────────────────────── */
  createAccordion(acc, {
    number: 4,
    title: 'Projektstart',
    status: 'none',
    body: `
      <div data-section="thema-projektstart">
        <div class="form-group">
          <label class="form-label">Titel</label>
          <div class="copy-input-wrapper">
            <input class="form-input" id="projekt-titel" placeholder="Titel des Projekts">
            <button class="copy-btn" data-copy-target="projekt-titel" title="Kopieren">📋</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Projekt-Nummer</label>
          <div class="copy-input-wrapper">
            <input class="form-input font-mono" id="projekt-nummer" readonly style="background:#f3f4f6;">
            <button class="copy-btn" data-copy-target="projekt-nummer" title="Kopieren">📋</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Beschreibung</label>
          <div class="copy-input-wrapper">
            <textarea class="form-textarea" id="projekt-beschreibung" rows="5" placeholder="Kurzbeschreibung des Projekts..." style="min-height:120px;height:auto;overflow-y:visible;resize:vertical;"></textarea>
        </div>
        <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4);">
          <button class="btn btn-accent" id="btn-beschreibung-erstellen" style="flex:1;padding:12px;font-size:0.9rem;">
            📝 Beschreibung erstellen
          </button>
          <button class="btn btn-primary" id="btn-service-abschliessen" style="flex:1;padding:12px;font-size:0.9rem;" disabled>
            ✅ Service abschließen
          </button>
        </div>
        <div id="projektstart-result" class="mt-4"></div>
      </div>
    `
  });

  /* ─── Dashboard-BG Maus-Tracking ─────────────────────────── */
  const bgContainer = document.getElementById('dashboard-bg-container');

  // Projekt-Meta laden + Service-Status wiederherstellen
  if (state.activeProjectId) {
    try {
      const data = await api.getThema(state.activeChannelPrefix, state.activeProjectId);
      if (data?.meta) {
        const titelEl = document.getElementById('projekt-titel');
        const descEl = document.getElementById('projekt-beschreibung');
        const nummerEl = document.getElementById('projekt-nummer');
        if (titelEl && data.meta.title) titelEl.value = data.meta.title;
        if (descEl && data.meta.description) { descEl.value = data.meta.description; descEl.style.height = 'auto'; descEl.style.height = descEl.scrollHeight + 'px'; }
        if (nummerEl) nummerEl.value = state.activeProjectId;

        // Service-Status: wenn completed → readonly + grün
        if (data.meta.status === 'completed') {
          const btnAbschliessen = document.getElementById('btn-service-abschliessen');
          const inputs = document.querySelectorAll('#thema-accordion input, #thema-accordion textarea, #thema-accordion button:not(#btn-service-abschliessen):not(#btn-beschreibung-erstellen)');
          inputs.forEach(el => el.setAttribute('readonly', 'true'));
          if (btnAbschliessen) {
            btnAbschliessen.dataset.closed = 'true';
            btnAbschliessen.textContent = '🔓 Service wieder öffnen';
            btnAbschliessen.style.background = '#059669';
            btnAbschliessen.disabled = false;
          }
          document.querySelectorAll('#thema-accordion .service-panel').forEach(p => {
            let s = p.querySelector('.service-panel-status');
            if (!s) { s = document.createElement('span'); s.className = 'service-panel-status'; p.querySelector('.service-panel-header')?.appendChild(s); }
            s.textContent = '✓'; s.className = 'service-panel-status done';
          });
        }
      }
    } catch (_) {}
  }
  if (bgContainer) {
    bgContainer.addEventListener('mousemove', (e) => {
      const rect = bgContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      bgContainer.style.setProperty('--mouse-x', x + 'px');
      bgContainer.style.setProperty('--mouse-y', y + 'px');
    });
    bgContainer.addEventListener('mouseleave', () => {
      bgContainer.style.setProperty('--mouse-x', '50%');
      bgContainer.style.setProperty('--mouse-y', '50%');
    });
  }

  /* ─── Auto-Save Quelltext bei blur in Kanal-DB ──────────── */
  const quelltextEl = document.getElementById('quelle-text');
  if (quelltextEl) {
    // Bei blur: Text als Quelle in Projek-DB speichern
    // Beim Fokussieren: Text aus DB wiederherstellen falls leer
    quelltextEl.addEventListener('focus', async () => {
      if (!quelltextEl.value.trim() && state.activeProjectId) {
        try {
          const resp = await fetch(`http://localhost:3001/api/projects/${state.activeChannelPrefix}/${state.activeProjectId}/thema`);
          const data = await resp.json();
          const lastQuelle = data.quellen?.find(q => q.type === 'text');
          if (lastQuelle?.content) quelltextEl.value = lastQuelle.content;
        } catch (_) {}
      }
    });

    quelltextEl.addEventListener('blur', async () => {
      const text = quelltextEl.value.trim();
      if (!text || !state.activeProjectId) return;
      try {
        await api.addQuelle(state.activeChannelPrefix, state.activeProjectId, { type: 'text', content: text });
      } catch (_) { /* stilles Speichern */ }
    });

    // Sofort aus DB laden (nicht erst bei Fokus)
    if (state.activeProjectId) {
      try {
        const resp = await fetch(`http://localhost:3001/api/projects/${state.activeChannelPrefix}/${state.activeProjectId}/thema`);
        const data = await resp.json();
        const lastQuelle = data.quellen?.find(q => q.type === 'text');
        if (lastQuelle?.content) quelltextEl.value = lastQuelle.content;
      } catch (_) {}
    }
  }

  /* ─── Wire events ──────────────────────────────────────── */

  // Copy buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.dataset.copyTarget;
      const target = document.getElementById(targetId);
      if (target) {
        navigator.clipboard.writeText(target.value).then(() => {
          btn.textContent = '✓';
          setTimeout(() => { btn.textContent = '📋'; }, 1500);
        });
      }
    };
  });

  // MESM-UI-406: KI-Button – sendet Text an Chat
  const kiBtn = document.getElementById('btn-ki-send');
  if (kiBtn) {
    kiBtn.onclick = () => {
      const textarea = document.getElementById('quelle-text');
      if (!textarea || !textarea.value.trim()) return;
      kiBtn.style.background = 'var(--color-primary)';
      kiBtn.style.color = 'white';
      setTimeout(() => {
        kiBtn.style.background = 'var(--color-border)';
        kiBtn.style.color = 'var(--color-text-muted)';
      }, 2000);
      // Trigger chat send
      if (state.activeSidebarTab !== 'chat') state.activeSidebarTab = 'chat';
    };
  }

  // 📝 Teilen-Button: Text in Kapitel gliedern
  document.getElementById('btn-kompakt')?.addEventListener('click', async () => {
    const textarea = document.getElementById('quelle-text');
    if (!textarea || !textarea.value.trim()) return toast('Bitte erst Text eingeben', 'error');
    const original = textarea.value;
    const btn = document.getElementById('btn-kompakt');
    btn.textContent = '⏳';
    btn.disabled = true;

    // Text in 10KB-Chunks teilen und einzeln verarbeiten
    const chunkSize = 10000;
    const chunks = [];
    for (let i = 0; i < original.length; i += chunkSize) {
      chunks.push(original.slice(i, i + chunkSize));
    }

    try {
      showAIOverlay('KI gliedert Text', `Der Text wird in ${chunks.length} Blöcke unterteilt und jeder Block einzeln analysiert...`);
      let result = '';
      for (let i = 0; i < chunks.length; i++) {
        btn.textContent = `⏳ ${i+1}/${chunks.length}`;
        const resp = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemPrompt: 'Gehe den Text durch und füge für jede KI-Lösung/jedes KI-Modell/jede KI-Firma eine Überschrift ein im Format: **Name – Kernaussage**. Behalte den Originaltext unter der Überschrift. Kürze NICHT.',
            userMessage: chunks[i],
          }),
        });
        const data = await resp.json();
        if (data.response) result += data.response.trim() + '\n\n';
      }
      textarea.value = result.trim();
      toast(`In ${chunks.length} Teile gegliedert!`, 'success');
    } catch (err) {
      toast('Fehler: ' + err.message, 'error');
    }
    hideAIOverlay();
    btn.textContent = '📝 Teilen';
    btn.disabled = false;
  });

  // YouTube URL – Transkript herunterladen und als Quelle speichern
  document.getElementById('btn-add-youtube').onclick = async () => {
    const url = document.getElementById('youtube-url').value.trim();
    if (!url) return toast('Bitte YouTube-URL eingeben', 'error');
    const btn = document.getElementById('btn-add-youtube');
    btn.disabled = true; btn.textContent = '⏳ Lade Transkript...';
    try {
      const resp = await fetch('http://localhost:3001/api/channels/transcript', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ url })
      });
      if (!resp.ok) throw new Error((await resp.json()).error);
      const data = await resp.json();
      // In Textarea einfügen
      const textarea = document.getElementById('quelle-text');
      if (textarea) {
        textarea.value = (textarea.value + '\n\n' + data.text).trim();
        // Als Quelle speichern (Typ youtube)
        if (state.activeProjectId) {
          await api.addQuelle(state.activeChannelPrefix, state.activeProjectId, { type: 'youtube', content: url }).catch(()=>{});
          // UND den Text auch als text-Quelle speichern
          await api.addQuelle(state.activeChannelPrefix, state.activeProjectId, { type: 'text', content: textarea.value }).catch(()=>{});
        }
      }
      toast(`Transkript geladen: ${data.segments} Segmente`, 'success');
    } catch (err) {
      toast('Transkript nicht verfügbar: ' + err.message, 'error');
    }
    btn.disabled = false; btn.textContent = 'Hinzufügen';
  };

  // Website URL
  document.getElementById('btn-add-website').onclick = async () => {
    const url = document.getElementById('website-url').value.trim();
    if (!url) return toast('Bitte Website-URL eingeben', 'error');
    await addQuelle('website', url);
    document.getElementById('website-url').value = '';
  };

  // File dropzone
  const dropzone = document.getElementById('thema-file-dropzone');
  if (dropzone) {
    dropzone.onclick = () => addMockFile();
    dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); };
    dropzone.ondragleave = () => dropzone.classList.remove('drag-over');
    dropzone.ondrop = (e) => { e.preventDefault(); dropzone.classList.remove('drag-over'); addMockFile(); };
  }

  // Prompt-Vorschau
  document.getElementById('btn-prompt-preview').onclick = async () => {
    const textContent = document.getElementById('quelle-text')?.value?.trim();
    if (!textContent) return toast('Bitte zuerst Text eingeben', 'error');

    if (!state.activeProjectId) return toast('Kein Projekt aktiv', 'error');

    // Text speichern
    await api.addQuelle(state.activeChannelPrefix, state.activeProjectId, { type: 'text', content: textContent }).catch(() => {});

    // Prompt vom Backend holen
    try {
      const resp = await fetch(`http://localhost:3001/api/analyse-preview/${state.activeChannelPrefix}/${state.activeProjectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textContent })
      });
      const data = await resp.json();

      // Modal anzeigen
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;max-width:700px;width:95%;max-height:85vh;overflow-y:auto;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h3 style="margin:0;">🔍 Prompt-Vorschau</h3>
            <button id="close-preview" style="background:none;border:1px solid #d0d5dd;width:36px;height:36px;border-radius:8px;cursor:pointer;font-size:1.1rem;">✕</button>
          </div>
          <div style="margin-bottom:1rem;"><strong>System-Prompt:</strong><pre style="background:#f3f4f6;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:0.85rem;">${esc(data.systemPrompt || '-')}</pre></div>
          <div style="margin-bottom:1rem;"><strong>User-Prompt (für 1. Quelle):</strong><pre style="background:#f3f4f6;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:0.85rem;">${esc(data.userPrompt || '-')}</pre></div>
          ${data.jsonSchema ? `<div style="margin-bottom:1rem;"><strong>JSON-Schema:</strong><pre style="background:#fef3c7;padding:12px;border-radius:8px;white-space:pre-wrap;font-size:0.85rem;">${esc(data.jsonSchema)}</pre></div>` : ''}
          <div style="display:flex;gap:8px;justify-content:flex-end;">
            <button id="close-preview-btn" style="padding:10px 20px;background:#e5e7eb;color:#374151;border:none;border-radius:8px;cursor:pointer;">Schließen</button>
            <button id="start-from-preview" style="padding:10px 20px;background:#0f446b;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;">▶ Analyse starten</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.querySelector('#close-preview').onclick = (e) => { e.stopPropagation(); overlay.remove(); };
      overlay.querySelector('#close-preview-btn').onclick = (e) => { e.stopPropagation(); overlay.remove(); };
      overlay.querySelector('#start-from-preview').onclick = (e) => {
        e.stopPropagation();
        overlay.remove();
        // Analyse starten triggern
        document.getElementById('btn-analyse-start')?.click();
      };
      overlay.onclick = (e) => { if (e.target === overlay) { e.stopPropagation(); overlay.remove(); } };
    } catch (err) {
      toast('Vorschau nicht verfügbar: ' + err.message, 'error');
    }
  };

  // Analyse starten – Block für Block mit Live-Anzeige
  document.getElementById('btn-analyse-start')?.addEventListener('click', async function() {
    const textContent = document.getElementById('quelle-text')?.value?.trim();
    if (!textContent) { alert('Bitte erst Text eingeben.'); return; }
    if (!state.activeProjectId) {
      try { const p = await api.createProject(state.activeChannelPrefix, {title:'Neues Projekt'}); state.activeProjectId = p.id; }
      catch(e) { alert('Kein Projekt: '+e.message); return; }
    }

    const chars = textContent.length;
    const blockSize = 3000;
    const blocks = [];
    for (let i = 0; i < chars; i += blockSize) blocks.push(textContent.slice(i, i + blockSize));

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `<div style="background:#fff;border-radius:16px;padding:2rem;width:650px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 25px 80px rgba(0,0,0,0.4);"><h3>🔍 Analyse – ${blocks.length} Blöcke</h3><div id="apop" style="font-size:0.8rem;max-height:400px;overflow-y:auto;"></div><button id="aclose" style="margin-top:1rem;padding:8px 24px;background:#0f446b;color:#fff;border:none;border-radius:8px;cursor:pointer;">OK</button></div>`;
    document.body.appendChild(overlay);
    const pop = overlay.querySelector('#apop');
    let saved = 0, skipped = 0, canc = false;
    overlay.querySelector('#aclose').onclick = () => overlay.remove();

    for (let i = 0; i < blocks.length; i++) {
      if (canc) break;
      pop.innerHTML += `<div>🔹 Block ${i+1}/${blocks.length}...</div>`;
      try {
        const r = await fetch(`http://localhost:3001/api/projects/${state.activeChannelPrefix}/${state.activeProjectId}/thema/analyse-block`, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({content: blocks[i], blockNum: i+1, totalBlocks: blocks.length})
        });
        const d = await r.json();
        if (d.saved) { saved++; pop.innerHTML += `<div style="color:#059669;">✅ „${d.title?.substring(0,60)}" → gespeichert (${saved} insg.)</div>`; }
        else pop.innerHTML += `<div style="color:#9ca3af;">⚪ Kein Thema</div>`;
      } catch(e) { pop.innerHTML += `<div style="color:#dc2626;">❌ Fehler</div>`; }
      pop.scrollTop = pop.scrollHeight;
    }
    pop.innerHTML += `<div style="margin-top:8px;padding-top:8px;border-top:2px solid #0f446b;font-weight:700;">📋 ${saved} Themen gespeichert</div>`;
    
    // Konsolidierung
    pop.innerHTML += `<div style="margin-top:4px;">🔄 Konsolidiere...</div>`;
    try {
      const kr = await fetch(`http://localhost:3001/api/projects/${state.activeChannelPrefix}/${state.activeProjectId}/thema/konsolidieren`, { method: 'POST' });
      const kd = await kr.json();
      pop.innerHTML += `<div style="color:#059669;font-weight:700;">✅ ${kd.message}</div>`;
    } catch(e) { pop.innerHTML += `<div style="color:#dc2626;">❌ Konsolidierung fehlgeschlagen</div>`; }
    
    overlay.querySelector('#aclose').onclick = () => {
      overlay.remove();
      const p3 = document.querySelectorAll('.service-panel')[2];
      if (p3) p3.classList.add('open');
      api.getThema(state.activeChannelPrefix, state.activeProjectId).then(d => { if (d?.ergebnisse) renderErgebnisse(d.ergebnisse); });
    };
    document.getElementById('btn-analyse-start').disabled = false;
  });

  // Beschreibung erstellen: KI fasst gewählte Themen zusammen
  document.getElementById('btn-beschreibung-erstellen').onclick = async () => {
    if (!state.activeProjectId) return toast('Kein Projekt aktiv', 'error');
    const selectedCards = document.querySelectorAll('.topic-card.selected');
    if (selectedCards.length === 0) return toast('Keine Themen ausgewählt', 'error');

    const titles = [], descs = [];
    selectedCards.forEach(card => {
      const t = card.querySelector('.topic-card-title')?.textContent?.trim();
      const d = card.querySelector('.topic-card-desc')?.textContent?.trim();
      if (t) titles.push(t);
      if (d) descs.push(d);
    });

    const titelEl = document.getElementById('projekt-titel');
    const descEl = document.getElementById('projekt-beschreibung');
    const nummerEl = document.getElementById('projekt-nummer');
    const btnErstellen = document.getElementById('btn-beschreibung-erstellen');
    const btnAbschliessen = document.getElementById('btn-service-abschliessen');
    
    if (nummerEl) nummerEl.value = state.activeProjectId;
    const titel = titles.join(' | ').slice(0, 200);
    if (titelEl) titelEl.value = titel;

    const rawText = titles.map((t, i) => `## ${t}\n${descs[i] || ''}`).join('\n\n');
    
    btnErstellen.disabled = true;
    btnErstellen.textContent = '⏳ KI erstellt...';
    showAIOverlay('KI erstellt Beschreibung', `${selectedCards.length} Themen werden zu einer Projektbeschreibung zusammengeführt.`);

    try {
      const resp = await fetch('http://localhost:3001/api/chat', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          userMessage: `Fasse die folgenden Themen zu einer einzigen, gut strukturierten Projektbeschreibung zusammen. Behalte ALLE Inhalte, Fakten und Details – lasse nichts weg. Formuliere in klaren Absätzen mit einer logischen Gliederung. Keine Redundanzen.\n\nWICHTIG: Gib NUR die reine Beschreibung zurück. KEINE Einleitung, KEINE Schlusssätze, KEINE Meta-Kommentare.\n\n${rawText}`,
          systemPrompt: 'Du erstellst Projektbeschreibungen. Antwort NUR mit dem Beschreibungstext, ohne Einleitung oder Schlussworte.'
        })
      });
      const data = await resp.json();
      let text = data.response || data.text || data.content || '';
      text = text.replace(/^(Hier ist|Dies ist|Das ist|Im Folgenden|Nachfolgend|Die folgende|Folgend|Zusammenfassung der|Beschreibung der|Die Zusammenfassung|Diese Zusammenfassung|Diese Beschreibung|Das Ergebnis).*?[:\.\n]/i, '').trim();
      text = text.replace(/(Diese Beschreibung fasst|Diese Zusammenfassung|Zusammengefasst|Das war).*$/gmi, '').trim();
      if (text && descEl) {
        descEl.value = text;
        descEl.style.height = 'auto';
        descEl.style.height = descEl.scrollHeight + 'px';
        await api.saveMeta(state.activeChannelPrefix, state.activeProjectId, { title: titel, description: text });
        btnAbschliessen.disabled = false;
        toast('Beschreibung erstellt – jetzt Service abschließen', 'success');
      }
    } catch (err) {
      const fallback = titles.map((t, i) => `**${t}**\n${descs[i] || ''}`).join('\n\n');
      if (descEl && !descEl.value) descEl.value = fallback;
      toast('KI nicht erreichbar – Text direkt übernommen', 'warning');
      btnAbschliessen.disabled = false;
    }
    hideAIOverlay();
    btnErstellen.disabled = false;
    btnErstellen.textContent = '📝 Beschreibung erstellen';
  };

  // Service abschließen / wieder öffnen
  document.getElementById('btn-service-abschliessen').onclick = async () => {
    const btn = document.getElementById('btn-service-abschliessen');
    const titelEl = document.getElementById('projekt-titel');
    const descEl = document.getElementById('projekt-beschreibung');
    const inputs = document.querySelectorAll('#thema-accordion input, #thema-accordion textarea, #thema-accordion button:not(#btn-service-abschliessen):not(#btn-beschreibung-erstellen)');
    
    const isClosed = btn.dataset.closed === 'true';
    
    if (isClosed) {
      // Wieder öffnen
      btn.dataset.closed = 'false';
      btn.textContent = '✅ Service abschließen';
      btn.style.background = '';
      inputs.forEach(el => el.removeAttribute('readonly'));
      document.querySelectorAll('#thema-accordion .service-panel-status').forEach(s => { s.textContent = ''; s.className = 'service-panel-status'; });
      await api.saveMeta(state.activeChannelPrefix, state.activeProjectId, { status: 'active' });
      toast('Service wieder geöffnet', 'info');
    } else {
      // Abschließen
      const titel = titelEl?.value?.trim() || '';
      const desc = descEl?.value?.trim() || '';
      await api.saveMeta(state.activeChannelPrefix, state.activeProjectId, { title: titel, description: desc, status: 'completed' });
      
      btn.dataset.closed = 'true';
      btn.textContent = '🔓 Service wieder öffnen';
      btn.style.background = '#059669';
      inputs.forEach(el => el.setAttribute('readonly', 'true'));
      
      // Alle Accordions grün
      document.querySelectorAll('#thema-accordion .service-panel').forEach(p => {
        let s = p.querySelector('.service-panel-status');
        if (!s) { s = document.createElement('span'); s.className = 'service-panel-status'; p.querySelector('.service-panel-header')?.appendChild(s); }
        s.textContent = '✓'; s.className = 'service-panel-status done';
      });
      toast('✅ Service Thema abgeschlossen', 'success');
    }
  };

  // Channel select
  document.getElementById('thema-channel-select')?.addEventListener('change', (e) => {
    const prefix = e.target.value;
    const channel = state.channels.find(c => c.prefix === prefix);
    if (channel) state.selectedChannel = channel;
  });

  // Neues Projekt Button
  document.getElementById('btn-new-project')?.addEventListener('click', async () => {
    try {
      const proj = await api.createProject(state.activeChannelPrefix, { title: 'Neues Projekt' });
      state.activeProjectId = proj.id;
      toast('📁 Projekt ' + proj.id + ' erstellt', 'success');
      // Seite neuladen für frische Ansicht
      state.activeNav = state.activeNav; // trigger re-render
    } catch (err) { toast(err.message, 'error'); }
  });

  // Bestehendes Projekt auswählen
  document.getElementById('existing-project-select')?.addEventListener('change', async (e) => {
    const id = e.target.value;
    if (id) {
      state.activeProjectId = id;
      // Daten aus Projekt-DB laden
      try {
        const data = await api.getThema(state.activeChannelPrefix, id);
        // Quellen wiederherstellen
        const textQuelle = data.quellen?.find(q => q.type === 'text');
        if (textQuelle) {
          const textarea = document.getElementById('quelle-text');
          if (textarea) textarea.value = textQuelle.content || '';
        }
        const ytQuelle = data.quellen?.find(q => q.type === 'youtube');
        if (ytQuelle) {
          const ytInput = document.getElementById('youtube-url');
          if (ytInput) ytInput.value = ytQuelle.content || '';
        }
        const webQuelle = data.quellen?.find(q => q.type === 'website');
        if (webQuelle) {
          const webInput = document.getElementById('website-url');
          if (webInput) webInput.value = webQuelle.content || '';
        }
        // Ergebnisse anzeigen
        if (data.ergebnisse?.length > 0) {
          renderErgebnisse(data.ergebnisse);
        }
        toast('Projekt geladen: ' + id, 'success');
      } catch (_) {}
      state.activeNav = state.activeNav;
    }
  });

  // Load existing data (async IIFE needed for top-level await in modules)
  if (state.activeProjectId) {
    api.getThema(state.activeChannelPrefix, state.activeProjectId).then(data => {
      if (data.ergebnisse?.length > 0) renderErgebnisse(data.ergebnisse);
    }).catch(() => {});
  }

  // Kanal-Refresh
  window.addEventListener('channel-created', () => {
    api.getChannels().then(channels => {
      state.channels = channels;
      const select = document.getElementById('thema-channel-select');
      if (select) {
        select.innerHTML = channels.map(ch => `<option value="${ch.prefix}" ${state.activeChannelPrefix === ch.prefix ? 'selected' : ''}>${ch.prefix} – ${ch.title}</option>`).join('');
      }
    });
  });
}

/* ─── Helper: getYoutubeEmbedUrl ──────────────────────────── */
function getYoutubeEmbedUrl(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

/* ─── Helper: Quelle hinzufügen ───────────────────────────── */
async function addQuelle(type, content) {
  if (!state.activeProjectId) {
    try {
      const proj = await api.createProject(state.activeChannelPrefix, { title: 'Neues Projekt' });
      state.activeProjectId = proj.id;
    } catch (err) {
      return toast(err.message, 'error');
    }
  }
  try {
    await api.addQuelle(state.activeChannelPrefix, state.activeProjectId, { type, content });
    toast('Quelle hinzugefügt', 'success');
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ─── Helper: Mock-Datei ──────────────────────────────────── */
function addMockFile() {
  const mockFiles = ['Transkript.txt', 'Notizen.txt', 'Quellen.txt', 'Recherche.pdf'];
  const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
  const list = document.getElementById('thema-file-list');
  if (list) {
    const existing = list.querySelectorAll('.file-list-item').length;
    list.innerHTML += `
      <div class="file-list-item">
        <span class="file-item-dot"></span>
        <span style="flex:1;font-family:var(--font-mono);font-size:var(--text-sm);">${randomFile} (${existing + 1})</span>
        <button class="btn-icon" style="border:none;color:var(--color-text-dim);cursor:pointer;font-size:0.8rem;"
          onclick="this.parentElement.remove()">✕</button>
      </div>
    `;
  }
  toast(`Datei "${randomFile}" hinzugefügt`, 'success');
}

/* ─── MESM-UI-407: Ergebnis-Cards ─────────────────────────── */
function renderErgebnisse(ergebnisse) {
  const el = document.getElementById('thema-ergebnisse-container');
  if (!el) return;

  if (!ergebnisse || ergebnisse.length === 0) {
    el.innerHTML = '<p class="text-muted text-sm">Keine Themen extrahiert.</p>';
    return;
  }

  // Kategorien extrahieren für Filter
  const cats = [...new Set(ergebnisse.map(t => t.category || 'Allgemein'))].sort();

  el.innerHTML = `
    <h4 style="margin-bottom:var(--space-2);display:flex;align-items:center;gap:var(--space-2);">
      Themenvorschläge
      <span class="badge badge-ki">KI-generiert</span>
      <span class="badge badge-info">${ergebnisse.length} Themen</span>
    </h4>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px;" id="kat-filter-bar">
      <button class="kat-filter-btn active" data-kat="*" style="padding:3px 10px;border-radius:12px;border:1px solid #d0d5dd;background:#0f446b;color:#fff;cursor:pointer;font-size:0.7rem;">Alle (${ergebnisse.length})</button>
      ${cats.map(c => `<button class="kat-filter-btn" data-kat="${esc(c)}" style="padding:3px 10px;border-radius:12px;border:1px solid #d0d5dd;background:#fff;cursor:pointer;font-size:0.7rem;">${esc(c)} (${ergebnisse.filter(t=>(t.category||'Allgemein')===c).length})</button>`).join('')}
    </div>
    <div class="topic-grid" id="topic-grid">
      ${ergebnisse.map(t => `
        <div class="topic-card ${t.selected ? 'selected' : ''}" data-id="${t.id}" data-kat="${esc(t.category||'Allgemein')}">
          <div class="topic-card-title">${esc(t.title)}</div>
          <div class="topic-card-desc">${esc((t.description || 'Keine Beschreibung').split('---')[0].trim().substring(0, 200))}</div>
          <div class="topic-card-category">
            <span class="badge badge-ki">${esc(t.category || 'Allgemein')}</span>
          </div>
          <button class="btn-view-source" data-id="${t.id}" style="margin-top:4px;padding:2px 8px;font-size:0.7rem;background:#e8f0f8;border:1px solid #d0d5dd;border-radius:4px;cursor:pointer;">📄 Quelltext</button>
        </div>
      `).join('')}
    </div>
  `;

  // Filter-Logik
  el.querySelectorAll('.kat-filter-btn').forEach(btn => {
    btn.onclick = () => {
      el.querySelectorAll('.kat-filter-btn').forEach(b => { b.classList.remove('active'); b.style.background='#fff'; b.style.color='#000'; });
      btn.classList.add('active'); btn.style.background='#0f446b'; btn.style.color='#fff';
      const kat = btn.dataset.kat;
      el.querySelectorAll('.topic-card').forEach(card => {
        card.style.display = (kat === '*' || card.dataset.kat === kat) ? '' : 'none';
      });
    };
  });

  // Wire topic selection
  el.querySelectorAll('.topic-card').forEach((card, i) => {
    card.style.animationDelay = (i * 0.1) + 's';
    card.classList.add('row-stagger-in');
    card.onclick = async (ev) => {
      // Nicht feuern wenn Quelltext-Button oder Kategorie-Badge geklickt wurde
      if (ev.target.closest('.btn-view-source') || ev.target.closest('.topic-card-category')) return;
      const id = parseInt(card.dataset.id);
      const topic = ergebnisse.find(t => t.id === id);
      if (!topic) return;
      try {
        await api.updateErgebnis(state.activeChannelPrefix, state.activeProjectId, id, {
          selected: !topic.selected ? 1 : 0
        });
        topic.selected = !topic.selected ? 1 : 0;
        card.classList.toggle('selected');
      } catch (err) {
        toast(err.message, 'error');
      }
    };

    // F-T06: Kategorie durch Klick auf Badge ändern
    const catBadge = card.querySelector('.topic-card-category');
    if (catBadge) {
      catBadge.style.cursor = 'pointer';
      catBadge.title = 'Kategorie ändern';
      catBadge.onclick = async (ev) => {
        ev.stopPropagation();
        const id = parseInt(card.dataset.id);
        const topic = ergebnisse.find(t => t.id === id);
        if (!topic) return;
        const currentCat = topic.category || 'Allgemein';
        // Dropdown mit verfügbaren Kategorien anzeigen
        const existing = catBadge.querySelector('.kat-change-dropdown');
        if (existing) { existing.remove(); return; }
        const dropdown = document.createElement('div');
        dropdown.className = 'kat-change-dropdown';
        dropdown.style.cssText = 'position:absolute;top:100%;left:0;background:#fff;border:1px solid #d0d5dd;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:50;min-width:160px;padding:4px;';
        dropdown.innerHTML = cats.map(c => `
          <div data-kat="${esc(c)}" style="padding:6px 12px;cursor:pointer;border-radius:4px;font-size:0.8rem;${c === currentCat ? 'background:#e8f0f8;font-weight:600;' : ''}">
            ${esc(c)} ${c === currentCat ? '✓' : ''}
          </div>`).join('');
        catBadge.style.position = 'relative';
        catBadge.appendChild(dropdown);

        dropdown.querySelectorAll('[data-kat]').forEach(opt => {
          opt.onclick = async (e2) => {
            e2.stopPropagation();
            const newCat = opt.dataset.kat;
            dropdown.remove();
            try {
              await api.updateErgebnis(state.activeChannelPrefix, state.activeProjectId, id, { category: newCat });
              topic.category = newCat;
              renderErgebnisse(ergebnisse);
            } catch (err) { toast(err.message, 'error'); }
          };
        });

        // Click outside entfernt Dropdown
        const closeDropdown = (e2) => {
          if (!catBadge.contains(e2.target)) {
            dropdown.remove();
            document.removeEventListener('click', closeDropdown);
          }
        };
        setTimeout(() => document.addEventListener('click', closeDropdown), 10);
      };
    }
  });

  // View-Source Buttons
  el.querySelectorAll('.btn-view-source').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      const topic = ergebnisse.find(t => t.id === id);
      if (!topic) return;
      const sourceText = (topic.description || '').split('---')[1] || topic.description || '';
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
      overlay.innerHTML = `<div style="background:#fff;border-radius:12px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;padding:1.5rem;"><h3>📄 ${esc(topic.title)}</h3><pre style="white-space:pre-wrap;font-size:0.85rem;">${esc(sourceText)}</pre><button style="margin-top:1rem;padding:8px 20px;background:#0f446b;color:#fff;border:none;border-radius:6px;cursor:pointer;">Schließen</button></div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('button').onclick = () => overlay.remove();
      overlay.onclick = (ev) => { if (ev.target === overlay) overlay.remove(); };
    };
  });
}

/* ─── Helper: Accordion-Panel öffnen ──────────────────────── */
function openPanel(container, index) {
  const panels = container.querySelectorAll('.service-panel');
  if (panels[index]) {
    panels[index].classList.add('open');
  }
}
