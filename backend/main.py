from __future__ import annotations

import hashlib
import random
from datetime import datetime, timedelta
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
from vedisch_chart import build_dasha_chart, compute_aktivierte_yogas, vimshottari_position_now
from ephemeris import compute as ephemeris_compute, moon_nakshatra, sun_sign_from_longitude
from rule_engine import (
    DIMENSIONS,
    SUBFOLDERS,
    build_inputs,
    compute_vector,
    load_rules,
    load_struktur,
    luck_pillar_for_both_sexes,
)
from store import compare_group, init_db, persist_session
from horoskop_assessment import FRAGEN

app = FastAPI(title="Tesserakt API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_origins=[],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Alle Systeme sind standardmaessig aktiv; der User kann einzelne abwaehlen.
DEFAULT_SYSTEMS = list(SUBFOLDERS)
SUPPORTED_SYSTEMS = list(SUBFOLDERS)
AVAILABLE_FOR_SELECTION = list(SUPPORTED_SYSTEMS)
# Perzentil-Kontrollgruppe: Vektoren desselben Systems fuer zufaellige Geburtsdaten
# (gleiche Uhrzeit, gleicher Ort, gleiches Geschlecht/Name) im Fenster +-KONTROLL_JAHRE.
KONTROLL_ANZAHL_DEFAULT = 100
KONTROLL_JAHRE = 5


class VektorRequest(BaseModel):
    geburtsdatum: str = Field(examples=["1985-03-15"])
    uhrzeit: Optional[str] = Field(default="12:00", examples=["14:30"])
    session_id: Optional[str] = Field(default=None, description="Optional; Seed fuer die Kontroll-Geburtsdaten in /kontrolle")
    systeme: List[str] = Field(default_factory=lambda: DEFAULT_SYSTEMS.copy())
    latitude: Optional[float] = Field(default=None, description="Geburtsort Breite (fuer Placidus-Haeuser)")
    longitude: Optional[float] = Field(default=None, description="Geburtsort Laenge (fuer Placidus-Haeuser)")
    geburtsname: Optional[str] = Field(default=None, description="Vollstaendiger Geburtsname fuer Numerologie Namenszahlen (Seelendrang, Ausdruck, Persoenlichkeit)")
    geschlecht: Optional[str] = Field(default=None, description="weiblich | maennlich | keine Angabe")


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
    geburtsdatum_a: str = Field(examples=["1985-03-15"])
    uhrzeit_a: Optional[str] = Field(default="12:00", examples=["14:30"])
    geburtsname_a: Optional[str] = Field(default=None, description="Geburtsname Person A (Numerologie)")
    geburtsdatum_b: str = Field(examples=["1990-07-20"])
    uhrzeit_b: Optional[str] = Field(default="12:00", examples=["09:00"])
    geburtsname_b: Optional[str] = Field(default=None, description="Geburtsname Person B (Numerologie)")
    systeme: List[str] = Field(default_factory=lambda: DEFAULT_SYSTEMS.copy())


class PartnerResponse(BaseModel):
    vektorenA: Dict[str, Dict[str, float]]
    vektorenB: Dict[str, Dict[str, float]]
    inputsA: Dict[str, object]
    inputsB: Dict[str, object]


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


def _stable_seed(seed_key: str) -> int:
    digest = hashlib.sha256(seed_key.encode("utf-8")).hexdigest()
    return int(digest[:16], 16)



@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def _startup() -> None:
    init_db()


def _berechne_vektoren(payload: VektorRequest, birth_dt: datetime, now: datetime, session_id: str):
    """Inputs und Systemvektoren fuer ein Geburtsdatum. Gibt (inputs, vektoren, radix, bazi_pillars) zurueck."""
    # Bazi: four pillars and Da Yun for both sexes (no gender in request)
    bazi_pillars = None
    bazi_luck_male: Optional[tuple] = None
    bazi_luck_female: Optional[tuple] = None
    if "Bazi" in payload.systeme:
        bazi_pillars = build_four_pillars(birth_dt)
        bazi_luck_male, bazi_luck_female = luck_pillar_for_both_sexes(birth_dt, now)
    bazi_day_branch = bazi_pillars["pillars"]["day"]["branch"] if bazi_pillars else None
    bazi_hour_stem = bazi_pillars["pillars"]["hour"]["stem"] if bazi_pillars else None
    bazi_hour_branch = bazi_pillars["pillars"]["hour"]["branch"] if bazi_pillars else None

    # Precompute ephemeris when Westlich or Vedisch is requested (one run per request)
    ephemeris_result = None
    radix = None
    if "Westlich" in payload.systeme or "Vedisch" in payload.systeme or "Arabisch" in payload.systeme:
        ephemeris_result = ephemeris_compute(
            birth_dt,
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
        )
    else:
        inputs = build_inputs(
            birth_dt, now,
            bazi_day_branch=bazi_day_branch,
            bazi_hour_stem=bazi_hour_stem,
            bazi_hour_branch=bazi_hour_branch,
            geburtsname=payload.geburtsname,
            geschlecht=payload.geschlecht,
        )
    # Vedisch: nakshatra, Vimshottari position, and activated Yogas from ephemeris when available
    if ephemeris_result and "Vedisch" in payload.systeme:
        moon = next((p for p in ephemeris_result.planets if p.id == "moon"), None)
        if moon is not None:
            idx, anteil = moon_nakshatra(ephemeris_result.jd, moon.longitude_deg)
            inputs["mond_nakshatra_index"] = idx
            inputs["mond_nakshatra_anteil"] = anteil
            alter = inputs.get("lebensalter", 0)
            inputs["vimshottari_position"] = vimshottari_position_now(idx, anteil, alter)
        inputs["aktivierte_yogas"] = compute_aktivierte_yogas(ephemeris_result.asc_deg, ephemeris_result.planets)
    # Arabisch: Lot des Glücks und Lot des Geistes aus Ephemeris (Whole-Sign-Haus 1–12)
    if ephemeris_result and "Arabisch" in payload.systeme:
        sun = next((p for p in ephemeris_result.planets if p.id == "sun"), None)
        moon = next((p for p in ephemeris_result.planets if p.id == "moon"), None)
        if sun is not None and moon is not None:
            lots = compute_lot_houses(ephemeris_result.asc_deg, sun.longitude_deg, moon.longitude_deg)
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


def _kontroll_geburtsdaten(birth_dt: datetime, session_id: str, anzahl: int) -> List[datetime]:
    """Reproduzierbare Zufallsdaten (Seed aus session_id) im Fenster +-KONTROLL_JAHRE um das Geburtsdatum, gleiche Uhrzeit."""
    rng = random.Random(_stable_seed(f"{session_id}:kontrolle"))
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
        visual_payloads["Hellenistisch"] = build_profection_chart(birth_dt)
    if "Arabisch" in payload.systeme:
        visual_payloads["Arabisch"] = build_firdaria_chart(birth_dt)
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


@app.post("/partner", response_model=PartnerResponse)
def post_partner(payload: PartnerRequest) -> PartnerResponse:
    """Zwei Geburtsdaten; liefert Vektoren und Inputs fuer Person A (User) und Person B (Partner)."""
    birth_dt_a = parse_birth_datetime(payload.geburtsdatum_a, payload.uhrzeit_a)
    birth_dt_b = parse_birth_datetime(payload.geburtsdatum_b, payload.uhrzeit_b)
    now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)

    requested = payload.systeme or DEFAULT_SYSTEMS.copy()
    unknown = [name for name in requested if name not in SUPPORTED_SYSTEMS]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Nicht unterstuetzte Systeme: {', '.join(unknown)}")
    system_list = list(requested)

    def inputs_and_vektoren(birth_dt: datetime, geburtsname: Optional[str] = None):
        bazi_p = None
        bazi_luck_m: Optional[tuple] = None
        bazi_luck_f: Optional[tuple] = None
        if "Bazi" in system_list:
            bazi_p = build_four_pillars(birth_dt)
            bazi_luck_m, bazi_luck_f = luck_pillar_for_both_sexes(birth_dt, now)
        db = bazi_p["pillars"]["day"]["branch"] if bazi_p else None
        hs = bazi_p["pillars"]["hour"]["stem"] if bazi_p else None
        hb = bazi_p["pillars"]["hour"]["branch"] if bazi_p else None
        ephemeris_result = None
        if "Westlich" in system_list:
            ephemeris_result = ephemeris_compute(birth_dt, latitude_deg=None, longitude_deg=None)
            ephemeris_sonnenzeichen = sun_sign_from_longitude(
                next((p.longitude_deg for p in ephemeris_result.planets if p.id == "sun"), 0.0)
            )
            radix = build_radix_wheel(ephemeris_result)
            inp = build_inputs(
                birth_dt, now,
                ephemeris_sonnenzeichen=ephemeris_sonnenzeichen,
                radix_planets=radix.get("planets"),
                radix_aspects=radix.get("aspects"),
                bazi_day_branch=db,
                bazi_hour_stem=hs,
                bazi_hour_branch=hb,
                geburtsname=geburtsname,
            )
        else:
            inp = build_inputs(birth_dt, now, bazi_day_branch=db, bazi_hour_stem=hs, bazi_hour_branch=hb, geburtsname=geburtsname)
        vektoren: Dict[str, Dict[str, float]] = {}
        for system_name in system_list:
            if system_name == "Bazi":
                assert bazi_luck_m is not None and bazi_luck_f is not None
                ms, mb = bazi_luck_m
                fs, fb = bazi_luck_f
                inp_m = {**inp, "luck_pillar_stem": ms, "luck_pillar_branch": mb}
                inp_f = {**inp, "luck_pillar_stem": fs, "luck_pillar_branch": fb}
                vektoren["Bazi_male"] = _compute_system_vector("Bazi", inp_m)
                vektoren["Bazi_female"] = _compute_system_vector("Bazi", inp_f)
                continue
            vektoren[system_name] = _compute_system_vector(system_name, inp)
        return _serialize_inputs(inp), vektoren

    inputs_a, vektoren_a = inputs_and_vektoren(birth_dt_a, payload.geburtsname_a)
    inputs_b, vektoren_b = inputs_and_vektoren(birth_dt_b, payload.geburtsname_b)

    return PartnerResponse(
        vektorenA=vektoren_a,
        vektorenB=vektoren_b,
        inputsA=inputs_a,
        inputsB=inputs_b,
    )


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
