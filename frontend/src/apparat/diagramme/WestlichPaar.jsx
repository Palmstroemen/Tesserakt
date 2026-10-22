// Westlich fuer Paare (Spiel C): Doppelrad im Nachthimmel wie in der Synastrie. Aussen der Tierkreis,
// darunter der Ring deines Gegenuebers (Silber), innen dein Ring (Gold), je mit Sonne, Mond, Venus, Mars
// und (mit Geburtsort) dem Aszendenten, den Punkten des Paar-Textes. Die dort genannten Aspekte
// (backend/paar.py) laufen als Lichtfaeden von deinem Ring zu dem deines Gegenuebers; Quadrat und
// Opposition flackern. Ausrichtung: dein Aszendent links, ohne Geburtsort der Widderpunkt.
import { useMemo } from "react";
import { T, ZEICHEN, sterne, verteilen } from "./WestlichNacht";

const G = 300;
const M = G / 2;
const R_AUSSEN = 142; // Tierkreisring aussen
const R_ZEICHEN = 132;
const R_INNEN = 122; // Tierkreisring innen
const R_B = 108; // Symbole deines Gegenuebers
const R_TRENN = 94; // Grenze zwischen den beiden Ringen, Endpunkte der Faeden aussen
const R_A = 78; // deine Symbole
const R_FADEN = 60; // Endpunkte der Faeden innen
const R_NABE = 22;

const SYMBOL = { sonne: "☉", mond: "☽", venus: "♀", mars: "♂" };
const FADEN = {
  konjunktion: "#fff1c4",
  trine: "#5aa8ff",
  sextil: "#7fe6ff",
  quadrat: "#ff5d5d",
  opposition: "#ff9a4a",
};
const SPANNUNG = ["quadrat", "opposition"];

function punkt(laenge, asc, r) {
  const w = ((180 + laenge - asc) * Math.PI) / 180;
  return { x: M + r * Math.cos(w), y: M - r * Math.sin(w) };
}

// Ring einer Person: Planeten auseinandergerueckt, Marke an der echten Stelle, Aszendent als "AC"
function Ring({ punkte, asc, r, rEcht, fuell, klasse }) {
  const planeten = useMemo(
    () =>
      verteilen(
        Object.entries(punkte)
          .filter(([id]) => SYMBOL[id])
          .map(([id, l]) => ({ id, longitudeDeg: l })),
      ),
    [punkte],
  );
  return (
    <g className={klasse} filter="url(#wp-glanz)">
      {planeten.map((p) => {
        const echt = punkt(p.longitudeDeg, asc, rEcht);
        const sym = punkt(p.anzeige, asc, r);
        return (
          <g key={p.id}>
            <line
              x1={echt.x}
              y1={echt.y}
              x2={sym.x}
              y2={sym.y}
              className="wp-leiter"
              stroke={fuell}
            />
            <circle cx={echt.x} cy={echt.y} r="1.5" fill={fuell} />
            <text
              x={sym.x}
              y={sym.y}
              dy="0.35em"
              className="wp-planet"
              fill={fuell}
            >
              {SYMBOL[p.id] + T}
            </text>
          </g>
        );
      })}
      {punkte.aszendent != null
        ? (() => {
            const t = punkt(punkte.aszendent, asc, r);
            const e = punkt(punkte.aszendent, asc, rEcht);
            return (
              <g>
                <circle cx={e.x} cy={e.y} r="1.5" fill={fuell} />
                <text
                  x={t.x}
                  y={t.y}
                  dy="0.35em"
                  className="wp-ac"
                  fill={fuell}
                >
                  AC
                </text>
              </g>
            );
          })()
        : null}
    </g>
  );
}

export default function WestlichPaar({ daten }) {
  const himmel = useMemo(() => sterne(90), []);
  const a = daten?.punkte?.a;
  const b = daten?.punkte?.b;
  if (!a || !b) return null;
  const asc = a.aszendent ?? 0;

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="wn wp"
      role="img"
      aria-label="Doppelrad: deine Planeten innen, die deines Gegenübers außen, Aspekte als Lichtfäden"
    >
      <defs>
        <radialGradient id="wp-himmel" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#2a1450" />
          <stop offset="0.6" stopColor="#140a2c" />
          <stop offset="1" stopColor="#07040f" />
        </radialGradient>
        <linearGradient id="wp-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0b8" />
          <stop offset="0.5" stopColor="#f0c75e" />
          <stop offset="1" stopColor="#c8932c" />
        </linearGradient>
        <linearGradient id="wp-silber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#d6dce4" />
          <stop offset="1" stopColor="#9aa3ae" />
        </linearGradient>
        <filter id="wp-glanz" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" result="weich" />
          <feMerge>
            <feMergeNode in="weich" />
            <feMergeNode in="weich" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* fx: Nachthimmel und Sterne */}
      <circle cx={M} cy={M} r={G / 2} fill="url(#wp-himmel)" />
      <g>
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

      {/* base: Tierkreis, Ringgrenze (Silber aussen, Gold innen), Nabe */}
      <g>
        <circle cx={M} cy={M} r={R_AUSSEN} className="wn-ring" />
        <circle cx={M} cy={M} r={R_INNEN} className="wn-ring" />
        <circle cx={M} cy={M} r={R_TRENN} className="wp-trenn" />
        <circle cx={M} cy={M} r={R_FADEN} className="wp-innen" />
        <circle cx={M} cy={M} r={R_NABE} className="wn-ring leise" />
        {ZEICHEN.map((z, i) => {
          const p1 = punkt(i * 30, asc, R_INNEN);
          const p2 = punkt(i * 30, asc, R_AUSSEN);
          const t = punkt(i * 30 + 15, asc, R_ZEICHEN);
          return (
            <g key={z}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className="wn-grenze"
              />
              <text
                x={t.x}
                y={t.y}
                dy="0.35em"
                className="wn-zeichen wp-zeichen"
              >
                {z + T}
              </text>
            </g>
          );
        })}
      </g>

      {/* relation: die Aspekte aus dem Paar-Text, von deinem Ring zu dem deines Gegenuebers */}
      <g filter="url(#wp-glanz)">
        {(daten.aspekte ?? []).map((asp, i) => {
          if (a[asp.a] == null || b[asp.b] == null) return null;
          const p1 = punkt(a[asp.a], asc, R_FADEN);
          const p2 = punkt(b[asp.b], asc, R_TRENN);
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={FADEN[asp.aspekt] ?? "#fff"}
              className={
                SPANNUNG.includes(asp.aspekt) ? "wp-faden flackert" : "wp-faden"
              }
              style={{ animationDelay: `${i * 0.7}s` }}
            />
          );
        })}
      </g>

      {/* data: Gegenueber aussen in Silber, du innen in Gold */}
      <Ring
        punkte={b}
        asc={asc}
        r={R_B}
        rEcht={R_TRENN}
        fuell="url(#wp-silber)"
        klasse="wp-ring-b"
      />
      <Ring
        punkte={a}
        asc={asc}
        r={R_A}
        rEcht={R_FADEN}
        fuell="url(#wp-gold)"
        klasse="wp-ring-a"
      />
    </svg>
  );
}
