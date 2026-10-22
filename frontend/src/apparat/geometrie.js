// Faecher-Geometrie der Spielplatte (viewBox-Breite 400).
// Oben: Quadrat 400 x 400 mit dem Auge um MITTE. Unten: Boegen um denselben Mittelpunkt.
// Position auf einem Bogen: u = 0 (Ruheposition, ganz links) .. 1 (ganz rechts).
// Alle Boegen decken denselben Winkelbereich ab, damit die Strahlen die Skala bilden.
export const MITTE = { x: 200, y: 200 };
export const AUGE_RADIUS = 194; // Rund oben: fast bis zum Rand (Breite 400)
export const LINSE_RADIUS = 185; // schmaler Messingring (9 Einheiten), grosses Glas
export const RUHE_ANTEIL = 0.16; // u-Bereich der Ruheposition vor der Skala
export const ANZAHL_BOEGEN = 8; // eigener Schieber + 7 Systeme

export function faecherLayout(verfuegbareHoehe) {
  const r0 = 214; // innerster Bogen knapp ausserhalb des Auges
  const abstand = Math.max(
    30,
    Math.min(44, (verfuegbareHoehe - 200 - r0 - 28) / (ANZAHL_BOEGEN - 1)),
  );
  const radien = Array.from(
    { length: ANZAHL_BOEGEN },
    (_, k) => r0 + k * abstand,
  );
  const symbol = Math.min(16, abstand * 0.38);
  const aussen = radien[ANZAHL_BOEGEN - 1];
  // halber Oeffnungswinkel (rad): aeusserstes Symbol mit Abstand zum Bildschirmrand, damit man es greifen kann
  const theta = Math.asin((176 - symbol) / aussen);
  return {
    radien,
    abstand,
    symbol,
    theta,
    schlitz: Math.min(abstand * 0.64, symbol * 1.75), // breite Schlitze: Muster und Goldplaettchen darin
    hoehe: Math.ceil(MITTE.y + aussen + symbol + 14),
  };
}

export function punktU(r, u, theta) {
  const phi = -theta + 2 * theta * u; // 0 = senkrecht nach unten
  return { x: MITTE.x + r * Math.sin(phi), y: MITTE.y + r * Math.cos(phi) };
}

export function polarAusPunkt(x, y, theta) {
  const dx = x - MITTE.x;
  const dy = y - MITTE.y;
  const phi = Math.atan2(dx, dy);
  return { r: Math.hypot(dx, dy), u: (phi + theta) / (2 * theta) };
}

export function uAusWert(wert) {
  return (
    RUHE_ANTEIL +
    ((Math.max(-1, Math.min(1, wert)) + 1) / 2) * (1 - RUHE_ANTEIL)
  );
}

export function wertAusU(u) {
  return ((u - RUHE_ANTEIL) / (1 - RUHE_ANTEIL)) * 2 - 1;
}

export function bogenPfad(r, theta, von = 0, bis = 1) {
  const a = punktU(r, von, theta);
  const b = punktU(r, bis, theta);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 0 0 ${b.x} ${b.y}`;
}

// Platte als Ringausschnitt; winkelRechts erlaubt eine asymmetrische Platte (rechts weiter herum)
export function plattePfad(innen, aussen, winkel, winkelRechts = winkel) {
  const p = (r, phi) => ({
    x: MITTE.x + r * Math.sin(phi),
    y: MITTE.y + r * Math.cos(phi),
  });
  const al = p(aussen, -winkel);
  const ar = p(aussen, winkelRechts);
  const ir = p(innen, winkelRechts);
  const il = p(innen, -winkel);
  const gross = winkel + winkelRechts > Math.PI ? 1 : 0;
  return `M ${al.x} ${al.y} A ${aussen} ${aussen} 0 ${gross} 0 ${ar.x} ${ar.y} L ${ir.x} ${ir.y} A ${innen} ${innen} 0 ${gross} 1 ${il.x} ${il.y} Z`;
}
