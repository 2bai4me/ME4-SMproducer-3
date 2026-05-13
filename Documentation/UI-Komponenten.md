# UI-Komponenten Dokumentation — ME4 SM Producer 3.0

> **Stand:** 2026-05-01  
> **ID-Schema:** MESM-DS-COLOR-XXX (Farbsystem) | MESM-UI-XXX (Komponenten)

---

## Farbsystem

| ID | Token | Wert | Ort | Mockup-Referenz |
|----|-------|------|-----|-----------------|
| MESM-DS-COLOR-001 | Komplettes Farbsystem (hell) | siehe `main.css :root` | `Code/app/styles/main.css` | Mockup `index.css` |
| MESM-DS-COLOR-002 | Fokus-Ring crimson/30 | `rgba(198,0,36,0.30)` | `main.css` Z.537 | `focus:ring-2 focus:ring-crimson/30` |
| MESM-DS-COLOR-003 | deep-blue Button | `.btn-accent` | `main.css` Z.610 | `bg-deep-blue text-white` |
| MESM-DS-COLOR-004 | crimson-full-width Button | `.btn-full` | `main.css` Z.621 | `w-full bg-crimson text-white rounded-xl` |

## Layout-Komponenten

| ID | Element | Datei | Beschreibung |
|----|---------|-------|-------------|
| MESM-UI-301a | Logo Sparkles-Icon | `layout/Header.js` | SVG Sparkles-Icon auf crimson-BG, 32×32px |
| MESM-UI-301b | Bell-Button mit Punkt | `layout/Header.js` | SVG Bell-Icon, roter Punkt via `::after` |
| MESM-UI-310 | Sidebar-Collapse | `layout/Navigator.js` | Chevron-Toggle, Width-Transition 13rem↔4rem |
| MESM-UI-310a | Collapse-Toggle-Button | `layout/Navigator.js` | Button `absolute -right-3 top-4`, 24×24px |
| MESM-UI-310b | Tooltip (collapsed) | `layout/Navigator.js` | `bg-accent text-white`, erscheint bei Hover |
| MESM-UI-310c | NumberBadge collapsed | `layout/Navigator.js` | 28×28px im collapsed state |
| MESM-UI-311 | Nav-Item active | `main.css` Z.266 | 4px crimson linker Border, weißer BG, Card-Shadow |
| MESM-UI-320 | Page-Transition | `main.js` + `main.css` | `@keyframes pageEnter`, opacity+Y 0.25s |
| MESM-UI-330 | Chat-Header Avatar | `layout/Sidebar.js` | 32px deep-blue Kreis, Bot-Icon |
| MESM-UI-331 | Sidebar-Tab crimson | `layout/Sidebar.js` | Aktiv: `text-crimson border-crimson bg-crimson/5` |
| MESM-UI-332 | Chat-Animation | `main.css` | `@keyframes messageSlideIn` 0.25s |
| MESM-UI-333 | Typing-Indikator | `layout/Sidebar.js` | 3 Punkte, Bounce 0ms/150ms/300ms |
| MESM-UI-334 | AutoResizeTextarea | `layout/Sidebar.js` | JS `scrollHeight`-basiert, 36-200px |
| MESM-UI-335 | Variablen-Tab | `layout/Sidebar.js` | Expand/Collapse Cards, Copy-Button |
| MESM-UI-336 | Info-Tab | `layout/Sidebar.js` | ElementInfo-Cards, Ctrl+Click Feature |
| MESM-UI-337 | Mobile Toggle | `main.css` | `fixed right-4 bottom-4`, crimson-Kreis |
| MESM-UI-338 | Collapsed Indicator | `main.css` | `fixed right-0 top-20`, Öffnen-Button |

## UI-Atoms

| ID | Element | Datei | Beschreibung |
|----|---------|-------|-------------|
| MESM-UI-001 | Checkbox crimson | `main.css` | `.checkbox-styled`, `accent-color: crimson` |
| MESM-UI-002 | Progress Bar | `main.css` | `.progress-bar` + `.progress-bar-fill`, transition width |
| MESM-UI-003 | Sortable Table Header | `main.css` | `.sortable` mit ⇅-Indikator, `localeCompare` |
| MESM-UI-004 | Copy-Button | `main.css` | `.copy-btn` absolut rechts, `hover:text-crimson` |
| MESM-UI-005 | YouTube Embed | `pages/ThemaPage.js` | `getYoutubeEmbedUrl()`, iframe mit 16:9 |
| MESM-UI-006 | FileList-Item grün | `main.css` | `.file-list-item`, grüner Punkt, `bg-green-50` |
| MESM-UI-007 | Search Input | `main.css` | `.search-field` mit Icon links |

## UI-Molecules

| ID | Element | Datei | Beschreibung |
|----|---------|-------|-------------|
| MESM-UI-404 | Dashboard-BG-Effekt | `pages/ThemaPage.js` + `main.css` | 40×40 Grid, Radial-Maske folgt Maus |
| MESM-UI-405a | Video-Format-Selector | `pages/VideoPage.js` + `main.css` | Grid 3-col, Icons, crimson aktiv |
| MESM-UI-405b | Plattform-Selector Pills | `pages/VideoPage.js` + `main.css` | Flex-Wrap, crimson selektiert |
| MESM-UI-405c | Template-Carousel | `pages/VideoPage.js` + `main.css` | 4/Seite, Chevron-Nav, Dots |
| MESM-UI-405d | Metadata-Panel | `pages/VideoPage.js` + `main.css` | 3-col Grid: Auflösung/Aspect/Länge |
| MESM-UI-405e | Steuerdatei-Card | `pages/VideoPage.js` + `main.css` | `bg-deep-blue/5`, Dateiname+Entfernen |
| MESM-UI-405f | File-Section | `pages/VideoPage.js` + `main.css` | Header+Add, File-Cards |
| MESM-UI-405g | Timeline | `pages/VideoPage.js` + `main.css` | 5 Spuren, dunkler BG, Legende |

## Seiten-Erweiterungen

| ID | Element | Datei | Beschreibung |
|----|---------|-------|-------------|
| MESM-UI-401 | YouTube-URL+Embed | `pages/ThemaPage.js` | Input→Iframe mit Animation |
| MESM-UI-402 | Website-URL-Input | `pages/ThemaPage.js` | URL-Input mit Add-Button |
| MESM-UI-403 | FileUpload-Dropzone | `pages/ThemaPage.js` | DnD + Klick, Mock-Dateien |
| MESM-UI-405 | Analyse-Progress | `pages/ThemaPage.js` | Progress-Bar 0→100%, Intervall |
| MESM-UI-406 | KI-Button | `pages/ThemaPage.js` | Absolut im Textarea, crimson bei Klick |
| MESM-UI-407 | Ergebnis-Cards | `pages/ThemaPage.js` | 3 Cards, 1. hervorgehoben deep-blue |
| MESM-UI-408 | Projektstart-Copy | `pages/ThemaPage.js` | Copy-Buttons, "Vorbereiten"/"Starten" |
| MESM-UI-409 | Button-Lade-Animation | `pages/ThemaPage.js` | Spinner rotiert bei "Starten" |
| MESM-UI-402a | Sortable Table Research | `pages/ResearchPage.js` | Kategorie/Schlagwort/Promptteil sortierbar |
| MESM-UI-403a | Sortable Table Audio | `pages/AudioPage.js` | Audio-Kriterien sortierbar |
| MESM-UI-403b | Transkript Row-Animation | `pages/AudioPage.js` | Staggered fadeIn `delay: i*0.03s` |
| MESM-UI-404a | Sortable Table Slides | `pages/SlidesPage.js` | Slides-Kriterien sortierbar |
| MESM-UI-405h | Export-Buttons | `pages/VideoPage.js` | Tiefblau+Crimson flex-row |
| MESM-UI-406a | Video-Player | `pages/UploadPage.js` | Play-Overlay crimson, aspect-video |
| MESM-UI-406b | Tech Data-Liste | `pages/UploadPage.js` | 6 Key-Value-Paare |
| MESM-UI-406c | Thumbnail | `pages/UploadPage.js` | Platzhalter deep-blue, 16:9 |
| MESM-UI-406d | Copy-Buttons Upload | `pages/UploadPage.js` | An Titel+Beschreibung |
| MESM-UI-406e | Publizieren-Animation | `pages/UploadPage.js` | Full-width Button, Erfolgs-Card |
| MESM-UI-406f | Kontakt-Liste | `pages/UploadPage.js` | Status-Toggle, Avatar, staggered |
| MESM-UI-407a | Design/Preview-Tabs | `pages/KanalPage.js` | Tab-Buttons, Variablen-Highlighting |
| MESM-UI-407b | Delete-Buttons | `pages/KanalPage.js` | Trash-Icon in Tabellen |
| MESM-UI-407c | Add-Button deep-blue | `pages/KanalPage.js` | `.btn-accent` für Hinzufügen |

## Animationen

| ID | Element | Datei | Beschreibung |
|----|---------|-------|-------------|
| MESM-UI-501 | Page-Enter | `main.css` | `@keyframes pageEnter`, 0.25s ease-out |
| MESM-UI-502 | Accordion-Fade | `main.css` | `max-height`+`opacity` Transition |
| MESM-UI-503 | Erfolgs-Animation | `main.css` | `@keyframes successBounce`, scale 0.9→1 |
| MESM-UI-504 | Row-Stagger | `main.css` | `@keyframes rowFadeIn`, `animation-delay` |
| MESM-UI-505 | Puls-Animation | `main.css` | `@keyframes pulse`, 2s ease-in-out |
| MESM-UI-506 | Slide-In Right | `main.css` | `@keyframes slideInRight`, 0.35s |

---

**Gesamt implementierte IDs:** 58  
**Geänderte Dateien:** 12  
**Neue CSS-Zeilen:** ~350  
**Build:** ✅ Erfolgreich (19 Module, 0 Fehler)
