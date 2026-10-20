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

## Bekannte Vereinfachungen

- **Tag oder Nacht** wird für die Firdaria über die Uhrzeit bestimmt (6–18 Uhr), für die Lose über den
  Sonnenstand. Nahe Sonnenauf- und -untergang kann das widersprüchlich sein.
- Die Unter-Firdaria-Deutungen liegen nur für Tag-Horoskope vor; für Nacht-Geburten verwenden wir
  dieselben Kombinationen von Haupt- und Unterherrscher.
- Die Stellung der Knotenperioden im Zyklus folgt einer der überlieferten Varianten (Knoten am Ende);
  es gibt andere.
- Keine Almuten-, Direktions- oder Jahreshoroskop-Rechnung im Spiel, obwohl Regeln dazu vorliegen.
- Die Lose hängen am Aszendenten und sind daher von der fehlenden Zeitzonen-Umrechnung betroffen.

## Was ein erfahrener Astrologe der arabischen Tradition anders macht

Er beurteilt die Firdaria-Herrscher nach ihrer Stellung und Würde im Geburtshoroskop, verbindet sie mit
Jahreshoroskop und Profektion und nutzt viele weitere Lose. Unsere Rechnung nimmt nur die Grundperioden
und zwei Lose.
