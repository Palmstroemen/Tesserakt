from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

DB_PATH = Path(__file__).resolve().parent / "assessment.db"


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _conn()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                geburtsdatum TEXT NOT NULL,
                geburtszeit TEXT,
                doy INTEGER NOT NULL,
                stunde INTEGER NOT NULL,
                inputs_json TEXT,
                metadaten_json TEXT,
                rating_json TEXT,
                temperament_json TEXT,
                abgeschlossen INTEGER NOT NULL DEFAULT 1,
                veroeffentlichen INTEGER NOT NULL DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS antworten (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                frage_id INTEGER NOT NULL,
                dimension TEXT NOT NULL,
                selbst_wert REAL NOT NULL,
                system_werte_json TEXT,
                FOREIGN KEY(session_id) REFERENCES sessions(session_id)
            );

            CREATE INDEX IF NOT EXISTS idx_antworten_frage ON antworten(frage_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_doy_stunde ON sessions(doy, stunde);
            """
        )
        conn.commit()
    finally:
        conn.close()


def persist_session(payload: Dict[str, Any]) -> str:
    session_id = payload["session_id"]
    geburtsdatum = payload["geburtsdatum"]
    geburtszeit = payload.get("geburtszeit") or "12:00"
    dt = datetime.strptime(f"{geburtsdatum} {geburtszeit}", "%Y-%m-%d %H:%M")
    doy = int(dt.strftime("%j"))
    stunde = dt.hour

    metadaten = payload.get("metadaten") or {}
    rating = payload.get("rating") or {}
    temperament = payload.get("temperament") or {}
    inputs = payload.get("inputs") or {}
    antworten = payload.get("antworten") or []

    conn = _conn()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO sessions (
                session_id, created_at, geburtsdatum, geburtszeit, doy, stunde,
                inputs_json, metadaten_json, rating_json, temperament_json,
                abgeschlossen, veroeffentlichen
            ) VALUES (?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session_id,
                geburtsdatum,
                geburtszeit,
                doy,
                stunde,
                json.dumps(inputs, ensure_ascii=False),
                json.dumps(metadaten, ensure_ascii=False),
                json.dumps(rating, ensure_ascii=False),
                json.dumps(temperament, ensure_ascii=False),
                int(bool(payload.get("abgeschlossen", True))),
                int(bool(payload.get("veroeffentlichen", True))),
            ),
        )
        conn.execute("DELETE FROM antworten WHERE session_id = ?", (session_id,))
        for antwort in antworten:
            conn.execute(
                """
                INSERT INTO antworten (session_id, frage_id, dimension, selbst_wert, system_werte_json)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    int(antwort["frage_id"]),
                    antwort["dimension"],
                    float(antwort["selbst_wert"]),
                    json.dumps(antwort.get("system_werte") or {}, ensure_ascii=False),
                ),
            )
        conn.commit()
    finally:
        conn.close()
    return session_id


def _percentile(sorted_values: List[float], p: float) -> Optional[float]:
    if not sorted_values:
        return None
    if len(sorted_values) == 1:
        return sorted_values[0]
    idx = (len(sorted_values) - 1) * p
    low = int(idx)
    high = min(low + 1, len(sorted_values) - 1)
    frac = idx - low
    return sorted_values[low] * (1 - frac) + sorted_values[high] * frac


def compare_group(doy: int, stunde: int, frage_id: int) -> Dict[str, Any]:
    conn = _conn()
    try:
        rows = conn.execute(
            """
            SELECT s.doy, s.stunde, a.frage_id, a.dimension, a.selbst_wert
            FROM antworten a
            JOIN sessions s ON s.session_id = a.session_id
            WHERE a.frage_id = ? AND s.abgeschlossen = 1 AND s.veroeffentlichen = 1
            """,
            (frage_id,),
        ).fetchall()
    finally:
        conn.close()

    values_all = [float(r["selbst_wert"]) for r in rows]
    if not values_all:
        return {
            "granularitaet": 1,
            "rohwerte": [],
            "mittelwert": None,
            "p25": None,
            "median": None,
            "p75": None,
            "stddev": None,
            "bin_1": 0,
            "bin_2": 0,
            "bin_3": 0,
            "bin_4": 0,
            "bin_5": 0,
            "n_gesamt": 0,
            "n_monat": 0,
            "n_tag": 0,
            "n_stunde": 0,
            "dimension": None,
        }

    rows_tag = [r for r in rows if int(r["doy"]) == doy]
    rows_stunde = [r for r in rows if int(r["doy"]) == doy and int(r["stunde"]) == stunde]

    n_gesamt = len(rows)
    n_monat = len(rows)  # no month in query scope, fallback to available sample
    n_tag = len(rows_tag)
    n_stunde = len(rows_stunde)

    if n_stunde > 100:
        gran = 5
        selected_values = [float(r["selbst_wert"]) for r in rows_stunde]
    elif n_stunde >= 20:
        gran = 4
        selected_values = [float(r["selbst_wert"]) for r in rows_stunde]
    elif n_tag >= 20:
        gran = 3
        selected_values = [float(r["selbst_wert"]) for r in rows_tag]
    elif n_monat >= 20:
        gran = 2
        selected_values = values_all
    else:
        gran = 1
        selected_values = values_all

    selected_values = sorted(selected_values)
    mean = sum(selected_values) / len(selected_values)
    variance = sum((v - mean) ** 2 for v in selected_values) / len(selected_values)
    stddev = variance**0.5

    return {
        "granularitaet": gran,
        "rohwerte": selected_values if len(selected_values) <= 100 else None,
        "mittelwert": round(mean, 4),
        "p25": round(_percentile(selected_values, 0.25) or 0, 4),
        "median": round(_percentile(selected_values, 0.50) or 0, 4),
        "p75": round(_percentile(selected_values, 0.75) or 0, 4),
        "stddev": round(stddev, 4),
        "bin_1": sum(1 for v in selected_values if v < 1.5),
        "bin_2": sum(1 for v in selected_values if 1.5 <= v < 2.5),
        "bin_3": sum(1 for v in selected_values if 2.5 <= v < 3.5),
        "bin_4": sum(1 for v in selected_values if 3.5 <= v < 4.5),
        "bin_5": sum(1 for v in selected_values if v >= 4.5),
        "n_gesamt": n_gesamt,
        "n_monat": n_monat,
        "n_tag": n_tag,
        "n_stunde": n_stunde,
        "dimension": rows[0]["dimension"],
    }
