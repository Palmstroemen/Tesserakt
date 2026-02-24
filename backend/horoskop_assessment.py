#!/usr/bin/env python3
"""
Horoskop Assessment
===================
Stellt Fragen zu 8 Lebensbereichen (je 2 pro Bereich), vergleicht die
Selbsteinschätzung des Users mit den Vorhersagen von 7 Weissagungssystemen,
und bewertet am Ende welches System am besten getroffen hat.

Aufruf:
    python3 horoskop_assessment.py
    python3 horoskop_assessment.py --geburt 1985-03-15 --uhrzeit 14:30
    python3 horoskop_assessment.py --geburt 1985-03-15 --uhrzeit 14:30 --methode absolut
"""

import sys
import os
import json
import argparse
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ══════════════════════════════════════════════════════════════════════
# KONSTANTEN
# ══════════════════════════════════════════════════════════════════════

SYSTEME = ["Westlich", "Bazi", "Numerologie", "Kabbalah",
           "Arabisch", "Hellenistisch", "Vedisch"]

SYSTEM_KUERZEL = {
    "Westlich":"A","Bazi":"B","Numerologie":"N","Kabbalah":"K",
    "Arabisch":"AR","Hellenistisch":"H","Vedisch":"J"
}
KUERZEL_SYSTEM = {v: k for k, v in SYSTEM_KUERZEL.items()}

DIMENSIONS = ["liebe","beruf","finanzen","gesundheit","soziales",
              "kreativitaet","veraenderung","spiritualitaet"]

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

# ══════════════════════════════════════════════════════════════════════
# FRAGEBOGEN — 2 Fragen pro Dimension mit leicht unterschiedlichen
# Gewichtungen damit verschiedene Systeme unterschiedlich stark
# angesprochen werden
# ══════════════════════════════════════════════════════════════════════

FRAGEN = [
    # ── LIEBE ─────────────────────────────────────────────────────────
    {
        "text":      "Ich bin ein liebevoller und einfühlsamer Mensch in Beziehungen.",
        "dimension": "liebe",
        "gewichte":  {"Westlich":1.0,"Bazi":0.5,"Numerologie":1.0,
                      "Kabbalah":0.8,"Arabisch":0.9,"Hellenistisch":1.0,"Vedisch":0.5},
    },
    {
        "text":      "Romantische Verbindungen entstehen in meinem Leben eher leicht.",
        "dimension": "liebe",
        "gewichte":  {"Westlich":0.9,"Bazi":0.8,"Numerologie":0.7,
                      "Kabbalah":0.5,"Arabisch":1.0,"Hellenistisch":0.9,"Vedisch":0.7},
    },
    # ── BERUF ─────────────────────────────────────────────────────────
    {
        "text":      "Ich bin ehrgeizig und setze mir klare berufliche Ziele.",
        "dimension": "beruf",
        "gewichte":  {"Westlich":1.0,"Bazi":1.0,"Numerologie":0.9,
                      "Kabbalah":0.5,"Arabisch":1.0,"Hellenistisch":1.0,"Vedisch":1.0},
    },
    {
        "text":      "Andere Menschen respektieren meine fachliche Kompetenz.",
        "dimension": "beruf",
        "gewichte":  {"Westlich":0.8,"Bazi":0.9,"Numerologie":1.0,
                      "Kabbalah":0.6,"Arabisch":0.8,"Hellenistisch":0.9,"Vedisch":0.9},
    },
    # ── FINANZEN ──────────────────────────────────────────────────────
    {
        "text":      "Ich halte mich für geschickt in finanziellen Angelegenheiten.",
        "dimension": "finanzen",
        "gewichte":  {"Westlich":1.0,"Bazi":1.0,"Numerologie":0.9,
                      "Kabbalah":0.5,"Arabisch":1.0,"Hellenistisch":1.0,"Vedisch":1.0},
    },
    {
        "text":      "Geld und materielle Sicherheit kommen in meinem Leben eher von selbst.",
        "dimension": "finanzen",
        "gewichte":  {"Westlich":0.9,"Bazi":1.0,"Numerologie":0.8,
                      "Kabbalah":0.4,"Arabisch":1.0,"Hellenistisch":1.0,"Vedisch":0.9},
    },
    # ── GESUNDHEIT ────────────────────────────────────────────────────
    {
        "text":      "Ich habe generell viel Energie und körperliche Vitalität.",
        "dimension": "gesundheit",
        "gewichte":  {"Westlich":1.0,"Bazi":0.7,"Numerologie":0.7,
                      "Kabbalah":0.0,"Arabisch":0.0,"Hellenistisch":0.8,"Vedisch":1.0},
    },
    {
        "text":      "Ich erhole mich nach Krankheiten oder Belastungen schnell.",
        "dimension": "gesundheit",
        "gewichte":  {"Westlich":1.0,"Bazi":0.8,"Numerologie":0.6,
                      "Kabbalah":0.0,"Arabisch":0.0,"Hellenistisch":0.7,"Vedisch":0.9},
    },
    # ── SOZIALES ──────────────────────────────────────────────────────
    {
        "text":      "Ich bin gerne unter Menschen und fühle mich in Gruppen wohl.",
        "dimension": "soziales",
        "gewichte":  {"Westlich":1.0,"Bazi":0.0,"Numerologie":1.0,
                      "Kabbalah":0.0,"Arabisch":0.8,"Hellenistisch":0.8,"Vedisch":0.0},
    },
    {
        "text":      "Ich knüpfe leicht neue Bekanntschaften und halte Kontakt aufrecht.",
        "dimension": "soziales",
        "gewichte":  {"Westlich":0.9,"Bazi":0.0,"Numerologie":1.0,
                      "Kabbalah":0.0,"Arabisch":0.9,"Hellenistisch":0.7,"Vedisch":0.0},
    },
    # ── KREATIVITÄT ───────────────────────────────────────────────────
    {
        "text":      "Ich halte mich für einen kreativen Menschen.",
        "dimension": "kreativitaet",
        "gewichte":  {"Westlich":1.0,"Bazi":0.0,"Numerologie":1.0,
                      "Kabbalah":1.0,"Arabisch":0.0,"Hellenistisch":0.0,"Vedisch":0.0},
    },
    {
        "text":      "Ich finde spontan und intuitiv unkonventionelle Lösungen für Probleme.",
        "dimension": "kreativitaet",
        "gewichte":  {"Westlich":0.8,"Bazi":0.3,"Numerologie":0.9,
                      "Kabbalah":0.8,"Arabisch":0.3,"Hellenistisch":0.3,"Vedisch":0.3},
    },
    # ── VERÄNDERUNG ───────────────────────────────────────────────────
    {
        "text":      "In meinem Leben passieren häufig bedeutende Veränderungen.",
        "dimension": "veraenderung",
        "gewichte":  {"Westlich":0.9,"Bazi":1.0,"Numerologie":0.8,
                      "Kabbalah":0.7,"Arabisch":1.0,"Hellenistisch":1.0,"Vedisch":1.0},
    },
    {
        "text":      "Ich bin offen für Neues und passe mich gut an veränderte Umstände an.",
        "dimension": "veraenderung",
        "gewichte":  {"Westlich":0.8,"Bazi":0.7,"Numerologie":0.9,
                      "Kabbalah":0.8,"Arabisch":0.7,"Hellenistisch":0.8,"Vedisch":0.8},
    },
    # ── SPIRITUALITÄT ─────────────────────────────────────────────────
    {
        "text":      "Spirituelle oder metaphysische Themen sind ein wichtiger Teil meines Lebens.",
        "dimension": "spiritualitaet",
        "gewichte":  {"Westlich":0.8,"Bazi":0.0,"Numerologie":0.9,
                      "Kabbalah":1.0,"Arabisch":0.0,"Hellenistisch":0.0,"Vedisch":1.0},
    },
    {
        "text":      "Ich vertraue oft meiner Intuition und inneren Stimme.",
        "dimension": "spiritualitaet",
        "gewichte":  {"Westlich":0.7,"Bazi":0.0,"Numerologie":0.8,
                      "Kabbalah":0.9,"Arabisch":0.0,"Hellenistisch":0.0,"Vedisch":0.8},
    },
]


# ══════════════════════════════════════════════════════════════════════
# RULE ENGINE (inline — keine externe Datei nötig)
# ══════════════════════════════════════════════════════════════════════

def neutral_vector() -> Dict[str, float]:
    return {d: 3.0 for d in DIMENSIONS}

def clamp(v: float) -> float:
    return round(min(5.0, max(1.0, v)), 2)

def blend(base: Dict, overlay: Dict, gewicht: float) -> Dict:
    result = {}
    for d in DIMENSIONS:
        b = base.get(d, 3.0)
        o = overlay.get(d, 3.0)
        result[d] = clamp(b * (1 - gewicht) + o * gewicht)
    return result

def extract_dims(data: dict, dim_feld: str) -> Dict[str, float]:
    if dim_feld == "direkt":
        return {d: float(data[d]) for d in DIMENSIONS if d in data}
    return {d: float(v) for d, v in data.get(dim_feld, {}).items() if d in DIMENSIONS}

def find_by_prefix(container: dict, n: int) -> dict:
    for key, val in container.items():
        if key == str(n) or key.startswith(str(n) + "_"):
            return val
    return {}

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

def day_stem_fn(birth_date: datetime) -> str:
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
    ys, yb = year_pillar(birth_date.year)
    ms, mb = month_pillar(birth_date.year, birth_date.month)
    ds_val  = day_stem_fn(birth_date)
    dm_el   = stem_to_element(ds_val)
    tys, tyb = year_pillar(target_date.year)
    tms, tmb = month_pillar(target_date.year, target_date.month)
    return {
        "sonnenzeichen":          sun_sign(birth_date),
        "geburts_year_stem":      ys,
        "geburts_year_branch":    yb,
        "day_master_stem":        ds_val,
        "day_master_element":     dm_el,
        "aktuelles_year_stem":    tys,
        "aktuelles_year_branch":  tyb,
        "aktuelles_year_element": stem_to_element(tys),
        "aktueller_month_branch": tmb,
        "lebensalter":            target_date.year - birth_date.year,
        "lebenspfadzahl":         life_path(birth_date),
        "geburts_stunde":         birth_date.hour,
        "geburts_tag_des_jahres": birth_date.timetuple().tm_yday,
        "transits":               estimate_transits(target_date),
    }

# ── Typ-Handler (alle inline) ──────────────────────────────────────────

def handle_nach_zeichen(q, rules, inputs):
    zeichen = inputs.get(q.get("eingabe","sonnenzeichen"),"")
    return extract_dims(rules.get(q["schluessel"],{}).get(zeichen,{}), q.get("dim_feld","dimensionen_vektor"))

def handle_nach_planet_herrscher(q, rules, inputs):
    zeichen = inputs.get(q.get("eingabe","sonnenzeichen"),"")
    herrscher = rules.get(q.get("herrscher_quelle","planet_rulers_dignities"),{})
    planeten  = rules.get(q["schluessel"],{})
    for planet, data in herrscher.items():
        if planet == "_intro": continue
        dom = data.get("domizil",[])
        if isinstance(dom,str): dom=[dom]
        if zeichen in dom:
            return extract_dims(planeten.get(planet,{}), q.get("dim_feld","dimensionen"))
    return {}

def handle_transit(q, rules, inputs):
    transit_rules = rules.get(q["schluessel"],{})
    basis   = neutral_vector()
    gewicht = q.get("gewicht",0.6)
    abnahme = q.get("gewicht_abnahme",0.1)
    minimum = q.get("gewicht_minimum",0.2)
    for planet, aspect in inputs.get("transits",[]):
        dims = extract_dims(transit_rules.get(planet,{}).get(aspect,{}), q.get("dim_feld","vektor"))
        if dims:
            basis   = blend(basis, dims, gewicht)
            gewicht = max(minimum, gewicht - abnahme)
    return basis

def handle_nach_day_master(q, rules, inputs):
    el = inputs.get("day_master_element","")
    return extract_dims(rules.get(q["schluessel"],{}).get(el,{}), q.get("dim_feld","direkt"))

def handle_nach_branch(q, rules, inputs):
    branch = inputs.get(q.get("eingabe",""),"")
    data   = rules.get(q["schluessel"],{}).get(branch,{})
    felder = q.get("dim_felder", DIMENSIONS)
    return {d: float(data[d]) for d in felder if d in data}

def handle_element_interaktion(q, rules, inputs):
    eingaben   = q.get("eingabe",[])
    el_aktuell = inputs.get(eingaben[0],"") if len(eingaben)>0 else ""
    el_dm      = inputs.get(eingaben[1],"") if len(eingaben)>1 else ""
    result = {}
    for typ, gruppe in rules.get(q["schluessel"],{}).items():
        w = q.get("gewicht_generierend",0.5) if typ=="generierend" else q.get("gewicht_kontrollierend",0.4)
        for key, data in gruppe.items():
            combo = key.replace("_","")
            if combo in [f"{el_aktuell}{el_dm}",f"{el_dm}{el_aktuell}"]:
                for d, v in extract_dims(data, q.get("dim_feld","vektor")).items():
                    result[d] = round((result.get(d,3.0)+v*w)/(1+w),2)
    return result

def handle_clash_combination(q, rules, inputs):
    eingaben = q.get("eingabe",[])
    pair = set([inputs.get(eingaben[0],"") if len(eingaben)>0 else "",
                inputs.get(eingaben[1],"") if len(eingaben)>1 else ""])
    result = {}
    for subkey in ("clashes_branches","combinations_branches"):
        for k, data in rules.get(q["schluessel"],{}).get(subkey,{}).items():
            if set(k.split("_")) == pair:
                for d, v in extract_dims(data, q.get("dim_feld","vektor")).items():
                    result[d] = round((result.get(d,3.0)+v)/2,2)
    return result

def handle_nach_lebenspfadzahl(q, rules, inputs):
    lpn  = inputs.get("lebenspfadzahl",1)
    cont = rules.get(q["schluessel"],{})
    prof = cont.get(str(lpn),{})
    if not prof and lpn in (11,22,33):
        prof = cont.get(str(sum(int(x) for x in str(lpn))),{})
    return extract_dims(prof, q.get("dim_feld","dimensionen_vektor"))

def handle_nach_sephira(q, rules, inputs):
    lpn = inputs.get("lebenspfadzahl",1)
    mm  = q.get("reduktion",{}).get("meisterzahlen_mapping",{})
    n   = mm.get(str(lpn), lpn)
    maximum = q.get("reduktion",{}).get("max",10)
    while n > maximum:
        n = sum(int(x) for x in str(n))
    if n == 0: n = maximum
    return extract_dims(find_by_prefix(rules.get(q["schluessel"],{}),n), q.get("dim_feld","dimensionen_vektor"))

def handle_firdaria(q, rules, inputs):
    alter    = inputs.get("lebensalter",0)
    position = alter % q.get("zyklus_jahre",75)
    laufzeit = 0
    for key, data in rules.get(q["schluessel"],{}).items():
        if key in ("beschreibung","quelle"): continue
        dauer = data.get("dauer_jahre",0)
        if laufzeit + dauer > position:
            return extract_dims(data, q.get("dim_feld","dimensionen_vektor"))
        laufzeit += dauer
    return {}

def handle_profektionen(q, rules, inputs):
    n   = (inputs.get("lebensalter",0) % q.get("zyklus",12)) + 1
    fmt = q.get("schluessel_format","haus_{n}").replace("{n}",str(n))
    cont = rules.get(q["schluessel"],{})
    return extract_dims(cont.get(fmt, cont.get(str(n),{})), q.get("dim_feld","dimensionen_vektor"))

def handle_sekt(q, rules, inputs):
    ist_tag = 6 <= inputs.get("geburts_stunde",12) <= 18
    cont = rules.get(q["schluessel"],{})
    feld = q.get("tag_schluessel" if ist_tag else "nacht_schluessel","")
    return {d: float(v) for d,v in cont.get(feld,{}).items() if d in DIMENSIONS}

def handle_mahadasha(q, rules, inputs):
    alter    = inputs.get("lebensalter",0)
    zyklus   = q.get("zyklus_jahre",120)
    basis    = q.get("geburt_offset_basis",1900)
    position = (alter + (datetime.now().year - basis)) % zyklus
    dauern   = rules.get(q.get("dauern_schluessel","mahadasha_dauern"),{})
    profile  = rules.get(q["schluessel"],{})
    fmt      = q.get("profil_format","{planet}_mahadasha")
    laufzeit = 0
    for planet, dauer in dauern.items():
        if not isinstance(dauer, (int, float)):
            continue  # Metadaten-Einträge wie _beschreibung überspringen
        if laufzeit + dauer > position:
            return extract_dims(profile.get(fmt.replace("{planet}",planet),{}), q.get("dim_feld","dimensionen_vektor"))
        laufzeit += dauer
    return {}

def handle_nakshatra(q, rules, inputs):
    idx  = int((inputs.get("geburts_tag_des_jahres",1)/365) * q.get("anzahl",27))
    keys = list(rules.get(q["schluessel"],{}).keys())
    if idx < len(keys):
        return extract_dims(rules.get(q["schluessel"],{})[keys[idx]], q.get("dim_feld","dimensionen_vektor"))
    return {}

def handle_direkter_vektor(q, rules, inputs):
    return extract_dims(rules.get(q["schluessel"],{}), q.get("dim_feld","dimensionen_vektor"))

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

def load_struktur(subfolder: str) -> Optional[dict]:
    path = os.path.join(BASE_DIR, subfolder, "Struktur.json")
    if not os.path.exists(path): return None
    with open(path, encoding="utf-8") as f: return json.load(f)

def load_rules(subfolder: str) -> dict:
    folder = os.path.join(BASE_DIR, subfolder)
    if not os.path.exists(folder): return {}
    merged = {}
    for filename in sorted(os.listdir(folder)):
        if filename.endswith(".json") and filename != "Struktur.json":
            try:
                with open(os.path.join(folder,filename), encoding="utf-8") as f:
                    merged.update(json.load(f))
            except: pass
    return merged

def compute_vector(struktur: dict, rules: dict, inputs: dict) -> Dict[str, float]:
    base, hat_werte = neutral_vector(), False
    for quelle in struktur.get("vektor_quellen",[]):
        handler = HANDLER.get(quelle.get("typ",""))
        if not handler: continue
        dims = handler(quelle, rules, inputs)
        if not dims: continue
        if quelle.get("nur_wenn_leer",False) and hat_werte: continue
        base = blend(base, dims, quelle.get("gewicht",0.5))
        hat_werte = True
    return {d: clamp(base[d]) for d in DIMENSIONS}

def load_all_systems(birth_date: datetime) -> Dict:
    """Lädt alle Systeme und berechnet natal Vektoren (T0 = heute)."""
    today   = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    inputs  = build_inputs(birth_date, today)
    vektoren = {}
    geladen  = []
    for folder in ["Westlich","Bazi","Numerologie","Kabbalah","Arabisch","Hellenistisch","Vedisch"]:
        struktur = load_struktur(folder)
        rules    = load_rules(folder)
        if struktur:
            kuerzel = SYSTEM_KUERZEL[folder]
            vektoren[folder] = compute_vector(struktur, rules, inputs)
            geladen.append(folder)
    return vektoren, geladen, inputs


# ══════════════════════════════════════════════════════════════════════
# RATING ENGINE (inline)
# ══════════════════════════════════════════════════════════════════════

def load_matrix() -> dict:
    path = os.path.join(BASE_DIR, "dimensionen_matrix.json")
    if not os.path.exists(path): return {}
    with open(path, encoding="utf-8") as f: return json.load(f)

def get_gewicht(matrix: dict, system: str, dimension: str, frage_gewichte: dict) -> float:
    """
    Kombiniert:
    1. Das Konfidenzgewicht des Systems aus dimensionen_matrix.json
    2. Das frage-spezifische Gewicht aus dem Fragebogen
    """
    konsens   = matrix.get("konsens_gewichtung",{})
    w_matrix  = konsens.get(dimension,{}).get(system, 1.0/len(SYSTEME))
    w_frage   = frage_gewichte.get(system, 1.0)
    return w_matrix * w_frage


class RatingSession:
    def __init__(self, methode: str = "quadratisch"):
        self.methode       = methode
        self.eintraege     = []
        self.kumul_fehler  = {s: 0.0 for s in SYSTEME}
        self.kumul_gewicht = {s: 0.0 for s in SYSTEME}

    def antwort(self, frage: dict, selbst: float, system_werte: Dict[str, float], matrix: dict):
        dim = frage["dimension"]
        eintrag = {
            "frage":  frage["text"],
            "dim":    dim,
            "selbst": selbst,
            "werte":  {},
            "fehler": {},
        }
        for system in SYSTEME:
            w = get_gewicht(matrix, system, dim, frage["gewichte"])
            wert = system_werte.get(system)
            if wert is None or w == 0.0:
                eintrag["werte"][system]  = None
                eintrag["fehler"][system] = None
                continue
            diff   = selbst - wert
            fehler = diff**2 if self.methode == "quadratisch" else abs(diff)
            self.kumul_fehler[system]  += fehler * w
            self.kumul_gewicht[system] += w
            eintrag["werte"][system]  = round(wert, 2)
            eintrag["fehler"][system] = round(fehler, 4)
        self.eintraege.append(eintrag)

    def rating(self) -> dict:
        normiert = {}
        for s in SYSTEME:
            if self.kumul_gewicht[s] > 0:
                normiert[s] = self.kumul_fehler[s] / self.kumul_gewicht[s]

        if not normiert:
            return {}

        min_f  = min(normiert.values())
        max_f  = max(normiert.values())
        spanne = max_f - min_f if max_f != min_f else 1.0

        result = {}
        for s in SYSTEME:
            if s not in normiert:
                result[s] = {"rating": None, "fehler": None, "rang": None}
            else:
                result[s] = {
                    "rating": round(100*(1-(normiert[s]-min_f)/spanne), 1),
                    "fehler": round(normiert[s], 4),
                    "rang":   None,
                }

        ranking = sorted([s for s in SYSTEME if result[s]["rating"] is not None],
                         key=lambda s: result[s]["rating"], reverse=True)
        for rang, s in enumerate(ranking, 1):
            result[s]["rang"] = rang

        return {"systeme": result, "ranking": ranking}


# ══════════════════════════════════════════════════════════════════════
# DARSTELLUNG
# ══════════════════════════════════════════════════════════════════════

TRENNLINIE   = "─" * 70
DOPPELLINIE  = "═" * 70
SYSTEM_FARBE = {   # ANSI-Farben für Terminal
    "Westlich":     "\033[94m",   # blau
    "Bazi":         "\033[91m",   # rot
    "Numerologie":  "\033[92m",   # grün
    "Kabbalah":     "\033[95m",   # magenta
    "Arabisch":     "\033[93m",   # gelb
    "Hellenistisch":"\033[96m",   # cyan
    "Vedisch":    "\033[97m",   # weiß
}
RESET = "\033[0m"
BOLD  = "\033[1m"

def balken(wert: float, selbst: float = None, breite: int = 20) -> str:
    """Visualisiert einen Wert 1-5 als Balken, markiert Selbsteinschätzung."""
    gefuellt = round((wert - 1) / 4 * breite)
    balken   = "█" * gefuellt + "░" * (breite - gefuellt)
    marker   = ""
    if selbst is not None:
        pos = round((selbst - 1) / 4 * breite)
        marker = f"  ◄ du: {selbst:.0f}"
    return f"[{balken}] {wert:.2f}{marker}"

def zeige_system_werte(system_werte: Dict[str, float], dimension: str,
                       selbst: float, geladen: List[str]):
    """Zeigt nach einer Frage die Systemwerte im Vergleich zur Selbsteinschätzung."""
    print(f"\n  {'System':<14} {'Vorhersage':>10}   Visualisierung")
    print(f"  {TRENNLINIE[:60]}")
    for system in geladen:
        wert = system_werte.get(system)
        if wert is None:
            print(f"  {system:<14} {'—':>10}   (keine Daten)")
            continue
        diff = selbst - wert
        pfeil = "▲" if diff < -0.3 else ("▼" if diff > 0.3 else "≈")
        farbe = SYSTEM_FARBE.get(system, "")
        print(f"  {farbe}{system:<14}{RESET} {wert:>8.2f}/5  {pfeil}  {balken(wert, breite=16)}")
    print(f"\n  Deine Einschätzung:  {selbst:.0f}/5  {balken(selbst, breite=16)}")

def zeige_zwischenstand(session: RatingSession):
    """Zeigt kumuliertes Rating nach jeder Frage."""
    ergebnis = session.rating()
    if not ergebnis: return
    print(f"\n  {BOLD}Zwischenstand:{RESET}")
    print(f"  {'System':<14} {'Rating':>8}  {'Balken'}")
    print(f"  {TRENNLINIE[:55]}")
    for s in ergebnis["ranking"]:
        d = ergebnis["systeme"][s]
        rang  = f"#{d['rang']}"
        farbe = SYSTEM_FARBE.get(s,"")
        bal   = "█" * int(d["rating"]/10) + "░" * (10 - int(d["rating"]/10))
        print(f"  {farbe}{s:<14}{RESET} {rang:>3}  {d['rating']:>5.1f}%  [{bal}]")

def zeige_gesamtauswertung(session: RatingSession, geladen: List[str],
                           birth_date: datetime, inputs: dict, methode: str):
    """Finale Auswertung mit vollständiger Tabelle und Interpretation."""
    ergebnis = session.rating()
    if not ergebnis:
        print("Keine Daten für Auswertung.")
        return

    print(f"\n{DOPPELLINIE}")
    print(f"{BOLD}  GESAMTAUSWERTUNG{RESET}")
    print(DOPPELLINIE)

    # Astrologische Meta-Infos
    sign_de = {
        "widder":"Widder ♈","stier":"Stier ♉","zwillinge":"Zwillinge ♊",
        "krebs":"Krebs ♋","loewe":"Löwe ♌","jungfrau":"Jungfrau ♍",
        "waage":"Waage ♎","skorpion":"Skorpion ♏","schuetze":"Schütze ♐",
        "steinbock":"Steinbock ♑","wassermann":"Wassermann ♒","fische":"Fische ♓"
    }
    tier_de = {
        "zi":"Ratte 🐀","chou":"Ochse 🐂","yin":"Tiger 🐯","mao":"Hase 🐰",
        "chen":"Drache 🐉","si":"Schlange 🐍","wu":"Pferd 🐴","wei":"Ziege 🐑",
        "shen":"Affe 🐒","you":"Hahn 🐓","xu":"Hund 🐕","hai":"Schwein 🐖"
    }
    print(f"\n  Geburtsdatum:    {birth_date.strftime('%d.%m.%Y %H:%M')}")
    print(f"  Sonnenzeichen:   {sign_de.get(inputs['sonnenzeichen'], inputs['sonnenzeichen'])}")
    print(f"  Chines. Tier:    {tier_de.get(inputs['geburts_year_branch'], inputs['geburts_year_branch'])}")
    print(f"  Day Master:      {inputs['day_master_stem'].capitalize()} ({inputs['day_master_element']})")
    print(f"  Lebenspfadzahl:  {inputs['lebenspfadzahl']}")
    print(f"  Methode:         {methode}")
    print(f"  Fragen gesamt:   {len(session.eintraege)}")

    # Ranking-Tabelle
    print(f"\n{TRENNLINIE}")
    print(f"  {'Rang':<5} {'System':<14} {'Rating':>8}  {'Norm. Fehler':>13}  Interpretation")
    print(TRENNLINIE)

    interpretationen = [
        "Trifft dich am besten 🏆",
        "Sehr gute Übereinstimmung ✨",
        "Gute Übereinstimmung",
        "Mittelmäßige Übereinstimmung",
        "Schwache Übereinstimmung",
        "Geringe Übereinstimmung",
        "Trifft am wenigsten zu",
    ]

    for s in ergebnis["ranking"]:
        d      = ergebnis["systeme"][s]
        rang   = d["rang"]
        farbe  = SYSTEM_FARBE.get(s,"")
        interp = interpretationen[min(rang-1, len(interpretationen)-1)]
        bal    = "█" * int(d["rating"]/10) + "░" * (10 - int(d["rating"]/10))
        print(f"  {rang:<5} {farbe}{s:<14}{RESET} {d['rating']:>7.1f}%  [{bal}]  {interp}")

    nicht_bewertet = [s for s in SYSTEME if ergebnis["systeme"][s]["rating"] is None]
    if nicht_bewertet:
        print(f"\n  ── Nicht bewertet (Dimensionen nicht abgedeckt) ──")
        for s in nicht_bewertet:
            farbe = SYSTEM_FARBE.get(s,"")
            print(f"       {farbe}{s:<14}{RESET}    —")

    # Detailliertes Protokoll
    print(f"\n{TRENNLINIE}")
    print(f"  DETAILPROTOKOLL")
    print(TRENNLINIE)
    for i, e in enumerate(session.eintraege, 1):
        print(f"\n  [{i}] {e['frage'][:65]}")
        print(f"       Dimension: {e['dim']:<14}  Selbsteinschätzung: {e['selbst']:.0f}/5")
        for s in geladen:
            w = e["werte"].get(s)
            f = e["fehler"].get(s)
            if w is None:
                continue
            diff = e["selbst"] - w
            pfeil = "▲" if diff < -0.3 else ("▼" if diff > 0.3 else "≈")
            print(f"       {SYSTEM_FARBE.get(s,'')}{s:<14}{RESET} {w:.2f}  Δ={diff:+.2f} {pfeil}  Fehler²={f:.4f}")

    print(f"\n{DOPPELLINIE}")
    print(f"  {BOLD}Bestes System für dein Profil: "
          f"{SYSTEM_FARBE.get(ergebnis['ranking'][0],'')}"
          f"{ergebnis['ranking'][0]}{RESET}{BOLD} "
          f"({ergebnis['systeme'][ergebnis['ranking'][0]]['rating']:.1f}%){RESET}")
    print(DOPPELLINIE)


# ══════════════════════════════════════════════════════════════════════
# EINGABE
# ══════════════════════════════════════════════════════════════════════

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Horoskop Assessment — welches System trifft dich am besten?"
    )
    parser.add_argument("--geburt",  type=str, default=None,
                        help="Geburtsdatum im Format YYYY-MM-DD (z.B. 1985-03-15)")
    parser.add_argument("--uhrzeit", type=str, default=None,
                        help="Geburtszeit im Format HH:MM (z.B. 14:30)")
    parser.add_argument("--methode", type=str, default="quadratisch",
                        choices=["quadratisch","absolut"],
                        help="Fehlermethode: quadratisch (default) oder absolut")
    return parser.parse_args()

def frage_geburtsdatum() -> datetime:
    """Interaktive Abfrage von Geburtsdatum und -uhrzeit."""
    print(f"\n{DOPPELLINIE}")
    print(f"{BOLD}  HOROSKOP ASSESSMENT{RESET}")
    print(f"  Welches Weissagungssystem trifft dich am besten?")
    print(DOPPELLINIE)
    print()

    while True:
        raw = input("  Geburtsdatum (TT.MM.JJJJ oder JJJJ-MM-TT): ").strip()
        try:
            if "." in raw:
                dt = datetime.strptime(raw, "%d.%m.%Y")
            else:
                dt = datetime.strptime(raw, "%Y-%m-%d")
            break
        except ValueError:
            print("  ✗ Ungültiges Format. Bitte nochmal.")

    while True:
        raw = input("  Geburtszeit (HH:MM, oder Enter für 12:00): ").strip()
        if not raw:
            dt = dt.replace(hour=12, minute=0)
            break
        try:
            t = datetime.strptime(raw, "%H:%M")
            dt = dt.replace(hour=t.hour, minute=t.minute)
            break
        except ValueError:
            print("  ✗ Ungültiges Format. Bitte nochmal (z.B. 14:30).")

    return dt

def frage_bewertung(nr: int, gesamt: int, frage_text: str) -> float:
    """Fragt den User nach einer Selbstbewertung 1-5."""
    print(f"\n{TRENNLINIE}")
    print(f"  Frage {nr}/{gesamt}")
    print(f"\n  {BOLD}{frage_text}{RESET}")
    print()
    print("  1 = trifft gar nicht zu")
    print("  2 = trifft wenig zu")
    print("  3 = teils/teils")
    print("  4 = trifft weitgehend zu")
    print("  5 = trifft voll zu")
    print()
    while True:
        raw = input("  Deine Einschätzung (1-5): ").strip()
        try:
            wert = float(raw.replace(",","."))
            if 1.0 <= wert <= 5.0:
                return wert
            print("  ✗ Bitte eine Zahl zwischen 1 und 5 eingeben.")
        except ValueError:
            print("  ✗ Ungültige Eingabe.")


# ══════════════════════════════════════════════════════════════════════
# HAUPTPROGRAMM
# ══════════════════════════════════════════════════════════════════════

def main():
    args = parse_args()

    # Geburtsdatum bestimmen
    if args.geburt:
        try:
            birth_date = datetime.strptime(args.geburt, "%Y-%m-%d")
            if args.uhrzeit:
                t = datetime.strptime(args.uhrzeit, "%H:%M")
                birth_date = birth_date.replace(hour=t.hour, minute=t.minute)
            else:
                birth_date = birth_date.replace(hour=12)
        except ValueError:
            print("✗ Ungültiges Datum/Uhrzeit-Format.")
            sys.exit(1)
    else:
        birth_date = frage_geburtsdatum()

    # Systeme laden
    print(f"\n  Lade Regelwerke...")
    vektoren, geladen, inputs = load_all_systems(birth_date)

    if not geladen:
        print("✗ Keine Systeme geladen. Sind die Unterordner mit Struktur.json vorhanden?")
        sys.exit(1)

    print(f"  ✓ {len(geladen)} Systeme geladen: {', '.join(geladen)}")

    # Matrix laden
    matrix = load_matrix()

    # Session starten
    session = RatingSession(methode=args.methode)

    print(f"\n{DOPPELLINIE}")
    print(f"{BOLD}  START DES ASSESSMENTS — {len(FRAGEN)} Fragen{RESET}")
    print(f"  Bewerte jede Aussage auf einer Skala von 1 (gar nicht) bis 5 (voll).")
    print(DOPPELLINIE)

    # Fragen stellen
    for nr, frage in enumerate(FRAGEN, 1):
        # Selbsteinschätzung abfragen
        selbst = frage_bewertung(nr, len(FRAGEN), frage["text"])

        # System-Werte für diese Dimension aus den Vektoren holen
        dim = frage["dimension"]
        system_werte = {s: vektoren[s][dim] for s in geladen if dim in vektoren.get(s,{})}

        # In Session eintragen
        session.antwort(frage, selbst, system_werte, matrix)

        # Sofortauswertung nach dieser Frage
        print(f"\n  ── Systemvergleich für '{dim}' ──")
        zeige_system_werte(system_werte, dim, selbst, geladen)

        # Zwischenstand (ab Frage 2)
        if nr >= 2:
            zeige_zwischenstand(session)

        if nr < len(FRAGEN):
            input(f"\n  [Enter für nächste Frage]")

    # Gesamtauswertung
    zeige_gesamtauswertung(session, geladen, birth_date, inputs, args.methode)


if __name__ == "__main__":
    main()
