# Horoskop Assessment — Projektübergabe an Cursor

## Was gebaut werden soll

Eine Web-App die Nutzer durch einen Persönlichkeits-Fragebogen führt, ihre Selbsteinschätzungen mit den Vorhersagen verschiedener Horoskop-Systeme vergleicht, und am Ende auswertet welches System am besten gepasst hat.

Wissenschaftlicher Hintergrund: das Projekt testet drei konkurrierende Hypothesen (H_kulturell: kulturelle Prägung, H_saisonal: Saisonalität, H_kosmisch: planetarer Einfluss). Die gesammelten Daten werden public domain — Transparenz und Nachvollziehbarkeit sind explizite Projektziele.

---

## Architektur (bereits gefällt — nicht diskutieren)

```
Browser (React)                          Backend (FastAPI / Python)
────────────────────────────────         ──────────────────────────────────
build_inputs(geburtsdatum)          →    POST /vektor
                                         lädt Rule-JSONs, berechnet Vektoren
                                    ←    { vektoren, inputs }

RatingSession(vektoren)
  + alle 16 Fragen + Antworten
  + rating()
  + TemperamentEngine
  + Vergleichsgruppen-Anzeige

POST /session                       →    speichert anonymisiert in PostgreSQL
{ antworten, metadaten }            ←    { session_id }

GET /vergleich?doy=74&stunde=14&frage_id=3
                                    ←    { granularitaet, rohwerte,
                                           mittelwert, p25, median, p75,
                                           bin_1..5, n_gesamt, n_tag, ... }
```

**Warum diese Trennung:** Die Rule-JSONs (inhaltliches Know-how des Projekts) bleiben serverseitig und sind nie im Browser sichtbar. Das Frontend empfängt nur fertige Zahlenvektoren. Neue Horoskop-Systeme können hinzugefügt werden ohne Frontend-Änderungen — das Backend ist eine System-Registry.

---

## Kritische Designvorgabe: Logik ≠ Darstellung

Jede UI-Komponente muss visuell vollständig austauschbar sein ohne die Logik darunter zu berühren. Konkret:

- Was heute ein HTML-Slider ist (`<input type="range">`) wird morgen eine animierte 3D-Messing-Wählscheibe mit Ziselierungen
- Was heute ein Balken ist wird morgen ein magisches Auge mit Kameraeffekten
- Was heute ein Textfeld für das Geburtsdatum ist wird morgen ein animiertes astronomisches Datumsrad

**Umsetzung:** Jede Eingabe- und Ausgabe-Komponente bekommt eine klar definierte Props-Schnittstelle. Die Logik-Schicht (`useRating`, `useVektoren`) kommuniziert nur über diese Props — nie direkt mit DOM-Elementen.

---

## Vorhandene Dateien (alle im Projektordner)

|Datei/Ordner|Inhalt|
|---|---|
|`horoskop_assessment.py`|Referenz-Implementierung: Rule Engine, Rating Engine, 16 Fragen. FastAPI-Backend daraus ableiten.|
|`rating_engine.py`|Separate Rating Engine (ergänzende Version)|
|`temperament_engine.py`|Aggregiert System-Outputs → 4 Hippokrates-Temperamente|
|`humoraltypen_mapping.json`|Mapping aller Systeme → Temperamente mit Konfidenzwerten|
|`migration_schritte_5_6.sql`|PostgreSQL-Migration für `persoenlichkeit_sessions` inkl. Temperament-Spalten|
|`datenbankschema_v2_1.docx`|Vollständiges DB-Schema v2.1|
|`Westlich/`|`Struktur.json` + Rule-JSONs für Westliche Astrologie|
|`Numerologie/`|`Struktur.json` + Rule-JSONs für Numerologie|
|`Bazi/`|`Struktur.json` + Rule-JSONs für Chinesische Astrologie|

---

## MVP-Scope (Phase 1)

**4 Systeme:** Westlich · Chinesisch (Bazi) · Numerologie · Kontrollgruppe (KO)

**Kontrollgruppe:** Normalverteilte Zufallswerte um 3.0 (σ=0.8), geclampt 1–5, seed = hash(session_id + frage_id) für Reproduzierbarkeit. Zweck: Kein System soll schlechter abschneiden als reiner Zufall — das ist die wissenschaftliche Baseline und der Hauptschutz gegen Betrugsvorwürfe.

**Die 8 Dimensionen:** `liebe · beruf · finanzen · gesundheit · soziales · kreativitaet · veraenderung · spiritualitaet`

---

## Die 16 Fragen

Bereits definiert in `horoskop_assessment.py` unter `FRAGEN` — inklusive systemspezifischer Gewichte pro Frage und Dimension. Nicht neu erfinden.

---

## Rating-Logik (im Browser, aus horoskop_assessment.py)

```python
# Für jede Frage f, jedes System s:
fehler(s,f)          = (selbsteinschätzung - system_wert)²
gewichteter_fehler   = fehler × w_matrix × w_frage
normierter_fehler(s) = Σ gewichteter_fehler / Σ gewichte
rating(s)            = 100 × (1 - (normierter_fehler - min) / spanne)
# 100% = bestes System, 0% = schlechtestes System
```

Diese Logik als JavaScript portieren — sie ist zustandslos und hat keine externen Abhängigkeiten.

---

## Datenbank

### Kern-Tabelle (aus datenbankschema_v2_1.docx + migration_schritte_5_6.sql)

```sql
persoenlichkeit_sessions (
  session_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  geburtsdatum              DATE NOT NULL,
  geburtszeit               TIME,
  sonnenzeichen             VARCHAR(20),
  lebenspfadzahl            SMALLINT,
  day_master_elem           VARCHAR(10),
  planet_positionen         JSONB,
  geburtsort_breitengrad    NUMERIC(4,1),
  geburtsort_laengengrad    NUMERIC(5,1),
  kindheit_kulturraum       VARCHAR(50),
  glaube_astrologie         SMALLINT,        -- 1–5, NACH allen Fragen erhoben
  geschlecht                VARCHAR(20),
  temperament_primaer       VARCHAR(20),
  temperament_sekundaer     VARCHAR(20),
  temperament_verteilung    JSONB,
  abgeschlossen             BOOLEAN DEFAULT FALSE,
  veroeffentlichen          BOOLEAN DEFAULT TRUE,
  dsgvo_zustimmung          BOOLEAN NOT NULL DEFAULT FALSE
)
```

### Vergleichsgruppen-View (nächtlich per pg_cron aktualisiert)

```sql
CREATE MATERIALIZED VIEW mv_vergleichsgruppe AS
WITH basis AS (
    SELECT
        s.geburtsdatum,
        EXTRACT(DOY   FROM s.geburtsdatum)::INT  AS doy,
        EXTRACT(MONTH FROM s.geburtsdatum)::INT  AS monat,
        EXTRACT(HOUR  FROM s.geburtszeit)::INT   AS stunde,
        a.frage_id,
        a.dimension,
        a.selbst_wert
    FROM persoenlichkeit_antworten a
    JOIN persoenlichkeit_sessions s USING (session_id)
    WHERE s.abgeschlossen = TRUE AND s.veroeffentlichen = TRUE
),
counts AS (
    SELECT
        frage_id, monat, doy, stunde,
        COUNT(*)                                               AS n_gesamt,
        COUNT(*) FILTER (WHERE monat  = monat)                AS n_monat,
        COUNT(*) FILTER (WHERE doy    = doy)                  AS n_tag,
        COUNT(*) FILTER (WHERE doy    = doy AND stunde = stunde) AS n_stunde
    FROM basis
    GROUP BY frage_id, monat, doy, stunde
)
SELECT
    b.doy, b.monat, b.stunde, b.frage_id, b.dimension,
    CASE
        WHEN c.n_stunde  > 100 THEN 5
        WHEN c.n_stunde  >= 20 THEN 4
        WHEN c.n_tag     >= 20 THEN 3
        WHEN c.n_monat   >= 20 THEN 2
        ELSE 1
    END                                                         AS granularitaet,
    c.n_gesamt, c.n_monat, c.n_tag, c.n_stunde,
    CASE WHEN c.n_stunde <= 100
        THEN array_agg(b.selbst_wert ORDER BY b.selbst_wert)
        ELSE NULL
    END                                                         AS rohwerte,
    AVG(b.selbst_wert)                                          AS mittelwert,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY b.selbst_wert) AS p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY b.selbst_wert) AS median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY b.selbst_wert) AS p75,
    STDDEV(b.selbst_wert)                                       AS stddev,
    COUNT(*) FILTER (WHERE b.selbst_wert <  1.5)                AS bin_1,
    COUNT(*) FILTER (WHERE b.selbst_wert >= 1.5 AND b.selbst_wert < 2.5) AS bin_2,
    COUNT(*) FILTER (WHERE b.selbst_wert >= 2.5 AND b.selbst_wert < 3.5) AS bin_3,
    COUNT(*) FILTER (WHERE b.selbst_wert >= 3.5 AND b.selbst_wert < 4.5) AS bin_4,
    COUNT(*) FILTER (WHERE b.selbst_wert >= 4.5)                AS bin_5
FROM basis b
JOIN counts c USING (frage_id, monat, doy, stunde)
GROUP BY b.doy, b.monat, b.stunde, b.frage_id, b.dimension,
         c.n_gesamt, c.n_monat, c.n_tag, c.n_stunde;

CREATE UNIQUE INDEX ON mv_vergleichsgruppe (doy, stunde, frage_id);

-- Nächtlicher Refresh (täglich 3:00 Uhr)
SELECT cron.schedule(
    'refresh-vergleichsgruppe',
    '0 3 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vergleichsgruppe'
);
```

### Progressive Granularität der Vergleichsanzeige

Die Vergleichsgruppe wächst automatisch mit den Daten:

|Stufe|Bedingung|Anzeige|Label für User|
|---|---|---|---|
|1|n_gesamt < 20|Alle Rohpunkte (Scatter)|„Alle bisherigen Teilnehmer"|
|2|n_monat ≥ 20|Scatter, Monatsgruppe|„Andere [Monat]-Geborene"|
|3|n_tag ≥ 20|Scatter, exakter Tag|„Andere [Datum]-Geborene"|
|4|n_stunde ≥ 20|Scatter, Tag + Stunde|„Gleiche Geburtskonstellation"|
|5|n_stunde > 100|Histogramm + Boxplot|„[n] Personen mit gleicher Konstellation"|

Die Fallzahl (`n_gesamt`, `n_tag` etc.) wird immer sichtbar angezeigt — das ist die Transparenz-Schicht gegen Betrugsvorwürfe.

---

## API-Endpunkte

```
POST /vektor
  Body:     { geburtsdatum: "1985-03-15", uhrzeit: "14:30",
              systeme: ["Westlich", "Bazi", "Numerologie", "KO"] }
  Response: { vektoren: { Westlich: {liebe: 3.2, beruf: 4.1, ...},
                           Bazi:     {...},
                           KO:       {...} },   ← server-seitig generiert
              inputs:   { sonnenzeichen, lebenspfadzahl, day_master_elem,
                          geburts_year_branch, lebensalter, ... } }

POST /session
  Body:     { session_id, antworten: [{frage_id, selbst_wert, system_werte}],
              metadaten: { glaube_astrologie, kindheit_kulturraum,
                           geburtsort_breitengrad, geschlecht,
                           dsgvo_zustimmung } }
  Response: { session_id }

GET /vergleich?doy=74&stunde=14&frage_id=3
  Response: { granularitaet, rohwerte, mittelwert, p25, median, p75,
              stddev, bin_1..5, n_gesamt, n_monat, n_tag, n_stunde }
```

---

## Komponentenstruktur Frontend

```
<App>
  <GeburtsdatumInput          value onConfirm />
  ↓ → POST /vektor → vektoren im State

  <FrageFlow fragen vektoren>
    <FrageCard key={frage_id}>
      <FrageText text />
      <SelbsteinschaetzungSlider   value onChange />   ← props-only, kein DOM
      <SystemVergleichBalken       systemWerte selbst />
      <VergleichsGruppeViz         doy stunde frage_id selbst />
    </FrageCard>
    <Zwischenstand                 ratingHistory />
  </FrageFlow>

  <Ergebnis>
    <RankingTabelle                systeme ranking />
    <TemperamentProfil             temperament profil />
    <HistorischeBruecke            temperament />
  </Ergebnis>
</App>
```

**Custom Hooks (Logik-Schicht, völlig unabhängig von UI):**

```javascript
useVektoren(geburtsdatum, uhrzeit, systeme)
  → { vektoren, inputs, loading, error }

useRating(vektoren, antworten, matrix)
  → { ranking, systemDetails, temperament }

useVergleich(doy, stunde, frageId)
  → { granularitaet, daten, loading }
```

---

## Projektstruktur (Vorschlag)

```
/
├── backend/
│   ├── main.py                  ← FastAPI App, Endpunkte
│   ├── rule_engine.py           ← aus horoskop_assessment.py extrahiert
│   ├── temperament_engine.py    ← bereits vorhanden
│   ├── humoraltypen_mapping.json
│   ├── Westlich/
│   │   ├── Struktur.json
│   │   └── *.json               ← Rule-Files
│   ├── Bazi/
│   │   ├── Struktur.json
│   │   └── *.json
│   └── Numerologie/
│       ├── Struktur.json
│       └── *.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GeburtsdatumInput.jsx
│   │   │   ├── SelbsteinschaetzungSlider.jsx
│   │   │   ├── SystemVergleichBalken.jsx
│   │   │   ├── VergleichsGruppeViz.jsx
│   │   │   ├── Zwischenstand.jsx
│   │   │   ├── RankingTabelle.jsx
│   │   │   └── TemperamentProfil.jsx
│   │   ├── hooks/
│   │   │   ├── useVektoren.js
│   │   │   ├── useRating.js
│   │   │   └── useVergleich.js
│   │   ├── logic/
│   │   │   ├── rating.js        ← portierte RatingSession aus Python
│   │   │   └── temperament.js   ← portierte TemperamentEngine aus Python
│   │   └── App.jsx
│   └── package.json
│
├── db/
│   ├── migration_schritte_5_6.sql
│   └── mv_vergleichsgruppe.sql  ← Materialized View + pg_cron
│
└── cursor_prompt.md             ← diese Datei
```

---

## Reihenfolge (was zuerst)

1. **Backend aufsetzen** — FastAPI, `/vektor`-Endpunkt, Rule Engine aus `horoskop_assessment.py` extrahieren, Systeme als Unterordner laden
2. **KO-Kontrollgruppe** — serverseitig, reproduzierbar per seed
3. **React-Grundgerüst** — Hooks und Komponenten-Schnittstellen definieren, noch ohne visuelles Design
4. **Frageschleife** — Geburtsdatum → Vektoren → 16 Fragen → Rating
5. **Ergebnis-Seite** — Ranking + Temperament
6. **Vergleichsgruppe** — `/vergleich`-Endpunkt + `VergleichsGruppeViz`
7. **DB-Anbindung** — `/session`-Endpunkt + PostgreSQL
8. **Materialized View + pg_cron** — nächtlicher Refresh

---

## Was nicht zu tun ist

- Kein visuelles Design in Phase 1 — Tailwind für Layout erlaubt, keine Designsystem-Entscheidungen treffen
- Keine neuen Architektur-Entscheidungen — alles oben ist bereits gefällt
- Die `FRAGEN`-Liste aus `horoskop_assessment.py` nicht verändern
- Die Rating-Logik nicht "verbessern" — sie ist Referenzimplementierung

---

_Alle inhaltlichen Entscheidungen sind gefällt. Bauen, nicht konzipieren._