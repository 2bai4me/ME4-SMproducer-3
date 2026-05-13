/**
 * Sidebar Component – Chat, Variablen, Info tabs
 *
 * MESM-UI-330: Header mit Avatar – Mockup: w-8 h-8 rounded-full bg-deep-blue, Bot/Info-Icon
 * MESM-UI-331: Tab-Styling – aktiv: text-crimson border-b-2 border-crimson bg-crimson/5
 * MESM-UI-332: Chat-Nachrichten Animation – slide-in bei neuen Nachrichten
 * MESM-UI-333: Typing-Indikator – 3 Punkte mit gestaffelter Bounce-Animation
 * MESM-UI-334: AutoResizeTextarea – Mockup: resize-none overflow-hidden min-h-[36px] max-h-[200px]
 * MESM-UI-335: Variablen-Tab – klickbare Cards, Expand/Collapse, Copy-Button
 * MESM-UI-336: Info-Tab – ElementInfo-Cards, Hint-Box, FieldTypeCard, Leerzustand
 * MESM-UI-337: Mobile Toggle – fixed right-4 bottom-4 w-12 h-12 bg-crimson rounded-full lg:hidden
 * MESM-UI-338: Collapsed Indicator – wenn Sidebar nicht offen, Button zum Öffnen
 */

import { state, esc } from '../shared/state.js';
import { api } from '../shared/api.js';

/* SVG Icons */
const BOT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/></svg>`;

const SEND_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;

const CHAT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

const VARS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`;

const INFO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;

let chatMessages = [
  { id: '1', role: 'bot', content: 'Hallo! Wie kann ich helfen?' }
];

export function renderSidebar() {
  const el = document.getElementById('sidebar');
  if (!el) return;

  const collapsed = state.sidebarCollapsed;

  if (collapsed) {
    el.innerHTML = `
      <button class="sidebar-expand-btn" id="sidebar-expand-btn" title="Sidebar ausklappen" style="
        position:absolute; left:-16px; top:50%; transform:translateY(-50%);
        width:32px; height:48px; background:#0f446b; color:#fff; border:none;
        border-radius:8px 0 0 8px; cursor:pointer; z-index:10;
        display:flex; align-items:center; justify-content:center; font-size:0.8rem;">▶</button>
    `;
    document.getElementById('sidebar-expand-btn').onclick = () => {
      state.sidebarCollapsed = false;
    };
    return;
  }

  el.innerHTML = `
    <!-- Collapse-Toggle -->
    <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" title="Sidebar einklappen" style="
      position:absolute; left:-16px; top:50%; transform:translateY(-50%);
      width:32px; height:48px; background:#0f446b; color:#fff; border:none;
      border-radius:8px 0 0 8px; cursor:pointer; z-index:10;
      display:flex; align-items:center; justify-content:center; font-size:0.8rem;">◀</button>

    <!-- MESM-UI-330: Header mit Avatar -->
    <div style="padding:var(--space-3);border-bottom:1px solid var(--color-border);display:flex;align-items:center;gap:var(--space-3);flex-shrink:0;">
      <div style="width:32px;height:32px;border-radius:50%;background:var(--color-accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${BOT_ICON}
      </div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:var(--text-sm);color:var(--color-text);">KI-Assistent</div>
        <div style="font-size:var(--text-xs);color:var(--color-success);display:flex;align-items:center;gap:4px;">
          <span style="width:6px;height:6px;border-radius:50%;background:var(--color-success);display:inline-block;"></span>
          Online
        </div>
      </div>
    </div>

    <!-- MESM-UI-331: 3 Tabs – Chat, Variablen, Info -->
    <div class="sidebar-tabs">
      <button class="sidebar-tab ${state.activeSidebarTab === 'chat' ? 'active' : ''}" data-tab="chat">
        ${CHAT_ICON} <span style="margin-left:4px;">Chat</span>
      </button>
      <button class="sidebar-tab ${state.activeSidebarTab === 'variablen' ? 'active' : ''}" data-tab="variablen">
        ${VARS_ICON} <span style="margin-left:4px;">Variablen</span>
      </button>
      <button class="sidebar-tab ${state.activeSidebarTab === 'info' ? 'active' : ''}" data-tab="info">
        ${INFO_ICON} <span style="margin-left:4px;">Info</span>
      </button>
    </div>
    <div class="sidebar-content" id="sidebar-content"></div>

    <!-- MESM-UI-337: Mobile Toggle Button -->
    <button class="mobile-chat-toggle" id="mobile-chat-toggle" title="Chat schließen">
      ✕
    </button>
  `;

  // Wire tabs
  el.querySelectorAll('.sidebar-tab').forEach(btn => {
    btn.onclick = () => {
      state.activeSidebarTab = btn.dataset.tab;
    };
  });

  // Sidebar collapse toggle
  document.getElementById('sidebar-collapse-btn')?.addEventListener('click', () => {
    state.sidebarCollapsed = true;
  });

  // Mobile toggle
  const mobileToggle = document.getElementById('mobile-chat-toggle');
  if (mobileToggle) {
    mobileToggle.onclick = () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.style.display = 'none';
    };
  }

  renderSidebarContent();
}

export function renderSidebarContent() {
  const el = document.getElementById('sidebar-content');
  if (!el) return;

  switch (state.activeSidebarTab) {
    case 'chat':
      renderChatTab(el);
      break;
    case 'variablen':
      renderVariablenTab(el);
      break;
    case 'info':
      renderInfoTab(el);
      break;
  }
}

/* ─── MESM-UI-332/333/334: Chat-Tab ─────────────────────────── */
function renderChatTab(el) {
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;">
    <div class="chat-messages" id="chat-messages" style="flex:1;overflow-y:auto;">
      ${chatMessages.map(m => `
        <div class="chat-msg ${m.role} fade-in-msg">
          ${esc(m.content)}
        </div>
      `).join('')}
      <div id="typing-indicator" style="display:none;padding:var(--space-2) var(--space-3);">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
    <div class="chat-input-area" style="position:relative;">
      <button class="btn btn-sm" id="chat-prompts-btn" title="Prompt-Vorlagen" style="flex-shrink:0;padding:4px 8px;background:#e8f0f8;border:1px solid #d0d5dd;border-radius:6px;cursor:pointer;font-size:0.9rem;">📋</button>
      <textarea class="form-input" id="chat-input" placeholder="Nachricht senden..." rows="1"
        style="flex:1;resize:none;overflow:hidden;min-height:36px;max-height:200px;font-family:var(--font-body);"></textarea>
      <button class="btn btn-primary btn-sm" id="chat-send" style="flex-shrink:0;padding:var(--space-2) var(--space-3);">
        ${SEND_ICON}
      </button>
    </div>
    <div id="chat-prompts-popup" style="display:none;position:fixed;background:#fff;border:1px solid #d0d5dd;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.25);max-height:220px;overflow-y:auto;z-index:9999;width:280px;"></div>
    </div>
  `;

  // Wire chat send
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');

  /* MESM-UI-334: AutoResizeTextarea */
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 200) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  sendBtn.onclick = sendChatMessage;

  // CHAT-04: Prompt-Vorlagen Button
  const promptsBtn = document.getElementById('chat-prompts-btn');
  const promptsPopup = document.getElementById('chat-prompts-popup');
  promptsBtn?.addEventListener('click', async () => {
    if (promptsPopup.style.display === 'block') {
      promptsPopup.style.display = 'none';
      return;
    }
    // Positioniere Popup über dem Button
    const btnRect = promptsBtn.getBoundingClientRect();
    promptsPopup.style.left = Math.max(8, btnRect.left - 240) + 'px';
    promptsPopup.style.top = Math.max(8, btnRect.top - 230) + 'px';

    // Lade Prompts aus Channel-Settings
    let prompts = [];
    try {
      const settings = await api.getChannelSettings(state.activeChannelPrefix);
      const raw = settings?.chat_prompts || '[]';
      prompts = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (_) {}
    if (prompts.length === 0) {
      promptsPopup.innerHTML = '<div style="padding:12px;color:#9ca3af;font-size:0.8rem;">Keine Vorlagen. In Einstellungen → 💬 Chat-Prompts anlegen.</div>';
    } else {
      promptsPopup.innerHTML = prompts.map((p, i) => `
        <div class="chat-prompt-item" data-idx="${i}" style="padding:8px 12px;cursor:pointer;font-size:0.8rem;border-bottom:1px solid #f3f4f6;"
             onmouseenter="this.style.background='#f0f7ff'" onmouseleave="this.style.background=''">
          <div style="font-weight:600;color:#1a1a2e;">${esc(p.label)}</div>
          <div style="color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.text.substring(0, 80))}</div>
        </div>
      `).join('');
      promptsPopup.querySelectorAll('.chat-prompt-item').forEach(item => {
        item.onclick = () => {
          const prompt = prompts[parseInt(item.dataset.idx)];
          if (prompt) {
            const input = document.getElementById('chat-input');
            if (input) { input.value = prompt.text; }
          }
          promptsPopup.style.display = 'none';
          // Sofort absenden
          sendChatMessage();
        };
      });
    }
    promptsPopup.style.display = 'block';
  });
  // Popup schließen bei Klick außerhalb
  document.addEventListener('click', (e) => {
    if (!promptsBtn?.contains(e.target) && !promptsPopup?.contains(e.target)) {
      if (promptsPopup) promptsPopup.style.display = 'none';
    }
  });

  // Scroll to bottom
  const msgContainer = document.getElementById('chat-messages');
  if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input?.value?.trim();
  if (!msg) return;

  chatMessages.push({ id: Date.now().toString(), role: 'user', content: msg });
  appendMessage('user', msg);

  input.value = '';
  input.style.height = 'auto';
  showTyping(true);

  let response;
  try {
    // CHAT-01: Kriterien-Befehle erkennen
    response = await handleCriteriaCommand(msg);
    if (!response) {
      // CHAT-02: Feld-KI Modus
      if (state.aiActiveField) {
        response = await handleFieldAI(msg);
      } else {
        response = await handleLLMChat(msg);
      }
    }
  } catch (err) {
    response = 'Fehler: ' + err.message;
  }

  showTyping(false);
  chatMessages.push({ id: Date.now().toString(), role: 'bot', content: response });
  appendMessage('bot', response);

  // CHAT-02: Übertragen-Button wenn Feld aktiv
  if (state.aiActiveField) {
    appendTransferButton();
  }
}

/** CHAT-01: Erkennt Kriterien-Befehle */
async function handleCriteriaCommand(msg) {
  const prefix = state.activeChannelPrefix;
  if (!prefix) return null;
  const ml = msg.toLowerCase();

  // "neues kriterium audio: keyword 'x'"
  const newMatch = msg.match(/neues?\s+kriterium\s+(audio|research|slides)\s*[:\-]\s*(.+)/i);
  if (newMatch) {
    const typ = newMatch[1].toLowerCase();
    const rest = newMatch[2];
    const kwMatch = rest.match(/keyword\s*['"](.+?)['"]/i);
    if (!kwMatch) return 'Bitte gib ein Keyword an: keyword "..."';
    const keyword = kwMatch[1];
    const katMatch = rest.match(/kategorie\s*['"](.+?)['"]/i);
    const kategorie = katMatch ? katMatch[1] : '';
    const prompt_snippet = rest.replace(kwMatch[0], '').replace(katMatch ? katMatch[0] : '', '').replace(/[,;]/g, '').trim() || keyword;
    await api.saveKriterium(prefix, { typ, keyword, kategorie, prompt_snippet });
    return '✅ Kriterium "' + keyword + '" (' + typ + ') angelegt in Kanal ' + prefix + '.';
  }

  // "zeige kriterien [audio]"
  const showMatch = msg.match(/zeige\s+kriterien\s*(audio|research|slides)?/i);
  if (showMatch) {
    const typ = showMatch[1]?.toLowerCase();
    const list = await api.getKriterien(prefix, typ);
    if (list.length === 0) return 'Keine Kriterien' + (typ ? ' für ' + typ : '') + ' in Kanal ' + prefix + '.';
    return '📋 Kriterien' + (typ ? ' (' + typ + ')' : '') + ' in ' + prefix + ':\n' + list.map(k => '  • [' + k.typ + '] ' + k.keyword + ' (' + (k.kategorie || '-') + ')').join('\n');
  }

  // "suche kriterium [audio] 'keyword'"
  const searchMatch = msg.match(/suche\s+kriterium\s*(audio|research|slides)?\s*['"](.+?)['"]/i);
  if (searchMatch) {
    const typ = searchMatch[1]?.toLowerCase();
    const kw = searchMatch[2];
    const list = await api.getKriterien(prefix, typ);
    const found = list.filter(k => k.keyword.toLowerCase().includes(kw.toLowerCase()));
    if (found.length === 0) return 'Kein Kriterium mit "' + kw + '" gefunden.';
    return '🔍 Gefunden:\n' + found.map(k => '  • [' + k.typ + '] ' + k.keyword + ' → ' + (k.prompt_snippet || '(leer)')).join('\n');
  }

  // "loesche kriterium 'keyword'" oder "loesche kriterium 5"
  const delMatch = msg.match(/l(ö|oe)sche\s+kriterium\s+['"]?(.+?)['"]?\s*$/i);
  if (delMatch) {
    const idOrKw = delMatch[2].trim();
    // Check if it's a number (ID) or string (keyword)
    if (/^\d+$/.test(idOrKw)) {
      await api.deleteKriterium(prefix, parseInt(idOrKw));
      return '🗑️ Kriterium #' + idOrKw + ' gelöscht aus Kanal ' + prefix + '.';
    } else {
      // Search by keyword and delete first match
      const list = await api.getKriterien(prefix);
      const found = list.find(k => k.keyword.toLowerCase() === idOrKw.toLowerCase());
      if (!found) return 'Kriterium "' + idOrKw + '" nicht gefunden.';
      await api.deleteKriterium(prefix, found.id);
      return '🗑️ Kriterium "' + found.keyword + '" (' + found.typ + ') gelöscht.';
    }
  }

  // "verbessere kriterium 'keyword'" → KI generiert prompt_snippet
  const improveMatch = msg.match(/verbessere\s+kriterium\s+['"](.+?)['"]/i);
  if (improveMatch) {
    const kw = improveMatch[1];
    const list = await api.getKriterien(prefix);
    const found = list.find(k => k.keyword.toLowerCase() === kw.toLowerCase());
    if (!found) return 'Kriterium "' + kw + '" nicht gefunden.';

    // KI generiert verbessertes prompt_snippet
    const llmResp = await api.callLLM({
      systemPrompt: 'Du bist Prompt-Engineer. Erstelle einen optimalen Prompt-Snippet für ein Kriterium. Nur den Text zurueckgeben.',
      userMessage: `Bereich: ${found.typ}, Keyword: ${found.keyword}, Kategorie: ${found.kategorie || 'Allgemein'}. Erstelle einen praezisen Prompt-Snippet (1-2 Saetze).`
    });
    const improved = llmResp.response || llmResp.text || found.prompt_snippet;
    await api.saveKriterium(prefix, { ...found, prompt_snippet: improved });
    return '✨ Kriterium "' + kw + '" verbessert:\n' + improved;
  }

  // "importiere kriterien: [liste]" → Massenimport
  const importMatch = msg.match(/importiere\s+kriterien\s*[:\-]\s*(.+)/is);
  if (importMatch) {
    const text = importMatch[1];
    // Einfache Liste parsen: "audio: kw1 (Kat1), kw2 (Kat2)"
    const items = [];
    const lines = text.split(/[;\n]/);
    for (const line of lines) {
      const m = line.match(/(audio|research|slides)\s*[:\-]\s*(.+)/i);
      if (m) {
        const typ = m[1].toLowerCase();
        const rest = m[2];
        const parts = rest.split(/\s*,\s*/);
        for (const p of parts) {
          const kwm = p.match(/['"]?(.+?)['"]?\s*(?:\((.+?)\))?$/);
          if (kwm) {
            items.push({ typ, keyword: kwm[1].trim(), kategorie: (kwm[2] || '').trim(), prompt_snippet: kwm[1].trim() });
          }
        }
      }
    }
    if (items.length === 0) return 'Format: importiere kriterien: audio: "KW1" (Kat1), "KW2"';
    const result = await api.importKriterien(prefix, items);
    return '📥 ' + result.imported + ' neu, ' + (result.updated || 0) + ' aktualisiert' + (result.errors?.length ? ', ' + result.errors.length + ' Fehler' : '');
  }

  return null;
}

/** CHAT-02: Feld-KI */
async function handleFieldAI(msg) {
  const field = state.aiActiveField;
  if (!field) return null;
  const sys = 'Du bist KI-Assistent fuer das Feld "' + field.label + '" (' + field.type + '). Aktueller Inhalt: "' + (field.currentValue || '(leer)') + '". Seite: ' + (field.page || 'unbekannt') + '. Generiere passende Antwort fuer: ' + msg;
  return await callLLM(sys, msg);
}

/** LLM-Chat – mit Kriterien-Kontext */
async function handleLLMChat(msg) {
  const prefix = state.activeChannelPrefix || 'kein Kanal';
  const sysPrompt = [
    'Du bist der KI-Assistent von MESM 3.0. Aktiver Kanal: ' + prefix + '.',
    '',
    'DATENBANK: Kanal-DB (<prefix>.db) mit Tabelle kriterien:',
    '  - typ: "audio" | "research" | "slides"',
    '  - keyword: TEXT (eindeutig pro typ)',
    '  - kategorie: TEXT',
    '  - prompt_snippet: TEXT',
    '',
    'BEFEHLE (erkannt vom System):',
    '  "neues kriterium audio: keyword \'x\' kategorie \'y\'" → Kriterium anlegen',
    '  "zeige kriterien [audio]" → Alle Kriterien auflisten',
    '  "suche kriterium \'keyword\'" → Kriterium suchen',
    '  "loesche kriterium \'keyword\'" → Kriterium löschen',
    '  "verbessere kriterium \'keyword\'" → KI generiert prompt_snippet',
    '  "importiere kriterien: audio: \'kw1\' (Kat1), \'kw2\'" → Massenimport',
    '',
    'Fuer andere Fragen hilfst du allgemein zum Thema Social-Media-Videoproduktion.',
  ].join('\n');
  return await callLLM(sysPrompt, msg);
}

async function callLLM(systemPrompt, userMessage) {
  // Keine Metadaten, nur reines Ergebnis
  const cleanInstruction = '\n\nWICHTIG: Antworte NUR mit dem Ergebnis. Keine Einleitung, keine Erklärung, keine Metadaten, keine Anführungszeichen. Nur das reine Ergebnis.';
  try {
    const result = await api.callLLM({ systemPrompt, userMessage: userMessage + cleanInstruction });
    return result.response || result.text || JSON.stringify(result);
  } catch (e) {
    return '(LLM nicht erreichbar: ' + e.message + ')';
  }
}

function appendMessage(role, content) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = `chat-msg ${role} fade-in-msg`;
  div.textContent = content;
  container.insertBefore(div, document.getElementById('typing-indicator'));
  container.scrollTop = container.scrollHeight;
}

/* MESM-UI-333: Typing-Indikator */
function showTyping(show) {
  const el = document.getElementById('typing-indicator');
  if (!el) return;
  el.style.display = show ? 'flex' : 'none';
  const container = document.getElementById('chat-messages');
  if (container) container.scrollTop = container.scrollHeight;
}

/* CHAT-02: Übertragen-Button für Feld-KI */
function appendTransferButton() {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  // Alte Buttons entfernen
  container.querySelectorAll('.transfer-btn-row').forEach(b => b.remove());

  const row = document.createElement('div');
  row.className = 'transfer-btn-row';
  row.style.cssText = 'display:flex;gap:8px;padding:8px 0;justify-content:flex-end;';
  row.innerHTML = `
    <button class="transfer-cancel" style="padding:6px 14px;background:#e5e7eb;color:#374151;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;">Abbrechen</button>
    <button class="transfer-apply" style="padding:6px 14px;background:#0f446b;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem;font-weight:600;">📥 Übertragen</button>
  `;

  row.querySelector('.transfer-apply').onclick = () => {
    const field = state.aiActiveField;
    if (field?.element) {
      const lastBotMsg = [...container.querySelectorAll('.chat-msg.bot')].pop();
      if (lastBotMsg) {
        // Text bereinigen: keine Präfixe, keine Quotes
        let text = lastBotMsg.textContent;
        // Entferne gängige Präfixe wie "Korrigierter Text:", "Optimierter Prompt:", etc.
        text = text.replace(/^(Korrigierter Text|Optimierter Prompt|Verbesserter Text|Antwort|Ergebnis)\s*[:：]\s*/i, '');
        // Entferne umschließende Anführungszeichen
        text = text.replace(/^["„『](.+)["“』]$/s, '$1');
        text = text.trim();
        field.element.value = text;
        field.element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    clearFieldHighlight();
  };

  row.querySelector('.transfer-cancel').onclick = () => clearFieldHighlight();

  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function clearFieldHighlight() {
  if (state.aiActiveField?.element) {
    const el = state.aiActiveField.element;
    el.style.boxShadow = '';
    el.style.borderColor = '';
    delete el.dataset.aiActive;
  }
  state.aiActiveField = null;
  // Entferne Transfer-Buttons
  document.querySelectorAll('.transfer-btn-row').forEach(b => b.remove());
}

/* ─── MESM-UI-335: Variablen-Tab ──────────────────────────── */
async function renderVariablenTab(el) {
  if (!state.activeChannelPrefix) { el.innerHTML = "<div class=empty-state>Kein Kanal.</div>"; return; }
  const pid = state.activeProjectId || "no-project";
  el.innerHTML = "<div style=text-align:center;padding:2rem;color:#6b7280;>⏳ Lade Variablen...</div>";
  try {
    const resp = await fetch("http://localhost:3001/api/variablen/" + state.activeChannelPrefix + "/" + pid);
    const allVars = await resp.json();
    if (!Array.isArray(allVars) || allVars.length === 0) {
      el.innerHTML = "<div class=empty-state><p>Keine Variablen.</p><p style=font-size:0.7rem;>Projekt: " + esc(pid) + "</p></div>";
      return;
    }

    // Datenbank-Filter Dropdown
    const dbs = [...new Set(allVars.map(v => v.database || 'Sonstige'))].sort();
    let filterHtml = '<select id="var-db-filter" style="width:100%;margin-bottom:0.8rem;padding:4px 8px;font-size:0.7rem;border:1px solid #d1d5db;border-radius:4px;"><option value="">Alle Datenbanken (' + allVars.length + ')</option>';
    dbs.forEach(db => { filterHtml += '<option value="' + esc(db) + '">' + esc(db) + '</option>'; });
    filterHtml += '</select>';

    let renderVars = (filter) => {
      const filtered = filter ? allVars.filter(v => (v.database||'') === filter) : allVars;
      const groups = {};
      filtered.forEach(v => { const k = v.database || v.table_name || "Sonstige"; if(!groups[k]) groups[k]=[]; groups[k].push(v); });
      let html = filterHtml;
      for (const [group, vars] of Object.entries(groups)) {
        html += "<div style=margin-bottom:0.8rem;><h4 style=font-size:0.7rem;font-weight:700;color:#0f446b;margin:0 0 4px 0;padding:3px 8px;background:#e8f0f8;border-radius:4px;>" + esc(group) + " (" + vars.length + ")</h4>";
        for (const v of vars) {
          const name = v.tech_name || v.name || "?";
          const placeholder = v.placeholder || '{{' + name + '}}';
          const val = v.wert || v.value || '';
          const isRuntime = v.var_typ === 'runtime';
          const bgColor = isRuntime ? '#fef3c7' : 'transparent';
          html += "<div class=var-card draggable=true data-varname=" + esc(name) + " style=padding:6px 8px;margin-bottom:3px;border:1px solid #e5e7eb;border-radius:4px;cursor:grab;font-size:0.72rem;background:" + bgColor + ";>";
          html += "<div style=display:flex;justify-content:space-between;align-items:center;>";
          html += "<code style=color:#0f446b;font-size:0.7rem;>" + esc(placeholder) + "</code>";
          html += "<span style=color:#6b7280;font-size:0.6rem;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;title=\"" + esc(val) + "\">" + esc(val.substring(0,25)) + (val.length>25?'…':'') + "</span>";
          html += "</div>";
          html += "<div style=display:flex;justify-content:space-between;margin-top:2px;>";
          html += "<span style=color:#9ca3af;font-size:0.55rem;>" + esc(v.table_name||'') + "</span>";
          html += "<span style=color:#9ca3af;font-size:0.55rem;>" + esc(name) + " · " + esc(v.bereich||'') + "</span>";
          html += "</div>";
          html += "<button class=var-copy-btn data-value=" + esc(placeholder) + " style=background:none;border:none;cursor:pointer;font-size:0.8rem;padding:0 2px;>📋</button>";
          html += "<button class=var-eye-btn data-fullval=\"" + esc(val).replace(/"/g,'&quot;') + "\" data-name=\"" + esc(name) + "\" style=background:none;border:none;cursor:pointer;font-size:0.8rem;padding:0 2px;opacity:0.5;>👁</button>";
          html += "</div>";
        }
        html += "</div>";
      }
      return html;
    };

    el.innerHTML = renderVars('');

    // Filter-Handler (delegiert, wird bei jedem re-render neu gebunden)
    const attachFilter = () => {
      document.getElementById('var-db-filter')?.addEventListener('change', (e) => {
        el.innerHTML = renderVars(e.target.value);
        wireVarButtons(el);
        attachFilter();
      });
    };
    attachFilter();

    wireVarButtons(el);
  } catch(e) { el.innerHTML = "<div class=empty-state><p>Fehler: " + esc(e.message) + "</p></div>"; }
}

function wireVarButtons(el) {
    el.querySelectorAll(".var-copy-btn").forEach(btn => {
      btn.onclick = (e) => { e.stopPropagation(); navigator.clipboard.writeText(btn.dataset.value); btn.textContent="✓"; setTimeout(()=>{btn.textContent="📋";},1200); };
    });
    el.querySelectorAll(".var-eye-btn").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const name = btn.dataset.name;
        const val = btn.dataset.fullval || '(leer)';
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
        overlay.onclick = () => overlay.remove();
        overlay.innerHTML = '<div onclick="event.stopPropagation()" style="background:#fff;border-radius:12px;padding:1.5rem;max-width:500px;width:90%;max-height:70vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.3);"><h4 style="margin:0 0 0.5rem;color:#0f446b;">{{' + esc(name) + '}}</h4><pre style="white-space:pre-wrap;font-size:0.8rem;line-height:1.4;background:#f9fafb;padding:1rem;border-radius:8px;border:1px solid #e5e7eb;">' + esc(val || '(leer)') + '</pre><button style="margin-top:0.8rem;padding:6px 16px;background:#0f446b;color:#fff;border:none;border-radius:6px;cursor:pointer;">Schließen</button></div>';
        overlay.querySelector('button').onclick = () => overlay.remove();
        document.body.appendChild(overlay);
      };
    });
    el.querySelectorAll(".var-card[draggable]").forEach(card => {
      card.ondragstart = (e) => { e.dataTransfer.setData("text/plain","{{" + card.dataset.varname + "}}"); card.style.opacity="0.5"; };
      card.ondragend = () => { card.style.opacity="1"; };
    });
}
function renderInfoTab(el) {
  const info = state.elementInfo;

  if (!info) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${INFO_ICON}</div>
        <div class="empty-state-title">Noch kein Element ausgewählt</div>
        <div class="empty-state-text">Strg+Klick auf ein Eingabefeld, um Element-Informationen anzuzeigen.</div>
      </div>
      <!-- MESM-UI-336: Hint-Box -->
      <div style="margin-top:var(--space-4);padding:var(--space-3);background:rgba(15,68,107,0.05);border:1px solid var(--color-border);border-radius:var(--radius-lg);">
        <div style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--text-xs);color:var(--color-text-muted);">
          ${INFO_ICON}
          <span><strong>Strg+Klick</strong> auf ein Feld zeigt hier detaillierte Informationen zum Element.</span>
        </div>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div style="font-size:var(--text-sm);">
      <h4 style="margin-bottom:var(--space-4);color:var(--color-text);font-weight:600;display:flex;align-items:center;gap:var(--space-2);">
        ${INFO_ICON} Element-Info
      </h4>

      <!-- ElementInfo-Card: Bezeichnung -->
      <div style="padding:var(--space-3);background:rgba(198,0,36,0.05);border:1px solid var(--color-border);border-radius:var(--radius-lg);margin-bottom:var(--space-3);">
        <div style="font-size:0.625rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-dim);margin-bottom:2px;">Bezeichnung</div>
        <div style="font-weight:600;color:var(--color-text);">${esc(info.name)}</div>
      </div>

      <!-- ElementInfo-Card: Typ -->
      <div style="padding:var(--space-3);background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:var(--radius-lg);margin-bottom:var(--space-3);">
        <div style="font-size:0.625rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-dim);margin-bottom:2px;">Element-Typ</div>
        <span style="display:inline-block;background:var(--color-accent);color:white;border-radius:var(--radius-sm);padding:2px 8px;font-size:var(--text-xs);font-family:var(--font-mono);">${esc(info.type)}</span>
      </div>

      ${info.context ? `
      <!-- ElementInfo-Card: Kontext -->
      <div style="padding:var(--space-3);background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:var(--radius-lg);margin-bottom:var(--space-3);">
        <div style="font-size:0.625rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-dim);margin-bottom:2px;">Kontext / Bereich</div>
        <div style="color:var(--color-text);">${esc(info.context)}</div>
      </div>
      ` : ''}

      <!-- ElementInfo-Card: Beschreibung -->
      <div style="padding:var(--space-3);background:var(--color-bg-elevated);border:1px solid var(--color-border);border-radius:var(--radius-lg);margin-bottom:var(--space-3);">
        <div style="font-size:0.625rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--color-text-dim);margin-bottom:2px;">Beschreibung</div>
        <div style="color:var(--color-text-muted);line-height:1.6;">${esc(info.description)}</div>
      </div>
    </div>
  `;
}
