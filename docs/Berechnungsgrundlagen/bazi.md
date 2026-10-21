# Berechnungsgrundlagen – Bazi (Vier Säulen)

*Beipackzettel zu Tesserakt. Stand: 20. Oktober 2026. Allgemeines: `00_allgemein.md`.*

## Was wir berechnen

- **Jahressäule:** Das Jahr beginnt mit **Lichun** (Sonnenlänge 315°, um den 4. Februar), nicht am
  1. Januar und nicht am chinesischen Neujahr (Mondkalender).
- **Monatssäule:** Sonnenmonate; jeder Monat beginnt bei weiteren 30° Sonnenlänge (Tiger-Monat yin ab
  315°). Der Monatsstamm folgt der Regel der **Fünf Tiger** (aus dem Jahresstamm).
- **Tagessäule:** fortlaufender 60er-Zyklus. Geprüft an Referenztagen: 01.10.1949 jia-zi,
  01.01.2000 wu-wu, 10.02.2024 jia-chen.
- **Stundensäule:** Doppelstunden (23–1 Uhr = zi) nach **wahrer Sonnenzeit** am Geburtsort (Weltzeit +
  Längengrad × 4 Minuten + Zeitgleichung), Stamm nach der Regel der **Fünf Ratten** (aus dem Tagesstamm).
  Ohne Geburtsort gilt die eingegebene Uhrzeit.
- **Tagesgrenze:** Der neue Tag beginnt mit der Ratten-Stunde um **23 Uhr** Sonnenzeit.
- **Tagesmeister** und Elementverteilung aus den acht Zeichen.
- **Glückssäule (Da Yun):** ab der Monatssäule vorwärts oder rückwärts, je nach Yin/Yang des
  Jahresstamms und Geschlecht. **Startalter** aus dem Abstand der Geburt zum nächsten (vorwärts) bzw.
  vorigen (rückwärts) Sonnenmonatswechsel: drei Tage = ein Jahr; danach Wechsel alle zehn Jahre. Vor dem
  Startalter gilt die Monatssäule. Ohne Angabe des Geschlechts: Mittel beider Richtungen.
- **Laufende Einflüsse:** Jahres- und Monatssäule des Stichtags, Interaktionen (Zusammenstöße,
  Kombinationen) mit den Geburtssäulen.
- **Quellen der Regeln:** u. a. Joey Yap, *Bazi – The Destiny Code*, als Systematik.

## Korrigierte Fehler

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Jahressäule wechselte am **1. Januar**: Wer im Januar oder Anfang Februar geboren ist, bekam das falsche Jahr (z. B. 20.01.1990 als Pferd statt Schlange). | Jahreswechsel bei Lichun (Commit `4d114dc`). |
| 20.10.2026 | Monatssäule nach **Kalendermonat** und dabei um einen Monat verschoben (Januar galt als Tiger-Monat). Betraf praktisch alle Spieler, auch den laufenden Monat. | Sonnenmonate nach Sonnenlänge (Commit `4d114dc`). |
| 21.10.2026 | Stundensäule nach Uhrzeit statt Sonnenzeit; Tageswechsel um Mitternacht; Glückssäulen alle zehn Lebensjahre ab Geburt. | Wahre Sonnenzeit, Tageswechsel um 23 Uhr, Startalter aus dem Abstand zum Sonnenmonatswechsel. Bei einer Wiener Stichprobe ändert sich der Bazi-Vektor in 78 % der Fälle (vor allem durch die Glückssäulen). |
| 20.10.2026 | **Tageszweig um zwei Stellen verschoben.** Als Bezugstag diente der 05.02.1924 – der Beginn des jia-zi-*Jahres*, aber kein jia-zi-*Tag* (es ist ein jia-yin-Tag). Der Tagesstamm war richtig. | Bezugstag korrigiert, gegen drei Referenztage geprüft. |

## Bekannte Vereinfachungen

- **Schulen sind sich nicht einig** – wir haben uns jeweils für die verbreitetste Konvention entschieden:
  - *Sonnenzeit oder Uhrzeit:* Manche rechnen mit der Uhrzeit; wir mit wahrer Sonnenzeit (nur mit
    Geburtsort möglich).
  - *Tagesgrenze:* Manche lassen den Tag um Mitternacht wechseln und rechnen 23–24 Uhr als „späte
    Ratte“ des alten Tages; wir wechseln um 23 Uhr.
  - *Startalter:* Manche runden auf ganze Jahre oder rechnen mit Monaten; wir rechnen mit Bruchteilen.
- Der Glückssäulen-Wechsel ist ein fester Zeitpunkt; einen Übergangszeitraum zwischen zwei Säulen, wie
  ihn manche Meister berücksichtigen, gibt es bei uns nicht.
- Für die Geburt gilt die Sonnenlänge zum tatsächlichen Geburtsmoment (Weltzeit, wenn ein Geburtsort
  angegeben ist), für den Stichtag 12 Uhr. Ohne Geburtsort können Geburten wenige Stunden um einen
  Monatswechsel oder um Lichun im falschen Monat bzw. Jahr landen.
- Keine verborgenen Stämme, keine Zehn Götter im Detail, keine Shen Sha im Spiel.

## Jahreshoroskop (Ausblick auf 12 Monate)

`backend/ausblick.py`, Endpunkt `POST /horoscope/ausblick`. Für jeden Tag der nächsten 365 Tage die Jahres-
und Monatssäule (Sonnenmonate wie oben):

- **Monate:** Das Element des Monatsstamms wechselt alle zwei Monate (Yang- und Yin-Stamm desselben
  Elements); jeder Block wird mit dem Tagesmeister verglichen (gleich, nährt, erschöpft, kontrolliert,
  beherrscht), wie im Horoskop für heute.
- **Jahreswechsel zu Lichun:** neues Jahr mit Element und Tier, verglichen mit dem Tagesmeister; stößt
  sein Zweig mit dem Zweig des Geburtsjahres zusammen (Chong), steht das eigens da.
- **Chong-Monate:** Monate, deren Zweig mit dem Zweig der Tagessäule zusammenstößt; Deutung aus
  `sechs_clashes`.
- **Glückssäule:** beginnt eine neue im Jahr, mit den Deutungen von Stamm und Zweig. Nur mit Angabe des
  Geschlechts, weil davon die Laufrichtung abhängt.
- Nicht berücksichtigt: Kombinationen (Liu He, San He), Harms, Punishments, Zehn Götter, Shen Sha.

## Partnerschaft (Ergebnis von Spiel C)

`backend/paar.py`, Endpunkt `POST /horoscope/paar`. Zweige der Tagessäulen (Ehepalast) und der Jahressäulen beider Personen: gleich, Sechser-Kombination
(Liu He), Zusammenstoß (Chong), Schaden (Liu Hai) oder gemeinsames Dreieck (San He), Deutungen aus
`clash_und_combination_vollstaendig`. Dazu die Elemente der Tagesmeister (gleich, nährt, wird genährt,
kontrolliert, wird kontrolliert) und Stamm-Kombinationen der Tagesstämme (Jia–Ji, Yi–Geng, Bing–Xin,
Ding–Ren, Wu–Gui). Ohne Geschlecht keine Ehepartner-Sterne (Zehn Götter).

## Was ein erfahrener Bazi-Meister anders macht

Er beurteilt die Stärke des Tagesmeisters im Zusammenhang, bestimmt nützliche und schädliche Elemente,
liest verborgene Stämme und die Zehn Götter, rechnet mit wahrer Sonnenzeit und exaktem Glückssäulen-
Beginn. Unsere Übersetzung erfasst davon nur die Grundzüge.
