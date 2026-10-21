"""
Build firdariaChart visual payload: age in 75-year cycle, current/next Firdaria period.
Uses arabisch_firdaria.json reihenfolge_und_dauern (Tag/Nacht) and haupt_firdaria for symbols.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple

FIRDARIA_JSON = Path(__file__).resolve().parent / "Arabisch" / "arabisch_firdaria.json"
PLANET_LABELS = {
    "sonne": "Sonne", "venus": "Venus", "merkur": "Merkur", "mond": "Mond",
    "saturn": "Saturn", "jupiter": "Jupiter", "mars": "Mars",
    "nordknoten": "Nordknoten", "suedknoten": "Südknoten",
}


def compute_lot_houses(asc_deg: float, sun_deg: float, moon_deg: float, is_day: bool | None = None) -> Dict[str, int]:
    """Compute whole-sign house (1–12) for Lot of Fortune and Lot of Spirit.
    is_day: Sekt; ohne Angabe Sonne ueber dem Horizont (nach Graden, nicht nach ganzen Zeichen)."""
    asc_sign = int(asc_deg // 30) % 12
    if is_day is None:
        is_day = (sun_deg - asc_deg) % 360.0 >= 180.0
    if is_day:
        lot_glueck_deg = (asc_deg + moon_deg - sun_deg) % 360
        lot_geist_deg = (asc_deg + sun_deg - moon_deg) % 360
    else:
        lot_glueck_deg = (asc_deg + sun_deg - moon_deg) % 360
        lot_geist_deg = (asc_deg + moon_deg - sun_deg) % 360
    lot_glueck_sign = int(lot_glueck_deg // 30) % 12
    lot_geist_sign = int(lot_geist_deg // 30) % 12
    lot_glueck_haus = (lot_glueck_sign - asc_sign) % 12 + 1
    lot_geist_haus = (lot_geist_sign - asc_sign) % 12 + 1
    return {"lot_glueck_haus": lot_glueck_haus, "lot_geist_haus": lot_geist_haus}


def _load_firdaria_data() -> Tuple[Dict[str, Any], Dict[str, str]]:
    data = json.loads(FIRDARIA_JSON.read_text(encoding="utf-8"))
    ro = data.get("system_uebersicht", {}).get("reihenfolge_und_dauern", data.get("reihenfolge_und_dauern", {}))
    tag = ro.get("tag_horoskop", {})
    nacht = ro.get("nacht_horoskop", {})
    haupt = data.get("haupt_firdaria", {})
    symbols = {}
    for key, blob in (haupt or {}).items():
        if isinstance(blob, dict) and "symbol" in blob:
            symbols[key] = blob["symbol"]
    return {"tag": tag, "nacht": nacht}, symbols


def _current_and_next(
    order: List[str],
    dauern: Dict[str, int],
    position: float,
    symbols: Dict[str, str],
) -> Tuple[Dict[str, Any], Dict[str, Any] | None]:
    """Return (current_period, next_period or None). position is age in [0, 75)."""
    run = 0.0
    current = None
    next_period = None
    for i, planet in enumerate(order):
        d = dauern.get(planet, 0)
        start_age = int(run)
        end_age = int(run + d)
        if run + d > position:
            current = {
                "planet": planet,
                "label": PLANET_LABELS.get(planet, planet),
                "startAge": start_age,
                "endAge": end_age,
                "symbol": symbols.get(planet, ""),
            }
            if i + 1 < len(order):
                nplanet = order[i + 1]
                nd = dauern.get(nplanet, 0)
                next_period = {
                    "planet": nplanet,
                    "label": PLANET_LABELS.get(nplanet, nplanet),
                    "startAge": end_age,
                    "endAge": end_age + nd,
                    "symbol": symbols.get(nplanet, ""),
                }
            break
        run += d
    return current or {}, next_period


def build_firdaria_chart(birth_dt: datetime, is_day: bool | None = None) -> Dict[str, Any]:
    """Build firdariaChart payload: age, isDayChart, currentPeriod, optional nextPeriod."""
    today = datetime.now()
    age = today.year - birth_dt.year
    if (today.month, today.day) < (birth_dt.month, birth_dt.day):
        age -= 1
    position = age % 75
    if is_day is None:  # Naeherung ohne Sonnenstand
        hour = birth_dt.hour + birth_dt.minute / 60.0
        is_day = 6 <= hour < 18
    try:
        tag_nacht, symbols = _load_firdaria_data()
        block = tag_nacht["tag"] if is_day else tag_nacht["nacht"]
        order = block.get("reihenfolge", [])
        dauern = block.get("dauern_jahre", {})
    except Exception:
        order = ["sonne", "venus", "merkur", "mond", "saturn", "jupiter", "mars", "nordknoten", "suedknoten"]
        dauern = {"sonne": 10, "venus": 8, "merkur": 13, "mond": 9, "saturn": 11, "jupiter": 12, "mars": 7, "nordknoten": 3, "suedknoten": 2}
        symbols = {}
    current, next_p = _current_and_next(order, dauern, position, symbols)
    payload = {
        "chartType": "firdariaChart",
        "age": age,
        "isDayChart": is_day,
        "currentPeriod": current,
    }
    if next_p:
        payload["nextPeriod"] = next_p
    return payload
