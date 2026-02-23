# Regelwerk-Vervollständigung: Projektplan

## Stand: 19. Februar 2026

---

## Was bereits implementiert ist (western_rules_complete.json, 71KB)

| # | Kapitel | Inhalt | Status |
|---|---------|--------|--------|
| I.I | Planeten: Naturen | 10/10 Planeten mit Dimensionsvektoren | ✓ fertig |
| I.II | Zeichen des Zodiaks | 12/12 Zeichen mit Charakter + Vektoren | ✓ fertig |
| I.III | Himmelshäuser | 12/12 Häuser mit Bedeutungen | ✓ fertig |
| I.IV | Astronomische Aspekte | 9 Aspekte mit Gewichtungen | ✓ fertig |
| II.IV | Planetentransite | 10 Planeten × 5-6 Aspekte = 53 Regeln | ✓ fertig |
| III.I | Planeten in den Häusern | 9 Planeten × 12 Häuser = 108 Regeln | ✓ fertig |

**Gesamt bisher: ~300 Regeln in einer Datei**

---

## Geplante Gespräche (jeweils ein neues Gespräch starten)

### Gespräch 1 — Finanzen, Beruf, Ehe (diese Datei: thematic_rules.json)
Kapitel aus Sepharial:
- **III.V** Financial Prospects → Finanzsignaturen (Haus 2, 8, 11 + Planeten)
- **III.VII** Choice of Occupation → Berufssignaturen (Planeten → Berufsfelder)
- **III.VIII** Marriage Circumstances → Ehesignaturen (Haus 7 + Venus + Mars)
- **III.VI** Position in Life → Statussignaturen (Haus 10 + Sonne)

Ziel: ~120 neue Regeln

---

### Gespräch 2 — Zeitregeln & Planet×Planet (timing_rules.json)
- **IV.VI** Planetary Periods / Firdaria → Welcher Planet regiert welches Lebensalter
- **Planet×Planet Aspekte** → Vollständige 45 Kombinationen (aktuell nur 4)
- **Mond durch alle 12 Häuser** → 12 monatliche Transit-Regeln

Ziel: ~80 neue Regeln

---

### Gespräch 3 — Bazi vervollständigen (bazi_rules_complete.json)
- Luck Pillars (Jahrzehnt-Säulen) vollständig
- Monatspillar-Interaktionen mit Geburts-Säulen
- Alle Clash- und Combination-Muster (60 Kombinationen)
- Shen Sha (Glückssterne und Scheusalssterne) — 12 wichtigste

Ziel: ~150 neue Bazi-Regeln

---

### Gespräch 4 — Gesundheit & optionale Kapitel (health_rules.json)
- **III.II** Constitution → Körperliche Veranlagung nach Zeichen
- **III.III** Health and Sickness → Krankheitssignaturen der Planeten
- **III.IV** Character (vertiefen) → Planeten-Charakter (nicht nur Zeichen)

Ziel: ~80 neue Regeln

---

## Quellen (alle public domain)
- Sepharial — Astrology: How to Make and Read Your Own Horoscope (Gutenberg #46963, 1920)
- Raphael (Robert Cross Smith) — A Manual of Astrology (1828)
- Nicholas DeVore — Encyclopedia of Astrology (1947)
- Claudius Ptolemy — Tetrabiblos (public domain)
- Joey Yap — Bazi The Destiny Code (Basis für Bazi-Systematik)

---

## Ausgabedateien

| Datei | Inhalt | Gespräch |
|-------|--------|----------|
| western_rules_complete.json | Basis-Regelwerk West | ✓ fertig |
| thematic_rules.json | Finanzen, Beruf, Ehe, Status | 1 (nächstes) |
| timing_rules.json | Periodenlehre, Planet×Planet | 2 |
| bazi_rules_complete.json | Vollständiges Bazi | 3 |
| health_rules.json | Gesundheit, Charakter vertieft | 4 |

