"""
Jahreshoroskop (Ausblick auf die naechsten 12 Monate): datierte Ereignisse je System.

Westlich: Transite der laufenden Planeten zu den Geburtspunkten (Sonne, Mond, mit Geburtsort auch Aszendent
und MC). Fuer jeden Tag wird die Position bestimmt; ein Aspekt wird zum Ereignis, solange er innerhalb des
Orbis liegt. Ruecklaeufige Schleifen (mehrere exakte Treffer kurz hintereinander) werden zusammengefasst.
Die Ereignisse werden nach Gewicht (langsame Planeten und Sonne/Mond schwerer) ausgewaehlt und
chronologisch zurueckgegeben.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Callable, Dict, List

ASPEKTE = {"konjunktion": 0.0, "sextil": 60.0, "quadrat": 90.0, "trine": 120.0, "opposition": 180.0}
# Orbis je laufendem Planeten (Grad): schnelle Planeten nur eng, sonst waere fast immer etwas aktiv
ORBIS = {"pluto": 1.0, "neptun": 1.0, "uranus": 1.0, "saturn": 1.5, "jupiter": 1.5, "mars": 1.2, "venus": 1.0}
GEWICHT_PLANET = {"pluto": 4, "neptun": 4, "uranus": 4, "saturn": 5, "jupiter": 5, "mars": 3, "venus": 2}
GEWICHT_ZIEL = {"sonne": 3, "mond": 3, "aszendent": 2, "mc": 2}
GEWICHT_ASPEKT = {"konjunktion": 3, "opposition": 2, "quadrat": 2, "trine": 2, "sextil": 1}
# Abschnitte desselben Transits mit hoechstens so vielen Tagen Abstand gelten als ein Ereignis (ruecklaeufige
# Schleife). Langsame Planeten pendeln monatelang ueber denselben Punkt; Mars und Venus kehren nur bei ihrer
# kurzen Ruecklaeufigkeit zurueck, ein spaeterer Durchgang ist ein eigenes Ereignis.
ZUSAMMENFASSEN_TAGE = {"pluto": 120, "neptun": 120, "uranus": 120, "saturn": 120, "jupiter": 120, "mars": 30,
                       "venus": 20}

MONATE = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober",
          "November", "Dezember"]


def _abweichung(laufend: float, natal: float, winkel: float) -> float:
    abstand = abs((laufend - natal + 180.0) % 360.0 - 180.0)
    return abs(abstand - winkel)


def monatsteil(tag: datetime) -> str:
    """'Anfang April', 'Mitte April', 'Ende April'."""
    teil = "Anfang" if tag.day <= 10 else "Mitte" if tag.day <= 20 else "Ende"
    return f"{teil} {MONATE[tag.month - 1]}"


def zeitraum_text(von: datetime, bis: datetime, exakt: List[datetime]) -> str:
    """Lesbarer Zeitraum: kurze Ereignisse 'um den 14. April', laengere 'Mitte März bis Ende April'."""
    if (bis - von).days <= 12:
        mitte = exakt[0]
        return f"Um den {mitte.day}. {MONATE[mitte.month - 1]}"
    a, b = monatsteil(von), monatsteil(bis)
    if a == b:
        return a
    return f"{a} bis {b}"


def westlich_ereignisse(
    natal_punkte: Dict[str, float],
    positionen: Callable[[datetime], Dict[str, float]],
    start: datetime,
    tage: int = 365,
    anzahl: int = 6,
) -> List[Dict[str, object]]:
    """Transit-Ereignisse der naechsten `tage` Tage, die `anzahl` gewichtigsten, chronologisch."""
    tage_liste = [start + timedelta(days=i) for i in range(tage + 1)]
    pos = [positionen(t) for t in tage_liste]
    ereignisse: List[Dict[str, object]] = []
    for planet, orbis in ORBIS.items():
        for ziel, natal in natal_punkte.items():
            for aspekt, winkel in ASPEKTE.items():
                abw = [_abweichung(p[planet], natal, winkel) if planet in p else 99.0 for p in pos]
                i = 0
                while i < len(abw):
                    if abw[i] > orbis:
                        i += 1
                        continue
                    # zusammenhaengender Abschnitt innerhalb des Orbis
                    j = i
                    while j + 1 < len(abw) and abw[j + 1] <= orbis:
                        j += 1
                    beste = min(range(i, j + 1), key=lambda k: abw[k])
                    ereignisse.append({
                        "planet": planet, "ziel": ziel, "aspekt": aspekt,
                        "von": tage_liste[i], "bis": tage_liste[j], "exakt": [tage_liste[beste]],
                        "kleinste_abweichung": abw[beste],
                    })
                    i = j + 1
    # ruecklaeufige Schleifen: Abschnitte desselben Transits kurz hintereinander zusammenfassen
    ereignisse.sort(key=lambda e: (e["planet"], e["ziel"], e["aspekt"], e["von"]))
    zusammen: List[Dict[str, object]] = []
    for e in ereignisse:
        vorher = zusammen[-1] if zusammen else None
        if (vorher and (vorher["planet"], vorher["ziel"], vorher["aspekt"]) == (e["planet"], e["ziel"], e["aspekt"])
                and (e["von"] - vorher["bis"]).days <= ZUSAMMENFASSEN_TAGE[e["planet"]]):
            vorher["bis"] = e["bis"]
            vorher["exakt"] = vorher["exakt"] + e["exakt"]
            vorher["kleinste_abweichung"] = min(vorher["kleinste_abweichung"], e["kleinste_abweichung"])
        else:
            zusammen.append(dict(e))
    for e in zusammen:
        dauer = (e["bis"] - e["von"]).days + 1
        e["gewicht"] = (GEWICHT_PLANET[e["planet"]] * GEWICHT_ZIEL.get(e["ziel"], 1) * GEWICHT_ASPEKT[e["aspekt"]]
                        * (1.0 + min(dauer, 120) / 120.0))
    return sorted(_auswahl(zusammen, start, tage, anzahl), key=lambda e: e["von"])


def _auswahl(ereignisse: List[Dict[str, object]], start: datetime, tage: int, anzahl: int) -> List[Dict[str, object]]:
    """Uebers Jahr verteilt: zuerst das gewichtigste Ereignis je Quartal, dann nach Gewicht auffuellen;
    hoechstens zwei Ereignisse je laufendem Planeten (sonst verdraengen Saturn und Jupiter alles)."""
    nach_gewicht = sorted(ereignisse, key=lambda e: -e["gewicht"])
    gewaehlt: List[Dict[str, object]] = []
    je_planet: Dict[str, int] = {}

    def nimm(e: Dict[str, object]) -> bool:
        if e in gewaehlt or je_planet.get(e["planet"], 0) >= 2 or len(gewaehlt) >= anzahl:
            return False
        gewaehlt.append(e)
        je_planet[e["planet"]] = je_planet.get(e["planet"], 0) + 1
        return True

    viertel = tage / 4
    for q in range(4):
        for e in nach_gewicht:
            if q * viertel <= (e["exakt"][0] - start).days < (q + 1) * viertel and nimm(e):
                break
    for e in nach_gewicht:
        nimm(e)
    return gewaehlt


def westlich_text(e: Dict[str, object], t: Dict[str, Dict[str, str]]) -> str:
    """Satz aus den Bausteinen (Zukunftsform aus ausblick_aspekt, sonst die von heute), mit Zeitraum davor."""
    satz = (t.get("ausblick_aspekt", t["westlich_aspekt"])[e["aspekt"]]
            .replace("{Planet}", t["planetennamen"][e["planet"]])
            .replace("{thema}", t["westlich_planet"][e["planet"]])
            .replace("{ziel}", t["transit_ziele"][e["ziel"]]))
    return f"{zeitraum_text(e['von'], e['bis'], e['exakt'])}: {satz}"


def als_json(e: Dict[str, object], text: str) -> Dict[str, object]:
    return {
        "von": e["von"].date().isoformat(),
        "bis": e["bis"].date().isoformat(),
        "exakt": [d.date().isoformat() for d in e["exakt"]],
        "planet": e["planet"], "ziel": e["ziel"], "aspekt": e["aspekt"],
        "text": text,
    }


def westlich(natal_punkte: Dict[str, float], positionen: Callable[[datetime], Dict[str, float]],
             start: datetime, t: Dict[str, Dict[str, str]], tage: int = 365) -> List[Dict[str, object]]:
    return [als_json(e, westlich_text(e, t)) for e in westlich_ereignisse(natal_punkte, positionen, start, tage)]
