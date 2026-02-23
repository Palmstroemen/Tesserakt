# Spiel C: Beziehungshoroskop
## Konzept & Datenmodell

*Horoskop Assessment — Drittes Spiel*
*Version 1.0 · Februar 2026*

---

## 1. Vision

Spiel C berechnet aus den Geburtsdaten zweier Personen eine Kompatibilitätsanalyse nach allen sieben Systemen plus Humoraltypen-Meta-System. Es ist das einzige der drei Spiele das zwei Personen gleichzeitig betrachtet — und damit die einzige Möglichkeit systemübergreifend zu testen ob Kompatibilitätsaussagen mit erlebter Beziehungsqualität übereinstimmen.

**Die wissenschaftliche Kernfrage:**
> Stimmt berechnete Kompatibilität mit erlebter Beziehungsqualität überein — und welches System trifft das am besten?

---

## 2. Verhältnis zu Spiel A und B

| | Spiel A | Spiel B | Spiel C |
|---|---|---|---|
| **Personen** | 1 | 1 | 2 |
| **Zeitbezug** | Natal (zeitlos) | Zeitfenster | Natal (zeitlos) |
| **Selbsteinschätzung** | Eigene Persönlichkeit | Eigene Erfahrungen | Beziehung als Ganzes |
| **Systeme** | Alle 7 + KO + Humoraltypen | 5 zeitkompetente + KO | Alle 7 + KO + Humoraltypen |
| **Wiederholbarkeit** | 1× sinnvoll | Beliebig oft | 1× pro Beziehung sinnvoll |
| **Datenbasis** | Geburtsdaten + Selbsteinschätzung | Geburtsdaten + Zeiteinschätzung | Geburtsdaten beider + Beziehungseinschätzung |

Spiel C kann vollständig eigenständig gespielt werden — braucht also keine vorherige Session aus Spiel A. Wenn aber eine oder beide Personen bereits Spiel A gespielt haben, können diese Sessions **freiwillig verknüpft** werden um die Analyse zu verfeinern.

---

## 3. Datenmodell

### 3.1 Designentscheidung: Schwache Verknüpfung

Keine Personen-Tabelle, kein Account-System. Stattdessen ein **optionaler Session-Code**: Wer Spiel A gespielt hat, bekommt am Ende einen kurzen Code (z.B. `W7K4-M2PQ`). Diesen kann man in Spiel C freiwillig eingeben um die eigene Persönlichkeitsanalyse einfließen zu lassen.

```
Ohne Code:  Spiel C rechnet nur mit Geburtsdaten → Systemvektoren
Mit Code:   Spiel C hat zusätzlich echte Selbsteinschätzungen von Spiel A
            → präzisere Kompatibilitätsanalyse
```

Das ist datenschutzfreundlich (kein Zwang, kein Account, Code bedeutungslos ohne Kontext) und wissenschaftlich wertvoll (Paare mit zwei verknüpften Sessions liefern den reichhaltigsten Datensatz).

---

### 3.2 Haupttabelle: beziehungs_sessions

```sql
CREATE TABLE beziehungs_sessions (
  session_id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- ── BEZIEHUNGSKONTEXT ────────────────────────────────────────
  beziehungstyp        VARCHAR(20)   NOT NULL
                       CHECK (beziehungstyp IN
                         ('partnerschaft','freundschaft','familie','beruf','unbekannt')),
  -- Beeinflusst Gewichtung: Partnerschaft → Liebe/Soziales stärker
  --                         Beruf         → Beruf/Finanzen stärker
  --                         Familie       → Alle Dimensionen gleichwertig

  beziehung_besteht    BOOLEAN,
  -- TRUE  = Beziehung existiert bereits (Validierung möglich)
  -- FALSE = Potenzielle Beziehung (Prognose-Modus)
  -- NULL  = nicht beantwortet

  beziehung_dauer_jahre SMALLINT,
  -- Nur wenn beziehung_besteht = TRUE
  -- Für Längsschnitt-Analysen: Stimmt Kompatibilität bei langen Beziehungen besser?

  -- ── PERSON A ─────────────────────────────────────────────────
  a_geburtsdatum       DATE          NOT NULL,
  a_geburtszeit        TIME,
  a_geburtszeit_genau  BOOLEAN       DEFAULT FALSE,
  a_sonnenzeichen      VARCHAR(20)   NOT NULL,
  a_day_master_elem    VARCHAR(10),
  a_year_branch        VARCHAR(10),
  a_lebenspfadzahl     SMALLINT,
  a_planet_positionen  JSONB,
  -- Ephemeris, gleiche Struktur wie persoenlichkeit_sessions
  a_temperament        VARCHAR(20),
  -- Berechnet aus Geburtsdaten: cholerisch | sanguinisch | phlegmatisch | melancholisch

  -- Optionale Verknüpfung mit Spiel A
  a_session_link       UUID          REFERENCES persoenlichkeit_sessions(session_id),
  -- NULL = nicht verknüpft, nur Geburtsdaten-Berechnung
  -- Gesetzt = echte Selbsteinschätzungen aus Spiel A verfügbar

  -- ── PERSON B ─────────────────────────────────────────────────
  b_geburtsdatum       DATE          NOT NULL,
  b_geburtszeit        TIME,
  b_geburtszeit_genau  BOOLEAN       DEFAULT FALSE,
  b_sonnenzeichen      VARCHAR(20)   NOT NULL,
  b_day_master_elem    VARCHAR(10),
  b_year_branch        VARCHAR(10),
  b_lebenspfadzahl     SMALLINT,
  b_planet_positionen  JSONB,
  b_temperament        VARCHAR(20),
  b_session_link       UUID          REFERENCES persoenlichkeit_sessions(session_id),

  -- ── BERECHNETE KOMPATIBILITÄT ─────────────────────────────────
  -- Wird beim Session-Anlegen berechnet und gespeichert.
  -- Struktur siehe Abschnitt 4.
  kompatibilitaet      JSONB,

  -- ── SESSION-STATUS ────────────────────────────────────────────
  abgeschlossen        BOOLEAN       DEFAULT FALSE,
  n_antworten          SMALLINT      DEFAULT 0,

  -- ── DATENSCHUTZ ──────────────────────────────────────────────
  dsgvo_zustimmung     BOOLEAN       NOT NULL DEFAULT FALSE,
  veroeffentlichen     BOOLEAN       DEFAULT TRUE
);
```

---

### 3.3 Antworttabelle: beziehungs_antworten

```sql
CREATE TABLE beziehungs_antworten (
  antwort_id           BIGSERIAL     PRIMARY KEY,
  session_id           UUID          NOT NULL
                       REFERENCES beziehungs_sessions(session_id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Fragen-Referenz (gleicher Katalog wie Spiel A/B)
  frage_id             INT           NOT NULL REFERENCES fragen_katalog(frage_id),
  mapping_version_id   INT           NOT NULL REFERENCES fragen_mapping_versionen(mapping_id),

  -- Wer hat diese Frage beantwortet?
  beantwortet_von      VARCHAR(10)   NOT NULL CHECK (beantwortet_von IN ('a','b','beide')),
  -- 'a'    = Person A schätzt Person B ein (Fremdeinschätzung)
  -- 'b'    = Person B schätzt Person A ein (Fremdeinschätzung)
  -- 'beide'= Frage über die Beziehung als Ganzes (kein Subjekt)

  frage_typ            VARCHAR(20)   NOT NULL,
  -- 'beziehung'        = Frage über die Beziehung als Ganzes
  -- 'fremdeinschaetzung' = Eine Person schätzt die andere ein
  --                        (nur wenn keine Spiel-A-Verknüpfung)

  selbst_wert          NUMERIC(3,1)  NOT NULL CHECK (selbst_wert BETWEEN 1.0 AND 5.0),

  -- Systemvorhersagen für die Kompatibilität in dieser Dimension
  -- (Differenz der Systemvektoren A-B, normiert)
  wert_westlich        NUMERIC(4,2),
  wert_bazi            NUMERIC(4,2),
  wert_numerologie     NUMERIC(4,2),
  wert_kabbalah        NUMERIC(4,2),
  wert_arabisch        NUMERIC(4,2),
  wert_hellenistisch   NUMERIC(4,2),
  wert_japanisch       NUMERIC(4,2)
);
```

---

## 4. Kompatibilitäts-Berechnung

### 4.1 Drei Berechnungsebenen

Jedes System hat eine eigene Logik — nicht alle verwenden den einfachen Differenzvektor:

```
Ebene 1 — Differenzvektor (alle Systeme)
  Harmonie(Dimension) = 1 - |V_A(dim) - V_B(dim)| / 4
  → 1.0 = perfekte Übereinstimmung, 0.0 = maximale Differenz
  Einfach, universell, aber verliert systemspezifische Dynamik

Ebene 2 — Interaktionslogik (systemspezifisch)
  Bazi: Nährt Element A das Element B? Kontrolliert es? Schwächt es?
  Humoraltypen: Gleiches Temperament / komplementär / entgegengesetzt?
  → Qualitative Aussage: harmonisch / spannungsreich / transformativ

Ebene 3 — Aspekte (nur Westlich + Hellenistisch)
  Winkelbeziehungen zwischen Planeten beider Personen
  → Braucht planet_positionen beider Personen (Ephemeris)
  → Präziseste Aussage, aber technisch aufwendigster Teil
```

### 4.2 JSONB-Struktur der Kompatibilität

```json
{
  "westlich": {
    "score": 68,
    "zeichen_kombination": "fische_jungfrau",
    "klassifikation": "opposition",
    "bedeutung": "Gegenüber-Zeichen — starke Anziehung, grundlegende Verschiedenheit",
    "harmonie_dims": ["liebe", "spiritualitaet"],
    "spannung_dims": ["veraenderung", "beruf"],
    "differenz_vektor": {
      "liebe": 0.82, "beruf": 0.41, "finanzen": 0.63,
      "gesundheit": 0.71, "soziales": 0.55,
      "kreativitaet": 0.78, "veraenderung": 0.38, "spiritualitaet": 0.85
    },
    "aspekte": {
      "sonne_a_mond_b": {"winkel": 174, "typ": "opposition", "orb": 6, "wertung": "spannungsreich"},
      "venus_a_mars_b": {"winkel": 118, "typ": "trigon",     "orb": 2, "wertung": "harmonisch"},
      "saturn_a_sonne_b": {"winkel": 92, "typ": "quadrat",  "orb": 2, "wertung": "herausfordernd"}
    }
  },
  "bazi": {
    "score": 55,
    "element_a": "wasser",
    "element_b": "erde",
    "dynamik": "erde_daemmt_wasser",
    "zyklus_typ": "kontroll",
    "bedeutung": "Das Erde-Element kanalisiert und begrenzt das Wasser-Element. Stabilisierend aber einengend.",
    "differenz_vektor": {
      "beruf": 0.60, "finanzen": 0.45, "veraenderung": 0.38,
      "gesundheit": 0.72
    }
  },
  "humoraltypen": {
    "score": 61,
    "temperament_a": "phlegmatisch",
    "temperament_b": "melancholisch",
    "kombination": "phlegmatisch_melancholisch",
    "klassifikation": "komplementaer",
    "bedeutung": "Beide introvertiert, beide geduldig — hohe gegenseitige Toleranz. Gefahr: zu wenig Feuer, zu wenig Impuls.",
    "element_a": "Wasser",
    "element_b": "Erde",
    "element_dynamik": "Erde gibt Wasser Form und Richtung"
  },
  "numerologie": {
    "score": 74,
    "lpz_a": 7,
    "lpz_b": 2,
    "beziehungszahl": 9,
    "bedeutung": "Lebenspfad 9 — die Beziehung hat einen universellen, idealistischen Charakter."
  },
  "gesamt_score": 64,
  "konsistenz": 0.71
}
```

### 4.3 Bazi-Interaktionszyklen

Das ist der technisch eigenständigste Teil — braucht ein neues Regelwerk:

```
Die fünf Bazi-Elemente interagieren in zwei Zyklen:

Nährungs-Zyklus (sheng): harmonisch
  Holz → Feuer → Erde → Metall → Wasser → Holz
  Holz nährt Feuer: Beziehung nährend, unterstützend

Kontroll-Zyklus (ke): spannungsreich aber nicht zwingend negativ
  Holz → Erde → Wasser → Feuer → Metall → Holz
  Holz kontrolliert Erde: Beziehung strukturierend, manchmal einengend

Gleiches Element: ambivalent
  Wasser + Wasser: tiefes Verständnis, aber Verstärkung von Schwächen

Erschöpfungs-Zyklus (umgekehrter Nährungs-Zyklus): zehrend
  Feuer erschöpft sich in Erde: A gibt viel, bekommt wenig zurück
```

```json
// bazi_interaktions_regeln.json (neu zu erstellen)
{
  "naehrung": {
    "holz_feuer":   {"score": 85, "typ": "naehrend",      "note": "Holz entfacht Feuer — Inspiration und Wachstum"},
    "feuer_erde":   {"score": 80, "typ": "naehrend",      "note": "Feuer befruchtet Erde — Wärme und Stabilität"},
    "erde_metall":  {"score": 78, "typ": "naehrend",      "note": "Erde gebiert Metall — Struktur und Klarheit"},
    "metall_wasser":{"score": 82, "typ": "naehrend",      "note": "Metall reinigt Wasser — Präzision und Tiefe"},
    "wasser_holz":  {"score": 83, "typ": "naehrend",      "note": "Wasser nährt Holz — Fürsorge und Wachstum"}
  },
  "kontrolle": {
    "holz_erde":    {"score": 52, "typ": "kontrollierend","note": "Holz durchdringt Erde — strukturierend, manchmal einengend"},
    "erde_wasser":  {"score": 48, "typ": "kontrollierend","note": "Erde dämmt Wasser — kanalisierend, manchmal blockierend"},
    "wasser_feuer": {"score": 45, "typ": "kontrollierend","note": "Wasser löscht Feuer — kühlend, manchmal dämpfend"},
    "feuer_metall": {"score": 50, "typ": "kontrollierend","note": "Feuer schmilzt Metall — formend, manchmal zerstörend"},
    "metall_holz":  {"score": 47, "typ": "kontrollierend","note": "Metall fällt Holz — begrenzend, manchmal verletzend"}
  },
  "gleich": {
    "holz_holz":    {"score": 65, "typ": "resonanz",      "note": "Tiefes Verständnis, Verstärkung von Stärken und Schwächen"},
    "feuer_feuer":  {"score": 60, "typ": "resonanz",      "note": "Explosive Energie, hohes gegenseitiges Verständnis"},
    "erde_erde":    {"score": 70, "typ": "resonanz",      "note": "Große Stabilität, Gefahr der Stagnation"},
    "metall_metall":{"score": 63, "typ": "resonanz",      "note": "Starke Struktur, Gefahr von Starrheit"},
    "wasser_wasser":{"score": 68, "typ": "resonanz",      "note": "Große emotionale Tiefe, Gefahr der Überwältigung"}
  }
}
```

---

## 5. Fragen in Spiel C

### 5.1 Fragetypen

**Typ A — Beziehungsfragen** (immer, unabhängig von Verknüpfung):
Über die Beziehung als Ganzes — kein Subjekt, gemeinsame Einschätzung.

| # | Frage | Dimension |
|---|---|---|
| 1 | Diese Beziehung gibt mir Energie (5) oder kostet sie mich Energie (1). | Gesundheit / Soziales |
| 2 | Wir ergänzen uns gut — wo einer schwach ist, ist der andere stark. | Alle |
| 3 | Konflikte lösen wir konstruktiv und ohne langanhaltende Verletzungen. | Soziales / Liebe |
| 4 | In dieser Beziehung kann ich ich selbst sein. | Liebe / Spiritualität |
| 5 | Wir haben ähnliche Lebensziele und Vorstellungen von der Zukunft. | Beruf / Veränderung |
| 6 | Der Umgang mit Geld und Finanzen ist ein harmonischer Bereich. | Finanzen |
| 7 | Wir haben eine ähnliche Vorstellung von Nähe und Distanz in der Beziehung. | Liebe |
| 8 | Einer von uns wächst deutlich stärker an dieser Beziehung als der andere. | Alle (Asymmetrie) |

**Typ B — Fremdeinschätzung** (nur wenn keine Spiel-A-Verknüpfung der anderen Person):
Person A schätzt Person B ein — oder umgekehrt. Gleiche Fragen wie Spiel A, aber in der "fremd"-Formulierung.

Beispiele:
- "Die andere Person trifft leicht Entscheidungen im Alltag."
- "Die andere Person ist eher ruhig (1) oder energetisch (5)."
- "Die andere Person neigt dazu sich in Beziehungen fest zu binden."

**Typ B entfällt vollständig** wenn beide Personen ihre Spiel-A-Sessions verknüpft haben — dann liegen echte Selbsteinschätzungen vor.

### 5.2 Mindest- und Maximalfragen

```
Minimum: 8 Fragen (nur Typ A) → Basis-Kompatibilität aus Geburtsdaten
Standard: 12–16 Fragen → Typ A + einige Typ B
Maximum: 24 Fragen → Typ A + vollständige Fremdeinschätzungen beider Personen
Optimal: Beide haben Spiel A gespielt und verknüpft → nur Typ A nötig
```

---

## 6. Belohnungsstruktur

Spiel C folgt dem gleichen progressiven Prinzip wie Spiel A:

```
Nach 4 Fragen  → Erste Kompatibilitäts-Einschätzung (Westlich + Humoraltypen)
                  "Fische und Jungfrau — das klassische Gegenüber-Paar..."

Nach 8 Fragen  → Drei Systeme freigeschaltet
                  Erster Systemvergleich: Stimmen sie überein?

Nach 12 Fragen → Alle Systeme + Bazi-Interaktionszyklus erklärt
                  "Euer Elementverhältnis ist Erde-dämmt-Wasser..."

Nach 16 Fragen → Vollständige Analyse + Aspekte (wenn Geburtszeit vorhanden)
                  Kontrollgruppe aufgedeckt

Bonus          → Wenn beide Spiel A verknüpft haben: Vergleich
                  berechnetes Profil vs. Selbsteinschätzung pro Person
```

---

## 7. Neue JSON-Regelwerke die erstellt werden müssen

| Datei | Inhalt | Aufwand | Priorität |
|---|---|---|---|
| `bazi_interaktions_regeln.json` | 25 Element-Kombinationen (5×5) mit Score, Typ, Text | 3–4 h | Hoch |
| `aspekte_regeln.json` | Konjunktion, Sextil, Quadrat, Trigon, Opposition mit Orb-Toleranzen und Wertungen | 4–6 h | Mittel |
| `temperament_kompatibilitaet.json` | 16 Temperament-Kombinationen (4×4) mit Klassifikation und Text | 2–3 h | Hoch |
| `numerologie_beziehungszahlen.json` | Beziehungszahl 1–9 + 11/22 mit Beschreibung | 2 h | Niedrig |
| `haus_synastrie_regeln.json` | Welches Haus aktiviert Person B im Horoskop von Person A? | 6–8 h | Niedrig (Phase 2) |

**Gesamtaufwand neue Regelwerke: 17–23 Stunden**

Das Aspekte-Modul und die Haus-Synastrie sind die technisch aufwendigsten Teile und können in Phase 2 nachgeliefert werden — Spiel C funktioniert ohne sie, wird aber präziser mit ihnen.

---

## 8. Datenschutz-Besonderheiten

Spiel C enthält Geburtsdaten **zweier** Personen. Das erhöht das Datenschutz-Risiko:

- **Person B muss zustimmen**: Wenn Person A die Daten von Person B eingibt, stimmt Person B nicht selbst zu. Lösung: Expliziter Hinweis "Bitte stelle sicher dass die andere Person damit einverstanden ist" + keine Möglichkeit Person B ohne deren Wissen zu analysieren.
- **Verknüpfter Session-Code**: Nur Person A kann ihren eigenen Code eingeben — Person B kann nicht von außen verknüpft werden.
- **Öffentliche Daten**: In `v_beziehung_public` nur aggregierte Scores, keine Geburtsdate-Kombinationen die Paare identifizierbar machen. Jahrzehnte statt exakte Jahre.
- **Löschung**: Wenn eine verknüpfte Spiel-A-Session gelöscht wird, bleibt `beziehungs_sessions` erhalten aber `a_session_link` wird auf NULL gesetzt (SET NULL statt CASCADE).

```sql
-- Angepasste Referenz:
a_session_link UUID REFERENCES persoenlichkeit_sessions(session_id) ON DELETE SET NULL,
b_session_link UUID REFERENCES persoenlichkeit_sessions(session_id) ON DELETE SET NULL
```

---

## 9. Statistik-Views

```sql
-- Welche Zeichen-Kombinationen treten am häufigsten auf?
-- Stimmt die berechnete Kompatibilität mit erlebter überein?
CREATE VIEW v_beziehung_public AS
SELECT
  a_sonnenzeichen, b_sonnenzeichen,
  beziehungstyp,
  beziehung_besteht,
  beziehung_dauer_jahre,
  a_temperament, b_temperament,
  (kompatibilitaet->>'gesamt_score')::int AS gesamt_score,
  (kompatibilitaet->'westlich'->>'score')::int AS score_westlich,
  (kompatibilitaet->'bazi'->>'score')::int AS score_bazi,
  (kompatibilitaet->'humoraltypen'->>'score')::int AS score_humoraltypen,
  (kompatibilitaet->>'konsistenz')::numeric AS system_konsistenz,
  -- Verknüpfungstiefe: wie viele echte Selbsteinschätzungen fließen ein?
  CASE
    WHEN a_session_link IS NOT NULL AND b_session_link IS NOT NULL THEN 'beide_verknuepft'
    WHEN a_session_link IS NOT NULL OR  b_session_link IS NOT NULL THEN 'eine_verknuepft'
    ELSE 'keine_verknuepfung'
  END AS verknuepfungstiefe,
  (EXTRACT(YEAR FROM a_geburtsdatum)::INT / 10) * 10 AS a_jahrzehnt,
  (EXTRACT(YEAR FROM b_geburtsdatum)::INT / 10) * 10 AS b_jahrzehnt
FROM beziehungs_sessions
WHERE veroeffentlichen = TRUE
  AND dsgvo_zustimmung = TRUE
  AND abgeschlossen = TRUE;
```

---

## 10. Roadmap Spiel C

| Phase | Inhalt | Voraussetzung |
|---|---|---|
| **Phase 3a** | Schema anlegen, Basis-Kompatibilität (Differenzvektor + Humoraltypen + Bazi-Zyklen), 8 Beziehungsfragen | 1.000+ Sessions aus Spiel A |
| **Phase 3b** | Aspekte-Modul (Westlich + Hellenistisch), Session-Code-Verknüpfung, vollständige Belohnungsstruktur | Phase 3a live |
| **Phase 4** | Haus-Synastrie, Fremdeinschätzungs-Vergleich (berechnet vs. selbst), erste Auswertung Kompatibilität vs. Beziehungsqualität | 500+ Spiel-C-Sessions |

---

## 11. Offene Designfragen

- **Anonymität bei Typ-B-Fragen**: Wenn Person A Person B einschätzt — sieht Person B das Ergebnis? Empfehlung: Nur wenn Person B selbst eine Session anlegt und verknüpft.
- **Asymmetrische Sessions**: Was wenn Person A das Spiel alleine spielt ohne Wissen von Person B? Legitim für "Was würde Astrologie über uns sagen?" — aber Ergebnis ist dann einseitig.
- **Beziehungstyp Erweiterung**: Geschwister, Eltern-Kind, Kollegen könnten eigene Fragen-Sets rechtfertigen. Phase 2.
- **Längsschnitt**: Dasselbe Paar könnte Spiel C nach 1 Jahr nochmal spielen. Geburtsdaten ändern sich nicht — aber Beziehungseinschätzung schon. Wie protokolliert man das? Neue Session mit Verweis auf alte?
