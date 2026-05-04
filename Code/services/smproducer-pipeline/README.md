# ME4-SMproducer Pipeline Service

## Beschreibung

Orchestriert den Video-Produktionsablauf: Nimmt Projekte entgegen, steuert den Workflow (Recherche → Skript → TTS → Rendering) und kommuniziert mit dem Renderer-Service via ZMQ.

## Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| GET | /health | Health Check |
| GET | /api/projects | Alle Projekte |
| POST | /api/projects | Neues Projekt |
| GET | /api/projects/:id | Projekt-Details |
| POST | /api/projects/:id/start | Produktion starten |
| GET | /api/templates | Templates abrufen |

## Umgebungsvariablen

| Variable | Default | Beschreibung |
|---|---|---|
| SMPRODUCER_PIPELINE_PORT | 3001 | HTTP-Port |
| SMPRODUCER_RENDERER_ZMQ | tcp://localhost:5555 | ZMQ-Endpunkt zum Renderer |
