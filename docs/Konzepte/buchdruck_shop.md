# Buchdruck-Shop: Konzept zur Entscheidung

Stand: 4. November 2026 (Druckereien verfeinert). Noch nichts gebaut, keine Konten angelegt. Preise der Druckereien sind öffentliche
Angaben oder Schätzungen; verbindlich sind erst Angebote über deren API (dafür braucht es ein Konto).

## Ausgangslage

- Das Buch setzt die App selbst (`frontend/src/apparat/Buch.jsx`): 21 × 21 cm, hell oder dunkel, Titelseite,
  Impressum (mit Geburtsdatum), Leitsatz, Einleitung, je Horoskop Grafik und zweispaltige Textseiten, Hintergrund,
  Quellen, Rückseite mit dem Kästchen. Ausgabe derzeit nur über `window.print()` („Drucken / PDF“).
- Preise kommen aus `content/buch/preise.json` über `backend/buchpreise.py` (`GET /buch/preise`), Staffel nach
  Anzahl der Horoskope: 15 € für eines bis 30 € für sieben (inkl. Steuern, ohne Versand).
- In der Buchauswahl (`DruckAuswahl.jsx`) steht „Bestellen – folgt“. Vor dem Ergebnis zeigt der Buch-Knopf die
  Werbung (`setDruck(... "auswahl" : "werbung")` in `Apparat.jsx`).
- Der Server läuft für den Test auf dem GMKtec hinter Tailscale Funnel, ohne Zugriffsprotokoll. Gespeichert wird
  bisher nur die anonyme Forschungsrunde; keine Namen, Adressen, E-Mails, Zahlungen.

**Wichtigste Erkenntnis vorweg:** Die Preise der Druckereien liegen weit auseinander. Bei den Fotobuch-Plattformen
(Prodigi, Gelato) kostet ein Hardcover 21 × 21 cm mit 24–40 Seiten etwa 18–30 € netto, dann liegt die Staffel in
`preise.json` (15 € bis 30 €) unter den Kosten. Bei Print API (Niederlande) kostet dasselbe Buch laut Preisliste
7–10 € netto. Damit wäre die heutige Staffel ungefähr kostendeckend. Siehe „Preise“ unten.

## 1. Druckdienstleister

Gesucht (verfeinert am 4. 11. 2026): günstig, hochwertig, möglichst nah an AT/DE; Print-on-Demand mit API oder
wenigstens automatischer Auftragsübergabe, Hardcover, je Bestellung ein eigenes PDF, Versand direkt an die
Kundin. Das Format 21 × 21 cm ist **nicht** Pflicht. Weil `Buch.jsx` alles relativ zur Seite setzt (`cqw`), lässt
sich auch auf 20 × 20, A5 oder ein anderes Format umstellen, mit neuem Umbruch.

### Engere Wahl

| | Print API (NL) | CPI books (DE, Ulm) | Expresta (SK, Bratislava) | epubli (DE, Berlin) |
|---|---|---|---|---|
| Nähe zu AT | Groningen, Produktionsort nicht genannt | **Ulm**, ausdrücklich für den deutschsprachigen Raum | **60 km von Wien** | Berlin, Produktionsort nicht genannt |
| Hardcover ab 1 Stück | ja | ja | laut Seite ja, Hardcover nicht ausdrücklich bestätigt | Bindungen abfragbar, Hardcover nicht ausdrücklich bestätigt |
| Quadrat / Format | **21 × 21**, 14 × 14, 30 × 30, A5, A4; 24–200 Seiten | 155 × 105 bis 297 × 210 mm (210 × 210 passt hinein) | „verschiedenste Formate“ | über die API abfragbar |
| Qualität | Fotobuch-Technik, Papier matt oder glänzend, Grammatur nur im Portal | **Buchdruckerei** (druckt einen Großteil deutscher Verlagsbücher): Rund- oder Geradrücken, Vorsatz, Kapitalband, 4-farbig, 6 Papiere, Umschlag matt oder glänzend | Buchdruckerei mit eigener Produktion | Self-Publishing-Dienst |
| Preis (Hardcover) | **21 × 21: 7,17 € netto für 24 Seiten + 0,18 € je weitere Seite**; 40 Seiten ≈ 10,05 €; Versand nicht veröffentlicht | auf Anfrage | Preisrechner, Einzelpreis nicht veröffentlicht | über die API abfragbar |
| Anbindung | REST-API, Testumgebung, Bibliotheken; Rechnung im Nachhinein oder eigene Kasse | Auftrag als XML-Datei (PDF + Adresse), Daten nach der Produktion gelöscht; eher für Verlage gedacht | „Bestelldruck-API“, öffentlich nur ein JS-SDK für Bestellknöpfe; Kontakt api@expresta.com | REST-API: Produkte, Preise, Auftrag mit PDF-URL, Callback bei Statuswechsel |
| PDF | sRGB, Beschnitt im PDF, Umschlag und Innenteil getrennt, Rückenbreite per Formel | Druck-PDF nach CPI-Vorgaben | – | Checkliste von epubli |
| Produktionszeit | – | **72 h** (Hardcover) | – | – |

### Plattformen mit Druckernetz (zum Vergleich)

Diese verteilen die Aufträge selbst auf die Druckerei, die der Kundin am nächsten ist: Gelato (über 140 Partner
in 32 Ländern, auch DE), Cloudprinter (NL, rund 380 Druckereien in über 100 Ländern, Sandbox), Prodigi (eigenes
Labor in der EU), Lulu (nächstgelegene Druckerei). Bequem, aber man weiß nicht, wer druckt, und die Qualität
schwankt je nach Partner. Für ein Buch, das schön sein soll, ist ein fester Druckpartner besser.

| | Prodigi | Gelato | Lulu (Print API) | Peecho | CEWE / Saal / BoD |
|---|---|---|---|---|---|
| Quadrat-Format | **21 × 21 cm** Hardcover (PUR-Bindung) laut Produktseite; der technische Leitfaden nennt dagegen 9 × 9″ und 12 × 12″ – vor der Wahl klären | 20 × 20 cm Hardcover (auch 30 × 30) | 8,5 × 8,5″ = 21,6 × 21,6 cm (Casewrap) | keine Quadrat-Hardcover gefunden (A4/Letter); Fotobücher laufen inzwischen über Prodigi | Fotobuch-Formate passen, aber keine öffentliche API für Fremdanbieter gefunden |
| Abweichung zum Buch | keine | 1 cm kleiner: Layout skaliert (alles in `cqw`), Umbruch bleibt | 6 mm größer: skaliert ebenso | – | – |
| Seiten | 24–300 (gerade Zahl, keine 4er-Vielfache nötig) | 30–200 Innenseiten | ab 24 (Hardcover) | – | – |
| Papier | 120 g matt (Mohawk), 150/200 g glänzend | 170 g Silk, matt laminierter Deckel | 80# (≈ 120 g) gestrichen, Standard/Premium Color | – | – |
| Stückpreis (Schätzung) | Hardcover ab ca. 22 $ (Drittquelle), Layflat ab 17,53 £ | 20 × 20 Hardcover ab ca. 19 $ (Demo-Shop), 30 Seiten im Grundpreis | ab ca. 11–15 $ Standard Color, Premium Color 21,6² mit 30 S. eher 15–20 $ | – | – |
| Produktion für AT/DE | EU-Labor (auch UK, US, MX, AU), automatisch das nächste | lokal in 30+ Ländern, auch DE | „nächste Druckerei“, EU-Standort nicht bestätigt; Lulu weist EU-MwSt. extra aus | – | – |
| Produktion + Versand | 5 Tage Produktion + Versand | ähnlich, lokal | unklar für EU | – | – |
| API | REST v4: Angebot (`quotes`), Bestellung mit Datei-URLs, Status, Rückruf (Callback) | REST: Angebot, Bestellung mit Datei-URL, Status, Webhooks | REST: Preisrechner, Druckauftrag mit PDF-URLs (Innen + Umschlag), Status, Webhooks; keine Grundgebühr | API + gehostete Kasse | – |
| PDF | ein PDF, Umschlag als erste und letzte Seite, Rücken getrennt; RGB 300 dpi, PDF/X-4 (FOGRA39) empfohlen, Schriften einbetten, Transparenzen reduzieren; **Beschnitt erzeugt Prodigi selbst**, Text 10 mm vom Rand | Beschnitt im PDF (Vorlage vom Produkt, bei Postern 4 mm), keine Schnittmarken | zwei PDFs (Innenteil, Umschlag mit Rücken), Beschnitt 0,125″ = 3,2 mm, Schriften eingebettet; Rückenbreite aus der Seitenzahl | – | – |
| Neutraler Versand | ja (ohne Prodigi-Logo) | ja | ja | – | – |

### Amazon (KDP) als Druck-auf-Bestellung

Amazon druckt Bücher selbst und über Partner nahe am Kunden, das wäre im Prinzip das gesuchte Verteilen. Für
Tesserakt passt es trotzdem nicht:
- KDP druckt nur **veröffentlichte Titel**: Jedes Buch bräuchte einen eigenen Eintrag im Amazon-Katalog,
  öffentlich auffindbar, mit Geburtsdatum im Impressum. Ein Buch je Person ist so nicht vorgesehen, und Amazon
  lehnt massenhaft fast gleiche Titel ab.
- Keine Druck-API für Einzelaufträge an beliebige Adressen; verkauft wird über Amazon, die Kundin kauft dort.
- Hardcover gibt es nicht quadratisch (nur 5,5 × 8,5″ bis 8,25 × 11″); farbiges Hardcover erst ab 75 Seiten.
- Preis zum Vergleich (Amazon.de, Hardcover Premium-Farbe): 4,50 € + 0,06 € je Seite, bei 75 Seiten 9,00 €
  Druckkosten. Das liegt in derselben Größenordnung wie Print API (21 × 21, 40 Seiten ≈ 10 €), also kein
  Preisvorteil, der die Nachteile aufwiegt.

Was Amazon bietet, liefern ohne diese Nachteile die Druckernetze oben (Gelato, Cloudprinter) oder,
für Bücher im Buchhandel, Ingram Lightning Source – dort ebenfalls nur je Titel.

### Empfehlung

1. **Print API** als erster Kandidat: veröffentlichter Preis weit unter den Fotobuch-Plattformen, 21 × 21 im
   Angebot (kein Umbau des Buchs), REST-API mit Testumgebung. Zu klären: wo gedruckt wird, Papier,
   Versandkosten und Lieferzeit nach AT/DE, neutraler Versand. Ein Musterbuch zeigt die Qualität.
2. **Expresta** als nächstgelegene Druckerei (Bratislava), falls die API taugt – angefragt.
3. **Happy Foto** (Freistadt, größter Fotobuchhersteller Österreichs): keine öffentliche API, aber als lokaler
   Partner angefragt.
4. Erst wenn alles davon nicht passt: Prodigi oder Gelato (teurer, aber gut dokumentiert).

CPI (Ulm) ist ausgeschlossen (Entscheidung 4. 11. 2026); steht nur noch zum Vergleich in der Tabelle.
Mailentwürfe an Expresta und Happy Foto: `docs/privat/mail_druckereien.md` (nicht im Repo).

CEWE und Saal haben keine öffentliche API.
Flyeralarm und Pixartprinting drucken Hardcover ab einem Stück, eine API für Einzelaufträge war nicht zu finden.
BoD ist ein Verlagsdienst (ISBN, Buchhandel), nicht für Einzelstücke je Person gedacht.

Vor der Entscheidung: bei zwei Anbietern je ein Musterbuch bestellen, hell und dunkel. Das dunkle Buch (fast
schwarz, Gold) ist im Digitaldruck heikel: Schwarzflächen können fleckig werden, Gold wird nur gelb gedruckt
(kein Metallic).

### Seitenzahl

Ein Buch mit einem Horoskop hat grob 4 Seiten je Horoskop plus etwa 10–12 feste Seiten (Titel, Impressum,
Leitsatz, Einleitung, Hintergrund, Quellen, Rückseite), also unter dem Minimum von 24 (Print API, Prodigi) bzw. 30 (Gelato).
Lösung: mit „Notizen“-Seiten auffüllen (gibt es schon im Buch) oder ein Horoskop nicht einzeln anbieten.

## 2. Bezahlung

**Google Play:** Die Payments-Richtlinie (Abschnitt 3) schließt physische Waren ausdrücklich von der
Play-Abrechnung aus; Abschnitt 4 (keine Links/Webviews zu anderen Zahlungswegen) gilt ausdrücklich nicht für
diese Ausnahme. Ein gedrucktes Buch darf also mit Stripe oder PayPal bezahlt werden, auch per Link aus der App.
Geprüft am 3. 11. 2026 an der Richtlinienseite; keine Änderung für 2026 gefunden. Grenze: Eine PDF-Ausgabe
zum Herunterladen gegen Geld wäre ein digitales Gut und bräuchte Play Billing – also nur das gedruckte Buch
verkaufen (das PDF bleibt wie jetzt kostenlos über „Drucken / PDF“).

| | Stripe Checkout | PayPal Checkout | Peecho-Kasse |
|---|---|---|---|
| Zahlarten | Karte, Google Pay, Apple Pay, EPS (AT), Klarna, auch PayPal (in Stripe zuschaltbar) | PayPal, Karte | Peecho |
| Adresse | Stripe erfasst Lieferadresse und E-Mail auf seiner Seite | ja | ja |
| Belege | Stripe schickt Zahlungsbestätigung; Rechnungen gegen Aufpreis | eigene | Peecho |
| Gebühr (EWR-Karten) | ca. 1,5 % + 0,25 € | ca. 2,5–3,5 % + Fixbetrag | – |
| Einbindung | Checkout-Session am Server erzeugen, URL öffnen, Webhook bestätigt | ähnlich | wahrscheinlich Peecho als Verkäufer (nicht bestätigt) |

**Empfehlung: Stripe Checkout (gehostet), PayPal darin als Zahlart.** Kein eigenes Kartenformular, keine
PCI-Pflichten, die Adresse tippt die Kundin bei Stripe ein, nicht in der App.

In der Capacitor-App öffnet sich die Kasse über `@capacitor/browser` (Chrome Custom Tab, kein eigenes Webview
– so bleibt Google Pay nutzbar und die Seite sichtbar als Stripe). Zurück in die App über eine
`success_url`/`cancel_url` auf eine eigene Seite des Servers, die per App-Link (`https://…/bestellung/…`) oder
eigenes Schema (`tesserakt://bestellung?…`) zurückspringt. Maßgeblich für „bezahlt“ ist nur der Webhook
`checkout.session.completed`, nie die Rückkehr in die App.

## 3. Ablauf

```
App: Auswahl → Buch gesetzt → "Bestellen"
  → POST /bestellung {Buchinhalt, Ausführung, Anzahl}   → Server legt Bestellung an, rendert PDF, prüft Preis
  ← Checkout-URL (Stripe)                                 Stripe-Session mit Betrag + Bestellnummer
Custom Tab: Stripe Checkout (Adresse, E-Mail, Zahlung)
Stripe → Webhook → Server: bezahlt → Auftrag an die Druckerei (PDF-URL, Adresse)
Druckerei → Callback → Server: in Produktion / versandt (Sendungsnummer)
App: Bestellnummer liegt lokal; GET /bestellung/{token} zeigt den Stand
```

### PDF: im Browser oder auf dem Server?

**Empfehlung: auf dem Server, mit derselben Satz-Logik.** Der Server startet ein kopfloses Chromium
(Playwright) und öffnet eine Druckseite des Frontends, die genau `Buch.jsx` rendert; Chromium schreibt das PDF
mit `@page 210 × 210 mm`. Vorteile: gleicher Umbruch wie die Vorschau, Schriften werden eingebettet
(alle verwendeten Schriften – Cinzel, Amiri, Patrick Hand, Caveat, Ma Shan Zheng – stehen unter der SIL OFL,
Einbetten erlaubt), Ergebnis ist reproduzierbar und nicht vom Handy abhängig. `window.print()` im Android-Webview
liefert kein verlässliches druckfertiges PDF.

Damit der Server keine Geburtsdaten braucht, schickt die App den fertigen Buchinhalt (die Bausteine, Grafiken als
SVG-Daten, Titel, Ausführung), nicht Datum und Ort. Auf dem Server sind nur die Daten, die ohnehin gedruckt werden.

Anpassungen am Buch (Druckvorlagen umgesetzt am 4. 11. 2026, in `Buch.jsx` wählbar in der Entwicklung oder mit
`?druckvorlage` in der Adresse):
- [x] Innenteil: Seiten mit Beschnitt rundum (Vorgabe 3 mm, einstellbar), Hintergrund läuft in den Beschnitt,
  ohne Rückseite, mit Notizseiten aufgefüllt auf mindestens 24 und eine gerade Seitenzahl.
- [x] Umschlag als ein Bogen: Rückseite | Rücken | Titelseite, rundum ein Rand für Einschlag und Beschnitt
  (Rücken und Rand in mm einstellbar, bis die Vorgaben der Druckerei feststehen). Rückentitel von unten nach oben.
- [x] Der Bogen bekommt die passende Seitengröße (`@page`), Schriften werden eingebettet.
- [x] Behoben dabei: Schrift und Ränder der Seite bezogen sich auf die Fensterbreite statt auf die Seite (am
  Rechner fast doppelte Schrift, dreimal so viele Seiten); die Gebrauchsspuren der Grundplatte wurden auf jede
  Seite mitgedruckt (PDF über 500 MB).
- [x] Grundschrift: EB Garamond (OFL) wird mitgeliefert (`schriften/EBGaramond-*.woff2`, lateinisch, normal, kursiv,
  fett, fett kursiv). Feste Schnitte statt der variablen Schrift, weil Chrome variable Schriften als Type 3 ins PDF
  einbettet; so landen sie als TrueType im PDF.
- [ ] Ohne Beschnitt (Prodigi): dafür reicht die Vorschau-Ausgabe; noch nicht eigens geprüft.
- [ ] Farbprofil: RGB lassen, die Druckerei rechnet um. Ein PDF/X-4 erzeugt Chromium nicht; Prodigi empfiehlt
  es, verlangt es aber nicht (zu klären am Musterbuch). Notfalls mit Ghostscript nachbearbeiten.

Das PDF muss für die Druckerei per URL abrufbar sein: eine zufällige, lange URL auf dem Server
(`/druck/{zufall}.pdf`), gültig bis zur Bestätigung durch die Druckerei, danach gelöscht.

### Daten, Status, Mails

Neue, getrennte Datenbank `bestellungen.db` (nicht in der Forschungsdatenbank, keine Verbindung zu Runden):

| Feld | Speicherdauer |
|---|---|
| Bestellnummer, Zufalls-Token für die App, Status, Betrag, Stripe-Session-ID, Auftrags-ID der Druckerei, Sendungsnummer | 7 Jahre (Buchhaltung, § 132 BAO), Status-Token kürzer |
| Name, Lieferadresse, E-Mail | liegen bei Stripe; lokal nur bis zur Zustellung + Reklamationsfrist, dann löschen. Rechnung (mit Name, Adresse) 7 Jahre |
| PDF und Buchinhalt | bis zur Annahme durch die Druckerei, höchstens wenige Wochen (für Nachdruck bei Reklamation) |

Mails: für den Anfang keine eigenen. Stripe schickt die Zahlungsbestätigung (mit Rechnung, wenn eingeschaltet),
den Stand zeigt die App über das Token. Später optional eine Versandmail mit Sendungsnummer über einen
EU-Maildienst – das wäre ein weiterer Auftragsverarbeiter.

Betrieb: Für Webhooks muss der Server erreichbar sein; Stripe wiederholt fehlgeschlagene Webhooks bis zu drei
Tage, kurze Ausfälle des GMKtec sind also unkritisch. Geheimnisse (Stripe-Schlüssel, Webhook-Secret,
Schlüssel der Druckerei) nur in `server/.env`, nie im öffentlichen Repo. Zugriffsprotokolle bleiben aus.

### Datenschutzerklärung (`content/recht/de/datenschutz.html`)

Neuer Abschnitt „Wenn du ein Buch bestellst“:
- welche Daten: Name, Lieferadresse, E-Mail, ggf. Telefon (verlangt manche Versandart), Bestellung, Buchinhalt
  (mit Geburtsdatum und -uhrzeit, wie auf dem Impressum gedruckt), Zahlungsstatus (keine Kartendaten)
- Zweck und Rechtsgrundlage: Vertragserfüllung, Art. 6 Abs. 1 lit. b; Aufbewahrung der Rechnung Art. 6 Abs. 1
  lit. c (BAO)
- Empfänger: Stripe (Zahlung; Stripe Payments Europe, Irland), Druckerei (z. B. Print API, NL; bei Prodigi Sitz UK – Angemessenheitsbeschluss
  für das Vereinigte Königreich prüfen), deren Versanddienstleister, ggf. Maildienst
- Speicherdauer wie oben, Rechte (Auskunft, Löschung – hier anders als bei der Forschung, weil zuordenbar)
- „Kurz gesagt“ und „Nie gespeichert“ anpassen: die E-Mail-Adresse steht dort heute als nie gespeichert.
- Klarstellen, dass Bestellung und Forschungsrunde nicht verknüpft werden.

Auch `frontend/src/sprache/de/datenverwendung.md` und die Kommentarzeile in `betrieb.md` mitziehen.

### Play-Formular „Datensicherheit“ (`docs/betrieb.md`)

Zusätzlich anzugeben (erhoben, optional, Zweck „App-Funktionen“; geteilt: ja, mit Zahlungsdienst und Druckerei
zur Vertragserfüllung – Google zählt Dienstleister im Auftrag nicht als Teilen, die Druckerei ist aber eher
eigenständig, daher vorsichtig „geteilt“):

| Datentyp | Was |
|---|---|
| Persönliche Daten → Name | Empfänger |
| Persönliche Daten → E-Mail-Adresse | Bestätigung |
| Persönliche Daten → Adresse | Lieferadresse |
| Persönliche Daten → Telefonnummer | nur falls die Versandart sie verlangt |
| Finanzdaten → Kaufverlauf | Bestellungen |
| App-Aktivitäten → Sonstige Inhalte von Nutzern | Buchinhalt |

Zahlungsinformationen (Karte) nicht, weil die App sie nie sieht (Eingabe bei Stripe im Browser). „Löschen
beantragen“: künftig ja, für Bestelldaten (Mail-Adresse genügt). Die Adresse wird zwar auf Stripes Seite
eingegeben, landet aber über den Webhook auf unserem Server und gehört deshalb ins Formular.

## 4. Rechtliches in Österreich

Nicht abschließend, vor dem Start mit WKO-Gründerservice und Steuerberatung abklären.

- **Gewerbe:** Wer regelmäßig und mit Gewinnabsicht Bücher verkauft, braucht eine Gewerbeberechtigung
  (Handelsgewerbe, freies Gewerbe, Anmeldung online über das GISA). Ohne Gewinnabsicht (Abgabe zum
  Selbstkostenpreis als Belohnung fürs Experiment) ist das fraglich; genau diese Frage der WKO stellen.
  Alternative: ein Verein als Träger des Experiments verkauft.
- **Impressum (§ 5 ECG, § 25 MedienG):** Name, Anschrift (ladungsfähig, kein Postfach), E-Mail, ggf.
  Gewerbebehörde, Kammer, UID-Nummer. Auf einer Webseite und in der App erreichbar. Die Privatadresse wird damit
  öffentlich – Grund, über eine Geschäftsanschrift nachzudenken.
- **AGB:** Vertragspartner, Zustandekommen des Vertrags (Bestellübersicht, „zahlungspflichtig bestellen“),
  Preise inkl. USt. und Versand, Lieferzeit, Gewährleistung (2 Jahre, Fehldrucke → Nachdruck), Hinweis auf
  den fehlenden Rücktritt. Vor dem Bezahlen anzeigen (Link in der Bestellübersicht und in Stripe Checkout
  als „Terms of service“-Zustimmung).
- **Rücktritt/Widerruf:** Kein Rücktrittsrecht für Waren, die nach Kundenspezifikation angefertigt oder
  eindeutig auf die persönlichen Bedürfnisse zugeschnitten sind (§ 18 Abs. 1 Z 3 FAGG). Das personalisierte
  Horoskopbuch fällt darunter. Darüber muss **vor** der Bestellung informiert werden (§ 4 Abs. 1 Z 11 FAGG),
  sonst droht das Rücktrittsrecht doch. Gewährleistung bleibt.
- **Umsatzsteuer:**
  - Kleinunternehmer (Umsatz bis 55.000 € brutto im Jahr, seit 2025): keine USt. auf der Rechnung, Hinweis
    „Umsatzsteuerbefreit – Kleinunternehmer“. Das ist anfangs am einfachsten. Hängt an den übrigen Umsätzen des
    Nutzers.
  - Versand an Privatkunden in andere EU-Länder: bis 10.000 € im Jahr (EU-weit) gilt österreichische USt.; darüber
    die des Ziellands, abzuführen über den One-Stop-Shop (OSS). Stripe Tax könnte rechnen (Gebühr).
  - Steuersatz: Fotobücher mit persönlichen Fotos sind nach EU-Einreihung keine Bücher (KN 4911) → 20 % in AT,
    19 % in DE. Ein überwiegend aus Text bestehendes Horoskopbuch könnte als Buch (KN 4901) gelten → 10 % in AT,
    7 % in DE. **Unklar, Steuerberatung fragen.**
  - Einkauf bei der Druckerei (NL, DE oder SK; bei Prodigi UK): Rechnungsstellung und Reverse Charge klären; die Druckerei liefert aus
    der EU direkt an die Kundin (Reihengeschäft).
- **Produktsicherheit (GPSR, seit Dezember 2024):** gilt auch für Bücher. Im Shop Hersteller bzw.
  verantwortliche Person mit Anschrift angeben. Bei einem Buch geringes Risiko, aber die Angaben braucht es.
- **Verpackung:** In Deutschland verlangt das VerpackG eine Registrierung (LUCID) und Systembeteiligung für jeden,
  der verpackte Ware an Privatkunden schickt; in Österreich gibt es Bagatellgrenzen. Die Druckerei fragen, ob sie das
  als Versender übernehmen.
- **Streitbeilegung:** Die EU-OS-Plattform ist seit Juli 2025 abgeschaltet, der Link entfällt.

## 5. Marke „Tesserakt“

Der Name steht im Test, ein möglicher Konflikt mit „Tesseract“ ist offen (siehe Memory „Markenname offen“).
Ein Shop verschärft das: Wer unter einem Zeichen Waren verkauft, benutzt es geschäftlich – genau dann greifen
ältere Marken, besonders in Klasse 16 (Druckereierzeugnisse, Bücher) und 35 (Online-Handel). Gedruckte Bücher
mit „TESSERAKT“ auf dem Titel (`buch.titelzeichen`) und „© Tesserakt“ im Impressum lassen sich nicht
zurückholen.

Empfehlung:
- Vor dem Verkauf eine Recherche in TMview/EUIPO und beim Österreichischen Patentamt für Klassen 9, 16, 35, 41.
- Was schwer zu ändern ist, neutral halten: Stripe-Kontoname und Abrechnungstext auf dem Kontoauszug, Domain
  des Shops, Absender der Rechnungen. Als Einzelunternehmer ohne Firmenbuch tritt ohnehin der eigene Name auf.
- Den Namen im Buch aus einer Stelle beziehen (ist schon so: Sprachdatei), damit ein Wechsel nur Texte betrifft.
- Solange der Shop nur Testerinnen offensteht und zum Selbstkostenpreis verkauft, ist das Risiko kleiner, aber
  nicht null.

## Preise

Grobe Rechnung je Buch (Hardcover 21 × 21, Versand nach AT, Versand und Prodigi geschätzt):

| | Print API, 1 Horoskop (24 S.) | Print API, 7 Horoskope (≈ 40 S.) | Prodigi, 1 Horoskop | Prodigi, 7 Horoskope |
|---|---|---|---|---|
| Druck netto | 7,17 € | ≈ 10,05 € | ca. 20–22 € | ca. 25–30 € |
| Versand | ca. 6–9 € | ca. 6–9 € | ca. 6–9 € | ca. 6–9 € |
| Stripe | ca. 0,50 € | ca. 0,70 € | ca. 0,70 € | ca. 0,80 € |
| Selbstkosten | **ca. 14–17 €** | **ca. 17–20 €** | ca. 27–32 € | ca. 32–40 € |
| heutige Staffel | 15 € | 30 € | 15 € | 30 € |

Ohne Steuer gerechnet; je nach Steuerstatus kommt USt. dazu (siehe Abschnitt 4). Mit Print API trägt sich die
Staffel ungefähr, wenn der Versand extra berechnet wird; mit Prodigi müsste sie deutlich steigen. `buchpreise.py`
ist schon so gebaut, dass später nur `preise()` geändert werden muss; sinnvoll wäre, Selbstkosten über die
Angebots-API zu holen und einen festen Aufschlag zu rechnen, mit Zwischenspeicher, damit nicht jede Ansicht
die Druckerei fragt.

## Empfohlener Weg und Schritte

1. **Entscheidungen** (siehe offene Fragen), Gewerbe/Steuer klären.
2. **Anfragen und Konten** (durch den Nutzer): Print API (Testumgebung; Produktionsort, Papier, Versand nach
   AT/DE erfragen), Anfragen an Expresta und Happy Foto, Stripe (Testmodus).
3. **Druck-PDF**: Druckseite im Frontend (Buch ohne Bedienleiste, Umschlag mit Rücken, Auffüllen), Rendering mit
   Playwright im Backend-Container (Chromium vergrößert das Abbild um etwa 300–400 MB). Zwei Musterbücher
   bestellen (hell, dunkel), Farbe und Ränder prüfen.
4. **Backend**: `bestellung.py` mit `POST /bestellung`, `POST /stripe/webhook`, `POST /druckerei/callback`,
   `GET /bestellung/{token}`, `bestellungen.db`; Preise aus der Angebots-API in `buchpreise.py`.
5. **App**: „Bestellen“ in `DruckAuswahl.jsx` statt „folgt“: Bestellübersicht mit Preis inkl. Versand, Hinweis
   auf fehlendes Rücktrittsrecht, Links zu AGB und Datenschutz, dann Custom Tab; Bestellstand anzeigen;
   `@capacitor/browser` und App-Link einrichten.
6. **Recht**: Impressum, AGB, Datenschutzerklärung, Play-Formular, `betrieb.md`.
7. **Test** mit Stripe-Testkarten und Testumgebung der Druckerei, dann eine echte Bestellung an sich selbst.
8. Erst dann in den geschlossenen Test (neuer versionCode).

## Offene Fragen an den Nutzer

1. **Preis:** Selbstkosten verlangen (Staffel etwa 29–39 € inkl. Versand), mit Aufschlag, oder bewusst
   zuschießen als Belohnung fürs Mitspielen?
2. **Gewinnabsicht und Träger:** Als Einzelunternehmer mit Gewerbe, ohne Gewinnabsicht, oder über einen Verein?
   Bist du schon Unternehmer (Umsatzgrenze Kleinunternehmer, UID)?
3. **Anschrift im Impressum:** Privatadresse in Ordnung, oder eine Geschäftsanschrift?
4. **Druckerei:** Einverstanden mit Musterbüchern von Print API und einer zweiten Druckerei (Expresta oder
   Happy Foto, je nach Antwort, sonst Prodigi)? Das Format darf vom Quadrat abweichen (geklärt 4. 11.).
5. **Ausführung:** Beide Ausführungen (hell und dunkel) anbieten, auch wenn das dunkle Buch im Digitaldruck
   schwächer wirken könnte?
6. **Ein Horoskop:** Mit Notizseiten auf 24 Seiten auffüllen, oder erst ab zwei Horoskopen bestellbar?
7. **Märkte:** Nur AT/DE (EU) zum Start, oder auch Schweiz, UK, USA (Zoll, andere Steuern, USD-Staffel)?
8. **Mails:** Reicht die Stripe-Bestätigung plus Stand in der App, oder soll es eine eigene Versandmail geben?
9. **Marke:** Recherche zu „Tesserakt“ vor dem Shop beauftragen oder selbst machen? Oder den Shop bis zur Klärung
   ohne den Namen auf Kontoauszug und Domain betreiben?
10. **Server:** Soll der Shop noch auf dem GMKtec laufen, oder erst nach dem Umzug auf einen gemieteten Server mit
    eigener Domain (die Rücksprung-URL der Kasse und das Impressum hängen daran)?

## Quellen (abgerufen 3. 11. 2026)

- Google Play, Payments-Richtlinie: https://support.google.com/googleplay/android-developer/answer/9858738
- Prodigi Hardcover-Fotobuch: https://www.prodigi.com/products/books-and-magazines/hardcover-photo-book/ ,
  Datenblatt https://www.prodigi.com/download/product-range/Prodigi%20Hardcover%20photo%20book.pdf ,
  technischer Leitfaden https://www.prodigi.com/blog/photo-books-technical-guide/ ,
  API https://www.prodigi.com/print-api/docs/reference/
- Gelato Fotobücher: https://www.gelato.com/custom/photo-books/hard-cover-photo-books/hardcover-photo-book ,
  Beschnitt https://support.gelato.com/en/articles/8996355-where-can-i-find-product-dimensions
- Lulu Print API: https://www.lulu.com/print-api/products , Gebühren
  https://help.api.lulu.com/en/support/solutions/articles/64000254631-are-there-fees-to-use-lulu-s-print-api- ,
  Preisrechner https://developers.lulu.com/price-calculator
- Peecho: https://peecho.com/products/books/hardcover , Prodigi übernimmt Fotobücher
  https://www.prodigi.com/blog/photo-books-now-available/
- Print API: https://www.printapi.nl/drukwerk/hardcover-boeken , FAQ https://www.printapi.nl/faq
- CPI Dropshipping: https://cpidirect.cpi-print.de/assets/documents/CPI_Dropshipping_Factsheet_engl_260109.pdf ,
  https://www.cpi-print.de/de/service/print-on-demand
- Expresta: https://www.expresta.at/publishing/print-on-demand-bucher , SDK https://unpkg.com/@expresta/sdk@1.2.0/README.md
- epubli-API: https://www.epubli.de/documentation/api/overview
- Cloudprinter: https://www.cloudprinter.com/print-api
- Flyeralarm Hardcover: https://www.flyeralarm.com/de/p/buecher-hardcover-digitaldruck-4457891.html
- Amazon KDP Druckkosten Hardcover: https://kdp.amazon.com/en_GB/help/topic/G201834340 , Formate
  https://kdp.amazon.com/help/topic/GVBQ3CMEQW3W2VL6
- USt. Fotobücher: https://www.deubner-steuern.de/news/umsatzsteuer/details/artikel/umsatzsteuer-was-gilt-bei-fotobuechern.html ,
  WKO https://www.wko.at/branchen/handel/foto-optik-medizinproduktehandel/Branchengespraeche-in-der-EU.html
