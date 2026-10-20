# Berechnungsgrundlagen – Bazi (Vier Säulen)

*Beipackzettel zu Tesserakt. Stand: 20. Oktober 2026. Allgemeines: `00_allgemein.md`.*

## Was wir berechnen

- **Jahressäule:** Das Jahr beginnt mit **Lichun** (Sonnenlänge 315°, um den 4. Februar), nicht am
  1. Januar und nicht am chinesischen Neujahr (Mondkalender).
- **Monatssäule:** Sonnenmonate; jeder Monat beginnt bei weiteren 30° Sonnenlänge (Tiger-Monat yin ab
  315°). Der Monatsstamm folgt der Regel der **Fünf Tiger** (aus dem Jahresstamm).
- **Tagessäule:** fortlaufender 60er-Zyklus. Geprüft an Referenztagen: 01.10.1949 jia-zi,
  01.01.2000 wu-wu, 10.02.2024 jia-chen.
- **Stundensäule:** Doppelstunden (23–1 Uhr = zi), Stamm nach der Regel der **Fünf Ratten** (aus dem
  Tagesstamm).
- **Tagesmeister** und Elementverteilung aus den acht Zeichen.
- **Glückssäule (Da Yun):** ab der Monatssäule vorwärts oder rückwärts, je nach Yin/Yang des
  Jahresstamms und Geschlecht. Ohne Angabe des Geschlechts: Mittel beider Richtungen.
- **Laufende Einflüsse:** Jahres- und Monatssäule des Stichtags, Interaktionen (Zusammenstöße,
  Kombinationen) mit den Geburtssäulen.
- **Quellen der Regeln:** u. a. Joey Yap, *Bazi – The Destiny Code*, als Systematik.

## Korrigierte Fehler

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Jahressäule wechselte am **1. Januar**: Wer im Januar oder Anfang Februar geboren ist, bekam das falsche Jahr (z. B. 20.01.1990 als Pferd statt Schlange). | Jahreswechsel bei Lichun (Commit `4d114dc`). |
| 20.10.2026 | Monatssäule nach **Kalendermonat** und dabei um einen Monat verschoben (Januar galt als Tiger-Monat). Betraf praktisch alle Spieler, auch den laufenden Monat. | Sonnenmonate nach Sonnenlänge (Commit `4d114dc`). |
| 20.10.2026 | **Tageszweig um zwei Stellen verschoben.** Als Bezugstag diente der 05.02.1924 – der Beginn des jia-zi-*Jahres*, aber kein jia-zi-*Tag* (es ist ein jia-yin-Tag). Der Tagesstamm war richtig. | Bezugstag korrigiert, gegen drei Referenztage geprüft. |

## Bekannte Vereinfachungen

- **Keine wahre Sonnenzeit:** Die Stundensäule nutzt die eingegebene Uhrzeit, ohne Korrektur auf die
  wahre Ortszeit (Längengrad, Zeitgleichung, Sommerzeit).
- **Tagesgrenze um Mitternacht:** Viele Schulen beginnen den Tag mit der Ratten-Stunde um 23 Uhr;
  Geburten zwischen 23 und 24 Uhr erhalten bei uns noch den alten Tag.
- **Beginn der Glückssäulen vereinfacht:** Wir wechseln alle zehn Lebensjahre ab Geburt. Klassisch
  wird das Startalter aus dem Abstand der Geburt zum nächsten bzw. vorigen Sonnenmonatswechsel
  berechnet (drei Tage = ein Jahr).
- Für die Geburt gilt die Sonnenlänge zur eingegebenen Uhrzeit (ohne Zeitzonen-Umrechnung), für den
  Stichtag 12 Uhr. Geburten wenige Stunden um einen Monatswechsel können deshalb im falschen Monat landen.
- Keine verborgenen Stämme, keine Zehn Götter im Detail, keine Shen Sha im Spiel.

## Was ein erfahrener Bazi-Meister anders macht

Er beurteilt die Stärke des Tagesmeisters im Zusammenhang, bestimmt nützliche und schädliche Elemente,
liest verborgene Stämme und die Zehn Götter, rechnet mit wahrer Sonnenzeit und exaktem Glückssäulen-
Beginn. Unsere Übersetzung erfasst davon nur die Grundzüge.
