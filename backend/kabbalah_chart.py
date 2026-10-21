"""
Build kabbalahTree visual payload: life path number -> active Sephira (1-10).
Uses same reduction as rule_engine (11->2, 22->4, 33->6; else reduce to 1-10).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from rule_engine import PFAD_ORDER, life_path, load_rules

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
    """Build kabbalahTree payload: lifePathNumber, activeSephira (number + name), sephirothList,
    activePath (einer der 22 Pfade, gleiche Zuordnung wie in der Wertung: Tag des Jahres) und die
    hebraeischen Buchstaben aller Pfade."""
    lpn = life_path(birth_dt)
    idx = _life_path_to_sephira_index(lpn)
    name = SEPHIROTH_NAMES[idx - 1] if 1 <= idx <= 10 else "Malkuth"
    # Pfad: wie rule_engine (pfad_index aus dem Tag des Jahres, Pfade 11..32 aus kabbalah_pfade.json)
    pfad_index = int((birth_dt.timetuple().tm_yday - 1) * 22 / 365) % 22
    alle = load_rules("Kabbalah").get("pfade", {})
    pfade = [
        {
            "number": int(k),
            "from": alle[k]["von_sephira"]["nummer"],
            "to": alle[k]["zu_sephira"]["nummer"],
            "letter": alle[k].get("buchstabe_hebraeisch"),
            "letterName": alle[k].get("buchstabe_name"),
        }
        for k in PFAD_ORDER
        if k in alle
    ]
    aktiver_pfad = next((p for p in pfade if p["number"] == int(PFAD_ORDER[pfad_index])), None)

    # Notizen fuer die Grafik (Randbemerkungen): dieselben Regeldaten, die auch die Wertung nutzt
    def extreme(vektor: Dict[str, float]) -> Dict[str, List[str]]:
        if not vektor:
            return {"stark": [], "schwach": []}
        hoch = max(vektor.values())
        tief = min(vektor.values())
        return {
            "stark": [d for d, v in vektor.items() if v == hoch],
            "schwach": [d for d, v in vektor.items() if v == tief and tief < hoch],
        }

    seph_daten = load_rules("Kabbalah").get("sephiroth", {})
    seph = next((v for v in seph_daten.values() if v.get("nummer") == idx), {}) if isinstance(seph_daten, dict) else {}
    notizen = {
        "sephira": {
            "deutsch": (seph.get("name_deutsch") or "").split(" / ")[-1],
            **extreme(seph.get("dimensionen_vektor") or {}),
        },
    }
    if aktiver_pfad:
        roh = alle[str(aktiver_pfad["number"])]
        tarot = (roh.get("tarot") or "").split("—")[-1].split("(")[0].strip()
        notizen["pfad"] = {
            "bedeutung": (roh.get("buchstabe_bedeutung") or "").split("—")[0].split("/")[0].strip(),
            "tarot": tarot,
            **extreme(roh.get("dimensionen_vektor") or {}),
        }
    sephiroth_list = [
        {"number": i, "name": SEPHIROTH_NAMES[i - 1]}
        for i in range(1, 11)
    ]
    return {
        "chartType": "kabbalahTree",
        "lifePathNumber": lpn,
        "activeSephira": {"number": idx, "name": name},
        "sephirothList": sephiroth_list,
        "activePath": aktiver_pfad,
        "notes": notizen,
        "paths": pfade,
    }
