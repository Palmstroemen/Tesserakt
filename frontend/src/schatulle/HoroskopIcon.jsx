// Icons der sieben Horoskope: runde Plaketten im Stil und in den Farben der Ergebnisgrafiken. Gebraucht auf
// den Schiebern im Faecher und (spaeter) auf dem gefalteten Zettel im Intro, der sie als Legende erklaert.
// Gezeichnet in einem Feld von -1..1 (Radius 1), skaliert auf r.
//   Westlich: Stern im Nachthimmel · Chinesisch: 八 (Bazi = "acht Zeichen") auf rotem Papier ·
//   Numerologie: handgeschriebene 7 auf Karopapier · Kabbalah: kleiner Lebensbaum auf Pergament ·
//   Arabisch: Windrose auf Zellij-Kachel · Hellenistisch: Maeanderhaken, schwarzfigurig auf Ton ·
//   Vedisch: Kolam-Ring aus Reismehlpunkten mit Farbpulver in der Mitte
const GRUND = {
  Westlich: "#2a1450",
  Bazi: "#b2241b",
  Numerologie: "#fbfaf4",
  Kabbalah: "#efdcae",
  Arabisch: "#efe9da",
  Hellenistisch: "#c46a36",
  Vedisch: "#3a2a20",
};

function Bild({ id }) {
  switch (id) {
    case "Westlich":
      return (
        <g>
          <path
            d="M0 -0.62 L0.14 -0.14 L0.62 0 L0.14 0.14 L0 0.62 L-0.14 0.14 L-0.62 0 L-0.14 -0.14 Z"
            fill="#ffd56b"
          />
          <circle cx="0.42" cy="-0.42" r="0.07" fill="#fff6e0" />
          <circle cx="-0.45" cy="0.38" r="0.05" fill="#fff6e0" />
          <circle cx="0.5" cy="0.35" r="0.04" fill="#c9b8ff" />
        </g>
      );
    case "Bazi":
      return (
        <text
          x="0"
          y="0.36"
          fontSize="1.15"
          textAnchor="middle"
          fill="#f3cf6e"
          className="hi-pinsel"
        >
          八
        </text>
      );
    case "Numerologie":
      return (
        <g>
          {[-0.5, 0, 0.5].map((k) => (
            <g key={k} stroke="#9fb6d6" strokeWidth="0.04">
              <line x1={k} y1="-1" x2={k} y2="1" />
              <line x1="-1" y1={k} x2="1" y2={k} />
            </g>
          ))}
          <text
            x="0"
            y="0.42"
            fontSize="1.25"
            textAnchor="middle"
            fill="#1d2a6b"
            className="hi-schueler"
          >
            7
          </text>
        </g>
      );
    case "Kabbalah":
      return (
        <g stroke="#2d1f12" strokeWidth="0.07" fill="#efdcae">
          <line x1="0" y1="-0.55" x2="-0.38" y2="-0.12" />
          <line x1="0" y1="-0.55" x2="0.38" y2="-0.12" />
          <line x1="-0.38" y1="-0.12" x2="0.38" y2="-0.12" />
          <line x1="-0.38" y1="-0.12" x2="0" y2="0.5" />
          <line x1="0.38" y1="-0.12" x2="0" y2="0.5" />
          <line x1="0" y1="-0.55" x2="0" y2="0.5" />
          {[
            [0, -0.55],
            [-0.38, -0.12],
            [0.38, -0.12],
            [0, 0.5],
          ].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="0.15" />
          ))}
        </g>
      );
    case "Arabisch":
      return (
        <g>
          <path
            d="M0 -0.7 L0.16 0 L0 0.7 L-0.16 0 Z M-0.7 0 L0 -0.16 L0.7 0 L0 0.16 Z"
            fill="#1f4fa3"
          />
          <path
            d="M0.4 -0.4 L0.08 0 L-0.4 0.4 L0 0.08 Z M-0.4 -0.4 L0 -0.08 L0.4 0.4 L-0.08 0 Z"
            fill="#2aa69b"
          />
          <circle r="0.12" fill="#d9a93e" />
        </g>
      );
    case "Hellenistisch":
      return (
        <path
          d="M-0.55 0.55 L-0.55 -0.55 L0.55 -0.55 L0.55 0.3 L-0.25 0.3 L-0.25 -0.25 L0.25 -0.25 L0.25 0.05"
          fill="none"
          stroke="#17100c"
          strokeWidth="0.15"
          strokeLinecap="square"
        />
      );
    case "Vedisch":
      return (
        <g>
          {Array.from({ length: 8 }, (_, k) => {
            const w = (k / 8) * Math.PI * 2;
            return (
              <circle
                key={k}
                cx={0.55 * Math.cos(w)}
                cy={0.55 * Math.sin(w)}
                r="0.09"
                fill="#f0eadb"
              />
            );
          })}
          <circle r="0.26" fill="#f28c28" />
          <circle r="0.11" fill="#e2432b" />
        </g>
      );
    default:
      return null;
  }
}

export default function HoroskopIcon({
  id,
  x = 0,
  y = 0,
  r = 10,
  rand = true,
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${r})`}>
      <clipPath id={`hi-rund-${id}`}>
        <circle r="1" />
      </clipPath>
      <circle r="1" fill={GRUND[id] ?? "#888"} />
      <g clipPath={`url(#hi-rund-${id})`}>
        <Bild id={id} />
      </g>
      {rand ? (
        <circle
          r="1"
          fill="none"
          stroke="#f0d59c"
          strokeWidth={1.5 / r}
          className="hi-rand"
        />
      ) : null}
    </g>
  );
}
