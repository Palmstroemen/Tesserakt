"""
Speichern fuer die Forschung (nur mit Einwilligung aus dem Vorblatt), nach dem Datenschutzkonzept in ToDo.md
("Rechnen und Speichern trennen") und so, wie es frontend/src/sprache/de/datenverwendung.md verspricht:

- gespeichert: Spiel, Antworten (mit erster Antwort und Zahl der Wiederholungen), Ergebnisse je Horoskop
  (Skill, Perzentil, Fit), Geburtsjahr, Kulturraum, Sprache, Datum des Spiels, Regel- und Katalogversion
- nie: Geburtsdatum, Uhrzeit, Ort, Land, Vektoren der Horoskope (bei offenem Code liesse sich aus ihnen das
  Geburtsdatum mit Stunde zurueckrechnen), Kennungen des Geraets
- Gesundheit nur zusammengefasst: je Spiel ein gemittelter Wert statt der Einzelantworten

Das Land kommt nur an, um den Kulturraum zu bestimmen, und wird nicht gespeichert.
"""

from __future__ import annotations

import hashlib
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import geonamescache

BACKEND = Path(__file__).resolve().parent

# Kulturraeume fuer die Auswertung "Kultur und Erwartung" (ToDo.md): trifft ein Horoskop bei Menschen aus
# seinem Kulturkreis besser? Grob genug, dass sie nicht auf einen Menschen zeigen.
CHINA = {"CN", "TW", "HK", "MO"}
OSTASIEN = {"JP", "KR", "KP", "MN"}
SUEDASIEN = {"IN", "NP", "LK", "BD", "PK", "BT", "MV"}
SUEDOSTASIEN = {"TH", "VN", "KH", "LA", "MM", "MY", "SG", "ID", "PH", "BN", "TL"}
ZENTRALASIEN = {"KZ", "UZ", "TM", "KG", "TJ", "AF"}
NAHER_OSTEN = {"TR", "IL", "PS", "LB", "SY", "JO", "IQ", "IR", "SA", "YE", "OM", "AE", "QA", "BH", "KW",
               "EG", "LY", "TN", "DZ", "MA", "EH", "SD"}
KAUKASUS = {"GE", "AM", "AZ"}  # zu Europa gezaehlt
NORDAMERIKA = {"US", "CA", "GL", "BM", "PM"}


@lru_cache(maxsize=1)
def _kontinente() -> Dict[str, str]:
    return {k: v["continentcode"] for k, v in geonamescache.GeonamesCache().get_countries().items()}


def kulturraum(land: Optional[str]) -> str:
    """Kulturraum zu einem Laendercode (ISO 3166, z. B. AT); "unbekannt" ohne Land."""
    land = (land or "").upper()
    for raum, laender in (("china", CHINA), ("ostasien", OSTASIEN), ("suedasien", SUEDASIEN),
                          ("suedostasien", SUEDOSTASIEN), ("zentralasien", ZENTRALASIEN),
                          ("naher_osten", NAHER_OSTEN), ("europa", KAUKASUS), ("nordamerika", NORDAMERIKA)):
        if land in laender:
            return raum
    return {"EU": "europa", "NA": "lateinamerika", "SA": "lateinamerika", "AF": "afrika", "OC": "ozeanien",
            "AS": "asien"}.get(_kontinente().get(land, ""), "unbekannt")


@lru_cache(maxsize=1)
def regelversion() -> str:
    """Pruefsumme ueber alle Regelwerke, Fragenkataloge und die Dimensionsmatrix: dieselbe Zahl heisst, dass mit
    denselben Regeln gerechnet wurde (Ergebnisse verschiedener Versionen werden getrennt ausgewertet)."""
    h = hashlib.sha256()
    dateien = sorted(p for p in BACKEND.rglob("*.json") if "__pycache__" not in p.parts)
    for p in dateien:
        h.update(str(p.relative_to(BACKEND)).encode())
        h.update(p.read_bytes())
    return h.hexdigest()[:12]


def _gerundet(x: Optional[float], schritt: float) -> Optional[float]:
    return None if x is None else round(round(x / schritt) * schritt, 2)


def antworten_aufbereiten(antworten: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Antworten zum Speichern; die zum Lebensbereich Gesundheit je Fragenart und Zeitfenster zu einem Mittel
    zusammengefasst (auf Viertel gerundet, ohne frage_id)."""
    zeilen, gesundheit = [], {}
    for a in antworten:
        if a["dimension"] == "gesundheit":
            gesundheit.setdefault((a.get("typ"), a.get("fenster")), []).append(a)
        else:
            zeilen.append({**a, "anzahl": 1})
    for (typ, fenster), gruppe in gesundheit.items():
        mittel = lambda feld: sum(float(g[feld]) for g in gruppe) / len(gruppe)  # noqa: E731
        zeilen.append({
            "frage_id": None, "dimension": "gesundheit", "typ": typ, "fenster": fenster,
            "wert": _gerundet(mittel("wert"), 0.25), "erster_wert": _gerundet(mittel("erster_wert"), 0.25),
            "wiederholt": sum(int(g.get("wiederholt") or 0) for g in gruppe), "tage_zurueck": None,
            "anzahl": len(gruppe),
        })
    return zeilen
