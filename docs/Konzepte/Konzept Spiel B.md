# Spiel B - Rückblick (Prognose/Zeit)
## Konzept für die MVP-Variante

*Tesserakt - Zweites Spiel*  
*Stand: Oktober 2026, MVP umgesetzt (Backend /rueckblick, Frontend SpielB.jsx)*

---

## 1. Zielbild

Spiel B prüft die "Prognosen der Vergangenheit": Hätte ein Horoskop gestimmt, das man sich vor einem
Monat bzw. vor drei Monaten für diesen Zeitraum hätte erstellen lassen? Das gilt auch dann, wenn es dem
heutigen Horoskop sehr ähnlich ist.

> Wir machen keine Prognosen für die Zukunft, sondern überprüfen die Prognosen der Vergangenheit.

Unterschied zu Spiel A: A fragt nach der (stabilen) Persönlichkeit, B nach dem **Erleben in einem
Zeitraum** ("Hattest du in den letzten 30 Tagen eher Glück in der Liebe?"). Gefragt wird nicht, ob
sich etwas gegenüber heute verändert hat.

**Status:** Phase 2, Entwurf  
**Abhängigkeiten:** Fragenkatalog B, Backend (Zeitfenster-Vektoren), Rating

---

## 2. Systeme in Spiel B (entschieden)

**Alle sieben Systeme.** Jedes System macht eine Aussage für den vergangenen Zeitraum - manche für den
einzelnen Monat (Transite, persönlicher Monat, Monatssäule, Profektion), andere für lange Lebensphasen
(Firdaria, Dasha, Kabbalah). Ob diese Aussage gestimmt hat, ist in beiden Fällen eine berechtigte Frage.

Wie stark sich das Horoskop eines Systems innerhalb von 100 Tagen ändert (relativ zur Streuung
zwischen Personen, 500 simulierte Personen, Stand nach den Korrekturen Okt. 2026):

| System | Änderung | über 100 Tage geändert bei |
|---|---|---|
| Hellenistisch (Profektion, Transite) | 0.38 | 88 % |
| Numerologie (persönlicher Monat/Jahr) | 0.32 | 100 % |
| Bazi (Sonnenmonat, Glückssäule) | 0.25 | 100 % |
| Westlich (echte Transite) | 0.21 | 90 % |
| Arabisch (Firdaria, Unter-Firdaria) | 0.11 | 19 % |
| Vedisch (Mahadasha) | 0.04 | 2 % |
| Kabbalah (natal) | 0 | 0 % |

Systeme mit langen Phasen haben im Zeitraum meist keinen Ausschlag und stellen daher keine
auffälligen Fragen; gewertet werden sie wie alle anderen.

Historie: Ein früherer Entwurf schloss Kabbalah, Arabisch und Vedisch aus, weil er Spiel B als Frage
nach Veränderungen verstand. Das war ein Missverständnis und ist korrigiert.

---

## 3. Ablauf (MVP, umgesetzt)

1. Geburtsdaten (wie A), Spiel "Zeitenhoroskope und Prognose".
2. Zeitfenster: **letzter Monat** (30 Tage) und **letzte drei Monate** (90 Tage).
3. 16 gewertete Fragen (8 Lebensbereiche x 2 Fenster) plus je System eine auffällige Frage, gemischt.
   Skala: trifft nicht zu (-1) ... trifft zu (+1). Katalog: `backend/fragen_rueckblick.json`
   (ids 101-116 gewertet, 201-216 auffällig).
4. Bei einer auffälligen Frage mit Zustimmung: Nachfrage "Weißt du noch ungefähr, wann das war?"
   (vor etwa 1 Woche / 2 Wochen / 1 Monat / 2 Monaten / 3 Monaten / weiß nicht mehr, oder Datum).
5. Ergebnis nach Skill, **getrennt für Monat und Quartal**; darunter die auffälligen Momente mit
   Antwort und erinnertem Zeitpunkt (ungewertet).
6. Belohnung: "Dein Horoskop für heute" (neue Texte, siehe Abschnitt 8).

---

## 4. Systemwert einer Frage

Die gewerteten Fragen fragen nach dem **Zustand im Zeitraum** ("Hattest du in den letzten 30 Tagen eher
Glück in der Liebe?"). Verglichen wird das **Horoskop des Zeitraums**: Mittelwert der Horoskope an
Stichproben-Tagen (Monat: 5, 10, ... 30 Tage zurück; Quartal: 10, 20, ... 90 Tage zurück).

Die auffälligen Fragen nutzen die **Extremwertsuche**: je System der stärkste Ausschlag eines
Stichproben-Tags gegenüber dem Fenstermittel (Richtung -> positive oder negative Formulierung,
Einleitung nach dem Zeitpunkt: bis 30 Tage "In den letzten 30 Tagen").

---

## 5. Metrik

Wie Spiel A: **Skill = 2 * (Perzentil - 50)** je System und Fenster gegen 100 Kontroll-Geburtsdaten
(dieselbe Auswahl wie `/kontrolle`, gleiche Stichproben-Tage, gleicher Stichtag; `/rueckblick/kontrolle`,
ca. 1.5 s, läuft während der Fragen im Hintergrund).

Nullhypothese mit allen 7 Systemen (400 Personen, Stand nach allen Rechenkorrekturen vom 20.10.2026,
`tools/skill_metric_test.py --spiel b`): Skill je System, Fenster und Antwortstil im Mittel um 0
(SE ~3, größte Abweichung -7.3 bei 56 Werten), jedes System gewinnt 10-19 % (fair: 14 %), Sieger im
Mittel +73 bis +76 (Theorie für 7 Systeme: `100*(k-1)/(k+1)` = +75).

Transite (seit Oktober 2026 echt): laufende Planeten Sonne bis Pluto (ohne laufenden Mond) im Aspekt
zu Geburtssonne und -mond, mit Geburtsort auch Aszendent und MC; Orbis 2 Grad, Stärke wächst linear
zum exakten Aspekt (`compute_transits` in `rule_engine.py`). Damit ist die zeitliche Änderung bei
Westlich und Hellenistisch zu 100 % personenspezifisch (vorher Westlich 7-11 %). Nullhypothese nach der
Umstellung erneut geprüft (A: 2000, B: 400 Personen): weiterhin im Mittel um 0.

---

## 6. Achtung: Fragenauswahl darf nicht vom echten Horoskop abhängen

Das ursprüngliche Konzept sah vor, die Fragen **nach der Stärke der vorhergesagten Ereignisse** auszuwählen
("Wenn eine Astrologie Glück in der Liebe besonders herausstreicht, wird danach gefragt").

Mit der Kontrollgruppen-Metrik ist das ein Problem: Werden die Fragen dort gestellt, wo das **echte**
Horoskop besonders starke Ausschläge hat, unterscheidet sich das echte Geburtsdatum schon durch die
Auswahl systematisch von den Kontroll-Geburtsdaten. Der Skill ist dann auch ohne jede Aussagekraft
nicht mehr im Mittel 0, und die Richtung hängt vom Antwortverhalten ab.

Simulation (1500 Personen, Westlich, Antworten ohne Bezug zum Geburtsdatum, Mittel ± SE):

| Antwortstil | alle 16 Fragen | 8 Fragen mit stärkstem Ausschlag des echten Horoskops |
|---|---|---|
| zufällig | -0.6 ± 1.5 | **-11.6 ± 1.6** |
| zurückhaltend | -0.1 ± 1.5 | **-25.5 ± 1.5** |
| positiv | +0.8 ± 1.5 | **+9.0 ± 1.7** |

Mögliche Lösungen:

1. **Fester Fragensatz** (empfohlen für das MVP): alle 8 Lebensbereiche x 2 Zeitfenster = 16 Fragen,
   Reihenfolge zufällig. Fair und einfach.
2. **Auswahl ohne Bezug zum Horoskop**, z. B. zufällig aus einem größeren Katalog.
3. **Auswahl nach Ausschlägen, aber ohne Wertung dieser Fragen** - nur zur Unterhaltung, getrennt vom Skill.

Variante 3 erhält den ursprünglichen Gedanken ("das System hat hier etwas Auffälliges gesehen")
als Spielelement, ohne die Messung zu verfälschen. Vor der Umsetzung mit `tools/skill_metric_test.py`
(Nullhypothese) prüfen.

---

## 6b. Zeitpunkt-Fragen und Skill "Timing"

Vier feste Ereignisfragen für alle Spieler (Katalog `rueckblick_v2`, ids 301-304), jeweils für die
letzten drei Monate: schöner Moment in der Liebe, beruflicher Erfolg (positiv), krank/erschoepft,
finanzieller Rückschlag (negativ). Antwort: Ja (mit Zeitpunkt), Nein, Weiß nicht.

- Jedes System hat für Lebensbereich und Richtung einen **Höhepunkt** im Quartal (Raster alle 5 Tage).
  Erreicht das Horoskop den Extremwert über mehrere aufeinanderfolgende Tage, zählt die Mitte des
  längsten solchen Plateaus; schwankt es im Quartal gar nicht, gilt die Mitte des Quartals.
- **Timing-Skill** = 2 * (Perzentil - 50); Perzentil: Anteil der Kontroll-Geburtsdaten, deren Höhepunkte
  weiter vom erinnerten Datum entfernt liegen (Summe der Abstände über die Ja-Antworten).
- Weil die Fragen nicht vom Horoskop abhängen, ist das fair und geht in die Wertung ein.
- Systeme ohne Zeitaussage für die beantworteten Fragen (meist Kabbalah, Arabisch, Vedisch) stehen nicht
  im Timing-Ranking; ihr Skill wird trotzdem gespeichert. Die Siegererwartung wird nur aus den
  konkurrierenden Systemen berechnet.

Nullhypothese (400 Personen, je Frage 50 % "Ja", drei Erinnerungsstile): Mittel je System um 0
(größte Abweichung +7.5 bei SE 2.8). Westlich, Numerologie, Hellenistisch: SD ~57 (echte, persönliche
Zeitpunkte); Arabisch 34; Bazi, Vedisch ~13 (Höhepunkt meist wie bei den Kontrolldaten); Kabbalah 0.

Auffällige Momente: Zeitpunkt tagesgenau per Feinsuche um den Rasterpunkt. Sehen mehrere Systeme
denselben Moment (gleicher Lebensbereich und Richtung), wird die Frage einmal gestellt und allen
zugeordnet.

---

## 7. Entscheidungen (Oktober 2026)

1. Fragensatz: fester gewerteter Satz **plus** auffällige Fragen ohne Wertung (Variante 3).
2. Ergebnis getrennt für Monat und Quartal.
3. Skala: "trifft nicht zu ... trifft zu".
4. Belohnung "Horoskop für heute": neue Texte.
5. Gewertete Fragen: Mittel des Zeitraums; auffällige Fragen: Extremwertsuche; dazu Zeitpunkt-Nachfrage.
6. Zusätzlich 4 feste Zeitpunkt-Fragen mit eigenem Skill "Timing" (Weg 1: Monat und Quartal bleiben getrennt).

---

## 8. Horoskop für heute (Belohnung)

Neue Texte (Quelle `docs/Textbausteine/heute/heute_v1.md`, erzeugt mit `tools/md_to_heute.py`,
Endpunkt `POST /horoscope/heute`), zusammengesetzt aus der heutigen Konstellation:

- Numerologie: persönlicher Monat (1-9, 11, 22, 33)
- Hellenistisch: Profektionshaus (1-12) und Jahresherrscher
- Bazi: Element des laufenden Monats im Verhältnis zum Tagesmeister (gleich, nährt, erschöpft,
  kontrolliert, beherrscht)
- Westlich: stärkster spannungsreicher und stärkster harmonischer Transit zu einem Geburtspunkt
  ("Saturn im Quadrat zu deiner Geburtssonne"); ohne engen Transit ein eigener Text
- je System: günstigster und schwierigster Lebensbereich des heutigen Horoskops

Status: umgesetzt (Entwurf v1, redaktionelle Überarbeitung offen).
