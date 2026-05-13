/**
 * KON-02: Prompt-Engineer – Zentraler Prompt-Editor für alle Bereiche
 *
 * Embeddable component: await PromptEngineer.mount(container, { prefix, bereich, projectId })
 *
 * Features:
 *  - Bereich-Dropdown (Thema|Research|Audio|Slides|Thumbnail)
 *  - Template-Selector aus prompt_templates (gefiltert nach section)
 *  - Template-Editor mit {{variablen}}-Platzhaltern
 *  - IMP-18: Variablen aus Projekt-DB (rechte Seitenleiste)
 *  - IMP-18: Drag & Drop von Variablen in den Editor
 *  - IMP-18: Suchfeld über Variablen-Liste
 *  - Resolved-Preview (Variablen aufgelöst, rot markiert)
 *  - Kriterien-Snippets aus KON-01
 *  - Zusatztext-Feld
 *  - "Prompt generieren" → LLM → optimierter Prompt
 *  - Editierbarer Output + Copy-Button
 */

import { api } from '../shared/api.js';
import { state, esc } from '../shared/state.js';

const BEREICHE = ['Thema', 'Research', 'Audio', 'Slides', 'Thumbnail'];

export const PromptEngineer = {
  /**
   * Mount the Prompt-Engineer into a container element.
   * @param {HTMLElement} container
   * @param {{ prefix: string, bereich: string, projectId?: string }} opts
   */
  async mount(container, opts = {}) {
    const prefix = opts.prefix || state.activeChannelPrefix;
    const initialBereich = opts.bereich || 'Audio';
    const projectId = opts.projectId || state.activeProjectId;

    if (!prefix) {
      container.innerHTML = '<p class="pe-warn">Kein aktiver Kanal. Bitte zuerst einen Kanal wählen.</p>';
      return;
    }

    // ─── Data ──────────────────────────────────────────────────
    let prompts = [];
    let variablen = [];
    let kriterien = [];
    let selectedPrompt = null;
    let selectedBereich = initialBereich;
    let generatedOutput = '';
    let loading = false;

    try {
      const fetches = [
        api.getPrompts(prefix).catch(() => []),
        api.getKriterien(prefix, initialBereich.toLowerCase()).catch(() => []),
      ];
      // IMP-18: Variablen aus Projekt-DB wenn projectId vorhanden
      if (projectId) {
        fetches.push(
          api.getProjektVariablen(prefix, projectId, initialBereich).catch(() => [])
        );
      } else {
        // Fallback: Kanal-Variablen
        fetches.push(
          api.getVariablen(prefix).catch(() => [])
        );
      }
      const results = await Promise.all(fetches);
      prompts = results[0];
      kriterien = results[1];
      variablen = results[2];
    } catch (_) { /* offline OK */ }

    // IMP-19: Lade Prompt-Kategorien aus channel_settings
    let kategorien = [];
    try {
      const settings = await api.getChannelSettings(prefix).catch(() => ({}));
      if (settings?.prompt_kategorien) {
        kategorien = JSON.parse(settings.prompt_kategorien);
      }
    } catch (_) { kategorien = []; }

    // ─── Render ─────────────────────────────────────────────────
    const bereichKey = selectedBereich.toLowerCase();
    const filteredPrompts = prompts.filter(p => p.section === bereichKey || p.section === selectedBereich);

    const katChips = kategorien.length
      ? kategorien.map(k => `<span class="pe-kat-chip" data-kat="${esc(k)}" title="Klicken zum Einfügen">${esc(k)}<button class="pe-kat-del" data-del="${esc(k)}">×</button></span>`).join('')
      : '<span class="pe-muted">Keine Kategorien</span>';

    container.innerHTML = `
      <div class="pe-container">
        <div class="pe-header">
          <h3>🧠 Prompt-Engineer</h3>
          <select class="pe-bereich" id="pe-bereich">
            ${BEREICHE.map(b => `<option value="${b}" ${b === selectedBereich ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>

        <!-- Kategorie-Management -->
        <div class="pe-kat-bar" style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;padding:0.5rem 0;margin-bottom:0.75rem;border-bottom:1px solid #e5e7eb;">
          <span style="font-size:0.8rem;font-weight:600;color:#6b7280;">🏷 Kategorien:</span>
          <div class="pe-kat-list" id="pe-kat-list" style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">${katChips}</div>
          <input id="pe-kat-input" placeholder="+ Neu" style="width:80px;padding:2px 6px;border:1px solid #d0d5dd;border-radius:4px;font-size:0.75rem;">
        </div>

        <div class="pe-layout">
          <!-- Linke Spalte: Editor -->
          <div class="pe-main">
            <!-- Template -->
            <div class="pe-field">
              <label>Template</label>
              <select class="pe-template-select" id="pe-template-select">
                <option value="">-- Neues Template --</option>
                ${filteredPrompts.map(p => `<option value="${p.id}">${p.id}</option>`).join('')}
              </select>
            </div>

            <!-- Editor -->
            <div class="pe-field">
              <label>Prompt-Template <span class="pe-hint">({{variablen}} werden automatisch ersetzt)</span></label>
              <textarea class="pe-editor" id="pe-editor" rows="4" placeholder="Prompt mit {{variablen}}-Platzhaltern...&#10;&#10;Variablen per Drag & Drop aus der rechten Liste einfügen."></textarea>
            </div>

            <!-- Resolved Preview -->
            <div class="pe-field">
              <label>Vorschau <span class="pe-hint">(aufgelöst)</span></label>
              <div class="pe-preview" id="pe-preview"></div>
            </div>

            <!-- Kriterien-Snippets -->
            <div class="pe-field">
              <label>Kriterien-Snippets <span class="pe-hint">(aus KON-01, zum Einfügen klicken)</span></label>
              <div class="pe-chips" id="pe-kriterien-chips">
                ${kriterien.length ? kriterien.map(k => `<button class="pe-chip pe-chip-krit" data-snippet="${esc(k.prompt_snippet)}">📌 ${esc(k.keyword)}</button>`).join('') : '<span class="pe-muted">Keine Kriterien für ' + selectedBereich + '</span>'}
              </div>
            </div>

            <!-- Extra -->
            <div class="pe-field">
              <label>Zusatztext <span class="pe-hint">(optional)</span></label>
              <textarea class="pe-editor pe-extra" id="pe-extra" rows="2" placeholder="Zusätzliche Anweisungen..."></textarea>
            </div>

            <!-- Generate Button -->
            <button class="pe-generate-btn" id="pe-generate-btn">
              ${loading ? '⏳ Generiere...' : '✨ Prompt generieren'}
            </button>

            <!-- Output -->
            <div class="pe-field pe-output-field" id="pe-output-field" style="display:none">
              <label>Optimierter Prompt</label>
              <textarea class="pe-editor pe-output" id="pe-output" rows="6" readonly></textarea>
              <button class="pe-copy-btn" id="pe-copy-btn">📋 Kopieren</button>
            </div>
          </div>

          <!-- IMP-18: Rechte Spalte – Variablen-Liste -->
          <div class="pe-sidebar">
            <div class="pe-sidebar-header">
              <label>📎 Variablen</label>
              ${!projectId ? '<span class="pe-hint">(Kanal)</span>' : ''}
            </div>
            <input type="text" class="pe-search" id="pe-var-search" placeholder="🔍 Suche...">
            <div class="pe-var-list" id="pe-var-list">
              ${variablen.length ? variablen.map(v => `
                <div class="pe-var-item" draggable="true" data-varname="${esc(v.name)}" title="${esc(v.description || '')}">
                  <span class="pe-var-name">{{${esc(v.name)}}}</span>
                  ${v.value ? `<span class="pe-var-value">${esc(v.value.substring(0, 30))}</span>` : ''}
                </div>
              `).join('') : `<span class="pe-muted">Keine Variablen${projectId ? ' im Projekt' : ''} definiert</span>`}
            </div>
          </div>
        </div>
      </div>
    `;

    // ─── Events ─────────────────────────────────────────────────

    const bereichSelect = container.querySelector('#pe-bereich');
    const templateSelect = container.querySelector('#pe-template-select');
    const editor = container.querySelector('#pe-editor');
    const preview = container.querySelector('#pe-preview');
    const extraField = container.querySelector('#pe-extra');
    const generateBtn = container.querySelector('#pe-generate-btn');
    const outputField = container.querySelector('#pe-output-field');
    const outputArea = container.querySelector('#pe-output');
    const copyBtn = container.querySelector('#pe-copy-btn');
    const varSearch = container.querySelector('#pe-var-search');
    const varList = container.querySelector('#pe-var-list');
    const katInput = container.querySelector('#pe-kat-input');
    const katList = container.querySelector('#pe-kat-list');

    // ─── Kategorie-Management ───────────────────────────────────
    async function saveKategorien() {
      try {
        await api.saveChannelSetting(prefix, 'prompt_kategorien', JSON.stringify(kategorien));
      } catch (_) { /* silently fail */ }
    }

    function renderKatList() {
      katList.innerHTML = kategorien.length
        ? kategorien.map(k => `<span class="pe-kat-chip" data-kat="${esc(k)}" title="Klicken zum Einfügen">${esc(k)}<button class="pe-kat-del" data-del="${esc(k)}" style="background:none;border:none;color:#999;cursor:pointer;padding:0 2px;font-size:0.8rem;">×</button></span>`).join('')
        : '<span class="pe-muted" style="font-size:0.75rem;">Keine Kategorien</span>';
      bindKatEvents();
    }

    function bindKatEvents() {
      katList.querySelectorAll('.pe-kat-chip').forEach(chip => {
        chip.onclick = (e) => {
          if (e.target.classList.contains('pe-kat-del')) return;
          const kat = chip.dataset.kat;
          extraField.value = (extraField.value + ' ' + kat).trim();
        };
      });
      katList.querySelectorAll('.pe-kat-del').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const del = btn.dataset.del;
          kategorien = kategorien.filter(k => k !== del);
          saveKategorien();
          renderKatList();
        };
      });
    }

    katInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const val = katInput.value.trim();
        if (val && !kategorien.includes(val)) {
          kategorien.push(val);
          saveKategorien();
          renderKatList();
        }
        katInput.value = '';
      }
    };
    bindKatEvents();

    // Bereich wechseln → neue Kriterien & Variablen laden
    bereichSelect.onchange = async () => {
      selectedBereich = bereichSelect.value;
      const bKey = selectedBereich.toLowerCase();

      // Kriterien neu laden
      kriterien = await api.getKriterien(prefix, bKey).catch(() => []);
      const kChips = container.querySelector('#pe-kriterien-chips');
      kChips.innerHTML = kriterien.length
        ? kriterien.map(k => `<button class="pe-chip pe-chip-krit" data-snippet="${esc(k.prompt_snippet)}">📌 ${esc(k.keyword)}</button>`).join('')
        : '<span class="pe-muted">Keine Kriterien für ' + selectedBereich + '</span>';
      bindKriterienChips(kChips);

      // Variablen nach Bereich filtern (IMP-18)
      if (projectId) {
        variablen = await api.getProjektVariablen(prefix, projectId, selectedBereich).catch(() => []);
      } else {
        variablen = await api.getVariablen(prefix).catch(() => []);
      }
      renderVarList(varList, variablen);

      // Template-Liste filtern
      const filtered = prompts.filter(p => p.section === bKey || p.section === selectedBereich);
      templateSelect.innerHTML = '<option value="">-- Neues Template --</option>' +
        filtered.map(p => `<option value="${p.id}">${p.id}</option>`).join('');
      updatePreview();
    };

    // Template gewählt
    templateSelect.onchange = () => {
      const selected = prompts.find(p => p.id === templateSelect.value);
      if (selected) {
        selectedPrompt = selected;
        editor.value = selected.template;
      } else {
        selectedPrompt = null;
        editor.value = '';
      }
      updatePreview();
    };

    // Editor Input → Preview updaten
    editor.oninput = () => updatePreview();

    // IMP-18: Suchfeld filtert Variablen-Liste
    varSearch.oninput = () => {
      const q = varSearch.value.toLowerCase();
      const items = varList.querySelectorAll('.pe-var-item');
      items.forEach(item => {
        const name = item.dataset.varname?.toLowerCase() || '';
        item.style.display = name.includes(q) ? '' : 'none';
      });
    };

    // IMP-18: Drag & Drop auf Editor
    editor.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    editor.addEventListener('drop', (e) => {
      e.preventDefault();
      const varName = e.dataTransfer.getData('text/plain');
      if (varName) {
        const pos = editor.selectionStart;
        const text = editor.value;
        editor.value = text.substring(0, pos) + `{{${varName}}}` + text.substring(pos);
        editor.focus();
        editor.setSelectionRange(pos + varName.length + 4, pos + varName.length + 4);
        updatePreview();
      }
    });

    // IMP-18: Drag-Start auf Variablen-Items
    varList.addEventListener('dragstart', (e) => {
      const item = e.target.closest('.pe-var-item');
      if (!item) return;
      e.dataTransfer.setData('text/plain', item.dataset.varname || '');
      e.dataTransfer.effectAllowed = 'copy';
      item.style.opacity = '0.5';
    });
    varList.addEventListener('dragend', (e) => {
      const item = e.target.closest('.pe-var-item');
      if (item) item.style.opacity = '';
    });

    // IMP-18: Doppelklick auf Variable → in Editor einfügen
    varList.addEventListener('dblclick', (e) => {
      const item = e.target.closest('.pe-var-item');
      if (!item) return;
      const varName = item.dataset.varname;
      if (varName) {
        editor.value += `{{${varName}}}`;
        editor.focus();
        updatePreview();
      }
    });

    // Kriterien-Chips klicken → in Extra-Feld einfügen
    bindKriterienChips(container.querySelector('#pe-kriterien-chips'));

    // Generate
    generateBtn.onclick = async () => {
      const template = editor.value.trim();
      if (!template) return;

      loading = true;
      generateBtn.textContent = '⏳ Generiere...';
      generateBtn.disabled = true;

      try {
        const result = await api.generatePrompt(prefix, {
          bereich: selectedBereich,
          template,
          extra: extraField.value.trim() || undefined,
          kriterien: kriterien.map(k => k.prompt_snippet),
        });

        generatedOutput = result.optimized;
        outputArea.value = generatedOutput;
        outputField.style.display = 'block';
      } catch (err) {
        outputArea.value = 'Fehler: ' + err.message;
        outputField.style.display = 'block';
      } finally {
        loading = false;
        generateBtn.textContent = '✨ Prompt generieren';
        generateBtn.disabled = false;
      }
    };

    // Copy
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(outputArea.value).then(() => {
        copyBtn.textContent = '✅ Kopiert!';
        setTimeout(() => (copyBtn.textContent = '📋 Kopieren'), 2000);
      });
    };

    // ─── Helper ─────────────────────────────────────────────────
    function updatePreview() {
      let text = editor.value || '';
      for (const v of variablen) {
        text = text.replace(new RegExp(`\\{\\{${v.name}\\}\\}`, 'g'),
          `<span class="pe-resolved">${esc(v.value || '[' + v.name + ']')}</span>`);
      }
      preview.innerHTML = text || '<span class="pe-muted">Prompt-Vorschau erscheint hier...</span>';
    }

    function bindKriterienChips(container) {
      container.onclick = (e) => {
        const btn = e.target.closest('.pe-chip-krit');
        if (!btn) return;
        const snippet = btn.dataset.snippet;
        extraField.value = (extraField.value + ' ' + snippet).trim();
      };
    }

    // Initial preview
    updatePreview();

    // ─── Public API ─────────────────────────────────────────────
    this._container = container;
    this.getOutput = () => generatedOutput;
    this.getTemplate = () => editor.value;
    this.getBereich = () => selectedBereich;
    this.refresh = async () => {
      prompts = await api.getPrompts(prefix).catch(() => []);
      if (projectId) {
        variablen = await api.getProjektVariablen(prefix, projectId, selectedBereich).catch(() => []);
      } else {
        variablen = await api.getVariablen(prefix).catch(() => []);
      }
      renderVarList(varList, variablen);
      updatePreview();
    };
  },

  /** Get the generated prompt text */
  getOutput() { return this._container?.querySelector('#pe-output')?.value || ''; },
  getTemplate() { return this._container?.querySelector('#pe-editor')?.value || ''; },
  getBereich() { return this._container?.querySelector('#pe-bereich')?.value || ''; },
};

/**
 * IMP-18: Render variable list with drag & drop support.
 */
function renderVarList(container, variablen) {
  if (!container) return;
  container.innerHTML = variablen.length
    ? variablen.map(v => `
      <div class="pe-var-item" draggable="true" data-varname="${esc(v.name)}" title="${esc(v.description || '')}">
        <span class="pe-var-name">{{${esc(v.name)}}}</span>
        ${v.value ? `<span class="pe-var-value">${esc(v.value.substring(0, 30))}</span>` : ''}
      </div>
    `).join('')
    : '<span class="pe-muted">Keine Variablen im Projekt definiert</span>';
}
