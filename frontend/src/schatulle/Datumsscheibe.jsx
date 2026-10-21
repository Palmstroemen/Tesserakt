// Die Datumsscheibe der Schatulle als Bild mit festem Datum (z. B. fuer die Titelseite des Horoskopbuchs):
// dieselben Ringe, Gravuren und Farben wie im Datumsrad, aber ohne Bedienung. Gold fuer die erste Person,
// Silber fuer die zweite (Spiel C). praefix trennt die ids, wenn mehrere Scheiben im Dokument stehen.
import { MITTE } from "./geometrie";
import {
  Band,
  JAHR_VON,
  METALL,
  MONATE_LANG,
  RINGE,
  Ring,
  schritt,
} from "./Datumsrad";

// Drehung der Ringe fuer ein Datum (Gegenstueck zu indexAus im Datumsrad)
function drehungFuer({ jahr, monat, tag, stunde }) {
  const index = { jahr: jahr - JAHR_VON, monat, tag: tag - 1, stunde };
  return Object.fromEntries(
    RINGE.map((r) => [r.id, -index[r.id] * schritt(r)]),
  );
}

// "1985-04-12" und "14:00" -> { jahr, monat (0-basiert), tag, stunde }
export function datumAus(geburtsdatum, uhrzeit = "12:00") {
  const [j, m, t] = geburtsdatum.split("-").map(Number);
  return {
    jahr: j,
    monat: m - 1,
    tag: t,
    stunde: Number(uhrzeit.split(":")[0]),
  };
}

export default function Datumsscheibe({
  datum,
  metall = "gold",
  praefix = "ds",
}) {
  const [hell, mittel, dunkel] = METALL[metall];
  const drehung = drehungFuer(datum);
  return (
    <svg
      viewBox="0 0 400 400"
      className="dr-svg"
      role="img"
      aria-label="Datumsscheibe"
    >
      <defs>
        <radialGradient id={`${praefix}-messing`} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor={hell} />
          <stop offset="0.55" stopColor={mittel} />
          <stop offset="1" stopColor={dunkel} />
        </radialGradient>
        <filter
          id={`${praefix}-gravur`}
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
        >
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
      </defs>
      <g className={`dr-${metall}`}>
        <circle
          cx={MITTE.x}
          cy={MITTE.y}
          r="196"
          fill={`url(#${praefix}-messing)`}
        />
        {RINGE.map((r) => (
          <g
            key={r.id}
            transform={`rotate(${drehung[r.id]} ${MITTE.x} ${MITTE.y})`}
          >
            <Band ring={r} />
          </g>
        ))}
        <g filter={`url(#${praefix}-gravur)`}>
          {RINGE.map((r) => (
            <g
              key={r.id}
              transform={`rotate(${drehung[r.id]} ${MITTE.x} ${MITTE.y})`}
            >
              <Ring ring={r} />
            </g>
          ))}
        </g>
        {[...RINGE.map((r) => r.aussen), 68].map((r) => (
          <circle key={r} cx={MITTE.x} cy={MITTE.y} r={r} className="dr-fuge" />
        ))}
        <rect
          x={MITTE.x - 15}
          y={MITTE.y - 193}
          width="30"
          height="128"
          rx="5"
          className="dr-fenster"
        />
        <path
          d={`M ${MITTE.x - 7} ${MITTE.y - 199} L ${MITTE.x + 7} ${MITTE.y - 199} L ${MITTE.x} ${MITTE.y - 190} Z`}
          className="dr-marke"
        />
        <circle cx={MITTE.x} cy={MITTE.y} r="67" className="dr-mitte" />
        <text x={MITTE.x} y={MITTE.y - 15} className="dr-anzeige">
          {datum.tag}. {MONATE_LANG[datum.monat]}
        </text>
        <text x={MITTE.x} y={MITTE.y + 8} className="dr-anzeige">
          {datum.jahr}
        </text>
        <text x={MITTE.x} y={MITTE.y + 36} className="dr-anzeige zeit">
          {String(datum.stunde).padStart(2, "0")}:00
        </text>
      </g>
    </svg>
  );
}
