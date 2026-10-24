"""Deckelbild des Kaestchens aufbereiten (einmalig, Quelle: pics/Deckel_1.png, nicht eingecheckt).

- schneidet die sichtbare Unterkante des Kaestchens ab und setzt unten Holz an, damit der Deckel auch auf hohen
  Handys bis an den unteren Rand reicht (die Einlage sitzt ueber der Datumsscheibe, siehe Kaestchen.jsx)
- zeichnet die Fuge nach (dunkelster Weg von oben nach unten; in der Einlage entlang der Gesichtsprofile)
- schreibt deckel.webp und deckel.json nach src/apparat/kaestchen/

Aufruf aus frontend/:  python3 tools/kaestchen.py
"""

import json
from pathlib import Path

import numpy as np
from PIL import Image

QUELLE = Path(__file__).resolve().parents[2] / "pics" / "Deckel_1.png"
ZIEL = Path(__file__).resolve().parents[1] / "src" / "apparat" / "kaestchen"

SCHNITT = 1930  # darunter beginnt die abgegriffene Unterkante des Deckels
HOEHE = 2480  # reicht bis zu Handys im Format 21:9
QUELLBAND = (1890, 1930)  # glattes Holz unter den Ranken, Maserung quer
EINLAGE = {"x": 576, "y": 660, "r": 428}  # Mittelpunkt und Radius der Sonne-Mond-Einlage (Bildpunkte)


def flaeche_fuellen(quelle, hoehe, breite, zufall):
    """Holzflaeche aus Kacheln des Quellbands zusammensetzen (Kacheln an zufaelliger Stelle, teils gespiegelt,
    weich ineinander geblendet), damit sich keine Streifen oder Wiederholungen zeigen."""
    qh, qb = quelle.shape[:2]
    kb, ueb_x = 180, 40
    kh, ueb_y = qh, 12
    schritt_x, schritt_y = kb - ueb_x, kh - ueb_y
    summe = np.zeros((hoehe + kh, breite + kb, 3))
    gewicht = np.zeros((hoehe + kh, breite + kb, 1))
    fenster_x = np.minimum(1, np.minimum(np.arange(kb) + 1, kb - np.arange(kb)) / ueb_x)
    fenster_y = np.minimum(1, np.minimum(np.arange(kh) + 1, kh - np.arange(kh)) / ueb_y)
    fenster = (fenster_y[:, None] * fenster_x[None, :])[..., None]
    for y in range(0, hoehe, schritt_y):
        versatz = zufall.integers(0, schritt_x)
        for x in range(-versatz, breite, schritt_x):
            sx = zufall.integers(0, qb - kb)
            kachel = quelle[:, sx : sx + kb]
            if zufall.random() < 0.5:
                kachel = kachel[:, ::-1]
            kachel = kachel * zufall.uniform(0.96, 1.04)
            x0 = max(x, 0)
            k0 = x0 - x
            breit = min(kb - k0, breite + kb - x0)
            summe[y : y + kh, x0 : x0 + breit] += (kachel * fenster)[:, k0 : k0 + breit]
            gewicht[y : y + kh, x0 : x0 + breit] += fenster[:, k0 : k0 + breit]
    return (summe / np.maximum(gewicht, 1e-6))[:hoehe, :breite]


def holz_ansetzen(bild, fuge_x, zufall):
    """Unter SCHNITT Holz fortsetzen, je Deckelhaelfte fuer sich; Fuge und Aussenkanten laufen gerade weiter."""
    oben, unten = QUELLBAND
    band = bild[oben:unten]
    n = HOEHE - SCHNITT
    neu = np.repeat(band[-1:], n, axis=0)  # Fuge und Raender: letzte Zeile fortgesetzt
    rand, spalt = 16, 4
    for a, b in ((rand, fuge_x - spalt), (fuge_x + spalt, bild.shape[1] - rand)):
        neu[:, a:b] = flaeche_fuellen(band[:, a + 20 : b - 20], n, b - a, zufall)
    # langsame Helligkeitsschwankung entlang der Hoehe
    welle = np.convolve(zufall.normal(0, 1, n + 400), np.ones(200) / 200, "same")[200:-200]
    neu = neu * (1 + 0.5 * welle)[:, None, None]
    neu = np.clip(neu, 0, 255)
    erg = np.concatenate([bild[:SCHNITT], neu], axis=0)
    # Uebergang weich ueberblenden
    b = 16
    w = np.linspace(0, 1, b)[:, None, None]
    erg[SCHNITT - b : SCHNITT] = bild[SCHNITT - b : SCHNITT] * (1 - w) + neu[:b] * w
    return erg


def fuge_finden(bild):
    """Dunkelster zusammenhaengender Weg von oben nach unten im Bereich der Fuge (dynamische Programmierung)."""
    x0, x1 = 530, 680
    hell = bild[:, x0:x1].mean(axis=2)
    kern = np.ones(3) / 3
    hell = np.apply_along_axis(lambda z: np.convolve(z, kern, "same"), 1, hell)
    h, w = hell.shape
    schritt = 5
    kosten = hell[0].copy()
    herkunft = np.zeros((h, w), dtype=np.int16)
    for y in range(1, h):
        best = np.full(w, np.inf)
        arg = np.zeros(w, dtype=np.int16)
        for d in range(-schritt, schritt + 1):
            verschoben = np.full(w, np.inf)
            if d >= 0:
                verschoben[d:] = kosten[: w - d] if d else kosten
            else:
                verschoben[:d] = kosten[-d:]
            verschoben = verschoben + 3 * abs(d)
            besser = verschoben < best
            best[besser] = verschoben[besser]
            arg[besser] = d
        kosten = best + hell[y]
        herkunft[y] = arg
    x = int(np.argmin(kosten))
    weg = np.empty(h)
    for y in range(h - 1, -1, -1):
        weg[y] = x
        x -= herkunft[y, x]
    return weg + x0


def vereinfachen(punkte, eps):
    """Ramer-Douglas-Peucker."""
    if len(punkte) < 3:
        return punkte
    a, b = np.array(punkte[0]), np.array(punkte[-1])
    ab = b - a
    laenge = np.hypot(*ab) or 1
    d = [abs(ab[0] * (a[1] - p[1]) - ab[1] * (a[0] - p[0])) / laenge for p in punkte]
    i = int(np.argmax(d))
    if d[i] <= eps:
        return [punkte[0], punkte[-1]]
    return vereinfachen(punkte[: i + 1], eps)[:-1] + vereinfachen(punkte[i:], eps)


def main():
    zufall = np.random.default_rng(7)
    bild = np.asarray(Image.open(QUELLE).convert("RGB")).astype(float)
    fuge_x = int(round(fuge_finden(bild[SCHNITT - 40 : SCHNITT])[-1]))
    bild = holz_ansetzen(bild, fuge_x, zufall)
    weg = fuge_finden(bild)
    punkte = vereinfachen([(float(weg[y]), float(y)) for y in range(len(weg))], 0.8)
    punkte[0] = (punkte[0][0], 0.0)
    punkte[-1] = (punkte[-1][0], float(HOEHE))
    ZIEL.mkdir(parents=True, exist_ok=True)
    Image.fromarray(bild.astype(np.uint8)).save(ZIEL / "deckel.webp", quality=84, method=6)
    daten = {
        "breite": bild.shape[1],
        "hoehe": bild.shape[0],
        "einlage": EINLAGE,
        "fuge": [[round(x, 1), round(y, 1)] for x, y in punkte],
    }
    (ZIEL / "deckel.json").write_text(json.dumps(daten, separators=(",", ":")) + "\n")
    print(len(punkte), "Fugenpunkte;", (ZIEL / "deckel.webp").stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
