// Bazi fuer Paare (Spiel C): zwei rote Bazi-Karten leicht aufgefaechert auf einem Lacktablett, deine mit
// Goldschrift (rechts, gelesen wird von rechts), die deines Gegenuebers mit Silberschrift. Ein roter Faden
// verbindet die Zweige der beiden Tagessaeulen (Ehepalast), angelehnt an das Bild vom roten Schicksalsfaden.
// Wie der Faden liegt, sagt die Beziehung der beiden Zweige (backend/paar.py):
//   he (Sechser-Kombination) gespannt mit Knoten, sanhe (Dreieck) gespannt, chong (Zusammenstoss) gerissen,
//   hai (Schaden) verheddert, gleich doppelt geschlungen, neutral locker durchhaengend.
import { STAMM, ZWEIG } from "./BaziKarte";
import { t } from "../../sprache";

const G = 300;
const M = G / 2;
const KARTE = { b: 112, h: 164 };
// Karten: du rechts, dein Gegenueber links; Drehung in Grad
const KARTEN = {
  a: { x: 206, y: 148, w: 7, tinte: "url(#bp-gold)", name: t("diagramme.du") },
  b: {
    x: 94,
    y: 152,
    w: -7,
    tinte: "url(#bp-silber)",
    name: t("diagramme.gegenueber"),
  },
};
// Saeulen auf der Karte von rechts nach links (lokale Koordinaten, Kartenmitte = 0)
const SAEULEN = [
  { id: "year", kopf: "年", x: 39 },
  { id: "month", kopf: "月", x: 13 },
  { id: "day", kopf: "日", x: -13 },
  { id: "hour", kopf: "时", x: -39 },
];
const Y_NAME = -66;
const Y_KOPF = -48;
const Y_STAMM = -14;
const Y_ZWEIG = 28;

// lokaler Kartenpunkt -> Tablett
function aufTablett(k, x, y) {
  const w = (k.w * Math.PI) / 180;
  return [
    k.x + x * Math.cos(w) - y * Math.sin(w),
    k.y + x * Math.sin(w) + y * Math.cos(w),
  ];
}

// Mittelstueck des Fadens zwischen den beiden Schlaufen, je nach Beziehung
function fadenMitte(art, [x1, y1], [x2, y2]) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  switch (art) {
    case "he":
    case "sanhe":
      return [`M ${x1} ${y1} Q ${mx} ${my + 16} ${x2} ${y2}`];
    case "chong": {
      // gerissen: zwei Enden haengen mit Luecke in der Mitte herab
      return [
        `M ${x1} ${y1} Q ${mx - 26} ${my + 8} ${mx - 15} ${my + 30}`,
        `M ${x2} ${y2} Q ${mx + 26} ${my + 8} ${mx + 15} ${my + 31}`,
      ];
    }
    case "hai":
      // verheddert: kleine Schlingen in der Mitte
      return [
        `M ${x1} ${y1} C ${mx - 30} ${my + 30}, ${mx - 4} ${my + 2}, ${mx - 8} ${my + 18}` +
          ` C ${mx - 12} ${my + 34}, ${mx + 14} ${my + 30}, ${mx + 4} ${my + 16}` +
          ` C ${mx - 4} ${my + 4}, ${mx + 24} ${my + 8}, ${mx + 10} ${my + 26}` +
          ` C ${mx + 4} ${my + 34}, ${mx + 30} ${my + 30}, ${x2} ${y2}`,
      ];
    case "gleich":
      // doppelt geschlungen: zwei Fadenlaeufe, die sich in der Mitte umeinander legen
      return [
        `M ${x1} ${y1} C ${mx - 20} ${my + 34}, ${mx + 20} ${my - 2}, ${x2} ${y2}`,
        `M ${x1} ${y1} C ${mx - 20} ${my - 2}, ${mx + 20} ${my + 34}, ${x2} ${y2}`,
      ];
    default:
      // neutral: locker durchhaengend
      return [`M ${x1} ${y1} Q ${mx} ${my + 92} ${x2} ${y2}`];
  }
}

// ausgefranste Enden eines gerissenen Fadens
function fransen(x, y, richtung) {
  return [-1, -0.3, 0.4, 1].map((d, i) => (
    <path
      key={i}
      d={`M ${x} ${y} l ${richtung * d * 3} ${5 + (i % 2) * 2}`}
      className="bp-franse"
    />
  ));
}

function Karte({ wer, saeulen }) {
  const k = KARTEN[wer];
  return (
    <g transform={`translate(${k.x} ${k.y}) rotate(${k.w})`}>
      <rect
        x={-KARTE.b / 2}
        y={-KARTE.h / 2}
        width={KARTE.b}
        height={KARTE.h}
        rx="3"
        fill="url(#bp-papier)"
        filter="url(#bp-karte)"
      />
      <rect
        x={-KARTE.b / 2 + 6}
        y={-KARTE.h / 2 + 6}
        width={KARTE.b - 12}
        height={KARTE.h - 12}
        rx="2"
        className="bp-rahmen"
        stroke={k.tinte}
      />
      <g className="bp-schrift" fill={k.tinte}>
        {SAEULEN.map((s) => {
          const p = saeulen?.[s.id];
          return (
            <g key={s.id} opacity={p?.estimated ? 0.45 : 1}>
              <text x={s.x} y={Y_KOPF} className="bp-kopf">
                {s.kopf}
              </text>
              <text x={s.x} y={Y_STAMM} dy="0.36em" className="bp-zeichen">
                {STAMM[p?.stem] ?? "？"}
              </text>
              <text x={s.x} y={Y_ZWEIG} dy="0.36em" className="bp-zeichen">
                {ZWEIG[p?.branch] ?? "？"}
              </text>
            </g>
          );
        })}
        <text x="0" y={Y_NAME} className="bp-name">
          {k.name}
        </text>
      </g>
    </g>
  );
}

export default function BaziPaar({ daten }) {
  if (!daten?.saeulen?.a || !daten?.saeulen?.b) return null;
  const art = daten.ehepalast ?? "neutral";

  // Schlaufen um die beiden Tageszweige, der Faden laeuft unter den Zeichen weiter
  const tagA = aufTablett(KARTEN.a, -13, Y_ZWEIG);
  const tagB = aufTablett(KARTEN.b, -13, Y_ZWEIG);
  const abA = aufTablett(KARTEN.a, -13, Y_ZWEIG + 21);
  const abB = aufTablett(KARTEN.b, -13, Y_ZWEIG + 21);
  const schlaufe = ([x, y], [ux, uy]) =>
    `M ${ux} ${uy} C ${x - 26} ${y + 22}, ${x - 22} ${y - 26}, ${x} ${y - 21}` +
    ` C ${x + 22} ${y - 26}, ${x + 26} ${y + 22}, ${ux} ${uy}`;
  const wege = [
    schlaufe(tagA, abA),
    schlaufe(tagB, abB),
    ...fadenMitte(art, abB, abA),
  ];
  const mx = (abA[0] + abB[0]) / 2;
  const my = (abA[1] + abB[1]) / 2;

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="bp"
      role="img"
      aria-label={t("diagramme.bazi.paar")}
    >
      <defs>
        <radialGradient id="bp-lack" cx="40%" cy="32%" r="75%">
          <stop offset="0" stopColor="#3a1a12" />
          <stop offset="0.6" stopColor="#1c0b07" />
          <stop offset="1" stopColor="#0c0403" />
        </radialGradient>
        <radialGradient id="bp-papier" cx="45%" cy="35%" r="80%">
          <stop offset="0" stopColor="#d23a2a" />
          <stop offset="0.7" stopColor="#b2241b" />
          <stop offset="1" stopColor="#8a1912" />
        </radialGradient>
        <linearGradient id="bp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7a1" />
          <stop offset="0.45" stopColor="#e2b551" />
          <stop offset="1" stopColor="#a8761f" />
        </linearGradient>
        <linearGradient id="bp-silber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbfcfd" />
          <stop offset="0.5" stopColor="#c9cfd6" />
          <stop offset="1" stopColor="#848c96" />
        </linearGradient>
        <filter id="bp-karte" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow
            dx="2"
            dy="3"
            stdDeviation="3"
            floodColor="#000"
            floodOpacity="0.6"
          />
        </filter>
        <filter id="bp-faden" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow
            dx="0.8"
            dy="1.4"
            stdDeviation="0.9"
            floodColor="#1a0302"
            floodOpacity="0.7"
          />
        </filter>
      </defs>

      {/* Lacktablett mit Glanz */}
      <circle cx={M} cy={M} r={G / 2} fill="url(#bp-lack)" />
      <ellipse
        cx={M - 40}
        cy={M - 70}
        rx="80"
        ry="30"
        className="bp-glanz"
        transform={`rotate(-20 ${M - 40} ${M - 70})`}
      />

      <Karte wer="b" saeulen={daten.saeulen.b} />
      <Karte wer="a" saeulen={daten.saeulen.a} />

      {/* roter Faden: dunkler Grund, rote Seide, feiner Glanz */}
      <g filter="url(#bp-faden)" className="bp-faden">
        {wege.map((d, i) => (
          <g key={i}>
            <path d={d} className="bp-faden-grund" />
            <path d={d} className="bp-faden-seide" />
            <path d={d} className="bp-faden-glanz" />
          </g>
        ))}
        {art === "he" ? (
          // Knoten in der Mitte
          <g transform={`translate(${mx} ${my + 8}) scale(1.5)`}>
            <path
              d="M -5 -1 C -5 -7, 5 -7, 5 -1 C 5 5, -5 5, -5 -1 Z"
              className="bp-faden-grund"
            />
            <path
              d="M -5 -1 C -5 -7, 5 -7, 5 -1 C 5 5, -5 5, -5 -1 Z"
              className="bp-faden-seide"
            />
            <path d="M -2 3 l -4 8 M 2 3 l 4 8" className="bp-faden-seide" />
          </g>
        ) : null}
        {art === "chong" ? (
          <>
            {fransen(mx - 15, my + 30, -1)}
            {fransen(mx + 15, my + 31, 1)}
          </>
        ) : null}
      </g>
    </svg>
  );
}
