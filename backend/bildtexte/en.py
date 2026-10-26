"""Picture texts in English: builds one paragraph per system from the facts (bildtexte/__init__.py)."""

from typing import Any, Callable, Dict

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
