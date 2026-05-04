/**
 * ME4-SMproducer Pipeline Service – Server Entry Point
 *
 * Orchestriert den gesamten Video-Produktionsablauf:
 * Projektverwaltung, Job-Queue, Renderer-Kommunikation.
 *
 * @module smproducer-pipeline
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.SMPRODUCER_PIPELINE_PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'smproducer-pipeline', version: '0.1.0' });
});

// TODO: Routes – projectRoutes, jobRoutes, templateRoutes

app.listen(PORT, () => {
  console.log(`[smproducer-pipeline] Listening on port ${PORT}`);
});

export default app;
