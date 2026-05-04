# Datenlexikon – ME4-SMproducer 3.0

> Lebendiges Dokument – wird mit jedem neuen Feld aktualisiert.

## Tabellen

### smproducer-projects

| Feld | Typ | Beschreibung | Pflicht |
|---|---|---|---|
| id | INTEGER PK | Eindeutige Projekt-ID | ✅ |
| title | TEXT | Projekttitel | ✅ |
| platform | TEXT | Zielplattform (youtube, tiktok, instagram) | ✅ |
| format | TEXT | Videoformat (16:9, 9:16, 1:1) | ✅ |
| status | TEXT | Projektstatus (draft, research, script, render, done) | ✅ |
| source_url | TEXT | Quell-URL (YouTube etc.) | |
| created_at | DATETIME | Erstellungszeitpunkt | ✅ |
| updated_at | DATETIME | Letzte Änderung | ✅ |

### smproducer-templates

| Feld | Typ | Beschreibung | Pflicht |
|---|---|---|---|
| id | INTEGER PK | Template-ID | ✅ |
| name | TEXT | Template-Name | ✅ |
| platform | TEXT | Zielplattform | ✅ |
| config_json | TEXT | Template-Konfiguration (JSON) | ✅ |

## Dateibasiert: fields.csv

Siehe `fields.csv` für maschinenlesbare Version.
