# Berechnungsgrundlagen – Westliche Astrologie

*Beipackzettel zu Tesserakt. Stand: 20. Oktober 2026. Allgemeines: `00_allgemein.md`.*

## Was wir berechnen

- **Tierkreis:** tropisch. Sonnenzeichen aus der Sonnenposition der Swiss Ephemeris.
- **Häuser:** mit Geburtsort Placidus, sonst ganze Zeichen ab einem Standard-Aszendenten (Mitteleuropa).
- **Regelebenen** (`backend/Westlich/Struktur.json`), jeweils mit Gewicht:
  - Sonnenzeichen (Pflicht, Gewicht 1.0) und Planetenherrscher
  - Planeten in Häusern
  - Aspekte zwischen den Geburtsplaneten: Konjunktion, Sextil, Quadrat, Trigon, Opposition;
    Orbis 8° (Sextil 6°)
  - Transite (siehe unten)
- **Transite:** laufende Planeten Sonne, Merkur, Venus, Mars, Jupiter, Saturn, Uranus, Neptun, Pluto
  im Aspekt zu Geburtssonne und Geburtsmond, mit Geburtsort zusätzlich zu Aszendent und MC.
  Orbis 2°; die Wirkung ist beim exakten Aspekt am stärksten und fällt bis zum Rand des Orbis auf
  null. Je laufendem Planeten zählt der engste Aspekt.
- **Quellen der Regeln:** Sepharial (1920), Raphael (1828), DeVore (1947), Ptolemäus.

## Korrigierte Fehler

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Transite wurden aus dem Kalenderdatum geschätzt („Saturn in Opposition“), ohne Bezug zum Geburtshoroskop – für alle Menschen gleich. Die zeitliche Änderung des westlichen Horoskops war nur zu 7–11 % personenspezifisch. | Echte Transite zu den Geburtspunkten; jetzt zu 100 % personenspezifisch (Commit `eaf82f4`). |

## Bekannte Vereinfachungen

- Ohne Geburtsort keine Zeitzonen-Umrechnung und Standard-Aszendent (siehe `00_allgemein.md`) – betrifft
  Aszendent, MC und Häuser.
- Transite nur zu Sonne, Mond (und Aszendent/MC), nicht zu allen Geburtsplaneten; kein laufender Mond.
- Kein Halbquadrat, Quinkunx oder andere Nebenaspekte, obwohl die Regeldatei einzelne enthält.
- Keine Progressionen, Direktionen, Solar- oder Lunarhoroskope.
- Die Deutung der Transite unterscheidet nicht, **welchen** Geburtspunkt ein Planet trifft – die
  Regeln sind nach laufendem Planet und Aspekt geordnet.

## Partnerschaft (Ergebnis von Spiel C)

`backend/paar.py`, Endpunkt `POST /horoscope/paar`. Synastrie: Aspekte zwischen Sonne, Mond, Venus, Mars und (mit Geburtsort) Aszendent der einen Person und
denselben Punkten der anderen. Orbis 6° mit Sonne oder Mond, sonst 5°. Gewichtet nach Enge und Paar
(Sonne–Mond und Venus–Mars dreifach, gleiche Punkte und Aszendent–Licht doppelt); die vier stärksten
werden genannt. Keine Häuserüberlagerung, kein Composit, kein Davison.

## Was eine erfahrene Astrologin anders macht

Sie würde Transite nach dem getroffenen Geburtsplaneten, dem Haus und der Stellung des laufenden
Planeten unterscheiden, Progressionen und Solarhoroskop einbeziehen und Orben nach Planet und
Situation wählen. Unsere Transitdeutung ist dagegen eine Zusammenfassung pro Planet und Aspekt.
