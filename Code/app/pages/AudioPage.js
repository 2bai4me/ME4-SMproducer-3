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

    // ─── Fortschritts-Overlay ────────────────────────────
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:2rem;max-width:520px;width:90%;box-shadow:0 25px 80px rgba(0,0,0,0.4);">
        <h3 style="margin:0 0 0.25rem;font-size:1.1rem;">🎙 Audio-Verarbeitung</h3>
        <p style="margin:0 0 1.5rem;font-size:0.8rem;color:#6b7280;">${path.split('/').pop() || path.split('\\').pop()}</p>
        <div id="progress-steps" style="margin-bottom:1rem;">
          <div class="progress-step active" data-step="1" style="display:flex;align-items:center;gap:10px;padding:6px 0;color:#0f446b;font-weight:600;">
            <span style="width:24px;height:24px;border-radius:50%;background:#0f446b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.7rem;">1</span>
            Audio analysieren...
          </div>
          <div class="progress-step" data-step="2" style="display:flex;align-items:center;gap:10px;padding:6px 0;color:#9ca3af;">
            <span style="width:24px;height:24px;border-radius:50%;background:#e5e7eb;color:#9ca3af;display:flex;align-items:center;justify-content:center;font-size:0.7rem;">2</span>
            Transkription (KI-Spracherkennung)...
          </div>
          <div class="progress-step" data-step="3" style="display:flex;align-items:center;gap:10px;padding:6px 0;color:#9ca3af;">
            <span style="width:24px;height:24px;border-radius:50%;background:#e5e7eb;color:#9ca3af;display:flex;align-items:center;justify-content:center;font-size:0.7rem;">3</span>
            Sprecher werden getrennt...
          </div>
          <div class="progress-step" data-step="4" style="display:flex;align-items:center;gap:10px;padding:6px 0;color:#9ca3af;">
            <span style="width:24px;height:24px;border-radius:50%;background:#e5e7eb;color:#9ca3af;display:flex;align-items:center;justify-content:center;font-size:0.7rem;">4</span>
            Ergebnisse werden gespeichert...
          </div>
        </div>
        <div style="background:#f3f4f6;border-radius:8px;height:6px;margin-bottom:0.5rem;">
          <div id="progress-bar-fill" style="height:100%;background:linear-gradient(90deg,#0f446b,#2563eb);border-radius:8px;width:5%;transition:width 0.5s;"></div>
        </div>
        <div id="progress-info" style="font-size:0.75rem;color:#6b7280;text-align:right;">0 MB / --</div>
        <button id="btn-cancel-process" style="margin-top:1rem;width:100%;padding:10px;background:#dc2626;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem;">❌ Abbrechen</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Progress-Animation
    const bar = overlay.querySelector('#progress-bar-fill');
    const info = overlay.querySelector('#progress-info');
    let aborted = false;
    const abortController = new AbortController();

    // Abbrechen-Button
    document.getElementById('btn-cancel-process').onclick = () => {
      aborted = true;
      abortController.abort();
      info.textContent = '⚠ Abgebrochen';
      info.style.color = '#f59e0b';
      bar.style.background = '#f59e0b';
      bar.style.width = '100%';
      toast('Verarbeitung abgebrochen', 'warning');
      btn.disabled = false;
      btn.innerHTML = '🔄 Hochladen & Verarbeiten';
      setTimeout(() => overlay.remove(), 2000);
    };

    function updateProgress(step, pct, msg) {
      bar.style.width = (step * 25 - 20 + pct * 5) + '%';
      info.textContent = msg || `${Math.round(elapsed)}s`;
    }

    // setStep für Step-Indikatoren
    const steps = overlay.querySelectorAll('.progress-step');
    function setStep(n, title, detail, color = '#0f446b', done = false) {
      const step = steps[n - 1];
      if (!step) return;
      step.style.color = color;
      if (done) {
        step.querySelector('span').style.background = '#059669';
        step.querySelector('span').textContent = '✓';
      }
      step.childNodes.forEach(c => { if (c.nodeType === 3) c.textContent = ' ' + title; });
    }

    const progressTimer = setInterval(() => {
      elapsed += 5;
      const mbEst = (elapsed * 0.3).toFixed(1);
      if (currentStep === 1) {
        updateProgress(1, Math.min(elapsed/10, 1), `Analysiere Audio... ${elapsed}s`);
        if (elapsed >= 5 && currentStep === 1) { currentStep = 2; activateStep(2); }
      } else if (currentStep === 2) {
        updateProgress(2, Math.min((elapsed-5)/15, 1), `Transkription läuft... ${mbEst} MB | ${elapsed}s`);
        if (elapsed >= 20 && currentStep === 2) { currentStep = 3; activateStep(3); }
      } else if (currentStep === 3) {
        updateProgress(3, Math.min((elapsed-20)/10, 1), `Sprechertrennung... ${mbEst} MB | ${elapsed}s`);
        if (elapsed >= 30 && currentStep === 3) { currentStep = 4; activateStep(4); }
      } else {
        updateProgress(4, 1, `Speichere Ergebnisse... ${elapsed}s`);
      }
    }, 5000);

    const startTime = Date.now();
    try {
      // Prüfen ob abgebrochen
      if (aborted) { overlay.remove(); return; }
      // Schritt 1: Datei wird geprüft...
      setStep(1, 'Audio wird analysiert...', 'Datei wird geprüft und kopiert...');

      const result = await api.uploadAudio(state.activeChannelPrefix, state.activeProjectId, {
        datei_pfad: path,
        sprecher_anzahl: count
      });

      if (aborted) { overlay.remove(); return; }

      const fa = result.file_analysis || {};

      // Schritt 1 ✅ Prüfung abgeschlossen
      if (fa.original_name) {
        setStep(1, '✅ Prüfung abgeschlossen',
          `${fa.original_name} → ${fa.target_name} · ${fa.size_mb} MB · ${fa.duration_min > 0 ? fa.duration_min + ' min' : '?'} · ${fa.format}`,
          '#059669', true);
        info.textContent = `📁 ${fa.target_dir}`;
      } else {
        setStep(1, '✅ Prüfung abgeschlossen', dateiName, '#059669', true);
      }
      bar.style.width = '25%';

      // Schritt 2: Transkript-Service prüfen
      setStep(2, 'Transkript-Service wird geprüft...', 'Verbinde mit STT-Service (Port 5555)...');
      bar.style.width = '30%';
      await new Promise(r => setTimeout(r, 600));

      if (result.transkript?.length > 0) {
        setStep(2, '✅ Transkription abgeschlossen', `${result.transkript.length} Segmente erkannt`, '#059669', true);

        // Kompakte Transkript-Tabelle
        const maxRows = Math.min(result.transkript.length, 5);
        transcriptPreview.style.display = 'block';
        transcriptPreview.innerHTML = `
          <div style="font-size:0.7rem;font-weight:600;color:#374151;margin-bottom:4px;">📋 Transkript (${result.transkript.length} Zeilen)</div>
          <table style="width:100%;border-collapse:collapse;font-size:0.65rem;">
            <thead><tr style="background:#f9fafb;">
              <th style="padding:2px 4px;text-align:left;border-bottom:1px solid #e5e7eb;">Start</th>
              <th style="padding:2px 4px;text-align:left;border-bottom:1px solid #e5e7eb;">Ende</th>
              <th style="padding:2px 4px;text-align:left;border-bottom:1px solid #e5e7eb;">Spr.</th>
              <th style="padding:2px 4px;text-align:left;border-bottom:1px solid #e5e7eb;">Text</th>
            </tr></thead>
            <tbody>
              ${result.transkript.slice(0, maxRows).map(t => `
                <tr>
                  <td style="padding:2px 4px;border-bottom:1px solid #f3f4f6;white-space:nowrap;">${(t.start_time||t.start||'').substring(0,8)}</td>
                  <td style="padding:2px 4px;border-bottom:1px solid #f3f4f6;white-space:nowrap;">${(t.end_time||t.end||'').substring(0,8)}</td>
                  <td style="padding:2px 4px;border-bottom:1px solid #f3f4f6;">${t.speaker||''}</td>
                  <td style="padding:2px 4px;border-bottom:1px solid #f3f4f6;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${(t.text||'').substring(0,70)}</td>
                </tr>
              `).join('')}
              ${result.transkript.length > maxRows ? `<tr><td colspan="4" style="padding:4px;text-align:center;color:#9ca3af;font-size:0.65rem;">... ${result.transkript.length - maxRows} weitere Zeilen</td></tr>` : ''}
            </tbody>
          </table>
        `;
        bar.style.width = '55%';
      } else {
        setStep(2, '⚠ Keine Transkript-Segmente', 'Service lieferte leere Antwort', '#f59e0b', true);
        bar.style.width = '50%';
      }

      // Schritt 3: Sprechertrennung
      setStep(3, 'Sprecher-Service wird geprüft...', 'Verbinde mit Speech-Splitter (Port 5580)...');
      bar.style.width = '60%';
      await new Promise(r => setTimeout(r, 500));

      if (result.spuren?.length > 0) {
        setStep(3, '✅ Sprecher getrennt', `${result.spuren.length} Spuren extrahiert`, '#059669', true);
        bar.style.width = '80%';
      } else {
        setStep(3, '⚠ Keine Sprecher-Spuren', 'Service lieferte leeres Ergebnis', '#f59e0b', true);
        bar.style.width = '75%';
      }

      // Schritt 4: Ergebnisse mit Sprecher-Details + Datei-Pfaden
      const zielDir = fa?.target_dir || 'Projektordner';
      
      // Datei-Infos für jede Spur ermitteln (Größe, Pfad)
      const spurenDetails = result.spuren?.length > 0
        ? result.spuren.map((s, i) => {
            const label = s.speaker || String.fromCharCode(65 + i);
            const filePath = s.file_path || '';
            const fileName = filePath.split(/[/\\]/).pop() || '(Pfad unbekannt)';
            return `
            <div style="background:#f9fafb;border-radius:6px;padding:6px 8px;margin-top:4px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-weight:600;font-size:0.75rem;">🔊 Sprecher ${label}</span>
                <button onclick="event.stopPropagation();" style="padding:3px 10px;background:#0f446b;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.65rem;">▶ Play</button>
              </div>
              <div style="font-size:0.65rem;color:#6b7280;margin-top:3px;">
                <strong>📁 Datei:</strong> <code style="font-size:0.62rem;word-break:break-all;">${fileName}</code>
              </div>
              <div style="font-size:0.65rem;color:#9ca3af;">
                <strong>📂 Pfad:</strong> <code style="font-size:0.62rem;word-break:break-all;">${filePath}</code>
              </div>
            </div>
          `;
          }).join('')
        : '<div style="font-size:0.7rem;color:#9ca3af;">Keine Spuren verfügbar</div>';

      setStep(4, '✅ Ergebnisse gespeichert', '', '#059669', true);
      document.querySelector('#progress-steps [data-step="4"] .step-detail').innerHTML = `
        transkript.json<br>
        <code style="font-size:0.62rem;word-break:break-all;">${zielDir}\\transkript.json</code>
        ${spurenDetails}
      `;
      bar.style.width = '100%';
      info.textContent = `✅ Fertig in ${Math.round((Date.now() - startTime) / 1000)}s`;
      info.style.color = '#059669';

      document.getElementById('audio-status').innerHTML = `
        <div class="badge badge-success">Verarbeitung abgeschlossen</div>
        <p class="text-sm mt-2">Sprecher: ${count} | Transkript: ${result.transkript?.length || 0} Segmente | Spuren: ${result.spuren?.length || 0}</p>
      `;
      toast('Audio erfolgreich verarbeitet!', 'success');

      setTimeout(() => { overlay.style.opacity = '0'; overlay.style.transition = 'opacity 0.5s'; setTimeout(() => overlay.remove(), 500); }, 5000);
      state.activeNav = '3';

    } catch (err) {
      setStep(2, '❌ Fehler', err.message, '#dc2626', true);
      bar.style.width = '100%';
      bar.style.background = '#dc2626';
      info.textContent = 'Fehlgeschlagen';
      info.style.color = '#dc2626';
      setTimeout(() => overlay.remove(), 4000);
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
