/**
 * MCP Bridge Routes – REST-API für ZMQ-basierte Python Microservices
 */
import { Router } from 'express';
import { transcribe, separateSpeakers, healthCheck } from '../mcp/bridge.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    const health = await healthCheck();
    res.json(health);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transcribe', async (req, res) => {
  try {
    const { file_path, num_speakers, language } = req.body;
    if (!file_path) return res.status(400).json({ error: 'file_path ist Pflichtfeld' });
    const segments = await transcribe(file_path, { num_speakers, language });
    res.json({ transcript: segments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/separate', async (req, res) => {
  try {
    const { file_path, speaker_count } = req.body;
    if (!file_path) return res.status(400).json({ error: 'file_path ist Pflichtfeld' });
    const speakers = await separateSpeakers(file_path, speaker_count || 2);
    res.json({ speakers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
