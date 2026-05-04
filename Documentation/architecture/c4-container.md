# C4 Container – ME4-SMproducer 3.0

```mermaid
C4Container
    title Container Diagram – ME4-SMproducer 3.0

    Person(user, "Content Creator")

    Container(webapp, "Web Application", "Vite/Vanilla JS", "UI für Pipeline-Steuerung")
    Container(pipeline, "Pipeline Service", "Node.js/Express", "Orchestriert Produktionsablauf")
    Container(renderer, "Renderer Service", "Python", "Video-Rendering & TTS")
    ContainerDb(database, "Produktions-DB", "SQLite", "Projektdaten, Einstellungen")

    Rel(user, webapp, "Interagiert via Browser", "HTTPS")
    Rel(webapp, pipeline, "API-Calls", "REST/JSON")
    Rel(pipeline, renderer, "Render-Jobs", "ZMQ")
    Rel(pipeline, database, "Liest/Schreibt", "SQL")
```

## Container-Beschreibung

| Container | Technologie | Beschreibung |
|---|---|---|
| Web Application | Vite, Vanilla JS | Single-Page-App für den gesamten Produktions-Workflow |
| Pipeline Service | Node.js, Express | Zentrale Steuerung: Job-Queue, Status-Tracking, API |
| Renderer Service | Python 3 | CPU-intensive Aufgaben: Video-Encoding, TTS, Bildverarbeitung |
| Produktions-DB | SQLite (better-sqlite3) | Persistenz für Projekte, Templates, Einstellungen |
