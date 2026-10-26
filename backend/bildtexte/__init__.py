"""Bildtexte: ein Absatz je Horoskop, der die Grafik im Auge erklaert und an einem Merkmal zeigt, was sie fuer
die Person bedeutet (Spiele A und B). Grundlage sind die Bilddaten aus /vektor (visualPayloads) und die
Deutungen aus den Regeldateien; formuliert wird vorsichtig ("nach der Ueberlieferung", "koennte").

Hier wird nur gesammelt, was im Absatz vorkommt (die Fakten, unabhaengig von der Sprache). Die Saetze baut je
Sprache ein eigenes Modul daneben (de.py, ...): Artikel, Faelle und Satzstellung sind zu verschieden, als dass
sich eine Vorlage fuer alle Sprachen lohnte. Ein neues Sprachmodul braucht dieselben Funktionen wie de.py.

Jede Funktion beschreibt nur, was die Grafik in frontend/src/apparat/diagramme/ wirklich zeigt.

Spiel C: paarbildtext() erklaert die Grafik fuer zwei (*Paar.jsx). Die Fakten sind dort schon die Daten aus
backend/paar.py (Art der Verbindung, Kutas, Aspekte), die Saetze stehen je Sprache in PAAR.
"""

import importlib
from typing import Any, Callable, Dict, Optional

import sprache as sp


def satz(text: str) -> str:
    """Erster Satz eines Regeltextes (ohne Zitate und Klammerzusaetze am Ende)."""
    text = (text or "").strip()
    for ende in (". ", "! ", "? "):
        k = text.find(ende)
        if k > 0:
            text = text[: k + 1]
            break
    return text if text.endswith((".", "!", "?")) else text + "."


def erste(text: str, n: int) -> str:
    """Die ersten n Eintraege einer Aufzaehlung."""
    return ", ".join(t.strip() for t in satz(text).rstrip(".").split(",")[:n])


# --- Westliche Astrologie -----------------------------------------------------------------------------------

PLANET_DE = {
    "sun": "sonne", "moon": "mond", "mercury": "merkur", "venus": "venus", "mars": "mars",
    "jupiter": "jupiter", "saturn": "saturn", "uranus": "uranus", "neptune": "neptun", "pluto": "pluto",
}
# in WestlichNacht.jsx gezeichnete Aspekte (Konjunktionen werden nicht gezeichnet), Schluessel in den Regeln
ASPEKT = {"opposition": "opposition", "square": "quadrat", "trine": "trigon", "sextile": "sextil"}
REIHENFOLGE = ["sonne", "mond", "merkur", "venus", "mars", "jupiter", "saturn", "uranus", "neptun", "pluto"]


def _westlich(p: Dict[str, Any], s: str) -> Dict[str, Any]:
    kombi = sp.regeldatei("Westlich/timing_rules.json", s)["planet_planet_aspekte"]["kombinationen"]
    beste = None
    for a in p.get("aspects") or []:
        art = ASPEKT.get(a.get("type"))
        x, y = PLANET_DE.get(a.get("a")), PLANET_DE.get(a.get("b"))
        if not art or not x or not y:
            continue
        x, y = sorted((x, y), key=REIHENFOLGE.index)
        text = (kombi.get(f"{x}_{y}") or {}).get(art, {}).get("text_de")
        if text and (beste is None or a.get("orbDeg", 9) < beste[0]):
            beste = (a.get("orbDeg", 9), x, y, art, text)
    f = {"haeuser": (p.get("houses") or {}).get("system") == "placidus"}
    if beste:
        _, f["a"], f["b"], f["aspekt"], f["deutung"] = beste
    return f


# --- Bazi ---------------------------------------------------------------------------------------------------

ELEMENT_DE = {"wood": "holz", "fire": "feuer", "earth": "erde", "metal": "metall", "water": "wasser"}


def _bazi(p: Dict[str, Any], s: str) -> Dict[str, Any]:
    f: Dict[str, Any] = {"stunde_geschaetzt": bool(((p.get("pillars") or {}).get("hour") or {}).get("estimated"))}
    regeln = sp.regeldatei("Bazi/bazi_rules.json", s)
    daten = regeln["heavenly_stems"].get((p.get("dayMaster") or {}).get("stem") or "")
    if daten:
        element, polaritaet = (daten.get("element") or "_").split("_")
        f["tagesmeister"] = {
            "zeichen": daten.get("symbol", ""), "element": element, "polaritaet": polaritaet,
            "qualitaet": daten.get("qualitaet", ""),
            "staerken": regeln["day_master_profiles"].get(element, {}).get("staerken"),
        }
    anteile = {ELEMENT_DE.get(k, k): v for k, v in (p.get("fiveElements") or {}).items()}
    if anteile:
        f["stark"] = max(anteile, key=anteile.get)
        f["fehlt"] = [e for e, v in anteile.items() if v == 0]
    return f


# --- Hellenistische Astrologie ------------------------------------------------------------------------------

def _hellenistisch(p: Dict[str, Any], s: str) -> Dict[str, Any]:
    haus, herr = p.get("activeHouse"), p.get("yearLord")
    regeln = sp.regeldatei("Hellenistisch/hell_zeitherren.json", s)["jaehrliche_profektionen"]
    return {
        "haus": haus, "alter": p.get("age"), "herr": herr,
        "thema": (regeln["profektionshaus_themen"].get(f"haus_{haus}") or {}).get("thema"),
        "wirkung": (regeln["jahresherrscher"].get(f"wirkung_{herr}_als_jahresherrscher") or {}).get("wirkung"),
    }


# --- Vedische Astrologie ------------------------------------------------------------------------------------

def _vedisch(p: Dict[str, Any], s: str) -> Dict[str, Any]:
    f: Dict[str, Any] = {}
    aktiv = p.get("activeMahadasha") or {}
    profil = sp.regeldatei("Vedisch/jyotish_dasha.json", s)["mahadasha_profile"].get(f"{aktiv.get('planet')}_mahadasha")
    if aktiv and profil:
        f["mahadasha"] = {"name": aktiv.get("label", ""), "von": round(aktiv.get("startAge", 0)),
                          "bis": round(aktiv.get("endAge", 0)), "themen": erste(profil.get("hauptthemen", ""), 3)}
    idx = p.get("nakshatraIndex")
    if idx is not None:
        liste = sorted(sp.regeldatei("Vedisch/jyotish_nakshatras.json", s)["nakshatras"].values(),
                       key=lambda n: n["nummer"])
        if 0 <= idx < len(liste):
            n = liste[idx]
            f["nakshatra"] = {"name": n.get("name_sanskrit", ""),
                              "bedeutung": (n.get("name_deutsch") or "").split(" / ")[0],
                              "qualitaeten": satz(n.get("hauptqualitaeten", ""))}
    return f


# --- Arabische Astrologie -----------------------------------------------------------------------------------

def _arabisch(p: Dict[str, Any], s: str) -> Dict[str, Any]:
    f: Dict[str, Any] = {"tag": bool(p.get("isDayChart"))}
    jetzt, danach = p.get("currentPeriod") or {}, p.get("nextPeriod") or {}
    daten = sp.regeldatei("Arabisch/arabisch_firdaria.json", s)["haupt_firdaria"].get(jetzt.get("planet", ""))
    if jetzt and daten:
        f["jetzt"] = {"planet": jetzt["planet"], "name": jetzt.get("label", ""), "bis": round(jetzt.get("endAge", 0)),
                      "deutung": satz(daten.get("beschreibung", ""))}
        f["danach"] = danach.get("planet")
    return f


# --- Numerologie --------------------------------------------------------------------------------------------

def _numerologie(p: Dict[str, Any], s: str) -> Dict[str, Any]:
    zahl, meister = p.get("lifePathNumber"), bool(p.get("isMasterNumber"))
    regeln = sp.regeldatei("Numerologie/numerologie_lebenspfad.json", s)
    profil = (regeln["meisterzahlen"] if meister else regeln["lebenspfad_profile"]).get(str(zahl))
    f: Dict[str, Any] = {"zahl": zahl, "meister": meister}
    if profil:
        f["name"] = (profil.get("name") or "").split("–")[-1].strip()
        f["kernthema"] = satz(profil.get("kernthema", "")).rstrip(".")
    return f


# --- Kabbalah -----------------------------------------------------------------------------------------------

def _kabbalah(p: Dict[str, Any], s: str) -> Dict[str, Any]:
    f: Dict[str, Any] = {}
    seph = p.get("activeSephira") or {}
    daten = next(
        (v for v in sp.regeldatei("Kabbalah/kabbalah_sephiroth.json", s)["sephiroth"].values()
         if v.get("nummer") == seph.get("number")),
        None,
    )
    if daten:
        f["sephira"] = {"name": seph.get("name", ""),
                        "bedeutung": (daten.get("name_deutsch") or "").split(" / ")[-1],
                        "tugend": daten.get("tugend", "").replace(" / ", ", ")}
    pfad = p.get("activePath") or {}
    notiz = (p.get("notes") or {}).get("pfad") or {}
    if pfad and notiz:
        f["pfad"] = {"buchstabe": pfad.get("letterName", ""), "bedeutung": notiz.get("bedeutung", ""),
                     "tarot": notiz.get("tarot", "")}
    return f


FAKTEN: Dict[str, Callable[[Dict[str, Any], str], Dict[str, Any]]] = {
    "Westlich": _westlich,
    "Bazi": _bazi,
    "Hellenistisch": _hellenistisch,
    "Vedisch": _vedisch,
    "Arabisch": _arabisch,
    "Numerologie": _numerologie,
    "Kabbalah": _kabbalah,
}


def bildtext(system: str, payload: Optional[Dict[str, Any]], sprache: str = sp.GRUND) -> Optional[str]:
    """Absatz zur Grafik eines Systems; None, wenn es keine Bilddaten oder keinen Text dafuer gibt."""
    fakten = FAKTEN.get(system)
    if not fakten or not payload:
        return None
    try:
        formulierung = importlib.import_module(f"bildtexte.{sprache}")
    except ModuleNotFoundError:
        return None  # Sprache ohne eigene Saetze: lieber kein Absatz als einer aus zwei Sprachen
    try:
        return formulierung.ABSATZ[system](fakten(payload, sprache))
    except (KeyError, TypeError, ValueError):
        return None  # lieber kein Absatz als ein falscher


def paarbildtext(system: str, daten: Optional[Dict[str, Any]], sprache: str = sp.GRUND) -> Optional[str]:
    """Absatz zur Grafik fuer zwei (Spiel C); None, wenn es keine Daten oder keinen Text dafuer gibt."""
    if not daten:
        return None
    try:
        formulierung = importlib.import_module(f"bildtexte.{sprache}")
        return formulierung.PAAR[system](daten)
    except (ModuleNotFoundError, AttributeError, KeyError, TypeError, ValueError):
        return None  # lieber kein Absatz als ein falscher
