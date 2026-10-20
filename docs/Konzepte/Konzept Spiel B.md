# Spiel B - Rueckblick (Prognose/Zeit)
## Konzept fuer die MVP-Variante

*Tesserakt - Zweites Spiel*  
*Stand: Oktober 2026, Entwurf*

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

## 3. Ablauf (MVP)

1. Geburtsdaten (wie A).
2. Zeitfenster: **letzter Monat** (heute - 30 Tage bis heute) und **letztes Quartal** (heute - 100 Tage bis heute).
3. Fragen zu Veraenderungen je Lebensbereich und Zeitfenster, z. B.
   "Hat sich im letzten Monat in deiner Beziehung etwas zum Besseren veraendert?" (-1 .. +1).
4. Ergebnis nach Skill (wie A), getrennt oder gemeinsam fuer beide Zeitfenster.
5. Belohnung: das Horoskop fuer heute.

---

## 4. Systemwert einer Frage

Eine Frage "Hat sich X im Zeitraum veraendert?" wird mit der **Aenderung** des Systemvektors verglichen:

```text
systemwert(dimension, fenster) = vektor(heute)[dimension] - vektor(heute - fenster)[dimension]
```

Die Aenderungen sind klein (typisch 0.03-0.08 auf der Skala -1..+1). Fuer die Skill-Metrik ist das
unkritisch, weil sie nur vergleicht, ob das echte Geburtsdatum besser passt als die Kontroll-Geburtsdaten
(die Skala faellt heraus). Fuer Anzeige und Texte muss die Aenderung aber normiert werden.

---

## 5. Metrik

Wie Spiel A: **Skill = 2 * (Perzentil - 50)** gegen 100 zufaellige Kontroll-Geburtsdaten je System,
mit denselben Zeitfenstern und demselben Stichtag. Kein neues Verfahren noetig, nur die Aenderungs-
statt der Zustandswerte.

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

## 7. Offene Entscheidungen

1. Fragensatz: fester Satz (Variante 1) oder zusaetzlich "auffaellige" Fragen ohne Wertung (Variante 3)?
2. Ein gemeinsames Ergebnis fuer beide Zeitfenster oder getrennt (Monat / Quartal)?
3. Formulierung der Antwortskala: "deutlich schlechter ... deutlich besser" oder "trifft nicht zu ... trifft zu"?
4. Belohnung "Horoskop fuer heute": Texte vorhanden oder neu zu schreiben?

**Status:** offen  
**Abhaengigkeiten:** Product, Content, Research
