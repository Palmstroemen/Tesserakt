#!/usr/bin/env python3
"""
Legt fuer eine neue Sprache die Vorlagen der Server-Uebersetzungen an: je Regeldatei und Fragenkatalog eine
Datei mit genau den sichtbaren Textfeldern (backend/sprache.py: SICHTBARE_REGELTEXTE, SICHTBARE_FRAGENTEXTE),
noch mit dem deutschen Text. Die Uebersetzer ersetzen die Texte, Schluessel und Gestalt bleiben.

Vorhandene Dateien werden nicht ueberschrieben. Mit --pruefen statt anzulegen: welche Felder noch deutsch
sind (gleich dem Original) und welche Felder es im Original nicht (mehr) gibt.

Ausfuehren: python3 tools/uebersetzung_vorlage.py en [--pruefen]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import sprache  # noqa: E402


def blaetter(o, pfad=""):
    if isinstance(o, dict):
        for k, v in o.items():
            yield from blaetter(v, f"{pfad}.{k}" if pfad else k)
    elif isinstance(o, list):
        for i, v in enumerate(o):
            yield from blaetter(v, f"{pfad}[{i}]")
    elif isinstance(o, str):
        yield pfad, o


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1].startswith("--"):
        sys.exit(__doc__)
    ziel_sprache, pruefen = sys.argv[1], "--pruefen" in sys.argv
    offen = gesamt = 0
    for art, tabelle in (("regeln", sprache.SICHTBARE_REGELTEXTE), ("fragen", sprache.SICHTBARE_FRAGENTEXTE)):
        for datei, muster in tabelle.items():
            vorlage = sprache.auszug(json.loads((sprache.BACKEND / datei).read_text(encoding="utf-8")), muster)
            aus = ROOT / "content" / art / ziel_sprache / datei
            if not pruefen:
                if aus.exists():
                    print(f"vorhanden: {aus.relative_to(ROOT)}")
                    continue
                aus.parent.mkdir(parents=True, exist_ok=True)
                aus.write_text(json.dumps(vorlage, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
                print(f"angelegt:  {aus.relative_to(ROOT)}")
                continue
            original = dict(blaetter(vorlage))
            uebersetzt = dict(blaetter(json.loads(aus.read_text(encoding="utf-8")))) if aus.exists() else {}
            deutsch = [p for p, t in original.items() if uebersetzt.get(p, t) == t]
            fremd = [p for p in uebersetzt if p not in original]
            offen += len(deutsch)
            gesamt += len(original)
            print(f"{datei}: {len(original) - len(deutsch)}/{len(original)} uebersetzt"
                  + (f", {len(fremd)} Felder ohne Original: {fremd[:3]}" if fremd else ""))
    if pruefen:
        print(f"\nnoch deutsch: {offen} von {gesamt} Feldern")


if __name__ == "__main__":
    main()
