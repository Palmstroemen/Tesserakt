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


class VektorRequest(BaseModel):
    geburtsdatum: str = Field(examples=["1985-03-15"])
    uhrzeit: Optional[str] = Field(default="12:00", examples=["14:30"])
    session_id: Optional[str] = Field(default=None, description="Optional for deterministic KO values")
    systeme: List[str] = Field(default_factory=lambda: DEFAULT_SYSTEMS.copy())


class VektorResponse(BaseModel):
    vektoren: Dict[str, Dict[str, float]]
    inputs: Dict[str, object]


class AntwortPayload(BaseModel):
    frage_id: int
    dimension: str
    selbst_wert: float
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
    vector = compute_vector(struktur, rules, inputs)
    # Defensive normalize in case future rule files miss dimensions.
    return {dim: float(vector.get(dim, 3.0)) for dim in DIMENSIONS}


def _stable_seed(seed_key: str) -> int:
    digest = hashlib.sha256(seed_key.encode("utf-8")).hexdigest()
    return int(digest[:16], 16)


def _ko_vector(session_id: str) -> Dict[str, float]:
    vector: Dict[str, float] = {}
    for index, dim in enumerate(DIMENSIONS):
        # Reproducible baseline values around 3.0 with moderate variance.
        seed = _stable_seed(f"{session_id}:{index}:{dim}")
        rng = random.Random(seed)
        value = min(5.0, max(1.0, rng.gauss(3.0, 0.8)))
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
    return VektorResponse(vektoren=vektoren, inputs=response_inputs)


@app.get("/systeme")
def get_systeme() -> Dict[str, object]:
    return {
        "verfuegbar": SUPPORTED_SYSTEMS,
        "default": DEFAULT_SYSTEMS,
    }


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
