# Kalibrierung (Archiv)

Bis zur Zurücksetzung (alle Faktoren auf 1/0) waren in `kalibrierung_dimensionen.json` folgende Werte aktiv.

**Meta:** Optionale Rekalibrierung. `systeme`: ein Offset/Mult pro System. `dimensionen`: Fallback pro Dimension. Skala -1..+1, Offsets auf 0.

## Systeme (vor Zurücksetzung)

| System      | offset | multiplier |
|------------|--------|------------|
| Westlich   | 0      | 4.3478     |
| Bazi       | 0      | 3.0303     |
| Numerologie| 0      | 1          |
| Kabbalah   | 0      | 1.27       |
| Arabisch   | 0      | 1.3333     |
| Vedisch    | 0      | 1.6129     |

Hellenistisch hatte keinen Eintrag (Fallback auf Dimensionen).

## Dimensionen (Fallback)

Alle Dimensionen (liebe, beruf, finanzen, gesundheit, soziales, kreativitaet, veraenderung, spiritualitaet): `offset: 0`, `multiplier: 1`.

---

Anwendung in der Rule-Engine: `v' = clamp(offset + multiplier * v)` pro System (wenn System in `systeme`) bzw. pro Dimension (Fallback).
