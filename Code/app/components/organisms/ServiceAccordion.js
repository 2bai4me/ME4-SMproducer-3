/**
 * ServiceAccordion – Harmonium-effect accordion for microservices within a page.
 *
 * Components:
 * - service-panel: wraps a single microservice, click header to toggle open/close
 * - Harmonium effect: only ONE panel open at a time within the same accordion
 */

/**
 * Create an accordion panel and append it to the container.
 * @param {HTMLElement} container
 * @param {{ number: number, title: string, status?: 'done'|'error'|'running'|'none', body?: string, open?: boolean }} config
 * @returns {HTMLElement} The created panel element
 */
export function createAccordion(container, config) {
  const panel = document.createElement('div');
  panel.className = `service-panel ${config.open ? 'open' : ''}`;
  if (config.id) panel.id = config.id;
  panel.innerHTML = `
    <div class="service-panel-header">
      <span class="service-panel-number">${config.number}</span>
      <span class="service-panel-title">${config.title}</span>
      ${config.status && config.status !== 'none'
        ? `<span class="service-panel-status ${config.status}">${statusLabel(config.status)}</span>`
        : ''}
      <span class="service-panel-chevron">▶</span>
    </div>
    <div class="service-panel-body">
      ${config.body || ''}
    </div>
  `;

  // Harmonium effect – close all sibling panels when opening this one
  const header = panel.querySelector('.service-panel-header');
  header.addEventListener('click', () => {
    const isOpen = panel.classList.contains('open');

    // Close all panels in this accordion
    container.querySelectorAll('.service-panel').forEach(p => p.classList.remove('open'));

    // Open this one if it was closed
    if (!isOpen) {
      panel.classList.add('open');
    }
  });

  container.appendChild(panel);
  return panel;
}

function statusLabel(status) {
  switch (status) {
    case 'done': return '✔ Erledigt';
    case 'error': return '✘ Fehler';
    case 'running': return '◌ Läuft';
    default: return '';
  }
}
