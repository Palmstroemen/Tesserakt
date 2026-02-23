#!/usr/bin/env python3
"""
Rating Engine
=============
Vergleicht Selbsteinschätzung des Users mit den Vorhersagen der Systeme.
Berechnet pro System einen kumulativen Fehler — am Ende ein Rating welches
System die Selbsteinschätzung am besten getroffen hat.

Mathematik:
  Für jede Frage f und jedes System s:
    fehler(s,f) = (selbsteinschätzung(f) - system_wert(s,f))²  [oder Absolutwert]

  Gewichtet mit dem Konfidenzgewicht w(s,d) aus dimensionen_matrix.json:
    gewichteter_fehler(s,f) = fehler(s,f) × w(s, dimension(f))

  Kumuliert über alle Fragen:
    gesamt_fehler(s) = Σ gewichteter_fehler(s,f)

  Normiert auf 0-100 (100 = bestes System):
    rating(s) = 100 × (1 - gesamt_fehler(s) / max_fehler)
"""

import json
import os
import math
from typing import Dict, List, Optional

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SYSTEME = ["Westlich", "Bazi", "Numerologie", "Kabbalah",
           "Arabisch", "Hellenistisch", "Japanisch"]

SYSTEM_KUERZEL = {
    "Westlich":"A", "Bazi":"B", "Numerologie":"N",
    "Kabbalah":"K", "Arabisch":"AR", "Hellenistisch":"H", "Japanisch":"J"
}
KUERZEL_SYSTEM = {v: k for k, v in SYSTEM_KUERZEL.items()}

DIMENSIONS = ["liebe","beruf","finanzen","gesundheit","soziales",
              "kreativitaet","veraenderung","spiritualitaet"]


# ── Laden ──────────────────────────────────────────────────────────────────────

def load_matrix() -> dict:
    path = os.path.join(BASE_DIR, "dimensionen_matrix.json")
    if not os.path.exists(path):
        print("[WARN] dimensionen_matrix.json nicht gefunden — verwende Gleichgewichtung.")
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)

MATRIX = load_matrix()

def get_gewicht(system: str, dimension: str) -> float:
    """
    Gibt das Konfidenzgewicht eines Systems für eine Dimension zurück.
    0.0 = System macht zu dieser Dimension keine sinnvolle Aussage.
    1.0 = maximale Konfidenz.
    Werte aus dimensionen_matrix.json / konsens_gewichtung.
    """
    gewichtungen = MATRIX.get("konsens_gewichtung", {})
    dim_gewichte = gewichtungen.get(dimension, {})
    w = dim_gewichte.get(system, None)

    if w is None:
        # Fallback: Gleichgewichtung wenn keine Matrix vorhanden
        return 1.0 / len(SYSTEME)

    return w


# ── Kern-Berechnung ────────────────────────────────────────────────────────────

class RatingSession:
    """
    Verwaltet eine Bewertungssession:
    - nimmt Fragen und Antworten entgegen
    - akkumuliert Fehler pro System
    - liefert am Ende ein Rating
    """

    def __init__(self, methode: str = "quadratisch"):
        """
        methode: "quadratisch" (MSE-ähnlich) oder "absolut" (MAE-ähnlich)
        """
        assert methode in ("quadratisch", "absolut"), \
            "methode muss 'quadratisch' oder 'absolut' sein"
        self.methode           = methode
        self.fragen: List[dict]= []
        self.kumul_fehler      = {s: 0.0 for s in SYSTEME}
        self.kumul_gewicht     = {s: 0.0 for s in SYSTEME}
        self.fragen_count      = 0

    def antwort_hinzufuegen(
        self,
        dimension: str,
        selbsteinschaetzung: float,
        system_werte: Dict[str, float],
        frage_text: str = ""
    ):
        """
        Verarbeitet eine beantwortete Frage.

        Parameters:
            dimension:           z.B. "finanzen"
            selbsteinschaetzung: User-Wert 1-5
            system_werte:        {"Westlich": 2.8, "Arabisch": 3.5, ...}
                                 Schlüssel können Systemnamen oder Kürzel sein
            frage_text:          optional, für Protokoll
        """
        assert dimension in DIMENSIONS, f"Unbekannte Dimension: {dimension}"
        assert 1 <= selbsteinschaetzung <= 5, "Selbsteinschätzung muss 1-5 sein"

        # Kürzel → Systemname normalisieren
        normiert = {}
        for key, val in system_werte.items():
            system = KUERZEL_SYSTEM.get(key, key)
            if system in SYSTEME:
                normiert[system] = float(val)

        eintrag = {
            "frage":              frage_text,
            "dimension":          dimension,
            "selbsteinschaetzung":selbsteinschaetzung,
            "system_werte":       normiert,
            "fehler_pro_system":  {},
            "gewicht_pro_system": {},
        }

        for system in SYSTEME:
            w = get_gewicht(system, dimension)

            if system not in normiert:
                # System hat keinen Wert für diese Dimension geliefert
                # → trägt nicht zum Fehler bei (w=0 oder kein Datenpunkt)
                eintrag["fehler_pro_system"][system]  = None
                eintrag["gewicht_pro_system"][system] = 0.0
                continue

            differenz = selbsteinschaetzung - normiert[system]

            if self.methode == "quadratisch":
                fehler = differenz ** 2
            else:
                fehler = abs(differenz)

            gewichteter_fehler = fehler * w

            self.kumul_fehler[system]  += gewichteter_fehler
            self.kumul_gewicht[system] += w

            eintrag["fehler_pro_system"][system]  = round(fehler, 4)
            eintrag["gewicht_pro_system"][system] = round(w, 4)

        self.fragen.append(eintrag)
        self.fragen_count += 1

    def rating(self) -> Dict:
        """
        Berechnet das finale Rating aller Systeme.

        Rückgabe:
        {
          "methode": "quadratisch",
          "fragen_count": 8,
          "systeme": {
            "Westlich": {
              "kumul_fehler":          1.23,
              "kumul_gewicht":         3.50,
              "normierter_fehler":     0.35,   # fehler / gewicht
              "rating_0_100":          82.4,
              "rang":                  1
            }, ...
          },
          "ranking": ["Westlich", "Numerologie", ...]   # beste zuerst
        }
        """
        if self.fragen_count == 0:
            return {"fehler": "Keine Fragen beantwortet."}

        # Normierter Fehler pro System: kumul_fehler / kumul_gewicht
        # → vergleichbar auch wenn Systeme unterschiedlich viele Fragen beantwortet haben
        normiert = {}
        for s in SYSTEME:
            if self.kumul_gewicht[s] > 0:
                normiert[s] = self.kumul_fehler[s] / self.kumul_gewicht[s]
            else:
                normiert[s] = None  # System hat zu keiner Frage beigetragen

        # Nur Systeme mit Werten ranken
        aktive = {s: v for s, v in normiert.items() if v is not None}
        if not aktive:
            return {"fehler": "Kein System hat Daten geliefert."}

        max_fehler = max(aktive.values()) if aktive else 1.0
        min_fehler = min(aktive.values()) if aktive else 0.0
        spanne = max_fehler - min_fehler if max_fehler != min_fehler else 1.0

        systeme_result = {}
        for s in SYSTEME:
            if normiert[s] is None:
                systeme_result[s] = {
                    "kumul_fehler":      None,
                    "kumul_gewicht":     0.0,
                    "normierter_fehler": None,
                    "rating_0_100":      None,
                    "rang":              None,
                    "hinweis":           "Keine relevanten Dimensionen abgedeckt"
                }
            else:
                # Rating: 100 = kein Fehler, 0 = maximaler Fehler
                # Lineare Normierung innerhalb der Spanne der aktiven Systeme
                rating = 100 * (1 - (normiert[s] - min_fehler) / spanne)
                systeme_result[s] = {
                    "kumul_fehler":      round(self.kumul_fehler[s], 4),
                    "kumul_gewicht":     round(self.kumul_gewicht[s], 4),
                    "normierter_fehler": round(normiert[s], 4),
                    "rating_0_100":      round(rating, 1),
                    "rang":              None,  # wird unten gesetzt
                }

        # Rang vergeben
        ranking = sorted(
            [s for s in SYSTEME if systeme_result[s]["rating_0_100"] is not None],
            key=lambda s: systeme_result[s]["rating_0_100"],
            reverse=True
        )
        for rang, s in enumerate(ranking, 1):
            systeme_result[s]["rang"] = rang

        return {
            "methode":      self.methode,
            "fragen_count": self.fragen_count,
            "systeme":      systeme_result,
            "ranking":      ranking,
        }

    def protokoll(self) -> List[dict]:
        """Gibt alle beantworteten Fragen mit Fehlerdetails zurück."""
        return self.fragen


# ── Hilfsfunktion: Fragen aus Vektoren ableiten ───────────────────────────────

# Mapping: natürlichsprachliche Aussagen → Dimension(en) + Gewichte
AUSSAGEN_MAPPING = {
    # Finanzen
    "Ich bin geschickt in finanziellen Angelegenheiten.":
        {"finanzen": 1.0},
    "Ich spare regelmäßig und plane langfristig.":
        {"finanzen": 0.7, "beruf": 0.3},
    "Geld kommt und geht bei mir leicht.":
        {"finanzen": 1.0},

    # Beruf
    "Ich bin ehrgeizig und karriereorientiert.":
        {"beruf": 1.0},
    "Ich bin gut darin, andere zu führen.":
        {"beruf": 0.6, "soziales": 0.4},
    "Ich bin produktiv und diszipliniert.":
        {"beruf": 0.8, "gesundheit": 0.2},

    # Liebe
    "Ich bin ein liebevoller und fürsorglicher Partner.":
        {"liebe": 1.0},
    "Ich finde leicht romantische Verbindungen.":
        {"liebe": 0.7, "soziales": 0.3},

    # Soziales
    "Ich bin gerne unter Menschen.":
        {"soziales": 1.0},
    "Ich knüpfe leicht neue Bekanntschaften.":
        {"soziales": 0.8, "liebe": 0.2},
    "Ich bin eher ein Einzelgänger.":
        {"soziales": 1.0},  # niedrige Selbstbewertung = stimmt zu

    # Kreativität
    "Ich bin ein kreativer Mensch.":
        {"kreativitaet": 1.0},
    "Ich habe viele originelle Ideen.":
        {"kreativitaet": 0.8, "beruf": 0.2},

    # Gesundheit
    "Ich achte sehr auf meine Gesundheit.":
        {"gesundheit": 1.0},
    "Ich habe generell viel Energie und Vitalität.":
        {"gesundheit": 0.8, "veraenderung": 0.2},

    # Veränderung
    "Ich bin offen für Veränderungen in meinem Leben.":
        {"veraenderung": 1.0},
    "Ich suche aktiv neue Erfahrungen.":
        {"veraenderung": 0.7, "kreativitaet": 0.3},

    # Spiritualität
    "Spirituelle Themen sind wichtig für mich.":
        {"spiritualitaet": 1.0},
    "Ich vertraue meiner Intuition.":
        {"spiritualitaet": 0.6, "liebe": 0.2, "kreativitaet": 0.2},
}

def dimension_aus_aussage(aussage: str) -> Optional[Dict[str, float]]:
    """Gibt Dimensions-Gewichte für eine Aussage zurück, oder None."""
    return AUSSAGEN_MAPPING.get(aussage)

def hauptdimension(aussage: str) -> Optional[str]:
    """Gibt die stärkste Dimension einer Aussage zurück."""
    mapping = dimension_aus_aussage(aussage)
    if not mapping:
        return None
    return max(mapping, key=mapping.get)

def system_wert_fuer_dimension(
    alle_vektoren: dict,
    dimension: str,
    zeitfenster: str = "T0"
) -> Dict[str, float]:
    """
    Extrahiert den Wert einer Dimension aus allen Systemvektoren.

    Parameters:
        alle_vektoren: Ausgabe von rule_engine.generate_all_vectors()
        dimension:     z.B. "finanzen"
        zeitfenster:   "T0", "T1" oder "T3"

    Returns:
        {"Westlich": 2.8, "Arabisch": 3.5, ...}
    """
    result = {}
    for kuerzel, system_name in KUERZEL_SYSTEM.items():
        if kuerzel in alle_vektoren and zeitfenster in alle_vektoren[kuerzel]:
            wert = alle_vektoren[kuerzel][zeitfenster].get(dimension)
            if wert is not None:
                result[system_name] = wert
    return result


# ── Demo ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    print("=" * 65)
    print("RATING ENGINE — DEMO")
    print("=" * 65)
    print("Simuliert eine Session mit 5 Fragen.\n")

    session = RatingSession(methode="quadratisch")

    # Simulierte System-Vektoren (wie sie aus rule_engine kämen)
    # und simulierte Selbsteinschätzungen des Users

    fragen_demo = [
        {
            "frage":               "Ich bin geschickt in finanziellen Angelegenheiten.",
            "dimension":           "finanzen",
            "selbsteinschaetzung": 2.0,
            "system_werte": {
                "Westlich":2.8, "Bazi":3.5, "Numerologie":2.3,
                "Kabbalah":3.0, "Arabisch":3.5, "Hellenistisch":3.2, "Japanisch":2.9
            }
        },
        {
            "frage":               "Ich bin ein kreativer Mensch.",
            "dimension":           "kreativitaet",
            "selbsteinschaetzung": 4.5,
            "system_werte": {
                "Westlich":4.2, "Numerologie":3.8, "Kabbalah":4.1
                # Bazi, Arabisch, Hellenistisch, Japanisch fehlen → kein Beitrag
            }
        },
        {
            "frage":               "Ich bin gerne unter Menschen.",
            "dimension":           "soziales",
            "selbsteinschaetzung": 3.0,
            "system_werte": {
                "Westlich":2.5, "Numerologie":3.2,
                "Arabisch":2.8, "Hellenistisch":3.1
            }
        },
        {
            "frage":               "Ich bin ehrgeizig und karriereorientiert.",
            "dimension":           "beruf",
            "selbsteinschaetzung": 4.0,
            "system_werte": {
                "Westlich":3.8, "Bazi":4.2, "Numerologie":3.5,
                "Kabbalah":3.0, "Arabisch":4.0, "Hellenistisch":3.9, "Japanisch":4.1
            }
        },
        {
            "frage":               "Spirituelle Themen sind wichtig für mich.",
            "dimension":           "spiritualitaet",
            "selbsteinschaetzung": 4.0,
            "system_werte": {
                "Westlich":3.5, "Numerologie":4.2,
                "Kabbalah":4.5, "Japanisch":3.8
            }
        },
    ]

    # Session befüllen
    for f in fragen_demo:
        session.antwort_hinzufuegen(
            dimension           = f["dimension"],
            selbsteinschaetzung = f["selbsteinschaetzung"],
            system_werte        = f["system_werte"],
            frage_text          = f["frage"]
        )

    # Protokoll ausgeben
    print("PROTOKOLL DER FRAGEN:")
    print("─" * 65)
    for i, f in enumerate(session.protokoll(), 1):
        print(f"\n{i}. {f['frage']}")
        print(f"   Selbsteinschätzung: {f['selbsteinschaetzung']}/5  |  Dimension: {f['dimension']}")
        print(f"   {'System':<14} {'Wert':>5}  {'Fehler²':>8}  {'Gewicht':>8}  {'Gewicht.Fehler':>14}")
        print(f"   {'─'*14} {'─'*5}  {'─'*8}  {'─'*8}  {'─'*14}")
        for s in SYSTEME:
            wert    = f["system_werte"].get(s)
            fehler  = f["fehler_pro_system"].get(s)
            gewicht = f["gewicht_pro_system"].get(s, 0.0)
            if wert is None:
                print(f"   {s:<14} {'—':>5}  {'—':>8}  {'—':>8}  {'—':>14}")
            else:
                gf = fehler * gewicht if fehler is not None else 0
                print(f"   {s:<14} {wert:>5.2f}  {fehler:>8.4f}  {gewicht:>8.4f}  {gf:>14.4f}")

    # Rating ausgeben
    ergebnis = session.rating()

    print(f"\n{'═' * 65}")
    print(f"FINAL RATING  ({ergebnis['methode']}, {ergebnis['fragen_count']} Fragen)")
    print(f"{'═' * 65}")
    print(f"\n{'Rang':<5} {'System':<14} {'Rating':>8}  {'Norm.Fehler':>12}  {'Gew.Summe':>10}")
    print(f"{'─'*5} {'─'*14} {'─'*8}  {'─'*12}  {'─'*10}")

    for s in ergebnis["ranking"]:
        d = ergebnis["systeme"][s]
        print(f"  {d['rang']:<4} {s:<14} {d['rating_0_100']:>7.1f}%  "
              f"{d['normierter_fehler']:>12.4f}  {d['kumul_gewicht']:>10.4f}")

    print(f"\n  🏆 Bestes System: {ergebnis['ranking'][0]}")
    print(f"  📉 Schlechtestes: {ergebnis['ranking'][-1]}")

    nicht_bewertet = [s for s in SYSTEME
                      if ergebnis["systeme"][s]["rating_0_100"] is None]
    if nicht_bewertet:
        print(f"\n  ⚠  Nicht bewertet (zu wenig Dimensionen abgedeckt): "
              f"{', '.join(nicht_bewertet)}")

    print(f"\n{'═' * 65}")
    print("Hinweis: Rating 100% = geringster Fehler, 0% = größter Fehler.")
    print("Systeme ohne Abdeckung der gefragten Dimensionen werden")
    print("nicht benachteiligt — sie bekommen schlicht kein Gewicht.")
    print(f"{'═' * 65}\n")
