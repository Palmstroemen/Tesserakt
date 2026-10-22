// Hellenistisch fuer Paare (Spiel C): derselbe schwarzfigurige Teller, am Rand die zwoelf Zeichen mit ihren
// griechischen Namen (ganze Zeichen; dein Aszendenten-Zeichen unten wie Haus 1, ohne Geburtsort der Widder).
// Mit Kreide eingezeichnet: Sonne, Mond und Aszendent, deine in gelber Kreide, die deines Gegenuebers in Weiss.
// Kreidestriche verbinden die Punkte, die der Paar-Text vergleicht (backend/paar.py): sehen sich die Zeichen,
// ein durchgehender Strich; in Aversion (sie sehen sich nicht) bleibt die Mitte des Strichs leer.
import { MAEANDER, hausWinkel } from "./HellenistischTeller";

const G = 300;
const M = G / 2;
const R_RAND = 150;
const R_GLASUR = 141;
const R_NAME = 126; // griechische Zeichennamen
const R_BAND_AUSSEN = 111;
const R_BAND_INNEN = 96;
const R_GLYPHE = 87; // Tierkreiszeichen als Lesehilfe
const R_A = 74; // deine Kreidezeichen
const R_B = 56; // die deines Gegenuebers

const ZEICHEN = [
  ["ΚΡΙΟΣ", "♈"],
  ["ΤΑΥΡΟΣ", "♉"],
  ["ΔΙΔΥΜΟΙ", "♊"],
  ["ΚΑΡΚΙΝΟΣ", "♋"],
  ["ΛΕΩΝ", "♌"],
  ["ΠΑΡΘΕΝΟΣ", "♍"],
  ["ΖΥΓΟΣ", "♎"],
  ["ΣΚΟΡΠΙΟΣ", "♏"],
  ["ΤΟΞΟΤΗΣ", "♐"],
  ["ΑΙΓΟΚΕΡΩΣ", "♑"],
  ["ΥΔΡΟΧΟΟΣ", "♒"],
  ["ΙΧΘΥΕΣ", "♓"],
];
const T = "︎";
// Kreidezeichen je Punkt und seine Lage im Zeichen (Bogenmass relativ zur Zeichenmitte)
const PUNKTE = {
  sonne: { s: "☉", d: -0.15 },
  mond: { s: "☽", d: 0 },
  aszendent: { s: "ΩΡ", d: 0.15 }, // Horoskopos
};
const KREIDE = { a: "#ffe07a", b: "#f6f1e4" };

export default function HellenistischPaar({ daten }) {
  const a = daten?.punkte?.a;
  const b = daten?.punkte?.b;
  if (!a || !b) return null;
  const basis = a.aszendent != null ? Math.floor(a.aszendent / 30) : 0;
  const winkel = (zeichen) =>
    hausWinkel(((((zeichen - basis) % 12) + 12) % 12) + 1);
  const ort = (laenge, punkt, r) => {
    const w = winkel(Math.floor(laenge / 30)) + PUNKTE[punkt].d;
    return { x: M + r * Math.cos(w), y: M + r * Math.sin(w) };
  };
  const marken = (punkte, wer, r) =>
    Object.keys(PUNKTE)
      .filter((p) => punkte[p] != null)
      .map((p) => {
        const o = ort(punkte[p], p, r);
        return (
          <text
            key={`${wer}-${p}`}
            x={o.x}
            y={o.y}
            dy="0.35em"
            className={p === "aszendent" ? "hp-marke klein" : "hp-marke"}
            fill={KREIDE[wer]}
          >
            {PUNKTE[p].s + (p === "aszendent" ? "" : T)}
          </text>
        );
      });

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="ht hp"
      role="img"
      aria-label="Teller für zwei: Sonne, Mond und Aszendent beider Personen in den zwölf Zeichen"
    >
      <defs>
        <radialGradient id="hp-ton" cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#e39a62" />
          <stop offset="0.6" stopColor="#c46a36" />
          <stop offset="1" stopColor="#8e4320" />
        </radialGradient>
        <radialGradient id="hp-glanz" cx="35%" cy="25%" r="60%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="hp-kreide" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2"
            numOctaves="2"
            seed="9"
            result="r"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="r"
            scale="2"
            xChannelSelector="R"
            yChannelSelector="G"
            result="d"
          />
          <feComposite
            in="d"
            in2="r"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="-0.35"
            k4="0"
          />
        </filter>
      </defs>

      {/* Tonteller, Glasurrand, Maeander */}
      <circle cx={M} cy={M} r={R_RAND} fill="url(#hp-ton)" />
      <circle
        cx={M}
        cy={M}
        r={(R_RAND + R_GLASUR) / 2}
        className="ht-glasur"
        strokeWidth={R_RAND - R_GLASUR}
      />
      <circle cx={M} cy={M} r={R_BAND_AUSSEN + 2} className="ht-linie" />
      <circle cx={M} cy={M} r={R_BAND_INNEN - 2} className="ht-linie" />
      <g className="ht-maeander">
        {MAEANDER.map((p, i) => (
          <polyline key={i} points={p} />
        ))}
      </g>

      {/* die zwoelf Zeichen: griechischer Name am Rand, Tierkreiszeichen innen am Maeander */}
      {ZEICHEN.map(([name, glyphe], z) => {
        const w = winkel(z);
        const drehung = (w * 180) / Math.PI - 90;
        const p = { x: M + R_NAME * Math.cos(w), y: M + R_NAME * Math.sin(w) };
        const q = {
          x: M + R_GLYPHE * Math.cos(w),
          y: M + R_GLYPHE * Math.sin(w),
        };
        return (
          <g key={name}>
            <text
              x={p.x}
              y={p.y}
              dy="0.36em"
              className="hp-name"
              transform={`rotate(${drehung} ${p.x} ${p.y})`}
            >
              {name}
            </text>
            <text
              x={q.x}
              y={q.y}
              dy="0.36em"
              className="hp-glyphe"
              transform={`rotate(${drehung} ${q.x} ${q.y})`}
            >
              {glyphe + T}
            </text>
          </g>
        );
      })}

      {/* Kreide: Verbindungen, dann die Zeichen der beiden Personen */}
      <g filter="url(#hp-kreide)">
        {(daten.bezuege ?? []).map((bz, i) => {
          if (a[bz.a] == null || b[bz.b] == null) return null;
          const p1 = ort(a[bz.a], bz.a, R_A - 8);
          const p2 = ort(b[bz.b], bz.b, R_B + 8);
          if (bz.bezug === "gleich")
            return (
              <ellipse
                key={i}
                cx={(p1.x + p2.x) / 2}
                cy={(p1.y + p2.y) / 2}
                rx="12"
                ry="17"
                transform={`rotate(${(Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI + 90} ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2})`}
                className="hp-strich"
              />
            );
          if (bz.bezug === "aversion") {
            // Aversion: zwei Ansaetze, die sich nicht erreichen
            const t = 0.3;
            return (
              <g key={i} className="hp-strich leise">
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p1.x + (p2.x - p1.x) * t}
                  y2={p1.y + (p2.y - p1.y) * t}
                />
                <line
                  x1={p2.x}
                  y1={p2.y}
                  x2={p2.x + (p1.x - p2.x) * t}
                  y2={p2.y + (p1.y - p2.y) * t}
                />
              </g>
            );
          }
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              className="hp-strich"
            />
          );
        })}
        {marken(b, "b", R_B)}
        {marken(a, "a", R_A)}
      </g>

      <circle
        cx={M}
        cy={M}
        r={R_RAND}
        fill="url(#hp-glanz)"
        pointerEvents="none"
      />
    </svg>
  );
}
