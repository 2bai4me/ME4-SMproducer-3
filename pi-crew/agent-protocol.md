# PI-Crew Agenten-Kommunikationsprotokoll

> Stand: 2026-05-08 | Verbindlich für alle Entwicklungsaufträge

## Rollen & Modelle

| Rolle | Modell | Aufgabe |
|-------|--------|---------|
| **Manager** | deepseek-v4-thinking | Strategie, Planung, Delegation, Qualitätskontrolle |
| **Senior-Entwickler** | deepseek-v4-flash | Implementierung nach Vorgabe |
| **Workflow (Write/Test/Review/Fix/Verify)** | Automatisiert | Deterministischer Entwicklungszyklus |

---

## ⚡ MANAGER-REGELN (unveränderlich, gelten IMMER)

### Regel A – Anforderungsprüfung VOR Delegation
```
Manager MUSS vor JEDER Delegation prüfen:
  1. Ist das Plane-Item vollständig beschrieben?
  2. Sind Akzeptanzkriterien klar?
  3. Sind Abhängigkeiten dokumentiert?
  4. Sind Test-Anforderungen definiert?

WENN NEIN → Manager fragt ANDY: "Item X ist unvollständig. [Was fehlt]. Bitte ergänzen."
WENN JA  → Manager darf delegieren.

⚠️ Manager DARF KEINEN Auftrag lostreten ohne ausreichende Spec.
```

### Regel B – Vollständige Kontext-Übergabe
```
Delegation geschieht in NEUEM Context-Fenster.
Manager MUSS dem Umsetzer und Tester ALLE Informationen mitgeben:
  1. Plane-Item: ID, Titel, vollständige Beschreibung
  2. Technischer Kontext: DB-Tabellen, API-Endpunkte, Dateipfade
  3. Abhängigkeiten: Welche anderen Items müssen fertig sein?
  4. Test-Anforderungen: Was muss getestet werden?
  5. Akzeptanzkriterien: Wann ist das Item "done"?
  6. Verweise: Links zu KON-01, KON-02, INT-01 falls relevant

⚠️ Nichts weglassen. Das neue Fenster hat KEINEN Zugriff auf vorherige Konversation.
```

### Regel C – Ergebnis-Reporting
```
Nach JEDEM abgeschlossenen Item:
  1. Ergebnis im Chat zeigen (kompakt)
  2. Plane-Item auf "completed" setzen
  3. Plane-Seite neu laden (aktuellen Stand zeigen)
  4. current_task.txt aktualisieren
  5. Nächstes Item nur wenn Andy das Ergebnis gesehen hat
```

### Regel D – Vollständigkeits-Sicherung & Plane-Dokumentation
```
Manager MUSS sicherstellen:
  1. JEDE Aufgabe ist UMFASSEND umgesetzt:
     - Code implementiert
     - Tests geschrieben + grün (Exit-Code 0)
     - Review bestanden (0 Issues)
     - Code dokumentiert (Inline-Kommentare + MD-Referenz)
     - Plane-Item auf completed
  2. Status in Plane IMMER aktuell:
     - Bei Start: Item auf "started" setzen + Kommentar "Begonnen"
     - Bei Fortschritt: Kommentar mit Zwischenstand
     - Bei Blockade: Kommentar mit Grund + Andy informieren
     - Bei Abschluss: Item auf "completed" + Ergebnis-Kommentar
  3. Begleitende Dokumentation in Plane:
     - plane_add_comment bei jedem Status-Wechsel
     - Zusammenfassung nach workflow_complete
     - Verweis auf geänderte Dateien
     - Link zu Test-Ergebnissen
```

---

## Kommunikationskanäle

### 1. Delegation (Manager → Entwickler)
```
Datei: pi-crew/current_task.txt
Format:
  ## Aktuell delegiert an
  Senior-Entwickler (deepseek-v4-flash)
  Task: [Plane-Item-ID] [Titel]
  
  ## Vollständiger Kontext (Regel B)
  Plane-Beschreibung: [Komplette Beschreibung aus Plane]
  Technischer Kontext: [DB, API, Dateien]
  Abhängigkeiten: [Item-IDs]
  Test-Anforderungen: [Was testen, Exit-Code 0]
  
  ## Akzeptanzkriterien
  - [ ] Kriterium 1
  - [ ] Kriterium 2
  
  Deadline: [Sprint-Ende]
```

### 2. Ergebnis-Rückmeldung (Entwickler → Manager)
```
Datei: pi-crew/current_task.txt
Format:
  ## Ergebnisse
  - ✅/❌ [Kriterium 1]
  - Test: [Exit-Code/Ergebnis]
  - Review: [Issues/0]
  - Geänderte Dateien: [Liste]
```

### 3. Sprint-Übergabe
```
Workflow → Manager:
  workflow_complete → Plane-Item auf completed
  Manager prüft → Sichten & Freigabe durch Andy
  Plane neu laden → aktuellen Stand zeigen
  Manager setzt nächsten Sprint-Status in current_task.txt
```

### 4. Qualitätssicherung (automatisch)
```
Workflow-Phasen:
  Write → Test (deterministisch, Exit-Code)
  Test → Review (Clean Context, kein Bias)
  Review → Fix (Issues beheben)
  Fix → Verify (Finaler Test)
  Verify → Done (workflow_complete)
```

---

## Kommunikationsregeln

1. **Manager-Regel A (Spec-Prüfung) hat VORRANG** – gilt vor jeder Delegation
2. **Manager-Regel B (Kontext-Übergabe) ist PFLICHT** – neues Fenster = alle Infos mitgeben
3. **Manager-Regel C (Ergebnis-Reporting) nie überspringen** – Andy sieht jedes Ergebnis
4. **Manager delegiert NUR über current_task.txt** – keine impliziten Aufträge
5. **Entwickler dokumentiert Ergebnisse in current_task.txt** – sofort nach Abschluss
6. **Workflow-Status wird über workflow:status abgefragt** – kein Raten
7. **Bei Unklarheiten: Manager fragt Andy** – bevor delegiert wird
8. **Kein Agent überschreibt die Arbeit eines anderen** – Git-Checkpoint schützt
9. **Plane immer aktuell** – nach jedem abgeschlossenen Item neu laden

---

## Sprint-Rhythmus

```
Sprint-Start: Manager setzt Sprint in current_task.txt
     │
     ▼
Manager prüft JEDES Item (Regel A): Spec vollständig?
     │                    │
     ▼                    ▼
   Ja → delegieren    Nein → Andy fragen
     │
     ▼
Manager übergibt VOLLSTÄNDIGEN Kontext (Regel B)
     │
     ▼
Senior-Dev: Write → Test → Review → Fix → Verify → Done
     │
     ▼
Manager: Plane-Item completed, Ergebnis zeigen (Regel C)
     │
     ▼
Andy: Sichten & Freigabe
     │
     ▼
Nächster Sprint
```
