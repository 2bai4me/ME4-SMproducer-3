# ME4-SMproducer 3.0 – Funktions- & Umsetzungsplan

> **Stand:** 2026-05-06  
> **Ziel:** Aktuelle Version (Vanilla JS + Express + SQLite) gegen Anforderungskatalog (KI-Requirements-Master.md) abgleichen und funktional machen.  
> **Prämisse:** `global.db`, Kanal-Neuanlage (LUYB) und bestehende Pipeline bleiben erhalten.

---

## 1. IST-Zustand – Was bereits funktioniert

### Backend (smproducer-pipeline) – ✅ Lauffähig

| Komponente | Status | Details |
|---|---|---|
| Express Server (Port 3001) | ✅ | CORS, JSON-Parsing, Static- Serving |
| SQLite-Manager (3 Ebenen) | ✅ | `global.db`, `<prefix>.db`, `<projekt-id>.db` |
| Schema-Initialisierung | ✅ | `initGlobalDB()`, `initChannelDB()`, `initProjectDB()` |
| Channel CRUD | ✅ | GET/POST/DELETE `/api/channels` mit Ordnerstruktur |
| Project CRUD | ✅ | GET/POST/DELETE `/api/projects/:prefix` mit 6 Unterordnern |
| Thema-Schritt | ⚠️ | API vorhanden, aber Themen-Analyse nur Mock (kein LLM-Call) |
| Research-Schritt | ⚠️ | Prompt-Generierung mit Variablen-Ersetzung ✅, kein LLM-Call |
| Audio-Schritt | ⚠️ | Mock-Transkription/Mock-Sprechertrennung (kein MCP) |
| Slides-Schritt | ⚠️ | Steuerdatei-API vorhanden, aber kein KIMI-API-Call |
| Video-Schritt | ⚠️ | Konfig/Timeline-API vorhanden, aber kein Rendering-Trigger |
| Upload-Schritt | ⚠️ | Publish-Flag gesetzt, kein echter Plattform-Upload |
| Settings/Provider | ✅ | LLM-Provider & TTS CRUD vorhanden |
| Health-Endpoint | ✅ | Gibt rootDir und Channel-Count zurück |

### Frontend (Code/app/) – ✅ Lauffähig

| Komponente | Status | Details |
|---|---|---|
| App Shell (main.js) | ✅ | 4-Quadranten-Layout, State-Watcher, Ctrl+Click-Info |
| State-Management | ✅ | Proxy-basierte Reaktivität, watch(), toast() |
| API-Client | ✅ | Volle REST-Abdeckung aller Endpunkte |
| Header | ✅ | Logo, Titel, Projekt-ID, Bell, ⚙, ?-Buttons |
| Navigator | ✅ | 7 Einträge mit Nummern-Badges, aktiver Status |
| Sidebar | ✅ | Chat/Variablen/Info-Tabs, AutoResize-Textarea (MESM-UI-334) |
| Workspace | ✅ | Page-Rendering mit dynamischem Import |
| ServiceAccordion | ✅ | Harmonium-Effekt (ein Panel offen), Status-Badges |
| **KanalPage** | ✅ | Kanal wählen/anlegen, Kriterien-Editor, Prompt-Templates, Variablen |
| **ThemaPage** | ⚠️ | Quelltext + Analyse-Logik ✅, Ergebnis-Cards ✅, Projektstart ⚠️ |
| **ResearchPage** | ⚠️ | Notebook-LM-Bridge ✅, Kriterien-Tabelle ⚠️, Prompt-Erstellung ✅ |
| **AudioPage** | ⚠️ | Kriterien ✅, Upload ✅, Transkript-Tabelle ✅, MCP-fehlt |
| **SlidesPage** | ⚠️ | Kriterien ✅, Prompt ✅, ZIP-Upload ⚠️, Steuerdatei ⚠️ |
| **VideoPage** | ⚠️ | Format/Plattform-Wahl ⚠️, Carousel ⚠️, Timeline ⚠️ |
| **UploadPage** | ⚠️ | Video-Player ⚠️, Datenformular ✅, Publish ✅, Marketing ⚠️ |

### Datenbank

| DB | Pfad | Inhalt |
|---|---|---|
| `global.db` | `tests/global.db` | 2 Kanäle (LUYB, LUYL), app_settings, llm_providers, tts_profiles |
| LUYB-Kanal | `tests/LUYB/LUYB.db` | (noch leer, Schema initialisiert) |
| MESM_DATA | `Code/MESM_DATA/` | Nur Debug-Ordner, kein global.db |

---

## 2. SOLL-Zustand – Anforderungsabgleich

Basis: `Documentation/requirements/KI-Requirements-Master.md` (68 funktionale Anforderungen)

### 2.1 KRITISCH – Fehlende Kernfunktionalität

| ID | Anforderung | IST | Maßnahme |
|---|---|---|---|
| **F-K01** | Kanal anlegen mit Prefix, Titel, Beschreibung | ✅ Erfüllt | – |
| **F-K02** | Ordnerstruktur nach Kanalanlage | ✅ Erfüllt | – |
| **F-K03** | Vorlagen-Ordner erstellen | ✅ Erfüllt | – |
| **F-K04** | Prompt-Master mit Design/Preview | ⚠️ Teilweise | Variablen-Highlighting verbessern |
| **F-K05** | Kriterienlisten Research/Audio/Slides | ✅ Erfüllt | – |
| **F-K06** | Kanal-Variablen | ✅ Erfüllt | – |
| **F-T01** | Thema-Workspace laden | ✅ Erfüllt | – |
| **F-T02** | Kanal wählen | ✅ Erfüllt | – |
| **F-T03** | Quellen erfassen (Text/URL/YT/File) | ⚠️ Teilweise | YT-Embed fehlt, File-Upload-Dropzone fehlt |
| **F-T04** | Quellenanalyse per LLM | ❌ Mock | **LLM-Integration einbauen** |
| **F-T05** | Themenvorschläge anzeigen | ✅ Erfüllt | Ergebnis-Cards vorhanden |
| **F-T06** | Kategorie ändern | ✅ Erfüllt | – |
| **F-T07** | Themen zusammenfassen | ✅ Erfüllt | – |
| **F-T08** | Projekt-ID generieren | ✅ Erfüllt | – |
| **F-T09** | Projektordner erstellen | ✅ Erfüllt | – |
| **F-R01** | NotebookLM-Daten anzeigen | ✅ Erfüllt | – |
| **F-R02** | Notebook-Inhalt | ✅ Erfüllt | – |
| **F-R03** | Research-Kriterien auswählen | ⚠️ Teilweise | Suchfeld + Sortierung fehlt |
| **F-R04** | Research-Prompt generieren | ✅ Erfüllt | Variablen-Ersetzung ✅ |
| **F-A01** | Audio-Prompt erzeugen | ✅ Erfüllt | – |
| **F-A02** | Prompt editieren | ✅ Erfüllt | – |
| **F-A03** | Audio hochladen | ✅ Erfüllt | – |
| **F-A04** | Audio-Verarbeitung (MCP) | ❌ Mock | **MCP-Integration einbauen** |
| **F-A05** | Ergebnisse ablegen | ❌ Mock | – |
| **F-A06** | Transkript anzeigen | ✅ Erfüllt | – |
| **F-S01** | Slides-Kriterien | ✅ Erfüllt | – |
| **F-S02** | Slides-Prompt generieren | ✅ Erfüllt | – |
| **F-S03** | Slides hochladen (ZIP) | ⚠️ Teilweise | ZIP-Extraktion fehlt |
| **F-S04** | Steuerdatei generieren | ⚠️ Teilweise | Tabellen-Parser fehlt |
| **F-V01** | Videoformat wählen | ⚠️ Teilweise | Nur Dropdown, kein Grid-Selector |
| **F-V02** | Intro-Vorlage wählen | ⚠️ Teilweise | Carousel ohne echte DB-Daten |
| **F-V05** | Zeitleiste | ⚠️ Teilweise | Basis-Timeline, keine 5 Spuren |
| **F-V06** | Längenprüfung | ❌ Fehlt | – |
| **F-U01** | Video-Vorschau | ⚠️ Teilweise | Nur Platzhalter |
| **F-U02** | Thumbnail-Erstellung | ❌ Fehlt | – |

### 2.2 Unerwünschtes Verhalten (Error-Handling)

| ID | Fall | IST | Maßnahme |
|---|---|---|---|
| F-UB01 | MCP-Timeout 30s | ❌ Fehlt | Timeout in API-Calls einbauen |
| F-UB02 | Sprechertrennung zu wenig Spuren | ❌ Fehlt | Validierung nach MCP-Call |
| F-UB03 | LLM leere Antwort | ❌ Fehlt | Response-Validierung |
| F-UB04 | ZIP ohne JPEG | ❌ Fehlt | Dateityp-Validierung |
| F-UB05 | Pflichtfelder nicht ausgefüllt | ❌ Fehlt | Formular-Validierung |
| F-UB06 | API-Key ungültig | ❌ Fehlt | Provider-Validierung |
| F-UB07 | Root-Verzeichnis weg | ❌ Fehlt | Existenz-Check |

---

## 3. Abgleich: Benötigte vs. vorhandene Dateien

### Vorhandene Dateien (implementiert)

```
Code/
├── app/
│   ├── main.js                          ✅ Einstieg
│   ├── index.html                       ✅
│   ├── styles/main.css                  ✅ Hell-Theme angewendet
│   ├── layout/
│   │   ├── Header.js                    ✅ Mit Settings-Modal
│   │   ├── Navigator.js                 ✅ 7 Nav-Punkte
│   │   ├── Sidebar.js                   ✅ 3 Tabs
│   │   └── Workspace.js                 ✅ Page-Routing
│   ├── pages/
│   │   ├── KanalPage.js                 ✅ CRUD + Kriterien + Prompts + Variablen
│   │   ├── ThemaPage.js                 ⚠️ Mock-Analyse
│   │   ├── ResearchPage.js             ⚠️ Keine Sortierung
│   │   ├── AudioPage.js                 ⚠️ Mock-Transkription
│   │   ├── SlidesPage.js               ⚠️ Kein ZIP-Parser
│   │   ├── VideoPage.js                 ⚠️ Basis-Timeline
│   │   └── UploadPage.js               ⚠️ Kein Player
│   ├── components/organisms/
│   │   └── ServiceAccordion.js          ✅
│   └── shared/
│       ├── state.js                     ✅
│       └── api.js                       ✅
├── services/
│   └── smproducer-pipeline/
│       ├── src/
│       │   ├── server.js                ✅
│       │   ├── db/manager.js            ✅
│       │   ├── db/schema.js             ✅
│       │   └── routes/
│       │       ├── channels.js          ✅
│       │       └── projects.js          ✅
│       └── package.json                 ✅
└── dist/                                ✅ Build-Output
```

### Fehlende Dateien (laut Anforderungen)

```
Code/
├── services/
│   └── smproducer-pipeline/
│       └── src/
│           ├── llm/                     ❌ LLM-Client
│           │   └── client.js            ❌ Provider-Abstraktion
│           └── mcp/                     ❌ MCP-Client
│               └── client.js            ❌ Transkription/Sprechertrennung
```

---

## 4. Umsetzungsplan – Priorisiert nach Funktionalität

### Phase 1: Fundament (Daten & LLM-Integration) 🔴

**Ziel:** Aus Mock-Daten werden echte KI-generierte Daten. Der 6-Schritte-Workflow wird durchgängig nutzbar.

- [ ] **1.1 LLM-Client implementieren**
  - `Code/services/smproducer-pipeline/src/llm/client.js`
  - Provider-Abstraktion: DeepSeek, Kimi, LM Studio
  - API-Key aus `llm_providers`-Tabelle lesen
  - Timeout 30s, Retry-Logik
  - Prompt-Template mit System-Prompt
  - **Betrifft Anforderungen:** F-T04, F-R04, F-A01, F-S02, F-U02

- [ ] **1.2 Themen-Analyse an LLM anbinden**
  - `projects.js`: `/thema/analyse` Route umbauen
  - Quelltext → LLM → JSON mit Themen extrahieren
  - Kategorie-Zuordnung aus Kanal-Kriterien
  - Halluzinationskontrolle: "Keine Themen gefunden" statt Erfindungen
  - **Betrifft Anforderungen:** F-T04, F-T05, F-UB03

- [ ] **1.3 Prompt-Generierung mit LLM optimieren**
  - Research-Prompt: Kriterien + Extra-Text → LLM → optimierter Prompt
  - Variablen-Ersetzung (bereits ✅) mit LLM-Anreicherung
  - Prompt-Log in Projekt-DB (bereits ✅)
  - **Betrifft Anforderungen:** F-R04

- [ ] **1.4 Error-Handling & Validierung**
  - LLM-Timeout (30s) → Fehlermeldung F-UB01
  - Leere LLM-Antwort → F-UB03
  - API-Key-Validierung → F-UB06
  - Pflichtfeld-Validierung in allen Forms → F-UB05
  - **Betrifft Anforderungen:** F-UB01, F-UB03, F-UB05, F-UB06

### Phase 2: MCP-Integration (Audio-Verarbeitung) 🟠

**Ziel:** Audio-Upload triggert echte Transkription und Sprechertrennung via MCP.

- [ ] **2.1 MCP-Client implementieren**
  - `Code/services/smproducer-pipeline/src/mcp/client.js`
  - Service-Discovery für Transkription und Sprechertrennung
  - Least-Utilization Load Balancing (Architekturprinzip #3)
  - Timeout 5 Minuten für Audio-Verarbeitung
  - **Betrifft Anforderungen:** F-A04, F-A05

- [ ] **2.2 Audio-Route umbauen**
  - `projects.js`: `/audio/upload` von Mock auf MCP umstellen
  - Transkription-Service aufrufen → JSON in `transkript`-Tabelle
  - Sprechertrennung aufrufen → Dateien in `3. Audio/` ablegen
  - Validierung: Sprecheranzahl prüfen → F-UB02
  - **Betrifft Anforderungen:** F-A04, F-A05, F-UB02

- [ ] **2.3 Lastverteilung (Load Balancer)**
  - Service-Registry: `/health`-Check bei mehreren Instanzen
  - Round-Robin mit Auslastungsgewichtung
  - Failover bei Timeout
  - **Betrifft Anforderungen:** F-A07

### Phase 3: Medien-Verarbeitung (Slides & Video) 🟡

**Ziel:** ZIP-Upload, Steuerdatei, Video-Rendering vorbereiten.

- [ ] **3.1 ZIP-Extraktion & Validierung**
  - `projects.js`: ZIP-Datei entgegennehmen, entpacken
  - JPEG-Validierung → F-UB04
  - Dateien in `4. Slides/` ablegen
  - Slide-Count in DB speichern
  - **Betrifft Anforderungen:** F-S03, F-UB04

- [ ] **3.2 Steuerdatei-Parser**
  - Text-Tabelle parsen (KI-gestützt oder Regex)
  - Spalten: slide_id, file_name, start_time, end_time
  - Für jede Slide: Timing in `slides_timing` speichern
  - **Betrifft Anforderungen:** F-S04

- [ ] **3.3 Video-Timeline mit 5 Spuren**
  - `VideoPage.js`: Echte 5-Spur-Timeline rendern
  - Spuren: Hintergrund, Sprecher A, Sprecher B, Slides, Intro/Outro
  - Daten aus `video_timeline`-Tabelle laden
  - Längenprüfung (F-V06) implementieren
  - **Betrifft Anforderungen:** F-V05, F-V06

### Phase 4: Upload & Thumbnail 🟢

**Ziel:** Upload-Daten vervollständigen, Thumbnail-Generierung, Marketing-Kontakte.

- [ ] **4.1 Thumbnail-Generierung via LLM**
  - Prompt aus Kanal-Prompt-Template (Kanal > Prompt-Master)
  - Bild-Generierung via MCP/LLM anstoßen
  - Zwei Varianten → Nutzer wählt eine
  - **Betrifft Anforderungen:** F-U02

- [ ] **4.2 Video-Marketing Kontakte**
  - Kontakt-Liste aus `marketing_kontakte`-Tabelle laden
  - Status-Toggle: "Informieren" ↔ "Informiert"
  - "Alle senden"-Button (später: echte Benachrichtigung)
  - **Betrifft Anforderungen:** F-U05

### Phase 5: UI-Vervollständigung 🔵

**Ziel:** Fehlende UI-Elemente aus dem Mockup-Abgleich (Design-Update.md) ergänzen.

- [ ] **5.1 Sortierbare Tabellen** (Research, Audio, Slides, Kanal)
  - Spaltenköpfe klickbar mit ⇅-Indikator
  - `localeCompare`-Sortierung
  - **Betrifft Anforderungen:** F-R03, F-A01, F-S01

- [ ] **5.2 Sidebar-Collapse** (MESM-UI-310)
  - Chevron-Toggle, Width-Transition 13rem↔4rem
  - Tooltips bei Hover im collapsed state
  - **UI-Verbesserung**

- [ ] **5.3 YouTube-Embed** (MESM-UI-401)
  - URL-Input → Iframe erscheint mit Animation
  - `getYoutubeEmbedUrl()`-Funktion
  - **Betrifft Anforderungen:** F-T03

- [ ] **5.4 Progress-Bar + Analyse-Animation** (MESM-UI-405)
  - Fortschrittsbalken bei LLM-Analyse
  - Prozent-Anzeige, crimson-Fill
  - **UI-Verbesserung**

- [ ] **5.5 Video-Format-Selector** (MESM-UI-405a/b)
  - Grid 3-col Cards (16:9/9:16/1:1)
  - Plattform-Pill-Buttons
  - **Betrifft Anforderungen:** F-V01

- [ ] **5.6 Template-Carousel** (MESM-UI-405c)
  - 4 pro Seite, Chevron-Navigation, Pagination-Dots
  - Daten aus `video_vorlagen`-Tabelle
  - **Betrifft Anforderungen:** F-V02, F-V03, F-V04

- [ ] **5.7 Video-Player** (MESM-UI-406a)
  - Play/Pause, Timeline, Zeit-Anzeige
  - Thumbnail-Vorschau
  - **Betrifft Anforderungen:** F-U01

- [ ] **5.8 Copy-Buttons global** (MESM-UI-004)
  - `absolute` positioniert an Inputs/Textareas
  - `navigator.clipboard.writeText()`
  - **UI-Verbesserung**

- [ ] **5.9 Button-Lade-Animation** (MESM-ANIM-001)
  - Icon rotiert 360° während API-Calls
  - Button disabled während Ladevorgang
  - **UI-Verbesserung**

- [ ] **5.10 Typing-Indikator** (MESM-UI-333)
  - 3 Bounce-Punkte im Chat
  - Gestaffelte Delays: 0ms, 150ms, 300ms
  - **UI-Verbesserung**

---

## 5. NICHT ÄNDERN – Bleibt erhalten

| Komponente | Grund |
|---|---|
| `global.db` Struktur & Schema | Basis aller Kanäle, LUYB erhalten |
| Kanal-Neuanlage (POST /api/channels) | Funktioniert, Ordnerstruktur ✅ |
| Channel-Routen (`channels.js`) | Vollständig ✅ |
| `manager.js` (DB-Manager) | 3-Ebenen-Architektur ✅ |
| `schema.js` (DB-Schema) | Alle Tabellen definiert ✅ |
| `state.js` (Frontend-State) | Proxy-Reaktivität ✅ |
| `api.js` (API-Client) | Vollständige REST-Abdeckung ✅ |
| `ServiceAccordion.js` | Harmonium-Effekt ✅ |
| `Navigator.js` | 7 Nav-Punkte ✅ |
| `Workspace.js` | Page-Routing ✅ |

---

## 6. Ausführungsreihenfolge (empfohlen)

```
Phase 1 (Fundament) ──▶ Phase 2 (MCP) ──▶ Phase 3 (Medien)
         │                      │                    │
         ▼                      ▼                    ▼
   LLM-Client            MCP-Client           ZIP/Slides
   Themen-Analyse        Audio-Route          Steuerdatei
   Prompt-LLM            Load-Balancer        Timeline
   Error-Handling                             Längenprüfung
         │                      │                    │
         └──────────────────────┴────────────────────┘
                              │
                              ▼
                    Phase 4 (Upload/Thumbnail)
                    Phase 5 (UI-Vervollständigung)
```

---

## 7. Verifikation

### Nach Phase 1:
1. `npm run dev` im Pipeline-Verzeichnis starten
2. Kanal LUYB auswählen
3. Thema-Schritt: Quellen erfassen → "Analysieren" → Echte LLM-Themen erscheinen
4. Research-Schritt: Kriterien wählen → Prompt generieren → LLM-optimierter Prompt
5. Fehler provozieren: Falscher API-Key → Fehlermeldung F-UB06

### Nach Phase 2:
1. Audio-Datei hochladen → MCP-Transkription läuft
2. Transkript-Tabelle mit echten Daten
3. Sprechertrennung: N Dateien im `3. Audio/` Ordner

### Nach Phase 3:
1. ZIP mit JPEGs hochladen → Dateien extrahiert
2. Steuerdatei aus Tabelle generiert
3. Timeline mit 5 Spuren, Längen validiert

### Nach Phase 4:
1. Thumbnail-Generierung via LLM
2. Zwei Varianten zur Auswahl
3. Marketing-Kontakte mit Status-Toggle

### Nach Phase 5:
1. Alle Tabellen sortierbar
2. Sidebar collapsible
3. YouTube-Embed funktioniert
4. Video-Format-Selector mit Grid
5. Template-Carousel mit Navigation
6. Video-Player mit Controls
7. Copy-Buttons an allen Feldern
