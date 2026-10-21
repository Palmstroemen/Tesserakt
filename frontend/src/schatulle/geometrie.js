// Halbkreis-Geometrie der Bedienplatte: Wert -1 (links, "trifft nicht zu") .. +1 (rechts, "trifft zu").
export const MITTE = { x: 200, y: 214 };
export const SCHIEBER_RADIUS = 186;
export const BOGEN_RADIEN = [66, 82, 98, 114, 130, 146, 162]; // innen -> aussen, je System

export function winkel(wert) {
  // Grad, mathematisch: 180 = links, 0 = rechts
  return 180 - ((Math.max(-1, Math.min(1, wert)) + 1) / 2) * 180;
}

export function punkt(radius, grad) {
  const rad = (grad * Math.PI) / 180;
  return { x: MITTE.x + radius * Math.cos(rad), y: MITTE.y - radius * Math.sin(rad) };
}

export function bogenPfad(radius, vonGrad = 180, bisGrad = 0) {
  const a = punkt(radius, vonGrad);
  const b = punkt(radius, bisGrad);
  const gross = Math.abs(vonGrad - bisGrad) > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${gross} 1 ${b.x} ${b.y}`;
}

export function wertAusPunkt(x, y) {
  // Winkel des Zeigers aus einer Position auf der Platte -> Wert -1..+1
  let grad = (Math.atan2(MITTE.y - y, x - MITTE.x) * 180) / Math.PI;
  if (grad < 0) grad = x < MITTE.x ? 180 : 0; // unterhalb der Achse: an den naechsten Rand
  grad = Math.max(0, Math.min(180, grad));
  return 1 - (grad / 180) * 2;
}
