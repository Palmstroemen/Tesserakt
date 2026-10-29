"""
Deutung zum Jahreshoroskop: aus den datierten Ereignissen eines Systems (ausblick.py) zwei bis drei klare
Hinweise fuer den Alltag, mit Zeitraum und Begruendung aus dem jeweiligen Horoskop:

    Ab Mitte November Vorsicht bei Geld und finanziellen Entscheidungen. Nach dem westlichen Horoskop steht
    Saturn, der Planet der Pflichten und Grenzen, dann im Quadrat zu deiner Geburtssonne. Besser, du wartest
    mit groesseren Ausgaben und Vertraegen bis Anfang Juni, wenn es geht. Dann bildet Venus ...

Jedes Ereignis wird zu Signalen: Lebensbereich, Wert (-1 heikel .. +1 guenstig), Zeitraum und ein Satzkern
("steht Saturn ... im Quadrat zu deiner Geburtssonne"). Je Bereich zaehlt das staerkste heikle Signal; folgt
ihm spaeter ein guenstiges im selben Bereich, wird daraus der Rat zu warten. Ohne heikles Signal wird das
staerkste guenstige zur Empfehlung. Texte: Gruppe "deutung" in content/horoscope/<sprache>/heute_v1.json.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from ausblick import monatsteil

Texte = Dict[str, Dict[str, str]]
Signal = Dict[str, object]

BEREICHE = ("finanzen", "liebe", "beruf", "gesundheit", "veraenderung")
SCHWELLE = 0.5  # schwaechere Signale ergeben keinen Hinweis
HINWEISE = 3

# Westlich: Bereiche je laufendem Planeten; Ton je Aspekt (Konjunktion je nach Planet)
WEST_BEREICHE = {
    "venus": ("liebe", "finanzen"), "jupiter": ("finanzen", "beruf"), "saturn": ("beruf", "veraenderung"),
    "mars": ("gesundheit", "beruf"), "uranus": ("veraenderung",), "neptun": ("finanzen", "veraenderung"),
    "pluto": ("beruf", "liebe"),
}
WEST_TON = {"trine": 0.75, "sextil": 0.5, "quadrat": -0.75, "opposition": -0.75}
WEST_KONJUNKTION = {"venus": 1.0, "jupiter": 1.0}  # die uebrigen Konjunktionen gelten als fordernd (-0.75)

# Vedisch: Gochara von Jupiter und Saturn (lage wie in ausblick.vedisch)
VEDISCH_GOCHARA = {
    "jupiter_guenstig": {"finanzen": 0.75, "beruf": 0.5},
    "jupiter_unguenstig": {"finanzen": -0.5},
    "saturn_guenstig": {"beruf": 0.5},
    "saturn_unguenstig": {"beruf": -0.5, "gesundheit": -0.5},
    "sade_sati_beginn": {"veraenderung": -0.75, "gesundheit": -0.5},
    "sade_sati_hoehe": {"veraenderung": -0.75, "gesundheit": -0.75, "finanzen": -0.5},
    "sade_sati_ausklang": {"finanzen": -0.5},
    "sade_sati_ende": {"veraenderung": 0.75},
}

# Hellenistisch: Bereiche je Haus (Profektion und Wanderung des Jahresherrschers), Ton je Herrscher
HELL_HAUS = {
    1: ("gesundheit",), 2: ("finanzen",), 3: ("veraenderung",), 5: ("liebe",), 6: ("gesundheit", "beruf"),
    7: ("liebe",), 8: ("finanzen",), 9: ("veraenderung",), 10: ("beruf",), 12: ("gesundheit",),
}
HELL_HERRSCHER = {"venus": 0.75, "jupiter": 0.75, "mars": -0.75, "saturn": -0.75}

# Numerologie: persoenlicher Monat (Meisterzahlen wie ihre Grundziffer)
NUM_MONAT = {
    1: {"veraenderung": 1.0, "beruf": 0.5},
    2: {"liebe": 0.75, "veraenderung": -0.5},
    3: {"liebe": 0.5},
    4: {"beruf": 0.75, "veraenderung": -0.5},
    5: {"veraenderung": 0.75, "finanzen": -0.5},
    6: {"liebe": 1.0},
    7: {"finanzen": -0.75, "veraenderung": -0.75},
    8: {"finanzen": 1.0, "beruf": 0.75},
    9: {"veraenderung": -0.75},
}

# Bazi: Beziehung des Monatselements zum Tagesmeister; Zusammenstoss (Chong) mit dem Tageszweig
BAZI_MONAT = {
    "beherrscht": {"finanzen": 1.0},
    "gleich": {"finanzen": -0.75},
    "kontrolliert": {"beruf": -0.5, "gesundheit": -0.5, "veraenderung": -0.5},
    "naehrt": {"beruf": 0.5, "gesundheit": 0.5},
    "erschoepft": {"gesundheit": -0.75},
}
BAZI_CHONG = {"veraenderung": -1.0, "liebe": -0.75}


def _tag(iso: str) -> datetime:
    return datetime.fromisoformat(iso).replace(hour=12)


def _f(vorlage: str, **werte: object) -> str:
    for k, v in werte.items():
        vorlage = vorlage.replace("{" + k + "}", str(v))
    return vorlage


def _aus_dimensionen(dim: Dict[str, float]) -> Dict[str, float]:
    """Dimensionsvektor 0..1 (0,5 = neutral) der Regeldaten -> Werte -1..+1 je Bereich."""
    return {b: round((float(dim[b]) - 0.5) * 2, 2) for b in BEREICHE if b in dim}


def _signale(system: str, e: Dict[str, object], t: Texte) -> List[Signal]:
    """Signale eines Ereignisses: [{bereich, wert, kern}]; Zeitraum fuegt der Aufrufer hinzu."""
    d = t["deutung"]
    werte: Dict[str, float] = {}
    kern = ""
    art = e.get("art")
    if system == "Westlich":
        planet, aspekt = e["planet"], e["aspekt"]
        ton = WEST_KONJUNKTION.get(planet, -0.75) if aspekt == "konjunktion" else WEST_TON[aspekt]
        werte = {b: ton for b in WEST_BEREICHE.get(planet, ())}
        if e["ziel"] == "mc" and ton:
            werte["beruf"] = ton
        kern = _f(d[f"west_{aspekt}"], planet=t["planetennamen"][planet], bedeutung=d[f"planet_{planet}"],
                  ziel=t["transit_ziele"][e["ziel"]])
    elif system == "Vedisch" and art == "antardasha":
        werte = _aus_dimensionen(e.get("dimensionen") or {})
        kern = _f(d["vedisch_antardasha"], ad=t["planeten_kurz"][e["ad"]], md=t["vedisch_namen"][e["md"]])
    elif system == "Vedisch" and art == "gochara":
        lage = str(e.get("lage", ""))
        werte = dict(VEDISCH_GOCHARA.get(lage, {}))
        if lage.startswith("sade_sati"):
            kern = d["vedisch_sade_sati_ende" if lage == "sade_sati_ende" else "vedisch_sade_sati"]
        else:
            kern = d[f"vedisch_{lage}"]
    elif system == "Hellenistisch" and art in ("profektion", "wanderung"):
        herrscher = e["herrscher"] if art == "profektion" else e["planet"]
        ton = HELL_HERRSCHER.get(herrscher, 0.0)
        haus = int(e["haus"])
        werte = {b: ton for b in HELL_HAUS.get(haus, ())}
        kern = _f(d[f"hell_{art}"], planet=t["planetennamen"][herrscher], haus=haus,
                  thema=t["hellenistisch_haus_kurz"][str(haus)])
    elif system == "Arabisch" and art == "unter" and e.get("unter"):
        werte = _aus_dimensionen(e.get("dimensionen") or {})
        kern = _f(d["arabisch_unter"], unter=t["arabisch_genitiv"][e["unter"]],
                  haupt=t["arabisch_genitiv"][e["haupt"]])
    elif system == "Numerologie" and art == "monat":
        zahl = int(e["zahl"])
        grund = zahl if zahl <= 9 else sum(int(z) for z in str(zahl))
        werte = dict(NUM_MONAT.get(grund, {}))
        kern = _f(d["num_monat"], zahl=zahl, bedeutung=d[f"num_{grund}"])
    elif system == "Bazi" and art == "monat":
        rel = str(e["beziehung"])
        werte = dict(BAZI_MONAT.get(rel, {}))
        kern = _f(d[f"bazi_{rel}"], monat=t["elemente"][e["element"]], dm=t["elemente"][e["tagesmeister"]])
    elif system == "Bazi" and art == "chong":
        werte = dict(BAZI_CHONG)
        kern = _f(d["bazi_chong"], tier=t["bazi_tiere_monat"][e["zweig"]])
    return [{"bereich": b, "wert": w, "kern": kern} for b, w in werte.items() if abs(w) >= SCHWELLE and kern]


def _gross(s: str) -> str:
    return s[:1].upper() + s[1:]


def _zeitraum(von: datetime, bis: datetime, start: datetime, ende: datetime, t: Texte) -> str:
    """Zeitraum am Satzanfang: 'Ab Mitte April', 'Bis Ende Mai', 'Im April', 'Von Anfang Juni bis Mitte August'."""
    d, z = t["deutung"], t["zeit"]
    vorne, hinten = von <= start, bis >= ende - timedelta(days=1)
    if vorne and hinten:
        return d["ganzes_jahr"]
    if vorne:
        return _f(z["bis"], zeit=monatsteil(bis, t))
    if hinten:
        return _f(z["ab"], zeit=monatsteil(von, t))
    if (von.year, von.month) == (bis.year, bis.month) and von.day <= 3 and (bis + timedelta(days=3)).month != bis.month:
        return _f(z["im_monat"], monat=z[f"monat_{von.month}"])
    a, b = monatsteil(von, t), monatsteil(bis, t)
    return _gross(a) if a == b else _f(d["von_bis"], von=a, bis=b)


def saetze(system: str, ereignisse: List[Dict[str, object]], start: datetime, ende: datetime,
           t: Texte) -> List[str]:
    """Bis zu drei Hinweise fuer das System, die staerksten, zeitlich geordnet."""
    d = t["deutung"]
    signale: List[Signal] = []
    for e in ereignisse:
        von, bis = max(_tag(str(e["von"])), start), _tag(str(e["bis"]))
        for s in _signale(system, e, t):
            signale.append({**s, "von": von, "bis": bis})
    if not signale:
        return []

    def einleitung(kern: str) -> str:
        return _f(d[f"einleitung_{system}"], kern=kern)

    kandidaten = []
    for b in BEREICHE:
        heikel = [s for s in signale if s["bereich"] == b and s["wert"] < 0]
        gut = [s for s in signale if s["bereich"] == b and s["wert"] > 0]
        if heikel:
            n = min(heikel, key=lambda s: (s["wert"], s["von"]))
            # guenstige Zeit danach: beginnt fruehestens einen Monat nach dem heiklen Abschnitt, die naechste
            spaeter = [s for s in gut if s["von"] >= n["von"] + timedelta(days=30) and s["kern"] != n["kern"]]
            p: Optional[Signal] = min(spaeter, key=lambda s: (s["von"], -s["wert"])) if spaeter else None
            text = (f"{_zeitraum(n['von'], n['bis'], start, ende, t)}{d['komma']} {d[f'vorsicht_{b}']}. "
                    f"{einleitung(n['kern'])}")
            if p:
                text += " " + _f(d["warten"], womit=d[f"warten_{b}"], zeit=monatsteil(p["von"], t)) \
                    + " " + _f(d["dann"], kern=p["kern"])
            kandidaten.append((abs(n["wert"]) + (0.3 if p else 0), [n["kern"]] + ([p["kern"]] if p else []), text, n["von"]))
        elif gut:
            g = max(gut, key=lambda s: (s["wert"], -s["von"].timestamp()))
            text = (f"{_zeitraum(g['von'], g['bis'], start, ende, t)}{d['komma']} {d[f'gut_{b}']}. "
                    f"{einleitung(g['kern'])}")
            kandidaten.append((g["wert"], [g["kern"]], text, g["von"]))

    # die staerksten auswaehlen (dieselbe Begruendung nur einmal), dann in zeitlicher Reihenfolge
    gewaehlt = []
    benutzt: set = set()
    for _, kerne, text, von in sorted(kandidaten, key=lambda k: -k[0]):
        if benutzt & set(kerne):
            continue
        benutzt |= set(kerne)
        gewaehlt.append((von, text))
        if len(gewaehlt) >= HINWEISE:
            break
    return [text for _, text in sorted(gewaehlt, key=lambda g: g[0])]
