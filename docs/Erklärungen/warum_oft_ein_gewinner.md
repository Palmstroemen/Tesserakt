# Warum gewinnt bei zufaelliger Eingabe trotzdem oft ein System?

Diese Erklaerung beschreibt ein statistisches Phaenomen: Bei mehreren Systemen mit unterschiedlichen Vorhersagen gibt es fast immer einen „Gewinner“ mit hoher Trefferquote – auch wenn die Nutzerin oder der Nutzer gar nicht bewusst antwortet.

---

## Das Phaenomen in einfachen Worten

Stell dir vor, es gibt nur **zwei** Systeme – und sie sagen genau das Gegenteil:

- **System A** sagt bei jeder Frage: „Du bist eher so: **+1** (voll).“
- **System B** sagt bei jeder Frage: „Du bist eher so: **-1** (gar nicht).“

Du gibst irgendetwas ein – z.B. immer **0** (mittig) oder mal -0.5, mal +0.5, ganz beliebig.

- Wenn du eher **positive** Werte eingibst (z.B. +0.5 oder +1), passt **System A** gut → hoher Skill fuer A, niedriger fuer B.
- Wenn du eher **negative** Werte eingibst (z.B. -0.5 oder -1), passt **System B** gut → hoher Skill fuer B, niedriger fuer A.

**Egal was du tippst:** Eines der beiden Systeme liegt immer relativ nah dran, das andere weit weg. Es gibt also fast immer einen klaren „Gewinner“ – auch wenn du gar nicht bewusst antwortest, sondern zufaellig oder irgendwie mittig.

Bei uns gibt es **mehrere** Systeme, die sich oft stark unterscheiden (nicht nur zwei Gegensaetze, aber aehnliches Prinzip). Dadurch ist die Chance gross, dass **mindestens ein** System zufaellig zu deinen Eingaben passt und hohen Skill bekommt. Das heisst nicht, dass dieses System dich „wirklich getroffen“ hat – es kann schlicht derjenige unter vielen sein, der in diesem Durchgang zufaellig auf deiner Seite lag.

**Kurz:** Viele unterschiedliche Vorhersagen fuehren dazu, dass fast immer ein Gewinner mit hohem Skill entsteht. Bei 7 Systemen erreicht der Beste auch ohne jede Aussagekraft im Mittel etwa **Skill +75** (allgemein `100 * (k-1)/(k+1)`). Erst wenn ein System ueber viele Sessions im Mittel deutlich ueber 0 liegt, ist das ein Befund.

*Seit Metrik `perzentil_v1`:* Skill vergleicht das echte Geburtsdatum mit zufaelligen anderen Geburtsdaten desselben Systems (siehe `skill_vs_zufall_erklaerung.md`). Dadurch hat jedes System bei Zufall denselben Erwartungswert 0 – der Gewinner-Effekt bleibt, ist aber fuer alle Systeme gleich gross und genau berechenbar.

---

## Wie kann man das erkennen?

Ein praktischer Hinweis: **Spiel das Assessment fuer verschiedene Personen** (oder mit unterschiedlichen Geburtsdaten / Rollen). Wenn das Phaenomen greift, wirst du typischerweise sehen:

- **Immer wieder andere Systeme** landen auf Platz 1 – mal Westlich, mal Bazi, mal Numerologie usw.
- Die **Gewinner** haben oft **hohe Trefferquoten** (z.B. 50 % bis 90 % Skill).
- Die **Verlierer** haben oft negativen Skill.

Wenn bei „zufaellig“ oder sehr unterschiedlichen Personen stets **dasselbe** System mit hohem Skill gewinnen wuerde, waere das ein starkes Signal dafuer, dass dieses System systematisch nahe an typischen Antwortmustern liegt. Dass stattdessen **die Gewinner wechseln**, spricht dafuer, dass die Streuung zwischen den Systemen gross ist und der Gewinner stark von den jeweiligen Eingaben abhaengt – also dass oft einfach „irgendeins“ von vielen gut passt, ohne dass es besonders wahrheitsgetreu waere.

---

## Technischer Hintergrund

Die Streuung zwischen den System-Vektoren laesst sich messen (z.B. mit dem Skript `tools/system_vector_divergence_test.py`). Ueber viele zufaellige Geburtsdaten zeigt sich: Pro Dimension weichen die Systeme im Mittel deutlich voneinander ab (Skala -1..+1). Das reicht aus, damit bei beliebiger User-Eingabe fast immer mindestens ein System relativ gut abschneidet.
