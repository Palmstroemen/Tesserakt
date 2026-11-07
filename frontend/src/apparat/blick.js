import { selfieAnfordern, selfieFreigeben } from "./selfie";
import { AUGE_KAMERA } from "./werkstatt";
// Gesichtserkennung von Google MediaPipe (BlazeFace, kurze Reichweite), laeuft ganz im Geraet; das Bild verlaesst
// es nicht. Laufzeit und Modell kommen mit der App (die Laufzeit aus node_modules, das Paket gibt sie nicht als
// Unterpfad frei).
import ladeJs from "../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js?url";
import ladeWasm from "../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm?url";
import modell from "./gesicht/blaze_face_short_range.tflite?url";

// Wo die Augen des Betrachters sind, fuer die Parallaxe (neigung.js), gesehen von der Frontkamera im
// ungespiegelten Bild (x nach rechts, y nach unten): Richtung der Mitte zwischen den Augen als Tangens gegen die
// Blickachse der Kamera (tx, ty) und Entfernung in cm (d, aus dem Augenabstand). Querab ergibt tx * d, das haengt
// vom Bildwinkel der Kamera nicht ab (er kuerzt sich heraus); nur d und damit der Ausschlag. zeit: letzte Messung
// mit Gesicht.
export const blick = {
  tx: 0,
  ty: 0,
  d: 35,
  zeit: 0,
  messungen: 0,
  gesichter: 0,
};
if (import.meta.env.DEV) window.blick = blick; // Werkstatt: in der Konsole nachsehen

const TAKT_MS = 66; // etwa 15 Messungen je Sekunde; dazwischen glaettet neigung.js
const BILDWINKEL_DIAGONALE = 78; // Grad, typisch fuer Frontkameras von Handys (der Browser verraet ihn nicht)
const AUGENABSTAND_CM = 6.3;

let laeuft = false;
let lauf = 0; // Nummer des laufenden Starts: ein frueherer, noch wartender Start gibt dann auf
let erkenner = null; // Promise: einmal angelegt, auch wenn kurz hintereinander gestartet wird
let video = null;
let takt = 0;

// Laufzeit (fast 10 MB) und Modell holen. Schlaegt es fehl, versucht es der naechste Start noch einmal.
function erkennerHolen() {
  erkenner ??= import("@mediapipe/tasks-vision")
    .then(({ FaceDetector }) =>
      FaceDetector.createFromOptions(
        { wasmLoaderPath: ladeJs, wasmBinaryPath: ladeWasm },
        {
          baseOptions: { modelAssetPath: modell },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        },
      ),
    )
    .catch((err) => {
      erkenner = null;
      throw err;
    });
  return erkenner;
}

// Gleich nach der Kamerafreigabe im Vorblatt (und nur dann): bis zur Datumsscheibe ist die Erkennung so meist
// schon da, und das Einrichten stoert keine laufende Animation.
export function blickVorbereiten() {
  if (AUGE_KAMERA === "selfie") erkennerHolen().catch(() => {});
}

export async function blickStarten() {
  if (laeuft) return;
  laeuft = true;
  const meiner = ++lauf;
  const vorbei = () => meiner !== lauf;
  try {
    const v = await selfieAnfordern();
    if (vorbei()) {
      selfieFreigeben();
      return;
    }
    video = v;
    const erkennung = await erkennerHolen();
    if (vorbei()) return;
    const messen = () => {
      if (vorbei()) return;
      if (video.readyState >= 2 && video.videoWidth) {
        try {
          const g = erkennung.detectForVideo(video, performance.now())
            .detections?.[0];
          blick.messungen += 1;
          if (g) blick.gesichter += 1;
          // Punkte 0 und 1: die beiden Augen
          const [a, b] = g?.keypoints ?? [];
          if (a && b) {
            const w = video.videoWidth;
            const h = video.videoHeight;
            // Lochkamera: Brennweite in Bildpunkten
            const f =
              Math.hypot(w, h) /
              2 /
              Math.tan(((BILDWINKEL_DIAGONALE / 2) * Math.PI) / 180);
            const abstand = Math.hypot((a.x - b.x) * w, (a.y - b.y) * h);
            if (abstand > 1) {
              blick.tx = (((a.x + b.x) / 2 - 0.5) * w) / f;
              blick.ty = (((a.y + b.y) / 2 - 0.5) * h) / f;
              blick.d = (AUGENABSTAND_CM * f) / abstand;
              blick.zeit = performance.now();
            }
          }
        } catch {
          // ein Bild ohne Ergebnis; das naechste versucht es wieder
        }
      }
      takt = setTimeout(messen, TAKT_MS);
    };
    messen();
  } catch {
    // ohne Kamera oder Erkennung: neigung.js nimmt den Lagesensor
    if (!vorbei()) blickStoppen();
  }
}

export function blickStoppen() {
  laeuft = false;
  lauf += 1;
  clearTimeout(takt);
  if (video) {
    video = null;
    selfieFreigeben();
  }
}
