/**
 * SlidesPage – Schritt 4: Slides-Upload, Steuerdatei, Timing
 */

import { state, toast, esc, uid } from '../shared/state.js';
import { api } from '../shared/api.js';
import { createAccordion } from '../components/organisms/ServiceAccordion.js';

export default async function SlidesPage(container) {
  if (!state.activeChannelPrefix || !state.activeProjectId) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🖼</div><div class="empty-state-title">Kein Projekt aktiv</div><div class="empty-state-text">Bitte starten Sie zuerst ein Projekt.</div></div>';
    return;
  }

  let slidesData = { ergebnisse: [], timing: [] };
  try { slidesData = await api.getSlides(state.activeChannelPrefix, state.activeProjectId); } catch (_) {}

  container.innerHTML = `
    <div class="workspace-header">
      <h1 class="workspace-title">Schritt 4: Slides</h1>
      <p class="workspace-subtitle">Slides via Kimi 2.6 generieren, hochladen, Steuerdatei erstellen</p>
    </div>
    <div class="service-accordion" id="slides-accordion"></div>
  `;

  const acc = document.getElementById('slides-accordion');

  // Microservice 1: Kriterien (MESM-UI-404a: Sortable Table)
  let slidesKriterien = [];
  try {
    slidesKriterien = await api.getKriterien(state.activeChannelPrefix, 'slides');
  } catch (_) { /* ok */ }

  const slidesKBody = slidesKriterien.length > 0
    ? renderSlidesKriterienTable(slidesKriterien)
    : '<p class="text-muted text-sm">Keine Slides-Kriterien im Kanal definiert. <a href="#" id="goto-kanal-slides">Zum Kanal-Setup</a></p>';

  createAccordion(acc, {
    number: 1,
    title: 'Kriterien für Slides',
    status: 'none',
    body: `
      <p class="text-muted text-sm mb-4">Kriterien für die Slides-Erstellung (Design, Typografie, Inhalt, etc.). Wählen Sie relevante Kriterien aus.</p>
      <div id="slides-kriterien-container">${slidesKBody}</div>
      <div class="form-group mt-4">
        <label class="form-label">Prompt-Ergänzung</label>
        <textarea class="form-textarea" id="slides-prompt-extra" rows="3" placeholder="Zusätzliche Anweisungen..."></textarea>
      </div>
      <button class="btn btn-accent btn-sm" id="btn-slides-prompt-copy">📋 Prompt-Erstellung kopieren</button>
    `
  });

  // Microservice 2: Slides hochladen
  createAccordion(acc, {
    number: 2,
    title: 'Slides hochladen (ZIP)',
    status: slidesData.ergebnisse?.length > 0 ? 'done' : 'none',
    body: `
      <div class="file-dropzone" id="slides-dropzone">
        <div class="dropzone-icon">📦</div>
        <div class="dropzone-text">ZIP-Datei mit Slide-Bildern hier ablegen oder klicken</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-dim);margin-top:var(--space-2);">Unterstützt: .zip mit .jpg/.png/.webp Bildern</div>
      </div>
      <input type="file" id="slides-file-input" accept=".zip" style="display:none;">
      <div class="form-group mt-4">
        <label class="form-label">Oder Dateipfad angeben</label>
        <input class="form-input" id="zip-path" placeholder="Pfad zur ZIP-Datei...">
      </div>
      <button class="btn btn-primary" id="btn-upload-zip">📦 Hochladen</button>
      <div id="zip-upload-status" class="mt-4"></div>
    `
  });

  // Microservice 3: Steuerdatei (Timing)
  const timingTable = slidesData.timing?.length > 0
    ? renderTimingTable(slidesData.timing)
    : '<p class="text-muted text-sm">Noch keine Steuerdatei. Fügen Sie Slide-Timings hinzu.</p>';

  createAccordion(acc, {
    number: 3,
    title: 'Steuerdatei (Timing)',
    status: slidesData.timing?.length > 0 ? 'done' : 'none',
    body: `
      <p class="text-muted text-sm mb-4">Definieren Sie Start- und Endzeit für jedes Slide. Fügen Sie Text ein oder eine Tabelle, die von der KI geparst wird.</p>
      <div class="form-group">
        <label class="form-label">Tabelle einfügen (Start | Ende | Dateiname)</label>
        <textarea class="form-textarea" id="timing-input" placeholder="00:00 | 00:05 | slide1.jpg&#10;00:05 | 00:12 | slide2.jpg&#10;..."></textarea>
      </div>
      <button class="btn btn-primary" id="btn-parse-timing">📊 Steuerdatei erstellen</button>
      <div id="timing-result" class="mt-4">${timingTable}</div>
    `
  });

  // Wire events
  // File dropzone
  const sDropzone = document.getElementById('slides-dropzone');
  const sFileInput = document.getElementById('slides-file-input');
  sDropzone?.addEventListener('click', () => sFileInput?.click());
  sFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      document.getElementById('zip-path').value = file.path || file.name;
      sDropzone.querySelector('.dropzone-text').textContent = `Ausgewählt: ${file.name}`;
      sDropzone.classList.add('drag-over');
    }
  });
  sDropzone?.addEventListener('dragover', (e) => { e.preventDefault(); sDropzone.classList.add('drag-over'); });
  sDropzone?.addEventListener('dragleave', () => sDropzone.classList.remove('drag-over'));
  sDropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    sDropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      document.getElementById('zip-path').value = file.path || file.name;
      sDropzone.querySelector('.dropzone-text').textContent = `Ausgewählt: ${file.name}`;
    }
  });

  document.getElementById('btn-upload-zip')?.addEventListener('click', async () => {
    const zipPath = document.getElementById('zip-path')?.value?.trim();
    if (!zipPath) return toast('Bitte geben Sie einen Pfad zur ZIP-Datei an', 'error');

    const btn = document.getElementById('btn-upload-zip');
    const statusEl = document.getElementById('zip-upload-status');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Entpacke...';

    try {
      const result = await api.uploadSlidesZip(state.activeChannelPrefix, state.activeProjectId, zipPath);

      if (statusEl) {
        statusEl.innerHTML = `
          <div class="card success-animate" style="background:rgba(37,194,121,0.07);border:1px solid rgba(37,194,121,0.3);">
            <div style="display:flex;align-items:center;gap:var(--space-2);color:var(--color-success);font-weight:600;margin-bottom:var(--space-2);">
              ✅ ${result.slideCount} Slides erfolgreich extrahiert
            </div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted);max-height:120px;overflow-y:auto;">
              ${result.files.map(f => `<div class="file-list-item"><span class="file-item-dot"></span><span>${esc(f)}</span></div>`).join('')}
            </div>
            ${result.warnings?.length ? `<div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--color-warning);">⚠ ${esc(result.warnings[0])}</div>` : ''}
          </div>
        `;
      }
      toast(`${result.slideCount} Slides extrahiert!`, 'success');

      // Reload to show updated data
      setTimeout(() => { state.activeNav = '4'; }, 500);
    } catch (err) {
      if (statusEl) {
        statusEl.innerHTML = `<div class="badge badge-error" style="margin-top:var(--space-2);">❌ ${esc(err.message)}</div>`;
      }
      toast(err.message, 'error');
    }
    btn.disabled = false;
    btn.innerHTML = '📦 Hochladen';
  });

  document.getElementById('btn-parse-timing')?.addEventListener('click', async () => {
    const raw = document.getElementById('timing-input')?.value?.trim();
    if (!raw) return toast('Bitte Tabelle einfügen', 'error');

    const lines = raw.split('\n').filter(l => l.trim());
    const table = lines.map((line, i) => {
      const parts = line.split('|').map(s => s.trim());
      return {
        slide_id: i + 1,
        file_name: parts[2] || `slide_${i + 1}.jpg`,
        start_time: parts[0] || '00:00:00',
        end_time: parts[1] || '00:00:05'
      };
    });

    try {
      await api.saveSlidesTiming(state.activeChannelPrefix, state.activeProjectId, table);
      document.getElementById('timing-result').innerHTML = renderTimingTable(table);
      toast(`Steuerdatei mit ${table.length} Einträgen erstellt`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  document.getElementById('btn-goto-kanal-slides')?.addEventListener('click', () => {
    state.activeNav = 'kanal';
  });

  // Wire sort for slides criteria table
  if (slidesKriterien.length > 0) {
    wireSlidesSortableTable('slides-krit-table');
  }

  // Slides copy
  document.getElementById('btn-slides-prompt-copy')?.addEventListener('click', () => {
    const checked = document.querySelectorAll('#slides-krit-table tbody input:checked');
    const values = Array.from(checked).map(cb => cb.closest('tr')?.querySelector('td:nth-child(3)')?.textContent || '');
    navigator.clipboard.writeText(values.join('\n'));
    toast('Ausgewählte Kriterien kopiert!', 'success');
  });
}

/* ─── MESM-UI-404a: Slides-Kriterien Sortable Table ─────────────── */
function renderSlidesKriterienTable(kriterien) {
  return `
    <table class="data-table" id="slides-krit-table">
      <thead>
        <tr>
          <th style="width:40px;"><input type="checkbox" class="checkbox-styled"></th>
          <th class="sortable" data-sort="kategorie">Kategorie<span class="sort-indicator"> ⇅</span></th>
          <th class="sortable" data-sort="keyword">Schlagwort<span class="sort-indicator"> ⇅</span></th>
          <th class="sortable" data-sort="promptteil">Promptteil<span class="sort-indicator"> ⇅</span></th>
        </tr>
      </thead>
      <tbody>
        ${kriterien.map(k => `
          <tr data-kategorie="${esc(k.category || '')}" data-keyword="${esc(k.keyword)}" data-promptteil="${esc((k.promptteil || k.prompt_snippet || ''))}">
            <td><input type="checkbox" class="checkbox-styled" value="${esc(k.id)}"></td>
            <td><span class="badge badge-ki">${esc(k.category || '-')}</span></td>
            <td><strong>${esc(k.keyword)}</strong></td>
            <td style="font-size:var(--text-xs);color:var(--color-text-muted);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(((k.promptteil || k.prompt_snippet || '')).slice(0, 120))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ─── Sortable Table Utilities ─────────────────────────────────── */
let slidesSortState = { field: null, dir: 'asc' };

function wireSlidesSortableTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.querySelectorAll('th.sortable').forEach(th => {
    th.style.cursor = 'pointer';
    th.style.userSelect = 'none';
    th.onclick = () => {
      const field = th.dataset.sort;
      if (slidesSortState.field === field) {
        slidesSortState.dir = slidesSortState.dir === 'asc' ? 'desc' : 'asc';
      } else {
        slidesSortState.field = field;
        slidesSortState.dir = 'asc';
      }
      sortSlidesTable(tableId, slidesSortState.field, slidesSortState.dir);
      updateSlidesSortIndicators(table, slidesSortState.field, slidesSortState.dir);
    };
  });
}

function sortSlidesTable(tableId, field, dir) {
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

function updateSlidesSortIndicators(table, activeField, dir) {
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

function renderTimingTable(timing) {
  return `
    <table class="data-table">
      <thead><tr><th>#</th><th>Datei</th><th>Start</th><th>Ende</th></tr></thead>
      <tbody>
        ${timing.map(t => `
          <tr>
            <td>${t.slide_id}</td>
            <td>${esc(t.file_name)}</td>
            <td>${esc(t.start_time)}</td>
            <td>${esc(t.end_time)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}
