"""Bildtexte: ein Absatz je Horoskop, der die Grafik im Auge erklaert und an einem Merkmal zeigt, was sie fuer
die Person bedeutet (Spiele A und B). Grundlage sind die Bilddaten aus /vektor (visualPayloads) und die
Deutungen aus den Regeldateien; formuliert wird vorsichtig ("nach der Ueberlieferung", "koennte").

Jede Funktion beschreibt nur, was die Grafik in frontend/src/apparat/diagramme/ wirklich zeigt.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

BASIS = Path(__file__).resolve().parent


@lru_cache(maxsize=None)
def _regeln(datei: str) -> Dict[str, Any]:
    with open(BASIS / datei, encoding="utf-8") as f:
        return json.load(f)


def _satz(text: str) -> str:
    """Erster Satz eines Regeltextes (ohne Zitate und Klammerzusaetze am Ende)."""
    text = (text or "").strip()
    for ende in (". ", "! ", "? "):
        k = text.find(ende)
        if k > 0:
            text = text[: k + 1]
            break
    return text if text.endswith((".", "!", "?")) else text + "."


def _klein(name: str) -> str:
    """Artikel am Anfang klein, fuer die Mitte eines Satzes ("Der Freigeist" -> "der Freigeist")."""
    if name.split(" ")[0] in ("Der", "Die", "Das"):
        return name[0].lower() + name[1:]
    return name


def _gross(text: str) -> str:
    return text[:1].upper() + text[1:]


def _erste(text: str, n: int) -> str:
    """Die ersten n Eintraege einer Aufzaehlung."""
    return ", ".join(t.strip() for t in _satz(text).rstrip(".").split(",")[:n])


# --- Westliche Astrologie -----------------------------------------------------------------------------------

PLANET_DE = {
    "sun": "sonne", "moon": "mond", "mercury": "merkur", "venus": "venus", "mars": "mars",
    "jupiter": "jupiter", "saturn": "saturn", "uranus": "uranus", "neptune": "neptun", "pluto": "pluto",
}
PLANET_NAME = {
    "sonne": "die Sonne", "mond": "der Mond", "merkur": "Merkur", "venus": "Venus", "mars": "Mars",
    "jupiter": "Jupiter", "saturn": "Saturn", "uranus": "Uranus", "neptun": "Neptun", "pluto": "Pluto",
}
# wofuer ein Planet steht (kurz, nach natur_de in Westlich/western_rules_complete.json)
PLANET_STEHT = {
    "sonne": "dein Wesen und deinen Willen",
    "mond": "Gefühle und Bedürfnisse",
    "merkur": "Denken und Sprechen",
    "venus": "Liebe, Beziehung und Genuss",
    "mars": "Tatkraft, Streit und Durchsetzung",
    "jupiter": "Wachstum und Zuversicht",
    "saturn": "Pflicht, Grenzen und Ausdauer",
    "uranus": "Umbruch und Freiheit",
    "neptun": "Träume und Intuition",
    "pluto": "tiefen Wandel und Macht",
}
# in WestlichNacht.jsx gezeichnete Aspekte (Konjunktionen werden nicht gezeichnet), Name und Linienfarbe
ASPEKT = {
    "opposition": ("opposition", "in Opposition", "orange"),
    "square": ("quadrat", "im Quadrat", "rot"),
    "trine": ("trigon", "im Trigon", "blau"),
    "sextile": ("sextil", "im Sextil", "hellblau"),
}
REIHENFOLGE = ["sonne", "mond", "merkur", "venus", "mars", "jupiter", "saturn", "uranus", "neptun", "pluto"]


def _westlich(p: Dict[str, Any]) -> str:
    haeuser = (p.get("houses") or {}).get("system") == "placidus"
    teile = [
        "Die Grafik zeigt den Himmel zur Stunde deiner Geburt. Im äußeren Ring liegen die zwölf "
        "Tierkreiszeichen, jedes farbige Zeichen darin ist ein Planet an seinem Ort"
        + (". Links steht der Aszendent, das Zeichen, das gerade im Osten aufging." if haeuser else "."),
        "In der westlichen Astrologie betrachtet man vor allem, wie die Planeten zueinander stehen. Stehen "
        "zwei einander gegenüber, spricht man von einer Opposition (orange Linie), stehen sie im rechten "
        "Winkel, von einem Quadrat (rot). Beides gilt als spannungsreich. Ein Drittel des Kreises (Trigon, "
        "blau) und ein Sechstel (Sextil, hellblau) gelten als harmonisch. Je heller eine Linie leuchtet, "
        "desto genauer stimmt der Winkel.",
    ]
    kombi = _regeln("Westlich/timing_rules.json")["planet_planet_aspekte"]["kombinationen"]
    beste = None
    for a in p.get("aspects") or []:
        art = ASPEKT.get(a.get("type"))
        x, y = PLANET_DE.get(a.get("a")), PLANET_DE.get(a.get("b"))
        if not art or not x or not y:
            continue
        x, y = sorted((x, y), key=REIHENFOLGE.index)
        text = (kombi.get(f"{x}_{y}") or {}).get(art[0], {}).get("text_de")
        if text and (beste is None or a.get("orbDeg", 9) < beste[0]):
            beste = (a.get("orbDeg", 9), x, y, art, text)
    if beste:
        _, x, y, art, text = beste
        teile.append(
            f"Besonders genau ist bei dir die {art[2]}e Linie: {_gross(PLANET_NAME[x])} steht "
            f"{art[1]} zu {PLANET_NAME[y]}. {_gross(PLANET_NAME[x])} steht für {PLANET_STEHT[x]}, "
            f"{PLANET_NAME[y]} für {PLANET_STEHT[y]}. Nach den alten Regeln bedeutet das: {_satz(text)}"
        )
    return " ".join(teile)


# --- Bazi ---------------------------------------------------------------------------------------------------

ELEMENT_DE = {"wood": "holz", "fire": "feuer", "earth": "erde", "metal": "metall", "water": "wasser"}
ELEMENT_NAME = {"holz": "Holz", "feuer": "Feuer", "erde": "Erde", "metall": "Metall", "wasser": "Wasser"}
ELEMENT_PUNKT = {
    "holz": "grüne", "feuer": "rote", "erde": "ockerfarbene", "metall": "weiße", "wasser": "schwarze",
}


def _bazi(p: Dict[str, Any]) -> str:
    teile = [
        "Die rote Karte zeigt die vier Säulen deines Bazi, von rechts nach links gelesen: Jahr, Monat, Tag "
        "und Stunde deiner Geburt. Jede Säule besteht aus zwei Schriftzeichen, oben einem Himmelsstamm, unten "
        "einem Erdzweig. Das Zeichen auf dem goldenen Rhombus ist der Himmelsstamm deines Tages, der "
        "„Tagesmeister“: Er steht für dich selbst. Die fünf Punkte darunter zeigen, wie stark die fünf "
        "Elemente unter deinen acht Zeichen vertreten sind. Je größer der Punkt, desto mehr davon."
    ]
    if ((p.get("pillars") or {}).get("hour") or {}).get("estimated"):
        teile.append("Deine Geburtsstunde ist nicht bekannt, deshalb ist die Stundensäule ganz links blass.")
    regeln = _regeln("Bazi/bazi_rules.json")
    stamm = (p.get("dayMaster") or {}).get("stem")
    daten = regeln["heavenly_stems"].get(stamm or "")
    if daten:
        element, polaritaet = (daten.get("element") or "_").split("_")
        profil = regeln["day_master_profiles"].get(element, {})
        teile.append(
            f"Dein Tagesmeister ist {daten.get('symbol', '')}, {polaritaet.capitalize()}-"
            f"{ELEMENT_NAME.get(element, element)}: {daten.get('qualitaet', '')}."
            + (f" Als Stärken gelten {profil['staerken']}." if profil.get("staerken") else "")
        )
    anteile = {ELEMENT_DE.get(k, k): v for k, v in (p.get("fiveElements") or {}).items()}
    if anteile:
        stark = max(anteile, key=anteile.get)
        fehlt = [e for e, v in anteile.items() if v == 0]
        satz = (
            f"Am stärksten vertreten ist {ELEMENT_NAME[stark]} (der {ELEMENT_PUNKT[stark]} Punkt)"
            if stark in ELEMENT_NAME
            else ""
        )
        if fehlt:
            satz += (", ganz fehlt " if len(fehlt) == 1 else ", ganz fehlen ") + " und ".join(
                ELEMENT_NAME.get(e, e) for e in fehlt
            )
        if satz:
            teile.append(satz + ".")
    return " ".join(teile)


# --- Hellenistische Astrologie ------------------------------------------------------------------------------

GOTT = {
    "sonne": ("Helios", "die Strahlensonne"),
    "mond": ("Selene", "die Mondsichel"),
    "merkur": ("Hermes", "der Heroldstab"),
    "venus": ("Aphrodite", "die Muschel"),
    "mars": ("Ares", "Schild und Speer"),
    "jupiter": ("Zeus", "das Blitzbündel"),
    "saturn": ("Kronos", "die Sichel"),
}


def _hellenistisch(p: Dict[str, Any]) -> str:
    haus, alter, herr = p.get("activeHouse"), p.get("age"), p.get("yearLord")
    teile = [
        "Der Teller zeigt die zwölf Häuser als griechische Zahlzeichen am Rand, das erste unten, weiter gegen "
        "den Uhrzeigersinn. Die hellenistische Astrologie lässt dich mit jedem Lebensjahr ein Haus "
        "weiterwandern; man nennt das Profektion."
    ]
    regeln = _regeln("Hellenistisch/hell_zeitherren.json")["jaehrliche_profektionen"]
    thema = (regeln["profektionshaus_themen"].get(f"haus_{haus}") or {}).get("thema")
    if haus and alter is not None:
        teile.append(
            f"Mit {alter} Jahren stehst du im {haus}. Haus, mit Kreide umkringelt"
            + (f". Es steht für {thema}." if thema else ".")
        )
    if herr in GOTT:
        gott, bild = GOTT[herr]
        wirkung = (regeln["jahresherrscher"].get(f"wirkung_{herr}_als_jahresherrscher") or {}).get("wirkung")
        teile.append(
            f"Der Herrscher dieses Hauses wird zum Herrn deines Jahres: {_gross(PLANET_NAME[herr])}, "
            f"in der Mitte dargestellt durch {bild} des {gott}."
            + (f" Nach Valens und Dorotheus heißt das: {_satz(wirkung)}" if wirkung else "")
        )
    return " ".join(teile)


# --- Vedische Astrologie ------------------------------------------------------------------------------------

def _vedisch(p: Dict[str, Any]) -> str:
    teile = [
        "Das Rangoli ist aus farbigem Pulver gestreut. Jeder Bogen am Rand ist eine Mahadasha, eine der großen "
        "Lebensperioden der vedischen Astrologie: Oben beginnt dein Leben, im Uhrzeigersinn reicht es bis 120 "
        "Jahre. Je länger eine Periode, desto größer ihr Bogen, die Farbe ist die ihres Planeten. Vergangene "
        "Perioden sind verblasst, die gedrehte Schnur reicht bis zu deinem heutigen Alter. Im inneren Ring aus "
        "27 Punkten trägt dein Geburts-Nakshatra einen goldenen Armreif, das Mondhaus, in dem der Mond bei "
        "deiner Geburt stand."
    ]
    aktiv = p.get("activeMahadasha") or {}
    profil = _regeln("Vedisch/jyotish_dasha.json")["mahadasha_profile"].get(f"{aktiv.get('planet')}_mahadasha")
    if aktiv and profil:
        teile.append(
            f"Du bist in der {aktiv.get('label', '')}-Mahadasha, mit Reispunkten umrandet "
            f"(von {round(aktiv.get('startAge', 0))} bis {round(aktiv.get('endAge', 0))} Jahren). "
            f"Ihre Themen sind nach der Überlieferung {_erste(profil.get('hauptthemen', ''), 3)}."
        )
    idx = p.get("nakshatraIndex")
    if idx is not None:
        liste = sorted(_regeln("Vedisch/jyotish_nakshatras.json")["nakshatras"].values(), key=lambda n: n["nummer"])
        if 0 <= idx < len(liste):
            n = liste[idx]
            deutsch = _klein((n.get("name_deutsch") or "").split(" / ")[0])
            teile.append(
                f"Dein Mond stand im Nakshatra {n.get('name_sanskrit', '')}, „{deutsch}“: "
                f"{_satz(n.get('hauptqualitaeten', ''))}"
            )
    return " ".join(teile)


# --- Arabische Astrologie -----------------------------------------------------------------------------------

GENITIV = {
    "sonne": "der Sonne", "venus": "der Venus", "merkur": "des Merkur", "mond": "des Mondes",
    "saturn": "des Saturn", "jupiter": "des Jupiter", "mars": "des Mars",
    "nordknoten": "des Nordknotens", "suedknoten": "des Südknotens",
}


def _arabisch(p: Dict[str, Any]) -> str:
    tag = p.get("isDayChart")
    teile = [
        "Die Fliesenscheibe zeigt die Firdaria, die Lebensperioden der arabischen Astrologie. Neun Perioden "
        "folgen in einem Kreis von 75 Jahren aufeinander, oben beginnt er, weiter im Uhrzeigersinn. Je länger "
        "eine Periode, desto breiter ihre Fliese. Der Messingzeiger zeigt, wo du heute stehst, die laufende "
        "Fliese ist vergoldet.",
        f"Die Nabe ist {'golden: Du bist am Tag geboren' if tag else 'silbern: Du bist in der Nacht geboren'}, "
        "und davon hängt ab, mit welchem Planeten dein Leben beginnt.",
    ]
    jetzt, danach = p.get("currentPeriod") or {}, p.get("nextPeriod") or {}
    daten = _regeln("Arabisch/arabisch_firdaria.json")["haupt_firdaria"].get(jetzt.get("planet", ""))
    if jetzt and daten:
        teile.append(
            f"Du stehst in der Firdaria {GENITIV.get(jetzt['planet'], jetzt.get('label', ''))}, "
            f"bis du {round(jetzt.get('endAge', 0))} bist. {_satz(daten.get('beschreibung', ''))}"
        )
        if danach.get("planet") in GENITIV:
            teile.append(f"Danach folgt die Firdaria {GENITIV[danach['planet']]}.")
    return " ".join(teile)


# --- Numerologie --------------------------------------------------------------------------------------------

def _numerologie(p: Dict[str, Any]) -> str:
    zahl = p.get("lifePathNumber")
    teile = [
        "Das Heft zeigt, wie die Numerologie deine Lebenszahl ausrechnet: Tag, Monat und Jahr deiner Geburt "
        "werden zu Quersummen verkürzt und zusammengezählt, bis eine einzige Ziffer übrig bleibt. Nur die "
        "Meisterzahlen 11, 22 und 33 lässt man stehen."
    ]
    regeln = _regeln("Numerologie/numerologie_lebenspfad.json")
    profil = (regeln["meisterzahlen"] if p.get("isMasterNumber") else regeln["lebenspfad_profile"]).get(str(zahl))
    if profil:
        name = (profil.get("name") or "").split("–")[-1].strip()
        teile.append(
            f"Rot eingekreist ist deine Lebenszahl {zahl}"
            + (", eine Meisterzahl" if p.get("isMasterNumber") else "")
            + f", „{_klein(name)}“. Sie steht für {_satz(profil.get('kernthema', '')).rstrip('.')}."
        )
    return " ".join(teile)


# --- Kabbalah -----------------------------------------------------------------------------------------------

def _kabbalah(p: Dict[str, Any]) -> str:
    teile = [
        "Die Buchseite zeigt den Baum des Lebens: zehn Kreise, die Sephiroth, verbunden durch 22 Pfade, jeder "
        "mit einem hebräischen Buchstaben. Mit Buntstift markiert sind deine Sephira, abgeleitet aus deiner "
        "Lebenszahl, und ein Pfad, der sich nach deinem Geburtstag im Jahreslauf richtet. Am Rand "
        "stehen Notizen dazu."
    ]
    seph = p.get("activeSephira") or {}
    daten = next(
        (v for v in _regeln("Kabbalah/kabbalah_sephiroth.json")["sephiroth"].values()
         if v.get("nummer") == seph.get("number")),
        None,
    )
    if daten:
        teile.append(
            f"Deine Sephira ist {seph.get('name', '')}, „{_klein((daten.get('name_deutsch') or '').split(' / ')[-1])}“, "
            f"mit der Tugend {daten.get('tugend', '').replace(' / ', ', ')}."
        )
    pfad = p.get("activePath") or {}
    notiz = (p.get("notes") or {}).get("pfad") or {}
    if pfad and notiz:
        tarot = _klein(notiz.get("tarot", ""))
        teile.append(
            f"Dein Pfad trägt den Buchstaben {pfad.get('letterName', '')}, „{notiz.get('bedeutung', '')}“; "
            f"im Tarot entspricht ihm {tarot}."
        )
    return " ".join(teile)


BILDTEXT = {
    "Westlich": _westlich,
    "Bazi": _bazi,
    "Hellenistisch": _hellenistisch,
    "Vedisch": _vedisch,
    "Arabisch": _arabisch,
    "Numerologie": _numerologie,
    "Kabbalah": _kabbalah,
}


def bildtext(system: str, payload: Optional[Dict[str, Any]]) -> Optional[str]:
    """Absatz zur Grafik eines Systems; None, wenn es keine Bilddaten oder keinen Text dafuer gibt."""
    f = BILDTEXT.get(system)
    if not f or not payload:
        return None
    try:
        return f(payload)
    except (KeyError, TypeError, ValueError):
        return None  # lieber kein Absatz als ein falscher
