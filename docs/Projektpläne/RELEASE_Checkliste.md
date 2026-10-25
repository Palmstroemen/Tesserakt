# Release-Checkliste

## Stand: 25. Oktober 2026

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
- [ ] **Namen „Tesserakt“ schützen:** Die Code-Lizenzen schützen den Namen nicht. Markenanmeldung prüfen
  (Österreich bzw. EU-Marke) und im README festhalten, dass Nachbauten einen anderen Namen tragen müssen.
- [ ] **Experiment vorregistrieren** (z. B. bei OSF): Hypothese, Messgrößen (Skill, Perzentil) und
  Auswertungsplan öffentlich festhalten, *bevor* die ersten Daten aus dem Release kommen. Geht nur vor dem Start
  und macht die Ergebnisse später glaubwürdig.

## 2. Parallel erarbeiten

- [ ] **i18n vorbereiten** (muss zum Release): alle Oberflächentexte aus dem Code in Sprachdateien ziehen,
  Sprache als Parameter an das Backend geben (`/vektor`, Texte, Bildtexte), Datums- und Zahlenformate über die
  Sprache. Ziel: eine neue Sprache ist danach nur noch Übersetzungsarbeit.
- [ ] **Übersetzungen** (kann per Update kommen): Oberfläche, Deutungstexte der Regel-JSONs, Bildtexte und Buch.
  Festlegen, welche Sprachen zuerst kommen.
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
- [ ] **Buchpreise festlegen:** nach Druck- und Versandkosten des gewählten Partners und der Zahlungsart.
- [ ] **Forschungsdatenbank als OpenData bereitstellen:** Datum, Uhrzeit und Ort zusammen identifizieren einen
  Menschen fast eindeutig, daher vor der Veröffentlichung vergröbern (z. B. nur Jahr oder Monat, Region statt
  Ort, keine Minuten) und auf Wiedererkennbarkeit prüfen. Lizenz wählen (z. B. CC BY), Datensätze versionieren,
  Datenbeschreibung schreiben, regelmäßige Abzüge veröffentlichen.
- [ ] **Betrieb des Backends:** Hosting mit genug Reserve, Backups der Forschungsdaten, Überwachung und
  Fehlermeldungen. Den Einführungsfilm online hosten (einfacher Player, offline überspringen).
- [ ] **Tests auf echten Geräten:** Android-Handy (bisher keines), iPhone als App (bisher nur im Browser), ein
  kleines und ein großes Gerät; Kamera-Durchlicht, Flips und Uhrwerk auf Flüssigkeit prüfen.
- [ ] **Store-Material:** Screenshots je Gerätegröße, Beschreibungstexte, Altersfreigabe, App-Symbol,
  Kategorie.

## 4. Laufend

- [ ] **Kleinere GUI-Tweaks:** sammeln und nach Wichtigkeit abarbeiten, bis zum Release und danach.
