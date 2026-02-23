# Tesserakt

Horoskop-Assessment als Fullstack-Projekt mit klarer Trennung zwischen:

- `backend/` (FastAPI, Rule Engine, Systemdaten)
- `frontend/` (React UI + Hooks + Logikmodule)
- `db/` (Schema, Migrationen, Views)

## Projektstruktur

```text
/
├── backend/
├── frontend/
├── db/
├── docs/
├── tools/
├── archive/
├── Startprompt.md
└── Tesserakt.code-workspace
```

## Wo finde ich was?

- `backend/`
  - Python-Referenzlogik und Engines (`horoskop_assessment.py`, `rating_engine.py`, `rule_engine.py`)
  - Systemordner mit Regeln (`Westlich/`, `Bazi/`, `Numerologie/`, weitere)
- `frontend/`
  - React-Basisstruktur in `frontend/src/`
  - UI-Komponenten in `frontend/src/components/`
  - Hooks in `frontend/src/hooks/`
  - Reine Logik in `frontend/src/logic/`
- `db/`
  - Datenbankschema-Dokumente und SQL-Migrationen
- `docs/`
  - Konzeptionelle Unterlagen (`docs/konzepte/`)
  - Projektplaene (`docs/Projektpläne/`)
  - Sonstige Doku/Artefakte
- `tools/`
  - Hilfsskripte fuer Analyse/Diagnose
- `archive/`
  - Alte/temporare oder aktuell nicht aktive Dateien

## Workspace

Zum Arbeiten in Cursor/VS Code den Multi-Root-Workspace `Tesserakt.code-workspace` oeffnen.
