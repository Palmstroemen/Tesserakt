import { useEffect, useState } from "react";

// Schaetzt, wie hell es wirklich ist, obwohl die Belichtungsautomatik der Kamera das Bild immer
// mittelhell haelt (auf dem iPhone nicht abschaltbar). Die Automatik verraet sich an zwei Stellen:
//   - Bildrate: Im Dunkeln belichtet sie laenger, es kommen weniger Bilder pro Sekunde.
//   - Rauschen: Im Dunkeln dreht sie die Empfindlichkeit hoch, das Bild wird koernig.
// Gemessen wird an einem kleinen Ausschnitt aus der Bildmitte in Originalaufloesung (Verkleinern wuerde
// das Rauschen wegmitteln). Prototyp: liefert Rohwerte zum Ausprobieren.
const SEITE = 64;

// gestutzter Mittelwert: die groessten 30 % (Kanten, Bewegung) weglassen; feiner als ein Median,
// weil die Differenzen echter Sensoren oft nur 0, 1 oder 2 Graustufen betragen
function gestutzt(werte) {
  const s = [...werte].sort((a, b) => a - b).slice(0, Math.max(1, Math.floor(werte.length * 0.7)));
  return s.reduce((a, b) => a + b, 0) / s.length;
}

export function useLichtmesser(videoRef, aktiv) {
  const [messung, setMessung] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!aktiv || !video) return undefined;
    let beendet = false;

    // Bildrate: echte Kamerabilder zaehlen (requestVideoFrameCallback, Safari ab 15.4, Chrome)
    const zeiten = [];
    let rvfcId = null;
    const bild = (jetzt) => {
      zeiten.push(jetzt);
      while (zeiten.length && jetzt - zeiten[0] > 1000) zeiten.shift();
      if (!beendet) rvfcId = video.requestVideoFrameCallback(bild);
    };
    if (video.requestVideoFrameCallback) rvfcId = video.requestVideoFrameCallback(bild);

    const canvas = document.createElement("canvas");
    canvas.width = SEITE;
    canvas.height = SEITE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let vorher = null;

    const messen = () => {
      if (!video.videoWidth) return;
      const sx = Math.max(0, Math.floor(video.videoWidth / 2 - SEITE / 2));
      const sy = Math.max(0, Math.floor(video.videoHeight / 2 - SEITE / 2));
      ctx.drawImage(video, sx, sy, SEITE, SEITE, 0, 0, SEITE, SEITE);
      const daten = ctx.getImageData(0, 0, SEITE, SEITE).data;
      const grau = new Float32Array(SEITE * SEITE);
      let summe = 0;
      for (let i = 0; i < grau.length; i += 1) {
        grau[i] = 0.299 * daten[i * 4] + 0.587 * daten[i * 4 + 1] + 0.114 * daten[i * 4 + 2];
        summe += grau[i];
      }
      // raeumliches Rauschen: Nachbarschaftsdifferenzen (robust gegen Kanten)
      const raum = [];
      for (let y = 0; y < SEITE - 1; y += 1) {
        for (let x = 0; x < SEITE - 1; x += 1) {
          const i = y * SEITE + x;
          raum.push(Math.abs(grau[i] - grau[i + 1]), Math.abs(grau[i] - grau[i + SEITE]));
        }
      }
      // zeitliches Rauschen: Differenz zum vorigen Bild (robust gegen Bewegung an Kanten)
      let zeit = null;
      if (vorher) {
        const diff = [];
        for (let i = 0; i < grau.length; i += 1) diff.push(Math.abs(grau[i] - vorher[i]));
        zeit = gestutzt(diff);
      }
      vorher = grau;
      setMessung({
        fps: video.requestVideoFrameCallback ? zeiten.length : null,
        rauschen: gestutzt(raum),
        rauschenZeit: zeit,
        hell: summe / grau.length,
      });
    };
    const intervall = setInterval(messen, 250);

    return () => {
      beendet = true;
      clearInterval(intervall);
      if (rvfcId !== null && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(rvfcId);
    };
  }, [videoRef, aktiv]);

  return messung;
}
