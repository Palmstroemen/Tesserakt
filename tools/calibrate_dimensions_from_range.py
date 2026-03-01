#!/usr/bin/env python3
"""
Ermittelt pro Dimension das aktuelle Minimum und Maximum ueber viele
Zufalls-Geburtsdaten und alle Systeme (ohne Kalibrierung), berechnet
dann Offset und Multiplikator so, dass der Bereich [min, max] auf [0, 1]
abgebildet wird, und schreibt backend/kalibrierung_dimensionen.json.
"""

from __future__ import annotations

import json
import random
from datetime import datetime
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"

DIMENSIONS = [
    "liebe", "beruf", "finanzen", "gesundheit",
    "soziales", "kreativitaet", "veraenderung", "spiritualitaet",
]


def sample_raw_ranges(runs: int, year_min: int, year_max: int, seed: int | None) -> Dict[str, tuple]:
    """
    Sammelt pro Dimension (min, max) ueber viele Laeufe. Verwendet Rohwerte
    (Kalibrierung wird fuer diesen Lauf ausgeschaltet).
    """
    import sys
    sys.path.insert(0, str(BACKEND_DIR))
    from rule_engine import (  # pylint: disable=import-error
        DIMENSIONS as DIMS,
        SUBFOLDERS,
        build_inputs,
        compute_vector,
        load_rules,
        load_struktur,
    )
    # Rohwerte: Kalibrierung-Cache leeren, damit _apply_kalibrierung nichts aendert
    import rule_engine as re_mod  # pylint: disable=import-error
    re_mod._kalibrierung_cache = {}

    rng = random.Random(seed)
    min_per_dim: Dict[str, float] = {d: 1.0 for d in DIMS}
    max_per_dim: Dict[str, float] = {d: 0.0 for d in DIMS}

    for _ in range(runs):
        year = rng.randint(year_min, year_max)
        month = rng.randint(1, 12)
        day = rng.randint(1, 28)
        birth_dt = datetime(year, month, day, 12, 0, 0)
        now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
        inputs = build_inputs(birth_dt, now)
        for system_name in SUBFOLDERS:
            struktur = load_struktur(system_name)
            if not struktur:
                continue
            rules = load_rules(system_name)
            vec = compute_vector(struktur, rules, inputs, system_name=system_name)
            for d in DIMS:
                v = float(vec.get(d, 0.0))
                if v < min_per_dim[d]:
                    min_per_dim[d] = v
                if v > max_per_dim[d]:
                    max_per_dim[d] = v

    return {d: (min_per_dim[d], max_per_dim[d]) for d in DIMS}


def compute_calibration(min_val: float, max_val: float) -> tuple:
    """
    Abbildung [min_val, max_val] -> [0, 1]: v' = (v - min) / (max - min).
    Entspricht offset + multiplier * v mit multiplier = 1/(max-min), offset = -min/(max-min).
    Bei max == min: keine Streckung (multiplier=1, offset=0).
    """
    if max_val <= min_val:
        return 0.0, 1.0
    span = max_val - min_val
    multiplier = 1.0 / span
    offset = -min_val * multiplier
    return offset, multiplier


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Kalibrierung aus aktuellem Min/Max pro Dimension berechnen.")
    parser.add_argument("--runs", type=int, default=3000, help="Anzahl Stichproben (default: 3000).")
    parser.add_argument("--year-min", type=int, default=1970)
    parser.add_argument("--year-max", type=int, default=2010)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    print("Sammle Rohwerte (ohne Kalibrierung) ueber zufaellige Geburtsdaten...")
    ranges = sample_raw_ranges(args.runs, args.year_min, args.year_max, args.seed)

    calibration = {"_meta": {"beschreibung": "Optionale Rekalibrierung pro Dimension (Testphase). Aus Min/Max-Stichprobe berechnet."}}
    print()
    print(f"{'Dimension':<14} {'Min':>8} {'Max':>8} {'Offset':>10} {'Multiplier':>10}")
    print("-" * 54)
    for dim in DIMENSIONS:
        lo, hi = ranges[dim]
        offset, mult = compute_calibration(lo, hi)
        calibration[dim] = {"offset": round(offset, 4), "multiplier": round(mult, 4)}
        print(f"{dim:<14} {lo:>8.4f} {hi:>8.4f} {offset:>10.4f} {mult:>10.4f}")

    out_path = BACKEND_DIR / "kalibrierung_dimensionen.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(calibration, f, ensure_ascii=False, indent=2)
    print()
    print(f"Gespeichert: {out_path}")


if __name__ == "__main__":
    main()
