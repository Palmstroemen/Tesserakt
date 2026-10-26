"""Picture texts in English: builds one paragraph per system from the facts (bildtexte/__init__.py)."""

from typing import Any, Callable, Dict, List

from bildtexte import satz as _satz


def _klein(name: str) -> str:
    """Leading article lowercase inside a sentence ("The Pioneer" -> "the Pioneer")."""
    if name.split(" ")[0] in ("The", "A", "An"):
        return name[0].lower() + name[1:]
    return name


def _klein_anfang(text: str) -> str:
    """Lists taken from the rules start with a capital letter (German nouns); inside a sentence they start small."""
    return text[:1].lower() + text[1:]


def _gross(text: str) -> str:
    return text[:1].upper() + text[1:]


# --- Western astrology --------------------------------------------------------------------------------------

PLANET_NAME = {
    "sonne": "the Sun", "mond": "the Moon", "merkur": "Mercury", "venus": "Venus", "mars": "Mars",
    "jupiter": "Jupiter", "saturn": "Saturn", "uranus": "Uranus", "neptun": "Neptune", "pluto": "Pluto",
}
# what a planet stands for (short, after natur_de in Westlich/western_rules_complete.json)
PLANET_STEHT = {
    "sonne": "your essence and your will",
    "mond": "feelings and needs",
    "merkur": "thinking and speaking",
    "venus": "love, relationships and pleasure",
    "mars": "drive, conflict and assertion",
    "jupiter": "growth and confidence",
    "saturn": "duty, limits and endurance",
    "uranus": "upheaval and freedom",
    "neptun": "dreams and intuition",
    "pluto": "deep transformation and power",
}
# aspect: how it is named in the sentence and the color of its line
ASPEKT = {
    "opposition": ("in opposition to", "orange"),
    "quadrat": ("square to", "red"),
    "trigon": ("trine to", "blue"),
    "sextil": ("sextile to", "light blue"),
}


def westlich(f: Dict[str, Any]) -> str:
    teile = [
        "The chart shows the sky at the hour of your birth. The twelve signs of the zodiac lie in the outer ring, "
        "and each colored symbol inside it is a planet in its place"
        + (". On the left is the Ascendant, the sign that was just rising in the east." if f["haeuser"] else "."),
        "Western astrology looks above all at how the planets stand in relation to one another. If two face each "
        "other, it is called an opposition (orange line); if they stand at a right angle, a square (red). Both "
        "are considered tense. A third of the circle (trine, blue) and a sixth (sextile, light blue) are "
        "considered harmonious. The brighter a line glows, the more exact the angle.",
    ]
    if "a" in f:
        x, y = f["a"], f["b"]
        wie, farbe = ASPEKT[f["aspekt"]]
        teile.append(
            f"In your chart the {farbe} line is especially exact: {_gross(PLANET_NAME[x])} is {wie} "
            f"{PLANET_NAME[y]}. {_gross(PLANET_NAME[x])} stands for {PLANET_STEHT[x]}, {PLANET_NAME[y]} for "
            f"{PLANET_STEHT[y]}. According to the old rules, this means: {_satz(f['deutung'])}"
        )
    return " ".join(teile)


# --- Bazi ---------------------------------------------------------------------------------------------------

ELEMENT_NAME = {"holz": "Wood", "feuer": "Fire", "erde": "Earth", "metall": "Metal", "wasser": "Water"}
ELEMENT_PUNKT = {"holz": "green", "feuer": "red", "erde": "ochre", "metall": "white", "wasser": "black"}


def bazi(f: Dict[str, Any]) -> str:
    teile = [
        "The red card shows the four pillars of your Bazi, read from right to left: the year, month, day and hour "
        "of your birth. Each pillar consists of two characters, a Heavenly Stem above and an Earthly Branch "
        "below. The character on the golden rhombus is the Heavenly Stem of your day, the “Day Master”: it "
        "stands for you yourself. The five dots below show how strongly the five elements are represented among "
        "your eight characters. The larger the dot, the more of it."
    ]
    if f["stunde_geschaetzt"]:
        teile.append("Your hour of birth is not known, so the hour pillar on the far left is faded.")
    tm = f.get("tagesmeister")
    if tm:
        teile.append(
            f"Your Day Master is {tm['zeichen']}, {tm['polaritaet'].capitalize()} "
            f"{ELEMENT_NAME.get(tm['element'], tm['element'])}: {tm['qualitaet']}."
            + (f" Its strengths are considered to be {tm['staerken']}." if tm["staerken"] else "")
        )
    if "stark" in f:
        stark, fehlt = f["stark"], f["fehlt"]
        satz = (
            f"{ELEMENT_NAME[stark]} is the most strongly represented (the {ELEMENT_PUNKT[stark]} dot)"
            if stark in ELEMENT_NAME
            else ""
        )
        if fehlt:
            namen = [ELEMENT_NAME.get(e, e) for e in fehlt]
            liste = namen[0] if len(namen) == 1 else ", ".join(namen[:-1]) + " and " + namen[-1]
            fehlt_satz = f"{liste} {'is' if len(namen) == 1 else 'are'} missing entirely"
            satz = f"{satz}; {fehlt_satz}" if satz else _gross(fehlt_satz)
        if satz:
            teile.append(satz + ".")
    return " ".join(teile)


# --- Hellenistic astrology ----------------------------------------------------------------------------------

GOTT = {
    "sonne": ("Helios", "the radiant sun"),
    "mond": ("Selene", "the crescent moon"),
    "merkur": ("Hermes", "the herald's staff"),
    "venus": ("Aphrodite", "the shell"),
    "mars": ("Ares", "shield and spear"),
    "jupiter": ("Zeus", "the thunderbolt"),
    "saturn": ("Kronos", "the sickle"),
}


def hellenistisch(f: Dict[str, Any]) -> str:
    haus, alter, herr = f["haus"], f["alter"], f["herr"]
    teile = [
        "The plate shows the twelve houses as Greek numerals around the rim, the first at the bottom, then "
        "counterclockwise. Hellenistic astrology moves you on by one house with each year of life; this is "
        "called profection."
    ]
    if haus and alter is not None:
        teile.append(
            f"At {alter} you are in house {haus}, circled in chalk"
            + (f". It stands for {f['thema']}." if f["thema"] else ".")
        )
    if herr in GOTT:
        gott, bild = GOTT[herr]
        teile.append(
            f"The ruler of this house becomes the Lord of your Year: {_gross(PLANET_NAME[herr])}, shown in the "
            f"center by {bild} of {gott}."
            + (f" According to Valens and Dorotheus, this means: {_satz(f['wirkung'])}" if f["wirkung"] else "")
        )
    return " ".join(teile)


# --- Vedic astrology ----------------------------------------------------------------------------------------

def vedisch(f: Dict[str, Any]) -> str:
    teile = [
        "The rangoli is strewn from colored powder. Each arc around the edge is a Mahadasha, one of the great "
        "periods of life in Vedic astrology: your life begins at the top and runs clockwise up to 120 years. "
        "The longer a period, the larger its arc; its color is that of its planet. Past periods have faded, and "
        "the twisted cord reaches up to your present age. In the inner ring of 27 dots, your birth Nakshatra "
        "wears a golden bangle: the lunar mansion in which the Moon stood at your birth."
    ]
    md = f.get("mahadasha")
    if md:
        teile.append(
            f"You are in the {md['name']} Mahadasha, outlined with dots of rice "
            f"(from age {md['von']} to {md['bis']}). "
            f"According to tradition, its themes are {_klein_anfang(md['themen'])}."
        )
    n = f.get("nakshatra")
    if n:
        teile.append(f"Your Moon stood in the Nakshatra {n['name']}, “{_klein(n['bedeutung'])}”: {n['qualitaeten']}")
    return " ".join(teile)


# --- Arabic astrology ---------------------------------------------------------------------------------------

FIRDARIA_NAME = {
    **PLANET_NAME, "nordknoten": "the North Node", "suedknoten": "the South Node",
}


def arabisch(f: Dict[str, Any]) -> str:
    teile = [
        "The tiled disc shows the Firdaria, the periods of life in Arabic astrology. Nine periods follow one "
        "another in a cycle of 75 years, beginning at the top and continuing clockwise. The longer a period, the "
        "wider its tile. The brass pointer shows where you stand today; the current tile is gilded.",
        f"The hub is {'golden: you were born by day' if f['tag'] else 'silver: you were born at night'}, "
        "and this determines which planet your life begins with.",
    ]
    jetzt = f.get("jetzt")
    if jetzt:
        teile.append(
            f"You are in the Firdaria of {FIRDARIA_NAME.get(jetzt['planet'], jetzt['name'])} until you are "
            f"{jetzt['bis']}. {jetzt['deutung']}"
        )
        if f["danach"] in FIRDARIA_NAME:
            teile.append(f"After that comes the Firdaria of {FIRDARIA_NAME[f['danach']]}.")
    return " ".join(teile)


# --- Numerology ---------------------------------------------------------------------------------------------

def numerologie(f: Dict[str, Any]) -> str:
    teile = [
        "The notebook shows how numerology calculates your Life Path number: the day, month and year of your "
        "birth are reduced to digit sums and added up until a single digit remains. Only the master numbers "
        "11, 22 and 33 are left standing."
    ]
    if "name" in f:
        teile.append(
            f"Circled in red is your Life Path number {f['zahl']}"
            + (", a master number" if f["meister"] else "")
            + f", “{_klein(f['name'])}.” It stands for {f['kernthema']}."
        )
    return " ".join(teile)


# --- Kabbalah -----------------------------------------------------------------------------------------------

def kabbalah(f: Dict[str, Any]) -> str:
    teile = [
        "The book page shows the Tree of Life: ten circles, the Sephiroth, connected by 22 paths, each with a "
        "Hebrew letter. Marked in colored pencil are your Sephira, derived from your Life Path number, and a "
        "path that follows your birthday through the course of the year. Notes about them are in the margin."
    ]
    s = f.get("sephira")
    if s:
        teile.append(f"Your Sephira is {s['name']}, “{_klein(s['bedeutung'])},” with the virtue {_klein_anfang(s['tugend'])}.")
    p = f.get("pfad")
    if p:
        teile.append(
            f"Your path bears the letter {p['buchstabe']}, “{p['bedeutung']}”; in the tarot it belongs to the "
            f"card “{p['tarot']}.”"
        )
    return " ".join(teile)


ABSATZ: Dict[str, Callable[[Dict[str, Any]], str]] = {
    "Westlich": westlich,
    "Bazi": bazi,
    "Hellenistisch": hellenistisch,
    "Vedisch": vedisch,
    "Arabisch": arabisch,
    "Numerologie": numerologie,
    "Kabbalah": kabbalah,
}


# --- Game C: the charts for two -----------------------------------------------------------------------------

ZAHLWORT = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]


def _zahl(n: int) -> str:
    return ZAHLWORT[n] if n < len(ZAHLWORT) else str(n)


def westlich_paar(d: Dict[str, Any]) -> str:
    asz = "aszendent" in d["punkte"]["a"] and "aszendent" in d["punkte"]["b"]
    teile = [
        "The double wheel lays the skies of your two birth hours on top of each other, as Western astrology does "
        "for couples (synastry). The zodiac lies on the outside, beneath it your partner's silver ring, and "
        "inside it your golden one, each with the Sun, Moon, Venus and Mars"
        + (" and the Ascendant." if asz else "."),
        "Wherever one of your points forms one of the old angles with one of your partner's, a thread of light "
        "runs between the rings: blue for a trine and light blue for a sextile, which are considered "
        "harmonious; red for a square and orange for an opposition, which are considered tense and therefore "
        "flicker. Where two points coincide (conjunction), the thread glows bright.",
    ]
    arten = [x["aspekt"] for x in d.get("aspekte", [])]
    if not arten:
        teile.append("No thread runs between you: none of your points stands at a close angle to the other's.")
    else:
        spannung = sum(a in ("quadrat", "opposition") for a in arten)
        teile.append(
            ("One thread runs between you" if len(arten) == 1 else f"{_gross(_zahl(len(arten)))} threads run between you")
            + (", and none of them flickers." if not spannung
               else (", and it flickers." if len(arten) == 1 else ", and all of them flicker.") if spannung == len(arten)
               else f"; {_zahl(spannung)} of them flicker." if spannung > 1 else "; one of them flickers.")
        )
    return " ".join(teile)


def hellenistisch_paar(d: Dict[str, Any]) -> str:
    asz = "aszendent" in d["punkte"]["a"] and "aszendent" in d["punkte"]["b"]
    teile = [
        "Around the rim of the plate stand the twelve signs of the zodiac with their Greek names. Drawn in chalk "
        f"are {'the Sun, Moon and Ascendant' if asz else 'the Sun and Moon'} of both of you, yours in yellow "
        "chalk, your partner's in white.",
        "Hellenistic astrology asks of two signs whether they see each other: in the same sign, opposite, in a "
        "triangle, a square or a hexagon. Where they see each other, an unbroken chalk line connects them. If "
        "they are in aversion, that is, they do not see each other, the middle of the line stays empty.",
    ]
    bezuege = [x["bezug"] for x in d.get("bezuege", [])]
    if bezuege:
        blind = bezuege.count("aversion")
        teile.append(
            "For you, all the compared points see each other." if not blind
            else "For you, none of the compared pairs see each other." if blind == len(bezuege)
            else f"For you, {_zahl(blind)} of {_zahl(len(bezuege))} lines stay open in the middle." if blind > 1
            else f"For you, one of {_zahl(len(bezuege))} lines stays open in the middle."
        )
    return " ".join(teile)


KUTA_NAME = {"tara": "Tara", "yoni": "Yoni", "gana": "Gana", "bhakoot": "Bhakoot", "nadi": "Nadi"}
KUTA_VOLL = {"tara": 3, "yoni": 4, "gana": 6, "bhakoot": 7, "nadi": 8}


def _liste(namen: List[str]) -> str:
    return namen[0] if len(namen) == 1 else ", ".join(namen[:-1]) + " and " + namen[-1]


def vedisch_paar(d: Dict[str, Any]) -> str:
    teile = [
        "This rangoli is strewn for two. In the center blooms a flower with five petals, one for each Kuta by "
        "which Vedic astrology examines a couple: Tara, Yoni, Gana, Bhakoot and Nadi. Each petal is outlined "
        "with dots of rice flour and filled with colored powder from the inside, as far as you reach points in "
        "it. On the outside lies the ring of the 27 Nakshatras, the lunar mansions; a golden bangle lies around "
        "your birth Nakshatra, a silver one around your partner's. A cord runs from each bangle to the center.",
    ]
    kutas = d.get("kutas") or {}
    voll = [KUTA_NAME[k] for k, v in kutas.items() if k in KUTA_VOLL and v >= KUTA_VOLL[k]]
    leer = [KUTA_NAME[k] for k, v in kutas.items() if k in KUTA_NAME and not v]
    if voll:
        teile.append(f"{_liste(voll)} {'is' if len(voll) == 1 else 'are'} completely filled"
                     + (f", while {_liste(leer)} {'stays' if len(leer) == 1 else 'stay'} empty." if leer else "."))
    elif leer:
        teile.append(f"{_liste(leer)} {'stays' if len(leer) == 1 else 'stay'} empty.")
    punkte, hoechst = float(d["punkte"]), float(d["max"])
    teile.append(
        f"With {punkte:g} of {hoechst:g} points, at least half, the two cords are knotted together in the center."
        if punkte >= hoechst / 2
        else f"With {punkte:g} of {hoechst:g} points, less than half, the ends of the cords lie loosely side by side."
    )
    return " ".join(teile)


BAZI_FADEN = {
    "he": "For you it is pulled tight and knotted: your branches form one of the Six Harmonies (Liu He), the "
          "closest bond between two branches.",
    "sanhe": "For you it is taut: your branches belong to the same triangle (San He) and pull in the same "
             "direction.",
    "chong": "For you it is torn: your branches stand opposite each other and clash (Chong).",
    "hai": "For you it is tangled: your branches harm each other (Liu Hai).",
    "gleich": "For you it is looped twice: you both have the same branch.",
    "neutral": "For you it hangs loosely: your branches have no particular relationship to each other.",
}


def bazi_paar(d: Dict[str, Any]) -> str:
    teile = [
        "Your two Bazi cards lie on the lacquer tray, yours with gold writing on the right, your partner's with "
        "silver writing on the left. A red thread connects the Earthly Branches of your day pillars. Chinese "
        "tradition calls this branch the Spouse Palace; the thread recalls the old belief that an invisible red "
        "thread connects people who are destined for each other. The way it lies shows how the two branches "
        "relate to each other."
    ]
    if d.get("ehepalast") in BAZI_FADEN:
        teile.append(BAZI_FADEN[d["ehepalast"]])
    return " ".join(teile)


ARABISCH_FELD = {
    "freunde": "For you it shines golden: the two rulers are friends.",
    "gleich": "For you it shines golden: you are both under the same ruler.",
    "gemischt": "For you it shines only faintly: the two rulers do not see each other alike.",
    "feinde": "For you it stays dull and unglazed: the two rulers are enemies.",
    "neutral": "For you it stays plain: the two rulers are indifferent to each other.",
    "knoten": "For you it stays plain: the lunar nodes know no friendships.",
}


def arabisch_paar(d: Dict[str, Any]) -> str:
    teile = [
        "The zellij disc carries two Firdaria rings, because for each person the order of the periods of life "
        "depends on whether they were born by day or by night. Your ring is on the outside, your partner's on "
        "the inside. Two pointers stand where you are today: the long golden one at yours, the shorter silver "
        "one at your partner's; your current tiles are laid with gold leaf and silver. The field between the "
        "pointers shows how the rulers of your two periods stand toward each other."
    ]
    if d.get("art") in ARABISCH_FELD:
        teile.append(ARABISCH_FELD[d["art"]])
    return " ".join(teile)


KABBALAH_LAGE = {
    "pfad": "Your Sephiroth are connected directly by a path. Each of you has colored it in from your own side "
            "up to the middle and circled the Hebrew letter on it.",
    "gleich": "You share the same Sephira; your two hatchings lie on top of each other, with the notes to the "
              "left and right of it.",
    "saeule": "Your Sephiroth are not directly connected, but they stand on the same pillar. The pillar between "
              "them has been traced over with dashes in both colors.",
    "getrennt": "Your Sephiroth are not directly connected and stand on different pillars. From each, a dashed "
                "line leads to the middle, to Tiphereth, the heart of the tree.",
}


def kabbalah_paar(d: Dict[str, Any]) -> str:
    teile = [
        "Two people have worked on this book page with the Tree of Life: you with a gold pencil, your partner "
        "with a graphite pencil. Each of you has hatched and circled your Sephira and left a note in the margin "
        "in your own handwriting."
    ]
    if d.get("art") in KABBALAH_LAGE:
        teile.append(KABBALAH_LAGE[d["art"]])
    return " ".join(teile)


def numerologie_paar(d: Dict[str, Any]) -> str:
    teile = [
        "Two calculations stand side by side on the notebook page, yours on the left in fountain-pen ink, your "
        "partner's on the right in pencil. From each date of birth, the digit sums of the day, month and year "
        "are formed and added up to the Life Path number."
    ]
    if d.get("bewertung"):
        teile.append(
            "The teacher has circled both Life Path numbers in red, joined them with an arc and written "
            f"underneath how numerology rates this match: “{d['bewertung']}!”"
        )
    return " ".join(teile)


PAAR: Dict[str, Callable[[Dict[str, Any]], str]] = {
    "Westlich": westlich_paar,
    "Bazi": bazi_paar,
    "Hellenistisch": hellenistisch_paar,
    "Vedisch": vedisch_paar,
    "Arabisch": arabisch_paar,
    "Numerologie": numerologie_paar,
    "Kabbalah": kabbalah_paar,
}
