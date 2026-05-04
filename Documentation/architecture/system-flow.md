# System Flow – ME4-SMproducer 3.0

## Haupt-Workflow: Video-Produktion

```
1. Projekt anlegen
   ├── Titel, Zielplattform, Format festlegen
   └── Quellmaterial auswählen (YouTube-URL oder Upload)

2. Recherche & Analyse
   ├── Transkription des Quellmaterials
   ├── KI-gestützte Inhaltsanalyse
   └── Themen-Extraktion & Zusammenfassung

3. Skripterstellung
   ├── KI-generiertes Skript basierend auf Analyse
   ├── Segmentierung in Szenen/Kapitel
   └── Manuelle Nachbearbeitung möglich

4. Asset-Generierung
   ├── TTS: Voiceover aus Skripttext
   ├── Bildauswahl: Passende Visuals zu Szenen
   └── Overlays: Text, Branding, Effekte

5. Rendering & Export
   ├── Video-Komposition (Renderer Service)
   ├── Qualitätsprüfung
   └── Export in Zielformat

6. Auslieferung
   └── Download oder Direkt-Upload zu Plattform
```

## Service-Kommunikation

| Von | Nach | Protokoll | Zweck |
|---|---|---|---|
| Web App | Pipeline | REST | CRUD-Projekte, Status-Abfragen |
| Pipeline | Renderer | ZMQ REQ/REP | Render-Jobs senden, Status empfangen |
| Pipeline | DB | SQL | Persistenz |
| Renderer | Edge-TTS | HTTP | Sprachsynthese |
