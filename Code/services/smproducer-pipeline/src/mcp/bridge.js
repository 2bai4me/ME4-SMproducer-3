/**
 * MCP Bridge – ZMQ-basierte Kommunikation mit Python Microservices.
 *
 * Verbindet den SMproducer (Express/Node.js) mit:
 *   - STT-SERVICE-MSS2026 (Transkription) via ZMQ Port 5555
 *   - MS-SPEECH-SPLITTER (Sprechertrennung) via ZMQ Port 5580
 *
 * Protokoll: ZMQ REQ/REP mit JSON-Nachrichten
 * Standard: MSS-2026 (Microservice-Standard)
 */

import zmq from 'zeromq';

const ZMQ_TIMEOUT_MS = 300_000; // 5 Minuten für Audio-Verarbeitung

/**
 * Sendet eine ZMQ-Anfrage an einen Service und wartet auf Antwort.
 *
 * @param {number} port - ZMQ-Port des Services
 * @param {object} request - JSON-Anfrage (action + Parameter)
 * @returns {Promise<object>} - JSON-Antwort
 */
async function zmqRequest(port, request) {
  const sock = new zmq.Request();
  sock.connect(`tcp://127.0.0.1:${port}`);

  try {
    await sock.send(JSON.stringify(request));

    // Poll mit Timeout
    const [msg] = await Promise.race([
      sock.receive(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`ZMQ Timeout nach ${ZMQ_TIMEOUT_MS / 1000}s`)), ZMQ_TIMEOUT_MS)
      ),
    ]);

    const response = JSON.parse(msg.toString());
    return response;
  } finally {
    sock.close();
  }
}

/**
 * Transkription via STT-SERVICE-MSS2026 (Port 5555).
 *
 * @param {string} filePath - Pfad zur Audio-Datei
 * @param {object} options - { language, num_speakers, output_dir }
 * @returns {Promise<{status: string, data?: object, error?: string}>}
 */
async function transcribe(filePath, options = {}) {
  const request = {
    action: 'transcribe',
    file_path: filePath,
    num_speakers: options.num_speakers || 2,
    language: options.language || 'de',
    output_dir: options.output_dir || '',
  };

  console.log(`[MCP-Bridge] Transkription angefragt: ${filePath} (${request.num_speakers} Sprecher)`);

  try {
    const response = await zmqRequest(5555, request);

    if (response.status === 'ok' && response.data) {
      const segments = response.data.segments || [];
      console.log(`[MCP-Bridge] Transkription: ${segments.length} Segmente erhalten`);
      return segments.map(s => ({
        start_time: s.start_time || s.start || '00:00:00',
        end_time: s.end_time || s.end || '00:00:00',
        speaker: s.speaker || 'A',
        text: s.text || '',
      }));
    }

    throw new Error(response.message || 'Unbekannter Fehler bei der Transkription');
  } catch (err) {
    console.error('[MCP-Bridge] Transkription fehlgeschlagen:', err.message);
    throw err;
  }
}

/**
 * Sprechertrennung via MS-SPEECH-SPLITTER (Port 5580).
 *
 * @param {string} filePath - Pfad zur Audio-Datei
 * @param {number} speakerCount - Anzahl der Sprecher
 * @param {object} options - { output_dir }
 * @returns {Promise<Array<{speaker: string, file_path: string}>>}
 */
async function separateSpeakers(filePath, speakerCount, options = {}) {
  const request = {
    action: speakerCount > 1 ? 'diarize' : 'split',
    file_path: filePath,
    num_speakers: speakerCount,
    output_dir: options.output_dir || '',
  };

  console.log(`[MCP-Bridge] Sprechertrennung: ${filePath} (${speakerCount} Sprecher, action=${request.action})`);

  try {
    const response = await zmqRequest(5580, request);

    if (response.status === 'ok') {
      // Response kann segments, speaker_tracks oder paths enthalten
      const tracks = response.speaker_tracks || response.segments || response.paths || [];

      if (Array.isArray(tracks)) {
        console.log(`[MCP-Bridge] Sprechertrennung: ${tracks.length} Spuren erhalten`);

        // Wenn tracks Dateipfade (Strings) sind, in Objekte umwandeln
        if (tracks.length > 0 && typeof tracks[0] === 'string') {
          return tracks.map((path, i) => ({
            speaker: String.fromCharCode(65 + i), // A, B, C...
            file_path: path,
          }));
        }

        // Wenn tracks bereits Objekte mit speaker/file_path sind
        return tracks.map((t, i) => ({
          speaker: t.speaker || String.fromCharCode(65 + i),
          file_path: t.file_path || t.path || t.file || '',
        }));
      }
    }

    throw new Error(response.message || 'Unbekannter Fehler bei der Sprechertrennung');
  } catch (err) {
    console.error('[MCP-Bridge] Sprechertrennung fehlgeschlagen:', err.message);
    throw err;
  }
}

/**
 * Health-Check: Ping an beide Services.
 * @returns {Promise<{transkription: boolean, splitter: boolean}>}
 */
async function healthCheck() {
  const [sttOk, splitOk] = await Promise.allSettled([
    zmqRequest(5555, { action: 'ping' }).then(r => r.status === 'ok'),
    zmqRequest(5580, { action: 'ping' }).then(r => r.status === 'ok'),
  ]);

  return {
    transkription: sttOk.value === true,
    splitter: splitOk.value === true,
  };
}

export { transcribe, separateSpeakers, healthCheck, zmqRequest };
