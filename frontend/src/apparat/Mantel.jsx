import { memo } from "react";
import { MITTE } from "./geometrie";

// Mantel des flachen Zylinders unter Datumsscheibe und Auge: Die beiden sitzen wie die zwei Seiten einer dicken
// Muenze auf einem Puck. Beim Flip dreht er sich um die senkrechte Achse in seiner Mitte; man sieht dann den
// gerändelten Messingmantel als Band zwischen der Seite, die man ansieht, und dem Rand der abgewandten.
// Gezeichnet nur waehrend des Flips. Den Winkel liefert die CSS-Variable --kipp (0 = Seite schaut her,
// 90deg = auf der Kante), --seite sagt, wohin die sichtbare Seite rueckt (+1 rechts, -1 links); siehe apparat.css.
export const HALBDICKE = 25; // wie --halbdicke in apparat.css; 50 Einheiten sind auf dem Handy knapp 1 cm

// Raendelung: Rillen in gleichen Winkelschritten um den Rand, von der Seite gesehen oben und unten gedraengt.
// Jede Rille laeuft parallel zur Achse, von der sichtbaren zur abgewandten Seite: ein waagrechtes Stueck der
// Laenge Dicke * sin(kipp), das am Rand der sichtbaren Seite beginnt, also um ausladung * cos(kipp) nach aussen
// gerueckt (ausladung = halbe Breite des Kreises in dieser Hoehe). Die Verschiebung rechnet das CSS.
function rillen(r) {
  const n = 64;
  return Array.from({ length: n - 1 }, (_, k) => {
    const w = (Math.PI * (k + 1)) / n;
    return {
      y: Math.round((MITTE.y - r * Math.cos(w)) * 10) / 10,
      ausladung: Math.round(r * Math.sin(w) * 10) / 10,
    };
  });
}

const Mantel = memo(function Mantel({ praefix, hoehe, radius, style }) {
  const p = praefix;
  const r = radius;
  const links = MITTE.x - HALBDICKE;
  const breite = 2 * HALBDICKE;
  return (
    <svg
      viewBox={`0 0 400 ${hoehe}`}
      className="sp-svg mantel"
      style={style}
      aria-hidden="true"
    >
      <defs>
        {/* Licht von oben: der Mantel ist oben hell, schaut in der Mitte her und liegt unten im Schatten */}
        <linearGradient
          id={`${p}-mantel`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={MITTE.y - r}
          x2="0"
          y2={MITTE.y + r}
        >
          <stop offset="0" stopColor="#f0d89e" />
          <stop offset="0.2" stopColor="#cfa967" />
          <stop offset="0.5" stopColor="#9a7843" />
          <stop offset="0.8" stopColor="#5a4225" />
          <stop offset="1" stopColor="#24180b" />
        </linearGradient>
      </defs>

      {/* Rand der abgewandten Seite: bis dorthin reicht der Mantel */}
      <g className="mantel-ende">
        <circle
          cx={MITTE.x}
          cy={MITTE.y}
          r={r}
          fill={`url(#${p}-mantel)`}
          stroke="#1c1309"
          strokeOpacity="0.6"
          strokeWidth="1.5"
        />
      </g>

      {/* Band zwischen den beiden Seiten */}
      <g className="mantel-band">
        <rect
          x={links}
          y={MITTE.y - r}
          width={breite}
          height={2 * r}
          fill={`url(#${p}-mantel)`}
        />
      </g>

      {rillen(r).map(({ y, ausladung }) => (
        <g
          key={y}
          className="mantel-rille"
          style={{ "--ausladung": ausladung }}
        >
          <line
            x1={links}
            y1={y}
            x2={links + breite}
            y2={y}
            stroke="#1c1309"
            strokeOpacity="0.55"
            strokeWidth="0.9"
          />
          <line
            x1={links}
            y1={y + 0.9}
            x2={links + breite}
            y2={y + 0.9}
            stroke="#fff0c8"
            strokeOpacity="0.22"
            strokeWidth="0.6"
          />
        </g>
      ))}
    </svg>
  );
});

export default Mantel;
