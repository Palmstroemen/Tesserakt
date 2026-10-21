// Hellenistisch im Auge: ein schwarzfiguriger Teller. Am Rand die zwoelf Haeuser als griechische Zahlzeichen,
// gegen den Uhrzeigersinn, Haus 1 unten (so entsteht keine Uhr); das Profektionshaus mit Kreide umkringelt.
// Darin ein Maeanderband und in der Mitte, schwarzfigurig mit eingeritzten Linien, das Attribut des
// Jahresherrschers mit seinem Namen als Beischrift (wie auf Vasen). Fachlich: Visuals.md 2.2 (Profektion).
const G = 300;
const M = G / 2;
const R_RAND = 150;
const R_GLASUR = 141; // schwarz glasierter Rand
const R_ZAHL = 126; // Zahlzeichen
const R_BAND_AUSSEN = 111;
const R_BAND_INNEN = 96;
const R_ZIFFER = 87; // kleine arabische Ziffern innen am Maeander
const R_NAME = 64; // Bogen fuer die Namen ueber und unter dem Symbol

// griechische Zahlzeichen mit Keraia; 6 = Stigma
const ZAHLEN = [
  "Α",
  "Β",
  "Γ",
  "Δ",
  "Ε",
  "Ϛ",
  "Ζ",
  "Η",
  "Θ",
  "Ι",
  "ΙΑ",
  "ΙΒ",
].map((z) => `${z}ʹ`);

// Haus n: unten beginnend, gegen den Uhrzeigersinn (Bildschirmwinkel, 90° = unten)
function hausWinkel(n) {
  return ((90 - (n - 1) * 30) * Math.PI) / 180;
}

// Jahresherrscher: Gott (griechische Beischrift und lesbarer Name), Attribut
const HERRSCHER = {
  sonne: { name: "ΗΛΙΟΣ", lesbar: "Helios", bild: "sonne" },
  mond: { name: "ΣΕΛΗΝΗ", lesbar: "Selene", bild: "mond" },
  merkur: { name: "ΕΡΜΗΣ", lesbar: "Hermes", bild: "merkur" },
  venus: { name: "ΑΦΡΟΔΙΤΗ", lesbar: "Aphrodite", bild: "venus" },
  mars: { name: "ΑΡΗΣ", lesbar: "Ares", bild: "mars" },
  jupiter: { name: "ΖΕΥΣ", lesbar: "Zeus", bild: "jupiter" },
  saturn: { name: "ΚΡΟΝΟΣ", lesbar: "Kronos", bild: "saturn" },
};

// Attribute als schwarze Silhouetten in einem 100 x 100 Feld; "ritz" = eingeritzte Linien (Tonfarbe)
const ATTRIBUTE = {
  // Zeus: Blitzbuendel (Keraunos), an beiden Enden gezackt, Griff in der Mitte
  jupiter: {
    form:
      "M50 2 L56 24 L66 8 L61 32 L54 44 L54 56 L61 68 L66 92 L56 76 L50 98 L44 76 L34 92 L39 68 L46 56 " +
      "L46 44 L39 32 L34 8 L44 24 Z",
    ritz: "M46 47 L54 47 M46 53 L54 53 M50 8 L50 40 M50 60 L50 92",
  },
  // Kronos: Sichel (Harpe)
  saturn: {
    form: "M22 34 A34 34 0 1 1 64 82 L58 74 A25 25 0 1 0 30 38 Z M60 76 L70 70 L92 96 L82 100 Z",
    ritz: "M28 34 A30 30 0 0 1 70 30 M66 78 L86 98",
  },
  // Ares: Rundschild (Aspis) und Speer
  mars: {
    form: "M14 94 L84 10 L88 13 L18 97 Z M84 10 L96 2 L91 16 Z M50 26 A30 30 0 1 1 49.9 26 Z",
    ritz: "M50 32 A24 24 0 1 1 49.9 32 M50 46 A10 10 0 1 1 49.9 46",
  },
  // Helios: Strahlensonne
  sonne: {
    form:
      "M50 32 A18 18 0 1 1 49.9 32 Z " +
      Array.from({ length: 12 }, (_, i) => {
        const w = (i * Math.PI) / 6;
        const p = (r, d) =>
          `${50 + r * Math.cos(w + d)} ${50 + r * Math.sin(w + d)}`;
        return `M${p(22, -0.13)} L${p(46, 0)} L${p(22, 0.13)} Z`;
      }).join(" "),
    ritz: "M50 38 A12 12 0 1 1 49.9 38",
  },
  // Selene: Mondsichel
  mond: {
    form: "M62 8 A42 42 0 1 0 62 92 A52 52 0 0 1 62 8 Z",
    ritz: "M44 22 A36 36 0 0 0 44 78",
  },
  // Aphrodite: Muschel
  venus: {
    form: "M50 92 L12 44 A40 40 0 0 1 88 44 Z M40 92 L60 92 L56 100 L44 100 Z",
    ritz: "M50 90 L50 10 M50 90 L30 16 M50 90 L70 16 M50 90 L16 34 M50 90 L84 34 M50 90 L13 50 M50 90 L87 50",
  },
  // Hermes: Heroldstab (Kerykeion)
  merkur: {
    form:
      "M47 18 L53 18 L53 100 L47 100 Z M50 6 A7 7 0 1 1 49.9 6 Z " +
      "M46 22 C30 10 14 16 8 26 C22 24 32 26 46 30 Z M54 22 C70 10 86 16 92 26 C78 24 68 26 54 30 Z",
    schlangen:
      "M50 34 C70 40 70 52 50 58 C30 64 30 76 50 82 M50 34 C30 40 30 52 50 58 C70 64 70 76 50 82",
    ritz: "M14 22 C24 20 34 22 44 26 M86 22 C76 20 66 22 56 26",
  },
};

// Maeander als Ring: N Einheiten, jede ein Hakenmuster in einem 4 x 4 Raster (u laengs, v nach aussen)
function maeander(n) {
  const haken = [
    [0, 0],
    [0, 3.4],
    [3, 3.4],
    [3, 0.9],
    [1.1, 0.9],
    [1.1, 2.3],
    [2, 2.3],
  ];
  const punkt = (i, u, v) => {
    const w = ((i + u / 4) / n) * Math.PI * 2;
    const r = R_BAND_INNEN + 1.5 + (v / 4) * (R_BAND_AUSSEN - R_BAND_INNEN - 3);
    return `${(M + r * Math.cos(w)).toFixed(2)},${(M + r * Math.sin(w)).toFixed(2)}`;
  };
  return Array.from({ length: n }, (_, i) =>
    haken.map(([u, v]) => punkt(i, u, v)).join(" "),
  );
}
const MAEANDER = maeander(30);

export default function HellenistischTeller({ payload }) {
  if (!payload || payload.chartType !== "profectionChart") return null;
  const haus = payload.activeHouse;
  const herr = HERRSCHER[payload.yearLord];
  const bild = herr ? ATTRIBUTE[herr.bild] : null;
  const w = haus ? hausWinkel(haus) : 0;
  const kreide = { x: M + R_ZAHL * Math.cos(w), y: M + R_ZAHL * Math.sin(w) };
  const kreideDrehung = (w * 180) / Math.PI - 90; // laengs zur gedrehten Zahl

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="ht"
      role="img"
      aria-label={`Profektion: Haus ${haus}${herr ? `, Jahresherrscher ${herr.name}` : ""}`}
    >
      <defs>
        <radialGradient id="ht-ton" cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#e39a62" />
          <stop offset="0.6" stopColor="#c46a36" />
          <stop offset="1" stopColor="#8e4320" />
        </radialGradient>
        <radialGradient id="ht-glanz" cx="35%" cy="25%" r="60%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* Kreide: ausgefranster, koerniger Strich */}
        <filter id="ht-kreide" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2"
            numOctaves="2"
            seed="5"
            result="r"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="r"
            scale="2.2"
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

      {/* base: Tonteller, schwarz glasierter Rand */}
      <circle cx={M} cy={M} r={R_RAND} fill="url(#ht-ton)" />
      <circle
        cx={M}
        cy={M}
        r={(R_RAND + R_GLASUR) / 2}
        className="ht-glasur"
        strokeWidth={R_RAND - R_GLASUR}
      />
      <circle cx={M} cy={M} r={R_BAND_AUSSEN + 2} className="ht-linie" />
      <circle cx={M} cy={M} r={R_BAND_INNEN - 2} className="ht-linie" />

      {/* Maeanderband */}
      <g className="ht-maeander">
        {MAEANDER.map((p, i) => (
          <polyline key={i} points={p} />
        ))}
      </g>

      {/* Zahlzeichen der Haeuser */}
      {/* entlang des Kreises gedreht, Fuss zum Rand (Haus 1 unten steht aufrecht); innen am Maeander klein
          die arabische Ziffer als Lesehilfe */}
      {ZAHLEN.map((z, i) => {
        const a = hausWinkel(i + 1);
        const drehung = (a * 180) / Math.PI - 90;
        const p = { x: M + R_ZAHL * Math.cos(a), y: M + R_ZAHL * Math.sin(a) };
        const q = {
          x: M + R_ZIFFER * Math.cos(a),
          y: M + R_ZIFFER * Math.sin(a),
        };
        return (
          <g key={z}>
            <text
              x={p.x}
              y={p.y}
              dy="0.36em"
              className="ht-zahl"
              transform={`rotate(${drehung} ${p.x} ${p.y})`}
            >
              {z}
            </text>
            <text
              x={q.x}
              y={q.y}
              dy="0.36em"
              className="ht-ziffer"
              transform={`rotate(${drehung} ${q.x} ${q.y})`}
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Mitte: Attribut des Jahresherrschers, schwarzfigurig mit Ritzlinien, genau mittig; darueber im Bogen
          die griechische Beischrift, darunter im Bogen der lesbare Name */}
      {bild ? (
        <g transform={`translate(${M - 47.5} ${M - 47.5}) scale(0.95)`}>
          <path d={bild.form} className="ht-figur" />
          {bild.schlangen ? (
            <path d={bild.schlangen} className="ht-schlange" />
          ) : null}
          <path d={bild.ritz} className="ht-ritz" />
        </g>
      ) : null}
      {herr ? (
        <>
          <path
            id="ht-bogen-oben"
            d={`M ${M - R_NAME} ${M} A ${R_NAME} ${R_NAME} 0 0 1 ${M + R_NAME} ${M}`}
            fill="none"
          />
          <path
            id="ht-bogen-unten"
            d={`M ${M - R_NAME - 7} ${M} A ${R_NAME + 7} ${R_NAME + 7} 0 0 0 ${M + R_NAME + 7} ${M}`}
            fill="none"
          />
          <text className="ht-beischrift">
            <textPath
              href="#ht-bogen-oben"
              xlinkHref="#ht-bogen-oben"
              startOffset="50%"
              textAnchor="middle"
            >
              {herr.name}
            </textPath>
          </text>
          <text className="ht-lesbar">
            <textPath
              href="#ht-bogen-unten"
              xlinkHref="#ht-bogen-unten"
              startOffset="50%"
              textAnchor="middle"
            >
              {herr.lesbar}
            </textPath>
          </text>
        </>
      ) : null}

      {/* Kreidekringel um das Profektionshaus */}
      {haus ? (
        <g filter="url(#ht-kreide)" className="ht-kreide">
          <ellipse
            cx={kreide.x}
            cy={kreide.y}
            rx="15"
            ry="12"
            transform={`rotate(${kreideDrehung - 12} ${kreide.x} ${kreide.y})`}
          />
          <ellipse
            cx={kreide.x + 1}
            cy={kreide.y - 0.5}
            rx="14"
            ry="12.8"
            transform={`rotate(${kreideDrehung + 8} ${kreide.x} ${kreide.y})`}
          />
        </g>
      ) : null}

      {/* Glanz der Glasur */}
      <circle
        cx={M}
        cy={M}
        r={R_RAND}
        fill="url(#ht-glanz)"
        pointerEvents="none"
      />
    </svg>
  );
}
