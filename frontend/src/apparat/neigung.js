// Neigung des Geraets (Lagesensor) fuer die Parallaxe in Zaehlwerk und magischem Auge: Kippt man das Handy,
// sieht man schraeg in die Tiefe, und was am Grund liegt, rueckt zur Seite des Blicks (von links oben gesehen
// nach links oben). Gemessen wird gegen die Haltung, in der man das Handy gerade haelt: sie wird langsam
// nachgefuehrt, haelt man still, kommt alles wieder in die Mitte. Liefert x, y in -1..1 an die Abonnenten,
// einmal je Bild (requestAnimationFrame); die setzen damit direkt Styles, ohne React neu zu zeichnen.
// iOS verlangt eine Freigabe aus einer Beruehrung heraus: neigungErlauben (main.jsx, beim ersten Tippen).
//
// Mit der Frontkamera (werkstatt.js: AUGE_KAMERA "selfie") zaehlt zuerst, wo die Augen des Betrachters sind
// (blick.js): Wer den Kopf nach links nimmt, sieht von links in die Tiefe, wie bei echter Parallaxe. Der
// Lagesensor springt nur ein, solange kein Gesicht zu sehen ist. Beim Wechsel uebernimmt der neue Geber das Bild
// dort, wo es gerade steht: Er bekommt eine passende Grundhaltung, sonst spraenge es auf seine alte. Kommt das Gesicht
// nach einer laengeren Pause zurueck, wird es dort eingefangen und rueckt dann zuegig in die Mitte.

import { blick, blickStarten, blickStoppen } from "./blick";
import { AUGE_KAMERA } from "./werkstatt";

const SPANNE = 15; // Grad Neigung fuer den vollen Ausschlag: dann ist der Grund ganz aus der Linse
const NACHZUG = 0.004; // je Bild: die Grundhaltung folgt in einigen Sekunden
const GLAETTUNG = 0.15; // je Bild: gegen Zittern des Sensors
// Augenlage: so weit (Anteil der Bildbreite) muss der Kopf aus der Grundhaltung, fuer den vollen Ausschlag;
// die Grundhaltung folgt langsamer als beim Sensor, sonst verliert sich der Blick um die Ecke
const SPANNE_BLICK = 0.2;
const NACHZUG_BLICK = 0.0015;
const BLICK_FRISCH_MS = 500; // aelter: kein Gesicht mehr im Bild
const BLICK_PAUSE_MS = 2000; // kuerzere Aussetzer: Grundhaltung behalten, der Kopf ist noch etwa dort, wo er war
const FANG_MS = 1500; // so lange nach dem Einfangen ...
const NACHZUG_FANG = 0.03; // ... folgt die Grundhaltung zuegig, was der Sensor verschoben hat, verschwindet bald
const FANG_AB = 0.05; // Ausschlag, ab dem sich das lohnt

const hoerer = new Set();
let roh = null;
let basis = null;
let blickBasis = null;
let imBlick = false; // das Bild folgt gerade den Augen
let wegSeit = 0;
let fangBis = 0;
const wert = { x: 0, y: 0 };
let bild = 0;

const begrenzt = (v) => Math.max(-1, Math.min(1, v));

function ereignis(e) {
  if (e.beta == null || e.gamma == null) return;
  roh = { b: e.beta, g: e.gamma };
  basis ??= { ...roh };
}

function tick() {
  const jetzt = performance.now();
  const frisch = jetzt - blick.zeit < BLICK_FRISCH_MS;
  if (frisch) {
    if (!imBlick) {
      imBlick = true;
      if (!blickBasis || jetzt - wegSeit > BLICK_PAUSE_MS) {
        // einfangen: Grundhaltung so, dass das Ziel genau dort liegt, wo das Bild steht
        blickBasis = {
          x: blick.x + wert.x * SPANNE_BLICK,
          y: blick.y - wert.y * SPANNE_BLICK,
        };
        // steht es schon fast mittig, gibt es nichts zu vergessen: der Kopf soll gleich voll wirken
        if (Math.hypot(wert.x, wert.y) > FANG_AB) fangBis = jetzt + FANG_MS;
      }
    }
    const nachzug = jetzt < fangBis ? NACHZUG_FANG : NACHZUG_BLICK;
    blickBasis.x += (blick.x - blickBasis.x) * nachzug;
    blickBasis.y += (blick.y - blickBasis.y) * nachzug;
    // ungespiegeltes Kamerabild: der Kopf des Betrachters links von ihm erscheint rechts (x > 0), er sieht von
    // links -> nach links; Kopf hoeher erscheint oben (y < 0), er sieht von oben -> nach oben
    const zielX = begrenzt(-(blick.x - blickBasis.x) / SPANNE_BLICK);
    const zielY = begrenzt((blick.y - blickBasis.y) / SPANNE_BLICK);
    wert.x += (zielX - wert.x) * GLAETTUNG;
    wert.y += (zielY - wert.y) * GLAETTUNG;
    hoerer.forEach((f) => f(wert));
  } else if (roh) {
    if (imBlick) {
      imBlick = false;
      wegSeit = jetzt;
      // auch der Sensor uebernimmt das Bild, wo es steht
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
    hoerer.forEach((f) => f(wert));
  } else if (imBlick) {
    imBlick = false;
    wegSeit = jetzt;
  }
  bild = requestAnimationFrame(tick);
}

export function neigungAbonnieren(f) {
  if (!hoerer.size) {
    window.addEventListener("deviceorientation", ereignis);
    if (AUGE_KAMERA === "selfie") blickStarten();
    bild = requestAnimationFrame(tick);
  }
  hoerer.add(f);
  return () => {
    hoerer.delete(f);
    if (!hoerer.size) {
      window.removeEventListener("deviceorientation", ereignis);
      blickStoppen();
      cancelAnimationFrame(bild);
      roh = null;
      basis = null;
      blickBasis = null;
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
