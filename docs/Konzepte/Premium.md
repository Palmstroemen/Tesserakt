# Premium: Konzept

*Stand: 10. 11. 2026, Entwurf, noch nichts umgesetzt*

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
   und genau das ist das Geschäftsmodell. Die Bestellung bringt einen **Code** mit (Stripe-Bestätigung und
   Rückkehrseite), der Premium auf weiteren Geräten freischaltet (Familie, neues Handy).

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
oder mit dem Code) sollte spürbar sein, etwa ein Einrasten mit Klang, und das Auge sieht danach anders aus.
Davor könnte der Fortschritt sichtbar sein, ohne zu erklären: drei kleine Marken am Auge, die sich je
gespieltem Spiel füllen (Sonne, Sanduhr, Sonne/Mond wie die Knöpfe).

## Buchpreise: Folgebücher günstiger

Einen neuen Kunden zu gewinnen kostet mehr, als einen gewonnenen zu halten. Deshalb ist das **erste Buch zum
vollen Preis**, jedes weitere günstiger (etwa zweites und weitere Bücher um einen festen Betrag oder
Prozentsatz). Dargestellt als „Folgebücher günstiger“, nicht als „das erste ist teurer“: wirtschaftlich
dasselbe, aber es klingt nach Belohnung statt nach Aufschlag.

- **Stammkunde ohne Konto:** erkannt am Code aus der ersten Bestellung (derselbe Code wie für Premium). Der
  Server merkt sich je Code nur, dass schon bestellt wurde.
- **Marge:** Die Selbstkosten liegen bei 14–20 € je Buch, die heutige Staffel bei 15/30 €
  (`buchdruck_shop.md`, Preise). Der volle Preis für das erste Buch muss den Nachlass für die Folgebücher
  tragen.
- `buchpreise.py` liefert schon Staffel und Aktion je Markt; der Folgepreis kommt als weiterer Wert dazu,
  abhängig vom mitgeschickten Code.
- Rechtlich: Preise klar ausweisen (Preisangaben, Omnibus-Richtlinie bei durchgestrichenen Preisen), am besten
  als eigener Folgepreis statt als „Rabatt von …“.

## Zu prüfen

- **Google Play:** Ein digitaler Bonus (Premium) als Zugabe zu einem physischen Kauf (Buch), bezahlt außerhalb
  von Play Billing. Wahrscheinlich zulässig, weil Premium selbst nichts kostet und auch durch Spielen erreichbar
  ist; vor dem Start an der Payments-Richtlinie prüfen.
- Datenschutz: Code und „schon bestellt“ je Code in der Datenschutzerklärung und im Play-Formular erwähnen.

## Reihenfolge

1. Erst die Grundlagen: Buchshop, eigene Domain und Server, Markenname.
2. Freischaltung durch Spielen (Merker auf dem Gerät), Speichern der Personen, Auge mit Namenswalze,
   Schnellweg. Das geht schon ohne Shop.
3. Mit dem Shop: Code aus der Bestellung, Premium per Code, Folgepreis.
4. Im laufenden Test die Tester fragen, ob ihnen der Schnellweg fehlt und wie viele Personen sie speichern
   würden.

## Offene Fragen

1. Wie viele Personen speichern?
2. Freischaltung genau: alle drei Spiele bis zum Ergebnis, oder genügt bei Spiel C eine Runde mit beliebigem
   Partnerdatum?
3. Wie hoch ist der Folgepreis (fester Betrag oder Prozent), und gilt er schon für ein zweites Buch in
   derselben Bestellung?
4. Für wie viele Geräte gilt ein Code?
5. Fortschritt zum Premium sichtbar (Marken am Auge) oder ganz verborgen bis zur Freischaltung?
6. Ergebnisplatte im Schnellweg: Was zeigt sie dort, wo sonst die eigenen Antworten stehen?
