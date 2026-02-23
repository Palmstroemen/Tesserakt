# Horoskop Assessment - Spieldesign, Regeln und Logiken

*Konsolidierte Markdown-Fassung*  
*Quelle: `spieldesign.docx` (Archiv), harmonisiert mit SSOT*

---

## 1. Vision und Ziele

Horoskop Assessment verbindet Spielerlebnis mit Citizen-Science:

- Nutzer beantworten Fragen zu Persoenlichkeit und (spaeter) Zeitfenstern/Beziehungen.
- Mehrere Systeme werden gegen Selbsteinschaetzung verglichen.
- Eine Kontrollgruppe (`KO`) prueft, ob Systeme besser als Zufall abschneiden.

### 1.1 Kernziele

- **Unterhaltung**: persoenliches Ergebnis und interaktives Feedback.
- **Aufklaerung**: transparente Unterschiede zwischen Systemen inklusive KO.
- **Forschung**: anonymisierte, aggregierte Auswertung ueber viele Sessions.

**Status:** MVP + langfristig  
**Abhaengigkeiten:** Content, UI, Daten

---

## 2. Spielmodi und Produktstatus

### 2.1 Spiel A - Persoenlichkeit

- 1 Person, Geburtsdaten, Frageflow, Systemvergleich.
- Aktuell spielbar und Kern des Produkts.

**Status:** MVP live  
**Abhaengigkeiten:** Backend, Frontend, Matrix/Fragen

### 2.2 Spiel B - Prognose/Zeit

- 1 Person, Rueckblick auf Zeitfenster mit dynamischer Fragenauswahl.
- Nicht live; Konzept fuer Phase 2/3.

**Status:** Phase 2/3  
**Abhaengigkeiten:** Zeitvektoren, Fragegenerator, UX-Flows

### 2.3 Spiel C - Beziehung

- 2 Personen, Kompatibilitaetslogik, optionaler Session-Link zu Spiel A.
- Nicht live; Konzept fuer Phase 3.

**Status:** Phase 3  
**Abhaengigkeiten:** Datenmodell C, Regelwerke, Datenschutzflow

---

## 3. Metriken und Auswertung (verbindlich)

### 3.1 Primare Metriken

- **Fit (absolut)**: absolute Naehe zur Selbsteinschaetzung.
- **Skill vs Zufall**: Leistung relativ zur Zufalls-Baseline.
- **Delta zu KO**: Abstand eines Systems zu KO in Fit und Skill.

### 3.2 Bewertungsprinzip

1. Fehler wird pro Frage aus Nutzerwert und Systemwert berechnet.
2. Gewichtung erfolgt ueber Dimensionsabdeckung/Fragegewicht.
3. Nicht abgedeckte Dimensionen werden fuer ein System nicht unfaier gewertet.
4. KO ist Vergleichsanker und wird immer am Tabellenende angezeigt.

### 3.3 Nicht mehr als Leitmetrik

- `Rank-Score` wird nicht als primaere Kommunikationsmetrik gefuehrt.

**Status:** MVP live  
**Abhaengigkeiten:** Rating-Logik, Matrix, Ergebnis-UI

---

## 4. Spielablauf (konsolidiert)

## 4.1 Aktueller MVP-Flow

1. Geburtsdaten eingeben.
2. Spiel waehlen (A spielbar, B/C als coming soon).
3. Systeme waehlen (Default: Westlich, Bazi, Numerologie; erweiterbar).
4. Fragen beantworten (Spiel A, randomisierte Reihenfolge).
5. Ergebnisse mit Fit/Skill/KO-Deltas anzeigen.

**Status:** MVP live  
**Abhaengigkeiten:** Frontend Flow, API Endpunkte, Persistenz

## 4.2 Geplanter Ausbau

- Progressive Freischaltungen und didaktische Zwischenerklaerungen.
- Zeitfenster-Bloecke fuer Spiel B mit anti-redundanter Auswahl.
- Erweiterte Beziehungsauswertung fuer Spiel C.

**Status:** Phase 2/3  
**Abhaengigkeiten:** Content-System, Frage-Engine, C-Modelle

---

## 5. Systeme (einheitliche Liste)

- Westlich
- Bazi
- Numerologie
- Kabbalah
- Arabisch
- Hellenistisch
- Japanisch
- KO (Kontrollgruppe, keine Weissagelogik)

Hinweis: Der oeffentliche Name fuer "Japanisch" kann spaeter als Produktentscheidung angepasst werden, intern bleibt die Benennung konsistent.

**Status:** MVP live (A), erweitert in B/C  
**Abhaengigkeiten:** Regeldateien, Diagnosetools, UX-Texte

---

## 6. Kontrollgruppe (KO)

- KO erzeugt deterministische Zufallswerte (reproduzierbar).
- KO wird als methodischer Vergleichsanker gefuehrt.
- Aufklaerung ueber KO bleibt fester Teil des didaktischen Designs.

**Status:** MVP live  
**Abhaengigkeiten:** Backend-Seedlogik, Ergebnisdarstellung

---

## 7. Datenschutz und Datenhaltung (konsolidiert)

- Keine verpflichtenden Accounts fuer den Kernflow.
- Datenverarbeitung zweckgebunden fuer Spielauswertung.
- Bei Spiel C: explizite Zustimmung fuer Daten der zweiten Person.
- Oeffentliche Auswertungen nur aggregiert/anonymisiert.

**Status:** MVP teilweise (A), erweitert fuer C in Phase 3  
**Abhaengigkeiten:** DB-Schema, Consent-Flow, Exportregeln

---

## 8. Roadmap (kompakt)

- **Phase 1 (MVP):** stabiler Spiel-A-Flow, transparente Metriken, KO-Vergleich.
- **Phase 2:** Gamification/Freischaltungen, Zeitmodus B.
- **Phase 3:** Beziehungsspiel C inkl. optionaler Verknuepfungen und erweiterten Modulen.

**Status:** aktiv  
**Abhaengigkeiten:** Priorisierung, Content-Produktion, QA

---

## 9. Was gilt jetzt

- Verbindliche Referenz fuer Terminologie und Metriken ist `harmonisierung_vorlage.md`.
- Diese Datei ersetzt `spieldesign.docx` als aktive Arbeitsgrundlage.
- DOCX bleibt Archivquelle und wird nicht mehr redaktionell fortgefuehrt.

