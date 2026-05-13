/**
 * ResearchPage – Schritt 2: NotebookLM Bridge, Kriterienauswahl, Prompt-Generierung
 */

import { state, toast, esc, uid } from '../shared/state.js';
import { api } from '../shared/api.js';
import { createAccordion } from '../components/organisms/ServiceAccordion.js';

export default async function ResearchPage(container) {
  if (!state.activeChannelPrefix) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-title">Kein Kanal ausgewählt</div><div class="empty-state-text">Bitte wählen Sie einen Kanal aus.</div></div>';
    return;
  }
  if (!state.activeProjectId) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-title">Kein Projekt aktiv</div><div class="empty-state-text">Bitte starten Sie zuerst ein Projekt in Schritt 1: Thema.</div></div>';
    return;
  }

  container.innerHTML = `
    <div class="workspace-header">
      <h1 class="workspace-title">Schritt 2: Research</h1>
      <p class="workspace-subtitle">NotebookLM-Daten vorbereiten, Kriterien auswählen, Prompt generieren</p>
    </div>
    <div class="service-accordion" id="research-accordion"></div>
  `;

  const acc = document.getElementById('research-accordion');

  // Load project meta and channel data
  let meta = { title: '', description: '' };
  let kriterien = [];
  let selectedIds = [];
  let notizen = [];

  try {
    const data = await api.getResearch(state.activeChannelPrefix, state.activeProjectId);
    meta = data.meta || meta;
    selectedIds = data.selectedKriterien || [];
    notizen = data.notizen || [];
    kriterien = await api.getKriterien(state.activeChannelPrefix, 'research');
  } catch (err) {
    /* ok */
  }

  // Microservice 1: NotebookLM Daten
  createAccordion(acc, {
    number: 1,
    id: 'acc-research-1',
    title: 'NotebookLM Daten',
    status: meta.title ? 'done' : 'none',
    body: `
      <p class="text-muted text-sm mb-4">Kopieren Sie Titel und Beschreibung für NotebookLM.</p>
      <div class="form-group">
        <label class="form-label">Titel</label>
        <div class="flex gap-2">
          <input class="form-input" id="nb-title" value="${esc(meta.title || '')}" readonly>
          <button class="btn btn-sm btn-copy" id="btn-copy-title">📋</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Beschreibung</label>
        <div class="flex gap-2">
          <textarea class="form-textarea" id="nb-desc" readonly style="min-height:60px;">${esc(meta.description || '')}</textarea>
          <button class="btn btn-sm btn-copy" id="btn-copy-desc">📋</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notebook Inhalt (Notizen)</label>
        <textarea class="form-textarea" id="notebook-content" placeholder="Gedanken und Notizen zum Thema..."></textarea>
      </div>
      <button class="btn btn-accent btn-sm mt-3" id="btn-open-notebooklm">📓 In NotebookLM öffnen</button>
      <button class="btn btn-primary btn-sm ml-2" id="btn-save-notizen">Notizen speichern</button>
    `
  });

  // Microservice 2: Kriterien auswählen (MESM-UI-402a: Sortable Table)
  const kBody = kriterien.length > 0
    ? renderKriterienTable(kriterien, selectedIds)
    : '<p class="text-muted text-sm">Keine Research-Kriterien im Kanal definiert. <a href="#" id="goto-kanal">Zum Kanal-Setup</a></p>';

  createAccordion(acc, {
    number: 2,
    id: 'acc-research-2',
    title: 'Kriterien auswählen',
    status: selectedIds.length > 0 ? 'done' : 'none',
    body: `
      <!-- MESM-UI-007: Search Input mit Icon -->
      <div class="form-group">
        <div class="search-field">
          <span class="search-icon">🔍</span>
          <input class="form-input" id="krit-search" placeholder="Kriterien durchsuchen...">
        </div>
      </div>
      <div id="kriterien-table-container">${kBody}</div>
      <div class="form-group mt-4">
        <label class="form-label">Zusätzlicher Text (fließt in den Prompt ein)</label>
        <textarea class="form-textarea" id="extra-text" placeholder="Weitere Anweisungen..."></textarea>
      </div>
      <button class="btn btn-primary" id="btn-select-kriterien">Auswahl speichern & Prompt generieren</button>
    `
  });

  // Microservice 3: Prompt generieren
  createAccordion(acc, {
    number: 3,
    id: 'acc-research-3',
    title: 'Prompt generieren',
    status: 'none',
    body: `
      <p class="text-muted text-sm mb-4">Der generierte Prompt kann in NotebookLM verwendet werden.</p>
      <div id="prompt-loading" style="display:none;text-align:center;padding:1rem;">
        <div style="display:inline-block;width:24px;height:24px;border:3px solid #e5e7eb;border-top-color:#0f446b;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
        <p style="font-size:0.8rem;color:#6b7280;margin-top:0.5rem;">Prompt wird generiert...</p>
      </div>
      <div id="generated-prompt" class="result-area">
        <em class="text-muted">Noch kein Prompt generiert.</em>
      </div>
      <div id="prompt-actions" style="margin-top:1rem;display:none;gap:0.5rem;">
        <button class="btn btn-primary" id="btn-copy-prompt">📋 Kopieren</button>
        <button class="btn btn-secondary" id="btn-teilen-prompt">📖 In Kapitel teilen</button>
      </div>
      <div id="teilen-result" class="result-area mt-3" style="display:none;"></div>
    `
  });

  // Microservice 4: NotebookLM (externer Service, später)
  createAccordion(acc, {
    number: 4,
    id: 'acc-research-4',
    title: 'In NotebookLM öffnen',
    status: 'none',
    body: `
      <p class="text-muted text-sm mb-4">Kopiert Titel + Beschreibung und öffnet NotebookLM.</p>
      <button class="btn btn-accent" id="btn-nblm-workflow" style="width:100%;padding:12px;font-size:1rem;">
        📓 In NotebookLM öffnen
      </button>
      <div id="nblm-status" class="mt-3" style="font-size:0.8rem;color:#6b7280;"></div>
    `
  });

  // ─── Wire events ─────────────────────────────────────────────────
  document.getElementById('btn-copy-title')?.addEventListener('click', () => {
    navigator.clipboard.writeText(meta.title || '');
    toast('Titel kopiert!');
  });

  document.getElementById('btn-copy-desc')?.addEventListener('click', () => {
    navigator.clipboard.writeText(meta.description || '');
    toast('Beschreibung kopiert!');
  });

  document.getElementById('btn-save-notizen')?.addEventListener('click', async () => {
    const content = document.getElementById('notebook-content')?.value || '';
    try {
      await api.saveNotiz(state.activeChannelPrefix, state.activeProjectId, {
        notebook_title: meta.title || '',
        notebook_description: meta.description || '',
        content
      });
      toast('Notizen gespeichert');
    } catch (err) { toast(err.message, 'error'); }
  });

  // NotebookLM: Workflow über lokalen Service (Port 8765)
  document.getElementById('btn-nblm-workflow')?.addEventListener('click', async () => {
    const titel = document.getElementById('nb-title')?.value?.trim() || state.activeProjectId || 'Research';
    const desc = document.getElementById('nb-desc')?.value?.trim() || '';
    const btn = document.getElementById('btn-nblm-workflow');
    const statusEl = document.getElementById('nblm-status');
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = () => overlay.remove();
    overlay.innerHTML = '<div onclick="event.stopPropagation()" style="background:#fff;border-radius:16px;padding:2rem;max-width:500px;width:90%;box-shadow:0 25px 80px rgba(0,0,0,0.4);"><h3>🚀 NotebookLM Workflow</h3><div id="nblm-popup-log" style="font-size:0.8rem;max-height:300px;overflow-y:auto;margin:1rem 0;"></div><button style="padding:8px 24px;background:#0f446b;color:#fff;border:none;border-radius:8px;cursor:pointer;">OK</button></div>';
    document.body.appendChild(overlay);
    const log = overlay.querySelector('#nblm-popup-log');
    overlay.querySelector('button').onclick = () => overlay.remove();
    const addLog = (msg, color='#374151') => { log.innerHTML += '<div style="color:'+color+';padding:2px 0;">'+msg+'</div>'; log.scrollTop=log.scrollHeight; };
    
    btn.disabled = true;
    addLog('📓 Schritt 1/3: Notebook erstellen...');
    
    try {
      const resp = await fetch('http://localhost:3001/api/notebooklm/workflow', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ title: titel, description: desc, mode: 'deep' })
      });
      const data = await resp.json();
      
      if (data.ok) {
        addLog('✅ Notebook: ' + data.notebookId, '#059669');
        addLog('📚 Schritt 2/3: Quellen hinzugefügt', '#059669');
        addLog('🔍 Schritt 3/3: Deep Research gestartet', '#0f446b');
        addLog('⏳ Der Service arbeitet im Hintergrund...', '#6b7280');
        statusEl.textContent = '✅ ' + data.notebookId + ' – Research läuft';
      } else {
        addLog('⚠ ' + (data.error || 'Fehler'), '#dc2626');
        if (data.hint) addLog('💡 ' + data.hint, '#f59e0b');
        statusEl.textContent = '⚠ Service nicht erreichbar';
      }
    } catch (err) { addLog('❌ ' + err.message, '#dc2626'); }
    btn.disabled = false;
  });

  document.getElementById('btn-select-kriterien')?.addEventListener('click', async () => {
    const checks = document.querySelectorAll('.krit-checkbox:checked');
    const ids = Array.from(checks).map(c => c.value);
    const extra = document.getElementById('extra-text')?.value || '';
    const loadingEl = document.getElementById('prompt-loading');
    const promptEl = document.getElementById('generated-prompt');
    const actionsEl = document.getElementById('prompt-actions');
    const teilenEl = document.getElementById('teilen-result');

    // Accordion #3 öffnen + Lade-Indikator
    const acc3 = document.getElementById('acc-research-3');
    if (acc3) acc3.classList.add('open');
    if (loadingEl) loadingEl.style.display = 'block';
    if (promptEl) promptEl.innerHTML = '';
    if (actionsEl) actionsEl.style.display = 'none';
    if (teilenEl) teilenEl.style.display = 'none';

    try {
      await api.selectKriterien(state.activeChannelPrefix, state.activeProjectId, ids);
      const result = await api.generatePrompt(state.activeChannelPrefix, state.activeProjectId, { extraText: extra });
      const text = result.resolved || result.prompt;
      if (promptEl) {
        promptEl.innerHTML = '<pre style="white-space:pre-wrap;font-size:0.85rem;line-height:1.5;">' + esc(text) + '</pre>';
      }
      if (actionsEl) actionsEl.style.display = 'flex';
      toast('Prompt generiert');
    } catch (err) { 
      toast(err.message, 'error'); 
      if (promptEl) promptEl.innerHTML = '<em class="text-red">Fehler: ' + esc(err.message) + '</em>';
    }
    if (loadingEl) loadingEl.style.display = 'none';
  });

  document.getElementById('btn-copy-prompt')?.addEventListener('click', () => {
    const text = document.querySelector('#generated-prompt pre')?.textContent || '';
    navigator.clipboard.writeText(text);
    toast('Prompt in Zwischenablage kopiert!');
  });

  // Search filter
  document.getElementById('krit-search')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#kriterien-table-container tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
  });

  // Select-All per Kategorie
  document.querySelectorAll('.cat-check-all').forEach(cb => {
    cb.addEventListener('change', function() {
      const table = this.closest('table');
      table.querySelectorAll('.krit-checkbox').forEach(kcb => { kcb.checked = this.checked; });
    });
  });

  document.getElementById('goto-kanal')?.addEventListener('click', (e) => {
    e.preventDefault();
    state.activeNav = 'kanal';
  });

  // MESM-UI-402a: Sort-Funktionalität – initial verdrahten
  wireSortableTable('kriterien-table');

  // Select-All checkbox
  document.getElementById('select-all-krit')?.addEventListener('change', function() {
    document.querySelectorAll('#kriterien-table tbody .krit-checkbox').forEach(cb => {
      cb.checked = this.checked;
    });
  });
}

/* ─── MESM-UI-003: Sortable Table Utilities ──────────────────── */

let sortState = { field: null, dir: 'asc' };

function wireSortableTable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.querySelectorAll('th.sortable').forEach(th => {
    th.onclick = () => {
      const field = th.dataset.sort;
      if (sortState.field === field) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
      } else {
        sortState.field = field;
        sortState.dir = 'asc';
      }
      sortTable(tableId, sortState.field, sortState.dir);
      updateSortIndicators(table, sortState.field, sortState.dir);
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

/* ─── MESM-UI-402a: Sortable Kriterien-Table ─────────────────── */
function renderKriterienTable(kriterien, selectedIds) {
  // Nach Kategorie gruppieren (wie Kanal-Seite)
  const groups = {};
  for (const k of kriterien) {
    const cat = k.kategorie || 'Ohne Kategorie';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(k);
  }
  const catOrder = Object.keys(groups).sort();

  return catOrder.map(cat => `
    <div style="margin-bottom:1rem;">
      <h4 style="font-size:0.8rem;font-weight:700;color:#0f446b;margin:0 0 0.3rem 0;padding:4px 8px;background:#e8f0f8;border-radius:4px;">📁 ${esc(cat)} (${groups[cat].length})</h4>
      <table class="data-table" style="font-size:0.8rem;">
        <thead><tr>
          <th style="width:30px;"><input type="checkbox" class="checkbox-styled cat-check-all" checked></th>
          <th>Keyword</th>
          <th>Prompt-Snippet</th>
        </tr></thead>
        <tbody>
          ${groups[cat].map(k => `
            <tr class="${selectedIds.length === 0 || selectedIds.includes(k.id) ? '' : 'unselected'}" style="${selectedIds.length === 0 || selectedIds.includes(k.id) ? '' : 'opacity:0.4;'}">
              <td><input type="checkbox" class="checkbox-styled krit-checkbox" value="${esc(k.id)}" checked></td>
              <td><strong>${esc(k.keyword)}</strong></td>
              <td style="color:#6b7280;max-width:350px;">${esc(k.prompt_snippet || k.promptteil || '(leer)')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}
