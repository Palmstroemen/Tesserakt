#!/usr/bin/env python3
"""
System diagnostics for astrology vector engines.

Checks, per system and per source:
- how often a source produces non-empty dimensions
- how often mandatory sources fail
- how neutral resulting vectors remain (value == 3.0)
- basic structural heuristics for likely rule mismatches
"""

from __future__ import annotations

import argparse
import random
import statistics
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List

import sys

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
sys.path.append(str(BACKEND))

from rule_engine import (  # pylint: disable=import-error
    DIMENSIONS,
    HANDLER,
    SUBFOLDERS,
    blend,
    build_inputs,
    clamp,
    load_rules,
    load_struktur,
    neutral_vector,
)


@dataclass
class SourceStats:
    source_id: str
    source_type: str
    required: bool
    calls: int = 0
    hits: int = 0
    required_miss: int = 0
    avg_returned_dims: List[int] = field(default_factory=list)

    def hit_rate(self) -> float:
        return (self.hits / self.calls) if self.calls else 0.0

    def required_miss_rate(self) -> float:
        return (self.required_miss / self.calls) if self.calls else 0.0

    def mean_dims(self) -> float:
        return statistics.mean(self.avg_returned_dims) if self.avg_returned_dims else 0.0


def random_birth_date() -> datetime:
    year = random.randint(1950, 2015)
    month = random.randint(1, 12)
    # Safe day range to avoid invalid dates.
    day = random.randint(1, 28)
    hour = random.randint(0, 23)
    minute = random.randint(0, 59)
    return datetime(year, month, day, hour, minute)


def source_heuristics(struktur: dict, rules: dict) -> List[str]:
    warnings: List[str] = []
    for quelle in struktur.get("vektor_quellen", []):
        typ = quelle.get("typ", "")
        key = quelle.get("schluessel", "")
        data = rules.get(key, {})
        sid = quelle.get("id", key)

        if typ == "direkter_vektor":
            dim_field = quelle.get("dim_feld", "dimensionen_vektor")
            has_direct = all(d in data for d in DIMENSIONS)
            has_dim_field = isinstance(data.get(dim_field), dict)
            has_house_map = any(k.startswith("haus_") for k in data.keys())
            if not has_direct and not has_dim_field and has_house_map:
                warnings.append(
                    f"{sid}: direkter_vektor hat haus_* Mapping, aber kein direktes '{dim_field}' Feld."
                )

        if typ == "nakshatra":
            anzahl = int(quelle.get("anzahl", 27))
            if isinstance(data, dict) and len(data) < anzahl:
                warnings.append(
                    f"{sid}: nakshatra erwartet {anzahl} Eintraege, gefunden {len(data)}."
                )

    return warnings


def diagnose_system(system: str, runs: int) -> dict:
    struktur = load_struktur(system)
    rules = load_rules(system)
    if not struktur:
        return {"system": system, "error": "Struktur.json fehlt oder unlesbar."}

    sources = struktur.get("vektor_quellen", [])
    source_stats: Dict[str, SourceStats] = {}
    for q in sources:
        sid = q.get("id", q.get("schluessel", "unknown"))
        source_stats[sid] = SourceStats(
            source_id=sid,
            source_type=q.get("typ", ""),
            required=bool(q.get("pflicht", False)),
        )

    values_per_dim: Dict[str, List[float]] = {d: [] for d in DIMENSIONS}
    neutral_count = 0
    total_values = 0

    for _ in range(runs):
        birth = random_birth_date()
        target = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
        inputs = build_inputs(birth, target)

        base = neutral_vector()
        has_values = False
        for q in sources:
            sid = q.get("id", q.get("schluessel", "unknown"))
            stat = source_stats[sid]
            stat.calls += 1

            handler = HANDLER.get(q.get("typ", ""))
            if not handler:
                if stat.required:
                    stat.required_miss += 1
                continue

            dims = handler(q, rules, inputs)
            returned_dims = len(dims) if dims else 0
            stat.avg_returned_dims.append(returned_dims)

            if not dims:
                if stat.required:
                    stat.required_miss += 1
                continue

            if q.get("nur_wenn_leer", False) and has_values:
                continue

            stat.hits += 1
            base = blend(base, dims, q.get("gewicht", 0.5))
            has_values = True

        vec = {d: clamp(base[d]) for d in DIMENSIONS}
        for d in DIMENSIONS:
            v = float(vec[d])
            values_per_dim[d].append(v)
            total_values += 1
            if abs(v - 3.0) < 1e-9:
                neutral_count += 1

    dim_summary = {}
    for d in DIMENSIONS:
        vals = values_per_dim[d]
        dim_summary[d] = {
            "mean": round(statistics.mean(vals), 4),
            "std": round(statistics.pstdev(vals), 4),
            "neutral_rate": round(sum(1 for v in vals if abs(v - 3.0) < 1e-9) / len(vals), 4),
        }

    source_summary = []
    for sid, stat in source_stats.items():
        source_summary.append(
            {
                "id": sid,
                "type": stat.source_type,
                "required": stat.required,
                "hit_rate": round(stat.hit_rate(), 4),
                "required_miss_rate": round(stat.required_miss_rate(), 4),
                "mean_returned_dims": round(stat.mean_dims(), 3),
            }
        )

    return {
        "system": system,
        "runs": runs,
        "overall_neutral_rate": round(neutral_count / max(1, total_values), 4),
        "sources": source_summary,
        "dimensions": dim_summary,
        "heuristics": source_heuristics(struktur, rules),
    }


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Diagnose source coverage and neutrality by system.")
    p.add_argument("--runs", type=int, default=1000, help="Number of random births per system.")
    p.add_argument(
        "--systems",
        nargs="*",
        default=SUBFOLDERS,
        help="Systems to diagnose (default: all known systems).",
    )
    p.add_argument("--seed", type=int, default=42, help="RNG seed.")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    random.seed(args.seed)

    systems = [s for s in args.systems if s in SUBFOLDERS]
    print("=" * 90)
    print("SYSTEM DIAGNOSTICS")
    print("=" * 90)
    print(f"Runs per system: {args.runs}")
    print(f"Systems: {', '.join(systems)}")
    print("-" * 90)

    for system in systems:
        result = diagnose_system(system, args.runs)
        if "error" in result:
            print(f"\n[{system}] ERROR: {result['error']}")
            continue

        print(f"\n[{system}]")
        print(f"overall neutral rate: {result['overall_neutral_rate']:.2%}")

        if result["heuristics"]:
            print("heuristics:")
            for w in result["heuristics"]:
                print(f"  - {w}")

        print("sources:")
        for s in result["sources"]:
            required_flag = "required" if s["required"] else "optional"
            print(
                f"  - {s['id']} ({s['type']}, {required_flag}): "
                f"hit={s['hit_rate']:.2%}, req_miss={s['required_miss_rate']:.2%}, "
                f"mean_dims={s['mean_returned_dims']:.2f}"
            )

        print("dimensions (mean/std/neutral):")
        for d in DIMENSIONS:
            ds = result["dimensions"][d]
            print(
                f"  - {d:<12} mean={ds['mean']:.3f} std={ds['std']:.3f} "
                f"neutral={ds['neutral_rate']:.2%}"
            )

    print("\n" + "=" * 90)
    print("Tip: high req_miss_rate + high neutral_rate usually indicates rule mismatch.")
    print("=" * 90)


if __name__ == "__main__":
    main()
