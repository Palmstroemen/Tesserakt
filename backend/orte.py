"""
Geburtsort-Suche (offline): Orte ab 15.000 Einwohnern aus GeoNames (via geonamescache),
mit Koordinaten und IANA-Zeitzone. Daten: GeoNames, CC BY 4.0 (https://www.geonames.org).
"""

from __future__ import annotations

import math
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
            "code": city["countrycode"],
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


@lru_cache(maxsize=1)
def _laender() -> List[Dict[str, Any]]:
    """Laender mit mindestens einem Ort im Index (ISO-Code und englischer Name; uebersetzt wird im Frontend)."""
    namen = {}
    for ort in _index():
        namen[ort["code"]] = ort["land"]
    return [{"code": c, "name": n} for c, n in sorted(namen.items())]


def laender(zeitzone: str = "") -> Dict[str, Any]:
    """Alle Laender; dazu ein Vorschlag aus der Zeitzone des Geraets (Land mit den meisten Einwohnern darin)."""
    gewicht: Dict[str, int] = {}
    if zeitzone:
        for ort in _index():
            if ort["zeitzone"] == zeitzone:
                gewicht[ort["code"]] = gewicht.get(ort["code"], 0) + (ort["einwohner"] or 1)
    vorschlag = max(gewicht, key=gewicht.get) if gewicht else None
    return {"laender": _laender(), "vorschlag": vorschlag}


# Deutsche Namen grosser Staedte, die GeoNames nur englisch fuehrt (Prototyp, erweiterbar)
EXONYME = {
    "Vienna": "Wien", "Munich": "München", "Cologne": "Köln", "Nuremberg": "Nürnberg", "Hanover": "Hannover",
    "Brunswick": "Braunschweig", "Zurich": "Zürich", "Geneva": "Genf", "Lucerne": "Luzern", "Rome": "Rom",
    "Milan": "Mailand", "Venice": "Venedig", "Naples": "Neapel", "Florence": "Florenz", "Prague": "Prag",
    "Warsaw": "Warschau", "Krakow": "Krakau", "Moscow": "Moskau", "Lisbon": "Lissabon", "Brussels": "Brüssel",
    "Copenhagen": "Kopenhagen", "Athens": "Athen", "Belgrade": "Belgrad", "Bucharest": "Bukarest",
    "Kyiv": "Kiew", "Saint Petersburg": "Sankt Petersburg", "Beijing": "Peking", "Tokyo": "Tokio",
    "Mexico City": "Mexiko-Stadt", "New Delhi": "Neu-Delhi", "Cairo": "Kairo", "The Hague": "Den Haag",
    "Antwerp": "Antwerpen", "Strasbourg": "Straßburg", "Seville": "Sevilla",
}


def _deutscher_name(ort: Dict[str, Any]) -> str:
    if ort["name"] in EXONYME:
        return EXONYME[ort["name"]]
    # gleiche Schreibweise mit Umlaut/ß bevorzugen (Zurich -> Zürich)
    for alt in ort["namen"]:
        if alt != ort["name"] and _norm(alt) == _norm(ort["name"]) and any(c in alt for c in "äöüÄÖÜß"):
            return alt
    return ort["name"]


def _ist_stadtteil(ort: Dict[str, Any], groessere: List[Dict[str, Any]]) -> bool:
    """Faustregel (GeoNames kennzeichnet Stadtteile hier nicht): ohne eigene Namensvarianten und
    weniger als 12 km neben einem groesseren Ort."""
    for g in groessere:
        # "Hamburg-Nord", "Zürich (Kreis 4) / Aussersihl"
        if ort["name"].startswith(g["name"]) and ort["name"][len(g["name"]):][:1] in ("-", " ", "("):
            return True
    if len([n for n in ort["namen"] if n]) > 2:
        return False
    for g in groessere:
        dy = (ort["lat"] - g["lat"]) * 111.0
        dx = (ort["lon"] - g["lon"]) * 111.0 * math.cos(math.radians(ort["lat"]))
        if dx * dx + dy * dy < 144:
            return True
    return False


def staedte(code: str, limit: int = 60) -> List[Dict[str, Any]]:
    """Die groessten Orte eines Landes (nach Einwohnern ausgewaehlt), alphabetisch sortiert."""
    orte = [o for o in _index() if o["code"] == code.upper()]
    orte.sort(key=lambda o: -(o["einwohner"] or 0))
    auswahl: List[Dict[str, Any]] = []
    for i, o in enumerate(orte):
        if len(auswahl) >= limit:
            break
        if not _ist_stadtteil(o, orte[:i]) and _deutscher_name(o) not in {_deutscher_name(a) for a in auswahl}:
            auswahl.append(o)
    auswahl.sort(key=lambda o: _norm(_deutscher_name(o)))
    return [{"name": _deutscher_name(o), "land": o["land"], "lat": o["lat"], "lon": o["lon"], "zeitzone": o["zeitzone"],
             "einwohner": o["einwohner"]} for o in auswahl]
