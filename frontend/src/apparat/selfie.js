import { kameraErlaubt } from "./einwilligung";

// Frontkamera (Selfie) fuer den Blick (Parallaxe aus der Augenlage), die Spiegelung im magischen Auge und den
// kleinen Spiegel auf dem Rubin: ein Strom und ein Video fuer alle. Das Video haengt unsichtbar im Dokument,
// sonst haelt der Browser es an. Wer es braucht, fordert es an und gibt es wieder frei; nach dem letzten
// Freigeben laeuft es noch kurz weiter (zwischen zwei Ansichten nicht aus- und wieder einschalten).

const NACHLAUF_MS = 2000;

let warten = null;
// Waehrend der Film laeuft, bleibt die Kamera aus: Sie beim Filmstart einzuschalten, kann auf dem iPhone den Ton des
// Videos nehmen (Audio-Sitzung des Systems), und das Gesicht braucht dort noch niemand.
let halt = Promise.resolve();

// -> Funktion, die wieder freigibt
export function selfieZurueckhalten() {
  let frei;
  halt = new Promise((r) => {
    frei = r;
  });
  return frei;
}
let nutzer = 0;
let stopp = 0;

// Kamera aus (lange auf die Linse gedrueckt, useKameraSchalter in Spiegelung.jsx): spart Strom, die Parallaxe
// kommt dann nur vom Lagesensor, Spiegelungen gibt es keine. Bleibt gespeichert, bis man sie wieder einschaltet.
const AUS_SCHLUESSEL = "tesserakt-kamera-aus";
let aus = (() => {
  try {
    return localStorage.getItem(AUS_SCHLUESSEL) === "1";
  } catch {
    return false;
  }
})();
const schalterHoerer = new Set();

export const kameraAus = () => aus;

export function kameraSchalterAbonnieren(f) {
  schalterHoerer.add(f);
  return () => schalterHoerer.delete(f);
}

function stromStoppen(v) {
  v.srcObject?.getTracks().forEach((t) => t.stop());
  v.remove();
}

export function kameraUmschalten() {
  aus = !aus;
  try {
    if (aus) localStorage.setItem(AUS_SCHLUESSEL, "1");
    else localStorage.removeItem(AUS_SCHLUESSEL);
  } catch {
    // dann gilt es nur bis zum Neuladen
  }
  schalterHoerer.forEach((f) => f(aus));
  // gleich aus, ohne Nachlauf; wer das Video noch haelt, gibt es mit dem Abmelden frei
  if (aus && warten) {
    clearTimeout(stopp);
    warten.then(stromStoppen).catch(() => {});
    warten = null;
    nutzer = 0;
  }
}

// -> Promise<HTMLVideoElement>; nur mit Einwilligung zur Kamera
export function selfieAnfordern() {
  nutzer += 1;
  clearTimeout(stopp);
  if (aus || !kameraErlaubt() || !navigator.mediaDevices?.getUserMedia) {
    nutzer -= 1;
    return Promise.reject(new Error("keine Kamera"));
  }
  warten ??= halt
    .then(() =>
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      }),
    )
    .then((strom) => {
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.autoplay = true;
      v.className = "selfie-quelle";
      v.srcObject = strom;
      document.body.appendChild(v);
      return v
        .play()
        .catch(() => {})
        .then(() => v);
    })
    .catch((err) => {
      warten = null;
      throw err;
    });
  const versprechen = warten;
  return versprechen.catch((err) => {
    nutzer = Math.max(0, nutzer - 1);
    throw err;
  });
}

export function selfieFreigeben() {
  nutzer = Math.max(0, nutzer - 1);
  if (nutzer) return;
  clearTimeout(stopp);
  stopp = setTimeout(() => {
    if (nutzer || !warten) return;
    warten.then(stromStoppen).catch(() => {});
    warten = null;
  }, NACHLAUF_MS);
}
