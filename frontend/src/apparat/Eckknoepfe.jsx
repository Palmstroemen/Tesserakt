import { useState } from "react";
import { METALL } from "./Datumsrad";
import { KNOPF } from "./platte";
import { hebel } from "./klang";
import { t } from "../sprache";

// Knoepfe in den oberen Ecken des Faechers: dieselben Messingknoepfe wie A und B der Datumsseite, an
// derselben Stelle (Datumsrad.jsx: KNOEPFE). Beim Uebergang legen sie sich unbemerkt ueber A und B, nur die
// Gravur wechselt: links "‹" (eine Frage zurueck, vor der ersten zur Datumsscheibe), rechts das Buch.
const ECKEN = [
  { id: "zurueck", x: KNOPF.ecke, y: KNOPF.ecke, name: t("ecken.zurueck") },
  { id: "buch", x: 400 - KNOPF.ecke, y: KNOPF.ecke, name: t("ecken.buch") },
];

function Gravur({ id }) {
  // wie dr-gravur: dunkle Kante oben, helle Lichtkante unten
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feOffset in="SourceAlpha" dy="0.9" result="unten" />
      <feFlood floodColor="#fff4d6" floodOpacity="0.75" />
      <feComposite in2="unten" operator="in" result="licht" />
      <feOffset in="SourceAlpha" dy="-0.6" result="oben" />
      <feFlood floodColor="#000" floodOpacity="0.55" />
      <feComposite in2="oben" operator="in" result="schatten" />
      <feMerge>
        <feMergeNode in="licht" />
        <feMergeNode in="schatten" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

export default function Eckknoepfe({ auftritt, onZurueck, onBuch }) {
  const [gedrueckt, setGedrueckt] = useState(null);
  const aktion = { zurueck: onZurueck, buch: onBuch };

  function druecken(e, id) {
    e.preventDefault();
    hebel();
    setGedrueckt(id);
    setTimeout(() => {
      setGedrueckt(null);
      aktion[id]();
    }, 180);
  }

  return (
    <svg
      viewBox="0 0 400 400"
      className={auftritt ? "ek-ebene ek-auftritt" : "ek-ebene"}
    >
      <defs>
        <radialGradient id="ek-rahmen" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={METALL.gold[0]} />
          <stop offset="0.55" stopColor={METALL.gold[1]} />
          <stop offset="1" stopColor={METALL.gold[2]} />
        </radialGradient>
        <Gravur id="ek-gravur" />
      </defs>
      {ECKEN.map((k) => (
        <g
          key={k.id}
          className={gedrueckt === k.id ? "dr-knopf gedrueckt" : "dr-knopf"}
          onPointerDown={(e) => druecken(e, k.id)}
          role="button"
          aria-label={k.name}
        >
          <circle
            cx={k.x}
            cy={k.y}
            r={KNOPF.rand}
            fill="url(#ek-rahmen)"
            className="dr-knopfrand"
          />
          <circle cx={k.x} cy={k.y} r={KNOPF.mitte} className="dr-knopfmitte" />
          {k.id === "zurueck" ? (
            <text
              x={k.x - 1}
              y={k.y}
              dy="0.3em"
              className="dr-knopftext ek-pfeil"
              filter="url(#ek-gravur)"
            >
              ‹
            </text>
          ) : (
            // aufgeschlagenes Buch
            <g transform={`translate(${k.x} ${k.y + 0.5}) scale(1.5)`}>
              <path
                d="M0 -5 C -3 -7 -7 -7 -9 -6 L -9 6 C -7 5 -3 5 0 7 C 3 5 7 5 9 6 L 9 -6 C 7 -7 3 -7 0 -5 Z M0 -5 L0 7"
                className="ek-buch"
                filter="url(#ek-gravur)"
              />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}
