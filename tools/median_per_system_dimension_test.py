#!/usr/bin/env python3
"""
Test: Median der Vektorwerte pro System und Dimension.

Variante 1 (Standard): Geht die Regel-JSON-Dateien systematisch durch und sammelt
alle vorkommenden Dimensionswerte; daraus wird der Median pro (System, Dimension)
berechnet. Schnell und deterministisch.

Variante 2 (optional --simulate): Stichprobe über zufällige Geburtsdaten wie bisher.
"""

from __future__ import annotations

import argparse
import json
import random
import statistics
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"

DIMENSIONS = [
    "liebe", "beruf", "finanzen", "gesundheit",
    "soziales", "kreativitaet", "veraenderung", "spiritualitaet",
]


def _rule_value_to_signed(v: float) -> float:
    """Regelwert 0..1 oder 1..5 auf -1..+1 mappen."""
    v = float(v)
    if 0 <= v <= 1:
        return 2.0 * v - 1.0
    if 1 < v <= 5:
        return (v - 3.0) / 2.0
    return 0.0


def _collect_dim_values_from_obj(obj: Any, dimensions: List[str], out: Dict[str, List[float]]) -> None:
    """Rekursiv durch dict/list: Jedes dict, das Dimensionsschlüssel mit Zahlen hat, wird ausgewertet."""
    if isinstance(obj, dict):
        # Hat dieses Dict mindestens einen Dimensionsschlüssel mit Zahl?
        found = {d: _rule_value_to_signed(obj[d]) for d in dimensions if d in obj and isinstance(obj[d], (int, float))}
        if found:
            for d, val in found.items():
                out.setdefault(d, []).append(val)
        for v in obj.values():
            _collect_dim_values_from_obj(v, dimensions, out)
    elif isinstance(obj, list):
        for item in obj:
            _collect_dim_values_from_obj(item, dimensions, out)


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


def collect_values_from_rule_jsons() -> Tuple[Dict[str, Dict[str, List[float]]], List[str]]:
    """
    Geht für jedes System alle Regel-JSONs durch und sammelt alle vorkommenden
    Dimensionswerte (nach Konvertierung auf -1..+1). Returns (values_per_system_dim, systems).
    """
    import sys
    sys.path.insert(0, str(BACKEND_DIR))
    from rule_engine import SUBFOLDERS  # pylint: disable=import-error

    values_per_system_dim: Dict[str, Dict[str, List[float]]] = {}
    for system_name in SUBFOLDERS:
        rules = load_rules_for_system(system_name)
        out: Dict[str, List[float]] = {}
        _collect_dim_values_from_obj(rules, DIMENSIONS, out)
        values_per_system_dim[system_name] = {d: out.get(d, []) for d in DIMENSIONS}

    systems = [s for s in SUBFOLDERS if any(values_per_system_dim[s][d] for d in DIMENSIONS)]
    return values_per_system_dim, systems


def get_vektoren_for_birth_date(
    birth_dt: datetime,
    *,
    build_inputs,
    load_struktur,
    load_rules,
    compute_vector,
    DIMENSIONS,
    SUBFOLDERS,
) -> Dict[str, Dict[str, float]]:
    """Berechnet für ein Geburtsdatum die Vektoren aller Systeme."""
    now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    inputs = build_inputs(birth_dt, now)
    vektoren: Dict[str, Dict[str, float]] = {}
    for system_name in SUBFOLDERS:
        struktur = load_struktur(system_name)
        if not struktur:
            continue
        rules = load_rules(system_name)
        vector = compute_vector(struktur, rules, inputs, system_name=system_name)
        vektoren[system_name] = {dim: float(vector.get(dim, 0.0)) for dim in DIMENSIONS}
    return vektoren


def run_simulation(
    runs: int,
    year_min: int,
    year_max: int,
    seed: int | None,
) -> Tuple[Dict[str, Dict[str, List[float]]], List[str], List[str]]:
    """Sammelt pro System und Dimension alle Vektorwerte über alle Läufe."""
    import sys
    sys.path.insert(0, str(BACKEND_DIR))
    from rule_engine import (  # pylint: disable=import-error
        DIMENSIONS,
        SUBFOLDERS,
        build_inputs,
        compute_vector,
        load_rules,
        load_struktur,
    )

    rng = random.Random(seed)
    values_per_system_dim: Dict[str, Dict[str, List[float]]] = {
        s: {d: [] for d in DIMENSIONS} for s in SUBFOLDERS
    }

    for _ in range(runs):
        year = rng.randint(year_min, year_max)
        month = rng.randint(1, 12)
        day = rng.randint(1, 28)
        birth_dt = datetime(year, month, day, 12, 0, 0)
        vektoren = get_vektoren_for_birth_date(
            birth_dt,
            build_inputs=build_inputs,
            load_struktur=load_struktur,
            load_rules=load_rules,
            compute_vector=compute_vector,
            DIMENSIONS=DIMENSIONS,
            SUBFOLDERS=SUBFOLDERS,
        )
        for system, vec in vektoren.items():
            for dim, val in vec.items():
                values_per_system_dim[system][dim].append(val)

    systems = [s for s in SUBFOLDERS if any(values_per_system_dim[s][d] for d in DIMENSIONS)]
    return values_per_system_dim, systems, DIMENSIONS


def median_or_none(values: List[float]) -> float | None:
    """Median der Liste; None wenn leer."""
    if not values:
        return None
    return statistics.median(values)


def compute_medians_from_rules() -> Tuple[Dict[str, Dict[str, float | None]], List[str], List[str]]:
    """
    Sammelt aus den Regel-JSONs aller Systeme alle Dimensionswerte,
    berechnet pro (System, Dimension) den Median. Keine Stichproben, deterministisch.
    """
    values_per_system_dim, systems = collect_values_from_rule_jsons()
    medians: Dict[str, Dict[str, float | None]] = {}
    for system in systems:
        medians[system] = {}
        for dim in DIMENSIONS:
            vals = values_per_system_dim[system].get(dim, [])
            medians[system][dim] = median_or_none(vals)
    return medians, systems, DIMENSIONS


def compute_medians(
    runs: int,
    year_min: int = 1970,
    year_max: int = 2010,
    seed: int | None = 42,
) -> Tuple[Dict[str, Dict[str, float | None]], List[str], List[str]]:
    """
    Stichprobe über zufällige Geburtsdaten; berechnet pro (System, Dimension) den Median.
    """
    values_per_system_dim, systems, dimensions = run_simulation(
        runs, year_min, year_max, seed
    )
    medians: Dict[str, Dict[str, float | None]] = {}
    for system in systems:
        medians[system] = {}
        for dim in dimensions:
            vals = values_per_system_dim[system].get(dim, [])
            medians[system][dim] = median_or_none(vals)
    return medians, systems, dimensions


def test_median_per_system_dimension() -> None:
    """
    Test: Geht die Regel-JSONs aller Systeme durch, sammelt alle Dimensionswerte
    und berechnet den Median. Alle Mediane müssen im gültigen Intervall [-1, 1] liegen.
    (Keine Stichproben – rein datengetrieben aus den JSON-Dateien.)
    """
    medians, systems, dimensions = compute_medians_from_rules()
    assert systems, "Es muss mindestens ein System geladen sein."
    assert dimensions, "Dimensionen müssen definiert sein."

    for system in systems:
        for dim in dimensions:
            m = medians[system].get(dim)
            assert m is not None, f"Median fehlt für {system} / {dim}"
            assert -1.0 <= m <= 1.0, (
                f"Median {system}/{dim} = {m} liegt außerhalb [-1, 1]"
            )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Median der Dimensionswerte (-1..+1) pro System. Standard: aus Regel-JSONs."
    )
    parser.add_argument(
        "--simulate",
        action="store_true",
        help="Statt JSON: Stichprobe über zufällige Geburtsdaten (langsamer).",
    )
    parser.add_argument("--runs", type=int, default=1000, help="Nur bei --simulate: Anzahl Geburtsdaten.")
    parser.add_argument("--year-min", type=int, default=1970)
    parser.add_argument("--year-max", type=int, default=2010)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    if args.simulate:
        print("Sammle Vektorwerte über zufällige Geburtsdaten...")
        medians, systems, dimensions = compute_medians(
            args.runs, args.year_min, args.year_max, args.seed
        )
        source_note = f"Basierend auf {args.runs} zufälligen Geburtsdaten"
    else:
        print("Sammle Dimensionswerte aus Regel-JSON-Dateien...")
        medians, systems, dimensions = compute_medians_from_rules()
        source_note = "Basierend auf allen Werten in den Regel-JSONs"

    col_width = 12
    header = "Dimension    " + "".join(f" {s[:col_width-1]:>{col_width-1}}" for s in systems)
    print()
    print(header)
    print("-" * len(header))

    for dim in dimensions:
        row = f"{dim:<13}"
        for system in systems:
            m = medians[system].get(dim)
            if m is None:
                cell = "—"
            else:
                cell = f"{m:+.3f}"
            row += f" {cell:>{col_width}}"
        print(row)

    print()
    print(f"({source_note}, Skala -1..+1)")


if __name__ == "__main__":
    main()
