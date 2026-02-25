# Spiel A - Antwortpanel mit System-Tabs (Markdown-Prototyp)

Ziel: Die Spiel-A-Ergebnisse werden in einem neuen Panel mit Tabs praesentiert.  
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
> Bild folgt spaeter (Diagramm-Layer: Radix + Aspekte).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Westlich)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt fuer Beziehungen eine Tendenz zu intensiven Lernmomenten, besonders wenn Naehe und Eigenstaendigkeit gleichzeitig wichtig werden.  
Demnach muesstest du in Beziehungsfragen haeufig dann klarer werden, wenn Spannungen bereits sichtbar sind.  
Das muss nicht bedeuten, dass du grundsaetzlich konflikthaft bist, aber du koenntest eher die Rolle uebernehmen, Dinge offen anzusprechen.

---

## Tab: Bazi

# Bazi

> [BILD-STUB]  
> Bild folgt spaeter (Diagramm-Layer: 4 Saeulen + 5 Elemente + Timeline).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Bazi)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt fuer Beziehungen eine Tendenz zu Dynamik, wenn unterschiedliche Beduerfnisse nach Stabilitaet und Bewegung zusammentreffen.  
Demnach muesstest du in Partnerschaften besonders dort lernen, wo Fuehrung und Nachgeben im Wechsel gebraucht werden.  
Das muss nicht bedeuten, dass es haeufig eskaliert, aber du koenntest frueh erkennen, wann Balance aktiv hergestellt werden sollte.

---

## Tab: Numerologie

# Numerologie

> [BILD-STUB]  
> Bild folgt spaeter (Diagramm-Layer: Zahlenkarte + Achsen).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Numerologie)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt in Beziehungsthemen haeufig eine Lernachse zwischen Naehe, Eigenraum und Erwartungsklarheit.  
Demnach muesstest du in Partnerschaften vor allem dort Stabilitaet finden, wo Rollen und Beduerfnisse offen benannt werden.  
Das muss nicht bedeuten, dass Beziehungen schwierig waeren, aber dass unausgesprochene Annahmen eher zu Reibung fuehren koennten.

---

## Tab: Kabbalah

# Kabbalah

> [BILD-STUB]  
> Bild folgt spaeter (Diagramm-Layer: Baumstruktur + aktive Knoten).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Kabbalah)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt fuer Beziehungen eine Tendenz, dass Bindung dann tragfaehig wird, wenn Herzoffenheit und Grenzbewusstsein zusammenwirken.  
Demnach muesstest du in Naehekontexten von klaren Absprachen profitieren, ohne Waerme zu verlieren.  
Das muss nicht bedeuten, dass du kontrollierend waerst, aber dass Struktur als Schutzraum fuer Verbundenheit dienen koennte.

---

## Tab: Arabisch

# Arabisch

> [BILD-STUB]  
> Bild folgt spaeter (Diagramm-Layer: Periodenachse/Firdaria + Lose).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Arabisch)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt Beziehungsthemen oft als zeitlich moduliert: In manchen Phasen koennten Naehe, in anderen eher Klaerung und Distanzarbeit dominieren.  
Demnach muesstest du Beziehungsdynamik besser verstehen, wenn du sie im Kontext eines Abschnitts statt als Dauerzustand betrachtest.  
Das muss nicht bedeuten, dass Instabilitaet vorliegt, aber dass Rhythmus und Timing eine groessere Rolle spielen koennten.

---

## Tab: Hellenistisch

# Hellenistisch

> [BILD-STUB]  
> Bild folgt spaeter (Diagramm-Layer: Whole-Sign-Rad + Profektion + Sekt).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Hellenistisch)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt Beziehungsthemen oft ueber Haus- und Herrscherbezug: Bindung, Vertraglichkeit und Aushandlung koennten je nach Aktivierung wechseln.  
Demnach muesstest du in Partnerschaften dann klarer werden, wenn Erwartungen und Grenzen explizit benannt sind.  
Das muss nicht bedeuten, dass Beziehungen sachlich statt lebendig sind, aber dass Klarheit Konflikte frueh abfedern koennte.

---

## Tab: Vedisch

# Vedisch

> [BILD-STUB]  
> Bild folgt spaeter (Diagramm-Layer: Dasha/Nakshatra-Fokus + Phasenlogik).

**Textquelle:** `content/horoscope/de/system_texts_v1.json` (Systemkey: Vedisch)  
**Einblendung (Markdown-Prototyp):**

Das System beschreibt Beziehungsthemen als Zusammenspiel von Bindungswunsch, Verantwortung und emotionaler Fuehrung.  
Demnach muesstest du in Naehefragen oft dort Klarheit gewinnen, wo Rollen und Erwartungen aktiv verhandelt werden.  
Das muss nicht bedeuten, dass du dominieren willst, aber du koenntest haeufiger den Impuls haben, Richtung zu geben.

---

## Rendering-Hinweis fuer spaetere Umsetzung

- Der Textbereich pro Tab sollte den jeweils vollstaendigen Inhalt aus `content/horoscope/de/system_texts_v1.json` (pro Systemkey) laden.
- Der Bildbereich bleibt vorerst Stub und wird spaeter durch die systemspezifischen Diagrammkomponenten ersetzt.
- Einheitliches Layout:
  - H1 Systemname
  - Bildcontainer (fixed ratio)
  - Textcontainer (scrollbar ab definierter Hoehe)
