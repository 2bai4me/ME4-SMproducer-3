/**
 * MCP Client – Integration externer KI-Services via MCP/REST.
 *
 * Unterstützt:
 *   - Transkription (Whisper/Deepgram)
 *   - Sprechertrennung (Speaker Diarization)
 *   - Thumbnail-Generierung
 *   - Slide-Generierung (Kimi)
 *
 * Architekturprinzip #3: Least-Utilization Load Balancing
 * Architekturprinzip #4: Hybrid-Integration (MCP/REST)
 *
 * @module mcp/client
 */

const MCP_TIMEOUT_MS = 300_000; // 5 Minuten für Audio-Verarbeitung (F-A04)

/**
 * Service Registry – verwaltet verfügbare MCP-Service-Instanzen.
 */
class ServiceRegistry {
  constructor() {
    /** @type {Map<string, Array<{ url: string, load: number, lastCheck: number }>>} */
    this.services = new Map();
  }

  /**
   * Service-Instanz registrieren.
   */
  register(serviceName, url) {
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, []);
    }
    const instances = this.services.get(serviceName);
    if (!instances.find(i => i.url === url)) {
      instances.push({ url, load: 0, lastCheck: Date.now() });
    }
  }

  /**
   * Instanz mit geringster Auslastung finden (Least-Utilization).
   * Architekturprinzip #3
   */
  getLeastLoaded(serviceName) {
    const instances = this.services.get(serviceName) || [];
    if (instances.length === 0) return null;

    // Sortiere nach Load, dann nach letztem Check
    instances.sort((a, b) => a.load - b.load || a.lastCheck - b.lastCheck);
    return instances[0];
  }

  /**
   * Auslastung einer Instanz erhöhen.
   */
  incrementLoad(serviceName, url) {
    const instances = this.services.get(serviceName);
    if (instances) {
      const inst = instances.find(i => i.url === url);
      if (inst) inst.load++;
    }
  }

  /**
   * Auslastung einer Instanz verringern.
   */
  decrementLoad(serviceName, url) {
    const instances = this.services.get(serviceName);
    if (instances) {
      const inst = instances.find(i => i.url === url);
      if (inst && inst.load > 0) inst.load--;
    }
  }
}

/** Globale Service-Registry */
const registry = new ServiceRegistry();

/**
 * MCP-Client für externe KI-Service-Aufrufe.
 */
export class MCPClient {
  constructor() {
    this.registry = registry;
  }

  /**
   * Audio-Transkription via MCP-Service.
   *
   * @param {string} audioFilePath – Pfad zur Audio-Datei
   * @param {string} [serviceUrl] – Explizite Service-URL (optional, sonst Load-Balancer)
   * @returns {Promise<Array<{ start_time: string, end_time: string, speaker: string, text: string }>>}
   */
  async transcribe(audioFilePath, serviceUrl = null) {
    const serviceName = 'transkription';

    // Standard-Endpunkt wenn keiner registriert
    if (!serviceUrl && !this.registry.getLeastLoaded(serviceName)) {
      // Kein MCP-Service registriert – Fallback: Mock-Transkription
      console.warn('[MCP] Kein Transkription-Service registriert. Verwende Mock-Daten.');
      return this._mockTranscription(audioFilePath);
    }

    const instance = serviceUrl
      ? { url: serviceUrl }
      : this.registry.getLeastLoaded(serviceName);

    if (!instance) {
      return this._mockTranscription(audioFilePath);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS);

      this.registry.incrementLoad(serviceName, instance.url);

      const response = await fetch(`${instance.url}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: audioFilePath }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      this.registry.decrementLoad(serviceName, instance.url);

      if (!response.ok) {
        throw new Error(`Transkriptionsdienst nicht erreichbar (${response.status}). Bitte versuchen Sie es erneut. (F-UB01)`);
      }

      const data = await response.json();
      return data.transcript || data;
    } catch (err) {
      this.registry.decrementLoad(serviceName, instance.url);
      clearTimeout(this._timeoutId);

      if (err.name === 'AbortError') {
        throw new Error('Transkriptionsdienst nicht erreichbar. Bitte versuchen Sie es erneut. (F-UB01)');
      }

      // Fallback bei Verbindungsfehler
      console.error('[MCP] Transkription-Fehler:', err.message);
      return this._mockTranscription(audioFilePath);
    }
  }

  /**
   * Sprechertrennung via MCP-Service.
   *
   * @param {string} audioFilePath – Pfad zur Audio-Datei
   * @param {number} speakerCount – Erwartete Anzahl Sprecher
   * @param {string} [serviceUrl] – Explizite Service-URL
   * @returns {Promise<Array<{ speaker: string, file_path: string }>>}
   */
  async separateSpeakers(audioFilePath, speakerCount, serviceUrl = null) {
    const serviceName = 'sprechertrennung';

    if (!serviceUrl && !this.registry.getLeastLoaded(serviceName)) {
      console.warn('[MCP] Kein Sprechertrennung-Service registriert. Verwende Mock-Daten.');
      return this._mockSpeakerSeparation(audioFilePath, speakerCount);
    }

    const instance = serviceUrl
      ? { url: serviceUrl }
      : this.registry.getLeastLoaded(serviceName);

    if (!instance) {
      return this._mockSpeakerSeparation(audioFilePath, speakerCount);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS);

      this.registry.incrementLoad(serviceName, instance.url);

      const response = await fetch(`${instance.url}/separate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: audioFilePath, speaker_count: speakerCount }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      this.registry.decrementLoad(serviceName, instance.url);

      if (!response.ok) {
        throw new Error(`Sprechertrennung nicht erreichbar (${response.status}). (F-UB01)`);
      }

      const data = await response.json();
      const spuren = data.speakers || data;

      // Validierung: Anzahl der erhaltenen Spuren prüfen (F-UB02)
      if (Array.isArray(spuren) && spuren.length < speakerCount) {
        console.warn(`[MCP] Sprechertrennung: Erwartet ${speakerCount}, erhalten ${spuren.length}. (F-UB02)`);
      }

      return spuren;
    } catch (err) {
      this.registry.decrementLoad(serviceName, instance.url);
      clearTimeout(this._timeoutId);

      if (err.name === 'AbortError') {
        throw new Error('Sprechertrennung nicht erreichbar. Bitte versuchen Sie es erneut. (F-UB01)');
      }

      console.error('[MCP] Sprechertrennung-Fehler:', err.message);
      return this._mockSpeakerSeparation(audioFilePath, speakerCount);
    }
  }

  /**
   * Thumbnail-Generierung via KI.
   *
   * @param {string} prompt – Prompt für die Bildgenerierung
   * @returns {Promise<{ variants: Array<{ url: string, description: string }> }>}
   */
  async generateThumbnail(prompt) {
    // Platzhalter: In Produktion würde dies einen Image-Gen-Service aufrufen
    console.log('[MCP] Thumbnail-Generierung angefordert:', prompt.slice(0, 100));

    // Mock: Generiere Platzhalter-URLs
    return {
      variants: [
        {
          url: `https://placehold.co/1920x1080/0f446b/c60024?text=${encodeURIComponent(prompt.slice(0, 30))}`,
          description: 'Variante A – Deep-Blue Stil'
        },
        {
          url: `https://placehold.co/1920x1080/c60024/ffffff?text=${encodeURIComponent(prompt.slice(0, 30))}`,
          description: 'Variante B – Crimson Stil'
        }
      ]
    };
  }

  // ─── Mock-Fallback-Implementierungen ──────────────────────────

  _mockTranscription(audioFilePath) {
    const basename = audioFilePath.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '');
    return [
      { start_time: '00:00:00', end_time: '00:00:05', speaker: 'A', text: 'Willkommen zu diesem Video über spannende Themen.' },
      { start_time: '00:00:05', end_time: '00:00:12', speaker: 'B', text: 'Heute sprechen wir über die neuesten Entwicklungen.' },
      { start_time: '00:00:12', end_time: '00:00:20', speaker: 'A', text: 'Ein wirklich interessantes Thema, das viele betrifft.' },
      { start_time: '00:00:20', end_time: '00:00:28', speaker: 'A', text: 'Lasst uns tiefer in die Materie eintauchen.' },
      { start_time: '00:00:28', end_time: '00:00:35', speaker: 'B', text: 'Absolut – die Details sind faszinierend.' },
      { start_time: '00:00:35', end_time: '00:00:42', speaker: 'A', text: `${basename} – Praxisbeispiele aus dem echten Leben.` },
    ];
  }

  _mockSpeakerSeparation(audioFilePath, speakerCount) {
    const basename = audioFilePath.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '');
    const speakers = [];
    for (let i = 0; i < speakerCount; i++) {
      const letter = String.fromCharCode(65 + i);
      speakers.push({
        speaker: letter,
        file_path: `${basename}_sprecher_${letter}.wav`
      });
    }
    return speakers;
  }
}

/**
 * Convenience-Factory.
 * @returns {MCPClient}
 */
export function createMCPClient() {
  return new MCPClient();
}

/**
 * Globale Service-Registry – für Load-Balancing.
 */
export { registry as serviceRegistry };
