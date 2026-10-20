#!/usr/bin/env python3
"""
Histogramm: Verteilung der Vektorwerte (-1..+1) pro System und Dimension.

Sammelt über viele zufällige Geburtsdaten alle Vektorwerte. Im Ergebnis wird
je System ein Block von 9 einzelnen Histogrammen untereinander gezeichnet
(8 Dimensionen + 1 Gesamthistogramm = 9 Zeilen je System). Skala -1..+1, Bins konfigurierbar.

Benötigt: matplotlib (pip install matplotlib)
"""

from __future__ import annotations

import argparse
import random
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
OUTPUT_DIR = ROOT / "tools" / "output"

# Eine Farbe pro Dimension (8), gut unterscheidbar
DIMENSION_COLORS = [
    "#1f77b4",  # liebe
    "#ff7f0e",  # beruf
    "#2ca02c",  # finanzen
    "#d62728",  # gesundheit
    "#9467bd",  # soziales
    "#8c564b",  # kreativitaet
    "#e377c2",  # veraenderung
    "#7f7f7f",  # spiritualitaet
]

# Maximales Frage-Gewicht pro (System, Dimension) aus FRAGEN – für Sättigung/Transparenz im Histogramm.
# Niedriges Gewicht = Dimension wird farblos/transparent dargestellt. Fehlende Systeme/Dimensionen: 1.0.
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
def get_vektoren_for_birth_date(
    birth_dt: datetime,
    *,
    build_inputs,
    build_four_pillars,
    luck_pillar_for_both_sexes,
    load_struktur,
    load_rules,
    compute_vector,
    DIMENSIONS,
    SUBFOLDERS,
    contribution_records: Optional[List[Tuple[str, Dict[str, bool]]]] = None,
) -> Dict[str, Dict[str, float]]:
    """Berechnet für ein Geburtsdatum die Vektoren aller Systeme (ohne Ephemeris).
    Wenn contribution_records übergeben wird, wird pro System (name, {quelle_id: bool})
    angehängt, ob jede Quelle einen nicht-verschwindenden Beitrag geliefert hat."""
    now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    # Bazi: Four Pillars + Da Yun wie in main.py, damit day_branch, hour_branch, luck_pillar greifen
    bazi_pillars = None
    bazi_luck_male = None
    bazi_luck_female = None
    if "Bazi" in SUBFOLDERS:
        bazi_pillars = build_four_pillars(birth_dt)
        bazi_luck_male, bazi_luck_female = luck_pillar_for_both_sexes(birth_dt, now)
    bazi_day_branch = bazi_pillars["pillars"]["day"]["branch"] if bazi_pillars else None
    bazi_hour_stem = bazi_pillars["pillars"]["hour"]["stem"] if bazi_pillars else None
    bazi_hour_branch = bazi_pillars["pillars"]["hour"]["branch"] if bazi_pillars else None
    inputs = build_inputs(
        birth_dt, now,
        bazi_day_branch=bazi_day_branch,
        bazi_hour_stem=bazi_hour_stem,
        bazi_hour_branch=bazi_hour_branch,
    )
    vektoren: Dict[str, Dict[str, float]] = {}
    for system_name in SUBFOLDERS:
        if system_name == "Bazi":
            if bazi_luck_male is None or bazi_luck_female is None:
                continue
            male_stem, male_branch = bazi_luck_male
            female_stem, female_branch = bazi_luck_female
            inp_m = {**inputs, "luck_pillar_stem": male_stem, "luck_pillar_branch": male_branch}
            inp_f = {**inputs, "luck_pillar_stem": female_stem, "luck_pillar_branch": female_branch}
            struktur = load_struktur("Bazi")
            rules = load_rules("Bazi")
            if struktur and rules:
                if contribution_records is not None:
                    contrib_m: Dict[str, bool] = {}
                    vm = compute_vector(struktur, rules, inp_m, system_name="Bazi", track_contributions=contrib_m)
                    contrib_f: Dict[str, bool] = {}
                    vf = compute_vector(struktur, rules, inp_f, system_name="Bazi", track_contributions=contrib_f)
                    merged = {k: contrib_m.get(k, False) or contrib_f.get(k, False) for k in set(contrib_m) | set(contrib_f)}
                    contribution_records.append(("Bazi", merged))
                else:
                    vm = compute_vector(struktur, rules, inp_m, system_name="Bazi")
                    vf = compute_vector(struktur, rules, inp_f, system_name="Bazi")
                # Geschlechtsneutral: ein Vektor Bazi = Mittelwert aus männlich/weiblich
                vektoren["Bazi"] = {
                    dim: (float(vm.get(dim, 0.0)) + float(vf.get(dim, 0.0))) / 2
                    for dim in DIMENSIONS
                }
            continue
        struktur = load_struktur(system_name)
        if not struktur:
            continue
        rules = load_rules(system_name)
        if contribution_records is not None:
            contrib: Dict[str, bool] = {}
            vector = compute_vector(struktur, rules, inputs, system_name=system_name, track_contributions=contrib)
            contribution_records.append((system_name, contrib))
        else:
            vector = compute_vector(struktur, rules, inputs, system_name=system_name)
        vektoren[system_name] = {dim: float(vector.get(dim, 0.0)) for dim in DIMENSIONS}
    return vektoren


def random_birth_datetime(
    year_min: int,
    year_max: int,
    rng: random.Random,
) -> datetime:
    year = rng.randint(year_min, year_max)
    month = rng.randint(1, 12)
    day = rng.randint(1, 28)
    return datetime(year, month, day, 12, 0, 0)


def run_simulation(
    runs: int,
    year_min: int,
    year_max: int,
    seed: int | None,
) -> Tuple[Dict[str, Dict[str, List[float]]], List[str], List[str]]:
    """
    Sammelt pro System und Dimension alle Vektorwerte über alle Läufe.
    Returns: (values_per_system_dim[system][dim] = list of values), systems, dimensions.
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
        luck_pillar_for_both_sexes,
    )
    from bazi_chart import build_four_pillars  # pylint: disable=import-error

    rng = random.Random(seed)
    # Bazi geschlechtsneutral (ein Vektor); Systemliste = SUBFOLDERS
    system_names = list(SUBFOLDERS)
    values_per_system_dim: Dict[str, Dict[str, List[float]]] = {
        s: {d: [] for d in DIMENSIONS} for s in system_names
    }
    contribution_records: List[Tuple[str, Dict[str, bool]]] = []

    for _ in range(runs):
        birth_dt = random_birth_datetime(year_min, year_max, rng)
        vektoren = get_vektoren_for_birth_date(
            birth_dt,
            build_inputs=build_inputs,
            build_four_pillars=build_four_pillars,
            luck_pillar_for_both_sexes=luck_pillar_for_both_sexes,
            load_struktur=load_struktur,
            load_rules=load_rules,
            compute_vector=compute_vector,
            DIMENSIONS=DIMENSIONS,
            SUBFOLDERS=SUBFOLDERS,
            contribution_records=contribution_records,
        )
        for system, vec in vektoren.items():
            if system not in values_per_system_dim:
                values_per_system_dim[system] = {d: [] for d in DIMENSIONS}
            for dim, val in vec.items():
                values_per_system_dim[system][dim].append(val)

    # Auswertung: wie oft kam jede Quelle (Aspekt, Transit, …) pro System zum Tragen?
    by_system: Dict[str, List[Dict[str, bool]]] = defaultdict(list)
    for system_name, contrib in contribution_records:
        by_system[system_name].append(contrib)
    print("\n--- Beitrags-Häufigkeit (wie oft lieferte eine Quelle einen nicht-null Overlay) ---")
    for system_name in sorted(by_system.keys()):
        recs = by_system[system_name]
        total = len(recs)
        all_sources = set()
        for c in recs:
            all_sources.update(c.keys())
        print(f"  {system_name} (n={total} Läufe):")
        for src in sorted(all_sources):
            count = sum(1 for c in recs if c.get(src, False))
            pct = 100.0 * count / total if total else 0
            print(f"    {src}: {count}/{total} ({pct:.1f}%)")
    print("")

    systems = [s for s in values_per_system_dim if any(values_per_system_dim[s][d] for d in DIMENSIONS)]
    return values_per_system_dim, systems, DIMENSIONS


def build_single_histogram(
    values: List[float],
    bin_min: float,
    bin_max: float,
    num_bins: int,
):
    """Binned Histogramm für eine einzelne Werteliste. Returns (bin_edges, counts)."""
    import numpy as np
    bin_edges = list(np.linspace(bin_min, bin_max, num_bins + 1))
    if not values:
        return bin_edges, [0.0] * num_bins
    hist, _ = np.histogram(values, bins=bin_edges)
    return bin_edges, [float(c) for c in hist]


def get_dimension_weight(system: str, dim: str) -> float:
    """Gewichtungsfaktor für (System, Dimension); 0 = transparent, 1 = volle Sättigung."""
    sys_weights = DIMENSION_WEIGHTS.get(system, {})
    return float(sys_weights.get(dim, 1.0))


def plot_single_dim_histogram(
    ax,
    bin_edges: List[float],
    counts: List[float],
    color: str,
    alpha: float = 1.0,
) -> None:
    """Zeichnet ein Balken-Histogramm für eine Dimension; alpha = Sättigung (Gewichtungsfaktor)."""
    import numpy as np
    num_bins = len(counts)
    bin_width = (bin_edges[-1] - bin_edges[0]) / num_bins
    x = np.array(bin_edges[:-1]) + bin_width / 2
    ax.bar(x, counts, width=bin_width * 0.95, color=color, edgecolor="none", alpha=alpha)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Histogramm der Vektorwerte (-1..+1) pro System: 8 Dimensionen + 1 Gesamt (9 Zeilen je System)."
    )
    parser.add_argument("--runs", type=int, default=500, help="Anzahl Geburtsdaten (default: 500).")
    parser.add_argument("--year-min", type=int, default=1970)
    parser.add_argument("--year-max", type=int, default=2010)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--bins", type=int, default=20, help="Anzahl Bins (default: 20, -1..+1).")
    parser.add_argument("-o", "--output", type=str, default=None, help="Ausgabedatei (default: tools/output/vector_value_histogram.png)")
    args = parser.parse_args()

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import numpy as np
    except ImportError as e:
        raise SystemExit("Dieses Skript benötigt matplotlib und numpy: pip install matplotlib numpy") from e

    print("Sammle Vektorwerte über zufällige Geburtsdaten...")
    values_per_system_dim, systems, dimensions = run_simulation(
        args.runs, args.year_min, args.year_max, args.seed
    )

    bin_min, bin_max = -1.0, 1.0
    num_bins = args.bins
    bin_edges, _ = build_single_histogram([], bin_min, bin_max, num_bins)

    # Pro System: 9 Zeilen (8 Dimensionen + 1 Gesamt), eine Spalte = ein System-Block
    n_dims = len(dimensions)
    n_systems = len(systems)
    n_rows = n_dims + 1  # 8 Dimensionen + Gesamt
    fig, axes = plt.subplots(n_rows, n_systems, figsize=(2.2 * n_systems, 1.8 * n_rows), sharex="col", sharey="row")
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
            weight = get_dimension_weight(system, dim)
            plot_single_dim_histogram(ax, bin_edges, counts, color, alpha=weight)
            ax.set_xlim(bin_min, bin_max)
            ax.set_xticks([-1, 0, 1])
            if col == 0:
                ax.set_ylabel(dim, fontsize=8)
            if row == 0:
                ax.set_title(system, fontsize=9)
            if row == n_dims - 1:
                ax.set_xlabel("-1..+1", fontsize=7)
            ax.tick_params(axis="both", labelsize=6)
        # Zeile 9: Gesamthistogramm (alle Dimensionen des Systems zusammengefasst)
        ax_gesamt = axes[n_dims, col]
        all_vals = []
        for dim in dimensions:
            all_vals.extend(values_per_system_dim[system].get(dim, []))
        _, counts_gesamt = build_single_histogram(all_vals, bin_min, bin_max, num_bins)
        plot_single_dim_histogram(ax_gesamt, bin_edges, counts_gesamt, GESAMT_COLOR, alpha=1.0)
        ax_gesamt.set_xlim(bin_min, bin_max)
        ax_gesamt.set_xticks([-1, 0, 1])
        if col == 0:
            ax_gesamt.set_ylabel("Gesamt", fontsize=8)
        ax_gesamt.set_xlabel("-1..+1", fontsize=7)
        ax_gesamt.tick_params(axis="both", labelsize=6)

    # X-Achse aller Subplots fest auf -1 bis 1 fixieren
    for ax in axes.flat:
        ax.set_xlim(-1.0, 1.0)
        ax.set_xticks([-1.0, 0.0, 1.0])

    plt.tight_layout()
    out = Path(args.output) if args.output else OUTPUT_DIR / "vector_value_histogram.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(out, dpi=120)
    plt.close()
    print(f"Gespeichert: {out}")


if __name__ == "__main__":
    main()
