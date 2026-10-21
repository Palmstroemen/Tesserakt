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

`frontend` erwartet standardmäßig das Backend unter `http://localhost:8000`.
Optional kann `VITE_API_BASE` gesetzt werden.

## API-Endpunkte

- `POST /vektor` -> berechnet Systemvektoren + Inputs inkl. `session_id`
- `POST /rueckblick`, `POST /rueckblick/kontrolle`, `GET /fragen/rueckblick` -> Spiel B (Rückblick)
- `POST /horoscope/heute` -> "Dein Horoskop für heute" (Belohnung in Spiel B)
- `GET /horoscope/erklaerungen` -> Erklärtexte (Skill, Methodik, Experiment)
- `POST /partner`, `POST /partner/kontrolle`, `GET /fragen/beziehung` -> Spiel C (Beziehung; Kontrollgruppe = zufällige Paare)
- `GET /orte?q=` -> Geburtsort-Suche (offline, GeoNames)
- `POST /kontrolle` -> Kontrollvektoren je System für Perzentil/Skill (mit `session_id` + `stichtag` aus `/vektor`; Frontend lädt sie während der Fragephase)
- `GET /fragen` -> liefert die 16 Fragen
- `GET /matrix` -> liefert die Gewichtungsmatrix
- `POST /session` -> speichert Session + Antworten
- `GET /vergleich?doy=<n>&stunde=<n>&frage_id=<n>` -> Vergleichsgruppendaten

## Happy-Path Smoke Tests (durchgeführt)

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

- Skill-Metrik (perzentil_v1) unter Nullhypothese + Sensitivität, mit Mittelwert/SD je System:
  - `python3 tools/skill_metric_test.py --runs 2000 --cache tools/output/skill_sim.json`
  - Dauer ca. 4 min für 2000 Personen (8 Prozesse); `--cache` spart die Neuberechnung bei weiteren Läufen
- System-Coverage und Neutralitätsdiagnose:
  - `python3 tools/system_diagnostics.py --runs 1200 --seed 42`
- Fokusdiagnose auf ein Systemset:
  - `python3 tools/system_diagnostics.py --runs 1500 --systems Vedisch Hellenistisch --seed 42`

Hinweis: Die lokale Persistenz läuft aktuell über `backend/assessment.db` (SQLite) für schnelle Entwicklungszyklen.

## Erklärtexte bearbeiten

Quelle sind die Markdown-Dateien in `docs/Textbausteine/erklaerungen/` (Format im Kopf von
`tools/md_to_erklaerungen.py`). Nach jeder Änderung das JSON neu erzeugen:

```bash
python3 tools/md_to_erklaerungen.py
```

Ebenso für das Horoskop für heute (Spiel B): Quelle `docs/Textbausteine/heute/heute_v1.md`,
danach `python3 tools/md_to_heute.py`.
