#!/usr/bin/env python3
"""
Verteilung der Regelwerte pro System und Dimension.

Geht alle Regel-JSONs pro System durch, sammelt jeden Dimensionswert (Rohwert 0..1
oder 1..5) und zählt, wie oft 0, 0.25, 0.5, 0.75, 1.0 (bzw. äquivalent) vorkommen.
Ausgabe: Tabelle in der Konsole und CSV (tools/output/rule_value_distribution.csv).

So siehst du Schieflagen (z.B. Bazi finanzen fast nur hoch, Numerologie viele 1.0).
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
OUTPUT_DIR = ROOT / "tools" / "output"

DIMENSIONS = [
    "liebe", "beruf", "finanzen", "gesundheit",
    "soziales", "kreativitaet", "veraenderung", "spiritualitaet",
]

# Buckets für 0-1 Skala; 1-5 wird auf 0-1 gemappt: (v-1)/4
BUCKETS = (0.0, 0.25, 0.5, 0.75, 1.0)


def _raw_to_bucket(v: float) -> str:
    """Mappt Rohwert 0..1 oder 1..5 auf Bucket-Label (0, 0.25, 0.5, 0.75, 1.0 oder 'other')."""
    try:
        x = float(v)
    except (TypeError, ValueError):
        return "other"
    if 0 <= x <= 1:
        norm = x
    elif 1 < x <= 5:
        norm = (x - 1.0) / 4.0  # 1→0, 3→0.5, 5→1
    else:
        return "other"
    # Nächstes Bucket (Toleranz 0.02)
    for b in BUCKETS:
        if abs(norm - b) < 0.02:
            return str(b)
    # Sonst runden auf 0.25
    r = round(norm * 4) / 4
    r = max(0.0, min(1.0, r))
    return str(r) if r in BUCKETS else "other"


def _collect_raw_values_from_obj(
    obj: Any,
    dimensions: List[str],
    out: Dict[str, List[float]],
) -> None:
    """Rekursiv: Sammelt alle Rohwerte pro Dimension (ohne Konvertierung)."""
    if isinstance(obj, dict):
        for d in dimensions:
            if d in obj and isinstance(obj[d], (int, float)):
                out.setdefault(d, []).append(float(obj[d]))
        for v in obj.values():
            _collect_raw_values_from_obj(v, dimensions, out)
    elif isinstance(obj, list):
        for item in obj:
            _collect_raw_values_from_obj(item, dimensions, out)


def load_rules_for_system(system_name: str) -> dict:
    """Lädt alle JSON-Dateien (außer Struktur.json) eines Systemordners."""
    folder = BACKEND_DIR / system_name
    if not folder.is_dir():
        return {}
    merged = {}
    for path in sorted(folder.glob("*.json")):
        if path.name == "Struktur.json":
            continue
        try:
            with open(path, encoding="utf-8") as f:
                merged.update(json.load(f))
        except (json.JSONDecodeError, OSError):
            pass
    return merged


def collect_distribution() -> Tuple[Dict[str, Dict[str, Dict[str, int]]], List[str]]:
    """
    Pro System und Dimension: Zählt Vorkommen pro Bucket (0, 0.25, 0.5, 0.75, 1.0, other).
    Returns: (counts[system][dim][bucket] = count, systems).
    """
    sys.path.insert(0, str(BACKEND_DIR))
    from rule_engine import SUBFOLDERS  # pylint: disable=import-error

    counts: Dict[str, Dict[str, Dict[str, int]]] = {}
    for system_name in SUBFOLDERS:
        rules = load_rules_for_system(system_name)
        raw: Dict[str, List[float]] = {}
        _collect_raw_values_from_obj(rules, DIMENSIONS, raw)
        counts[system_name] = {}
        for dim in DIMENSIONS:
            buckets: Dict[str, int] = {str(b): 0 for b in BUCKETS}
            buckets["other"] = 0
            for v in raw.get(dim, []):
                b = _raw_to_bucket(v)
                buckets[b] = buckets.get(b, 0) + 1
            counts[system_name][dim] = buckets

    systems = [s for s in SUBFOLDERS if any(sum(counts[s][d].values()) for d in DIMENSIONS)]
    return counts, systems


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Verteilung der Regelwerte (0, 0.25, 0.5, 0.75, 1.0) pro System und Dimension."
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="CSV-Ausgabedatei (default: tools/output/rule_value_distribution.csv)",
    )
    parser.add_argument(
        "--no-csv",
        action="store_true",
        help="Nur Tabelle ausgeben, keine CSV schreiben.",
    )
    args = parser.parse_args()

    print("Sammle Dimensionswerte aus allen Regel-JSONs...")
    counts, systems = collect_distribution()

    bucket_labels = [str(b) for b in BUCKETS] + ["other"]

    # Konsolen-Tabelle pro System
    for system in systems:
        print(f"\n--- {system} ---")
        print(f"{'Dimension':<14} " + " ".join(f"{b:>6}" for b in bucket_labels) + "  Summe")
        print("-" * (14 + 7 * len(bucket_labels) + 8))
        for dim in DIMENSIONS:
            c = counts[system][dim]
            total = sum(c.values())
            if total == 0:
                continue
            row = [dim] + [str(c.get(b, 0)) for b in bucket_labels] + [str(total)]
            print(f"{row[0]:<14} " + " ".join(f"{x:>6}" for x in row[1:]))

    # CSV: Zeilen = (system, dimension), Spalten = Buckets + Summe
    if not args.no_csv:
        out_path = Path(args.output) if args.output else OUTPUT_DIR / "rule_value_distribution.csv"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f)
            w.writerow(["system", "dimension"] + bucket_labels + ["sum"])
            for system in systems:
                for dim in DIMENSIONS:
                    c = counts[system][dim]
                    total = sum(c.values())
                    w.writerow([system, dim] + [c.get(b, 0) for b in bucket_labels] + [total])
        print(f"\nCSV gespeichert: {out_path}")


if __name__ == "__main__":
    main()
