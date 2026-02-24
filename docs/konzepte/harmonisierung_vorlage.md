# Harmonisierungsvorlage Konzepte (A/B/C)
## Single Source of Truth (SSOT)

*Horoskop Assessment - Konsolidierungsvorlage*  
*Stand: Februar 2026*

---

## 1) Ziel dieses Dokuments

Dieses Dokument definiert den gemeinsamen Zielzustand fuer:

- `Experiment.md`
- `gamification_konzept.md`
- `spiel_c_konzept.md`
- `spieldesign.md` (aus `spieldesign.docx` ueberfuehrt)

Es ist keine neue Produktidee, sondern eine Vereinheitlichung:
- einheitliche Begriffe,
- einheitliche Scoring-Logik,
- einheitliche Spielabfolge,
- klare Abgrenzung zwischen **MVP (jetzt)** und **Roadmap (spaeter)**.

---

## 2) Verbindliche Begriffe (Glossar)

Diese Begriffe gelten in allen Konzepten identisch:

- **Spiel A - Persoenlichkeit**: 1-Personen-Profil (aktueller Hauptflow).
- **Spiel B - Prognose/Zeit**: Rueckblick auf vergangene Zeitfenster (nicht live im MVP).
- **Spiel C - Beziehung**: 2-Personen-Kompatibilitaet (Konzeptphase).
- **Systeme**: Westlich, Bazi, Numerologie, Kabbalah, Arabisch, Hellenistisch, Vedisch.
- **KO (Kontrollgruppe)**: deterministische Zufalls-Baseline ohne astrologische Bedeutung.
- **Fit (absolut)**: absolute Naehe zur Selbsteinschaetzung.
- **Skill vs Zufall**: Leistung relativ zur Zufalls-Baseline.
- **Delta zu KO**: Differenz eines Systems gegen KO (Fit/Skill).

Nicht mehr verwenden als primaere Nutzermetrik:
- `Rank-Score` als Hauptkommunikation im UI.

---

## 3) Produktzustand: Jetzt vs. Spaeter

## 3.1 MVP (jetzt, implementiert)

- Einstieg: Geburtsdaten.
- Spielauswahl mit 3 Optionen:
  - Persoenlichkeit (spielbar),
  - Prognose/Zeit (coming soon),
  - Beziehung (coming soon).
- Systemauswahl vor Spielstart (Default: Westlich, Bazi, Numerologie; flexibel).
- Fragenflow fuer Spiel A mit randomisierter Reihenfolge.
- Ergebnis mit:
  - Fit (absolut),
  - Skill vs Zufall,
  - Delta Fit zu KO,
  - Delta Skill zu KO.
- KO wird im Ranking immer zuletzt angezeigt.

## 3.2 Roadmap (spaeter)

- Spiel B mit zeitfenster-basierter Frageauswahl (Delta-gesteuert, anti-redundant).
- Spiel C inkl. Session-Verknuepfung, Interaktionslogik und optionaler Synastrie-Aspekte.
- Progressive Freischaltungen als ausgebautes Gamification-System.

---

## 4) Einheitliche Scoring-Policy

Diese Policy soll in allen Dokumenten gleich beschrieben werden:

1. Pro Frage wird ein Fehler aus Nutzerwert vs. Systemwert berechnet.
2. Fragen werden nur dort gewertet, wo eine Dimension sinnvoll abgedeckt ist.
3. **Fit (absolut)** bildet die absolute Guete auf einer verstaendlichen Skala ab.
4. **Skill vs Zufall** misst den Vorteil gegenueber einer Random-Baseline.
5. KO ist Vergleichsanker, nicht Gewinnerkandidat.

Formulierungsregel fuer Texte:
- Ranking als Orientierung erklaeren.
- Fit/Skill als Kernmetrik kommunizieren.

---

## 5) Einheitliche KO-Policy

- KO ist stets aktivierbar und wird transparent als Kontrollgruppe gefuehrt.
- KO basiert auf deterministischem Seed (reproduzierbar).
- KO wird in Tabellen immer als letzter Eintrag angezeigt.
- Die finale Aufklaerung ueber KO bleibt fester Bestandteil des Lerndesigns.

Optional fuer UX:
- Interner Name technisch: `KO`
- Storyname im Spiel frei waehlbar (aber konsistent je Release).

---

## 6) Einheitliche Spielstruktur A/B/C

## 6.1 Spiel A (verbindlich)

- Ziel: Persoenlichkeitsabgleich zwischen Selbsteinschaetzung und Systemen.
- Daten: 1 Person, Geburtsdaten, Antworten.
- Ergebnis: Systemvergleich + KO + Temperamentprofil.

## 6.2 Spiel B (Konzept verbindlich, Umsetzung spaeter)

- Ziel: Rueckblick auf vergangene Zeitfenster (kein Zukunftsversprechen im Kern).
- Daten: 1 Person, periodisierte Vektoren, Ereignisfragen.
- Logik: Fragenauswahl nach Delta-Staerke, anti-redundant.

## 6.3 Spiel C (Konzept verbindlich, Umsetzung spaeter)

- Ziel: Kompatibilitaetsabgleich fuer 2 Personen.
- Daten: Geburtsdaten A/B, optionale Link-Codes zu Spiel-A-Sessions.
- Logik: Basis ueber Differenzvektor, dann systemeigene Interaktionsregeln.
- Datenschutz: explizite Zustimmung fuer Daten der zweiten Person.

---

## 7) Harmonisierung der vier vorhandenen Dokumente

## 7.1 `Experiment.md`

Behalten:
- kreative Vision,
- visuelle Leitideen,
- langfristige Innovationsideen.

Anpassen:
- klar markieren, was Produktregel vs. Design-Exploration ist,
- veraltete oder alternative Score-Erzaehlungen auf Fit/Skill mappen,
- Spiel A/B/C mit dieser Vorlage benennen.

## 7.2 `gamification_konzept.md`

Behalten:
- didaktische Staffelung,
- progressive Belohnungslogik,
- Konfidenz-Idee pro System.

Anpassen:
- als **Phase 2+** kennzeichnen (nicht MVP-Status),
- Freischalttexte auf aktuelle Kennzahlen (Fit/Skill/KO) ausrichten,
- Terminologie "Vedisch/Jyotish" konsistent halten.

## 7.3 `spiel_c_konzept.md`

Behalten:
- starkes Datenmodell,
- klare Roadmap fuer Beziehungsspiel,
- Datenschutzgedanken.

Anpassen:
- Verweis auf gemeinsame Scoring-Policy,
- klare Trennung "must-have fuer Phase 1 C" vs. "Phase 2 C (Aspekte etc.)",
- dieselben Systemnamen wie in A/B verwenden.

## 7.4 `spieldesign.md` (ersetzt `spieldesign.docx`)

Behalten:
- wissenschaftliche Leitfrage,
- Gesamtspiel-Erzaehlung,
- Nutzerfuehrung.

Anpassen:
- Begriffe an diese SSOT angleichen,
- MVP- und Roadmap-Inhalte trennen,
- Rank-zentrierte Darstellung durch Fit/Skill + KO-Delta ersetzen.

---

## 8) Redaktionelle Leitlinien fuer alle Konzepte

- Schreibe immer aus Sicht "was gilt im aktuellen Produkt".
- Verwende "Roadmap" nur fuer noch nicht umgesetzte Inhalte.
- Keine konkurrierenden Metriknamen.
- Keine konkurrierenden Namen fuer dieselbe Sache.
- Jeder Abschnitt endet mit:
  - **Status**: MVP / Phase 2 / Phase 3
  - **Abhaengigkeiten**: Daten, Backend, UI, Content

---

## 9) Konkrete To-do-Liste fuer Harmonisierung

1. In allen 4 Dokumenten Glossarbegriffe vereinheitlichen.
2. Alte Score-Begriffe durch Fit/Skill/KO-Delta ersetzen.
3. Pro Dokument einen "Status je Abschnitt" ergaenzen.
4. Spiel B und C ueberall als Roadmap markieren, wo noch nicht live.
5. Einen finalen "Release-Leseweg" erstellen:
   - Produktteam: kurzer Umsetzungsstand,
   - Researchteam: Methodik + Hypothesen,
   - Contentteam: Story + didaktische Texte.

---

## 10) Entscheidungsbedarf (offen)

Diese drei Punkte sollten einmal final beschlossen werden:

1. Offizieller Nutzername fuer das System `Vedisch` (z. B. "Jyotish (Vedisch)").
2. Storyname der KO im Frontend (falls nicht direkt als "Kontrollgruppe" sichtbar).
3. Ob Humoraltypen als eigenes Meta-System in A und C gleichrangig gefuehrt wird oder nur als Zusatzanalyse.

