import { memo } from "react";

// Scheibe im magischen Auge, hinter der Lupe: dickes, dunkles Messing mit Drehriefen, darin ein quadratisches
// Fenster mit tiefen Waenden, hinter dem das leuchtende Dia liegt. Ueber dem Fenster eine Reihe Bohrungen als
// Zaehler: dahinter schiebt sich mit jeder Frage ein Stueck rotes Glas weiter (Rotglas, liegt in der Ebene des
// Dias). Offene Fragen leuchten hell, beantwortete bis zur aktuellen rot.
// Koordinaten: -1 .. 1 ueber die ganze Linse (vor der Verzerrung durch die Lupe). Licht von links oben.

export const FENSTER = { links: -0.54, rechts: 0.54, oben: -0.45, unten: 0.63 };
const ZAEHLER_Y = -0.585;
const FASE = 0.028;
const WAND = 0.05; // Tiefe der Fensterwaende, wie man sie in der Draufsicht sieht

// Lage des Fensters in Prozent der Linse (fuer das HTML-Dia dahinter)
export const fensterLage = {
  left: `${((FENSTER.links + 1) / 2) * 100}%`,
  top: `${((FENSTER.oben + 1) / 2) * 100}%`,
  width: `${((FENSTER.rechts - FENSTER.links) / 2) * 100}%`,
  height: `${((FENSTER.unten - FENSTER.oben) / 2) * 100}%`,
};

const kreis = (x, y, r) =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

function bohrungen(anzahl) {
  const spanne = Math.min(1.0, (anzahl - 1) * 0.075);
  const schritt = anzahl > 1 ? spanne / (anzahl - 1) : 0;
  const r = Math.min(0.024, schritt * 0.34 || 0.024);
  return Array.from({ length: anzahl }, (_, k) => ({
    x: -spanne / 2 + k * schritt,
    y: ZAEHLER_Y,
    r,
  }));
}

// Kante des roten Glases: zwischen der aktuellen und der naechsten Bohrung (vor der ersten Frage links davon).
// stand darf gebrochen sein: waehrend das Dia wechselt, gleitet das Glas mit.
function glaskante(loecher, stand) {
  if (!loecher.length) return -1;
  const schritt = loecher.length > 1 ? loecher[1].x - loecher[0].x : 0.08;
  const s = Math.max(-1, Math.min(stand, loecher.length - 1));
  return loecher[0].x + (s + 0.5) * schritt;
}

// Rotes Glas hinter den Bohrungen; gehoert in die Ebene des Dias (multipliziert mit dem Licht)
// Es haengt am selben Mechanismus wie das Dia: stand = aktuelle Frage + Weg des Dias (0 .. 1)
export const Rotglas = memo(function Rotglas({ anzahl, stand, gleitet }) {
  const kante = glaskante(bohrungen(anzahl), stand);
  return (
    <svg
      className="sp-rotglas"
      viewBox="-1 -1 2 2"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ds-rotglas" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2452a" />
          <stop offset="0.5" stopColor="#ff6a45" />
          <stop offset="1" stopColor="#d23a22" />
        </linearGradient>
      </defs>
      <g
        className={gleitet ? "ds-glas ds-glas-gleitet" : "ds-glas"}
        style={{ transform: `translateX(${kante}px)` }}
      >
        <rect
          x="-1.6"
          y={ZAEHLER_Y - 0.11}
          width="1.6"
          height="0.19"
          fill="url(#ds-rotglas)"
        />
        {/* geschliffene Kante */}
        <rect
          x="-0.012"
          y={ZAEHLER_Y - 0.11}
          width="0.012"
          height="0.19"
          fill="#5a160c"
        />
      </g>
    </svg>
  );
});

function Schraube({ x, y, winkel }) {
  const r = 0.042;
  const dx = Math.cos(winkel) * r * 0.8;
  const dy = Math.sin(winkel) * r * 0.8;
  return (
    <g>
      <circle cx={x} cy={y} r={r * 1.12} fill="#1c1309" opacity="0.6" />
      <circle cx={x} cy={y} r={r} fill="url(#ds-schraube)" />
      <line
        x1={x - dx}
        y1={y - dy + 0.004}
        x2={x + dx}
        y2={y + dy + 0.004}
        stroke="#f2d9a2"
        strokeOpacity="0.45"
        strokeWidth="0.008"
      />
      <line
        x1={x - dx}
        y1={y - dy}
        x2={x + dx}
        y2={y + dy}
        stroke="#1c1309"
        strokeWidth="0.011"
      />
    </g>
  );
}

const Diascheibe = memo(function Diascheibe({ anzahl, aktuell, style }) {
  const { links: L, rechts: R, oben: T, unten: U } = FENSTER;
  const loecher = bohrungen(anzahl);
  const scheibe =
    `M-1.2 -1.2H1.2V1.2H-1.2Z M${L} ${T}H${R}V${U}H${L}Z ` +
    loecher.map((l) => kreis(l.x, l.y, l.r)).join(" ");
  const f = FASE;
  const w = WAND;
  return (
    // Filter am umgebenden div: WebKit rechnet ihn am SVG selbst in dessen viewBox-Koordinaten
    <div className="sp-lupe" style={style} aria-hidden="true">
      <svg
        className="sp-diascheibe"
        viewBox="-1 -1 2 2"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient
            id="ds-metall"
            cx="-0.4"
            cy="-0.5"
            r="1.9"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#5e4629" />
            <stop offset="0.45" stopColor="#332514" />
            <stop offset="1" stopColor="#120b05" />
          </radialGradient>
          <radialGradient
            id="ds-riefen"
            cx="0"
            cy="0"
            r="0.016"
            gradientUnits="userSpaceOnUse"
            spreadMethod="repeat"
          >
            <stop offset="0" stopColor="#fff0c8" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff0c8" stopOpacity="0.05" />
            <stop offset="1" stopColor="#000" stopOpacity="0.1" />
          </radialGradient>
          <radialGradient id="ds-schraube" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#8a6d42" />
            <stop offset="0.6" stopColor="#4a361d" />
            <stop offset="1" stopColor="#1e140a" />
          </radialGradient>
          <linearGradient id="ds-lochkante" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0.3" stopColor="#120b04" />
            <stop offset="0.75" stopColor="#6e5330" />
          </linearGradient>
          <linearGradient id="ds-schatten-oben" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.6" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ds-schatten-links" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#000" stopOpacity="0.5" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          {/* Fensterwaende: vorne dunkel, nach hinten vom Dia angestrahlt (Verlauf von aussen nach innen) */}
          {[
            ["oben", 0, 0, 0, 1, 0.3],
            ["unten", 0, 1, 0, 0, 0.5],
            ["links", 0, 0, 1, 0, 0.25],
            ["rechts", 1, 0, 0, 0, 0.42],
          ].map(([seite, x1, y1, x2, y2, hell]) => (
            <linearGradient
              key={seite}
              id={`ds-wand-${seite}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
            >
              <stop offset="0" stopColor="#0a0603" />
              <stop offset="0.55" stopColor="#24170a" />
              <stop offset="1" stopColor="#c99a55" stopOpacity={hell} />
            </linearGradient>
          ))}
        </defs>

        {/* Schatten der Scheibe auf dem Dia (das Dia liegt tief dahinter) */}
        <rect
          x={L + w}
          y={T + w}
          width={R - L - 2 * w}
          height="0.1"
          fill="url(#ds-schatten-oben)"
        />
        <rect
          x={L + w}
          y={T + w}
          width="0.08"
          height={U - T - 2 * w}
          fill="url(#ds-schatten-links)"
        />

        <path d={scheibe} fillRule="evenodd" fill="url(#ds-metall)" />
        <path d={scheibe} fillRule="evenodd" fill="url(#ds-riefen)" />

        {/* Fase um das Fenster: oben und links im Schatten, unten und rechts im Licht */}
        <path
          d={`M${L - f} ${T - f}H${R + f}L${R} ${T}H${L}Z`}
          fill="#1e1409"
          opacity="0.75"
        />
        <path
          d={`M${L - f} ${T - f}L${L} ${T}V${U}L${L - f} ${U + f}Z`}
          fill="#1e1409"
          opacity="0.6"
        />
        <path
          d={`M${L - f} ${U + f}L${L} ${U}H${R}L${R + f} ${U + f}Z`}
          fill="#e4c88e"
          opacity="0.55"
        />
        <path
          d={`M${R + f} ${T - f}L${R} ${T}V${U}L${R + f} ${U + f}Z`}
          fill="#e4c88e"
          opacity="0.4"
        />

        {/* Waende des Fensters: die Scheibe ist dick, das Dia liegt an der hinteren Oeffnung */}
        <path
          d={`M${L} ${T}H${R}L${R - w} ${T + w}H${L + w}Z`}
          fill="url(#ds-wand-oben)"
        />
        <path
          d={`M${L} ${U}H${R}L${R - w} ${U - w}H${L + w}Z`}
          fill="url(#ds-wand-unten)"
        />
        <path
          d={`M${L} ${T}L${L + w} ${T + w}V${U - w}L${L} ${U}Z`}
          fill="url(#ds-wand-links)"
        />
        <path
          d={`M${R} ${T}L${R - w} ${T + w}V${U - w}L${R} ${U}Z`}
          fill="url(#ds-wand-rechts)"
        />

        {/* Zaehler: Bohrungen ueber dem Fenster, Kante oben im Schatten, unten im Licht */}
        {loecher.map((l, k) => (
          <circle
            key={k}
            cx={l.x}
            cy={l.y}
            r={l.r}
            fill="none"
            stroke="url(#ds-lochkante)"
            strokeWidth="0.005"
          />
        ))}

        <Schraube x={-0.75} y={0.06} winkel={0.6} />
        <Schraube x={0.75} y={0.06} winkel={-0.35} />
      </svg>
    </div>
  );
});

export default Diascheibe;
