import { memo, useEffect, useRef } from "react";
import { MITTE } from "./geometrie";
import { neigungAbonnieren } from "./neigung";

// Mitte der Datumsscheibe: eine kleine Linse, durch die man auf ein Rollenzaehlwerk sieht (wie bei alten
// Kilometerzaehlern), ganz im Dunkeln und von hinten durchleuchtet von derselben Mattscheibe wie die Dias:
// die Walzen sind durchscheinend und gluehen bernsteinfarben, die Ziffern stehen dunkel davor; Bruecken und
// Raedchen sind nur Silhouetten mit schwachem Lichtsaum. praefix trennt die ids mehrerer Scheiben. In einer Zeile das ganze Datum (Tag,
// Monat als Namenswalze, Jahr), darunter ein Stundenrad mit 0..23 am Rand, das sich unter eine feste Marke
// dreht. Walzen und Rad laufen mit leichtem Nachschwingen auf ihren Wert (CSS: .zw-streifen, .zw-stundenrad).
// Keine Verzerrung als Filter: die Scheibe wird beim Drehen neu gezeichnet.

const MONATE_KURZ = [
  "Jän",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];
const H = 17; // Hoehe eines Walzenfensters
const B = 11; // Breite einer Ziffernwalze
const LUFT = 1; // zwischen zwei Walzen
const LINSE = 63;
const TIEFE = 125; // Versatz bei voller Neigung: das Gewerk ist dann ganz aus der Linse (Tiefe und Vergroesserung)

// Walze: Fenster bei (x, y) (linke obere Ecke); die Zeichen stehen untereinander auf einem Streifen, der um
// den Wert verschoben wird
function Walze({ p, x, y, breite = B, zeichen, wert }) {
  return (
    <svg
      x={x}
      y={y}
      width={breite}
      height={H}
      viewBox={`0 0 ${breite} ${H}`}
      overflow="hidden"
    >
      <rect width={breite} height={H} fill={`url(#${p}-elfenbein)`} />
      <g
        className="zw-streifen"
        style={{ transform: `translateY(${-wert * H}px)` }}
      >
        {zeichen.map((z, i) => (
          <text
            key={i}
            x={breite / 2}
            y={i * H + H / 2}
            dy="0.36em"
            className={breite > B ? "zw-zeichen zw-name" : "zw-zeichen"}
          >
            {z}
          </text>
        ))}
      </g>
      {/* rund: oben und unten dreht die Walze aus dem Licht */}
      <rect width={breite} height={H} fill={`url(#${p}-rundung)`} />
    </svg>
  );
}

const ZIFFERN = Array.from({ length: 10 }, (_, i) => String(i));

// Reihe von Ziffernwalzen fuer eine Zahl mit fester Stellenzahl
function Zahl({ p, x, y, zahl, stellen }) {
  const text = String(zahl).padStart(stellen, "0");
  return [...text].map((z, i) => (
    <Walze
      key={i}
      p={p}
      x={x + i * (B + LUFT)}
      y={y}
      zeichen={ZIFFERN}
      wert={Number(z)}
    />
  ));
}

// Raedchen mit Zaehnen (fest), seitlich im Gewerk
function Raedchen({ x, y, r, zaehne }) {
  const pfad = Array.from({ length: zaehne * 2 }, (_, i) => {
    const w = (i * Math.PI) / zaehne;
    const rr = i % 2 ? r * 0.82 : r;
    return `${i ? "L" : "M"}${(x + rr * Math.cos(w)).toFixed(2)} ${(y + rr * Math.sin(w)).toFixed(2)}`;
  }).join("");
  return (
    <g>
      <path
        d={`${pfad}Z`}
        fill="#160e06"
        stroke="#a8743a"
        strokeOpacity="0.45"
        strokeWidth="0.5"
      />
      <circle cx={x} cy={y} r={r * 0.18} fill="#4a3418" />
    </g>
  );
}

function Bruecke({ p, y, breite }) {
  const x = MITTE.x - breite / 2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={breite}
        height="4"
        rx="2"
        fill={`url(#${p}-bruecke)`}
      />
      {[x + 3, x + breite - 3].map((sx) => (
        <g key={sx}>
          <circle cx={sx} cy={y + 2} r="1.6" fill="#2a1d0e" />
          <line
            x1={sx - 1.1}
            y1={y + 2}
            x2={sx + 1.1}
            y2={y + 2}
            stroke="#8a6a38"
            strokeWidth="0.4"
          />
        </g>
      ))}
    </g>
  );
}

const Zaehlwerk = memo(function Zaehlwerk({
  tag,
  monat,
  jahr,
  stunde,
  hell,
  mittel,
  dunkel,
  praefix = "zw",
  rollt = true, // Walzen rollen sichtbar; beim Drehen eines Rings springen sie nur mit (Rechenzeit)
  parallaxe = false, // Gewerk rueckt mit der Neigung des Geraets (neigung.js), der Grund bleibt als Wand
}) {
  const werk = useRef(null);
  useEffect(() => {
    if (!parallaxe) return undefined;
    return neigungAbonnieren(({ x, y }) => {
      if (werk.current)
        werk.current.style.transform = `translate(${x * TIEFE}px, ${y * TIEFE}px)`;
    });
  }, [parallaxe]);
  const p = praefix;
  const cx = MITTE.x;
  const cy = MITTE.y;
  // eine Zeile: Tag, Monat, Jahr
  const nameBreite = 27;
  const ABSTAND = 3;
  const zeile =
    2 * B + LUFT + ABSTAND + nameBreite + ABSTAND + 4 * B + 3 * LUFT;
  const x = cx - zeile / 2;
  const y = cy - 17;
  // Stundenrad darunter: man sieht nur seinen oberen Rand
  const rad = { x: cx, y: cy + 52, r: 34 };
  const marke = rad.y - rad.r - 1;
  return (
    <g className={rollt ? "zw zw-rollt" : "zw"} pointerEvents="none">
      <defs>
        <clipPath id={`${p}-linse`}>
          <circle cx={cx} cy={cy} r={LINSE} />
        </clipPath>
        <radialGradient id={`${p}-grund`} cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor="#140c05" />
          <stop offset="1" stopColor="#020100" />
        </radialGradient>
        {/* Mattscheibe hinter dem Gewerk: warmes Licht, das zwischen den Teilen durchscheint */}
        <radialGradient id={`${p}-licht`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffb85c" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffb85c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-elfenbein`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8661f" />
          <stop offset="0.5" stopColor="#ffd890" />
          <stop offset="1" stopColor="#9a5a18" />
        </linearGradient>
        <linearGradient id={`${p}-rundung`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#050200" stopOpacity="0.85" />
          <stop offset="0.3" stopColor="#050200" stopOpacity="0" />
          <stop offset="0.7" stopColor="#050200" stopOpacity="0" />
          <stop offset="1" stopColor="#050200" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${p}-bruecke`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4120" />
          <stop offset="0.3" stopColor="#1e140a" />
          <stop offset="1" stopColor="#080503" />
        </linearGradient>
        <radialGradient
          id={`${p}-radflaeche`}
          cx={rad.x}
          cy={rad.y}
          r={rad.r}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.5" stopColor="#3a220a" />
          <stop offset="0.82" stopColor="#ffcf80" />
          <stop offset="1" stopColor="#8a4f14" />
        </radialGradient>
        <radialGradient id={`${p}-vignette`} cx="50%" cy="50%" r="50%">
          <stop offset="0.62" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.75" />
        </radialGradient>
        <radialGradient id={`${p}-glanz`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fffaf0" stopOpacity="0.4" />
          <stop offset="1" stopColor="#fffaf0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${p}-fassung`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hell} />
          <stop offset="0.5" stopColor={mittel} />
          <stop offset="1" stopColor={dunkel} />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${p}-linse)`}>
        <circle cx={cx} cy={cy} r={LINSE} fill={`url(#${p}-grund)`} />
        <g ref={werk}>
          <circle cx={cx} cy={cy} r={LINSE * 0.8} fill={`url(#${p}-licht)`} />
          <Raedchen x={cx - 44} y={cy - 40} r={11} zaehne={14} />
          <Raedchen x={cx + 30} y={cy - 46} r={14} zaehne={18} />
          <Raedchen x={cx - 50} y={cy + 22} r={9} zaehne={12} />
          <Raedchen x={cx + 52} y={cy + 18} r={10} zaehne={12} />
          {/* Datum in einer Zeile */}
          <Zahl p={p} x={x} y={y} zahl={tag} stellen={2} />
          <Walze
            p={p}
            x={x + 2 * B + LUFT + ABSTAND}
            y={y}
            breite={nameBreite}
            zeichen={MONATE_KURZ}
            wert={monat}
          />
          <Zahl
            p={p}
            x={x + 2 * B + LUFT + 2 * ABSTAND + nameBreite}
            y={y}
            zahl={jahr}
            stellen={4}
          />
          <Bruecke p={p} y={y - 6} breite={zeile + 8} />
          <Bruecke p={p} y={y + H + 2} breite={zeile + 8} />
          {/* Stundenrad: Elfenbeinscheibe mit den Stunden am Rand, dreht die eingestellte nach oben */}
          <g
            className="zw-stundenrad"
            style={{
              transform: `rotate(${-stunde * 15}deg)`,
              transformOrigin: `${rad.x}px ${rad.y}px`,
            }}
          >
            <circle
              cx={rad.x}
              cy={rad.y}
              r={rad.r}
              fill={`url(#${p}-radflaeche)`}
            />
            {Array.from({ length: 24 }, (_, h) => (
              <g key={h} transform={`rotate(${h * 15} ${rad.x} ${rad.y})`}>
                <line
                  x1={rad.x}
                  y1={rad.y - rad.r}
                  x2={rad.x}
                  y2={rad.y - rad.r + 2}
                  stroke="#1a0e04"
                  strokeWidth="0.5"
                />
                <text x={rad.x} y={rad.y - rad.r + 7.5} className="zw-stunde">
                  {h}
                </text>
              </g>
            ))}
            <circle cx={rad.x} cy={rad.y} r="5" fill="#0d0804" />
          </g>
          {/* feste Marke ueber dem Rad */}
          <path
            d={`M${cx - 3} ${marke - 4}L${cx + 3} ${marke - 4}L${cx} ${marke + 1}Z`}
            fill="#1a110a"
            stroke="#ffb85c"
            strokeOpacity="0.6"
            strokeWidth="0.4"
          />
        </g>
        {/* Linse: dunkler Rand, Glanzlicht oben links */}
        <circle cx={cx} cy={cy} r={LINSE} fill={`url(#${p}-vignette)`} />
        <ellipse
          cx={cx - 22}
          cy={cy - 34}
          rx="26"
          ry="11"
          transform={`rotate(-28 ${cx - 22} ${cy - 34})`}
          fill={`url(#${p}-glanz)`}
        />
      </g>
      {/* Fassung: Fase oben im Licht, unten im Schatten */}
      <circle
        cx={cx}
        cy={cy}
        r={LINSE + 2}
        fill="none"
        stroke={`url(#${p}-fassung)`}
        strokeWidth="4"
      />
    </g>
  );
});

export default Zaehlwerk;
