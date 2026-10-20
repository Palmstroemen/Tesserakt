#!/usr/bin/env python3
"""
Histogramm aus Regel-JSONs: Verteilung der Dimensionswerte (-1..+1) pro System.

Geht die Regel-JSON-Dateien aller Systeme durch (keine zufälligen Geburtsdaten),
sammelt alle vorkommenden Dimensionswerte und zeichnet je System 9 Histogramme
(8 Dimensionen + 1 Gesamt). X-Achse fest -1..+1. Zusätzlich: dünne schwarze
vertikale Linie = Median pro (System, Dimension) bzw. Gesamt.
"""

from __future__ import annotations

import argparse
import statistics
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
OUTPUT_DIR = ROOT / "tools" / "output"

DIMENSION_COLORS = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
    "#9467bd", "#8c564b", "#e377c2", "#7f7f7f",
]

# Maximales Frage-Gewicht pro (System, Dimension) – für Sättigung/Transparenz (niedrig = farblos).
DIMENSION_WEIGHTS = {
    "Bazi": {
        "liebe": 0.8, "beruf": 1.0, "finanzen": 1.0, "gesundheit": 0.8,
        "soziales": 0.0, "kreativitaet": 0.3, "veraenderung": 1.0, "spiritualitaet": 0.0,
    },
    "Westlich": {
        "liebe": 1.0, "beruf": 1.0, "finanzen": 1.0, "gesundheit": 1.0,
        "soziales": 1.0, "kreativitaet": 1.0, "veraenderung": 0.9, "spiritualitaet": 0.8,
    },
    "Numerologie": {
        "liebe": 1.0, "beruf": 1.0, "finanzen": 0.9, "gesundheit": 0.7,
        "soziales": 1.0, "kreativitaet": 1.0, "veraenderung": 0.9, "spiritualitaet": 0.9,
    },
    "KO": {d: 1.0 for d in ["liebe", "beruf", "finanzen", "gesundheit", "soziales", "kreativitaet", "veraenderung", "spiritualitaet"]},
}


def get_dimension_weight(system: str, dim: str) -> float:
    sys_weights = DIMENSION_WEIGHTS.get(system, {})
    return float(sys_weights.get(dim, 1.0))


def build_single_histogram(
    values: List[float],
    bin_min: float,
    bin_max: float,
    num_bins: int,
):
    """Binned Histogramm. Returns (bin_edges, counts)."""
    import numpy as np
    bin_edges = list(np.linspace(bin_min, bin_max, num_bins + 1))
    if not values:
        return bin_edges, [0.0] * num_bins
    hist, _ = np.histogram(values, bins=bin_edges)
    return bin_edges, [float(c) for c in hist]


def plot_histogram_with_median(
    ax,
    bin_edges: List[float],
    counts: List[float],
    color: str,
    median_val: float | None,
    alpha: float = 1.0,
) -> None:
    """Zeichnet Balken-Histogramm (alpha = Sättigung/Gewicht) und ggf. Median-Vertikale."""
    import numpy as np
    num_bins = len(counts)
    bin_width = (bin_edges[-1] - bin_edges[0]) / num_bins
    x = np.array(bin_edges[:-1]) + bin_width / 2
    ax.bar(x, counts, width=bin_width * 0.95, color=color, edgecolor="none", alpha=alpha)
    if median_val is not None:
        ax.axvline(median_val, color="black", linewidth=0.8, linestyle="-", zorder=5)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Histogramm aus Regel-JSONs (-1..+1) pro System, mit Median-Linie."
    )
    parser.add_argument("--bins", type=int, default=20, help="Anzahl Bins (default: 20).")
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Ausgabedatei (default: tools/output/vector_value_histogram_from_json.png)",
    )
    args = parser.parse_args()

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError as e:
        raise SystemExit("Dieses Skript benötigt matplotlib und numpy: pip install matplotlib numpy") from e

    # Werte aus Regel-JSONs sammeln (wie Median-Test)
    from median_per_system_dimension_test import (  # pylint: disable=import-error
        DIMENSIONS,
        collect_values_from_rule_jsons,
    )

    print("Sammle Dimensionswerte aus Regel-JSON-Dateien...")
    values_per_system_dim, systems = collect_values_from_rule_jsons()
    dimensions = DIMENSIONS

    bin_min, bin_max = -1.0, 1.0
    num_bins = args.bins
    bin_edges, _ = build_single_histogram([], bin_min, bin_max, num_bins)

    # Mediane pro (System, Dimension) und pro System (Gesamt)
    medians: Dict[str, Dict[str, float | None]] = {}
    medians_gesamt: Dict[str, float | None] = {}
    for system in systems:
        medians[system] = {}
        all_vals = []
        for dim in dimensions:
            vals = values_per_system_dim[system].get(dim, [])
            all_vals.extend(vals)
            medians[system][dim] = statistics.median(vals) if vals else None
        medians_gesamt[system] = statistics.median(all_vals) if all_vals else None

    n_dims = len(dimensions)
    n_systems = len(systems)
    n_rows = n_dims + 1
    fig, axes = plt.subplots(
        n_rows, n_systems,
        figsize=(2.2 * n_systems, 1.8 * n_rows),
        sharex="col",
        sharey="row",
    )
    if n_systems == 1:
        axes = axes.reshape(-1, 1)
    if n_rows == 1:
        axes = axes.reshape(1, -1)

    GESAMT_COLOR = "#2d2d2d"

    for col, system in enumerate(systems):
        for row, dim in enumerate(dimensions):
            ax = axes[row, col]
            vals = values_per_system_dim[system].get(dim, [])
            _, counts = build_single_histogram(vals, bin_min, bin_max, num_bins)
            color = DIMENSION_COLORS[row % len(DIMENSION_COLORS)]
            median_val = medians[system].get(dim)
            weight = get_dimension_weight(system, dim)
            plot_histogram_with_median(ax, bin_edges, counts, color, median_val, alpha=weight)
            if col == 0:
                ax.set_ylabel(dim, fontsize=8)
            if row == 0:
                ax.set_title(system, fontsize=9)
            if row == n_dims - 1:
                ax.set_xlabel("-1..+1", fontsize=7)
            ax.tick_params(axis="both", labelsize=6)

        ax_gesamt = axes[n_dims, col]
        all_vals = []
        for dim in dimensions:
            all_vals.extend(values_per_system_dim[system].get(dim, []))
        _, counts_gesamt = build_single_histogram(all_vals, bin_min, bin_max, num_bins)
        plot_histogram_with_median(
            ax_gesamt, bin_edges, counts_gesamt, GESAMT_COLOR, medians_gesamt.get(system), alpha=1.0
        )
        if col == 0:
            ax_gesamt.set_ylabel("Gesamt", fontsize=8)
        ax_gesamt.set_xlabel("-1..+1", fontsize=7)
        ax_gesamt.tick_params(axis="both", labelsize=6)

    for ax in axes.flat:
        ax.set_xlim(-1.0, 1.0)
        ax.set_xticks([-1.0, 0.0, 1.0])

    plt.tight_layout()
    out = Path(args.output) if args.output else OUTPUT_DIR / "vector_value_histogram_from_json.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out, dpi=120)
    plt.close()
    print(f"Gespeichert: {out}")


if __name__ == "__main__":
    main()
