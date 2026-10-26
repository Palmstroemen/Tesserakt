"""Bildtexte auf Deutsch: baut aus den Fakten (bildtexte/__init__.py) je System einen Absatz."""

from typing import Any, Callable, Dict

from bildtexte import satz as _satz


def _klein(name: str) -> str:
    """Artikel am Anfang klein, fuer die Mitte eines Satzes ("Der Freigeist" -> "der Freigeist")."""
    if name.split(" ")[0] in ("Der", "Die", "Das"):
        return name[0].lower() + name[1:]
    return name


def _gross(text: str) -> str:
    return text[:1].upper() + text[1:]


# --- Westliche Astrologie -----------------------------------------------------------------------------------

PLANET_NAME = {
    "sonne": "die Sonne", "mond": "der Mond", "merkur": "Merkur", "venus": "Venus", "mars": "Mars",
    "jupiter": "Jupiter", "saturn": "Saturn", "uranus": "Uranus", "neptun": "Neptun", "pluto": "Pluto",
}
# Dativ nach "zu": "zur Sonne", "zum Mond", "zu Merkur"
PLANET_ZU = {"sonne": "zur Sonne", "mond": "zum Mond"}
# wofuer ein Planet steht (kurz, nach natur_de in Westlich/western_rules_complete.json)
PLANET_STEHT = {
    "sonne": "dein Wesen und deinen Willen",
    "mond": "Gefühle und Bedürfnisse",
    "merkur": "Denken und Sprechen",
    "venus": "Liebe, Beziehung und Genuss",
    "mars": "Tatkraft, Streit und Durchsetzung",
    "jupiter": "Wachstum und Zuversicht",
    "saturn": "Pflicht, Grenzen und Ausdauer",
    "uranus": "Umbruch und Freiheit",
    "neptun": "Träume und Intuition",
    "pluto": "tiefen Wandel und Macht",
}
# Aspekt: wie er im Satz heisst und die Farbe seiner Linie
ASPEKT = {
    "opposition": ("in Opposition", "orange"),
    "quadrat": ("im Quadrat", "rot"),
    "trigon": ("im Trigon", "blau"),
    "sextil": ("im Sextil", "hellblau"),
}


def westlich(f: Dict[str, Any]) -> str:
    teile = [
        "Die Grafik zeigt den Himmel zur Stunde deiner Geburt. Im äußeren Ring liegen die zwölf "
        "Tierkreiszeichen, jedes farbige Zeichen darin ist ein Planet an seinem Ort"
        + (". Links steht der Aszendent, das Zeichen, das gerade im Osten aufging." if f["haeuser"] else "."),
        "In der westlichen Astrologie betrachtet man vor allem, wie die Planeten zueinander stehen. Stehen "
        "zwei einander gegenüber, spricht man von einer Opposition (orange Linie), stehen sie im rechten "
        "Winkel, von einem Quadrat (rot). Beides gilt als spannungsreich. Ein Drittel des Kreises (Trigon, "
        "blau) und ein Sechstel (Sextil, hellblau) gelten als harmonisch. Je heller eine Linie leuchtet, "
        "desto genauer stimmt der Winkel.",
    ]
    if "a" in f:
        x, y = f["a"], f["b"]
        wie, farbe = ASPEKT[f["aspekt"]]
        teile.append(
            f"Besonders genau ist bei dir die {farbe}e Linie: {_gross(PLANET_NAME[x])} steht "
            f"{wie} {PLANET_ZU.get(y, 'zu ' + PLANET_NAME[y])}. {_gross(PLANET_NAME[x])} steht für "
            f"{PLANET_STEHT[x]}, {PLANET_NAME[y]} für {PLANET_STEHT[y]}. Nach den alten Regeln bedeutet das: "
            f"{_satz(f['deutung'])}"
        )
    return " ".join(teile)


# --- Bazi ---------------------------------------------------------------------------------------------------

ELEMENT_NAME = {"holz": "Holz", "feuer": "Feuer", "erde": "Erde", "metall": "Metall", "wasser": "Wasser"}
ELEMENT_PUNKT = {
    "holz": "grüne", "feuer": "rote", "erde": "ockerfarbene", "metall": "weiße", "wasser": "schwarze",
}


def bazi(f: Dict[str, Any]) -> str:
    teile = [
        "Die rote Karte zeigt die vier Säulen deines Bazi, von rechts nach links gelesen: Jahr, Monat, Tag "
        "und Stunde deiner Geburt. Jede Säule besteht aus zwei Schriftzeichen, oben einem Himmelsstamm, unten "
        "einem Erdzweig. Das Zeichen auf dem goldenen Rhombus ist der Himmelsstamm deines Tages, der "
        "„Tagesmeister“: Er steht für dich selbst. Die fünf Punkte darunter zeigen, wie stark die fünf "
        "Elemente unter deinen acht Zeichen vertreten sind. Je größer der Punkt, desto mehr davon."
    ]
    if f["stunde_geschaetzt"]:
        teile.append("Deine Geburtsstunde ist nicht bekannt, deshalb ist die Stundensäule ganz links blass.")
    tm = f.get("tagesmeister")
    if tm:
        teile.append(
            f"Dein Tagesmeister ist {tm['zeichen']}, {tm['polaritaet'].capitalize()}-"
            f"{ELEMENT_NAME.get(tm['element'], tm['element'])}: {tm['qualitaet']}."
            + (f" Als Stärken gelten {tm['staerken']}." if tm["staerken"] else "")
        )
    if "stark" in f:
        stark, fehlt = f["stark"], f["fehlt"]
        satz = (
            f"Am stärksten vertreten ist {ELEMENT_NAME[stark]} (der {ELEMENT_PUNKT[stark]} Punkt)"
            if stark in ELEMENT_NAME
            else ""
        )
        if fehlt:
            satz += (", ganz fehlt " if len(fehlt) == 1 else ", ganz fehlen ") + " und ".join(
                ELEMENT_NAME.get(e, e) for e in fehlt
            )
        if satz:
            teile.append(satz + ".")
    return " ".join(teile)


# --- Hellenistische Astrologie ------------------------------------------------------------------------------

GOTT = {
    "sonne": ("Helios", "die Strahlensonne"),
    "mond": ("Selene", "die Mondsichel"),
    "merkur": ("Hermes", "der Heroldstab"),
    "venus": ("Aphrodite", "die Muschel"),
    "mars": ("Ares", "Schild und Speer"),
    "jupiter": ("Zeus", "das Blitzbündel"),
    "saturn": ("Kronos", "die Sichel"),
}


def hellenistisch(f: Dict[str, Any]) -> str:
    haus, alter, herr = f["haus"], f["alter"], f["herr"]
    teile = [
        "Der Teller zeigt die zwölf Häuser als griechische Zahlzeichen am Rand, das erste unten, weiter gegen "
        "den Uhrzeigersinn. Die hellenistische Astrologie lässt dich mit jedem Lebensjahr ein Haus "
        "weiterwandern; man nennt das Profektion."
    ]
    if haus and alter is not None:
        teile.append(
            f"Mit {alter} Jahren stehst du im {haus}. Haus, mit Kreide umkringelt"
            + (f". Es steht für {f['thema']}." if f["thema"] else ".")
        )
    if herr in GOTT:
        gott, bild = GOTT[herr]
        teile.append(
            f"Der Herrscher dieses Hauses wird zum Herrn deines Jahres: {_gross(PLANET_NAME[herr])}, "
            f"in der Mitte dargestellt durch {bild} des {gott}."
            + (f" Nach Valens und Dorotheus heißt das: {_satz(f['wirkung'])}" if f["wirkung"] else "")
        )
    return " ".join(teile)


# --- Vedische Astrologie ------------------------------------------------------------------------------------

def vedisch(f: Dict[str, Any]) -> str:
    teile = [
        "Das Rangoli ist aus farbigem Pulver gestreut. Jeder Bogen am Rand ist eine Mahadasha, eine der großen "
        "Lebensperioden der vedischen Astrologie: Oben beginnt dein Leben, im Uhrzeigersinn reicht es bis 120 "
        "Jahre. Je länger eine Periode, desto größer ihr Bogen, die Farbe ist die ihres Planeten. Vergangene "
        "Perioden sind verblasst, die gedrehte Schnur reicht bis zu deinem heutigen Alter. Im inneren Ring aus "
        "27 Punkten trägt dein Geburts-Nakshatra einen goldenen Armreif, das Mondhaus, in dem der Mond bei "
        "deiner Geburt stand."
    ]
    md = f.get("mahadasha")
    if md:
        teile.append(
            f"Du bist in der {md['name']}-Mahadasha, mit Reispunkten umrandet "
            f"(von {md['von']} bis {md['bis']} Jahren). "
            f"Ihre Themen sind nach der Überlieferung {md['themen']}."
        )
    n = f.get("nakshatra")
    if n:
        teile.append(f"Dein Mond stand im Nakshatra {n['name']}, „{_klein(n['bedeutung'])}“: {n['qualitaeten']}")
    return " ".join(teile)


# --- Arabische Astrologie -----------------------------------------------------------------------------------

GENITIV = {
    "sonne": "der Sonne", "venus": "der Venus", "merkur": "des Merkur", "mond": "des Mondes",
    "saturn": "des Saturn", "jupiter": "des Jupiter", "mars": "des Mars",
    "nordknoten": "des Nordknotens", "suedknoten": "des Südknotens",
}


def arabisch(f: Dict[str, Any]) -> str:
    teile = [
        "Die Fliesenscheibe zeigt die Firdaria, die Lebensperioden der arabischen Astrologie. Neun Perioden "
        "folgen in einem Kreis von 75 Jahren aufeinander, oben beginnt er, weiter im Uhrzeigersinn. Je länger "
        "eine Periode, desto breiter ihre Fliese. Der Messingzeiger zeigt, wo du heute stehst, die laufende "
        "Fliese ist vergoldet.",
        f"Die Nabe ist {'golden: Du bist am Tag geboren' if f['tag'] else 'silbern: Du bist in der Nacht geboren'}, "
        "und davon hängt ab, mit welchem Planeten dein Leben beginnt.",
    ]
    jetzt = f.get("jetzt")
    if jetzt:
        teile.append(
            f"Du stehst in der Firdaria {GENITIV.get(jetzt['planet'], jetzt['name'])}, "
            f"bis du {jetzt['bis']} bist. {jetzt['deutung']}"
        )
        if f["danach"] in GENITIV:
            teile.append(f"Danach folgt die Firdaria {GENITIV[f['danach']]}.")
    return " ".join(teile)


# --- Numerologie --------------------------------------------------------------------------------------------

def numerologie(f: Dict[str, Any]) -> str:
    teile = [
        "Das Heft zeigt, wie die Numerologie deine Lebenszahl ausrechnet: Tag, Monat und Jahr deiner Geburt "
        "werden zu Quersummen verkürzt und zusammengezählt, bis eine einzige Ziffer übrig bleibt. Nur die "
        "Meisterzahlen 11, 22 und 33 lässt man stehen."
    ]
    if "name" in f:
        teile.append(
            f"Rot eingekreist ist deine Lebenszahl {f['zahl']}"
            + (", eine Meisterzahl" if f["meister"] else "")
            + f", „{_klein(f['name'])}“. Sie steht für {f['kernthema']}."
        )
    return " ".join(teile)


# --- Kabbalah -----------------------------------------------------------------------------------------------

def kabbalah(f: Dict[str, Any]) -> str:
    teile = [
        "Die Buchseite zeigt den Baum des Lebens: zehn Kreise, die Sephiroth, verbunden durch 22 Pfade, jeder "
        "mit einem hebräischen Buchstaben. Mit Buntstift markiert sind deine Sephira, abgeleitet aus deiner "
        "Lebenszahl, und ein Pfad, der sich nach deinem Geburtstag im Jahreslauf richtet. Am Rand "
        "stehen Notizen dazu."
    ]
    s = f.get("sephira")
    if s:
        teile.append(f"Deine Sephira ist {s['name']}, „{_klein(s['bedeutung'])}“, mit der Tugend {s['tugend']}.")
    p = f.get("pfad")
    if p:
        teile.append(
            f"Dein Pfad trägt den Buchstaben {p['buchstabe']}, „{p['bedeutung']}“; "
            f"im Tarot gehört dazu die Karte „{p['tarot']}“."
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
