/**
 * API Client – communicates with the smproducer-pipeline Express backend.
 */

const BASE = 'http://localhost:3001/api';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  // Channels
  getChannels:       ()           => request('GET', '/channels'),
  createChannel:     (ch)         => request('POST', '/channels', ch),
  updateChannel:     (id, ch)     => request('PUT', `/channels/${id}`, ch),
  deleteChannel:     (prefix)     => request('DELETE', `/channels/${prefix}`),
  archiveChannel:    (prefix)     => request('PUT', `/channels/${prefix}/archive`),
  restoreChannel:    (prefix)     => request('PUT', `/channels/${prefix}/restore`),
  getChannelStatus:  (prefix)     => request('GET', `/channels/${prefix}/archive`),
  deleteChannelId:   (id)         => request('DELETE', `/channels/${id}`),

  // Channel criteria (KON-01: Konsolidierte Tabelle mit typ-Flag)
  getKriterien:      (prefix, typ) => request('GET', `/channels/${prefix}/kriterien?typ=${typ || ''}`),
  saveKriterium:     (prefix, k) => request('POST', `/channels/${prefix}/kriterien`, k),
  deleteKriterium:   (prefix, id) => request('DELETE', `/channels/${prefix}/kriterien/${id}`),
  importKriterien:   (prefix, kriterien) => request('POST', `/channels/${prefix}/kriterien/import`, { kriterien }),
  parseKriterienFile: (prefix, file) => {
    // Nutzt den channel-import Endpoint, der bereits Excel-Uploads verarbeitet
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${BASE}/channels/import`, { method: 'POST', body: formData }).then(r => r.json());
  },

  // Channel prompts
  getPrompts:        (prefix)     => request('GET', `/channels/${prefix}/prompts`),
  savePrompt:        (prefix, p)  => request('POST', `/channels/${prefix}/prompts`, p),
  deletePrompt:      (prefix, id) => request('DELETE', `/channels/${prefix}/prompts/${id}`),
  generatePrompt:    (prefix, body) => request('POST', `/channels/${prefix}/prompt-generate`, body), // KON-02

  // Channel variables
  getVariablen:      (prefix)     => request('GET', `/channels/${prefix}/variablen`),
  saveVariable:      (prefix, v)  => request('POST', `/channels/${prefix}/variablen`, v),
  deleteVariable:    (prefix, id) => request('DELETE', `/channels/${prefix}/variablen/${id}`),

  // IMP-18: Project variables (for Prompt-Engineer)
  getProjektVariablen: (prefix, pid, bereich) => {
    const q = bereich ? `?bereich=${encodeURIComponent(bereich)}` : '';
    return request('GET', `/projects/${prefix}/${pid}/variablen${q}`);
  },
  saveProjektVariable: (prefix, pid, v) => request('POST', `/projects/${prefix}/${pid}/variablen`, v),
  deleteProjektVariable: (prefix, pid, id) => request('DELETE', `/projects/${prefix}/${pid}/variablen/${id}`),

  // Channel templates
  getVorlagen:       (prefix)     => request('GET', `/channels/${prefix}/vorlagen`),
  saveVorlage:       (prefix, v)  => request('POST', `/channels/${prefix}/vorlagen`, v),
  uploadVorlage:     (prefix, formData) => fetch(`${BASE}/channels/${prefix}/vorlagen`, { method: 'POST', body: formData }).then(r => r.json()),
  deleteVorlage:     (prefix, id) => request('DELETE', `/channels/${prefix}/vorlagen/${id}`),

  // Channel contacts
  getKontakte:       (prefix)     => request('GET', `/channels/${prefix}/kontakte`),
  saveKontakt:       (prefix, k)  => request('POST', `/channels/${prefix}/kontakte`, k),
  deleteKontakt:     (prefix, id) => request('DELETE', `/channels/${prefix}/kontakte/${id}`),

  // Channel settings (Key-Value)
  getChannelSettings: (prefix)     => request('GET', `/channels/${prefix}/settings`),
  saveChannelSetting: (prefix, key, value) => request('POST', `/channels/${prefix}/settings`, { key, value }),

  // Projects
  getProjects:       (prefix)     => request('GET', `/projects/${prefix}`),
  createProject:     (prefix, p)  => request('POST', `/projects/${prefix}`, p),
  deleteProject:     (prefix, id) => request('DELETE', `/projects/${prefix}/${id}`),

  // Thema
  getThema:          (prefix, pid) => request('GET', `/projects/${prefix}/${pid}/thema`),
  addQuelle:         (prefix, pid, q) => request('POST', `/projects/${prefix}/${pid}/thema/quellen`, q),
  analyseThema:      (prefix, pid) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 600000); // 10 Minuten für Circle-Verfahren
    return fetch(`${BASE}/projects/${prefix}/${pid}/thema/analyse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    }).then(r => {
      clearTimeout(timeout);
      if (!r.ok) return r.json().then(d => { throw new Error(d.error || 'HTTP ' + r.status); });
      return r.json();
    });
  },
  updateErgebnis:    (prefix, pid, eid, u) => request('PATCH', `/projects/${prefix}/${pid}/thema/ergebnisse/${eid}`, u),
  zusammenfassen:    (prefix, pid) => request('POST', `/projects/${prefix}/${pid}/thema/zusammenfassen`),

  // Research
  getResearch:       (prefix, pid) => request('GET', `/projects/${prefix}/${pid}/research`),
  saveNotiz:         (prefix, pid, n) => request('POST', `/projects/${prefix}/${pid}/research/notizen`, n),
  selectKriterien:   (prefix, pid, ids) => request('POST', `/projects/${prefix}/${pid}/research/kriterien`, { ids }),
  generatePrompt:    (prefix, pid, extra) => request('POST', `/projects/${prefix}/${pid}/research/generate-prompt`, extra || {}),

  // Meta
  saveMeta:          (prefix, pid, meta) => request('PATCH', `/projects/${prefix}/${pid}/meta`, meta),
  getAudio:          (prefix, pid) => request('GET', `/projects/${prefix}/${pid}/audio`),
  uploadAudio:       (prefix, pid, a) => request('POST', `/projects/${prefix}/${pid}/audio/upload`, a),
  selectAudioKriterien: (prefix, pid, ids, extra) => request('POST', `/projects/${prefix}/${pid}/audio/kriterien`, { ids, extra_text: extra }),
  generateAudioPrompt: (prefix, pid, body) => request('POST', `/projects/${prefix}/${pid}/audio/generate-prompt`, body || {}),

  // Slides
  getSlides:         (prefix, pid) => request('GET', `/projects/${prefix}/${pid}/slides`),
  saveSlidesTiming:  (prefix, pid, t) => request('POST', `/projects/${prefix}/${pid}/slides/timing`, { table: t }),
  uploadSlidesZip:   (prefix, pid, filePath) => request('POST', `/projects/${prefix}/${pid}/slides/upload-zip`, { file_path: filePath }),

  // Video
  getVideo:          (prefix, pid) => request('GET', `/projects/${prefix}/${pid}/video`),
  saveVideoKonfig:   (prefix, pid, k) => request('POST', `/projects/${prefix}/${pid}/video/konfig`, k),
  saveTimeline:      (prefix, pid, items) => request('POST', `/projects/${prefix}/${pid}/video/timeline`, { items }),

  // Upload
  getUpload:         (prefix, pid) => request('GET', `/projects/${prefix}/${pid}/upload`),
  saveUpload:        (prefix, pid, d) => request('POST', `/projects/${prefix}/${pid}/upload`, d),
  publish:           (prefix, pid) => request('POST', `/projects/${prefix}/${pid}/upload/publish`),
  archiveProject:    (prefix, pid) => request('POST', `/projects/${prefix}/${pid}/archive`),

  // Settings
  getSettings:       ()           => request('GET', '/projects/settings'),
  saveSetting:       (s)          => request('POST', '/projects/settings', s),
  saveProvider:      (p)          => request('POST', '/projects/settings/providers', p),
  deleteProvider:    (id)         => request('DELETE', `/projects/settings/providers/${id}`),
  saveTTS:           (t)          => request('POST', '/projects/settings/tts', t),
  deleteTTS:         (id)         => request('DELETE', `/projects/settings/tts/${id}`),

  // LLM Chat (CHAT-01/02)
  callLLM:           (body)       => request('POST', '/chat', body),

  // Health
  health:            ()           => request('GET', '/health'),

  // PLAT-01: Platform credentials
  getPlattformen:    (prefix)     => request('GET', `/channels/${prefix}/plattformen`),
  savePlattform:     (prefix, p)  => request('POST', `/channels/${prefix}/plattformen`, p),
  deletePlattform:   (prefix, id) => request('DELETE', `/channels/${prefix}/plattformen/${id}`),

  // Import (file upload – uses FormData, not JSON)
  importChannels:    async (file, confirmedMapping = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (confirmedMapping) {
      formData.append('confirmedMapping', JSON.stringify(confirmedMapping));
    }
    const res = await fetch(`${BASE}/channels/import`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  },
};
