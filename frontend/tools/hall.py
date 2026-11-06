#!/usr/bin/env python3
"""Nachhall fuer das Ende des Films: Der Film hoert mitten im letzten Orchesterschlag auf. Dieser Schlag wird mit
einem kuenstlichen Raum gefaltet (tiefe Lagen klingen laenger als hohe, Zufall mit fester Saat), daraus wird alles
genommen, was nach dem Schnitt kommt, und als src/apparat/kaestchen/hall.m4a gespeichert (Abspielen: klang.js).
Aufruf aus frontend/: python3 tools/hall.py [probe.wav], probe.wav = Filmende mit Hall zum Anhoeren."""
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 44100
FILM = "src/apparat/kaestchen/film.mp4"
ZIEL = "src/apparat/kaestchen/hall.m4a"
SCHLAG_AB = 19.5  # s im Film: Beginn des letzten Schlags
UEBERLAPP = 0.12  # s: so frueh vor dem Schnitt beginnt der Hall (klang.js: HALL_VORLAUF)
LAENGE = 8.0  # s


def ton_des_films():
    roh = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", FILM, "-vn", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(roh, dtype="f4").reshape(-1, 2).astype("f8")


def raum(zufall):
    """Stereo-Raumantwort: drei Lagen, jede mit eigener Nachhallzeit (Abfall um 60 dB)"""
    n = int(LAENGE * SR)
    t = np.arange(n) / SR
    lagen = [
        (butter(4, 300, "low", fs=SR, output="sos"), 6.5, 1.0),
        (butter(4, [300, 2000], "band", fs=SR, output="sos"), 4.5, 0.8),
        (butter(4, 2000, "high", fs=SR, output="sos"), 2.2, 0.35),
    ]
    antwort = np.zeros((n, 2))
    for sos, t60, staerke in lagen:
        for k in range(2):
            antwort[:, k] += staerke * sosfilt(sos, zufall.standard_normal(n)) * 10 ** (-3 * t / t60)
    return antwort


def main():
    ton = ton_des_films()
    schnitt = len(ton)
    schlag = ton[int(SCHLAG_AB * SR) :]
    antwort = raum(np.random.default_rng(1652))
    nass = np.stack([fftconvolve(schlag[:, k], antwort[:, k]) for k in range(2)], axis=1)

    start = len(schlag) - int(UEBERLAPP * SR)
    hall = nass[start : start + int(LAENGE * SR)]
    # so laut, wie der Schlag am Schnitt gerade ist
    fenster = int(0.1 * SR)
    hall *= np.sqrt((ton[schnitt - fenster :] ** 2).mean() / (hall[:fenster] ** 2).mean())
    ein = int(UEBERLAPP * SR)
    hall[:ein] *= np.sin(np.linspace(0, np.pi / 2, ein))[:, None] ** 2
    aus = int(1.5 * SR)
    hall[-aus:] *= np.cos(np.linspace(0, np.pi / 2, aus))[:, None] ** 2
    print("Spitze", round(float(np.abs(hall).max()), 3))
    hall = np.clip(hall, -0.98, 0.98)

    with tempfile.TemporaryDirectory() as ordner:
        wav = Path(ordner) / "hall.f32"
        hall.astype("f4").tofile(wav)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", str(wav),
             "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", ZIEL],
            check=True,
        )
    if len(sys.argv) > 1:
        ab = schnitt - int(6 * SR)
        probe = np.zeros((schnitt - ab - ein + len(hall), 2))
        probe[: schnitt - ab] += ton[ab:]
        probe[schnitt - ab - ein :] += hall
        with tempfile.TemporaryDirectory() as ordner:
            roh = Path(ordner) / "probe.f32"
            np.clip(probe, -1, 1).astype("f4").tofile(roh)
            subprocess.run(
                ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", str(roh), sys.argv[1]],
                check=True,
            )
        n = int(0.25 * SR)
        for i in range(schnitt - ab - 4 * n, min(len(probe), schnitt - ab + 12 * n), n):
            s = probe[i : i + n]
            print(round((i - (schnitt - ab)) / SR, 2), "rms", round(float(np.sqrt((s**2).mean())), 4))


if __name__ == "__main__":
    main()
