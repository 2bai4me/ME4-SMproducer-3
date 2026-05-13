# Das KI-Requirements Master-Template

> **Ein strukturierter Leitfaden für das Requirements Engineering von KI-basierten Systemen**

| Feld | Wert |
|---|---|
| **Projektname** | ME4 SM Producer 3.0 (MESM 3.0) |
| **Version** | 1.0 |
| **Datum** | 5.5.2026 |
| **Status** | In Ausarbeitung |

---

## Inhaltsverzeichnis

1. [Business Context & Strategischer Rahmen (CONTEXT)](#1-business-context--strategischer-rahmen-context)
2. [Problemraumanalyse (WHY & WHAT)](#2-problemraumanalyse-why--what)
3. [Software Vision & Architektur-Entwurf (GLANCE)](#3-software-vision--architektur-entwurf-glance)
4. [Funktionale Anforderungen (HOW)](#4-funktionale-anforderungen-how)
5. [KI-spezifische Nicht-Funktionale Anforderungen (NFRs)](#5-ki-spezifische-nicht-funktionale-anforderungen-nfrs)
6. [Datenqualitäts- und Datenmanagement-Framework](#6-datenqualitäts--und-datenmanagement-framework)
7. [Qualitätssicherung, Evaluierung & MLOps](#7-qualitätssicherung-evaluierung--mlops)
8. [Dokumentationsartefakte & Transparenz](#8-dokumentationsartefakte--transparenz)
9. [FinOps & Die Ökonomie des maschinellen Denkens](#9-finops--die-ökonomie-des-maschinellen-denkens)
10. [UX/UI & Das Mensch-Maschine-Interface](#10-uxui--das-mensch-maschine-interface)
11. [UI Komponenten Übersicht & Funktions-Mapping](#11-ui-komponenten-übersicht--funktions-mapping)
12. [End-of-Life, Decommissioning & Das Vergessen](#12-end-of-life-decommissioning--das-vergessen)
13. [Green AI & Ökologischer Fußabdruck](#13-green-ai--ökologischer-fußabdruck)

---

## 1. Business Context & Strategischer Rahmen (CONTEXT)

### 1.1 Projektvision (max. 3 Sätze)

ME4 SM Producer 3.0 ist ein lokal ausgeführtes Workflow-Orchestrierungssystem, das Content Creatorn den gesamten Lebenszyklus der Social-Media-Videoproduktion – von der Themenfindung über Recherche, Audioproduktion, Slide-Erstellung und Videokomposition bis zum Upload – in einem geführten, 6-stufigen Prozess abbildet. Das System integriert externe KI-Dienste (Transkription, Sprechertrennung, Slide-Generierung via Kimi 2.6, Avatar-Plattform HeyGen) über standardisierte Schnittstellen und reduziert die Produktionszeit eines Videos von durchschnittlich 8 Stunden auf unter 1 Stunde.

### 1.2 Messbare KPIs

| KPI | Baseline | Zielwert | Messmethode |
|---|---|---|---|
| **Produktionszeit pro Video** | ~8 Stunden (manuell) | < 1 Stunde (mit MESM 3.0) | Zeitstempel: Projektstart bis Upload-Status = "completed" |
| **Medienbrüche pro Produktion** | 6–8 Tool-Wechsel | 0 (alles in einer App) | Zählung externer Tool-Aufrufe außerhalb MESM |
| **Anzahl Fehler/Qualitätsmängel** | Manuelle Nacharbeit in ~50% | < 10% erfordern Nacharbeit | QA-Checkliste pro Video vor Upload |

### 1.3 Compliance & regulatorische Rahmenbedingungen

- **EU AI Act**: Nicht relevant. Das System ist ein lokales Werkzeug (Single-User, Single-Machine) ohne eigenständige KI-Entscheidungsfindung. KI-Dienste werden nur als Werkzeuge orchestriert.
- **DSGVO**: Nicht relevant. Keine Verarbeitung personenbezogener Daten Dritter. Alle Daten verbleiben auf der lokalen Arbeitsstation des Nutzers.
- **Urheberrecht**: Der Nutzer ist selbst verantwortlich für die Rechte an Quellmaterial (YouTube-Videos, Webseiten, externe Dateien). Das System stellt nur Verarbeitungswerkzeuge bereit.

### 1.4 Stakeholder

| Rolle | Person | Erwartungen |
|---|---|---|
| **Content Creator (Nutzer)** | Einzelperson | Zeiteffizienz, konsistente Videoqualität, lokale Kontrolle über alle Daten |
| **Systementwickler (implizit)** | Wartung durch Nutzer selbst | Klare Verzeichnisstruktur für manuelle Eingriffe, einfache Deinstallation durch Ordnerlöschung |

> *Stakeholder-Matrix entfällt – Single-User-Werkzeug ohne weitere Rollen.*

---

## 2. Problemraumanalyse (WHY & WHAT)

### 2.1 Kernproblem

Die manuelle Erstellung qualitativ hochwertiger Social-Media-Videos (YouTube, Instagram, TikTok) erfordert aktuell **~8 Stunden pro Video** und involviert 6–8 verschiedene Werkzeuge mit erheblichen Medienbrüchen:

1. Ideenfindung / Themenrecherche (Browser, Notizen)
2. Quellenanalyse (YouTube, Webseiten – manuelles Lesen/Ansehen)
3. Audio-Skripterstellung und -Aufnahme (separate Recording-Tools)
4. Bildmaterial / Slides erstellen (PowerPoint, Canva, Bilddatenbanken)
5. Videokomposition (Video-Editor mit manueller Timeline-Arbeit)
6. Upload zu Plattformen (jeweils eigene UIs)

**Schmerz-Metrik**: 8 Stunden pro Video, fragmentierter Workflow, keine Wiederverwendung von Vorlagen, hohe Fehlerquote durch manuelle Koordination.

### 2.2 Problemkategorisierung (Obligation / Expectation / Hope)

| Kategorie | Beschreibung |
|---|---|
| **Obligation** (Muss) | Korrekte Verarbeitung der Audio-Dateien: Transkription und Sprechertrennung müssen fehlerfrei funktionieren, da sie Grundlage für alle Folgeschritte sind. |
| **Expectation** (Soll) | Der geführte 6-Schritte-Prozess soll die Produktionszeit von ~8 Stunden auf < 1 Stunde reduzieren und Medienbrüche eliminieren. |
| **Hope** (Kann) | Vollautomatisierung einzelner Schritte (Research, Slides) nach initialer manueller Validierung des Workflows; Direkt-Upload zu Social-Media-Plattformen. |

### 2.3 Bedarfszuordnung (Needs)

| ID | Need | Abgedeckt durch | Priorität |
|---|---|---|---|
| N01 | Strukturierter, geführter Videoproduktionsprozess | 6-Schritte-Navigator | Hoch |
| N02 | Wiederverwendbare Kanal-Vorlagen (Prompts, Intros, Outros, Kriterien) | Kanal-Setup (Navigator Punkt 7) | Hoch |
| N03 | Automatische Audio-Transkription und Sprechertrennung | MCP-Services in Schritt 3 | Hoch |
| N04 | KI-gestützte Slide-Erstellung | Kimi 2.6 Integration in Schritt 4 | Mittel |
| N05 | Lokale Ausführung ohne Cloud-Abhängigkeit | Local-First-Architektur, SQLite | Hoch |
| N06 | Copy/Paste-Bridge zu externen Plattformen (NotebookLM, HeyGen) | Research- und Video-Schritt | Mittel |
| N07 | Thumbnail-Generierung via KI | Upload-Schritt 6 | Niedrig |
| N08 | Videomarketing / Interessenten-Benachrichtigung | Upload-Schritt 6 (letzter Microservice) | Niedrig |

---

## 3. Software Vision & Architektur-Entwurf (GLANCE)

### 3.1 Vision

Ein lokal gehostetes „Power-Tool" für den Single-User-Betrieb, das den gesamten Social-Media-Videoproduktionsprozess in einem 4-Quadranten-UI (Navigator, Header, Arbeitsfläche, Chat-Sidebar) strukturiert. Die Architektur folgt dem **SOA-Prinzip** der ME4-Entwicklungsvorgaben mit 3 Ebenen: App → SOA-Services → Microservices.

### 3.2 Architekturprinzipien

| # | Prinzip | Begründung |
|---|---|---|
| 1 | **Local-First** | Alle Kernkomponenten laufen auf der lokalen Maschine. Keine Prozesssteuerung in der Cloud. Gibt dem Nutzer volle Datenkontrolle. |
| 2 | **Modulare Service-Architektur (SOA)** | Arbeitsschritte sind als „Services" definiert, die intern in „Microservices" unterteilt sind. Erlaubt unabhängige Entwicklung und Austausch einzelner Dienste. |
| 3 | **Zentrale Lastverteilung** | Bei mehreren Instanzen desselben Service (z.B. 3× Transkription) wird immer die Instanz mit der geringsten Auslastung gewählt. Vermeidet Überlastung und minimiert Wartezeiten. |
| 4 | **Hybrid-Integration (MCP/REST)** | Das konkrete Protokoll (MCP oder REST) ist zweitrangig. Entscheidend ist die standardisierte, austauschbare Schnittstelle zu externen KI-Diensten mit zentraler Lastverteilung. |
| 5 | **Flexibler KI-Stack** | Beim Programmstart wählt der Nutzer den LLM-Provider (Kimi, DeepSeek, LM Studio/lokal). API-Keys werden zentral in der globalen DB verwaltet. |
| 6 | **Drei-Ebenen-Persistenz** | SQLite-basiert: Global DB (systemweit), Kanal-DB (pro Kanal), Projekt-DB (pro Video). Keine Shared Database zwischen Services. |

### 3.3 Systemgrenzen

#### Innerhalb des Systems (lokale Maschine)

- Electron/Desktop-Shell
- React SPA (4-Quadranten-UI)
- Express.js API-Gateway (im Electron Main Process)
- 6 SOA-Services: `kanal-service`, `projekt-service`, `media-service`, `prompt-service`, `workflow-service`, `upload-service`
- 16+ Microservices unter diesen SOA-Services
- 3 SQLite-Datenbanken (global, kanal, projekt)
- Lokales Dateisystem (Root-Verzeichnis, Kanal-Ordner, Projekt-Ordner)

#### Außerhalb des Systems (externe Services)

| Externer Service | Schnittstelle | Zweck |
|---|---|---|
| **MCP Transkription** | MCP (oder REST) | Audio → Text (Whisper/Deepgram) |
| **MCP Sprechertrennung** | MCP (oder REST) | Audio → N Sprecherspuren (Speaker Diarization) |
| **NotebookLM** | Copy/Paste-Bridge | Recherche-Quellenanalyse |
| **HeyGen Avatar-Plattform** | Copy/Paste-Bridge | Avatar-Video-Generierung |
| **Kimi 2.6** | API (MCP) | Slide-Generierung (Prompt → ZIP mit JPEGs) |
| **Thumbnail-Generator** | MCP | Prompt → Thumbnail-Bild |
| **TTS-Engine** | Lokal (edge-tts) / Cloud (Google, Microsoft) | Text → Sprache |
| **LLM-Provider** | API (Kimi, DeepSeek, LM Studio) | Prompt-Generierung, Analyse |

> *Systemgrenzen-Diagramm siehe:* [`Documentation/architecture/c4-container.md`](../architecture/c4-container.md)

### 3.4 Kommunikationsmuster

| Kommunikation | Protokoll | Timeout | Lastverteilung |
|---|---|---|---|
| App → SOA-Service | REST/HTTP (lokal) | 5s | – (Single-Instance) |
| SOA-Service → Microservice | REST/HTTP (lokal) | 5s | – |
| Microservice → Externer MCP | MCP / REST | 30s | **Ja**: Least-Utilization Load Balancer |
| Microservice → Externer LLM | REST/HTTP | 30s | Provider-spezifisch |
| Copy/Paste-Bridge | Manuell (Clipboard) | – | – |

### 3.5 Maschinenlesbare Dokumentation

- `Documentation/`-Verzeichnis mit ADR, C4-Diagrammen, API-Verträgen (OpenAPI)
- `llms.txt` im Root für KI-Entwickler-Agenten-Kontext (geplant)

---

## 4. Funktionale Anforderungen (HOW)

> **Syntax:** Alle Anforderungen sind in EARS-Notation formuliert:  
> `[Trigger/Event] the system shall [Systemaktion]`

### 4.1 Kanal-Management (Navigator Punkt 7)

**[F-K01] Ubiquitous – Kanal anlegen**  
The system shall allow the user to create a new channel by providing three mandatory fields: a channel prefix (unique identifier), a channel title, and a channel description (4–5 sentences).

**[F-K02] Event-driven – Ordnerstruktur nach Kanalanlage**  
When a new channel is created, the system shall automatically create a folder named `<prefix>` in the root directory and initialize the channel database (`<prefix>.db`) within that folder.

**[F-K03] Event-driven – Vorlagen-Ordner**  
When the channel folder is created, the system shall create a subfolder named `Vorlagen` containing subfolders for `intro`, `hauptteil`, `outro`, and `hintergrund`.

**[F-K04] Ubiquitous – Prompt-Master (Prompt Generator)**  
The system shall provide a prompt template editor with two views: a design view (with variable placeholders `{{variable}}`) and a preview view (with resolved variable values rendered in red). The system shall allow the user to copy variable placeholders from a variable list and insert them into the template.

**[F-K05] Ubiquitous – Kriterienlisten**  
The system shall allow the user to manage criteria lists for Research, Audio, and Slides – each entry consisting of a keyword, category, and the prompt text snippet that will be inserted when the criterion is selected during a project run.

**[F-K06] Ubiquitous – Kanal-Variablen**  
The system shall allow the user to define variables (name, value, description) that are used in prompt templates and are resolved at runtime during project execution.

### 4.2 Schritt 1: Thema (Navigator Punkt 1)

**[F-T01] Event-driven – Service laden**  
When the user clicks on "1. Thema" in the navigator, the system shall load the Thema workspace with all associated microservices displayed as an accordion with the Harmonium effect (only one microservice panel open at a time).

**[F-T02] Ubiquitous – Kanal wählen**  
The system shall present a dropdown list of all previously created channels, allowing the user to select the channel for which a video will be produced.

**[F-T03] Ubiquitous – Quellen erfassen**  
The system shall allow the user to provide source material for topic discovery via four input methods: (a) direct text input, (b) website URL, (c) YouTube URL, (d) file upload.

**[F-T04] Event-driven – Quellenanalyse starten**  
When the user clicks the "Analyse" button after providing sources, the system shall send the source content to the configured LLM for topic extraction, using the channel-specific prompt template from `Kanal > Prompt-Master`.

**[F-T05] Ubiquitous – Themenvorschläge anzeigen**  
The system shall display extracted topics as a list, where each topic shows: title, description (360 characters), and assigned category (from channel's criteria list). The system shall highlight selected topics by changing their background color on click.

**[F-T06] Ubiquitous – Kategorie ändern**  
The system shall allow the user to change the category assignment of any topic suggestion.

**[F-T07] Event-driven – Themen zusammenfassen**  
When the user selects one or more topics and clicks "Zusammenfassen", the system shall generate a unified topic summary including a combined title incorporating the names of all selected topics. The system shall then generate the project ID.

**[F-T08] Event-driven – Projekt-ID generieren**  
When the user triggers topic summarization, the system shall generate a unique project ID in the format `<prefix>-<YYYY><MM><DD>_<HH><MM><SS>` and display it in the header bar.

**[F-T09] Event-driven – Projektordner erstellen**  
When the project ID is generated and the user clicks "Projekt erstellen", the system shall: create a folder named after the project ID inside the channel folder, create six numbered subfolders (1. Thema, 2. Recherche, 3. Audio, 4. Slides, 5. Video, 6. Upload), and initialize the project database (`<projekt-id>.db`).

### 4.3 Schritt 2: Research (Navigator Punkt 2)

**[F-R01] Ubiquitous – NotebookLM-Daten anzeigen**  
The system shall display the project title and description with a copy-to-clipboard button for each, allowing the user to paste them into NotebookLM. The title and description shall be populated from the selected topic.

**[F-R02] Ubiquitous – Notebook-Inhalt (Notizen)**  
The system shall provide a free-text field "Notebook Inhalt" for the user to record thoughts and notes for documentation purposes.

**[F-R03] Ubiquitous – Research-Kriterien auswählen**  
The system shall display a table of research criteria (from channel setup) with a checkbox column for selection, a full-text search field above the table, and an option to add an additional manual text input that flows into the prompt.

**[F-R04] Event-driven – Research-Prompt generieren**  
When the user selects criteria and clicks "Prompt generieren", the system shall compose a prompt from the selected criteria's prompt snippets plus any additional manual text, render it in the preview area, and provide a "Kopieren" button to copy the prompt to the clipboard.

**[F-R05] Optional – Vollautomatisierung Research**  
The system may, in a future phase, fully automate the Research step by directly interfacing with NotebookLM's API instead of using copy/paste.

### 4.4 Schritt 3: Audio (Navigator Punkt 3)

**[F-A01] Ubiquitous – Audio-Prompt erzeugen**  
The system shall provide criteria selection (from channel's Audio criteria list), a manual text supplement field, and a prompt generation button – following the same pattern as the Research step.

**[F-A02] Ubiquitous – Prompt editieren**  
The system shall display the generated Audio prompt in an editable text area, allowing the user to modify it before use.

**[F-A03] Ubiquitous – Audio hochladen**  
The system shall allow the user to upload an audio file (mp3/wav) and specify the number of speakers present in the recording.

**[F-A04] Event-driven – Audio-Verarbeitung triggern**  
When the user uploads an audio file, the system shall send the file to two external MCP services:
- **Transkription**: Receives the audio file and returns a JSON transcript with fields: `start_time`, `end_time`, `speaker`, `text`
- **Sprechertrennung**: Receives the audio file and the speaker count, returns N separate audio files (one per speaker)

**[F-A05] Event-driven – Verarbeitungsergebnisse ablegen**  
When the MCP services return their results, the system shall automatically save the separated speaker files and the transcript JSON into the project's `3. Audio` folder.

**[F-A06] Ubiquitous – Transkript anzeigen**  
The system shall display the complete transcript as a structured table with columns: Start Time, End Time, Speaker (A/B/C), and Text.

**[F-A07] Optional – Lastverteilung**  
If multiple instances of the transcription or speaker separation service are running, the system shall route the request to the instance with the lowest current utilization.

### 4.5 Schritt 4: Slides (Navigator Punkt 4)

**[F-S01] Ubiquitous – Slides-Kriterien auswählen**  
The system shall provide criteria selection from the channel's Slides criteria list, following the same pattern as Research and Audio.

**[F-S02] Event-driven – Slides-Prompt generieren**  
When the user selects criteria and clicks the prompt generation button, the system shall compose a prompt using the channel's prompt template (from Kanal > Prompt-Master), resolve all `{{variables}}` with their stored values, and display the result.

**[F-S03] Ubiquitous – Slides-Ergebnisse hochladen**  
The system shall allow the user to upload a ZIP file containing JPEG slide images, and either: (a) enter text directly, or (b) paste a text table that the system will parse using KI into a structured table.

**[F-S04] Ubiquitous – Steuerdatei**  
The system shall generate a control file (Steuerdatei) from the parsed table that defines, for each slide filename, a start time and end time determining how long the slide is displayed.

### 4.6 Schritt 5: Video (Navigator Punkt 5)

**[F-V01] Ubiquitous – Videoformat wählen**  
The system shall allow the user to select the video format (16:9 landscape, 9:16 portrait, 1:1 square) and target platform (YouTube, TikTok, Instagram, LinkedIn, Other).

**[F-V02] Ubiquitous – Intro-Vorlage wählen**  
The system shall display a carousel of intro templates from the channel's `Vorlagen/intro` folder. The user selects one. Each template can be an image or a video file.

**[F-V03] Ubiquitous – Outro-Vorlage wählen**  
The system shall display a carousel of outro templates from the channel's `Vorlagen/outro` folder, following the same pattern as intro selection.

**[F-V04] Ubiquitous – Hintergrund wählen**  
The system shall display a carousel of background images/videos from the channel's `Vorlagen/hintergrund` folder.

**[F-V05] Ubiquitous – Zeitleiste (Timeline)**  
The system shall display a visual timeline with the following tracks:
- **Hintergrund-Spur**: continuous background for the main section
- **Sprecher A-Spur**: speaker A audio file
- **Sprecher B-Spur**: speaker B audio file
- **Slides-Spur**: individual slides with their durations
- **Intro-Bereich**: before the main section
- **Outro-Bereich**: after the main section

**[F-V06] Ubiquitous – Längenprüfung**  
The system shall enforce that the total length of the background track, speaker A, speaker B, and the sum of all slide durations are equal in the main section.

**[F-V07] Event-driven – Vollständigkeitsprüfung**  
When the user clicks "Vollständigkeit prüfen", the system shall copy all required assets into a dedicated export directory.

**[F-V08] Event-driven – Video-Editor starten**  
When the user clicks "Video Editor starten", the system shall launch the external video editor program with the export directory as its input, allowing final layout adjustments and rendering.

### 4.7 Schritt 6: Upload (Navigator Punkt 6)

**[F-U01] Ubiquitous – Video-Vorschau**  
The system shall display the rendered final video in a preview player with associated metadata.

**[F-U02] Ubiquitous – Thumbnail-Erstellung**  
The system shall generate two thumbnail variants using the channel's thumbnail prompt template (from Kanal > Prompt-Master). The user selects one for upload.

**[F-U03] Ubiquitous – Ablaufdaten erfassen**  
The system shall allow the user to enter: video title, video description, upload date, and publication date (typically 2 days after upload).

**[F-U04] Ubiquitous – Publizieren**  
The system shall allow the user to trigger the actual upload to the selected platform.

**[F-U05] Optional – Videomarketing**  
The system may provide a contact list (maintained in Kanal) for notifying interested parties via their preferred channel (email, WhatsApp, Telegram) about the new video.

### 4.8 Unerwünschtes Verhalten (Unwanted Behaviors)

**[F-UB01]** If the external MCP transcription service does not respond within 30 seconds, the system shall abort the request and display the error message: „Transkriptionsdienst nicht erreichbar. Bitte versuchen Sie es erneut."

**[F-UB02]** If the speaker separation service returns fewer speaker files than the user specified, the system shall display a warning: „Erwartet: <N> Sprecher. Erhalten: <M> Spuren." and allow the user to either proceed or re-upload.

**[F-UB03]** If the LLM prompt generation returns an empty response, the system shall display: „Prompt konnte nicht generiert werden. Bitte überprüfen Sie die ausgewählten Kriterien."

**[F-UB04]** If a ZIP file uploaded for Slides contains no JPEG files, the system shall display: „Keine JPEG-Dateien im ZIP-Archiv gefunden. Bitte überprüfen Sie den Inhalt."

**[F-UB05]** If the user attempts to proceed to the next step without completing all required fields in the current step, the system shall highlight the incomplete fields with a red border and display: „Bitte füllen Sie alle markierten Pflichtfelder aus, bevor Sie fortfahren."

**[F-UB06]** If the API key for a configured LLM provider is invalid or expired, the system shall display: „API-Key für <Provider> ungültig. Bitte aktualisieren Sie den Key in den globalen Einstellungen." and prevent LLM-based operations until resolved.

**[F-UB07]** If the root directory is deleted or becomes inaccessible during runtime, the system shall display: „Root-Verzeichnis nicht erreichbar. Bitte überprüfen Sie den Pfad in den globalen Einstellungen." and block all read/write operations.

---

## 5. KI-spezifische Nicht-Funktionale Anforderungen (NFRs)

### 5.1 Performanz & Latenz

| Metrik | Zielwert | Messmethode |
|---|---|---|
| **LLM Prompt → Response (TTFT)** | < 3 Sekunden | Time-to-First-Token via API-Timing |
| **MCP Audio-Transkription (60min Audio)** | < 5 Minuten | Zeitstempel Upload → Ergebnis |
| **MCP Sprechertrennung (60min Audio)** | < 5 Minuten | Zeitstempel Upload → Ergebnis |
| **Slide-Generierung Kimi 2.6** | < 2 Minuten | Zeitstempel Prompt → ZIP-Download |
| **Thumbnail-Generierung** | < 30 Sekunden | Zeitstempel Prompt → Bild |

### 5.2 Zuverlässigkeit & Halluzination

| Aspekt | Anforderung |
|---|---|
| **Halluzinationskontrolle bei Themen-Extraktion** | Extrahierte Themen müssen auf den Quellen basieren. Wenn der LLM kein Thema findet, soll er „Keine verwertbaren Themen gefunden" zurückgeben – keine erfundenen Themen. |
| **Transkript-Genauigkeit** | Die Transkription muss eine Wortfehlerrate (WER) von < 10% aufweisen (Referenz: manuell annotiertes Golden Dataset von 3 Test-Audioaufnahmen). |
| **Quellenangaben** | Bei Themenvorschlägen soll der LLM angeben, aus welcher Quelle das Thema extrahiert wurde (Text/YouTube/Website). |

### 5.3 Sicherheit

| Aspekt | Maßnahme |
|---|---|
| **Prompt Injection Prevention** | Alle Benutzereingaben werden vor dem Senden an LLMs auf verdächtige Muster geprüft (z.B. „ignore previous instructions", „system prompt"). Solche Eingaben werden abgewiesen mit: „Eingabe enthält nicht erlaubte Anweisungen." |
| **API-Key-Schutz** | API-Keys werden ausschließlich in der globalen SQLite-Datenbank gespeichert, nie im Klartext in Logs oder Debug-Ausgaben. Die DB-Datei wird mit Dateiberechtigungen geschützt. |
| **Lokale Datenhoheit** | Keine Projektdaten, Audiodateien, Slides oder Videos verlassen die lokale Maschine ohne expliziten Nutzerbefehl (Upload zu Plattformen). |
| **Dependency-Scanning** | Vor jedem Release werden alle Abhängigkeiten auf bekannte CVEs gescannt (npm audit / pip audit). |

### 5.4 Transparenz & XAI

| Aspekt | Anforderung |
|---|---|
| **KI-Kennzeichnung** | KI-generierte Inhalte (Themenvorschläge, Prompt-Texte, Thumbnails) werden im UI mit dem Label „KI-generiert" gekennzeichnet. |
| **Prompt-Nachvollziehbarkeit** | Der für jede KI-Anfrage verwendete vollständige Prompt wird in der Projekt-Datenbank gespeichert und im Info-Tab der Sidebar einsehbar. |
| **Modell-Transparenz** | Das aktuell verwendete LLM wird im Header oder der Sidebar angezeigt (z.B. „KI: Kimi 2.6"). |

---

## 6. Datenqualitäts- und Datenmanagement-Framework

### 6.1 Datenhaltungs-Hierarchie

```
Root-Verzeichnis/
├── global.db                          # Globale Einstellungen, API-Keys, Kanalliste
├── <kanal-prefix>/                    # Ein Ordner pro Kanal
│   ├── <prefix>.db                    # Kanal-DB: Templates, Kriterien, Variablen, Vorlagen
│   ├── Vorlagen/                      # Medien-Vorlagen
│   │   ├── intro/                     # Intro-Videos/Bilder
│   │   ├── hauptteil/
│   │   ├── outro/
│   │   └── hintergrund/
│   └── <projekt-id>/                  # Ein Ordner pro Projekt
│       ├── <projekt-id>.db            # Projekt-DB: Metadaten, Artefakt-Pfade
│       ├── 1. Thema/
│       ├── 2. Recherche/
│       ├── 3. Audio/
│       ├── 4. Slides/
│       ├── 5. Video/
│       └── 6. Upload/
```

### 6.2 Datenbank-Spezifikation

| Ebene | Engine | Schema | Verantwortlich |
|---|---|---|---|
| **Global DB** | SQLite | `llm_providers`, `app_settings`, `tts_profile`, `channels` | `kanal-service` |
| **Kanal-DB** | SQLite | `kriterien_research`, `kriterien_audio`, `kriterien_slides`, `prompt_templates`, `kanal_variablen`, `video_vorlagen`, `marketing_kontakte` | `kanal-service` |
| **Projekt-DB** | SQLite | `projekt_meta`, `thema_quellen`, `thema_ergebnisse`, `research_notizen`, `research_kriterien_selected`, `audio_konfig`, `audio_spuren`, `transkript`, `slides_ergebnisse`, `slides_timing`, `video_konfig`, `video_timeline`, `upload_daten` | `projekt-service` |

> *Vollständiges Datenbankschema siehe:* [`plans/MESM3-Implementierungsplan.md`](../../../../plans/MESM3-Implementierungsplan.md), Abschnitt 7

### 6.3 Daten-Provenienz & Qualität

| Aspekt | Regel |
|---|---|
| **Quellenmaterial (YouTube, Webseiten, Dateien)** | Der Nutzer ist für die Rechte des Quellmaterials verantwortlich. Das System speichert nur Analyseergebnisse, nicht die Original-Quellen. |
| **Audio-Dateien** | Hochgeladene Audiodateien werden unverändert im Projekt-Ordner gespeichert. Keine automatische Löschung. |
| **Transkripte** | Werden als JSON gespeichert. Validierung: Satz-Anzahl > 0, alle Pflichtfelder befüllt. |
| **Slides (JPEG)** | Werden aus ZIP extrahiert und im Slides-Ordner abgelegt. Validierung: Dateiendung `.jpg`/`.jpeg`, Dateigröße > 0. |
| **Prompts** | Jeder generierte Prompt wird mit Zeitstempel und verwendeten Variablen in der Projekt-DB gespeichert. |

### 6.4 Datenbereinigung & Preprocessing

| Schritt | Beschreibung |
|---|---|
| **Textbereinigung** | Bei Quellen-Input: HTML-Tags entfernen, Whitespace normalisieren, Encoding auf UTF-8 vereinheitlichen. |
| **Transkript-Bereinigung** | Leere Sätze entfernen, Speaker-Labels normalisieren (A, B, C), Zeitstempel auf Plausibilität prüfen (start < end). |
| **Keine PII-Erkennung** | Keine automatisierte Erkennung/Entfernung personenbezogener Daten erforderlich (Single-User, lokale Maschine). |

### 6.5 Update-Zyklen

| Datentyp | Aktualisierung |
|---|---|
| **Prompt-Templates** | Manuell durch Nutzer im Kanal-Setup (vor jedem Projektlauf anpassbar) |
| **Kriterien-Listen** | Manuell durch Nutzer – evolutionär wachsend mit jedem Projekt |
| **Video-Vorlagen** | Manuell durch Nutzer – Dateien in `Vorlagen/` ablegen |
| **LLM-Provider-Keys** | Bei Provider-Wechsel oder Key-Rotation (Nutzermanagement) |

---

## 7. Qualitätssicherung, Evaluierung & MLOps

### 7.1 Prozess-inhärente Qualitätssicherung

Die 6-Schritte-Struktur dient selbst als Qualitätssicherungsmechanismus:
- **Schritt 1 → Schritt 2**: Das ausgewählte Thema bestimmt den Research-Fokus
- **Schritt 2 → Schritt 3**: Die Recherche-Ergebnisse informieren das Audio-Skript
- **Schritt 3 → Schritt 4**: Das Transkript definiert Timing und Struktur der Slides
- **Schritt 4 → Schritt 5**: Die Steuerdatei treibt die Video-Timeline
- **Schritt 5 → Schritt 6**: Das fertige Video wird vor Upload validiert

Die **Kanal-Einrichtung (Navigator Punkt 7)** dient als Master-Konfiguration: Prompts, Auswahllisten und Vorlagen werden einmal definiert und stellen konsistente Qualität über alle Projektläufe sicher.

### 7.2 Evaluierung

| Metrik | Methode | Zielwert |
|---|---|---|
| **Transkript-Qualität (WER)** | Manueller Vergleich gegen Golden Dataset (3 Audio-Dateien) | < 10% WER |
| **Themen-Relevanz** | Nutzer wählt min. 1 von 5 vorgeschlagenen Themen aus | ≥ 80% der Projekte |
| **Prompt-Konsistenz** | LLM-as-Judge: Vergleich generierter Prompt gegen Kanal-Template | > 90% Template-Treue |
| **Endprodukt-Qualität** | QA-Checkliste (Ton, Bild, Timing) pro Video | < 10% erfordern Nacharbeit |

### 7.3 Golden Dataset

Ein Satz von 3 Test-Audioaufnahmen mit manuell annotierten Transkripten (Sprecher, Zeitstempel, Text) wird vor dem ersten Release erstellt und für Regressionstests verwendet.

### 7.4 Human-in-the-Loop

| Eskalationspunkt | Schwellenwert | Aktion |
|---|---|---|
| LLM-generierte Themen | Immer | Nutzer wählt aus und bestätigt |
| Transkript | Immer | Nutzer sieht Transkript und kann korrigieren |
| Slide-Steuerdatei | Immer | Nutzer prüft Timing vor Video-Komposition |
| Prompt-Injection-Verdacht | Automatisch | Eingabe wird blockiert, Nutzer erhält Hinweis |

### 7.5 Monitoring & Drift

| Aspekt | Umsetzung |
|---|---|
| **Model-Drift** | Nicht kritisch – wechselnde LLM-Provider und manuelle Qualitätsprüfung durch Nutzer in jedem Projektlauf |
| **Data-Drift** | Vorlagen und Kriterien werden vom Nutzer selbst gepflegt und bei Bedarf angepasst |
| **Fehler-Log** | Alle MCP-Timeouts und LLM-Fehler werden in der Projekt-DB mit Zeitstempel protokolliert |

---

## 8. Dokumentationsartefakte & Transparenz

### 8.1 Architecture Decision Records (ADR)

| ADR | Titel | Status |
|---|---|---|
| [ADR-001](../adr/001-microservice-aufteilung.md) | Microservice-Aufteilung: Pipeline vs. Renderer | Akzeptiert |

Weitere ADRs sind für folgende Entscheidungen zu erstellen:
- ADR-002: Wahl von SQLite als Datenbank-Engine
- ADR-003: MCP als Integrationsprotokoll für externe KI-Services
- ADR-004: Electron als Desktop-Shell
- ADR-005: Lastverteilungsstrategie für Service-Instanzen

### 8.2 Projekt-Transparenz

| Artefakt | Speicherort | Zweck |
|---|---|---|
| **Projekt-ID im Header** | App-Header | Eindeutige Identifikation des aktiven Projekts |
| **Ordnerstruktur** | Dateisystem | Alle Zwischenergebnisse persistent und nachvollziehbar |
| **Prompt-Historie** | Projekt-DB | Jeder generierte Prompt mit Variablen und Zeitstempel |
| **Transkript** | JSON in `3. Audio/` | Lückenlose Dokumentation der Audio-Inhalte |

### 8.3 Audit-Fähigkeit

- Alle LLM-Aufrufe werden mit Prompt und Response in der Projekt-DB geloggt
- MCP-Service-Aufrufe werden mit Zeitstempel, Service-Name und Status protokolliert
- Fehler-Logs sind im Projekt-Kontext einsehbar

### 8.4 Model Card

Da MESM 3.0 kein eigenes KI-Modell trainiert, sondern externe Dienste orchestriert, entfällt eine formale Model Card. Stattdessen wird eine **Provider-Übersicht** in den globalen Einstellungen geführt:

| Feld | Beispiel |
|---|---|
| Provider | Kimi 2.6 |
| Modell | moonshot-v1 |
| Zweck | Slide-Generierung, Themen-Analyse |
| Einschränkungen | Nur chinesische und englische Prompts optimal |
| Alternative | DeepSeek V3 |

---

## 9. FinOps & Die Ökonomie des maschinellen Denkens

### 9.1 Kostenkontrolle

| Aspekt | Maßnahme |
|---|---|
| **Token-Budget** | Keine festen Budgets – Kostentransparenz durch lokales Logging der API-Calls. Nutzer kann monatliche Kosten aus den Provider-Dashboards entnehmen. |
| **API-Key-Management** | Zentrale Verwaltung in Global DB. Nutzer kann jederzeit Provider wechseln (z.B. von Kimi zu lokalem LM Studio für kostensparenden Betrieb). |
| **Lokale Fallbacks** | LM Studio (lokales LLM) verursacht keine API-Kosten und kann für einfache Aufgaben (Prompt-Generierung, Text-Analyse) verwendet werden. |

### 9.2 Kostentreiber

| Operation | Kostenfaktor | Einsparpotenzial |
|---|---|---|
| Themen-Analyse | LLM-Tokens (Input: Quellen, Output: Themen) | Lokales LLM für Routine-Analysen |
| Slide-Generierung | Kimi 2.6 API | – (primärer Use Case) |
| Transkription | MCP-Service (Whisper/Deepgram) | Lokale Whisper-Instanz via MCP |
| Thumbnail | Image-Gen API | Wiederverwendung von Templates |
| TTS | Google/Microsoft Cloud TTS | Lokale edge-tts |

### 9.3 ROI-Berechnung

| Faktor | Wert |
|---|---|
| **Zeitersparnis pro Video** | 7 Stunden (8h → <1h) |
| **Videos pro Woche** | Annahme: 3 Videos |
| **Zeitersparnis pro Woche** | 21 Stunden |
| **Primärer ROI-Treiber** | Zeit, nicht Token-Kosten |

### 9.4 Modell-Routing

| Aufgabe | Primärer Provider | Fallback | Begründung |
|---|---|---|---|
| Themen-Analyse | Kimi 2.6 | DeepSeek | Kimi für kreative Analyse |
| Prompt-Generierung | DeepSeek V3 | LM Studio (lokal) | DeepSeek für strukturierte Texte |
| Slide-Erstellung | Kimi 2.6 | – | Proprietäre Slide-Funktion |
| Thumbnail | Image-Gen via MCP | – | – |

---

## 10. UX/UI & Das Mensch-Maschine-Interface

### 10.1 Layout-Architektur (4-Quadranten-Schema)

```
┌──────────────────────────────────────────────────────────┐
│ HEADER: [MESM 3.0]  │  Projekt-ID  │  🔔  │  ⚙  │  ?  │
├────────┬─────────────────────────────────┬───────────────┤
│        │                                 │  SIDEBAR      │
│NAVIGATOR│     ARBEITSFLÄCHE               │  ┌─┐         │
│        │                                 │  │Chat│      │
│ 1.Thema│  ┌─ Service-Akkordeon ───────┐  │  │Var │      │
│ 2.Res. │  │ 1. Microservice ▾        │  │  │Info│      │
│ 3.Audio│  │    Content Panel          │  │  └─┘         │
│ 4.Slide│  │ 2. Microservice ▸        │  │               │
│ 5.Video│  │ 3. Microservice ▸        │  │               │
│ 6.Upl. │  └──────────────────────────┘  │               │
│────────│                                 │               │
│ 7.Kanal│                                 │               │
└────────┴─────────────────────────────────┴───────────────┘
```

### 10.2 Interaktionsprinzipien

| Prinzip | Beschreibung |
|---|---|
| **Harmonium-Effekt** | Innerhalb eines Service sind Microservices als Akkordeon-Panels angeordnet. Beim Öffnen eines Panels wird das zuvor geöffnete automatisch geschlossen – es ist immer nur ein Panel auf einmal geöffnet. |
| **Prozessführung von oben nach unten** | Die Microservices eines Service sind sequenziell und werden von oben nach unten abgearbeitet. |
| **Navigator-gesteuerter Workspace** | Klick auf einen Navigator-Eintrag lädt die entsprechende Arbeitsfläche. Der zuvor geöffnete Service wird geschlossen. |
| **Copy-to-Clipboard-Pattern** | Für die Brücke zu NotebookLM und HeyGen werden Datenfelder mit einem Kopieren-Button angeboten. Der Nutzer fügt sie manuell im externen Tool ein. |

### 10.3 Sidebar-Reiter

| Reiter | Funktion |
|---|---|
| **Chat** | KI-Interaktion: Der Nutzer kann hier mit dem konfigurierten LLM chatten, z.B. für Ideenfindung oder Problemlösung während des Prozesses. |
| **Variablen** | Zeigt alle im aktuellen Kanal definierten Variablen mit ihren aktuellen Werten an. Dient als Referenz während der Prompt-Erstellung. |
| **Info** | Kontext-Informationen zum aktuellen Projekt: Prompt-Historie, verwendete Quellen, Status aller Schritte. |

### 10.4 Header-Elemente

| Element | Funktion |
|---|---|
| **App-Name („MESM 3.0")** | Fix, links im Header |
| **Projekt-ID** | Erscheint nach Schritt 1 (Thema). Format: `<kanal-prefix>-<YYYY><MM><DD>_<HH><MM><SS>` |
| **Glocke (🔔)** | Benachrichtigungen: Aktiv bei neuen, ungelesenen System-Infos. Deaktivierung durch Klick. |
| **Zahnrad (⚙)** | Öffnet das globale Einstellungen-Modal (LLM-Provider, Root-Verzeichnis, TTS, Kanäle, Hilfe-URL, Info-Toggle) |
| **Fragezeichen (?)** | Öffnet eine externe Webseite (in den Einstellungen konfigurierbare Hilfe-URL) in einem neuen Browser-Tab |

### 10.5 Feedback & Ladezustände

| Zustand | Visuelle Darstellung | Timeout |
|---|---|---|
| **LLM-Anfrage läuft** | Spinner-Animation im betroffenen Panel, Button deaktiviert | 30s |
| **MCP-Service läuft** | Fortschrittsbalken mit Status-Text („Transkribiere Audio...") | 5min |
| **Datei-Upload** | Upload-Fortschrittsbalken | – |
| **Erfolg** | Grüner Badge „Erledigt" am Microservice-Header | – |
| **Fehler** | Rotes Panel mit Fehlermeldung und Wiederholen-Button | – |

### 10.6 Onboarding

- **Erster Start**: Das Einstellungen-Modal öffnet sich automatisch und fordert den Nutzer auf: (1) Root-Verzeichnis wählen, (2) mindestens einen LLM-Provider konfigurieren, (3) ersten Kanal anlegen.
- **Prompt-Vorlagen**: In der Design-Ansicht des Prompt-Masters werden verfügbare Variablen als auswählbare Chips dargestellt. Ein Klick fügt `{{variable}}` an der Cursor-Position ein.
- **KI-generiert-Label**: Alle KI-generierten Inhalte werden mit einem dezenten Label markiert.

---

## 11. UI Komponenten Übersicht & Funktions-Mapping

### 11.1 Komponenten-Inventar

#### Atoms (UI-001 … UI-099)

| UI-ID | Name | Typ | Funktion |
|---|---|---|---|
| UI-001 | PrimaryButton | Button | Primäre Aktion auslösen („Generieren", „Erstellen", „Analysieren") |
| UI-002 | SecondaryButton | Button | Sekundäre Aktion („Abbrechen", „Zurück") |
| UI-003 | InputField | Eingabe | Einzeilige Texteingabe (Titel, URLs, Projektname) |
| UI-004 | SelectDropdown | Auswahl | Einfachauswahl aus Liste (Kanal, Format, Plattform) |
| UI-005 | NumberBadge | Anzeige | Anzahl-Indikator (z.B. Sprecheranzahl, Slide-Count) |
| UI-006 | RangeSlider | Eingabe | TTS-Geschwindigkeit (0.5x–2.0x) |
| UI-007 | ToggleSwitch | Eingabe | Info-Reiter ein/aus, Einstellungen-Toggles |
| UI-008 | Checkbox | Eingabe | Kriterien-Auswahl, Themen-Auswahl |
| UI-009 | TextareaField | Eingabe | Mehrzeilige Texteingabe (Beschreibung, Notizen, Prompt-Edit) |
| UI-010 | Spinner | Anzeige | Ladeindikator für LLM- und MCP-Anfragen |
| UI-011 | FileUploadDropzone | Eingabe | Datei-Upload via Drag & Drop (Audio, ZIP, Bilder) |
| UI-012 | CopyButton | Button | Text in Zwischenablage kopieren mit visueller Bestätigung |
| UI-013 | StatusBadge | Anzeige | Status-Indikator („Erledigt"/grün, „Fehler"/rot, „Läuft"/blau) |

#### Molecules (UI-100 … UI-299)

| UI-ID | Name | Funktion | Datenfluss |
|---|---|---|---|
| UI-100 | SearchField | Volltextsuche über Kriterien-Tabelle | Input: Suchbegriff → Output: gefilterte Tabellenzeilen |
| UI-101 | PromptEditor | Zweigeteilter Editor (Design/Preview) mit Variablen-Chips | Input: Template-Text + Variablen → Output: aufgelöster Prompt |
| UI-102 | CriteriaTable | Tabelle mit Checkbox, Kategorie, Keyword, Prompt-Snippet | Input: Kriterien-Liste → Output: ausgewählte IDs |
| UI-103 | FileList | Liste hochgeladener Dateien mit Löschfunktion | Input: Dateien → Output: Dateipfade |
| UI-104 | TranscriptTable | Tabelle: Start, Ende, Sprecher, Text | Input: JSON-Transkript → Output: visuelle Tabelle |
| UI-105 | VideoPlayer | Video-Player mit Play/Pause/Seek | Input: Video-Pfad → Output: Wiedergabe |
| UI-106 | TemplateCarousel | Bild/Video-Karussell mit Pfeilen und Vorschau | Input: Vorlagen-Verzeichnis → Output: ausgewählte Datei |
| UI-107 | YouTubeEmbed | YouTube-Video-Einbetter | Input: YouTube-URL → Output: eingebetteter Player |
| UI-108 | VariableList | Liste aller Kanal-Variablen mit Name/Wert | Input: Kanal-Variablen → Output: kopierte Variable |
| UI-109 | TimelineBar | Visuelle Zeitleiste mit mehreren Spuren | Input: Audio/Slides-Daten → Output: Längenvalidierung |
| UI-110 | LLMProviderConfig | Konfigurationsformular für LLM-Provider | Input: Provider-Daten → Output: gespeichert in Global DB |
| UI-111 | ChatMessage | Chat-Nachricht (User/Bot) mit Zeitstempel | Input: Nachrichtentext → Output: angezeigte Nachricht |
| UI-112 | SettingsModal | Modales Fenster für globale Einstellungen | Input: Nutzereingaben → Output: Global DB |

#### Organisms (UI-300 … UI-599)

| UI-ID | Name | Enthaltene Molecules/Atoms | Funktion |
|---|---|---|---|
| UI-300 | ServiceAccordion | UI-001, UI-002, UI-010, UI-013 | Harmonium-Akkordeon für Microservices |
| UI-301 | SourceAnalysisPanel | UI-003, UI-004, UI-011, UI-107 | Quellen-Input und Analyse-Trigger |
| UI-302 | ProjectStartForm | UI-003, UI-004, UI-001 | Projekt-Metadaten erfassen |
| UI-303 | NotebookLMBridge | UI-012, UI-003, UI-009 | Copy/Paste-Bridge zu NotebookLM |
| UI-304 | AudioConfiguration | UI-003, UI-004, UI-005, UI-011 | Audio-Upload und Sprecher-Konfiguration |
| UI-305 | SlidesConfiguration | UI-003, UI-009, UI-011, UI-001 | Slides-ZIP Upload und Tabellen-Parser |
| UI-306 | VideoFormatSelector | UI-004, UI-004 | Format- und Plattform-Wahl |
| UI-307 | UploadDataForm | UI-003, UI-009 | Titel, Beschreibung, Zeitstempel |
| UI-308 | PublishButton | UI-001, UI-013 | Publizieren-Trigger mit Status |
| UI-309 | MarketingContactList | UI-003, UI-008 | Interessenten-Liste mit Multi-Channel |
| UI-310 | ThemeLibrary | UI-106 | Themen-Vorschläge mit Kategorie-Filter |
| UI-311 | SettingsPanel | UI-112, UI-110, UI-003, UI-004, UI-007 | Vollständiges Einstellungen-Modal |

#### Templates (UI-600 … UI-899)

| UI-ID | Name | Funktion |
|---|---|---|
| UI-600 | AppHeader | Anzeige App-Name, Projekt-ID, Glocke, Zahnrad, Fragezeichen |
| UI-601 | LeftSidebar | Navigator mit 7 Einträgen (1–6 + Kanal) |
| UI-602 | RightChatSidebar | Sidebar mit 3 Reitern (Chat, Variablen, Info) |
| UI-603 | FourQuadrantLayout | Gesamtlayout: Header + Navigator + Workspace + Sidebar |

#### Pages (UI-900 … UI-999)

| UI-ID | Name | Enthaltene Organisms | Dateninput | Datenoutput |
|---|---|---|---|---|
| UI-900 | ThemaPage | UI-301, UI-302, UI-310 | Quellen, Kanal-Auswahl | Projekt-ID, Themen |
| UI-901 | ResearchPage | UI-303, UI-102, UI-101 | Themen, Kriterien | Research-Prompt |
| UI-902 | AudioPage | UI-304, UI-101, UI-104 | Audio-Datei, Sprecheranzahl | Transkript, Sprecher-Spuren |
| UI-903 | SlidesPage | UI-305, UI-101, UI-102 | Slides-ZIP, Tabelle | Steuerdatei |
| UI-904 | VideoPage | UI-306, UI-106, UI-109 | Format, Vorlagen, Audio | Timeline, Export-Verzeichnis |
| UI-905 | UploadPage | UI-105, UI-307, UI-308, UI-309 | Video, Thumbnail | Upload-Status |
| UI-906 | KanalPage | UI-101, UI-102, UI-108, UI-311 | Kanal-Daten, Vorlagen | Kanal-DB |

### 11.2 Visuelle Fehlerzustände pro Komponente

| Komponente | Fehlerfall | Visuelle Reaktion |
|---|---|---|
| **LLMProviderConfig** | API-Key ungültig | Roter Rahmen um Input-Feld, Text: „API-Key ungültig" |
| **FileUploadDropzone** | Falsches Dateiformat | Rote Dropzone, Text: „Nur .mp3/.wav/.zip erlaubt" |
| **TranscriptTable** | Leeres Transkript | Text: „Keine Transkript-Daten verfügbar" |
| **TimelineBar** | Längenungleichheit | Rot markierte Spuren, Text: „Längen stimmen nicht überein" |
| **ServiceAccordion** | MCP-Timeout | Panel wird rot, Retry-Button erscheint |
| **SettingsModal** | Root-Verzeichnis ungültig | Roter Rahmen, Text: „Verzeichnis existiert nicht" |

---

## 12. End-of-Life, Decommissioning & Das Vergessen

### 12.1 Provider-Austausch (Hot-Swap)

| Maßnahme | Beschreibung |
|---|---|
| **LLM-Provider-Wechsel** | Der Nutzer kann in den globalen Einstellungen jederzeit einen neuen Provider hinzufügen und den aktiven Provider ändern. Bestehende Prompts und Einstellungen bleiben erhalten. |
| **TTS-Engine-Wechsel** | Voice und Geschwindigkeit sind in den globalen Einstellungen konfigurierbar und jederzeit änderbar. |
| **MCP-Service-Austausch** | Die MCP-Service-Endpunkte sind konfigurierbar. Ein Wechsel des Transkriptionsdienstes (z.B. von Deepgram zu lokalem Whisper) erfordert nur die Aktualisierung der Service-URL. |

### 12.2 Datenlöschung

| Ebene | Löschvorgang | DSGVO-Konformität |
|---|---|---|
| **Einzelnes Projekt** | Nutzer löscht den Projekt-Ordner (`<projekt-id>/`) manuell im Dateisystem. Die Projekt-DB und alle Artefakte sind vollständig entfernt. | ✅ (Keine personenbezogenen Daten Dritter) |
| **Gesamter Kanal** | Nutzer löscht den Kanal-Ordner (`<prefix>/`). Alle Projekte, Vorlagen und die Kanal-DB sind entfernt. | ✅ |
| **Globale Einstellungen** | Nutzer löscht `global.db` oder einzelne Einträge im Einstellungen-Modal. API-Keys können einzeln entfernt werden. | ✅ |

### 12.3 Formaler Decommissioning-Plan

1. **Export**: Projekte und Videos aus Zielverzeichnissen sichern (optional)
2. **API-Keys entwerten**: In den jeweiligen Provider-Dashboards die Keys deaktivieren
3. **Root-Verzeichnis löschen**: Gesamtes Root-Verzeichnis (`global.db` + alle Kanal-Ordner) löschen
4. **Anwendung deinstallieren**: Electron-App und Abhängigkeiten entfernen

---

## 13. Green AI & Ökologischer Fußabdruck

### 13.1 Energieeffizienz durch lokale Architektur

| Aspekt | Bewertung |
|---|---|
| **Lokale Prozesssteuerung** | Keine energieintensiven Cloud-Uploads für Prozesssteuerung. Reduziert Netzwerkverkehr und Server-Last. |
| **SQLite (statt Server-DB)** | Minimaler Energieverbrauch – keine separate Datenbank-Infrastruktur. |
| **Vorlagen-Wiederverwendung** | Kanal-Vorlagen verhindern wiederholte KI-Generierungen ähnlicher Assets (Intros, Outros, Hintergründe). |
| **Selektive KI-Nutzung** | Der Nutzer entscheidet pro Schritt, ob KI verwendet wird. Keine automatischen, unnötigen API-Calls. |

### 13.2 SLM-Prüfung

| Aufgabe | LLM erforderlich? | SLM-Alternative |
|---|---|---|
| Themen-Analyse aus Quellen | Ja (Kimi/DeepSeek) | Lokales LM Studio für Standard-Analysen |
| Prompt-Generierung | Nein (Template-basiert) | Lokales LM Studio ausreichend |
| Slide-Generierung | Ja (Kimi 2.6) | Keine SLM-Alternative |
| Thumbnail-Generierung | Ja | Keine SLM-Alternative |
| Kategorie-Zuordnung | Nein | Lokales LM Studio ausreichend |

### 13.3 Emissions-Tracking

| Metrik | Ansatz |
|---|---|
| **CO₂-Schätzung** | Optional: Logging der API-Call-Dauer pro Provider. Grobe Schätzung über Standard-Emissionsfaktoren für Cloud-Inferenz. |
| **Lokale Energie** | Kein Tracking – liegt in Verantwortung des Nutzers (lokaler Strommix). |

---

## Anhang: Querverweise & Traceability

| Querschnittsthema | Primäre Sektion | Verwandte Sektionen |
|---|---|---|
| 6-Schritte-Prozess | 4 (Funktionale Anforderungen) | 2, 7, 10 |
| Kanal-Setup | 4 (F-K01–F-K06) | 6, 7, 10 |
| Datenbank-Architektur (3 Ebenen) | 6 (Datenmanagement) | 3, 4, 8, 12 |
| MCP-Integration | 3 (Architektur) | 4, 5 |
| NotebookLM / HeyGen Bridge | 4 (F-R01, F-V08) | 3, 10 |
| Prompt-Master & Variablen | 4 (F-K04–F-K06) | 7, 10, 11 |
| Lastverteilung | 3 (Architekturprinzip #3) | 5 |
| UI-Layout (4-Quadranten) | 10 (UX/UI) | 11 |
| Lokale Ausführung | 3 (Architekturprinzip #1) | 5, 12, 13 |
| API-Key-Management | 6 (Global DB) | 5, 9, 12 |

---

*Dokument erstellt am 5.5.2026 | Version 1.0 | Nächste Revision: Nach erstem Projekt-Durchlauf*
