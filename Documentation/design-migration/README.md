# ME4-SMproducer-3 – Design-Migration: Implementierungsplan

> **Manager-Dokument | Phase: Planung**  
> **Rolle:** Manager → Delegiert an Senior / UI-Entwickler / Junior  
> **Stand:** 2026-05-01  
> **Ziel:** Mockup-Konformität von ~48 % auf 100 % bringen  
> **Vorgaben:** `C:/Users/uwean/entwicklungsvorgaben/` (01, 06, 07, 13)  
> **Mockup:** `C:\Users\uwean\Downloads\Kimi_Agent_20260501 - SMproducer (1)\app`  
> **Ziel-Code:** `Entwicklung/ME4-SMproducer-3/Code/`

---

## 📋 ID-System: `MESM-DS-{KATEGORIE}-{NUMMER}`

| Kürzel | Kategorie | Beschreibung |
|---|---|---|
| `COLOR` | Farbsystem | CSS-Variablen, Design-Tokens, Themes |
| `LAY` | Layout | Header, Sidebars, Workspace, Modal |
| `MOD` | Module | 7 Seiten (Thema, Research, Audio, Slides, Video, Upload, Kanal) |
| `UI` | UI-Komponenten | Atoms & Molecules (Button, Input, Table, Badge, etc.) |
| `ANIM` | Animationen | Transitions, Effekte, Motion |

---

## 🔁 Vorgehen pro Element (4-Phasen-Zyklus)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. ANALYSE   │ ──▶ │ 2. IMPLEMENT │ ──▶ │ 3. PRÜFUNG   │ ──▶ │ 4. DOKUMENT. │
│ Mockup lesen │     │ Code ändern  │     │ Mockup vs Neu│     │ ID + Daten   │
│ Farben/Typen │     │ CSS/JS/HTML  │     │ Side-by-Side │     │ in Code+Doku │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Dokumentationspflicht pro Element:**
- **Im Code:** `/* MESM-DS-XXXX-NNN: Beschreibung – alle technischen Daten – siehe docs/design-migration/ */`
- **In Doku:** `docs/design-migration/elemente/MESM-DS-XXXX-NNN.md` mit: ID, Position, Typ, Mockup-Daten, Implementierungsdaten, Screenshot-Referenz

---

## 📊 GESAMTÜBERSICHT: 36 Tasks, 5 Kategorien

| # | ID | Task | Kategorie | Priorität | Rolle | Status |
|---|---|---|---|---|---|---|
| **KATEGORIE 1: FARBSYSTEM (COLOR)** |
| 1 | MESM-DS-COLOR-001 | Farbsystem von Dark auf Hell umstellen | Farben | 🔴 K | Senior | ⬜ |
| 2 | MESM-DS-COLOR-002 | Fokus-Ring auf crimson/30 an allen Inputs | Farben | 🔴 K | Junior | ⬜ |
| **KATEGORIE 2: LAYOUT (LAY)** |
| 3 | MESM-DS-LAY-001 | Sidebar-Collapse (Toggle+Animation+Tooltip) | Layout | 🟠 H | Senior | ⬜ |
| 4 | MESM-DS-LAY-002 | Page-Transition (opacity+y-Verschiebung) | Layout | 🟠 H | UI-Entwickler | ⬜ |
| 5 | MESM-DS-LAY-003 | Dashboard-BG-Effekt (Grid+Radial-Maske) | Layout | 🟠 H | UI-Entwickler | ⬜ |
| 6 | MESM-DS-LAY-004 | ChatSidebar: Typing-Indikator (3 bounce-Punkte) | Layout | 🟠 H | Junior | ⬜ |
| 7 | MESM-DS-LAY-005 | ChatSidebar: Nachrichten fade-up Animation | Layout | 🟡 M | Junior | ⬜ |
| 8 | MESM-DS-LAY-006 | ChatSidebar: Variablen-Tab (Expand/Collapse, Copy) | Layout | 🟡 M | UI-Entwickler | ⬜ |
| 9 | MESM-DS-LAY-007 | ChatSidebar: Info-Tab (ElementInfo-Cards, FieldTypeCard) | Layout | 🟡 M | UI-Entwickler | ⬜ |
| 10 | MESM-DS-LAY-008 | ChatSidebar: Mobile Toggle + Collapsed Indicator | Layout | 🟢 N | Junior | ⬜ |
| 11 | MESM-DS-LAY-009 | ChatSidebar: AutoResizeTextarea | Layout | 🟢 N | Junior | ⬜ |
| 12 | MESM-DS-LAY-010 | Modal: Scale+Opacity Öffnen/Schließen | Layout | 🟢 N | Junior | ⬜ |
| **KATEGORIE 3: MODULE – THEMA (MOD-THEMA)** |
| 13 | MESM-DS-MOD-001 | Thema #2: KI-Button + Progress-Bar | Modul | 🟡 M | Senior | ⬜ |
| 14 | MESM-DS-MOD-002 | Thema #2: YouTube-Embed + Website-Input + FileUpload | Modul | 🟡 M | Senior | ⬜ |
| 15 | MESM-DS-MOD-003 | Thema #3: Analyse-Ergebnis-Cards (3 Cards + staggered) | Modul | 🟡 M | UI-Entwickler | ⬜ |
| 16 | MESM-DS-MOD-004 | Thema #4: Projektstart-Erfolg (Animation+2 Buttons) | Modul | 🟡 M | UI-Entwickler | ⬜ |
| **KATEGORIE 3: MODULE – VIDEO (MOD-VIDEO)** |
| 17 | MESM-DS-MOD-005 | Video #1: Format-Selector (3 Cards) + Plattform-Pills | Modul | 🟡 M | UI-Entwickler | ⬜ |
| 18 | MESM-DS-MOD-006 | Video #2: Template-Carousel mit Nav+Pagination+Metadata | Modul | 🟡 M | Senior | ⬜ |
| 19 | MESM-DS-MOD-007 | Video #3: Komplexe Timeline (5 Spuren, 12 Slides) | Modul | 🟡 M | Senior | ⬜ |
| 20 | MESM-DS-MOD-008 | Video #3: Steuerdatei + Audio/Video File Lists | Modul | 🟡 M | Junior | ⬜ |
| 21 | MESM-DS-MOD-009 | Video #5: Export-Buttons (deep-blue + crimson) | Modul | 🟡 M | Junior | ⬜ |
| **KATEGORIE 3: MODULE – UPLOAD (MOD-UPLOAD)** |
| 22 | MESM-DS-MOD-010 | Upload #1: Video-Player (Play/Pause, Timeline, Zeit) | Modul | 🟡 M | Senior | ⬜ |
| 23 | MESM-DS-MOD-011 | Upload #1: Thumbnail-Bild + technische Daten | Modul | 🟡 M | Junior | ⬜ |
| 24 | MESM-DS-MOD-012 | Upload #4: Video-Marketing (Kontakt-Liste, Status-Toggle) | Modul | 🟡 M | UI-Entwickler | ⬜ |
| **KATEGORIE 3: MODULE – KANAL (MOD-KANAL)** |
| 25 | MESM-DS-MOD-013 | Kanal: Delete-Buttons + "Hinzufügen" in Tabellen | Modul | 🟡 M | Junior | ⬜ |
| 26 | MESM-DS-MOD-014 | Kanal #1: Design/Preview-Tabs mit Syntax-Highlighting | Modul | 🟢 N | UI-Entwickler | ⬜ |
| **KATEGORIE 4: UI-KOMPONENTEN (UI)** |
| 27 | MESM-DS-UI-001 | Sortierbare Tabellen (ArrowUpDown/Chevron für Research, Audio, Slides, Kanal) | UI | 🟠 H | Senior | ⬜ |
| 28 | MESM-DS-UI-002 | Button deep-blue Variante (.btn-deep-blue) | UI | 🟢 N | Junior | ⬜ |
| 29 | MESM-DS-UI-003 | Button full-width crimson (.btn-full) | UI | 🟢 N | Junior | ⬜ |
| 30 | MESM-DS-UI-004 | Copy-Buttons global an Inputs/Textareas | UI | 🟢 N | Junior | ⬜ |
| 31 | MESM-DS-UI-005 | Checkbox-Styling (accent-crimson) | UI | 🟢 N | Junior | ⬜ |
| 32 | MESM-DS-UI-006 | Progress-Bar Komponente | UI | 🟢 N | Junior | ⬜ |
| 33 | MESM-DS-UI-007 | Loading-Spinner mit Rotate-Animation verbessern | UI | 🟢 N | Junior | ⬜ |
| **KATEGORIE 5: ANIMATIONEN (ANIM)** |
| 34 | MESM-DS-ANIM-001 | Button-Lade-Animation (Icon rotiert 360°) | Animation | 🟡 M | Junior | ⬜ |
| 35 | MESM-DS-ANIM-002 | Row-Animationen (staggered fade-in für Tabellen) | Animation | 🟢 N | Junior | ⬜ |
| 36 | MESM-DS-ANIM-003 | Hover-Effekte Cards (scale:1.01 + shadow) | Animation | 🟢 N | Junior | ⬜ |

---

## 📁 Dokumentationsstruktur

```
Entwicklung/ME4-SMproducer-3/Documentation/design-migration/
├── README.md                          ← Dieser Plan
├── INDEX.md                           ← Alle Element-IDs mit Status
├── elemente/
│   ├── MESM-DS-COLOR-001.md
│   ├── MESM-DS-COLOR-002.md
│   ├── MESM-DS-LAY-001.md
│   ├── ... (36 Dateien)
│   └── MESM-DS-ANIM-003.md
└── pruefberichte/
    ├── 2026-05-01_farbsystem.md
    ├── 2026-05-01_layout.md
    └── ...
```

---

## 🚀 Ausführungsreihenfolge

### Sprint 1: Fundament (COLOR + LAY-Core)
1. MESM-DS-COLOR-001 → Farbsystem (alle anderen Tasks bauen darauf auf)
2. MESM-DS-COLOR-002 → Fokus-Ring
3. MESM-DS-LAY-001 → Sidebar-Collapse
4. MESM-DS-LAY-002 → Page-Transition
5. MESM-DS-LAY-003 → Dashboard-BG-Effekt

### Sprint 2: Interaktion (ANIM + UI-Basis)
6. MESM-DS-UI-001 → Sortierbare Tabellen
7. MESM-DS-ANIM-001 → Button-Lade-Animation
8. MESM-DS-ANIM-002 → Row-Animationen
9. MESM-DS-ANIM-003 → Hover-Effekte
10. MESM-DS-UI-002–007 → UI-Komponenten

### Sprint 3: ChatSidebar (LAY-Chat)
11. MESM-DS-LAY-004 → Typing-Indikator
12. MESM-DS-LAY-005 → Nachrichten fade-up
13. MESM-DS-LAY-006 → Variablen-Tab
14. MESM-DS-LAY-007 → Info-Tab
15. MESM-DS-LAY-008–010 → ChatSidebar-Rest + Modal

### Sprint 4: Module – Thema (MOD-THEMA)
16. MESM-DS-MOD-001–004 → Thema #2, #3, #4

### Sprint 5: Module – Video (MOD-VIDEO)
17. MESM-DS-MOD-005–009 → Video #1–#5

### Sprint 6: Module – Upload + Kanal (MOD-UPLOAD, MOD-KANAL)
18. MESM-DS-MOD-010–012 → Upload #1, #4
19. MESM-DS-MOD-013–014 → Kanal-Tabellen + Syntax-Highlighting

---

*Erstellt durch MANAGER (deepseek-v4-pro) | Nächster Schritt: LOS: Senior → Sprint 1*
