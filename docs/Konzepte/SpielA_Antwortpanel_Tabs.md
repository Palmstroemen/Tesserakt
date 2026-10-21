# Spiel A - Antwortpanel mit System-Tabs (Markdown-Prototyp)

Ziel: Die Spiel-A-Ergebnisse werden in einem neuen Panel mit Tabs präsentiert.  
Jeder Tab hat dieselbe Grundstruktur:

1. `# Systemname`
2. Bildbereich (vorerst Stub)
3. Ausformulierter Systemtext

---

## Tab-Leiste (Reihenfolge)

`Westlich` | `Bazi` | `Numerologie` | `Kabbalah` | `Arabisch` | `Hellenistisch` | `Vedisch`

---

## Tab: Westlich

# Westlich

> [BILD-STUB]  
> Bild folgt später (Diagramm-Layer: Radix + Aspekte).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Westlich)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt für Beziehungen eine Tendenz zu intensiven Lernmomenten, besonders wenn Nähe und Eigenständigkeit gleichzeitig wichtig werden.  
Demnach müsstest du in Beziehungsfragen häufig dann klarer werden, wenn Spannungen bereits sichtbar sind.  
Das muss nicht bedeuten, dass du grundsätzlich konflikthaft bist, aber du könntest eher die Rolle übernehmen, Dinge offen anzusprechen.

---

## Tab: Bazi

# Bazi

> [BILD-STUB]  
> Bild folgt später (Diagramm-Layer: 4 Säulen + 5 Elemente + Timeline).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Bazi)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt für Beziehungen eine Tendenz zu Dynamik, wenn unterschiedliche Bedürfnisse nach Stabilität und Bewegung zusammentreffen.  
Demnach müsstest du in Partnerschaften besonders dort lernen, wo Führung und Nachgeben im Wechsel gebraucht werden.  
Das muss nicht bedeuten, dass es häufig eskaliert, aber du könntest früh erkennen, wann Balance aktiv hergestellt werden sollte.

---

## Tab: Numerologie

# Numerologie

> [BILD-STUB]  
> Bild folgt später (Diagramm-Layer: Zahlenkarte + Achsen).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Numerologie)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt in Beziehungsthemen häufig eine Lernachse zwischen Nähe, Eigenraum und Erwartungsklarheit.  
Demnach müsstest du in Partnerschaften vor allem dort Stabilität finden, wo Rollen und Bedürfnisse offen benannt werden.  
Das muss nicht bedeuten, dass Beziehungen schwierig wären, aber dass unausgesprochene Annahmen eher zu Reibung führen könnten.

---

## Tab: Kabbalah

# Kabbalah

> [BILD-STUB]  
> Bild folgt später (Diagramm-Layer: Baumstruktur + aktive Knoten).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Kabbalah)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt für Beziehungen eine Tendenz, dass Bindung dann tragfähig wird, wenn Herzoffenheit und Grenzbewusstsein zusammenwirken.  
Demnach müsstest du in Nähekontexten von klaren Absprachen profitieren, ohne Wärme zu verlieren.  
Das muss nicht bedeuten, dass du kontrollierend wärst, aber dass Struktur als Schutzraum für Verbundenheit dienen könnte.

---

## Tab: Arabisch

# Arabisch

> [BILD-STUB]  
> Bild folgt später (Diagramm-Layer: Periodenachse/Firdaria + Lose).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Arabisch)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt Beziehungsthemen oft als zeitlich moduliert: In manchen Phasen könnten Nähe, in anderen eher Klärung und Distanzarbeit dominieren.  
Demnach müsstest du Beziehungsdynamik besser verstehen, wenn du sie im Kontext eines Abschnitts statt als Dauerzustand betrachtest.  
Das muss nicht bedeuten, dass Instabilität vorliegt, aber dass Rhythmus und Timing eine größere Rolle spielen könnten.

---

## Tab: Hellenistisch

# Hellenistisch

> [BILD-STUB]  
> Bild folgt später (Diagramm-Layer: Whole-Sign-Rad + Profektion + Sekt).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Hellenistisch)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt Beziehungsthemen oft über Haus- und Herrscherbezug: Bindung, Vertraglichkeit und Aushandlung könnten je nach Aktivierung wechseln.  
Demnach müsstest du in Partnerschaften dann klarer werden, wenn Erwartungen und Grenzen explizit benannt sind.  
Das muss nicht bedeuten, dass Beziehungen sachlich statt lebendig sind, aber dass Klarheit Konflikte früh abfedern könnte.

---

## Tab: Vedisch

# Vedisch

> [BILD-STUB]  
> Bild folgt später (Diagramm-Layer: Dasha/Nakshatra-Fokus + Phasenlogik).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Vedisch)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt Beziehungsthemen als Zusammenspiel von Bindungswunsch, Verantwortung und emotionaler Führung.  
Demnach müsstest du in Nähefragen oft dort Klarheit gewinnen, wo Rollen und Erwartungen aktiv verhandelt werden.  
Das muss nicht bedeuten, dass du dominieren willst, aber du könntest häufiger den Impuls haben, Richtung zu geben.

---

## Rendering-Hinweis für spätere Umsetzung

- Der Textbereich pro Tab sollte den jeweils vollständigen Inhalt aus `content/horoscope/de/system_texts_v1.json` (pro Systemkey) laden.
- Der Bildbereich bleibt vorerst Stub und wird später durch die systemspezifischen Diagrammkomponenten ersetzt.
- Einheitliches Layout:
  - H1 Systemname
  - Bildcontainer (fixed ratio)
  - Textcontainer (scrollbar ab definierter Höhe)
