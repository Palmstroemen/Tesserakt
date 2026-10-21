# Tesserakt - Spieldesign, Regeln und Logiken

*Konsolidierte Markdown-Fassung*  
*Quelle: `spieldesign.docx` (Archiv), harmonisiert mit SSOT*

---

## 1. Vision und Ziele

Tesserakt verbindet Spielerlebnis mit Citizen-Science:

- Nutzer beantworten Fragen zu Persönlichkeit und (später) Zeitfenstern/Beziehungen.
- Mehrere Systeme werden gegen Selbsteinschätzung verglichen.
- Jedes System wird zusätzlich für zufällige andere Geburtsdaten berechnet (Kontrollgruppe je System).
  So wird geprüft, ob das eigene Geburtsdatum besser passt als ein beliebiges.

### 1.1 Kernziele

- **Unterhaltung**: persönliches Ergebnis und interaktives Feedback.
- **Aufklärung**: transparente Unterschiede zwischen Systemen und ehrlicher Umgang mit Zufallstreffern.
- **Forschung**: anonymisierte, aggregierte Auswertung über viele Sessions.
- **Monetarisierug**: premium-Version könnte das 'mühsame' Fragespiel umgehen und direkt Horoskope erstellen, eventuell einige Personen speicherbar (Familie), individuelle Geschenkbücher personalisiert und konfigurierbar (welche Systeme. 1 System 15€, 2 Systeme 20€, ... Verschiedene Cover)  

**Status:** MVP + langfristig  
**Abhängigkeiten:** Content, UI, Daten

---

## 2. Spielmodi und Produktstatus

### 2.1 Spiel A - Persönlichkeit

- 1 Person, Geburtsdaten, Frageflow, Systemvergleich.
- Aktuell spielbar und Kern des Produkts.

**Status:** MVP live  
**Abhängigkeiten:** Backend, Frontend, Matrix/Fragen

### 2.2 Spiel B - Prognose/Zeit

- 1 Person, Rückblick auf Zeitfenster (letzter Monat, letztes Quartal).
- Frage: Hätte das Horoskop für den vergangenen Zeitraum gestimmt? Alle sieben Systeme spielen mit.
- Nicht live; Konzept: `Konzept Spiel B.md`.

**Status:** Phase 2/3  
**Abhängigkeiten:** Zeitvektoren, Fragegenerator, UX-Flows

### 2.3 Spiel C - Beziehung

- 2 Personen, vergleichende Fragen ("eher ich ... eher Partner:in") gegen den Unterschied der Horoskope.
- Skill gegen 100 zufällige Paare; Einwilligungs-Häkchen für die Daten der Partnerperson.
- MVP umgesetzt; Konzept: `Konzept Spiel C.md`.

**Status:** Phase 3  
**Abhängigkeiten:** Datenmodell C, Regelwerke, Datenschutzflow

---

## 3. Metriken und Auswertung (verbindlich)

### 3.1 Primare Metriken

- **Skill** (Kernmetrik): `2 * (Perzentil - 50)`, Skala -100..+100, 0 = Zufallsniveau.
- **Perzentil**: Anteil von 100 zufälligen anderen Geburtsdaten, deren Horoskop desselben Systems
  schlechter zu den Antworten passt als das eigene.
- **Fit (absolut)**: absolute Nähe zur Selbsteinschätzung (anschaulicher Zusatzwert).

### 3.2 Bewertungsprinzip

1. Fehler wird pro Frage aus Nutzerwert und Systemwert berechnet.
2. Gewichtung erfolgt über Dimensionsabdeckung/Fragegewicht (`backend/fragen.json`).
3. Derselbe Fehler wird für jedes Kontroll-Geburtsdatum berechnet; daraus folgt das Perzentil.
4. Ohne Aussagekraft liegt Skill je System im Mittel bei 0; der Sieger von 7 Systemen
   erreicht trotzdem im Mittel ~+75. Das wird im Ergebnis erklärt.

### 3.3 Nicht mehr verwendet

- `Rank-Score` als primäre Kommunikationsmetrik.
- KO (gemeinsame Zufalls-Kontrollgruppe), "Skill vs Zufall" mit Baseline 2/3 und "Delta zu KO".

**Status:** MVP live  
**Abhängigkeiten:** Rating-Logik, Matrix, Ergebnis-UI

---

## 4. Spielablauf (konsolidiert)

## 4.1 Aktueller MVP-Flow

1. Geburtsdaten eingeben.
2. Spiel wählen (A spielbar, B/C als coming soon).
3. Systeme wählen (Default: alle Systeme; einzelne abwählbar).
4. Fragen beantworten (Spiel A, randomisierte Reihenfolge); dabei rechnet das Backend die Kontrollgruppe.
5. Ergebnisse nach Skill anzeigen (mit Perzentil, Fit und Hinweis zum Gewinner-Effekt).

**Status:** MVP live  
**Abhängigkeiten:** Frontend Flow, API Endpunkte, Persistenz

## 4.2 Geplanter Ausbau

- Progressive Freischaltungen und didaktische Zwischenerklärungen.
- Zeitfenster-Blöcke für Spiel B mit anti-redundanter Auswahl.
- Erweiterte Beziehungsauswertung für Spiel C.

**Status:** Phase 2/3  
**Abhängigkeiten:** Content-System, Frage-Engine, C-Modelle

---

## 5. Systeme (einheitliche Liste)

- Westlich
- Bazi
- Numerologie
- Kabbalah
- Arabisch
- Hellenistisch
- Vedisch

Hinweis: Der öffentliche Name für "Vedisch" kann später als Produktentscheidung angepasst werden, intern bleibt die Benennung konsistent.

**Status:** MVP live (A), erweitert in B/C  
**Abhängigkeiten:** Regeldateien, Diagnosetools, UX-Texte

---

## 6. Kontrollgruppe (je System)

- Jedes System wird für 100 zufällige andere Geburtsdaten berechnet (+-5 Jahre, gleiche Uhrzeit,
  gleicher Ort, gleiches Geschlecht/Name), reproduzierbar per Seed aus der `session_id`.
- Die Kontrollvektoren werden nicht gespeichert, nur Perzentil und Skill (plus Parameter zur Reproduktion).
- Aufklärung über den Vergleich mit anderen Geburtsdaten und den Gewinner-Effekt bleibt fester
  Teil des didaktischen Designs (`docs/Textbausteine/erklaerungen/01_skill.md`).

**Status:** MVP live  
**Abhängigkeiten:** Backend-Seedlogik, Ergebnisdarstellung

---

## 7. Datenschutz und Datenhaltung (konsolidiert)

- Keine verpflichtenden Accounts für den Kernflow.
- Datenverarbeitung zweckgebunden für Spielauswertung.
- Bei Spiel C: explizite Zustimmung für Daten der zweiten Person.
- Öffentliche Auswertungen nur aggregiert/anonymisiert.

**Status:** MVP teilweise (A), erweitert für C in Phase 3  
**Abhängigkeiten:** DB-Schema, Consent-Flow, Exportregeln

---

## 8. Roadmap (kompakt)

- **Phase 1 (MVP):** stabiler Spiel-A-Flow, transparente Metriken, Kontrollgruppe je System.
- **Phase 2:** Gamification/Freischaltungen, Zeitmodus B.
- **Phase 3:** Beziehungsspiel C inkl. optionaler Verknüpfungen und erweiterten Modulen.

**Status:** aktiv  
**Abhängigkeiten:** Priorisierung, Content-Produktion, QA

---

## 9. Was gilt jetzt

- Verbindliche Referenz für Terminologie und Metriken ist `Vorlage zur Harmonisierung der Texte.md`.
- Diese Datei ersetzt `spieldesign.docx` als aktive Arbeitsgrundlage.
- DOCX bleibt Archivquelle und wird nicht mehr redaktionell fortgeführt.

