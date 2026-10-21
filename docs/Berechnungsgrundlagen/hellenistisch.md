# Berechnungsgrundlagen – Hellenistische Astrologie

*Beipackzettel zu Tesserakt. Stand: 20. Oktober 2026. Allgemeines: `00_allgemein.md`.*

## Was wir berechnen

- **Geburtszeichen** (Sonne, tropisch) und Planetenherrscher.
- **Jährliche Profektion:** Mit jedem vollendeten Lebensjahr rückt das aktive Haus um eins weiter
  (Alter 0 = 1. Haus). Häuser in **ganzen Zeichen ab dem Aszendentenzeichen**.
- **Jahresherrscher:** Herrscher des profizierten Zeichens (klassische Herrscher: Sonne, Mond, Merkur,
  Venus, Mars, Jupiter, Saturn).
- **Lose:** Los des Glücks und Los des Geistes, Formeln wie in `arabisch.md`, Deutung nach dem Haus,
  in dem das Los tatsächlich steht.
- **Sekt** (Tag- oder Nachtgeburt), **Transite** wie in `westlich.md` (nur die sieben klassischen
  Planeten haben Regeln).
- **Quellen der Regeln:** Vettius Valens, Dorotheus von Sidon, Ptolemäus, Firmicus Maternus,
  Paulus Alexandrinus.

## Korrigierte Fehler

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Lebensalter als Differenz der Jahreszahlen: das Profektionsjahr wechselte am 1. Januar statt am Geburtstag. | Vollendete Jahre (Commit `fa8f7e3`). |
| 20.10.2026 | Transite waren ein Kalender-Platzhalter. | Echte Transite (Commit `eaf82f4`). |
| 20.10.2026 | Der **Jahresherrscher** wurde ab dem Widder gezählt (6. Haus = Jungfrau = Merkur für alle), nicht ab dem eigenen Aszendenten. | Profiziertes Zeichen ab dem Aszendentenzeichen. |
| 20.10.2026 | Die **Lose** wurden nicht nach ihrer Position gedeutet; als „Haus des Loses“ diente das Lebensalter modulo 12. | Haus aus der tatsächlichen Position des Loses. |
| 21.10.2026 | **Sekt** nach voller Stunde 6–18 (einschließlich 18 Uhr), abweichend von Firdaria und Losen. | Einheitlich nach dem Sonnenstand über dem Horizont (siehe `00_allgemein.md`). |

## Bekannte Vereinfachungen

- Profektion, Jahresherrscher und Lose hängen am **Aszendenten** und sind ohne Geburtsort entsprechend
  ungenau (`00_allgemein.md`).
- Keine Zodiakal-Freisetzung (Zodiacal Releasing), keine monatlichen Profektionen, keine Würden-
  bewertung der Herrscher im Spiel, obwohl Regeln dazu vorliegen.

## Was ein erfahrener Astrologe der hellenistischen Tradition anders macht

Er beurteilt den Jahresherrscher nach seiner Stellung im Geburtshoroskop und seinen Transiten, nutzt
Zodiakal-Freisetzung für Lebensphasen und unterscheidet die Planeten nach Sekt. Unsere Rechnung
übernimmt die Struktur, aber nicht diese Feinheit.
