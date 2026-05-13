# Design-Update Implementierungsplan — ME4 SM Producer 3.0

> **Stand:** 2026-05-01  
> **Mockup-Quelle:** `Kimi_Agent_20260501 - SMproducer (1)\app` (React + Tailwind + Framer Motion)  
> **Ziel-Codebase:** `Code/` (Vanilla JS + Vite + CSS Custom Properties)  
> **Ausgangszustand:** ~48 % des Mockups umgesetzt, Farbsystem bereits auf hell umgestellt (MESM-DS-COLOR-001)

---

## Überblick & Vorgehen

> **STATUS:** ✅ Implementierung abgeschlossen  
> **Build:** ✅ Erfolgreich (19 Module, 0 Fehler)  
> **Dokumentation:** `Documentation/UI-Komponenten.md`

Dieser Plan folgt einer systematischen 4-Phasen-Methodik für jedes einzelne Element:

1. **Detailanalyse** — Mockup exakt studieren: Farben, Abmessungen, Effekte, Verhalten
2. **Implementierung** — Clean in Vanilla JS + CSS umsetzen
3. **Verifikation** — Gegen Mockup prüfen (visuell, funktional)
4. **Dokumentation** — Jedes Element bekommt eine eindeutige ID, technische Daten, Code-Standort, ausführlicher Kommentar

### ID-Schema

Jede UI-Komponente bekommt eine ID nach Muster: `MESM-UI-XXX`

| Präfix | Kategorie |
|--------|-----------|
| `MESM-DS-COLOR-` | Farbsystem |
| `MESM-UI-0XX` | Atoms (Buttons, Inputs, Badges) |
| `MESM-UI-1XX` | Molecules (Cards, Dropzone, Tables) |
| `MESM-UI-2XX` | Organisms (Accordion, Timeline, Player) |
| `MESM-UI-3XX` | Layout (Header, Sidebar, Workspace) |
| `MESM-UI-4XX` | Pages (Thema, Research, Audio, etc.) |
| `MESM-UI-5XX` | Effects/Animations |
| `MESM-UI-6XX` | Chat/Settings |

---

## Phase 1: Farbsystem & Design Tokens (KRITISCH)

### Bereits erledigt ✅
Das Farbsystem (`MESM-DS-COLOR-001`) wurde in `main.css` bereits auf das helle Mockup-Theme umgestellt:
- `--color-bg: #f8f9fa`, `--color-bg-elevated: #ffffff`, `--color-text: #0f446b`, `--color-primary: #c60024`
- Alle CSS-Variablen spiegeln Mockup-Werte wider

### Noch zu tun

- [ ] **MESM-DS-COLOR-002** — Fokus-Ring crimson/30 global
  - **Ort:** `Code/app/styles/main.css`
  - **Soll:** Alle Inputs/Textareas/Selects → `focus:ring-2 focus:ring-crimson/30 focus:border-crimson`
  - **Ist:** Bereits mit `rgba(198, 0, 36, 0.15)` umgesetzt → auf Mockup `rgba(198, 0, 36, 0.30)` angleichen
  - **Beschreibung:** Globale Fokusring-Farbe für Eingabefelder. Mockup verwendet `crimson/30` (0.30 opacity), aktuell 0.15.

- [ ] **MESM-DS-COLOR-003** — deep-blue Button-Variante
  - **Ort:** `Code/app/styles/main.css`
  - **Soll:** `.btn-deep-blue` mit `bg-[#0f446b] text-white hover:bg-[#0a2f4d]`
  - **Ist:** Fehlt als eigenständige Variante
  - **Beschreibung:** Tiefblauer Button für sekundäre Aktionen (z.B. "Vollständigkeit prüfen", "Hinzufügen")

- [ ] **MESM-DS-COLOR-004** — crimson-full-width Button-Variante
  - **Ort:** `Code/app/styles/main.css`
  - **Soll:** `.btn-full` mit `w-full bg-crimson text-white rounded-xl font-semibold text-base py-4 shadow-md hover:shadow-lg`
  - **Ist:** Fehlt
  - **Beschreibung:** Volle Breite, großer Button für primäre Aktionen (z.B. "Publizieren", "Projekt starten")

---

## Phase 2: Layout-Komponenten

### 2.1 Header (MESM-UI-301)

- [ ] **MESM-UI-301a** — Logo: Sparkles-Icon statt Emoji
  - **Ort:** `Code/app/layout/Header.js`
  - **Mockup:** `<Sparkles>` Icon von lucide-react, `w-8 h-8 rounded-lg bg-crimson`, weißes Icon
  - **Ist:** Emoji-basiert
  - **Umsetzung:** SVG-Icon inline oder Unicode-Ersatz für Sparkles

- [ ] **MESM-UI-301b** — Bell-Button mit rotem Punkt
  - **Ort:** `Code/app/layout/Header.js` + `Code/app/styles/main.css`
  - **Mockup:** `absolute top-1.5 right-1.5 w-2 h-2 bg-crimson rounded-full`
  - **Ist:** CSS `::after` vorhanden, aber Emoji statt SVG-Icon
  - **Umsetzung:** SVG Bell-Icon inline, Position des Punkts präzisieren

### 2.2 LeftSidebar / Navigator (MESM-UI-310)

- [ ] **MESM-UI-310** — Sidebar-Collapse
  - **Ort:** `Code/app/layout/Navigator.js` + `Code/app/styles/main.css`
  - **Mockup:** Chevron-Toggle-Button `absolute -right-3 top-4`, `w-6 h-6 bg-white border rounded-full`, `w-60`↔`w-16`, Tooltips bei Hover
  - **Ist:** Kein Collapse-Mechanismus
  - **Umsetzung:** 
    - State-Variable `sidebarCollapsed` in `state.js`
    - CSS-Transition `width` mit `transition-all duration-300`
    - ChevronLeft/Right SVG-Icons
    - Tooltips: `absolute left-full ml-2 bg-deep-blue text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100`
  - **ID-Kinder:**
    - `MESM-UI-310a` — Collapse-Toggle-Button
    - `MESM-UI-310b` — Tooltip (collapsed state)
    - `MESM-UI-310c` — Nummern-Badge collapsed `w-7 h-7`

- [ ] **MESM-UI-311** — Nav-Item active state präzisieren
  - **Ort:** `Code/app/styles/main.css`
  - **Mockup:** `bg-white text-deep-blue shadow-card border-l-4 border-crimson`
  - **Ist:** `bg-bg-elevated`, `border-left: 3px solid var(--color-primary)` → auf 4px ändern

### 2.3 Workspace (MESM-UI-320)

- [ ] **MESM-UI-320** — Page-Transition Animation
  - **Ort:** `Code/app/layout/Workspace.js` + `Code/app/styles/main.css`
  - **Mockup:** `<AnimatePresence mode="wait">`, `opacity:0→1, y:10→0`, `duration 0.25s easeInOut`
  - **Ist:** Keine Transition
  - **Umsetzung:** CSS `@keyframes pageEnter` + `animation: pageEnter 0.25s easeInOut`

### 2.4 RightChatSidebar (MESM-UI-330)

- [ ] **MESM-UI-330** — Header mit Avatar
  - **Ort:** `Code/app/layout/Sidebar.js`
  - **Mockup:** Avatar `w-8 h-8 rounded-full bg-deep-blue` + Bot-Icon, Status `text-xs text-green-500` mit Punkt
  - **Ist:** Kein Avatar, einfacher Titel

- [ ] **MESM-UI-331** — Tab-Styling präzisieren
  - **Ort:** `Code/app/styles/main.css`
  - **Mockup:** Aktiv: `text-crimson border-b-2 border-crimson bg-crimson/5`, Inaktiv: `text-gray-500 hover:bg-cool-gray/50`
  - **Ist:** Ähnlich, aber ohne `bg-crimson/5`

- [ ] **MESM-UI-332** — Chat-Nachrichten Animation
  - **Ort:** `Code/app/layout/Sidebar.js`
  - **Mockup:** Neue Nachrichten: `initial: opacity:0 y:10 animate: opacity:1 y:0`
  - **Umsetzung:** CSS `@keyframes messageSlideIn`

- [ ] **MESM-UI-333** — Typing-Indikator
  - **Ort:** `Code/app/layout/Sidebar.js` + `Code/app/styles/main.css`
  - **Mockup:** 3 Punkte: `w-2 h-2 bg-gray-400 rounded-full animate-bounce`, delays: `0ms/150ms/300ms`
  - **Ist:** Statische Punkte
  - **Umsetzung:** CSS `@keyframes bounce` mit `animation-delay`

- [ ] **MESM-UI-334** — AutoResizeTextarea
  - **Ort:** `Code/app/layout/Sidebar.js`
  - **Mockup:** `resize-none overflow-hidden min-h-[36px] max-h-[200px]`, Enter=Send, Shift+Enter=Newline
  - **Ist:** `<input>` statt `<textarea>`
  - **Umsetzung:** `<textarea>` mit JS `scrollHeight`-basierter Auto-Resize

- [ ] **MESM-UI-335** — Variablen-Tab mit Expand/Copy
  - **Ort:** `Code/app/layout/Sidebar.js` + `Code/app/styles/main.css`
  - **Mockup:** Klickbare Cards mit Expand-Animation, Copy-Button, "Aktueller Wert (DB)"
  - **Umsetzung:** Click-Handler für Expand/Collapse, Copy-Button via `navigator.clipboard`

- [ ] **MESM-UI-336** — Info-Tab mit ElementInfo-Cards
  - **Ort:** `Code/app/layout/Sidebar.js` + `Code/app/styles/main.css`
  - **Mockup:** Hint-Box, ElementInfo-Cards (5 Abschnitte), FieldTypeCard, Leerzustand
  - **Umsetzung:** Ctrl+Click Listener, dynamische Info-Karten

- [ ] **MESM-UI-337** — Mobile Toggle Button
  - **Ort:** `Code/app/layout/Sidebar.js` + `Code/app/styles/main.css`
  - **Mockup:** `fixed right-4 bottom-4 z-50 w-12 h-12 bg-crimson rounded-full shadow-lg lg:hidden`
  - **Umsetzung:** Media-Query `@media (max-width: 1024px)`, Button mit X/Sparkles-Icon

- [ ] **MESM-UI-338** — Collapsed Sidebar Indicator
  - **Ort:** `Code/app/layout/Sidebar.js` + `Code/app/styles/main.css`
  - **Mockup:** `fixed right-0 top-20 bg-white border border-r-0 rounded-l-lg p-2 shadow-md`, ChevronUp+Bot-Icon
  - **Umsetzung:** Anzeigen wenn Sidebar nicht sichtbar, klick öffnet sie

---

## Phase 3: UI-Komponenten (Atoms / Molecules)

- [ ] **MESM-UI-001** — Checkbox-Styling crimson
  - **Ort:** `Code/app/styles/main.css`
  - **Mockup:** `w-4 h-4 accent-crimson rounded`
  - **Umsetzung:** `.checkbox-styled` mit `accent-color: var(--color-primary)`

- [ ] **MESM-UI-002** — Progress Bar
  - **Ort:** `Code/app/styles/main.css` (neue Komponente)
  - **Mockup:** `w-full h-2 bg-cool-gray rounded-full overflow-hidden`, crimson-Fill animiert
  - **Umsetzung:** `.progress-bar` + `.progress-bar-fill` mit CSS `transition: width`

- [ ] **MESM-UI-003** — Sortable Table Header
  - **Ort:** `Code/app/styles/main.css` + JS util
  - **Mockup:** `cursor-pointer select-none hover:text-crimson`, ArrowUpDown/Chevron-Icons
  - **Umsetzung:** `.data-table th.sortable`, SVG Sort-Icons, `data-sort` Attribute

- [ ] **MESM-UI-004** — Copy-Button (absolut positioniert)
  - **Ort:** `Code/app/styles/main.css` (neue Komponente)
  - **Mockup:** `absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-cool-border text-gray-400 hover:text-crimson`
  - **Umsetzung:** `.copy-btn` Utility-Klasse, Copy-Icon SVG

- [ ] **MESM-UI-005** — YouTube Embed Container
  - **Ort:** `Code/app/styles/main.css` + Util-Funktion
  - **Mockup:** `w-full h-48 rounded-lg overflow-hidden border border-cool-border`
  - **Umsetzung:** `.youtube-embed` + `getYoutubeEmbedUrl()` Funktion

- [ ] **MESM-UI-006** — FileList-Item grün
  - **Ort:** `Code/app/styles/main.css`
  - **Mockup:** `flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100`, grüner Punkt
  - **Umsetzung:** `.file-list-item` + `.file-item-dot`

- [ ] **MESM-UI-007** — Search Input mit Icon
  - **Ort:** `Code/app/styles/main.css`
  - **Mockup:** Input mit Search-Icon links, `focus:ring-2 focus:ring-crimson/30`
  - **Umsetzung:** `.search-field` Wrapper mit positioniertem Icon

---

## Phase 4: Module — 7 Seiten

### 4.1 Thema-Module (MESM-UI-401)

- [ ] **MESM-UI-401** — YouTube-URL-Input + Embed-Iframe
  - **Ort:** `Code/app/pages/ThemaPage.js`
  - **Mockup:** Input für YouTube-URL, bei gültiger URL erscheint Iframe mit Animation
  - **Umsetzung:** URL-Input, `getYoutubeEmbedUrl()`, Iframe mit `height:0→h-48` Animation

- [ ] **MESM-UI-402** — Website-URL-Input
  - **Ort:** `Code/app/pages/ThemaPage.js`
  - **Umsetzung:** Input-Feld für Website-URL

- [ ] **MESM-UI-403** — FileUpload-Dropzone (in Quelltext-Panel)
  - **Ort:** `Code/app/pages/ThemaPage.js`
  - **Mockup:** `border-2 border-dashed border-cool-border`, FileList
  - **Umsetzung:** Wiederverwendung der `.file-dropzone`-Klasse, File-Handling

- [ ] **MESM-UI-404** — Dashboard-BG-Effekt
  - **Ort:** `Code/app/pages/ThemaPage.js` + `Code/app/styles/main.css`
  - **Mockup:** 40×40 Grid-Pattern, `mask-image: radial-gradient(circle 300px at var(--mouse-x) var(--mouse-y), black 0%, transparent 100%)`
  - **Umsetzung:** CSS `::before` mit Grid, JS `mousemove`-Handler für CSS-Variablen `--mouse-x`/`--mouse-y`

- [ ] **MESM-UI-405** — Progress Bar beim Analysieren
  - **Ort:** `Code/app/pages/ThemaPage.js`
  - **Mockup:** `w-full h-2 bg-cool-gray`, crimson-Fill animiert, Prozent-Anzeige
  - **Umsetzung:** `.progress-bar`-Komponente, Intervall für Fortschritt

- [ ] **MESM-UI-406** — KI-Button (absolut im Textarea)
  - **Ort:** `Code/app/pages/ThemaPage.js`
  - **Mockup:** `absolute top-3 right-4`, `bg-gray-200→crimson` beim Klick
  - **Umsetzung:** Positionierter Button im Textarea-Container, sendet Text an Chat

- [ ] **MESM-UI-407** — Analyse-Ergebnis-Cards
  - **Ort:** `Code/app/pages/ThemaPage.js` + `Code/app/styles/main.css`
  - **Mockup:** 3 Cards, 1 hervorgehoben `bg-deep-blue text-white`, Badge
  - **Umsetzung:** `.result-card` mit Varianten, staggered Animation

- [ ] **MESM-UI-408** — Projektstart-Form mit Copy-Buttons
  - **Ort:** `Code/app/pages/ThemaPage.js`
  - **Mockup:** Titel+Copy, Nummer+Copy, 2 Buttons ("Vorbereiten" outline / "Starten" crimson)
  - **Umsetzung:** Copy-Buttons an Inputs, Erfolgs-Animation nach Start

- [ ] **MESM-UI-409** — Button-Lade-Animation (Rocket rotiert)
  - **Ort:** `Code/app/pages/ThemaPage.js` + `Code/app/styles/main.css`
  - **Mockup:** `<Rocket>` rotiert 360° infinite während "Projekt starten"
  - **Umsetzung:** CSS `@keyframes spin` auf Icon

### 4.2 Research-Module (MESM-UI-402)

- [ ] **MESM-UI-402a** — Sortierbare Tabelle
  - **Ort:** `Code/app/pages/ResearchPage.js`
  - **Mockup:** Spaltenköpfe mit Sort-Icons (ArrowUpDown/Chevron), `cursor-pointer hover:text-crimson`
  - **Umsetzung:** Sort-Funktion `handleSort(field)`, `localeCompare`, visueller Indikator

- [ ] **MESM-UI-402b** — SearchField
  - **Ort:** `Code/app/pages/ResearchPage.js`
  - **Mockup:** Input mit Search-Icon links
  - **Umsetzung:** `.search-field`-Wrapper

### 4.3 Audio-Module (MESM-UI-403)

- [ ] **MESM-UI-403a** — Sortierbare Tabelle (Audio-Kriterien)
  - **Ort:** `Code/app/pages/AudioPage.js`
  - **Mockup:** Gleiche Tabellenstruktur, Sort-Funktionalität
  - **Umsetzung:** Wie Research, kopierbarer Ansatz

- [ ] **MESM-UI-403b** — Transkription Row-Animation
  - **Ort:** `Code/app/pages/AudioPage.js` + `Code/app/styles/main.css`
  - **Mockup:** `initial: opacity:0 animate: opacity:1`, `transition: delay: id*0.03`
  - **Umsetzung:** CSS `@keyframes rowFadeIn` mit `animation-delay: calc(var(--row) * 30ms)`

### 4.4 Slides-Module (MESM-UI-404)

- [ ] **MESM-UI-404a** — Sortierbare Tabelle (Slides-Kriterien)
  - **Ort:** `Code/app/pages/SlidesPage.js`
  - **Umsetzung:** Wie Research/Audio

### 4.5 Video-Module (MESM-UI-405) — komplex

- [ ] **MESM-UI-405a** — Format-Selector Grid 3-col
  - **Ort:** `Code/app/pages/VideoPage.js` + `Code/app/styles/main.css`
  - **Mockup:** Grid 3-col Cards (Quer 16:9 / Hoch 9:16 / Quadrat 1:1), Icons, aktiv: `bg-crimson/10 border-crimson text-crimson`
  - **Umsetzung:** `.video-format-grid` mit `.video-format-card`

- [ ] **MESM-UI-405b** — Plattform-Selector Pill-Buttons
  - **Ort:** `Code/app/pages/VideoPage.js` + `Code/app/styles/main.css`
  - **Mockup:** Pill-Buttons flex-wrap (YouTube/TikTok/Instagram/LinkedIn/Andere), aktiv: `bg-crimson text-white`
  - **Umsetzung:** `.pill-selector` mit `.pill-btn`

- [ ] **MESM-UI-405c** — Template-Carousel mit Navigation
  - **Ort:** `Code/app/pages/VideoPage.js` + `Code/app/styles/main.css`
  - **Mockup:** 4 pro Seite, Chevron-Nav, Pagination-Dots, Metadata-Panel
  - **Umsetzung:** `.template-carousel-wrapper`, Page-Logik, Dots-Indikatoren

- [ ] **MESM-UI-405d** — Metadata-Panel
  - **Ort:** `Code/app/pages/VideoPage.js` + `Code/app/styles/main.css`
  - **Mockup:** `p-4 bg-white rounded-xl border`, 3-col Grid: Auflösung/Aspect/Länge
  - **Umsetzung:** `.metadata-panel`

- [ ] **MESM-UI-405e** — Steuerdatei-Upload/Anzeige
  - **Ort:** `Code/app/pages/VideoPage.js`
  - **Mockup:** `bg-deep-blue/5 rounded-lg`, Dateiname + "Entfernen", oder Upload-Button
  - **Umsetzung:** Zustand: leer/Datei, Upload/Remove

- [ ] **MESM-UI-405f** — Audio/Video File Lists
  - **Ort:** `Code/app/pages/VideoPage.js` + `Code/app/styles/main.css`
  - **Mockup:** Header mit Icon + "+ Hinzufügen", File-Cards `bg-deep-blue/5 rounded-lg`, Trennlinien
  - **Umsetzung:** `.file-section` mit `.file-card`

- [ ] **MESM-UI-405g** — Komplexe Timeline
  - **Ort:** `Code/app/pages/VideoPage.js` + `Code/app/styles/main.css`
  - **Mockup:** `bg-gray-900 rounded-xl p-4`, 5 Spuren, Intro/Outro-Vertikalbalken, Legende
  - **Umsetzung:** Erweiterung der bestehenden Timeline, farbige Balken

- [ ] **MESM-UI-405h** — Export Buttons (2 nebeneinander)
  - **Ort:** `Code/app/pages/VideoPage.js`
  - **Mockup:** "Vollständigkeit prüfen" (deep-blue) + "Videoeditor starten" (crimson) in `flex-row`
  - **Umsetzung:** `.btn-deep-blue` + `.btn-primary` in Flex-Container

### 4.6 Upload-Module (MESM-UI-406)

- [ ] **MESM-UI-406a** — Video-Player mit Controls
  - **Ort:** `Code/app/pages/UploadPage.js` + `Code/app/styles/main.css`
  - **Mockup:** `aspect-video bg-gray-900`, Play/Pause-Button `w-16 h-16 bg-crimson/90 rounded-full hover:scale-105`, Timeline
  - **Umsetzung:** Platzhalter-Video-Player mit Controls

- [ ] **MESM-UI-406b** — Technische Daten-Liste
  - **Ort:** `Code/app/pages/UploadPage.js` + `Code/app/styles/main.css`
  - **Mockup:** 6 Key-Value-Paare, `flex justify-between p-2.5 bg-white border`
  - **Umsetzung:** `.data-list`

- [ ] **MESM-UI-406c** — Thumbnail-Vorschau
  - **Ort:** `Code/app/pages/UploadPage.js`
  - **Mockup:** `aspect-video bg-deep-blue`, Platzhalter-Bild
  - **Umsetzung:** Bild-Container mit Platzhalter

- [ ] **MESM-UI-406d** — Copy-Buttons an Upload-Daten
  - **Ort:** `Code/app/pages/UploadPage.js`
  - **Mockup:** An jedem Input-Feld
  - **Umsetzung:** `.copy-btn` Utility

- [ ] **MESM-UI-406e** — Publizieren mit Erfolgs-Animation
  - **Ort:** `Code/app/pages/UploadPage.js` + `Code/app/styles/main.css`
  - **Mockup:** Full-width Button, Rocket-Animation, Erfolgs-Card `bg-green-50`
  - **Umsetzung:** `.btn-full`, Lade-Animation, `.success-card`

- [ ] **MESM-UI-406f** — Video-Marketing Kontakt-Liste
  - **Ort:** `Code/app/pages/UploadPage.js` + `Code/app/styles/main.css`
  - **Mockup:** Kontakt-Cards mit Status-Toggle "Informieren"↔"Informiert"
  - **Umsetzung:** `.contact-card` mit `.toggle-status`

### 4.7 Kanal / Form Builder (MESM-UI-407)

- [ ] **MESM-UI-407a** — Design/Preview-Tabs im Prompt-Editor
  - **Ort:** `Code/app/pages/KanalPage.js` + `Code/app/styles/main.css`
  - **Mockup:** Tab-Buttons (Edit3 "Design" / Eye "Preview"), `bg-cool-gray p-1`, Design: transparent textarea über farbigem BG
  - **Umsetzung:** Erweiterung der `.prompt-editor`, Tab-Logik

- [ ] **MESM-UI-407b** — Delete-Buttons in Tabellen
  - **Ort:** `Code/app/pages/KanalPage.js`
  - **Mockup:** Trash2-Icon, `hover:bg-red-50 hover:text-crimson`
  - **Umsetzung:** SVG Trash-Icon, `.btn-icon-danger`

- [ ] **MESM-UI-407c** — "Hinzufügen"-Button deep-blue
  - **Ort:** `Code/app/pages/KanalPage.js`
  - **Mockup:** `bg-deep-blue text-white`, Plus-Icon, `shadow-sm hover:shadow-md`
  - **Umsetzung:** `.btn-deep-blue`

- [ ] **MESM-UI-407d** — Video File Lists (Kanal-Tab)
  - **Ort:** `Code/app/pages/KanalPage.js`
  - **Mockup:** Input-Felder mit Trash2-Delete, "+ Hinzufügen"
  - **Umsetzung:** Wie Video-Module File Lists

---

## Phase 5: Einstellungen-Modal (MESM-UI-600)

- [ ] **MESM-UI-600** — Modal-Styling präzisieren
  - **Ort:** `Code/app/main.js` + `Code/app/styles/main.css`
  - **Mockup:** `bg-white rounded-2xl shadow-2xl`, Header mit Settings-Icon crimson, Footer mit Trennlinie
  - **Umsetzung:** Anpassung der Modal-Animation (Scale+Opacity), Header/Footer-Trennlinien

---

## Phase 6: Effekte & Animationen

- [ ] **MESM-UI-501** — Page-Enter Animation
  - **Ort:** `Code/app/layout/Workspace.js` + `Code/app/styles/main.css`
  - **CSS:** `@keyframes pageEnter { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`

- [ ] **MESM-UI-502** — Accordion-Animation
  - **Ort:** `Code/app/components/organisms/ServiceAccordion.js` + `Code/app/styles/main.css`
  - **Soll:** `max-height`-Transition + Opacity-Fade beim Öffnen/Schließen
  - **Umsetzung:** `.service-panel-body` mit `max-height: 0` → `max-height: 2000px`, `opacity: 0` → `opacity: 1`

- [ ] **MESM-UI-503** — Erfolgs-Animation
  - **Ort:** `Code/app/styles/main.css`
  - **CSS:** `@keyframes successBounce { 0% { transform:scale(0.9); opacity:0; } 50% { transform:scale(1.05); } 100% { transform:scale(1); opacity:1; } }`

- [ ] **MESM-UI-504** — Staggered Row-Animation
  - **Ort:** `Code/app/styles/main.css`
  - **CSS:** `@keyframes rowFadeIn` mit `animation-delay: calc(var(--row-index) * 30ms)`

- [ ] **MESM-UI-505** — Puls-Animation
  - **Ort:** `Code/app/styles/main.css`
  - **CSS:** `@keyframes pulse { 0%, 100% { opacity:1; } 50% { opacity:0.7; } }`, `animation: pulse 2s ease-in-out infinite`

- [ ] **MESM-UI-506** — Slide-In (von rechts)
  - **Ort:** `Code/app/styles/main.css`
  - **CSS:** `@keyframes slideInRight { from { transform:translateX(300px); opacity:0; } to { transform:translateX(0); opacity:1; } }`

---

## Dateien, die geändert werden

| Datei | Art der Änderung |
|-------|-----------------|
| `Code/app/styles/main.css` | CSS-Erweiterungen: neue Komponenten, Animationen, Hover-Effekte |
| `Code/app/layout/Header.js` | SVG-Icons, Bell-Punkt-Präzisierung |
| `Code/app/layout/Navigator.js` | Sidebar-Collapse, Tooltips, Channel-Selector |
| `Code/app/layout/Sidebar.js` | Chat-Header, Typing-Indikator, AutoResizeTextarea, Variablen-Tab, Info-Tab |
| `Code/app/layout/Workspace.js` | Page-Transition-Animation |
| `Code/app/main.js` | Settings-Modal-Styling, Animation-Handling |
| `Code/app/shared/state.js` | Neue State-Variablen: `sidebarCollapsed`, `infoEnabled` |
| `Code/app/pages/ThemaPage.js` | YT-Embed, Dashboard-BG, Progress-Bar, KI-Button, Copy-Buttons, Erfolgs-Animation |
| `Code/app/pages/ResearchPage.js` | Sortable Table, SearchField |
| `Code/app/pages/AudioPage.js` | Sortable Table, Row-Animation |
| `Code/app/pages/SlidesPage.js` | Sortable Table |
| `Code/app/pages/VideoPage.js` | Format-Selector, Template-Carousel, File-Lists, Timeline-Erweiterung, Export-Buttons |
| `Code/app/pages/UploadPage.js` | Video-Player, Thumbnail, Daten-Liste, Publizieren-Animation, Kontakt-Liste |
| `Code/app/pages/KanalPage.js` | Design/Preview-Tabs, Delete-Buttons, File-Lists |
| `Code/app/components/organisms/ServiceAccordion.js` | Opacity-Fade-Animation |

---

## Implementierungsreihenfolge (ToDo-Liste)

### Sprint 1: Foundation (Farbsystem + Layout)
1. [ ] MESM-DS-COLOR-002: Fokus-Ring auf crimson/30 angleichen
2. [ ] MESM-DS-COLOR-003: deep-blue Button-Variante
3. [ ] MESM-DS-COLOR-004: crimson-full-width Button-Variante
4. [ ] MESM-UI-301a/b: Header SVG-Icons
5. [ ] MESM-UI-310: Sidebar-Collapse komplett
6. [ ] MESM-UI-311: Nav-Item active state 4px Border
7. [ ] MESM-UI-320: Page-Transition Animation

### Sprint 2: Chat-Sidebar & Settings
8. [ ] MESM-UI-330: Chat-Header mit Avatar
9. [ ] MESM-UI-331: Tab-Styling präzisieren
10. [ ] MESM-UI-332: Chat-Nachrichten Animation
11. [ ] MESM-UI-333: Typing-Indikator
12. [ ] MESM-UI-334: AutoResizeTextarea
13. [ ] MESM-UI-335: Variablen-Tab Expand/Copy
14. [ ] MESM-UI-336: Info-Tab ElementInfo-Cards
15. [ ] MESM-UI-337/338: Mobile Toggle + Collapsed Indicator
16. [ ] MESM-UI-600: Settings-Modal präzisieren

### Sprint 3: Atoms & Molecules
17. [ ] MESM-UI-001: Checkbox crimson
18. [ ] MESM-UI-002: Progress Bar
19. [ ] MESM-UI-003: Sortable Table Header
20. [ ] MESM-UI-004: Copy-Button global
21. [ ] MESM-UI-005: YouTube Embed
22. [ ] MESM-UI-006: FileList-Item grün
23. [ ] MESM-UI-007: Search Input

### Sprint 4: Thema & Research
24. [ ] MESM-UI-401: YT-URL + Embed
25. [ ] MESM-UI-402: Website-URL-Input
26. [ ] MESM-UI-403: FileUpload-Dropzone
27. [ ] MESM-UI-404: Dashboard-BG-Effekt
28. [ ] MESM-UI-405: Progress Bar analysieren
29. [ ] MESM-UI-406: KI-Button
30. [ ] MESM-UI-407: Ergebnis-Cards
31. [ ] MESM-UI-408: Projektstart mit Copy
32. [ ] MESM-UI-409: Button-Lade-Animation
33. [ ] MESM-UI-402a/b: Sortierbare Tabelle + SearchField

### Sprint 5: Audio & Slides
34. [ ] MESM-UI-403a: Sortierbare Tabelle Audio
35. [ ] MESM-UI-403b: Transkription Row-Animation
36. [ ] MESM-UI-404a: Sortierbare Tabelle Slides

### Sprint 6: Video (komplex)
37. [ ] MESM-UI-405a: Format-Selector Grid
38. [ ] MESM-UI-405b: Plattform-Selector Pills
39. [ ] MESM-UI-405c: Template-Carousel mit Navigation
40. [ ] MESM-UI-405d: Metadata-Panel
41. [ ] MESM-UI-405e: Steuerdatei-Upload
42. [ ] MESM-UI-405f: Audio/Video File Lists
43. [ ] MESM-UI-405g: Komplexe Timeline
44. [ ] MESM-UI-405h: Export-Buttons

### Sprint 7: Upload & Kanal
45. [ ] MESM-UI-406a: Video-Player
46. [ ] MESM-UI-406b: Technische Daten-Liste
47. [ ] MESM-UI-406c: Thumbnail-Vorschau
48. [ ] MESM-UI-406d: Copy-Buttons Upload
49. [ ] MESM-UI-406e: Publizieren + Erfolg
50. [ ] MESM-UI-406f: Kontakt-Liste
51. [ ] MESM-UI-407a: Design/Preview-Tabs
52. [ ] MESM-UI-407b/c/d: Delete/Add-Buttons, File-Lists

### Sprint 8: Effekte & Finalisierung
53. [ ] MESM-UI-501: Page-Enter (bereits in Sprint 1)
54. [ ] MESM-UI-502: Accordion-Animation
55. [ ] MESM-UI-503: Erfolgs-Animation
56. [ ] MESM-UI-504: Row-Animation
57. [ ] MESM-UI-505: Puls-Animation
58. [ ] MESM-UI-506: Slide-In
59. [ ] Hover-Effekte Cards: `scale:1.01`
60. [ ] Globale Verifikation gegen Mockup

---

## Verifikations-Checkliste

Nach jedem Sprint:
1. **Visueller Vergleich:** Screenshot vom Mockup vs. lokale App (gleicher Viewport)
2. **Funktionaler Test:** Alle Buttons, Inputs, Animationen manuell testen
3. **Responsive Check:** 1920px, 1280px, 768px Viewport
4. **Edge Cases:** Leere Zustände, Fehlerzustände, Lange Texte, viele Elemente

Nach Abschluss aller Sprints:
- [ ] Vollständiger Mockup-Vergleich aller 7 Seiten + Modal + Sidebar
- [ ] Alle 36 Aufgaben aus `Design-Update.md` abgehakt
- [ ] CSS-Variablen-Check: alle Mockup-Farben korrekt
- [ ] Animation-Performance: keine Ruckler, 60fps

---

## Dokumentation

Jedes Element wird:
1. Im Code mit einem ausführlichen Kommentar dokumentiert (ID, Mockup-Referenz, technische Daten)
2. In einer separaten `Documentation/UI-Komponenten.md` gelistet mit:
   - Eindeutiger ID
   - Datei-Pfad
   - Mockup-Referenz (Farben, Abmessungen, Effekte)
   - CSS-Klassen
   - JS-Funktionen
   - Screenshot (optional)
