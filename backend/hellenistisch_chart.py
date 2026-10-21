"""
Build profectionChart visual payload: age -> active house (1-12), sect (day/night).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict


def build_profection_chart(birth_dt: datetime, is_day: bool | None = None) -> Dict[str, Any]:
    """Build profectionChart payload: age, activeHouse (1-12), isDayChart, activeHouseLabel."""
    today = datetime.now()
    age = today.year - birth_dt.year
    if (today.month, today.day) < (birth_dt.month, birth_dt.day):
        age -= 1
    active_house = (age % 12) + 1
    if is_day is None:  # Naeherung ohne Sonnenstand
        hour = birth_dt.hour + birth_dt.minute / 60.0
        is_day = 6 <= hour < 18
    is_day_chart = is_day
    return {
        "chartType": "profectionChart",
        "age": age,
        "activeHouse": active_house,
        "activeHouseLabel": f"Haus {active_house}",
        "isDayChart": is_day_chart,
    }
