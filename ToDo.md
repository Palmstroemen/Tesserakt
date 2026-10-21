# ToDo

## MVP (erledigt)

- [x] Backend aufsetzen: FastAPI, `/vektor`-Endpunkt, Rule Engine aus `horoskop_assessment.py` extrahieren, Systeme als Unterordner laden
- [x] KO-Kontrollgruppe umsetzen: serverseitig, reproduzierbar per Seed (inzwischen ersetzt durch Kontrollgruppe je System)
- [x] React-Grundgerüst erstellen: Hooks und Komponenten-Schnittstellen definieren (ohne visuelles Design)
- [x] Frageschleife bauen: Geburtsdatum -> Vektoren -> 16 Fragen -> Rating
- [x] Ergebnis-Seite bauen: Ranking + Temperament
- [x] Vergleichsgruppe integrieren: `/vergleich`-Endpunkt + `VergleichsGruppeViz`
- [x] DB-Anbindung umsetzen: `/session`-Endpunkt + PostgreSQL
- [x] Materialized View + `pg_cron` einrichten: nächtlicher Refresh

## Prototyp (bereits umgesetzt)

- [x] Runtime-Texte nach `/content/horoscope/de`, Systemtexte als JSON, Backend `/horoscope/texts`
- [x] Ergebnisseite: Deutungs-Tabs je System (nur gewählte Systeme), Platzhalter Wissenschaftslink
- [x] KO in der UI ausblenden (nur intern für Delta-Metriken), Spiel-neu-starten-Button
- [x] Neue Kernmetrik Skill = 2 * (Perzentil - 50) mit Kontrollgruppe je System (`/kontrolle`), alte KO/Baseline entfernt
- [x] Fragen und Gewichte aus einer Quelle (`backend/fragen.json`, `/fragen`)

## Nächste Reihenfolge (formaler Prototyp)

1. **Spiel A fertigstellen (zuerst)**
   - [x] Selbsteinschätzung-Slider: Initialwert von 3 auf 1 stellen (Durchklicken ohne Anpassung liefert dann schlechteren Skill bei neutralen Vektoren; echte Übereinstimmung 5/5 oder 1/1 bleibt hoher Skill).
   - [x] Ergebnisseite erweitern: Horoskop-Diagramme (alle 7 Systeme in den Deutungs-Tabs; E2E geprüft 20.10.2026)
   - [x] Ausformulierte Horoskoptexte je System integrieren (Tabs + system_texts_v1.json)
   - [x] Erklärtexte einbauen: Skill, Methodik, Experiment (Entwürfe v1; Quelle `docs/Textbausteine/erklaerungen/*.md`, im Spiel als Bereich "Hintergrund" auf der Ergebnisseite)
   - [ ] Erklärtexte redaktionell überarbeiten
   - [ ] DoD A: End-to-End stabil (Eingabe -> Fragen -> Ergebnis inkl. Visuals/Texte/Erklaerung)

2. **Spiel B danach (schlanke Version)**
   - [x] Zeitfenster-Flow als MVP-Variante implementieren (`/rueckblick`, `SpielB.jsx`; Konzept `docs/Konzepte/Konzept Spiel B.md`)
   - [x] Zeitfenster-Fragen + Ergebnisdarstellung (Skill getrennt für Monat/Quartal, auffällige Momente mit Zeitpunkt-Nachfrage)
   - [x] Horoskop für heute als Belohnung (Textbausteine v1)
   - [x] DoD B: spielbarer kompletter Durchlauf mit konsistenten Metriken (E2E 20.10.2026, Nullhypothese geprüft)
   - [x] Echte Transite (laufende Planeten zu Geburtssonne/-mond, ggf. Aszendent/MC) statt Kalender-Platzhalter
   - [x] Zeitpunkt-Fragen (4 feste Ereignisfragen, Skill "Timing" gegen Höhepunkte der Kontrollgruppe) + Feinsuche der auffälligen Momente
   - [ ] Texte Spiel B (Fragen, Horoskop für heute) redaktionell überarbeiten

3. **Spiel C anschließend**
   - [x] Basis-Flow für zwei Personen (eigene Komponente `SpielC.jsx`, gleiche Pipeline wie A/B)
   - [x] Spiel-C-Rating auf Skill mit Kontrollgruppe (100 zufällige Paare), Nullhypothese geprüft
   - [x] Einwilligung der Partnerperson (Pflicht-Häkchen), Ort nur grob gespeichert, kein Name
   - [x] DoD C: E2E-Durchlauf (21.10.2026) inkl. Speicherung
   - [x] Frage 413 (Veränderung) ersetzt: "Wer von euch bringt öfter Veränderungen in euer gemeinsames Leben ...?"
   - [ ] Beziehungsfragen insgesamt redaktionell prüfen
   - [ ] Später: Synastrie / systemeigene Interaktionsregeln, optionale Verknüpfung mit A-Sessions

## Rechengenauigkeit (aus den Beipackzetteln, `docs/Berechnungsgrundlagen/`)

- [x] Zeitzone und Sommerzeit umrechnen (Geburtsort -> Zeitzone, historische Regeln via zoneinfo)
- [x] Geburtsort im Spiel abfragen (Ortssuche offline, GeoNames)
- [x] Spiel C (/partner): Geburtsort und Zeitzone für beide Personen
- [x] Sekt einheitlich über den Sonnenstand bestimmen (Sekt-Regel, Firdaria, Lose, Diagramme)
- [x] Vedisch: Antardasha-Matrix vollständig (45 Kombinationen ergänzt, gekennzeichnet) und als Regelebene eingebaut
- [x] Vedisch: Gochara-Regeln (Transite vom Geburtsmond, Sade Sati) als Regelebene
- [ ] Vedisch: Vedha und Ashtakavarga für Gochara (optional)
- [ ] Vedisch: ergänzte Antardasha-Deutungen von jemandem mit Jyotish-Kenntnis gegenlesen lassen
- [x] Kabbalah: Gematria-Platzhalter aus der Wertung genommen (rechnete nichts aus dem Namen)
- [ ] Später (Neuigkeit): echte Gematria, ggf. eigenes Namens-Spiel; Umschrift-Konvention festlegen
- [x] Bazi: Glückssäulen-Beginn exakt (Abstand zum Sonnenmonatswechsel), wahre Sonnenzeit, Tagesgrenze 23 Uhr

## Quellen und Lizenzen (`docs/Berechnungsgrundlagen/quellen.md`)

- [ ] Angaben "public domain" in den Regeldateien korrigieren (neuere Übersetzungen, DeVore, Joey Yap)
- [ ] Lizenz Swiss Ephemeris (AGPL oder kommerziell) vor öffentlichem Betrieb klären

## Mehrsprachigkeit (i18n)

- [x] Sprache je Sitzung speichern: `sprache` (Sprache der Fragen, derzeit `de`) und `geraet_sprache`
  (Spracheinstellung des Geräts, z. B. `de-AT`); Spalten in `sessions`, alte Datenbanken werden nachgerüstet
- [ ] Oberflächentexte (Schatulle zuerst, dann altes Spiel) in eine Sprachdatei auslagern
- [ ] Fragenkataloge (`fragen*.json`): Text je Sprache, gleiche `id`
- [ ] Monatsnamen des Datumsrads über `Intl` statt fest (dabei `de-AT` "Jänner" vs. `de-DE` "Januar")
- [ ] Länder- und Städtenamen: `Intl.DisplayNames` mit der gewählten Sprache; Exonym-Liste nur für Deutsch
- [ ] Lesetexte (Erklärtexte, Beipackzettel, Deutungen): übersetzen und fachlich prüfen; Backend hat schon `locale`
- [ ] Rechts-nach-links-Sprachen (Arabisch, Hebräisch): Schatulle teilweise spiegeln (bewusst später)
- [ ] Reihenfolge: erst Struktur ohne neue Sprache, dann Englisch, Lesetexte zuletzt

## Auswertung: Kultur und Erwartung (Idee)

- [ ] Frage: Trifft ein System bei Menschen aus seinem Kulturkreis besser (z. B. Bazi bei Menschen aus China)?
  Mögliche Gründe wären kulturelle Erwartung oder Selbstzuschreibung: Wer die Eigenschaften seines
  Tierzeichens oder Sternzeichens kennt, beschreibt sich womöglich passend dazu (in der Literatur als
  Selbstzuschreibungs-Effekt diskutiert). Dann träfe das System, ohne dass die Sterne etwas damit zu tun haben.
- [ ] Merkmale dafür: Geburtsland (grob gespeichert), `geraet_sprache`, `sprache`. Sprache ist nur ein
  schwacher Hinweis auf Kultur; das Geburtsland ist besser
- [ ] Optionale Frage am Ende: "Kennst du dein Sternzeichen / dein chinesisches Tierzeichen / ...?" – trennt
  echte Treffer von Selbstzuschreibung (wer sein Zeichen nicht kennt, kann sich nicht danach richten)
- [ ] Vorab festlegen, welche Vergleiche gerechnet werden (sonst findet man bei vielen Untergruppen immer
  irgendwo einen Zufallstreffer)

## Ideen / Backlog

- [ ] **Premiumversion:** Horoskope direkt erstellen, ohne Fragespiel, mit einigen speicherbaren Personen
  (Familie). Bausteine vorhanden: Vektoren, Diagramme, Systemtexte, Horoskop für heute. Offen: Konto bzw.
  Speicherort der Personen (bisher bewusst ohne Accounts), Einwilligung der gespeicherten Personen.

- [ ] **Wertungsverhalten (Varianz) ermitteln und Feedback:** Varianz der Selbsteinschätzungen pro Person berechnen; bei niedriger Varianz (viele neutrale Bewertungen rund um 3) auf der Ergebnisseite Hinweis geben, dass hohe Skill-Werte in solchen Fällen weniger aussagekräftig sein könnten – gerade unentschlossene Nutzer könnten sonst in „neutralen“ Konstellationen leicht hohe Skill-Werte erzielen und das als Bestätigung lesen.

- [ ] **Regelbewertung durch Fachleute:** Astrologinnen und Astrologen (je Tradition) bewerten einzelne Regeln
  und Deutungen der Regeldateien (passt / passt nicht / umstritten, mit Quelle). Daraus eine Gewichtung je Regel
  und ein sichtbarer Stand, wo Konsens besteht und wo Schulen auseinandergehen. Wichtig fürs Experiment:
  Gewichte nur vorab festlegen, nicht nach den Spielergebnissen nachjustieren. (Idee aus dem frühen
  Prototyp `docs/regelwerk_explorer.html`, 2026-02, gelöscht 2026-10-21; Stand in der Git-Historie.)
