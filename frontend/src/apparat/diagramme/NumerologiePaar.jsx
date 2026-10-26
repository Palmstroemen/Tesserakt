// Numerologie fuer Paare (Spiel C): dieselbe Heftseite, zwei Rechnungen nebeneinander. Links deine in
// Fuellertinte, rechts die deines Gegenuebers in Bleistift, je Geburtsdatum, die Quersummen von Tag, Monat,
// Jahr in Farbstift und die Lebenszahl. Die Lehrerin hat beide Ergebnisse rot umkringelt, mit einem Bogen
// verbunden und die Bewertung aus der Kompatibilitaetsmatrix daruntergeschrieben (backend/paar.py).
import {
  MEISTER,
  ROT,
  STIFT,
  Strich,
  TINTE,
  breite,
  quersumme,
} from "./NumerologieHeft";
import { t } from "../../sprache";

const G = 300;
const M = G / 2;
const BLEI = "#4a4f57";
const SPALTEN = {
  a: {
    x: 40,
    mitte: 94,
    tinte: TINTE,
    name: t("diagramme.du"),
    strich: "#c9a227",
  },
  b: {
    x: 160,
    mitte: 212,
    tinte: BLEI,
    name: t("diagramme.gegenueber"),
    strich: "#9aa3ae",
  },
};
const GR = 11;
const zwei = (n) => String(n).padStart(2, "0");

function Rechnung({ wer, datum, zahl }) {
  const sp = SPALTEN[wer];
  const teile = [
    { q: quersumme(datum.day), farbe: STIFT.tag, y: 112 },
    { q: quersumme(datum.month), farbe: STIFT.monat, y: 130 },
    { q: quersumme(datum.year), farbe: STIFT.jahr, y: 148 },
  ];
  const summe = teile.reduce((s, t) => s + t.q.wert, 0);
  const qs = quersumme(summe);
  const ergebnis = zahl ?? qs.wert;
  const datumText = `${zwei(datum.day)}.${zwei(datum.month)}.${datum.year}`;
  return (
    <g>
      {/* Name, unterstrichen in Gold bzw. Silbergrau */}
      <text
        x={sp.mitte}
        y={64}
        className="nh-schrift np-mitte"
        fontSize={12}
        fill={sp.tinte}
      >
        {sp.name}
      </text>
      <g filter="url(#np-stift)">
        <Strich
          x1={sp.mitte - breite(sp.name, 12) / 2 - 2}
          x2={sp.mitte + breite(sp.name, 12) / 2 + 2}
          y={68}
          farbe={sp.strich}
          breit={2}
          saat={wer === "a" ? 3 : 4}
        />
      </g>
      <text
        x={sp.mitte}
        y={90}
        className="nh-schrift np-mitte"
        fontSize={15}
        fill={sp.tinte}
      >
        {datumText}
      </text>
      {/* Quersummen in Farbstift */}
      <g filter="url(#np-stift)">
        {teile.map((t, i) => (
          <text
            key={i}
            x={sp.x}
            y={t.y}
            className="nh-schrift"
            fontSize={GR}
            fill={t.farbe}
          >
            {t.q.weg ? `${t.q.weg} ${t.q.wert}` : t.q.wert}
          </text>
        ))}
      </g>
      <line
        x1={sp.x - 2}
        y1={156}
        x2={sp.x + 96}
        y2={155}
        stroke={sp.tinte}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <text
        x={sp.x}
        y={172}
        className="nh-schrift"
        fontSize={GR}
        fill={sp.tinte}
      >
        {`${teile.map((t) => t.q.wert).join(" + ")} = ${summe}`}
        {qs.weg && summe !== ergebnis ? ` → ` : ""}
      </text>
      <text
        x={sp.mitte}
        y={198}
        className="nh-schrift np-mitte"
        fontSize={18}
        fill={sp.tinte}
      >
        {ergebnis}
      </text>
    </g>
  );
}

export default function NumerologiePaar({ daten }) {
  const da = daten?.datum?.a;
  const db = daten?.datum?.b;
  if (!da || !db) return null;
  const za = daten.lebenszahl?.a;
  const zb = daten.lebenszahl?.b;
  const ya = 192;
  const meister = MEISTER.includes(za) || MEISTER.includes(zb);
  const ax = SPALTEN.a.mitte;
  const bx = SPALTEN.b.mitte;

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="nh np"
      role="img"
      aria-label={t("diagramme.numerologie.paar", { a: za, b: zb })}
    >
      <defs>
        <pattern
          id="np-karo"
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
        <filter id="np-stift" x="-5%" y="-20%" width="110%" height="140%">
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

      {/* kariertes Heftpapier mit Korrekturrand */}
      <rect x="0" y="0" width={G} height={G} fill="#fbfaf4" />
      <rect x="0" y="0" width={G} height={G} fill="url(#np-karo)" />
      <line x1="30" y1="0" x2="30" y2={G} stroke="#e7a3a3" strokeWidth="0.8" />

      <Rechnung wer="a" datum={da} zahl={za} />
      <Rechnung wer="b" datum={db} zahl={zb} />

      {/* Lehrerin in Rot: beide Ergebnisse umkringelt, verbunden, Bewertung darunter */}
      <g className="nh-rot">
        {[ax, bx].map((x, i) => (
          <ellipse
            key={i}
            cx={x}
            cy={ya}
            rx="15"
            ry="12"
            transform={`rotate(${i ? 6 : -8} ${x} ${ya})`}
            stroke={ROT}
          />
        ))}
        <path
          d={`M ${ax + 4} ${ya + 13} Q ${M} ${ya + 46} ${bx - 4} ${ya + 13}`}
          stroke={ROT}
        />
        <path
          d={`M ${bx - 4} ${ya + 13} l -7 1 M ${bx - 4} ${ya + 13} l -2 7`}
          stroke={ROT}
        />
        {daten.bewertung ? (
          <text
            x={M}
            y={ya + 56}
            fill={ROT}
            className="nh-lehrerin"
            transform={`rotate(-5 ${M} ${ya + 56})`}
          >
            {`${daten.bewertung}!`}
          </text>
        ) : null}
        {meister ? (
          <text
            x={M + 6}
            y={ya + 76}
            fill={ROT}
            className="nh-lehrerin np-klein"
            transform={`rotate(-5 ${M} ${ya + 76})`}
          >
            {t("diagramme.numerologie.mit_meisterzahl")}
          </text>
        ) : null}
      </g>
    </svg>
  );
}
