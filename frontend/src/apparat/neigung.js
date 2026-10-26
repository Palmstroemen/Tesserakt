// Neigung des Geraets (Lagesensor) fuer die Parallaxe in Zaehlwerk und magischem Auge: Kippt man das Handy,
// sieht man schraeg in die Tiefe, und was am Grund liegt, rueckt zur Seite des Blicks (von links oben gesehen
// nach links oben). Gemessen wird gegen die Haltung, in der man das Handy gerade haelt: sie wird langsam
// nachgefuehrt, haelt man still, kommt alles wieder in die Mitte. Liefert x, y in -1..1 an die Abonnenten,
// einmal je Bild (requestAnimationFrame); die setzen damit direkt Styles, ohne React neu zu zeichnen.
// iOS verlangt eine Freigabe aus einer Beruehrung heraus: neigungErlauben (main.jsx, beim ersten Tippen).

const SPANNE = 15; // Grad Neigung fuer den vollen Ausschlag: dann ist der Grund ganz aus der Linse
const NACHZUG = 0.004; // je Bild: die Grundhaltung folgt in einigen Sekunden
const GLAETTUNG = 0.15; // je Bild: gegen Zittern des Sensors

const hoerer = new Set();
let roh = null;
let basis = null;
const wert = { x: 0, y: 0 };
let bild = 0;

const begrenzt = (v) => Math.max(-1, Math.min(1, v));

function ereignis(e) {
  if (e.beta == null || e.gamma == null) return;
  roh = { b: e.beta, g: e.gamma };
  basis ??= { ...roh };
}

function tick() {
  if (roh) {
    basis.b += (roh.b - basis.b) * NACHZUG;
    basis.g += (roh.g - basis.g) * NACHZUG;
    // gamma > 0: rechte Kante vom Betrachter weg, er sieht von links -> nach links; beta < 0: Oberkante weg,
    // er sieht von oben -> nach oben
    const zielX = begrenzt(-(roh.g - basis.g) / SPANNE);
    const zielY = begrenzt((roh.b - basis.b) / SPANNE);
    wert.x += (zielX - wert.x) * GLAETTUNG;
    wert.y += (zielY - wert.y) * GLAETTUNG;
    hoerer.forEach((f) => f(wert));
  }
  bild = requestAnimationFrame(tick);
}

export function neigungAbonnieren(f) {
  if (!hoerer.size) {
    window.addEventListener("deviceorientation", ereignis);
    bild = requestAnimationFrame(tick);
  }
  hoerer.add(f);
  return () => {
    hoerer.delete(f);
    if (!hoerer.size) {
      window.removeEventListener("deviceorientation", ereignis);
      cancelAnimationFrame(bild);
      roh = null;
      basis = null;
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
