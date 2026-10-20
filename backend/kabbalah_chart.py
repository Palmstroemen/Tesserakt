"""
Build kabbalahTree visual payload: life path number -> active Sephira (1-10).
Uses same reduction as rule_engine (11->2, 22->4, 33->6; else reduce to 1-10).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from rule_engine import life_path

SEPHIROTH_NAMES = [
    "Kether", "Chokmah", "Binah", "Chesed", "Geburah",
    "Tiphereth", "Netzach", "Hod", "Yesod", "Malkuth",
]
MASTER_TO_SEPHIRA = {"11": 2, "22": 4, "33": 6}  # 1-based index -> Sephira 2, 4, 6


def _life_path_to_sephira_index(lpn: int) -> int:
    """Map life path number to Sephira index 1-10 (1-based)."""
    if lpn in (11, 22, 33):
        return MASTER_TO_SEPHIRA.get(str(lpn), 1)
    n = lpn
    while n > 10:
        n = sum(int(x) for x in str(n))
    if n == 0:
        n = 10
    return n


def build_kabbalah_chart(birth_dt: datetime) -> Dict[str, Any]:
    """Build kabbalahTree payload: lifePathNumber, activeSephira (number + name), sephirothList."""
    lpn = life_path(birth_dt)
    idx = _life_path_to_sephira_index(lpn)
    name = SEPHIROTH_NAMES[idx - 1] if 1 <= idx <= 10 else "Malkuth"
    sephiroth_list = [
        {"number": i, "name": SEPHIROTH_NAMES[i - 1]}
        for i in range(1, 11)
    ]
    return {
        "chartType": "kabbalahTree",
        "lifePathNumber": lpn,
        "activeSephira": {"number": idx, "name": name},
        "sephirothList": sephiroth_list,
    }
