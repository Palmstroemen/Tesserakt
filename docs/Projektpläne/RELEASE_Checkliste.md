# Release-Checkliste

## Stand: 26. Oktober 2026

Was vor dem ersten Release in den App-Stores erledigt sein muss, in der Reihenfolge, in der es angegangen werden
sollte. Zuerst kommt, was lange Wartezeiten hat; Übersetzungen und Feinschliff können zum Teil per Update
nachgereicht werden (jeweils vermerkt).

---

## 1. Sofort anstoßen (lange Vorlaufzeiten)

- [ ] **Google-Play-Entwicklerkonto anlegen** (einmalig 25 USD). Neue private Konten müssen vor der
  Veröffentlichung einen *geschlossenen Test* mit mindestens 12 Testern über 14 Tage durchlaufen: Tester früh
  sammeln (Familie, Freunde, Mitspieler) und den Test so bald wie möglich starten. Ablauf: signiertes App-Paket
  (AAB) in den Testkanal „Geschlossener Test“ hochladen, Tester per Google-Konto-E-Mail oder Google-Gruppe
  eintragen, Einladungslink verschicken; die Tester treten bei und installieren die App ganz normal aus dem Play
  Store (der Eintrag ist nur für sie sichtbar). Google zählt, wer 14 Tage am Stück dabei ist. Danach in der Play
  Console den Zugang zur Produktion beantragen (Fragebogen zum Test). Konten von Organisationen sind davon
  ausgenommen.
- [ ] **Apple-Developer-Programm beitreten** (99 USD pro Jahr). Entscheiden: als Privatperson (schneller, der
  eigene Name steht im Store) oder als Organisation (braucht eine D-U-N-S-Nummer, Tage bis Wochen Vorlauf).
- [ ] **iOS-Build einrichten:** Capacitor-iOS-Projekt anlegen und auf einem Mac mit Xcode bauen, signieren und
  über TestFlight auf ein iPhone bringen. Bisher gibt es nur den Android-Build.
- [ ] **Apple-Prüfung vorbereiten:** Richtlinie 4.3 lehnt Horoskop-Apps als „gesättigte Kategorie“ ab, außer
  sie bieten etwas Eigenes. Store-Beschreibung und Hinweise an die Prüfer so schreiben, dass klar wird:
  Tesserakt ist ein wissenschaftliches Experiment *über* Horoskope, kein Horoskop-Dienst.
- [ ] **Quellcode öffentlich machen (GitHub) und Lizenzen klar regeln:** Damit gilt für die Swiss Ephemeris
  die freie AGPL, eine kommerzielle Lizenz ist nicht nötig. Zugleich kann jeder nachprüfen, was die App tut,
  etwa dass das Kamerabild das Gerät nie verlässt und nur als Licht dient.
  - LICENSE-Dateien anlegen: Backend unter AGPL (Pflicht, es nutzt die Swiss Ephemeris), Frontend/App unter
    MIT (die App enthält keinen AGPL-Code; so gibt es keinen Konflikt mit den App-Store-Bedingungen), Medien
    (Bilder, Film, Kästchen-Render, Buchgestaltung) unter eigener Lizenz, z. B. CC BY-NC.
  - Alle Fremdlizenzen aufführen (Swiss Ephemeris, GeoNames, Schriften, Bibliotheken) mit den geforderten
    Namensnennungen, in der App, im Buch und im Repo.
  - AGPL-Pflicht erfüllen: Link auf den Quellcode in der App (und im Buch); das Repo muss immer dem Stand
    entsprechen, der auf dem Server läuft.
  - Vor dem Veröffentlichen: Repo und Git-Geschichte noch einmal gründlich auf Zugangsdaten und persönliche
    Daten prüfen; Deutungstexte auf längere Passagen aus noch geschützten Büchern prüfen.
  - Regel für Beiträge von außen festlegen (z. B. Zustimmung, dass Beiträge unter den Lizenzen des Repos
    stehen), sonst kann man die App später nicht mehr frei in die Stores stellen oder umlizenzieren.
- [ ] **Schutz gegen Nachahmer** (vor der Veröffentlichung; Punkte a und b kurz mit einer Kanzlei für Marken-
  und Urheberrecht besprechen). Eine Idee ist nicht geschützt, nur ihre Ausführung: Name, Aussehen, Texte, Daten.
  - [ ] a) **EU-Marke „Tesserakt“** beim EUIPO anmelden, *vor* dem Start (der Anmeldetag zählt). Klassen 9 (App),
    16 (Buch), 41 (Spiel, Unterhaltung), 42 (Server-Dienst). Vorher Ähnlichkeitsrecherche: „Tesseract“ ist als
    OCR-Software bekannt (Klasse 9). Dass Nachbauten einen anderen Namen tragen müssen, steht in `LICENSE.md`.
  - [ ] b) **Lizenzen schärfen:** App von MIT auf AGPL umstellen (ein Klon müsste dann seinen ganzen Code
    offenlegen; das geht, solange nur wir Urheber sind; schon unter MIT veröffentlichte Stände bleiben MIT).
    Deutungstexte und Regelwerke (`content/`, Regel-JSONs) als Daten getrennt und restriktiv lizenzieren, z. B.
    CC BY-NC-ND oder „alle Rechte vorbehalten“; prüfen lassen, ob die Trennung von der AGPL der Swiss Ephemeris
    hält. Danach `LICENSE.md`, `README.md` und den Abschnitt „Nachprüfbar“ in der Datenverwendung anpassen.
  - [x] c) **Erkennungsmerkmale** in Regelwerken (Zahlen) und Texten (Wendungen), Signaturen in Uhrwerk und
    Zählwerk. Register nur lokal in `docs/privat/Fallen.md` (vom Repo ausgeschlossen): an einem zweiten Ort
    sichern.
  - [ ] d) **Zeitbeleg:** Prüfsumme von `docs/privat/Fallen.md` und einen Abzug der Texte mit OpenTimestamps
    oder beim Notar hinterlegen. Die Git-Geschichte auf GitHub belegt den Code.
  - [ ] e) **EU-Design (Geschmacksmuster):** Das nicht eingetragene entsteht automatisch für 3 Jahre, wenn die
    Erstveröffentlichung in der EU ist (deshalb zuerst in der EU veröffentlichen). Das eingetragene (bis 25
    Jahre) innerhalb von 12 Monaten nach dem Start anmelden: Datumsscheibe, Fächer, magisches Auge,
    Knopfsymbole, Kästchen, Umschlag und Layout des Buchs.
  - [x] f) **Hinweis zum Experiment** in README und Datenverwendung: Kopien spalten die Stichprobe; wer forkt,
    kann seine Antworten in den gemeinsamen Datenbestand liefern.
- [ ] **Experiment vorregistrieren** (z. B. bei OSF): Hypothese, Messgrößen (Skill, Perzentil) und
  Auswertungsplan öffentlich festhalten, *bevor* die ersten Daten aus dem Release kommen. Geht nur vor dem Start
  und macht die Ergebnisse später glaubwürdig.

## 2. Parallel erarbeiten

- [x] **i18n vorbereiten** (muss zum Release): alle Oberflächentexte aus dem Code in Sprachdateien ziehen,
  Sprache als Parameter an das Backend geben (`/vektor`, Texte, Bildtexte), Datums- und Zahlenformate über die
  Sprache. Ziel: eine neue Sprache ist danach nur noch Übersetzungsarbeit. Erledigt: Sprache vom Gerät, kein
  Schalter; Ablage und Vorgehen in `docs/Konzepte/Sprachen.md`, Prüfung mit `tools/sprachpruefung.py`.
- [ ] **Übersetzungen** (kann per Update kommen): Oberfläche, sichtbare Deutungstexte der Regel-JSONs (rund
  15.000 Wörter), eigene Texte (rund 9.000), Fragen, Bildtexte (eigenes Modul je Sprache) und Buch. Zuerst
  Englisch, Gegenlesen durch Muttersprachler; die Erkennungsmerkmale bekommen eigene Entsprechungen.
  Festlegen, welche Sprachen danach kommen. Stand: Englisch vollständig übersetzt (Glossar
  `docs/Textbausteine/en/GLOSSAR.md`), Gegenlesen durch Muttersprachler steht noch aus.
- [ ] **Texte feintunen:** Systemerklärungen, Bildtexte (zweiter Absatz) und Buchtexte gegenlesen; Ton
  vereinheitlichen; ehrliche Formulierungen beibehalten; „Horoskope“ statt „System“ in sichtbaren Texten.
- [ ] **Buch-Druckpartner finden und testen:** Anbieter für Print-on-Demand vergleichen (Qualität, Format,
  Versand in welche Länder, Schnittstelle für automatische Aufträge), Probedrucke bestellen, entscheiden.
- [ ] **Datenschutz und rechtliche Seiten:** Datenschutzerklärung (Kamerabild bleibt am Gerät, gespeicherte
  Antworten, Forschungseinwilligung, Widerruf), Impressum, Datenschutzangaben in beiden Stores („Data Safety“
  bei Google, „App Privacy“ bei Apple), iOS-Begründungstext für den Kamerazugriff.

## 3. Danach (hängt an Punkten oben)

- [ ] **Bezahlung des Buchs festlegen:** Das gedruckte Buch ist eine physische Ware und darf über eine eigene
  Zahlung laufen (z. B. Stripe), ohne die Abgabe an Apple oder Google. Ein digitales Buch (PDF) in der App
  müsste über In-App-Kauf laufen (15–30 % Abzug). Entscheiden, ob es überhaupt eine digitale Ausgabe gibt.
- [ ] **Buchpreise festlegen:** nach Druck- und Versandkosten des gewählten Partners und der Zahlungsart, je
  Markt und Währung. Die App holt Preis, Währung und Aktionen vom Server (`GET /buch/preise`, Markt aus der
  Zeitzone des Geräts); bis zur Anbindung des Druckpartners stehen sie in `content/buch/preise.json` (USD
  sind Platzhalter). Danach liefert sie der Shop des Partners, geändert wird nur `backend/buchpreise.py`.
- [ ] **Forschungsdatenbank als OpenData bereitstellen:** Datum, Uhrzeit und Ort zusammen identifizieren einen
  Menschen fast eindeutig, daher vor der Veröffentlichung vergröbern (z. B. nur Jahr oder Monat, Region statt
  Ort, keine Minuten) und auf Wiedererkennbarkeit prüfen. Lizenz wählen (z. B. CC BY), Datensätze versionieren,
  Datenbeschreibung schreiben, regelmäßige Abzüge veröffentlichen.
- [ ] **Betrieb des Backends:** Hosting mit genug Reserve, Backups der Forschungsdaten, Überwachung und
  Fehlermeldungen. Den Einführungsfilm online hosten (einfacher Player, offline überspringen).
- [ ] **Server nur für die echte App:** Play Integrity (Android) und App Attest (iOS) einbinden, damit der Server
  nur signierten Tesserakt-Apps aus den Stores antwortet; ein Klon muss dann einen eigenen Server betreiben und
  wegen der AGPL dessen Quellcode offenlegen. Dazu eine Ratenbegrenzung je Gerät gegen das massenhafte Abgreifen
  der Texte. Ein Schlüssel in der App allein hilft nicht, er lässt sich auslesen. (Kann kurz nach dem Start
  kommen.)
- [ ] **Wasserzeichen im Buch:** jedes Exemplar mit einer unsichtbaren Kennung (z. B. kleine Abwandlung in einem
  Ornament), damit sich ein weitergereichtes PDF zurückverfolgen lässt.
- [ ] **Tests auf echten Geräten:** Android-Handy (bisher keines), iPhone als App (bisher nur im Browser), ein
  kleines und ein großes Gerät; Kamera-Durchlicht, Flips und Uhrwerk auf Flüssigkeit prüfen.
- [ ] **Store-Material:** Screenshots je Gerätegröße, Beschreibungstexte, Altersfreigabe, App-Symbol,
  Kategorie.

## 4. Laufend

- [ ] **Kleinere GUI-Tweaks:** sammeln und nach Wichtigkeit abarbeiten, bis zum Release und danach.
