/**
 * Navigator Component – 7 navigation items (6 steps + Kanal)
 *
 * MESM-UI-310: Sidebar-Collapse
 *   Mockup: fixed left-0 top-16 bottom-0, w-60 ↔ w-16, transition-all duration-300
 *   Collapse-Toggle: Chevron-Button absolute -right-3 top-4
 *
 * MESM-UI-310b: Tooltip im eingeklappten Zustand
 *   Mockup: absolute left-full ml-2, bg-deep-blue text-white, px-2 py-1 rounded text-xs
 *
 * MESM-UI-311: Nav-Item active state
 *   Mockup: bg-white text-deep-blue shadow-card border-l-4 border-crimson
 */

import { state, esc } from '../shared/state.js';

const NAV_ITEMS = [
  { id: '1', label: 'Thema', number: '1' },
  { id: '2', label: 'Research', number: '2' },
  { id: '3', label: 'Audio', number: '3' },
  { id: '4', label: 'Slides', number: '4' },
  { id: '5', label: 'Video', number: '5' },
  { id: '6', label: 'Upload', number: '6' },
  { id: 'kanal', label: 'Kanal', number: '⚙', isKanal: true },
];

export function renderNavigator() {
  const el = document.getElementById('navigator');
  if (!el) return;

  const collapsed = state.sidebarCollapsed;
  const items = NAV_ITEMS.map((item, index) => {
    const isActive = state.activeNav === item.id;
    const hasDivider = item.isKanal;
    return `
      ${hasDivider ? '<li class="nav-divider-wrapper"><hr class="nav-divider"></li>' : ''}
      <li class="nav-item ${isActive ? 'active' : ''} ${item.isKanal ? 'kanal' : ''} ${collapsed ? 'nav-collapsed' : ''}"
          data-nav="${item.id}" title="${collapsed ? item.label : ''}">
        <span class="nav-number ${collapsed ? 'nav-number-lg' : ''}">${item.number}</span>
        ${!collapsed ? `<span class="nav-label">${item.label}</span>` : ''}
        ${collapsed ? `<span class="nav-tooltip">${item.label}</span>` : ''}
      </li>
    `;
  });

  // Channel selector (hidden when collapsed)
  const channelOptions = state.channels.map(c =>
    `<option value="${esc(c.prefix)}" ${state.activeChannelPrefix === c.prefix ? 'selected' : ''}>${esc(c.prefix)} – ${esc(c.title)}</option>`
  ).join('');

  el.style.position = 'relative'; // For collapse button
  el.style.transition = 'width 300ms ease';

  el.innerHTML = `
    <!-- MESM-UI-310a: Collapse-Toggle-Button -->
    <button class="nav-collapse-btn" id="nav-collapse-btn" title="${collapsed ? 'Ausklappen' : 'Einklappen'}">
      ${collapsed ? '▶' : '◀'}
    </button>

    ${!collapsed ? `
    <div style="padding: 0 var(--space-5) var(--space-3);">
      <select class="form-select" id="nav-channel-select" style="font-size:0.8rem;">
        <option value="">-- Kanal wählen --</option>
        ${channelOptions}
      </select>
    </div>
    ` : ''}

    <ul class="nav-list" style="${collapsed ? 'padding: var(--space-2); display: flex; flex-direction: column; align-items: center; gap: var(--space-1);' : ''}">
      ${items.join('')}
    </ul>
  `;

  // Wire up collapse toggle
  document.getElementById('nav-collapse-btn').onclick = () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
  };

  // Wire up nav items
  el.querySelectorAll('.nav-item').forEach(li => {
    li.onclick = () => {
      state.activeNav = li.dataset.nav;
    };
  });

  // Wire channel selector
  const channelSelect = document.getElementById('nav-channel-select');
  if (channelSelect) {
    channelSelect.onchange = (e) => {
      const prefix = e.target.value;
      const channel = state.channels.find(c => c.prefix === prefix);
      if (channel) state.selectedChannel = channel;
    };
  }
}
