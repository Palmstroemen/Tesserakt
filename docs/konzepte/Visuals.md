# UI-Spezifikation pro System (v1)

Ziel: fachlich korrekte Standarddarstellung je System, aber einheitliche Produkt-UX.

---

## 1. Gemeinsamer Rahmen (alle Systeme)

- Header: Systemname, kurzer Kontextsatz, Datenqualitaet (Geburtszeit genau/ungenau)
- Kernaussage: Fit (absolut), Zufallsvorteil (oder Skill vs Zufall), Delta zu KO
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

1. Gesamtranking (Fit, Zufallsvorteil, Delta zu KO)
2. Systemkarte pro System (einheitlicher Header + systemspezifische Hauptvisualisierung)
3. Methodik-Sektion (inklusive KO-Aufklaerung)
4. Unsicherheit/Genauigkeit (z. B. Geburtszeit fehlt)

---

## 4. Datenmodell fuer Frontend-Komponenten

Jedes System liefert mindestens:

- `systemId`, `displayName`
- `scores`: `fit`, `randomAdvantage`, `deltaFitToKO`, `deltaRandomAdvantageToKO`
- `qualityFlags`: `birthTimeKnown`, `modelType`
- `visualPayload`: system-spezifische Datenstruktur
- `explanation`: 2-4 Saetze + optional Longform

Damit koennen Systemkomponenten getrennt rendern, aber im selben UX-Rahmen bleiben.

---

## 5. Referenzdateien

- JSON-Referenz: `docs/konzepte/visual_payload_schema_v1.json`
- TypeScript-Typen: `docs/konzepte/visual_payload_types_v1.ts`
