#!/usr/bin/env python3
"""
Gewinner-Verteilung bei zufälligen Nutzerbewertungen.

Simuliert viele Durchläufe: pro Durchlauf ein zufälliges Geburtsdatum,
echte System-Vektoren (rule_engine) + KO, Nutzer antwortet rein zufällig
(-1 bis +1). Ermittelt pro Durchlauf den Gewinner (höchster Skill) und
führt eine Statistik: Wie oft gewinnt welches System?

Hintergrund: Systeme, die oft um 0,5 liegen (z. B. Westlich), können bei
Nutzer:innen, die ebenfalls um 0,5 bewerten, fälschlich hohen Skill
erzielen – reine Statistik, kein echter Treffer. Dieser Test zeigt, ob
bestimmte Systeme bei Zufalls-Nutzer:innen überproportional oft gewinnen.
"""

from __future__ import annotations

import argparse
import json
import math
import random
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
OUTPUT_DIR = ROOT / "tools" / "output"

RANDOM_BASELINE_MSE = 2.0 / 3.0

SYSTEME = ["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Vedisch"]


def load_matrix() -> dict:
    path = BACKEND_DIR / "dimensionen_matrix.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def load_questions() -> List[dict]:
    import sys
    sys.path.insert(0, str(BACKEND_DIR))
    from horoskop_assessment import FRAGEN  # pylint: disable=import-error
    return FRAGEN


def get_question_weights(
    systems: List[str], dimension: str, frage_gewichte: Dict[str, float], matrix: dict
) -> Dict[str, float]:
    konsens = matrix.get("konsens_gewichtung", {})
    raws = []
    for system in systems:
        matrix_weight = float(konsens.get(dimension, {}).get(system, 0.0))
        if matrix_weight == 0.0 and system == "KO":
            matrix_weight = 1.0 / max(1, len(systems))
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


def get_vektoren_for_birth_date(birth_dt: datetime) -> Dict[str, Dict[str, float]]:
    """Echte Vektoren aller Systeme + KO für ein Geburtsdatum (T0)."""
    import sys
    sys.path.insert(0, str(BACKEND_DIR))
    from rule_engine import (  # pylint: disable=import-error
        DIMENSIONS,
        SUBFOLDERS,
        build_inputs,
        compute_vector,
        load_rules,
        load_struktur,
        control_vector,
    )
    now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    inputs = build_inputs(birth_dt, now)
    vektoren: Dict[str, Dict[str, float]] = {}
    for system_name in SUBFOLDERS:
        struktur = load_struktur(system_name)
        if not struktur:
            continue
        rules = load_rules(system_name)
        vec = compute_vector(struktur, rules, inputs, system_name=system_name)
        vektoren[system_name] = {d: float(vec.get(d, 0.0)) for d in DIMENSIONS}
    seed = birth_dt.year * 10000 + birth_dt.month * 100 + birth_dt.day
    vektoren["KO"] = control_vector(seed)
    return vektoren


def random_birth_datetime(year_min: int, year_max: int, rng: random.Random) -> datetime:
    year = rng.randint(year_min, year_max)
    month = rng.randint(1, 12)
    day = rng.randint(1, 28)
    return datetime(year, month, day, 12, 0, 0)


def run_one_game(
    vektoren: Dict[str, Dict[str, float]],
    fragen: List[dict],
    matrix: dict,
    systems: List[str],
    rng: random.Random,
    user_mode: str,
) -> str:
    """
    Ein Spiel: Nutzer bewertet zufällig, Ranking nach Skill. Returns Name des Gewinners.
    user_mode: "uniform" = U(-1,1), "neutral" = stärker um 0 (z.B. Normal(0,0.4) gekappt).
    """
    kumul_fehler = {s: 0.0 for s in systems}
    kumul_gewicht = {s: 0.0 for s in systems}

    for frage in fragen:
        dim = frage["dimension"]
        frage_gewichte = frage.get("gewichte", {})
        if user_mode == "neutral":
            selbst = rng.gauss(0.0, 0.4)
            selbst = max(-1.0, min(1.0, selbst))
        else:
            selbst = rng.uniform(-1.0, 1.0)
        expected = selbst
        system_werte = {s: vektoren.get(s, {}).get(dim, 0.0) for s in systems}
        weights = get_question_weights(systems, dim, frage_gewichte, matrix)

        for system in systems:
            w = weights.get(system, 0.0)
            if w <= 0:
                continue
            wert = system_werte.get(system, 0.0)
            diff = expected - wert
            fehler = diff * diff
            kumul_fehler[system] += fehler * w
            kumul_gewicht[system] += w

    normiert = {}
    for system in systems:
        if kumul_gewicht[system] > 0:
            normiert[system] = kumul_fehler[system] / kumul_gewicht[system]

    def skill(s: str) -> float:
        if s not in normiert:
            return -1e9
        mse = normiert[s]
        return 100.0 * (1.0 - mse / RANDOM_BASELINE_MSE)

    ranking = sorted(
        [s for s in systems if s in normiert],
        key=lambda s: (skill(s), -normiert.get(s, 1e9)),
        reverse=True,
    )
    if not ranking:
        return "—"
    return ranking[0]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Gewinner-Statistik bei zufälligen Nutzerbewertungen (echte Systemvektoren)."
    )
    parser.add_argument("--runs", type=int, default=5000, help="Anzahl Spiele (default: 5000).")
    parser.add_argument("--year-min", type=int, default=1970)
    parser.add_argument("--year-max", type=int, default=2010)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument(
        "--user-mode",
        choices=["uniform", "neutral"],
        default="uniform",
        help="uniform: U(-1,1). neutral: stärker um 0 (simuliert unklare Bewerter).",
    )
    parser.add_argument(
        "--include-ko",
        action="store_true",
        help="KO in der Gewinner-Statistik mitführen (ansonsten nur 7 Systeme).",
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Optional: CSV/JSON mit Gewinner-Zählung speichern.",
    )
    args = parser.parse_args()

    systems = list(SYSTEME)
    if args.include_ko:
        systems.append("KO")

    fragen = load_questions()
    matrix = load_matrix()
    rng = random.Random(args.seed)

    print("Simuliere Spiele (echte Vektoren, zufällige Nutzer)...")
    winner_counts: Counter = Counter()
    for i in range(args.runs):
        birth_dt = random_birth_datetime(args.year_min, args.year_max, rng)
        vektoren = get_vektoren_for_birth_date(birth_dt)
        winner = run_one_game(vektoren, fragen, matrix, systems, rng, args.user_mode)
        winner_counts[winner] += 1
        if (i + 1) % 1000 == 0:
            print(f"  {i + 1}/{args.runs} Läufe …")

    total = args.runs
    print()
    print("=" * 60)
    print("GEWINNER-VERTEILUNG (Zufalls-Nutzer, echte Systemvektoren)")
    print("=" * 60)
    print(f"Runs: {total}")
    print(f"User-Modus: {args.user_mode}")
    print("-" * 60)
    print(f"{'System':<16} {'Siege':>10} {'Anteil':>10}")
    print("-" * 60)
    for system in systems:
        count = winner_counts.get(system, 0)
        pct = 100.0 * count / total
        print(f"{system:<16} {count:>10} {pct:>9.1f} %")
    print("-" * 60)
    if total > 0:
        erw = 100.0 / len(systems)
        print(f"Erwartung bei reinem Zufall: je ~{erw:.1f} %")
    print()
    print("Hinweis: Überproportional viele Siege für ein System deuten auf einen")
    print("Neutral-Effekt (System und Nutzer oft um 0,5) – nicht auf echten Skill.")
    print("=" * 60)

    if args.output:
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "runs": total,
            "user_mode": args.user_mode,
            "winner_counts": dict(winner_counts),
            "systems": systems,
        }
        if out.suffix.lower() == ".json":
            with out.open("w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        else:
            with out.open("w", encoding="utf-8") as f:
                f.write("system,siege,anteil_pct\n")
                for system in systems:
                    count = winner_counts.get(system, 0)
                    pct = 100.0 * count / total
                    f.write(f"{system},{count},{pct:.2f}\n")
        print(f"Gespeichert: {out}")


if __name__ == "__main__":
    main()
