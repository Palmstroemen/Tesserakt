# Spiel C - Beziehungshoroskop
## Konzept und Datenmodell (harmonisiert)

*Tesserakt - Drittes Spiel*  
*Stand: Oktober 2026, MVP umgesetzt (Backend /partner, /partner/kontrolle; Frontend SpielC.jsx)*

---

## 1. Zielbild

Spiel C fragt **vergleichend**: Wer von euch beiden ist in welchem Lebensbereich stärker ausgeprägt
("Wer zeigt Zuneigung im Alltag eher offen?" - eher ich ... ausgewogen ... eher Partner:in).
Verglichen wird mit dem **Unterschied der beiden Horoskope** je System: `(B - A) / 2`.

Kernfrage:
> Erkennt ein System, wer von euch in welchem Bereich stärker ist - besser als bei zufälligen Paaren?

**Status:** Phase 3  
**Abhängigkeiten:** Datenmodell C, Regelwerke, UI-Flow, Consent

---

## 2. Beziehung zu Spiel A und B

| Merkmal | Spiel A | Spiel B | Spiel C |
|---|---|---|---|
| Personen | 1 | 1 | 2 |
| Fokus | Persönlichkeit | Zeitfenster | Kompatibilität |
| Zeitbezug | Natal | Rückblick | Natal |
| Datenbasis | Geburtsdaten + Antworten | Geburtsdaten + Zeitfragen | Geburtsdaten beider + Beziehungsfragen |
| Kontrollgruppe je System | 100 zufällige Geburtsdaten | wie A, je Zeitfenster | 100 zufällige Paare |

Hinweis:
- Spiel C ist eigenständig nutzbar.
- Optional können A-Sessions über Codes verknüpft werden.

**Status:** Phase 3  
**Abhängigkeiten:** Session-Linking, Datenschema, API

---

## 3. Metrik (umgesetzt)

- **Skill** = `2 * (Perzentil - 50)`, Perzentil gegen **100 zufällige Paare**: beide Geburtsdaten
  zufällig im Fenster +-5 Jahre um das jeweils echte Datum (gleiche Uhrzeit, gleicher Ort, gleiches
  Geschlecht; Seeds `session_id:kontrolle_a` / `session_id:kontrolle_b`, Paar i = (A_i, B_i)).
- Entschieden (Oktober 2026): Variante "beide zufällig". Symmetrisch (wer A, wer B ist, spielt keine
  Rolle) und passend zur Frage nach dem Paar. Alternativen (nur Partner bzw. nur ich zufällig) wären
  ebenfalls fair, beantworten aber die Frage nach einer Einzelperson.
- Fragen: `backend/fragen_beziehung.json` (Katalog `beziehung_v1`, ids 401-416), Gewichte wie Spiel A
  über die Konsens-Matrix. Bewertung mit derselben Funktion wie Spiel A (`calculateRating`).
- Sessions werden gespeichert (`spieltyp: "Beziehung"`).

Vorher (Prototyp bis Oktober 2026): alte Baseline-Metrik (1/6), Bazi doppelt als "Bazi_male" und
"Bazi_female", keine Speicherung, kein Ort und keine Zeitzone für die Partnerperson.

**Status:** umgesetzt
**Abhängigkeiten:** -

---

## 4. Datenmodell (Must-have)

### 4.1 Designprinzip

- Kein verpflichtendes Account-System.
- Optionale, schwache Verknüpfung über Session-Code aus Spiel A.
- Datenschutzfreundliche Defaults.

### 4.2 Kernobjekte

1. `beziehungs_sessions`
   - Metadaten der Beziehung
   - Geburtsdaten A/B
   - optionale Session-Links
   - vorab berechnete Kompatibilität (JSON)
2. `beziehungs_antworten`
   - Fragebezug
   - wer antwortet (`a`, `b`, `beide`)
   - Antwortwert und Systemwerte pro Frage

### 4.3 Mindestfelder (fachlich)

- Beziehungstyp
- Geburtsdaten A/B
- Consent-Flags
- Abschlussstatus und Antwortanzahl
- Ergebnisstruktur für Systemvergleich (Skill, Perzentil, Fit je System)

**Status:** Phase 3 Must-have  
**Abhängigkeiten:** DB-Migration, API-Modelle, Validierung

---

## 5. Berechnungslogik in Ausbaustufen

## 5.1 Phase 3a (must-have)

- Differenzvektor als Basis pro Dimension.
- Einfacher Kompatibilitätsscore je System.
- Gesamtranking nach Skill (mit Perzentil und Fit).

## 5.2 Phase 3b (erweitert)

- Systemspezifische Interaktionslogik (z. B. Bazi-Elementzyklen).
- Optional: Verknüpfte A-Sessions für präzisere Vergleichswerte.

## 5.3 Phase 4 (vertieft)

- Synastrie-/Aspekte-Module.
- Erweiterte Erklärungen pro System und Subscore.

**Status:** gestaffelt (Phase 3a/3b/4)  
**Abhängigkeiten:** neue Regelwerke, Rechenmodule, Content

---

## 6. Fragenkonzept für Spiel C

### 6.1 Fragetypen

- **Typ A - Beziehungsfragen** (immer): gemeinsame Beziehungseinschätzung.
- **Typ B - Fremdeinschätzung** (optional): A beschreibt B oder B beschreibt A.

### 6.2 Leitregel zur Datenqualität

- Wenn beide Personen A-Sessions verknüpfen, sinkt der Bedarf für Typ B.
- Mindestumfang für Startversion klein halten (z. B. 8 Kernfragen).

**Status:** Phase 3a (Basis), Ausbau Phase 3b  
**Abhängigkeiten:** Fragenkatalog, Verknüpfungslogik, UX

---

## 7. Datenschutz in Spiel C (umgesetzt)

- Geburtsdatum, -zeit und -ort der Partnerperson sind auch ohne Namen **pseudonym, nicht anonym**:
  Die Kombination kann auf eine Person zeigen.
- **Pflicht-Häkchen** vor dem Start: "Die andere Person weiß, dass ich ihre Geburtsdaten hier eingebe,
  und ist einverstanden." Gespeichert als `metadaten.partner_einwilligung`.
- **Datensparsam gespeichert:** Geburtsdatum und -zeit beider Personen; vom Ort nur Zeitzone und auf 1 Grad
  (~100 km) gerundete Koordinaten (gilt seit Oktober 2026 auch für Spiel A); kein Name.
- Genaue Koordinaten werden nur während der Berechnung im Speicher verwendet.
- Öffentliche Auswertungen nur aggregiert.

**Status:** umgesetzt (rechtliche Prüfung steht aus)
**Abhängigkeiten:** Rechtsprüfung

---

## 8. Decision Backlog

1. Welche C-Funktionen sind Teil von 3a (MVP für C)?
2. Wann wird Aspekte/Synastrie zugeschaltet?
3. Wird Humoraltypen in C als gleichrangiges System oder als Zusatzanalyse gezeigt?
4. Welcher öffentliche Name soll für "Vedisch" verwendet werden?
5. Wie wird die Kontrollgruppe für Paare gebildet (Person B variieren, beide, oder zufällige Paare)?

**Status:** offen  
**Abhängigkeiten:** Product, Research, Content

---

## 9. Was gilt jetzt

- Spiel C ist spielbar (E2E 21.10.2026): Beziehungsfragen, Skill gegen 100 zufällige Paare, je Horoskop eine Grafik für zwei mit Bildtext und Paaraussagen (`backend/paar.py`, Texte `docs/Textbausteine/paar/paar_v1.md`).
- Begriffe und Metriken sind identisch zu A/B gemäß `Vorlage zur Harmonisierung der Texte.md`.
- Dieses Dokument trennt verbindliche Must-haves (3a) von späteren Erweiterungen (3b/4).

