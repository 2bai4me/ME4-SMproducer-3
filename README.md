# ME4-SMproducer 3.0

> **Social Media Video Production Pipeline – Version 3.0**  
> Gleiche Mission, neuer Ansatz: Modular, serviceorientiert, KI-gesteuert.

## Übersicht

ME4-SMproducer automatisiert die Erstellung von Social-Media-Videos – von der Recherche über Skripterstellung, Sprachsynthese, Bildgenerierung bis zum finalen Rendering.

### Warum 3.0?

Version 2 war ein funktionierender Prototyp, litt aber unter monolithischen Strukturen. Version 3.0 setzt auf:
- **Microservice-Architektur** nach ME4-Vorgaben
- **Klare Trennung** von Pipeline-Logik und Rendering
- **KI-gesteuerte Qualitätssicherung** auf jeder Produktionsstufe
- **Wiederverwendbare UI-Bausteine** nach Atomic Design

## Architektur (Kurzfassung)

```
┌─────────────────────────────────────────────┐
│                Frontend (Vite)              │
│         UI-Bausteine (Atomic Design)        │
└─────────────────┬───────────────────────────┘
                  │ REST/WebSocket
┌─────────────────▼───────────────────────────┐
│        smproducer-pipeline (Express)        │
│   Orchestriert den Video-Produktionsablauf  │
└─────────────────┬───────────────────────────┘
                  │ ZMQ / REST
┌─────────────────▼───────────────────────────┐
│        smproducer-renderer (Python)         │
│   Video-Rendering, TTS, Bildverarbeitung    │
└─────────────────────────────────────────────┘
```

## Technologien

| Schicht | Stack |
|---|---|
| Frontend | Vite, Vanilla JS, Atomic CSS |
| Backend (Pipeline) | Node.js, Express, better-sqlite3 |
| Backend (Renderer) | Python 3, edge-tts, ZMQ |
| Kommunikation | REST + ZMQ |

## Projektstruktur

```
ME4-SMproducer-3/
├── Documentation/          # Architektur, ADR, API-Verträge, Datenlexikon
└── Code/                   # Quellcode & Tests
    ├── app/                # Frontend & UI-Bausteine
    ├── services/           # Microservices
    ├── config/             # Umgebungskonfiguration
    └── tests/              # Integrations- & E2E-Tests
```

## Schnellstart

```bash
# Backend (Pipeline)
cd Code/services/smproducer-pipeline
npm install
npm run dev

# Frontend
cd Code
npm install
npm run dev

# Renderer (Python)
cd Code/services/smproducer-renderer
pip install -r requirements.txt
python main.py
```

## Status

🆕 **Phase 0 – Projektinitialisierung**  
Nächster Schritt: Architektur-Dokumentation & erster Microservice-Scaffold.

## Lizenz

MIT
