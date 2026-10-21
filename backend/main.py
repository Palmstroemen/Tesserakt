from __future__ import annotations

import hashlib
import json
import random
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from arabic_chart import build_firdaria_chart, compute_lot_houses
from bazi_chart import build_four_pillars
from chart import build_radix_wheel
from hellenistisch_chart import build_profection_chart
from kabbalah_chart import build_kabbalah_chart
from numerology_chart import build_numerology_chart
from vedisch_chart import _current_mahadasha, _load_dasha_data, build_dasha_chart, compute_aktivierte_yogas, vimshottari_position_now
from ephemeris import ayanamsha_lahiri, compute as ephemeris_compute, moon_nakshatra, sonne_ueber_horizont, sun_sign_from_longitude
from rule_engine import (
    DIMENSIONS,
    compute_transits,
    SUBFOLDERS,
    build_inputs,
    compute_vector,
    load_rules,
    load_struktur,
    _firdaria_periode,
    luck_pillar_for_both_sexes,
    stem_to_element,
    _HOUSE_LORD,
)
import ausblick
import orte
from store import compare_group, init_db, persist_session

app = FastAPI(title="Tesserakt API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    # Entwicklung: localhost und Geraete im privaten Heimnetz (Handy-Test im WLAN, start-dev.sh --handy).
    # Fuer einen oeffentlichen Betrieb auf die echte Domain beschraenken.
    allow_origin_regex=(
        r"https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}"
        r"|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(:\d+)?$"
    ),
    allow_origins=[],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Alle Systeme sind standardmaessig aktiv; der User kann einzelne abwaehlen.
DEFAULT_SYSTEMS = list(SUBFOLDERS)

# Fragen fuer Spiel A inkl. Gewichte je System (einzige Quelle; das Frontend laedt sie ueber /fragen)
with (Path(__file__).resolve().parent / "fragen.json").open(encoding="utf-8") as _f:
    FRAGEN: List[Dict[str, Any]] = json.load(_f)["fragen"]
# Fragen fuer Spiel C (vergleichend), ausgeliefert ueber /fragen/beziehung
with (Path(__file__).resolve().parent / "fragen_beziehung.json").open(encoding="utf-8") as _f:
    FRAGEN_BEZIEHUNG: Dict[str, Any] = json.load(_f)
# Fragen fuer Spiel B (gewertet + auffaellige Momente), ausgeliefert ueber /fragen/rueckblick
with (Path(__file__).resolve().parent / "fragen_rueckblick.json").open(encoding="utf-8") as _f:
    FRAGEN_RUECKBLICK: Dict[str, Any] = json.load(_f)
SUPPORTED_SYSTEMS = list(SUBFOLDERS)
AVAILABLE_FOR_SELECTION = list(SUPPORTED_SYSTEMS)
# Perzentil-Kontrollgruppe: Vektoren desselben Systems fuer zufaellige Geburtsdaten
# (gleiche Uhrzeit, gleicher Ort, gleiches Geschlecht/Name) im Fenster +-KONTROLL_JAHRE.
KONTROLL_ANZAHL_DEFAULT = 100
KONTROLL_JAHRE = 5

# Spiel B (Rueckblick) fragt, ob das Horoskop fuer einen vergangenen Zeitraum gestimmt haette -
# auch wenn es dem heutigen aehnelt. Daher spielen alle Systeme mit, auch die mit langen Lebensphasen.
SPIEL_B_SYSTEME = list(SUBFOLDERS)
# Stichproben (Tage vor dem Stichtag) je Zeitfenster; das Horoskop des Fensters ist ihr Mittelwert.
RUECKBLICK_FENSTER: Dict[str, List[int]] = {
    "monat": [5, 10, 15, 20, 25, 30],
    "quartal": [10, 20, 30, 40, 50, 60, 70, 80, 90],
}
# Zeitpunkt-Fragen: Hoehepunkt des Systems im Quartal auf diesem Raster (Tage zurueck)
TIMING_RASTER: List[int] = list(range(5, 91, 5))
TIMING_KONSTANT = (TIMING_RASTER[0] + TIMING_RASTER[-1]) / 2  # kein Hoehepunkt -> Mitte des Zeitraums


class VektorRequest(BaseModel):
    geburtsdatum: str = Field(examples=["1985-03-15"])
    uhrzeit: Optional[str] = Field(default="12:00", examples=["14:30"])
    session_id: Optional[str] = Field(default=None, description="Optional; Seed fuer die Kontroll-Geburtsdaten in /kontrolle")
    systeme: List[str] = Field(default_factory=lambda: DEFAULT_SYSTEMS.copy())
    latitude: Optional[float] = Field(default=None, description="Geburtsort Breite (fuer Placidus-Haeuser)")
    longitude: Optional[float] = Field(default=None, description="Geburtsort Laenge (fuer Placidus-Haeuser)")
    geburtsname: Optional[str] = Field(default=None, description="Vollstaendiger Geburtsname fuer Numerologie Namenszahlen (Seelendrang, Ausdruck, Persoenlichkeit)")
    geschlecht: Optional[str] = Field(default=None, description="weiblich | maennlich | keine Angabe")
    zeitzone: Optional[str] = Field(default=None, description="IANA-Zeitzone des Geburtsorts (z. B. Europe/Vienna); ohne Angabe gilt die Uhrzeit als Weltzeit")


class VektorResponse(BaseModel):
    vektoren: Dict[str, Dict[str, float]]
    inputs: Dict[str, object]


class KontrollRequest(VektorRequest):
    session_id: str = Field(description="session_id aus /vektor (Seed der Kontroll-Geburtsdaten)")
    stichtag: Optional[str] = Field(default=None, description="Stichtag aus /vektor (YYYY-MM-DD), damit Zeitregeln identisch sind")
    kontroll_anzahl: int = Field(default=KONTROLL_ANZAHL_DEFAULT, ge=1, le=500, description="Anzahl zufaelliger Geburtsdaten je System fuer die Perzentil-Kontrollgruppe")


class KontrollResponse(BaseModel):
    kontrollvektoren: Dict[str, List[Dict[str, float]]]
    kontrolle: Dict[str, object]


class PartnerRequest(BaseModel):
    """Spiel C: Person A (Spieler:in) und Person B (Partner:in), je mit optionalem Ort, Geschlecht, Name."""
    geburtsdatum_a: str = Field(examples=["1985-03-15"])
    uhrzeit_a: Optional[str] = Field(default="12:00", examples=["14:30"])
    geburtsname_a: Optional[str] = Field(default=None, description="Geburtsname Person A (Numerologie)")
    geschlecht_a: Optional[str] = None
    latitude_a: Optional[float] = None
    longitude_a: Optional[float] = None
    zeitzone_a: Optional[str] = None
    geburtsdatum_b: str = Field(examples=["1990-07-20"])
    uhrzeit_b: Optional[str] = Field(default="12:00", examples=["09:00"])
    geburtsname_b: Optional[str] = Field(default=None, description="Geburtsname Person B (Numerologie)")
    geschlecht_b: Optional[str] = None
    latitude_b: Optional[float] = None
    longitude_b: Optional[float] = None
    zeitzone_b: Optional[str] = None
    systeme: List[str] = Field(default_factory=lambda: DEFAULT_SYSTEMS.copy())
    session_id: Optional[str] = None


class PartnerKontrollRequest(PartnerRequest):
    session_id: str = Field(description="session_id aus /partner (Seed der Kontroll-Paare)")
    stichtag: Optional[str] = None
    kontroll_anzahl: int = Field(default=KONTROLL_ANZAHL_DEFAULT, ge=1, le=500)


class AntwortPayload(BaseModel):
    frage_id: int
    dimension: str
    selbst_wert: float = Field(ge=-1.0, le=1.0, description="User rating -1 (disagree) to +1 (agree)")
    system_werte: Dict[str, float] = Field(default_factory=dict)


class SessionPayload(BaseModel):
    session_id: str
    geburtsdatum: str
    geburtszeit: Optional[str] = "12:00"
    antworten: List[AntwortPayload]
    metadaten: Dict[str, Any] = Field(default_factory=dict)
    inputs: Dict[str, Any] = Field(default_factory=dict)
    rating: Dict[str, Any] = Field(default_factory=dict)
    temperament: Dict[str, Any] = Field(default_factory=dict)
    abgeschlossen: bool = True
    veroeffentlichen: bool = True
    sprache: Optional[str] = Field(default=None, max_length=16, description="Sprache der Fragen, z. B. de")
    geraet_sprache: Optional[str] = Field(default=None, max_length=35, description="Spracheinstellung des Geraets, z. B. de-AT")


def parse_birth_datetime(geburtsdatum: str, uhrzeit: Optional[str]) -> datetime:
    try:
        dt = datetime.strptime(geburtsdatum, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="geburtsdatum muss YYYY-MM-DD sein") from exc

    if not uhrzeit:
        return dt.replace(hour=12, minute=0, second=0, microsecond=0)

    try:
        t = datetime.strptime(uhrzeit, "%H:%M")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="uhrzeit muss HH:MM sein") from exc
    return dt.replace(hour=t.hour, minute=t.minute, second=0, microsecond=0)


def _serialize_inputs(inputs: Dict[str, object]) -> Dict[str, object]:
    serializable = {}
    for key, value in inputs.items():
        if isinstance(value, datetime):
            serializable[key] = value.isoformat()
        else:
            serializable[key] = value
    return serializable


def _compute_system_vector(system_name: str, inputs: Dict[str, object]) -> Dict[str, float]:
    struktur = load_struktur(system_name)
    if not struktur:
        raise HTTPException(status_code=400, detail=f"Unbekanntes oder unvollstaendiges System: {system_name}")

    rules = load_rules(system_name)
    vector = compute_vector(struktur, rules, inputs, system_name=system_name)
    return {dim: float(vector.get(dim, 0.0)) for dim in DIMENSIONS}


_PLANET_ID_DE = {
    "sun": "sonne", "moon": "mond", "mercury": "merkur", "venus": "venus", "mars": "mars",
    "jupiter": "jupiter", "saturn": "saturn", "uranus": "uranus", "neptune": "neptun", "pluto": "pluto",
}
_TRANSIT_SYSTEME = ("Westlich", "Hellenistisch")


@lru_cache(maxsize=512)
def _laufende_positionen(stichtag: datetime) -> Dict[str, float]:
    """Planetenpositionen am Stichtag (gecacht; Kontrollgruppen teilen sich die Stichtage)."""
    eph = ephemeris_compute(stichtag, latitude_deg=None, longitude_deg=None)
    return {_PLANET_ID_DE[p.id]: p.longitude_deg for p in eph.planets if p.id in _PLANET_ID_DE}


@lru_cache(maxsize=512)
def _laufende_zeichen_siderisch(stichtag: datetime) -> Dict[str, int]:
    """Siderische Zeichen (0 = Widder, Lahiri) der laufenden Planeten am Stichtag, inkl. Rahu (mittlerer
    Mondknoten) und Ketu (gegenueber). Fuer Gochara."""
    import swisseph as swe

    eph = ephemeris_compute(stichtag, latitude_deg=None, longitude_deg=None)
    ayan = ayanamsha_lahiri(eph.jd)
    laengen = {_PLANET_ID_DE[p.id]: p.longitude_deg for p in eph.planets if p.id in _PLANET_ID_DE}
    rahu = swe.calc_ut(eph.jd, swe.MEAN_NODE)[0][0]
    laengen["rahu"], laengen["ketu"] = rahu, (rahu + 180.0) % 360.0
    return {pl: int(((lon - ayan) % 360.0) // 30) for pl, lon in laengen.items()}


def _setze_gochara(inputs: Dict[str, object], natal, now: datetime) -> None:
    """Gochara: Haus (ganze Zeichen) jedes laufenden Planeten vom siderischen Zeichen des Geburtsmondes."""
    moon = next((p for p in natal.planets if p.id == "moon"), None)
    if moon is None:
        return
    mond_zeichen = int(((moon.longitude_deg - ayanamsha_lahiri(natal.jd)) % 360.0) // 30)
    inputs["mond_zeichen_siderisch"] = mond_zeichen
    inputs["gochara"] = [
        (pl, (zeichen - mond_zeichen) % 12 + 1) for pl, zeichen in _laufende_zeichen_siderisch(now).items()
    ]


def _setze_transite(inputs: Dict[str, object], natal, now: datetime) -> None:
    """Ersetzt den Kalender-Platzhalter durch echte Transite zu Sonne, Mond (und Aszendent/MC mit Geburtsort)."""
    punkte = {_PLANET_ID_DE[p.id]: p.longitude_deg for p in natal.planets if p.id in ("sun", "moon")}
    if natal.has_location:
        punkte["aszendent"] = natal.asc_deg
        punkte["mc"] = natal.mc_deg
    inputs["transits"] = compute_transits(punkte, _laufende_positionen(now))


def _stable_seed(seed_key: str) -> int:
    digest = hashlib.sha256(seed_key.encode("utf-8")).hexdigest()
    return int(digest[:16], 16)



@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def _startup() -> None:
    init_db()
    orte.suche("xx")  # Ortsindex vorladen (~1 s), damit die erste Suche schnell ist


def _zu_weltzeit(ortszeit: datetime, zeitzone: Optional[str]) -> datetime:
    """Ortszeit am Geburtsort -> Weltzeit (historische Sommerzeitregeln via zoneinfo).
    Ohne Zeitzone wird die Uhrzeit unveraendert als Weltzeit behandelt (bisheriges Verhalten)."""
    if not zeitzone:
        return ortszeit
    try:
        tz = ZoneInfo(zeitzone)
    except (ZoneInfoNotFoundError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Unbekannte Zeitzone: {zeitzone}") from exc
    return ortszeit.replace(tzinfo=tz).astimezone(timezone.utc).replace(tzinfo=None)


def _berechne_vektoren(payload: VektorRequest, birth_dt: datetime, now: datetime, session_id: str):
    """Inputs und Systemvektoren fuer ein Geburtsdatum. Gibt (inputs, vektoren, radix, bazi_pillars) zurueck.
    birth_dt ist Ortszeit; Ephemeris und Sonnenlaenge rechnen mit der daraus bestimmten Weltzeit."""
    birth_ut = _zu_weltzeit(birth_dt, payload.zeitzone)
    # Bazi: four pillars and Da Yun for both sexes (no gender in request)
    bazi_pillars = None
    bazi_luck_male: Optional[tuple] = None
    bazi_luck_female: Optional[tuple] = None
    if "Bazi" in payload.systeme:
        bazi_pillars = build_four_pillars(birth_dt, birth_ut, payload.longitude)
        bazi_luck_male, bazi_luck_female = luck_pillar_for_both_sexes(birth_dt, now, birth_ut)
    bazi_day_branch = bazi_pillars["pillars"]["day"]["branch"] if bazi_pillars else None
    bazi_hour_stem = bazi_pillars["pillars"]["hour"]["stem"] if bazi_pillars else None
    bazi_hour_branch = bazi_pillars["pillars"]["hour"]["branch"] if bazi_pillars else None

    # Precompute ephemeris when Westlich or Vedisch is requested (one run per request)
    ephemeris_result = None
    radix = None
    if any(s in payload.systeme for s in ("Westlich", "Vedisch", "Arabisch", *_TRANSIT_SYSTEME)):
        ephemeris_result = ephemeris_compute(
            birth_ut,
            latitude_deg=payload.latitude,
            longitude_deg=payload.longitude,
        )
    if "Westlich" in payload.systeme and ephemeris_result is not None:
        ephemeris_sonnenzeichen = sun_sign_from_longitude(
            next((p.longitude_deg for p in ephemeris_result.planets if p.id == "sun"), 0.0)
        )
        radix = build_radix_wheel(ephemeris_result)
        inputs = build_inputs(
            birth_dt, now,
            ephemeris_sonnenzeichen=ephemeris_sonnenzeichen,
            radix_planets=radix.get("planets"),
            radix_aspects=radix.get("aspects"),
            bazi_day_branch=bazi_day_branch,
            bazi_hour_stem=bazi_hour_stem,
            bazi_hour_branch=bazi_hour_branch,
            geburtsname=payload.geburtsname,
            geschlecht=payload.geschlecht,
            geburt_ut=birth_ut,
            laengengrad=payload.longitude,
        )
    else:
        inputs = build_inputs(
            birth_dt, now,
            bazi_day_branch=bazi_day_branch,
            bazi_hour_stem=bazi_hour_stem,
            bazi_hour_branch=bazi_hour_branch,
            geburtsname=payload.geburtsname,
            geschlecht=payload.geschlecht,
            geburt_ut=birth_ut,
            laengengrad=payload.longitude,
        )
    if ephemeris_result is not None and any(s in payload.systeme for s in _TRANSIT_SYSTEME):
        _setze_transite(inputs, ephemeris_result, now)
    # Vedisch: nakshatra, Vimshottari position, and activated Yogas from ephemeris when available
    if ephemeris_result and "Vedisch" in payload.systeme:
        moon = next((p for p in ephemeris_result.planets if p.id == "moon"), None)
        if moon is not None:
            idx, anteil = moon_nakshatra(ephemeris_result.jd, moon.longitude_deg)
            inputs["mond_nakshatra_index"] = idx
            inputs["mond_nakshatra_anteil"] = anteil
            alter = inputs.get("lebensalter_exakt", inputs.get("lebensalter", 0))
            inputs["vimshottari_position"] = vimshottari_position_now(idx, anteil, alter)
        _setze_gochara(inputs, ephemeris_result, now)
        inputs["aktivierte_yogas"] = compute_aktivierte_yogas(
            ephemeris_result.asc_deg, ephemeris_result.planets, ayanamsha_lahiri(ephemeris_result.jd)
        )
    # Arabisch: Lot des Glücks und Lot des Geistes aus Ephemeris (Whole-Sign-Haus 1–12)
    if ephemeris_result is not None:
        # Whole-Sign: Zeichen des Aszendenten (0 = Widder) fuer Profektion und Jahresherrscher
        inputs["asc_zeichen"] = int(ephemeris_result.asc_deg // 30) % 12
        # Sekt einheitlich aus dem Sonnenstand (Sekt-Regeln, Firdaria, Lose, Diagramme)
        inputs["tag_geburt"] = sonne_ueber_horizont(ephemeris_result)
    if ephemeris_result and ("Arabisch" in payload.systeme or "Hellenistisch" in payload.systeme):
        sun = next((p for p in ephemeris_result.planets if p.id == "sun"), None)
        moon = next((p for p in ephemeris_result.planets if p.id == "moon"), None)
        if sun is not None and moon is not None:
            lots = compute_lot_houses(ephemeris_result.asc_deg, sun.longitude_deg, moon.longitude_deg, inputs["tag_geburt"])
            inputs["lot_glueck_haus"] = lots["lot_glueck_haus"]
            inputs["lot_geist_haus"] = lots["lot_geist_haus"]

    vektoren: Dict[str, Dict[str, float]] = {}
    for system_name in payload.systeme:
        if system_name == "Bazi":
            # Two vectors: male and female Da Yun direction (no gender in request)
            assert bazi_luck_male is not None and bazi_luck_female is not None
            male_stem, male_branch = bazi_luck_male
            female_stem, female_branch = bazi_luck_female
            inputs_male = {**inputs, "luck_pillar_stem": male_stem, "luck_pillar_branch": male_branch}
            inputs_female = {**inputs, "luck_pillar_stem": female_stem, "luck_pillar_branch": female_branch}
            vektoren["Bazi_male"] = _compute_system_vector("Bazi", inputs_male)
            vektoren["Bazi_female"] = _compute_system_vector("Bazi", inputs_female)
            # Single "Bazi" key for UI/rating: use one pillar if gender given, else average
            if payload.geschlecht == "maennlich":
                vektoren["Bazi"] = dict(vektoren["Bazi_male"])
            elif payload.geschlecht == "weiblich":
                vektoren["Bazi"] = dict(vektoren["Bazi_female"])
            else:
                dims = set(vektoren["Bazi_male"]) | set(vektoren["Bazi_female"])
                vektoren["Bazi"] = {
                    d: (vektoren["Bazi_male"].get(d, 0) + vektoren["Bazi_female"].get(d, 0)) / 2
                    for d in dims
                }
            continue
        vektoren[system_name] = _compute_system_vector(system_name, inputs)
    return inputs, vektoren, radix, bazi_pillars


def _kontroll_geburtsdaten(birth_dt: datetime, session_id: str, anzahl: int, schluessel: str = "kontrolle") -> List[datetime]:
    """Reproduzierbare Zufallsdaten (Seed aus session_id und schluessel) im Fenster +-KONTROLL_JAHRE um das
    Geburtsdatum, gleiche Uhrzeit. Spiel C nutzt eigene Schluessel je Person (kontrolle_a, kontrolle_b)."""
    rng = random.Random(_stable_seed(f"{session_id}:{schluessel}"))
    try:
        start = birth_dt.replace(year=birth_dt.year - KONTROLL_JAHRE)
        ende = birth_dt.replace(year=birth_dt.year + KONTROLL_JAHRE)
    except ValueError:  # 29. Februar
        start = birth_dt.replace(year=birth_dt.year - KONTROLL_JAHRE, day=28)
        ende = birth_dt.replace(year=birth_dt.year + KONTROLL_JAHRE, day=28)
    tage = (ende - start).days
    daten: List[datetime] = []
    while len(daten) < anzahl:
        kandidat = start + timedelta(days=rng.randrange(tage + 1))
        if kandidat.date() != birth_dt.date():
            daten.append(kandidat)
    return daten


def _kontrollvektoren(payload: KontrollRequest, birth_dt: datetime, now: datetime, session_id: str) -> Dict[str, List[Dict[str, float]]]:
    """Je System die Vektoren fuer zufaellige andere Geburtsdaten (Basis fuer das Perzentil)."""
    systeme = list(payload.systeme)
    if not systeme:
        return {}
    kontroll_payload = VektorRequest(**payload.model_dump(include=set(VektorRequest.model_fields))).model_copy(update={"systeme": systeme})
    result: Dict[str, List[Dict[str, float]]] = {s: [] for s in systeme}
    for datum in _kontroll_geburtsdaten(birth_dt, session_id, payload.kontroll_anzahl):
        _, vektoren, _, _ = _berechne_vektoren(kontroll_payload, datum, now, session_id)
        for system_name in systeme:
            result[system_name].append(vektoren[system_name])
    return result


def _validate_systeme(requested: List[str]) -> None:
    if not requested:
        raise HTTPException(status_code=422, detail="Mindestens ein System muss ausgewaehlt werden")
    unknown = [name for name in requested if name not in SUPPORTED_SYSTEMS]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Nicht unterstuetzte Systeme: {', '.join(unknown)}")


@app.post("/vektor", response_model=VektorResponse)
def post_vektor(payload: VektorRequest) -> VektorResponse:
    birth_dt = parse_birth_datetime(payload.geburtsdatum, payload.uhrzeit)
    now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)

    session_id = payload.session_id or str(uuid4())
    _validate_systeme(payload.systeme)

    inputs, vektoren, radix, bazi_pillars = _berechne_vektoren(payload, birth_dt, now, session_id)

    response_inputs = _serialize_inputs(inputs)
    response_inputs.pop("geburtsname", None)
    response_inputs["session_id"] = session_id
    response_inputs["stichtag"] = now.date().isoformat()
    # Geburtsort datensparsam: Zeitzone und auf 1 Grad (~100 km) gerundete Koordinaten
    response_inputs["geburtsort"] = _grober_ort(payload)

    # Attach precomputed chart payloads so frontend has them without extra request
    visual_payloads: Dict[str, Any] = {}
    if radix is not None:
        visual_payloads["Westlich"] = radix
    if "Bazi" in payload.systeme and bazi_pillars is not None:
        visual_payloads["Bazi"] = bazi_pillars
    if "Numerologie" in payload.systeme:
        visual_payloads["Numerologie"] = build_numerology_chart(birth_dt)
    if "Kabbalah" in payload.systeme:
        visual_payloads["Kabbalah"] = build_kabbalah_chart(birth_dt)
    if "Hellenistisch" in payload.systeme:
        visual_payloads["Hellenistisch"] = build_profection_chart(birth_dt, inputs.get("tag_geburt"), inputs.get("asc_zeichen"))
    if "Arabisch" in payload.systeme:
        visual_payloads["Arabisch"] = build_firdaria_chart(birth_dt, inputs.get("tag_geburt"))
    if "Vedisch" in payload.systeme:
        nakshatra_index = inputs.get("mond_nakshatra_index")
        nakshatra_anteil = inputs.get("mond_nakshatra_anteil")
        visual_payloads["Vedisch"] = build_dasha_chart(
            birth_dt,
            nakshatra_index=nakshatra_index if nakshatra_index is not None else None,
            nakshatra_anteil=nakshatra_anteil if nakshatra_anteil is not None else None,
        )
    response_inputs["visualPayloads"] = visual_payloads

    return VektorResponse(vektoren=vektoren, inputs=response_inputs)


@app.post("/kontrolle", response_model=KontrollResponse)
def post_kontrolle(payload: KontrollRequest) -> KontrollResponse:
    """Kontrollvektoren fuer das Perzentil; wird vom Frontend waehrend der Fragephase im Hintergrund geladen."""
    birth_dt = parse_birth_datetime(payload.geburtsdatum, payload.uhrzeit)
    if payload.stichtag:
        try:
            now = datetime.strptime(payload.stichtag, "%Y-%m-%d").replace(hour=12)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="stichtag muss YYYY-MM-DD sein") from exc
    else:
        now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    _validate_systeme(payload.systeme)

    kontrollvektoren = _kontrollvektoren(payload, birth_dt, now, payload.session_id)
    # Kontrollvektoren werden nicht gespeichert, sondern sind hieraus reproduzierbar
    kontrolle = {
        "anzahl": payload.kontroll_anzahl,
        "jahre": KONTROLL_JAHRE,
        "seed_schema": "sha256(session_id:kontrolle)",
        "stichtag": now.date().isoformat(),
    }
    return KontrollResponse(kontrollvektoren=kontrollvektoren, kontrolle=kontrolle)


def _person(payload: PartnerRequest, x: str) -> VektorRequest:
    """Person A oder B als VektorRequest (gleiche Pipeline wie Spiel A und B)."""
    return VektorRequest(
        geburtsdatum=getattr(payload, f"geburtsdatum_{x}"),
        uhrzeit=getattr(payload, f"uhrzeit_{x}"),
        geburtsname=getattr(payload, f"geburtsname_{x}"),
        geschlecht=getattr(payload, f"geschlecht_{x}"),
        latitude=getattr(payload, f"latitude_{x}"),
        longitude=getattr(payload, f"longitude_{x}"),
        zeitzone=getattr(payload, f"zeitzone_{x}"),
        systeme=payload.systeme,
    )


def _differenz(vek_a: Dict[str, Dict[str, float]], vek_b: Dict[str, Dict[str, float]], systeme: List[str]) -> Dict[str, Dict[str, float]]:
    """Erwartung fuer vergleichende Fragen: (B - A) / 2 je System und Lebensbereich, Skala -1..+1."""
    return {s: {d: max(-1.0, min(1.0, (vek_b[s][d] - vek_a[s][d]) / 2)) for d in DIMENSIONS} for s in systeme}


def _grober_ort(req: VektorRequest) -> Dict[str, Any]:
    """Datensparsam: Zeitzone und auf 1 Grad (~100 km) gerundete Koordinaten."""
    return {
        "zeitzone": req.zeitzone,
        "lat": round(req.latitude) if req.latitude is not None else None,
        "lon": round(req.longitude) if req.longitude is not None else None,
    }


@app.post("/partner")
def post_partner(payload: PartnerRequest) -> Dict[str, Any]:
    """Spiel C: Vektoren beider Personen und die Erwartung je System fuer die vergleichenden Fragen."""
    _validate_systeme(payload.systeme)
    now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    session_id = payload.session_id or str(uuid4())
    personen = {}
    for x in ("a", "b"):
        req = _person(payload, x)
        geburt = parse_birth_datetime(req.geburtsdatum, req.uhrzeit)
        inputs, vektoren, _, _ = _berechne_vektoren(req, geburt, now, session_id)
        personen[x] = (req, inputs, {s: vektoren[s] for s in payload.systeme})
    return {
        "vektorenA": personen["a"][2],
        "vektorenB": personen["b"][2],
        "differenz": _differenz(personen["a"][2], personen["b"][2], payload.systeme),
        "inputs": {
            "session_id": session_id,
            "stichtag": now.date().isoformat(),
            "systeme": payload.systeme,
            "geburtsort_a": _grober_ort(personen["a"][0]),
            "geburtsort_b": _grober_ort(personen["b"][0]),
            "katalog_version": FRAGEN_BEZIEHUNG["_meta"]["katalog_version"],
        },
    }


@app.post("/partner/kontrolle")
def post_partner_kontrolle(payload: PartnerKontrollRequest) -> Dict[str, Any]:
    """Spiel C, Kontrollgruppe: 100 zufaellige Paare - beide Geburtsdaten zufaellig im Fenster +-5 Jahre um das
    jeweils echte Datum (gleiche Uhrzeit, Ort, Geschlecht). Liefert je System die Differenzvektoren."""
    _validate_systeme(payload.systeme)
    if payload.stichtag:
        try:
            now = datetime.strptime(payload.stichtag, "%Y-%m-%d").replace(hour=12)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="stichtag muss YYYY-MM-DD sein") from exc
    else:
        now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    req = {x: _person(payload, x) for x in ("a", "b")}
    daten = {
        x: _kontroll_geburtsdaten(parse_birth_datetime(req[x].geburtsdatum, req[x].uhrzeit), payload.session_id,
                                  payload.kontroll_anzahl, schluessel=f"kontrolle_{x}")
        for x in ("a", "b")
    }
    kontrollvektoren: Dict[str, List[Dict[str, float]]] = {s: [] for s in payload.systeme}
    for datum_a, datum_b in zip(daten["a"], daten["b"]):
        _, vek_a, _, _ = _berechne_vektoren(req["a"], datum_a, now, payload.session_id)
        _, vek_b, _, _ = _berechne_vektoren(req["b"], datum_b, now, payload.session_id)
        for s, diff in _differenz(vek_a, vek_b, payload.systeme).items():
            kontrollvektoren[s].append(diff)
    return {
        "kontrollvektoren": kontrollvektoren,
        "kontrolle": {
            "anzahl": payload.kontroll_anzahl,
            "jahre": KONTROLL_JAHRE,
            "seed_schema": "sha256(session_id:kontrolle_a) / sha256(session_id:kontrolle_b), Paar i = (A_i, B_i)",
            "stichtag": now.date().isoformat(),
        },
    }


@app.get("/fragen/beziehung")
def get_fragen_beziehung() -> Dict[str, Any]:
    return FRAGEN_BEZIEHUNG


@app.get("/systeme")
def get_systeme() -> Dict[str, object]:
    return {
        "verfuegbar": AVAILABLE_FOR_SELECTION,
        "default": DEFAULT_SYSTEMS,
    }


def _content_root() -> Path:
    return Path(__file__).resolve().parent.parent


@app.get("/horoscope/texts")
def get_horoscope_texts(locale: str = "de") -> Dict[str, object]:
    """Liefert Systemtexte fuer die Deutungs-Tabs (intro, dimensions, paracelsus_outro)."""
    if locale != "de":
        raise HTTPException(status_code=404, detail="Nur locale=de verfuegbar")
    path = _content_root() / "content" / "horoscope" / "de" / "system_texts_v1.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="system_texts_v1.json nicht gefunden")
    import json
    data = json.loads(path.read_text(encoding="utf-8"))
    return data


@app.get("/horoscope/erklaerungen")
def get_erklaerungen(locale: str = "de") -> Dict[str, object]:
    """Erklaertexte (Skill, Methodik, Experiment), erzeugt aus docs/Textbausteine/erklaerungen/*.md."""
    if locale != "de":
        raise HTTPException(status_code=404, detail="Nur locale=de verfuegbar")
    path = _content_root() / "content" / "horoscope" / "de" / "erklaerungen_v1.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="erklaerungen_v1.json nicht gefunden")
    return json.loads(path.read_text(encoding="utf-8"))


# Bazi: Fuenf-Elemente-Zyklen (Erzeugung und Kontrolle)
_ERZEUGT = {"holz": "feuer", "feuer": "erde", "erde": "metall", "metall": "wasser", "wasser": "holz"}
_KONTROLLIERT = {"holz": "erde", "erde": "wasser", "wasser": "feuer", "feuer": "metall", "metall": "holz"}
# Westlich: harmonische und spannungsreiche Aspekte (Transite kommen nach Staerke sortiert)
_HARMONISCH = {"trine", "sextil"}
_SPANNUNG = {"quadrat", "opposition", "konjunktion"}
_TENDENZ_SCHWELLE = 0.05


def _bazi_beziehung(dm: str, monat: str) -> str:
    if dm == monat:
        return "gleich"
    if _ERZEUGT.get(monat) == dm:
        return "naehrt"
    if _ERZEUGT.get(dm) == monat:
        return "erschoepft"
    if _KONTROLLIERT.get(monat) == dm:
        return "kontrolliert"
    return "beherrscht"


def _tendenzen(vektor: Dict[str, float], t: Dict[str, Dict[str, str]]) -> List[str]:
    """Staerkster guenstiger und staerkster schwieriger Lebensbereich des heutigen Horoskops."""
    texte = []
    hoch = max(vektor, key=vektor.get)
    tief = min(vektor, key=vektor.get)
    if vektor[hoch] >= _TENDENZ_SCHWELLE:
        texte.append(t["tendenz_positiv"][hoch])
    if vektor[tief] <= -_TENDENZ_SCHWELLE:
        texte.append(t["tendenz_negativ"][tief])
    return texte or [t["ausgeglichen"]["text"]]


@app.post("/horoscope/heute")
def post_horoskop_heute(payload: VektorRequest) -> Dict[str, Any]:
    """Horoskop fuer heute (Belohnung in Spiel B): Bausteine aus content/horoscope/de/heute_v1.json,
    ausgewaehlt nach der heutigen Konstellation der zeitabhaengigen Systeme."""
    path = _content_root() / "content" / "horoscope" / "de" / "heute_v1.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="heute_v1.json nicht gefunden")
    t = json.loads(path.read_text(encoding="utf-8"))["gruppen"]

    birth_dt = parse_birth_datetime(payload.geburtsdatum, payload.uhrzeit)
    now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    p = _rueckblick_payload(payload)
    inputs, vektoren, _, _ = _berechne_vektoren(p, birth_dt, now, payload.session_id or str(uuid4()))

    systeme: Dict[str, Dict[str, List[str]]] = {}
    for s in p.systeme:
        faktoren: List[str] = []
        if s == "Numerologie":
            faktoren.append(t["numerologie_monat"].get(str(inputs.get("persoenlicher_monat")), ""))
        elif s == "Hellenistisch":
            haus = (int(inputs.get("lebensalter", 0)) % 12) + 1
            faktoren.append(t["hellenistisch_haus"][str(haus)])
            faktoren.append(t["hellenistisch_herrscher"][_HOUSE_LORD[(int(inputs.get("asc_zeichen", 0)) + haus - 1) % 12]])
        elif s == "Bazi":
            dm = str(inputs.get("day_master_element"))
            monat = stem_to_element(str(inputs.get("aktueller_month_stem")))
            text = t["bazi_beziehung"][_bazi_beziehung(dm, monat)]
            faktoren.append(text.replace("{dm}", t["elemente"].get(dm, dm)).replace("{monat}", t["elemente"].get(monat, monat)))
        elif s == "Arabisch":
            quelle = next(q for q in load_struktur("Arabisch")["vektor_quellen"] if q.get("typ") == "firdaria")
            periode = _firdaria_periode(quelle, load_rules("Arabisch"), inputs)
            if periode:
                faktoren.append(t["arabisch_firdaria"].get(periode[0], ""))
        elif s == "Vedisch" and inputs.get("vimshottari_position") is not None:
            order, dauern = _load_dasha_data()
            planet = _current_mahadasha(order, dauern, float(inputs["vimshottari_position"]))["planet"]
            faktoren.append(t["vedisch_dasha"].get(planet, ""))
            haus_von = dict(inputs.get("gochara", []))
            gochara = load_rules("Vedisch").get("gochara", {})
            if haus_von.get("saturn") in gochara.get("sade_sati", {}).get("haeuser", []):
                faktoren.append(t["vedisch_gochara"]["sade_sati"])
            for pl in ("jupiter", "saturn"):
                if pl not in haus_von or (pl == "saturn" and haus_von[pl] in gochara.get("sade_sati", {}).get("haeuser", [])):
                    continue
                art = "guenstig" if haus_von[pl] in gochara["planeten"][pl]["guenstige_haeuser"] else "unguenstig"
                faktoren.append(t["vedisch_gochara"][f"{pl}_{art}"].replace("{haus}", str(haus_von[pl])))
        elif s == "Westlich":
            transits = inputs.get("transits", [])
            for gruppe in (_SPANNUNG, _HARMONISCH):
                treffer = next((tr for tr in transits if len(tr) == 4 and tr[1] in gruppe), None)
                if treffer:
                    planet, aspekt, _, ziel = treffer
                    faktoren.append(
                        t["westlich_aspekt"][aspekt]
                        .replace("{Planet}", t["planetennamen"][planet])
                        .replace("{thema}", t["westlich_planet"][planet])
                        .replace("{ziel}", t["transit_ziele"][ziel])
                    )
            if not faktoren:
                faktoren.append(t["westlich_ruhig"]["text"])
        systeme[s] = {"faktoren": [f for f in faktoren if f], "tendenzen": _tendenzen(vektoren[s], t)}
    return {"stichtag": now.date().isoformat(), "systeme": systeme}


@app.post("/horoscope/ausblick")
def post_horoskop_ausblick(payload: VektorRequest) -> Dict[str, Any]:
    """Jahreshoroskop: datierte Ereignisse der naechsten 12 Monate je System (bisher Westlich)."""
    path = _content_root() / "content" / "horoscope" / "de" / "heute_v1.json"
    t = json.loads(path.read_text(encoding="utf-8"))["gruppen"]
    birth_dt = parse_birth_datetime(payload.geburtsdatum, payload.uhrzeit)
    natal = ephemeris_compute(_zu_weltzeit(birth_dt, payload.zeitzone), latitude_deg=payload.latitude, longitude_deg=payload.longitude)
    start = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    systeme: Dict[str, List[Dict[str, Any]]] = {}
    if "Westlich" in payload.systeme:
        punkte = {_PLANET_ID_DE[p.id]: p.longitude_deg for p in natal.planets if p.id in ("sun", "moon")}
        if natal.has_location:
            punkte["aszendent"] = natal.asc_deg
            punkte["mc"] = natal.mc_deg
        systeme["Westlich"] = ausblick.westlich(punkte, _laufende_positionen, start, t)
    if "Vedisch" in payload.systeme:
        moon = next(p for p in natal.planets if p.id == "moon")
        idx, anteil = moon_nakshatra(natal.jd, moon.longitude_deg)
        mond_zeichen = int(((moon.longitude_deg - ayanamsha_lahiri(natal.jd)) % 360.0) // 30)
        dasha = json.loads((Path(__file__).resolve().parent / "Vedisch" / "jyotish_dasha.json").read_text(encoding="utf-8"))
        systeme["Vedisch"] = ausblick.vedisch(
            vimshottari_position_now(idx, anteil, 0.0), birth_dt, mond_zeichen, _laufende_zeichen_siderisch, start, t,
            dasha["antardasha_matrix"], load_rules("Vedisch").get("gochara", {}),
        )
    return {"stichtag": start.date().isoformat(), "bis": (start + timedelta(days=365)).date().isoformat(), "systeme": systeme}


@app.get("/horoscope/spiel_c/texts")
def get_spiel_c_texts(locale: str = "de") -> Dict[str, object]:
    """Liefert Partnerschaftstexte fuer Spiel C (by_system)."""
    if locale != "de":
        raise HTTPException(status_code=404, detail="Nur locale=de verfuegbar")
    path = _content_root() / "content" / "horoscope" / "de" / "spiel_c" / "system_texts_v1.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="spiel_c/system_texts_v1.json nicht gefunden")
    import json
    data = json.loads(path.read_text(encoding="utf-8"))
    return data


def _rueckblick_payload(payload: VektorRequest) -> VektorRequest:
    systeme = [s for s in payload.systeme if s in SPIEL_B_SYSTEME]
    if not systeme:
        raise HTTPException(status_code=422, detail=f"Spiel B unterstuetzt nur: {', '.join(SPIEL_B_SYSTEME)}")
    basis = VektorRequest(**payload.model_dump(include=set(VektorRequest.model_fields)))
    return basis.model_copy(update={"systeme": systeme})


def _rueckblick_verlauf(payload: VektorRequest, birth_dt: datetime, now: datetime, session_id: str) -> Dict[int, Dict[str, Dict[str, float]]]:
    """Systemvektoren je Stichprobentag (Tage vor dem Stichtag)."""
    tage = sorted({t for liste in RUECKBLICK_FENSTER.values() for t in liste} | set(TIMING_RASTER))
    verlauf = {}
    for t in tage:
        _, vektoren, _, _ = _berechne_vektoren(payload, birth_dt, now - timedelta(days=t), session_id)
        verlauf[t] = {s: vektoren[s] for s in payload.systeme}
    return verlauf


def _fenster_mittel(verlauf: Dict[int, Dict[str, Dict[str, float]]], systeme: List[str]) -> Dict[str, Dict[str, Dict[str, float]]]:
    """Horoskop je Zeitfenster = Mittel der Stichproben im Fenster."""
    mittel: Dict[str, Dict[str, Dict[str, float]]] = {}
    for fenster, tage in RUECKBLICK_FENSTER.items():
        mittel[fenster] = {
            s: {d: sum(verlauf[t][s][d] for t in tage) / len(tage) for d in DIMENSIONS}
            for s in systeme
        }
    return mittel


def _hoehepunkt(werte: List[Tuple[int, float]], richtung: str, konstant: float = TIMING_KONSTANT) -> float:
    """Tag (zurueck) des staerksten Werts in Richtung positiv/negativ (werte nach Tag sortiert).
    Erreicht der Wert das Extrem auf mehreren aufeinanderfolgenden Tagen (Plateau), zaehlt dessen Mitte;
    bei mehreren getrennten Plateaus das laengste (bei Gleichstand das juengste).
    Kein Unterschied im ganzen Bereich -> konstant. Gleiche Regel fuer echtes Datum und Kontrolle."""
    vorzeichen = 1.0 if richtung == "positiv" else -1.0
    if max(w for _, w in werte) - min(w for _, w in werte) < 1e-9:
        return konstant
    extrem = max(vorzeichen * w for _, w in werte)
    laeufe: List[List[int]] = []
    vorher_extrem = False
    for t, w in werte:
        ist_extrem = abs(vorzeichen * w - extrem) < 1e-9
        if ist_extrem and vorher_extrem:
            laeufe[-1].append(t)
        elif ist_extrem:
            laeufe.append([t])
        vorher_extrem = ist_extrem
    lauf = max(laeufe, key=len)  # max() liefert bei Gleichstand den ersten = juengsten Lauf
    return sum(lauf) / len(lauf)


def _timing(verlauf, systeme: List[str]) -> Dict[str, Dict[str, float]]:
    """Je Zeitpunkt-Frage und System: Hoehepunkt im Quartal (Tage zurueck)."""
    return {
        str(f["id"]): {
            s: _hoehepunkt([(t, verlauf[t][s][f["dimension"]]) for t in TIMING_RASTER], f["richtung"])
            for s in systeme
        }
        for f in FRAGEN_RUECKBLICK["zeitpunkt"]
    }


def _feinsuche(payload: VektorRequest, birth_dt: datetime, now: datetime, session_id: str, moment: Dict[str, Any],
               mittel: float, schritt: int) -> int:
    """Tagesgenauer Zeitpunkt eines auffaelligen Moments: Tage um den Rasterpunkt einzeln durchrechnen."""
    s, d, t0 = moment["system"], moment["dimension"], moment["tage_zurueck"]
    einzeln = payload.model_copy(update={"systeme": [s]})
    werte = []
    for t in range(max(1, t0 - schritt + 1), min(TIMING_RASTER[-1], t0 + schritt - 1) + 1):
        _, vek, _, _ = _berechne_vektoren(einzeln, birth_dt, now - timedelta(days=t), session_id)
        werte.append((t, vek[s][d] - mittel))
    return round(_hoehepunkt(werte, moment["richtung"], konstant=t0))


def _auffaellige_momente(verlauf, mittel, systeme: List[str]) -> List[Dict[str, Any]]:
    """Je System der staerkste Ausschlag (Abweichung vom Fenstermittel) ueber beide Fenster.
    Nur fuer die ungewerteten Zusatzfragen - die Auswahl haengt vom echten Horoskop ab."""
    momente = []
    for s in systeme:
        best = None
        for fenster, tage in RUECKBLICK_FENSTER.items():
            for t in tage:
                for d in DIMENSIONS:
                    abw = verlauf[t][s][d] - mittel[fenster][s][d]
                    if best is None or abs(abw) > abs(best["abweichung"]):
                        best = {"system": s, "fenster": fenster, "dimension": d, "tage_zurueck": t, "abweichung": round(abw, 4)}
        if best and abs(best["abweichung"]) > 1e-6:
            best["richtung"] = "positiv" if best["abweichung"] > 0 else "negativ"
            momente.append(best)
    return momente


@app.post("/rueckblick")
def post_rueckblick(payload: VektorRequest) -> Dict[str, Any]:
    """Spiel B: Horoskop je Zeitfenster (Mittel) und auffaellige Momente (Extremwerte) fuer das echte Geburtsdatum."""
    birth_dt = parse_birth_datetime(payload.geburtsdatum, payload.uhrzeit)
    now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    session_id = payload.session_id or str(uuid4())
    p = _rueckblick_payload(payload)
    verlauf = _rueckblick_verlauf(p, birth_dt, now, session_id)
    mittel = _fenster_mittel(verlauf, p.systeme)
    momente = _auffaellige_momente(verlauf, mittel, p.systeme)
    for m in momente:
        schritt = 5 if m["fenster"] == "monat" else 10
        m["tage_zurueck_raster"] = m["tage_zurueck"]
        m["tage_zurueck"] = _feinsuche(p, birth_dt, now, session_id, m, mittel[m["fenster"]][m["system"]][m["dimension"]], schritt)
    return {
        "mittel": mittel,
        "auffaellig": momente,
        "timing": _timing(verlauf, p.systeme),
        "inputs": {
            "session_id": session_id,
            "stichtag": now.date().isoformat(),
            "systeme": p.systeme,
            "fenster": RUECKBLICK_FENSTER,
            "timing_raster": TIMING_RASTER,
            "timing_konstant": TIMING_KONSTANT,
            "katalog_version": FRAGEN_RUECKBLICK["_meta"]["katalog_version"],
        },
    }


@app.post("/rueckblick/kontrolle")
def post_rueckblick_kontrolle(payload: KontrollRequest) -> Dict[str, Any]:
    """Spiel B: Fenster-Mittel fuer die Kontroll-Geburtsdaten (gleiche Auswahl wie /kontrolle)."""
    birth_dt = parse_birth_datetime(payload.geburtsdatum, payload.uhrzeit)
    if payload.stichtag:
        try:
            now = datetime.strptime(payload.stichtag, "%Y-%m-%d").replace(hour=12)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="stichtag muss YYYY-MM-DD sein") from exc
    else:
        now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
    p = _rueckblick_payload(payload)
    kontrollvektoren: Dict[str, Dict[str, List[Dict[str, float]]]] = {f: {s: [] for s in p.systeme} for f in RUECKBLICK_FENSTER}
    timing: Dict[str, Dict[str, List[float]]] = {str(f["id"]): {s: [] for s in p.systeme} for f in FRAGEN_RUECKBLICK["zeitpunkt"]}
    for datum in _kontroll_geburtsdaten(birth_dt, payload.session_id, payload.kontroll_anzahl):
        verlauf = _rueckblick_verlauf(p, datum, now, payload.session_id)
        mittel = _fenster_mittel(verlauf, p.systeme)
        for fenster in RUECKBLICK_FENSTER:
            for s in p.systeme:
                kontrollvektoren[fenster][s].append(mittel[fenster][s])
        for qid, je_system in _timing(verlauf, p.systeme).items():
            for s, tag in je_system.items():
                timing[qid][s].append(tag)
    kontrolle = {
        "anzahl": payload.kontroll_anzahl,
        "jahre": KONTROLL_JAHRE,
        "seed_schema": "sha256(session_id:kontrolle)",
        "stichtag": now.date().isoformat(),
        "fenster": RUECKBLICK_FENSTER,
    }
    return {"kontrollvektoren": kontrollvektoren, "timing": timing, "kontrolle": kontrolle}


@app.get("/orte/laender")
def get_laender(zeitzone: str = "") -> Dict[str, Any]:
    """Laender fuer die Ortswalze; vorschlag = Land zur Zeitzone des Geraets."""
    return orte.laender(zeitzone)


@app.get("/orte/staedte")
def get_staedte(land: str, limit: int = 60) -> Dict[str, Any]:
    """Groessere Orte eines Landes (ISO-Code), alphabetisch, fuer die Ortswalze."""
    return {"staedte": orte.staedte(land, max(1, min(limit, 200)))}


@app.get("/orte")
def get_orte(q: str = "", limit: int = 8) -> Dict[str, Any]:
    """Geburtsort-Suche (offline, GeoNames via geonamescache): Name, Land, Koordinaten, Zeitzone."""
    return {"orte": orte.suche(q, max(1, min(limit, 20)))}


@app.get("/fragen/rueckblick")
def get_fragen_rueckblick() -> Dict[str, Any]:
    return FRAGEN_RUECKBLICK


@app.get("/fragen")
def get_fragen() -> Dict[str, object]:
    return {"fragen": FRAGEN}


@app.get("/matrix")
def get_matrix() -> Dict[str, object]:
    matrix_path = Path(__file__).resolve().parent / "dimensionen_matrix.json"
    if not matrix_path.exists():
        raise HTTPException(status_code=404, detail="dimensionen_matrix.json nicht gefunden")
    import json

    return json.loads(matrix_path.read_text(encoding="utf-8"))


@app.post("/session")
def post_session(payload: SessionPayload) -> Dict[str, str]:
    session_id = persist_session(payload.model_dump())
    return {"session_id": session_id}


@app.get("/vergleich")
def get_vergleich(doy: int, stunde: int, frage_id: int) -> Dict[str, object]:
    return compare_group(doy=doy, stunde=stunde, frage_id=frage_id)
