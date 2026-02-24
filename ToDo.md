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

## Naechste Reihenfolge (formaler Prototyp)

1. **Spiel A fertigstellen (zuerst)**
   - [ ] Ergebnisseite erweitern: Horoskop-Diagramme (Westlich/Hellenistisch/Bazi als Basistypen)
   - [ ] Ausformulierte Horoskoptexte je System integrieren
   - [ ] Erklaertexte einbauen: Horoskopmethodik + wissenschaftliches Experiment + KO
   - [ ] DoD A: End-to-End stabil (Eingabe -> Fragen -> Ergebnis inkl. Visuals/Texte/Erklaerung)

2. **Spiel B danach (schlanke Version)**
   - [ ] Zeitfenster-Flow als MVP-Variante implementieren
   - [ ] Zeitfenster-Fragen + Ergebnisdarstellung mit vorhandener A-Result-Architektur
   - [ ] DoD B: spielbarer kompletter Durchlauf mit konsistenten Metriken

3. **Spiel C anschliessend**
   - [ ] Basis-Kompatibilitaetsflow fuer zwei Personen aufsetzen (ohne komplexe Synastrie zuerst)
   - [ ] Consent/Datenschutz-Flow fuer zweite Person sauber integrieren
   - [ ] DoD C: lauffaehiger Minimal-Flow mit robusten Edge-Case-Checks
