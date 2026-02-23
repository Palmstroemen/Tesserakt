# ToDo

Umsetzungsreihenfolge fuer das MVP:

- [x] Backend aufsetzen: FastAPI, `/vektor`-Endpunkt, Rule Engine aus `horoskop_assessment.py` extrahieren, Systeme als Unterordner laden
- [x] KO-Kontrollgruppe umsetzen: serverseitig, reproduzierbar per Seed
- [x] React-Grundgeruest erstellen: Hooks und Komponenten-Schnittstellen definieren (ohne visuelles Design)
- [x] Frageschleife bauen: Geburtsdatum -> Vektoren -> 16 Fragen -> Rating
- [x] Ergebnis-Seite bauen: Ranking + Temperament
- [x] Vergleichsgruppe integrieren: `/vergleich`-Endpunkt + `VergleichsGruppeViz`
- [x] DB-Anbindung umsetzen: `/session`-Endpunkt + PostgreSQL
- [x] Materialized View + `pg_cron` einrichten: naechtlicher Refresh
