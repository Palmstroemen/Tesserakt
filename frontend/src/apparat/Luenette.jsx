// Praegung der Luenette (Messingring um das Glas des magischen Auges): erhabener Ring mit Fase. Licht von
// links oben: aussen eine Lichtkante oben links und Schatten unten rechts, innen zum Glas hin umgekehrt
// (dort faellt der Ring nach innen ab); in der Mitte ein feiner Grat. Dazu wirft der Ring einen Schatten.
// Gebraucht in der Fragerunde (Spielplatte) und im Ergebnis (Ergebnisplatte); praefix trennt die ids.
import { AUGE_RADIUS, LINSE_RADIUS, MITTE } from "./geometrie";

export function LuenetteDefs({ praefix }) {
  return (
    <>
      <linearGradient
        id={`${praefix}-fase-aussen`}
        x1="0.15"
        y1="0.1"
        x2="0.85"
        y2="0.9"
      >
        <stop offset="0" stopColor="#fff6dc" stopOpacity="0.9" />
        <stop offset="0.45" stopColor="#fff6dc" stopOpacity="0" />
        <stop offset="0.55" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#1a1006" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient
        id={`${praefix}-fase-innen`}
        x1="0.15"
        y1="0.1"
        x2="0.85"
        y2="0.9"
      >
        <stop offset="0" stopColor="#1a1006" stopOpacity="0.75" />
        <stop offset="0.45" stopColor="#000" stopOpacity="0" />
        <stop offset="0.55" stopColor="#fff6dc" stopOpacity="0" />
        <stop offset="1" stopColor="#fff6dc" stopOpacity="0.75" />
      </linearGradient>
      <filter
        id={`${praefix}-luenette-schatten`}
        x="-10%"
        y="-10%"
        width="120%"
        height="125%"
      >
        <feDropShadow
          dx="0"
          dy="3"
          stdDeviation="3.5"
          floodColor="#1a1006"
          floodOpacity="0.55"
        />
      </filter>
    </>
  );
}

// ueber Ring und Glas zeichnen
export default function LuenettePraegung({ praefix }) {
  const breite = AUGE_RADIUS - LINSE_RADIUS;
  const mitte = (AUGE_RADIUS + LINSE_RADIUS) / 2;
  return (
    <g pointerEvents="none">
      {/* aeussere Fase */}
      <circle
        cx={MITTE.x}
        cy={MITTE.y}
        r={AUGE_RADIUS - breite * 0.22}
        fill="none"
        stroke={`url(#${praefix}-fase-aussen)`}
        strokeWidth={breite * 0.44}
      />
      {/* innere Fase zum Glas hin */}
      <circle
        cx={MITTE.x}
        cy={MITTE.y}
        r={LINSE_RADIUS + breite * 0.22}
        fill="none"
        stroke={`url(#${praefix}-fase-innen)`}
        strokeWidth={breite * 0.44}
      />
      {/* Grat in der Mitte */}
      <circle
        cx={MITTE.x}
        cy={MITTE.y}
        r={mitte}
        fill="none"
        stroke="#fff6dc"
        strokeOpacity="0.35"
        strokeWidth="0.6"
      />
      {/* Schatten des Rings auf dem Rand des Glases */}
      <circle
        cx={MITTE.x}
        cy={MITTE.y}
        r={LINSE_RADIUS - 1.6}
        fill="none"
        stroke="#000"
        strokeOpacity="0.25"
        strokeWidth="2.4"
      />
    </g>
  );
}
