# Regelwerk-Erweiterung: Numerologie & Kabbalah — Projektplan

## Stand: 19. Februar 2026

---

## Kontext & Designprinzipien

Beide Systeme werden analog zum westlichen Regelwerk strukturiert:
- Gleiche 8 Dimensionen: `liebe`, `beruf`, `finanzen`, `gesundheit`, `soziales`, `kreativitaet`, `veraenderung`, `spiritualitaet`
- Gleiche Skala: 1–5
- Gleiche JSON-Struktur mit `_meta`, Quellenangaben, und `dimensionen_vektor`
- **Eingabe:** Geburtsdaten (für Numerologie: Datum + Name; für Kabbalah: Datum + hebräische Buchstaben-Entsprechungen)

---

## TEIL A: NUMEROLOGIE (4 Gespräche)

### Quellen (alle public domain)
- **W. Wynn Westcott** — Numbers: Their Occult Power and Mystic Virtues (1890, Project Gutenberg #3203)
- **Pythagoras-Tradition** — Überliefert durch Iamblichos: Life of Pythagoras (ca. 300 n. Chr., public domain)
- **L. Dow Balliett** — The Philosophy of Numbers (1908, public domain)
- **Cheiro (Count Louis Hamon)** — Book of Numbers (1926, public domain in AT/EU)
- **Sepharial** — Kabalistic Astrology (1901, public domain) — Verbindung Zahlen/Planeten

---

### Gespräch N1 — Grundzahlen 1–9 (numerologie_basis.json)

**Inhalt:**
- Jede Zahl 1–9 als vollständiges Profil:
  - Planetarer Herrscher (1=Sonne, 2=Mond, 3=Jupiter, 4=Uranus/Erde, 5=Merkur, 6=Venus, 7=Neptun, 8=Saturn, 9=Mars)
  - Positive und negative Charaktereigenschaften
  - Dimensionsvektor (liebe/beruf/finanzen etc.)
  - Berufliche Neigungen
  - Beziehungskompatibilitäten (welche Zahlen harmonieren)
  - Gesundheitstendenzen
  - Farben, Tage, Edelsteine (klassische Entsprechungen)

**Ziel: ~60 Regeln**

---

### Gespräch N2 — Meisterzahlen & Lebenspfad-Berechnung (numerologie_lebenspfad.json)

**Inhalt:**
- **Meisterzahlen:** 11, 22, 33 — vertiefte Profile
  - 11: Der Visionär / Erleuchtete
  - 22: Der Meisterbauer / Manifestierer
  - 33: Der Meisterlehrer / Christusbewusstsein
- **Lebenspfadzahl-Berechnung:** Algorithmus Geburtstag → Lebenspfad (inkl. Sonderregel für Meisterzahlen)
- **Lebenspfad × Lebenspfad Kompatibilität:** 9×9 = 81 Kombinationen → Liebe, Beruf, Partnerschaft
- **Periodenzahlen:** Drei Lebenszyklen (Jugend, Mittelalter, Reife) aus Geburtsmonat, -tag, -jahr

**Ziel: ~100 Regeln**

---

### Gespräch N3 — Namens-Numerologie (numerologie_name.json)

**Inhalt:**
- **Buchstaben-Zahlen-Mapping:** Pythagoräisches System (A=1 bis Z=8) + Chaldäisches System (alternative Entsprechungen)
- **Seelendrang-Zahl** (Soul Urge): Summe der Vokale im Namen → innere Motivation
- **Ausdrucks-Zahl** (Expression): Summe aller Buchstaben → äußere Persönlichkeit
- **Persönlichkeitszahl** (Personality): Summe der Konsonanten → wie andere uns sehen
- **Schicksalszahl** (Destiny): Lebenspfad + Ausdruckszahl → Lebensaufgabe
- Regeln für Namenswechsel (Heirat, Künstlername): Wann förderlich, wann schädlich

**Ziel: ~70 Regeln**

---

### Gespräch N4 — Jahreszahlen & Zeitzyklen (numerologie_zyklen.json)

**Inhalt:**
- **Persönliches Jahr** (1–9): Berechnung + Bedeutung jedes Jahres im 9-Jahres-Zyklus
- **Persönlicher Monat:** Persönliches Jahr + aktueller Monat → monatliche Energie (81 Kombinationen)
- **Persönlicher Tag:** Feinsteuerung für tägliche Entscheidungen
- **Pinnacles (Höhepunkte):** 4 Lebensgipfel — Berechnung und Bedeutung
- **Challenges (Herausforderungen):** 4 Lebensherausforderungen — Berechnung und Bedeutung
- **Universelle Jahreszahl:** Wie das kollektive Jahr die persönliche Zahl beeinflusst

**Ziel: ~90 Regeln**

---

## TEIL B: KABBALAH / QABALAH (4 Gespräche)

### Quellen (alle public domain)
- **S.L. MacGregor Mathers** — The Kabbalah Unveiled (1887, Gutenberg-fähig)
- **Papus (Gérard Encausse)** — The Tarot of the Bohemians (1892, public domain)
- **W. Wynn Westcott** — Sepher Yetzirah (Übersetzung 1887, public domain)
- **Sefer Yetzirah** — Originaltext (3.–6. Jhd., public domain, Westcott-Übersetzung)
- **William Stirling** — The Canon (1897, public domain) — Zahlenmystik und Kabbalah
- **Israel Regardie** — The Garden of Pomegranates (1932) — noch geschützt, nur als Orientierung
- **Aleister Crowley** — 777 and Other Qabalistic Writings (1909, public domain in AT/EU)

---

### Gespräch K1 — Die 10 Sephiroth (kabbalah_sephiroth.json)

**Inhalt:**
- Jede der 10 Sephiroth als vollständiges Profil:
  - Name (hebräisch + deutsch), Nummer, Position am Baum
  - Planetare Entsprechung (Kether=Krone/Neptun, Chokmah=Uranus, Binah=Saturn, etc.)
  - Göttliche Namen (JHWH-Varianten)
  - Erzengel und Engelschöre
  - Tugend und Laster
  - Körperliche Entsprechung
  - Farbe (in vier Welten: Atziluth, Briah, Yetzirah, Assiah)
  - Dimensionsvektor für praktische Anwendung
  - Verbindung zur Numerologie (Sephira-Zahl)

**Ziel: ~70 Regeln / Datenpunkte**

---

### Gespräch K2 — Die 22 Pfade & Hebräische Buchstaben (kabbalah_pfade.json)

**Inhalt:**
- Jeder der 22 Pfade des Baumes:
  - Verbundene Sephiroth (von → nach)
  - Hebräischer Buchstabe + Bedeutung
  - Tarot-Entsprechung (Major Arcana)
  - Astrologische Entsprechung (Planet oder Zeichen)
  - Numerischer Wert (Gematria des Buchstabens)
  - Magische Qualität / spirituelle Lektion
  - Dimensionsvektor
- **3 Buchstabengruppen:** Mütter (Aleph, Mem, Shin), Doppelte (7 Buchstaben), Einfache (12 Buchstaben)

**Ziel: ~80 Regeln**

---

### Gespräch K3 — Gematria & Zahlenmystik (kabbalah_gematria.json)

**Inhalt:**
- **Gematria-System:** Vollständiges hebräisches Alphabet mit Zahlenwerten (1–900)
- **Wichtige Gematria-Werte:** Klassische bedeutungsvolle Zahlen (z.B. 26=JHWH, 72=Engelsnamen, 666/777/888)
- **Notarikon:** Akronym-Methode der Kabbalah
- **Temurah:** Buchstabenumtausch-Methode (AT-Bash etc.)
- **Namen-Analyse auf hebräisch:** Wie Geburtsnamen kabbalistisch ausgewertet werden
- **Verbindung Numerologie ↔ Gematria:** Mapping-Regeln zwischen beiden Systemen

**Ziel: ~60 Regeln + Mapping-Tabellen**

---

### Gespräch K4 — Die Vier Welten & Praktische Anwendung (kabbalah_welten.json)

**Inhalt:**
- **Vier Welten (Olamot):**
  - Atziluth (Emanation / Feuer) → spirituelle Archetypen
  - Briah (Schöpfung / Wasser) → mentale Prinzipien
  - Yetzirah (Formation / Luft) → emotionale Muster
  - Assiah (Aktion / Erde) → materielle Manifestation
- **Praktische Deutungsregeln:** Wie eine Zahl oder ein Name durch alle 4 Welten gelesen wird
- **Verbindung zu Planeten:** Kabbalistisches Planeten-Sephiroth-Mapping für Horoskop-Integration
- **Verbindung zu Bazi:** Fünf Elemente (Holz/Feuer/Erde/Metall/Wasser) ↔ Vier Welten — Synthese-Regeln
- **Qliphoth:** Die Schattenseiten der Sephiroth (10 Gegenpole) — für vollständige Deutung

**Ziel: ~80 Regeln**

---

## Übersicht & Reihenfolge

| # | Gespräch | Datei | Regeln | Status |
|---|----------|-------|--------|--------|
| N1 | Grundzahlen 1–9 | numerologie_basis.json | ~60 | ☐ offen |
| N2 | Meisterzahlen & Lebenspfad | numerologie_lebenspfad.json | ~100 | ☐ offen |
| N3 | Namens-Numerologie | numerologie_name.json | ~70 | ☐ offen |
| N4 | Jahreszahlen & Zyklen | numerologie_zyklen.json | ~90 | ☐ offen |
| K1 | Die 10 Sephiroth | kabbalah_sephiroth.json | ~70 | ☐ offen |
| K2 | 22 Pfade & Buchstaben | kabbalah_pfade.json | ~80 | ☐ offen |
| K3 | Gematria & Zahlenmystik | kabbalah_gematria.json | ~60 | ☐ offen |
| K4 | Vier Welten & Integration | kabbalah_welten.json | ~80 | ☐ offen |

**Gesamt geplant: ~610 neue Regeln in 8 Gesprächen**

---

## Quellen-Übersicht

| Quelle | Jahr | Status | Verwendung |
|--------|------|--------|------------|
| W.W. Westcott — Numbers: Their Occult Power | 1890 | ✓ public domain (Gutenberg #3203) | N1, N2, N3 |
| L. Dow Balliett — Philosophy of Numbers | 1908 | ✓ public domain | N1, N2 |
| Cheiro — Book of Numbers | 1926 | ✓ public domain AT/EU | N1, N2, N3 |
| Sepharial — Kabalistic Astrology | 1901 | ✓ public domain | N2, K1 |
| Westcott — Sepher Yetzirah (Übersetzung) | 1887 | ✓ public domain | K1, K2 |
| Mathers — The Kabbalah Unveiled | 1887 | ✓ public domain | K1, K2, K3 |
| Papus — Tarot of the Bohemians | 1892 | ✓ public domain | K2 |
| William Stirling — The Canon | 1897 | ✓ public domain | K3 |
| Crowley — 777 and Other Qabalistic Writings | 1909 | ✓ public domain AT/EU | K2, K3, K4 |
| Iamblichos — Life of Pythagoras | ~300 n.Chr. | ✓ public domain | N1 |

---

## Integration mit bestehenden Systemen

```
western_rules_complete.json
        ↓ Planeten-Entsprechungen
numerologie_basis.json ←→ kabbalah_sephiroth.json
        ↓ Zahlenmapping              ↓ Buchstaben-Zahlen
numerologie_name.json  ←→ kabbalah_gematria.json
        ↓                            ↓
numerologie_zyklen.json ←→ kabbalah_welten.json
                              ↓ Elemente-Synthese
                        bazi_rules_complete.json
```

Die gemeinsame Klammer sind die **Planeten**: Im westlichen System regieren sie Zeichen und Häuser, in der Numerologie regieren sie die Grundzahlen 1–9, in der Kabbalah entsprechen sie den mittleren Sephiroth (3–9). Das ermöglicht systemübergreifende Synthese-Regeln.

---

## Hinweise für die Gespräche

- Jedes Gespräch beginnt mit dem Hochladen dieses Projektplans + der `western_rules_complete.json` als Referenz für Format und Dimensionen
- Wenn möglich zusätzlich die relevante Vorgänger-JSON hochladen (z.B. für K1 die numerologie_basis.json als Referenz)
- Ziel ist immer: direkt deploybare JSON ohne Nachbearbeitung
