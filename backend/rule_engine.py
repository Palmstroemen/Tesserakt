#!/usr/bin/env python3
"""
Astrology Rule Engine
=====================
Datengetriebene Engine — alle systemspezifischen Strukturen sind in
Struktur.json-Dateien der jeweiligen Unterordner definiert.
Der Python-Code kennt keine systemspezifischen Schlüssel.

Ordnerstruktur:
  rule_engine.py
  /Westlich/        Struktur.json + western_rules_complete.json + ...
  /Bazi/            Struktur.json + bazi_rules.json + ...
  /Numerologie/     Struktur.json + numerologie_basis.json + ...
  /Kabbalah/        Struktur.json + kabbalah_sephiroth.json + ...
  /Arabisch/        Struktur.json + arabisch_firdaria.json + ...
  /Hellenistisch/   Struktur.json + hell_haeuser.json + ...
  /Vedisch/       Struktur.json + jyotish_dasha.json + ...
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, Tuple, List, Optional

# ── Pfade ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SUBFOLDERS = ["Westlich", "Bazi", "Numerologie", "Kabbalah",
              "Arabisch", "Hellenistisch", "Vedisch"]

DIMENSIONS = ["liebe","beruf","finanzen","gesundheit","soziales",
              "kreativitaet","veraenderung","spiritualitaet"]

# Systemkürzel für Ausgabe
SYSTEM_KUERZEL = {
    "Westlich": "A", "Bazi": "B", "Numerologie": "N",
    "Kabbalah": "K", "Arabisch": "AR", "Hellenistisch": "H", "Vedisch": "J"
}


# ── Daten laden ────────────────────────────────────────────────────────────────

def load_struktur(subfolder: str) -> Optional[dict]:
    path = os.path.join(BASE_DIR, subfolder, "Struktur.json")
    if not os.path.exists(path):
        print(f"[WARN] Keine Struktur.json in {subfolder}/")
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def load_rules(subfolder: str) -> dict:
    """Lädt alle JSON-Dateien (außer Struktur.json) aus einem Unterordner."""
    folder = os.path.join(BASE_DIR, subfolder)
    if not os.path.exists(folder):
        return {}
    merged = {}
    for filename in sorted(os.listdir(folder)):
        if filename.endswith(".json") and filename != "Struktur.json":
            path = os.path.join(folder, filename)
            try:
                with open(path, encoding="utf-8") as f:
                    merged.update(json.load(f))
            except json.JSONDecodeError as e:
                print(f"[ERROR] {filename}: {e}")
    return merged


# ── Hilfsfunktionen ────────────────────────────────────────────────────────────

def neutral_vector() -> Dict[str, float]:
    return {d: 0.0 for d in DIMENSIONS}

def clamp(v: float) -> float:
    return round(min(1.0, max(-1.0, v)), 2)

# Optionale Kalibrierung pro Dimension (offset + multiplier), lazy geladen
_kalibrierung_cache: Optional[dict] = None

def _load_kalibrierung() -> Optional[dict]:
    """Laedt kalibrierung_dimensionen.json falls vorhanden. Sonst None."""
    global _kalibrierung_cache
    if _kalibrierung_cache is not None:
        return _kalibrierung_cache
    path = os.path.join(BASE_DIR, "kalibrierung_dimensionen.json")
    if not os.path.exists(path):
        _kalibrierung_cache = {}
        return _kalibrierung_cache
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        _kalibrierung_cache = data
        return data
    except (json.JSONDecodeError, OSError):
        _kalibrierung_cache = {}
        return _kalibrierung_cache

def _apply_kalibrierung(vector: Dict[str, float], system_name: Optional[str] = None) -> Dict[str, float]:
    """
    Wendet Kalibrierung an. Wenn system_name gesetzt und in kalibrierung["systeme"],
    ein Offset/Multiplikator fuer alle Dimensionen; sonst pro Dimension aus kalibrierung.
    v' = clamp(offset + multiplier * v).
    """
    kal = _load_kalibrierung()
    if not kal:
        return vector
    result = {}
    systeme = kal.get("systeme") or {}
    if system_name and system_name in systeme:
        cfg = systeme[system_name]
        off = float(cfg.get("offset", 0.0))
        mult = float(cfg.get("multiplier", 1.0))
        for d in DIMENSIONS:
            v = vector.get(d, 0.0)
            result[d] = clamp(off + mult * v)
        return result
    for d in DIMENSIONS:
        v = vector.get(d, 0.0)
        cfg = kal.get(d, {}) if isinstance(kal.get(d), dict) else {}
        off = float(cfg.get("offset", 0.0))
        mult = float(cfg.get("multiplier", 1.0))
        result[d] = clamp(off + mult * v)
    return result

def blend(base: Dict, overlay: Dict, gewicht: float) -> Dict:
    """Mischt overlay in base mit gegebenem Gewicht."""
    result = {}
    for d in DIMENSIONS:
        b = base.get(d, 0.0)
        o = overlay.get(d, 0.0)
        result[d] = clamp(b * (1 - gewicht) + o * gewicht)
    return result

def _rule_value_to_signed(v: float) -> float:
    """Mappt Regelwert 0..1 oder 1..5 (ungünstig..günstig) auf -1..+1."""
    v = float(v)
    if 0 <= v <= 1:
        return 2.0 * v - 1.0
    if 1 < v <= 5:
        return (v - 3.0) / 2.0  # 1→-1, 3→0, 5→+1
    return 0.0

def extract_dims(data: dict, dim_feld: str) -> Dict[str, float]:
    """Extrahiert Dimensionswerte aus einem Dict; konvertiert 0..1 -> -1..+1."""
    if dim_feld == "direkt":
        return {d: _rule_value_to_signed(data[d]) for d in DIMENSIONS if d in data}
    raw = {d: float(v) for d, v in data.get(dim_feld, {}).items() if d in DIMENSIONS}
    return {d: _rule_value_to_signed(v) for d, v in raw.items()}

def find_by_prefix(container: dict, n: int) -> dict:
    """Sucht Eintrag nach numerischem Präfix: '1_kether', '2_chokmah' etc."""
    for key, val in container.items():
        if key == str(n) or key.startswith(str(n) + "_"):
            return val
    return {}


# ── Eingabe-Berechnungen ───────────────────────────────────────────────────────

STEMS    = ["jia","yi","bing","ding","wu","ji","geng","xin","ren","gui"]
BRANCHES = ["zi","chou","yin","mao","chen","si","wu","wei","shen","you","xu","hai"]

SUN_SIGN_BOUNDARIES = [
    ((3,21),(4,19),"widder"),   ((4,20),(5,20),"stier"),
    ((5,21),(6,20),"zwillinge"),((6,21),(7,22),"krebs"),
    ((7,23),(8,22),"loewe"),    ((8,23),(9,22),"jungfrau"),
    ((9,23),(10,22),"waage"),   ((10,23),(11,21),"skorpion"),
    ((11,22),(12,21),"schuetze"),((12,22),(1,19),"steinbock"),
    ((1,20),(2,18),"wassermann"),((2,19),(3,20),"fische"),
]

def sun_sign(birth_date: datetime) -> str:
    md = (birth_date.month, birth_date.day)
    for start, end, sign in SUN_SIGN_BOUNDARIES:
        if start[0] == end[0]:
            if md[0] == start[0] and start[1] <= md[1] <= end[1]:
                return sign
        else:
            if (md[0] == start[0] and md[1] >= start[1]) or \
               (md[0] == end[0] and md[1] <= end[1]):
                return sign
            if start[0] > end[0]:
                if (md[0] == start[0] and md[1] >= start[1]) or \
                   (md[0] == end[0] and md[1] <= end[1]):
                    return sign
    return "steinbock"

def year_pillar(year: int) -> Tuple[str, str]:
    offset = (year - 1924) % 60
    return STEMS[offset % 10], BRANCHES[offset % 12]

def month_pillar(year: int, month: int) -> Tuple[str, str]:
    base = {0:2,1:4,2:6,3:8,4:0,5:2,6:4,7:6,8:8,9:0}[(year-1924)%10]
    return STEMS[(base + month - 1) % 10], BRANCHES[(month + 1) % 12]

def day_stem(birth_date: datetime) -> str:
    return STEMS[((birth_date - datetime(1924,2,5)).days) % 10]

def stem_to_element(stem: str) -> str:
    return {"jia":"holz","yi":"holz","bing":"feuer","ding":"feuer",
            "wu":"erde","ji":"erde","geng":"metall","xin":"metall",
            "ren":"wasser","gui":"wasser"}.get(stem, "erde")

# Yang year stems (male forward, female backward when born in Yang year)
YANG_STEMS = ("jia", "bing", "wu", "geng", "ren")

def luck_pillar_for_both_sexes(
    birth_date: datetime, target_date: datetime
) -> Tuple[Tuple[str, str], Tuple[str, str]]:
    """
    Da Yun (Luck Pillar) for current 10-year block: (male_stem, male_branch), (female_stem, female_branch).
    Start from month pillar at birth; male/female use forward or backward by Yang/Yin year.
    """
    age = target_date.year - birth_date.year
    block = max(0, age // 10)
    ys, _ = year_pillar(birth_date.year)
    ms, mb = month_pillar(birth_date.year, birth_date.month)
    stem_idx = STEMS.index(ms) if ms in STEMS else 0
    branch_idx = BRANCHES.index(mb) if mb in BRANCHES else 0
    forward_stem = STEMS[(stem_idx + block) % 10]
    forward_branch = BRANCHES[(branch_idx + block) % 12]
    backward_stem = STEMS[(stem_idx - block) % 10]
    backward_branch = BRANCHES[(branch_idx - block) % 12]
    yang_year = ys in YANG_STEMS
    if yang_year:
        male_stem, male_branch = forward_stem, forward_branch
        female_stem, female_branch = backward_stem, backward_branch
    else:
        male_stem, male_branch = backward_stem, backward_branch
        female_stem, female_branch = forward_stem, forward_branch
    return (male_stem, male_branch), (female_stem, female_branch)

def life_path(birth_date: datetime) -> int:
    def ds(n):
        while n > 9 and n not in (11,22,33):
            n = sum(int(x) for x in str(n))
        return n
    return ds(ds(birth_date.day) + ds(birth_date.month) + ds(birth_date.year))

def estimate_transits(target_date: datetime) -> List[Tuple[str,str]]:
    cycles = {"merkur":88,"venus":225,"mars":687,"jupiter":4333,"saturn":10759}
    aspects = ["konjunktion","sextil","quadrat","trine","opposition"]
    base = datetime(2000,1,1)
    return [(p, aspects[int(((target_date-base).days % c)/c * 5) % 5])
            for p, c in cycles.items()]

# Radix: Ephemeris/Chart use English ids; Western rules use German keys.
_PLANET_ID_TO_DE = {
    "sun": "sonne", "moon": "mond", "mercury": "merkur", "venus": "venus",
    "mars": "mars", "jupiter": "jupiter", "saturn": "saturn",
    "uranus": "uranus", "neptune": "neptun", "pluto": "pluto",
}
_ASPECT_TYPE_TO_DE = {
    "conjunction": "konjunktion", "sextile": "sextil", "square": "quadrat",
    "trine": "trigon", "opposition": "opposition",
}

def _radix_to_planets_in_houses(radix_planets: List[dict]) -> List[Tuple[str, int]]:
    """From radix wheel planets list (id, house) -> [(planet_key_de, house_1_12), ...]."""
    out: List[Tuple[str, int]] = []
    for p in radix_planets or []:
        pid = p.get("id")
        house = p.get("house")
        if house is None:
            continue
        key = _PLANET_ID_TO_DE.get(pid)
        if key:
            out.append((key, int(house)))
    return out

def _radix_to_natal_aspects(radix_aspects: List[dict]) -> List[Tuple[str, str, str]]:
    """From radix aspects (a, b, type) -> [(planet_a_de, planet_b_de, aspect_de), ...]."""
    out: List[Tuple[str, str, str]] = []
    for asp in radix_aspects or []:
        a_id = asp.get("a")
        b_id = asp.get("b")
        typ = asp.get("type")
        if not a_id or not b_id or not typ:
            continue
        a_de = _PLANET_ID_TO_DE.get(a_id)
        b_de = _PLANET_ID_TO_DE.get(b_id)
        typ_de = _ASPECT_TYPE_TO_DE.get(typ)
        if a_de and b_de and typ_de:
            out.append((a_de, b_de, typ_de))
    return out

def build_inputs(
    birth_date: datetime,
    target_date: datetime,
    ephemeris_sonnenzeichen: Optional[str] = None,
    radix_planets: Optional[List[dict]] = None,
    radix_aspects: Optional[List[dict]] = None,
    bazi_day_branch: Optional[str] = None,
    bazi_hour_stem: Optional[str] = None,
    bazi_hour_branch: Optional[str] = None,
) -> dict:
    """Berechnet alle möglichen Eingabewerte die Struktur.json-Typen benötigen.
    Wenn ephemeris_sonnenzeichen gesetzt ist (z.B. aus Swiss Ephemeris Sonnenposition),
    wird es für sonnenzeichen verwendet; sonst Datumsgrenzen.
    radix_planets/radix_aspects: von build_radix_wheel (planets, aspects) für Westlich.
    bazi_day_branch/bazi_hour_stem/bazi_hour_branch: aus build_four_pillars für Bazi."""
    ys, yb = year_pillar(birth_date.year)
    ms, mb = month_pillar(birth_date.year, birth_date.month)
    ds_val  = day_stem(birth_date)
    dm_el   = stem_to_element(ds_val)
    tys, tyb = year_pillar(target_date.year)
    tms, tmb = month_pillar(target_date.year, target_date.month)
    age     = target_date.year - birth_date.year
    lpn     = life_path(birth_date)
    sonnenz = ephemeris_sonnenzeichen if ephemeris_sonnenzeichen else sun_sign(birth_date)
    base = {
        "sonnenzeichen":          sonnenz,
        "geburts_year_stem":      ys,
        "geburts_year_branch":    yb,
        "geburts_month_stem":     ms,
        "geburts_month_branch":   mb,
        "day_master_stem":        ds_val,
        "day_master_element":     dm_el,
        "aktuelles_year_stem":    tys,
        "aktuelles_year_branch":  tyb,
        "aktuelles_year_element": stem_to_element(tys),
        "aktueller_month_stem":   tms,
        "aktueller_month_branch": tmb,
        "lebensalter":            age,
        "lebenspfadzahl":         lpn,
        "zieldatum":              target_date,
        "geburts_stunde":         birth_date.hour,
        "geburts_tag_des_jahres": birth_date.timetuple().tm_yday,
        "transits":               estimate_transits(target_date),
    }
    if radix_planets is not None:
        base["planets_in_houses"] = _radix_to_planets_in_houses(radix_planets)
    if radix_aspects is not None:
        base["natal_aspects"] = _radix_to_natal_aspects(radix_aspects)
    if bazi_day_branch is not None:
        base["geburts_day_branch"] = bazi_day_branch
    if bazi_hour_stem is not None:
        base["geburts_hour_stem"] = bazi_hour_stem
    if bazi_hour_branch is not None:
        base["geburts_hour_branch"] = bazi_hour_branch
    return base


# ── Typ-Handler ────────────────────────────────────────────────────────────────
# Jede Funktion verarbeitet einen Quellen-Eintrag aus Struktur.json.

def handle_nach_zeichen(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    zeichen = inputs.get(quelle.get("eingabe", "sonnenzeichen"), "")
    container = rules.get(quelle["schluessel"], {})
    return extract_dims(container.get(zeichen, {}), quelle.get("dim_feld","dimensionen_vektor"))

def handle_nach_planet_herrscher(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    zeichen = inputs.get(quelle.get("eingabe", "sonnenzeichen"), "")
    herrscher_data = rules.get(quelle.get("herrscher_quelle","planet_rulers_dignities"), {})
    planeten = rules.get(quelle["schluessel"], {})
    for planet, data in herrscher_data.items():
        if planet == "_intro":
            continue
        dom = data.get("domizil", [])
        if isinstance(dom, str): dom = [dom]
        if zeichen in dom:
            return extract_dims(planeten.get(planet, {}), quelle.get("dim_feld","dimensionen"))
    return {}

def handle_transit(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    """Mehrere Transite — gibt gewichteten Gesamt-Overlay zurück."""
    transits = inputs.get("transits", [])
    transit_rules = rules.get(quelle["schluessel"], {})
    basis = neutral_vector()
    gewicht = quelle.get("gewicht", 0.6)
    abnahme = quelle.get("gewicht_abnahme", 0.1)
    minimum = quelle.get("gewicht_minimum", 0.2)
    for planet, aspect in transits:
        dims = extract_dims(
            transit_rules.get(planet, {}).get(aspect, {}),
            quelle.get("dim_feld", "vektor")
        )
        if dims:
            basis = blend(basis, dims, gewicht)
            gewicht = max(minimum, gewicht - abnahme)
    return basis

def handle_natal_aspekte(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    """Natale Planet×Planet-Aspekte aus inputs['natal_aspects'] (p1_de, p2_de, aspect_de); Lookup in planet_planet_aspekte.kombinationen."""
    natal = inputs.get("natal_aspects", [])
    container = rules.get(quelle.get("schluessel", "planet_planet_aspekte"), {})
    kombinationen = container.get("kombinationen", {})
    basis = neutral_vector()
    gewicht = quelle.get("gewicht", 0.4)
    abnahme = quelle.get("gewicht_abnahme", 0.05)
    minimum = quelle.get("gewicht_minimum", 0.2)
    dim_feld = quelle.get("dim_feld", "vektor")
    for item in natal:
        if len(item) != 3:
            continue
        p1, p2, aspect = item[0], item[1], item[2]
        pair_key = "_".join(sorted([p1, p2]))
        payload = kombinationen.get(pair_key, {}).get(aspect, {})
        dims = extract_dims(payload, dim_feld)
        if dims:
            basis = blend(basis, dims, gewicht)
            gewicht = max(minimum, gewicht - abnahme)
    return basis

def handle_planeten_in_haeusern(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    """Planeten in Häusern aus inputs['planets_in_houses'] (planet_key, house_1_12); Lookup in planeten_im_N_haus[planet]."""
    pairs = inputs.get("planets_in_houses", [])
    basis = neutral_vector()
    gewicht = quelle.get("gewicht", 0.5)
    abnahme = quelle.get("gewicht_abnahme", 0.03)
    minimum = quelle.get("gewicht_minimum", 0.2)
    dim_feld = quelle.get("dim_feld", "vektor")
    for item in pairs:
        if len(item) != 2:
            continue
        planet_key, house_num = item[0], item[1]
        key = f"planeten_im_{house_num}_haus"
        payload = rules.get(key, {}).get(planet_key, {})
        dims = extract_dims(payload, dim_feld)
        if dims:
            basis = blend(basis, dims, gewicht)
            gewicht = max(minimum, gewicht - abnahme)
    return basis

def handle_nach_day_master(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    el = inputs.get("day_master_element", "")
    container = rules.get(quelle["schluessel"], {})
    return extract_dims(container.get(el, {}), quelle.get("dim_feld", "direkt"))

def handle_nach_branch(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    branch = inputs.get(quelle.get("eingabe", ""), "")
    container = rules.get(quelle["schluessel"], {})
    data = container.get(branch, {})
    felder = quelle.get("dim_felder", DIMENSIONS)
    return {d: _rule_value_to_signed(data[d]) for d in felder if d in data}

def handle_element_interaktion(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    eingaben = quelle.get("eingabe", [])
    el_aktuell = inputs.get(eingaben[0], "") if len(eingaben) > 0 else ""
    el_dm      = inputs.get(eingaben[1], "") if len(eingaben) > 1 else ""
    interaktionen = rules.get(quelle["schluessel"], {})
    result = {}
    for typ, gruppe in interaktionen.items():
        w = quelle.get("gewicht_generierend",0.5) if typ=="generierend" \
            else quelle.get("gewicht_kontrollierend",0.4)
        for key, data in gruppe.items():
            combo = key.replace("_","")
            if combo in [f"{el_aktuell}{el_dm}", f"{el_dm}{el_aktuell}"]:
                dims = extract_dims(data, quelle.get("dim_feld","vektor"))
                for d, v in dims.items():
                    result[d] = round((result.get(d, 0.0) + v * w) / (1 + w), 2)
    return result

def handle_clash_combination(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    eingaben = quelle.get("eingabe", [])
    b1 = inputs.get(eingaben[0], "") if len(eingaben) > 0 else ""
    b2 = inputs.get(eingaben[1], "") if len(eingaben) > 1 else ""
    pair = set([b1, b2])
    container = rules.get(quelle["schluessel"], {})
    result = {}
    for subkey in ("clashes_branches", "combinations_branches"):
        for k, data in container.get(subkey, {}).items():
            if set(k.split("_")) == pair:
                dims = extract_dims(data, quelle.get("dim_feld","vektor"))
                for d, v in dims.items():
                    result[d] = round((result.get(d, 0.0) + v) / 2, 2)
    return result

def handle_luck_pillar(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    """Luck Pillar (Da Yun): stem + branch vectors from inputs, blended. Branch 'wu' → key 'wu_branch' in rules."""
    stem = inputs.get("luck_pillar_stem", "")
    branch = inputs.get("luck_pillar_branch", "")
    lp = rules.get(quelle["schluessel"], {})
    stem_data = lp.get("stem_luck_pillars", {}).get(stem, {})
    branch_key = "wu_branch" if branch == "wu" else branch
    branch_data = lp.get("branch_luck_pillars", {}).get(branch_key, {})
    dim_feld = quelle.get("dim_feld", "vektor")
    stem_vec = extract_dims(stem_data, dim_feld)
    branch_vec = extract_dims(branch_data, dim_feld)
    w = quelle.get("gewicht", 0.5)
    result = neutral_vector()
    for d in DIMENSIONS:
        v = w * stem_vec.get(d, 0.0) + w * branch_vec.get(d, 0.0)
        result[d] = clamp(v)
    return result

def handle_nach_lebenspfadzahl(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    lpn = inputs.get("lebenspfadzahl", 1)
    container = rules.get(quelle["schluessel"], {})
    # Direkt suchen
    profil = container.get(str(lpn), {})
    # Fallback: Meisterzahl reduzieren
    if not profil and lpn in (11,22,33):
        reduced = sum(int(x) for x in str(lpn))
        profil = container.get(str(reduced), {})
    return extract_dims(profil, quelle.get("dim_feld","dimensionen_vektor"))

def handle_nach_sephira(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    lpn = inputs.get("lebenspfadzahl", 1)
    reduktion = quelle.get("reduktion", {})
    # Meisterzahlen-Mapping
    mm = reduktion.get("meisterzahlen_mapping", {})
    n = mm.get(str(lpn), lpn)
    # Auf max reduzieren
    maximum = reduktion.get("max", 10)
    while n > maximum:
        n = sum(int(x) for x in str(n))
    if n == 0: n = maximum
    container = rules.get(quelle["schluessel"], {})
    return extract_dims(find_by_prefix(container, n), quelle.get("dim_feld","dimensionen_vektor"))

def handle_firdaria(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    alter = inputs.get("lebensalter", 0)
    zyklus = quelle.get("zyklus_jahre", 75)
    position = alter % zyklus
    container = rules.get(quelle["schluessel"], {})
    laufzeit = 0
    for key, data in container.items():
        if key in ("beschreibung","quelle"): continue
        dauer = data.get("dauer_jahre", 0)
        if laufzeit + dauer > position:
            return extract_dims(data, quelle.get("dim_feld","dimensionen_vektor"))
        laufzeit += dauer
    return {}

def handle_profektionen(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    alter = inputs.get("lebensalter", 0)
    zyklus = quelle.get("zyklus", 12)
    n = (alter % zyklus) + 1
    fmt = quelle.get("schluessel_format", "haus_{n}").replace("{n}", str(n))
    container = rules.get(quelle["schluessel"], {})
    payload = container.get(fmt, container.get(str(n), {}))
    if not payload:
        # Fallback for nested structures like "profektionshaus_themen": {"haus_1": {...}}
        nested = container.get("profektionshaus_themen", {})
        payload = nested.get(fmt, nested.get(str(n), {}))
    return extract_dims(payload, quelle.get("dim_feld","dimensionen_vektor"))

def handle_sekt(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    stunde = inputs.get(quelle.get("eingabe", "geburts_stunde"), 12)
    ist_tag = 6 <= stunde <= 18
    container = rules.get(quelle["schluessel"], {})
    feld = quelle.get("tag_schluessel" if ist_tag else "nacht_schluessel", "")
    raw = container.get(feld, {})
    dims = {d: _rule_value_to_signed(v) for d, v in raw.items() if d in DIMENSIONS}
    if dims:
        return dims

    # Fallback when rule files contain only qualitative sekt text but no explicit vectors (-1..+1).
    if ist_tag:
        return {
            "liebe": 0.0,
            "beruf": 0.24,
            "finanzen": 0.16,
            "gesundheit": 0.04,
            "soziales": 0.2,
            "kreativitaet": 0.0,
            "veraenderung": 0.16,
            "spiritualitaet": -0.04,
        }
    return {
        "liebe": 0.2,
        "beruf": -0.04,
        "finanzen": -0.04,
        "gesundheit": 0.16,
        "soziales": 0.04,
        "kreativitaet": 0.1,
        "veraenderung": -0.1,
        "spiritualitaet": 0.2,
    }

def handle_mahadasha(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    alter   = inputs.get("lebensalter", 0)
    zyklus  = quelle.get("zyklus_jahre", 120)
    basis   = quelle.get("geburt_offset_basis", 1900)
    birth_y = inputs.get("geburts_year_stem","")  # nicht direkt verfügbar — nutze Alter
    # Geschätzte Position im Zyklus
    position = (alter + (datetime.now().year - basis)) % zyklus
    dauern   = rules.get(quelle.get("dauern_schluessel","mahadasha_dauern"), {})
    profile  = rules.get(quelle["schluessel"], {})
    fmt      = quelle.get("profil_format", "{planet}_mahadasha")
    laufzeit = 0
    for planet, dauer in dauern.items():
        dauer_jahre = None
        if isinstance(dauer, (int, float)):
            dauer_jahre = float(dauer)
        elif isinstance(dauer, dict):
            # Some rule files store durations as {"jahre": N, ...}
            jahre = dauer.get("jahre")
            if isinstance(jahre, (int, float)):
                dauer_jahre = float(jahre)

        if dauer_jahre is None:
            # Metadaten-Eintraege wie "quelle" ignorieren.
            continue

        if laufzeit + dauer_jahre > position:
            key = fmt.replace("{planet}", planet)
            return extract_dims(profile.get(key, {}), quelle.get("dim_feld","dimensionen_vektor"))
        laufzeit += dauer_jahre
    return {}

def handle_nakshatra(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    tag = inputs.get("geburts_tag_des_jahres", 1)
    anzahl = quelle.get("anzahl", 27)
    idx = int((tag / 365) * anzahl)
    container = rules.get(quelle["schluessel"], {})
    keys = list(container.keys())
    if idx < len(keys):
        return extract_dims(container[keys[idx]], quelle.get("dim_feld","dimensionen_vektor"))
    return {}

def handle_direkter_vektor(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    container = rules.get(quelle["schluessel"], {})
    dims = extract_dims(container, quelle.get("dim_feld","dimensionen_vektor"))
    if dims:
        return dims

    # Fallback for nested house maps (e.g. lot_des_gluecks -> deutung_nach_haeusern -> haus_n)
    haeuser = container.get("deutung_nach_haeusern", {})
    if isinstance(haeuser, dict):
        alter = inputs.get("lebensalter", 0)
        haus_idx = (alter % 12) + 1
        haus_key = f"haus_{haus_idx}"
        return extract_dims(haeuser.get(haus_key, {}), quelle.get("dim_feld","dimensionen_vektor"))
    return {}


# Whole-sign house lords: 1=Aries=Mars, 2=Taurus=Venus, 3=Gemini=Mercury, 4=Cancer=Moon, 5=Leo=Sun,
# 6=Virgo=Mercury, 7=Libra=Venus, 8=Scorpio=Mars, 9=Sagittarius=Jupiter, 10=Capricorn=Saturn,
# 11=Aquarius=Saturn, 12=Pisces=Jupiter
_HOUSE_LORD = ["mars", "venus", "merkur", "mond", "sonne", "merkur", "venus", "mars", "jupiter", "saturn", "saturn", "jupiter"]


def handle_thematic_profektion(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    """Profektionshaus + Jahresherrscher: lookup planeten_im_N_haus[lord] (Lord of Year = house ruler)."""
    alter = inputs.get("lebensalter", 0)
    n = (alter % 12) + 1
    lord = _HOUSE_LORD[n - 1]
    key = quelle.get("schluessel_format", "planeten_im_{n}_haus").replace("{n}", str(n))
    container = rules.get(key, {})
    payload = container.get(lord, {})
    return extract_dims(payload, quelle.get("dim_feld", "vektor"))


def handle_jahresherrscher(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    """Lord of the Year aus Profektionshaus: alter → haus 1..12 → lord (Mars, Venus, …) → jahresherrscher_profile[lord]."""
    alter = inputs.get("lebensalter", 0)
    n = (alter % 12) + 1
    lord = _HOUSE_LORD[n - 1]
    container = rules.get(quelle.get("schluessel", "jahresherrscher_profile"), {})
    payload = container.get(lord, {})
    return extract_dims(payload, quelle.get("dim_feld", "dimensionen_vektor"))


# Registry aller Handler
HANDLER = {
    "nach_zeichen":          handle_nach_zeichen,
    "nach_planet_herrscher": handle_nach_planet_herrscher,
    "transit":               handle_transit,
    "natal_aspekte":         handle_natal_aspekte,
    "planeten_in_haeusern":  handle_planeten_in_haeusern,
    "nach_day_master":       handle_nach_day_master,
    "nach_branch":           handle_nach_branch,
    "element_interaktion":   handle_element_interaktion,
    "clash_combination":     handle_clash_combination,
    "luck_pillar":           handle_luck_pillar,
    "nach_lebenspfadzahl":   handle_nach_lebenspfadzahl,
    "nach_sephira":          handle_nach_sephira,
    "firdaria":              handle_firdaria,
    "profektionen":          handle_profektionen,
    "sekt":                  handle_sekt,
    "mahadasha":             handle_mahadasha,
    "nakshatra":             handle_nakshatra,
    "direkter_vektor":       handle_direkter_vektor,
    "thematic_profektion":   handle_thematic_profektion,
    "jahresherrscher":       handle_jahresherrscher,
}


# ── Kern-Berechnung ────────────────────────────────────────────────────────────

def compute_vector(struktur: dict, rules: dict, inputs: dict, system_name: Optional[str] = None) -> Dict[str, float]:
    """
    Berechnet Vektor für ein System anhand seiner Struktur.json.
    Iteriert durch vektor_quellen, ruft Handler auf, blendet Ergebnisse.
    system_name optional für systemweite Kalibrierung (z. B. Westlich, Bazi).
    """
    base = neutral_vector()
    hat_werte = False

    for quelle in struktur.get("vektor_quellen", []):
        typ     = quelle.get("typ", "")
        gewicht = quelle.get("gewicht", 0.5)
        handler = HANDLER.get(typ)

        if not handler:
            print(f"[WARN] Unbekannter Typ: '{typ}'")
            continue

        dims = handler(quelle, rules, inputs)

        if not dims:
            if quelle.get("pflicht", False):
                print(f"[WARN] Pflichtquelle '{quelle.get('id')}' lieferte keine Daten.")
            continue

        # nur_wenn_leer: Fallback der nur greift wenn base noch neutral ist
        if quelle.get("nur_wenn_leer", False) and hat_werte:
            continue

        # Transit-Handler gibt bereits gemischten Vektor zurück
        if typ == "transit":
            base = blend(base, dims, gewicht)
        else:
            base = blend(base, dims, gewicht)

        hat_werte = True

    result = {d: clamp(base[d]) for d in DIMENSIONS}
    result = _apply_kalibrierung(result, system_name=system_name)
    return result


# ── Kontrollgruppe ─────────────────────────────────────────────────────────────

def control_vector(seed: int) -> Dict[str, float]:
    import random
    rng = random.Random(seed)
    return {d: round(min(1.0, max(-1.0, rng.gauss(0.0, 0.3))), 2) for d in DIMENSIONS}


# ── Haupt-API ──────────────────────────────────────────────────────────────────

def generate_all_vectors(birth_date: datetime, birth_time_hour: int = 12) -> Dict:
    """
    Erzeugt Vektoren für alle Systeme × 3 Zeitfenster.
    Systeme werden dynamisch aus Unterordnern geladen — keine Hardcodierung.
    """
    birth_date = birth_date.replace(hour=birth_time_hour)
    today = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    t1    = today - timedelta(days=30)
    t3    = today - timedelta(days=100)
    seed  = birth_date.year * 10000 + birth_date.month * 100 + birth_date.day

    # Alle Systeme laden
    systeme = {}
    for folder in SUBFOLDERS:
        struktur = load_struktur(folder)
        rules    = load_rules(folder)
        if struktur:
            systeme[folder] = (struktur, rules)

    result = {}

    for folder, (struktur, rules) in systeme.items():
        kuerzel     = SYSTEM_KUERZEL.get(folder, folder)
        ist_zeitabh = struktur.get("_meta", {}).get("zeit_abhaengig", True)

        if ist_zeitabh:
            result[kuerzel] = {
                "T0": compute_vector(struktur, rules, build_inputs(birth_date, today), system_name=folder),
                "T1": compute_vector(struktur, rules, build_inputs(birth_date, t1), system_name=folder),
                "T3": compute_vector(struktur, rules, build_inputs(birth_date, t3), system_name=folder),
            }
        else:
            # Zeitunabhängige Systeme (Numerologie, Kabbalah): T0=T1=T3
            v = compute_vector(struktur, rules, build_inputs(birth_date, today), system_name=folder)
            result[kuerzel] = {"T0": v, "T1": v, "T3": v}

    # Kontrollgruppe
    result["KO"] = {
        "T0": control_vector(seed),
        "T1": control_vector(seed + 30),
        "T3": control_vector(seed + 100),
    }

    # Meta
    inp = build_inputs(birth_date, today)
    result["meta"] = {
        "geburtsdatum":       birth_date.strftime("%d.%m.%Y"),
        "sonnenzeichen":      inp["sonnenzeichen"],
        "lebenspfadzahl":     inp["lebenspfadzahl"],
        "day_master_stem":    inp["day_master_stem"],
        "day_master_element": inp["day_master_element"],
        "geburts_year_branch":inp["geburts_year_branch"],
        "systeme_geladen":    list(systeme.keys()),
        "zeitfenster": {
            "T0": today.strftime("%d.%m.%Y"),
            "T1": t1.strftime("%d.%m.%Y"),
            "T3": t3.strftime("%d.%m.%Y"),
        }
    }
    return result


# ── Fragen-Generator ───────────────────────────────────────────────────────────

def vector_to_questions(vektor: Dict[str,float], system: str, zeitfenster: str, n: int=3) -> List[Dict]:
    templates = {
        "liebe":         {"hoch":"Hast du in letzter Zeit Wärme und Zuneigung gespürt?",
                          "niedrig":"Hat sich dein Liebesleben eher schwierig angefühlt?"},
        "beruf":         {"hoch":"Lief es beruflich besonders gut — Erfolge oder Anerkennung?",
                          "niedrig":"Hattest du beruflich das Gefühl, gegen Widerstände zu kämpfen?"},
        "finanzen":      {"hoch":"War die finanzielle Situation eher entspannt und stabil?",
                          "niedrig":"Hattest du finanzielle Sorgen oder unerwartete Ausgaben?"},
        "gesundheit":    {"hoch":"Hast du dich körperlich fit und energiegeladen gefühlt?",
                          "niedrig":"Hast du dich körperlich eher schlapp oder anfällig gefühlt?"},
        "soziales":      {"hoch":"War dein soziales Leben lebhaft — viele Begegnungen?",
                          "niedrig":"Hast du dich in sozialen Situationen eher zurückgezogen?"},
        "kreativitaet":  {"hoch":"Hast du kreative Energie gespürt — neue Ideen?",
                          "niedrig":"Fühltest du dich kreativ blockiert?"},
        "veraenderung":  {"hoch":"Hat sich etwas in deinem Leben deutlich verändert?",
                          "niedrig":"War der Zeitraum eher ruhig ohne große Veränderungen?"},
        "spiritualitaet":{"hoch":"Hast du intensive innere Erlebnisse oder spirituelle Momente gehabt?",
                          "niedrig":"War dein Alltag eher nüchtern und wenig nach innen gerichtet?"},
    }
    deviations = sorted([(d, abs(v), v) for d, v in vektor.items()],
                        key=lambda x: x[1], reverse=True)
    questions = []
    for dim, _, value in deviations[:n]:
        direction = "hoch" if value >= 0.0 else "niedrig"
        questions.append({
            "dimension":         dim,
            "frage":             templates.get(dim,{}).get(direction, f"Frage zu {dim}"),
            "erwartete_antwort": round(value, 2),
            "invertiert":        direction == "niedrig",
            "system":            system,
            "zeitfenster":       zeitfenster,
            "vektor_wert":       value,
        })
    return questions


# ── Demo ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    birth = datetime(1985, 3, 15)

    print("=" * 72)
    print("ASTROLOGY RULE ENGINE — DEMO (datengetrieben)")
    print("=" * 72)

    result = generate_all_vectors(birth)

    print(f"\n📅 Geburtsdatum:      {result['meta']['geburtsdatum']}")
    print(f"♈  Sonnenzeichen:     {result['meta']['sonnenzeichen']}")
    print(f"🔢 Lebenspfadzahl:    {result['meta']['lebenspfadzahl']}")
    print(f"🌿 Day Master:        {result['meta']['day_master_stem']} ({result['meta']['day_master_element']})")
    print(f"\n📂 Geladene Systeme:  {', '.join(result['meta']['systeme_geladen'])}")

    sys_keys = [SYSTEM_KUERZEL[f] for f in SUBFOLDERS if SYSTEM_KUERZEL[f] in result]

    print("\n" + "─" * 72)
    header = f"{'Dimension':<16}" + "".join(f" {k+'-T0':>7}" for k in sys_keys)
    print(header)
    print("─" * 72)
    for d in DIMENSIONS:
        row = f"{d:<16}" + "".join(f" {result[k]['T0'].get(d, 0.0):>7.2f}" for k in sys_keys)
        print(row)

    print("\n" + "─" * 72)
    print("FRAGEN (System A, T1)")
    print("─" * 72)
    if "A" in result:
        for i, q in enumerate(vector_to_questions(result["A"]["T1"],"A","T1",n=3),1):
            inv = " [INV]" if q["invertiert"] else ""
            print(f"\n{i}. {q['frage']}{inv}")
            print(f"   {q['dimension']} | {q['erwartete_antwort']}/5 | wert={q['vektor_wert']}")

    print("\n" + "=" * 72)
    print("✓ Engine bereit.")
    print("=" * 72)
