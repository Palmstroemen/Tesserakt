// Zettel im Apparat (nur auf dem Startbild und nur bis zum ersten Spiel): einmal quer gefaltet liegt er gross und
// etwas schraeg ueber der Datumsscheibe, wenn das Kaestchen aufgeht. Oben steht die Grundfrage des Spiels, darunter
// eine Legende, keine Anleitung: die Horoskope mit ihren Zeichen und Namen, von Hand geschrieben, dazu eine
// Bleistiftnotiz und eine Skizze. Antippen faltet ihn auf (er rueckt dabei etwas gerader), weggewischt (oder
// aufgefaltet angetippt) fliegt er nach rechts hinaus und kommt nicht wieder.
import { useLayoutEffect, useRef, useState } from "react";
import HoroskopIcon from "./HoroskopIcon";
import { SYSTEME, anzeigeName } from "./systeme";
import { papier } from "./klang";
import { t } from "../sprache";
import { TESTPHASE } from "./werkstatt";

const SCHLUESSEL = "tesserakt-zettel";

// liegt der Zettel noch im Apparat? (bis er weggewischt oder das erste Spiel gestartet wurde)
export function zettelDa() {
  if (TESTPHASE) return true;
  try {
    return localStorage.getItem(SCHLUESSEL) !== "weg";
  } catch {
    return true;
  }
}

export function zettelWeglegen() {
  try {
    localStorage.setItem(SCHLUESSEL, "weg");
  } catch {
    // ohne Speicher: nur fuer diese Sitzung weg
  }
}

// Bleistiftnotizen neben einzelnen Horoskopen
const NOTIZ = t("zettel.notiz");
// Handschrift: jede Zeile etwas anders geneigt und eingerueckt
const ZEILE = [
  [-0.8, 0],
  [0.6, 3],
  [-0.3, 1],
  [1, 5],
  [-1.1, 2],
  [0.4, 6],
  [-0.6, 3],
];

// Bleistiftskizze unten auf dem Zettel: ein Schlitz wie im Faecher, links der Knopf, darueber ein nach unten
// gebogener Pfeil nach rechts, darunter "Aktivieren". Jede Linie doppelt und leicht verwackelt gezogen.
function Kritzelei() {
  const linien = [
    // Schlitz (nach unten gebogen wie die Boegen im Faecher), mit runden Enden
    "M18 30 Q120 66 222 30",
    "M18 42 Q120 78 222 42",
    "M18 30 A6 6 0 0 0 18 42",
    "M222 30 A6 6 0 0 1 222 42",
    // Pfeil darueber, dem Bogen folgend, mit Spitze
    "M34 14 Q120 50 206 12",
    "M206 12 L195 10",
    "M206 12 L201 22",
  ];
  return (
    <svg className="zt-kritzel" viewBox="0 0 240 104" aria-hidden="true">
      <defs>
        <filter id="zt-wackeln">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05"
            numOctaves="2"
            seed="3"
          />
          <feDisplacementMap in="SourceGraphic" scale="2.2" />
        </filter>
      </defs>
      <g filter="url(#zt-wackeln)">
        {linien.map((d) => (
          <g key={d}>
            <path d={d} />
            <path d={d} transform="translate(0.7 0.5)" className="zweit" />
          </g>
        ))}
        {/* Knopf links im Schlitz, schraffiert */}
        <circle cx="30" cy="40" r="6.5" />
        <path
          className="schraffur"
          d="M25 43 L32 35 M26 46 L35 37 M29 47 L36 40"
        />
      </g>
      <text x="120" y="98" transform="rotate(-3 120 98)">
        {t("zettel.aktivieren")}
      </text>
    </svg>
  );
}

function Blatt({ kopie = false }) {
  return (
    <div
      className="zt-blatt"
      role={kopie ? undefined : "dialog"}
      aria-label={kopie ? undefined : t("zettel.zettel")}
      aria-hidden={kopie || undefined}
    >
      <p className="zt-frage">{t("zettel.frage")}</p>
      <h2>{t("zettel.ueberschrift")}</h2>
      {/* mit dem Bleistift unterstrichen */}
      <svg className="zt-strich" viewBox="0 0 200 10" aria-hidden="true">
        <path d="M4 6 C 40 3, 80 8, 120 5 S 180 3, 196 6" />
        <path d="M30 8 C 70 6, 120 9, 170 6" />
      </svg>
      <ul>
        {SYSTEME.map((s, i) => (
          <li
            key={s.id}
            style={{
              transform: `rotate(${ZEILE[i % ZEILE.length][0]}deg)`,
              paddingLeft: ZEILE[i % ZEILE.length][1],
            }}
          >
            <svg viewBox="-12 -12 24 24" aria-hidden="true">
              <HoroskopIcon id={s.id} r={10} />
            </svg>
            <span>{anzeigeName(s.id)}</span>
            {NOTIZ[s.id] ? (
              <span className="zt-notiz">← {NOTIZ[s.id]}</span>
            ) : null}
          </li>
        ))}
      </ul>
      <Kritzelei />
    </div>
  );
}

// Schraeglage: gefaltet etwas schief hingeworfen, aufgefaltet geradegerueckt
const NEIGUNG = { gefaltet: -5, offen: -1.5 };

export default function Zettel() {
  const [zustand, setZustand] = useState(() =>
    zettelDa() ? "gefaltet" : "weg",
  ); // gefaltet | offen | fliegt | weg
  const [dx, setDx] = useState(0); // Wischweg waehrend des Ziehens
  const [halb, setHalb] = useState(0); // halbe Blatthoehe (Lage der Faltkante)
  const start = useRef(null);
  const blattRef = useRef(null);

  // die Faltkante liegt in der Mitte des Blatts; die untere Haelfte zeigt dasselbe Blatt, nach oben verschoben
  useLayoutEffect(() => {
    const el = blattRef.current;
    if (!el) return undefined;
    const messen = () => setHalb(el.offsetHeight / 2);
    messen();
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, [zustand === "weg"]);

  function oeffnen() {
    papier(true);
    setZustand("offen");
  }

  function wegwischen() {
    papier(false);
    zettelWeglegen();
    setZustand("fliegt");
  }

  // Wischen: dem Finger folgen; loslassen nach rechts wirft den Zettel hinaus, Antippen faltet ihn auf
  // (aufgefaltet: wirft ihn hinaus)
  function runter(e) {
    start.current = e.clientX;
  }
  function ziehen(e) {
    if (start.current !== null) setDx(Math.max(0, e.clientX - start.current));
  }
  function hoch() {
    if (start.current === null) return;
    start.current = null;
    if (dx > 50) wegwischen();
    else if (dx < 6) {
      setDx(0);
      if (zustand === "gefaltet") oeffnen();
      else wegwischen();
    } else setDx(0);
  }

  if (zustand === "weg") return null;
  const neigung = zustand === "gefaltet" ? NEIGUNG.gefaltet : NEIGUNG.offen;
  return (
    <div
      className={`zt-ebene zt-${zustand}`}
      onAnimationEnd={(e) => {
        if (e.animationName === "zt-wegfliegen") setZustand("weg");
      }}
    >
      <div
        className={dx ? "zt-lage zt-zieht" : "zt-lage"}
        style={{
          transform: `translateX(${dx}px) rotate(${neigung + dx / 25}deg)`,
          visibility: halb ? undefined : "hidden",
        }}
        onPointerDown={runter}
        onPointerMove={ziehen}
        onPointerUp={hoch}
        onPointerCancel={hoch}
      >
        <div className="zt-falt" style={{ "--zt-halb": `${halb}px` }}>
          <div className="zt-oben">
            <div ref={blattRef}>
              <Blatt />
            </div>
          </div>
          <div className="zt-unten">
            <div style={{ marginTop: -halb }}>
              <Blatt kopie />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
