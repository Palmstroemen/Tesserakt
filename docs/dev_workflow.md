# Dev Workflow

## Lokales Starten

### Backend

```bash
cd backend
python3 -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

`frontend` erwartet standardmaessig das Backend unter `http://localhost:8000`.
Optional kann `VITE_API_BASE` gesetzt werden.

## API-Endpunkte

- `POST /vektor` -> berechnet Systemvektoren + Inputs inkl. `session_id`
- `GET /fragen` -> liefert die 16 Fragen
- `GET /matrix` -> liefert die Gewichtungsmatrix
- `POST /session` -> speichert Session + Antworten
- `GET /vergleich?doy=<n>&stunde=<n>&frage_id=<n>` -> Vergleichsgruppendaten

## Happy-Path Smoke Tests (durchgefuehrt)

1. Backend Syntaxcheck:
   - `python3 -m py_compile backend/main.py backend/store.py backend/rule_engine.py`
2. Frontend Build:
   - `cd frontend && npm run build`
3. Backend Endpoint Smoke:
   - `GET /health` -> `200`
   - `POST /vektor` -> `200`
   - `POST /session` -> `200`
   - `GET /vergleich` -> `200`

## QA / Diagnose-Checks

- Random-Baseline fuer Scoring (Fit + Skill):
  - `python3 tools/random_baseline_test.py --runs 5000 --seed 42`
- System-Coverage und Neutralitaetsdiagnose:
  - `python3 tools/system_diagnostics.py --runs 1200 --seed 42`
- Fokusdiagnose auf ein Systemset:
  - `python3 tools/system_diagnostics.py --runs 1500 --systems Japanisch Hellenistisch --seed 42`

Hinweis: Die lokale Persistenz laeuft aktuell ueber `backend/assessment.db` (SQLite) fuer schnelle Entwicklungszyklen.
