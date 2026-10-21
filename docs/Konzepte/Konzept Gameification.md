# Gamification und progressive Belohnung
## Spiel A als Ausbauphase

*Harmonisierte Fassung*  
*Stand: Februar 2026*

---

## 1. Rolle im Produkt

Dieses Dokument beschreibt den **Gamification-Ausbau** für Spiel A.

- Es erweitert den bestehenden MVP-Flow.
- Es ersetzt nicht die Kernmetriken (Skill/Perzentil/Fit), sondern inszeniert sie.
- Es ist mit der SSOT (`Vorlage zur Harmonisierung der Texte.md`) abgestimmt.

**Status:** Phase 2  
**Abhängigkeiten:** Frontend-Flow, Content, Telemetrie

---

## 2. Ziel der Gamification

- Abbrüche reduzieren.
- Schrittweise Erklärung der Systeme liefern.
- Wahrnehmbaren Fortschritt vor dem Endranking schaffen.

Nebenwirkung:
- Bessere Datenqualität durch mehr abgeschlossene Sessions.

**Status:** Phase 2  
**Abhängigkeiten:** Frageverlauf, Zwischenresultate, UX-Messaging

---

## 3. Verbindliche Begriffe und Metriken

In allen Zwischen- und Endansichten gelten:

- **Skill** (Kernmetrik, 0 = Zufallsniveau)
- **Perzentil**
- **Fit (absolut)**

Gewinner-Regel:
- Wo ein Sieger gezeigt wird, auch zeigen, welchen Skill der Sieger ohne Aussagekraft erreichen würde
  (bei 7 Systemen ~+75).

Nicht als primare Anzeige:
- `Rank-Score`

**Status:** verbindlich  
**Abhängigkeiten:** Rating-Backend, Ergebnis-UI

---

## 4. Empfohlene Freischaltstrategie

Es gibt zwei denkbare Modelle:

- **Variante A (grobe Stufen):** wenige größere Freischaltungen.
- **Variante B (feingranular):** systemweise Freischaltungen.

Empfehlung:
- Mobile default: Variante B
- Desktop optional: Variante A oder "Expert Mode"

**Status:** Phase 2 Entscheidung  
**Abhängigkeiten:** UX-Tests, Produktmetriken

---

## 5. Zielstruktur für Variante B (empfohlen)

### 5.1 Grundlogik

- Jedes System bekommt eine interne Konfidenz.
- Freischaltung erfolgt, wenn systemrelevante Dimensionen ausreichend abgedeckt sind.
- Nutzer sieht einfache Fortschrittssignale, keine technische Komplexität.

### 5.2 Reihenfolge (Vorschlag)

1. Bazi
2. Westlich
3. Numerologie
4. Kabbalah
5. Hellenistisch
6. Arabisch
7. Vedisch
8. Finale: gesamtes Ranking inkl. Aufklärung (Vergleich mit anderen Geburtsdaten, Gewinner-Effekt)

Hinweis:
- Die finale Reihenfolge bleibt ein Product-Entscheid.

**Status:** Phase 2  
**Abhängigkeiten:** Konfidenzmodell, Contentbausteine, Localisation

---

## 6. Didaktik pro Freischaltung

Jede Freischaltung nutzt denselben Rahmen:

1. **Kurzkontext** (2-4 Sätze, neutral).
2. **System-Teilresultat** (mit Skill-Teilaspekt).
3. **Weiterer Anreiz** (nächste Freischaltung).

Didaktikstufen:
- Stufe 1: neutral und erklärend.
- Stufe 2: erste Unterschiede/Widersprueche.
- Stufe 3: methodische Aufklärung (Kontrollgruppe, Gewinner-Effekt).

**Status:** Phase 2  
**Abhängigkeiten:** Contentredaktion, UI-Komponenten

---

## 7. Konfidenzmodell (konzeptionell)

- Konfidenz je System basiert auf Abdeckung seiner Kerndimensionen.
- Mindestens 2 gute Datenpunkte pro Kerndimension als Ziel.
- Freischaltschwelle als Produktparameter (z. B. 0.65), nicht fest im Wording.

Wichtig:
- Konfidenz steuert **nur** Freischaltungen.
- Ranking basiert weiterhin auf Skill.

**Status:** Phase 2  
**Abhängigkeiten:** Fragen-Mapping, Telemetrie, A/B-Tests

---

## 8. UX-Textregeln

- Kurz und konkret.
- Nicht missionarisch.
- Keine Uberladung mit Fachbegriffen.
- Jede Seite sagt klar, was jetzt sichtbar ist und was als Nächstes folgt.

**Status:** Phase 2  
**Abhängigkeiten:** Copywriting, QA

---

## 9. Offene Entscheidungen

1. Finale Systemreihenfolge für Variante B.
2. Umfang pro Freischaltseite (Text vs Visualisierung).

**Status:** offen  
**Abhängigkeiten:** Product, Content, Research

---

## 10. Was gilt jetzt

- Dieses Dokument beschreibt den geplanten Gamification-Ausbau, nicht den aktuellen MVP.
- Verbindliche Metrik- und Begriffsdefinitionen kommen aus `Vorlage zur Harmonisierung der Texte.md`.
- Alle Freischaltungsmechaniken müssen Skill/Perzentil/Fit konsistent darstellen.

