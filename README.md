# Tesserakt

**Stimmen Horoskope? Tesserakt ist ein Spiel, das es herausfinden will.**

Du beantwortest 16 Fragen über dich selbst: wie du bist, was dir liegt, was dir wichtig ist. Gleichzeitig rechnet
der Apparat aus deinem Geburtsdatum sieben Horoskope aus, das westliche, das chinesische, das indische, das
arabische, das hellenistische, die Kabbala und die Numerologie. Am Ende siehst du, welches dich am besten
beschreibt.

Dabei muss sich jedes Horoskop gegen den Zufall behaupten. Der Apparat rechnet es auch für 100 zufällige andere
Geburtstage. Beschreibt dich dein eigenes Horoskop besser als die fremden, ist vielleicht etwas dran. Wenn
nicht, war es Zufall.

Wer mag, schenkt seine Antworten der Forschung, ohne Namen, ohne Geburtsort und ohne genaues Geburtsdatum. Aus
vielen Runden wird sichtbar, ob Horoskope mehr treffen, als der Zufall erlaubt. Die Auswertung und die Daten
werden offen veröffentlicht, damit jeder sie nachprüfen kann.

Im zweiten Spiel geht es um zwei Menschen: Wer von euch beiden ist wo stärker, und sehen die Horoskope das
genauso? Ein drittes Spiel über vergangene Zeitabschnitte ist in Arbeit.

Gespielt wird auf einem alten Apparat aus Messing, der in einem geschnitzten Holzkästchen liegt. Wie er
funktioniert, findest du selbst heraus.

Zum Schluss gibt's als Belohnung für die Teilnahme für jeden je nach Spiel alle aktuellen Horoskope und auf Wunsch auch noch in einem wunderschönen Buch gedruckt.

## Für Entwicklerinnen und Entwickler

**Horoskop-Assessment als sozialwissenschaftliches Experiment.**  
Vergleich mehrerer astrologischer und numerologischer Systeme mit der Selbsteinschätzung von Nutzerinnen und Nutzern. Kernmetrik: Skill – passt das eigene Geburtsdatum besser als 100 zufällige andere Geburtsdaten desselben Systems? (0 = Zufallsniveau, Erklärung: `docs/Textbausteine/erklaerungen/01_skill.md`). Intern: Bewertungen und Vektoren auf Skala -1..+1.

Fullstack-Projekt mit klarer Trennung zwischen:

- `backend/` (FastAPI, Rule Engine, Ephemeris, Chart-Berechnung)
- `frontend/` (React + Vite, Hooks, Logikmodule)
- `content/` (Horoskop-Texte, Systemtexte je Spiel)
- `db/` (Schema, Migrationen, Views)

## Spiele

| Spiel | Beschreibung | Status |
|-------|--------------|--------|
| **A** | Persönlichkeit – 1 Person, 16 Fragen, Systemvergleich nach Skill | MVP live |
| **B** | Prognose/Zeit – Rückblick auf vergangene Zeitfenster | Phase 2 |
| **C** | Beziehung – wer von beiden ist wo stärker? Skill gegen zufällige Paare | MVP |

## Systeme

Westlich, Bazi, Numerologie, Kabbalah, Arabisch, Hellenistisch, Vedisch – standardmäßig alle aktiv, einzeln abwählbar. Jedes System hat eine eigene Kontrollgruppe (zufällige andere Geburtsdaten, Endpunkt `/kontrolle`).

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
  - Fragen für Spiel A inkl. Gewichte je System: `fragen.json` (einzige Quelle, Frontend lädt über `/fragen`)
  - Chart-Module: `chart.py`, `bazi_chart.py`, `vedisch_chart.py`, `hellenistisch_chart.py`, etc.
  - Systemordner mit Regeln: `Westlich/`, `Bazi/`, `Numerologie/`, `Kabbalah/`, `Arabisch/`, `Hellenistisch/`, `Vedisch/`
- `frontend/src/`
  - Der Apparat (das Spiel, Spiele A, B und C): `apparat/` mit `Apparat.jsx`, `Spielplatte.jsx`, `Ergebnisplatte.jsx`, Buch
  - Charts aus der ersten Fassung, die der Apparat weiter nutzt: `components/` (`RadixWheel`, `FourPillarsChart`, `DashaChart`, `KabbalahTree`, etc.)
  - Logik: `rating.js` (Skill/Perzentil für alle Spiele, Timing), `ort.js`, `api.js`
  - Texte zum Bearbeiten (Vorblatt, Datenverwendung): `texte/*.md`
- `docs/Berechnungsgrundlagen/`
  - "Beipackzettel" je System: Konventionen, korrigierte Fehler, bekannte Vereinfachungen
- `content/horoscope/de/`
  - Systemtexte für Spiel A und Spiel C
- `tools/`
  - `skill_metric_test.py`, `system_diagnostics.py`, `vector_value_histogram.py`, etc.

## Datenquellen

- Planetenpositionen: Swiss Ephemeris (pyswisseph)
- Geburtsorte (Koordinaten, Zeitzonen): GeoNames, CC BY 4.0, https://www.geonames.org (via `geonamescache`)

## Workspace

Zum Arbeiten in Cursor/VS Code den Multi-Root-Workspace `Tesserakt.code-workspace` öffnen.

## Scope-Quelle

Die verbindliche Aufgabenliste für die Umsetzung wird in `ToDo.md` gepflegt.

## Entwicklung

Lokal starten und testen: `docs/dev_workflow.md`. Server (Docker, HTTPS, Sicherung): `docs/betrieb.md`.

## Kopien und das Experiment

Der Code ist offen, damit jeder nachprüfen kann, was Apparat und Server tun. Eine Kopie mit eigenem Server
schadet aber dem Experiment: Jede spaltet die Stichprobe in viele kleine, getrennte Datensätze, von denen
keiner groß genug ist, um zu zeigen, ob Horoskope mehr treffen als der Zufall. Wer den Apparat weiterentwickeln
will, melde sich bitte: Wir finden einen Weg, die Antworten in den gemeinsamen Datenbestand zu bringen.

## Lizenz

Server (`backend/`) unter AGPL-3.0, App (`frontend/`) unter MIT, Medien und Dokumentation unter CC BY-NC 4.0,
Schriften unter OFL 1.1. Einzelheiten, fremde Bestandteile und der Name „Tesserakt“: `LICENSE.md`.
