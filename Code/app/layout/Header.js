/**
 * Header Component – App brand, project ID, action buttons
 *
 * MESM-UI-301a: Logo – Sparkles-Icon SVG auf crimson BG (Mockup: w-8 h-8 rounded-lg bg-crimson)
 * MESM-UI-301b: Bell-Button – SVG Bell-Icon mit rotem Punkt (Mockup: absolute top-1.5 right-1.5 w-2 h-2 bg-crimson)
 */

import { state, toast } from '../shared/state.js';

/* MESM-UI-301a: SVG Sparkles-Icon – lucide-react sparkles Ersatz */
const SPARKLES_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/><path d="M18.5 2l.5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5z"/><path d="M6.5 14l.5 1.5L8.5 16l-1.5.5L6.5 18l-.5-1.5L4.5 16l1.5-.5z"/></svg>`;

/* MESM-UI-301b: SVG Bell-Icon – lucide-react bell Ersatz */
const BELL_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;

/* SVG Settings-Icon */
const SETTINGS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

/* SVG HelpCircle-Icon */
const HELP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

export function renderHeader() {
  const el = document.getElementById('header');
  if (!el) return;

  el.innerHTML = `
    <!-- MESM-UI-301a: Logo mit Sparkles-Icon auf crimson BG -->
    <div class="w-8 h-8 rounded-lg bg-crimson flex items-center justify-center" style="background:var(--color-primary);width:32px;height:32px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      ${SPARKLES_ICON}
    </div>
    <span class="header-brand">ME4-SMproducer <span style="font-size:0.7rem;font-weight:400;color:var(--color-text-dim);">v${state.appVersion || '2.01.000'}</span></span>
    ${state.activeProjectId
      ? `<span class="header-project-id" id="header-project-id" style="cursor:pointer;" title="Projekt wechseln">${state.activeProjectId}</span>`
      : '<span class="header-project-id" style="opacity:0.4">Kein Projekt</span>'}
    <div id="project-picker-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;align-items:center;justify-content:center;"></div>
    <div class="header-spacer"></div>
    <div class="header-actions">
      <button id="header-llm-provider" title="LLM-Provider wechseln" style="font-size:0.7rem;color:var(--color-text-dim);background:transparent;border:1px solid #374151;border-radius:4px;padding:2px 8px;cursor:pointer;display:flex;align-items:center;gap:4px;margin-right:8px;">🤖 ...</button>
      <div id="header-llm-dropdown" style="display:none;position:absolute;top:100%;right:80px;background:#1f2937;border:1px solid #374151;border-radius:8px;padding:4px;z-index:100;min-width:200px;box-shadow:0 8px 30px rgba(0,0,0,0.5);"></div>
      <!-- MESM-UI-301b: Bell-Button mit SVG und rotem Punkt -->
      <button class="header-btn ${state.notifications > 0 ? 'has-notification' : ''}" title="Benachrichtigungen" id="btn-bell">
        ${BELL_ICON}
      </button>
      <button class="header-btn" title="Einstellungen" id="btn-settings">
        ${SETTINGS_ICON}
      </button>
      <button class="header-btn" title="Hilfe" id="btn-help">
        ${HELP_ICON}
      </button>
    </div>
  `;

  document.getElementById('btn-settings').onclick = () => {
    state.settingsOpen = !state.settingsOpen;
  };

  document.getElementById('btn-help').onclick = () => {
    window.open('https://github.com/me4-smproducer', '_blank');
  };

  document.getElementById('btn-bell').onclick = () => {
    state.notifications = 0;
    toast('Keine neuen Benachrichtigungen', 'info');
    renderHeader();
  };

  // Aktiven LLM-Provider laden + Auswahl-Dropdown
  (async () => {
    const el = document.getElementById('header-llm-provider');
    const dropdown = document.getElementById('header-llm-dropdown');
    if (!el) return;
    try {
      const resp = await fetch('http://localhost:3001/api/projects/settings');
      const data = await resp.json();
      const providers = data.providers || [];
      const active = providers.find(p => p.is_active);
      if (active) {
        el.innerHTML = '🤖 ' + active.provider;
      }
      // Dropdown bauen
      dropdown.innerHTML = providers.map(p => `
        <div class="llm-provider-option" data-id="${p.id}" style="padding:6px 10px;cursor:pointer;border-radius:4px;font-size:0.8rem;color:#d1d5db;${p.is_active?'background:#0f446b;color:#fff;':''}">
          ${p.provider} <span style="opacity:0.6;font-size:0.7rem;">${p.api_key?'••••'+p.api_key.slice(-4):'(kein Key)'}</span>
        </div>
      `).join('');
      // Klick-Handler für Dropdown-Optionen
      dropdown.querySelectorAll('.llm-provider-option').forEach(opt => {
        opt.onclick = async (e) => {
          e.stopPropagation();
          const id = parseInt(opt.dataset.id);
          // Alle deaktivieren, dann den gewählten aktivieren
          for (const p of providers) {
            await fetch('http://localhost:3001/api/projects/settings/providers/' + p.id + '?toggle=1', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({...p, is_active: p.id === id ? 1 : 0})
            }).catch(() => {});
          }
          // Zuletzt verwendet speichern
          localStorage.setItem('lastActiveProvider', id);
          dropdown.style.display = 'none';
          toast('Provider gewechselt', 'success');
          setTimeout(() => renderHeader(), 300);
        };
      });
      // Toggle Dropdown
      el.onclick = (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      };
      // Klick außerhalb schließt Dropdown
      document.addEventListener('click', () => { dropdown.style.display = 'none'; });
    } catch (_) { if (el) el.textContent = '🤖 offline'; }
  })();

  // Projekt-Picker: Klick auf Projekt-ID öffnet Auswahl
  document.getElementById('header-project-id')?.addEventListener('click', async () => {
    const overlay = document.getElementById('project-picker-overlay');
    try {
      const resp = await fetch(`http://localhost:3001/api/projects/${state.activeChannelPrefix}`);
      const projects = await resp.json();
      overlay.innerHTML = `
        <div style="background:#fff;border-radius:12px;max-width:500px;width:90%;max-height:70vh;overflow-y:auto;padding:1.5rem;">
          <h3 style="margin:0 0 1rem 0;">📁 Projekte (${projects.length})</h3>
          ${projects.map(p => `
            <div class="project-pick-item" data-id="${p.id}" style="padding:10px;cursor:pointer;border-radius:6px;margin-bottom:4px;${p.id===state.activeProjectId?'background:#e8f0f8;':''}">
              <strong>${p.id}</strong>
              <span style="color:#6b7280;margin-left:8px;">${p.title||'Ohne Titel'}</span>
              <span style="font-size:0.7rem;color:#9ca3af;float:right;">${p.status||'active'}</span>
            </div>
          `).join('')}
          <button id="picker-close" style="margin-top:1rem;padding:8px 16px;background:#e5e7eb;border:none;border-radius:6px;cursor:pointer;">Schließen</button>
        </div>
      `;
      overlay.style.display = 'flex';
      overlay.querySelector('#picker-close').onclick = () => overlay.style.display = 'none';
      overlay.querySelectorAll('.project-pick-item').forEach(item => {
        item.onclick = () => {
          state.activeProjectId = item.dataset.id;
          overlay.style.display = 'none';
        };
      });
    } catch (_) { overlay.style.display = 'none'; }
  });
}
