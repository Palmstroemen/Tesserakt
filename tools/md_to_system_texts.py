#!/usr/bin/env python3
"""Convert docs/Textbausteine/systeme/*.md to content/horoscope/de/system_texts_v1.json"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "docs" / "Textbausteine" / "systeme"
OUT_FILE = ROOT / "content" / "horoscope" / "de" / "system_texts_v1.json"

SECTION_TO_KEY = {
    "Liebe": "liebe",
    "Beruf": "beruf",
    "Finanzen": "finanzen",
    "Gesundheit": "gesundheit",
    "Soziales": "soziales",
    "Kreativitaet": "kreativitaet",
    "Veraenderung": "veraenderung",
    "Spiritualitaet": "spiritualitaet",
    "Paracelsus-Signaturen": "paracelsus_outro",
}

FILE_TO_SYSTEM = {
    "westlich_v1.md": "Westlich",
    "bazi_v1.md": "Bazi",
    "numerologie_v1.md": "Numerologie",
    "kabbalah_v1.md": "Kabbalah",
    "arabisch_v1.md": "Arabisch",
    "hellenistisch_v1.md": "Hellenistisch",
    "vedisch_v1.md": "Vedisch",
}


def extract_tags(text: str) -> list[str]:
    return re.findall(r"\[TAG\]\s*(\S+)", text)


def parse_system_md(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    tags = extract_tags(raw)
    # Split by ## Section (keep section headers in chunks)
    chunks = re.split(r"\n## ", raw, maxsplit=0)
    # First chunk: title line + intro (until we would hit ## Liebe)
    first = chunks[0]
    lines = first.split("\n")
    # Drop first line (# Systemname v1)
    intro_lines = []
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        if line == "Liebe":  # would be ## Liebe in original
            break
        intro_lines.append(line)
    intro = "\n\n".join(intro_lines).strip()

    sections = {}
    for i, chunk in enumerate(chunks[1:], start=1):
        part = chunk.strip()
        if not part:
            continue
        first_line = part.split("\n")[0].strip()
        rest = "\n".join(part.split("\n")[1:]).strip()
        if first_line in SECTION_TO_KEY:
            key = SECTION_TO_KEY[first_line]
            if key == "paracelsus_outro":
                sections["paracelsus_outro"] = part  # keep full section with header
            else:
                sections[key] = part

    dimensions = {k: sections[k] for k in SECTION_TO_KEY.values() if k != "paracelsus_outro" and k in sections}
    paracelsus_outro = sections.get("paracelsus_outro", "")

    return {
        "intro": intro,
        "dimensions": dimensions,
        "paracelsus_outro": paracelsus_outro,
        "tags": tags,
    }


def main():
    systems = {}
    for filename, system_name in FILE_TO_SYSTEM.items():
        path = SRC_DIR / filename
        if not path.exists():
            continue
        systems[system_name] = parse_system_md(path)

    out = {
        "schemaVersion": "1.0",
        "locale": "de",
        "textVersion": "v1",
        "systems": systems,
    }
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
