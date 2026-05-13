/**
 * ME4 SM Producer 3.0 – Main Entry Point
 *
 * Orchestrates the 4-quadrant layout and page routing.
 * Vanilla JS SPA – no frameworks, just the platform.
 */

import { state, watch, toast, esc, saveActiveProject, restoreActiveProject, loadActiveProject } from './shared/state.js';
import { api } from './shared/api.js';
import { renderHeader } from './layout/Header.js';
import { renderNavigator } from './layout/Navigator.js';
import { renderSidebar } from './layout/Sidebar.js';
import { renderPage } from './layout/Workspace.js';
import './styles/main.css';

/**
 * Bootstrap the application.
 */
async function init() {
  renderAppShell();

  // Load initial data
  try {
    const health = await api.health();
    state.rootDir = health.rootDir;
    state.appVersion = health.version || state.appVersion;

    const channels = await api.getChannels();
    state.channels = channels;

    if (channels.length > 0) {
      state.selectedChannel = channels[0];
      state.activeChannelPrefix = channels[0].prefix;

      // Letztes aktives Projekt wiederherstellen
      const saved = loadActiveProject();
      if (saved && saved.prefix === channels[0].prefix) {
        state.activeProjectId = saved.projectId;
      }
    } else {
      // Onboarding: Kein Kanal vorhanden → Einstellungen öffnen
      setTimeout(() => {
        state.settingsOpen = true;
        toast('👋 Willkommen! Bitte konfigurieren Sie zuerst einen LLM-Provider und legen Sie einen Kanal an.', 'info');
      }, 500);
    }
  } catch (err) {
    console.warn('Backend nicht erreichbar:', err.message);
    toast('Backend nicht erreichbar – bitte Pipeline-Service starten', 'error');
  }

  // Erst jetzt initial rendern (nachdem Daten geladen sind)
  renderNavigator();
  renderWorkspace();
  renderHeader();

  // React to navigation changes
  watch('activeNav', () => {
    renderNavigator();
    renderWorkspace();
  });
  watch('activeSidebarTab', () => renderSidebarContent());
  watch('activeProjectId', () => {
    renderHeader();
    renderWorkspace();
    // Persist to localStorage
    if (state.activeProjectId && state.activeChannelPrefix) {
      saveActiveProject(state.activeChannelPrefix, state.activeProjectId);
    }
  });
  watch('selectedChannel', () => {
    state.activeChannelPrefix = state.selectedChannel?.prefix || null;
    state.activeProjectId = null;
    renderHeader();
    renderNavigator();
    renderWorkspace();
  });
  watch('channels', () => {
    renderNavigator();
    if (!state.selectedChannel && state.channels.length > 0) {
      state.selectedChannel = state.channels[0];
    }
  });
  watch('toasts', () => renderToasts());
  watch('settingsOpen', () => renderSettingsModal());
  watch('sidebarCollapsed', () => {
    updateLayoutCollapse();
    renderNavigator();
  });
  watch('infoEnabled', () => renderSettingsModal());

  // Loader ausblenden wenn App bereit ist
  setTimeout(() => {
    const loader = document.getElementById('app-loader');
    if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.remove(), 500); }
  }, 800);

  /* MESM-UI-336: Ctrl+Click Info-Feature */
  setupInfoClick();

  /* MESM-UI-336a: KI-Element-Inspektor – Hover+Ctrl zeigt Overlay, Mausrad wechselt Ebenen, Klick kopiert ID */
  setupInspector();
}

function renderAppShell() {
  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <header class="app-header" id="header"></header>
      <nav class="app-navigator" id="navigator"></nav>
      <main class="app-workspace" id="workspace"></main>
      <aside class="app-sidebar" id="sidebar"></aside>
    </div>
    <div class="toast-container" id="toasts"></div>
    <div id="modal-root"></div>
  `;

  renderHeader();
  renderNavigator();
  renderSidebar();
  renderWorkspace();
  updateLayoutCollapse();
}

/* MESM-UI-310: Layout-Klassen bei Sidebar-Collapse umschalten */
function updateLayoutCollapse() {
  const layout = document.querySelector('.app-layout');
  if (!layout) return;
  if (state.sidebarCollapsed) {
    layout.classList.add('nav-collapsed-layout');
    layout.classList.add('sidebar-collapsed-layout');
  } else {
    layout.classList.remove('nav-collapsed-layout');
    layout.classList.remove('sidebar-collapsed-layout');
  }
}

function renderWorkspace() {
  const el = document.getElementById('workspace');
  if (!el) return;
  el.innerHTML = '';
  const page = renderPage();
  page.classList.add('page-enter');
  el.appendChild(page);
  // CHAT-02: ✨ Buttons nach Rendern injizieren
  setTimeout(() => injectFieldAIButtons(el), 400);
}

function renderSidebarContent() {
  const el = document.getElementById('sidebar-content');
  if (!el) return;
  renderSidebar(el);
}

function renderToasts() {
  const el = document.getElementById('toasts');
  if (!el) return;
  el.innerHTML = state.toasts.map(t => `
    <div class="toast toast-${t.type}">${esc(t.message)}</div>
  `).join('');
}

function renderSettingsModal() {
  const root = document.getElementById('modal-root');
  if (!root) return;
  if (!state.settingsOpen) {
    root.innerHTML = '';
    return;
  }
  root.innerHTML = `
    <div class="modal-overlay" id="settings-overlay">
      <div class="modal modal-lg" id="settings-modal-content">
        <div class="modal-header">
          <span class="modal-title">⚙ Einstellungen</span>
          <button class="modal-close" id="btn-close-settings">✕</button>
        </div>
        <div class="modal-body" id="settings-body">
          <div class="loading-spinner">Einstellungen laden...</div>
        </div>
      </div>
    </div>
  `;

  // Close handlers
  const close = () => { state.settingsOpen = false; };
  document.getElementById('btn-close-settings').onclick = close;
  document.getElementById('settings-overlay').onclick = (e) => {
    if (e.target === e.currentTarget) close();
  };
  // ESC key
  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);

  // Load settings async
  import('./pages/KanalPage.js').then(({ renderSettingsForm }) => {
    renderSettingsForm(document.getElementById('settings-body'), close);
  });
}

/* MESM-UI-336: Ctrl+Click auf Elemente → Info-Tab mit Elementdaten */
function setupInfoClick() {
  document.addEventListener('click', (e) => {
    if (!state.infoEnabled) return;
    if (!(e.ctrlKey || e.metaKey)) return;

    const target = e.target.closest('input, textarea, select, button, label') || e.target;
    if (!target) return;

    const tag = (target.tagName || '').toLowerCase();
    let name = '';
    if (tag === 'input' || tag === 'textarea') {
      name = target.placeholder || target.name || target.type || tag;
    } else if (tag === 'select') {
      name = target.name || 'Auswahlliste';
    } else if (tag === 'button') {
      name = (target.textContent || '').trim().substring(0, 50) || 'Button';
    } else if (tag === 'label') {
      name = (target.textContent || '').trim().substring(0, 50) || 'Label';
    } else {
      name = (target.textContent || '').trim().substring(0, 50) || tag;
    }

    let context = '';
    const section = target.closest('[data-section]');
    if (section) context = section.getAttribute('data-section') || '';

    const tagDesc = {
      input: 'Texteingabefeld. Hier kann der Benutzer Text oder Daten eingeben.',
      textarea: 'Mehrzeiliges Textfeld für längere Texteingaben.',
      select: 'Auswahlliste mit vordefinierten Optionen.',
      button: 'Interaktiver Button, der eine Aktion auslöst.',
      label: 'Beschriftung für ein zugehöriges Eingabefeld.',
    };

    state.activeSidebarTab = 'info';
    state.elementInfo = {
      name: name.substring(0, 100),
      type: tag,
      context,
      description: tagDesc[tag] || `Interaktives Element vom Typ "${tag}".`
    };
  });
}

/* ─── MESM-UI-336a: KI-Element-Inspektor ───────────────────────
 * Strg-Taste halten + Maus bewegen → Overlay mit KI-ID
 * Mausrad → zwischen übereinanderliegenden Ebenen wechseln
 * Linksklick → KI-ID in Zwischenablage kopieren
 * Ein/Aus über Einstellungen (state.inspectorEnabled)
 * Die ID ist ein CSS-Selektor-Pfad, den eine KI zur Identifikation nutzen kann.
 */
let inspectorOverlay = null;
let inspectorStack = [];
let inspectorStackIdx = 0;
let inspectorCtrlDown = false;

function setupInspector() {
  // Overlay-DOM einmalig erzeugen
  inspectorOverlay = document.createElement('div');
  inspectorOverlay.id = 'inspector-overlay';
  inspectorOverlay.innerHTML = `
    <div class="inspector-tooltip">
      <div class="inspector-id"></div>
      <div class="inspector-meta">
        <span class="inspector-layer">Ebene 1/1</span>
        <span class="inspector-hint">↕ Mausrad • Klick = Kopieren</span>
      </div>
    </div>
  `;
  inspectorOverlay.style.cssText = 'display:none;position:fixed;pointer-events:none;z-index:99999;';
  document.body.appendChild(inspectorOverlay);

  document.addEventListener('keydown', onInspectorKeyDown);
  document.addEventListener('keyup', onInspectorKeyUp);
  document.addEventListener('mousemove', onInspectorMove, { passive: true });
  document.addEventListener('wheel', onInspectorWheel, { passive: false });
  document.addEventListener('click', onInspectorClick, true);
}

function onInspectorKeyDown(e) {
  // CHAT-03: Ctrl oder Win (Meta) für Element-Inspektor
  if (e.key === 'Control' || e.key === 'Meta') {
    inspectorCtrlDown = true;
    if (state.inspectorEnabled) showInspectorAtMouse(e);
  }
}

function onInspectorKeyUp(e) {
  if (e.key === 'Control' || e.key === 'Meta') {
    inspectorCtrlDown = false;
    hideInspector();
  }
}

function onInspectorMove(e) {
  if (!inspectorCtrlDown || !state.inspectorEnabled) return;
  showInspectorAtMouse(e);
}

function onInspectorWheel(e) {
  if (!inspectorCtrlDown || !state.inspectorEnabled) return;
  if (inspectorStack.length < 2) return;

  e.preventDefault();
  // Rad nach unten = nächste Ebene (tiefer), Rad nach oben = vorherige (höher)
  if (e.deltaY > 0) {
    inspectorStackIdx = (inspectorStackIdx + 1) % inspectorStack.length;
  } else {
    inspectorStackIdx = (inspectorStackIdx - 1 + inspectorStack.length) % inspectorStack.length;
  }
  updateInspectorDisplay();
}

function onInspectorClick(e) {
  if (!inspectorCtrlDown || !state.inspectorEnabled) return;
  if (inspectorStack.length === 0) return;

  const el = inspectorStack[inspectorStackIdx];
  if (!el) return;

  const id = buildAIIdentifier(el);
  navigator.clipboard.writeText(id).then(() => {
    // Kurzes Feedback im Overlay
    const tooltip = inspectorOverlay.querySelector('.inspector-tooltip');
    const idEl = inspectorOverlay.querySelector('.inspector-id');
    idEl.textContent = '✅ Kopiert!';
    idEl.style.color = 'var(--color-success)';
    tooltip.style.borderColor = 'var(--color-success)';
    setTimeout(() => {
      idEl.style.color = '';
      tooltip.style.borderColor = '';
    }, 800);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = id;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function showInspectorAtMouse(e) {
  const x = e.clientX;
  const y = e.clientY;

  // Alle Elemente an dieser Position ermitteln (von oben nach unten)
  const allEls = document.elementsFromPoint(x, y);

  // Filtern: keine Inspector-Elemente, kein html/body, keine zu grossen Container
  inspectorStack = allEls.filter(el => {
    if (!el || el === document.documentElement || el === document.body) return false;
    if (el.id === 'inspector-overlay' || el.closest('#inspector-overlay')) return false;
    const tag = el.tagName.toLowerCase();
    // Keine strukturellen Nur-Container
    if (tag === 'main' || tag === 'nav' || tag === 'header' || tag === 'aside') return false;
    return true;
  });

  if (inspectorStack.length === 0) {
    hideInspector();
    return;
  }

  inspectorStackIdx = 0;

  // Position des Overlays (rechts unter dem Cursor, clamp an Fensterrand)
  const tw = 340; // geschätzte Breite
  const th = 64;  // geschätzte Höhe
  let left = x + 16;
  let top = y + 12;
  if (left + tw > window.innerWidth - 8) left = x - tw - 16;
  if (top + th > window.innerHeight - 8) top = y - th - 12;
  if (left < 4) left = 4;
  if (top < 4) top = 4;

  inspectorOverlay.style.left = left + 'px';
  inspectorOverlay.style.top = top + 'px';
  inspectorOverlay.style.display = 'block';

  updateInspectorDisplay();
}

function updateInspectorDisplay() {
  const el = inspectorStack[inspectorStackIdx];
  if (!el) return;

  const id = buildAIIdentifier(el);
  const idEl = inspectorOverlay.querySelector('.inspector-id');
  const layerEl = inspectorOverlay.querySelector('.inspector-layer');
  const hintEl = inspectorOverlay.querySelector('.inspector-hint');

  // Element-Typ ermitteln
  const tag = el.tagName.toLowerCase();
  let typeLabel = tag;
  if (tag === 'input') typeLabel = 'Texteingabe (' + (el.type || 'text') + ')';
  else if (tag === 'textarea') typeLabel = 'Texteingabe (mehrzeilig)';
  else if (tag === 'button') typeLabel = 'Button';
  else if (tag === 'select') typeLabel = 'Auswahlfeld';
  else if (tag === 'a') typeLabel = 'Link';
  else if (tag === 'img') typeLabel = 'Bild';
  else if (tag === 'label') typeLabel = 'Beschriftung';
  else if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') typeLabel = 'Überschrift';
  else if (tag === 'table') typeLabel = 'Tabelle';
  else if (tag === 'li') typeLabel = 'Listeneintrag';
  else typeLabel = 'Element (' + tag + ')';

  idEl.textContent = typeLabel + ': ' + id;
  idEl.style.color = '';
  inspectorOverlay.querySelector('.inspector-tooltip').style.borderColor = '';
  layerEl.textContent = `Ebene ${inspectorStackIdx + 1}/${inspectorStack.length}`;
  if (hintEl) hintEl.textContent = '↕ Mausrad • Klick = Kopieren';
}

function hideInspector() {
  if (inspectorOverlay) inspectorOverlay.style.display = 'none';
  inspectorStack = [];
  inspectorStackIdx = 0;
}

/**
 * Erzeugt eine KI-freundliche Element-ID als CSS-Selektor-Pfad.
 * Format: "tag.class1.class2#id[data-x] > parent > grandparent"
 * Diesen String kann eine KI nutzen, um das Element im DOM eindeutig zu identifizieren.
 */
function buildAIIdentifier(el) {
  if (!el || el === document.documentElement || el === document.body) return 'body';

  // Priorität: ID > data-Attribute > Klassen-Pfad
  if (el.id) return `#${el.id}`;

  // data-section oder data-testid
  const dataAttrs = [...el.attributes].filter(a => a.name.startsWith('data-') && a.name !== 'data-sort');
  if (dataAttrs.length > 0) {
    const attrStr = dataAttrs.map(a => `[${a.name}="${a.value}"]`).join('');
    const tag = el.tagName.toLowerCase();
    return `${tag}${attrStr}`;
  }

  // Baue Pfad aus Tag + Klassen (max 4 Ebenen)
  const parts = [];
  let current = el;
  let depth = 0;
  while (current && current !== document.body && depth < 4) {
    const tag = current.tagName.toLowerCase();
    const classes = [...(current.classList || [])]
      .filter(c => !c.startsWith('inspector') && c.length < 30)
      .slice(0, 2)
      .map(c => `.${c}`)
      .join('');

    // nth-of-type für Unterscheidung
    const parent = current.parentElement;
    let nth = '';
    if (parent && depth > 0) {
      const siblings = [...parent.children].filter(c => c.tagName === current.tagName);
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        nth = `:nth-of-type(${idx})`;
      }
    }

    parts.unshift(tag + classes + nth);
    current = current.parentElement;
    depth++;
  }

  return parts.join(' > ');
}

// ─── CHAT-02: Feld-KI – ✨ Buttons an allen Eingabefeldern ────────

/** Fügt ✨-Buttons zu allen inputs und textareas im Container hinzu */
export function injectFieldAIButtons(container = document) {
  container.querySelectorAll('input[type="text"], input[type="url"], input:not([type]), textarea').forEach(field => {
    // Skip fields that already have a button, or are hidden/file inputs
    if (field.closest('.pe-var-list')) return; // Skip variable list items
    if (field.closest('#chat-input')) return; // Skip chat input itself
    if (field.dataset.aiButton) return;
    if (field.type === 'file' || field.type === 'hidden' || field.type === 'password') return;
    if (field.offsetParent === null) return; // Skip hidden fields

    field.dataset.aiButton = '1';
    field.style.position = 'relative';

    const btn = document.createElement('button');
    btn.className = 'field-ai-btn';
    btn.innerHTML = '✨';
    btn.title = 'KI-Assistent für dieses Feld';
    btn.style.cssText = 'position:absolute;top:2px;right:2px;width:24px;height:24px;background:#0f446b;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;z-index:5;opacity:0.6;transition:opacity 0.15s;';
    btn.onmouseenter = () => btn.style.opacity = '1';
    btn.onmouseleave = () => btn.style.opacity = '0.6';

    // Find wrapper or parent for positioning context
    const wrapper = field.closest('.form-group') || field.parentElement;
    if (wrapper && getComputedStyle(wrapper).position === 'static') {
      wrapper.style.position = 'relative';
    }

    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Ermittle Feld-Kontext
      const label = field.closest('.form-group')?.querySelector('label, .form-label')?.textContent?.trim() || field.placeholder || field.name || 'Eingabefeld';
      const type = field.tagName === 'TEXTAREA' ? 'textarea' : 'input';
      const page = state.activeNav === 'kanal' ? 'Kanal-Setup' : ('Schritt ' + state.activeNav);

      state.aiActiveField = {
        element: field,
        label,
        type,
        page,
        currentValue: field.value || ''
      };

      // Feld highlighten
      field.style.boxShadow = '0 0 0 3px rgba(15,68,107,0.4)';
      field.style.borderColor = '#0f446b';
      field.dataset.aiActive = '1';

      // Sidebar zum Chat-Tab wechseln und öffnen
      state.activeSidebarTab = 'chat';
      const sidebar = document.getElementById('sidebar');
      if (sidebar && state.sidebarCollapsed) {
        state.sidebarCollapsed = false;
      }

      // Fokus auf Chat-Input
      setTimeout(() => {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) chatInput.focus();
      }, 200);
    };

    wrapper.appendChild(btn);
  });
}

/** Entfernt Feld-Highlight nach Übertragen/Schließen */
export function clearActiveField() {
  if (state.aiActiveField?.element) {
    const el = state.aiActiveField.element;
    el.style.boxShadow = '';
    el.style.borderColor = '';
    delete el.dataset.aiActive;
  }
  state.aiActiveField = null;
}

// MutationObserver: Neue Felder automatisch mit ✨ Buttons versehen (debounced)
let fieldInjectTimer = null;
const fieldObserver = new MutationObserver(() => {
  clearTimeout(fieldInjectTimer);
  fieldInjectTimer = setTimeout(() => injectFieldAIButtons(document.body), 300);
});
fieldObserver.observe(document.body, { childList: true, subtree: true });

// Injektiere Buttons auch bei Seitenwechsel (zusätzlich zu MutationObserver)
watch('activeNav', () => {
  setTimeout(() => injectFieldAIButtons(document.getElementById('workspace')), 600);
});

// ─── Bootstrap ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
