# English translation: glossary and rules

Shared by everyone translating Tesserakt into English. American English spelling (color, behavior, center).

## The project in two sentences

Tesserakt is a playful device app and a citizen-science experiment: people answer questions about themselves,
and seven traditional horoscope systems are scored on whether they describe the person better than chance.
The texts present each tradition faithfully ("according to the tradition", "could", "tends to") without
claiming it is true; honest, warm, never sensational.

## Tone

- Address the reader as "you" (German "du"). In couple texts German "ihr/euch/euer" becomes "you two", "you
  both", "your" (whatever reads naturally); "dein Gegenüber" (the other person) is "your partner".
- Keep the cautious modality of the German ("könnte" = could/may, "gilt als" = is considered).
- Short, clear sentences; no exclamation marks unless the German has one.
- In visible texts say "horoscopes", never "systems" (German: "Horoskope" statt "System").
- Do not add or drop content. If a German phrase is odd but deliberate (rare words, old-fashioned turns of
  phrase), keep the flavor with an equally distinctive English wording.

## Do not break the structure

- JSON: change only the string values. Keys, nesting, list lengths and empty objects `{}` stay exactly as
  they are. Keep the field names even where they say `_de` (`text_de` holds the English text in the English
  file; the key must match the German original).
- Placeholders in braces stay unchanged and must all appear: `{Planet}`, `{haus}`, `{zahl}`, ... You may move
  them within the sentence. `{Planet}` (capital P) is used at the start of a sentence.
- The code cuts some texts at fixed separators; keep the same separators in the same places:
  - Chinese pair texts: header `Rat-Horse (Zi-Wu): ` then the text. The code removes everything up to `): `
    and, for clashes, also the first sentence after it ("Water clashes with Fire."). Keep the header and that
    first short sentence.
  - `name_deutsch` of nakshatras and sephiroth: alternatives separated by ` / ` ("The Mare / The Divine
    Horsemen"); keep the article ("The Crown"), the code lowercases it inside sentences.
  - Numerology names: `Life Path 1 – The Pioneer`, `The Eleven – The Visionary` (en dash with spaces; the code
    takes the part after the last dash).
  - Kabbalah letter meanings: `Ox / Bull — the first animal, strength, breath` (the code takes the text before
    ` — ` and before the first ` / `); tarot: `0 — The Fool` (number, space, em dash, card name; the German
    has the English name in brackets, drop the bracket in English).
  - Lists used as noun phrases ("qualitaet", "staerken", "thema", "schluesselthema", "hauptthemen",
    "kernthema"): keep them as comma-separated noun phrases without a final verb, they are inserted into
    sentences like "Its strengths are considered to be {staerken}." Where the German ends with a period,
    keep one.
  - Where only the first sentence of a text is used (descriptions, "hauptqualitaeten", "wirkung"), make sure
    the first sentence stands on its own.
- Ordinal houses: German writes `{haus}. Haus`; in English write `house {haus}` (no ordinals needed).

## Terms

| German | English |
|---|---|
| Horoskop, Horoskope | horoscope, horoscopes |
| Lebensbereiche: Liebe, Beruf, Finanzen, Gesundheit, Soziales, Kreativität, Veränderung, Spiritualität | love, career, finances, health, social life, creativity, change, spirituality |
| Westliche Astrologie | Western astrology |
| Sonne, Mond, Merkur, Venus, Mars, Jupiter, Saturn, Uranus, Neptun, Pluto | Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto |
| Nordknoten, Südknoten | North Node, South Node |
| Tierkreiszeichen; Widder, Stier, Zwillinge, Krebs, Löwe, Jungfrau, Waage, Skorpion, Schütze, Steinbock, Wassermann, Fische | zodiac signs; Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces |
| Aszendent, MC | Ascendant, Midheaven (MC) |
| Konjunktion, Sextil, Quadrat, Trigon, Opposition | conjunction, sextile, square, trine, opposition |
| Transit, laufender Planet, Geburtssonne | transit, transiting planet, natal Sun |
| rückläufig | retrograde |
| Haus | house |
| Hellenistische Astrologie; Profektion, Profektionsjahr, Jahresherrscher | Hellenistic astrology; profection, profection year, Lord of the Year |
| Aversion (Zeichen sehen einander nicht) | aversion (the signs do not see each other) |
| Chinesische Astrologie, Bazi, Vier Säulen | Chinese astrology, Bazi, Four Pillars |
| Tagesmeister | Day Master |
| Himmelsstamm, Erdzweig | Heavenly Stem, Earthly Branch |
| Säule, Tagessäule, Glückssäule | pillar, day pillar, Luck Pillar |
| Holz, Feuer, Erde, Metall, Wasser; Yin, Yang | Wood, Fire, Earth, Metal, Water; Yin, Yang |
| Ratte, Büffel, Tiger, Hase, Drache, Schlange, Pferd, Ziege, Affe, Hahn, Hund, Schwein | Rat, Ox, Tiger, Rabbit, Dragon, Snake, Horse, Goat, Monkey, Rooster, Dog, Pig |
| Zusammenstoß (Chong), Kombination (He), Schaden (Hai), Dreieck (San He) | clash (Chong), combination (He), harm (Hai), triangle (San He) |
| Lichun, Frühlingsanfang | Lichun, the start of spring |
| Ehepalast | Spouse Palace |
| Vedische Astrologie (Jyotish) | Vedic astrology (Jyotish) |
| Mahadasha, Antardasha (Unterperiode), Nakshatra, Mondhaus | Mahadasha, Antardasha (sub-period), Nakshatra, lunar mansion |
| Gochara, Sade Sati | Gochara (transits), Sade Sati |
| Kutas: Tara, Yoni, Gana, Bhakoot, Nadi | Kutas: Tara, Yoni, Gana, Bhakoot, Nadi |
| Arabische Astrologie; Firdaria, Haupt-Firdaria, Unterperiode | Arabic astrology; Firdaria, main Firdaria, sub-period |
| Los des Glücks, Glückslos | Lot of Fortune |
| Numerologie; Lebenszahl, Lebenspfad | numerology; Life Path number, Life Path |
| persönliches Jahr, persönlicher Monat | Personal Year, Personal Month |
| Meisterzahl, Quersumme | master number, digit sum |
| Pinnacle | Pinnacle |
| Kabbalah; Baum des Lebens, Sephira, Sephiroth, Pfad | Kabbalah; Tree of Life, Sephira, Sephiroth, path |
| Säule der Gnade, der Strenge, mittlere Säule | Pillar of Mercy, Pillar of Severity, Middle Pillar |
| Tugend, Laster | virtue, vice |
| Temperamentenlehre (Paracelsus) | doctrine of the temperaments (Paracelsus) |
| Skill (Wertung), Perzentil | skill, percentile |
| der Apparat | the Apparatus |
