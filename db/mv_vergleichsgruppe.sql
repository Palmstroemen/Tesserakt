CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vergleichsgruppe AS
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
        COUNT(*) AS n_gesamt,
        COUNT(*) AS n_monat,
        COUNT(*) FILTER (WHERE doy = doy) AS n_tag,
        COUNT(*) FILTER (WHERE doy = doy AND stunde = stunde) AS n_stunde
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
    END AS granularitaet,
    c.n_gesamt, c.n_monat, c.n_tag, c.n_stunde,
    CASE WHEN c.n_stunde <= 100
        THEN array_agg(b.selbst_wert ORDER BY b.selbst_wert)
        ELSE NULL
    END AS rohwerte,
    AVG(b.selbst_wert) AS mittelwert,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY b.selbst_wert) AS p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY b.selbst_wert) AS median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY b.selbst_wert) AS p75,
    STDDEV(b.selbst_wert) AS stddev,
    COUNT(*) FILTER (WHERE b.selbst_wert <  1.5) AS bin_1,
    COUNT(*) FILTER (WHERE b.selbst_wert >= 1.5 AND b.selbst_wert < 2.5) AS bin_2,
    COUNT(*) FILTER (WHERE b.selbst_wert >= 2.5 AND b.selbst_wert < 3.5) AS bin_3,
    COUNT(*) FILTER (WHERE b.selbst_wert >= 3.5 AND b.selbst_wert < 4.5) AS bin_4,
    COUNT(*) FILTER (WHERE b.selbst_wert >= 4.5) AS bin_5
FROM basis b
JOIN counts c USING (frage_id, monat, doy, stunde)
GROUP BY b.doy, b.monat, b.stunde, b.frage_id, b.dimension,
         c.n_gesamt, c.n_monat, c.n_tag, c.n_stunde;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vergleichsgruppe_unique
ON mv_vergleichsgruppe (doy, stunde, frage_id);

-- Naechtlicher Refresh (03:00)
SELECT cron.schedule(
    'refresh-vergleichsgruppe',
    '0 3 * * *',
    'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vergleichsgruppe'
)
WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');
