/**
 * SVG Radix wheel (western chart). MC at top, 12 signs, houses, planets, aspect lines.
 * Payload: radixWheel from backend (zodiac, houses, planets, aspects).
 */

const SIZE = 400;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 180;
const R_INNER = 115;  // innerer Rand des farbigen Rings; darunter das Speichenrad
const R_PLANETS = 95; // Planeten auf diesem Radius (größeres inneres Rad)
const R_LABELS = 165;

// MC at top: ecliptic longitude 0° in drawing = MC direction. Angle in drawing (deg) = (longitude - mc + 360) % 360.
// SVG: 0° = right, 90° = bottom. We want drawing 0° (MC) at top = SVG 270° = -90°. So SVG_deg = drawing_deg - 90.
function lonToSvg(lonDeg, mcDeg) {
  const drawingDeg = (lonDeg - mcDeg + 360) % 360;
  const svgDeg = drawingDeg - 90; // 0 at top
  return (svgDeg * Math.PI) / 180;
}

function polarToXY(r, angleRad) {
  return {
    x: CX + r * Math.cos(angleRad),
    y: CY - r * Math.sin(angleRad),
  };
}

const PLANET_SYMBOLS = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
};

const ASPECT_MAX_ORB = 8; // default max orb for opacity scaling

export default function RadixWheel({ payload }) {
  if (!payload || payload.chartType !== "radixWheel") {
    return (
      <div className="radix-wheel radix-wheel--empty">
        <p>Keine Radix-Daten.</p>
      </div>
    );
  }

  const { zodiac, houses, planets, aspects } = payload;
  const mc = houses?.anglesDeg?.mc ?? 0;
  const signs = zodiac?.signs ?? [];
  const planetsList = planets ?? [];
  const aspectsList = aspects ?? [];

  // Base layer: circle and 12 zodiac segments (Ringsegmente: nur der Bereich zwischen inner/outer, Bögen auf den Kreisen)
  const signSegments = signs.map((sign) => {
    const startRad = lonToSvg(sign.startDeg, mc);
    const endRad = lonToSvg(sign.endDeg, mc);
    const innerStart = polarToXY(R_INNER, startRad);
    const innerEnd = polarToXY(R_INNER, endRad);
    const outerStart = polarToXY(R_OUTER, startRad);
    const outerEnd = polarToXY(R_OUTER, endRad);
    // Pfad: Innen start → Außen start → Bogen Außenkreis (start→end) → Außen end → Innen end → Bogen Innenkreis (end→start) → schließen
    // SVG: sweep 0 = gegen Uhrzeiger, 1 = Uhrzeiger (Bildschirm: y nach unten). Beide Bögen = 30°-Stück (large-arc 0).
    // Äußerer Bogen: 0 0 0 = kleinere Bogenstück gegen Uhrzeiger; innerer: 0 0 1 = kleinere Bogenstück Uhrzeiger (end→start).
    const d = `M ${innerStart.x} ${innerStart.y} L ${outerStart.x} ${outerStart.y} A ${R_OUTER} ${R_OUTER} 0 0 0 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${R_INNER} ${R_INNER} 0 0 1 ${innerStart.x} ${innerStart.y} Z`;
    return (
      <path
        key={sign.id}
        d={d}
        className="radix-wheel__sign"
        aria-label={sign.label}
      />
    );
  });

  // Speichen: Hausgrenzen von der Mitte bis zum inneren Ring (wo der farbige Ring beginnt)
  const cusps = houses?.cuspsDeg ?? [];
  const cuspLines = cusps.map((cusp, i) => {
    const rad = lonToSvg(cusp, mc);
    const atInner = polarToXY(R_INNER, rad);
    return (
      <line
        key={`cusp-${i}`}
        x1={CX}
        y1={CY}
        x2={atInner.x}
        y2={atInner.y}
        className="radix-wheel__cusp"
      />
    );
  });

  // Planet positions by id for aspect lines
  const planetById = Object.fromEntries(planetsList.map((p) => [p.id, p]));

  // Relation layer: aspect lines
  const aspectLines = aspectsList.map((asp, i) => {
    const pa = planetById[asp.a];
    const pb = planetById[asp.b];
    if (!pa || !pb) return null;
    const radA = lonToSvg(pa.longitudeDeg, mc);
    const radB = lonToSvg(pb.longitudeDeg, mc);
    const posA = polarToXY(R_PLANETS, radA);
    const posB = polarToXY(R_PLANETS, radB);
    const maxOrb = ASPECT_MAX_ORB;
    const opacity = Math.max(0.2, 1 - (asp.orbDeg || 0) / maxOrb);
    return (
      <line
        key={`aspect-${i}`}
        x1={posA.x}
        y1={posA.y}
        x2={posB.x}
        y2={posB.y}
        className="radix-wheel__aspect"
        style={{ strokeOpacity: opacity }}
      />
    );
  });

  // Data layer: planet symbols
  const planetGlyphs = planetsList.map((p) => {
    const rad = lonToSvg(p.longitudeDeg, mc);
    const pos = polarToXY(R_PLANETS, rad);
    const symbol = PLANET_SYMBOLS[p.id] ?? p.label?.slice(0, 1) ?? "?";
    return (
      <g key={p.id} className="radix-wheel__planet" transform={`translate(${pos.x},${pos.y})`}>
        <text textAnchor="middle" dominantBaseline="middle" className="radix-wheel__planet-symbol">
          {symbol}
        </text>
        {p.retrograde && (
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            dy="14"
            className="radix-wheel__retrograde"
          >
            R
          </text>
        )}
      </g>
    );
  });

  // Label layer: sign names on outer ring
  const signLabels = signs.map((sign) => {
    const midDeg = (sign.startDeg + sign.endDeg) / 2;
    const rad = lonToSvg(midDeg, mc);
    const pos = polarToXY(R_LABELS, rad);
    return (
      <text
        key={`label-${sign.id}`}
        x={pos.x}
        y={pos.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="radix-wheel__sign-label"
      >
        {sign.label}
      </text>
    );
  });

  return (
    <div className="radix-wheel">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="radix-wheel__svg"
        aria-label="Radix-Horoskop"
      >
        <g className="radix-wheel__base-layer">
          <circle cx={CX} cy={CY} r={R_OUTER} className="radix-wheel__outer-ring" fill="none" />
          <circle cx={CX} cy={CY} r={R_INNER} className="radix-wheel__inner-ring" fill="none" />
          {signSegments}
          {cuspLines}
        </g>
        <g className="radix-wheel__relation-layer">{aspectLines}</g>
        <g className="radix-wheel__data-layer">{planetGlyphs}</g>
        <g className="radix-wheel__label-layer">{signLabels}</g>
      </svg>
    </div>
  );
}
