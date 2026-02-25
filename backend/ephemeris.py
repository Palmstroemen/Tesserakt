"""
Ephemeris and house calculation using Swiss Ephemeris (pyswisseph).
Computes tropical planet positions and Placidus (or Whole Sign) houses
for use by the rule engine and radix chart payload.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Tuple

# Planet indices for Swiss Ephemeris (https://www.astro.com/swisseph/swephprg.htm)
_SWE_SUN = 0
_SWE_MOON = 1
_SWE_MERCURY = 2
_SWE_VENUS = 3
_SWE_MARS = 4
_SWE_JUPITER = 5
_SWE_SATURN = 6
_SWE_URANUS = 7
_SWE_NEPTUNE = 8
_SWE_PLUTO = 9

_PLANET_IDS = [
    "sun", "moon", "mercury", "venus", "mars",
    "jupiter", "saturn", "uranus", "neptune", "pluto",
]
_PLANET_LABELS = [
    "Sonne", "Mond", "Merkur", "Venus", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptun", "Pluto",
]
_SWE_PLANETS = [
    _SWE_SUN, _SWE_MOON, _SWE_MERCURY, _SWE_VENUS, _SWE_MARS,
    _SWE_JUPITER, _SWE_SATURN, _SWE_URANUS, _SWE_NEPTUNE, _SWE_PLUTO,
]

# Tropical zodiac: 0-30 = Aries, 30-60 = Taurus, ...
_SIGN_IDS = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]
_SIGN_LABELS = [
    "Widder", "Stier", "Zwillinge", "Krebs", "Löwe", "Jungfrau",
    "Waage", "Skorpion", "Schütze", "Steinbock", "Wassermann", "Fische",
]


@dataclass
class PlanetPosition:
    id: str
    label: str
    longitude_deg: float
    sign_id: str
    sign_index: int  # 0-11
    retrograde: bool
    speed_deg_per_day: float


@dataclass
class EphemerisResult:
    """Result of ephemeris computation for one moment (e.g. birth)."""
    jd: float
    planets: List[PlanetPosition] = field(default_factory=list)
    # House cusps in degrees (cusps[0] = 1st house = ASC, cusps[1] = 2nd, ... 11; 12th = ASC+360)
    cusps_deg: List[float] = field(default_factory=list)
    asc_deg: float = 0.0
    mc_deg: float = 0.0
    dc_deg: float = 0.0
    ic_deg: float = 0.0
    house_system: str = "placidus"  # or "whole_sign"
    has_location: bool = False


def _longitude_to_sign(longitude_deg: float) -> Tuple[int, str]:
    """Returns (sign_index 0-11, sign_id)."""
    deg = longitude_deg % 360.0
    idx = int(deg // 30) % 12
    return idx, _SIGN_IDS[idx]


def compute(
    birth_dt: datetime,
    latitude_deg: Optional[float] = None,
    longitude_deg: Optional[float] = None,
) -> EphemerisResult:
    """
    Compute planet positions and house cusps for the given birth moment.
    If lat/lon are given, uses Placidus houses; otherwise Whole Sign from ASC
    (ASC computed at default location for consistency).
    """
    import swisseph as swe

    year = birth_dt.year
    month = birth_dt.month
    day = birth_dt.day
    hour = birth_dt.hour + birth_dt.minute / 60.0 + birth_dt.second / 3600.0

    jd = swe.julday(year, month, day, hour)

    # Planet positions (tropical)
    planets: List[PlanetPosition] = []
    for i, (pid, plabel, swe_planet) in enumerate(
        zip(_PLANET_IDS, _PLANET_LABELS, _SWE_PLANETS)
    ):
        xx, rflags = swe.calc_ut(jd, swe_planet)
        lon = xx[0]  # longitude
        speed = xx[3]  # daily speed in longitude
        retrograde = speed < 0
        sign_idx, sign_id = _longitude_to_sign(lon)
        planets.append(
            PlanetPosition(
                id=pid,
                label=plabel,
                longitude_deg=lon,
                sign_id=sign_id,
                sign_index=sign_idx,
                retrograde=retrograde,
                speed_deg_per_day=speed,
            )
        )

    # Houses
    has_location = (
        latitude_deg is not None
        and longitude_deg is not None
        and -90 <= latitude_deg <= 90
        and -180 <= longitude_deg <= 180
    )
    if has_location:
        lat = float(latitude_deg)
        lon = float(longitude_deg)
        cusps, ascmc = swe.houses(jd, lat, lon, b"P")  # P = Placidus
        # ascmc: [0]=asc, [1]=mc, [2]=armc, [3]=vertex, [4]=equatorial_asc, [5]=co-asc, ...
        asc_deg = float(ascmc[0])
        mc_deg = float(ascmc[1])
        dc_deg = (asc_deg + 180) % 360
        ic_deg = (mc_deg + 180) % 360
        cusps_list = [float(cusps[i]) for i in range(12)]
        house_system = "placidus"
    else:
        # Whole Sign: use a default location to get ASC/MC for display; cusps = 30° each from ASC
        # Default: central Europe (e.g. 50°N, 10°E) so we get a sensible ASC
        lat, lon = 50.0, 10.0
        cusps, ascmc = swe.houses(jd, lat, lon, b"P")
        asc_deg = float(ascmc[0])
        mc_deg = float(ascmc[1])
        dc_deg = (asc_deg + 180) % 360
        ic_deg = (mc_deg + 180) % 360
        cusps_list = [(asc_deg + i * 30) % 360 for i in range(12)]
        house_system = "whole_sign"

    return EphemerisResult(
        jd=jd,
        planets=planets,
        cusps_deg=cusps_list,
        asc_deg=asc_deg,
        mc_deg=mc_deg,
        dc_deg=dc_deg,
        ic_deg=ic_deg,
        house_system=house_system,
        has_location=has_location,
    )


# Rule engine / western_rules use German keys: widder, stier, zwillinge, ...
_SIGN_ID_TO_DE = {
    "aries": "widder",
    "taurus": "stier",
    "gemini": "zwillinge",
    "cancer": "krebs",
    "leo": "loewe",
    "virgo": "jungfrau",
    "libra": "waage",
    "scorpio": "skorpion",
    "sagittarius": "schuetze",
    "capricorn": "steinbock",
    "aquarius": "wassermann",
    "pisces": "fische",
}


def sun_sign_from_longitude(longitude_deg: float) -> str:
    """Return German sign key (e.g. 'widder') from ecliptic longitude, for rule engine."""
    _, sign_id = _longitude_to_sign(longitude_deg)
    return _SIGN_ID_TO_DE.get(sign_id, "widder")