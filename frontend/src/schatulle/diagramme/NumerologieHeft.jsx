// Numerologie im Auge: eine Mathe-Hausuebung auf kariertem Papier. Oben das Geburtsdatum in Fuellertinte,
// darunter je Teil (Tag, Monat, Jahr) eine Zeile in Farbstift mit der Quersumme; im Datum ist der Teil in
// derselben Farbe unterstrichen. Dann Summenstrich, Summe und Quersumme; das Ergebnis ist in Rot
// eingekringelt, schraeg darunter in anderer Handschrift "Meisterzahl!" (bei 11, 22, 33) oder "Lebenszahl".
// Fachlich wie das Backend (numerology_chart.py): Quersummen bis 1-9, Meisterzahlen 11, 22, 33 bleiben.
// Schriften: Patrick Hand (Schueler), Caveat (Lehrerin), beide SIL OFL, zugeschnitten.
const G = 300;
const M = G / 2;
const MEISTER = [11, 22, 33];
const ZOOM = 1.1;

const TINTE = "#1d2a6b";
const STIFT = { tag: "#2e8b3e", monat: "#e07a10", jahr: "#7a3fb0" };
const ROT = "#d0201a";

// Rechenweg einer Quersumme wie im Backend: "1+9+8+5 = 23 → 5"; einstellig oder Meisterzahl: nur die Zahl
function quersumme(n) {
  if (n <= 9 || MEISTER.includes(n)) return { weg: "", wert: n };
  const ziffern = String(n).split("").map(Number);
  let s = ziffern.reduce((a, b) => a + b, 0);
  const erster = `${ziffern.join("+")} = ${s}`;
  while (s > 9 && !MEISTER.includes(s))
    s = String(s)
      .split("")
      .map(Number)
      .reduce((a, b) => a + b, 0);
  return {
    weg:
      s === ziffern.reduce((a, b) => a + b, 0)
        ? `${ziffern.join("+")} =`
        : `${erster} →`,
    wert: s,
  };
}

// ungefaehre Breite in der Schuelerschrift (fuer Unterstreichungen und Abstaende)
const breite = (text, gr) => text.length * gr * 0.47;

// Unterstrich von Hand: leicht gewellt und schraeg
function Strich({ x1, x2, y, farbe, breit = 1.6, saat = 1 }) {
  const m = (x1 + x2) / 2;
  const w = ((saat * 37) % 7) / 7 - 0.5;
  return (
    <path
      d={`M ${x1} ${y + w * 0.6} Q ${m} ${y + 1.4 + w} ${x2} ${y - 0.4 - w * 0.5}`}
      stroke={farbe}
      strokeWidth={breit}
      fill="none"
      strokeLinecap="round"
      className="nh-strich"
    />
  );
}

export default function NumerologieHeft({ payload }) {
  if (!payload || payload.chartType !== "numerologyChart") return null;
  const { day, month, year } = payload.birthDateComponents ?? {};
  if (!day) return null;
  const zwei = (n) => String(n).padStart(2, "0");

  const qTag = quersumme(day);
  const qMonat = quersumme(month);
  const qJahr = quersumme(year);
  const summe = qTag.wert + qMonat.wert + qJahr.wert;
  const qSumme = quersumme(summe);
  const ergebnis = payload.lifePathNumber ?? qSumme.wert;
  const meister = MEISTER.includes(ergebnis);

  // Datum oben, Teile einzeln gesetzt, damit die Unterstreichungen passen
  const GR_DATUM = 22;
  const teile = [
    { t: zwei(day), farbe: STIFT.tag },
    { t: ".", farbe: null },
    { t: zwei(month), farbe: STIFT.monat },
    { t: ".", farbe: null },
    { t: String(year), farbe: STIFT.jahr },
  ];
  const gesamt = teile.reduce(
    (a, t) => a + breite(t.t, GR_DATUM) * (t.t === "." ? 0.6 : 1),
    0,
  );
  let x = M - gesamt / 2;
  const datum = teile.map((t) => {
    const b = breite(t.t, GR_DATUM) * (t.t === "." ? 0.6 : 1);
    const teil = { ...t, x, b };
    x += b;
    return teil;
  });

  const GR = 13;
  const LINKS = 40;
  const WERT = 146; // Beginn der Rechnung
  const zeilen = [
    { label: "Quersumme Tag:", q: qTag, farbe: STIFT.tag, y: 106 },
    { label: "Quersumme Monat:", q: qMonat, farbe: STIFT.monat, y: 128 },
    { label: "Quersumme Jahr:", q: qJahr, farbe: STIFT.jahr, y: 150 },
  ];

  const summenZeile = `${qTag.wert} + ${qMonat.wert} + ${qJahr.wert} = `;
  const ySumme = 184;
  const yQuer = 208;
  const ergebnisX = qSumme.weg
    ? WERT + breite(`Quersumme: ${qSumme.weg} `, GR) - 52
    : WERT + breite(summenZeile, GR);
  const ergebnisY = qSumme.weg ? yQuer : ySumme;

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="nh"
      role="img"
      aria-label={`Numerologie: Lebenszahl ${ergebnis}`}
    >
      <defs>
        <pattern
          id="nh-karo"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 10 0 L 0 0 0 10"
            fill="none"
            stroke="#9fb6d6"
            strokeWidth="0.45"
          />
        </pattern>
        {/* Farbstift: koerniger Strich */}
        <filter id="nh-stift" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.6"
            numOctaves="1"
            seed="2"
            result="r"
          />
          <feColorMatrix
            in="r"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.2 0 0 0 0.25"
            result="korn"
          />
          <feComposite in="SourceGraphic" in2="korn" operator="in" />
        </filter>
      </defs>

      {/* das ganze Blatt etwas herangezoomt (Kamera naeher am Heft) */}
      <g
        transform={`translate(${M} ${M}) scale(${ZOOM}) translate(${-M} ${-M + 6})`}
      >
        {/* kariertes Heftpapier */}
        <rect x="-20" y="-20" width={G + 40} height={G + 40} fill="#fbfaf4" />
        <rect
          x="-20"
          y="-20"
          width={G + 40}
          height={G + 40}
          fill="url(#nh-karo)"
        />
        <line
          x1="32"
          y1="-20"
          x2="32"
          y2={G + 20}
          stroke="#e7a3a3"
          strokeWidth="0.8"
        />

        {/* Geburtsdatum in Fuellertinte, Teile in Farbstift unterstrichen */}
        {datum.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={74}
            className="nh-schrift"
            fontSize={GR_DATUM}
            fill={TINTE}
          >
            {t.t}
          </text>
        ))}
        <g filter="url(#nh-stift)">
          {datum
            .filter((t) => t.farbe)
            .map((t, i) => (
              <Strich
                key={i}
                x1={t.x + 1}
                x2={t.x + t.b - 1}
                y={80}
                farbe={t.farbe}
                breit={2}
                saat={i + 2}
              />
            ))}
        </g>

        {/* drei Zeilen in Farbstift: Quersumme von Tag, Monat, Jahr */}
        <g filter="url(#nh-stift)">
          {zeilen.map((z, i) => {
            const rechnung = `${z.q.weg} `;
            const wx = WERT + (z.q.weg ? breite(rechnung, GR) : 0);
            return (
              <g key={z.label}>
                <text
                  x={LINKS}
                  y={z.y}
                  className="nh-schrift"
                  fontSize={GR}
                  fill={z.farbe}
                >
                  {z.label}
                </text>
                {z.q.weg ? (
                  <text
                    x={WERT}
                    y={z.y}
                    className="nh-schrift"
                    fontSize={GR}
                    fill={z.farbe}
                  >
                    {rechnung}
                  </text>
                ) : null}
                <text
                  x={wx}
                  y={z.y}
                  className="nh-schrift"
                  fontSize={GR + 1}
                  fill={z.farbe}
                >
                  {z.q.wert}
                </text>
                <Strich
                  x1={wx - 1}
                  x2={wx + breite(String(z.q.wert), GR + 1) + 1}
                  y={z.y + 4}
                  farbe={z.farbe}
                  saat={i + 5}
                />
              </g>
            );
          })}
        </g>

        {/* Summenstrich, Summe und Quersumme in Tinte */}
        <line
          x1={WERT - 4}
          y1={164}
          x2={WERT + 92}
          y2={163}
          stroke={TINTE}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <text
          x={WERT}
          y={ySumme}
          className="nh-schrift"
          fontSize={GR}
          fill={TINTE}
        >
          {summenZeile}
          {qSumme.weg ? summe : ""}
        </text>
        {qSumme.weg ? (
          <text
            x={WERT - 52}
            y={yQuer}
            className="nh-schrift"
            fontSize={GR}
            fill={TINTE}
          >
            {`Quersumme: ${qSumme.weg}`}
          </text>
        ) : null}
        <text
          x={ergebnisX}
          y={ergebnisY}
          className="nh-schrift"
          fontSize={GR + 3}
          fill={TINTE}
        >
          {ergebnis}
        </text>
        <Strich
          x1={ergebnisX - 1}
          x2={ergebnisX + breite(String(ergebnis), GR + 3) + 1}
          y={ergebnisY + 4}
          farbe={TINTE}
          breit={1.3}
          saat={9}
        />

        {/* Rot: eingekringelt und schraeg darunter die Bemerkung */}
        {(() => {
          const cx = ergebnisX + breite(String(ergebnis), GR + 3) / 2;
          const cy = ergebnisY - 5;
          return (
            <g className="nh-rot">
              <ellipse
                cx={cx}
                cy={cy}
                rx="14"
                ry="11"
                transform={`rotate(-8 ${cx} ${cy})`}
                stroke={ROT}
              />
              <path d={`M ${cx + 12} ${cy - 9} q 6 -3 9 2`} stroke={ROT} />
              <text
                x={cx - 6}
                y={cy + 32}
                fill={ROT}
                className="nh-lehrerin"
                transform={`rotate(-10 ${cx - 6} ${cy + 32})`}
              >
                {meister ? "Meisterzahl!" : "Lebenszahl"}
              </text>
            </g>
          );
        })()}
      </g>
    </svg>
  );
}
