# ToDo

## MVP (erledigt)

- [x] Backend aufsetzen: FastAPI, `/vektor`-Endpunkt, Rule Engine aus `horoskop_assessment.py` extrahieren, Systeme als Unterordner laden
- [x] KO-Kontrollgruppe umsetzen: serverseitig, reproduzierbar per Seed (inzwischen ersetzt durch Kontrollgruppe je System)
- [x] React-Grundgeruest erstellen: Hooks und Komponenten-Schnittstellen definieren (ohne visuelles Design)
- [x] Frageschleife bauen: Geburtsdatum -> Vektoren -> 16 Fragen -> Rating
- [x] Ergebnis-Seite bauen: Ranking + Temperament
- [x] Vergleichsgruppe integrieren: `/vergleich`-Endpunkt + `VergleichsGruppeViz`
- [x] DB-Anbindung umsetzen: `/session`-Endpunkt + PostgreSQL
- [x] Materialized View + `pg_cron` einrichten: naechtlicher Refresh

## Prototyp (bereits umgesetzt)

- [x] Runtime-Texte nach `/content/horoscope/de`, Systemtexte als JSON, Backend `/horoscope/texts`
- [x] Ergebnisseite: Deutungs-Tabs je System (nur gewaehlte Systeme), Platzhalter Wissenschaftslink
- [x] KO in der UI ausblenden (nur intern fuer Delta-Metriken), Spiel-neu-starten-Button
- [x] Neue Kernmetrik Skill = 2 * (Perzentil - 50) mit Kontrollgruppe je System (`/kontrolle`), alte KO/Baseline entfernt
- [x] Fragen und Gewichte aus einer Quelle (`backend/fragen.json`, `/fragen`)

## Naechste Reihenfolge (formaler Prototyp)

1. **Spiel A fertigstellen (zuerst)**
   - [x] Selbsteinschaetzung-Slider: Initialwert von 3 auf 1 stellen (Durchklicken ohne Anpassung liefert dann schlechteren Skill bei neutralen Vektoren; echte Uebereinstimmung 5/5 oder 1/1 bleibt hoher Skill).
   - [x] Ergebnisseite erweitern: Horoskop-Diagramme (alle 7 Systeme in den Deutungs-Tabs; E2E geprueft 20.10.2026)
   - [x] Ausformulierte Horoskoptexte je System integrieren (Tabs + system_texts_v1.json)
   - [x] Erklaertexte einbauen: Skill, Methodik, Experiment (Entwuerfe v1; Quelle `docs/Textbausteine/erklaerungen/*.md`, im Spiel als Bereich "Hintergrund" auf der Ergebnisseite)
   - [ ] Erklaertexte redaktionell ueberarbeiten
   - [ ] DoD A: End-to-End stabil (Eingabe -> Fragen -> Ergebnis inkl. Visuals/Texte/Erklaerung)

2. **Spiel B danach (schlanke Version)**
   - [x] Zeitfenster-Flow als MVP-Variante implementieren (`/rueckblick`, `SpielB.jsx`; Konzept `docs/Konzepte/Konzept Spiel B.md`)
   - [x] Zeitfenster-Fragen + Ergebnisdarstellung (Skill getrennt fuer Monat/Quartal, auffaellige Momente mit Zeitpunkt-Nachfrage)
   - [x] Horoskop fuer heute als Belohnung (Textbausteine v1)
   - [x] DoD B: spielbarer kompletter Durchlauf mit konsistenten Metriken (E2E 20.10.2026, Nullhypothese geprueft)
   - [x] Echte Transite (laufende Planeten zu Geburtssonne/-mond, ggf. Aszendent/MC) statt Kalender-Platzhalter
   - [ ] Zeitpunkt-Fragen (feste Ereignisfragen, Skill "Timing" gegen Hoehepunkte der Kontrollgruppe) + Feinsuche der auffaelligen Momente
   - [ ] Texte Spiel B (Fragen, Horoskop fuer heute) redaktionell ueberarbeiten

3. **Spiel C anschliessend**
   - [ ] Basis-Kompatibilitaetsflow fuer zwei Personen aufsetzen (ohne komplexe Synastrie zuerst)
   - [ ] Spiel-C-Rating auf Skill mit Kontrollgruppe umstellen (`partnerRating.js` nutzt noch alte Baseline)
   - [ ] Consent/Datenschutz-Flow fuer zweite Person sauber integrieren
   - [ ] DoD C: lauffaehiger Minimal-Flow mit robusten Edge-Case-Checks

## Ideen / Backlog

- [ ] **Wertungsverhalten (Varianz) ermitteln und Feedback:** Varianz der Selbsteinschaetzungen pro Person berechnen; bei niedriger Varianz (viele neutrale Bewertungen rund um 3) auf der Ergebnisseite Hinweis geben, dass hohe Skill-Werte in solchen Faellen weniger aussagekraeftig sein koennten – gerade unentschlossene Nutzer koennten sonst in „neutralen“ Konstellationen leicht hohe Skill-Werte erzielen und das als Bestaetigung lesen.
