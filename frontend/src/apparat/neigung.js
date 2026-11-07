// Neigung des Geraets (Lagesensor) fuer die Parallaxe in Zaehlwerk und magischem Auge: Kippt man das Handy,
// sieht man schraeg in die Tiefe, und was am Grund liegt, rueckt zur Seite des Blicks (von links oben gesehen
// nach links oben). Gemessen wird gegen die Haltung, in der man das Handy gerade haelt: sie wird langsam
// nachgefuehrt, haelt man still, kommt alles wieder in die Mitte. Liefert x, y in -1..1 an die Abonnenten,
// einmal je Bild (requestAnimationFrame); die setzen damit direkt Styles, ohne React neu zu zeichnen.
// iOS verlangt eine Freigabe aus einer Beruehrung heraus: neigungErlauben (main.jsx, beim ersten Tippen).
//
// Mit der Frontkamera (werkstatt.js: AUGE_KAMERA "selfie") zaehlt zuerst, wo die Augen des Betrachters sind
// (blick.js), und zwar wie bei echter Parallaxe: Schaut man senkrecht auf die Linse, liegt das Dia mittig; wer den
// Kopf nach links nimmt, sieht von links in die Tiefe. Die Kamera sitzt ueber dem Bildschirm, das wird
// herausgerechnet. Der Lagesensor springt nur ein, solange kein Gesicht zu sehen ist; er uebernimmt das Bild dort,
// wo es gerade steht. Kommt das Gesicht zurueck, gleitet das Bild in einem Moment dorthin, wo die Augen es sehen.

import { blick, blickStarten, blickStoppen } from "./blick";
import { AUGE_KAMERA } from "./werkstatt";

const SPANNE = 15; // Grad Neigung fuer den vollen Ausschlag: dann ist der Grund ganz aus der Linse
const NACHZUG = 0.004; // je Bild: die Grundhaltung folgt in einigen Sekunden
const GLAETTUNG = 0.15; // je Bild: gegen Zittern des Sensors
// Augen: so schraeg (Tangens, etwa 17 Grad) blickt man fuer den vollen Ausschlag in die Linse
const SPANNE_BLICK = 0.3;
const CM_JE_PX = 0.0165; // CSS-Pixel auf Handys (iPhone 390 px auf 6,4 cm, Android aehnlich)
const KAMERA_UEBER_FENSTER_CM = 0.5; // die Frontkamera sitzt mittig knapp ueber dem oberen Rand der Seite
const BLICK_FRISCH_MS = 500; // aelter: kein Gesicht mehr im Bild
const FANG_MS = 600; // so lange nach der Rueckkehr der Augen ...
const GLAETTUNG_FANG = 0.06; // ... gleitet das Bild ruhiger dorthin, wo die Augen es sehen
const BEZUG_MS = 500; // so oft wird nachgemessen, wo die Linse auf dem Bildschirm liegt

const hoerer = new Map(); // Abonnent -> Bezugspunkt (Funktion, liefert die Linsenmitte in CSS-Pixeln)
let roh = null;
let basis = null;
let imBlick = false; // das Bild folgt gerade den Augen
let fangBis = 0;
let bezug = null;
let bezugZeit = -Infinity;
const wert = { x: 0, y: 0 };
let bild = 0;

const begrenzt = (v) => Math.max(-1, Math.min(1, v));

function ereignis(e) {
  if (e.beta == null || e.gamma == null) return;
  roh = { b: e.beta, g: e.gamma };
  basis ??= { ...roh };
}

// Mitte dessen, wohin man schaut (Linse), in CSS-Pixeln des Fensters; ohne Angabe die Mitte des Fensters
function bezugMessen(jetzt) {
  if (jetzt - bezugZeit < BEZUG_MS && bezug) return bezug;
  bezugZeit = jetzt;
  let punkt = null;
  for (const f of hoerer.values()) punkt ??= f?.() ?? null;
  bezug = punkt ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  return bezug;
}

function tick() {
  const jetzt = performance.now();
  const frisch = jetzt - blick.zeit < BLICK_FRISCH_MS;
  if (frisch) {
    if (!imBlick) {
      imBlick = true;
      fangBis = jetzt + FANG_MS;
    }
    // Kopf gegen die Kamera in cm, auf den Bildschirm bezogen (x nach rechts, y nach unten, wie man ihn sieht):
    // im ungespiegelten Kamerabild erscheint ein Kopf links vom Bildschirm rechts
    const d = Math.max(15, Math.min(80, blick.d));
    const kopfX = -blick.tx * d;
    const kopfY = blick.ty * d;
    // Linse gegen die Kamera
    const p = bezugMessen(jetzt);
    const linseX = (p.x - window.innerWidth / 2) * CM_JE_PX;
    const linseY = p.y * CM_JE_PX + KAMERA_UEBER_FENSTER_CM;
    // von links gesehen -> nach links; von oben gesehen -> nach oben
    const zielX = begrenzt((kopfX - linseX) / d / SPANNE_BLICK);
    const zielY = begrenzt((kopfY - linseY) / d / SPANNE_BLICK);
    const glaettung = jetzt < fangBis ? GLAETTUNG_FANG : GLAETTUNG;
    wert.x += (zielX - wert.x) * glaettung;
    wert.y += (zielY - wert.y) * glaettung;
    hoerer.forEach((_, f) => f(wert));
  } else if (roh) {
    if (imBlick) {
      imBlick = false;
      // der Sensor uebernimmt das Bild, wo es steht
      basis = {
        b: roh.b - wert.y * SPANNE,
        g: roh.g + wert.x * SPANNE,
      };
    }
    basis.b += (roh.b - basis.b) * NACHZUG;
    basis.g += (roh.g - basis.g) * NACHZUG;
    // gamma > 0: rechte Kante vom Betrachter weg, er sieht von links -> nach links; beta < 0: Oberkante weg,
    // er sieht von oben -> nach oben
    const zielX = begrenzt(-(roh.g - basis.g) / SPANNE);
    const zielY = begrenzt((roh.b - basis.b) / SPANNE);
    wert.x += (zielX - wert.x) * GLAETTUNG;
    wert.y += (zielY - wert.y) * GLAETTUNG;
    hoerer.forEach((_, f) => f(wert));
  } else if (imBlick) {
    imBlick = false;
  }
  bild = requestAnimationFrame(tick);
}

// f bekommt je Bild { x, y }; bezugspunkt (wahlweise): () => { x, y } in CSS-Pixeln, wohin man schaut
export function neigungAbonnieren(f, bezugspunkt = null) {
  if (!hoerer.size) {
    window.addEventListener("deviceorientation", ereignis);
    if (AUGE_KAMERA === "selfie") blickStarten();
    bild = requestAnimationFrame(tick);
  }
  hoerer.set(f, bezugspunkt);
  bezugZeit = -Infinity;
  return () => {
    hoerer.delete(f);
    bezugZeit = -Infinity;
    if (!hoerer.size) {
      window.removeEventListener("deviceorientation", ereignis);
      blickStoppen();
      cancelAnimationFrame(bild);
      roh = null;
      basis = null;
      imBlick = false;
      fangBis = 0;
    }
  };
}

// iOS: Freigabe des Lagesensors, nur aus einer Beruehrung heraus moeglich; anderswo nicht noetig
let gefragt = false;
export function neigungErlauben() {
  const D = window.DeviceOrientationEvent;
  if (gefragt || typeof D?.requestPermission !== "function") return;
  gefragt = true;
  D.requestPermission().catch(() => {});
}
