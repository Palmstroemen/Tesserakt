# Harmonisierungsvorlage Konzepte (A/B/C)
## Single Source of Truth (SSOT)

*Tesserakt - Konsolidierungsvorlage*  
*Stand: Oktober 2026 (Metrik perzentil_v1)*

---

## 1) Ziel dieses Dokuments

Dieses Dokument definiert den gemeinsamen Zielzustand für:

- `Experiment.md`
- `gamification_konzept.md`
- `spiel_c_konzept.md`
- `spieldesign.md` (aus `spieldesign.docx` überführt)

Es ist keine neue Produktidee, sondern eine Vereinheitlichung:
- einheitliche Begriffe,
- einheitliche Scoring-Logik,
- einheitliche Spielabfolge,
- klare Abgrenzung zwischen **MVP (jetzt)** und **Roadmap (später)**.

---

## 2) Verbindliche Begriffe (Glossar)

Diese Begriffe gelten in allen Konzepten identisch:

- **Spiel A - Persönlichkeit**: 1-Personen-Profil (aktueller Hauptflow).
- **Spiel B - Prognose/Zeit**: Rückblick auf vergangene Zeitfenster (nicht live im MVP).
- **Spiel C - Beziehung**: 2-Personen-Vergleich (MVP umgesetzt).
- **Systeme**: Westlich, Bazi, Numerologie, Kabbalah, Arabisch, Hellenistisch, Vedisch.
- **Kontrollgruppe (je System)**: dasselbe System, berechnet für zufällige andere Geburtsdaten
  (Default 100, Fenster +-5 Jahre, gleiche Uhrzeit/Ort/Geschlecht/Name, reproduzierbar per `session_id`).
- **Perzentil**: Anteil der Kontroll-Geburtsdaten, die schlechter zu den Antworten passen als das echte (0..100).
- **Skill**: `2 * (Perzentil - 50)`, Skala -100..+100, 0 = Zufallsniveau. Kernmetrik.
- **Fit (absolut)**: absolute Nähe zur Selbsteinschätzung (anschaulich, keine Aussage über das Geburtsdatum).

Nicht mehr verwenden:
- `Rank-Score` als Hauptkommunikation im UI.
- **KO** als gemeinsame Zufalls-Kontrollgruppe, **Skill vs Zufall** (Baseline 2/3) und **Delta zu KO**
  (ersetzt durch Kontrollgruppe je System und Skill, siehe `docs/Erklärungen/skill_vs_zufall_erklaerung.md`).

---

## 3) Produktzustand: Jetzt vs. Später

## 3.1 MVP (jetzt, implementiert)

- Einstieg: Geburtsdaten.
- Spielauswahl mit 3 Optionen:
  - Persönlichkeit (spielbar),
  - Prognose/Zeit (coming soon),
  - Beziehung (coming soon).
- Systemauswahl vor Spielstart (Default: alle Systeme; einzelne abwählbar).
- Fragenflow für Spiel A mit randomisierter Reihenfolge; Fragen und Gewichte aus `backend/fragen.json`.
- Kontrollgruppe wird während der Fragephase im Hintergrund berechnet (`/kontrolle`).
- Ergebnis mit:
  - Skill (Ranking danach),
  - Perzentil,
  - Fit (absolut),
  - Hinweis, welchen Skill der Sieger auch ohne Aussagekraft erreicht (`100*(k-1)/(k+1)`, bei 7 Systemen ~+75).
- Gespeichert werden Skill und Perzentil je System; die Kontrollvektoren sind über `inputs.kontrolle` reproduzierbar.

## 3.2 Roadmap (später)

- Spiel B mit zeitfenster-basierter Frageauswahl (Delta-gesteuert, anti-redundant).
- Spiel C inkl. Session-Verknüpfung, Interaktionslogik und optionaler Synastrie-Aspekte.
- Progressive Freischaltungen als ausgebautes Gamification-System.

---

## 4) Einheitliche Scoring-Policy

Diese Policy soll in allen Dokumenten gleich beschrieben werden:

1. Pro Frage wird ein Fehler aus Nutzerwert vs. Systemwert berechnet (quadratisch, gewichtet).
2. Fragen werden nur dort gewertet, wo eine Dimension sinnvoll abgedeckt ist (Gewichte in `fragen.json`).
3. Derselbe Fehler wird für jedes Kontroll-Geburtsdatum des Systems berechnet (gleiche Antworten, gleiche Gewichte).
4. **Skill** = `2 * (Perzentil - 50)`: Ohne Aussagekraft liegt Skill für jedes System und jeden
   Antwortstil im Mittel bei 0 (simuliert mit `tools/skill_metric_test.py`).
5. **Fit (absolut)** bleibt als anschaulicher Zusatzwert.

Formulierungsregel für Texte:
- Ranking als Orientierung erklären.
- Skill als Kernmetrik kommunizieren; Fit als anschaulichen Zusatz.
- Immer dazusagen, dass ein hoher Sieger-Skill auch ohne Aussagekraft normal ist und erst der
  Durchschnitt über viele Spiele etwas zeigt (Spielertext: `docs/Textbausteine/erklaerungen/01_skill.md`).

---

## 5) Einheitliche Kontrollgruppen-Policy

- Jedes System wird gegen sich selbst mit zufälligen anderen Geburtsdaten verglichen.
- Die Kontroll-Geburtsdaten sind deterministisch (Seed aus `session_id`) und werden nicht gespeichert.
- Die Kontrollgruppe ist kein eigener Eintrag im Ranking, sondern steckt im Skill jedes Systems.
- Die Aufklärung über den Vergleich mit anderen Geburtsdaten und den Gewinner-Effekt
  bleibt fester Bestandteil des Lerndesigns.

---

## 6) Einheitliche Spielstruktur A/B/C

## 6.1 Spiel A (verbindlich)

- Ziel: Persönlichkeitsabgleich zwischen Selbsteinschätzung und Systemen.
- Daten: 1 Person, Geburtsdaten, Antworten.
- Ergebnis: Systemvergleich nach Skill (inkl. Perzentil und Fit) + Temperamentprofil.

## 6.2 Spiel B (Konzept verbindlich, Umsetzung später)

- Ziel: Rückblick auf vergangene Zeitfenster (kein Zukunftsversprechen im Kern).
- Daten: 1 Person, periodisierte Vektoren, Ereignisfragen.
- Systeme: alle sieben (Frage: Hätte das Horoskop für den Zeitraum gestimmt?).
- Logik: Systemwert = Horoskop des Zeitraums (Mittel über Stichproben-Tage); Skill wie in A, je Fenster.
- Fragenauswahl darf nicht vom echten Horoskop abhängen (verzerrt den Skill), siehe `Konzept Spiel B.md`.

## 6.3 Spiel C (MVP umgesetzt)

- Ziel: Erkennt ein System, wer von beiden in welchem Lebensbereich stärker ist?
- Daten: Geburtsdaten, -zeit, optional Ort/Geschlecht/Name für A und B.
- Logik: vergleichende Fragen gegen den Differenzvektor `(B - A) / 2`; später systemeigene
  Interaktionsregeln (z. B. Synastrie).
- Metrik: Skill wie A, Kontrollgruppe = 100 zufällige Paare (beide Geburtsdaten zufällig).
- Datenschutz: Pflicht-Häkchen zur Einwilligung der Partnerperson; Ort nur grob gespeichert, kein Name.

---

## 7) Harmonisierung der vier vorhandenen Dokumente

## 7.1 `Experiment.md`

Behalten:
- kreative Vision,
- visuelle Leitideen,
- langfristige Innovationsideen.

Anpassen:
- klar markieren, was Produktregel vs. Design-Exploration ist,
- veraltete oder alternative Score-Erzählungen auf Fit/Skill mappen,
- Spiel A/B/C mit dieser Vorlage benennen.

## 7.2 `gamification_konzept.md`

Behalten:
- didaktische Staffelung,
- progressive Belohnungslogik,
- Konfidenz-Idee pro System.

Anpassen:
- als **Phase 2+** kennzeichnen (nicht MVP-Status),
- Freischalttexte auf aktuelle Kennzahlen (Skill/Perzentil/Fit) ausrichten,
- Terminologie "Vedisch/Jyotish" konsistent halten.

## 7.3 `spiel_c_konzept.md`

Behalten:
- starkes Datenmodell,
- klare Roadmap für Beziehungsspiel,
- Datenschutzgedanken.

Anpassen:
- Verweis auf gemeinsame Scoring-Policy,
- klare Trennung "must-have für Phase 1 C" vs. "Phase 2 C (Aspekte etc.)",
- dieselben Systemnamen wie in A/B verwenden.

## 7.4 `spieldesign.md` (ersetzt `spieldesign.docx`)

Behalten:
- wissenschaftliche Leitfrage,
- Gesamtspiel-Erzählung,
- Nutzerführung.

Anpassen:
- Begriffe an diese SSOT angleichen,
- MVP- und Roadmap-Inhalte trennen,
- Rank-zentrierte Darstellung durch Skill (+ Perzentil/Fit) ersetzen.

---

## 8) Redaktionelle Leitlinien für alle Konzepte

- Schreibe immer aus Sicht "was gilt im aktuellen Produkt".
- Verwende "Roadmap" nur für noch nicht umgesetzte Inhalte.
- Keine konkurrierenden Metriknamen.
- Keine konkurrierenden Namen für dieselbe Sache.
- Jeder Abschnitt endet mit:
  - **Status**: MVP / Phase 2 / Phase 3
  - **Abhängigkeiten**: Daten, Backend, UI, Content

---

## 9) Konkrete To-do-Liste für Harmonisierung

1. In allen 4 Dokumenten Glossarbegriffe vereinheitlichen.
2. Alte Score-Begriffe (Skill vs Zufall, KO, Delta zu KO) durch Skill/Perzentil/Fit ersetzen.
3. Pro Dokument einen "Status je Abschnitt" ergänzen.
4. Spiel B und C überall als Roadmap markieren, wo noch nicht live.
5. Einen finalen "Release-Leseweg" erstellen:
   - Produktteam: kurzer Umsetzungsstand,
   - Researchteam: Methodik + Hypothesen,
   - Contentteam: Story + didaktische Texte.

---

## 10) Entscheidungsbedarf (offen)

Diese Punkte sollten einmal final beschlossen werden:

1. Offizieller Nutzername für das System `Vedisch` (z. B. "Jyotish (Vedisch)").
2. Ob Humoraltypen als eigenes Meta-System in A und C gleichrangig geführt wird oder nur als Zusatzanalyse.
3. Fenster der Kontroll-Geburtsdaten (aktuell +-5 Jahre) und ob der Name für Numerologie mitvariiert wird.

