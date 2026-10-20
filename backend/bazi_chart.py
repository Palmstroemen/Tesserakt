"""
Build fourPillars visual payload for Bazi (Chinese astrology).
Uses rule_engine for year/month/day pillars and day stem; adds hour pillar.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from rule_engine import (
    BRANCHES,
    STEMS,
    day_stem,
    bazi_jahr_monat,
    stem_to_element,
)

# Branch elements (Erdzweige): schema uses English
_BRANCH_ELEMENT = {
    "zi": "water", "chou": "earth", "yin": "wood", "mao": "wood",
    "chen": "earth", "si": "fire", "wu": "fire", "wei": "earth",
    "shen": "metal", "you": "metal", "xu": "earth", "hai": "water",
}
_STEM_ELEMENT_EN = {
    "jia": "wood", "yi": "wood", "bing": "fire", "ding": "fire",
    "wu": "earth", "ji": "earth", "geng": "metal", "xin": "metal",
    "ren": "water", "gui": "water",
}


def hour_pillar(birth_dt: datetime) -> tuple[str, str]:
    """Hour branch from 2-hour blocks; hour stem from 日上起时 (day stem + hour branch)."""
    hour = birth_dt.hour
    # 23-1 = zi(0), 1-3 = chou(1), 3-5 = yin(2), ...
    branch_index = ((hour + 1) // 2) % 12
    branch = BRANCHES[branch_index]
    ds = day_stem(birth_dt)
    stem_index = STEMS.index(ds) if ds in STEMS else 0
    hour_stem_index = (stem_index * 2 + branch_index) % 10
    stem = STEMS[hour_stem_index]
    return stem, branch


def build_four_pillars(birth_dt: datetime) -> Dict[str, Any]:
    """
    Build fourPillars visual payload from birth datetime.
    Year/Month/Day/Hour pillars, day master, five elements (counts from 8 chars).
    """
    ys, yb, ms, mb = bazi_jahr_monat(birth_dt)
    ds, db = day_stem(birth_dt), _day_branch(birth_dt)
    hs, hb = hour_pillar(birth_dt)

    def pillar(stem: str, branch: str, estimated: bool = False) -> Dict[str, Any]:
        return {
            "stem": stem,
            "branch": branch,
            "stemElement": _STEM_ELEMENT_EN.get(stem, "earth"),
            "branchElement": _BRANCH_ELEMENT.get(branch, "earth"),
            "estimated": estimated,
        }

    db = _day_branch(birth_dt)
    pillars = {
        "year": pillar(ys, yb),
        "month": pillar(ms, mb),
        "day": pillar(ds, db),
        "hour": pillar(hs, hb, estimated=not (0 <= birth_dt.hour < 24)),
    }

    # Hour pillar unknown if no time given - mark estimated
    if birth_dt.hour == 12 and birth_dt.minute == 0:
        pillars["hour"]["estimated"] = True

    day_master_el = stem_to_element(ds)
    five = _five_elements_from_pillars(pillars)
    return {
        "chartType": "fourPillars",
        "pillars": pillars,
        "dayMaster": {
            "stem": ds,
            "element": _STEM_ELEMENT_EN.get(ds, "earth"),
            "strength": "medium",
        },
        "fiveElements": five,
        "renderHints": {
            "showCycleDiagram": True,
            "showElementBars": True,
        },
    }


def _day_branch(birth_dt: datetime) -> str:
    """Day branch from 60-day cycle (same cycle as day stem)."""
    day_60 = (birth_dt - datetime(1924, 2, 5)).days % 60
    return BRANCHES[day_60 % 12]


def _five_elements_from_pillars(pillars: Dict[str, Any]) -> Dict[str, float]:
    """Count stem+branch elements across 4 pillars, normalize to sum 1."""
    counts = {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}
    for key in ("year", "month", "day", "hour"):
        p = pillars.get(key, {})
        for el_key in ("stemElement", "branchElement"):
            el = p.get(el_key)
            if el and el in counts:
                counts[el] += 1
    total = sum(counts.values()) or 1
    return {k: round(v / total, 2) for k, v in counts.items()}
