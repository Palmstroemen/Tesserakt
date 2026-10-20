# Tesserakt

**Horoskop-Assessment als sozialwissenschaftliches Experiment.**  
Vergleich mehrerer astrologischer und numerologischer Systeme mit der Selbsteinschaetzung von Nutzerinnen und Nutzern. Kernmetrik: Skill – passt das eigene Geburtsdatum besser als 100 zufaellige andere Geburtsdaten desselben Systems? (0 = Zufallsniveau, Erklaerung: `docs/Erklärungen/skill_fuer_spieler.md`). Intern: Bewertungen und Vektoren auf Skala -1..+1.

Fullstack-Projekt mit klarer Trennung zwischen:

- `backend/` (FastAPI, Rule Engine, Ephemeris, Chart-Berechnung)
- `frontend/` (React + Vite, Hooks, Logikmodule)
- `content/` (Horoskop-Texte, Systemtexte je Spiel)
- `db/` (Schema, Migrationen, Views)

## Spiele

| Spiel | Beschreibung | Status |
|-------|--------------|--------|
| **A** | Persoenlichkeit – 1 Person, 16 Fragen, Systemvergleich nach Skill | MVP live |
| **B** | Prognose/Zeit – Rueckblick auf vergangene Zeitfenster | Phase 2 |
| **C** | Beziehung – 2-Personen-Kompatibilitaet | In Arbeit |

## Systeme

Westlich, Bazi, Numerologie, Kabbalah, Arabisch, Hellenistisch, Vedisch – standardmaessig alle aktiv, einzeln abwaehlbar. Jedes System hat eine eigene Kontrollgruppe (zufaellige andere Geburtsdaten, Endpunkt `/kontrolle`).

## Projektstruktur

```text
/
├── backend/          # FastAPI, Rule Engine, Chart-Module (*_chart.py)
├── frontend/        # React + Vite, Komponenten, Hooks, Logik
├── content/         # Horoskop-Texte (system_texts_v1.json je Spiel)
├── db/              # Schema, Migrationen, Views
├── docs/            # Konzepte, Erklaerungen, dev_workflow
├── tools/           # Diagnose und Tests (skill_metric_test, etc.)
├── archive/
├── ToDo.md
└── Tesserakt.code-workspace
```

## Wo finde ich was?

- `backend/`
  - Engines: `rule_engine.py`, `rating_engine.py`
  - Fragen fuer Spiel A inkl. Gewichte je System: `fragen.json` (einzige Quelle, Frontend laedt ueber `/fragen`)
  - Chart-Module: `chart.py`, `bazi_chart.py`, `vedisch_chart.py`, `hellenistisch_chart.py`, etc.
  - Systemordner mit Regeln: `Westlich/`, `Bazi/`, `Numerologie/`, `Kabbalah/`, `Arabisch/`, `Hellenistisch/`, `Vedisch/`
- `frontend/src/`
  - Komponenten: `GeburtsdatumInput`, `SelbsteinschaetzungSlider`, `SystemDeutungTabs`, `RadixWheel`, `FourPillarsChart`, `DashaChart`, `KabbalahTree`, etc.
  - Hooks: `useVektoren`, `useRating`
  - Logik: `rating.js`, `partnerQuestions.js`, `partnerRating.js`
- `content/horoscope/de/`
  - Systemtexte fuer Spiel A und Spiel C
- `tools/`
  - `skill_metric_test.py`, `system_diagnostics.py`, `vector_value_histogram.py`, etc.

## Workspace

Zum Arbeiten in Cursor/VS Code den Multi-Root-Workspace `Tesserakt.code-workspace` oeffnen.

## Scope-Quelle

Die verbindliche Aufgabenliste fuer die Umsetzung wird in `ToDo.md` gepflegt.

## Entwicklung

Lokal starten und testen: `docs/dev_workflow.md`.
