#!/usr/bin/env python3
"""
Monte-Carlo-Test der Skill-Metrik perzentil_v1 (Skill = 2 * (Perzentil - 50)).

Nutzt exakt die Spiel-Pipeline: Systemvektoren aus /vektor, Kontrollvektoren aus
/kontrolle (je System N zufaellige Geburtsdaten), Fragen und Gewichte aus
backend/fragen.json (wie /fragen) und eine 1:1-Portierung von frontend/src/logic/rating.js.

Szenarien:
  1. Nullhypothese: Antworten haben nichts mit dem Geburtsdatum zu tun
     (verschiedene Antwortstile). Erwartung: Skill je System im Mittel 0,
     gleichverteilt auf [-100, 100] (SD ~57.7); Sieger im Mittel 100*(k-1)/(k+1).
  2. Sensitivitaet: Ein System "hat recht" - die Antworten korrelieren mit seinem
     Vektor (Korrelation r). Zeigt, wie oft ein einzelnes Spiel das sichtbar macht.

Ausgabe je Szenario und System: Mittelwert, Standardabweichung, Standardfehler,
Anteil Spiele mit Skill > 0 und Skill >= 50, Siege; dazu die Verteilung des Siegers.

Mit --spiel b wird Spiel B (Rueckblick) getestet: /rueckblick + /rueckblick/kontrolle,
Fragen aus backend/fragen_rueckblick.json, Skill getrennt fuer Monat und Quartal (nur Nullhypothese).

Beispiel:
  python3 tools/skill_metric_test.py --runs 2000 --kontrolle 100 --cache tools/output/skill_sim.json
  python3 tools/skill_metric_test.py --spiel b --runs 500 --cache tools/output/skill_sim_b.json
"""

from __future__ import annotations

import argparse
import contextlib
import io
import json
import math
import random
import statistics
import sys
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime, timedelta
from pathlib import Path
from typing import Callable, Dict, List, Optional

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
FRAGEN_JSON = BACKEND_DIR / "fragen.json"

SYSTEME = ["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Vedisch"]
SYSTEME_B = ["Westlich", "Bazi", "Hellenistisch", "Numerologie"]
FRAGEN_B_JSON = ROOT / "backend" / "fragen_rueckblick.json"


# ── Daten erzeugen (Spiel-Pipeline) ────────────────────────────────────────────

def _simulate_person(args: tuple) -> dict:
    index, seed, kontroll_anzahl, year_min, year_max = args
    sys.path.insert(0, str(BACKEND_DIR))
    import main as M  # pylint: disable=import-error

    rng = random.Random(f"{seed}:{index}")
    start = datetime(year_min, 1, 1)
    tage = (datetime(year_max, 12, 31) - start).days
    birth = start + timedelta(days=rng.randrange(tage + 1), minutes=rng.randrange(1440))
    datum, zeit = birth.strftime("%Y-%m-%d"), birth.strftime("%H:%M")
    session_id = f"sim-{seed}-{index}"
    with contextlib.redirect_stdout(io.StringIO()):
        v = M.post_vektor(M.VektorRequest(geburtsdatum=datum, uhrzeit=zeit, systeme=SYSTEME, session_id=session_id))
        k = M.post_kontrolle(M.KontrollRequest(
            geburtsdatum=datum, uhrzeit=zeit, systeme=SYSTEME, session_id=session_id,
            stichtag=v.inputs["stichtag"], kontroll_anzahl=kontroll_anzahl,
        ))
    return {"geburtsdatum": datum, "uhrzeit": zeit, "vektoren": v.vektoren, "kontroll": k.kontrollvektoren}


def _simulate_person_b(args: tuple) -> dict:
    """Spiel B: Fenster-Mittel fuer das echte Datum und die Kontroll-Geburtsdaten."""
    index, seed, kontroll_anzahl, year_min, year_max = args
    sys.path.insert(0, str(BACKEND_DIR))
    import main as M  # pylint: disable=import-error

    rng = random.Random(f"{seed}:{index}")
    start = datetime(year_min, 1, 1)
    tage = (datetime(year_max, 12, 31) - start).days
    birth = start + timedelta(days=rng.randrange(tage + 1), minutes=rng.randrange(1440))
    datum, zeit = birth.strftime("%Y-%m-%d"), birth.strftime("%H:%M")
    session_id = f"simb-{seed}-{index}"
    with contextlib.redirect_stdout(io.StringIO()):
        r = M.post_rueckblick(M.VektorRequest(geburtsdatum=datum, uhrzeit=zeit, systeme=SYSTEME_B, session_id=session_id))
        k = M.post_rueckblick_kontrolle(M.KontrollRequest(
            geburtsdatum=datum, uhrzeit=zeit, systeme=SYSTEME_B, session_id=session_id,
            stichtag=r["inputs"]["stichtag"], kontroll_anzahl=kontroll_anzahl,
        ))
    return {f: {"vektoren": r["mittel"][f], "kontroll": k["kontrollvektoren"][f]} for f in r["mittel"]}


def generate_personen(runs: int, seed: int, kontroll_anzahl: int, year_min: int, year_max: int, workers: int,
                      simulate: Callable = _simulate_person) -> List[dict]:
    jobs = [(i, seed, kontroll_anzahl, year_min, year_max) for i in range(runs)]
    personen: List[dict] = []
    with ProcessPoolExecutor(max_workers=workers) as pool:
        for i, person in enumerate(pool.map(simulate, jobs, chunksize=8), start=1):
            personen.append(person)
            if i % 250 == 0 or i == runs:
                print(f"  {i}/{runs} Personen berechnet", file=sys.stderr)
    return personen


def load_matrix() -> dict:
    sys.path.insert(0, str(BACKEND_DIR))
    with contextlib.redirect_stdout(io.StringIO()):
        import main as M  # pylint: disable=import-error
        return M.get_matrix()


def load_fragen() -> List[dict]:
    """Fragen so, wie das Spiel sie ueber /fragen verwendet."""
    return json.loads(FRAGEN_JSON.read_text(encoding="utf-8"))["fragen"]


# ── Rating (Portierung von frontend/src/logic/rating.js) ──────────────────────

def get_question_weights(systems: List[str], dimension: str, frage_gewichte: dict, matrix: dict) -> Dict[str, float]:
    konsens = matrix.get("konsens_gewichtung", {})
    raws = [(s, float(konsens.get(dimension, {}).get(s, 0.0)) * float(frage_gewichte.get(s, 1.0))) for s in systems]
    total = sum(r for _, r in raws)
    if total <= 0:
        raws = [(s, float(frage_gewichte.get(s, 1.0))) for s in systems]
        total = sum(r for _, r in raws)
    if total <= 0:
        return {s: 1.0 / max(1, len(systems)) for s in systems}
    return {s: r / total for s, r in raws}


def calculate_perzentil(mse: float, kontroll_mse: List[float]) -> Optional[float]:
    if not kontroll_mse:
        return None
    schlechter = sum(1 for w in kontroll_mse if w > mse)
    gleich = sum(1 for w in kontroll_mse if w == mse)
    return 100.0 * (schlechter + 0.5 * gleich) / len(kontroll_mse)


def skill_scores(person: dict, antworten: List[float], fragen: List[dict], matrix: dict, systeme: List[str]) -> Dict[str, float]:
    """Skill je System fuer eine Person und eine Antwortreihe (gleiche Reihenfolge wie fragen)."""
    vektoren = person["vektoren"]
    alle = list(vektoren.keys())  # wie im Frontend: Gewichte ueber alle Vektor-Keys normiert
    fehler = {s: 0.0 for s in systeme}
    gewicht = {s: 0.0 for s in systeme}
    kontroll = {s: [0.0] * len(person["kontroll"].get(s, [])) for s in systeme}
    for frage, selbst in zip(fragen, antworten):
        dim = frage["dimension"]
        gewichte = get_question_weights(alle, dim, {s: frage.get("gewichte", {}).get(s, 1.0) for s in alle}, matrix)
        for s in systeme:
            w = gewichte.get(s, 0.0)
            if not w:
                continue
            fehler[s] += (selbst - float(vektoren[s][dim])) ** 2 * w
            gewicht[s] += w
            for i, kv in enumerate(person["kontroll"].get(s, [])):
                kontroll[s][i] += (selbst - float(kv.get(dim, 0.0))) ** 2 * w
    result = {}
    for s in systeme:
        if gewicht[s] <= 0:
            continue
        perz = calculate_perzentil(fehler[s] / gewicht[s], [k / gewicht[s] for k in kontroll[s]])
        if perz is not None:
            result[s] = 2.0 * (perz - 50.0)
    return result


# ── Antwortmodelle ────────────────────────────────────────────────────────────

def slider(x: float) -> float:
    """Wie der Slider im Spiel: -1..+1 in 0.1-Schritten."""
    return round(max(-1.0, min(1.0, x)) * 10) / 10


NULL_STILE: Dict[str, Callable[[random.Random], float]] = {
    "zufaellig (gleichverteilt)": lambda r: slider(r.uniform(-1, 1)),
    "positiv geneigt (Mittel +0.4)": lambda r: slider(r.gauss(0.4, 0.4)),
    "zurueckhaltend (nahe 0)": lambda r: slider(r.gauss(0.0, 0.25)),
    "extrem (meist +-1)": lambda r: slider(r.choice([-1, 1]) * (1 - abs(r.gauss(0, 0.15)))),
}


def dim_statistik(personen: List[dict], system: str) -> Dict[str, tuple]:
    """Mittelwert/SD je Dimension ueber die Population (fuer z-Standardisierung)."""
    dims = personen[0]["vektoren"][system].keys()
    stats = {}
    for d in dims:
        werte = [float(p["vektoren"][system][d]) for p in personen]
        sd = statistics.pstdev(werte)
        stats[d] = (statistics.fmean(werte), sd if sd > 1e-9 else 1.0)
    return stats


# ── Auswertung ────────────────────────────────────────────────────────────────

def zusammenfassen(werte: List[float]) -> dict:
    n = len(werte)
    mean = statistics.fmean(werte)
    sd = statistics.stdev(werte) if n > 1 else 0.0
    return {
        "n": n, "mean": mean, "sd": sd, "se": sd / math.sqrt(n) if n else 0.0,
        "p_pos": 100.0 * sum(1 for w in werte if w > 0) / n,
        "p_50": 100.0 * sum(1 for w in werte if w >= 50) / n,
    }


def drucke_szenario(titel: str, skills: List[Dict[str, float]], systeme: List[str], fokus: Optional[str] = None) -> dict:
    k = len(systeme)
    print()
    print("=" * 96)
    print(titel)
    print("=" * 96)
    print(f"{'System':<14}{'Mittel':>9}{'SD':>8}{'SE':>7}{'Skill>0':>10}{'Skill>=50':>11}{'Siege':>9}")
    print("-" * 96)
    sieger = [max(s, key=s.get) for s in skills]
    out = {}
    for system in systeme:
        z = zusammenfassen([s[system] for s in skills if system in s])
        siege = 100.0 * sieger.count(system) / len(skills)
        mark = "  <- hat recht" if system == fokus else ""
        print(f"{system:<14}{z['mean']:>+9.1f}{z['sd']:>8.1f}{z['se']:>7.1f}{z['p_pos']:>9.0f}%{z['p_50']:>10.0f}%{siege:>8.0f}%{mark}")
        out[system] = {**z, "siege_pct": siege}
    best = zusammenfassen([max(s.values()) for s in skills])
    print("-" * 96)
    print(f"{'Sieger':<14}{best['mean']:>+9.1f}{best['sd']:>8.1f}{best['se']:>7.1f}{best['p_pos']:>9.0f}%{best['p_50']:>10.0f}%")
    print(f"Theorie ohne Aussagekraft: je System Mittel 0, SD 57.7, Skill>=50 in 25%, Siege je {100 / k:.0f}%;"
          f" Sieger Mittel {100 * (k - 1) / (k + 1):+.1f}, Skill>=50 in {100 * (1 - 0.75 ** k):.0f}%")
    out["_sieger"] = best
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Monte-Carlo-Test der Skill-Metrik perzentil_v1.")
    parser.add_argument("--runs", type=int, default=2000, help="Anzahl simulierter Personen (default: 2000).")
    parser.add_argument("--kontrolle", type=int, default=100, help="Kontroll-Geburtsdaten je Person (default: 100 wie im Spiel).")
    parser.add_argument("--year-min", type=int, default=1945)
    parser.add_argument("--year-max", type=int, default=2008)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--korrelationen", type=str, default="0.2,0.4,0.6",
                        help="Korrelationen fuer den Sensitivitaetstest (default: 0.2,0.4,0.6).")
    parser.add_argument("--sensitiv-system", type=str, default="Westlich", help="System, das im Sensitivitaetstest recht hat.")
    parser.add_argument("--cache", type=str, default=None, help="JSON-Datei: simulierte Personen laden/speichern.")
    parser.add_argument("--json-out", type=str, default=None, help="Optional: Ergebnisse als JSON speichern.")
    parser.add_argument("--spiel", choices=["a", "b"], default="a", help="a = Persoenlichkeit (default), b = Rueckblick.")
    args = parser.parse_args()
    if args.spiel == "b":
        main_b(args)
        return

    personen = None
    if args.cache and Path(args.cache).exists():
        personen = json.loads(Path(args.cache).read_text(encoding="utf-8"))
        print(f"Personen aus Cache: {args.cache} ({len(personen)})", file=sys.stderr)
        personen = personen[: args.runs]
    if personen is None:
        print(f"Berechne {args.runs} Personen x {args.kontrolle} Kontrolldaten ...", file=sys.stderr)
        personen = generate_personen(args.runs, args.seed, args.kontrolle, args.year_min, args.year_max, args.workers)
        if args.cache:
            Path(args.cache).parent.mkdir(parents=True, exist_ok=True)
            Path(args.cache).write_text(json.dumps(personen), encoding="utf-8")

    fragen = load_fragen()
    matrix = load_matrix()
    rng = random.Random(args.seed)
    ergebnisse = {}

    print(f"Personen: {len(personen)}, Kontrolldaten je Person: {len(personen[0]['kontroll'][SYSTEME[0]])}, "
          f"Fragen: {len(fragen)} (backend/fragen.json)")

    for stil, antwort in NULL_STILE.items():
        skills = [skill_scores(p, [antwort(rng) for _ in fragen], fragen, matrix, SYSTEME) for p in personen]
        ergebnisse[f"null:{stil}"] = drucke_szenario(f"NULLHYPOTHESE - Antwortstil: {stil}", skills, SYSTEME)

    fokus = args.sensitiv_system
    stats = dim_statistik(personen, fokus)
    for r in [float(x) for x in args.korrelationen.split(",") if x.strip()]:
        skills = []
        for p in personen:
            antworten = []
            for frage in fragen:
                mean, sd = stats[frage["dimension"]]
                z = (float(p["vektoren"][fokus][frage["dimension"]]) - mean) / sd
                latent = r * z + math.sqrt(1 - r * r) * rng.gauss(0, 1)
                antworten.append(slider(0.5 * latent))
            skills.append(skill_scores(p, antworten, fragen, matrix, SYSTEME))
        ergebnisse[f"sensitiv:{fokus}:r={r}"] = drucke_szenario(
            f"SENSITIVITAET - {fokus} hat recht, Korrelation Antwort/Systemwert r = {r}", skills, SYSTEME, fokus)

    if args.json_out:
        Path(args.json_out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.json_out).write_text(json.dumps(ergebnisse, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nGespeichert: {args.json_out}")


def main_b(args: argparse.Namespace) -> None:
    """Spiel B: Nullhypothese je Zeitfenster (Skill getrennt fuer Monat und Quartal)."""
    personen = None
    if args.cache and Path(args.cache).exists():
        personen = json.loads(Path(args.cache).read_text(encoding="utf-8"))[: args.runs]
        print(f"Personen aus Cache: {args.cache} ({len(personen)})", file=sys.stderr)
    if personen is None:
        print(f"Berechne {args.runs} Personen (Spiel B) x {args.kontrolle} Kontrolldaten ...", file=sys.stderr)
        personen = generate_personen(args.runs, args.seed, args.kontrolle, args.year_min, args.year_max,
                                     args.workers, simulate=_simulate_person_b)
        if args.cache:
            Path(args.cache).parent.mkdir(parents=True, exist_ok=True)
            Path(args.cache).write_text(json.dumps(personen), encoding="utf-8")

    fragen_b = json.loads(FRAGEN_B_JSON.read_text(encoding="utf-8"))["gewertet"]
    matrix = load_matrix()
    rng = random.Random(args.seed)
    print(f"Spiel B - Personen: {len(personen)}, Systeme: {', '.join(SYSTEME_B)}")
    ergebnisse = {}
    for fenster in ("monat", "quartal"):
        fragen = [f for f in fragen_b if f["fenster"] == fenster]
        for stil, antwort in NULL_STILE.items():
            skills = [skill_scores(p[fenster], [antwort(rng) for _ in fragen], fragen, matrix, SYSTEME_B) for p in personen]
            ergebnisse[f"{fenster}:{stil}"] = drucke_szenario(
                f"SPIEL B {fenster.upper()} - NULLHYPOTHESE - Antwortstil: {stil}", skills, SYSTEME_B)
    if args.json_out:
        Path(args.json_out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.json_out).write_text(json.dumps(ergebnisse, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
