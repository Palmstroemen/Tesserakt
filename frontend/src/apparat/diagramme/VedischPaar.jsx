// Vedisch fuer Paare (Spiel C): ein Rangoli fuer zwei. In der Mitte eine Bluete aus fuenf Blaettern, eines je
// Kuta (Tara, Yoni, Gana, Bhakoot, Nadi; backend/paar.py): mit Reismehlpunkten umrandet und von innen so weit
// mit Farbpulver gefuellt, wie Punkte erreicht sind. Aussen der Kolam-Ring der 27 Nakshatras mit zwei
// Armreifen: Gold um dein Geburts-Nakshatra, Silber um das deines Gegenuebers. Von beiden fuehrt eine Schnur
// zur Mitte; ab der Haelfte der Punkte sind sie dort verknotet, sonst liegen die Enden lose nebeneinander.
import { t, zahl } from "../../sprache";

const G = 300;
const M = G / 2;
const R_KOLAM = 116;
const BLATT = 84; // Laenge eines Blatts
const SOCKEL = 7;

const KUTAS = [
  { id: "tara", name: "Tara", max: 3, farbe: ["#f6c21c", "#c48b05"] },
  { id: "yoni", name: "Yoni", max: 4, farbe: ["#e2432b", "#a8200f"] },
  { id: "gana", name: "Gana", max: 6, farbe: ["#2fa84f", "#16692e"] },
  { id: "bhakoot", name: "Bhakoot", max: 7, farbe: ["#e0569a", "#9c2a62"] },
  { id: "nadi", name: "Nadi", max: 8, farbe: ["#3b6fd6", "#1d3a86"] },
];

function zufallVon(saat) {
  let z = saat;
  return () => {
    z = (z * 1664525 + 1013904223) % 4294967296;
    return z / 4294967296;
  };
}

const punkt = (r, w) => ({ x: M + r * Math.cos(w), y: M + r * Math.sin(w) });
const nakPunkt = (i) => punkt(R_KOLAM, (i / 27) * Math.PI * 2 - Math.PI / 2);

// Blatt nach oben zeigend (lokal, Mitte = 0,0): zwei kubische Boegen vom Sockel zur Spitze
const RECHTS = [
  [0, -SOCKEL],
  [24, -24],
  [20, -66],
  [0, -BLATT],
];
const LINKS = RECHTS.map(([x, y]) => [-x, y]);
const BLATT_PFAD = `M 0 ${-SOCKEL} C 24 -24, 20 -66, 0 ${-BLATT} C -20 -66, -24 -24, 0 ${-SOCKEL} Z`;

function bezier([p0, p1, p2, p3], t) {
  const u = 1 - t;
  return [0, 1].map(
    (k) =>
      u * u * u * p0[k] +
      3 * u * u * t * p1[k] +
      3 * u * t * t * p2[k] +
      t * t * t * p3[k],
  );
}

// Schnur von einem Reif zur Mitte (oder knapp daneben), leicht durchhaengend
function Schnur({ von, nach, klasse }) {
  const dx = nach.x - von.x;
  const dy = nach.y - von.y;
  const l = Math.hypot(dx, dy);
  const q = {
    x: von.x + dx * 0.5 - (dy / l) * 6,
    y: von.y + dy * 0.5 + (dx / l) * 6,
  };
  const d = `M ${von.x} ${von.y} Q ${q.x} ${q.y} ${nach.x} ${nach.y}`;
  return (
    <g className={`vp-schnur ${klasse}`}>
      <path
        d={d}
        className="vp-schnur-schatten"
        transform="translate(1.2 1.6)"
      />
      <path d={d} className="vp-schnur-grund" />
      <path d={d} className="vp-schnur-drall" />
    </g>
  );
}

function Reif({ k, metall, drehung }) {
  return (
    <g transform={`rotate(${drehung} ${k.x} ${k.y})`}>
      <ellipse
        cx={k.x + 1.2}
        cy={k.y + 1.8}
        rx="9"
        ry="7.6"
        className="vp-reif-schatten"
      />
      <ellipse
        cx={k.x}
        cy={k.y}
        rx="9"
        ry="7.6"
        className="vp-reif"
        stroke={`url(#vp-${metall})`}
      />
      <path
        d={`M ${k.x - 7.4} ${k.y - 3.5} A 9 7.6 0 0 1 ${k.x + 2} ${k.y - 7.5}`}
        className="vp-reif-glanz"
      />
    </g>
  );
}

export default function VedischPaar({ daten }) {
  const nak = daten?.nakshatra;
  if (!daten?.kutas || nak?.a == null || nak?.b == null) return null;
  const zp = zufallVon(31);
  const gebunden = daten.punkte >= daten.max / 2;
  const ra = nakPunkt(nak.a);
  const rb = nakPunkt(nak.b);
  const gleich = nak.a === nak.b;
  // Reifen bei gleichem Nakshatra leicht gegeneinander versetzt
  const reifA = gleich ? { x: ra.x + 4, y: ra.y + 2 } : ra;
  const reifB = gleich ? { x: rb.x - 4, y: rb.y - 2 } : rb;
  // Schnurenden: verknotet in der Mitte, sonst nebeneinander mit Abstand
  const quer = (() => {
    const dx = reifB.x - reifA.x;
    const dy = reifB.y - reifA.y;
    const l = Math.hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  })();
  const endeA = gebunden
    ? { x: M, y: M }
    : { x: M - quer.x * 9, y: M - quer.y * 9 };
  const endeB = gebunden
    ? { x: M, y: M }
    : { x: M + quer.x * 9, y: M + quer.y * 9 };

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="vr vp"
      role="img"
      aria-label={t("diagramme.vedisch.paar", {
        punkte: daten.punkte,
        max: daten.max,
      })}
    >
      <defs>
        <radialGradient id="vp-boden" cx="45%" cy="40%" r="70%">
          <stop offset="0" stopColor="#4a3a2e" />
          <stop offset="1" stopColor="#21170f" />
        </radialGradient>
        <filter id="vp-pulver" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.3"
            numOctaves="1"
            seed="3"
            result="fein"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fein"
            scale="3"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rand"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="2.4"
            numOctaves="1"
            seed="17"
            result="korn"
          />
          <feColorMatrix
            in="korn"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.15"
            result="kornAlpha"
          />
          <feComposite in="rand" in2="kornAlpha" operator="in" />
        </filter>
        <filter id="vp-fein" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.8"
            numOctaves="1"
            seed="21"
            result="fein"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fein"
            scale="1.1"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <linearGradient id="vp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0b0" />
          <stop offset="0.45" stopColor="#e2b23c" />
          <stop offset="1" stopColor="#9c6a10" />
        </linearGradient>
        <linearGradient id="vp-silber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c9cfd6" />
          <stop offset="1" stopColor="#7f8893" />
        </linearGradient>
        {KUTAS.map((k) => {
          const anteil = Math.max(
            0,
            Math.min(1, (daten.kutas[k.id] ?? 0) / k.max),
          );
          return (
            <g key={k.id}>
              <clipPath id={`vp-fuell-${k.id}`}>
                <circle cx={M} cy={M} r={SOCKEL + (BLATT - SOCKEL) * anteil} />
              </clipPath>
              <radialGradient
                id={`vp-farbe-${k.id}`}
                gradientUnits="userSpaceOnUse"
                cx={M}
                cy={M}
                r={BLATT}
              >
                <stop offset="0.2" stopColor={k.farbe[0]} />
                <stop offset="1" stopColor={k.farbe[1]} />
              </radialGradient>
            </g>
          );
        })}
      </defs>

      <circle cx={M} cy={M} r={G / 2} fill="url(#vp-boden)" />

      {/* Bluete: Pulver (bis zum erreichten Anteil), Umriss aus Reismehlpunkten, Name und Punkte */}
      {KUTAS.map((k, i) => {
        const drehung = i * 72;
        const w = ((drehung - 90) * Math.PI) / 180;
        const schild = punkt(BLATT + 9, w);
        const umriss = [RECHTS, LINKS].flatMap((kurve) =>
          Array.from({ length: 13 }, (_, n) => bezier(kurve, n / 12)),
        );
        return (
          <g key={k.id}>
            <g filter="url(#vp-pulver)" clipPath={`url(#vp-fuell-${k.id})`}>
              <path
                d={BLATT_PFAD}
                transform={`translate(${M} ${M}) rotate(${drehung})`}
                fill={`url(#vp-farbe-${k.id})`}
              />
            </g>
            <g
              filter="url(#vp-fein)"
              transform={`translate(${M} ${M}) rotate(${drehung})`}
            >
              {umriss.map(([x, y], n) => (
                <circle
                  key={n}
                  cx={x + (zp() - 0.5) * 1.1}
                  cy={y + (zp() - 0.5) * 1.1}
                  r={1.25 + zp() * 0.4}
                  className="vr-punkt"
                />
              ))}
            </g>
            <text x={schild.x} y={schild.y} dy="0.35em" className="vp-schild">
              {k.name} {zahl(daten.kutas[k.id])}/{k.max}
            </text>
          </g>
        );
      })}

      {/* Kolam-Ring der 27 Nakshatras */}
      <g filter="url(#vp-fein)">
        {Array.from({ length: 27 }, (_, i) => {
          const p = nakPunkt(i);
          return (
            <circle
              key={i}
              cx={p.x + (zp() - 0.5) * 1.2}
              cy={p.y + (zp() - 0.5) * 1.2}
              r={1.5 + zp() * 0.4}
              className="vr-punkt"
            />
          );
        })}
      </g>

      {/* Schnuere von den Reifen zur Mitte, darueber die Reifen */}
      <Schnur von={reifB} nach={endeB} klasse="silber" />
      <Schnur von={reifA} nach={endeA} klasse="gold" />
      {gebunden ? (
        <g>
          <circle cx={M} cy={M} r="4.6" className="vp-knoten" />
          <path
            d={`M ${M - 2} ${M + 3} l -3 7 M ${M + 2} ${M + 3} l 3 7`}
            className="vp-faser"
          />
        </g>
      ) : null}
      <Reif k={reifB} metall="silber" drehung={20} />
      <Reif k={reifA} metall="gold" drehung={-25} />
    </svg>
  );
}
