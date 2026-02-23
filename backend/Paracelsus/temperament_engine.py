#!/usr/bin/env python3
"""
Temperament Engine
==================
Übersetzungsschicht über allen 7 Systemen — implementiert das Humoraltypen-Meta-System.

Schritte 2 + 3 aus dem Projektplan:
  - berechne_temperament()  → aggregiert System-Outputs zum Gesamt-Temperament
  - get_temperament_*()     → extrahiert das Temperament pro System aus den Natal-Daten

Mapping-Datei: humoraltypen_mapping.json
Einbindung:    in rating_engine.py / rating_session.rating() als zusätzliches Feld

Verwendung:
    from temperament_engine import TemperamentEngine

    engine = TemperamentEngine()

    # Schritt 3: Temperament pro System extrahieren
    system_vektoren = {
        "Westlich":      engine.get_temperament_westlich("schuetze"),
        "Bazi":          engine.get_temperament_bazi("yang_feuer"),
        "Numerologie":   engine.get_temperament_numerologie(3),
        "Kabbalah":      engine.get_temperament_kabbalah("6_tiphareth"),
        "Arabisch":      engine.get_temperament_arabisch(date(1990, 6, 15), date.today()),
        "Hellenistisch": engine.get_temperament_hellenistisch("mars", sekt_konform=True),
        "Japanisch":     engine.get_temperament_japanisch("mars_md"),
    }

    # Schritt 2: Aggregieren
    ergebnis = engine.berechne_temperament(system_vektoren)
    print(ergebnis["primaer"])       # z.B. "cholerisch"
    print(ergebnis["mischtyp"])      # z.B. "cholerisch-melancholisch"
    print(ergebnis["konfidenz"])     # z.B. 0.78
"""

import json
import os
from datetime import date
from typing import Dict, Optional


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TEMPERAMENTE = ["cholerisch", "sanguinisch", "phlegmatisch", "melancholisch"]

# Firdaria-Perioden: (Planet, Alter-von, Alter-bis)
# Tagesgeburt und Nachtgeburt haben unterschiedliche Sequenzen — wir verwenden
# hier die Standard-Sequenz (Tagesgeburt). Für Nachtgeburt: Mond und Sonne tauschen.
FIRDARIA_TAG = [
    ("sonne",    0,  10),
    ("venus",   10,  18),
    ("merkur",  18,  27),
    ("mond",    27,  36),
    ("saturn",  36,  45),
    ("jupiter", 45,  53),
    ("mars",    53,  64),
    ("sonne",   64,  74),   # zweite Runde beginnt
    ("venus",   74,  82),
]

FIRDARIA_NACHT = [
    ("mond",    0,   9),
    ("saturn",   9,  18),
    ("jupiter", 18,  27),
    ("mars",    27,  36),
    ("sonne",   36,  45),
    ("venus",   45,  53),
    ("merkur",  53,  64),
    ("mond",    64,  74),
    ("saturn",  74,  82),
]


class TemperamentEngine:
    """
    Liest das humoraltypen_mapping.json und stellt alle Extraktions-
    und Aggregationsmethoden bereit.
    """

    def __init__(self, mapping_pfad: Optional[str] = None):
        if mapping_pfad is None:
            mapping_pfad = os.path.join(BASE_DIR, "humoraltypen_mapping.json")
        with open(mapping_pfad, encoding="utf-8") as f:
            self.mapping = json.load(f)
        self.system_mappings   = self.mapping["system_mappings"]
        self.aggregation       = self.mapping["aggregation"]
        self.system_gewichte   = self.aggregation["system_gewichte"]
        self.system_konfidenzen = {
            s: self.system_mappings[s]["konfidenz"]
            for s in self.system_mappings
        }

    # ─────────────────────────────────────────────────────────────────────────
    # SCHRITT 3: get_temperament() pro System
    # ─────────────────────────────────────────────────────────────────────────

    def get_temperament_westlich(self, sonnenzeichen: str) -> Optional[str]:
        """
        Gibt das Temperament für ein westliches Sonnenzeichen zurück.

        Parameters:
            sonnenzeichen: klein, z.B. "schuetze", "widder", "fische"

        Returns:
            Temperament-String oder None wenn nicht gefunden.

        Grenzfall Merkur: "variabel" → nicht als eigenes Temperament, None.
        """
        mapping = self.system_mappings["Westlich"]["zeichen_zu_temperament"]
        return mapping.get(sonnenzeichen.lower())

    def get_temperament_westlich_planet(
        self, planet: str, fallback_zeichen: Optional[str] = None
    ) -> Optional[str]:
        """
        Gibt das Temperament für einen westlichen Planeten zurück.
        Merkur ist "variabel" → Fallback auf das Zeichen in dem Merkur steht.

        Parameters:
            planet:           z.B. "mars", "sonne", "merkur"
            fallback_zeichen: Zeichen in dem Merkur steht (nur bei Merkur relevant)
        """
        pm = self.system_mappings["Westlich"]["planeten_zu_temperament"]
        t = pm.get(planet.lower())
        if t == "variabel":
            if fallback_zeichen:
                return self.get_temperament_westlich(fallback_zeichen)
            return None  # Merkur ohne Kontext → kein Temperament
        return t

    def get_temperament_bazi(
        self, day_master: str
    ) -> Optional[str]:
        """
        Gibt das Temperament für einen Bazi Day Master zurück.

        Parameters:
            day_master: Format "yang_feuer", "yin_erde", "yang_holz" etc.
                        Alternativ nur das Element: "feuer", "holz" usw.
                        → dann wird yang angenommen.

        Grenzfall Erde:
            yang_erde  → melancholisch (primär)
            yin_erde   → phlegmatisch  (primär — sanftere Erde-Qualität)
        """
        qm = self.system_mappings["Bazi"]["qualitaeten_mapping"]

        key = day_master.lower().replace(" ", "_")

        # Wenn nur Element angegeben (ohne yang/yin) → yang als Default
        if key not in qm:
            key = f"yang_{key}"

        eintrag = qm.get(key)
        if eintrag:
            return eintrag["temperament"]

        # Letzter Fallback: Element-zu-Temperament (einfaches Mapping)
        element = key.split("_")[-1] if "_" in key else key
        em = self.system_mappings["Bazi"]["element_zu_temperament"]
        eintrag = em.get(element)
        if isinstance(eintrag, dict):
            return eintrag["primaer"]
        return eintrag

    def get_temperament_numerologie(
        self, lebenspfadzahl: int
    ) -> Optional[str]:
        """
        Gibt das Temperament für eine Numerologie-Lebenspfadzahl zurück.

        Parameters:
            lebenspfadzahl: 1–9, 11, 22, 33

        Meisterzahlen (11, 22, 33) werden direkt gemappt.
        """
        lpz_mapping = self.system_mappings["Numerologie"]["lpz_zu_temperament"]
        eintrag = lpz_mapping.get(str(lebenspfadzahl))
        if eintrag:
            return eintrag["temperament"]
        return None

    def get_temperament_kabbalah(
        self, sephira_key: str
    ) -> Optional[str]:
        """
        Gibt das Temperament für eine Kabbalah-Sephira zurück.

        Parameters:
            sephira_key: z.B. "6_tiphareth", "3_binah", "1_kether"

        Grenzfall Kether (1_kether): hat keine Temperament-Zuordnung → None.
        Dieses System wird dann aus der Aggregation ausgeschlossen.
        """
        sm = self.system_mappings["Kabbalah"]["sephira_zu_temperament"]
        eintrag = sm.get(sephira_key)
        if not eintrag:
            return None
        t = eintrag.get("temperament")
        if t == "keine_zuordnung":
            return None  # Kether → Ausschluss aus Aggregation
        return t

    def get_temperament_arabisch(
        self,
        geburtsdatum: date,
        heute: date,
        tagesgeburt: bool = True,
    ) -> Optional[str]:
        """
        Gibt das Temperament für das aktuelle Firdaria zurück.

        Parameters:
            geburtsdatum: Geburtsdatum der Person
            heute:        Referenzdatum (normalerweise date.today())
            tagesgeburt:  True wenn Sonne über dem Horizont bei Geburt (Tag-Firdaria-Sequenz)
                          False für Nacht-Firdaria-Sequenz

        Grenzfall Merkur: "variabel" → None (kein Temperament-Beitrag).
        """
        alter = (heute - geburtsdatum).days / 365.25
        sequenz = FIRDARIA_TAG if tagesgeburt else FIRDARIA_NACHT

        aktiver_planet = None
        for planet, von, bis in sequenz:
            if von <= alter < bis:
                aktiver_planet = planet
                break

        if aktiver_planet is None:
            # Jenseits der Tabelle (>82 Jahre) → letzter Planet
            aktiver_planet = sequenz[-1][0]

        pm = self.system_mappings["Arabisch"]["planet_zu_temperament"]
        eintrag = pm.get(aktiver_planet)
        if not eintrag:
            return None
        t = eintrag.get("temperament")
        if t == "variabel":
            return None  # Merkur → kein Beitrag
        return t

    def get_temperament_hellenistisch(
        self,
        herrschender_planet: str,
        sekt_konform: bool = True,
        fallback_zeichen: Optional[str] = None,
    ) -> Optional[str]:
        """
        Gibt das Temperament für das hellenistische System zurück.
        Primär über den herrschenden Planeten des Horoskops (Bound Lord oder
        Sect Light-Herrscher).

        Parameters:
            herrschender_planet: z.B. "mars", "saturn", "jupiter"
            sekt_konform:        True wenn der Planet sektkonform ist (erhöhte Konfidenz)
                                 False bei Gegensekt-Planet (leicht abgeschwächtes Signal)
            fallback_zeichen:    Sonnenzeichen für Merkur-Fallback

        Das Sekt-System beeinflusst hier nicht das Temperament selbst,
        sondern ist ein Qualitäts-Marker — wir verwenden es um Merkur-variabel
        zu behandeln.

        Grenzfall Merkur: → Fallback auf Zeichen, sonst None.
        """
        # Hellenistisch nutzt dasselbe Planeten-zu-Temperament wie Westlich
        pm = self.system_mappings["Westlich"]["planeten_zu_temperament"]
        t = pm.get(herrschender_planet.lower())
        if t == "variabel":
            if fallback_zeichen:
                return self.get_temperament_westlich(fallback_zeichen)
            return None
        return t

    def get_temperament_japanisch(
        self, mahadasha_planet: str
    ) -> Optional[str]:
        """
        Gibt das Temperament für das aktuelle Mahadasha (Jyotish/Vedisch) zurück.

        Parameters:
            mahadasha_planet: z.B. "mars_md", "sonne_md", "saturn_md"
                              Alternativ ohne _md-Suffix: "mars", "saturn" etc.

        Grenzfall Vata-Ambiguität:
            Vata wird als sanguinisch gewertet (Balance-Zustand ist der Ausgangspunkt).
            Bei "vata_pitta" (Merkur) → pitta-Tendenz dominiert → cholerisch.
            Bei "vata_kapha" (Mond, Venus) → kapha dominiert → phlegmatisch.
        """
        md_key = mahadasha_planet.lower()
        if not md_key.endswith("_md"):
            md_key = f"{md_key}_md"

        md_mapping = self.system_mappings["Japanisch"]["mahadasha_zu_dosha"]
        dosha = md_mapping.get(md_key)
        if not dosha or dosha == "note":
            return None

        # Gemischte Doshas auflösen
        dosha_primaer = self._dosha_aufloesen(dosha)

        dt_mapping = self.system_mappings["Japanisch"]["dosha_zu_temperament"]
        eintrag = dt_mapping.get(dosha_primaer)
        if eintrag:
            return eintrag["temperament"]
        return None

    def _dosha_aufloesen(self, dosha: str) -> str:
        """
        Löst gemischte Dosha-Strings auf.

        "vata_pitta"  → "pitta"  (Feuer dominiert über Luft)
        "vata_kapha"  → "kapha"  (Erde/Wasser dominiert über Luft)
        "pitta"       → "pitta"  (unveränderlich)
        """
        if "_" not in dosha:
            return dosha
        teile = dosha.split("_")
        # Hierarchie: kapha > pitta > vata (nach ayurvedischer Konstitutions-Theorie)
        hierarchie = {"kapha": 3, "pitta": 2, "vata": 1}
        return max(teile, key=lambda d: hierarchie.get(d, 0))

    # ─────────────────────────────────────────────────────────────────────────
    # SCHRITT 2: berechne_temperament() — Aggregation
    # ─────────────────────────────────────────────────────────────────────────

    def berechne_temperament(
        self,
        system_vektoren: Dict[str, Optional[str]],
    ) -> Dict:
        """
        Aggregiert die Temperament-Zuordnungen aller Systeme zu einem
        Gesamt-Temperament.

        Parameters:
            system_vektoren: Dict mit Systemnamen als Schlüssel und
                             Temperament-Strings (oder None) als Werte.
                             None bedeutet: System hat keine gültige Zuordnung
                             → wird aus der Aggregation ausgeschlossen.

                             Beispiel:
                             {
                               "Westlich":      "cholerisch",
                               "Bazi":          "melancholisch",
                               "Numerologie":   "cholerisch",
                               "Kabbalah":      None,          # Kether
                               "Arabisch":      "cholerisch",
                               "Hellenistisch": "cholerisch",
                               "Japanisch":     "phlegmatisch",
                             }

        Returns:
            {
              "primaer":           "cholerisch",
              "sekundaer":         "melancholisch",  # wenn ≥25% Gewicht, sonst None
              "mischtyp":          "cholerisch-melancholisch",
              "verteilung": {
                "cholerisch":   0.52,
                "sanguinisch":  0.08,
                "phlegmatisch": 0.10,
                "melancholisch":0.30
              },
              "system_zuordnungen": {
                "Westlich":      "cholerisch",
                "Bazi":          "melancholisch",
                ...
                "Kabbalah":      None,   # ausgeschlossen
              },
              "aktive_systeme":     ["Westlich", "Bazi", ...],  # ohne None-Einträge
              "ausgeschlossen":     ["Kabbalah"],
              "konsistenz":         0.75,  # Anteil des Primär-Temperaments (0–1)
              "konfidenz":          0.78,  # gewichteter Schnitt der Systemkonfidenzen
            }

        Grenzfälle:
            - Kether (Kabbalah None) → System ausgeschlossen
            - Merkur variabel → None → ausgeschlossen
            - Gleichstand zweier Temperamente → beide als primär (Liste)
            - Alle Systeme None → leeres Ergebnis
        """
        stimmen: Dict[str, float] = {t: 0.0 for t in TEMPERAMENTE}
        aktive_systeme = []
        ausgeschlossen = []
        gewicht_summe = 0.0
        konfidenz_summe = 0.0

        for system, temperament in system_vektoren.items():
            if temperament is None or temperament not in TEMPERAMENTE:
                ausgeschlossen.append(system)
                continue

            gewicht   = self.system_gewichte.get(system, 0.5)
            konfidenz = self.system_konfidenzen.get(system, 0.5)
            beitrag   = gewicht * konfidenz

            stimmen[temperament] += beitrag
            aktive_systeme.append(system)
            gewicht_summe   += beitrag
            konfidenz_summe += beitrag

        if gewicht_summe == 0:
            return {
                "fehler":            "Keine aktiven Systeme — alle Zuordnungen sind None.",
                "system_zuordnungen": system_vektoren,
                "aktive_systeme":    [],
                "ausgeschlossen":    ausgeschlossen,
            }

        # Normierte Verteilung
        verteilung = {t: round(v / gewicht_summe, 4) for t, v in stimmen.items()}

        # Ranking
        sortiert = sorted(verteilung.items(), key=lambda x: -x[1])
        max_anteil     = sortiert[0][1]
        zweiter_anteil = sortiert[1][1]

        # Gleichstand: beide als primär wenn Differenz < 2%
        if abs(max_anteil - zweiter_anteil) < 0.02:
            primaer  = [sortiert[0][0], sortiert[1][0]]
            sekundaer = None
            mischtyp  = f"{primaer[0]}-{primaer[1]}"
        else:
            primaer   = sortiert[0][0]
            sekundaer = sortiert[1][0] if zweiter_anteil >= 0.25 else None
            mischtyp  = (
                f"{primaer}-{sekundaer}" if sekundaer else
                (primaer if isinstance(primaer, str) else "-".join(primaer))
            )

        # Konfidenz: gewichteter Schnitt der aktiven Systeme
        aktive_gewichte = [
            self.system_gewichte.get(s, 0.5)
            for s in aktive_systeme
        ]
        aktive_konfidenzen = [
            self.system_konfidenzen.get(s, 0.5)
            for s in aktive_systeme
        ]
        if aktive_gewichte:
            konfidenz = sum(
                w * k for w, k in zip(aktive_gewichte, aktive_konfidenzen)
            ) / sum(aktive_gewichte)
        else:
            konfidenz = 0.0

        # Konsistenz: Anteil des Primär-Temperaments
        if isinstance(primaer, list):
            konsistenz = max_anteil
        else:
            konsistenz = verteilung[primaer]

        return {
            "primaer":            primaer,
            "sekundaer":          sekundaer,
            "mischtyp":           mischtyp,
            "verteilung":         verteilung,
            "system_zuordnungen": system_vektoren,
            "aktive_systeme":     aktive_systeme,
            "ausgeschlossen":     ausgeschlossen,
            "konsistenz":         round(konsistenz, 4),
            "konfidenz":          round(konfidenz, 4),
        }

    def temperament_profil(self, temperament: str) -> Optional[dict]:
        """
        Gibt das vollständige Profil eines Temperaments zurück
        (Name, Element, Dimensionsvektor, etc.) aus dem Mapping.
        """
        return self.mapping["temperament_profile"].get(temperament)

    def mischtyp_beschreibung(self, mischtyp: str) -> Optional[str]:
        """
        Gibt die Beschreibung eines Mischtyps zurück (aus aggregation.misch_typen).
        """
        beispiele = self.aggregation.get("misch_typen", {}).get("beispiele", [])
        for b in beispiele:
            if b.startswith(mischtyp + ":"):
                return b.split(": ", 1)[1]
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Integration: RatingSession erweitern
# ─────────────────────────────────────────────────────────────────────────────

def temperament_aus_rating_session(
    engine: "TemperamentEngine",
    system_vektoren: Dict[str, Optional[str]],
) -> Dict:
    """
    Wrapper der das Temperament-Ergebnis in das Format der RatingSession integriert.
    Kann direkt in RatingSession.rating() eingebunden werden:

        ergebnis["temperament"] = temperament_aus_rating_session(engine, vektoren)

    Parameters:
        engine:           TemperamentEngine-Instanz
        system_vektoren:  {Systemname: Temperament-String oder None}

    Returns:
        Vollständiges Temperament-Dict mit Profil-Anhang.
    """
    ergebnis = engine.berechne_temperament(system_vektoren)

    if "fehler" in ergebnis:
        return ergebnis

    # Profil anhängen
    p = ergebnis["primaer"]
    primaer_key = p[0] if isinstance(p, list) else p
    ergebnis["profil_primaer"] = engine.temperament_profil(primaer_key)

    if ergebnis["sekundaer"]:
        ergebnis["profil_sekundaer"] = engine.temperament_profil(ergebnis["sekundaer"])

    # Mischtyp-Beschreibung
    if ergebnis["mischtyp"] and "-" in ergebnis["mischtyp"]:
        ergebnis["mischtyp_beschreibung"] = engine.mischtyp_beschreibung(
            ergebnis["mischtyp"]
        )

    return ergebnis


# ─────────────────────────────────────────────────────────────────────────────
# Demo
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    print("=" * 65)
    print("TEMPERAMENT ENGINE — DEMO")
    print("=" * 65)

    engine = TemperamentEngine()

    # ── Beispiel-Person ──────────────────────────────────────────────────────
    # Schütze-Sonne, Yang-Feuer Day Master, LPZ 5,
    # Sephira Geburah, Firdaria-Alter ~35 (Mond-Periode),
    # Mars als hellenistischer Herrschaftsplanet,
    # Mars-Mahadasha (vedisch)

    system_vektoren = {
        "Westlich":      engine.get_temperament_westlich("schuetze"),
        "Bazi":          engine.get_temperament_bazi("yang_feuer"),
        "Numerologie":   engine.get_temperament_numerologie(5),
        "Kabbalah":      engine.get_temperament_kabbalah("5_geburah"),
        "Arabisch":      engine.get_temperament_arabisch(
                             geburtsdatum=date(1990, 6, 15),
                             heute=date(2026, 2, 22),
                             tagesgeburt=True
                         ),
        "Hellenistisch": engine.get_temperament_hellenistisch("mars"),
        "Japanisch":     engine.get_temperament_japanisch("mars_md"),
    }

    print("\nSYSTEM-ZUORDNUNGEN:")
    print("─" * 40)
    for system, temperament in system_vektoren.items():
        t_str = temperament if temperament else "— (ausgeschlossen)"
        print(f"  {system:<16} → {t_str}")

    ergebnis = temperament_aus_rating_session(engine, system_vektoren)

    print(f"\n{'═' * 65}")
    print("ERGEBNIS")
    print(f"{'═' * 65}")
    print(f"\n  Primär-Temperament:  {ergebnis['primaer']}")
    print(f"  Sekundär:            {ergebnis['sekundaer'] or '—'}")
    print(f"  Mischtyp:            {ergebnis['mischtyp']}")
    print(f"  Konsistenz:          {ergebnis['konsistenz']:.0%}")
    print(f"  Konfidenz:           {ergebnis['konfidenz']:.0%}")

    print(f"\n  VERTEILUNG:")
    for t, anteil in sorted(ergebnis["verteilung"].items(), key=lambda x: -x[1]):
        balken = "█" * int(anteil * 30)
        print(f"    {t:<14} {anteil:>5.1%}  {balken}")

    if ergebnis.get("ausgeschlossen"):
        print(f"\n  Ausgeschlossen: {', '.join(ergebnis['ausgeschlossen'])}")

    if ergebnis.get("profil_primaer"):
        p = ergebnis["profil_primaer"]
        primaer_key = (
            ergebnis["primaer"][0]
            if isinstance(ergebnis["primaer"], list)
            else ergebnis["primaer"]
        )
        print(f"\n  PROFIL — {p['name'].upper()} ({primaer_key})")
        print(f"    Element:  {p['element']}  |  Planet: {p['planet']}")
        print(f"    Stärken:  {', '.join(p['positive'][:3])}")
        print(f"    Herausforderungen: {', '.join(p['herausforderungen'][:2])}")

    print(f"\n  {'─' * 60}")

    # ── Grenzfall-Tests ───────────────────────────────────────────────────────
    print("\nGRENZFALL-TESTS:")
    print("─" * 40)

    # Kether → None
    kether = engine.get_temperament_kabbalah("1_kether")
    print(f"  Kether-Sephira:        {kether!r}  → korrekt None (ausgeschlossen)")

    # Merkur (variabel) ohne Fallback
    merkur_t = engine.get_temperament_westlich_planet("merkur")
    print(f"  Merkur ohne Fallback:  {merkur_t!r}  → korrekt None")

    # Merkur mit Zeichen-Fallback
    merkur_f = engine.get_temperament_westlich_planet("merkur", fallback_zeichen="zwillinge")
    print(f"  Merkur in Zwillinge:   {merkur_f!r}  → sanguinisch")

    # Bazi Yin-Erde (phlegmatisch primär)
    yin_erde = engine.get_temperament_bazi("yin_erde")
    print(f"  Yin-Erde (Bazi):       {yin_erde!r}  → phlegmatisch")

    # Yang-Erde (melancholisch primär)
    yang_erde = engine.get_temperament_bazi("yang_erde")
    print(f"  Yang-Erde (Bazi):      {yang_erde!r}  → melancholisch")

    # Numerologie Meisterzahl 22
    mz22 = engine.get_temperament_numerologie(22)
    print(f"  Meisterzahl 22:        {mz22!r}  → melancholisch")

    # Vata_Pitta (Merkur-Mahadasha) → pitta dominiert → cholerisch
    vp = engine.get_temperament_japanisch("merkur_md")
    print(f"  Merkur-Mahadasha:      {vp!r}  → cholerisch (pitta über vata)")

    # Vata_Kapha (Venus-Mahadasha) → kapha dominiert → phlegmatisch
    vk = engine.get_temperament_japanisch("venus_md")
    print(f"  Venus-Mahadasha:       {vk!r}  → phlegmatisch (kapha über vata)")

    # Alle Systeme None → Fehler-Handling
    leere_vektoren = {s: None for s in ["Westlich", "Bazi", "Kabbalah"]}
    leer_ergebnis = engine.berechne_temperament(leere_vektoren)
    print(f"  Alle None:             'fehler' im Dict → {bool('fehler' in leer_ergebnis)}")

    print(f"\n{'═' * 65}\n")
