#!/usr/bin/env python3
"""
Kalibrierung pro System (außer Westlich): Ein Offset und ein Multiplikator pro System,
basierend auf Perzentilen aller Dimensionswerte (nicht Min/Max, um Ausreisser zu ignorieren).
Westlich bleibt unverändert. Schreibt nur "systeme" in backend/kalibrierung_dimensionen.json.
"""

from __future__ import annotations

import json
import random
import sys
from datetime import datetime
from pathlib import Path
from typing import List

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"

# Zielsysteme = alle außer Westlich (Westlich behält bestehende Kalibrierung)
def _get_target_systems() -> List[str]:
    sys.path.insert(0, str(BACKEND_DIR))
    from rule_engine import SUBFOLDERS  # pylint: disable=import-error
    return [s for s in SUBFOLDERS if s != "Westlich"]


def sample_raw_values_system(
    system_name: str,
    runs: int,
    year_min: int,
    year_max: int,
    seed: int | None,
) -> List[float]:
    """
    Sammelt alle Dimensionswerte (ein flacher Wert pro Dimension pro Lauf) für ein System.
    Erwartet, dass der Aufrufer den Kalibrierungs-Cache mit systeme={} gesetzt hat (Rohwerte).
    """
    import sys
    sys.path.insert(0, str(BACKEND_DIR))
    from rule_engine import (  # pylint: disable=import-error
        DIMENSIONS as DIMS,
        build_inputs,
        compute_vector,
        load_rules,
        load_struktur,
    )

    rng = random.Random(seed)
    values: List[float] = []

    for _ in range(runs):
        year = rng.randint(year_min, year_max)
        month = rng.randint(1, 12)
        day = rng.randint(1, 28)
        birth_dt = datetime(year, month, day, 12, 0, 0)
        now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
        inputs = build_inputs(birth_dt, now)
        struktur = load_struktur(system_name)
        if not struktur:
            continue
        rules = load_rules(system_name)
        vec = compute_vector(struktur, rules, inputs, system_name=system_name)
        for d in DIMS:
            v = vec.get(d, 0.0)
            values.append(float(v))

    return values


def percentile(sorted_values: List[float], p: float) -> float:
    """Lineare Interpolation zwischen Nachbarn (numpy-ähnlich)."""
    if not sorted_values:
        return 0.0
    n = len(sorted_values)
    idx = (p / 100.0) * (n - 1)
    i = int(idx)
    frac = idx - i
    if i >= n - 1:
        return float(sorted_values[-1])
    return float(sorted_values[i] * (1 - frac) + sorted_values[i + 1] * frac)


def compute_calibration(p_low: float, p_high: float) -> tuple:
    """
    Abbildung [p_low, p_high] -> [0, 1]: v' = (v - p_low) / (p_high - p_low).
    offset = -p_low/(p_high-p_low), multiplier = 1/(p_high-p_low).
    """
    if p_high <= p_low:
        return 0.0, 1.0
    span = p_high - p_low
    multiplier = 1.0 / span
    offset = -p_low * multiplier
    return offset, multiplier


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(
        description="System-Kalibrierung (alle außer Westlich) aus Perzentil-Min/Max aller Dimensionen."
    )
    parser.add_argument("--runs", type=int, default=5000, help="Stichproben pro System (default: 5000).")
    parser.add_argument("--year-min", type=int, default=1970)
    parser.add_argument("--year-max", type=int, default=2010)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--percentile-low", type=float, default=2.0, help="Unteres Perzentil (default: 2).")
    parser.add_argument("--percentile-high", type=float, default=98.0, help="Oberes Perzentil (default: 98).")
    args = parser.parse_args()

    kal_path = BACKEND_DIR / "kalibrierung_dimensionen.json"
    with open(kal_path, encoding="utf-8") as f:
        kal = json.load(f)
    systeme = kal.get("systeme") or {}

    # Rohwerte: Kalibrierungs-Cache so setzen, dass keine System-Kalibrierung angewendet wird
    sys.path.insert(0, str(BACKEND_DIR))
    import rule_engine as rule_engine_mod  # pylint: disable=import-error
    rule_engine_mod._kalibrierung_cache = {**kal, "systeme": {}}

    target_systems = _get_target_systems()
    for system_name in target_systems:
        print(f"Sammle Rohwerte für {system_name} ({args.runs} Läufe)...")
        values = sample_raw_values_system(
            system_name, args.runs, args.year_min, args.year_max, args.seed
        )
        if not values:
            print(f"  Keine Werte für {system_name}, überspringe.")
            continue
        values.sort()
        p_low = percentile(values, args.percentile_low)
        p_high = percentile(values, args.percentile_high)
        offset, mult = compute_calibration(p_low, p_high)
        systeme[system_name] = {
            "offset": round(offset, 4),
            "multiplier": round(mult, 4),
        }
        print(f"  Perzentil {args.percentile_low} = {p_low:.4f}, {args.percentile_high} = {p_high:.4f}")
        print(f"  -> offset = {offset:.4f}, multiplier = {mult:.4f}")

    kal["systeme"] = systeme
    with open(kal_path, "w", encoding="utf-8") as f:
        json.dump(kal, f, ensure_ascii=False, indent=2)
    print()
    print(f"Gespeichert: {kal_path} (nur systeme aktualisiert)")


if __name__ == "__main__":
    main()
