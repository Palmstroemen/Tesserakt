"""Probeseite Korn als PDF zum Ausdrucken (A4, 300 dpi).

Nimmt die Blaetter von /korn.html (frontend/src/apparat/Kornprobe.jsx) mit Playwright in Druckaufloesung auf:
Die Filter (Fotokorn, Papierdruck) sind damit genau fuer 300 dpi gerechnet, unabhaengig davon, wie ein
Browser Filter beim Drucken umsetzt. Voraussetzung: Entwicklungsserver und Backend laufen (start-dev.sh).

    python3 tools/kornprobe.py [ziel.pdf] [--datum 1985-04-12] [--adresse https://localhost:5173]
"""

import argparse
import io

from PIL import Image
from playwright.sync_api import sync_playwright

DPI = 300
SKALA = DPI / 96  # CSS-Pixel haben 96 je Zoll
A4 = (round(210 / 25.4 * DPI), round(297 / 25.4 * DPI))


def main() -> None:
    teil = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    teil.add_argument("ziel", nargs="?", default="kornprobe.pdf")
    teil.add_argument("--datum", default="1985-04-12")
    teil.add_argument("--adresse", default="https://localhost:5173")
    args = teil.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        seite = browser.new_page(
            ignore_https_errors=True,
            viewport={"width": 900, "height": 1200},
            device_scale_factor=SKALA,
        )
        seite.goto(f"{args.adresse}/korn.html?datum={args.datum}")
        seite.wait_for_selector(".kp-blatt svg", timeout=120000)
        # randlos: kein Seitenhintergrund zwischen den Blaettern im Bild
        seite.add_style_tag(content=".kp-blatt { margin: 0 !important; } body { background: #fbf7ee !important; }")
        seite.wait_for_timeout(2000)  # Schriften und Bilder
        bilder = []
        for blatt in seite.locator(".kp-blatt").all():
            bild = Image.open(io.BytesIO(blatt.screenshot())).convert("RGB")
            bilder.append(bild.crop((0, 0) + A4))  # Rundung beim Aufnehmen: auf genau A4
        browser.close()

    # Pillow bettet RGB als JPEG ein: fast verlustfrei und ohne Farbunterabtastung, damit das Korn bleibt
    bilder[0].save(
        args.ziel,
        save_all=True,
        append_images=bilder[1:],
        resolution=DPI,
        quality=98,
        subsampling=0,
    )
    print(f"{args.ziel}: {len(bilder)} Blatt, {bilder[0].width} x {bilder[0].height} Bildpunkte ({DPI} dpi)")


if __name__ == "__main__":
    main()
