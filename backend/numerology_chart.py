"""
Build numerologyChart visual payload (Lebenspfadzahl + reduction steps).
Uses same life-path logic as rule_engine for consistency.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

MASTER_NUMBERS = (11, 22, 33)


def _reduce(n: int) -> int:
    """Reduce to 1-9 or master number 11, 22, 33."""
    while n > 9 and n not in MASTER_NUMBERS:
        n = sum(int(x) for x in str(n))
    return n


def _digit_sum(n: int) -> int:
    """Single digit sum (no master number stop)."""
    while n > 9:
        n = sum(int(x) for x in str(n))
    return n


def build_numerology_chart(birth_dt: datetime) -> Dict[str, Any]:
    """
    Build numerologyChart payload: life path number, reduction steps, optional birth date.
    Matches rule_engine life_path() logic (Meisterzahlen 11, 22, 33 preserved).
    """
    day, month, year = birth_dt.day, birth_dt.month, birth_dt.year
    d_red = _reduce(day)
    m_red = _reduce(month)
    y_red = _reduce(year)
    total = d_red + m_red + y_red
    life_path_num = _reduce(total)

    # Steps for display: Tag, Monat, Jahr (raw), then reduced, then sum, then result
    reduction_steps: List[Dict[str, Any]] = [
        {"label": "Tag", "value": day},
        {"label": "Monat", "value": month},
        {"label": "Jahr", "value": year},
        {"label": "Quersumme Tag", "value": d_red},
        {"label": "Quersumme Monat", "value": m_red},
        {"label": "Quersumme Jahr", "value": y_red},
        {"label": "Summe", "value": total},
        {"label": "Lebenspfad", "value": life_path_num},
    ]

    return {
        "chartType": "numerologyChart",
        "lifePathNumber": life_path_num,
        "isMasterNumber": life_path_num in MASTER_NUMBERS,
        "reductionSteps": reduction_steps,
        "birthDateComponents": {"day": day, "month": month, "year": year},
    }
