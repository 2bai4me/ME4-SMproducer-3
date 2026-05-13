/**
 * Simple reactive state store for MESM 3.0.
 * Single-user app, no framework needed – just plain JS reactivity.
 */

const listeners = new Map();

export const state = new Proxy({
  // Navigation
  activeNav: '1',     // Sprint 2 - Thema als Startseite
  activeProjectId: null,
  activeChannelPrefix: null,

  // Sidebar
  activeSidebarTab: 'chat',
  aiActiveField: null,        // CHAT-02: Aktives Eingabefeld fuer Feld-KI

  // Channels
  channels: [],
  selectedChannel: null,

  // Current project data (lazy-loaded per step)
  thema: null,
  research: null,
  audio: null,
  slides: null,
  video: null,
  upload: null,

  // UI state
  loading: false,
  error: null,
  toasts: [],
  notifications: 0,
  settingsOpen: false,
  modalOpen: false,
  modalContent: null,
  sidebarCollapsed: false,     /* MESM-UI-310: Sidebar-Collapse state */
  infoEnabled: true,           /* MESM-UI-336: Info-Tab via Ctrl+Click */
  elementInfo: null,           /* MESM-UI-336: Aktuelles Element für Info-Tab */
  inspectorEnabled: true,      /* MESM-UI-336a: KI-Element-Inspektor via Strg+Hover */

  // Auth / Config
  rootDir: '',
  appVersion: '2.01.000',
  providers: [],
  ttsProfiles: [],
}, {
  set(target, prop, value) {
    const old = target[prop];
    target[prop] = value;
    if (old !== value) {
      notify(prop, value, old);
    }
    return true;
  }
});

function notify(prop, value, old) {
  const fns = listeners.get(prop) || [];
  fns.forEach(fn => fn(value, old));
  // Also notify '*' wildcard listeners
  const wildcards = listeners.get('*') || [];
  wildcards.forEach(fn => fn(prop, value, old));
}

/**
 * Subscribe to state changes.
 * @param {string} prop - State property to watch, or '*' for all
 * @param {(value: any, old: any) => void} fn
 * @returns {() => void} Unsubscribe function
 */
export function watch(prop, fn) {
  if (!listeners.has(prop)) listeners.set(prop, []);
  listeners.get(prop).push(fn);
  return () => {
    const arr = listeners.get(prop) || [];
    listeners.set(prop, arr.filter(f => f !== fn));
  };
}

/**
 * Show a toast notification.
 */
export function toast(message, type = 'info') {
  const id = Date.now();
  state.toasts = [...state.toasts, { id, message, type }];
  setTimeout(() => {
    state.toasts = state.toasts.filter(t => t.id !== id);
  }, 4000);
}

/**
 * HTML escape utility.
 */
export function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Generate a simple unique ID.
 */
export function uid() {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * Format a timestamp string for display.
 */
export function fmtDate(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  } catch (_) { return ts; }
}

// ─── Persistent active project ────────────────────────────────
const STORAGE_KEY = 'mesm3_active_project';

export function saveActiveProject(prefix, projectId) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ prefix, projectId }));
}

export function loadActiveProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const { prefix, projectId } = JSON.parse(raw);
      if (prefix && projectId) return { prefix, projectId };
    }
  } catch (_) {}
  return null;
}

export function restoreActiveProject() {
  const saved = loadActiveProject();
  if (saved) {
    state.activeChannelPrefix = saved.prefix;
    state.activeProjectId = saved.projectId;
  }
}

// ─── KI-Overlay ─────────────────────────────────────────────
export function showAIOverlay(title, description) {
  const overlay = document.createElement('div');
  overlay.id = 'ai-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:1.5rem 2rem;max-width:480px;width:90%;box-shadow:0 25px 80px rgba(0,0,0,0.4);text-align:center;">
      <div style="display:inline-block;width:32px;height:32px;border:3px solid #e5e7eb;border-top-color:#0f446b;border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:1rem;"></div>
      <h3 style="margin:0 0 0.5rem;color:#0f446b;font-size:1rem;">🤖 ${esc(title)}</h3>
      <p style="margin:0;font-size:0.8rem;color:#6b7280;">${esc(description)}</p>
    </div>`;
  document.body.appendChild(overlay);
  return overlay;
}

export function hideAIOverlay() {
  const ov = document.getElementById('ai-overlay');
  if (ov) ov.remove();
}
