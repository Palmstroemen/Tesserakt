import { useEffect, useRef, useState } from "react";
import { selfieAnfordern, selfieFreigeben } from "./selfie";
import { spiegelglasStarten } from "./spiegelglas";

// Das eigene Bild aus der Frontkamera als Reflexion (selfie.js: ein Strom fuer alle)
function useSelfie() {
  const [video, setVideo] = useState(null);
  useEffect(() => {
    let vorbei = false;
    let geholt = false;
    selfieAnfordern()
      .then((v) => {
        geholt = true;
        if (vorbei) selfieFreigeben();
        else setVideo(v);
      })
      .catch(() => {});
    return () => {
      vorbei = true;
      if (geholt) selfieFreigeben();
    };
  }, []);
  return video;
}

// Uhrglas-Spiegelung: das eigene Bild, gespiegelt, gewoelbt (Fischauge per WebGL), hochtransparent und
// kontrastreich ueber die Grafik gelegt (nur aufhellend, wie eine Reflexion). Ohne WebGL zwei ungewoelbte Lagen
// als Rueckfall. glanz: Klasse des Glanzstreifens darueber (auch ohne Kamera), null = keiner.
export function Spiegel({ glanz = "eg-glanz" }) {
  const video = useSelfie();
  const [ohneWebgl, setOhneWebgl] = useState(false);
  const glas = useRef(null);
  const innen = useRef(null);
  const aussen = useRef(null);

  useEffect(() => {
    const strom = video?.srcObject ?? null;
    [innen, aussen].forEach((r) => {
      if (r.current) r.current.srcObject = strom;
    });
    if (!video || ohneWebgl || !glas.current) return undefined;
    let stopp = null;
    try {
      stopp = spiegelglasStarten(glas.current, video);
    } catch {
      stopp = null;
    }
    if (!stopp) setOhneWebgl(true);
    return () => stopp?.();
  }, [video, ohneWebgl]);

  return (
    <>
      {video && !ohneWebgl ? (
        <canvas ref={glas} className="eg-spiegel glas" />
      ) : null}
      {video && ohneWebgl ? (
        <>
          <video
            ref={aussen}
            className="eg-spiegel aussen"
            autoPlay
            muted
            playsInline
          />
          <video
            ref={innen}
            className="eg-spiegel innen"
            autoPlay
            muted
            playsInline
          />
        </>
      ) : null}
      {glanz ? <div className={glanz} /> : null}
    </>
  );
}

// Kleiner Spiegel auf dem Rubin des eigenen Schiebers: das eigene Bild, gespiegelt und stark verkleinert wie auf einer
// gewoelbten Kuppe. Im SVG des Faechers (foreignObject); gezeichnet nur etwa 12-mal je Sekunde, er ist klein.
const RUBIN_TAKT_MS = 80;
export function RubinSpiegel({ r }) {
  const video = useSelfie();
  const leinwand = useRef(null);
  useEffect(() => {
    const c = leinwand.current;
    if (!video || !c) return undefined;
    const ctx = c.getContext("2d");
    let takt = 0;
    const zeichnen = () => {
      if (video.readyState >= 2 && video.videoWidth) {
        const n = c.width;
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const s = Math.min(vw, vh) * 0.9; // fast das ganze Bild: eine Kuppe zeigt viel Umgebung
        ctx.clearRect(0, 0, n, n);
        ctx.save();
        ctx.beginPath();
        ctx.arc(n / 2, n / 2, n / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.translate(n, 0);
        ctx.scale(-1, 1); // wie ein Spiegel
        ctx.drawImage(video, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, n, n);
        ctx.restore();
      }
      takt = setTimeout(zeichnen, RUBIN_TAKT_MS);
    };
    zeichnen();
    return () => clearTimeout(takt);
  }, [video]);
  if (!video) return null;
  return (
    <foreignObject x={-r} y={-r} width={2 * r} height={2 * r}>
      <canvas
        ref={leinwand}
        width="96"
        height="96"
        className="sp-rubin-spiegel"
      />
    </foreignObject>
  );
}
