# UI-Spezifikation pro System (v1)

Ziel: fachlich korrekte Standarddarstellung je System, aber einheitliche Produkt-UX.

---

## 1. Gemeinsamer Rahmen (alle Systeme)

- Header: Systemname, kurzer Kontextsatz, Datenqualitaet (Geburtszeit genau/ungenau)
- Kernaussage: Skill (mit Perzentil), Fit (absolut)
- Hauptvisual: systemspezifisch (nicht ueberall Kreis)
- Detailtabs: Grundlage, Interpretation, Methodik
- Footer-Hinweis: Vergleichsmetrik basiert auf Antworten, nicht auf objektiver Wahrheit

---

## 2. Systemvisuals

## 2.1 Westlich (Standard-Radix)

**Primaervisual**
- 12 Zeichenring
- 12 Haeuser
- Planeten-Glyphen
- Aspektlinien (0/60/90/120/180, Orb konfigurierbar)
- AC/DC, MC/IC

**Sekundaerinfos**
- Tabelle: Planet, Zeichen, Haus, Grad
- Aspektliste: Planet A - Planet B - Aspekttyp - Orb

**MVP-Hinweis**
- Wenn keine praezisen Ephemeriden genutzt werden: als vereinfachtes Modell markieren

## 2.2 Hellenistisch (eigener Stil, aehnliche Geometrie)

**Primaervisual**
- Kreisdiagramm wie Westlich, aber:
  - Whole Sign Houses als Default
  - Fokus auf Hausaktivierung/Jahresherrscher (Profektionen)
  - optional Lots als Markierungen

**Sekundaerinfos**
- Aktives Haus (Profektion), Herrscher, zentrale Deutung
- Tag-/Nacht-Sekte als Badge

**Wichtig**
- Kein 1:1 Kopieren westlicher Deutungstexte; nur Geometrie ist verwandt

## 2.3 Bazi / Chinesisch (kein Rad als Primaerstandard)

**Primaervisual**
- 4-Saeulen-Panel (Jahr/Monat/Tag/Stunde)
- je Saeule: Himmelsstamm + Erdzweig
- 5-Elemente-Balance (Balken oder Radar)
- Luck-Pillars-Timeline (10-Jahres-Phasen)

**Sekundaerinfos**
- Day Master
- guenstige/unguensige Elementtendenzen (wenn vorhanden)
- optional Interaktionshinweise (naehrend/kontrollierend)

**Wichtig**
- Das ist der fachlich passende Bazi-Standard

## 2.4 Numerologie

**Primaervisual**
- Zahlenkarte (Lebenspfadzahl zentral, Nebenwerte ringfoermig/karteikartenartig)

**Sekundaerinfos**
- Herkunft der Zahlen (Geburtsdatum, optional Name)
- Kurzdeutung je Kernzahl

## 2.5 Kabbalah

**Primaervisual**
- Baum des Lebens (10 Sephiroth + Pfade), aktive Knoten hervorgehoben

**Sekundaerinfos**
- Zugeordnete Sephira, Schwerpunktachsen, Kurzdeutung

## 2.6 Arabisch

**Primaervisual**
- Zeitachsen-/Periodendiagramm (Firdaria), optional Lose-Panel

**Sekundaerinfos**
- Aktuelle Periode, naechster Wechsel, thematische Schwerpunkte

## 2.7 Vedisch / Jyotish (je nach internem Modell)

**Wenn intern als Jyotish gefuehrt**
- Primaervisual: Nakshatra-/Dasha-orientiert (eher Tabelle/Timeline als West-Rad)
- Sekundaerinfos: aktive Mahadasha-Periode, relevante Qualitaeten

---

## 3. Ergebnis-Screen: empfohlene Reihenfolge

1. Gesamtranking (Skill, Perzentil, Fit; Hinweis zum Gewinner-Effekt)
2. Systemkarte pro System (einheitlicher Header + systemspezifische Hauptvisualisierung)
3. Methodik-Sektion (Vergleich mit anderen Geburtsdaten, `docs/Erklärungen/skill_fuer_spieler.md`)
4. Unsicherheit/Genauigkeit (z. B. Geburtszeit fehlt)

---

## 4. Datenmodell fuer Frontend-Komponenten

Jedes System liefert mindestens:

- `systemId`, `displayName`
- `scores`: `skill`, `perzentil`, `fit`
- `qualityFlags`: `birthTimeKnown`, `modelType`
- `visualPayload`: system-spezifische Datenstruktur
- `explanation`: 2-4 Saetze + optional Longform

Damit koennen Systemkomponenten getrennt rendern, aber im selben UX-Rahmen bleiben.

---

## 5. Referenzdateien

- JSON-Referenz: `docs/konzepte/visual_payload_schema_v1.json`
- TypeScript-Typen: `docs/konzepte/visual_payload_types_v1.ts`

---

## 6. Layer-Architektur fuer Hover/Blend (v1)

Um spaetere Changier-/Parallax-Effekte ohne Umbau zu ermoeglichen, wird jedes Diagramm
von Anfang an als Layer-Szene gebaut (nicht als ein einziges "End-SVG").

**Pflichtlayer (alle Systeme)**
- `baseLayer`: statische Grundgeometrie (Ringe, Panels, Achsen, Rahmen)
- `dataLayer`: fachliche Hauptobjekte (Planeten, Saeulen, Knoten, Zahlen)
- `relationLayer`: Verbindungen/Aspekte/Interaktionen
- `highlightLayer`: Fokus-Overlay (Opacity, Glow, Stroke-Boost)
- `labelLayer`: Beschriftung/Legende
- `fxLayer` (optional): sanfte Muster, Lichtverlauf, Grid-Reaktion

**Interaktionsmodi (umschaltbar)**
- `gridFocus`: Fokus folgt einem 3x3-Raster ueber der ganzen Visualisierung
- `entityFocus`: Fokus folgt direkt einem Objekt (z. B. Planet hover)
- `hybrid`: gridFocus als Default, entityFocus bei explizitem Objekt-Hover

**Blend-Regel**
- Zentralfeld (`MC`) zeigt immer die komplexe Gesamtdarstellung.
- Randfelder reduzieren "visuelles Rauschen" und heben nur Teilaspekte hervor.

---

## 7. 3x3 Hover-Raster

Rasterkoordinaten:

```text
TL | TC | TR
ML | MC | MR
BL | BC | BR
```

`MC` = Zentrum (full composition).

### 7.1 Erlaubte Feldmengen pro System

- **2 Felder**: `ML`, `MR` (links/rechts) oder `TC`, `BC` (oben/unten)
- **3 Felder**: `TL`, `TC`, `TR` (obere Reihe)
- **4 Felder**: `TC`, `ML`, `MR`, `BC` (Kreuz)
- **5 Felder**: `TL`, `TC`, `TR`, `ML`, `MR`
- **6 Felder**: `TL`, `TC`, `TR`, `BL`, `BC`, `BR`
- **8 Felder**: alle ausser `MC`

---

## 8. Layerplan pro System inkl. Rasterprofil

## 8.1 Westlich

**Layergewichtung**
- baseLayer: Zeichenring, Haeuser, Achsen
- dataLayer: Planeten
- relationLayer: Aspekte
- highlightLayer: Fokus Planet, Fokus Aspektgruppe

**Rasterprofil (8 Felder + Zentrum)**
- `MC`: full chart
- `TL/TC/TR`: Luft/Feuer-orientierte Betonung (oben)
- `ML/MR`: linke/rechte Hemisphaere
- `BL/BC/BR`: Wasser/Erde-orientierte Betonung (unten)

**Schnellvariante**
- 2 Felder: `ML` (persoenlich/innen), `MR` (sozial/aussen)

## 8.2 Hellenistisch

**Layergewichtung**
- baseLayer: Whole-sign wheel, Achsen
- dataLayer: Planeten + House Lords
- relationLayer: Aspekte + Lots
- highlightLayer: Profektionshaus + Sekt

**Rasterprofil (5 Felder)**
- `MC`: full chart
- `TL/TC/TR`: Chronokrator/Profektion-Varianten
- `ML/MR`: Tag-/Nacht-Sekte und Lord-Fokus

## 8.3 Bazi (Chinesisch)

**Layergewichtung**
- baseLayer: 4-Saeulen-Rahmen
- dataLayer: Himmelsstaemme/Erdzweige, Day Master
- relationLayer: Elementzyklen (naehrend/kontrollierend)
- highlightLayer: aktive Luck-Pillar + Elementfokus

**Rasterprofil (6 Felder)**
- `MC`: full composition
- `TL/TC/TR`: Jahr/Monat/Tag Schwerpunkt
- `BL/BC/BR`: Luck-Pillar und Element-Dynamik

**Schnellvariante**
- 3 Felder oben (`TL/TC/TR`) fuer reine Saeulenbetonung

## 8.4 Numerologie

**Layergewichtung**
- baseLayer: Zahlenraster/Ringe
- dataLayer: Kernzahlen
- relationLayer: Verbindungsachsen
- highlightLayer: aktive Zahl + Deutungsschwerpunkt

**Rasterprofil (4 Felder)**
- `MC`: full view
- `TC`: Lebenspfad/zentral
- `ML`: innere Zahlen (z. B. Seelenzahl)
- `MR`: aeussere Zahlen (z. B. Persoenlichkeitszahl)
- `BC`: Zeitbezug (persoenliches Jahr)

## 8.5 Kabbalah

**Layergewichtung**
- baseLayer: Baumstruktur
- dataLayer: Sephiroth
- relationLayer: Pfade
- highlightLayer: aktive Sephira + Pfadkette

**Rasterprofil (5 Felder)**
- `MC`: kompletter Baum
- `TC`: obere Triade
- `ML/MR`: linke/rechte Saeule
- `BC`: Malkuth/Fundament-Ebene

## 8.6 Arabisch

**Layergewichtung**
- baseLayer: Periodenring/-achse (Firdaria)
- dataLayer: aktive Periode/Subperiode
- relationLayer: Lose/periodische Uebergaenge
- highlightLayer: aktueller Zeitschnitt + naechster Wechsel

**Rasterprofil (3 oder 4 Felder)**
- 3 Felder: `TL`, `TC`, `TR` (Vergangenheit/Gegenwart/naechste Periode)
- optional 4 Felder mit `BC` fuer Lose-Schwerpunkt

## 8.7 Vedisch / Jyotish

**Layergewichtung**
- baseLayer: Nakshatra-/Dasha-Rahmen (nicht zwingend Rad)
- dataLayer: aktive Mahadasha/Antardasha
- relationLayer: Nakshatra-Gruppen, Planetenbezug
- highlightLayer: aktuelle Phase + Folgeschritt

**Rasterprofil (6 Felder)**
- `MC`: full view
- `TL/TC/TR`: Dasha-Hierarchie (Maha/Antar/Pratyantar)
- `BL/BC/BR`: Nakshatra-/Themen-Schwerpunkte

---

## 9. Implementierungsnotizen (wichtig fuer Prototyp)

- Interaktions-Engine von Rendering trennen:
  - `sceneModel` (Daten),
  - `layerRenderer` (SVG-Gruppen),
  - `focusController` (grid/entity/hybrid).
- Nur `focusController` darf Layer-Opacity/Filter aendern.
- Jeder Systemrenderer liefert:
  - `supportedGridProfile` (`2|3|4|5|6|8`),
  - `defaultMode` (`gridFocus`),
  - `focusMap` (Feld -> Highlight-Regeln).

So bleibt der schnelle Prototyp spaeter ohne Zerlegen auf Changier-/Parallax-Effekte erweiterbar.
