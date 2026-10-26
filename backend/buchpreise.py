"""
Preise des gedruckten Horoskopbuchs je Markt (Waehrung und Staffel nach Anzahl der Horoskope), dazu laufende
Aktionen. Bis der Druckpartner feststeht, kommen sie aus content/buch/preise.json; spaeter liefert sie dessen
Shop, und nur preise() muss sich aendern. Die App formatiert den Betrag in ihrer Sprache.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any, Dict, Optional

import orte

DATEI = Path(__file__).resolve().parent.parent / "content" / "buch" / "preise.json"


def preise(zeitzone: str, sprache: str, heute: Optional[date] = None) -> Dict[str, Any]:
    """Markt fuer das Land der Zeitzone des Geraets: Waehrung, Staffel, laufende Aktion (Name in der Sprache)."""
    daten = json.loads(DATEI.read_text(encoding="utf-8"))
    land = orte.laender(zeitzone)["vorschlag"] if zeitzone else None
    markt = next((m for m in daten["maerkte"].values() if land in m.get("laender", [])),
                 daten["maerkte"][daten["_meta"]["grund"]])
    tag = (heute or date.today()).isoformat()
    aktion = next((a for a in daten.get("aktionen", []) if a["von"] <= tag <= a["bis"]), None)
    return {
        "land": land,
        "waehrung": markt["waehrung"],
        "staffel": markt["staffel"],
        "aktion": {"name": aktion["name"].get(sprache) or aktion["name"].get("de", ""), "rabatt": aktion["rabatt"]}
        if aktion else None,
    }
