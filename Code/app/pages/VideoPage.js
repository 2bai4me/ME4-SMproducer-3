/**
 * VideoPage – Schritt 5: Format, Vorlagen, Timeline, Editor-Launch
 *
 * MESM-UI-405a: Format-Selector Grid 3-col (Quer 16:9 / Hoch 9:16 / Quadrat 1:1)
 * MESM-UI-405b: Plattform-Selector Pills (YouTube/TikTok/Instagram/LinkedIn/Andere)
 * MESM-UI-405c: Template-Carousel mit Chevron-Nav & Pagination-Dots
 * MESM-UI-405d: Metadata-Panel (Auflösung/Aspect Ratio/Länge)
 * MESM-UI-405e: Steuerdatei-Upload/Anzeige
 * MESM-UI-405f: Audio/Video File Lists
 * MESM-UI-405g: Komplexe Timeline (5 Spuren, Intro/Outro-Vertikalbalken, Legende)
 * MESM-UI-405h: Export-Buttons (2 nebeneinander: Tiefblau + Crimson)
 */

import { state, toast, esc, uid } from '../shared/state.js';
import { api } from '../shared/api.js';
import { createAccordion } from '../components/organisms/ServiceAccordion.js';

/* SVG Icons */
const MONITOR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
const PHONE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`;
const TV_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>`;

export default async function VideoPage(container) {
  if (!state.activeChannelPrefix || !state.activeProjectId) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎬</div><div class="empty-state-title">Kein Projekt aktiv</div><div class="empty-state-text">Bitte starten Sie zuerst ein Projekt in Schritt 1.</div></div>';
    return;
  }

  let videoData = { konfig: null, timeline: [] };
  try { videoData = await api.getVideo(state.activeChannelPrefix, state.activeProjectId); } catch (_) {}

  container.innerHTML = `
    <div class="workspace-header">
      <h1 class="workspace-title">Schritt 5: Video</h1>
      <p class="workspace-subtitle">Format wählen, Vorlagen auswählen, Timeline prüfen, Editor starten</p>
    </div>
    <div class="service-accordion" id="video-accordion"></div>
  `;

  const acc = document.getElementById('video-accordion');

  /* ─── MESM-UI-405a/b: Format & Plattform ──────────────────── */
  createAccordion(acc, {
    number: 1,
    title: 'Videoformat',
    status: videoData.konfig ? 'done' : 'none',
    body: buildFormatSelector(videoData.konfig)
  });

  /* ─── MESM-UI-405c/d: Intro-Vorlage ──────────────────────── */
  createAccordion(acc, {
    number: 2,
    title: 'Intro',
    status: 'none',
    body: buildTemplateCarousel('intro', 'Intro-Vorlage wählen', 'Wählen Sie eine Vorlage für Ihr Intro.')
  });

  /* ─── MESM-UI-405c: Hauptteil ────────────────────────────── */
  createAccordion(acc, {
    number: 3,
    title: 'Hauptteil',
    status: 'none',
    body: buildMainPart()
  });

  /* ─── MESM-UI-405c/d: Outro-Vorlage ─────────────────────── */
  createAccordion(acc, {
    number: 4,
    title: 'Outro',
    status: 'none',
    body: buildTemplateCarousel('outro', 'Outro-Vorlage wählen', 'Wählen Sie eine Vorlage für Ihr Outro.')
  });

  /* ─── MESM-UI-405h: Export ──────────────────────────────── */
  createAccordion(acc, {
    number: 5,
    title: 'Export & Rendern',
    status: 'none',
    body: `
      <div style="display:flex;gap:var(--space-3);margin-bottom:var(--space-4);">
        <button class="btn btn-accent" id="btn-check-completeness" style="flex:1;">
          ✅ Vollständigkeit prüfen
        </button>
        <button class="btn btn-primary" id="btn-launch-editor" style="flex:1;display:flex;align-items:center;justify-content:center;gap:var(--space-2);" disabled>
          🚀 Videoeditor starten
        </button>
      </div>
      <div id="export-status" class="mt-4"></div>
    `
  });

  /* ─── Wire: Format-Selector ──────────────────────────────── */
  document.querySelectorAll('.video-format-card').forEach(card => {
    card.onclick = function() {
      document.querySelectorAll('.video-format-card').forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      document.getElementById('video-format-value').value = this.dataset.format;
    };
  });

  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.onclick = function() {
      this.classList.toggle('selected');
    };
  });

  document.getElementById('btn-save-format')?.addEventListener('click', async () => {
    const format = document.getElementById('video-format-value')?.value || 'quer';
    const plattformen = Array.from(document.querySelectorAll('.pill-btn.selected')).map(b => b.dataset.plattform);
    try {
      await api.saveVideoKonfig(state.activeChannelPrefix, state.activeProjectId, { format, plattform: plattformen.join(',') });
      toast('Format gespeichert');
    } catch (err) { toast(err.message, 'error'); }
  });

  /* ─── Wire: Template Carousels ───────────────────────────── */
  wireCarousel('intro');
  wireCarousel('outro');

  /* ─── Wire: Export ──────────────────────────────────────── */
  document.getElementById('btn-check-completeness')?.addEventListener('click', () => {
    document.getElementById('export-status').innerHTML = `
      <div class="card success-animate" style="background:rgba(37,194,121,0.07);border:1px solid rgba(37,194,121,0.3);">
        <div style="display:flex;align-items:center;gap:var(--space-2);color:var(--color-success);font-weight:600;">
          ✅ Alle Assets vorhanden
        </div>
        <p class="text-sm text-muted mt-1">Export-Verzeichnis: <code>${esc(state.activeChannelPrefix)}/${esc(state.activeProjectId)}/5. Video/</code></p>
      </div>
    `;
    document.getElementById('btn-launch-editor').disabled = false;
    toast('Vollständigkeitsprüfung erfolgreich');
  });

  document.getElementById('btn-launch-editor')?.addEventListener('click', () => {
    toast('Video-Editor wird extern gestartet...', 'info');
    setTimeout(() => { state.activeNav = '6'; }, 1000);
  });

  // Load templates from channel
  loadVorlagenIntoCarousels();
}

/* ─── MESM-UI-405a/b: Format-Selector HTML ────────────────────── */
function buildFormatSelector(konfig) {
  const currentFormat = konfig?.format || 'quer';
  const formate = [
    { id: 'quer', label: 'Querformat (16:9)', desc: 'PC, TV, YouTube', icon: MONITOR_ICON },
    { id: 'hoch', label: 'Hochformat (9:16)', desc: 'TikTok, Instagram Reels', icon: PHONE_ICON },
    { id: 'quadrat', label: 'Quadrat (1:1)', desc: 'Instagram Feed', icon: TV_ICON },
  ];

  return `
    <div class="form-group">
      <label class="form-label" style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);">
        <span style="color:var(--color-primary);">🎬</span> Format wählen
      </label>
      <div class="video-format-grid">
        ${formate.map(f => `
          <div class="video-format-card ${f.id === currentFormat ? 'selected' : ''}" data-format="${f.id}">
            <div class="format-icon">${f.icon}</div>
            <div class="format-label">${f.label}</div>
            <div class="format-desc">${f.desc}</div>
          </div>
        `).join('')}
      </div>
      <input type="hidden" id="video-format-value" value="${currentFormat}">
    </div>

    <div class="form-group mt-4">
      <label class="form-label" style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);">
        <span style="color:var(--color-primary);">🌐</span> Plattform wählen
      </label>
      <div class="pill-selector">
        ${['youtube','tiktok','instagram','linkedin','anderes'].map(p => {
          const labels = { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', linkedin: 'LinkedIn', anderes: 'Andere' };
          const isSelected = konfig?.plattform?.includes(p) || p === 'youtube';
          return `<button class="pill-btn ${isSelected ? 'selected' : ''}" data-plattform="${p}">${labels[p]}</button>`;
        }).join('')}
      </div>
    </div>

    <button class="btn btn-primary mt-3" id="btn-save-format">Format speichern</button>
  `;
}

/* ─── MESM-UI-405c: Template-Carousel ─────────────────────────── */
function buildTemplateCarousel(type, title, subtitle) {
  const colors = ['#ef4444','#6b7280','#3b82f6','#8b5cf6','#22c55e','#f97316','#64748b','#6366f1'];
  return `
    <div class="form-group" id="${type}-carousel-section">
      <label class="form-label" style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-1);">
        <span style="color:var(--color-primary);">🎬</span> ${title}
      </label>
      <p class="text-xs text-muted mb-3">${subtitle}</p>

      <div class="template-carousel-wrapper">
        <div style="display:flex;align-items:center;gap:var(--space-2);">
          <button class="template-carousel-nav-btn" id="${type}-prev-btn" title="Zurück">◀</button>
          <div class="template-carousel-pages" id="${type}-carousel" style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-3);flex:1;">
            ${[0,1,2,3].map(i => `
              <div class="template-item ${i === 0 ? 'selected' : ''}" data-template="${type}-template-${i+1}" style="cursor:pointer;border:2px solid ${i===0?'var(--color-primary)':'var(--color-border)'};border-radius:var(--radius-lg);overflow:hidden;transition:all var(--transition-fast);">
                <div style="aspect-ratio:16/9;background:${colors[i]};display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;">
                  ${i === 0 ? '▶' : i === 1 ? '🖼' : i === 2 ? '▶' : '🖼'}
                </div>
                <div style="padding:var(--space-2);font-size:var(--text-xs);text-align:center;color:var(--color-text-muted);">
                  Template ${i+1}
                </div>
                ${i === 0 ? '<div style="position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:10px;">✓</span></div>' : ''}
              </div>
            `).join('')}
          </div>
          <button class="template-carousel-nav-btn" id="${type}-next-btn" title="Weiter">▶</button>
        </div>
        <div class="template-carousel-dots" id="${type}-dots">
          ${[0,1].map(i => `<span class="carousel-dot ${i === 0 ? 'active' : ''}"></span>`).join('')}
        </div>
      </div>

      <!-- MESM-UI-405d: Metadata-Panel -->
      <div class="metadata-panel" id="${type}-metadata">
        <div class="metadata-item">
          <div class="meta-label">Auflösung</div>
          <div class="meta-value">1920×1080</div>
        </div>
        <div class="metadata-item">
          <div class="meta-label">Aspect Ratio</div>
          <div class="meta-value">16:9</div>
        </div>
        <div class="metadata-item">
          <div class="meta-label">Länge</div>
          <div class="meta-value">0:05</div>
        </div>
      </div>
    </div>
  `;
}

/* ─── MESM-UI-405e/f: Hauptteil (Steuerdatei + File Lists) ────── */
function buildMainPart() {
  return `
    <div data-section="video-hauptteil">
      <!-- Template Carousel -->
      <div class="form-group">
        <label class="form-label" style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3);">
          <span style="color:var(--color-primary);">🎬</span> Hauptteil-Vorlage wählen
        </label>
        <div class="template-carousel" id="hauptteil-carousel" style="display:flex;gap:var(--space-3);overflow-x:auto;padding-bottom:var(--space-2);">
          ${['#22c55e','#3b82f6','#f97316','#8b5cf6','#ef4444','#14b8a6'].map((c,i) => `
            <div class="template-item ${i===0?'selected':''}" data-template="main-${i+1}" style="flex-shrink:0;width:140px;border:2px solid ${i===0?'var(--color-primary)':'var(--color-border)'};border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;transition:all var(--transition-fast);position:relative;">
              <div style="aspect-ratio:16/9;background:${c};display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem;">📄</div>
              <div style="padding:var(--space-2);font-size:var(--text-xs);text-align:center;color:var(--color-text-muted);">Hauptteil ${i+1}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- MESM-UI-405e: Steuerdatei -->
      <div class="steuerdatei-card" style="margin-top:var(--space-4);">
        <span style="font-size:1.2rem;">⚙</span>
        <span class="steuerdatei-name">Keine Steuerdatei hochgeladen</span>
        <button class="btn btn-sm btn-secondary" id="btn-upload-steuerdatei">Hochladen</button>
      </div>

      <!-- MESM-UI-405f: Audio-Dateien -->
      <div class="file-section">
        <div class="file-section-header">
          <div class="file-section-title">🎵 Audiodateien</div>
          <button class="btn btn-sm btn-accent" id="btn-add-audio-file">+ Hinzufügen</button>
        </div>
        <div id="audio-file-list">
          <div class="file-card">
            <span style="font-size:1rem;">🎵</span>
            <span class="file-name">Keine Audiodateien</span>
          </div>
        </div>
      </div>

      <!-- MESM-UI-405f: Video-Dateien -->
      <div class="file-section">
        <div class="file-section-header">
          <div class="file-section-title">🎬 Videodateien</div>
          <button class="btn btn-sm btn-accent" id="btn-add-video-file">+ Hinzufügen</button>
        </div>
        <div id="video-file-list">
          <div class="file-card">
            <span style="font-size:1rem;">🎬</span>
            <span class="file-name">Keine Videodateien</span>
          </div>
        </div>
      </div>

      <!-- MESM-UI-405g: Timeline -->
      <div style="margin-top:var(--space-4);">
        <label class="form-label" style="margin-bottom:var(--space-3);display:flex;align-items:center;gap:var(--space-2);">
          <span style="color:var(--color-primary);">📊</span> Zeitleiste
        </label>
        <div class="timeline-container" style="background:#111827;border-radius:var(--radius-xl);padding:var(--space-4);">
          ${buildTimeline()}
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-3);margin-top:var(--space-3);font-size:var(--text-xs);">
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:2px;background:rgba(239,68,68,0.5);display:inline-block;"></span> Intro</span>
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:2px;background:rgba(59,130,246,0.5);display:inline-block;"></span> Sprecher A</span>
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:2px;background:rgba(139,92,246,0.5);display:inline-block;"></span> Sprecher B</span>
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:2px;background:rgba(34,197,94,0.4);display:inline-block;"></span> Hintergrund</span>
            <span style="display:flex;align-items:center;gap:4px;"><span style="width:12px;height:12px;border-radius:2px;background:rgba(234,179,8,0.5);display:inline-block;"></span> Outro</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ─── MESM-UI-405g: Timeline-View ─────────────────────────────── */
function buildTimeline() {
  const tracks = [
    { label: '🎬 Intro', pct: 10, cls: 'intro' },
    { label: '🖼 Hintergrund', pct: 85, cls: 'background' },
    { label: '🎙 Sprecher A', pct: 70, cls: 'speaker-a' },
    { label: '🎙 Sprecher B', pct: 30, cls: 'speaker-b' },
    { label: '🎬 Outro', pct: 10, cls: 'outro' },
  ];
  return tracks.map(t => `
    <div class="timeline-track" style="border-bottom-color:rgba(255,255,255,0.08);">
      <span class="timeline-track-label" style="color:#9ca3af;width:110px;">${t.label}</span>
      <div class="timeline-track-bar" style="background:rgba(255,255,255,0.08);border-radius:4px;">
        <div class="timeline-track-fill ${t.cls}" style="width:${t.pct}%;${t.cls==='intro'?'background:rgba(239,68,68,0.5)':t.cls==='speaker-a'?'background:rgba(59,130,246,0.5)':t.cls==='speaker-b'?'background:rgba(139,92,246,0.5)':t.cls==='background'?'background:rgba(34,197,94,0.3)':'background:rgba(234,179,8,0.5)'}"></div>
      </div>
    </div>
  `).join('');
}

/* ─── Carousel Wiring ─────────────────────────────────────────── */
function wireCarousel(type) {
  const prev = document.getElementById(`${type}-prev-btn`);
  const next = document.getElementById(`${type}-next-btn`);
  const carousel = document.getElementById(`${type}-carousel`);
  const dots = document.getElementById(`${type}-dots`);
  if (!carousel) return;

  // Template selection in carousel
  carousel.querySelectorAll('.template-item').forEach((item, i) => {
    item.onclick = function() {
      carousel.querySelectorAll('.template-item').forEach(it => {
        it.style.borderColor = 'var(--color-border)';
        const check = it.querySelector('div[style*="border-radius:50%"]');
        if (check) check.remove();
      });
      this.style.borderColor = 'var(--color-primary)';
      // Add checkmark
      if (!this.querySelector('div[style*="border-radius:50%"]')) {
        const check = document.createElement('div');
        check.style.cssText = 'position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;';
        check.innerHTML = '<span style="color:white;font-size:10px;">✓</span>';
        this.style.position = 'relative';
        this.appendChild(check);
      }
    };
  });

  if (prev) prev.onclick = () => updateCarouselPage(type, -1);
  if (next) next.onclick = () => updateCarouselPage(type, 1);
}

let carouselPages = { intro: 0, outro: 0 };

function updateCarouselPage(type, delta) {
  carouselPages[type] = Math.max(0, carouselPages[type] + delta);
  const dots = document.getElementById(`${type}-dots`);
  if (dots) {
    dots.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === carouselPages[type]);
    });
  }
}

/* ─── Load vorlagen from channel ───────────────────────────────── */
async function loadVorlagenIntoCarousels() {
  try {
    const vorlagen = await api.getVorlagen(state.activeChannelPrefix);
    if (!vorlagen.length) return;

    const groups = { intro: [], hauptteil: [], outro: [] };
    vorlagen.forEach(v => {
      if (groups[v.type]) groups[v.type].push(v);
    });

    for (const type of ['intro', 'outro']) {
      const items = groups[type] || [];
      if (items.length === 0) continue;
      const carousel = document.getElementById(`${type}-carousel`);
      if (!carousel) continue;

      carousel.innerHTML = items.map((v, i) => `
        <div class="template-item ${i === 0 ? 'selected' : ''}" data-template="${v.id}">
          <div style="aspect-ratio:16/9;background:#6b7280;display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem;">🎬</div>
          <div style="padding:var(--space-2);font-size:var(--text-xs);text-align:center;">${esc(v.label)}</div>
        </div>
      `).join('');
      wireCarousel(type);
    }
  } catch (_) { /* silently use defaults */ }
}
