# Regelwerk-Erweiterung: Hellenistische Astrologie, Jyotish Dasha & Arabische Astrologie — Projektplan

## Stand: 20. Februar 2026

---

## Kontext & Designprinzipien

Alle drei Systeme werden analog zu den bestehenden Regelwerken strukturiert:
- Gleiche 8 Dimensionen: `liebe`, `beruf`, `finanzen`, `gesundheit`, `soziales`, `kreativitaet`, `veraenderung`, `spiritualitaet`
- Gleiche Skala: 1–5
- Gleiche JSON-Struktur mit `_meta`, Quellenangaben und `dimensionen_vektor`
- **Eingabe:** Geburtsdaten (Datum, Uhrzeit, Ort) — alle drei Systeme sind horoskopbasiert
- **Fokus:** Prognose und Lebenssituationen (nicht primär Persönlichkeit)

**Verhältnis zu bestehenden Systemen:**
- Hellenistische Astrologie erweitert `western_rules_complete.json` um historische Tiefentechniken
- Jyotish Dasha ist komplementär zu Bazi (beide: planetare Lebensphasen)
- Arabische Astrologie (Lose + Firdaria) ergänzt Hellenistik und Westliche Astrologie

---

## TEIL A: HELLENISTISCHE ASTROLOGIE (4 Gespräche)

### Quellen (alle public domain)

- **Vettius Valens** — Anthologies (ca. 160 n. Chr.) — Project Hindsight Übersetzung (Robert Schmidt, 1990er), Originaltext public domain; Mark Riley Übersetzung 2010 frei verfügbar
- **Dorotheus of Sidon** — Carmen Astrologicum (ca. 75 n. Chr.) — Originaltext public domain; David Pingree Übersetzung 1976 (teilweise public domain in AT/EU)
- **Claudius Ptolemy** — Tetrabiblos (ca. 150 n. Chr.) — F.E. Robbins Übersetzung 1940 (Loeb Classical Library), Originaltext public domain; J.M. Ashmand Übersetzung 1822 ✓ public domain
- **Julius Firmicus Maternus** — Mathesis (ca. 335 n. Chr.) — Originaltext public domain; Jean Rhys Bram Übersetzung 1975
- **Porphyry** — Introduction to the Tetrabiblos (ca. 270 n. Chr.) — public domain
- **Paulus Alexandrinus** — Introductory Matters (ca. 378 n. Chr.) — Originaltext public domain
- **Manilius** — Astronomica (ca. 10 n. Chr.) — public domain

---

### Gespräch H1 — Grundlagen: Würden, Sekte & Bonität (hell_wuerden.json)

**Inhalt:**

- **Essentielle Würden** — das vollständige System der planetaren Stärke:
  - Domizil (Herrschaft): jeder Planet in seinem eigenen Zeichen — 5 Profile (Sonne, Mond, Merkur, Venus, Mars, Jupiter, Saturn je Domizil)
  - Exaltation: Planet im stärksten Fremdzeichen (z.B. Sonne in Widder, Mond in Stier) — 7 Exaltationspunkte mit Grad-Angabe
  - Trigon / Triplizitätsherrscher: Tag-/Nacht-Herrscher der vier Elemente — 12 Kombinationen
  - Term / Grenze: Ptolemäische und Chaldäische Term-Tabellen — 60 Abschnitte (5 Planeten × 12 Zeichen)
  - Face / Dekane: 36 Dekan-Herrscher (je 10° pro Zeichen) — 36 Profile
  - Gegenwürden: Detriment, Fall — 14 Positionen mit Deutungsregeln

- **Sektprinzip (Hairesis):**
  - Tag-Horoskop vs. Nacht-Horoskop (Sonne über/unter Horizont)
  - Tag-Planeten: Sonne, Jupiter, Saturn
  - Nacht-Planeten: Mond, Venus, Mars
  - Merkur: neutral / sektabhängig
  - Wie Sektkonformität Planetenstärke und -qualität verändert — Deutungsregeln

- **Bonität / Malefic-Benefic-Spektrum:**
  - Große Wohltäter (Jupiter) / Große Unglücksbringer (Saturn) — Profile
  - Kleine Wohltäter (Venus) / Kleine Unglücksbringer (Mars) — Profile
  - Sonne und Mond als neutrale Leuchten
  - Wie Bonität durch Würden, Sekte und Aspekte modifiziert wird

- **Accidental Dignities:** Haus-Position, Winkel-Stärke, Orientalität/Okzidentalität, Retrogradität

**Ziel: ~90 Regeln**

---

### Gespräch H2 — Lots / Arabische Lose (hell_lots.json)

**Inhalt:**

- **Das Lot des Glücks (Pars Fortunae):**
  - Berechnung Tag-Horoskop: ASC + Mond − Sonne
  - Berechnung Nacht-Horoskop: ASC + Sonne − Mond
  - Vollständige Deutung in allen 12 Häusern (12 Regeln)
  - Lot des Glücks nach Zeichen (12 Regeln)
  - Herrscher des Lots des Glücks — Verstärker/Abschwächer

- **Das Lot des Geistes (Pars Spiritus / Lot of Spirit):**
  - Berechnung (Inverse des Glückslots)
  - Deutung: Wille, Handlung, bewusste Entscheidungen
  - Unterschied Glück (Empfangen) vs. Geist (Initiieren)
  - In allen 12 Häusern (12 Regeln)

- **Die 7 aphärischen Lose (nach Valens und Dorotheus):**
  - Lot der Liebe / Eros — Berechnung + Deutung
  - Lot der Notwendigkeit / Ananke — Berechnung + Deutung
  - Lot des Mutes / Thymós — Berechnung + Deutung
  - Lot des Sieges / Nike — Berechnung + Deutung
  - Lot des Nemesis — Berechnung + Deutung
  - Lot des Dämons / Daimon — Berechnung + Deutung (Lebensaufgabe)
  - Lot der Basis / Tyché — Berechnung + Deutung

- **Spezifische Lose für Lebensbereiche:**
  - Lot des Vaters (ASC + Saturn − Sonne)
  - Lot der Mutter (ASC + Mond − Venus)
  - Lot der Ehe für Mann / Frau (zwei verschiedene Formeln)
  - Lot der Kinder
  - Lot des Berufs / Pragmata
  - Lot des Reichtums
  - Lot des Exils / Reisen

- **Lot-Aktivierung:** Wann ein Lot durch Transits oder Zeitherren-Perioden aktiviert wird

**Ziel: ~80 Regeln**

---

### Gespräch H3 — Zeitherren-System: Chronokrators (hell_zeitherren.json)

**Inhalt:**

- **Das Système der Zeitherren** — Übersicht:
  - Unterschied zu modernen Progressionen
  - Welche Techniken Valens, Ptolemy und Dorotheus bevorzugen

- **Jährliche Profektionen (Annual Profections):**
  - Berechnung: Pro Lebensjahr rückt das ASC-Zeichen um ein Haus vor
  - Jahr-Herrscher (Lord of the Year): Planet der das aktivierte Zeichen beherrscht
  - Profektions-Tabelle: alle 12 Häuser als Zeitherren-Positionen (12 Regeln)
  - Wirkungsweise: welche Themen ein bestimmtes Profektionsjahr aktiviert
  - Kombination Profektionsjahr × Transitplanet des Jahr-Herrschers

- **Monatliche Profektionen:**
  - Feinsteuerung innerhalb des Jahres (Mond als Monatsherrscher)
  - 12 Monate × 12 mögliche Positionen = Deutungsmatrix

- **Dekaden-Profektionen (10-Jahres-Zyklen):**
  - Wie Dorotheus die längerfristigen Zyklen strukturiert

- **Zodiacal Releasing (Aphesis / Loslösung nach Valens):**
  - Startpunkt: Lot des Geistes (für Beruf/Handlung) oder Lot des Glücks (für Körper/Erfahrung)
  - Berechnung der Perioden nach Zeichen und ihrer Länge (Minor Years nach Valens)
  - Minor Years Tabelle: Widder=15, Stier=8, Zwillinge=20, Krebs=25, Löwe=19, Jungfrau=20, Waage=8, Skorpion=15, Schütze=12, Steinbock=27, Wassermann=30, Fische=12
  - Level 1 (Jahrzehnte) und Level 2 (Jahre) — Deutung der Überlappungen
  - Loosing of the Bond (Loslösung der Bindung): Schlüsselmomente im Leben

- **Fardaria nach hellenistischem Vorbild:** (Vorbereitung auf arabisches System)

**Ziel: ~85 Regeln**

---

### Gespräch H4 — Häuser, Aspekte & Integration (hell_haeuser.json)

**Inhalt:**

- **Whole Sign Houses (Ganze-Zeichen-Häuser):**
  - Warum die hellenistische Tradition Whole Sign bevorzugt
  - Unterschied zu modernen Häusersystemen (Placidus etc.)
  - Alle 12 Häuser in hellenistischer Interpretation (12 Regeln) — stärker prognostisch als modern

- **Die 5 hellenistischen Aspekte:**
  - Nur Konjunktion, Sextil, Quadrat, Trigon, Opposition — keine modernen Aspekte
  - Aspekte nach Zeichen (nicht nach Grad) — Whole Sign Aspekte
  - Überlieferungsregel: Planeten "sehen" sich — links/rechts-Konzept (Dexter/Sinister)
  - Reziprozität der Aspekte: beide Planeten betroffen vs. einseitige Einflussnahme

- **Planetare Begegnung und Übernahme:**
  - Conjunction (Verbindung): stärkste Verknüpfung
  - Reception (Empfang): Planet in Würde des anderen → besondere Kooperation
  - Mutual Reception: gegenseitiger Empfang — Deutungsregeln
  - Overcoming (Überwindung): ein Planet "besiegt" den anderen durch Quadrat von links
  - Testimony: mehrere Planeten bezeugen eine Aussage

- **Trigon-Herrscher-System:**
  - Vier Triplicities: Feuer, Erde, Luft, Wasser
  - Tag- und Nacht-Herrscher jeder Triplicität
  - Mitwirkender Herrscher (Participating Triplicity Ruler)
  - Drei Lebensabschnitte aus den drei Trigon-Herrschern → Lebensphasen-Prognose

- **Integration mit westlichem System:**
  - Welche hellenistischen Techniken die moderne westliche Astrologie direkt ergänzen
  - Syntheseregeln H ↔ Western
  - Syntheseregeln H ↔ Kabbalah (Sephiroth/Planeten)
  - Syntheseregeln H ↔ Numerologie (Zeitzyklen)

**Ziel: ~75 Regeln**

---

## TEIL B: JYOTISH — DASHA-SYSTEM & NAKSHATRAS (3 Gespräche)

### Quellen (alle public domain)

- **Parashara** — Brihat Parashara Hora Shastra (BPHS, ca. 600–800 n. Chr.) — Originaltext Sanskrit public domain; R. Santhanam Übersetzung 1984 (public domain in AT/EU nach 70 Jahren)
- **Varahamihira** — Brihat Jataka (ca. 550 n. Chr.) — public domain; B. Suryanarain Rao Übersetzung 1905 ✓ public domain
- **Mantreswara** — Phaladeepika (ca. 13. Jhd.) — public domain; G.S. Kapoor Übersetzung (public domain in AT/EU)
- **Kalyana Varma** — Saravali (ca. 800 n. Chr.) — public domain; Bangalore Sureshwara Übersetzung (public domain in AT/EU)
- **Vaidyanatha Dikshita** — Jataka Parijata (ca. 16. Jhd.) — public domain

**Hinweis zum Scope:** Wir fokussieren auf die prognostisch mächtigsten Werkzeuge: Vimshottari Dasha (Lebensphasen-System), Nakshatras (27 Mondstationen) und Yogas (planetare Konstellationen mit Schicksalscharakter). Der Lagna/Rasi-Teil (Aszendent/Zeichen) ist dem westlichen System sehr ähnlich und wird nur differenzierend behandelt.

---

### Gespräch J1 — Die 27 Nakshatras (jyotish_nakshatras.json)

**Inhalt:**

- **System-Übersicht:**
  - 27 Mondstationen à 13°20' — der Mond durchläuft alle 27 in ~27 Tagen
  - Basis des Vimshottari-Systems: Geburts-Nakshatra bestimmt den Dasha-Startpunkt
  - Unterschied zum westlichen Tierkreis: Mondbasiert statt Sonnenbasiert

- **Jedes der 27 Nakshatras als vollständiges Profil:**
  - Name (Sanskrit + Deutsch-Bedeutung)
  - Grad-Bereich im Tierkreis
  - Herrschender Planet (Nakshatra-Lord) — bestimmt Dasha-Periode
  - Symbol / Hauptbild
  - Devata (zugeordnete Gottheit)
  - Gana (Natur): Deva (göttlich), Manushya (menschlich), Rakshasa (dämonisch)
  - Varna (Kaste): Brahmin, Kshatriya, Vaishya, Shudra
  - Nadi (Körper-Prinzip): Vata, Pitta, Kapha
  - Pada 1–4 (je 3°20') — Navamsha-Zeichen
  - Hauptqualitäten / Stärken / Schwächen
  - Dimensionsvektor

- **27 vollständige Profile** (Ashwini bis Revati)

- **Nakshatra-Kompatibilität:** Kuta-System für Beziehungskompatibilität aus Mondnakshatras
  - Stri Dirgha (Distanz-Test)
  - Vashya (Anziehungs-Test)
  - Tara (Schicksals-Test)
  - Yoni (Sexuelle Kompatibilität)
  - Gana-Kompatibilität

**Ziel: ~95 Regeln (27 Profile + Kompatibilitätssystem)**

---

### Gespräch J2 — Vimshottari Dasha: Das Lebensphasen-System (jyotish_dasha.json)

**Inhalt:**

- **System-Übersicht Vimshottari:**
  - 120-Jahres-Gesamtzyklus, 9 Planeten-Perioden
  - Berechnung des Dasha-Startpunkts aus Geburts-Nakshatra und Mondposition
  - Reihenfolge: Ketu(7) → Venus(20) → Sonne(6) → Mond(10) → Mars(7) → Rahu(18) → Jupiter(16) → Saturn(19) → Merkur(17)

- **9 Maha Dasha (Hauptperioden) — vollständige Profile:**
  - Für jede Maha Dasha: Dauer, Planet, Haupt-Themen, typische Lebensereignisse, Chancen, Risiken, Dimensionsvektor
  - Sonderpositionen: Rahu und Ketu (Mondknoten) als Schattenplaneten

- **Antardasha (Unterperioden) — 81 Kombinationen:**
  - Für jede der 9 × 9 = 81 Maha/Antar-Kombinationen: Qualität der Unterperiode
  - Methode: Kompatibilitäts-Matrix (freundliche vs. feindliche Planeten im Dasha-System)
  - Vereinfachte Regeln für alle 81 Kombinationen als Lookup-Tabelle

- **Pratyantardasha (Unter-Unterperioden):** Prinzip + Berechnungsformel

- **Dasha-Aktivierung durch Transit:**
  - Wie Transits (Gochara) die aktive Dasha-Periode verstärken oder schwächen
  - Doppelte Aktivierung: Dasha-Planet transit über Geburtsplaneten
  - Saturn-Transit (Sade Sati) über Mondzeichen — Sonderregel

- **Berechnung des Restbetrags:** Wie man den genauen Eintrittspunkt in die erste Dasha berechnet

**Ziel: ~100 Regeln**

---

### Gespräch J3 — Yogas & Lagna-Integration (jyotish_yogas.json)

**Inhalt:**

- **Was sind Yogas:**
  - Planetare Konstellationen im Geburtshoroskop die Schicksalscharakter haben
  - Yogas als "Programmierung" die durch Dashas aktiviert werden
  - Unterschied: Yoga vorhanden ≠ Yoga aktiviert — Aktivierung braucht Dasha-Trigger

- **Raja Yogas (Königliche Yogas — Macht und Status):**
  - Definition: Herrscher von Kendra (1,4,7,10) + Herrscher von Trikona (1,5,9) in Verbindung
  - 20 wichtigste Raja Yoga-Kombinationen mit Deutung
  - Neecha Bhanga Raja Yoga: Debilitation aufgehoben → besonderer Aufstieg

- **Dhana Yogas (Reichtums-Yogas):**
  - Verbindung der Herrscher von Häusern 1, 2, 5, 9, 11
  - 15 wichtigste Dhana Yoga-Kombinationen

- **Nabhasa Yogas (Form-Yogas — Charakter der Planetenverteilung):**
  - Alle Planeten in 1 Zeichen (Gola), 2 Zeichen (Yuga), etc.
  - Rajju, Musala, Nala, Mala Yoga

- **Pancha Mahapurusha Yogas (5 Große-Persönlichkeits-Yogas):**
  - Ruchaka (Mars in Kendra/Eigenes Zeichen)
  - Bhadra (Merkur in Kendra/Eigenes Zeichen)
  - Hamsa (Jupiter in Kendra/Eigenes Zeichen)
  - Malavya (Venus in Kendra/Eigenes Zeichen)
  - Shasha (Saturn in Kendra/Eigenes Zeichen)

- **Arishtana Yogas (Herausforderungs-Yogas):**
  - Kala Sarpa Yoga (alle Planeten zwischen Rahu und Ketu)
  - Kemdrum Yoga (Mond ohne Nachbarn)
  - Graha Malika (Planeten-Kette)

- **Lagna-Qualitäten (Aszendent):** Unterschiede zu westlichem ASC — prognostische Gewichtung
- **Arudha Lagna:** Das weltliche Image vs. das echte Selbst — Berechnung + Deutung

- **Integration mit bestehenden Systemen:**
  - Jyotish Dasha ↔ Bazi Dayun (Dekaden-Pfeiler): Syntheseregeln
  - Nakshatras ↔ westliche Mondzeichen: Verbindungsregeln
  - Yogas ↔ westliche Aspektmuster: Analogie-Mapping

**Ziel: ~90 Regeln**

---

## TEIL C: ARABISCHE ASTROLOGIE — LOSE & FIRDARIA (3 Gespräche)

### Quellen (alle public domain)

- **Abu Ma'shar (Albumasar)** — Introductorium in Astronomiam (ca. 850 n. Chr.) — Originaltext public domain; Lemay Übersetzung 1962 (public domain in AT/EU)
- **Al-Qabisi (Alcabitius)** — Introduction to the Art of Astrology (ca. 950 n. Chr.) — Originaltext public domain; Burnett/Yamamoto Übersetzung 2004 (noch geschützt — nur als Orientierung; Originaltext public domain)
- **Al-Biruni** — Book of Instruction in the Elements of the Art of Astrology (1029 n. Chr.) — R. Ramsay Wright Übersetzung 1934 ✓ public domain in AT/EU
- **Masha'allah ibn Athari** — On Reception (ca. 800 n. Chr.) — public domain
- **Sahl ibn Bishr (Zahel)** — Introduction to the Science of the Judgments of the Stars (ca. 820 n. Chr.) — public domain
- **Guido Bonatti** — Liber Astronomiae (ca. 1277 n. Chr.) — Originaltext public domain; teilweise Übersetzungen public domain

---

### Gespräch A1 — Die Arabischen Lose: Vollständiges System (arabisch_lose.json)

**Inhalt:**

- **System-Übersicht:**
  - Geschichte der arabischen Lose (Herkunft aus hellenistischer Tradition)
  - Wie Lose Horoskop-Punkte sind die aus drei anderen Punkten berechnet werden
  - Tag/Nacht-Unterscheidung bei allen Losen (Al-Biruni)
  - Unterschied zu hellenistischen Losen: arabische Tradition erweitert auf 97+ Lose

- **Die 7 Haupt-Lose (Al-Biruni / Sahl ibn Bishr):**

  Jedes Lot mit: Formel (Tag + Nacht), Bedeutung, Haus-Positionen (12 Deutungen), Herrscher-Qualität

  - Lot des Glücks (Sahm al-Sa'ada) — Körper, Gesundheit, materielle Ressourcen
  - Lot des Geistes (Sahm al-'Aql) — Seele, Wille, Intellekt
  - Lot der Liebe (Sahm al-Hubb) — Beziehungen, Eros
  - Lot der Ehe für Männer / Lot der Ehe für Frauen — zwei separate Profile
  - Lot der Kinder (Sahm al-Awlad) — Nachkommen
  - Lot des Vaters (Sahm al-Ab)
  - Lot der Mutter (Sahm al-Umm)

- **Berufsspezifische Lose:**
  - Lot des Berufs / Pragmata (Sahm al-'Amal)
  - Lot des Reichtums (Sahm al-Mal)
  - Lot des Königs / der Autorität (Sahm al-Sulthan)
  - Lot des Handels
  - Lot der Reisen

- **Schicksals-Lose:**
  - Lot der Verborgenheit / Exil
  - Lot des Lebens (Sahm al-Hayy)
  - Lot des Todes (Lot der gefährlichen Zeiten)
  - Lot der Nemesis

- **Lot-Aktivierung und Timing:**
  - Lot-Herrscher im Transit
  - Profektionen über Lot-Position
  - Direktionen zum Lot

**Ziel: ~85 Regeln**

---

### Gespräch A2 — Firdaria: Das Planetare Lebensphasen-System (arabisch_firdaria.json)

**Inhalt:**

- **System-Übersicht Firdaria:**
  - Herkunft: persisch-arabische Tradition, Abu Ma'shar zugeschrieben
  - 75-Jahres-Gesamtzyklus (Tag-Horoskop) / 75 Jahre (Nacht-Horoskop — andere Reihenfolge)
  - Sieben Planeten + Mondknoten Rahu/Ketu (Nord-/Südknoten) als Zeitherren
  - Vergleich mit Jyotish Vimshottari: ähnliches Konzept, andere Planeten-Dauern

- **Firdaria-Reihenfolge und Dauern:**

  *Tag-Horoskop (Sonne über Horizont):*
  Sonne(10 J.) → Venus(8 J.) → Merkur(13 J.) → Mond(9 J.) → Saturn(11 J.) → Jupiter(12 J.) → Mars(7 J.) → Nordknoten(3 J.) → Südknoten(2 J.) = 75 Jahre

  *Nacht-Horoskop (Mond unter Horizont):*
  Mond(9 J.) → Saturn(11 J.) → Jupiter(12 J.) → Mars(7 J.) → Sonne(10 J.) → Venus(8 J.) → Merkur(13 J.) → Nordknoten(3 J.) → Südknoten(2 J.) = 75 Jahre (umgekehrte Reihenfolge mit Sekt-Logik)

- **9 Haupt-Firdaria — vollständige Profile:**
  - Für jeden Hauptherrscher: Dauer, Lebensthemen, typische Ereignisse, Chancen, Risiken, Dimensionsvektor
  - Sonderprofil: Nordknoten-Periode (3 J.) — karmische Expansion
  - Sonderprofil: Südknoten-Periode (2 J.) — karmische Abgabe

- **Unter-Firdaria (Sub-Perioden):**
  - Jede Hauptperiode unterteilt in 7 Sub-Perioden (ein Planet pro Sub-Periode)
  - Sub-Perioden-Dauer: Hauptdauer ÷ 7 (gewichtet nach Rang)
  - 9 × 7 = 63 Unter-Firdaria-Kombinationen: Qualitäts-Matrix (freundlich/feindlich/neutral)

- **Berechnung des Einstiegspunkts:**
  - Aus Geburtsdatum + Tag/Nacht-Bestimmung
  - Restperiode der ersten Firdaria berechnen

- **Firdaria-Aktivierung:**
  - Transit des Firdaria-Herrschers
  - Lot-Aktivierung durch Firdaria
  - Zusammenspiel Firdaria + Profektionsjahr → Doppelaktivierung

**Ziel: ~85 Regeln**

---

### Gespräch A3 — Arabische Techniken: Direktionen, Almuten & Integration (arabisch_techniken.json)

**Inhalt:**

- **Der Almuten (اَلْمُوتَن — Stärkster Planet):**
  - Berechnung des Almuten eines Grades: wer hat die meisten Würdepunkte?
  - Almuten Figuris: stärkster Planet des gesamten Horoskops
  - Berechnung nach Al-Biruni: Punkte für Domizil(5) + Exaltation(4) + Trigon(3) + Term(2) + Face(1)
  - Praktische Deutung: Der Almuten ist der "heimliche Herrscher" des Horoskops
  - 12 Almuten-Positionen (nach Haus) — Deutungsregeln

- **Primäre Direktionen:**
  - Ptolemäische Direktionen: Ascendant-Bogen Methode
  - Schlüsselprinzip: 1° = 1 Jahr
  - Direktionen zum Ascendant, Midheaven, Lot des Glücks
  - Prominente Ereignisse aus Direktionen — Timing-Regeln

- **Arabische Aspekt-Theorie:**
  - Reception (gegenseitiger Empfang): zwei Planeten in gegenseitiger Würde
  - Hayz: Planet in eigener Sekte, eigenem Geschlecht, eigenem Halbbogen → maximale Stärke
  - Cazimi: Planet im Herzpunkt der Sonne (exakt 17' Konjunktion) → in Gottes Angesicht
  - Combustion vs. Under the Beams: Schwächung durch Sonnennähe
  - Void of Course Mond (arabische Definition)

- **Interrogationes (Horoskopie / Mundanastrologie):**
  - Kurzer Überblick: wann Fragensteller-Horoskop relevant ist
  - Nicht Geburtsdaten, sondern Frage-Zeitpunkt — als ergänzende Technik

- **Synthese-Regeln — arabisch ↔ alle anderen Systeme:**
  - Arabisch ↔ Hellenistisch: Kontinuität der Techniken
  - Arabisch ↔ Westlich: welche arabischen Lots direkt im modernen Horoskop anwendbar sind
  - Arabisch ↔ Kabbalah: Planetare Brücken (Sephiroth ↔ Firdaria-Planeten)
  - Arabisch ↔ Jyotish: Firdaria ↔ Vimshottari: Vergleich der Perioden-Qualitäten
  - Arabisch ↔ Bazi: Almuten ↔ stärkster Tagesstamm — Parallele des "dominierenden Prinzips"

**Ziel: ~80 Regeln**

---

## Übersicht & Reihenfolge

| # | Gespräch | Datei | Regeln | Status |
|---|----------|-------|--------|--------|
| H1 | Hellenistisch: Würden & Bonität | hell_wuerden.json | ~90 | ☐ offen |
| H2 | Hellenistisch: Arabische Lose | hell_lots.json | ~80 | ☐ offen |
| H3 | Hellenistisch: Zeitherren/Chronokrators | hell_zeitherren.json | ~85 | ☐ offen |
| H4 | Hellenistisch: Häuser, Aspekte, Integration | hell_haeuser.json | ~75 | ☐ offen |
| J1 | Jyotish: 27 Nakshatras | jyotish_nakshatras.json | ~95 | ☐ offen |
| J2 | Jyotish: Vimshottari Dasha | jyotish_dasha.json | ~100 | ☐ offen |
| J3 | Jyotish: Yogas & Integration | jyotish_yogas.json | ~90 | ☐ offen |
| A1 | Arabisch: Arabische Lose | arabisch_lose.json | ~85 | ☐ offen |
| A2 | Arabisch: Firdaria | arabisch_firdaria.json | ~85 | ☐ offen |
| A3 | Arabisch: Techniken & Integration | arabisch_techniken.json | ~80 | ☐ offen |

**Gesamt geplant: ~865 neue Regeln in 10 Gesprächen**

---

## Quellen-Übersicht

| Quelle | Jahr | Status | Verwendung |
|--------|------|--------|------------|
| Vettius Valens — Anthologies | ca. 160 n. Chr. | ✓ public domain (Mark Riley Übersetzung frei) | H2, H3 |
| Ptolemy — Tetrabiblos (Ashmand Übers.) | 1822 | ✓ public domain | H1, H4 |
| Dorotheus of Sidon — Carmen Astrologicum | ca. 75 n. Chr. | ✓ Originaltext public domain | H2, H3 |
| Julius Firmicus Maternus — Mathesis | ca. 335 n. Chr. | ✓ public domain | H1, H4 |
| Paulus Alexandrinus — Introductory Matters | ca. 378 n. Chr. | ✓ public domain | H1 |
| Parashara — BPHS (Santhanam Übers.) | ca. 700 n. Chr. | ✓ public domain AT/EU | J1, J2, J3 |
| Varahamihira — Brihat Jataka (Rao Übers.) | 1905 | ✓ public domain | J1, J3 |
| Mantreswara — Phaladeepika | ca. 13. Jhd. | ✓ public domain AT/EU | J2, J3 |
| Abu Ma'shar — Introductorium (Originaltext) | ca. 850 n. Chr. | ✓ public domain | A1, A2 |
| Al-Biruni — Book of Instruction (Wright Übers.) | 1934 | ✓ public domain AT/EU (>70 J.) | A1, A2, A3 |
| Sahl ibn Bishr — Introduction | ca. 820 n. Chr. | ✓ Originaltext public domain | A1, A3 |
| Guido Bonatti — Liber Astronomiae (Orig.) | ca. 1277 | ✓ public domain | A2, A3 |
| Masha'allah — On Reception | ca. 800 n. Chr. | ✓ public domain | A3 |

---

## Systemarchitektur & Integration

```
western_rules_complete.json
        ↓ Planeten/Zeichen/Häuser
hell_wuerden.json ←→ hell_lots.json ←→ hell_zeitherren.json ←→ hell_haeuser.json
        ↓ Planeten als gemeinsame Brücke
arabisch_lose.json ←→ arabisch_firdaria.json ←→ arabisch_techniken.json
        ↓ Almuten / Firdaria-Planeten ↔ Sephiroth
kabbalah_sephiroth.json / kabbalah_welten.json
        ↓ Planetare Lebensphasen
jyotish_dasha.json ←→ jyotish_nakshatras.json ←→ jyotish_yogas.json
        ↓ Dasha ↔ Bazi Dayun
bazi_rules_complete.json
```

**Die drei neuen Systeme verbinden sich zu den bestehenden über:**

1. **Planeten** — alle Systeme teilen dieselben 7 klassischen Planeten (Sonne bis Saturn); Rahu/Ketu (Jyotish) = Mondknoten (westlich); Mondknoten (arabisch) = dieselben
2. **Zeitherren-Prinzip** — Hellenistische Profektionen, Arabische Firdaria, Jyotish Vimshottari Dasha und Bazi Dayun (Dekaden-Pfeiler) sind alle Varianten desselben Grundprinzips: planetare Lebensabschnitte
3. **Lots/Arabische Lose** — verbinden Hellenistik und Arabische Tradition direkt
4. **Häuser** — Whole Sign (Hellenistik) ↔ Bhava (Jyotish) ↔ Häuser (westlich): strukturelle Homologie

---

## Hinweise für die Gespräche

- Jedes Gespräch beginnt mit dem Hochladen **dieses Projektplans** + der `western_rules_complete.json` als Format-Referenz
- Für Gespräche H2/H3: zusätzlich `hell_wuerden.json` hochladen (Vorgänger-Referenz)
- Für Gespräche J2/J3: zusätzlich `jyotish_nakshatras.json` hochladen
- Für Gespräche A2/A3: zusätzlich `arabisch_lose.json` + `arabisch_firdaria.json` hochladen
- Für alle Integrations-Gespräche (H4, J3, A3): zusätzlich `kabbalah_welten.json` als Synthese-Referenz
- Ziel ist immer: direkt deploybare JSON ohne Nachbearbeitung

### Empfohlene Reihenfolge:
**Zuerst H1→H4** (Hellenistik baut das Fundament für Arabistik)
**Dann A1→A3** (Arabistik baut auf hellenistischer Basis auf)
**Parallel oder danach J1→J3** (Jyotish ist unabhängiger, kann eigenständig erarbeitet werden)
