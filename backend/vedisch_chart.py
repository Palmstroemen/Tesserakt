"""
Build dashaChart visual payload: age in 120-year Vimshottari cycle, active Mahadasha.
Simplified entry: position = (age + (birth_dt.year - 1900)) % 120.
Optional nakshatraIndex from day of year (1–365 -> 0–26).
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DASHA_JSON = Path(__file__).resolve().parent / "Vedisch" / "jyotish_dasha.json"
ORDER_KEY = ["ketu", "venus", "sonne", "mond", "mars", "rahu", "jupiter", "saturn", "merkur"]
# Ephemeris planet id -> rule key (jyotish_yogas / house lords)
EPHEMERIS_PLANET_TO_RULE = {"sun": "sonne", "moon": "mond", "mercury": "merkur", "venus": "venus", "mars": "mars", "jupiter": "jupiter", "saturn": "saturn"}
# Whole-sign house lord by sign index (0=Aries .. 11=Pisces)
HOUSE_LORD_BY_SIGN = ["mars", "venus", "merkur", "mond", "sonne", "merkur", "venus", "mars", "jupiter", "saturn", "saturn", "jupiter"]
# Raja-Yoga rule id -> (house_a, house_b) for simple conjunction/opposition check
RAJA_YOGA_HOUSE_PAIRS = [("RY_01", 1, 9), ("RY_02", 5, 10), ("RY_03", 9, 10), ("RY_04", 4, 5), ("RY_05", 7, 9)]

PLANET_LABELS = {
    "ketu": "Ketu", "venus": "Venus", "sonne": "Sonne", "mond": "Mond",
    "mars": "Mars", "rahu": "Rahu", "jupiter": "Jupiter", "saturn": "Saturn", "merkur": "Merkur",
}


def _load_dasha_data() -> Tuple[List[str], Dict[str, int]]:
    data = json.loads(DASHA_JSON.read_text(encoding="utf-8"))
    ueber = data.get("system_uebersicht", {})
    grund = ueber.get("grundprinzip", {})
    reihe = grund.get("reihenfolge", ["Ketu", "Venus", "Sonne", "Mond", "Mars", "Rahu", "Jupiter", "Saturn", "Merkur"])
    order = [r.lower() for r in reihe if isinstance(r, str)]
    dauern_raw = data.get("mahadasha_dauern", {})
    dauern = {}
    for k, v in (dauern_raw or {}).items():
        if k == "quelle" or not isinstance(v, dict):
            continue
        j = v.get("jahre", 0)
        if isinstance(j, (int, float)):
            dauern[k] = int(j)
    if not order:
        order = ORDER_KEY
    if not dauern:
        dauern = {"ketu": 7, "venus": 20, "sonne": 6, "mond": 10, "mars": 7, "rahu": 18, "jupiter": 16, "saturn": 19, "merkur": 17}
    return order, dauern


def _position_at_birth_from_nakshatra(
    nakshatra_index: int,
    anteil: float,
    order: List[str],
    dauern: Dict[str, int],
) -> float:
    """Position (0–120) at birth from moon nakshatra: first lord = index % 9, elapsed = sum(previous) + anteil * first_duration."""
    first_lord_idx = nakshatra_index % 9
    pos = 0.0
    for i in range(first_lord_idx):
        pos += dauern.get(order[i], 0)
    pos += anteil * dauern.get(order[first_lord_idx], 0)
    return pos % 120.0


def vimshottari_position_now(
    nakshatra_index: int,
    anteil: float,
    alter: float,
) -> float:
    """Current position (0–120) in Vimshottari cycle from birth nakshatra and age. (position_at_birth + alter) % 120."""
    try:
        order, dauern = _load_dasha_data()
    except Exception:
        order = ORDER_KEY
        dauern = {"ketu": 7, "venus": 20, "sonne": 6, "mond": 10, "mars": 7, "rahu": 18, "jupiter": 16, "saturn": 19, "merkur": 17}
    pos_birth = _position_at_birth_from_nakshatra(nakshatra_index, anteil, order, dauern)
    return (pos_birth + alter) % 120.0


def compute_aktivierte_yogas(asc_deg: float, planets: List[Any]) -> List[str]:
    """From ephemeris ASC and planet positions (Whole-Sign), detect simple Raja Yogas: lord of house A and lord of house B in same sign or opposition. Returns list of rule ids (e.g. RY_01, RY_02)."""
    asc_sign = int(asc_deg // 30) % 12
    planet_sign: Dict[str, int] = {}
    for p in planets:
        rule_id = EPHEMERIS_PLANET_TO_RULE.get(getattr(p, "id", ""), getattr(p, "id", ""))
        planet_sign[rule_id] = getattr(p, "sign_index", 0)
    activated: List[str] = []
    for rule_id, h1, h2 in RAJA_YOGA_HOUSE_PAIRS:
        sign1 = (asc_sign + h1 - 1) % 12
        sign2 = (asc_sign + h2 - 1) % 12
        lord1 = HOUSE_LORD_BY_SIGN[sign1]
        lord2 = HOUSE_LORD_BY_SIGN[sign2]
        s1 = planet_sign.get(lord1)
        s2 = planet_sign.get(lord2)
        if s1 is None or s2 is None:
            continue
        if s1 == s2 or (s1 + 6) % 12 == s2:
            activated.append(rule_id)
    return activated


def _current_mahadasha(order: List[str], dauern: Dict[str, int], position: float) -> Dict[str, Any]:
    """position in [0, 120). Return current period { planet, label, startAge, endAge }."""
    run = 0.0
    for planet in order:
        d = dauern.get(planet, 0)
        start_age = int(run)
        end_age = int(run + d)
        if run + d > position:
            return {
                "planet": planet,
                "label": PLANET_LABELS.get(planet, planet),
                "startAge": start_age,
                "endAge": end_age,
            }
        run += d
    return {}


def build_dasha_chart(
    birth_dt: datetime,
    nakshatra_index: Optional[int] = None,
    nakshatra_anteil: Optional[float] = None,
) -> Dict[str, Any]:
    """Build dashaChart payload: age, activeMahadasha, periods (all 9), optional nakshatraIndex.
    When nakshatra_index and nakshatra_anteil are provided (from ephemeris), position uses Vimshottari from moon nakshatra; else fallback (age + (year - 1900)) % 120."""
    today = datetime.now()
    age = today.year - birth_dt.year
    if (today.month, today.day) < (birth_dt.month, birth_dt.day):
        age -= 1
    try:
        order, dauern = _load_dasha_data()
    except Exception:
        order = ORDER_KEY
        dauern = {"ketu": 7, "venus": 20, "sonne": 6, "mond": 10, "mars": 7, "rahu": 18, "jupiter": 16, "saturn": 19, "merkur": 17}
    if nakshatra_index is not None and nakshatra_anteil is not None:
        alter = (today - birth_dt).total_seconds() / (365.2425 * 86400)
        position = vimshottari_position_now(nakshatra_index, nakshatra_anteil, alter)
    else:
        position = (age + (birth_dt.year - 1900)) % 120
    active = _current_mahadasha(order, dauern, position)
    run = 0.0
    periods = []
    for planet in order:
        d = dauern.get(planet, 0)
        start_age = int(run)
        end_age = int(run + d)
        periods.append({
            "planet": planet,
            "label": PLANET_LABELS.get(planet, planet),
            "startAge": start_age,
            "endAge": end_age,
            "years": d,
        })
        run += d
    if nakshatra_index is not None:
        nakshatra_idx = min(26, max(0, nakshatra_index))
    else:
        day_of_year = (birth_dt - datetime(birth_dt.year, 1, 1)).days + 1
        nakshatra_idx = min(26, max(0, int((day_of_year - 1) * 27 / 365)))
    payload = {
        "chartType": "dashaChart",
        "age": age,
        "activeMahadasha": active,
        "periods": periods,
        "nakshatraIndex": nakshatra_idx,
    }
    return payload
