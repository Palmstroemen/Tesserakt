# Erklaerung: "Skill vs Zufall"

Diese Notiz erklaert, wie der Wert **Skill vs Zufall** zu lesen ist und wie er berechnet wird.

---

## 1. Kurzinterpretation

**Skill vs Zufall** misst, wie viel besser ein System ist als eine reine Zufalls-Baseline.

- `100` = perfekte Uebereinstimmung mit den Antworten
- `0` = nicht besser als Zufall
- in der aktuellen UI: **nie negativ**, weil bei `0` abgeschnitten wird

Wichtig:
- `0` bedeutet derzeit: "zufaellig gut" **oder schlechter als Zufall", weil negative Werte gekappt werden.

---

## 2. Berechnung (aktuelle Implementierung)

Die Berechnung laeuft auf dem mittleren quadratischen Fehler (MSE):

1. Pro Frage und System:
   - Fehler = `(selbst_wert - system_wert)^2`
2. Ueber alle Fragen:
   - gewichteter Mittelwert der Fehler = `MSE`
3. Vergleich mit Zufalls-Baseline:
   - `RANDOM_BASELINE_MSE = 8/3`

Dann:

```text
skill_raw = 100 * (1 - MSE / (8/3))
skillScore = max(0, skill_raw)
```

Die `max(0, ...)`-Kappung ist der Grund, warum keine negativen Werte angezeigt werden.

---

## 3. Warum genau 8/3?

Die Antworten und Systemwerte liegen auf der 1-5 Skala.  
Wenn zwei Werte unabhaengig zufaellig aus `U(1,5)` kommen, gilt:

```text
E[(X - Y)^2] = 8/3
```

Das ist der erwartete MSE von "reinem Zufall gegen Zufall" und dient als Nullpunkt.

---

## 4. Lesehilfe fuer den Wert

Pragmatische Einordnung:

- `0`: auf Zufallsniveau (oder darunter, aber gekappt)
- `1-20`: schwacher Vorteil gegen Zufall
- `21-50`: klarer Vorteil
- `51-80`: starker Vorteil
- `81-100`: sehr starker Vorteil

Hinweis:
- Die Schwellen sind eine Kommunikationshilfe, kein mathematisches Gesetz.

---

## 5. Beziehung zu "Delta Skill zu KO"

`Delta Skill zu KO` zeigt den Abstand eines Systems zur Kontrollgruppe in derselben Session:

```text
DeltaSkillKO = Skill(System) - Skill(KO)
```

- positiv: besser als KO
- `0`: gleich wie KO
- negativ: schlechter als KO

Damit sieht man schnell, ob ein System den Kontrollanker in der konkreten Runde schlaegt.

---

## 6. Mini-Beispiele

Beispiel A:

- `MSE = 1.0`
- `skill_raw = 100 * (1 - 1.0 / 2.6667) = 62.5`
- `Skill vs Zufall = 62.5`

Beispiel B:

- `MSE = 2.6667`
- `skill_raw = 0`
- `Skill vs Zufall = 0`

Beispiel C:

- `MSE = 3.2`
- `skill_raw = -20` -> wird gekappt
- `Skill vs Zufall = 0` (in aktueller UI)

---

## 7. Namensvorschlaege (kuerzer/klarer)

`Reliability` ist moeglich, aber semantisch nicht ideal:  
Es klingt nach Messgenauigkeit/Vertrauensintervall, nicht nach "Vorteil gegen Zufall".

Bessere Kandidaten:

1. **Zufallsvorteil** (empfohlen)
   - kurz, klar, sagt direkt was gemessen wird
2. **Vorteil gg. Zufall**
   - sehr explizit, aber etwas laenger
3. **Skill-Index**
   - kurz, neutral, technisch

Empfehlung fuer UI:

- Kurztitel: **Zufallsvorteil**
- Tooltip: *"Wie viel besser als reiner Zufall (0 = Zufallsniveau, 100 = perfekt)."*

