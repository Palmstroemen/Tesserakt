#!/usr/bin/env python3
"""
Erzeugt content/horoscope/de/erklaerungen_v1.json aus docs/Textbausteine/erklaerungen/*.md.

Die Markdown-Dateien sind die Quelle (dort werden die Texte bearbeitet), das JSON wird
vom Backend unter /horoscope/erklaerungen ausgeliefert. Reihenfolge = Dateiname (01_, 02_, ...).

Konventionen pro Datei:
  # Titel {#thema_id}
  Kurz: Ein bis zwei Saetze (Pflicht; fuer Tooltips, Zwischenstaende, Teaser).
  ## Abschnittstitel {#abschnitt_id}
  Absaetze durch Leerzeilen getrennt, Listen mit "- ". Inline erlaubt: **fett**.

Ausfuehren: python3 tools/md_to_erklaerungen.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "docs" / "Textbausteine" / "erklaerungen"
OUT_FILE = ROOT / "content" / "horoscope" / "de" / "erklaerungen_v1.json"

HEADING = re.compile(r"^(#{1,2})\s+(.+?)\s*\{#([a-z0-9_]+)\}\s*$")


def parse_bloecke(lines: list[str]) -> list[dict]:
    """Absaetze (durch Leerzeilen getrennt) und Listen ("- ") als Bloecke."""
    bloecke: list[dict] = []
    absatz: list[str] = []
    liste: list[str] = []

    def flush() -> None:
        if absatz:
            bloecke.append({"typ": "absatz", "text": " ".join(absatz)})
            absatz.clear()
        if liste:
            bloecke.append({"typ": "liste", "punkte": list(liste)})
            liste.clear()

    for raw in lines:
        line = raw.strip()
        if not line:
            flush()
        elif line.startswith("- "):
            if absatz:
                flush()
            liste.append(line[2:].strip())
        elif liste and raw.startswith("  "):
            liste[-1] += " " + line  # Fortsetzungszeile eines Listenpunkts
        else:
            if liste:
                flush()
            absatz.append(line)
    flush()
    return bloecke


def parse_thema(path: Path) -> dict:
    lines = path.read_text(encoding="utf-8").splitlines()
    thema: dict = {"id": None, "titel": None, "kurz": None, "einleitung": [], "abschnitte": []}
    aktuell: list[str] = []
    abschnitt: dict | None = None

    def abschliessen() -> None:
        bloecke = parse_bloecke(aktuell)
        if abschnitt is None:
            thema["einleitung"] = bloecke
        else:
            abschnitt["bloecke"] = bloecke
            thema["abschnitte"].append(abschnitt)
        aktuell.clear()

    for line in lines:
        m = HEADING.match(line)
        if m and m.group(1) == "#":
            thema["titel"], thema["id"] = m.group(2), m.group(3)
        elif m and m.group(1) == "##":
            abschliessen()
            abschnitt = {"id": m.group(3), "titel": m.group(2), "bloecke": []}
        elif line.startswith("#"):
            raise ValueError(f"{path.name}: Ueberschrift ohne {{#id}}: {line!r}")
        elif line.startswith("Kurz:") and abschnitt is None:
            thema["kurz"] = line[len("Kurz:"):].strip()
        else:
            aktuell.append(line)
    abschliessen()

    if not thema["id"] or not thema["kurz"]:
        raise ValueError(f"{path.name}: '# Titel {{#id}}' und 'Kurz:' sind Pflicht")
    ids = [a["id"] for a in thema["abschnitte"]]
    if len(ids) != len(set(ids)):
        raise ValueError(f"{path.name}: doppelte Abschnitts-IDs {ids}")
    return thema


def main() -> None:
    dateien = sorted(SRC_DIR.glob("*.md"))
    if not dateien:
        sys.exit(f"Keine Markdown-Dateien in {SRC_DIR}")
    themen = [parse_thema(p) for p in dateien]
    ids = [t["id"] for t in themen]
    if len(ids) != len(set(ids)):
        sys.exit(f"Doppelte Themen-IDs: {ids}")

    out = {
        "schemaVersion": "1.0",
        "locale": "de",
        "textVersion": "v1",
        "_meta": {
            "quelle": "docs/Textbausteine/erklaerungen/*.md (nicht dieses JSON bearbeiten)",
            "erzeugt_mit": "tools/md_to_erklaerungen.py",
            "inline": "**fett** in Texten erlaubt",
        },
        "themen": themen,
    }
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Geschrieben: {OUT_FILE.relative_to(ROOT)} ({len(themen)} Themen: {', '.join(ids)})")


if __name__ == "__main__":
    main()
