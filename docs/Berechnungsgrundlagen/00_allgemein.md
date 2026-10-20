# Berechnungsgrundlagen – Allgemeines

*Beipackzettel zu Tesserakt. Stand: 20. Oktober 2026.*

Diese Texte beschreiben ehrlich, wie Tesserakt die Horoskope berechnet: welche Konventionen wir
verwenden, welche Fehler wir gefunden und korrigiert haben und welche Vereinfachungen bleiben.
Sie sind keine Werbung und keine Verteidigung. Wer eine Tradition gut kennt, wird hier Stellen
finden, an denen sie oder er es anders machen würde – oft zu Recht.

Eine Datei pro System: `westlich.md`, `bazi.md`, `numerologie.md`, `kabbalah.md`, `arabisch.md`,
`hellenistisch.md`, `vedisch.md`.

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

---

## Korrigierte Fehler, die mehrere Systeme betrafen

| Datum | Fehler | Korrektur |
|---|---|---|
| 20.10.2026 | Das **Lebensalter** war die Differenz der Jahreszahlen. Wer im laufenden Jahr noch nicht Geburtstag hatte, war ein Jahr zu alt; das Alter wechselte am 1. Januar statt am Geburtstag. Betroffen: Profektion, Jahresherrscher, Firdaria, Dasha, Glückssäule, Pinnacle. | Alter in vollendeten Jahren; Firdaria und Dasha mit Nachkommastellen (Commit `fa8f7e3`). |
| 20.10.2026 | **Transite** waren ein Platzhalter, der nur aus dem Kalenderdatum berechnet wurde und für alle Menschen gleich war. | Echte Transite der laufenden Planeten zu den Geburtspunkten (Commit `eaf82f4`, siehe `westlich.md`). |

---

## Bekannte Vereinfachungen (offen)

- **Zeitzone und Sommerzeit werden nicht umgerechnet.** Die eingegebene Uhrzeit wird so behandelt,
  als wäre sie Weltzeit (UT). Für eine Geburt in Mitteleuropa liegt der berechnete Zeitpunkt damit
  1 Stunde (Winterzeit) bzw. 2 Stunden (Sommerzeit) daneben. Für Planeten in Zeichen ist das meist
  unerheblich (der Mond wandert in 2 Stunden etwa 1°), für **Aszendent, Häuser, Lose und alles, was
  davon abhängt, ist es erheblich**: Der Aszendent wandert etwa 15° pro Stunde. Das ist die wichtigste
  offene Baustelle.
- **Ohne Geburtsort** wird der Aszendent für Mitteleuropa berechnet. Für Menschen, die anderswo
  geboren sind, sind Aszendent und Häuser dann nicht ihre eigenen.
- **Tag- oder Nachtgeburt (Sekt)** wird für Sekt-Regeln, Firdaria und Diagramme vereinfacht über die
  Uhrzeit bestimmt (6–18 Uhr = Tag). Die arabischen und hellenistischen Lose verwenden dagegen den
  Sonnenstand über oder unter dem Horizont. Bei Geburten nahe Sonnenauf- oder -untergang können sich
  die beiden Bestimmungen widersprechen.
- **Unbekannte Geburtszeit**: Ohne Eingabe gilt 12:00 Uhr.

---

## Was eine erfahrene Astrologin oder ein Astrologe anders macht

Ein Mensch liest ein Horoskop als Ganzes: Er gewichtet, verbindet und widerspricht Regeln, wo der
Zusammenhang es verlangt, fragt nach und kennt die Lebensgeschichte. Tesserakt wendet Regeln
mechanisch und gleich für alle an, damit der Vergleich fair und überprüfbar bleibt. Ein schlechtes
Abschneiden eines Systems bei Tesserakt sagt daher zunächst etwas über **unsere Übersetzung** dieses
Systems – nicht notwendigerweise über die Kunst der Menschen, die es ausüben.
