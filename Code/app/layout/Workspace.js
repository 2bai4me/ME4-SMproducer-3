/**
 * Workspace Router – renders the correct page based on activeNav
 */

import { state } from '../shared/state.js';

const pageLoaders = {
  'kanal': () => import('../pages/KanalPage.js').then(m => m.default),
  '1': () => import('../pages/ThemaPage.js').then(m => m.default),
  '2': () => import('../pages/ResearchPage.js').then(m => m.default),
  '3': () => import('../pages/AudioPage.js').then(m => m.default),
  '4': () => import('../pages/SlidesPage.js').then(m => m.default),
  '5': () => import('../pages/VideoPage.js').then(m => m.default),
  '6': () => import('../pages/UploadPage.js').then(m => m.default),
};

/**
 * Render the current page.
 * @returns {HTMLElement}
 */
export function renderPage() {
  const wrapper = document.createElement('div');

  const loader = pageLoaders[state.activeNav];
  if (!loader) {
    wrapper.innerHTML = '<p>Unbekannte Seite</p>';
    return wrapper;
  }

  // Show loading
  wrapper.innerHTML = '<div class="spinner" style="margin:var(--space-12) auto;"></div>';

  // Load page async with proper await so errors are caught
  loader().then(async (PageModule) => {
    wrapper.innerHTML = '';
    try {
      const pageFn = typeof PageModule === 'function' ? PageModule : (PageModule.default || null);
      if (!pageFn) {
        throw new Error('Page module has no default export');
      }
      // Await the async page function so errors inside pages are caught
      await pageFn(wrapper);
    } catch (err) {
      console.error('Page render error:', err);
      wrapper.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-title">Fehler beim Laden</div><div class="empty-state-text">' + err.message + '</div></div>';
    }
  }).catch(err => {
    console.error('Page load error:', err);
    wrapper.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠</div><div class="empty-state-title">Fehler beim Laden</div><div class="empty-state-text">' + err.message + '</div></div>';
  });

  return wrapper;
}
