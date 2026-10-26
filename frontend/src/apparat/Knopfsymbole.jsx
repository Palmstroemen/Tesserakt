// Gravierte Symbole auf den Spielknoepfen der Datumsseite (statt der Buchstaben A, B, C): Sonne fuer die
// Persoenlichkeit (A), Sanduhr fuer den Rueckblick (B), das geteilte Sonne-Mond-Medaillon vom Deckel des
// Kaestchens fuer die Beziehung (C, Sonne in Gold, Mond in Silber). Gezeichnet um (0, 0) fuer einen Knopf mit
// Innenradius 24; die Gravur (Schatten oben, Licht unten) kommt vom Filter am Knopf.

const GOLD = "#e8c98a";
const SILBER = "#e6eaee";

const polar = (r, w) => [r * Math.sin(w), -r * Math.cos(w)];
const punkt = ([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`;

// Strahl als schmales, leicht geschwungenes Blatt von r1 bis r2 um den Winkel w
function strahl(w, r1, r2, breite, schwung = 0) {
  const a = polar(r1, w - breite);
  const b = polar(r1, w + breite);
  const spitze = polar(r2, w + schwung);
  const ka = polar((r1 + r2) / 2, w - breite * 0.5 + schwung * 1.6);
  const kb = polar((r1 + r2) / 2, w + breite * 0.5 + schwung * 1.6);
  return `M${punkt(a)}Q${punkt(ka)} ${punkt(spitze)}Q${punkt(kb)} ${punkt(b)}Z`;
}

function Sonne({ farbe }) {
  const strahlen = Array.from({ length: 16 }, (_, i) =>
    strahl((i * Math.PI) / 8, 9, i % 2 ? 14.5 : 18.5, i % 2 ? 0.15 : 0.2),
  ).join("");
  return (
    <g fill={farbe}>
      <path d={strahlen} />
      <circle r="7.5" />
    </g>
  );
}

function Sanduhr({ farbe }) {
  return (
    <g fill={farbe}>
      <rect x="-11" y="-17.5" width="22" height="3" rx="1.2" />
      <rect x="-11" y="14.5" width="22" height="3" rx="1.2" />
      <rect x="-10.6" y="-15" width="1.6" height="30" />
      <rect x="9" y="-15" width="1.6" height="30" />
      <path
        d="M-7 -14.5C-7 -5 -1.6 -3 -1.6 0C-1.6 3 -7 5 -7 14.5M7 -14.5C7 -5 1.6 -3 1.6 0C1.6 3 7 5 7 14.5"
        fill="none"
        stroke={farbe}
        strokeWidth="1.5"
      />
      {/* Sand: oben ein Rest, ein feiner Strahl, unten der Kegel */}
      <path d="M-5.4 -8L5.4 -8C4.4 -4.6 1.4 -2.6 0 -1C-1.4 -2.6 -4.4 -4.6 -5.4 -8Z" />
      <rect x="-0.4" y="-1" width="0.8" height="9" />
      <path d="M-6.3 14C-5 9 -2 7.6 0 7.2C2 7.6 5 9 6.3 14Z" />
    </g>
  );
}

// wie auf dem Deckel: ein Medaillon mit Perlrand, links die Sonne mit geschwungenen Strahlen, rechts der Mond
function SonneMond() {
  const perlen = Array.from({ length: 28 }, (_, i) => {
    const w = (i * Math.PI * 2) / 28;
    const [x, y] = polar(18.5, w);
    return (
      <circle
        key={i}
        cx={x}
        cy={y}
        r="0.9"
        fill={w < Math.PI ? SILBER : GOLD}
      />
    );
  });
  const strahlen = Array.from({ length: 7 }, (_, i) =>
    strahl(Math.PI + ((i + 0.5) * Math.PI) / 7, 8.8, 16, 0.16, -0.12),
  ).join("");
  return (
    <g>
      {perlen}
      <g fill={GOLD}>
        <path d="M0 -8A8 8 0 0 0 0 8Z" />
        <path d={strahlen} />
      </g>
      <g fill={SILBER}>
        <path d="M0 -16A16 16 0 0 1 0 16A10 16 0 0 0 0 -16Z" />
        <path d="M4.5 -7l0.6 1.4 1.4 0.6 -1.4 0.6 -0.6 1.4 -0.6 -1.4 -1.4 -0.6 1.4 -0.6Z" />
        <path d="M4 5.5l0.5 1.1 1.1 0.5 -1.1 0.5 -0.5 1.1 -0.5 -1.1 -1.1 -0.5 1.1 -0.5Z" />
      </g>
    </g>
  );
}

export default function Knopfsymbol({ spiel, x, y, filter }) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      filter={filter}
      className="dr-symbol"
      pointerEvents="none"
    >
      {spiel === "A" ? <Sonne farbe={GOLD} /> : null}
      {spiel === "B" ? <Sanduhr farbe={GOLD} /> : null}
      {spiel === "C" ? <SonneMond /> : null}
    </g>
  );
}
