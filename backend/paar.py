"""
Partnerschaftshoroskop (Ergebnis von Spiel C): je System echte Partnerregeln aus den Geburtsdaten beider
Personen. "a" ist die erste Person (du, Gold), "b" die zweite (dein Gegenueber, Silber).

Westlich: Synastrie, Aspekte zwischen Sonne, Mond, Venus, Mars (und Aszendent) beider Personen.
Hellenistisch: Zeichenbeziehungen (ganze Zeichen) von Sonne, Mond und Aszendent, mit Aversion.
Vedisch: fuenf Kutas aus den Mond-Nakshatras und Mondzeichen (Tara, Yoni, Gana, Bhakoot, Nadi).
Chinesisch: Zweige von Tages- und Jahressaeule (Kombination, Dreieck, Zusammenstoss, Schaden), Tagesmeister.
Arabisch: Freundschaft der laufenden Firdaria-Herrscher, Glueckslos auf den Punkten des anderen.
Kabbalah: Lage der beiden Sephiroth im Lebensbaum (gleich, direkter Pfad, gleiche Saeule).
Numerologie: Kompatibilitaetsmatrix der Lebenszahlen, gleiches persoenliches Jahr.
Texte: content/horoscope/de/paar_v1.json (Quelle docs/Textbausteine/paar/paar_v1.md).
"""

from __future__ import annotations

import re
from typing import Callable, Dict, List, Optional, Tuple

from ausblick import CHONG, _chong_text

Texte = Dict[str, Dict[str, str]]

# ---------------------------------------------------------------------------------------------------------
# Westlich

ASPEKTE = {"konjunktion": 0.0, "sextil": 60.0, "quadrat": 90.0, "trine": 120.0, "opposition": 180.0}
LICHTER = ("sonne", "mond")
# klassische Paar-Kombinationen wiegen schwerer (Sonne-Mond, Venus-Mars)
PAAR_GEWICHT = {frozenset(("sonne", "mond")): 3.0, frozenset(("venus", "mars")): 3.0, frozenset(("mond",)): 2.0,
                frozenset(("sonne",)): 2.0, frozenset(("venus",)): 2.0, frozenset(("aszendent", "sonne")): 2.0,
                frozenset(("aszendent", "mond")): 2.0}


def _abweichung(x: float, y: float, winkel: float) -> float:
    return abs(abs((x - y + 180.0) % 360.0 - 180.0) - winkel)


def _themen(pa: str, pb: str, t: Texte) -> str:
    """'Gefuehl und Zuneigung' oder, wenn beide denselben Punkt meinen, 'eure Gefuehlswelten'."""
    return t["thema_gemeinsam"][pa] if pa == pb else f"{t['thema'][pa]} und {t['thema'][pb]}"


def _satz(vorlage: str, pa: str, pb: str, t: Texte) -> str:
    themen = _themen(pa, pb, t)
    return (vorlage.replace("{a}", t["westlich_a"][pa]).replace("{b}", t["westlich_b"][pb])
            .replace("{Themen}", themen[0].upper() + themen[1:]).replace("{themen}", themen))


def westlich(a: Dict[str, float], b: Dict[str, float], t: Texte, anzahl: int = 4) -> Dict[str, object]:
    """Engste gewichtete Aspekte zwischen den Punkten beider Personen (Orbis 6 Grad mit Sonne oder Mond,
    sonst 5)."""
    treffer: List[Tuple[float, str, str, str]] = []
    for pa, la in a.items():
        for pb, lb in b.items():
            orbis = 6.0 if pa in LICHTER or pb in LICHTER else 5.0
            for aspekt, winkel in ASPEKTE.items():
                abw = _abweichung(la, lb, winkel)
                if abw <= orbis:
                    gewicht = PAAR_GEWICHT.get(frozenset((pa, pb)), 1.0) * (1.0 - abw / orbis)
                    treffer.append((gewicht, pa, pb, aspekt))
    treffer.sort(reverse=True)
    aussagen = [_satz(t["westlich_aspekt"][aspekt], pa, pb, t) for _, pa, pb, aspekt in treffer[:anzahl]]
    return {"aussagen": aussagen or [t["westlich_ruhig"]["text"]],
            "aspekte": [{"a": pa, "b": pb, "aspekt": asp} for _, pa, pb, asp in treffer[:anzahl]]}


# ---------------------------------------------------------------------------------------------------------
# Hellenistisch

BEZUG = {0: "gleich", 1: "aversion", 2: "sextil", 3: "quadrat", 4: "trigon", 5: "aversion", 6: "opposition",
         7: "aversion", 8: "trigon", 9: "quadrat", 10: "sextil", 11: "aversion"}
HELL_PAARE = [("mond", "mond"), ("sonne", "mond"), ("mond", "sonne"), ("sonne", "sonne"), ("aszendent", "aszendent")]


def hellenistisch(a: Dict[str, float], b: Dict[str, float], t: Texte) -> Dict[str, object]:
    """Ganze Zeichen: wie Sonne, Mond und Aszendent beider Personen einander sehen (oder nicht)."""
    aussagen, bezuege = [], []
    for pa, pb in HELL_PAARE:
        if pa not in a or pb not in b:
            continue
        bezug = BEZUG[(int(b[pb] // 30) - int(a[pa] // 30)) % 12]
        bezuege.append({"a": pa, "b": pb, "bezug": bezug})
        aussagen.append(_satz(t["hellenistisch_bezug"][bezug], pa, pb, t))
    return {"aussagen": aussagen, "bezuege": bezuege}


# ---------------------------------------------------------------------------------------------------------
# Vedisch

# Yoni-Tier je Nakshatra (0 = Ashwini) nach der ueblichen Ashtakoota-Tabelle; die Zuordnung in
# jyotish_nakshatras.json weicht bei Uttara Ashadha und Shravana davon ab (siehe vedisch.md)
YONI = ["pferd", "elefant", "schaf", "schlange", "schlange", "hund", "katze", "schaf", "katze", "ratte", "ratte",
        "kuh", "bueffel", "tiger", "bueffel", "tiger", "hirsch", "hirsch", "hund", "affe", "mungo", "affe", "loewe",
        "pferd", "loewe", "kuh", "elefant"]
YONI_FEINDE = [{"pferd", "bueffel"}, {"elefant", "loewe"}, {"schaf", "affe"}, {"schlange", "mungo"},
               {"hund", "hirsch"}, {"katze", "ratte"}, {"kuh", "tiger"}]
# Nadi im festen Zickzack Adi, Madhya, Antya, Antya, Madhya, Adi (Vata, Pitta, Kapha)
NADI = ["Vata", "Pitta", "Kapha", "Kapha", "Pitta", "Vata"]
TARA_UNGUENSTIG = (3, 5, 7)  # Vipat, Pratyari, Naidhana
BHAKOOT_DOSHA = (2, 12, 6, 8, 5, 9)
KUTA_MAX = 3 + 4 + 6 + 7 + 8


def vedisch(nak_a: int, nak_b: int, mz_a: int, mz_b: int, ganas: List[str], gana_matrix: Dict[str, Dict],
            t: Texte) -> Dict[str, object]:
    """Fuenf Kutas: Tara (3), Yoni (4), Gana (6), Bhakoot (7), Nadi (8). `ganas`: Gana je Nakshatra
    (kleingeschrieben), `gana_matrix` aus jyotish_nakshatras.json."""
    tk = t["vedisch_kuta"]
    aussagen: List[str] = []

    def tara(von: int, zu: int) -> bool:
        rest = ((zu - von) % 27 + 1) % 9 or 9
        return rest not in TARA_UNGUENSTIG

    guenstig = tara(nak_a, nak_b) + tara(nak_b, nak_a)
    p_tara = 1.5 * guenstig
    aussagen.append(tk[["tara_schlecht", "tara_teil", "tara_gut"][guenstig]].replace("{punkte}", _zahl(p_tara)))

    ya, yb = YONI[nak_a], YONI[nak_b]
    if ya == yb:
        p_yoni, art = 4, "yoni_gleich"
    elif {ya, yb} in YONI_FEINDE:
        p_yoni, art = 0, "yoni_feind"
    else:
        p_yoni, art = 2, "yoni_neutral"
    aussagen.append(tk[art].replace("{tier_a}", t["yoni_tier"][ya]).replace("{tier_b}", t["yoni_tier"][yb]))

    ga, gb = ganas[nak_a], ganas[nak_b]
    p_gana = int(gana_matrix.get(f"{ga}_{gb}", {}).get("punkte", 0))
    art = "gana_gleich" if ga == gb else ("gana_nah" if p_gana > 0 else "gana_fern")
    aussagen.append(tk[art].replace("{punkte}", str(p_gana)).replace("{gana_a}", t["gana"][ga])
                    .replace("{gana_b}", t["gana"][gb]))

    abstand = (mz_b - mz_a) % 12 + 1
    p_bhakoot = 0 if abstand in BHAKOOT_DOSHA else 7
    paar = sorted((abstand, (mz_a - mz_b) % 12 + 1))
    aussagen.append(tk["bhakoot_gut" if p_bhakoot else "bhakoot_schlecht"].replace("{abstand}", f"{paar[0]}/{paar[1]}"))

    na, nb = NADI[nak_a % 6], NADI[nak_b % 6]
    p_nadi = 0 if na == nb else 8
    aussagen.append(tk["nadi_gut" if p_nadi else "nadi_schlecht"].replace("{nadi_a}", na).replace("{nadi_b}", nb))

    punkte = p_tara + p_yoni + p_gana + p_bhakoot + p_nadi
    gesamt = "gesamt_sehr_gut" if punkte >= 0.75 * KUTA_MAX else "gesamt_gut" if punkte >= KUTA_MAX / 2 else "gesamt_schwierig"
    aussagen.append(tk[gesamt].replace("{punkte}", _zahl(punkte)).replace("{max}", str(KUTA_MAX)))
    return {"aussagen": aussagen, "punkte": punkte, "max": KUTA_MAX,
            "kutas": {"tara": p_tara, "yoni": p_yoni, "gana": p_gana, "bhakoot": p_bhakoot, "nadi": p_nadi}}


def _zahl(x: float) -> str:
    return str(int(x)) if x == int(x) else str(x).replace(".", ",")


# ---------------------------------------------------------------------------------------------------------
# Chinesisch

STAMM_HE = [{"jia", "ji"}, {"yi", "geng"}, {"bing", "xin"}, {"ding", "ren"}, {"wu", "gui"}]


def _zweig_paar(daten: Dict[str, Dict], a: str, b: str) -> Optional[Dict]:
    """Eintrag zu zwei Zweigen in einer Tabelle mit Schluesseln 'zi_chou' (auch 'chou_wu_harm')."""
    for schluessel, wert in daten.items():
        if isinstance(wert, dict) and set(schluessel.split("_")[:2]) == {a, b}:
            return wert
    return None


def _nach_kopf(text: str) -> str:
    """'Ratte-Bueffel (Zi-Chou): ...' ohne die Kopfzeile."""
    return text.split("): ", 1)[1] if "): " in text else text


def bazi(a: Dict[str, str], b: Dict[str, str], beziehung: Callable[[str, str], str], element: Callable[[str], str],
         regeln: Dict[str, object], t: Texte, tiere: Dict[str, str], elemente: Dict[str, str]) -> Dict[str, object]:
    """`a`, `b`: tag_zweig, jahr_zweig, tag_stamm. Tageszweig = Ehepalast."""
    tabellen = regeln["clash_und_combination_vollstaendig"]
    aussagen: List[str] = []
    arten: Dict[str, str] = {}
    for ebene in ("tag", "jahr"):
        za, zb = a[f"{ebene}_zweig"], b[f"{ebene}_zweig"]
        text, art = "", "neutral"
        dreieck = next((k for k, v in tabellen["san_he_dreiecke"].items()
                        if isinstance(v, dict) and za in v.get("branches", []) and zb in v.get("branches", [])), None)
        if za == zb:
            art = "gleich"
        elif (he := _zweig_paar(tabellen["liu_he_kombinationen"], za, zb)):
            art, text = "he", _nach_kopf(he.get("text_de", ""))
        elif CHONG.get(za) == zb:
            art, text = "chong", _chong_text(tabellen["sechs_clashes"], za, zb)
        elif (hai := _zweig_paar(tabellen["liu_hai_harms"], za, zb)):
            art, text = "hai", _nach_kopf(hai.get("text_de", ""))
        elif dreieck:
            art = "sanhe"
        satz = (t["bazi_zweig"][art].replace("{wer}", t["bazi_wer"][ebene]).replace("{a}", tiere[za])
                .replace("{b}", tiere[zb]).replace("{text}", text)
                .replace("{element}", elemente.get(dreieck.split("_")[0], "") if dreieck else ""))
        aussagen.append(satz.strip())
        arten[ebene] = art
    ea, eb = element(a["tag_stamm"]), element(b["tag_stamm"])
    aussagen.append(t["bazi_dm"][beziehung(ea, eb)].replace("{a}", elemente[ea]).replace("{b}", elemente[eb]))
    if {a["tag_stamm"], b["tag_stamm"]} in STAMM_HE:
        aussagen.append(t["bazi_dm"]["stamm_he"].replace("{sa}", a["tag_stamm"].capitalize())
                        .replace("{sb}", b["tag_stamm"].capitalize()))
    # Grafik (roter Faden zwischen den Ehepalaesten): Art der Beziehung der Tages- und Jahreszweige
    return {"aussagen": aussagen, "ehepalast": arten["tag"], "jahrestiere": arten["jahr"]}


# ---------------------------------------------------------------------------------------------------------
# Arabisch

def arabisch(fird_a: str, fird_b: str, freundschaft: Dict[str, List[str]], los_a: Optional[float],
             los_b: Optional[float], punkte_a: Dict[str, float], punkte_b: Dict[str, float], t: Texte,
             genitiv: Dict[str, str]) -> Dict[str, object]:
    """Freundschaft der laufenden Haupt-Firdaria-Herrscher (Abu Ma'shar, Al-Biruni) und Glueckslose, die in
    das Zeichen von Sonne, Mond oder Aszendent des anderen fallen."""
    tf = t["arabisch_firdaria"]
    if fird_a == fird_b:
        art = "gleich"
    elif "knoten" in fird_a or "knoten" in fird_b:
        art = "knoten"
    else:
        def rolle(x: str, y: str) -> str:
            return next((r for r in ("freunde", "feinde", "neutral") if y in freundschaft.get(f"{x}_{r}", [])), "neutral")
        ra, rb = rolle(fird_a, fird_b), rolle(fird_b, fird_a)
        art = ra if ra == rb else "gemischt"
    aussagen = [tf[art].replace("{a}", genitiv[fird_a]).replace("{b}", genitiv[fird_b])]

    tl, tp = t["arabisch_los"], t["arabisch_punkt"]
    lose = []
    for los, andere, schluessel, ziel in ((los_a, punkte_b, "glueck_a", "b"), (los_b, punkte_a, "glueck_b", "a")):
        if los is None:
            continue
        for punkt in ("sonne", "mond", "aszendent"):
            if punkt in andere and int(andere[punkt] // 30) == int(los // 30):
                lose.append(tl[schluessel].replace("{punkt_b}", tp[f"{punkt}_b"]).replace("{punkt_a_gen}", tp[f"{punkt}_a"]))
                break
    if los_a is not None and los_b is not None:
        aussagen.extend(lose or [tl["keine"]])
    else:
        aussagen.extend(lose)
    return {"aussagen": aussagen, "firdaria": [fird_a, fird_b], "art": art}


def glueckslos(asc: float, sonne: float, mond: float, tag: bool) -> float:
    """Los des Gluecks: bei Tag ASC + Mond - Sonne, bei Nacht ASC + Sonne - Mond."""
    return (asc + mond - sonne) % 360.0 if tag else (asc + sonne - mond) % 360.0


# ---------------------------------------------------------------------------------------------------------
# Kabbalah

SAEULE = {1: "mitte", 6: "mitte", 9: "mitte", 10: "mitte", 2: "gnade", 4: "gnade", 7: "gnade",
          3: "strenge", 5: "strenge", 8: "strenge"}


def kabbalah(seph_a: int, seph_b: int, namen: List[str], pfade: Dict[str, Dict], t: Texte) -> Dict[str, object]:
    """Lage der beiden Sephiroth im Lebensbaum: dieselbe, durch einen der 22 Pfade direkt verbunden, auf
    derselben Saeule oder getrennt."""
    tk, ts = t["kabbalah"], t["saeule"]
    na, nb = namen[seph_a - 1], namen[seph_b - 1]
    pfad = next((p for p in pfade.values() if isinstance(p, dict)
                 and {p.get("von_sephira", {}).get("nummer"), p.get("zu_sephira", {}).get("nummer")} == {seph_a, seph_b}),
                None)
    art = ("gleich" if seph_a == seph_b else "pfad" if pfad
           else "saeule" if SAEULE[seph_a] == SAEULE[seph_b] else "getrennt")
    if seph_a == seph_b:
        satz = tk["gleich"].replace("{a}", na)
    elif pfad:
        satz = (tk["pfad"].replace("{a}", na).replace("{b}", nb).replace("{nr}", str(pfad["pfad_nummer"]))
                .replace("{buchstabe}", pfad.get("buchstabe_hebraeisch", "")).replace("{name}", pfad.get("buchstabe_name", ""))
                .replace("{bedeutung}", pfad.get("buchstabe_bedeutung", "").replace(" — ", ", "))
                .replace("{tarot}", re.sub(r"\s*\(.*?\)", "", pfad.get("tarot", "")).replace("—", "–")))
    elif SAEULE[seph_a] == SAEULE[seph_b]:
        satz = tk["saeule"].replace("{a}", na).replace("{b}", nb).replace("{saeule}", ts[SAEULE[seph_a]])
    else:
        satz = (tk["getrennt"].replace("{a}", na).replace("{b}", nb)
                .replace("{sa}", ts[SAEULE[seph_a]].replace("mittleren", "mittlere"))
                .replace("{sb}", ts[SAEULE[seph_b]].replace("mittleren", "mittlere")))
    return {"aussagen": [satz], "sephiroth": [seph_a, seph_b], "pfad": pfad["pfad_nummer"] if pfad else None,
            "art": art}


# ---------------------------------------------------------------------------------------------------------
# Numerologie

def _grundziffer(n: int) -> int:
    return {11: 2, 22: 4, 33: 6}.get(n, n)


def numerologie(lz_a: int, lz_b: int, pj_a: int, pj_b: int, matrix: Dict[str, Dict], t: Texte) -> Dict[str, object]:
    """Kompatibilitaetsmatrix der Lebenszahlen (Meisterzahlen als 2, 4, 6), gleiches persoenliches Jahr."""
    tn = t["numerologie"]
    x, y = sorted((_grundziffer(lz_a), _grundziffer(lz_b)))
    eintrag = matrix.get(f"{x}x{y}", {})
    aussagen = [tn["lebenszahl"].replace("{a}", str(lz_a)).replace("{b}", str(lz_b))
                .replace("{erklaerung}", eintrag.get("erklaerung", ""))]
    wert = eintrag.get("partnerschaft")
    if isinstance(wert, (int, float)) and 1 <= wert <= 5:
        aussagen.append(tn["bewertung"].replace("{bewertung}", t["numerologie_bewertung"][str(int(wert))]))
    if pj_a == pj_b:
        aussagen.append(tn["gleiches_jahr"].replace("{a}", str(pj_a)))
    return {"aussagen": aussagen, "partnerschaft": wert}
