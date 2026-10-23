import { MITTE, WALZENPLATTE, plattePfad } from "./geometrie";

// Messing der Drehscheibe, konzentrisch um ihren Mittelpunkt (hell am Auge, dunkler nach aussen): Dreht
// sich die Scheibe, bleibt das Licht stehen, und Faecher- und Walzenplatte sehen an jeder Stelle gleich aus.
export function PlattenVerlauf({ id, aussen }) {
  return (
    <radialGradient
      id={id}
      cx={MITTE.x}
      cy={MITTE.y}
      r={aussen}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0.3" stopColor="#f0d394" />
      <stop offset="0.5" stopColor="#c9a462" />
      <stop offset="0.8" stopColor="#a5824a" />
      <stop offset="1" stopColor="#7d6035" />
    </radialGradient>
  );
}

// Knopf C der Datumsseite liegt rechts unten in der Ecke unter der Walzenplatte (Datumsrad.jsx: KNOEPFE); die
// Platte laesst ihn mit einer runden Ausnehmung frei, bis sie beim Drehen darueberfaehrt. Im Faecher sitzt
// die Ausnehmung dann rechts oben, um den Druckknopf.
export const KNOPF_C = { x: 366, y: 366 };
const KERBE = {
  r: Math.hypot(KNOPF_C.x - MITTE.x, KNOPF_C.y - MITTE.y),
  radius: 32,
};

// Walzenplatte (Ortseingabe), unten um 6 Uhr; gleiche Radien wie die Faecherplatte
export function Walzenplatte({ innen, aussen, fuellung, ...rest }) {
  return (
    <path
      d={plattePfad(innen, aussen, WALZENPLATTE, WALZENPLATTE, KERBE)}
      fill={fuellung}
      stroke="#2b2014"
      strokeWidth="2"
      {...rest}
    />
  );
}
