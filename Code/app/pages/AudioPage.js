/**
 * AudioPage – Schritt 3: Audio-Upload, Transkription, Sprechertrennung
 */

import { state, toast, esc } from '../shared/state.js';
import { api } from '../shared/api.js';
import { createAccordion } from '../components/organisms/ServiceAccordion.js';

export default async function AudioPage(container) {
  if (!state.activeChannelPrefix || !state.activeProjectId) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎙</div><div class="empty-state-title">Kein Projekt aktiv</div><div class="empty-state-text">Bitte starten Sie zuerst ein Projekt.</div></div>';
    return;
  }

  container.innerHTML = `
    <div class="workspace-header">
      <h1 class="workspace-title">Schritt 3: Audio</h1>
      <p class="workspace-subtitle">Audio hochladen, Transkription & Sprechertrennung via MCP</p>
    </div>
    <div class="service-accordion" id="audio-accordion"></div>
  `;

  const acc = document.getElementById('audio-accordion');

  // Load existing data
  let audioData = { konfig: null, spuren: [], transkript: [] };
  try {
    audioData = await api.getAudio(state.activeChannelPrefix, state.activeProjectId);
  } catch (_) { /* ok */ }

  // Microservice 1: Audio-Kriterien (MESM-UI-403a: Sortable Table)
  let audioKriterien = [];
  try {
    audioKriterien = await api.getKriterien(state.activeChannelPrefix, 'audio');
  } catch (_) { /* ok */ }

  const audioKBody = audioKriterien.length > 0
    ? renderAudioKriterienTable(audioKriterien)
    : '<p class="text-muted text-sm">Keine Audio-Kriterien im Kanal definiert. <a href="#" id="goto-kanal-audio">Zum Kanal-Setup</a></p>';

  createAccordion(acc, {
    number: 1,
    id: 'acc-audio-1',
    title: 'Kriterien auswählen',
    status: 'none',
    body: `
      <div class="form-group">
        <div class="search-field">
          <span class="search-icon">🔍</span>
          <input class="form-input" id="audio-krit-search" placeholder="Kriterien durchsuchen...">
        </div>
      </div>
      <div id="audio-kriterien-container">${audioKBody}</div>
      <div class="form-group mt-4">
        <label class="form-label">Zusätzlicher Text (fließt in den Audio-Prompt ein)</label>
        <textarea class="form-textarea" id="audio-prompt-extra" rows="3" placeholder="Weitere Anweisungen..."></textarea>
      </div>
      <button class="btn btn-primary" id="btn-audio-kriterien-speichern">Auswahl speichern & Prompt generieren</button>
    `
  });

  // Microservice 2: Prompt generieren (wie Research)
  createAccordion(acc, {
    number: 2,
    id: 'acc-audio-2',
    title: 'Prompt generieren',
    status: 'none',
    body: `
      <p class="text-muted text-sm mb-4">Der generierte Prompt basiert auf den ausgewählten Kriterien und dem Prompt-Template aus dem Kanal.</p>
      <div id="audio-prompt-loading" style="display:none;text-align:center;padding:1rem;">
        <div style="display:inline-block;width:24px;height:24px;border:3px solid #e5e7eb;border-top-color:#0f446b;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <p style="font-size:0.8rem;color:#6b7280;margin-top:0.5rem;">Prompt wird generiert...</p>
      </div>
      <div id="audio-generated-prompt" class="result-area">
        <em class="text-muted">Noch kein Prompt generiert.</em>
      </div>
      <div id="audio-prompt-actions" style="margin-top:1rem;display:none;gap:0.5rem;">
        <button class="btn btn-primary" id="btn-audio-copy-prompt">📋 Prompt kopieren</button>
      </div>
    `
  });

  // Microservice 3: Audio hochladen
  createAccordion(acc, {
    number: 3,
    title: 'Audio hochladen',
    status: audioData.konfig ? 'done' : 'none',
    body: `
      <div class="file-dropzone" id="audio-dropzone">
        <div class="dropzone-icon">🎙</div>
        <div class="dropzone-text">Audio-Datei hier ablegen oder klicken zum Auswählen</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-dim);margin-top:var(--space-2);">Unterstützt: .mp3, .wav, .m4a (max. 500MB)</div>
      </div>
      <input type="file" id="audio-file-input" accept=".mp3,.wav,.m4a" style="display:none;">
      <div class="form-group mt-4">
        <label class="form-label">Oder Dateipfad angeben</label>
        <input class="form-input" id="audio-path" placeholder="z.B. C:/Users/.../audio.mp3">
      </div>
      <div class="form-group">
        <label class="form-label">Anzahl Sprecher</label>
        <select class="form-select" id="speaker-count" style="max-width:200px;">
          <option value="1">1 Sprecher</option>
          <option value="2" selected>2 Sprecher</option>
          <option value="3">3 Sprecher</option>
          <option value="4">4 Sprecher</option>
        </select>
      </div>
      <button class="btn btn-primary" id="btn-upload-audio">🔄 Hochladen & Verarbeiten</button>
      <div id="audio-status" class="mt-4"></div>
    `
  });

  // Microservice 4: Transkript anzeigen
  createAccordion(acc, {
    number: 4,
    title: 'Transkript',
    status: audioData.transkript?.length > 0 ? 'done' : 'none',
    body: audioData.transkript?.length > 0
      ? renderTranscript(audioData.transkript)
      : '<p class="text-muted text-sm">Transkript wird nach der Audio-Verarbeitung angezeigt.</p>'
  });

  // Microservice 5: Sprecher-Spuren
  createAccordion(acc, {
    number: 5,
    title: 'Sprecher-Spuren',
    status: audioData.spuren?.length > 0 ? 'done' : 'none',
    body: audioData.spuren?.length > 0
      ? audioData.spuren.map(s => `
        <div class="card" style="padding:var(--space-3);">
          <strong>Sprecher ${esc(s.sprecher)}</strong>
          <code style="font-size:var(--text-xs);display:block;margin-top:var(--space-1);">${esc(s.datei_pfad)}</code>
        </div>
      `).join('')
      : '<p class="text-muted text-sm">Sprecher-Spuren erscheinen nach der Verarbeitung.</p>'
  });

  // ─── Wire events ─────────────────────────────────────────────────
  // File dropzone
  const dropzone = document.getElementById('audio-dropzone');
  const fileInput = document.getElementById('audio-file-input');
  dropzone?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      document.getElementById('audio-path').value = file.path || file.name;
      dropzone.querySelector('.dropzone-text').textContent = `Ausgewählt: ${file.name}`;
      dropzone.classList.add('drag-over');
    }
  });
  dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      document.getElementById('audio-path').value = file.path || file.name;
      dropzone.querySelector('.dropzone-text').textContent = `Ausgewählt: ${file.name}`;
    }
  });

  document.getElementById('btn-upload-audio')?.addEventListener('click', async () => {
    const path = document.getElementById('audio-path')?.value.trim();
    const count = parseInt(document.getElementById('speaker-count')?.value || '2');

    if (!path) return toast('Bitte geben Sie einen Dateipfad an', 'error');

    const btn = document.getElementById('btn-upload-audio');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Verarbeite...';

    try {
      const result = await api.uploadAudio(state.activeChannelPrefix, state.activeProjectId, {
        datei_pfad: path,
        sprecher_anzahl: count
      });
      document.getElementById('audio-status').innerHTML = `
        <div class="badge badge-success">Verarbeitung abgeschlossen</div>
        <p class="text-sm mt-2">Sprecher: ${count} | Transkript-Einträge: ${result.transkript?.length || 0}</p>
      `;
      toast('Audio erfolgreich verarbeitet!', 'success');

      // Reload page
      state.activeNav = '3';
    } catch (err) {
      toast(err.message, 'error');
    }
    btn.disabled = false;
    btn.innerHTML = '🔄 Hochladen & Verarbeiten';
  });

  document.getElementById('btn-goto-kanal-audio')?.addEventListener('click', () => {
    state.activeNav = 'kanal';
  });

  // Audio-Kriterien: Search filter
  document.getElementById('audio-krit-search')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#audio-kriterien-container tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });

  // Select-All per Kategorie
  document.querySelectorAll('.sel-cat').forEach(cb => {
    cb.addEventListener('change', function() {
      const cat = this.dataset.cat;
      const table = this.closest('table');
      table?.querySelectorAll('tbody .audio-krit-checkbox').forEach(kcb => { kcb.checked = this.checked; });
    });
  });

    document.getElementById('btn-audio-kriterien-speichern')?.addEventListener('click', async () => {
    const checks = document.querySelectorAll('.audio-krit-checkbox:checked');
    const ids = Array.from(checks).map(c => c.value);
    const extra = document.getElementById('audio-prompt-extra')?.value || '';
    const loadingEl = document.getElementById('audio-prompt-loading');
    const promptEl = document.getElementById('audio-generated-prompt');
    const actionsEl = document.getElementById('audio-prompt-actions');
    const acc2 = document.getElementById('acc-audio-2');

    // Accordion #2 oeffnen + Lade-Indikator (genau wie Research)
    if (acc2) acc2.classList.add('open');
    if (loadingEl) loadingEl.style.display = 'block';
    if (promptEl) promptEl.innerHTML = '';
    if (actionsEl) actionsEl.style.display = 'none';

    try {
      // Schritt 1: Auswahl speichern (wie Research)
      await api.selectAudioKriterien(state.activeChannelPrefix, state.activeProjectId, ids);
      // Schritt 2: Prompt generieren (ohne ids – werden aus DB gelesen)
      const result = await api.generateAudioPrompt(state.activeChannelPrefix, state.activeProjectId, { extra_text: extra });
      const text = result.resolved || result.prompt || '';
      if (promptEl) {
        promptEl.innerHTML = '<pre style="white-space:pre-wrap;font-size:0.85rem;line-height:1.5;">' + esc(text) + '</pre>';
      }
      if (actionsEl) actionsEl.style.display = 'flex';
      toast('Audio-Prompt generiert', 'success');
    } catch (err) {
      toast(err.message, 'error');
      if (promptEl) promptEl.innerHTML = '<em class="text-red">Fehler: ' + esc(err.message) + '</em>';
    }
    if (loadingEl) loadingEl.style.display = 'none';
  });

  // Prompt kopieren
  document.getElementById('btn-audio-copy-prompt')?.addEventListener('click', () => {
    const text = document.querySelector('#audio-generated-prompt pre')?.textContent || '';
    navigator.clipboard.writeText(text);
    toast('Prompt kopiert!', 'success');
  });

  // Goto Kanal link
  document.getElementById('goto-kanal-audio')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeNav = 'kanal';
  });
}

/* ─── Audio-Kriterien Table (wie Research) ────────────────── */
function renderAudioKriterienTable(kriterien) {
  const groups = {};
  for (const k of kriterien) {
    const cat = k.category || k.kategorie || 'Ohne Kategorie';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(k);
  }
  const catOrder = Object.keys(groups).sort();

  return catOrder.map(cat => `
    <div style="margin-bottom:1rem;">
      <h4 style="font-size:0.8rem;font-weight:700;color:#0f446b;margin:0 0 0.3rem 0;padding:4px 8px;background:#e8f0f8;border-radius:4px;">📁 ${esc(cat)} (${groups[cat].length})</h4>
      <table class="data-table" style="width:100%;">
        <thead>
          <tr>
            <th style="width:32px;"><input type="checkbox" class="checkbox-styled sel-cat" data-cat="${esc(cat)}" checked></th>
            <th style="width:140px;">Schlagwort</th>
            <th>Promptteil</th>
          </tr>
        </thead>
        <tbody>
          ${groups[cat].map(k => `
            <tr>
              <td><input type="checkbox" class="checkbox-styled audio-krit-checkbox" value="${esc(k.id)}" checked></td>
              <td><strong>${esc(k.keyword)}</strong></td>
              <td style="font-size:0.75rem;color:#6b7280;">${esc(((k.promptteil || k.prompt_snippet || '')).substring(0, 150))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}

/* ─── MESM-UI-403b: Transkript mit Row-Animation ──────────────── */
function renderTranscript(transkript) {
  const rows = transkript.map((t, i) => `
    <tr class="row-stagger-in" style="animation-delay:${i * 0.03}s;">
      <td style="font-family:var(--font-mono);font-size:var(--text-xs);">${esc(t.start_time)}</td>
      <td style="font-family:var(--font-mono);font-size:var(--text-xs);">${esc(t.end_time)}</td>
      <td>
        <span class="badge ${t.speaker === 'Moderator' ? 'badge-info' : t.speaker === 'Gast' ? 'badge-ki' : 'badge-warning'}">
          ${esc(t.speaker)}
        </span>
      </td>
      <td>${esc(t.text)}</td>
    </tr>
  `).join('');

  return `
    <p class="text-xs text-muted mb-2">${transkript.length} Zeilen transkribiert</p>
    <div style="overflow-x:auto;">
      <table class="data-table">
        <thead>
          <tr><th>Start</th><th>Ende</th><th>Sprecher</th><th>Satz</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* ─── MESM-UI-003: Sortable Table Utilities (shared pattern) ──── */
let audioSortState = { field: null, dir: 'asc' };

function wireSortableTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.querySelectorAll('th.sortable').forEach(th => {
    th.style.cursor = 'pointer';
    th.style.userSelect = 'none';
    th.onclick = () => {
      const field = th.dataset.sort;
      if (audioSortState.field === field) {
        audioSortState.dir = audioSortState.dir === 'asc' ? 'desc' : 'asc';
      } else {
        audioSortState.field = field;
        audioSortState.dir = 'asc';
      }
      sortTable(tableId, audioSortState.field, audioSortState.dir);
      updateSortIndicators(table, audioSortState.field, audioSortState.dir);
    };
  });
}

function sortTable(tableId, field, dir) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll('tr'));
  rows.sort((a, b) => {
    const aVal = (a.dataset[field] || '').toLowerCase();
    const bVal = (b.dataset[field] || '').toLowerCase();
    const cmp = aVal.localeCompare(bVal);
    return dir === 'asc' ? cmp : -cmp;
  });
  rows.forEach(row => tbody.appendChild(row));
}

function updateSortIndicators(table, activeField, dir) {
  table.querySelectorAll('th.sortable').forEach(th => {
    const field = th.dataset.sort;
    const indicator = th.querySelector('.sort-indicator');
    if (!indicator) return;
    if (field === activeField) {
      indicator.textContent = dir === 'asc' ? ' ▲' : ' ▼';
      indicator.style.color = 'var(--color-primary)';
    } else {
      indicator.textContent = ' ⇅';
      indicator.style.color = 'var(--color-border)';
    }
  });
}
