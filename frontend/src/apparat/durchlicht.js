// Durchlicht im Auge: das Kamerabild nur als Licht und Dunkel. Statt es per CSS stark weichzuzeichnen
// (blur(40px) auf dem Video kostete bei jedem Bild so viel, dass die Schieber ruckelten), wird es auf
// wenige Pixel verkleinert und stufenweise wieder vergroessert; jede Stufe glaettet ein wenig, zusammen
// wirkt es wie ein sehr weicher Weichzeichner. Alles auf winzigen Canvas, also fast kostenlos.
const STUFEN = [36, 6, 12, 24, 48]; // Kantenlaengen: erst verkleinern (mittelt), dann weich vergroessern
const AUSSCHNITT = 0.55; // mittlerer Teil des Kamerabildes, wie frueher (Video 2,2-fach vergroessert)
const BILDABSTAND = 66; // ms; ~15 Bilder pro Sekunde reichen fuer wanderndes Licht

// startet die Darstellung; gibt eine Stopp-Funktion zurueck
export function durchlichtStarten(canvas, video) {
  const ebenen = STUFEN.map((seite, i) => {
    const c =
      i === STUFEN.length - 1 ? canvas : document.createElement("canvas");
    c.width = seite;
    c.height = seite;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    return { c, ctx, seite };
  });

  let laeuft = true;
  let rvfc = null;
  let raf = 0;
  let zuletzt = -Infinity;
  const zeichnen = (jetzt) => {
    if (!laeuft) return;
    if (
      jetzt - zuletzt >= BILDABSTAND &&
      video.readyState >= 2 &&
      video.videoWidth
    ) {
      zuletzt = jetzt;
      // quadratischer Ausschnitt aus der Mitte
      const s = Math.min(video.videoWidth, video.videoHeight) * AUSSCHNITT;
      const sx = (video.videoWidth - s) / 2;
      const sy = (video.videoHeight - s) / 2;
      const [erste, ...rest] = ebenen;
      erste.ctx.drawImage(video, sx, sy, s, s, 0, 0, erste.seite, erste.seite);
      rest.reduce((vorige, e) => {
        e.ctx.drawImage(vorige.c, 0, 0, e.seite, e.seite);
        return e;
      }, erste);
    }
    if (video.requestVideoFrameCallback)
      rvfc = video.requestVideoFrameCallback(zeichnen);
    else raf = requestAnimationFrame(zeichnen);
  };
  zeichnen(performance.now());

  return () => {
    laeuft = false;
    if (rvfc !== null && video.cancelVideoFrameCallback)
      video.cancelVideoFrameCallback(rvfc);
    cancelAnimationFrame(raf);
  };
}
