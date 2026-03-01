from __future__ import annotations

import hashlib
import random
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from arabic_chart import build_firdaria_chart
from bazi_chart import build_four_pillars
from chart import build_radix_wheel
from hellenistisch_chart import build_profection_chart
from kabbalah_chart import build_kabbalah_chart
from numerology_chart import build_numerology_chart
from vedisch_chart import build_dasha_chart
from ephemeris import compute as ephemeris_compute, sun_sign_from_longitude
from rule_engine import (
    DIMENSIONS,
    SUBFOLDERS,
    build_inputs,
    compute_vector,
    load_rules,
    load_struktur,
)
from store import compare_group, init_db, persist_session
from horoskop_assessment import FRAGEN

app = FastAPI(title="Horoskop Assessment API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_origins=[],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_SYSTEMS = ["Westlich", "Bazi", "Numerologie"]
SUPPORTED_SYSTEMS = [*SUBFOLDERS, "KO"]
# Fuer die UI: nur waehlbare Systeme (KO wird intern fuer Delta-Metriken genutzt, nicht anzeigen)
AVAILABLE_FOR_SELECTION = [s for s in SUPPORTED_SYSTEMS if s != "KO"]


class VektorRequest(BaseModel):
    geburtsdatum: str = Field(examples=["1985-03-15"])
    uhrzeit: Optional[str] = Field(default="12:00", examples=["14:30"])
    session_id: Optional[str] = Field(default=None, description="Optional for deterministic KO values")
    systeme: List[str] = Field(default_factory=lambda: DEFAULT_SYSTEMS.copy())
    latitude: Optional[float] = Field(default=None, description="Geburtsort Breite (fuer Placidus-Haeuser)")
    longitude: Optional[float] = Field(default=None, description="Geburtsort Laenge (fuer Placidus-Haeuser)")


class VektorResponse(BaseModel):
    vektoren: Dict[str, Dict[str, float]]
    inputs: Dict[str, object]


class PartnerRequest(BaseModel):
    geburtsdatum_a: str = Field(examples=["1985-03-15"])
    uhrzeit_a: Optional[str] = Field(default="12:00", examples=["14:30"])
    geburtsdatum_b: str = Field(examples=["1990-07-20"])
    uhrzeit_b: Optional[str] = Field(default="12:00", examples=["09:00"])
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


def _ko_vector(session_id: str) -> Dict[str, float]:
    vector: Dict[str, float] = {}
    for index, dim in enumerate(DIMENSIONS):
        # Reproducible baseline values in -1..+1 (moderate variance around 0).
        seed = _stable_seed(f"{session_id}:{index}:{dim}")
        rng = random.Random(seed)
        value = min(1.0, max(-1.0, rng.gauss(0.0, 0.3)))
        vector[dim] = round(value, 2)
    return vector


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.post("/vektor", response_model=VektorResponse)
def post_vektor(payload: VektorRequest) -> VektorResponse:
    birth_dt = parse_birth_datetime(payload.geburtsdatum, payload.uhrzeit)
    now = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)

    # Precompute ephemeris when Westlich is requested (same run as vectors → no extra wait on result page)
    ephemeris_result = None
    if "Westlich" in payload.systeme:
        ephemeris_result = ephemeris_compute(
            birth_dt,
            latitude_deg=payload.latitude,
            longitude_deg=payload.longitude,
        )
        ephemeris_sonnenzeichen = sun_sign_from_longitude(
            next((p.longitude_deg for p in ephemeris_result.planets if p.id == "sun"), 0.0)
        )
        inputs = build_inputs(birth_dt, now, ephemeris_sonnenzeichen=ephemeris_sonnenzeichen)
    else:
        inputs = build_inputs(birth_dt, now)

    session_id = payload.session_id or str(uuid4())
    requested = payload.systeme
    if not requested:
        raise HTTPException(status_code=422, detail="Mindestens ein System muss ausgewaehlt werden")
    unknown = [name for name in requested if name not in SUPPORTED_SYSTEMS]
    if unknown:
        raise HTTPException(status_code=400, detail=f"Nicht unterstuetzte Systeme: {', '.join(unknown)}")

    vektoren: Dict[str, Dict[str, float]] = {}
    for system_name in requested:
        if system_name == "KO":
            vektoren["KO"] = _ko_vector(session_id)
            continue
        vektoren[system_name] = _compute_system_vector(system_name, inputs)

    response_inputs = _serialize_inputs(inputs)
    response_inputs["session_id"] = session_id
    response_inputs["ko_seed_schema"] = "sha256(session_id:frage_id)"

    # Attach precomputed chart payloads so frontend has them without extra request
    visual_payloads: Dict[str, Any] = {}
    if ephemeris_result is not None:
        visual_payloads["Westlich"] = build_radix_wheel(ephemeris_result)
    if "Bazi" in payload.systeme:
        visual_payloads["Bazi"] = build_four_pillars(birth_dt)
    if "Numerologie" in payload.systeme:
        visual_payloads["Numerologie"] = build_numerology_chart(birth_dt)
    if "Kabbalah" in payload.systeme:
        visual_payloads["Kabbalah"] = build_kabbalah_chart(birth_dt)
    if "Hellenistisch" in payload.systeme:
        visual_payloads["Hellenistisch"] = build_profection_chart(birth_dt)
    if "Arabisch" in payload.systeme:
        visual_payloads["Arabisch"] = build_firdaria_chart(birth_dt)
    if "Vedisch" in payload.systeme:
        visual_payloads["Vedisch"] = build_dasha_chart(birth_dt)
    response_inputs["visualPayloads"] = visual_payloads

    return VektorResponse(vektoren=vektoren, inputs=response_inputs)


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
    system_list = [s for s in requested if s != "KO"]

    def inputs_and_vektoren(birth_dt: datetime):
        ephemeris_result = None
        if "Westlich" in system_list:
            ephemeris_result = ephemeris_compute(birth_dt, latitude_deg=None, longitude_deg=None)
            ephemeris_sonnenzeichen = sun_sign_from_longitude(
                next((p.longitude_deg for p in ephemeris_result.planets if p.id == "sun"), 0.0)
            )
            inp = build_inputs(birth_dt, now, ephemeris_sonnenzeichen=ephemeris_sonnenzeichen)
        else:
            inp = build_inputs(birth_dt, now)
        vektoren: Dict[str, Dict[str, float]] = {}
        for system_name in system_list:
            vektoren[system_name] = _compute_system_vector(system_name, inp)
        return _serialize_inputs(inp), vektoren

    inputs_a, vektoren_a = inputs_and_vektoren(birth_dt_a)
    inputs_b, vektoren_b = inputs_and_vektoren(birth_dt_b)

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
