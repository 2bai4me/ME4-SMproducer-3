# Design Update — Mockup-Abgleich ME4 SM Producer 3.0

> **Stand:** 2026-05-01  
> **Mockup-Quelle:** `C:\Users\uwean\Downloads\Kimi_Agent_20260501 - SMproducer (1)\app`  
> **Verglichen mit:** `Entwicklung/ME4-SMproducer-3/Code/`  
> **Ergebnis:** ~48 % des Mockups sind in der aktuellen Implementierung umgesetzt.

---

## 📋 Inhaltsverzeichnis

1. [Farbsystem (Design Tokens)](#1-farbsystem-design-tokens)
2. [Layout-Komponenten](#2-layout-komponenten)
3. [Module — 7 Seiten](#3-module--7-seiten)
   - [3.1 Thema-Module (4 Accordions)](#31-thema-module-4-accordions)
   - [3.2 Research-Module (3 Accordions)](#32-research-module-3-accordions)
   - [3.3 Audio-Module (4 Accordions)](#33-audio-module-4-accordions)
   - [3.4 Slides-Module (3 Accordions)](#34-slides-module-3-accordions)
   - [3.5 Video-Module (5 Accordions)](#35-video-module-5-accordions)
   - [3.6 Upload-Module (4 Accordions)](#36-upload-module-4-accordions)
   - [3.7 Kanal / Form Builder (6 Accordions)](#37-kanal--form-builder-6-accordions)
4. [Einstellungen-Modal](#4-einstellungen-modal)
5. [Right-Chat-Sidebar](#5-right-chat-sidebar)
6. [UI-Komponenten (Atoms / Molecules)](#6-ui-komponenten-atoms--molecules)
7. [Effekte & Animationen](#7-effekte--animationen)
8. [Gesamtbewertung](#8-gesamtbewertung)
9. [To-Do: Was muss noch gemacht werden](#9-to-do-was-muss-noch-gemacht-werden)

---

## 1. Farbsystem (Design Tokens)

| Token | Mockup-Wert | Mockup-Element | Implementierung | Match |
|---|---|---|---|---|
| Hintergrund (Body) | `#ffffff` | `<body>` | `#1a1a2e` | ❌ Hell/Dunkel-Konflikt |
| Seiten-Hintergrund | `#f8f9fa` (canvas) | `<main>` | `#1a1a2e` | ❌ |
| Karten-BG | `#ffffff` | `.card`, Accordion-Items | `#0f3460` | ❌ |
| Grau-Fläche | `#f0f2f5` (cool-gray) | Sidebar, Input-BG, Tabs | `#16213e` | ❌ |
| Text primär | `#0f446b` (deep-blue) | Überschriften, Labels | `#e0e0e0` | ❌ |
| Text sekundär | `#8899aa` (gray-500) | Beschreibungen | `#8899aa` | ⚠️ Gleicher Wert, anderer Kontext |
| Text muted | HSL `220 9% 46%` | Hilfe-Texte, Platzhalter | `#5a6a7a` | ❌ |
| **Akzentfarbe** | `#c60024` (crimson) | Buttons, Badges, Tabs, Hover | `#e94560` | ⚠️ Nahe, anderer Rotton |
| Akzent-Hover | `#b91c2e` (red-700) | Button-Hover | `#ff6b81` | ❌ |
| Success | `#25c279` (accent-green) | Erfolgs-Cards | `#22c55e` | ✅ Sehr nah |
| Border | `#dcdfe4` (cool-border) | Cards, Inputs, Trenner | `#2a3a5c` | ❌ |
| Header-BG | `#000000` (schwarz) | `<header>` | `#1a1a2e` | ⚠️ Fast schwarz |
| Header-Text | `#ffffff` (weiß) | Titel, Icons | `#e0e0e0` | ⚠️ |
| Header-Border | `#374151` (gray-800) | `border-b` | `#2a3a5c` | ⚠️ |
| Badge-BG (aktiv) | `#c60024` (crimson) | NumberBadge, StatusBadge | `#e94560` | ⚠️ |
| Badge-Text (aktiv) | `#ffffff` (weiß) | NumberBadge | `#ffffff` | ✅ |
| Badge-BG (inaktiv) | `#f0f2f5` (cool-gray) | NumberBadge | `--color-surface` | ❌ |
| Badge-Text (inaktiv) | `#c60024` (crimson) | NumberBadge | `--color-primary` | ⚠️ |
| Info-Blau | `#0f446b/5` (deep-blue/5) | Info-Cards, Hervorhebungen | `--color-info` (#6366f1) | ❌ |

> **Fazit Farbsystem:** Die Mockup-App verwendet ein **helles Design** (weiße Cards, hellgraue Flächen, deep-blue Text).  
> Die aktuelle Implementierung verwendet ein **dunkles Theme** (navy, warmrot, hellgrauer Text).  
> Der Mockup gibt das helle Design vor — ein CSS-Variablen-Wechsel oder Dual-Theme-Support ist erforderlich.

---

## 2. Layout-Komponenten

### 2.1 Header

| Element | Mockup | Element-Typ | Mockup-Effekte / Farben | Implementierung | Match |
|---|---|---|---|---|---|
| Container | Fixiert, `h-16`, `bg-black`, `border-b border-gray-800`, `z-50` | `<header>` | `shadow-lg`, `flex items-center justify-between px-6` | Fixiert, `3rem`, `bg-bg`, `border-b`, `z-50` | ⚠️ 60 % |
| Logo-Icon | `w-8 h-8 rounded-lg bg-crimson`, Sparkles-Icon weiß | `<div>` + `<Sparkles>` | Flex center | `w-8 h-8 rounded-lg bg-primary`, Emoji | ⚠️ 70 % |
| Titel | `"ME4-SMproducer 3.0"`, `text-lg font-bold text-white tracking-tight` | `<span>` | Fett, kompakt | Identisch bis auf `--color-text` | ✅ 90 % |
| Projekt-ID | `"LUYB-20260305-125319"`, `text-sm text-white/90 font-mono` | `<span>` | Monospace | Monospace, `text-dim` | ⚠️ 70 % |
| 🔔 Button | `p-2 rounded-lg hover:bg-gray-800`, Bell-Icon, roter Punkt `bg-crimson` | `<button>` + `<Bell>` | `absolute top-1.5 right-1.5 w-2 h-2 bg-crimson rounded-full` | Button mit Bell, CSS `::after` | ⚠️ 60 % |
| ⚙ Button | `p-2 rounded-lg hover:bg-gray-800`, Settings-Icon `text-gray-400 hover:text-white` | `<button>` + `<Settings>` | Öffnet Settings-Modal | Button mit Icon/Emoji | ⚠️ 50 % |
| ❓ Button | `p-2 rounded-lg hover:bg-gray-800`, HelpCircle-Icon, `href` extern | `<a>` + `<HelpCircle>` | `target="_blank" rel="noopener"` | Button mit Emoji | ⚠️ 50 % |

### 2.2 LeftSidebar

| Element | Mockup | Element-Typ | Mockup-Effekte / Farben | Implementierung | Match |
|---|---|---|---|---|---|
| Container | Fixiert, `left-0 top-16 bottom-0`, `w-60`/`w-16`, `bg-cool-gray`, `border-r border-cool-border`, `z-40` | `<aside>` | `transition-all duration-300`, `flex flex-col` | CSS-Grid, `13rem`, `bg-bg-elevated` | ⚠️ 50 % |
| **Collapse-Toggle** | `absolute -right-3 top-4`, `w-6 h-6 bg-white border rounded-full`, ChevronLeft/Right `text-crimson` | `<button>` | `shadow-sm hover:shadow-md hover:border-crimson` | **Nicht vorhanden** | ❌ 0 % |
| Nav-Items | 7 Items (Thema-Research-Audio-Slides-Video-Upload-Kanal) | `<button>` | Nummern-Badge (1–7), Trennlinie vor "Kanal" | 7 Items mit Nummern, Trennlinie | ⚠️ 60 % |
| Aktives Item | `bg-white text-deep-blue shadow-card`, `border-l-4 border-crimson` | `<button>` | Linker roter Strich, Card-Shadow | `bg-primary-dim`, `text-white`, linker Border | ⚠️ 50 % |
| Inaktives Item | `text-gray-500 hover:bg-white/60 hover:text-deep-blue` | `<button>` | Sanfter Hover | `text-muted`, `hover:bg-surface` | ⚠️ 60 % |
| Nummern-Badge (aktiv) | `bg-crimson text-white`, `w-5 h-5` (offen) / `w-7 h-7` (collapsed) | `<span>` | Rund, zentriert | `bg-primary`, `text-white` | ⚠️ 70 % |
| Nummern-Badge (inaktiv) | `bg-gray-200 text-gray-500` | `<span>` | Rund | `bg-surface`, `text-muted` | ⚠️ 60 % |
| **Tooltip (collapsed)** | `absolute left-full ml-2`, `bg-deep-blue text-white`, `px-2 py-1 rounded text-xs`, `opacity-0 group-hover:opacity-100` | `<span>` | Pointer-events-none, whitespace-nowrap | **Nicht vorhanden** | ❌ |

### 2.3 Workspace (Main Content Area)

| Element | Mockup | Element-Typ | Mockup-Effekte / Farben | Implementierung | Match |
|---|---|---|---|---|---|
| Container | `flex-1 ml-60/mr-80 mt-16`, `bg-canvas`, `overflow-y-auto` | `<main>` | `transition-all duration-300`, `scrollbar-thin` | CSS-Grid `flex-1`, `mt-header`, `bg-bg` | ⚠️ 50 % |
| **Page-Transition** | `<AnimatePresence mode="wait">`, `opacity:0→1, y:10→0`, `duration 0.25s easeInOut` | `<motion.div>` | Framer Motion Layout-Animation | **Keine Transition** | ❌ |
| Padding | `p-8` | – | Innenabstand | `p-4` | ⚠️ |

---

## 3. Module — 7 Seiten

### 3.1 Thema-Module (4 Accordions)

| # | Element | Mockup | Element-Typ | Mockup-Farben / Effekte | Implementierung | Match |
|---|---|---|---|---|---|---|
| 1 | **Kanal** | Select (4 Kanäle) + Textarea (Beschreibung), Target-Icon | `<select>` + `<textarea>` | `bg-white`, `focus:ring-2 focus:ring-crimson/30` | Select + Textarea | ✅ 90 % |
| 2 | **Quelltext** | Textarea (mono, 8 Zeilen) + **KI-Button** (absolut top-right, `bg-gray-200→crimson`) + YouTube-URL-Input + **YouTube-Embed-Iframe** (`w-full h-48 rounded-lg`, erscheint mit Animation) + Website-URL-Input + **FileUpload-Dropzone** (dashed border) + **Progress-Bar** (`h-2 bg-cool-gray`, crimson-Fill, Prozent) + "Analyse starten"-Button (crimson, Play-Icon) | `<textarea>` + `<button>` + `<input>` + `<iframe>` + `<div>` | **Dashboard-BG-Effekt** (Grid-Pattern 40×40, Radial-Maske folgt Maus), Progress-Animation | Textarea + Button, kein YT-Embed, kein Website-Input, kein FileUpload, keine Progress-Bar | ❌ 25 % |
| | **Dashboard-BG-Effekt** | `linear-gradient(cool-border 1px, transparent 1px)` 40×40 Grid, `mask-image: radial-gradient(circle 300px at var(--mouse-x) var(--mouse-y), black 0%, transparent 100%)` | CSS `::before`/layer | `opacity:0.6`, `pointer-events:none`, `transition: mask-image 0.15s` | **Kein Effekt** | ❌ |
| | **YouTube Embed** | `<iframe>` mit `getYoutubeEmbedUrl()`, `w-full h-48`, `rounded-lg overflow-hidden border border-cool-border` | `<iframe>` | Erscheint mit `motion.div` initial: `opacity:0, height:0` | **Nicht vorhanden** | ❌ |
| | **Progress Bar** | `w-full h-2 bg-cool-gray rounded-full overflow-hidden`, `<motion.div>` crimson-Fill `animate width`, Prozent-Anzeige | `<div>` | `transition duration 0.2` | **Nicht vorhanden** | ❌ |
| 3 | **Ergebnisse** | 3 Cards (1 hervorgehoben: `bg-deep-blue` + weißer Text), staggered fadeUp, Badge (Kategorie: `bg-crimson/10` oder `bg-crimson/20`) | `<motion.div>` | `initial: opacity:0 y:10`, `animate`, `delay: id*0.1` | **Nicht vorhanden** | ❌ |
| 4 | **Projektstart** | Form (Titel+Copy-Button, Nummer, Beschreibung+Copy) + 2 Buttons ("Vorbereiten" outline / "Starten" crimson) + **Erfolgs-Animation** (scale bounce: `initial: scale:0.9`, CheckCircle-Icon, "Zum Dashboard" + "Formular teilen") | `<div>` + `<button>` | Button-Lade-Animation: `<Rocket>` rotiert 360° infinite | Basis-Form, keine Copy-Buttons, keine Erfolgs-Animation | ❌ 20 % |
| | **Copy-Button** | `absolute right-2 top-1/2 -translate-y-1/2`, `p-1.5 rounded-md hover:bg-cool-border`, `text-gray-400 hover:text-crimson` | `<button>` + `<Copy>` | An jedem Input/Textarea | **Nicht vorhanden** | ❌ |

### 3.2 Research-Module (3 Accordions)

| # | Element | Mockup | Element-Typ | Mockup-Farben / Effekte | Implementierung | Match |
|---|---|---|---|---|---|---|
| 1 | **notebookLM** | Titel+Copy + Beschreibung+Copy + Notebook-Textarea (6 Zeilen), BookOpen-Icon | `<div>` + `<input>` + `<textarea>` | Label `text-sm font-semibold text-deep-blue` | Titel + Beschreibung + Textarea | ⚠️ 70 % |
| 2 | **Kriterien** | **SearchField** (Search-Icon) + **Sortable Table** (Kategorie/Schlagwort/Promptteil) + Checkboxen, **Sort-Icons** (ArrowUpDown/ChevronUp/ChevronDown), `cursor-pointer hover:text-crimson` | `<table>` + `<input type="checkbox">` | Sort-Indikator: `sortField === field ? 'text-crimson' : 'text-gray-300'`, selected: `bg-crimson/5` | Table ohne Sortierung | ⚠️ 70 % |
| | **Sort-Funktionalität** | `handleSort(field)`: Wechselt SortField+SortDir, `sortedKriterien = [...kriterien].sort(...)` | TypeScript | Visueller Indikator am Spaltenkopf, `localeCompare` | **Nicht vorhanden** | ❌ |
| 3 | **Prompt** | Textarea (6 Zeilen) + "Kopieren"-Button (Sparkles-Icon, crimson, `shadow-sm hover:shadow-md`) | `<textarea>` + `<button>` | `flex justify-end` | Textarea + "Prompt kopieren"-Button | ⚠️ 80 % |

### 3.3 Audio-Module (4 Accordions)

| # | Element | Mockup | Element-Typ | Mockup-Farben / Effekte | Implementierung | Match |
|---|---|---|---|---|---|---|
| 1 | **Kriterien für Audio** | Sortable Table (6 Kriterien: Qualität/Stimme/Format/Sprache/Atmosphäre/Technik) + Prompt-Ergänzung-Textarea + "Prompt Erstellung"-Button (Copy-Icon) | `<table>` + `<textarea>` + `<button>` | Gleiche Table-Struktur wie Research | Table + Prompt | ⚠️ 75 % |
| 2 | **Prompt** | Textarea (6 Zeilen) + "Kopieren"-Button | `<textarea>` + `<button>` | `flex justify-end` | Textarea + Button | ✅ 90 % |
| 3 | **Ergebnisse hochladen** | **Dropzone** (`border-2 border-dashed border-cool-border hover:border-crimson/50`) + FileList (grüne Cards, `bg-green-50 border-green-100`, grüner Punkt) | `<button>` + `<div>` | `transition-colors text-gray-500 hover:text-crimson` | Dropzone (NEU) + FileList | ✅ 85 % |
| 4 | **Transkription** | Table (Start/Ende/Sprecher/Satz), 10 Mock-Zeilen, **Sprecher-Badges** (Moderator: `bg-deep-blue/10 text-deep-blue`, Gast: `bg-crimson/10 text-crimson`), **Zeilenzähler** (`{length} Zeilen transkribiert`), **Row-Animation** (staggered: `delay: id*0.03`) | `<table>` + `<tr>` als `<motion.tr>` | `initial: opacity:0`, `animate: opacity:1`, `hover:bg-cool-gray/30` | Table mit Badges, keine Row-Animation | ⚠️ 80 % |

### 3.4 Slides-Module (3 Accordions)

| # | Element | Mockup | Element-Typ | Mockup-Farben / Effekte | Implementierung | Match |
|---|---|---|---|---|---|---|
| 1 | **Kriterien für Slides** | Sortable Table (6 Kriterien: Design/Typografie/Inhalt/Grafik/Aufbau/Technik) + Prompt-Ergänzung | `<table>` + `<textarea>` | Gleiche Table-Struktur | Table + Prompt | ⚠️ 75 % |
| 2 | **Prompt** | Textarea + "Kopieren"-Button | `<textarea>` + `<button>` | – | Textarea + Button | ✅ 90 % |
| 3 | **Ergebnisse hochladen** | Dropzone (ZIP) + FileList (grün) | `<button>` + `<div>` | Gleiche Dropzone wie Audio | Dropzone (NEU) | ✅ 85 % |

### 3.5 Video-Module (5 Accordions) — das komplexeste

| # | Element | Mockup | Element-Typ | Mockup-Farben / Effekte | Implementierung | Match |
|---|---|---|---|---|---|---|
| 1 | **Videoformat** | **Format-Selector**: Grid 3-col Cards (Quer 16:9 / Hoch 9:16 / Quadrat 1:1), Icons (Monitor/Smartphone/Tv), Label+Desc, aktiv: `bg-crimson/10 border-crimson text-crimson` + **Plattform-Selector**: Pill-Buttons flex-wrap (YouTube/TikTok/Instagram/LinkedIn/Andere), aktiv: `bg-crimson text-white border-crimson` | `<button>` Grid + `<button>` Wrap | `transition-all`, `hover:border-crimson/30` | Basis-Form (Dropdown) | ❌ 25 % |
| 2 | **Intro** | **Template-Carousel** (4 pro Seite, `grid grid-cols-4 gap-3`) + **Chevron-Navigation** (ChevronLeft/Right, disabled: `opacity-30 cursor-not-allowed`) + **Pagination-Dots** (`h-2 rounded-full`, aktiv: `bg-crimson w-4`, inaktiv: `bg-gray-300 w-2`) + **Metadata-Panel** (`p-4 bg-white rounded-xl border`, 3-col Grid: Auflösung/Aspect/Länge) | `<button>` Cards + `<button>` Nav | Cards: `aspect-video rounded-lg`, farbiger BG (`bg-red-500`/`bg-gray-500`/...), Video/Image-Icon, Checkmark bei selected (`w-5 h-5 bg-crimson rounded-full`), `border-2` | Basis-Carousel (NEU, lädt aus DB), keine Navigation, kein Metadata-Panel | ⚠️ 50 % |
| 3 | **Hauptteil** | Template-Carousel (wie Intro, 6 Templates) + **Steuerdatei-Upload** (XML-Anzeige/Entfernen oder Upload-Button) + **Audio-Dateien** (Header "Audiodateien" + "+ Hinzufügen", FileList mit Entfernen) + **Video-Dateien** (Header "Videodateien" + "+ Hinzufügen") + **Komplexe Timeline** (dunkler BG `bg-gray-900`, 12 Slides mit verschiedenen Längen, vertikale Intro/Outro-Balken über alle Spuren, 5 Spuren: Hintergrund/SprecherA/SprecherB/12×Slides, Legende) | `<div>` Cards + `<button>` + `<div>` Timeline | Timeline: `bg-gray-900 rounded-xl p-4`, Spuren `flex items-center h-6`, Intro/Outro `absolute bg-crimson/30`, Legende `flex flex-wrap gap-3 text-xs` | Basis-Accordion ohne Details | ❌ 15 % |
| | **Steuerdatei** | `bg-deep-blue/5 rounded-lg`, Settings2-Icon, Dateiname + "Entfernen"-Button | `<div>` | Wenn leer: Upload-Button `border-dashed` | **Nicht vorhanden** | ❌ |
| | **Audio/Video File Lists** | `bg-white rounded-xl border space-y-2`, Header mit Music/Film-Icon + "+ Hinzufügen"-Link, File-Cards `bg-deep-blue/5 rounded-lg` | `<div>` | Trennlinien zwischen Sektionen | **Nicht vorhanden** | ❌ |
| | **Timeline** | 12 Slides, `slide.start/totalDuration * 100%`, absolute Positionierung, farbige Balken (grau/blau/grün/purple) | `<div>` | `style={{ left: %, width: % }}` | Einfache Timeline (NEU, dynamische Prozentwerte) | ❌ 20 % |
| 4 | **Outro** | Template-Carousel (8 Templates) + Metadata-Panel (wie Intro) | `<button>` Cards | Gleiche Struktur wie Intro | Einfaches Carousel | ⚠️ 40 % |
| 5 | **Export** | 2 Buttons nebeneinander: "Vollständigkeit prüfen" (`bg-deep-blue text-white`) + "Videoeditor starten" (`bg-crimson text-white`, MonitorPlay-Icon) | `<button>` flex-row | `shadow-sm hover:shadow-md`, `flex-1` | "Video rendern"-Button | ⚠️ 40 % |

### 3.6 Upload-Module (4 Accordions)

| # | Element | Mockup | Element-Typ | Mockup-Farben / Effekte | Implementierung | Match |
|---|---|---|---|---|---|---|
| 1 | **Medien** | **Video-Player** (`aspect-video bg-gray-900`, Play/Pause-Button crimson `hover:scale-105`, Timeline crimson-Fill, Zeit-Anzeige `text-white/70 font-mono`) + Technische Daten (6 Key-Value-Paare: Format/Dateigröße/Länge/Auflösung/Bildrate/Audio, `flex justify-between p-2.5 bg-white border`) + **Thumbnail-Vorschau** (`aspect-video bg-deep-blue`, Platzhalter-Bild `placehold.co/1920x1080/0f446b/c60024`) + Technische Daten (4 Paare) | `<div>` Player + `<div>` Data + `<img>` | Grid 1-col/2-col, `space-y-2` | Video-Player-Platzhalter, Basis-Daten | ❌ 25 % |
| | **Video-Player** | Play/Pause-Icon `w-16 h-16 bg-crimson/90 rounded-full`, Timeline `h-1 bg-white/20`, Fill `bg-crimson` | `<button>` + `<div>` | `hover:bg-crimson hover:scale-105 shadow-lg` | **Platzhalter** | ❌ 10 % |
| | **Thumbnail** | Bild von `placehold.co`, `object-cover` | `<img>` | `w-full h-full` | **Nicht vorhanden** | ❌ |
| 2 | **Upload-Daten** | Titel+**Copy-Button** + Beschreibung+**Copy-Button** + Upload-Zeitpunkt (`datetime-local`) + Veröffentlichungs-Zeitpunkt (`datetime-local`) + Info-Card (HardDrive-Icon, formatierte Daten) | `<input>` + `<textarea>` + `<input type="datetime-local">` | Copy-Buttons an jedem Feld | Felder vorhanden, Copy-Buttons fehlen | ⚠️ 70 % |
| 3 | **Publizieren** | "Publizieren"-Button (`w-full`, crimson, Rocket-Icon, `shadow-md hover:shadow-lg`) + **Lade-Animation** (Rocket rotiert 360° infinite) + **Erfolgs-Card** (`bg-green-50`, CheckCircle2-Icon, 5 Key-Value-Infos, "Neu publizieren"-Button outline) | `<button>` + `<motion.div>` | `disabled:opacity-50`, `initial:scale:0.9 animate:scale:1` | Archivieren-Sektion, Basis | ⚠️ 60 % |
| 4 | **Video-Marketing** | Kontakt-Liste (5 Personen, Avatar-Rund+User-Icon, Name+Kanal, **Status-Toggle-Button** "Informieren"↔"Informiert", grüne Cards bei "informiert") + "Alle senden"-Button (crimson) | `<motion.div>` Liste + `<button>` | `initial: opacity:0 x:-10`, `animate`, `delay`, Status-Toggle: `bg-green-100 text-green-700` / `bg-cool-gray text-gray-500` | Kontakte im Kanal-Tab, nicht hier | ❌ 20 % |

### 3.7 Kanal / Form Builder (6 Accordions)

| # | Element | Mockup | Element-Typ | Mockup-Farben / Effekte | Implementierung | Match |
|---|---|---|---|---|---|---|
| 1 | **Thema** | **Prompt-Editor mit Design/Preview-Tabs**: Tab-Buttons (Edit3-Icon "Design" / Eye-Icon "Preview", `bg-cool-gray p-1`), Design-Modus: Textarea transparent über farbigem Hintergrund (Variable `{{x}}` als `text-crimson font-semibold`), Preview-Modus: Card mit Label "Preview – Variablen aufgelöst", alle `{{x}}` durch Werte ersetzt | `<div>` + `<textarea>` | `font-mono text-sm leading-relaxed`, Design-Textarea: `text-transparent caret-deep-blue`, Highlight-Layer: `absolute inset-0 pointer-events-none` | Prompt-Template mit Variablen, Preview vorhanden | ⚠️ 60 % |
| 2 | **Research** | Sortable Table (6 Kriterien) + **Delete-Buttons** (Trash2-Icon, `hover:bg-red-50 hover:text-crimson`) + **"Hinzufügen"-Button** (deep-blue, Plus-Icon, `shadow-sm hover:shadow-md`) | `<table>` + `<button>` | Extra Spalte "Dev." + "Aktion" | Basis-Tabelle ohne Delete/Add | ❌ 40 % |
| 3 | **Audio** | Sortable Table (8 Kriterien) + Delete-Buttons + "Hinzufügen"-Button | `<table>` + `<button>` | Gleiche Struktur | Basis-Tabelle | ❌ 40 % |
| 4 | **Slides** | Prompt-Editor (Design/Preview), ähnlich wie Thema | `<div>` + `<textarea>` | Variablen-Highlighting | Basis-Prompt | ⚠️ 50 % |
| 5 | **Video** | **File Lists** (Intro/Hauptteil/Outro): Input-Felder mit Trash2-Delete, "+ Hinzufügen"-Button (deep-blue, Plus-Icon) | `<input>` + `<button>` | `font-mono`, `flex items-center gap-2` | **Nicht vorhanden** | ❌ 10 % |
| 6 | **Upload** | YouTube-Zugangsdaten (URL+Username+Passwort, `type="password"`) + Thumbnail-Prompt (Design/Preview-Tabs) | `<input>` + `<div>` | Trennlinie, Grid 2-col | Basis | ❌ 30 % |

---

## 4. Einstellungen-Modal

| Element | Mockup | Element-Typ | Mockup-Farben / Effekte | Implementierung | Match |
|---|---|---|---|---|---|
| **Backdrop** | `fixed inset-0 z-[100] bg-black/50`, klick schließt | `<motion.div>` | `initial: opacity:0 animate: opacity:1 exit: opacity:0` | Overlay mit Klick-Close | ✅ 90 % |
| **Container** | `bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden`, `initial: scale:0.9 opacity:0 animate: scale:1 opacity:1` | `<motion.div>` | `transition duration 0.2`, `e.stopPropagation()` | `bg-bg-elevated rounded-lg`, CSS-Animation | ⚠️ 60 % |
| **Header** | `px-6 py-4 border-b border-cool-border`, Settings-Icon `text-crimson`, "Einstellungen" `text-lg font-bold text-deep-blue`, ×-Button `p-1.5 rounded-lg hover:bg-cool-gray` | `<div>` + `<button>` | `flex items-center justify-between` | `px-5 py-3`, Titel + ×-Button | ⚠️ 70 % |
| **Body** | `px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto` | `<div>` | `scrollbar-thin` | `px-5 py-4`, scrollbar | ⚠️ 80 % |
| Root-Verzeichnis | Input `bg-cool-gray`, `font-mono`, `focus:ring-2 focus:ring-crimson/30 focus:border-crimson`, Hint-Text `text-xs text-gray-400` | `<input>` + `<p>` | `transition-all` | Input-Feld mit Hint | ⚠️ 80 % |
| Info-Toggle | **Toggle-Switch**: Button `w-11 h-6 rounded-full`, aktiv: `bg-crimson`, inaktiv: `bg-gray-300`, Thumb `w-5 h-5 bg-white shadow translate-x-5`, 2 Textzeilen | `<button>` + `<span>` | `transition-colors transition-transform` | ToggleSwitch (NEU, CSS) | ⚠️ 80 % |
| LLM-Anbindungen | 3 KI-Slots: nummeriert (`w-6 h-6 bg-crimson text-white` 1-2-3), Provider-Select (6 Optionen) + API-Key (`type="password" font-mono`), Grid 2-col | `<div>` Cards | `p-4 bg-cool-gray rounded-xl border`, `space-y-3` | 3 Tabs (Allgemein/LLM/TTS), Provider-Liste | ⚠️ 50 % |
| Hilfe-URL | ExternalLink-Icon `text-crimson` + Input `bg-cool-gray font-mono` | `<input>` | `focus:ring-2 focus:ring-crimson/30` | Input-Feld | ⚠️ 80 % |
| **Footer** | `px-6 py-4 border-t border-cool-border flex justify-end gap-2`, "Abbrechen" (white outline) + "Speichern" (crimson, `hover:bg-red-700`) | `<button>` ×2 | `transition-colors` | Buttons ohne Footer-Trennlinie | ⚠️ 70 % |

---

## 5. Right-Chat-Sidebar

| Element | Mockup | Element-Typ | Mockup-Farben / Effekte | Implementierung | Match |
|---|---|---|---|---|---|
| **Container** | `fixed right-0 top-16 bottom-0 w-80 bg-white border-l border-cool-border z-40`, `initial: x:300 opacity:0 animate: x:0 opacity:1` | `<motion.aside>` | `transition type:spring damping:25 stiffness:200`, `shadow-lg` | Fixiert, CSS-Grid, 18rem | ⚠️ 50 % |
| **Header** | Avatar `w-8 h-8 rounded-full bg-deep-blue` + Bot/Info-Icon weiß, Titel `font-bold text-deep-blue text-sm`, Status `text-xs text-green-500` mit grünem Punkt | `<div>` | `flex items-center justify-between` | Chat-Titel | ⚠️ 50 % |
| **3 Tabs** | Chat / Variabeln / Info, `border-b-2`, aktiv: `text-crimson border-crimson bg-crimson/5`, inaktiv: `text-gray-500 hover:bg-cool-gray/50` | `<button>` ×3 | `flex-1 px-4 py-2.5 text-sm font-medium transition-colors` | CSS-Tabs, primary-Farbe | ⚠️ 60 % |
| **User-Nachricht** | `bg-deep-blue text-white rounded-tr-none`, `max-w-[85%]`, `p-3 rounded-lg text-sm leading-relaxed` | `<motion.div>` | `initial: opacity:0 y:10 animate: opacity:1 y:0`, `flex justify-end` | `bg-accent text-white rounded-tr-none` | ⚠️ 60 % |
| **Bot-Nachricht** | `bg-cool-gray text-deep-blue rounded-tl-none`, gleiche Styling | `<motion.div>` | `flex justify-start` | `bg-surface text-text` | ⚠️ 50 % |
| **Typing-Indikator** | 3 Punkte: `w-2 h-2 bg-gray-400 rounded-full animate-bounce`, delays: `0ms/150ms/300ms` | `<div>` | `flex gap-1` | **Statische Punkte** | ❌ 20 % |
| **AutoResizeTextarea** | `flex-1 px-3 py-2 bg-cool-gray`, `resize-none overflow-hidden`, `min-h-[36px] max-h-[200px]`, Enter=Send, Shift+Enter=Newline | `<textarea>` | `focus:ring-2 focus:ring-crimson/30` | Textarea ohne AutoResize | ⚠️ 60 % |
| **Send-Button** | `p-2 bg-crimson text-white rounded-lg hover:bg-red-700`, Send-Icon | `<button>` | `shrink-0 mb-0.5` | Send-Button | ⚠️ 80 % |
| **Variablen-Tab** | Klickbare Cards (`rounded-lg border transition-all cursor-pointer`), aktiv: `bg-crimson/5 border-crimson/40` + Expand-Animation (`height:0→auto`) + **Copy-Button** (crimson) + **Wert-Anzeige** ("Aktueller Wert (DB)") | `<motion.div>` | `initial: opacity:0 y:5`, Puls-Animation bei aktiv | Basis-Variablen-Liste, keine Expand/Copy | ❌ 30 % |
| **Info-Tab** | **Hint-Box** (`p-3 bg-deep-blue/5 rounded-lg border`, HelpCircle-Icon, "Strg+Klick"), **ElementInfo-Cards** (5 Abschnitte: Variablebezeichnung `bg-crimson/5`, Datenbankname, Tabellenname, **FieldTypeCard** mit SQL-Type+Constraints, Feldbeschreibung), Leerzustand (Info-Icon grau, "Noch kein Element ausgewählt") | `<motion.div>` Cards | `text-[10px] uppercase tracking-wide` | Basis-Info, keine Formatierung | ❌ 15 % |
| **FieldTypeCard** | SQL-Type `bg-deep-blue text-white rounded px-2 py-0.5 text-xs font-mono`, Constraints-Liste mit crimson-Punkten | `<div>` | `p-4 bg-white rounded-xl border` | **Nicht vorhanden** | ❌ |
| **Mobile Toggle** | `fixed right-4 bottom-4 z-50 w-12 h-12 bg-crimson rounded-full shadow-lg lg:hidden`, X/Sparkles-Icon | `<button>` | `hover:bg-red-700` | **Nicht vorhanden** | ❌ |
| **Collapsed Indicator** | `fixed right-0 top-20 bg-white border border-r-0 rounded-l-lg p-2 shadow-md`, ChevronUp+Bot-Icon, `hidden lg:flex`, `hover:bg-cool-gray` | `<button>` | `initial:scale:0 animate:scale:1` | **Nicht vorhanden** | ❌ |

---

## 6. UI-Komponenten (Atoms / Molecules)

| Komponente | Mockup (Tailwind) | Element-Typ | Mockup-Farben | Implementierung (CSS) | Match |
|---|---|---|---|---|---|
| **Button Primary** | `bg-crimson text-white rounded-lg px-5 py-2.5 font-medium text-sm`, `hover:bg-red-700`, `shadow-sm hover:shadow-md`, `transition-all`, `disabled:opacity-50` | `<button>` | crimson/red-700 | `.btn-primary`: `bg-primary`, ähnlich, anderer Rotton | ⚠️ 70 % |
| **Button Secondary** | `bg-white text-deep-blue border border-cool-border rounded-lg`, `hover:bg-cool-gray` | `<button>` | weiß/cool-gray | `.btn-secondary`: `bg-surface` | ⚠️ 60 % |
| **Button deep-blue** | `bg-deep-blue text-white hover:bg-blue-900`, Plus-Icon | `<button>` | `#0f446b` | **Fehlt als Variante** | ❌ |
| **Button crimson full-width** | `w-full bg-crimson text-white rounded-xl font-semibold text-base py-4`, `shadow-md hover:shadow-lg`, Rocket-Icon | `<button>` | crimson/red-700 | Nicht als full-width Variante | ❌ |
| **Button Outline** | `px-4 py-2 border border-cool-border rounded-lg text-sm font-medium text-deep-blue hover:bg-cool-gray` | `<button>` | weiß/cool-gray | `.btn-secondary` ähnlich | ⚠️ |
| **Input** | `w-full px-4 py-3 bg-white rounded-lg text-sm text-deep-blue border border-cool-border`, `focus:outline-none focus:ring-2 focus:ring-crimson/30 focus:border-crimson`, `transition-all` | `<input>` | weiß/cool-border/crimson-Ring | `.form-input`: `bg-surface`, dunkel, kein crimson-Ring | ⚠️ 50 % |
| **Input Mono** | Gleiches Styling + `font-mono` | `<input>` | Monospace | `.form-input` + `.font-mono` | ⚠️ |
| **Select** | `bg-white rounded-lg px-4 py-3 text-sm text-deep-blue border`, gleicher Fokus-Ring | `<select>` | weiß | `.form-select` | ⚠️ 60 % |
| **Textarea** | `bg-white rounded-lg px-4 py-3 text-sm text-deep-blue border`, `resize-none`, gleicher Fokus-Ring | `<textarea>` | weiß | `.form-textarea` | ⚠️ 60 % |
| **Checkbox** | `w-4 h-4 accent-crimson rounded` | `<input type="checkbox">` | crimson | **Basis-Checkbox ohne Styling** | ❌ 30 % |
| **ToggleSwitch** | shadcn/ui: `w-8 h-[1.15rem] rounded-full`, `data-[state=checked]:bg-primary`, Thumb `size-4 bg-white shadow transition-transform` | `<SwitchPrimitive>` | crimson/weiß | CSS `.toggle-switch` | ⚠️ 60 % |
| **Badge/Status** | `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium` | `<span>` | Varianten: `bg-crimson/10 text-crimson`, `bg-deep-blue/10 text-deep-blue` | `.badge`, `.badge-ki`, `.badge-success`, `.badge-error` | ⚠️ 65 % |
| **NumberBadge** | `w-10 h-10 rounded-full`, aktiv: `bg-crimson text-white`, inaktiv: `bg-cool-gray text-crimson` | `<div>` | crimson/weiß ↔ cool-gray/crimson | Ähnlich, andere Farben | ⚠️ 70 % |
| **Table** | `w-full text-left`, Header: `bg-cool-gray border-b border-cool-border`, `text-xs font-semibold text-gray-500 uppercase tracking-wider` | `<table>` | cool-gray | `.data-table`, ähnlich | ⚠️ 65 % |
| **Table Row (selected)** | `bg-crimson/5` | `<tr>` | crimson/5 | `tr.selected td` mit `rgba(233,69,96,0.08)` | ⚠️ |
| **Table Sort-Header** | `cursor-pointer select-none hover:text-crimson`, SortIcon (ArrowUpDown/Chevron) | `<th>` | crimson-Hover | **Nicht sortierbar** | ❌ |
| **Card** | `bg-white rounded-xl border border-cool-border shadow-card` | `<div>` | weiß/cool-border | `.card`: `bg-bg-elevated`, dunkel | ⚠️ 50 % |
| **Info-Card** | `p-4 bg-cool-gray rounded-lg border border-cool-border` | `<div>` | cool-gray | `.info-card` | ⚠️ 70 % |
| **Dropzone** | `w-full flex items-center justify-center gap-2 px-4 py-6 bg-cool-gray rounded-lg border-2 border-dashed border-cool-border`, `hover:border-crimson/50 hover:text-crimson` | `<button>` | dashed cool-border/crimson-Hover | `.file-dropzone` (NEU) | ✅ 85 % |
| **FileList-Item** | `flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100`, grüner Punkt + Dateiname | `<div>` | green-50/green-100 | Einfache Liste | ⚠️ 40 % |
| **Progress Bar** | `w-full h-2 bg-cool-gray rounded-full overflow-hidden`, `<motion.div>` crimson-Fill | `<div>` | cool-gray/crimson | **Nicht vorhanden** | ❌ |
| **Loading Spinner** | `animate-spin` (Rotate 360° infinite, 1s linear) | `<motion.div>` | border-Animation | `.loading-spinner` | ⚠️ 70 % |
| **Range Slider** | `w-full accent-crimson` | `<input type="range">` | crimson | `.range-slider` (NEU) | ✅ 80 % |
| **Search Input** | Input mit Search-Icon links | `<input>` + `<Search>` | `focus:ring-2 focus:ring-crimson/30` | `.search-field` | ⚠️ 70 % |
| **Label** | `flex items-center gap-2 text-sm font-semibold text-deep-blue` | `<label>` | deep-blue | `.form-label` | ⚠️ 70 % |
| **Hint Text** | `text-xs text-gray-400` | `<p>` / `<span>` | gray-400 | `.form-hint` | ⚠️ |
| **Section Divider** | `border-t border-cool-border` | `<div>` | cool-border | `.border-t` | ✅ |

---

## 7. Effekte & Animationen

| Effekt | Mockup (Framer Motion / CSS) | Element-Typ | Implementierung | Match |
|---|---|---|---|---|
| **Page-Enter** | `initial: opacity:0 y:10 animate: opacity:1 y:0`, `duration 0.25s easeInOut` | `<motion.div>` | **Keine** | ❌ |
| **Page-Exit** | `exit: opacity:0 y:-10` | `<motion.div>` | **Keine** | ❌ |
| **Accordion-Öffnen** | `initial: height:0 opacity:0 animate: height:auto opacity:1`, `duration 0.3s easeInOut` | `<motion.div>` | CSS `max-height`-Transition | ⚠️ 40 % |
| **Accordion-Schließen** | `exit: height:0 opacity:0` | `<motion.div>` | CSS `max-height`, kein Opacity-Fade | ⚠️ 30 % |
| **Chevron-Rotation** | `rotate-180`, `transition-transform duration-300`, `text-crimson` bei offen | `<ChevronDown>` | `rotate-180` | ✅ 90 % |
| **Chat-Nachrichten** | `initial: opacity:0 y:10 animate: opacity:1 y:0` | `<motion.div>` | **Keine** | ❌ |
| **Typing-Indikator** | 3 Punkte: `animate-bounce`, delays: `0ms`, `150ms`, `300ms` | `<span>` ×3 | **Statische Punkte** | ❌ |
| **Button-Hover (Play)** | `hover:scale-105`, `shadow-lg hover:shadow-xl` | `<button>` | Nur Farbe+Shadow | ⚠️ 50 % |
| **Button-Lade-Animation** | Icon rotiert 360° infinite | `<motion.div>` `animate: rotate:360` | **Keine** | ❌ |
| **Modal-Enter** | `initial: scale:0.9 opacity:0 animate: scale:1 opacity:1`, `duration 0.2s` | `<motion.div>` | CSS-Fade, kein Scale | ⚠️ 40 % |
| **Modal-Exit** | `exit: scale:0.9 opacity:0` | `<motion.div>` | Einfaches Ausblenden | ⚠️ |
| **Erfolgs-Animation** | `initial: scale:0.9 opacity:0 animate: scale:1 opacity:1`, CheckCircle2-Icon | `<motion.div>` | **Keine** | ❌ |
| **Dashboard-BG-Effekt** | Grid-Pattern (40×40), `mask-image: radial-gradient(circle 300px at var(--mouse-x), black 0%, transparent 100%)`, Maus-Tracking | CSS `::before` | **Kein** | ❌ |
| **Sidebar-Collapse** | `transition-all duration-300`, `w-60` ↔ `w-16`, Items zentriert / mit Label | `<aside>` | **Kein Collapse** | ❌ |
| **Staggered Row-Animation** | `initial: opacity:0 animate: opacity:1`, `transition: delay: id*0.03` | `<motion.tr>` | **Keine** | ❌ |
| **Puls-Animation** | `animate-pulse`: opacity 1→0.7→1, 2s ease-in-out infinite | `<span>` | **Keine** | ❌ |
| **Slide-In (von rechts)** | `initial: x:300 opacity:0 animate: x:0 opacity:1`, `transition: spring damping:25 stiffness:200` | `<motion.aside>` | **Keine** | ❌ |

---

## 8. Gesamtbewertung

| Kategorie | Mockup-Elemente | ✅ Exakt | ⚠️ Teilweise | ❌ Fehlt | % erreicht |
|---|---|---|---|---|---|
| **Farbsystem** | 18 Tokens | 3 | 8 | 7 | ~40 % |
| **Header** | 7 Elemente | 1 | 6 | 0 | ~65 % |
| **LeftSidebar** | 9 Elemente | 0 | 5 | 4 | ~35 % |
| **Workspace** | 3 Elemente | 0 | 2 | 1 | ~40 % |
| **RightChatSidebar** | 15 Elemente | 0 | 8 | 7 | ~35 % |
| **Thema-Module** | 12 Elemente | 1 | 3 | 8 | ~25 % |
| **Research-Module** | 8 Elemente | 0 | 6 | 2 | ~60 % |
| **Audio-Module** | 10 Elemente | 2 | 6 | 2 | ~65 % |
| **Slides-Module** | 8 Elemente | 2 | 5 | 1 | ~70 % |
| **Video-Module** | 20 Elemente | 0 | 6 | 14 | ~20 % |
| **Upload-Module** | 14 Elemente | 0 | 5 | 9 | ~25 % |
| **Kanal / Form Builder** | 12 Elemente | 0 | 4 | 8 | ~25 % |
| **Einstellungen-Modal** | 10 Elemente | 1 | 9 | 0 | ~70 % |
| **UI-Komponenten** | 23 Komponenten | 2 | 16 | 5 | ~55 % |
| **Effekte / Animationen** | 15 Effekte | 1 | 3 | 11 | ~15 % |

### **GESAMT: ~48 % des Mockups umgesetzt**

---

## 9. To-Do: Was muss noch gemacht werden

### 🔴 KRITISCH (Design-System)

| # | Aufgabe | Beschreibung |
|---|---|---|
| 1 | **Farbsystem auf Hell umstellen** | CSS-Variablen auf Mockup-Werte ändern: `--color-bg: #ffffff`, `--color-bg-elevated: #f0f2f5`, `--color-text: #0f446b`, `--color-primary: #c60024`, `--color-border: #dcdfe4`, `--color-surface: #f8f9fa`. Oder Dual-Theme mit `[data-theme="light"]` implementieren. |
| 2 | **Fokus-Ring auf crimson/30** | Alle Inputs/Textareas/Selects: `focus:ring-2 focus:ring-crimson/30 focus:border-crimson` |

### 🟠 HOCH (Fehlende UI-Struktur)

| # | Aufgabe | Element-Typ | Beschreibung |
|---|---|---|---|
| 3 | **Sidebar-Collapse** | `<button>` + `<aside>` | Chevron-Toggle-Button (`absolute -right-3`), width-Transition `13rem` ↔ `4rem`, Icons-only Modus, Tooltips bei Hover (`bg-deep-blue text-white px-2 py-1 rounded`) |
| 4 | **Page-Transition** | `<div>` Wrapper | opacity + translateY(-10→0) beim Tab-Wechsel, duration 0.25s |
| 5 | **Dashboard-BG-Effekt** | CSS `::before` | Grid-Pattern + Radial-Maske folgt Mausposition (nur Thema-Module Quelltext) |
| 6 | **Typing-Indikator (Chat)** | 3 `<span>` | `animate-bounce` mit gestaffelten Delays: 0ms, 150ms, 300ms |
| 7 | **Sortierbare Tabellen** | `<th>` + Sort-Icons | ArrowUpDown/ChevronUp/ChevronDown in Research, Audio, Slides, Kanal |
| 8 | **Button-Lade-Animation** | `<motion.div>` | Icon rotiert 360° infinite bei "Projekt starten", "Publizieren", "Analyse starten" |

### 🟡 MITTEL (Fehlende Inhalte / Komponenten)

| # | Aufgabe | Seite / Komponente | Beschreibung |
|---|---|---|---|
| 9 | **YouTube-Embed** | Thema-Module #2 | Iframe erscheint bei gültiger URL mit Animation |
| 10 | **Progress-Bar** | Thema-Module #2 | `h-2 bg-cool-gray`, crimson-Fill animiert, Prozent-Anzeige |
| 11 | **Analyse-Ergebnis-Cards** | Thema-Module #3 | 3 Cards (1 hervorgehoben deep-blue), staggered fadeUp |
| 12 | **Projektstart-Erfolg** | Thema-Module #4 | Erfolgs-Animation: scale bounce, CheckCircle, 2 Buttons |
| 13 | **Video-Format-Selector** | Video-Module #1 | Grid 3-col Cards (Quer/Hoch/Quadrat) + Pill-Buttons (Plattformen) |
| 14 | **Video-Template-Carousel** | Video-Module #2-4 | 4 pro Seite, Chevron-Nav, Pagination-Dots, Metadata-Panel (Auflösung/Aspect/Länge) |
| 15 | **Video-Timeline** | Video-Module #3 | 5 Spuren (Hintergrund/SprecherA/SprecherB/12 Slides), Intro/Outro-Vertikalbalken, Legende |
| 16 | **Video Steuerdatei** | Video-Module #3 | Upload/Anzeige/Entfernen, `bg-deep-blue/5 rounded-lg` |
| 17 | **Video Audio/Video File Lists** | Video-Module #3 | Header + "+ Hinzufügen" + File-Cards mit Entfernen |
| 18 | **Upload Video-Player** | Upload-Module #1 | Play/Pause (crimson, hover:scale-105), Timeline, Zeit |
| 19 | **Upload Thumbnail** | Upload-Module #1 | Bildvorschau + 4 technische Daten |
| 20 | **Upload Video-Marketing** | Upload-Module #4 | Kontakt-Liste mit Status-Toggle (Informieren↔Informiert) |
| 21 | **ChatSidebar Variablen** | RightChatSidebar | Klickbare Cards, Expand/Collapse, Copy-Button, aktuelle Werte |
| 22 | **ChatSidebar Info-Tab** | RightChatSidebar | ElementInfo-Cards (5 Abschnitte), FieldTypeCard, Hint-Box |
| 23 | **Kanal-Editor Buttons** | Kanal / Form Builder | Delete-Buttons (Trash2) + "Hinzufügen"-Button (deep-blue) in Tabellen |

### 🟢 NIEDRIG (Details / Polish)

| # | Aufgabe | Element-Typ | Beschreibung |
|---|---|---|---|
| 24 | **Copy-Buttons global** | `<button>` + `<Copy>` | An allen Inputs/Textareas: `absolute right-2 top-1/2 -translate-y-1/2`, `hover:text-crimson` |
| 25 | **Hover-Effekte Cards** | `<motion.div>` | `whileHover: scale:1.01`, shadow-Wechsel |
| 26 | **Checkbox-Styling** | `<input type="checkbox">` | `accent-crimson`, `w-4 h-4 rounded` |
| 27 | **Row-Animationen** | `<tr>` | Staggered fade-in (`delay: index*0.03`) für Audio-Transkription |
| 28 | **Button deep-blue Variante** | CSS `.btn-deep-blue` | `bg-[#0f446b] text-white hover:bg-blue-900` |
| 29 | **Button full-width crimson** | CSS `.btn-full` | `w-full py-4 text-base rounded-xl` |
| 30 | **ChatSidebar Mobile Toggle** | `<button>` | `fixed right-4 bottom-4`, crimson-Ball, `lg:hidden` |
| 31 | **ChatSidebar Collapsed Indicator** | `<button>` | `fixed right-0 top-20`, ChevronUp+Bot-Icon |
| 32 | **Design/Preview-Tabs** | `<button>` ×2 | Edit3/Eye-Icons, `bg-cool-gray p-1`, Syntax-Highlighting im Design-Modus |
| 33 | **Erfolgs-Animation global** | `<motion.div>` | `scale:0.9→1 opacity:0→1` für Erfolgszustände |
| 34 | **Puls-Animation** | `<span>` | `opacity 1→0.7→1, 2s` für aktive Badges |
| 35 | **Modal-Animation verbessern** | `<motion.div>` | Scale+Opacity beim Öffnen/Schließen (statt nur Fade) |
| 36 | **Video-Export Buttons** | 2 `<button>` | "Vollständigkeit prüfen" (deep-blue) + "Videoeditor starten" (crimson) |

---

> **Erstellt am:** 2026-05-01  
> **Quelle Mockup:** `C:\Users\uwean\Downloads\Kimi_Agent_20260501 - SMproducer (1)\app` (React + Tailwind + shadcn/ui + Framer Motion)  
> **Ziel:** `Entwicklung/ME4-SMproducer-3/Code/` (Vanilla JS + Vite + CSS Custom Properties)
