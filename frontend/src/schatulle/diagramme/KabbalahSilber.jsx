// Kabbalah im Auge: der Baum des Lebens in Silber eingepraegt, Hervorhebungen als farbige Edelsteine.
// Fachlich wie Visuals.md 2.5: zehn Sephiroth, 22 Pfade (mit ihren hebraeischen Buchstaben aus
// kabbalah_pfade.json), aktive Sephira und aktiver Pfad hervorgehoben. Reines SVG (auch fuer den Druck).
// Anordnung wie ueblich (vom Betrachter aus): Chokmah, Chesed, Netzach rechts; Binah, Geburah, Hod links.
const G = 300;
const M = G / 2;
const R = 55; // Sechseckradius = Abstand benachbarter Sephiroth
const OBEN = M - 2 * R - 4; // y von Kether: Baum (Kether..Malkuth = 4R) mittig, etwas hoeher wegen der Namen
const KNOTEN_R = 15;

function ecke(winkel) {
  const w = ((winkel - 90) * Math.PI) / 180;
  return { x: M + R * Math.cos(w), y: OBEN + R + R * Math.sin(w) };
}
const S6 = ecke(180);
const KNOTEN = {
  1: ecke(0),
  2: ecke(60),
  3: ecke(300),
  4: ecke(120),
  5: ecke(240),
  6: S6,
  7: { x: ecke(120).x, y: ecke(120).y + R },
  8: { x: ecke(240).x, y: ecke(240).y + R },
  9: { x: S6.x, y: S6.y + R },
  10: { x: S6.x, y: S6.y + 2 * R },
};

// Lage des Buchstabens auf dem Pfad (0 = Anfang, 1 = Ende): meist die Mitte; Kether-Tiphereth kreuzt
// zwei Querpfade, die Seitenpfade Chesed-Netzach und Geburah-Hod liegen auf Hoehe des Namens Tiphereth
function lageBuchstabe(p) {
  if (p.from === 1 && p.to === 6) return 0.3;
  if ((p.from === 4 && p.to === 7) || (p.from === 5 && p.to === 8)) return 0.36;
  return 0.5;
}

// Farben der Sephiroth nach der "Koeniginnen-Skala" (Golden Dawn, Crowley 777): Edelsteinfarbe
const STEIN = {
  1: ["#ffffff", "#d9e4ff"], // Kether: weisser Glanz (Diamant)
  2: ["#d6dbe2", "#7d8794"], // Chokmah: grau
  3: ["#5a5a78", "#15151f"], // Binah: schwarz
  4: ["#7fa6ff", "#1f3fa8"], // Chesed: blau
  5: ["#ff7a6a", "#a3141a"], // Geburah: scharlachrot
  6: ["#ffe27a", "#c48a10"], // Tiphereth: gold
  7: ["#7ff0b0", "#0f7a45"], // Netzach: smaragdgruen
  8: ["#ffbf7a", "#c2560f"], // Hod: orange
  9: ["#c79bff", "#5a23a8"], // Yesod: violett
  10: ["#e0c27a", "#6b4a1f"], // Malkuth: Zitrin/Olive/Rostbraun (vereinfacht)
};

function Edelstein({ x, y, r, nummer, id }) {
  const [hell, dunkel] = STEIN[nummer] ?? STEIN[6];
  // geschliffener Stein: Verlauf, Facetten, Lichtreflex
  const facetten = Array.from({ length: 8 }, (_, i) => {
    const w = (i * Math.PI) / 4 + Math.PI / 8;
    return `${x + r * 0.55 * Math.cos(w)},${y + r * 0.55 * Math.sin(w)}`;
  }).join(" ");
  return (
    <g className="ks-stein">
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.25" stopColor={hell} />
          <stop offset="1" stopColor={dunkel} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r + 2.2} className="ks-fassung" />
      <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
      <polygon
        points={facetten}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.35"
        strokeWidth="0.6"
      />
      <ellipse
        cx={x - r * 0.32}
        cy={y - r * 0.38}
        rx={r * 0.28}
        ry={r * 0.14}
        fill="#fff"
        opacity="0.75"
        transform={`rotate(-30 ${x - r * 0.32} ${y - r * 0.38})`}
      />
    </g>
  );
}

export default function KabbalahSilber({ payload }) {
  if (!payload || payload.chartType !== "kabbalahTree") return null;
  const aktiv = payload.activeSephira?.number;
  const pfad = payload.activePath;
  const namen = Object.fromEntries(
    (payload.sephirothList ?? []).map((s) => [s.number, s.name]),
  );
  const pfade = payload.paths ?? [];

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="ks"
      role="img"
      aria-label={`Baum des Lebens, aktive Sephira ${namen[aktiv] ?? ""}`}
    >
      <defs>
        <radialGradient id="ks-silber" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor="#f6f8fa" />
          <stop offset="0.55" stopColor="#c3c9d0" />
          <stop offset="1" stopColor="#6e757d" />
        </radialGradient>
        {/* gebuersteter Schliff: feines waagrechtes Rauschen */}
        <filter id="ks-schliff" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9 0.012"
            numOctaves="2"
            seed="7"
            result="rauschen"
          />
          <feColorMatrix
            in="rauschen"
            type="saturate"
            values="0"
            result="grau"
          />
          <feComponentTransfer in="grau" result="leise">
            <feFuncA type="linear" slope="0" intercept="0.16" />
          </feComponentTransfer>
          <feComposite
            in="leise"
            in2="SourceGraphic"
            operator="in"
            result="maske"
          />
          <feBlend in="SourceGraphic" in2="maske" mode="multiply" />
        </filter>
        {/* eingepraegt: dunkle Kante oben links, Lichtkante unten rechts */}
        <filter id="ks-praegung" x="-10%" y="-10%" width="120%" height="120%">
          <feOffset in="SourceAlpha" dx="-0.7" dy="-0.9" result="o" />
          <feFlood floodColor="#2b3036" floodOpacity="0.75" />
          <feComposite in2="o" operator="in" result="schatten" />
          <feOffset in="SourceAlpha" dx="0.6" dy="0.9" result="u" />
          <feFlood floodColor="#ffffff" floodOpacity="0.9" />
          <feComposite in2="u" operator="in" result="licht" />
          <feMerge>
            <feMergeNode in="licht" />
            <feMergeNode in="schatten" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* feinere Praegung fuer Schrift (die kraeftige wirkt bei kleiner Schrift doppelt) */}
        <filter
          id="ks-praegung-fein"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feOffset in="SourceAlpha" dx="0.3" dy="0.45" result="u" />
          <feFlood floodColor="#ffffff" floodOpacity="0.85" />
          <feComposite in2="u" operator="in" result="licht" />
          <feMerge>
            <feMergeNode in="licht" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ks-leuchten" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" result="w" />
          <feMerge>
            <feMergeNode in="w" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* base: Silberplatte */}
      <circle
        cx={M}
        cy={M}
        r={G / 2}
        fill="url(#ks-silber)"
        filter="url(#ks-schliff)"
      />
      <circle
        cx={M}
        cy={M}
        r={G / 2 - 9}
        className="ks-zierring"
        filter="url(#ks-praegung)"
      />

      {/* relation: Pfade als eingepraegte Kanaele, mit Buchstaben */}
      <g filter="url(#ks-praegung)">
        {pfade.map((p) => {
          const a = KNOTEN[p.from];
          const b = KNOTEN[p.to];
          return (
            <line
              key={p.number}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="ks-pfad"
            />
          );
        })}
      </g>
      <g filter="url(#ks-praegung-fein)">
        {pfade.map((p) => {
          const a = KNOTEN[p.from];
          const b = KNOTEN[p.to];
          // Buchstabe auf der Mitte; bei sich kreuzenden Pfaden (2-3 / 4-5 / 7-8) leicht versetzt
          const t = lageBuchstabe(p);
          return (
            <text
              key={`b${p.number}`}
              x={a.x + (b.x - a.x) * t}
              y={a.y + (b.y - a.y) * t}
              dy="0.35em"
              className="ks-buchstabe"
            >
              {p.letter}
            </text>
          );
        })}
      </g>

      {/* aktiver Pfad: farbige Emaille-Einlage */}
      {pfad && KNOTEN[pfad.from] && KNOTEN[pfad.to] ? (
        <line
          x1={KNOTEN[pfad.from].x}
          y1={KNOTEN[pfad.from].y}
          x2={KNOTEN[pfad.to].x}
          y2={KNOTEN[pfad.to].y}
          stroke={STEIN[aktiv]?.[0] ?? "#ffe27a"}
          className="ks-pfad-aktiv"
          filter="url(#ks-leuchten)"
        />
      ) : null}

      {/* data: Sephiroth als eingepraegte Medaillons */}
      <g filter="url(#ks-praegung)">
        {Object.entries(KNOTEN).map(([n, k]) => (
          <g key={n}>
            <circle cx={k.x} cy={k.y} r={KNOTEN_R} className="ks-knoten" />
            <circle
              cx={k.x}
              cy={k.y}
              r={KNOTEN_R - 3.5}
              className="ks-knoten-innen"
            />
          </g>
        ))}
      </g>

      {/* highlight: Edelsteine fuer die aktive Sephira und den Buchstaben des aktiven Pfads */}
      {aktiv && KNOTEN[aktiv] ? (
        <Edelstein
          x={KNOTEN[aktiv].x}
          y={KNOTEN[aktiv].y}
          r={KNOTEN_R - 3}
          nummer={aktiv}
          id="ks-stein-sephira"
        />
      ) : null}
      {pfad && KNOTEN[pfad.from] && KNOTEN[pfad.to]
        ? (() => {
            const a = KNOTEN[pfad.from];
            const b = KNOTEN[pfad.to];
            const t = lageBuchstabe(pfad);
            const x = a.x + (b.x - a.x) * t;
            const y = a.y + (b.y - a.y) * t;
            return (
              <g>
                <Edelstein
                  x={x}
                  y={y}
                  r={7.5}
                  nummer={aktiv}
                  id="ks-stein-pfad"
                />
                <text x={x} y={y} dy="0.36em" className="ks-buchstabe-stein">
                  {pfad.letter}
                </text>
              </g>
            );
          })()
        : null}

      {/* label: Namen neben den Knoten (linke Saeule links, sonst rechts, Kether darueber) */}
      <g filter="url(#ks-praegung-fein)">
        {Object.entries(KNOTEN).map(([n, k]) => {
          const nr = Number(n);
          const links = nr === 3 || nr === 5 || nr === 8;
          const oben = nr === 1;
          return (
            <text
              key={n}
              x={oben ? k.x : k.x + (links ? -1 : 1) * (KNOTEN_R + 3)}
              y={oben ? k.y - KNOTEN_R - 4 : k.y}
              dy={oben ? 0 : "0.35em"}
              textAnchor={oben ? "middle" : links ? "end" : "start"}
              className={nr === aktiv ? "ks-name aktiv" : "ks-name"}
            >
              {namen[n]}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
