/**
 * MCP Bridge Server – Eigenständiger HTTP→ZMQ Bridge Service
 *
 * Übersetzt REST/HTTP-Anfragen in ZMQ-Nachrichten für:
 *   - STT-SERVICE-MSS2026 (Transkription) Port 5555
 *   - MS-SPEECH-SPLITTER (Sprechertrennung) Port 5580
 *
 * Läuft auf Port 3003, unabhängig vom SMproducer-Backend.
 */

import express from 'express';
import cors from 'cors';
import { transcribe, separateSpeakers, healthCheck } from './src/mcp/bridge.js';

const PORT = 3003;
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', async (_req, res) => {
  try {
    const health = await healthCheck();
    res.json({ ...health, bridge: 'ok' });
  } catch (err) {
    res.json({ transkription: false, splitter: false, bridge: 'ok', error: err.message });
  }
});

app.post('/transcribe', async (req, res) => {
  try {
    const { file_path, num_speakers, language } = req.body;
    if (!file_path) return res.status(400).json({ error: 'file_path ist Pflichtfeld' });
    const segments = await transcribe(file_path, { num_speakers, language });
    res.json({ transcript: segments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/separate', async (req, res) => {
  try {
    const { file_path, speaker_count } = req.body;
    if (!file_path) return res.status(400).json({ error: 'file_path ist Pflichtfeld' });
    const speakers = await separateSpeakers(file_path, speaker_count || 2);
    res.json({ speakers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[mcp-bridge] Listening on http://localhost:${PORT}`);
  console.log('[mcp-bridge] POST /transcribe  → STT-SERVICE (ZMQ :5555)');
  console.log('[mcp-bridge] POST /separate    → MS-SPEECH-SPLITTER (ZMQ :5580)');
  console.log('[mcp-bridge] GET  /health      → Service-Status');
});
