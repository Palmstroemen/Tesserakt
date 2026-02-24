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
    return {d: 3.0 for d in DIMENSIONS}

def clamp(v: float) -> float:
    return round(min(5.0, max(1.0, v)), 2)

def blend(base: Dict, overlay: Dict, gewicht: float) -> Dict:
    """Mischt overlay in base mit gegebenem Gewicht."""
    result = {}
    for d in DIMENSIONS:
        b = base.get(d, 3.0)
        o = overlay.get(d, 3.0)
        result[d] = clamp(b * (1 - gewicht) + o * gewicht)
    return result

def extract_dims(data: dict, dim_feld: str) -> Dict[str, float]:
    """Extrahiert Dimensionswerte aus einem Dict anhand des konfigurierten Feldnamens."""
    if dim_feld == "direkt":
        return {d: float(data[d]) for d in DIMENSIONS if d in data}
    return {d: float(v) for d, v in data.get(dim_feld, {}).items() if d in DIMENSIONS}

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

def build_inputs(birth_date: datetime, target_date: datetime) -> dict:
    """Berechnet alle möglichen Eingabewerte die Struktur.json-Typen benötigen."""
    ys, yb = year_pillar(birth_date.year)
    ms, mb = month_pillar(birth_date.year, birth_date.month)
    ds_val  = day_stem(birth_date)
    dm_el   = stem_to_element(ds_val)
    tys, tyb = year_pillar(target_date.year)
    tms, tmb = month_pillar(target_date.year, target_date.month)
    age     = target_date.year - birth_date.year
    lpn     = life_path(birth_date)
    return {
        "sonnenzeichen":          sun_sign(birth_date),
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

def handle_nach_day_master(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    el = inputs.get("day_master_element", "")
    container = rules.get(quelle["schluessel"], {})
    return extract_dims(container.get(el, {}), quelle.get("dim_feld", "direkt"))

def handle_nach_branch(quelle: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    branch = inputs.get(quelle.get("eingabe", ""), "")
    container = rules.get(quelle["schluessel"], {})
    data = container.get(branch, {})
    felder = quelle.get("dim_felder", DIMENSIONS)
    return {d: float(data[d]) for d in felder if d in data}

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
                    result[d] = round((result.get(d,3.0) + v * w) / (1 + w), 2)
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
                    result[d] = round((result.get(d,3.0) + v) / 2, 2)
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
    dims = {d: float(v) for d, v in container.get(feld, {}).items() if d in DIMENSIONS}
    if dims:
        return dims

    # Fallback when rule files contain only qualitative sekt text but no explicit vectors.
    if ist_tag:
        return {
            "liebe": 3.0,
            "beruf": 3.5,
            "finanzen": 3.3,
            "gesundheit": 3.1,
            "soziales": 3.4,
            "kreativitaet": 3.0,
            "veraenderung": 3.3,
            "spiritualitaet": 2.9,
        }
    return {
        "liebe": 3.4,
        "beruf": 2.9,
        "finanzen": 2.9,
        "gesundheit": 3.3,
        "soziales": 3.1,
        "kreativitaet": 3.2,
        "veraenderung": 2.8,
        "spiritualitaet": 3.4,
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


# Registry aller Handler
HANDLER = {
    "nach_zeichen":          handle_nach_zeichen,
    "nach_planet_herrscher": handle_nach_planet_herrscher,
    "transit":               handle_transit,
    "nach_day_master":       handle_nach_day_master,
    "nach_branch":           handle_nach_branch,
    "element_interaktion":   handle_element_interaktion,
    "clash_combination":     handle_clash_combination,
    "nach_lebenspfadzahl":   handle_nach_lebenspfadzahl,
    "nach_sephira":          handle_nach_sephira,
    "firdaria":              handle_firdaria,
    "profektionen":          handle_profektionen,
    "sekt":                  handle_sekt,
    "mahadasha":             handle_mahadasha,
    "nakshatra":             handle_nakshatra,
    "direkter_vektor":       handle_direkter_vektor,
}


# ── Kern-Berechnung ────────────────────────────────────────────────────────────

def compute_vector(struktur: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    """
    Berechnet Vektor für ein System anhand seiner Struktur.json.
    Iteriert durch vektor_quellen, ruft Handler auf, blendet Ergebnisse.
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

    return {d: clamp(base[d]) for d in DIMENSIONS}


# ── Kontrollgruppe ─────────────────────────────────────────────────────────────

def control_vector(seed: int) -> Dict[str, float]:
    import random
    rng = random.Random(seed)
    return {d: round(rng.uniform(2.2, 3.8), 2) for d in DIMENSIONS}


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
                "T0": compute_vector(struktur, rules, build_inputs(birth_date, today)),
                "T1": compute_vector(struktur, rules, build_inputs(birth_date, t1)),
                "T3": compute_vector(struktur, rules, build_inputs(birth_date, t3)),
            }
        else:
            # Zeitunabhängige Systeme (Numerologie, Kabbalah): T0=T1=T3
            v = compute_vector(struktur, rules, build_inputs(birth_date, today))
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
    deviations = sorted([(d, abs(v-3.0), v) for d,v in vektor.items()],
                        key=lambda x: x[1], reverse=True)
    questions = []
    for dim, _, value in deviations[:n]:
        direction = "hoch" if value >= 3.0 else "niedrig"
        questions.append({
            "dimension":         dim,
            "frage":             templates.get(dim,{}).get(direction, f"Frage zu {dim}"),
            "erwartete_antwort": round(value),
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
        row = f"{d:<16}" + "".join(f" {result[k]['T0'].get(d,3.0):>7.2f}" for k in sys_keys)
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
