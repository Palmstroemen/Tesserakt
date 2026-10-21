// Erstes Dia im Auge: zeigt in drei Bildern, was zu tun ist. Gleitet beim Aufziehen hinaus wie jedes Dia.
// viewBox 200 x 200 = Linse (Radius 100); drei Zeilen: Bild links, Text rechts.
const TINTE = "#2b2116";
const LEISE = "#6b5a40";
const ANIMATION = "3s";

// kleiner Bogen (nach unten gewoelbt) mit Mitte x, Scheitel y
function bogen(x, y, r, halb) {
  const cy = y - r;
  const x1 = x - r * Math.sin(halb);
  const y1 = cy + r * Math.cos(halb);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x + r * Math.sin(halb)} ${y1}`;
}

function Zeile({ y, nummer, zeilen, children }) {
  return (
    <g>
      <text x="18" y={y + 4} fontSize="11" fill={LEISE}>
        {nummer}
      </text>
      {children}
      <text x="106" y={y - (zeilen.length - 1) * 6 + 4} fontSize="10.5" fill={TINTE}>
        {zeilen.map((z, i) => (
          <tspan key={z} x="106" dy={i ? 12 : 0}>
            {z}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export default function AnleitungDia() {
  const b1 = bogen(68, 64, 60, 0.42);
  const b2 = bogen(68, 76, 70, 0.4);
  const b3 = bogen(68, 120, 90, 0.33);

  return (
    <svg viewBox="0 0 200 200" className="sp-anleitung" aria-label="Anleitung">
      <text x="100" y="38" textAnchor="middle" fontSize="10" letterSpacing="2.5" fill={LEISE}>
        SO GEHT'S
      </text>

      <Zeile y={64} nummer="1" zeilen={["zwei Horoskope", "aufziehen"]}>
        <path d={b1} fill="none" stroke={TINTE} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
        <path d={b2} fill="none" stroke={TINTE} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
        <circle r="4.5" fill="#7d63e6" stroke="#f0d59c" strokeWidth="0.8">
          <animateMotion dur={ANIMATION} repeatCount="indefinite" path={b1} keyPoints="0;1;1" keyTimes="0;0.3;1" calcMode="linear" />
        </circle>
        <circle r="4.5" fill="#f2c14e" stroke="#f0d59c" strokeWidth="0.8">
          <animateMotion dur={ANIMATION} repeatCount="indefinite" path={b2} keyPoints="0;0;1;1" keyTimes="0;0.3;0.55;1" calcMode="linear" />
        </circle>
      </Zeile>

      <Zeile y={116} nummer="2" zeilen={["deine Antwort", "einstellen"]}>
        <path d={b3} fill="none" stroke={TINTE} strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
        {[0.15, 0.32, 0.5, 0.68, 0.85].map((t) => {
          const a = -0.33 + 0.66 * t;
          const x = 68 + 90 * Math.sin(a);
          const y = 30 + 90 * Math.cos(a);
          return <line key={t} x1={x} y1={y - 4} x2={x} y2={y + 4} stroke={LEISE} strokeWidth="0.8" />;
        })}
        <circle r="5" fill="#e2c27f" stroke="#3a2c1a" strokeWidth="1">
          <animateMotion dur={ANIMATION} repeatCount="indefinite" path={b3} keyPoints="0;0;0.72;0.72" keyTimes="0;0.55;0.75;1" calcMode="linear" />
        </circle>
      </Zeile>

      <Zeile y={160} nummer="3" zeilen={["Hebel ziehen"]}>
        <rect x="65" y="145" width="6" height="30" rx="3" fill={TINTE} opacity="0.85" />
        <circle cx="68" r="5.5" fill="#c9a66b" stroke="#3a2c1a" strokeWidth="1">
          <animate attributeName="cy" dur={ANIMATION} repeatCount="indefinite" values="148;148;172;148" keyTimes="0;0.82;0.9;1" />
        </circle>
      </Zeile>
    </svg>
  );
}
