#!/usr/bin/env python3
"""
Test: Wie unterschiedlich sind die System-Vektoren untereinander?

Generiert über viele zufällige Geburtsdaten (verteilt über Jahre) die Vektoren
aller Systeme und misst pro Dimension und über alle Stichproben:
  - Varianz der Systemwerte (wie stark weichen die Systeme voneinander ab?)
  - Spannweite (max - min) pro Dimension
  - Mittlere paarweise quadratische Abweichung (MSE) zwischen Systemen

Hintergrund: Wenn Systeme oft gegensätzliche Werte liefern, gibt es bei
zufälliger User-Eingabe fast immer ein „gewinnendes“ System mit hohem Skill –
ohne dass das System wirklich trifft. Dieser Test quantifiziert die
Streuung zwischen den Systemen.
"""

from __future__ import annotations

import argparse
import random
import statistics
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"


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
    """Berechnet für ein Geburtsdatum die Vektoren aller Systeme (ohne Ephemeris)."""
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


def random_birth_datetime(
    year_min: int,
    year_max: int,
    rng: random.Random,
) -> datetime:
    """Zufälliges Datum zwischen year_min und year_max, Uhrzeit 12:00."""
    year = rng.randint(year_min, year_max)
    month = rng.randint(1, 12)
    day = rng.randint(1, 28)  # sicher für jeden Monat
    return datetime(year, month, day, 12, 0, 0)


def variance_across_systems(
    vektoren: Dict[str, Dict[str, float]],
    dimension: str,
    systems: List[str],
) -> float:
    """Varianz der Werte einer Dimension über alle Systeme."""
    values = [vektoren[s][dimension] for s in systems if s in vektoren and dimension in vektoren[s]]
    if len(values) < 2:
        return 0.0
    return statistics.variance(values)


def range_across_systems(
    vektoren: Dict[str, Dict[str, float]],
    dimension: str,
    systems: List[str],
) -> float:
    """Spannweite (max - min) einer Dimension über alle Systeme."""
    values = [vektoren[s][dimension] for s in systems if s in vektoren and dimension in vektoren[s]]
    if not values:
        return 0.0
    return max(values) - min(values)


def mean_pairwise_squared_diff(
    vektoren: Dict[str, Dict[str, float]],
    dimension: str,
    systems: List[str],
) -> float:
    """Mittlere paarweise quadratische Abweichung (MSE-ähnlich) zwischen Systemen."""
    systems_with_dim = [s for s in systems if s in vektoren and dimension in vektoren[s]]
    if len(systems_with_dim) < 2:
        return 0.0
    total = 0.0
    count = 0
    for i, sa in enumerate(systems_with_dim):
        for sb in systems_with_dim[i + 1 :]:
            diff = vektoren[sa][dimension] - vektoren[sb][dimension]
            total += diff * diff
            count += 1
    return total / count if count else 0.0


def run_simulation(
    runs: int,
    year_min: int,
    year_max: int,
    seed: int | None,
) -> Tuple[
    Dict[str, List[float]],
    Dict[str, List[float]],
    Dict[str, List[float]],
    List[str],
]:
    """
    Läuft über viele Zufallsdaten, sammelt pro Dimension:
    - variance_per_run, range_per_run, pairwise_mse_per_run.
    Returns (variance_by_dim, range_by_dim, pairwise_mse_by_dim, dimensions).
    """
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
    systems = [s for s in SUBFOLDERS]
    variance_by_dim: Dict[str, List[float]] = {d: [] for d in DIMENSIONS}
    range_by_dim: Dict[str, List[float]] = {d: [] for d in DIMENSIONS}
    pairwise_mse_by_dim: Dict[str, List[float]] = {d: [] for d in DIMENSIONS}

    for run in range(runs):
        birth_dt = random_birth_datetime(year_min, year_max, rng)
        vektoren = get_vektoren_for_birth_date(
            birth_dt,
            build_inputs=build_inputs,
            load_struktur=load_struktur,
            load_rules=load_rules,
            compute_vector=compute_vector,
            DIMENSIONS=DIMENSIONS,
            SUBFOLDERS=SUBFOLDERS,
        )
        if not vektoren:
            continue
        for dim in DIMENSIONS:
            variance_by_dim[dim].append(
                variance_across_systems(vektoren, dim, systems)
            )
            range_by_dim[dim].append(
                range_across_systems(vektoren, dim, systems)
            )
            pairwise_mse_by_dim[dim].append(
                mean_pairwise_squared_diff(vektoren, dim, systems)
            )

    return variance_by_dim, range_by_dim, pairwise_mse_by_dim, DIMENSIONS


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Misst die Streuung der System-Vektoren untereinander über viele Zufallsdaten."
    )
    parser.add_argument(
        "--runs",
        type=int,
        default=2000,
        help="Anzahl zufälliger Geburtsdaten (default: 2000).",
    )
    parser.add_argument(
        "--year-min",
        type=int,
        default=1970,
        help="Frühestes Geburtsjahr (default: 1970).",
    )
    parser.add_argument(
        "--year-max",
        type=int,
        default=2010,
        help="Spätestes Geburtsjahr (default: 2010).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="RNG-Seed für Reproduzierbarkeit.",
    )
    args = parser.parse_args()

    print("Lade Regelwerke und berechne Vektoren für zufällige Geburtsdaten...")
    variance_by_dim, range_by_dim, pairwise_mse_by_dim, dimensions = run_simulation(
        args.runs, args.year_min, args.year_max, args.seed
    )

    print()
    print("=" * 72)
    print("SYSTEM-VEKTOREN: UNTERSCHIEDE ZWISCHEN DEN SYSTEMEN")
    print("=" * 72)
    print(f"Runs: {args.runs} (Geburtsdaten {args.year_min}–{args.year_max})")
    if args.seed is not None:
        print(f"Seed: {args.seed}")
    print()
    print(
        "Pro Dimension: mittlere Varianz / Spannweite / mittlere paarweise MSE "
        "(Skala 1–5; MSE wie bei Skill-Baseline 8/3)"
    )
    print("-" * 72)
    print(f"{'Dimension':<14} {'Mean Var':>10} {'Mean Range':>12} {'Mean pairwise MSE':>18}")
    print("-" * 72)

    for dim in dimensions:
        mean_var = statistics.mean(variance_by_dim[dim]) if variance_by_dim[dim] else 0
        mean_range = statistics.mean(range_by_dim[dim]) if range_by_dim[dim] else 0
        mean_mse = statistics.mean(pairwise_mse_by_dim[dim]) if pairwise_mse_by_dim[dim] else 0
        print(f"{dim:<14} {mean_var:>10.4f} {mean_range:>12.4f} {mean_mse:>18.4f}")

    print("-" * 72)
    overall_var = statistics.mean(
        [statistics.mean(variance_by_dim[d]) for d in dimensions]
    )
    overall_range = statistics.mean(
        [statistics.mean(range_by_dim[d]) for d in dimensions]
    )
    overall_mse = statistics.mean(
        [statistics.mean(pairwise_mse_by_dim[d]) for d in dimensions]
    )
    print(f"{' (über alle)':<14} {overall_var:>10.4f} {overall_range:>12.4f} {overall_mse:>18.4f}")
    print()
    print(
        "Hinweis: Hohe Streuung bedeutet, dass bei zufälliger User-Eingabe oft "
        "ein System 'gewinnen' wird (hoher Skill), ohne dass es wirklich trifft."
    )
    print("=" * 72)


if __name__ == "__main__":
    main()
