# Systemtexte Master v1
## Blueprint für systemgetrennte Horoskop-Antworten

Ziel: Pro System eine eigenständige, ausführliche Antwort im 8-Dimensionsmodell erzeugen, mit konsistenter Tonalität und wiederverwendbaren Baustein-Tags.

---

## 1. Gültiger Umfang

- Spielkontext: `spiel_a`
- Systeme:
  - Westlich
  - Bazi
  - Numerologie
  - Kabbalah
  - Arabisch
  - Hellenistisch
  - Vedisch
- Dimensionen:
  - `liebe`
  - `beruf`
  - `finanzen`
  - `gesundheit`
  - `soziales`
  - `kreativitaet`
  - `veraenderung`
  - `spiritualitaet`

---

## 2. Verbindliche Stilregeln

## 2.1 Grundton

- Lehrreich, anschaulich, respektvoll.
- Nicht deterministisch, aber klar.
- Unterhaltsam ohne marktschreierische Versprechen.

## 2.2 Formulierungsmodus

Erwünscht:
- `Das System beschreibt ...`
- `Demnach muesstest du ...`
- `Das kann bedeuten ..., muss aber nicht ...`
- `Typischerweise zeigt sich ...`

Nicht erwünscht:
- `Du bist ...`
- `Du wirst sicher ...`
- absolute Wahrheitsbehauptungen

## 2.3 Systemnennung

- Das System soll explizit erkennbar bleiben.
- In Fließtext durchschnittlich etwa jeder vierte Satz mit Systembezug.
- Keine dauernde Wiederholung im selben Absatz.

## 2.4 Aufklärungsanteil

- Intro pro System: 2-4 Absatze, inkl. 1 interessanter Besonderheit.
- Vergleich zur westlichen Astrologie dort, wo er sinnvoll ist.
- Methodikhinweise kurz halten, nicht überfrachten.

---

## 3. Feste Antwortstruktur je Systemdatei

1. **System-Intro**
   - Einordnung des Systems
   - Besonderheit
   - kurzer Vergleich zur westlichen Astrologie

2. **8 Dimensionsblöcke**
   - je Dimension:
     - Kernsatz im Konjunktiv
     - 1-2 differenzierende Nachsätze
     - optional Lernhinweis

3. **Paracelsus-Abschluss**
   - Signaturbezug
   - vorsichtige Integrationsdeutung
   - kein Absolutheitsanspruch

4. **Baustein-Tags**
   - maschinenlesbare Marker für spätere Composer-Logik

---

## 4. Baustein-Tags (Konvention)

Prefixe:

- `INTRO_*`
- `DIM_*`
- `META_*` (z. B. Zwischenerklärung)
- `OUTRO_PARACELSUS_*`

Beispiele:

- `INTRO_WESTLICH_CORE`
- `DIM_LIEBE_MEDIUM`
- `DIM_BERUF_HIGH`
- `META_NONDTERMINISM_HINT`
- `OUTRO_PARACELSUS_BALANCE`

Hinweis:
- Tags benennen semantische Funktion, nicht konkrete Formulierung.

---

## 5. Mapping: System -> Datei -> Inhaltsblöcke

| System | Runtime-Quelle | Intro | 8 Dimensionen | Paracelsus-Outro |
|---|---|---|---|---|
| Westlich | `content/horoscope/de/system_texts_v1.json` (systems.Westlich) | ja | ja | ja |
| Bazi | `content/horoscope/de/system_texts_v1.json` (systems.Bazi) | ja | ja | ja |
| Numerologie | `content/horoscope/de/system_texts_v1.json` (systems.Numerologie) | ja | ja | ja |
| Kabbalah | `content/horoscope/de/system_texts_v1.json` (systems.Kabbalah) | ja | ja | ja |
| Arabisch | `content/horoscope/de/system_texts_v1.json` (systems.Arabisch) | ja | ja | ja |
| Hellenistisch | `content/horoscope/de/system_texts_v1.json` (systems.Hellenistisch) | ja | ja | ja |
| Vedisch | `content/horoscope/de/system_texts_v1.json` (systems.Vedisch) | ja | ja | ja |

---

## 6. Render-/Composer-Hinweise

## 6.1 Reihenfolge im Output

1. Intro
2. Kernprofil-Absatz (optional)
3. 8 Dimensionsblöcke (fest oder priorisiert nach Gewicht)
4. Paracelsus-Outro

## 6.2 Dedupe

- Gleichlautende Kernaussagen in derselben Antwort nicht mehrfach.
- Bei inhaltlicher Nähe lieber mit Nuancierung zusammenfassen.

## 6.3 Variationssteuerung

- Satzmuster wechseln:
  - Claim -> Evidence
  - Evidence -> Claim
  - Framed Claim
- Lernhinweise sparsam einsetzen (max. jede zweite Dimension).

## 6.4 Sicherheit

- Keine diagnostischen/medizinischen Kausalbehauptungen.
- Keine definitiven Aussagen zu Schicksal oder Ereignissicherheit.
- Hinweise auf Tendenzcharakter explizit lassen.

---

## 7. Quality Checklist für Redaktionsreview

- [ ] System ist im Intro klar benannt.
- [ ] Vergleich zur westlichen Astrologie enthalten (wo sinnvoll).
- [ ] Alle 8 Dimensionen vorhanden.
- [ ] Keine direkte Identitätszuschreibung (`Du bist ...`).
- [ ] Konjunktiv und Tendenzsprache konsistent.
- [ ] Paracelsus-Abschluss vorhanden.
- [ ] Tags pro Abschnitt gesetzt.

---

## 8. Beispiel-Mikrostruktur pro Dimension

```text
[TAG] DIM_LIEBE_MEDIUM
Das System beschreibt fuer Beziehungen eine Tendenz zu ...
Demnach muesstest du ...
Das muss nicht bedeuten ..., aber ...
```

Diese Mikrostruktur gilt als Standard für alle sieben Systemdateien.
