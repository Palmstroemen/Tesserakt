"""
App-Symbol und Startbildschirm aus dem Deckel des Kaestchens: das Sonne-Mond-Emblem (Einlage laut
frontend/src/apparat/kaestchen/deckel.json) auf dem Holz des Deckels.

Erzeugt:
- Android-Adaptive-Icon: mipmap-*/ic_launcher_foreground.png (Emblem mit Schatten, freigestellt) und
  mipmap-*/ic_launcher_background.png (Holz), dazu ic_launcher.png und ic_launcher_round.png fuer alte Androids
- Startbildschirm: drawable*/splash.png (Emblem auf dem dunklen Grund des Apparats)
- Store-Symbol: frontend/store/symbol-512.png (Google Play, 512 x 512, ohne Transparenz)

    python3 tools/app_symbol.py
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

WURZEL = Path(__file__).resolve().parent.parent
DECKEL = WURZEL / "frontend/src/apparat/kaestchen/deckel.webp"
RES = WURZEL / "frontend/android/app/src/main/res"
STORE = WURZEL / "frontend/store"

DUNKEL = (0x16, 0x11, 0x0D)  # apparat_dunkel (values/farben.xml)
# Adaptive Icon: 108 dp Flaeche, davon 72 dp sichtbar, 66 dp sicher vor jeder Maske des Launchers
DICHTEN = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
EMBLEM_ANTEIL = 64 / 108  # Durchmesser des Emblems auf der Flaeche: knapp innerhalb der sicheren Zone
# freie Holzflaeche links unten auf dem Deckel (ohne Fuge, ohne Schnitzerei)
HOLZ = (24, 1960, 556, 2470)


def emblem() -> Image.Image:
    """Das runde Emblem, freigestellt (RGBA), in voller Aufloesung."""
    deckel = Image.open(DECKEL).convert("RGB")
    e = json.loads((DECKEL.with_suffix(".json")).read_text())["einlage"]
    x, y, r = e["x"], e["y"], e["r"]
    bild = deckel.crop((x - r, y - r, x + r, y + r))
    # weiche Kante: Maske vierfach gross zeichnen und verkleinern
    gross = Image.new("L", (8 * r, 8 * r), 0)
    ImageDraw.Draw(gross).ellipse((4, 4, 8 * r - 4, 8 * r - 4), fill=255)
    bild.putalpha(gross.resize(bild.size, Image.LANCZOS))
    return bild


def holz(groesse: int) -> Image.Image:
    """Holz des Deckels, quadratisch, zum Rand hin etwas dunkler."""
    h = Image.open(DECKEL).convert("RGB").crop(HOLZ).resize((groesse, groesse), Image.LANCZOS)
    rand = Image.new("L", (groesse, groesse), 0)
    ImageDraw.Draw(rand).ellipse((-groesse // 4, -groesse // 4, groesse * 5 // 4, groesse * 5 // 4), fill=255)
    rand = rand.filter(ImageFilter.GaussianBlur(groesse / 6))
    dunkler = Image.blend(h, Image.new("RGB", h.size, DUNKEL), 0.45)
    return Image.composite(h, dunkler, rand)


def mit_schatten(bild: Image.Image, flaeche: int, durchmesser: int) -> Image.Image:
    """Emblem mittig auf transparenter Flaeche, mit Schatten nach unten (wie eingelegt und erhaben)."""
    e = bild.resize((durchmesser, durchmesser), Image.LANCZOS)
    ebene = Image.new("RGBA", (flaeche, flaeche), (0, 0, 0, 0))
    ort = ((flaeche - durchmesser) // 2, (flaeche - durchmesser) // 2)
    schatten = Image.new("RGBA", (flaeche, flaeche), (0, 0, 0, 0))
    maske = Image.new("L", (flaeche, flaeche), 0)
    maske.paste(e.getchannel("A"), (ort[0], ort[1] + max(1, durchmesser // 40)))
    maske = maske.filter(ImageFilter.GaussianBlur(max(1, durchmesser / 45)))
    schatten.putalpha(ImageChops.multiply(maske, Image.new("L", maske.size, 150)))
    ebene.alpha_composite(schatten)
    ebene.alpha_composite(e, ort)
    return ebene


def maskiert(bild: Image.Image, rund: bool) -> Image.Image:
    groesse = bild.size[0]
    gross = Image.new("L", (4 * groesse, 4 * groesse), 0)
    zeichnen = ImageDraw.Draw(gross)
    if rund:
        zeichnen.ellipse((0, 0, 4 * groesse - 1, 4 * groesse - 1), fill=255)
    else:
        zeichnen.rounded_rectangle((0, 0, 4 * groesse - 1, 4 * groesse - 1), radius=int(4 * groesse * 0.18), fill=255)
    aus = bild.convert("RGBA")
    aus.putalpha(gross.resize(bild.size, Image.LANCZOS))
    return aus


def main() -> None:
    e = emblem()
    for name, faktor in DICHTEN.items():
        ordner = RES / f"mipmap-{name}"
        flaeche = round(108 * faktor)
        vorne = mit_schatten(e, flaeche, round(flaeche * EMBLEM_ANTEIL))
        hinten = holz(flaeche)
        vorne.save(ordner / "ic_launcher_foreground.png", optimize=True)
        hinten.save(ordner / "ic_launcher_background.png", optimize=True)
        # alte Androids: die sichtbaren 72 dp der Flaeche, auf 48 dp
        ganz = hinten.convert("RGBA")
        ganz.alpha_composite(vorne)
        rand = round(18 * faktor)
        sichtbar = ganz.crop((rand, rand, flaeche - rand, flaeche - rand)).resize(
            (round(48 * faktor),) * 2, Image.LANCZOS
        )
        maskiert(sichtbar, rund=False).save(ordner / "ic_launcher.png", optimize=True)
        maskiert(sichtbar, rund=True).save(ordner / "ic_launcher_round.png", optimize=True)

    # Startbildschirm: alle vorhandenen splash.png in ihrer Groesse neu
    for datei in sorted(RES.glob("drawable*/splash.png")):
        b, h = Image.open(datei).size
        grund = Image.new("RGBA", (b, h), DUNKEL + (255,))
        d = round(min(b, h) * 0.42)
        grund.alpha_composite(mit_schatten(e, d + d // 4, d), ((b - d - d // 4) // 2, (h - d - d // 4) // 2))
        grund.convert("RGB").save(datei, optimize=True)

    # Google Play: 512 x 512, volle Flaeche (Google rundet die Ecken selbst)
    STORE.mkdir(exist_ok=True)
    store = holz(512).convert("RGBA")
    store.alpha_composite(mit_schatten(e, 512, 400))
    store.convert("RGB").save(STORE / "symbol-512.png", optimize=True)
    print("App-Symbol, Startbildschirm und Store-Symbol erzeugt")


if __name__ == "__main__":
    main()
