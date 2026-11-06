import { selfieAnfordern, selfieFreigeben } from "./selfie";
import { AUGE_KAMERA } from "./werkstatt";
// Gesichtserkennung von Google MediaPipe (BlazeFace, kurze Reichweite), laeuft ganz im Geraet; das Bild verlaesst
// es nicht. Laufzeit und Modell kommen mit der App (die Laufzeit aus node_modules, das Paket gibt sie nicht als
// Unterpfad frei).
import ladeJs from "../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.js?url";
import ladeWasm from "../../node_modules/@mediapipe/tasks-vision/wasm/vision_wasm_internal.wasm?url";
import modell from "./gesicht/blaze_face_short_range.tflite?url";

// Augenlage im Bild der Frontkamera fuer die Parallaxe (neigung.js): Mitte zwischen den Augen, -0.5..0.5 um die
// Bildmitte, im ungespiegelten Kamerabild (x nach rechts, y nach unten). zeit: letzte Messung mit Gesicht.
export const blick = { x: 0, y: 0, zeit: 0, messungen: 0, gesichter: 0 };
if (import.meta.env.DEV) window.blick = blick; // Werkstatt: in der Konsole nachsehen

const TAKT_MS = 66; // etwa 15 Messungen je Sekunde; dazwischen glaettet neigung.js

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
            blick.x = (a.x + b.x) / 2 - 0.5;
            blick.y = (a.y + b.y) / 2 - 0.5;
            blick.zeit = performance.now();
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
