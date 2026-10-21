# Berechnungsgrundlagen – Numerologie

*Beipackzettel zu Tesserakt. Stand: 20. Oktober 2026. Allgemeines: `00_allgemein.md`.*

## Was wir berechnen

- **Lebenszahl:** Tag, Monat und Jahr werden **getrennt** auf eine Ziffer reduziert, dann addiert und
  erneut reduziert. Meisterzahlen 11, 22, 33 bleiben erhalten.
- **Namenszahlen** (nur mit angegebenem Geburtsnamen, freiwillig): pythagoreische Zuordnung A=1 … I=9,
  J=1 … ; Seelendrang (Vokale, Y zählt als Vokal), Ausdruckszahl (alle Buchstaben), Persönlichkeitszahl
  (Konsonanten). Die Numerologie ist das einzige System, das einen Namen verwendet.
- **Datenschutz:** Der Name wird nur für die Berechnung übermittelt und **nicht gespeichert**. Gespeichert
  werden die drei daraus abgeleiteten Zahlen (je 1–9 bzw. 11/22/33); ein Rückschluss auf den Namen ist
  daraus praktisch nicht möglich.
- **Persönliches Jahr:** Geburtsmonat + Geburtstag + laufendes Jahr (jeweils reduziert).
- **Persönlicher Monat:** persönliches Jahr + Kalendermonat.
- **Pinnacles:** vier Lebensabschnitte; der erste endet mit 36 minus Lebenszahl.

## Korrigierte Fehler

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Das Lebensalter für die Pinnacles war die Differenz der Jahreszahlen (siehe `00_allgemein.md`). | Vollendete Jahre (Commit `fa8f7e3`). |

## Bekannte Vereinfachungen

- Das persönliche Jahr wechselt bei uns am **1. Januar**. Manche Schulen lassen es am Geburtstag
  wechseln – beide Konventionen sind verbreitet.
- Umlaute werden auf den Grundbuchstaben reduziert (Ü → U), ß wird zu SS. „Müller“ und „Mueller“
  ergeben daher verschiedene Zahlen (Seelendrang 8 bzw. 4). Schulen handhaben das unterschiedlich.
- Namensvarianten (Rufname, Ehename) werden nicht unterschieden; es zählt der eingegebene Name.
- Keine Karmazahlen, Lektionen oder Herausforderungen im Spiel.

## Jahreshoroskop (Ausblick auf 12 Monate)

`backend/ausblick.py`, Endpunkt `POST /horoscope/ausblick`:

- **Persönliches Jahr** bis zum Jahreswechsel und ab dem 1. Jänner, mit Profil aus
  `persoenliches_jahr_profile`.
- **Persönlicher Monat** für den laufenden und die elf folgenden Monate, gedeutet mit dem Feld der Matrix
  persönliches Jahr × persönlicher Monat (`persoenlicher_monat_matrix_81`). Die Matrix kennt nur 1–9;
  Meisterzahlen lesen wir dort als ihre Grundziffer (11 → 2, 22 → 4, 33 → 6), die angezeigte Zahl bleibt
  die Meisterzahl.
- **Pinnacle:** beginnt am nächsten Geburtstag ein neuer Abschnitt, mit Profil aus `pinnacle_profile`.

## Partnerschaft (Ergebnis von Spiel C)

`backend/paar.py`, Endpunkt `POST /horoscope/paar`. Kompatibilitätsmatrix der Lebenszahlen (`lebenspfad_kompatibilitaet`, nach Cheiro und Balliett),
Meisterzahlen als 2, 4, 6; die Bewertung „als Lebenspartnerschaft“ ist die Spalte `partnerschaft` (1–5).
Sind beide im selben persönlichen Jahr, wird das genannt.

## Was eine erfahrene Numerologin anders macht

Sie verbindet Lebenszahl, Namenszahlen und Zyklen zu einem Gesamtbild, wählt zwischen Schulen
(pythagoreisch, chaldäisch) bewusst und berücksichtigt Namensänderungen im Lebenslauf.
