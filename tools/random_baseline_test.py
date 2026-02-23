#!/usr/bin/env python3
"""
Monte-Carlo baseline test for the assessment scoring.

Runs synthetic games with fully random values (no UI, no interaction),
collects per-system scores, and reports mean values over N runs.
"""

from __future__ import annotations

import argparse
import json
import math
import random
from pathlib import Path
from typing import Dict, List


ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"


def load_matrix() -> dict:
    path = BACKEND_DIR / "dimensionen_matrix.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def load_questions() -> List[dict]:
    # Import in function to keep script startup simple.
    import sys

    sys.path.append(str(BACKEND_DIR))
    from horoskop_assessment import FRAGEN  # pylint: disable=import-error

    return FRAGEN


def get_question_weights(
    systems: List[str], dimension: str, frage_gewichte: Dict[str, float], matrix: dict
) -> Dict[str, float]:
    konsens = matrix.get("konsens_gewichtung", {})
    raws = []
    for system in systems:
        matrix_weight = float(konsens.get(dimension, {}).get(system, 0.0))
        frage_weight = float(frage_gewichte.get(system, 1.0))
        raws.append((system, matrix_weight * frage_weight))

    weight_sum = sum(raw for _, raw in raws)
    if weight_sum <= 0:
        raws = [(system, float(frage_gewichte.get(system, 1.0))) for system in systems]
        weight_sum = sum(raw for _, raw in raws)

    if weight_sum <= 0:
        equal = 1.0 / max(1, len(systems))
        return {system: equal for system in systems}

    return {system: raw / weight_sum for system, raw in raws}


RANDOM_BASELINE_MSE = 8.0 / 3.0


def simulate_one_run(systems: List[str], fragen: List[dict], matrix: dict) -> Dict[str, Dict[str, float]]:
    kumul_fehler = {s: 0.0 for s in systems}
    kumul_gewicht = {s: 0.0 for s in systems}

    for frage in fragen:
        dim = frage["dimension"]
        frage_gewichte = frage.get("gewichte", {})
        selbst = random.uniform(1.0, 5.0)
        system_werte = {s: random.uniform(1.0, 5.0) for s in systems}
        weights = get_question_weights(systems, dim, frage_gewichte, matrix)

        for system in systems:
            w = weights.get(system, 0.0)
            if w <= 0:
                continue
            diff = selbst - system_werte[system]
            fehler = diff * diff
            kumul_fehler[system] += fehler * w
            kumul_gewicht[system] += w

    metrics = {}
    for system in systems:
        if kumul_gewicht[system] <= 0:
            metrics[system] = {"fit": 0.0, "skill_raw": 0.0, "skill_clipped": 0.0}
            continue
        mse = kumul_fehler[system] / kumul_gewicht[system]
        rmse = math.sqrt(mse)
        fit = max(0.0, 100.0 * (1.0 - rmse / 4.0))
        skill_raw = 100.0 * (1.0 - mse / RANDOM_BASELINE_MSE)
        skill_clipped = max(0.0, skill_raw)
        metrics[system] = {"fit": fit, "skill_raw": skill_raw, "skill_clipped": skill_clipped}

    return metrics


def run_simulation(runs: int, systems: List[str], seed: int | None) -> Dict[str, Dict[str, float]]:
    if seed is not None:
        random.seed(seed)

    fragen = load_questions()
    matrix = load_matrix()
    total = {s: {"fit": 0.0, "skill_raw": 0.0, "skill_clipped": 0.0} for s in systems}

    for _ in range(runs):
        scores = simulate_one_run(systems, fragen, matrix)
        for system in systems:
            total[system]["fit"] += scores[system]["fit"]
            total[system]["skill_raw"] += scores[system]["skill_raw"]
            total[system]["skill_clipped"] += scores[system]["skill_clipped"]

    return {
        system: {
            "fit": total[system]["fit"] / runs,
            "skill_raw": total[system]["skill_raw"] / runs,
            "skill_clipped": total[system]["skill_clipped"] / runs,
        }
        for system in systems
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Randomized baseline simulation for assessment scoring.")
    parser.add_argument(
        "--runs",
        type=int,
        default=10000,
        help="Number of synthetic test games to run (default: 10000).",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional RNG seed for reproducible simulation.",
    )
    parser.add_argument(
        "--include-ko",
        action="store_true",
        help="Include KO as additional random system in the simulation output.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    systems = ["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Japanisch"]
    if args.include_ko:
        systems.append("KO")

    mean_scores = run_simulation(args.runs, systems, args.seed)

    print("=" * 72)
    print("RANDOM BASELINE TEST")
    print("=" * 72)
    print(f"Runs: {args.runs}")
    print(f"Systems: {', '.join(systems)}")
    if args.seed is not None:
        print(f"Seed: {args.seed}")
    print("-" * 72)
    print(
        f"{'System':<16} {'Mean Fit':>12} {'Mean Skill raw':>16} "
        f"{'Mean Skill clipped':>20}"
    )
    print("-" * 72)
    for system in systems:
        print(
            f"{system:<16} {mean_scores[system]['fit']:>12.4f} "
            f"{mean_scores[system]['skill_raw']:>16.4f} "
            f"{mean_scores[system]['skill_clipped']:>20.4f}"
        )
    print("-" * 72)
    print(
        "Note: For fully random values, Fit stays around ~59 due to RMSE scaling. "
        "Skill raw should be around ~0; clipped skill is biased upward by truncation at 0."
    )
    print("=" * 72)


if __name__ == "__main__":
    main()
