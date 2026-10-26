#!/usr/bin/env python3
"""
Prueft, ob alle Texte, die der Server an Spieler schickt, aus den Sprachdateien kommen (siehe backend/sprache.py).

Dazu wird eine Scheinsprache "xx" angelegt (in einem Zwischenordner, das Repository bleibt unberuehrt): jeder
Text der deutschen Sprachdateien, Fragen und sichtbaren Regelfelder wird zu ⟦Text⟧. Dann werden alle
Endpunkte mit Accept-Language: xx abgefragt. Was danach ausserhalb von ⟦…⟧ noch nach Wort aussieht, steht fest
im Code und waere in einer anderen Sprache deutsch geblieben.

Ausfuehren: python3 tools/sprachpruefung.py
"""
from __future__ import annotations

import json
import os
import re
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
os.chdir(ROOT / "backend")

import sprache  # noqa: E402

ALLE = ["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Vedisch"]
PERSONEN = [
    dict(geburtsdatum="1985-04-12", uhrzeit="14:00", latitude=48.2, longitude=16.37, zeitzone="Europe/Vienna",
         geschlecht="weiblich"),
    dict(geburtsdatum="1962-11-03", uhrzeit="05:45", latitude=52.5, longitude=13.4, zeitzone="Europe/Berlin",
         geschlecht="maennlich"),
    dict(geburtsdatum="2001-07-29", uhrzeit="23:10", latitude=40.7, longitude=-74.0, zeitzone="America/New_York"),
    dict(geburtsdatum="1974-01-17", uhrzeit="12:00"),
]
# Felder mit Kennungen, Namen und Zeichen, die in jeder Sprache gleich bleiben
UNVERAENDERT = {"chartType", "id", "signId", "planet", "type", "a", "b", "stem", "branch", "element", "system",
                "dimension", "richtung", "fenster", "art", "aspekt", "ziel", "md", "ad", "haupt", "unter", "bezug",
                "letter", "letterName", "name", "symbol", "katalog_version", "stichtag", "von", "bis", "exakt",
                "stemElement", "branchElement", "strength", "yearLord", "zeitzone", "code", "tz", "land",
                "geschlecht", "herrscher", "zweig", "stamm", "beziehung", "ehepalast", "jahrestiere", "firdaria",
                "kutas", "stark", "schwach", "system_uebersicht", "countryCode"}
# Kabbalah-Notizen: kabbalah_chart.py schneidet sie aus laengeren Regeltexten (vor "—", ohne Klammer) und
# verliert dabei die Markierung; sie kommen aber aus sprache.regeln (siehe build_kabbalah_chart)
AUS_REGELTEXT_GESCHNITTEN = {"/notes/pfad/bedeutung", "/notes/pfad/tarot", "/notes/sephira/deutsch"}


def schein(o):
    if isinstance(o, str):
        return f"⟦{o}⟧" if o.strip() else o
    if isinstance(o, dict):
        return {k: schein(v) for k, v in o.items()}
    if isinstance(o, list):
        return [schein(v) for v in o]
    return o


def anlegen(ziel: Path) -> None:
    (ziel / "horoscope").mkdir(parents=True)
    (ziel / "horoscope" / "de").symlink_to(sprache.INHALT / "horoscope" / "de")
    for datei in (sprache.INHALT / "horoscope" / "de").glob("*.json"):
        daten = json.loads(datei.read_text(encoding="utf-8"))
        aus = (ziel / "horoscope" / "xx" / datei.name)
        aus.parent.mkdir(parents=True, exist_ok=True)
        aus.write_text(json.dumps(schein(daten), ensure_ascii=False), encoding="utf-8")
    for art, tabelle in (("regeln", sprache.SICHTBARE_REGELTEXTE), ("fragen", sprache.SICHTBARE_FRAGENTEXTE)):
        for datei, muster in tabelle.items():
            daten = json.loads((sprache.BACKEND / datei).read_text(encoding="utf-8"))
            aus = ziel / art / "xx" / datei
            aus.parent.mkdir(parents=True, exist_ok=True)
            aus.write_text(json.dumps(schein(sprache.auszug(daten, muster)), ensure_ascii=False), encoding="utf-8")


def reste(o, pfad: str, funde: dict) -> None:
    if any(pfad.endswith(g) for g in AUS_REGELTEXT_GESCHNITTEN):
        return
    if isinstance(o, dict):
        for k, v in o.items():
            # Rechengroessen in inputs sind Kennungen; angezeigt werden nur die Bilddaten
            # (Notizen in _meta der Fragen sind fuer Entwickler, angezeigt wird nur fenster_einleitung)
            if (k not in UNVERAENDERT and not (pfad.endswith("/inputs") and k != "visualPayloads")
                    and not (pfad.endswith("/_meta") and k != "fenster_einleitung")):
                reste(v, f"{pfad}/{k}", funde)
    elif isinstance(o, list):
        for v in o:
            reste(v, f"{pfad}[]", funde)
    elif isinstance(o, str):
        draussen = o
        while (kuerzer := re.sub(r"⟦[^⟦⟧]*⟧", " ", draussen)) != draussen:
            draussen = kuerzer
        draussen = re.sub(r"[\d.,:;()\-–—/+%°'\"„“…!?]", " ", draussen)
        woerter = [w for w in draussen.split() if re.search(r"[A-Za-zÄÖÜäöüß]{2,}", w)]
        if woerter:
            funde.setdefault(re.sub(r"\d+", "#", pfad), (o, woerter))


def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        anlegen(Path(tmp))
        sprache.INHALT = Path(tmp)
        sprache.SPRACHEN = sprache.SPRACHEN + ("xx",)
        from fastapi.testclient import TestClient
        import main as server

        c = TestClient(server.app)
        kopf = {"Accept-Language": "xx"}
        antworten = {}
        for i, p in enumerate(PERSONEN):
            q = dict(p, systeme=ALLE, session_id="fest")
            antworten[f"vektor{i}"] = c.post("/vektor", json=q, headers=kopf).json()
            antworten[f"heute{i}"] = c.post("/horoscope/heute", json=q, headers=kopf).json()
            antworten[f"ausblick{i}"] = c.post("/horoscope/ausblick", json=q, headers=kopf).json()
            b = PERSONEN[(i + 1) % len(PERSONEN)]
            pq = {f"{k}_a": v for k, v in p.items()} | {f"{k}_b": v for k, v in b.items()} | {"systeme": ALLE}
            antworten[f"paar{i}"] = c.post("/horoscope/paar", json=pq, headers=kopf).json()
        for pfad in ["/fragen", "/fragen/rueckblick", "/fragen/beziehung", "/horoscope/texts",
                     "/horoscope/erklaerungen"]:
            antworten[pfad] = c.get(pfad, headers=kopf).json()
        funde: dict = {}
        for name, a in antworten.items():
            reste(a, re.sub(r"\d+$", "", name), funde)
        for pfad, (text, woerter) in sorted(funde.items()):
            print(f"{pfad}\n    {' '.join(woerter)[:100]}\n    {text[:160]}")
        print(f"\n{len(funde)} Stellen mit festem Text" if funde else "Alle Texte kommen aus den Sprachdateien.")


if __name__ == "__main__":
    main()
