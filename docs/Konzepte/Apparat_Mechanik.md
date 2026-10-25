# Apparat – Layout und Mechanik der Fragerunde

*Stand: 21. Oktober 2026. Ergebnis der Gespräche zum GUI-Design; ergänzt `Visuals.md` und `Spieldesign.md`.*

## Vor dem Apparat: Film und Kästchen

Ablauf beim Öffnen: Vorblatt (Einwilligungen) → beim allerersten Mal der Film (eine Frau reicht dem
Kameramann das Kästchen und stirbt; endet auf dem Deckel) → bei **jedem** Besuch das verschlossene Kästchen →
darin der Apparat mit der Datumsscheibe.

- **Deckel:** dunkles, rötliches Holz mit Schnitzereien, oben die Sonne-Mond-Einlage (Messing/Silber), darunter
  „TESSE | RAKT“ eingeschnitzt. Der Mittelpunkt der Einlage liegt über dem der Datumsscheibe (nicht gleich
  groß). Zweiteilig: die Fuge läuft im Holz gerade und in der Einlage entlang der Gesichtsprofile.
- **Dicke:** etwa 5 mm, die Einlage 2 mm tief. Beim Aufschwingen zeigt die Schnittkante Holz, oben das Metall
  der Einlage und Kerben, wo die Schnitzerei die Fuge kreuzt.
- **Öffnen:** Riegel unter dem Titel zur Seite schieben → der Deckel springt einen Spalt auf → eine Hälfte mit
  dem Finger aufziehen, die andere folgt. Die Scharniere liegen außerhalb des Bildschirms: links und rechts
  geht es weiter. Verschlossen ruckeln die Hälften nur; nach einer Weile ruckt der Riegel von selbst ein wenig.
- **Umsetzung:** `Kaestchen.jsx` (three.js); Deckelbild und Fuge aus `tools/kaestchen.py`.

## Grundlayout (bleibt fast immer gleich)

- **Obere Hälfte: Quadrat mit vollem Kreis.** Darin das magische Auge mit dem Fragedia (später auch Türchen,
  Deckel …). Die Ecken des Quadrats neben dem Kreis sind frei für Bedienelemente.
- **Untere Hälfte: Kreisbögen um denselben Mittelpunkt.** Die Kreisform setzt sich nach unten fort, aber nur
  noch als Bogensegmente.
  - Innerster Bogen: der **eigene Schieber** (Einschätzung „trifft nicht zu … trifft zu“).
  - Darunter je ein **breiterer, bogenförmiger Schlitz pro System**, in dem sich das Systemsymbol bewegt.
  - Zwischen den Schlitzen **strahlenförmige Einkerbungen** in der Oberfläche.
- **Ergebnis:** gleiches Prinzip – oben kreisförmiges Diagramm, unten Text (gerader Text in einem Feld, dessen
  Oberkante dem innersten Bogen folgt; gebogener Text ist schwer lesbar).

### Fächerform – die Strahlen sind die Skala

Alle Bögen decken **denselben Winkelbereich** ab. Dadurch verbindet jeder Strahl denselben Wert auf allen
Bögen: Steht ein Systemsymbol auf demselben Strahl wie der eigene Schieber, sagt das System dasselbe wie man
selbst. Ablesbar ohne Zahlen, wie an einem alten Messinstrument.

Folge: Den Winkelbereich bestimmt der äußerste Bogen (er stößt an den Bildschirmrand). Die inneren Bögen sind
kürzer und stärker gekrümmt, die äußeren lang und flach – ein Fächer.

Richtwerte iPhone 12 (390 × 844 CSS-Pixel): etwa ±20–25°, innerster Bogen ca. 130–180 px, äußerster ca. 400 px.
Auf kleinen Handys (iPhone SE, 375 × 667) werden die Abstände zwischen den Bögen knapp; dort ggf. kleinerer
Kreis oben oder höchstens 4 aktive Systeme.

## Ruheposition

- Ganz links liegt die **Ruheposition** (Wert „etwa 0“, nicht „trifft gar nicht zu“). Sie ist durch eine
  kleine Lücke bzw. einen Sperrzahn von der Skala getrennt.
- Systemsymbole und der eigene Schieber stehen anfangs dort.

## Reihenfolge der Bögen

- Von innen nach außen: Numerologie, Kabbalah, Chinesisch, Vedisch, Arabisch, Westlich, Hellenistisch.
- Innen die Zahl, außen der Himmel: neben dem eigenen Schieber das persönlichste System (rechnet nur mit dem
  eigenen Datum), nach außen immer „kosmischer“ bis zum hellenistischen Ursprung am Rand. Keine Wertung,
  sondern ein Verlauf; wer ihn bemerkt, entdeckt etwas.



## Aufziehen (bei jeder Frage neu)

- Wer ein System mitspielen lassen will, **zieht sein Symbol von ganz links nach ganz rechts** und zieht damit
  dessen Mechanismus auf. Nicht aufgezogene Systeme bleiben links.
- Das gilt **für jede Frage neu**.
- Mit einem breiten Finger oder einer schrägen Wischbewegung erwischt man **mehrere Schieber auf einmal**
  (Toleranz etwa ein halber Bogenabstand; Browser liefern nur einen Berührpunkt, keine Fingerbreite).
- Lässt man vor der Hälfte los, federt der Schieber zurück; ab der Hälfte rastet er rechts ein.
- Ein einziges System reicht.

### Regel für das Fragedia

> Das Dia folgt dem ersten Schieber, der **aus der Ruheposition** aufgezogen wird – synchron mit dem Finger:
> Die alte Frage gleitet hinaus, die neue herein.

- Weil nach jedem Ergebnis alle Schieber links stehen (siehe Auslösehebel), hat schon der erste den vollen
  Weg von ganz links nach ganz rechts. (Früher brauchte es dafür einen zweiten Schieber, weil der erste noch
  von seiner Ergebnisposition aus startete.)
- Vor der ersten Frage liegt ein leeres Glas im Auge (keine Anleitung); das erste Aufziehen schiebt es weg.
- Weitere Systeme kann man auch nach dem Erscheinen der Frage noch aufziehen.
- Man sieht das Dia wie durch eine Lupe: Polsterverzerrung, zum Rand hin unschärfer (SVG-Filter, `lupe.jsx`).
  Im Auge liegt eine dunkle Messingscheibe mit quadratischem Fenster, dahinter das Dia (`Diascheibe.jsx`).
- Die Scheibe ist dick: Man sieht die Wände des Fensters, das Dia liegt tief dahinter und leuchtet.
- Über dem Fenster zählen Bohrungen in der Scheibe die Fragen. Die Löcher sind immer da; dahinter schiebt sich
  mit jeder Frage ein rotes Glas weiter. Offene Fragen leuchten hell, beantwortete bis zur aktuellen rot.
  Das Durchlicht der Kamera wirkt auch auf die Löcher.
- Die Pole des eigenen Schiebers („trifft nicht zu“ / „trifft zu“, in Spiel C „eher ich“ / „eher Partner:in“)
  stehen klein am unteren Rand des Dias, nicht mehr auf der Fächerplatte.
- Ein kleiner Hinweis beim allerersten Spiel: Ein Symbol ruckt von selbst an.

## Eigener Schieber und Sperrklinke

- Der eigene Schieber läuft beim Aufziehen mit in die Ruheposition zurück. Man muss bei jeder Frage **neu
  wählen**, auch „weder noch“ in der Mitte bewusst einstellen.
- Solange er in der Ruheposition steht, greift eine sichtbare **Sperrklinke** in den Auslösehebel. Rastet der
  Schieber auf der Skala ein, hebt sich die Klinke mit einem Klick.

## Auslösehebel

- **Rechts unten im Quadrat**, neben dem Auge (die Mitte gehört dem Auge mit dem Fragedia). Daumennah, direkt
  über dem rechten Ende der Bögen.
- Ein Hebel zum Herunterziehen, eher als ein Knopf.
- Ecke links unten: Fragenzähler, Ton-Schalter. Für Linkshänder später ggf. spiegeln.
- Nach dem Auslösen laufen die aufgezogenen Symbole geräuschvoll von rechts auf ihre Werte. Der Hebel
  **bleibt unten** und hält alle Schieber fest (ein Griff an einen Schieber stößt dumpf an).
- **Hebel wieder hochschieben** (oder antippen) entriegelt: Alle Schieber, auch der eigene, laufen nach links
  in die Ruhe zurück, und alles beginnt von vorn mit dem Aufziehen.

## Wertung: Aufziehen wirkt nur auf die Anzeige

- **Alle 7 Systeme werden bei jeder Frage berechnet und gespeichert**, auch die nicht aufgezogenen.
- Grund: Wer Systeme pro Frage an- und abwählen kann, könnte ein System weglassen, sobald es gut dasteht
  („optionales Stoppen“). Das würde ein System ohne jede Aussagekraft besser aussehen lassen.
- Die Wertung für das Experiment läuft daher immer über alle Systeme und alle Fragen. Gespeichert wird
  zusätzlich, welche Systeme bei welcher Frage angezeigt waren.
- Persönliches Ergebnis: nur die Systeme, die **mindestens einmal aufgezogen** waren – einmal befragt, gehört
  es dazu. Weglassen kann man ein System danach, verstecken nicht; sein Skill zählt trotzdem über alle Fragen,
  Weglassen bringt also keinen Vorteil. (Die strengere Regel „nur Systeme, die bei jeder Frage dabei waren“
  hätte genau das belohnt: Wer ein System nach ein paar Fehlgriffen weglässt, sähe nur noch die Glückstreffer.)
  Auf den Textkarten steht, bei wie vielen Fragen ein System mitgespielt hat. Die Erklärung unter der
  Rangliste rechnet mit der Zahl der gezeigten Systeme („das beste von n Horoskopen …“).

## Schlitze als runde Balkenanzeige

- Die Schlitze der Horoskop-Schieber sind breit. Links vom Knopf liegt das Muster des Horoskops frei, im Stil
  seiner Ergebnisgrafik: Westlich Nachthimmel mit Sternen, Hellenistisch Mäander auf Ton, Chinesisch goldener
  Drachen-Zickzack auf Rot, Vedisch Reismehlpunkte und Farbpulver, Arabisch Kacheln, Kabbalah Pfad mit
  Sephiroth auf Pergament, Numerologie Karopapier.
- Rechts deckt ein goldenes, ziseliertes Plättchen mit geprägter Wellenlinie den Schlitz ab. Es hängt am Knopf:
  die Welle gleitet mit, wenn der Schieber bewegt wird.
- Paarfragen (Spiel C): Der Balken wächst von der Mitte aus; links und rechts liegt je ein Plättchen.
- Schatten an der oberen Kante und an den Plättchenkanten geben dem Schlitz Tiefe.
- Auf den Knöpfen sitzen Icons der Horoskope (`HoroskopIcon.jsx`), passend zu Grafik und Muster; dieselben
  Icons sind für den Zettel im Intro gedacht (ToDo).

## Ergebnis im Fächer

- Nach der letzten Frage schiebt man den Hebel ebenfalls hoch; alle Schieber gleiten in die Ruhe, im Auge erscheint ein Dia auf blauem Glas:
  nur „Dein Ergebnis“ (Spiel C „Euer Ergebnis“, Spiel B „Dein Rückblick“). Bewusst ohne Anleitung: wie es
  weitergeht, sollen die Spieler selbst entdecken.
- Der Hebel gibt erst frei, wenn alle Systeme, die mitgespielt haben, und der eigene Schieber ganz rechts
  stehen. Die übrigen sind blockiert (dumpfes Anschlagen) und bleiben auch in der Auswertung in Ruhe.
- Nach dem Hebelzug wechselt das Dia zur Rangliste; die Systemschieber fahren auf ihren Skill
  (−100 links … +100 rechts, gleiche Skala wie die Antworten). Der eigene Schieber bleibt rechts (+100).
- Wischen oder Tippen im Auge schiebt den Fächer nach links weg, die Textkarten je System kommen herein.
  Zurück: auf der ersten Karte nach rechts wischen oder der erste (eckige) Punkt.
- „‹“ links oben führt zurück zur Datumsscheibe (früher „Noch einmal“).
- Abkürzung (Tipp auf das Datum): landet direkt in diesem Fächer mit gewürfelten Antworten.

## Ecken des Quadrats: Spielwahl (Idee, noch nicht umgesetzt)

- Rechts unten: Auslösehebel.
- Links oben, rechts oben, links unten: drei Knöpfe für die Spiele **A, B, C** mit mystischen Symbolen
  **Geburt, Zeit, Paar**.
- Anfangs zeigt der Kreis die **Datumsauswahl**. A und B führen gleich zum Spiel; C führt zuerst zu einer
  zweiten Datumsauswahl. Erste Person **gold**, zweite **silber** (passt zu Sonne/Mond des Deckels).
- Fragenzähler und Ton-Schalter brauchen dann einen neuen Platz (z. B. Zähler im Messingrand des Auges).
- Umgesetzt: A links oben, B rechts oben, **C rechts unten**. C liegt unter der Walzenplatte, die ihn mit
  einer runden Ausnehmung freilässt; beim Übergang dreht sie darüber und deckt ihn zu. Im Fächer sitzt die
  Ausnehmung dann rechts oben (um den Druckknopf). Links liegt auf der Datumsseite schon der Fächer bereit;
  sein eigener Schieber steht dort unsichtbar in der Mitte und läuft beim Hereindrehen nach links.

## Ortsauswahl und Name (offen)

- Die Suchliste mit Vorschlägen ist bequem, passt aber nicht zum Apparat.
- Idee: ein **Ring außen um den oberen Kreis wie die Skala eines alten MW-Radios** mit Ortsnamen.
- Name (nur Numerologie, optional): noch offen.
