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
- `POST /rueckblick`, `POST /rueckblick/kontrolle`, `GET /fragen/rueckblick` -> Spiel B (Rueckblick)
- `POST /horoscope/heute` -> "Dein Horoskop fuer heute" (Belohnung in Spiel B)
- `GET /horoscope/erklaerungen` -> Erklaertexte (Skill, Methodik, Experiment)
- `POST /kontrolle` -> Kontrollvektoren je System fuer Perzentil/Skill (mit `session_id` + `stichtag` aus `/vektor`; Frontend laedt sie waehrend der Fragephase)
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

- Skill-Metrik (perzentil_v1) unter Nullhypothese + Sensitivitaet, mit Mittelwert/SD je System:
  - `python3 tools/skill_metric_test.py --runs 2000 --cache tools/output/skill_sim.json`
  - Dauer ca. 4 min fuer 2000 Personen (8 Prozesse); `--cache` spart die Neuberechnung bei weiteren Laeufen
- System-Coverage und Neutralitaetsdiagnose:
  - `python3 tools/system_diagnostics.py --runs 1200 --seed 42`
- Fokusdiagnose auf ein Systemset:
  - `python3 tools/system_diagnostics.py --runs 1500 --systems Vedisch Hellenistisch --seed 42`

Hinweis: Die lokale Persistenz laeuft aktuell ueber `backend/assessment.db` (SQLite) fuer schnelle Entwicklungszyklen.

## Erklaertexte bearbeiten

Quelle sind die Markdown-Dateien in `docs/Textbausteine/erklaerungen/` (Format im Kopf von
`tools/md_to_erklaerungen.py`). Nach jeder Aenderung das JSON neu erzeugen:

```bash
python3 tools/md_to_erklaerungen.py
```

Ebenso fuer das Horoskop fuer heute (Spiel B): Quelle `docs/Textbausteine/heute/heute_v1.md`,
danach `python3 tools/md_to_heute.py`.
