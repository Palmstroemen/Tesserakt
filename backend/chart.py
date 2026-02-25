"""
Build radixWheel visual payload from ephemeris result.
Includes zodiac, houses, planets, and major aspects (conjunction, sextile, square, trine, opposition).
"""

from __future__ import annotations

from typing import Any, Dict, List

from ephemeris import EphemerisResult, _SIGN_IDS, _SIGN_LABELS


# Major aspects: (exact_angle_deg, max_orb_deg default, type key)
_MAJOR_ASPECTS = [
    (0, 8, "conjunction"),
    (60, 6, "sextile"),
    (90, 8, "square"),
    (120, 8, "trine"),
    (180, 8, "opposition"),
]


def _planet_house(longitude_deg: float, cusps_deg: List[float], asc_deg: float) -> int:
    """Determine house 1-12 for a longitude. Cusps: 1st=ASC, 2nd=cusps[1], ... 12th before ASC."""
    if not cusps_deg:
        diff = (longitude_deg - asc_deg + 360) % 360
        return min(12, max(1, int(diff // 30) + 1))
    lon = longitude_deg % 360
    for i in range(12):
        c_start = cusps_deg[i]
        c_end = cusps_deg[(i + 1) % 12]
        # Normalize so we can compare: segment may wrap at 360
        if c_end <= c_start:
            c_end += 360
        lon_n = lon if lon >= c_start else lon + 360
        if c_start <= lon_n < c_end:
            return i + 1
    return 1


def _orb_diff(angle: float, exact_deg: float) -> float:
    """Signed difference from exact aspect angle (in 0-360 space)."""
    diff = (angle - exact_deg + 180) % 360 - 180
    return abs(diff)


def _compute_aspects(planets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Compute major aspects between planets; return list of AspectLine-like dicts."""
    aspects: List[Dict[str, Any]] = []
    n = len(planets)
    for i in range(n):
        for j in range(i + 1, n):
            a_id = planets[i]["id"]
            b_id = planets[j]["id"]
            lon_a = planets[i]["longitudeDeg"]
            lon_b = planets[j]["longitudeDeg"]
            angle = abs((lon_a - lon_b + 360) % 360)
            if angle > 180:
                angle = 360 - angle
            for exact_deg, max_orb, aspect_type in _MAJOR_ASPECTS:
                orb = _orb_diff(angle, exact_deg)
                if orb <= max_orb:
                    # Applying: faster planet moving toward exact (simplified: not computed here)
                    aspects.append({
                        "a": a_id,
                        "b": b_id,
                        "type": aspect_type,
                        "exactAngleDeg": exact_deg,
                        "orbDeg": round(orb, 2),
                        "applying": None,
                    })
                    break  # one aspect per pair (closest)
    return aspects


def build_radix_wheel(ephemeris: EphemerisResult) -> Dict[str, Any]:
    """
    Build radixWheel visual payload from EphemerisResult.
    Matches schema: zodiac, houses, planets, aspects.
    """
    zodiac_signs = [
        {
            "id": _SIGN_IDS[i],
            "startDeg": i * 30,
            "endDeg": (i + 1) * 30,
            "label": _SIGN_LABELS[i],
        }
        for i in range(12)
    ]

    planets_payload: List[Dict[str, Any]] = []
    for p in ephemeris.planets:
        house = _planet_house(p.longitude_deg, ephemeris.cusps_deg, ephemeris.asc_deg)
        planets_payload.append({
            "id": p.id,
            "label": p.label,
            "longitudeDeg": round(p.longitude_deg, 2),
            "signId": p.sign_id,
            "house": house,
            "retrograde": p.retrograde,
        })

    aspects = _compute_aspects(planets_payload)

    return {
        "chartType": "radixWheel",
        "zodiac": {
            "type": "tropical",
            "startAngleDeg": 0,
            "signs": zodiac_signs,
        },
        "houses": {
            "system": ephemeris.house_system,
            "cuspsDeg": [round(c, 2) for c in ephemeris.cusps_deg],
            "anglesDeg": {
                "asc": round(ephemeris.asc_deg, 2),
                "mc": round(ephemeris.mc_deg, 2),
                "dc": round(ephemeris.dc_deg, 2),
                "ic": round(ephemeris.ic_deg, 2),
            },
        },
        "planets": planets_payload,
        "aspects": aspects,
        "renderHints": {
            "showAspectGrid": True,
            "showMinorAspects": False,
        },
    }