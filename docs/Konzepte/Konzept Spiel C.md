# Spiel C - Beziehungshoroskop
## Konzept und Datenmodell (harmonisiert)

*Tesserakt - Drittes Spiel*  
*Stand: Oktober 2026, MVP umgesetzt (Backend /partner, /partner/kontrolle; Frontend SpielC.jsx)*

---

## 1. Zielbild

Spiel C fragt **vergleichend**: Wer von euch beiden ist in welchem Lebensbereich staerker ausgepraegt
("Wer zeigt Zuneigung im Alltag eher offen?" - eher ich ... ausgewogen ... eher Partner:in).
Verglichen wird mit dem **Unterschied der beiden Horoskope** je System: `(B - A) / 2`.

Kernfrage:
> Erkennt ein System, wer von euch in welchem Bereich staerker ist - besser als bei zufaelligen Paaren?

**Status:** Phase 3  
**Abhaengigkeiten:** Datenmodell C, Regelwerke, UI-Flow, Consent

---

## 2. Beziehung zu Spiel A und B

| Merkmal | Spiel A | Spiel B | Spiel C |
|---|---|---|---|
| Personen | 1 | 1 | 2 |
| Fokus | Persoenlichkeit | Zeitfenster | Kompatibilitaet |
| Zeitbezug | Natal | Rueckblick | Natal |
| Datenbasis | Geburtsdaten + Antworten | Geburtsdaten + Zeitfragen | Geburtsdaten beider + Beziehungsfragen |
| Kontrollgruppe je System | 100 zufaellige Geburtsdaten | wie A, je Zeitfenster | 100 zufaellige Paare |

Hinweis:
- Spiel C ist eigenstaendig nutzbar.
- Optional koennen A-Sessions ueber Codes verknuepft werden.

**Status:** Phase 3  
**Abhaengigkeiten:** Session-Linking, Datenschema, API

---

## 3. Metrik (umgesetzt)

- **Skill** = `2 * (Perzentil - 50)`, Perzentil gegen **100 zufaellige Paare**: beide Geburtsdaten
  zufaellig im Fenster +-5 Jahre um das jeweils echte Datum (gleiche Uhrzeit, gleicher Ort, gleiches
  Geschlecht; Seeds `session_id:kontrolle_a` / `session_id:kontrolle_b`, Paar i = (A_i, B_i)).
- Entschieden (Oktober 2026): Variante "beide zufaellig". Symmetrisch (wer A, wer B ist, spielt keine
  Rolle) und passend zur Frage nach dem Paar. Alternativen (nur Partner bzw. nur ich zufaellig) waeren
  ebenfalls fair, beantworten aber die Frage nach einer Einzelperson.
- Fragen: `backend/fragen_beziehung.json` (Katalog `beziehung_v1`, ids 401-416), Gewichte wie Spiel A
  ueber die Konsens-Matrix. Bewertung mit derselben Funktion wie Spiel A (`calculateRating`).
- Sessions werden gespeichert (`spieltyp: "Beziehung"`).

Vorher (Prototyp bis Oktober 2026): alte Baseline-Metrik (1/6), Bazi doppelt als "Bazi_male" und
"Bazi_female", keine Speicherung, kein Ort und keine Zeitzone fuer die Partnerperson.

**Status:** umgesetzt
**Abhaengigkeiten:** -

---

## 4. Datenmodell (Must-have)

### 4.1 Designprinzip

- Kein verpflichtendes Account-System.
- Optionale, schwache Verknuepfung ueber Session-Code aus Spiel A.
- Datenschutzfreundliche Defaults.

### 4.2 Kernobjekte

1. `beziehungs_sessions`
   - Metadaten der Beziehung
   - Geburtsdaten A/B
   - optionale Session-Links
   - vorab berechnete Kompatibilitaet (JSON)
2. `beziehungs_antworten`
   - Fragebezug
   - wer antwortet (`a`, `b`, `beide`)
   - Antwortwert und Systemwerte pro Frage

### 4.3 Mindestfelder (fachlich)

- Beziehungstyp
- Geburtsdaten A/B
- Consent-Flags
- Abschlussstatus und Antwortanzahl
- Ergebnisstruktur fuer Systemvergleich (Skill, Perzentil, Fit je System)

**Status:** Phase 3 Must-have  
**Abhaengigkeiten:** DB-Migration, API-Modelle, Validierung

---

## 5. Berechnungslogik in Ausbaustufen

## 5.1 Phase 3a (must-have)

- Differenzvektor als Basis pro Dimension.
- Einfacher Kompatibilitaetsscore je System.
- Gesamtranking nach Skill (mit Perzentil und Fit).

## 5.2 Phase 3b (erweitert)

- Systemspezifische Interaktionslogik (z. B. Bazi-Elementzyklen).
- Optional: Verknuepfte A-Sessions fuer praezisere Vergleichswerte.

## 5.3 Phase 4 (vertieft)

- Synastrie-/Aspekte-Module.
- Erweiterte Erklaerungen pro System und Subscore.

**Status:** gestaffelt (Phase 3a/3b/4)  
**Abhaengigkeiten:** neue Regelwerke, Rechenmodule, Content

---

## 6. Fragenkonzept fuer Spiel C

### 6.1 Fragetypen

- **Typ A - Beziehungsfragen** (immer): gemeinsame Beziehungseinschaetzung.
- **Typ B - Fremdeinschaetzung** (optional): A beschreibt B oder B beschreibt A.

### 6.2 Leitregel zur Datenqualitaet

- Wenn beide Personen A-Sessions verknuepfen, sinkt der Bedarf fuer Typ B.
- Mindestumfang fuer Startversion klein halten (z. B. 8 Kernfragen).

**Status:** Phase 3a (Basis), Ausbau Phase 3b  
**Abhaengigkeiten:** Fragenkatalog, Verknuepfungslogik, UX

---

## 7. Datenschutz in Spiel C (umgesetzt)

- Geburtsdatum, -zeit und -ort der Partnerperson sind auch ohne Namen **pseudonym, nicht anonym**:
  Die Kombination kann auf eine Person zeigen.
- **Pflicht-Haekchen** vor dem Start: "Die andere Person weiss, dass ich ihre Geburtsdaten hier eingebe,
  und ist einverstanden." Gespeichert als `metadaten.partner_einwilligung`.
- **Datensparsam gespeichert:** Geburtsdatum und -zeit beider Personen; vom Ort nur Zeitzone und auf 1 Grad
  (~100 km) gerundete Koordinaten (gilt seit Oktober 2026 auch fuer Spiel A); kein Name.
- Genaue Koordinaten werden nur waehrend der Berechnung im Speicher verwendet.
- Oeffentliche Auswertungen nur aggregiert.

**Status:** umgesetzt (rechtliche Pruefung steht aus)
**Abhaengigkeiten:** Rechtspruefung

---

## 8. Decision Backlog

1. Welche C-Funktionen sind Teil von 3a (MVP fuer C)?
2. Wann wird Aspekte/Synastrie zugeschaltet?
3. Wird Humoraltypen in C als gleichrangiges System oder als Zusatzanalyse gezeigt?
4. Welcher oeffentliche Name soll fuer "Vedisch" verwendet werden?
5. Wie wird die Kontrollgruppe fuer Paare gebildet (Person B variieren, beide, oder zufaellige Paare)?

**Status:** offen  
**Abhaengigkeiten:** Product, Research, Content

---

## 9. Was gilt jetzt

- Spiel C ist konzeptionell vorbereitet, aber nicht live.
- Begriffe und Metriken sind identisch zu A/B gemaess `Vorlage zur Harmonisierung der Texte.md`.
- Dieses Dokument trennt verbindliche Must-haves (3a) von spaeteren Erweiterungen (3b/4).

