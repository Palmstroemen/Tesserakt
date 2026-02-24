# Humoraltypen als Meta-System — Projektplan
## Option 3: Übersetzungsschicht über allen 7 Systemen

*Horoskop Assessment — Spiel A: Persönlichkeit*
*Version 1.0 · Februar 2026*

---

## 1. Was entsteht

Kein eigenständiges achtes Regelwerk — sondern eine **Aggregationsschicht** die die Outputs der 7 bestehenden Systeme in eine gemeinsame archetypische Sprache übersetzt.

```
Westlich    → cholerisch  ╗
Bazi        → melancholisch║
Numerologie → cholerisch  ║→ Gewichteter Modus → CHOLERISCH (mit melancholischer Note)
Kabbalah    → melancholisch║
Arabisch    → cholerisch  ║
Hellenistisch→ cholerisch ║
Vedisch   → phlegmatisch╝
```

Der Spieler sieht am Ende nicht nur "Westliche Astrologie trifft dich am besten" — sondern auch: "Über alle Systeme hinweg bist du überwiegend **cholerisch** — das Feuer-Temperament nach Hippokrates. Dieses Konzept ist 2.400 Jahre alt und ist der gemeinsame Vorfahre aller Systeme die du gerade gespielt hast."

---

## 2. Vorhandene Dateien

| Datei | Status | Beschreibung |
|---|---|---|
| `humoraltypen_mapping.json` | ✅ fertig | Vollständiges Mapping aller 7 Systeme → 4 Temperamente, mit Quellen, Konfidenz-Werten, Dimensionsprofilen |
| `persoenlichkeit_mapping.json` | ✅ fertig | 32 Fragen → 8D Vektorraum |
| `datenbankschema_v2.1.docx` | ✅ fertig | Schema mit Ephemeris, Kulturraum, Hypothesen |
| `gamification_konzept.md` | ✅ fertig | Progressive Belohnungen, Varianten A+B |

---

## 3. Was noch zu tun ist

### Schritt 1 — Mapping reviewen und kalibrieren
**Aufwand: 3–5 Stunden · Wer: Fachkundige Person oder Recherche**

Das `humoraltypen_mapping.json` ist inhaltlich fundiert aber noch nicht in der Praxis getestet. Vor der Implementierung sollte jemand mit Astrologie-Kenntnissen die Zuordnungen prüfen — besonders:

- **Bazi**: Die Erde-Zuordnung (melancholisch/phlegmatisch) ist interpretativ. In manchen Bazi-Schulen gilt Erde als zentralisierend ohne klare Temperament-Entsprechung.
- **Kabbalah**: Kether hat bewusst keine Zuordnung. Prüfen ob das für Spieler mit Kether-Sephira (Lebenspfadzahl 1, bestimmte Konstellationen) befriedigend kommuniziert werden kann.
- **Vedisch/Doshas**: Die Vata-Zuordnung ist zweideutig (sanguinisch bei Balance, melancholisch bei Überschuss). Entscheiden: Primär-Zuordnung sanguinisch, mit Hinweis auf Schattenseite?
- **Merkur** (Westlich, Arabisch, Hellenistisch): Gilt überall als "variabel" — er nimmt die Qualitäten seiner Aspektpartner an. Für die Implementierung braucht man einen Fallback: z.B. das Zeichen in dem Merkur steht.

Konkrete Review-Fragen pro System:

```
Westlich:      Stimmt die Sonne als cholerisch? (Manche Traditionen: sanguinisch)
Bazi:          Yang-Erde vs. Yin-Erde — reicht die Unterscheidung oder zu fein?
Numerologie:   LPZ 5 als sanguinisch plausibel? (Merkur-Energie, aber sehr Luft-lastig)
Kabbalah:      Chesed (Jupiter) als sanguinisch — Konsens?
Arabisch:      Venus als phlegmatisch (kalt-feucht) — arabische vs. griechische Tradition?
Hellenistisch: Sekt-System als primärer Marker — oder Sonnenzeichen stärker gewichten?
Vedisch:     Rahu als Vata — gängige vedische Zuordnung bestätigen
```

---

### Schritt 2 — Aggregationslogik implementieren
**Aufwand: 2–3 Stunden · Wer: Python-Entwickler**

Die Logik liegt im JSON unter `aggregation`. Zu implementieren in `rating_engine.py`:

```python
def berechne_temperament(system_vektoren: dict, mapping: dict) -> dict:
    """
    Aggregiert die Temperament-Zuordnungen aller Systeme zu einem Gesamt-Temperament.

    Returns:
        {
          "primaer": "cholerisch",
          "sekundaer": "melancholisch",       # wenn >25% Gewicht
          "mischtyp": "cholerisch-melancholisch",
          "verteilung": {
            "cholerisch": 0.52,
            "sanguinisch": 0.08,
            "phlegmatisch": 0.10,
            "melancholisch": 0.30
          },
          "system_zuordnungen": {
            "Westlich": "cholerisch",
            "Bazi": "melancholisch",
            ...
          },
          "konfidenz": 0.78   # gewichteter Schnitt der System-Konfidenzen
        }
    """
    gewichte = mapping["aggregation"]["system_gewichte"]
    system_konfidenzen = {s: mapping["system_mappings"][s]["konfidenz"]
                          for s in mapping["system_mappings"]}

    stimmen = {"cholerisch": 0.0, "sanguinisch": 0.0,
               "phlegmatisch": 0.0, "melancholisch": 0.0}

    for system, temperament in system_vektoren.items():
        if temperament in stimmen:
            stimmen[temperament] += (gewichte[system]
                                     * system_konfidenzen[system])

    gesamt = sum(stimmen.values())
    verteilung = {t: v/gesamt for t, v in stimmen.items()}

    sortiert = sorted(verteilung.items(), key=lambda x: -x[1])
    primaer = sortiert[0][0]
    sekundaer = sortiert[1][0] if sortiert[1][1] >= 0.25 else None

    return {
        "primaer": primaer,
        "sekundaer": sekundaer,
        "mischtyp": f"{primaer}-{sekundaer}" if sekundaer else primaer,
        "verteilung": verteilung,
        "konfidenz": sum(gewichte[s] * system_konfidenzen[s]
                         for s in gewichte) / sum(gewichte.values())
    }
```

**Grenzfälle die behandelt werden müssen:**
- Merkur als "variabel" → Fallback auf Zeichentemperament
- Bazi Erde → primaer melancholisch, mit sekundaer phlegmatisch
- Kether (Kabbalah) → keine Zuordnung → dieses System aus Aggregation ausschließen
- Gleichstand zwei Temperamente → beide als primär ausgeben (seltener Fall)

---

### Schritt 3 — Temperament aus Natal-Vektor extrahieren
**Aufwand: 3–4 Stunden · Wer: Python-Entwickler**

Für jedes System muss die bestehende Engine um eine `get_temperament()`-Methode erweitert werden. Diese liest das Mapping und gibt das Temperament für eine konkrete Person zurück.

**Westlich** (einfachster Fall):
```python
def get_temperament_westlich(sonnenzeichen: str, mapping: dict) -> str:
    return mapping["system_mappings"]["Westlich"]["zeichen_zu_temperament"][sonnenzeichen]
```

**Bazi** (komplexer — Yang/Yin unterscheiden):
```python
def get_temperament_bazi(day_master_elem: str, day_master_polaritaet: str,
                          mapping: dict) -> str:
    key = f"{day_master_polaritaet}_{day_master_elem}"  # z.B. "yang_feuer"
    eintrag = mapping["system_mappings"]["Bazi"]["qualitaeten_mapping"][key]
    return eintrag["temperament"]
```

**Arabisch** (Firdaria-abhängig vom Alter):
```python
def get_temperament_arabisch(geburtsdatum: date, heute: date, mapping: dict) -> str:
    alter = (heute - geburtsdatum).days // 365
    firdaria = mapping["system_mappings"]["Arabisch"]["firdaria_alter_mapping"]
    # Finde aktiven Planeten für dieses Alter
    planet = _get_firdaria_planet(alter, firdaria)
    return mapping["system_mappings"]["Arabisch"]["planet_zu_temperament"][planet]["temperament"]
```

**Vedisch** (Dosha aus Mahadasha-Planet):
```python
def get_temperament_vedisch(mahadasha_planet: str, mapping: dict) -> str:
    dosha_key = f"{mahadasha_planet}_md"
    dosha = mapping["system_mappings"]["Vedisch"]["mahadasha_zu_dosha"][dosha_key]
    return mapping["system_mappings"]["Vedisch"]["dosha_zu_temperament"][dosha.split("_")[0]]["temperament"]
```

---

### Schritt 4 — Aufklärungstext schreiben
**Aufwand: 4–6 Stunden · Wer: Texter / inhaltlich Verantwortlicher**

Das Temperament-Ergebnis braucht drei Text-Ebenen:

**Ebene 1 — Kurztext (Zwischen-Einblendung, ~3 Sätze)**
Erscheint wenn das erste System freigeschaltet wird.

> *"Alle Weissagungssysteme haben einen gemeinsamen Vorfahren: die Humorallehre des Hippokrates aus dem 5. Jahrhundert v. Chr. Vier Temperamente — cholerisch, sanguinisch, phlegmatisch, melancholisch — beschreiben die Grundtypen des menschlichen Charakters. Am Ende siehst du, welchem Temperament du über alle Systeme hinweg am nächsten bist."*

**Ebene 2 — Temperament-Profil (Belohnungsseite, ~1 Seite)**
Pro Temperament: Name, Element, Planet, positive Eigenschaften, Herausforderungen, bekannte Vertreter, historische Einbettung.

**Ebene 3 — Historische Brücke (vollständige Aufklärung, ~2 Seiten)**
Wie hängen alle Systeme über die Humorallehre zusammen? Warum sind Westliche Astrologie, Bazi und Ayurveda trotz unabhängiger Entstehung strukturell ähnlich? Was sagt das über menschliche Muster-Erkennung?

Texte müssen für alle vier Temperamente geschrieben werden — je drei Ebenen = **12 Texte** insgesamt.

Vorlage für "Der Macher" (cholerisch) liegt im JSON unter `temperament_profile.cholerisch`.

---

### Schritt 5 — Datenbank erweitern
**Aufwand: 1 Stunde · Wer: Entwickler**

Eine Spalte in `persoenlichkeit_sessions` ergänzen:

```sql
ALTER TABLE persoenlichkeit_sessions
  ADD COLUMN temperament_primaer   VARCHAR(20),
  ADD COLUMN temperament_sekundaer VARCHAR(20),
  ADD COLUMN temperament_verteilung JSONB;
  -- {"cholerisch": 0.52, "sanguinisch": 0.08, ...}
```

Kein eigener Table nötig — die Temperament-Zuordnung ist eine abgeleitete Größe aus den System-Outputs und gehört direkt zur Session.

---

### Schritt 6 — Statistik-View ergänzen
**Aufwand: 1 Stunde · Wer: Entwickler**

```sql
CREATE VIEW v_temperament_statistik AS
SELECT
  temperament_primaer,
  temperament_sekundaer,
  sonnenzeichen,
  day_master_elem,
  kindheit_kulturraum,
  glaube_astrologie,
  COUNT(*) AS n_sessions,
  -- Prüfung: Stimmen alle Systeme überein oder widersprechen sie sich?
  AVG((temperament_verteilung->>temperament_primaer)::numeric) AS avg_konsistenz
FROM persoenlichkeit_sessions
WHERE abgeschlossen = TRUE
  AND veroeffentlichen = TRUE
  AND temperament_primaer IS NOT NULL
GROUP BY temperament_primaer, temperament_sekundaer,
         sonnenzeichen, day_master_elem,
         kindheit_kulturraum, glaube_astrologie
ORDER BY n_sessions DESC;
```

Diese View beantwortet interessante Folgefragen:
- Welche Sonnenzeichen landen in welchem Temperament? (Konsistenz-Check mit Tradition)
- Welcher Kulturraum hat welche Temperament-Verteilung? (H_kulturell)
- Glauben Choleriker öfter an Astrologie als Melancholiker?

---

## 4. Gesamtaufwand

| Schritt | Aufwand | Abhängigkeiten |
|---|---|---|
| 1. Mapping reviewen | 3–5 h | Fachkenntnis Astrologie |
| 2. Aggregationslogik | 2–3 h | rating_engine.py |
| 3. get_temperament() je System | 3–4 h | Schritt 1 + bestehende Engine |
| 4. Aufklärungstexte schreiben | 4–6 h | Schritt 1, Texter |
| 5. Datenbank erweitern | 1 h | Schema v2.1 |
| 6. Statistik-View | 1 h | Schritt 5 |
| **Gesamt** | **14–20 h** | |

Davon ist Schritt 4 (Texte) der zeitkritischste — und der einzige der nicht von einem Entwickler allein erledigt werden kann.

---

## 5. Was das Humoraltypen-Meta-System dem Spiel bringt

**Für den Spieler:**
- Ein zusätzliches Ergebnis das über die sieben Einzelsysteme hinausgeht
- Eine historische Einordnung: *"Das dachten die Menschen vor 2.400 Jahren über deinen Typ"*
- Ein Gesprächsthema: Temperamente sind alltagstauglich ("Ich bin ein Choleriker") — Hellenistische Profektionen nicht

**Für die Wissenschaft:**
- Messung der **Konsistenz** über Systeme hinweg: Wenn alle 7 Systeme dasselbe Temperament ausgeben, ist das ein starkes Signal. Wenn sie sich widersprechen, ist das ebenfalls interessant.
- `avg_konsistenz` in der Statistik-View: Für welche Sonnenzeichen sind sich alle Systeme einig? Für welche nicht?
- Test ob Temperament-Selbsteinschätzung mit berechneten Temperamenten übereinstimmt (Frage "Welches Temperament würdest du dir selbst zuschreiben?" als optionale Abschlussfrage)

**Für die Aufklärung:**
- Zeigt die gemeinsame Wurzel aller Systeme — und damit warum sie nicht unabhängig voneinander sind
- Schlägt die Brücke zu moderner Persönlichkeitspsychologie (Big Five: Cholerisch ≈ hohe Extraversion + hoher Neurotizismus)

---

## 6. Offene Fragen

- **Name:** "Humoraltypen" ist korrekt aber akademisch. Im Spiel besser: "Dein Ur-Temperament", "Was Hippokrates über dich gesagt hätte", "Das älteste Persönlichkeitssystem der Welt"
- **Paracelsus-Signatur:** Die körperlichen Beschreibungen im JSON ("Rotes Haar — Zeichen des Mars") sind historisch interessant aber heikel zu präsentieren. Nur als historische Kuriosität, nicht als Teil der Diagnose.
- **Big Five Mapping:** Wäre eine reizvolle Ergänzung — Temperamente auf moderne Psychologie mappen. Cholerisch ≈ hohe Extraversion + hoher Neurotizismus. Aufwand: ~2h, wissenschaftlich gut belegbar.
- **Optionale Selbst-Einschätzungsfrage:** "Welches Temperament erkennst du am meisten in dir?" — gibt einen direkten Vergleich berechnetes Temperament vs. Selbstbild. Sehr wertvolle Daten für H_kulturell.
