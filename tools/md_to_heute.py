#!/usr/bin/env python3
"""
Erzeugt content/horoscope/de/heute_v1.json aus docs/Textbausteine/heute/heute_v1.md.

Die Markdown-Datei ist die Quelle (dort werden die Texte bearbeitet). Format:
  ## Titel {#gruppe}
  - schluessel: Text (Platzhalter in geschweiften Klammern, z. B. {dm}, {Planet}, {thema})

Ausfuehren: python3 tools/md_to_heute.py [--sprache en]
Andere Textsammlung im selben Format: python3 tools/md_to_heute.py paar  (docs/Textbausteine/paar/paar_v1.md
-> content/horoscope/de/paar_v1.json)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
# Sprache: --sprache en liest die Uebersetzung aus docs/Textbausteine/en/... und schreibt content/horoscope/en/
SPRACHE = sys.argv[sys.argv.index("--sprache") + 1] if "--sprache" in sys.argv else "de"
QUELLE = ROOT / "docs" / "Textbausteine" / ("" if SPRACHE == "de" else SPRACHE)
NAME = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "heute"
SRC = QUELLE / NAME / f"{NAME}_v1.md"
OUT_FILE = ROOT / "content" / "horoscope" / SPRACHE / f"{NAME}_v1.json"

GRUPPE = re.compile(r"^##\s+.+?\{#([a-z0-9_]+)\}\s*$")
EINTRAG = re.compile(r"^-\s+([a-z0-9_]+):\s+(.+)$")


def main() -> None:
    gruppen: dict[str, dict[str, str]] = {}
    aktuell = None
    for nr, line in enumerate(SRC.read_text(encoding="utf-8").splitlines(), start=1):
        if m := GRUPPE.match(line):
            aktuell = m.group(1)
            if aktuell in gruppen:
                sys.exit(f"Zeile {nr}: Gruppe {aktuell} doppelt")
            gruppen[aktuell] = {}
        elif m := EINTRAG.match(line):
            if aktuell is None:
                sys.exit(f"Zeile {nr}: Eintrag ausserhalb einer Gruppe")
            gruppen[aktuell][m.group(1)] = m.group(2).strip()
    out = {
        "schemaVersion": "1.0",
        "locale": SPRACHE,
        "textVersion": "v1",
        "_meta": {"quelle": f"{SRC.relative_to(ROOT)} (nicht dieses JSON bearbeiten)",
                  "erzeugt_mit": "tools/md_to_heute.py"},
        "gruppen": gruppen,
    }
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Geschrieben: {OUT_FILE.relative_to(ROOT)} ({len(gruppen)} Gruppen, "
          f"{sum(len(g) for g in gruppen.values())} Bausteine)")


if __name__ == "__main__":
    main()
