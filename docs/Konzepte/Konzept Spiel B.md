# Spiel B - Rueckblick (Prognose/Zeit)
## Konzept fuer die MVP-Variante

*Tesserakt - Zweites Spiel*  
*Stand: Oktober 2026, MVP umgesetzt (Backend /rueckblick, Frontend SpielB.jsx)*

---

## 1. Zielbild

Spiel B prueft die "Prognosen der Vergangenheit": Was haetten die Systeme fuer den letzten Monat
und das letzte Quartal vorhergesagt - und hat die Person es so erlebt?

> Wir machen keine Prognosen fuer die Zukunft, sondern ueberpruefen die Prognosen der Vergangenheit.

Unterschied zu Spiel A: A fragt nach der (stabilen) Persoenlichkeit, B nach **Veraenderungen in einem
Zeitraum**.

**Status:** Phase 2, Entwurf  
**Abhaengigkeiten:** Fragenkatalog B, Backend (Zeitfenster-Vektoren), Rating

---

## 2. Systeme in Spiel B (entschieden)

Nur Systeme, deren Aussagen sich innerhalb von 30-100 Tagen tatsaechlich aendern:

| System | Veraenderung ueber 100 Tage* | in Spiel B |
|---|---|---|
| Bazi (laufender Monat/Jahr, Glueckssaeule) | 0.60 | ja |
| Westlich (Transite) | 0.47 | ja |
| Hellenistisch (Jahresprofektion, Transite) | 0.42 | ja |
| Numerologie (persoenlicher Monat/Jahr) | 0.32 | ja |
| Arabisch (Firdaria) | 0.03 | nein |
| Vedisch (Dasha) | 0.04 | nein |
| Kabbalah (rein natal) | 0 | nein |

*Mittlere Aenderung je Dimension relativ zur Streuung zwischen Personen, 500 simulierte Personen
(nach Korrektur des Lebensalters, Commit fa8f7e3).

Begruendung im Spiel: "Kabbalah, Firdaria und Dasha beschreiben lange Lebensphasen, nicht einzelne Monate."

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

Bekannte Einschraenkung: Die westlichen Transite sind ein Platzhalter (nur Kalenderdatum, ohne Bezug
zum Geburtshoroskop). Das Horoskop des Zeitraums ist bei Westlich daher kaum zeitraumspezifisch;
echte Transite (laufende Planeten zu Geburtsplaneten) sind als eigene Verbesserung vorgesehen.

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
- Westlich: staerkster spannungsreicher und staerkster harmonischer Transit (langsame Planeten zuerst);
  solange die Transite Platzhalter sind, fuer alle Menschen gleich
- je System: guenstigster und schwierigster Lebensbereich des heutigen Horoskops

Status: umgesetzt (Entwurf v1, redaktionelle Ueberarbeitung offen).
