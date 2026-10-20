# Erklaerung: "Skill"

Diese Notiz erklaert, wie der Wert **Skill** zu lesen ist und wie er berechnet wird.
Metrik-Version: `perzentil_v1` (wird mit jedem Rating gespeichert).

---

## 1. Kurzinterpretation

**Skill** misst, ob ein System *dein* Geburtsdatum braucht, um dich zu treffen –
oder ob ein beliebiges anderes Geburtsdatum genauso gut passen wuerde.

- `+100` = dein Geburtsdatum passt besser als alle Kontroll-Geburtsdaten
- `0` = Zufallsniveau: dein Geburtsdatum passt nicht besser als ein beliebiges
- `-100` = dein Geburtsdatum passt schlechter als alle Kontroll-Geburtsdaten

Negative Werte werden nicht abgeschnitten: "schlechter als ein beliebiges Geburtsdatum" ist eine ehrliche Aussage.

---

## 2. Berechnung

1. Fehler pro Frage und System: `(selbst_wert - system_wert)^2`, gewichtet gemittelt zu `MSE`.
2. **Kontrollgruppe je System:** Das Backend berechnet denselben System-Vektor fuer 100 zufaellige
   andere Geburtsdaten (gleiche Uhrzeit, gleicher Ort, gleiches Geschlecht/Name, Fenster +-5 Jahre).
   Fuer jedes davon wird mit denselben Antworten und Gewichten ebenfalls der MSE berechnet.
3. **Perzentil** = Anteil der Kontroll-Geburtsdaten mit groesserem Fehler als das echte (Gleichstand zaehlt halb).
4. **Skill** = `2 * (Perzentil - 50)`

```text
Perzentil 100 -> Skill +100
Perzentil  50 -> Skill    0
Perzentil   0 -> Skill -100
```

---

## 3. Warum diese Kontrollgruppe?

Die Systeme sind unterschiedlich verteilt: manche liefern fast nur Werte nahe 0, andere streuen stark,
manche sind eher positiv. Die fruehere Metrik (Vergleich mit einer festen Zufalls-Baseline `2/3`) hat
diese Verteilung mitbewertet – ein System nahe 0 bekam hohen "Skill", ohne etwas ueber die Person zu wissen.

Die Kontrollgruppe hat exakt dieselbe Verteilung wie das System selbst. Der Unterschied zwischen echtem
und zufaelligem Geburtsdatum ist deshalb genau das, was die Systeme behaupten: dass *dein* Datum etwas ueber *dich* aussagt.

Eigenschaft: Hat ein System keine Aussagekraft, ist Skill fuer **jedes** System und **jeden** Antwortstil
im Mittel 0 (gleichverteilt zwischen -100 und +100). Damit sind Werte zwischen Systemen direkt vergleichbar.

---

## 4. Der beste Wert ist auch bei Zufall hoch

Das beste von `k` Systemen erreicht auch ohne jede Aussagekraft im Mittel:

```text
Skill_bester = 100 * (k - 1) / (k + 1)
```

| Systeme k | erwarteter Skill des besten |
|---|---|
| 3 | +50 |
| 5 | +67 |
| 7 | +75 |

Ein einzelner hoher Wert beim Sieger ist also normal. Aussagekraeftig ist erst der Mittelwert ueber viele Sessions:
liegt er fuer ein System deutlich ueber 0, ist das ein Befund. Siehe auch `warum_oft_ein_gewinner.md`.

**Wiederholtes Spielen derselben Person** (Simulation, 400 Personen, ohne Aussagekraft):
Spielt dieselbe Person am naechsten Tag mit leicht anderen Antworten erneut, gewinnt in **63 %**
der Faelle wieder dasselbe System (nur neue Kontroll-Geburtsdaten, gleiche Antworten: 86 %).
Der Skill eines Systems korreliert zwischen den beiden Spielen mit 0.89. Der Sieger einer Person ist
also stabil, weil Geburtsdatum und Antwortmuster gleich bleiben – ueber die Aussagekraft sagt das nichts.
Erst ueber viele verschiedene Personen verteilen sich die Siege gleichmaessig (je ~1/7).
Von einem Tag zum naechsten aendern sich die zeitabhaengigen Systeme praktisch nicht.

Spielertext dazu: `docs/Textbausteine/erklaerungen/01_skill.md`.
Wie die einzelnen Systeme berechnet werden (Konventionen, korrigierte Fehler, Vereinfachungen):
`docs/Berechnungsgrundlagen/`.

---

## 5. Speicherung und Reproduzierbarkeit

Gespeichert werden pro System Perzentil und Skill (im Rating der Session), nicht die Kontrollvektoren.
Diese sind reproduzierbar aus Geburtsdatum, Uhrzeit, `session_id` (Seed) und den Parametern in
`inputs.kontrolle` (`anzahl`, `jahre`, `seed_schema`, `stichtag`) – vorausgesetzt, die Regelwerke sind unveraendert.

---

## 6. Fit (absolut)

`Fit` bleibt als anschaulicher Wert erhalten: `100 * (1 - RMSE / 2)`, also wie nah die Systemwerte
absolut an deinen Antworten liegen. Fit sagt nichts darueber, ob das Geburtsdatum eine Rolle spielt.
