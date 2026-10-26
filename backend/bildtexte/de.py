"""Bildtexte auf Deutsch: baut aus den Fakten (bildtexte/__init__.py) je System einen Absatz."""

from typing import Any, Callable, Dict, List

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


# --- Spiel C: die Grafiken fuer zwei ------------------------------------------------------------------------

PAAR_ASPEKT = {
    "trine": "blau beim Trigon", "sextil": "hellblau beim Sextil", "quadrat": "rot beim Quadrat",
    "opposition": "orange bei der Opposition", "konjunktion": "hell bei der Konjunktion",
}
ZAHLWORT = ["kein", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"]


def _zahl(n: int) -> str:
    return ZAHLWORT[n] if n < len(ZAHLWORT) else str(n)


def westlich_paar(d: Dict[str, Any]) -> str:
    asz = "aszendent" in d["punkte"]["a"] and "aszendent" in d["punkte"]["b"]
    teile = [
        "Das Doppelrad legt den Himmel eurer beiden Geburtsstunden übereinander, so wie es die westliche "
        "Astrologie für Paare tut (Synastrie). Außen liegt der Tierkreis, darunter der silberne Ring deines "
        "Gegenübers, innen dein goldener, je mit Sonne, Mond, Venus und Mars"
        + (" und dem Aszendenten." if asz else "."),
        "Bildet ein Punkt von dir mit einem Punkt deines Gegenübers einen der alten Winkel, spannt sich zwischen "
        "den Ringen ein Lichtfaden: blau beim Trigon und hellblau beim Sextil, die als harmonisch gelten; rot "
        "beim Quadrat und orange bei der Opposition, die als spannungsreich gelten und deshalb flackern. Fallen "
        "zwei Punkte aufeinander (Konjunktion), leuchtet der Faden hell.",
    ]
    arten = [x["aspekt"] for x in d.get("aspekte", [])]
    if not arten:
        teile.append("Zwischen euch spannt sich kein Faden: Keiner eurer Punkte steht in engem Winkel zum anderen.")
    else:
        spannung = sum(a in ("quadrat", "opposition") for a in arten)
        teile.append(
            ("Zwischen euch läuft ein Faden" if len(arten) == 1 else f"Zwischen euch laufen {_zahl(len(arten))} Fäden")
            + (", keiner davon flackert." if not spannung
               else ", und alle flackern." if spannung == len(arten)
               else f", {_zahl(spannung)} davon flackern." if spannung > 1 else ", einer davon flackert.")
        )
    return " ".join(teile)


def hellenistisch_paar(d: Dict[str, Any]) -> str:
    asz = "aszendent" in d["punkte"]["a"] and "aszendent" in d["punkte"]["b"]
    teile = [
        "Am Rand des Tellers stehen die zwölf Zeichen des Tierkreises mit ihren griechischen Namen. Mit Kreide "
        f"eingezeichnet sind {'Sonne, Mond und Aszendent' if asz else 'Sonne und Mond'} von euch beiden, deine "
        "in gelber, die deines Gegenübers in weißer Kreide.",
        "Die hellenistische Astrologie fragt bei zwei Zeichen, ob sie einander sehen: im selben Zeichen, "
        "gegenüber, im Dreieck, im Viereck oder im Sechseck. Wo sie sich sehen, verbindet sie ein "
        "durchgehender Kreidestrich. Stehen sie in Aversion, sehen sie sich also nicht, bleibt die Mitte des "
        "Strichs leer.",
    ]
    bezuege = [x["bezug"] for x in d.get("bezuege", [])]
    if bezuege:
        blind = bezuege.count("aversion")
        teile.append(
            "Bei euch sehen sich alle verglichenen Punkte." if not blind
            else "Bei euch sieht sich keines der verglichenen Paare." if blind == len(bezuege)
            else f"Bei euch bleiben {_zahl(blind)} von {_zahl(len(bezuege))} Strichen in der Mitte offen." if blind > 1
            else f"Bei euch bleibt einer von {_zahl(len(bezuege))} Strichen in der Mitte offen."
        )
    return " ".join(teile)


KUTA_NAME = {"tara": "Tara", "yoni": "Yoni", "gana": "Gana", "bhakoot": "Bhakoot", "nadi": "Nadi"}
KUTA_VOLL = {"tara": 3, "yoni": 4, "gana": 6, "bhakoot": 7, "nadi": 8}


def _liste(namen: List[str]) -> str:
    return namen[0] if len(namen) == 1 else ", ".join(namen[:-1]) + " und " + namen[-1]


def vedisch_paar(d: Dict[str, Any]) -> str:
    teile = [
        "Das Rangoli ist für zwei gestreut. In der Mitte blüht eine Blüte mit fünf Blättern, eines für jede "
        "Kuta, mit der die vedische Astrologie ein Paar prüft: Tara, Yoni, Gana, Bhakoot und Nadi. Jedes Blatt "
        "ist mit Reismehlpunkten umrandet und von innen so weit mit Farbpulver gefüllt, wie ihr darin Punkte "
        "erreicht. Außen liegt der Ring der 27 Nakshatras, der Mondhäuser; ein goldener Armreif liegt um dein "
        "Geburts-Nakshatra, ein silberner um das deines Gegenübers. Von beiden Reifen führt eine Schnur zur Mitte.",
    ]
    kutas = d.get("kutas") or {}
    voll = [KUTA_NAME[k] for k, v in kutas.items() if k in KUTA_VOLL and v >= KUTA_VOLL[k]]
    leer = [KUTA_NAME[k] for k, v in kutas.items() if k in KUTA_NAME and not v]
    if voll:
        teile.append(f"Ganz gefüllt {'ist' if len(voll) == 1 else 'sind'} {_liste(voll)}"
                     + (f", leer {'bleibt' if len(leer) == 1 else 'bleiben'} {_liste(leer)}." if leer else "."))
    elif leer:
        teile.append(f"Leer {'bleibt' if len(leer) == 1 else 'bleiben'} {_liste(leer)}.")
    punkte, hoechst = float(d["punkte"]), float(d["max"])
    zahl = f"{punkte:g}".replace(".", ",")
    teile.append(
        f"Mit {zahl} von {hoechst:g} Punkten, mindestens der Hälfte, sind die beiden Schnüre in der Mitte verknotet."
        if punkte >= hoechst / 2
        else f"Mit {zahl} von {hoechst:g} Punkten, weniger als der Hälfte, liegen die Enden der Schnüre lose nebeneinander."
    )
    return " ".join(teile)


BAZI_FADEN = {
    "he": "Bei euch ist er straff gespannt und verknotet: Eure Zweige bilden eine der sechs Kombinationen "
          "(Liu He), die engste Verbindung zweier Zweige.",
    "sanhe": "Bei euch ist er gespannt: Eure Zweige gehören zum selben Dreieck (San He) und ziehen in dieselbe "
             "Richtung.",
    "chong": "Bei euch ist er gerissen: Eure Zweige stehen einander gegenüber und stoßen zusammen (Chong).",
    "hai": "Bei euch hat er sich verheddert: Eure Zweige schaden einander (Liu Hai).",
    "gleich": "Bei euch ist er doppelt geschlungen: Ihr habt beide denselben Zweig.",
    "neutral": "Bei euch hängt er locker durch: Eure Zweige stehen in keiner besonderen Beziehung zueinander.",
}


def bazi_paar(d: Dict[str, Any]) -> str:
    teile = [
        "Auf dem Lacktablett liegen eure beiden Bazi-Karten, deine mit Goldschrift rechts, die deines "
        "Gegenübers mit Silberschrift links. Ein roter Faden verbindet die Erdzweige eurer Tagessäulen. "
        "Diesen Zweig nennt die chinesische Tradition den Ehepalast; der Faden erinnert an die alte "
        "Vorstellung, dass ein unsichtbarer roter Faden Menschen verbindet, die füreinander bestimmt sind. "
        "Wie er liegt, zeigt, wie die beiden Zweige zueinander stehen."
    ]
    if d.get("ehepalast") in BAZI_FADEN:
        teile.append(BAZI_FADEN[d["ehepalast"]])
    return " ".join(teile)


ARABISCH_FELD = {
    "freunde": "Bei euch glänzt es golden: Die beiden Herrscher sind einander Freunde.",
    "gleich": "Bei euch glänzt es golden: Ihr steht beide unter demselben Herrscher.",
    "gemischt": "Bei euch glänzt es nur schwach: Die beiden Herrscher sehen einander nicht gleich.",
    "feinde": "Bei euch bleibt es matt und unglasiert: Die beiden Herrscher sind einander Feinde.",
    "neutral": "Bei euch bleibt es schlicht: Die beiden Herrscher sind einander gleichgültig.",
    "knoten": "Bei euch bleibt es schlicht: Die Mondknoten kennen keine Freundschaften.",
}


def arabisch_paar(d: Dict[str, Any]) -> str:
    teile = [
        "Das Zellij-Rund trägt zwei Firdaria-Ringe, denn die Reihenfolge der Lebensabschnitte hängt bei jedem "
        "davon ab, ob man bei Tag oder bei Nacht geboren ist. Außen liegt dein Ring, innen der deines "
        "Gegenübers. Zwei Zeiger stehen dort, wo ihr heute seid: der lange goldene bei dir, der kürzere "
        "silberne bei deinem Gegenüber; eure laufenden Kacheln sind mit Blattgold und Silber belegt. Das Feld "
        "zwischen den Zeigern zeigt, wie die beiden Herrscher eurer Abschnitte zueinander stehen."
    ]
    if d.get("art") in ARABISCH_FELD:
        teile.append(ARABISCH_FELD[d["art"]])
    return " ".join(teile)


KABBALAH_LAGE = {
    "pfad": "Eure Sephiroth sind durch einen Pfad direkt verbunden. Jeder hat ihn von seiner Seite her bis zur "
            "Mitte ausgemalt und den hebräischen Buchstaben darauf umkringelt.",
    "gleich": "Ihr habt dieselbe Sephira; eure beiden Schraffuren liegen übereinander, die Notizen stehen links "
              "und rechts davon.",
    "saeule": "Eure Sephiroth sind nicht direkt verbunden, stehen aber auf derselben Säule. Die Säule zwischen "
              "ihnen ist in beiden Farben gestrichelt nachgezogen.",
    "getrennt": "Eure Sephiroth sind nicht direkt verbunden und stehen auf verschiedenen Säulen. Von jeder führt "
                "eine gestrichelte Linie zur Mitte, nach Tiphereth, dem Herzen des Baums.",
}


def kabbalah_paar(d: Dict[str, Any]) -> str:
    teile = [
        "In dieser Buchseite mit dem Baum des Lebens haben zwei gearbeitet: du mit einem Goldstift, dein "
        "Gegenüber mit einem Graphitstift. Jeder hat seine Sephira schraffiert und umkringelt und am Rand eine "
        "Notiz in eigener Handschrift hinterlassen."
    ]
    if d.get("art") in KABBALAH_LAGE:
        teile.append(KABBALAH_LAGE[d["art"]])
    return " ".join(teile)


def numerologie_paar(d: Dict[str, Any]) -> str:
    teile = [
        "Auf der Heftseite stehen zwei Rechnungen nebeneinander, links deine in Füllertinte, rechts die deines "
        "Gegenübers in Bleistift. Aus jedem Geburtsdatum werden die Quersummen von Tag, Monat und Jahr "
        "gebildet und zur Lebenszahl zusammengezählt."
    ]
    if d.get("bewertung"):
        teile.append(
            "Die Lehrerin hat beide Lebenszahlen rot umkringelt, mit einem Bogen verbunden und darunter "
            f"geschrieben, wie die Numerologie diese Verbindung bewertet: „{d['bewertung']}!“"
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
