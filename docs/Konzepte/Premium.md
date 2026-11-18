# Premium: Konzept

*Stand: 18. 11. 2026, Entwurf, noch nichts umgesetzt*

---

## Ausgangslage

Der Apparat ist kostenlos; Einnahmen bringt das gedruckte Horoskopbuch (`buchdruck_shop.md`). Premium ist
**keine Bezahlversion**, sondern eine Belohnung für die, die den Apparat kennengelernt haben: Wer wiederkommt,
soll nicht jedes Mal spielen müssen, um zu den Ergebnissen und Büchern zu kommen.

Weil Premium nichts kostet, entfällt die Frage nach dem Zahlweg: kein Google Play Billing (15 %), keine
EU-Ausnahmen, keine zweite Kasse neben dem Buchshop.

## Wie man Premium bekommt

1. **Alle drei Spiele einmal durchgespielt** (A, B und C je bis zum Ergebnis). Wer alle drei kennt, hat das
   Wesentliche erlebt. Und es ist ein Ziel, das man entdecken kann, ohne dass es erklärt wird. Gemerkt wird
   es nur auf dem Gerät (welche Spiele abgeschlossen sind). Erwogen, aber verworfen: schon nach der ersten
   Runde.
2. **Mit einer Buchbestellung** sofort, auch ohne die Spiele. Wer ein Buch bestellt, hat Interesse bekundet,
   und genau das ist das Geschäftsmodell. Freigeschaltet wird **das Gerät, mit dem bestellt wurde**, sobald
   die Bestellung bestätigt ist (Rückkehr von Stripe).

**Kein übertragbarer Code.** Premium gehört zu dem Gerät, auf dem gespielt oder bestellt wurde. Auf einem
anderen Gerät spielt man eben noch einmal, oder bestellt dort. Das ist kein ernstes Hindernis: Wer schon
weiß, wie der Apparat geht, ist schnell durch, und es bleibt nichts zu verwalten (keine Codes, kein
Missbrauch durch weitergereichte Codes, nichts im Buch zu drucken).

## Was Premium freischaltet

### 1. Mehrere Geburtsdaten speichern (Familie)

- Das **eigene** Datum merkt sich der Apparat auch ohne Premium.
- Premium: einige weitere Personen mit Namen (Partner:in, Kinder, Eltern), etwa fünf bis zehn.
- **Nur auf dem Gerät** gespeichert (localStorage bzw. Capacitor Preferences), nie auf dem Server. Es sind
  personenbezogene Daten Dritter; so bleibt die Datenschutzerklärung fast unverändert. `forschung.js` schickt
  ohnehin kein Geburtsdatum.
- Passt besonders zu Spiel C: zwei gespeicherte Personen wählen statt zweimal die Scheibe zu drehen.

### 2. Schnellweg zu Ergebnissen und Büchern

Wer alle Spiele kennt, weiß, dass die Antworten auf das Buch keinen Einfluss haben. Er will nur noch zu den
Ergebnissen und Büchern. Müsste er trotzdem spielen, klickte er sich mit beliebigen Antworten durch, und die
wären für die Forschung wertlos. Der Schnellweg schützt also die Datenqualität.

- **Keine Forschungsdaten aus dem Schnellweg:** Eine Runde ohne Antworten geht nicht an `POST /runde`.
- **Ergebnisse vollständig:** Grafiken, Texte und Buch hängen nur vom Geburtsdatum ab, nicht von den Antworten.
  Was in der Ergebnisplatte von Antworten abhängt (Vergleich eigene Einschätzung ↔ Horoskope), entfällt oder
  bleibt leer.
- **Spielen bleibt möglich:** Premium nimmt nichts weg, die Spiele gehen weiter wie gewohnt.

Kein Buchrabatt als Premium-Funktion; Preisvorteile gibt es über die Folgebücher (siehe unten).

## Im Apparat: das zentrale Auge der Datumsscheibe

Den Schnellweg gibt es schon für die Entwicklung: Ein Tipp auf das Datum führt mit gewürfelten Antworten zum
Ergebnis (`spielWahl` mit `"X"` auf der goldenen, `"XC"` auf der silbernen Scheibe, `abkuerzung` in
`Apparat.jsx`). Daran knüpft Premium an. Ganz im Sinne von „Entdecken statt erklären“ gibt es keinen
beschrifteten Knopf:

1. **Tippen auf das Auge** in der Mitte der Datumsscheibe.
2. Mit gespeicherten Personen erscheinen ihre **Namen auf einer Walze**, durch die man scrollt (ähnlich
   `OrtWalzen.jsx`); die gewählte Person stellt das Datum ein.
3. **Das Auge verändert sich**, Farbe oder Anzeige, etwa ein warmes Leuchten oder ein Sternbild im Auge, wie
   ein eingerasteter Modus.
4. Die **drei Spielknöpfe** führen dann ohne Spiel direkt zu den Ergebnissen und zu den drei Buchvarianten.
5. Noch einmal auf das Auge tippen schaltet zurück auf normales Spielen.

Vor der Freischaltung tut das Auge nichts Besonderes. Der Moment der Freischaltung (nach dem dritten Spiel
oder mit der Bestellung) ist spürbar, ein Einrasten mit Klang, und das Auge sieht danach anders aus.

## Benutzerführung

Außerhalb des Apparats darf erklärt werden, im Apparat wird nur gezeigt („Entdecken statt erklären“).

### Wie man von Premium erfährt

- **Fortschritt am Auge (entschieden: sichtbar):** drei kleine Marken am Auge, die sich je abgeschlossenem
  Spiel füllen (Sonne, Sanduhr, Sonne/Mond wie die Knöpfe). Ohne Beschriftung; wer zwei gefüllt sieht, will
  die dritte.
- **Bestätigungsseite und Bestellmail:** ein Satz, etwa „Dein Apparat kennt dich jetzt: Tippe
  auf das Auge der Datumsscheibe, und du kommst ohne Spiel zu deinen Horoskopen.“
- **Im Buch (gedruckt auf der Schlussseite):** derselbe Satz, ohne Code; Premium gilt für das Gerät, mit dem
  bestellt wurde. Das Buch kommt Tage später und erinnert noch einmal daran.
- **Einrasten im Apparat:** Beim ersten Öffnen nach der Bestellung (oder direkt nach dem dritten Ergebnis)
  füllen sich die Marken, das Auge rastet mit Klang ein und leuchtet von da an. Kein Text.
- **Zettel-Rückseite:** Erst nach der Freischaltung erscheint dort eine Zeile, etwa „Auge antippen: ohne Spiel
  zu den Ergebnissen“ (die erlaubte Ausnahme für Bedienhinweise).

### Ablauf beim Wiederkommen

1. Start, Kästchen, Datumsscheibe (der Film nur beim ersten Mal).
2. **Tipp auf das Auge:** Es leuchtet auf, der Schnellweg ist an. Mit gespeicherten Personen erscheint die
   Namenswalze, sonst gilt das eingestellte Datum.
3. **Die drei Spielknöpfe sind die Horoskopauswahl**, ohne neue Bedienelemente:
   - **A** direkt zum eigenen Ergebnis und Buch,
   - **B** direkt zur Übersicht aller Horoskope,
   - **C** fragt nach der zweiten Person (Walze oder zweites Drehen der Scheibe), dann das Paarergebnis.
4. Noch ein Tipp auf das Auge: zurück zum normalen Spielen.

### Abgrenzung im Code

- Die heutige Entwicklungs-Abkürzung (Tipp auf das Datum, `spielWahl` mit `"X"`/`"XC"`, gewürfelte
  Antworten) kommt hinter einen Entwicklerschalter. Der Schnellweg ist ein eigener Modus **ohne** Antworten
  und ohne `POST /runde`.
- Das Auge der Datumsscheibe reagiert auf einen kurzen Tipp; das lange Drücken auf die Linse der Spiel- und
  Ergebnisplatte (Kamera aus/an) bleibt davon getrennt.
- Freischaltung durch Bestellung: Die Rückkehrseite von Stripe setzt den Premium-Merker auf dem Gerät, aber
  nur, wenn der Server die Zahlung für diese Sitzung bestätigt.

## Buchpreise: Folgebücher günstiger

Einen neuen Kunden zu gewinnen kostet mehr, als einen gewonnenen zu halten. Deshalb ist das **erste Buch zum
vollen Preis**, jedes weitere günstiger (etwa zweites und weitere Bücher um einen festen Betrag oder
Prozentsatz). Dargestellt als „Folgebücher günstiger“, nicht als „das erste ist teurer“: wirtschaftlich
dasselbe, aber es klingt nach Belohnung statt nach Aufschlag.

- **Stammkunde ohne Konto:** Das Gerät bekommt bei der ersten Bestellung eine zufällige, unsichtbare Kennung;
  der Server merkt sich je Kennung nur, dass schon bestellt wurde. Ein bloßer Merker im Gerät genügt für den
  Preis nicht, weil man ihn von Hand setzen könnte. Die Kennung ist nicht zum Weitergeben gedacht und wird
  nirgends angezeigt. Ein anderes Gerät zahlt beim ersten Buch den vollen Preis.
- **Marge:** Die Selbstkosten liegen bei 14–20 € je Buch, die heutige Staffel bei 15/30 €
  (`buchdruck_shop.md`, Preise). Der volle Preis für das erste Buch muss den Nachlass für die Folgebücher
  tragen.
- `buchpreise.py` liefert schon Staffel und Aktion je Markt; der Folgepreis kommt als weiterer Wert dazu,
  abhängig von der mitgeschickten Gerätekennung.
- Rechtlich: Preise klar ausweisen (Preisangaben, Omnibus-Richtlinie bei durchgestrichenen Preisen), am besten
  als eigener Folgepreis statt als „Rabatt von …“.

## Zu prüfen

- **Google Play:** Ein digitaler Bonus (Premium) als Zugabe zu einem physischen Kauf (Buch), bezahlt außerhalb
  von Play Billing. Wahrscheinlich zulässig, weil Premium selbst nichts kostet und auch durch Spielen erreichbar
  ist; vor dem Start an der Payments-Richtlinie prüfen.
- Datenschutz: Gerätekennung und „schon bestellt“ je Kennung in der Datenschutzerklärung und im Play-Formular erwähnen.

## Reihenfolge

1. Erst die Grundlagen: Buchshop, eigene Domain und Server, Markenname.
2. Freischaltung durch Spielen (Merker auf dem Gerät), Speichern der Personen, Auge mit Namenswalze,
   Schnellweg. Das geht schon ohne Shop.
3. Mit dem Shop: Premium für das bestellende Gerät, Gerätekennung, Folgepreis.
4. Im laufenden Test die Tester fragen, ob ihnen der Schnellweg fehlt und wie viele Personen sie speichern
   würden.

## Offene Fragen

1. Wie viele Personen speichern?
2. Freischaltung genau (beide Wege bleiben: Spiele oder Buchbestellung): alle drei Spiele bis zum Ergebnis,
   oder genügt bei Spiel C eine Runde mit beliebigem Partnerdatum?
3. Wie hoch ist der Folgepreis (fester Betrag oder Prozent), und gilt er schon für ein zweites Buch in
   derselben Bestellung?
4. Ergebnisplatte im Schnellweg: Was zeigt sie dort, wo sonst die eigenen Antworten stehen?
