"""
Geburtsort-Suche (offline): Orte ab 15.000 Einwohnern aus GeoNames (via geonamescache),
mit Koordinaten und IANA-Zeitzone. Daten: GeoNames, CC BY 4.0 (https://www.geonames.org).
"""

from __future__ import annotations

import unicodedata
from functools import lru_cache
from typing import Any, Dict, List


def _umschrift(text: str) -> str:
    return text.casefold().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")


def _anzeigename(ort: Dict[str, Any], q: str) -> str:
    """Der zur Eingabe passende Name, bevorzugt in Originalschreibweise mit Umlauten (Muenchen -> München)."""
    passend = [n for n in ort["namen"] if n[:1].isupper() and n.isprintable()
               and (_norm(n).startswith(_norm(q)) or _umschrift(n).startswith(_umschrift(q)))]
    mit_umlaut = [n for n in passend if any(c in n for c in "äöüÄÖÜß")]
    wortgleich = [n for n in passend if n.casefold().startswith(q.casefold())]
    return (mit_umlaut or wortgleich or passend or [ort["name"]])[0]


def _norm(text: str) -> str:
    """Kleinschreibung ohne Akzente; Umlaute auch als ae/oe/ue suchbar."""
    text = text.casefold().replace("ß", "ss")
    text = unicodedata.normalize("NFKD", text)
    return "".join(c for c in text if not unicodedata.combining(c))


@lru_cache(maxsize=1)
def _index() -> List[Dict[str, Any]]:
    import geonamescache

    gc = geonamescache.GeonamesCache()
    laender = {code: data["name"] for code, data in gc.get_countries().items()}
    orte = []
    for city in gc.get_cities().values():
        namen = [city["name"], *[a for a in city.get("alternatenames", []) if a]]
        schluessel = {_norm(n) for n in namen}
        # Umlaut-Umschreibung (Muenchen -> muenchen) zusaetzlich zur Grundform (munchen)
        schluessel |= {_umschrift(n) for n in namen}
        orte.append({
            "name": city["name"],
            "namen": namen,
            "schluessel": schluessel,
            "land": laender.get(city["countrycode"], city["countrycode"]),
            "lat": city["latitude"],
            "lon": city["longitude"],
            "zeitzone": city["timezone"],
            "einwohner": city.get("population", 0),
        })
    return orte


def suche(q: str, limit: int = 8) -> List[Dict[str, Any]]:
    """Orte, deren Name (oder alternativer Name) mit q beginnt; exakte Treffer zuerst, dann nach Einwohnern."""
    nq = _norm(q.strip())
    if len(nq) < 2:
        return []
    uq = _umschrift(q.strip())
    treffer = []
    for ort in _index():
        exakt = nq in ort["schluessel"] or uq in ort["schluessel"]
        if exakt or any(k.startswith(nq) or k.startswith(uq) for k in ort["schluessel"]):
            # Anzeigename: der zur Eingabe passende Name (z. B. "Wien" statt "Vienna")
            treffer.append((not exakt, -ort["einwohner"], {
                "name": _anzeigename(ort, q.strip()), "land": ort["land"], "lat": ort["lat"], "lon": ort["lon"],
                "zeitzone": ort["zeitzone"],
            }))
    treffer.sort(key=lambda t: (t[0], t[1]))
    return [t[2] for t in treffer[:limit]]
