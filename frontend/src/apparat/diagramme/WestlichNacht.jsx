// Westliche Astrologie im Auge: schwarzvioletter Nachthimmel, leuchtende Planeten und Aspektlinien.
// Fachlich die Radix (Visuals.md 2.1): Tierkreis, Haeuser, Achsen, Planeten, Aspekte. Ausrichtung wie
// ueblich: Aszendent links, Tierkreis gegen den Uhrzeigersinn. Reines SVG (Vektor, auch fuer den Druck).
// Ebenen nach Visuals.md 6: base (Ringe, Haeuser), relation (Aspekte), data (Planeten), label, fx (Sterne).
import { useMemo } from "react";

const G = 300; // viewBox; der Kreis fuellt die Linse
const M = G / 2;
const R_AUSSEN = 142; // Tierkreisring aussen
const R_ZEICHEN = 128; // Zeichensymbole
const R_INNEN = 114; // Tierkreisring innen
const R_PLANET = 94; // Planetensymbole
const R_ASPEKT = 66; // Endpunkte der Aspektlinien
const R_NABE = 30;

// ︎: Textdarstellung erzwingen (sonst zeigen manche Geraete ♀ ♂ ♈ … als bunte Emoji)
export const T = "︎";
export const ZEICHEN = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];
const PLANETEN = {
  sun: { s: "☉", f: "#ffd56b" },
  moon: { s: "☽", f: "#e4e9ff" },
  mercury: { s: "☿", f: "#9fe7ff" },
  venus: { s: "♀", f: "#86ffb5" },
  mars: { s: "♂", f: "#ff6450" },
  jupiter: { s: "♃", f: "#ffb24a" },
  saturn: { s: "♄", f: "#d8c48e" },
  uranus: { s: "♅", f: "#5ff3ff" },
  neptune: { s: "♆", f: "#7ea6ff" },
  pluto: { s: "♇", f: "#d47bff" },
};
const ASPEKTE = {
  trine: "#5aa8ff",
  sextile: "#7fe6ff",
  square: "#ff5d5d",
  opposition: "#ff9a4a",
};

// Ekliptische Laenge -> Punkt; Aszendent liegt links (180°), Laenge waechst gegen den Uhrzeigersinn
function punkt(laenge, asc, r) {
  const w = ((180 + laenge - asc) * Math.PI) / 180;
  return { x: M + r * Math.cos(w), y: M - r * Math.sin(w) };
}

// eng stehende Planeten fuer die Symbole auseinanderruecken (mind. 13°), Linie zur echten Position.
// Benachbarte Planeten werden zu Gruppen zusammengefasst und gleichmaessig um die Gruppenmitte verteilt,
// bis sich keine Gruppen mehr ueberlappen.
export function verteilen(planeten) {
  const MIN = 13;
  if (!planeten.length) return [];
  const liste = [...planeten].sort((a, b) => a.longitudeDeg - b.longitudeDeg);
  // nach der groessten Luecke beginnen, damit keine Gruppe ueber 0° geteilt wird
  let start = 0;
  let groesste = -1;
  liste.forEach((p, i) => {
    const n = liste[(i + 1) % liste.length];
    const luecke = (n.longitudeDeg - p.longitudeDeg + 360) % 360 || 360;
    if (luecke > groesste) {
      groesste = luecke;
      start = (i + 1) % liste.length;
    }
  });
  const reihe = liste.slice(start).concat(liste.slice(0, start));
  const basis = reihe[0].longitudeDeg;
  const lage = reihe.map((p) => (p.longitudeDeg - basis + 360) % 360);
  let gruppen = lage.map((x, i) => ({ von: i, bis: i, mitte: x }));
  const breite = (g) => (g.bis - g.von) * MIN;
  for (let geaendert = true; geaendert;) {
    geaendert = false;
    for (let i = 0; i < gruppen.length - 1; i += 1) {
      const a = gruppen[i];
      const b = gruppen[i + 1];
      if (b.mitte - breite(b) / 2 - (a.mitte + breite(a) / 2) < MIN) {
        const von = a.von;
        const bis = b.bis;
        const mitte =
          lage.slice(von, bis + 1).reduce((x, y) => x + y, 0) / (bis - von + 1);
        gruppen.splice(i, 2, { von, bis, mitte });
        geaendert = true;
        break;
      }
    }
  }
  const anzeige = [];
  gruppen.forEach((g) => {
    for (let k = g.von; k <= g.bis; k += 1)
      anzeige[k] = g.mitte + (k - g.von - (g.bis - g.von) / 2) * MIN;
  });
  return reihe.map((p, i) => ({ ...p, anzeige: basis + anzeige[i] }));
}

// fester Sternenhimmel (gleich bei jedem Aufruf), einige funkeln
export function sterne(anzahl) {
  let z = 20251021;
  const zufall = () => {
    z = (z * 1664525 + 1013904223) % 4294967296;
    return z / 4294967296;
  };
  return Array.from({ length: anzahl }, (_, i) => {
    const w = zufall() * Math.PI * 2;
    const r = Math.sqrt(zufall()) * (G / 2 - 4);
    return {
      x: M + r * Math.cos(w),
      y: M + r * Math.sin(w),
      g: 0.25 + zufall() * 0.9,
      funkeln: i % 5 === 0,
      verz: zufall() * 4,
    };
  });
}

export default function WestlichNacht({ payload }) {
  const himmel = useMemo(() => sterne(90), []);
  const verteilt = useMemo(() => verteilen(payload?.planets ?? []), [payload]);
  if (!payload || payload.chartType !== "radixWheel") return null;

  // Ohne Geburtsort rechnet das Backend mit einem Standard-Aszendenten (westlich.md). Haeuser und Achsen
  // waeren dann erfunden: nicht zeichnen, Tierkreis mit dem Widderpunkt links ausrichten.
  const mitOrt = payload.houses?.system === "placidus";
  const asc = mitOrt ? (payload.houses?.anglesDeg?.asc ?? 0) : 0;
  const mc = mitOrt ? payload.houses?.anglesDeg?.mc : null;
  const spitzen = mitOrt ? (payload.houses?.cuspsDeg ?? []) : [];
  const lage = Object.fromEntries(
    (payload.planets ?? []).map((p) => [p.id, p.longitudeDeg]),
  );

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="wn"
      role="img"
      aria-label="Radix: Planeten und Aspekte"
    >
      <defs>
        <radialGradient id="wn-himmel" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#2a1450" />
          <stop offset="0.6" stopColor="#140a2c" />
          <stop offset="1" stopColor="#07040f" />
        </radialGradient>
        <filter id="wn-glanz" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="weich" />
          <feMerge>
            <feMergeNode in="weich" />
            <feMergeNode in="weich" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* fx: Nachthimmel und Sterne */}
      <circle cx={M} cy={M} r={G / 2} fill="url(#wn-himmel)" />
      <g className="wn-sterne">
        {himmel.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.g * 0.7}
            className={s.funkeln ? "wn-stern funkelt" : "wn-stern"}
            style={s.funkeln ? { animationDelay: `${s.verz}s` } : undefined}
          />
        ))}
      </g>

      {/* base: Tierkreisring, Zeichengrenzen, Haeuser, Achsen */}
      <g className="wn-basis">
        <circle cx={M} cy={M} r={R_AUSSEN} className="wn-ring" />
        <circle cx={M} cy={M} r={R_INNEN} className="wn-ring" />
        <circle cx={M} cy={M} r={R_NABE} className="wn-ring leise" />
        {ZEICHEN.map((z, i) => {
          const a = punkt(i * 30, asc, R_INNEN);
          const b = punkt(i * 30, asc, R_AUSSEN);
          const t = punkt(i * 30 + 15, asc, R_ZEICHEN);
          return (
            <g key={z}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="wn-grenze" />
              <text x={t.x} y={t.y} dy="0.35em" className="wn-zeichen">
                {z + T}
              </text>
            </g>
          );
        })}
        {spitzen.map((s, i) => {
          const a = punkt(s, asc, R_NABE);
          const b = punkt(s, asc, R_INNEN);
          const achse = i === 0 || i === 3 || i === 6 || i === 9;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={achse ? "wn-haus achse" : "wn-haus"}
            />
          );
        })}
      </g>

      {/* relation: Aspekte als Lichtlinien, je genauer desto heller */}
      <g filter="url(#wn-glanz)">
        {(payload.aspects ?? []).map((asp, i) => {
          const farbe = ASPEKTE[asp.type];
          if (!farbe || lage[asp.a] == null || lage[asp.b] == null) return null;
          const a = punkt(lage[asp.a], asc, R_ASPEKT);
          const b = punkt(lage[asp.b], asc, R_ASPEKT);
          const staerke = Math.max(0.25, 1 - (asp.orbDeg ?? 0) / 8);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={farbe}
              strokeOpacity={staerke}
              className="wn-aspekt"
            />
          );
        })}
      </g>

      {/* data: Planeten (Symbol, Marke an der echten Position, Linie dazwischen) */}
      <g filter="url(#wn-glanz)">
        {verteilt.map((p) => {
          const art = PLANETEN[p.id];
          if (!art) return null;
          const echt = punkt(p.longitudeDeg, asc, R_INNEN - 3);
          const innen = punkt(p.longitudeDeg, asc, R_ASPEKT);
          const sym = punkt(p.anzeige, asc, R_PLANET);
          return (
            <g key={p.id} style={{ color: art.f }}>
              <line
                x1={echt.x}
                y1={echt.y}
                x2={sym.x}
                y2={sym.y}
                className="wn-leiter"
              />
              <circle cx={innen.x} cy={innen.y} r="1.4" fill="currentColor" />
              <circle cx={echt.x} cy={echt.y} r="1.6" fill="currentColor" />
              <text x={sym.x} y={sym.y} dy="0.35em" className="wn-planet">
                {art.s + T}
                {p.retrograde ? <tspan className="wn-rueck">ʀ</tspan> : null}
              </text>
            </g>
          );
        })}
      </g>

      {/* label: Achsen */}
      <g className="wn-label">
        {!mitOrt ? (
          <text x={M} y={M + R_NABE + 14} className="wn-achse">
            ohne Geburtsort keine Häuser
          </text>
        ) : null}
        {[
          ["AC", mitOrt ? asc : null],
          ["MC", mc],
        ].map(([t, l]) =>
          l == null ? null : (
            <text
              key={t}
              {...punkt(l, asc, R_NABE + 10)}
              dy="0.35em"
              className="wn-achse"
            >
              {t}
            </text>
          ),
        )}
      </g>
    </svg>
  );
}
