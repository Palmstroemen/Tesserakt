# Textbausteine v1
## Sprachneutrale NLG-Architektur fuer Horoskoptexte

Ziel: Wiederverwendbare, mehrsprachige Textgenerierung mit geringer Serverlast und hoher Kontrollierbarkeit.

**Runtime-Quellen:** Laufzeitrelevante JSON-Dateien (Claims, Evidence, Framing, Systemtexte) liegen unter `content/horoscope/de/` (z. B. `text_blocks_v1.json`, `system_texts_v1.json`). Diese Doku beschreibt Konzept und Architektur; die konkreten Daten werden zur Laufzeit aus `/content` geladen.

---

## 1) Prinzip

Die Textausgabe wird in drei Schichten getrennt:

1. **Meaning Layer (sprachneutral)**
   - Was wird ausgesagt? (Claim, Evidence, Unsicherheit)
2. **Language Realization (sprachspezifisch)**
   - Wie wird es in Sprache X gebaut? (Satzstellung, Faelle, Flexion)
3. **Style/Variation Layer**
   - Tonalitaet, Reihenfolge, Variantenpool zur Redundanzreduktion

Damit werden Logik und Sprachform getrennt und spaetere Sprachen leichter erweiterbar.

---

## 2) Datenmodell (Frame-Schema)

```json
{
  "frameId": "relationship_conflict_tendency",
  "domain": "spiel_a",
  "dimension": "liebe",
  "intent": "tendency",
  "polarity": "mixed",
  "strengthBand": "medium",
  "dedupeKey": "liebe_conflict_tendency",
  "evidence": [
    {
      "type": "astrology_western",
      "code": "mars_house_sign",
      "slots": {
        "planet": "mars",
        "house": 2,
        "sign": "virgo"
      }
    },
    {
      "type": "numerology",
      "code": "birth_sum_month_combo",
      "slots": {
        "sumNumber": 6,
        "monthNumber": 2
      }
    }
  ],
  "confidence": {
    "fit": 68.2,
    "randomAdvantage": 31.4,
    "deltaToKO": 14.1
  },
  "safety": {
    "hedgingLevel": "medium",
    "noDeterministicLanguage": true
  }
}
```

---

## 3) Template-Bausteine

## 3.1 Universal Claims

Beispiele (sprachneutral als Keys):

- `claim.liebe.conflict_tendency.medium`
- `claim.liebe.attachment_tendency.high`
- `claim.beruf.structure_orientation.medium`

Beispiel DE-Text (Claim):
- `Du koenntest in Beziehungen wiederholt in Konfliktsituationen geraten.`

## 3.2 Evidence-Bausteine pro System

Beispiele:

- `ev.western.mars_house_sign`
  - `weil dein Mars im {house}. Haus im Zeichen {sign} steht`
- `ev.numerology.birth_sum_month_combo`
  - `weil die {sumNumber} aus deinem Geburtsdatum zusammen mit der {monthNumber} im Monat`

## 3.3 Framing-Bausteine pro System

Beispiele:

- `fr.western.assumption`
  - `wuerde die klassische Astrologie annehmen,`
- `fr.numerology.assumption`
  - `wuerde die Numerologie so deuten,`

---

## 4) Satzmuster (pro Sprache, pro Stil)

Die Satzlogik wird nicht hart im Code verdrahtet, sondern als Muster verwaltet.

Beispiele:

- `pattern.claim_then_evidence`  
  `{CLAIM} {EVIDENCE}.`
- `pattern.evidence_then_claim`  
  `{CLAIM}, {EVIDENCE}.`
- `pattern.framed_claim`  
  `{EVIDENCE}, {FRAMING} {CLAIM}.`

### Variantensteuerung

- Rotationspool je `dedupeKey`
- Maximal 1x derselbe Claim pro Ausgabe
- Bei mehrfacher Evidenz: Claim einmal, Evidenzen als Bullet-Liste

---

## 5) Beispielrendering derselben Aussage in 3 Sprachen

## 5.1 Deutsch (DE)

- Claim -> Evidence:
  - `Du koenntest in Beziehungen wiederholt in Konfliktsituationen geraten, weil dein Mars im 2. Haus der Jungfrau steht.`
- Evidence -> Claim:
  - `Weil dein Mars im 2. Haus der Jungfrau steht, koenntest du in Beziehungen wiederholt in Konfliktsituationen geraten.`

## 5.2 Polnisch (PL) - konzeptionell

- `Możesz częściej doświadczać napięć w relacjach, ponieważ Mars znajduje się w 2. domu w znaku Panny.`

Hinweis:
- Kasus/Flexion muessen in der PL-Realisierungsschicht behandelt werden, nicht im universellen Claim.

## 5.3 Chinesisch (ZH) - konzeptionell

- `你在关系中可能会反复遇到冲突，因为你的火星位于处女座第二宫。`

Hinweis:
- Wortstellung und Partikel in ZH ueber sprachspezifische Muster steuern.

---

## 6) Empfohlene Libraries/Ansatz

## 6.1 Gute Basis (leichtgewichtig)

- ICU MessageFormat / FormatJS
- Fluent oder i18next + ICU

Fuer:
- Variablen, Plural, Textvarianten, Grundmuster

## 6.2 Fuer komplexe Morphologie

- Grammatical Framework (GF) oder sprachspezifische Morphologie-Module

Fuer:
- Kasus/Flexion bei PL/HU etc.

---

## 7) Effizienz fuer hohe Nutzerzahlen

- Kein LLM im Hot Path.
- Rendering deterministisch aus Frames + Templates.
- Caching-Key:
  - `sessionId + spiel + locale + textVersion + styleMode`
- Ergebnistext speichern und nur bei geaenderten Inputs neu bauen.

Optional:
- Asynchroner KI-Polish nur fuer Langtext/Premium-Ansicht.

---

## 8) Minimaler Startumfang (MVP fuer Textengine)

1. 40-60 Universal Claims (A-Dimensionen)
2. 25-40 Evidence-Bausteine je Kernsystem (Westlich, Bazi, Numerologie)
3. 6-10 Satzmuster pro Sprache (DE zuerst)
4. Dedupe + Variationslogik + Caching

Damit entsteht ein stabiler, guenstiger Textgenerator ohne spaeteren Architekturbruch bei Mehrsprachigkeit.
