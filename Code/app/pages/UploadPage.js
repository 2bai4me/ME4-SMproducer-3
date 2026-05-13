/**
 * UploadPage – Schritt 6: Vorschau, Thumbnail, Upload-Daten, Publizieren, Marketing
 *
 * MESM-UI-406a: Video-Player mit Play/Pause-Overlay (Mockup: aspect-video bg-gray-900, crimson-Button)
 * MESM-UI-406b: Technische Daten-Liste (6 Key-Value-Paare: Format/Dateigröße/Länge/Auflösung/Bildrate/Audio)
 * MESM-UI-406c: Thumbnail-Vorschau (Mockup: aspect-video bg-deep-blue, Platzhalter-Bild)
 * MESM-UI-406d: Copy-Buttons an Upload-Daten (Titel + Beschreibung)
 * MESM-UI-406e: Publizieren mit full-width Button + Erfolgs-Animation
 * MESM-UI-406f: Kontakt-Liste mit Status-Toggle (Informieren ↔ Informiert)
 */

import { state, toast, esc, fmtDate } from '../shared/state.js';
import { api } from '../shared/api.js';
import { createAccordion } from '../components/organisms/ServiceAccordion.js';

export default async function UploadPage(container) {
  if (!state.activeChannelPrefix || !state.activeProjectId) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📤</div><div class="empty-state-title">Kein Projekt aktiv</div><div class="empty-state-text">Bitte starten Sie zuerst ein Projekt in Schritt 1.</div></div>';
    return;
  }

  let uploadData = {};
  try { uploadData = await api.getUpload(state.activeChannelPrefix, state.activeProjectId) || {}; } catch (_) {}

  container.innerHTML = `
    <div class="workspace-header">
      <h1 class="workspace-title">Schritt 6: Upload</h1>
      <p class="workspace-subtitle">Video prüfen, Thumbnail wählen, publizieren, Marketing</p>
    </div>
    <div class="service-accordion" id="upload-accordion"></div>
  `;

  const acc = document.getElementById('upload-accordion');

  /* ─── MESM-UI-406a/b: Video-Vorschau + Technische Daten ─────── */
  createAccordion(acc, {
    number: 1,
    title: 'Medien',
    status: uploadData.video_pfad ? 'done' : 'none',
    body: `
      <!-- Video-Player -->
      <div style="position:relative;aspect-ratio:16/9;background:#111827;border-radius:var(--radius-lg);overflow:hidden;margin-bottom:var(--space-4);display:flex;align-items:center;justify-content:center;" id="video-preview">
        ${uploadData.video_pfad
          ? `<video src="${esc(uploadData.video_pfad)}" controls style="width:100%;height:100%;object-fit:contain;"></video>`
          : `<div style="text-align:center;color:var(--color-text-dim);">
              <button style="width:64px;height:64px;border-radius:50%;background:rgba(198,0,36,0.9);border:none;color:white;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform var(--transition-fast);" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" onclick="this.style.display='none'">▶</button>
              <p style="margin-top:var(--space-3);">Video wird nach der Erstellung angezeigt</p>
            </div>`
        }
      </div>

      <!-- MESM-UI-406b: Technische Daten -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);margin-bottom:var(--space-4);">
        ${renderTechData([
          { label: 'Format', value: 'MP4 / H.264' },
          { label: 'Dateigröße', value: '245 MB' },
          { label: 'Länge', value: '04:32' },
          { label: 'Auflösung', value: '1920×1080' },
          { label: 'Bildrate', value: '30 fps' },
          { label: 'Audio', value: 'AAC 192kbps' },
        ])}
      </div>

      <!-- MESM-UI-406c: Thumbnail -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
        <div>
          <label class="form-label">Thumbnail-Vorschau</label>
          <div style="aspect-ratio:16/9;background:var(--color-accent);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:var(--text-sm);">
            ${uploadData.thumbnail_pfad
              ? `<img src="${esc(uploadData.thumbnail_pfad)}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-lg);">`
              : 'Thumbnail'}
          </div>
        </div>
        <div>
          <label class="form-label">Technische Daten</label>
          <div style="display:flex;flex-direction:column;gap:var(--space-2);">
            ${renderTechDataSmall([
              { label: 'Breite', value: '1920px' },
              { label: 'Höhe', value: '1080px' },
              { label: 'Format', value: 'JPG' },
              { label: 'Größe', value: '320 KB' },
            ])}
          </div>
        </div>
      </div>
    `
  });

  /* ─── MESM-UI-406d: Upload-Daten mit Copy-Buttons ──────────── */
  createAccordion(acc, {
    number: 2,
    title: 'Upload-Daten',
    status: uploadData.titel ? 'done' : 'none',
    body: `
      <div class="form-group">
        <label class="form-label">Video-Titel</label>
        <div class="copy-input-wrapper">
          <input class="form-input" id="upload-titel" value="${esc(uploadData.titel || '')}" placeholder="Titel des Videos">
          <button class="copy-btn" data-copy-target="upload-titel" title="Kopieren">📋</button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Beschreibung</label>
        <div class="copy-input-wrapper">
          <textarea class="form-textarea" id="upload-beschreibung" rows="3" placeholder="Beschreibung des Videos...">${esc(uploadData.beschreibung || '')}</textarea>
          <button class="copy-btn" data-copy-target="upload-beschreibung" title="Kopieren">📋</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">
        <div class="form-group">
          <label class="form-label">Upload-Zeitpunkt</label>
          <input class="form-input" type="datetime-local" id="upload-zeit" value="${uploadData.upload_zeit?.replace(' ','T')?.slice(0,16) || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Veröffentlichungs-Zeitpunkt</label>
          <input class="form-input" type="datetime-local" id="upload-pub-date" value="${uploadData.veroeffentlichung_zeit?.replace(' ','T')?.slice(0,16) || ''}">
          <span class="form-hint">In der Regel 2 Tage nach Upload</span>
        </div>
      </div>
      <div class="info-card mt-3">
        <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2);">
          <span>💾</span>
          <strong>Datei-Info</strong>
        </div>
        <div style="font-size:var(--text-xs);">Pfad: <code>${esc(uploadData.video_pfad || 'Noch keine Datei')}</code></div>
        <div style="font-size:var(--text-xs);">Format: MP4 | Größe: ${uploadData.dateigroesse || 'N/A'}</div>
      </div>
      <button class="btn btn-primary mt-4" id="btn-save-upload">Upload-Daten speichern</button>
      <div id="upload-save-status" class="mt-2"></div>
    `
  });

  /* ─── MESM-UI-406e: Publizieren ──────────────────────────── */
  const published = uploadData.status === 'published';
  createAccordion(acc, {
    number: 3,
    title: 'Publizieren',
    status: published ? 'done' : 'none',
    body: `
      <p class="text-muted text-sm mb-4">${published ? 'Video wurde veröffentlicht.' : 'Starten Sie den Upload zur Zielplattform.'}</p>
      <button class="btn btn-primary btn-full" id="btn-publish" ${published ? 'disabled' : ''}>
        ${published ? '✅ Bereits publiziert' : '🚀 Jetzt publizieren'}
      </button>
      <div id="publish-status" class="mt-4">
        ${uploadData.upload_zeit ? `<p class="text-sm text-muted">Hochgeladen am: ${fmtDate(uploadData.upload_zeit)}</p>` : ''}
      </div>
    `
  });

  /* ─── MESM-UI-406f: Videomarketing ──────────────────────── */
  createAccordion(acc, {
    number: 4,
    title: 'Video-Marketing',
    status: 'none',
    body: `
      <p class="text-muted text-sm mb-4">Interessenten über das neue Video benachrichtigen.</p>
      <div id="marketing-list">
        <p class="text-muted text-sm">Kontakte werden geladen...</p>
      </div>
      <button class="btn btn-accent mt-3" id="btn-load-kontakte">📋 Kontakte laden</button>
      <button class="btn btn-primary btn-full mt-3" id="btn-send-all" style="display:none;">📨 Alle informieren</button>
    `
  });

  /* ─── Wire: Copy-Buttons ─────────────────────────────────── */
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

  /* ─── Wire: Upload-Daten speichern ──────────────────────── */
  document.getElementById('btn-save-upload')?.addEventListener('click', async () => {
    const titel = document.getElementById('upload-titel')?.value?.trim();
    const beschreibung = document.getElementById('upload-beschreibung')?.value?.trim();
    const pubDate = document.getElementById('upload-pub-date')?.value;
    const uploadZeit = document.getElementById('upload-zeit')?.value;

    if (!titel) return toast('Bitte geben Sie einen Titel ein', 'error');

    try {
      await api.saveUpload(state.activeChannelPrefix, state.activeProjectId, {
        titel,
        beschreibung,
        upload_zeit: uploadZeit || null,
        veroeffentlichung_zeit: pubDate || null
      });
      document.getElementById('upload-save-status').innerHTML = '<span class="badge badge-success">✅ Gespeichert</span>';
      toast('Upload-Daten gespeichert');
    } catch (err) { toast(err.message, 'error'); }
  });

  /* ─── Wire: Publizieren ──────────────────────────────────── */
  document.getElementById('btn-publish')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-publish');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Publiziere...';

    try {
      const result = await api.publish(state.activeChannelPrefix, state.activeProjectId);
      const statusEl = document.getElementById('publish-status');
      if (statusEl) {
        statusEl.innerHTML = `
          <div class="card success-animate" style="background:rgba(37,194,121,0.07);border:1px solid rgba(37,194,121,0.3);text-align:center;padding:var(--space-6);">
            <div style="font-size:2rem;margin-bottom:var(--space-2);color:var(--color-success);">✅</div>
            <div style="font-weight:600;color:var(--color-text);">${esc(result.message)}</div>
            <button class="btn btn-secondary btn-sm mt-3" id="btn-republish">Neu publizieren</button>
          </div>
        `;
        document.getElementById('btn-republish').onclick = () => {
          btn.disabled = false;
          btn.innerHTML = '🚀 Jetzt publizieren';
          statusEl.innerHTML = '';
        };
      }
      toast('Video erfolgreich publiziert! 🎉', 'success');
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = '🚀 Jetzt publizieren';
    }
  });

  /* ─── Wire: Marketing-Kontakte ───────────────────────────── */
  document.getElementById('btn-load-kontakte')?.addEventListener('click', async () => {
    try {
      const kontakte = await api.getKontakte(state.activeChannelPrefix);
      const el = document.getElementById('marketing-list');
      if (!kontakte || kontakte.length === 0) {
        el.innerHTML = '<p class="text-muted text-sm">Keine Marketing-Kontakte im Kanal definiert.</p>';
        return;
      }

      el.innerHTML = kontakte.map((k, i) => `
        <div class="row-stagger-in" style="animation-delay:${i*0.05}s;display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);border:1px solid var(--color-border);border-radius:var(--radius-lg);margin-bottom:var(--space-2);${k.status==='informiert'?'background:rgba(37,194,121,0.07);border-color:rgba(37,194,121,0.3);':''}">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--color-accent);display:flex;align-items:center;justify-content:center;color:white;font-size:var(--text-xs);font-weight:600;">${esc(k.name.substring(0,2).toUpperCase())}</div>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:var(--text-sm);">${esc(k.name)}</div>
            <div style="font-size:var(--text-xs);color:var(--color-text-muted);">${esc(k.channel)}</div>
          </div>
          <button class="toggle-status-btn" data-kontakt-id="${esc(k.id)}" data-status="${esc(k.status || 'pending')}"
            style="padding:var(--space-1) var(--space-3);border-radius:100px;font-size:var(--text-xs);font-weight:500;border:1px solid ${k.status==='informiert'?'rgba(37,194,121,0.4)':'var(--color-border)'};background:${k.status==='informiert'?'rgba(37,194,121,0.1)':'var(--color-bg-card)'};color:${k.status==='informiert'?'var(--color-success)':'var(--color-text-muted)'};cursor:pointer;transition:all var(--transition-fast);">
            ${k.status === 'informiert' ? '✓ Informiert' : '✉ Informieren'}
          </button>
        </div>
      `).join('');

      document.getElementById('btn-send-all').style.display = 'block';

      // Wire toggle buttons
      el.querySelectorAll('.toggle-status-btn').forEach(btn => {
        btn.onclick = async function() {
          const currentStatus = this.dataset.status;
          const newStatus = currentStatus === 'informiert' ? 'pending' : 'informiert';
          const kontaktId = this.dataset.kontaktId;
          try {
            await api.saveKontakt(state.activeChannelPrefix, { id: kontaktId, status: newStatus });
            this.dataset.status = newStatus;
            this.textContent = newStatus === 'informiert' ? '✓ Informiert' : '✉ Informieren';
            this.style.background = newStatus === 'informiert' ? 'rgba(37,194,121,0.1)' : 'var(--color-bg-card)';
            this.style.color = newStatus === 'informiert' ? 'var(--color-success)' : 'var(--color-text-muted)';
            this.style.borderColor = newStatus === 'informiert' ? 'rgba(37,194,121,0.4)' : 'var(--color-border)';
            this.closest('.row-stagger-in').style.background = newStatus === 'informiert' ? 'rgba(37,194,121,0.07)' : '';
            toast(newStatus === 'informiert' ? 'Kontakt informiert!' : 'Status zurückgesetzt', 'success');
          } catch (err) { toast(err.message, 'error'); }
        };
      });
    } catch (err) {
      document.getElementById('marketing-list').innerHTML = `<p class="text-muted">Fehler: ${esc(err.message)}</p>`;
    }
  });

  document.getElementById('btn-send-all')?.addEventListener('click', () => {
    const btns = document.querySelectorAll('.toggle-status-btn');
    let count = 0;
    btns.forEach(btn => {
      if (btn.dataset.status !== 'informiert') {
        btn.click();
        count++;
      }
    });
    toast(`${count} Kontakte informiert!`, 'success');
  });
}

/* ─── MESM-UI-406b: Tech Data Helpers ─────────────────────────── */
function renderTechData(items) {
  return items.map(d => `
    <div style="display:flex;justify-content:space-between;padding:var(--space-2) var(--space-3);background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:var(--radius-md);">
      <span style="font-size:var(--text-xs);color:var(--color-text-dim);">${d.label}</span>
      <span style="font-size:var(--text-xs);font-weight:600;color:var(--color-text);font-family:var(--font-mono);">${d.value}</span>
    </div>
  `).join('');
}

function renderTechDataSmall(items) {
  return items.map(d => `
    <div style="display:flex;justify-content:space-between;padding:var(--space-2) var(--space-3);background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);">
      <span style="font-size:0.625rem;color:var(--color-text-dim);">${d.label}</span>
      <span style="font-size:0.625rem;font-weight:600;color:var(--color-text);">${d.value}</span>
    </div>
  `).join('');
}
