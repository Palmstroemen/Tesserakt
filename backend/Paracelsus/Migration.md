-- =============================================================================
-- Humoraltypen Meta-System — Datenbankmigrationen
-- Schritte 5 & 6 aus dem Projektplan
-- Geprüft gegen: datenbankschema_v2.1.docx
-- Ziel-Tabelle: persoenlichkeit_sessions
-- =============================================================================


-- =============================================================================
-- SCHRITT 5 — Neue Spalten in persoenlichkeit_sessions
-- Aufwand: ~1h · Schemakompatibilität bestätigt
-- =============================================================================
--
-- Alle drei Spalten sind nullable — das Temperament ist eine abgeleitete
-- Größe die erst nach Abschluss aller 7 Systemrunden vorliegt. Bestehende
-- Sessions bleiben unverändert und können nachträglich befüllt werden.
--
-- Typen-Entscheidungen (Schema-konform):
--   VARCHAR(20)  — konsistent mit sonnenzeichen, day_master_elem,
--                  kindheit_kulturraum, kultur_kontinuitaet
--   JSONB        — konsistent mit planet_positionen, zeitfenster
--
-- Bestehende Indizes:
--   idx_ps_glaube, idx_ps_kulturraum, idx_ps_breitengrad etc. (v2.1)
--   → werden durch die neue Spalte nicht berührt

ALTER TABLE persoenlichkeit_sessions
    ADD COLUMN temperament_primaer   VARCHAR(20)
        CHECK (temperament_primaer IN (
            'cholerisch', 'sanguinisch', 'phlegmatisch', 'melancholisch'
        )),
    ADD COLUMN temperament_sekundaer VARCHAR(20)
        CHECK (temperament_sekundaer IN (
            'cholerisch', 'sanguinisch', 'phlegmatisch', 'melancholisch'
        )),
    ADD COLUMN temperament_verteilung JSONB;
    -- Struktur: {"cholerisch": 0.52, "sanguinisch": 0.08,
    --            "phlegmatisch": 0.10, "melancholisch": 0.30}
    -- Liefert berechne_temperament()["verteilung"] aus temperament_engine.py


-- Sicherheitscheck: primär ≠ sekundär (wenn beide gesetzt)
ALTER TABLE persoenlichkeit_sessions
    ADD CONSTRAINT chk_temperament_nicht_gleich
        CHECK (
            temperament_sekundaer IS NULL
            OR temperament_primaer <> temperament_sekundaer
        );


-- Index für die Statistik-View und spätere Analysen
-- Partial Index: nur abgeschlossene, veröffentlichte Sessions mit Ergebnis
CREATE INDEX idx_ps_temperament_primaer
    ON persoenlichkeit_sessions (temperament_primaer)
    WHERE abgeschlossen = TRUE
      AND veroeffentlichen = TRUE
      AND temperament_primaer IS NOT NULL;


-- =============================================================================
-- SCHRITT 6 — Statistik-View: v_temperament_statistik
-- Aufwand: ~1h
-- =============================================================================
--
-- Beantwortet die Kernfragen aus dem Projektplan:
--   1. Welche Sonnenzeichen landen in welchem Temperament?
--      → Konsistenz-Check mit der astrologischen Tradition
--   2. Welcher Kulturraum hat welche Temperament-Verteilung?
--      → Test H_kulturell
--   3. Glauben Choleriker öfter an Astrologie als Melancholiker?
--      → Test H_kulturell via glaube_astrologie
--
-- Spalten-Herkunft (alle in Schema v2.1 vorhanden):
--   temperament_primaer, temperament_sekundaer  → Schritt 5
--   sonnenzeichen                               → Basis-Feld, NOT NULL
--   day_master_elem                             → Basis-Feld, nullable
--   kindheit_kulturraum                         → NEU v2.1, nullable
--   glaube_astrologie                           → NEU v2.1, nullable SMALLINT 1-5
--   abgeschlossen, veroeffentlichen             → Session-Status, vorhanden
--   temperament_verteilung                      → Schritt 5

DROP VIEW IF EXISTS v_temperament_statistik;

CREATE VIEW v_temperament_statistik AS
SELECT
    -- Gruppierungsmerkmale
    temperament_primaer,
    temperament_sekundaer,
    sonnenzeichen,
    day_master_elem,
    kindheit_kulturraum,

    -- Glaube-Bucket für lesbarere Auswertung:
    --   1-2 = skeptisch, 3 = neutral, 4-5 = gläubig
    CASE
        WHEN glaube_astrologie <= 2 THEN 'skeptisch'
        WHEN glaube_astrologie =  3 THEN 'neutral'
        WHEN glaube_astrologie >= 4 THEN 'glaeubig'
        ELSE NULL
    END AS glaube_gruppe,

    -- Rohwert ebenfalls verfügbar für Regressionen
    glaube_astrologie,

    -- Fallzahl
    COUNT(*) AS n_sessions,

    -- Konsistenz: Wie stark dominiert das Primär-Temperament?
    -- Hohe Konsistenz (→ 1.0) = alle 7 Systeme einig.
    -- Niedrige Konsistenz (→ 0.25) = vier Temperamente gleichverteilt.
    -- Berechnet aus JSONB: Anteil des primären Temperaments an der Verteilung.
    ROUND(
        AVG(
            (temperament_verteilung ->> temperament_primaer)::NUMERIC
        )::NUMERIC,
        4
    ) AS avg_konsistenz,

    -- Streuung der Konsistenz — hohe Streuung = das Sonnenzeichen/System
    -- liefert je nach Person sehr unterschiedliche Signale
    ROUND(
        STDDEV(
            (temperament_verteilung ->> temperament_primaer)::NUMERIC
        )::NUMERIC,
        4
    ) AS stddev_konsistenz

FROM persoenlichkeit_sessions
WHERE abgeschlossen      = TRUE
  AND veroeffentlichen   = TRUE
  AND temperament_primaer IS NOT NULL
GROUP BY
    temperament_primaer,
    temperament_sekundaer,
    sonnenzeichen,
    day_master_elem,
    kindheit_kulturraum,
    glaube_gruppe,
    glaube_astrologie
ORDER BY
    n_sessions DESC,
    temperament_primaer,
    sonnenzeichen;


-- =============================================================================
-- Hilfsabfragen — nicht auszuführen, nur zur Dokumentation
-- =============================================================================

-- Frage 1: Welches Sonnenzeichen landet am konsistentesten in einem Temperament?
--
--   SELECT sonnenzeichen, temperament_primaer,
--          SUM(n_sessions) AS n,
--          ROUND(AVG(avg_konsistenz), 3) AS konsistenz
--   FROM v_temperament_statistik
--   GROUP BY sonnenzeichen, temperament_primaer
--   ORDER BY konsistenz DESC;

-- Frage 2: Unterscheidet sich der Kulturraum in der Temperament-Verteilung?
--
--   SELECT kindheit_kulturraum, temperament_primaer,
--          SUM(n_sessions) AS n
--   FROM v_temperament_statistik
--   WHERE kindheit_kulturraum IS NOT NULL
--   GROUP BY kindheit_kulturraum, temperament_primaer
--   ORDER BY kindheit_kulturraum, n DESC;

-- Frage 3: Korreliert Astrologieglaube mit Temperament?
--
--   SELECT temperament_primaer, glaube_gruppe,
--          ROUND(AVG(glaube_astrologie), 2) AS avg_glaube,
--          SUM(n_sessions) AS n
--   FROM v_temperament_statistik
--   WHERE glaube_gruppe IS NOT NULL
--   GROUP BY temperament_primaer, glaube_gruppe
--   ORDER BY temperament_primaer, avg_glaube DESC;

-- Frage 4: Für welche Sonnenzeichen sind sich alle Systeme uneinig?
--          (Potenzielle Kandidaten für den Mapping-Review aus Schritt 1)
--
--   SELECT sonnenzeichen,
--          ROUND(AVG(avg_konsistenz), 3) AS konsistenz,
--          SUM(n_sessions) AS n
--   FROM v_temperament_statistik
--   GROUP BY sonnenzeichen
--   HAVING SUM(n_sessions) >= 20
--   ORDER BY konsistenz ASC;


-- =============================================================================
-- Reihenfolge bei Erstausführung
-- =============================================================================
--
--   1. ALTER TABLE (Schritt 5) — neue Spalten anlegen
--   2. CREATE INDEX              — Partial Index auf neue Spalten
--   3. CREATE VIEW  (Schritt 6) — baut auf neuen Spalten auf
--
-- Schritt 5 muss vor Schritt 6 committed sein (kein DDL-Transaktions-Problem
-- in PostgreSQL — beide können in einer Transaktion laufen).
--
-- Rollback falls nötig:
--   DROP VIEW  IF EXISTS v_temperament_statistik;
--   DROP INDEX IF EXISTS idx_ps_temperament_primaer;
--   ALTER TABLE persoenlichkeit_sessions
--       DROP CONSTRAINT IF EXISTS chk_temperament_nicht_gleich,
--       DROP COLUMN IF EXISTS temperament_primaer,
--       DROP COLUMN IF EXISTS temperament_sekundaer,
--       DROP COLUMN IF EXISTS temperament_verteilung;