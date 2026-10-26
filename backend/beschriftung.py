"""
Beschriftungen in den Bilddaten (visualPayloads) in der Sprache der Anfrage: Planeten, Tierkreiszeichen,
Rechenschritte der Numerologie, Haus der Profektion. Die Rechnung (chart.py, arabic_chart.py, ...) laeuft
ohne Sprache, auch fuer die Kontrollgruppen; danach setzt beschriften() die Namen aus
content/horoscope/<sprache>/beschriftungen_v1.json ein (Quelle docs/Textbausteine/beschriftungen/).
Die Notizen der Kabbalah kommen aus den Regeldateien und werden in build_kabbalah_chart uebersetzt.
"""

from __future__ import annotations

from typing import Any, Dict

import sprache
from bildtexte import PLANET_DE

# Reihenfolge der Rechenschritte in numerology_chart.py
SCHRITTE = ["tag", "monat", "jahr", "quersumme_tag", "quersumme_monat", "quersumme_jahr", "summe", "lebenspfad"]


def _planet(eintrag: Dict[str, Any], t: Dict[str, Dict[str, str]], feld: str = "planet") -> None:
    if eintrag and eintrag.get(feld) in t["planeten"]:
        eintrag["label"] = t["planeten"][eintrag[feld]]


def beschriften(bilder: Dict[str, Any], sp: str) -> None:
    """Setzt die Beschriftungen in `bilder` (System -> Bilddaten) auf die Sprache `sp`."""
    t = sprache.inhalt("beschriftungen", sp)["gruppen"]
    w = bilder.get("Westlich")
    if w:
        for zeichen in (w.get("zodiac") or {}).get("signs", []):
            zeichen["label"] = t["tierkreis"].get(zeichen.get("id"), zeichen.get("label"))
        for p in w.get("planets", []):
            if PLANET_DE.get(p.get("id")) in t["planeten"]:
                p["label"] = t["planeten"][PLANET_DE[p["id"]]]
    a = bilder.get("Arabisch")
    if a:
        for p in [*a.get("periods", []), a.get("currentPeriod"), a.get("nextPeriod")]:
            _planet(p, t)
    v = bilder.get("Vedisch")
    if v:
        for p in [*v.get("periods", []), v.get("activeMahadasha")]:
            _planet(p, t)
    n = bilder.get("Numerologie")
    if n:
        for schritt, schluessel in zip(n.get("reductionSteps", []), SCHRITTE):
            schritt["label"] = t["numerologie_schritte"][schluessel]
    h = bilder.get("Hellenistisch")
    if h and h.get("activeHouse") is not None:
        h["activeHouseLabel"] = t["hellenistisch"]["haus"].replace("{nr}", str(h["activeHouse"]))
