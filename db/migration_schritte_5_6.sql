-- Schritt 5/6: Basistabellen fuer Session + Antworten
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS persoenlichkeit_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  geburtsdatum DATE NOT NULL,
  geburtszeit TIME,
  sonnenzeichen VARCHAR(20),
  lebenspfadzahl SMALLINT,
  day_master_elem VARCHAR(10),
  planet_positionen JSONB,
  geburtsort_breitengrad NUMERIC(4,1),
  geburtsort_laengengrad NUMERIC(5,1),
  kindheit_kulturraum VARCHAR(50),
  glaube_astrologie SMALLINT,
  geschlecht VARCHAR(20),
  temperament_primaer VARCHAR(20),
  temperament_sekundaer VARCHAR(20),
  temperament_verteilung JSONB,
  abgeschlossen BOOLEAN DEFAULT FALSE,
  veroeffentlichen BOOLEAN DEFAULT TRUE,
  dsgvo_zustimmung BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS persoenlichkeit_antworten (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES persoenlichkeit_sessions(session_id) ON DELETE CASCADE,
  frage_id SMALLINT NOT NULL,
  dimension VARCHAR(30) NOT NULL,
  selbst_wert NUMERIC(3,1) NOT NULL CHECK (selbst_wert >= 1 AND selbst_wert <= 5),
  system_werte JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_antworten_session ON persoenlichkeit_antworten (session_id);
CREATE INDEX IF NOT EXISTS idx_antworten_frage ON persoenlichkeit_antworten (frage_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON persoenlichkeit_sessions (created_at);
