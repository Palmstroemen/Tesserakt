# Spiel B - Rueckblick (Prognose/Zeit)
## Konzept fuer die MVP-Variante

*Tesserakt - Zweites Spiel*  
*Stand: Oktober 2026, MVP umgesetzt (Backend /rueckblick, Frontend SpielB.jsx)*

---

## 1. Zielbild

Spiel B prueft die "Prognosen der Vergangenheit": Haette ein Horoskop gestimmt, das man sich vor einem
Monat bzw. vor drei Monaten fuer diesen Zeitraum haette erstellen lassen? Das gilt auch dann, wenn es dem
heutigen Horoskop sehr aehnlich ist.

> Wir machen keine Prognosen fuer die Zukunft, sondern ueberpruefen die Prognosen der Vergangenheit.

Unterschied zu Spiel A: A fragt nach der (stabilen) Persoenlichkeit, B nach dem **Erleben in einem
Zeitraum** ("Hattest du in den letzten 30 Tagen eher Glueck in der Liebe?"). Gefragt wird nicht, ob
sich etwas gegenueber heute veraendert hat.

**Status:** Phase 2, Entwurf  
**Abhaengigkeiten:** Fragenkatalog B, Backend (Zeitfenster-Vektoren), Rating

---

## 2. Systeme in Spiel B (entschieden)

**Alle sieben Systeme.** Jedes System macht eine Aussage fuer den vergangenen Zeitraum - manche fuer den
einzelnen Monat (Transite, persoenlicher Monat, Monatssaeule, Profektion), andere fuer lange Lebensphasen
(Firdaria, Dasha, Kabbalah). Ob diese Aussage gestimmt hat, ist in beiden Faellen eine berechtigte Frage.

Wie stark sich das Horoskop eines Systems innerhalb von 100 Tagen aendert (relativ zur Streuung
zwischen Personen, 500 simulierte Personen, Stand nach den Korrekturen Okt. 2026):

| System | Aenderung | ueber 100 Tage geaendert bei |
|---|---|---|
| Hellenistisch (Profektion, Transite) | 0.38 | 88 % |
| Numerologie (persoenlicher Monat/Jahr) | 0.32 | 100 % |
| Bazi (Sonnenmonat, Glueckssaeule) | 0.25 | 100 % |
| Westlich (echte Transite) | 0.21 | 90 % |
| Arabisch (Firdaria, Unter-Firdaria) | 0.11 | 19 % |
| Vedisch (Mahadasha) | 0.04 | 2 % |
| Kabbalah (natal) | 0 | 0 % |

Systeme mit langen Phasen haben im Zeitraum meist keinen Ausschlag und stellen daher keine
auffaelligen Fragen; gewertet werden sie wie alle anderen.

Historie: Ein frueherer Entwurf schloss Kabbalah, Arabisch und Vedisch aus, weil er Spiel B als Frage
nach Veraenderungen verstand. Das war ein Missverstaendnis und ist korrigiert.

---

## 3. Ablauf (MVP, umgesetzt)

1. Geburtsdaten (wie A), Spiel "Zeitenhoroskope und Prognose".
2. Zeitfenster: **letzter Monat** (30 Tage) und **letzte drei Monate** (90 Tage).
3. 16 gewertete Fragen (8 Lebensbereiche x 2 Fenster) plus je System eine auffaellige Frage, gemischt.
   Skala: trifft nicht zu (-1) ... trifft zu (+1). Katalog: `backend/fragen_rueckblick.json`
   (ids 101-116 gewertet, 201-216 auffaellig).
4. Bei einer auffaelligen Frage mit Zustimmung: Nachfrage "Weisst du noch ungefaehr, wann das war?"
   (vor etwa 1 Woche / 2 Wochen / 1 Monat / 2 Monaten / 3 Monaten / weiss nicht mehr, oder Datum).
5. Ergebnis nach Skill, **getrennt fuer Monat und Quartal**; darunter die auffaelligen Momente mit
   Antwort und erinnertem Zeitpunkt (ungewertet).
6. Belohnung: "Dein Horoskop fuer heute" (neue Texte, siehe Abschnitt 8).

---

## 4. Systemwert einer Frage

Die gewerteten Fragen fragen nach dem **Zustand im Zeitraum** ("Hattest du in den letzten 30 Tagen eher
Glueck in der Liebe?"). Verglichen wird das **Horoskop des Zeitraums**: Mittelwert der Horoskope an
Stichproben-Tagen (Monat: 5, 10, ... 30 Tage zurueck; Quartal: 10, 20, ... 90 Tage zurueck).

Die auffaelligen Fragen nutzen die **Extremwertsuche**: je System der staerkste Ausschlag eines
Stichproben-Tags gegenueber dem Fenstermittel (Richtung -> positive oder negative Formulierung,
Einleitung nach dem Zeitpunkt: bis 30 Tage "In den letzten 30 Tagen").

---

## 5. Metrik

Wie Spiel A: **Skill = 2 * (Perzentil - 50)** je System und Fenster gegen 100 Kontroll-Geburtsdaten
(dieselbe Auswahl wie `/kontrolle`, gleiche Stichproben-Tage, gleicher Stichtag; `/rueckblick/kontrolle`,
ca. 1.5 s, laeuft waehrend der Fragen im Hintergrund).

Nullhypothese (600 Personen, `tools/skill_metric_test.py --spiel b`): Skill je System und Fenster im
Mittel zwischen -4 und +6.5 (SE ~2.4), jedes der 4 Systeme gewinnt ~25 %, Sieger im Mittel ~+60
(Theorie fuer 4 Systeme: `100*(k-1)/(k+1)` = +60).

Transite (seit Oktober 2026 echt): laufende Planeten Sonne bis Pluto (ohne laufenden Mond) im Aspekt
zu Geburtssonne und -mond, mit Geburtsort auch Aszendent und MC; Orbis 2 Grad, Staerke waechst linear
zum exakten Aspekt (`compute_transits` in `rule_engine.py`). Damit ist die zeitliche Aenderung bei
Westlich und Hellenistisch zu 100 % personenspezifisch (vorher Westlich 7-11 %). Nullhypothese nach der
Umstellung erneut geprueft (A: 2000, B: 400 Personen): weiterhin im Mittel um 0.

---

## 6. Achtung: Fragenauswahl darf nicht vom echten Horoskop abhaengen

Das urspruengliche Konzept sah vor, die Fragen **nach der Staerke der vorhergesagten Ereignisse** auszuwaehlen
("Wenn eine Astrologie Glueck in der Liebe besonders herausstreicht, wird danach gefragt").

Mit der Kontrollgruppen-Metrik ist das ein Problem: Werden die Fragen dort gestellt, wo das **echte**
Horoskop besonders starke Ausschlaege hat, unterscheidet sich das echte Geburtsdatum schon durch die
Auswahl systematisch von den Kontroll-Geburtsdaten. Der Skill ist dann auch ohne jede Aussagekraft
nicht mehr im Mittel 0, und die Richtung haengt vom Antwortverhalten ab.

Simulation (1500 Personen, Westlich, Antworten ohne Bezug zum Geburtsdatum, Mittel ± SE):

| Antwortstil | alle 16 Fragen | 8 Fragen mit staerkstem Ausschlag des echten Horoskops |
|---|---|---|
| zufaellig | -0.6 ± 1.5 | **-11.6 ± 1.6** |
| zurueckhaltend | -0.1 ± 1.5 | **-25.5 ± 1.5** |
| positiv | +0.8 ± 1.5 | **+9.0 ± 1.7** |

Moegliche Loesungen:

1. **Fester Fragensatz** (empfohlen fuer das MVP): alle 8 Lebensbereiche x 2 Zeitfenster = 16 Fragen,
   Reihenfolge zufaellig. Fair und einfach.
2. **Auswahl ohne Bezug zum Horoskop**, z. B. zufaellig aus einem groesseren Katalog.
3. **Auswahl nach Ausschlaegen, aber ohne Wertung dieser Fragen** - nur zur Unterhaltung, getrennt vom Skill.

Variante 3 erhaelt den urspruenglichen Gedanken ("das System hat hier etwas Auffaelliges gesehen")
als Spielelement, ohne die Messung zu verfaelschen. Vor der Umsetzung mit `tools/skill_metric_test.py`
(Nullhypothese) pruefen.

---

## 7. Entscheidungen (Oktober 2026)

1. Fragensatz: fester gewerteter Satz **plus** auffaellige Fragen ohne Wertung (Variante 3).
2. Ergebnis getrennt fuer Monat und Quartal.
3. Skala: "trifft nicht zu ... trifft zu".
4. Belohnung "Horoskop fuer heute": neue Texte.
5. Gewertete Fragen: Mittel des Zeitraums; auffaellige Fragen: Extremwertsuche; dazu Zeitpunkt-Nachfrage.

---

## 8. Horoskop fuer heute (Belohnung)

Neue Texte (Quelle `docs/Textbausteine/heute/heute_v1.md`, erzeugt mit `tools/md_to_heute.py`,
Endpunkt `POST /horoscope/heute`), zusammengesetzt aus der heutigen Konstellation:

- Numerologie: persoenlicher Monat (1-9, 11, 22, 33)
- Hellenistisch: Profektionshaus (1-12) und Jahresherrscher
- Bazi: Element des laufenden Monats im Verhaeltnis zum Tagesmeister (gleich, naehrt, erschoepft,
  kontrolliert, beherrscht)
- Westlich: staerkster spannungsreicher und staerkster harmonischer Transit zu einem Geburtspunkt
  ("Saturn im Quadrat zu deiner Geburtssonne"); ohne engen Transit ein eigener Text
- je System: guenstigster und schwierigster Lebensbereich des heutigen Horoskops

Status: umgesetzt (Entwurf v1, redaktionelle Ueberarbeitung offen).
