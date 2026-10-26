"""
Sprache der Ausgaben: Texte, Bildtexte, Fragen, Beschriftungen in den Bilddaten.

Die App waehlt ihre Sprache aus den Spracheinstellungen des Geraets und schickt sie in jeder Anfrage als
Accept-Language mit; ohne Angabe (oder in einer Sprache, die es nicht gibt) gilt Deutsch. Die Liste der
Sprachen muss mit der in der App (frontend/src/sprache/index.js) uebereinstimmen.

Ablage je Sprache:
- eigene Texte: content/horoscope/<sprache>/<name>_v1.json (Quelle docs/Textbausteine/...)
- Fragen: content/fragen/<sprache>/<datei>.json, gleiche Gestalt wie backend/fragen*.json, nur die Texte
- Regelwerke: content/regeln/<sprache>/<System>/<datei>.json, gleiche Gestalt wie die Regeldatei, aber nur die
  Textfelder, die Spieler zu sehen bekommen (Liste: SICHTBARE_REGELTEXTE). Die Schluessel bleiben die der
  deutschen Datei (auch "text_de"), damit die Uebersetzung genau ueber das Original passt. Zahlen kommen immer
  aus der Regeldatei selbst.

Was in einer Sprache fehlt, kommt aus dem Deutschen: Eine halb fertige Uebersetzung zeigt also deutsche Saetze
statt Luecken.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

from rule_engine import load_rules

SPRACHEN = ("de",)
GRUND = "de"

BACKEND = Path(__file__).resolve().parent
INHALT = BACKEND.parent / "content"

# Felder der Regeldateien, die in Bildtexten, Ausblick oder Paar woertlich bei Spielern ankommen (siehe
# bildtexte.py, ausblick.py, paar.py). Nur diese muessen uebersetzt werden.
SICHTBARE_REGELTEXTE = {
    "Westlich/timing_rules.json": ["planet_planet_aspekte.kombinationen.*.*.text_de"],
    "Bazi/bazi_rules.json": ["heavenly_stems.*.qualitaet", "day_master_profiles.*.staerken"],
    "Bazi/bazi_rules_complete.json": [
        "clash_und_combination_vollstaendig.sechs_clashes.*.text_de",
        "clash_und_combination_vollstaendig.liu_he_kombinationen.*.text_de",
        "clash_und_combination_vollstaendig.liu_hai_harms.*.text_de",
        "luck_pillars.stem_luck_pillars.*.text_de",
        "luck_pillars.branch_luck_pillars.*.text_de",
    ],
    "Hellenistisch/hell_zeitherren.json": [
        "jaehrliche_profektionen.profektionshaus_themen.*.thema",
        "jaehrliche_profektionen.jahresherrscher.*.wirkung",
    ],
    "Vedisch/jyotish_dasha.json": [
        "mahadasha_profile.*.hauptthemen",
        "antardasha_matrix.*.*.beschreibung",
    ],
    "Vedisch/jyotish_nakshatras.json": [
        "nakshatras.*.name_deutsch",
        "nakshatras.*.hauptqualitaeten",
    ],
    "Arabisch/arabisch_firdaria.json": [
        "haupt_firdaria.*.beschreibung",
        "unter_firdaria.qualitaets_matrix.kombinationen_tag_horoskop.*.*.beschreibung",
    ],
    "Numerologie/numerologie_lebenspfad.json": [
        "lebenspfad_profile.*.name",
        "lebenspfad_profile.*.kernthema",
        "meisterzahlen.*.name",
        "meisterzahlen.*.kernthema",
        "lebenspfad_kompatibilitaet.matrix.*.erklaerung",
    ],
    "Numerologie/numerologie_zyklen.json": [
        "persoenliches_jahr_profile.*.schluesselthema",
        "persoenliches_jahr_profile.*.beschreibung",
        "persoenlicher_monat_matrix_81.matrix.*.*",
        "pinnacle_profile.*.thema",
        "pinnacle_profile.*.beschreibung",
    ],
    "Kabbalah/kabbalah_sephiroth.json": ["sephiroth.*.name_deutsch", "sephiroth.*.tugend"],
    "Kabbalah/kabbalah_pfade.json": ["pfade.*.buchstabe_bedeutung", "pfade.*.tarot"],
}

# Texte der Fragenkataloge, die Spieler sehen (Muster wie oben; "*" steht auch fuer jeden Listeneintrag)
SICHTBARE_FRAGENTEXTE = {
    "fragen.json": ["fragen.*.text"],
    "fragen_rueckblick.json": ["_meta.fenster_einleitung.*", "gewertet.*.text", "auffaellig.*.*.text",
                               "zeitpunkt.*.text"],
    "fragen_beziehung.json": ["fragen.*.text"],
}


def auszug(daten: Any, muster: list) -> Any:
    """Nur die Felder von `daten`, die auf eines der Muster passen ("a.*.b"), in derselben Gestalt; Listen
    behalten ihre Laenge (nicht betroffene Eintraege werden leere Woerterbuecher), damit die Uebersetzung
    Eintrag fuer Eintrag ueber dem Original liegt."""
    def nimm(o: Any, teile: list) -> Any:
        if not teile:
            return o if isinstance(o, str) else None
        kopf, rest = teile[0], teile[1:]
        if isinstance(o, list):
            if kopf != "*":
                return None
            werte = [nimm(v, rest) for v in o]
            return [w if w is not None else {} for w in werte] if any(w is not None for w in werte) else None
        if not isinstance(o, dict):
            return None
        schluessel = list(o) if kopf == "*" else [kopf] if kopf in o else []
        erg = {k: w for k in schluessel if (w := nimm(o[k], rest)) is not None}
        return erg or None

    zusammen: Any = None
    for m in muster:
        teil = nimm(daten, m.split("."))
        if teil is not None:
            zusammen = teil if zusammen is None else ueberlagert(zusammen, teil)
    return zusammen


def waehle(angabe: Optional[str]) -> str:
    """Sprache aus einer Angabe wie 'en-US,en;q=0.9,de;q=0.8' (Accept-Language) oder 'en': die erste, die es
    gibt, sonst Deutsch. Die Reihenfolge der Angabe zaehlt, nicht die q-Werte (Geraete schicken sie geordnet)."""
    for teil in (angabe or "").split(","):
        kuerzel = teil.split(";")[0].strip().lower().split("-")[0]
        if kuerzel in SPRACHEN:
            return kuerzel
    return GRUND


def ueberlagert(grund: Any, oben: Any) -> Any:
    """`oben` ueber `grund` gelegt: Woerterbuecher feldweise, Listen Eintrag fuer Eintrag, sonst gilt `oben`."""
    if isinstance(grund, dict) and isinstance(oben, dict):
        return {k: ueberlagert(grund[k], oben[k]) if k in grund and k in oben else oben.get(k, grund.get(k))
                for k in {**grund, **oben}}
    if isinstance(grund, list) and isinstance(oben, list):
        return [ueberlagert(g, o) for g, o in zip(grund, oben)] + grund[len(oben):]
    return grund if oben is None else oben


def _json(pfad: Path) -> Any:
    return json.loads(pfad.read_text(encoding="utf-8")) if pfad.exists() else None


def _stand(*pfade: Path) -> tuple:
    """Aenderungszeiten, damit geaenderte Dateien ohne Neustart neu gelesen werden."""
    return tuple(p.stat().st_mtime_ns if p.exists() else 0 for p in pfade)


@lru_cache(maxsize=64)
def _ueberlagerte_datei(grund: Path, oben: Path, _stand: tuple) -> Any:
    daten = _json(grund)
    uebersetzt = _json(oben)
    return daten if uebersetzt is None else ueberlagert(daten, uebersetzt)


def inhalt(name: str, sprache: str) -> Dict[str, Any]:
    """Eigene Texte (content/horoscope/<sprache>/<name>_v1.json), Fehlendes aus dem Deutschen."""
    grund = INHALT / "horoscope" / GRUND / f"{name}_v1.json"
    oben = INHALT / "horoscope" / sprache / f"{name}_v1.json"
    return _ueberlagerte_datei(grund, oben, _stand(grund, oben))


def fragen(datei: str, sprache: str) -> Dict[str, Any]:
    """Fragenkatalog backend/<datei> mit den Texten der Sprache."""
    grund = BACKEND / datei
    oben = INHALT / "fragen" / sprache / datei
    return _ueberlagerte_datei(grund, oben, _stand(grund, oben))


def regeldatei(datei: str, sprache: str) -> Dict[str, Any]:
    """Eine Regeldatei (Pfad relativ zu backend/) mit den uebersetzten Texten der Sprache."""
    grund = BACKEND / datei
    oben = INHALT / "regeln" / sprache / datei
    return _ueberlagerte_datei(grund, oben, _stand(grund, oben))


def regeln(system: str, sprache: str) -> Dict[str, Any]:
    """Alle Regeln eines Systems wie load_rules, mit den uebersetzten Texten. Fuer Rechnungen (Vektoren,
    Kontrollgruppen) bleibt load_rules zustaendig: dort zaehlen nur die Zahlen."""
    if sprache == GRUND:
        return load_rules(system)
    ordner = INHALT / "regeln" / sprache / system
    zusammen = dict(load_rules(system))
    for datei in sorted(ordner.glob("*.json")) if ordner.exists() else []:
        uebersetzt = _json(datei) or {}
        for k, v in uebersetzt.items():
            if k in zusammen:
                zusammen[k] = ueberlagert(zusammen[k], v)
    return zusammen
