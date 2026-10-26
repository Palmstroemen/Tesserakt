"""
Jahreshoroskop (Ausblick auf die naechsten 12 Monate): datierte Ereignisse je System.

Westlich: Transite der laufenden Planeten zu den Geburtspunkten (Sonne, Mond, mit Geburtsort auch Aszendent
und MC). Fuer jeden Tag wird die Position bestimmt; ein Aspekt wird zum Ereignis, solange er innerhalb des
Orbis liegt. Ruecklaeufige Schleifen (mehrere exakte Treffer kurz hintereinander) werden zusammengefasst.
Die Ereignisse werden nach Gewicht (langsame Planeten und Sonne/Mond schwerer) ausgewaehlt und
chronologisch zurueckgegeben.

Vedisch: Vimshottari-Unterperioden (Antardasha) und Beginn einer neuen Mahadasha, dazu Gochara von Jupiter
und Saturn (Zeichenwechsel, Haeuser vom siderischen Zeichen des Geburtsmondes) mit den Phasen der Sade Sati.
Deutung der Unterperioden aus der Antardasha-Matrix (Vedisch/jyotish_dasha.json, nach BPHS und Phaladeepika).

Chinesisch: Sonnenmonate (Wechsel bei Sonnenlaenge 315 + k*30 Grad) zu Bloecken gleichen Elements gefasst und
mit dem Tagesmeister verglichen; Jahreswechsel zu Lichun; Monate, deren Zweig mit dem Zweig der Tagessaeule
zusammenstoesst (Chong); neue Glueckssaeule, wenn sie ins Jahr faellt (nur mit Angabe des Geschlechts).

Hellenistisch: Jahresprofektion bis zum naechsten Geburtstag und ab ihm (Haus und Jahresherrscher, ganze
Zeichen vom Aszendenten). Ist der Herrscher Mars, Jupiter oder Saturn, dazu seine Wanderung durch die Haeuser
(tropisch); die schnellen Herrscher wechseln fast monatlich das Zeichen und bleiben ohne Einzeldaten.

Arabisch: Firdaria-Unterperioden (Hauptdauer / 7, beginnend mit dem Hauptherrscher im Zyklus der sieben
Planeten, wie in der Wertung) mit Deutung aus der Qualitaetsmatrix; Beginn einer neuen Haupt-Firdaria.

Numerologie: persoenliches Jahr bis zum Jahreswechsel und danach, jeder persoenliche Monat mit dem Feld
aus der Matrix Jahr x Monat (Meisterzahlen dort als 2, 4, 6 gelesen) und ein neuer Pinnacle am Geburtstag.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Callable, Dict, List, Optional, Tuple

from rule_engine import current_pinnacle_number, life_path, personal_month, personal_year
from vedisch_chart import _load_dasha_data

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

Texte = Dict[str, Dict[str, str]]


def _f(vorlage: str, **werte: object) -> str:
    """Platzhalter {name} in einer Vorlage aus den Textbausteinen ersetzen."""
    for k, v in werte.items():
        vorlage = vorlage.replace("{" + k + "}", str(v))
    return vorlage


def _monat(t: Texte, nr: int) -> str:
    return t["zeit"][f"monat_{nr}"]


def _datum(tag: datetime, t: Texte) -> str:
    """'12. April'."""
    return _f(t["zeit"]["datum"], tag=tag.day, monat=_monat(t, tag.month))


def _um(tag: datetime, t: Texte) -> str:
    """'Um den 12. April'."""
    return _f(t["zeit"]["um_den"], tag=tag.day, monat=_monat(t, tag.month))


def _abweichung(laufend: float, natal: float, winkel: float) -> float:
    abstand = abs((laufend - natal + 180.0) % 360.0 - 180.0)
    return abs(abstand - winkel)


def monatsteil(tag: datetime, t: Texte) -> str:
    """'Anfang April', 'Mitte April', 'Ende April'."""
    teil = "anfang" if tag.day <= 10 else "mitte" if tag.day <= 20 else "ende"
    return _f(t["zeit"][teil], monat=_monat(t, tag.month))


def zeitraum_text(von: datetime, bis: datetime, exakt: List[datetime], t: Texte) -> str:
    """Lesbarer Zeitraum am Anfang einer Zeile: kurze Ereignisse 'Um den 14. April', laengere 'Mitte März bis
    Ende April' (gross begonnen, auch wo die Sprache Monatsteile klein schreibt: 'Mid-April')."""
    if (bis - von).days <= 12:
        return _um(exakt[0], t)
    a, b = monatsteil(von, t), monatsteil(bis, t)
    zeitraum = a if a == b else _f(t["zeit"]["von_bis"], von=a, bis=b)
    return zeitraum[:1].upper() + zeitraum[1:]


def zeitraum_offen(von: datetime, bis: datetime, start: datetime, ende: datetime, t: Texte) -> str:
    """Zeitraum innerhalb des Jahres; was schon vorher begann oder darueber hinaus reicht, bleibt offen
    ('Bis Mitte März', 'Ab Ende August', 'Das ganze Jahr')."""
    offen_vorne, offen_hinten = von <= start, bis >= ende
    if offen_vorne and offen_hinten:
        return t["zeit"]["das_ganze_jahr"]
    if offen_vorne:
        return _f(t["zeit"]["bis"], zeit=monatsteil(bis, t))
    if offen_hinten:
        return _f(t["zeit"]["ab"], zeit=monatsteil(von, t))
    return zeitraum_text(von, bis, [von + (bis - von) / 2], t)


def _abschnitte(werte: List[object], tage_liste: List[datetime]) -> List[Tuple[object, datetime, datetime]]:
    """Folgen gleicher Werte als (Wert, erster Tag, letzter Tag)."""
    erg: List[Tuple[object, datetime, datetime]] = []
    for w, tag in zip(werte, tage_liste):
        if erg and erg[-1][0] == w:
            erg[-1] = (w, erg[-1][1], tag)
        else:
            erg.append((w, tag, tag))
    return erg


def _wanderung(haeuser: List[int], tage_liste: List[datetime], min_tage: int) -> List[Dict[str, object]]:
    """Weg eines Planeten durch die Haeuser: je Haus ein Eintrag ab dem Eintritt. Ein Schritt ins vorige Haus
    ist Rueckläufigkeit und wird beim Eintrag davor vermerkt (`rueck`); laeuft der Planet danach wieder vor,
    verlaengert sich dieser Eintrag. Ein kurzer Rest im laufenden Haus am Anfang wird uebergangen."""
    abschnitte = _abschnitte(haeuser, tage_liste)
    erg: List[Dict[str, object]] = []
    for i, (haus, von, bis) in enumerate(abschnitte):
        if i == 0 and len(abschnitte) > 1 and (bis - von).days < min_tage:
            continue
        letzter = erg[-1] if erg else None
        if letzter and haus == (letzter["haus"] - 2) % 12 + 1:
            letzter["rueck"].append((haus, von, bis))
        elif letzter and haus == letzter["haus"]:
            letzter["bis"] = bis
        else:
            erg.append({"haus": haus, "von": von, "bis": bis, "erster": i == 0, "rueck": []})
    return erg


def _rueck_text(vorlage: str, planet: str, e: Dict[str, object], ende: datetime, t: Texte) -> str:
    """Nachsatz zur ruecklaeufigen Rueckkehr ins vorige Haus (leer, wenn es keine gab)."""
    teile = []
    for haus, von, bis in e["rueck"]:
        zeitraum = (_f(t["zeit"]["rueck_ab"], zeit=monatsteil(von, t)) if bis >= ende
                    else _f(t["zeit"]["rueck_von_bis"], von=monatsteil(von, t), bis=monatsteil(bis, t)))
        teile.append(vorlage.replace("{Planet}", planet).replace("{zeitraum}", zeitraum).replace("{haus}", str(haus)))
    return " ".join(teile)


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
    return f"{zeitraum_text(e['von'], e['bis'], e['exakt'], t)}: {satz}"


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


# ---------------------------------------------------------------------------------------------------------
# Vedisch

MIN_TAGE = 20  # kuerzere Reste im laufenden Haus werden im Jahreshoroskop nicht eigens genannt


def _dasha_bei(position: float, order: List[str], dauern: Dict[str, int]) -> Tuple[str, str]:
    """(Mahadasha, Antardasha) an einer Position 0..120 im Vimshottari-Zyklus. Die Unterperioden folgen
    in derselben Reihenfolge, beginnend mit dem Lord der Mahadasha; Dauer = MD-Jahre * AD-Jahre / 120."""
    position %= 120.0
    lauf = 0.0
    for i, md in enumerate(order):
        d = dauern[md]
        if position < lauf + d:
            innen = position - lauf
            for k in range(len(order)):
                ad = order[(i + k) % len(order)]
                teil = d * dauern[ad] / 120.0
                if innen < teil:
                    return md, ad
                innen -= teil
            return md, order[(i - 1) % len(order)]
        lauf += d
    return order[-1], order[-2]


def vedisch(
    pos_geburt: float,
    geburt: datetime,
    mond_zeichen: Optional[int],
    zeichen: Callable[[datetime], Dict[str, int]],
    start: datetime,
    t: Dict[str, Dict[str, str]],
    matrix: Dict[str, Dict[str, Dict[str, str]]],
    gochara: Dict[str, object],
    tage: int = 365,
) -> List[Dict[str, object]]:
    """Unterperioden, neue Mahadasha und Gochara-Wechsel von Jupiter und Saturn in den naechsten `tage` Tagen.
    `pos_geburt`: Position im 120-Jahre-Zyklus bei der Geburt (aus dem Mond-Nakshatra)."""
    order, dauern = _load_dasha_data()
    ende = start + timedelta(days=tage)
    tage_liste = [start + timedelta(days=i) for i in range(tage + 1)]
    jahr = 365.2425 * 86400
    tv, namen = t["ausblick_vedisch"], t["vedisch_namen"]
    erg: List[Dict[str, object]] = []

    def neu(von: datetime, bis: datetime, art: str, text: str, **mehr: object) -> None:
        erg.append({"von": von.date().isoformat(), "bis": bis.date().isoformat(), "art": art,
                    "text": f"{zeitraum_offen(von, bis, start, ende, t)}: {text}", **mehr})

    # Dasha: Unterperioden im Jahr, neue Mahadasha als eigenes Ereignis
    dasha = [_dasha_bei(pos_geburt + (tag - geburt).total_seconds() / jahr, order, dauern) for tag in tage_liste]
    for i, ((md, ad), von, bis) in enumerate(_abschnitte(dasha, tage_liste)):
        if i > 0 and md != dasha[0][0] and ad == md:
            erg.append({"von": von.date().isoformat(), "bis": von.date().isoformat(), "art": "mahadasha",
                        "md": md, "text": f"{_um(von, t)}: "
                        + tv["mahadasha_beginn"].replace("{md}", namen[md]).replace("{jahre}", str(dauern[md]))})
        beschreibung = matrix.get(f"{md}_antardasha", {}).get(f"{md}_{ad}", {}).get("beschreibung", "")
        neu(von, bis, "antardasha", tv["antardasha"].replace("{ad}", t["planeten_kurz"][ad])
            .replace("{md}", namen[md]).replace("{beschreibung}", beschreibung), md=md, ad=ad)

    # Gochara: Haeuser von Jupiter und Saturn vom Mondzeichen, Weg durch die Haeuser wie in _wanderung
    if mond_zeichen is not None:
        sade = gochara.get("sade_sati", {}).get("haeuser", [12, 1, 2])
        planeten = gochara.get("planeten", {})
        laeufe = [zeichen(tag) for tag in tage_liste]
        for pl in ("jupiter", "saturn"):
            haeuser = [(z[pl] - mond_zeichen) % 12 + 1 for z in laeufe]
            for e in _wanderung(haeuser, tage_liste, MIN_TAGE):
                haus, laufend = e["haus"], e["erster"]
                if pl == "saturn" and haus in sade:
                    art = {12: "sade_sati_beginn", 1: "sade_sati_hoehe", 2: "sade_sati_ausklang"}[haus]
                    text = tv["sade_sati_laufend" if art == "sade_sati_beginn" and laufend else art]
                elif pl == "saturn" and haus == 3 and not laufend:
                    art, text = "sade_sati_ende", tv["sade_sati_ende"]
                else:
                    guenstig = haus in planeten.get(pl, {}).get("guenstige_haeuser", [])
                    art = f"{pl}_{'guenstig' if guenstig else 'unguenstig'}"
                    # laufender Zustand im Praesens (Bausteine von heute), Wechsel in Zukunftsform
                    text = (t["vedisch_gochara"][art] if laufend else tv[art]).replace("{haus}", str(haus))
                nachsatz = _rueck_text(tv["rueckkehr"], t["planeten_kurz"][pl], e, ende, t)
                neu(e["von"], e["bis"], "gochara", f"{text} {nachsatz}".strip(), planet=pl, haus=haus)
    return sorted(erg, key=lambda e: e["von"])


# ---------------------------------------------------------------------------------------------------------
# Chinesisch

CHONG = {"zi": "wu", "chou": "wei", "yin": "shen", "mao": "you", "chen": "xu", "si": "hai"}
CHONG.update({b: a for a, b in list(CHONG.items())})


def _chong_text(regeln: Dict[str, Dict[str, str]], a: str, b: str) -> str:
    """Deutung eines Zusammenstosses aus den Regeldaten, ohne die Kopfzeile ('Ratte-Pferd (Zi-Wu): Wasser
    clashed Feuer.')."""
    eintrag = regeln.get(f"{a}_{b}") or regeln.get(f"{b}_{a}") or {}
    text = eintrag.get("text_de", "")
    if "): " in text:
        text = text.split("): ", 1)[1]
        text = text.split(". ", 1)[1] if ". " in text else text
    return text


def bazi(
    tagesmeister: str,
    tag_zweig: str,
    jahr_zweig: str,
    jahr_monat: Callable[[datetime], Tuple[str, str, str, str]],
    element: Callable[[str], str],
    beziehung: Callable[[str, str], str],
    start: datetime,
    t: Dict[str, Dict[str, str]],
    regeln: Dict[str, object],
    glueckssaeule: Optional[Tuple[datetime, str, str]] = None,
    tage: int = 365,
) -> List[Dict[str, object]]:
    """Element-Bloecke der Monate, Jahreswechsel, Chong-Monate und eine neue Glueckssaeule (Beginn, Stamm,
    Zweig) in den naechsten `tage` Tagen. `tagesmeister` ist das Element des Tagesstamms."""
    ende = start + timedelta(days=tage)
    tage_liste = [start + timedelta(days=i) for i in range(tage + 1)]
    tb, el, tiere, tiere_k = t["ausblick_bazi"], t["elemente"], t["bazi_tiere"], t["bazi_tiere_monat"]
    saeulen = [jahr_monat(tag) for tag in tage_liste]
    dm = el[tagesmeister]
    clashes = regeln["clash_und_combination_vollstaendig"]["sechs_clashes"]
    erg: List[Dict[str, object]] = []

    def neu(von: datetime, bis: datetime, art: str, text: str, **mehr: object) -> None:
        erg.append({"von": von.date().isoformat(), "bis": bis.date().isoformat(), "art": art,
                    "text": f"{zeitraum_offen(von, bis, start, ende, t)}: {text}", **mehr})

    def um(tag: datetime, art: str, text: str, **mehr: object) -> None:
        erg.append({"von": tag.date().isoformat(), "bis": tag.date().isoformat(), "art": art,
                    "text": f"{_um(tag, t)}: {text}", **mehr})

    # Monate: Stamm-Element wechselt alle zwei Monate (Yang- und Yin-Stamm desselben Elements)
    for monat_el, von, bis in _abschnitte([element(s[2]) for s in saeulen], tage_liste):
        rel = beziehung(tagesmeister, monat_el)
        neu(von, bis, "monat", tb[f"monat_{rel}"].replace("{dm}", dm).replace("{monat}", el[monat_el]),
            element=monat_el, beziehung=rel)

    # Monate, deren Zweig mit dem Zweig der Tagessaeule zusammenstoesst
    for zweig, von, bis in _abschnitte([s[3] for s in saeulen], tage_liste):
        if CHONG.get(zweig) == tag_zweig:
            neu(von, bis, "chong", tb["chong_monat"].replace("{tier}", tiere_k[zweig])
                .replace("{natal}", tiere[tag_zweig]).replace("{text}", _chong_text(clashes, zweig, tag_zweig)),
                zweig=zweig)

    # Jahreswechsel zu Lichun
    for i in range(1, len(saeulen)):
        if saeulen[i][1] != saeulen[i - 1][1]:
            stamm, zweig = saeulen[i][0], saeulen[i][1]
            jahr_el = element(stamm)
            rel = beziehung(tagesmeister, jahr_el)
            name = _f(tb["jahr_name"], element=el[jahr_el], tier=tiere_k[zweig])
            um(tage_liste[i], "jahr", tb[f"jahr_{rel}"].replace("{jahr}", name).replace("{dm}", dm),
               stamm=stamm, zweig=zweig, beziehung=rel)
            if CHONG.get(zweig) == jahr_zweig:
                um(tage_liste[i], "chong_jahr", tb["chong_jahr"].replace("{natal}", tiere[jahr_zweig])
                   .replace("{text}", _chong_text(clashes, zweig, jahr_zweig)), zweig=zweig)

    # neue Glueckssaeule
    if glueckssaeule and start < glueckssaeule[0] <= ende:
        tag, stamm, zweig = glueckssaeule
        lp = regeln["luck_pillars"]
        stamm_text = lp["stem_luck_pillars"].get(stamm, {}).get("text_de", "")
        zweig_text = lp["branch_luck_pillars"].get("wu_branch" if zweig == "wu" else zweig, {}).get("text_de", "")
        um(tag, "glueckssaeule", tb["glueckssaeule"]
           .replace("{saeule}", _f(tb["saeule_name"], element=el[element(stamm)], tier=tiere_k[zweig],
                                   stamm=stamm.capitalize(), zweig=zweig.capitalize()))
           .replace("{stamm}", stamm_text).replace("{zweig}", zweig_text), stamm=stamm, zweig=zweig)
    return sorted(erg, key=lambda e: e["von"])


# ---------------------------------------------------------------------------------------------------------
# Hellenistisch

LANGSAME_HERRSCHER = ("mars", "jupiter", "saturn")


def _naechster_geburtstag(geburt: datetime, start: datetime) -> datetime:
    for jahr in (start.year, start.year + 1):
        try:
            tag = geburt.replace(year=jahr, hour=12, minute=0, second=0, microsecond=0)
        except ValueError:  # 29. Februar
            tag = datetime(jahr, 3, 1, 12)
        if tag > start:
            return tag
    return start + timedelta(days=365)


def hellenistisch(
    geburt: datetime,
    asc_zeichen: Optional[int],
    hauslord: List[str],
    positionen: Callable[[datetime], Dict[str, float]],
    start: datetime,
    t: Dict[str, Dict[str, str]],
    tage: int = 365,
) -> List[Dict[str, object]]:
    """Laufendes und naechstes Profektionsjahr, bei langsamen Jahresherrschern deren Wanderung. Ohne
    Aszendent (kein Geburtsort) wird wie im Spiel ab Widder gezaehlt, die Wanderung entfaellt dann."""
    th = t["ausblick_hellenistisch"]
    ende = start + timedelta(days=tage)
    geb = _naechster_geburtstag(geburt, start)
    alter = geb.year - geburt.year - 1  # vollendete Jahre bis zum naechsten Geburtstag
    datum = _datum(geb, t)
    asc = asc_zeichen or 0
    erg: List[Dict[str, object]] = []
    herrscher_von: Dict[datetime, str] = {}
    for a, von, bis, vorsatz in ((alter, start, geb - timedelta(days=1), _f(t["zeit"]["bis_geburtstag"], zeit=datum)),
                                 (alter + 1, geb, ende, _f(t["zeit"]["ab_geburtstag"], zeit=datum))):
        haus = a % 12 + 1
        herrscher = hauslord[(asc + haus - 1) % 12]
        herrscher_von[von] = herrscher
        erg.append({"von": von.date().isoformat(), "bis": bis.date().isoformat(), "art": "profektion",
                    "haus": haus, "herrscher": herrscher,
                    "text": f"{vorsatz}: {t['hellenistisch_haus'][str(haus)]} {th[herrscher]}"})
    if asc_zeichen is None:
        return erg
    # Wanderung des Herrschers; bleibt er ueber den Geburtstag derselbe, durchgehend
    tage_liste = [start + timedelta(days=i) for i in range(tage + 1)]
    herrscher_tag = [herrscher_von[geb] if tag >= geb else herrscher_von[start] for tag in tage_liste]
    for herrscher, von, bis in _abschnitte(herrscher_tag, tage_liste):
        if herrscher not in LANGSAME_HERRSCHER:
            continue
        block = [tag for tag in tage_liste if von <= tag <= bis]
        haeuser = [(int(positionen(tag)[herrscher] // 30) - asc) % 12 + 1 for tag in block]
        name = t["planetennamen"][herrscher]
        for e in _wanderung(haeuser, block, MIN_TAGE):
            text = (th["wanderung"].replace("{Planet}", name).replace("{haus}", str(e["haus"]))
                    .replace("{thema}", t["hellenistisch_haus_kurz"][str(e["haus"])]))
            text = f"{text} {_rueck_text(th['pendeln'], name, e, ende, t)}".strip()
            erg.append({"von": e["von"].date().isoformat(), "bis": e["bis"].date().isoformat(), "art": "wanderung",
                        "planet": herrscher, "haus": e["haus"],
                        "text": f"{zeitraum_offen(e['von'], e['bis'], start, ende, t)}: {text}"})
    return sorted(erg, key=lambda e: e["von"])


# ---------------------------------------------------------------------------------------------------------
# Arabisch

KNOTEN = ("nordknoten", "suedknoten")


def _firdaria_bei(alter: float, reihenfolge: List[str], dauern: Dict[str, float], zyklus: List[str],
                  laenge: float = 75.0) -> Tuple[str, Optional[str]]:
    """(Haupt-Firdaria, Unterperiode) im Lebensalter `alter`; Knoten-Perioden ohne Unterperiode."""
    lage = alter % laenge
    lauf = 0.0
    for planet in reihenfolge:
        d = dauern[planet]
        if lage < lauf + d:
            if planet in KNOTEN or planet not in zyklus:
                return planet, None
            n = min(6, int((lage - lauf) / (d / 7.0)))
            return planet, zyklus[(zyklus.index(planet) + n) % len(zyklus)]
        lauf += d
    return reihenfolge[-1], None


def arabisch(
    geburt: datetime,
    tag_geburt: bool,
    quelle: Dict[str, object],
    regeln: Dict[str, object],
    start: datetime,
    t: Dict[str, Dict[str, str]],
    tage: int = 365,
) -> List[Dict[str, object]]:
    """Firdaria-Unterperioden und neue Haupt-Firdaria in den naechsten `tage` Tagen."""
    ta, gen = t["ausblick_arabisch"], t["arabisch_genitiv"]
    ende = start + timedelta(days=tage)
    tage_liste = [start + timedelta(days=i) for i in range(tage + 1)]
    reihenfolge = quelle["reihenfolge_tag" if tag_geburt else "reihenfolge_nacht"]
    dauern = {p: float(regeln["haupt_firdaria"][p]["dauer_jahre"]) for p in reihenfolge}
    zyklus = [p for p in quelle["reihenfolge_tag"] if p not in KNOTEN]
    kombis = regeln["unter_firdaria"]["qualitaets_matrix"]["kombinationen_tag_horoskop"]
    jahr = 365.2425 * 86400
    perioden = [_firdaria_bei((tag - geburt).total_seconds() / jahr, reihenfolge, dauern, zyklus) for tag in tage_liste]
    erg: List[Dict[str, object]] = []
    for i, ((haupt, unter), von, bis) in enumerate(_abschnitte(perioden, tage_liste)):
        if i > 0 and haupt != perioden[0][0] and (unter is None or unter == haupt):
            erg.append({"von": von.date().isoformat(), "bis": von.date().isoformat(), "art": "firdaria",
                        "haupt": haupt, "text": f"{_um(von, t)}: {ta[haupt]}"})
        if unter is None:
            text = ta["knoten"].replace("{haupt}", gen[haupt])
        else:
            beschreibung = kombis.get(f"{haupt}_hauptperiode", {}).get(f"{haupt}_{unter}", {}).get("beschreibung", "")
            text = ta["unter"].replace("{unter}", gen[unter]).replace("{haupt}", gen[haupt]).replace("{beschreibung}", beschreibung)
        erg.append({"von": von.date().isoformat(), "bis": bis.date().isoformat(), "art": "unter",
                    "haupt": haupt, "unter": unter, "text": f"{zeitraum_offen(von, bis, start, ende, t)}: {text}"})
    return sorted(erg, key=lambda e: e["von"])


# ---------------------------------------------------------------------------------------------------------
# Numerologie

def _einstellig(n: int) -> int:
    """Meisterzahl auf ihre Grundziffer (11 -> 2, 22 -> 4, 33 -> 6), fuer die 9x9-Matrix."""
    return n if n <= 9 else sum(int(z) for z in str(n))


def numerologie(geburt: datetime, start: datetime, t: Dict[str, Dict[str, str]], regeln: Dict[str, object],
                tage: int = 365) -> List[Dict[str, object]]:
    """Persoenliche Jahre und Monate der naechsten `tage` Tage, dazu ein neuer Pinnacle."""
    tn = t["ausblick_numerologie"]
    ende = start + timedelta(days=tage)
    jahre = regeln["persoenliches_jahr_profile"]
    matrix = regeln["persoenlicher_monat_matrix_81"]["matrix"]
    erg: List[Dict[str, object]] = []

    # persoenliche Jahre (Wechsel am 1. Jaenner)
    for jahr in range(start.year, ende.year + 1):
        von = max(start, datetime(jahr, 1, 1, 12))
        bis = min(ende, datetime(jahr, 12, 31, 12))
        pj = personal_year(geburt, von)
        profil = jahre.get(f"PJ{pj}", {})
        text = (tn["jahr"].replace("{zahl}", str(pj)).replace("{thema}", profil.get("schluesselthema", ""))
                .replace("{beschreibung}", profil.get("beschreibung", "")))
        vorsatz = (_f(t["zeit"]["bis"], zeit=_f(t["zeit"]["ende"], monat=_monat(t, 12))) if von == start and bis < ende
                   else _f(t["zeit"]["ab"], zeit=_monat(t, von.month)) if bis >= ende
                   else zeitraum_offen(von, bis, start, ende, t))
        erg.append({"von": von.date().isoformat(), "bis": bis.date().isoformat(), "art": "jahr", "zahl": pj,
                    "text": f"{vorsatz}: {text}"})

    # persoenliche Monate: der laufende und die elf folgenden
    tag = datetime(start.year, start.month, 1, 12)
    for _ in range(12):
        pj = personal_year(geburt, tag)
        pm = personal_month(pj, tag.month)
        feld = matrix.get(f"PJ{_einstellig(pj)}", {}).get(f"PM{_einstellig(pm)}", "")
        von = max(tag, start)
        naechster = datetime(tag.year + tag.month // 12, tag.month % 12 + 1, 1, 12)
        name = _monat(t, tag.month)
        vorsatz = (_f(t["zeit"]["bis"], zeit=_f(t["zeit"]["ende"], monat=name)) if tag < start
                   else _f(t["zeit"]["im_monat"], monat=name))
        erg.append({"von": von.date().isoformat(), "bis": (min(naechster, ende) - timedelta(days=1)).date().isoformat(),
                    "art": "monat", "zahl": pm,
                    "text": f"{vorsatz}: {tn['monat'].replace('{zahl}', str(pm)).replace('{text}', feld)}"})
        tag = naechster

    # neuer Pinnacle (wechselt am Geburtstag)
    lpn = life_path(geburt)
    geb = _naechster_geburtstag(geburt, start)
    if geb <= ende and _pinnacle_wechsel(geburt, geb, lpn):
        neu = current_pinnacle_number(geburt, geb, lpn)
        profil = regeln["pinnacle_profile"].get(f"PIN{neu}", {})
        erg.append({"von": geb.date().isoformat(), "bis": geb.date().isoformat(), "art": "pinnacle", "zahl": neu,
                    "text": f"{_f(t['zeit']['ab_geburtstag'], zeit=_datum(geb, t))}: "
                    + tn["pinnacle"].replace("{zahl}", str(neu)).replace("{thema}", profil.get("thema", ""))
                    .replace("{beschreibung}", profil.get("beschreibung", ""))})
    return sorted(erg, key=lambda e: (e["von"], e["art"] != "jahr"))


def _pinnacle_wechsel(geburt: datetime, geb: datetime, lpn: int) -> bool:
    """Ob am Geburtstag `geb` ein neuer Pinnacle-Abschnitt beginnt (Grenzen wie in current_pinnacle_number)."""
    alter = geb.year - geburt.year
    p1 = max(0, 36 - lpn)
    return alter in (p1, p1 + 9, p1 + 18)
