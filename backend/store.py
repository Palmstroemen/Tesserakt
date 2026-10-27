"""
Forschungsdatenbank (SQLite): eine Zeile je gespielter Runde, die Antworten in einer eigenen Tabelle, verbunden
nur ueber eine zufaellige Kennung der Runde. Was gespeichert wird und was nie, steht in forschung.py.

Die frueheren Tabellen sessions/antworten (mit genauem Geburtsdatum) werden nicht mehr angelegt oder
beschrieben; eine alte Datenbank behaelt sie, bis sie geloescht wird.
"""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import date
from pathlib import Path
from typing import Any, Dict, List

# Auf dem Server liegt die Datenbank auf einem eigenen Volume (TESSERAKT_DB, siehe server/docker-compose.yml)
DB_PATH = Path(os.environ.get("TESSERAKT_DB") or Path(__file__).resolve().parent / "assessment.db")


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _conn()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS runden (
                runde_id TEXT PRIMARY KEY,
                gespielt_am TEXT NOT NULL,
                spiel TEXT NOT NULL,
                sprache TEXT,
                geraet_sprache TEXT,
                kulturraum TEXT NOT NULL,
                geburtsjahr INTEGER,
                uhrzeit_bekannt INTEGER NOT NULL,
                ort_bekannt INTEGER NOT NULL,
                regelversion TEXT NOT NULL,
                katalog_version TEXT,
                ergebnisse_json TEXT NOT NULL
            );

            -- Antworten getrennt von der Runde; Gesundheit nur zusammengefasst (frage_id leer, anzahl > 1)
            CREATE TABLE IF NOT EXISTS runden_antworten (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                runde_id TEXT NOT NULL,
                frage_id INTEGER,
                dimension TEXT NOT NULL,
                typ TEXT,
                fenster TEXT,
                wert REAL NOT NULL,
                erster_wert REAL NOT NULL,
                wiederholt INTEGER NOT NULL DEFAULT 0,
                tage_zurueck INTEGER,
                anzahl INTEGER NOT NULL DEFAULT 1
            );

            -- Spiel B: "Wann war das?" zu den festen Ereignisfragen (ohne Gesundheit)
            CREATE TABLE IF NOT EXISTS runden_zeitpunkte (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                runde_id TEXT NOT NULL,
                frage_id INTEGER NOT NULL,
                dimension TEXT NOT NULL,
                antwort TEXT NOT NULL,
                tage_zurueck INTEGER
            );

            CREATE INDEX IF NOT EXISTS idx_runden_antworten_runde ON runden_antworten(runde_id);
            CREATE INDEX IF NOT EXISTS idx_runden_zeitpunkte_runde ON runden_zeitpunkte(runde_id);
            """
        )
        conn.commit()
    finally:
        conn.close()


def runde_speichern(runde: Dict[str, Any], antworten: List[Dict[str, Any]], zeitpunkte: List[Dict[str, Any]]) -> None:
    """Eine Runde mit ihren Antworten; dieselbe runde_id noch einmal (Antwort zurueckgenommen und neu
    beantwortet) ersetzt die alte."""
    conn = _conn()
    try:
        rid = runde["runde_id"]
        conn.execute(
            """
            INSERT OR REPLACE INTO runden (
                runde_id, gespielt_am, spiel, sprache, geraet_sprache, kulturraum, geburtsjahr,
                uhrzeit_bekannt, ort_bekannt, regelversion, katalog_version, ergebnisse_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rid,
                date.today().isoformat(),
                runde["spiel"],
                runde.get("sprache"),
                runde.get("geraet_sprache"),
                runde["kulturraum"],
                runde.get("geburtsjahr"),
                int(bool(runde.get("uhrzeit_bekannt"))),
                int(bool(runde.get("ort_bekannt"))),
                runde["regelversion"],
                runde.get("katalog_version"),
                json.dumps(runde.get("ergebnisse") or {}, ensure_ascii=False),
            ),
        )
        conn.execute("DELETE FROM runden_antworten WHERE runde_id = ?", (rid,))
        conn.execute("DELETE FROM runden_zeitpunkte WHERE runde_id = ?", (rid,))
        conn.executemany(
            """
            INSERT INTO runden_antworten
                (runde_id, frage_id, dimension, typ, fenster, wert, erster_wert, wiederholt, tage_zurueck, anzahl)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (rid, a.get("frage_id"), a["dimension"], a.get("typ"), a.get("fenster"), float(a["wert"]),
                 float(a["erster_wert"]), int(a.get("wiederholt") or 0), a.get("tage_zurueck"), int(a["anzahl"]))
                for a in antworten
            ],
        )
        conn.executemany(
            """
            INSERT INTO runden_zeitpunkte (runde_id, frage_id, dimension, antwort, tage_zurueck)
            VALUES (?, ?, ?, ?, ?)
            """,
            [(rid, z["frage_id"], z["dimension"], z["antwort"], z.get("tage_zurueck")) for z in zeitpunkte],
        )
        conn.commit()
    finally:
        conn.close()
