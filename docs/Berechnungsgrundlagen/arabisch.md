# Berechnungsgrundlagen – Arabische Astrologie

*Beipackzettel zu Tesserakt. Stand: 20. Oktober 2026. Allgemeines: `00_allgemein.md`.*

## Was wir berechnen

- **Firdaria:** 75-jähriger Zyklus der Planetenperioden. Tag-Geburten beginnen mit der Sonne
  (Sonne 10, Venus 8, Merkur 13, Mond 9, Saturn 11, Jupiter 12, Mars 7, Nordknoten 3, Südknoten 2
  Jahre), Nacht-Geburten mit dem Mond (Mond, Saturn, Jupiter, Mars, Sonne, Venus, Merkur, Knoten).
  Das Alter wird mit Nachkommastellen gerechnet.
- **Unter-Firdaria:** jede Planetenperiode in sieben gleiche Teile, beginnend mit dem Hauptherrscher in
  der Reihenfolge der sieben Planeten (Al-Biruni). Die Knotenperioden haben keine Unterperioden.
- **Lose:** Los des Glücks (Tag: Aszendent + Mond − Sonne, Nacht umgekehrt) und Los des Geistes
  (umgekehrt zum Los des Glücks); Haus in ganzen Zeichen ab dem Aszendenten.
- **Quellen der Regeln:** Abu Ma'shar, Al-Biruni, Al-Qabisi, Sahl ibn Bishr, Bonatti.

## Korrigierte Fehler

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Lebensalter als Differenz der Jahreszahlen (siehe `00_allgemein.md`). | Exaktes Alter (Commit `fa8f7e3`). |
| 20.10.2026 | Die Firdaria verwendete für **alle** die Tag-Reihenfolge. Nacht-Geborene bekamen die falsche Periode – während das Diagramm bereits richtig rechnete. | Reihenfolge nach Tag- oder Nachtgeburt (Commit `c682a2e`). |
| 20.10.2026 | Zwei Regeldateien hatten denselben Schlüssel (`system_uebersicht`); beim Laden überschrieb die Lose-Datei die Firdaria-Reihenfolge. | Reihenfolgen in `Struktur.json` (Commit `c682a2e`). |
| 20.10.2026 | Die Unter-Firdaria lag in den Regeldaten vor, wurde aber nicht verwendet. | Als eigene Regelebene ergänzt (Commit `c682a2e`). |
| 21.10.2026 | Tag oder Nacht für die Firdaria nach Uhrzeit (6–18 Uhr), für die Lose nach Sonne in ganzen Zeichen. | Beides einheitlich nach dem Sonnenstand über dem Horizont (siehe `00_allgemein.md`). |

## Bekannte Vereinfachungen

- Die Unter-Firdaria-Deutungen liegen nur für Tag-Horoskope vor; für Nacht-Geburten verwenden wir
  dieselben Kombinationen von Haupt- und Unterherrscher.
- Die Stellung der Knotenperioden im Zyklus folgt einer der überlieferten Varianten (Knoten am Ende);
  es gibt andere.
- Keine Almuten-, Direktions- oder Jahreshoroskop-Rechnung im Spiel, obwohl Regeln dazu vorliegen.
- Die Lose hängen am Aszendenten und sind ohne Geburtsort entsprechend ungenau.

## Jahreshoroskop (Ausblick auf 12 Monate)

`backend/ausblick.py`, Endpunkt `POST /horoscope/ausblick`: für jeden Tag der nächsten 365 Tage Haupt-
Firdaria und Unterperiode (Hauptdauer ÷ 7, beginnend mit dem Hauptherrscher im Zyklus der sieben
Planeten, wie in der Wertung). Jede Unterperiode im Jahr steht mit ihrer Deutung aus der
Qualitätsmatrix da (Abu Ma'shar, Al-Biruni, Sahl); beginnt eine neue Haupt-Firdaria, als eigenes
Ereignis. Die Knoten-Perioden haben bei uns keine Unterperioden (siehe oben).

## Partnerschaft (Ergebnis von Spiel C)

`backend/paar.py`, Endpunkt `POST /horoscope/paar`. Freundschaft der laufenden Haupt-Firdaria-Herrscher beider Personen (Tabelle der Inder, wie sie
Al-Biruni im Book of Instruction §447 wiedergibt, in `arabisch_firdaria.json`; geprüft am Scan der
Übersetzung von Wright 1934). Die Freundschaft ist einseitig: Jeder Planet hat seine eigene Sicht (die Sonne
ist Merkur gegenüber gleichgültig, Merkur sieht in ihr eine Freundin). Ist sie nicht gegenseitig, gilt sie
als gemischt. Al-Biruni bringt daneben eine abweichende Tabelle des Abu 'l-Qasim und merkt an, die
Astrologen seiner Zeit legten auf diese Freundschaften wenig Gewicht. Dazu das Los
des Glücks jeder Person, wenn es in das Zeichen von Sonne, Mond oder Aszendent des anderen fällt (nur
mit Geburtsort). Das Los der Ehe fehlt, weil es das Geschlecht braucht.

## Was ein erfahrener Astrologe der arabischen Tradition anders macht

Er beurteilt die Firdaria-Herrscher nach ihrer Stellung und Würde im Geburtshoroskop, verbindet sie mit
Jahreshoroskop und Profektion und nutzt viele weitere Lose. Unsere Rechnung nimmt nur die Grundperioden
und zwei Lose.
