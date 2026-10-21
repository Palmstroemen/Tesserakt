# Berechnungsgrundlagen – Allgemeines

*Beipackzettel zu Tesserakt. Stand: 20. Oktober 2026.*

Diese Texte beschreiben ehrlich, wie Tesserakt die Horoskope berechnet: welche Konventionen wir
verwenden, welche Fehler wir gefunden und korrigiert haben und welche Vereinfachungen bleiben.
Sie sind keine Werbung und keine Verteidigung. Wer eine Tradition gut kennt, wird hier Stellen
finden, an denen sie oder er es anders machen würde – oft zu Recht.

Eine Datei pro System: `westlich.md`, `bazi.md`, `numerologie.md`, `kabbalah.md`, `arabisch.md`,
`hellenistisch.md`, `vedisch.md`. Die verwendeten Bücher stehen in `quellen.md`.

---

## Was Tesserakt grundsätzlich tut

1. Aus Geburtsdatum, Uhrzeit (und optional Ort, Name, Geschlecht) wird für jedes System das
   klassische Horoskop berechnet.
2. Überlieferte Deutungsregeln (Quellen in den Regeldateien unter `backend/<System>/`) werden in
   Tendenzen für acht Lebensbereiche übersetzt: Liebe, Beruf, Finanzen, Gesundheit, Soziales,
   Kreativität, Veränderung, Spiritualität. Skala -1 bis +1.
3. Diese Tendenzen werden mit den Antworten der Spielerin oder des Spielers verglichen – und mit
   denselben Systemen für 100 zufällige andere Geburtsdaten (Kontrollgruppe). Daraus entsteht der
   Skill (siehe `docs/Erklärungen/skill_vs_zufall_erklaerung.md`).

Die Übersetzung in acht Zahlen ist unsere eigene. Sie ist zwangsläufig gröber als jede Deutung
durch einen Menschen.

---

## Astronomische Grundlage

- Planetenpositionen: **Swiss Ephemeris** (pyswisseph), geozentrisch.
- Westliche, hellenistische und arabische Rechnung: **tropischer Tierkreis**.
- Vedische Rechnung: **siderischer Tierkreis mit Lahiri-Ayanamsha** (seit 20.10.2026, siehe
  `vedisch.md`).
- Häuser: mit Geburtsort **Placidus**; ohne Geburtsort **ganze Zeichen** ab einem Aszendenten, der für
  einen Standardort (50° N, 10° O, Mitteleuropa) berechnet wird.
- **Zeit:** Mit Geburtsort wird die eingegebene Ortszeit über die Zeitzone des Ortes in Weltzeit (UT)
  umgerechnet, einschließlich historischer Sommerzeitregeln (IANA-Zeitzonendatenbank via `zoneinfo`;
  z. B. Deutschland 1950–1979 ohne Sommerzeit). Bazi-Tag und -Stunde bleiben bewusst in Ortszeit.
- **Sekt (Tag- oder Nachtgeburt):** Tag, wenn die Sonne über dem Horizont steht; ohne Geburtsort für den
  Standardort Mitteleuropa berechnet.
- **Orte:** GeoNames (CC BY 4.0), alle Orte ab 15.000 Einwohnern; kleinere Orte über die nächste Stadt.

---

## Korrigierte Fehler, die mehrere Systeme betrafen

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Das **Lebensalter** war die Differenz der Jahreszahlen. Wer im laufenden Jahr noch nicht Geburtstag hatte, war ein Jahr zu alt; das Alter wechselte am 1. Januar statt am Geburtstag. Betroffen: Profektion, Jahresherrscher, Firdaria, Dasha, Glückssäule, Pinnacle. | Alter in vollendeten Jahren; Firdaria und Dasha mit Nachkommastellen (Commit `fa8f7e3`). |
| 20.10.2026 | **Transite** waren ein Platzhalter, der nur aus dem Kalenderdatum berechnet wurde und für alle Menschen gleich war. | Echte Transite der laufenden Planeten zu den Geburtspunkten (Commit `eaf82f4`, siehe `westlich.md`). |
| 21.10.2026 | **Tag- oder Nachtgeburt (Sekt)** wurde an vier Stellen unterschiedlich bestimmt: Uhrzeit 6–18 Uhr (Firdaria, Diagramme), volle Stunde 6–18 einschließlich 18 Uhr (hellenistische Sekt-Regel) und Sonne in den Zeichen 7–12 (Lose). Wertung und Diagramm konnten sich widersprechen; im Winter galt 17 Uhr als Tag, im Sommer 20:30 Uhr als Nacht. | Einheitlich: Tag, wenn die Sonne über dem Horizont steht (nach Graden aus Aszendent und Sonnenposition). Bei Wiener Geburten ändert sich die Zuordnung in 11 % der Fälle. |
| 20.10.2026 | **Zeitzone und Sommerzeit** wurden nicht umgerechnet; die Ortszeit galt als Weltzeit. Bei mitteleuropäischen Geburten lag der Aszendent dadurch typisch 15–30° daneben (Beispiel Wien, Sommer 1985: 236° statt 214°). | Geburtsort-Suche im Spiel; Umrechnung mit historischen Sommerzeitregeln. |

---

## Bekannte Vereinfachungen (offen)

- **Ohne Geburtsort** (die Angabe ist freiwillig) wird die Uhrzeit wie früher als Weltzeit behandelt und
  der Aszendent für Mitteleuropa berechnet. Aszendent, Häuser, Lose und alles, was davon abhängt, liegen
  dann typisch 15–30° daneben (eine Stunde Zeitfehler verschiebt den Aszendenten um etwa 15°).
- **Kleinere Geburtsorte** werden über die nächste Stadt angenähert. Die Zeitzone stimmt dann praktisch
  immer, die Koordinaten liegen einige Kilometer daneben (Aszendent: Bruchteile eines Grades).
- **Unsichere Uhrzeit:** Viele Menschen kennen ihre Geburtszeit nur ungefähr. Das ist für Aszendent und
  Häuser die größere Fehlerquelle als jede Rechenkonvention.
- **Unbekannte Geburtszeit**: Ohne Eingabe gilt 12:00 Uhr.

---

## Was eine erfahrene Astrologin oder ein Astrologe anders macht

Ein Mensch liest ein Horoskop als Ganzes: Er gewichtet, verbindet und widerspricht Regeln, wo der
Zusammenhang es verlangt, fragt nach und kennt die Lebensgeschichte. Tesserakt wendet Regeln
mechanisch und gleich für alle an, damit der Vergleich fair und überprüfbar bleibt. Ein schlechtes
Abschneiden eines Systems bei Tesserakt sagt daher zunächst etwas über **unsere Übersetzung** dieses
Systems – nicht notwendigerweise über die Kunst der Menschen, die es ausüben.
