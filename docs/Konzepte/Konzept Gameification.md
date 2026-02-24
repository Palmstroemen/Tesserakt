# Gamification und progressive Belohnung
## Spiel A als Ausbauphase

*Harmonisierte Fassung*  
*Stand: Februar 2026*

---

## 1. Rolle im Produkt

Dieses Dokument beschreibt den **Gamification-Ausbau** fuer Spiel A.

- Es erweitert den bestehenden MVP-Flow.
- Es ersetzt nicht die Kernmetriken (Fit/Skill/KO), sondern inszeniert sie.
- Es ist mit der SSOT (`harmonisierung_vorlage.md`) abgestimmt.

**Status:** Phase 2  
**Abhaengigkeiten:** Frontend-Flow, Content, Telemetrie

---

## 2. Ziel der Gamification

- Abbrueche reduzieren.
- Schrittweise Erklaerung der Systeme liefern.
- Wahrnehmbaren Fortschritt vor dem Endranking schaffen.

Nebenwirkung:
- Bessere Datenqualitaet durch mehr abgeschlossene Sessions.

**Status:** Phase 2  
**Abhaengigkeiten:** Frageverlauf, Zwischenresultate, UX-Messaging

---

## 3. Verbindliche Begriffe und Metriken

In allen Zwischen- und Endansichten gelten:

- **Fit (absolut)**
- **Skill vs Zufall**
- **Delta zu KO** (Fit/Skill)

KO-Regel:
- KO ist methodischer Vergleichsanker und bleibt im finalen Ranking immer unten.

Nicht als primare Anzeige:
- `Rank-Score`

**Status:** verbindlich  
**Abhaengigkeiten:** Rating-Backend, Ergebnis-UI

---

## 4. Empfohlene Freischaltstrategie

Es gibt zwei denkbare Modelle:

- **Variante A (grobe Stufen):** wenige groessere Freischaltungen.
- **Variante B (feingranular):** systemweise Freischaltungen.

Empfehlung:
- Mobile default: Variante B
- Desktop optional: Variante A oder "Expert Mode"

**Status:** Phase 2 Entscheidung  
**Abhaengigkeiten:** UX-Tests, Produktmetriken

---

## 5. Zielstruktur fuer Variante B (empfohlen)

### 5.1 Grundlogik

- Jedes System bekommt eine interne Konfidenz.
- Freischaltung erfolgt, wenn systemrelevante Dimensionen ausreichend abgedeckt sind.
- Nutzer sieht einfache Fortschrittssignale, keine technische Komplexitaet.

### 5.2 Reihenfolge (Vorschlag)

1. Bazi
2. Westlich
3. Numerologie
4. Kabbalah
5. Hellenistisch
6. Arabisch
7. Vedisch
8. Finale: gesamtes Ranking inkl. KO-Aufklaerung

Hinweis:
- Die finale Reihenfolge bleibt ein Product-Entscheid.

**Status:** Phase 2  
**Abhaengigkeiten:** Konfidenzmodell, Contentbausteine, Localisation

---

## 6. Didaktik pro Freischaltung

Jede Freischaltung nutzt denselben Rahmen:

1. **Kurzkontext** (2-4 Saetze, neutral).
2. **System-Teilresultat** (mit Fit/Skill-Teilaspekt).
3. **Weiterer Anreiz** (naechste Freischaltung).

Didaktikstufen:
- Stufe 1: neutral und erklaerend.
- Stufe 2: erste Unterschiede/Widersprueche.
- Stufe 3: methodische Aufklaerung mit KO.

**Status:** Phase 2  
**Abhaengigkeiten:** Contentredaktion, UI-Komponenten

---

## 7. Konfidenzmodell (konzeptionell)

- Konfidenz je System basiert auf Abdeckung seiner Kerndimensionen.
- Mindestens 2 gute Datenpunkte pro Kerndimension als Ziel.
- Freischaltschwelle als Produktparameter (z. B. 0.65), nicht fest im Wording.

Wichtig:
- Konfidenz steuert **nur** Freischaltungen.
- Ranking basiert weiterhin auf Fit/Skill/KO.

**Status:** Phase 2  
**Abhaengigkeiten:** Fragen-Mapping, Telemetrie, A/B-Tests

---

## 8. UX-Textregeln

- Kurz und konkret.
- Nicht missionarisch.
- Keine Uberladung mit Fachbegriffen.
- Jede Seite sagt klar, was jetzt sichtbar ist und was als Naechstes folgt.

**Status:** Phase 2  
**Abhaengigkeiten:** Copywriting, QA

---

## 9. Offene Entscheidungen

1. Finale Systemreihenfolge fuer Variante B.
2. KO-Storyname im Reveal (falls nicht nur "Kontrollgruppe").
3. Umfang pro Freischaltseite (Text vs Visualisierung).

**Status:** offen  
**Abhaengigkeiten:** Product, Content, Research

---

## 10. Was gilt jetzt

- Dieses Dokument beschreibt den geplanten Gamification-Ausbau, nicht den aktuellen MVP.
- Verbindliche Metrik- und Begriffsdefinitionen kommen aus `harmonisierung_vorlage.md`.
- Alle Freischaltungsmechaniken muessen Fit/Skill/KO konsistent darstellen.

