# Spiel C - Beziehungshoroskop
## Konzept und Datenmodell (harmonisiert)

*Horoskop Assessment - Drittes Spiel*  
*Stand: Februar 2026*

---

## 1. Zielbild

Spiel C vergleicht die erlebte Beziehungsqualitaet mit einer berechneten 2-Personen-Kompatibilitaet.

Kernfrage:
> Welche Systeme treffen Beziehungsqualitaet am besten - und schlagen sie KO?

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
| KO | Ja | Ja | Ja |

Hinweis:
- Spiel C ist eigenstaendig nutzbar.
- Optional koennen A-Sessions ueber Codes verknuepft werden.

**Status:** Phase 3  
**Abhaengigkeiten:** Session-Linking, Datenschema, API

---

## 3. Verbindliche Metrik-Policy fuer Spiel C

Auch in Spiel C gelten dieselben Kernmetriken:

- **Fit (absolut)**
- **Skill vs Zufall**
- **Delta zu KO** (Fit/Skill)

Regeln:
- Bewertung pro Frage anhand Nutzerantwort vs Systemwert.
- Gewichtung nur auf sinnvoll abgedeckten Dimensionen.
- KO bleibt methodischer Vergleichsanker und wird im Ranking immer zuletzt angezeigt.

**Status:** verbindlich (Designvorgabe)  
**Abhaengigkeiten:** C-Ratinglogik, Ergebnis-UI

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
- Ergebnisstruktur fuer Systemvergleich inkl. KO

**Status:** Phase 3 Must-have  
**Abhaengigkeiten:** DB-Migration, API-Modelle, Validierung

---

## 5. Berechnungslogik in Ausbaustufen

## 5.1 Phase 3a (must-have)

- Differenzvektor als Basis pro Dimension.
- Einfacher Kompatibilitaetsscore je System.
- Gesamtranking mit Fit/Skill/KO-Deltas.

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

## 7. Datenschutz in Spiel C

Pflichtprinzipien:

- Explizite Zustimmung fuer Datennutzung beider Personen.
- Keine oeffentliche Ausgabe identifizierbarer Paar-Daten.
- Aggregation/Anonymisierung fuer Statistik-Views.
- Loeschkonzept fuer verknuepfte Referenzen (z. B. `SET NULL` statt Kaskadeloeschung auf C-Session).

**Status:** Phase 3 Pflicht  
**Abhaengigkeiten:** Rechtspruefung, DB-Regeln, Exportpipeline

---

## 8. Decision Backlog

1. Welche C-Funktionen sind Teil von 3a (MVP fuer C)?
2. Wann wird Aspekte/Synastrie zugeschaltet?
3. Wird Humoraltypen in C als gleichrangiges System oder als Zusatzanalyse gezeigt?
4. Welcher oeffentliche Name soll fuer "Vedisch" verwendet werden?

**Status:** offen  
**Abhaengigkeiten:** Product, Research, Content

---

## 9. Was gilt jetzt

- Spiel C ist konzeptionell vorbereitet, aber nicht live.
- Begriffe und Metriken sind identisch zu A/B gemaess `harmonisierung_vorlage.md`.
- Dieses Dokument trennt verbindliche Must-haves (3a) von spaeteren Erweiterungen (3b/4).

