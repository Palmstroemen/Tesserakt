# ToDo

Umsetzungsreihenfolge gemaess `Startprompt.md`:

- [ ] Backend aufsetzen: FastAPI, `/vektor`-Endpunkt, Rule Engine aus `horoskop_assessment.py` extrahieren, Systeme als Unterordner laden
- [ ] KO-Kontrollgruppe umsetzen: serverseitig, reproduzierbar per Seed
- [ ] React-Grundgeruest erstellen: Hooks und Komponenten-Schnittstellen definieren (ohne visuelles Design)
- [ ] Frageschleife bauen: Geburtsdatum -> Vektoren -> 16 Fragen -> Rating
- [ ] Ergebnis-Seite bauen: Ranking + Temperament
- [ ] Vergleichsgruppe integrieren: `/vergleich`-Endpunkt + `VergleichsGruppeViz`
- [ ] DB-Anbindung umsetzen: `/session`-Endpunkt + PostgreSQL
- [ ] Materialized View + `pg_cron` einrichten: naechtlicher Refresh
