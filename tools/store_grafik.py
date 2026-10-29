"""
Vorstellungsgrafik fuer Google Play (1024 x 500, ohne Transparenz) aus dem Deckel des Kaestchens: das glatte
Holz unten am Deckel (mit der Fuge in der Mitte) als Grund, darauf das Sonne-Mond-Emblem und der geschnitzte
Schriftzug, wie auf dem Deckel uebereinander.

    python3 tools/store_grafik.py

Erzeugt frontend/store/vorstellung-1024x500.png.
"""

from __future__ import annotations

from PIL import Image, ImageDraw, ImageFilter

from app_symbol import DECKEL, DUNKEL, STORE, emblem, mit_schatten

BREITE, HOEHE = 1024, 500
GRUND = (40, 1900, 1112, 2480)  # glattes Holz unten, Fuge in der Mitte
TITEL = (0, 1170, 1152, 1440)  # Schriftzug mit Rahmen
EMBLEM = 300  # Durchmesser
TITEL_BREITE = 620


def weicher_rand(groesse: tuple[int, int], rand: int) -> Image.Image:
    """Maske, die zu den Raendern hin ausblendet (Ausschnitt geht ins Holz ueber)."""
    b, h = groesse
    maske = Image.new("L", groesse, 0)
    ImageDraw.Draw(maske).rectangle((rand, rand, b - rand, h - rand), fill=255)
    return maske.filter(ImageFilter.GaussianBlur(rand / 2))


def main() -> None:
    deckel = Image.open(DECKEL).convert("RGB")

    # Grund: Holz auf die Flaeche, die Fuge bleibt in der Mitte; zu den Raendern dunkler
    holz = deckel.crop(GRUND)
    s = max(BREITE / holz.width, HOEHE / holz.height)
    holz = holz.resize((round(holz.width * s), round(holz.height * s)), Image.LANCZOS)
    x0 = (holz.width - BREITE) // 2
    y0 = (holz.height - HOEHE) // 2
    bild = holz.crop((x0, y0, x0 + BREITE, y0 + HOEHE))
    licht = Image.new("L", bild.size, 0)
    ImageDraw.Draw(licht).ellipse((-BREITE // 6, -HOEHE // 3, BREITE * 7 // 6, HOEHE * 4 // 3), fill=255)
    licht = licht.filter(ImageFilter.GaussianBlur(HOEHE / 5))
    bild = Image.composite(bild, Image.blend(bild, Image.new("RGB", bild.size, DUNKEL), 0.55), licht)
    bild = bild.convert("RGBA")

    # Emblem auf der Fuge
    flaeche = EMBLEM + EMBLEM // 4
    bild.alpha_composite(mit_schatten(emblem(), flaeche, EMBLEM), ((BREITE - flaeche) // 2, 24 - EMBLEM // 8))

    # Schriftzug darunter, Rand weich ins Holz
    titel = deckel.crop(TITEL)
    titel = titel.resize((TITEL_BREITE, round(titel.height * TITEL_BREITE / titel.width)), Image.LANCZOS)
    titel.putalpha(weicher_rand(titel.size, 18))
    bild.alpha_composite(titel, ((BREITE - TITEL_BREITE) // 2, HOEHE - titel.height - 22))

    STORE.mkdir(exist_ok=True)
    bild.convert("RGB").save(STORE / "vorstellung-1024x500.png", optimize=True)
    print("Vorstellungsgrafik erzeugt")


if __name__ == "__main__":
    main()
