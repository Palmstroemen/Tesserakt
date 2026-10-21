import { useMemo, useRef, useState } from "react";
import { MITTE } from "./geometrie";
import OrtWalzen, { WALZEN } from "./OrtWalzen";
import { hebel, rastKlick, sperre, zahnrad } from "./klang";

// Geburtsdatum als vier drehbare Ringe im oberen Kreis (wie ein Astrolabium), von aussen nach innen:
// Jahr, Monat, Tag, Stunde. Die Marke oben zeigt die gewaehlten Werte; die Mitte zeigt sie lesbar.
// Der Tag-Ring hat immer 31 Rasten; ungueltige Tage (31.2.) laufen nach dem Loslassen zurueck.
// Die Stunde steht auf 12; wer sie nicht kennt, laesst sie einfach stehen (12:00 wie im Backend).
// In den Ecken des Quadrats die Spiele: A links oben, B rechts oben, C links unten. C klappt beim ersten
// Druck auf die silberne Seite um (Geburtsdatum der zweiten Person). Darunter die Ortswalzen.
const JAHR_BIS = new Date().getFullYear();
const JAHR_VON = 1920;
const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const MONATE_LANG = ["Jänner", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

// Ringe: Band zwischen innen und aussen (viewBox-Einheiten), Anzahl Rasten, Beschriftung je Rast
const RINGE = [
  {
    id: "jahr",
    innen: 128,
    aussen: 162,
    anzahl: JAHR_BIS - JAHR_VON + 1,
    // jedes 5. Jahr beschriftet; an der Nahtstelle (letzte Jahre vor 1920) frei lassen
    text: (k) => ((JAHR_VON + k) % 5 === 0 && JAHR_BIS - (JAHR_VON + k) >= 3 ? String(JAHR_VON + k) : ""),
    schrift: 11.5,
  },
  { id: "monat", innen: 104, aussen: 128, anzahl: 12, text: (k) => MONATE[k], schrift: 12.5 },
  { id: "tag", innen: 80, aussen: 104, anzahl: 31, text: (k) => String(k + 1), schrift: 10.5 },
  { id: "stunde", innen: 56, aussen: 80, anzahl: 24, text: (k) => String(k), schrift: 10.5 },
];
const KNOEPFE = [
  { spiel: "A", x: 40, y: 40 },
  { spiel: "B", x: 360, y: 40 },
  { spiel: "C", x: 40, y: 360 },
];
const HOEHE = MITTE.y + WALZEN.stadt + 44;
const METALL = {
  gold: ["#f3d79a", "#b08d57", "#5a4325"],
  silber: ["#f4f6f8", "#a9b1ba", "#4e555c"],
};

function tageImMonat(jahr, monat) {
  return new Date(jahr, monat + 1, 0).getDate();
}

const mod = (a, n) => ((a % n) + n) % n;
const schritt = (ring) => 360 / ring.anzahl;
const indexAus = (ring, drehung) => mod(Math.round(-drehung / schritt(ring)), ring.anzahl);

function Band({ ring }) {
  const mitte = (ring.innen + ring.aussen) / 2;
  return <circle cx={MITTE.x} cy={MITTE.y} r={mitte} className={`dr-band dr-${ring.id}`} strokeWidth={ring.aussen - ring.innen - 1} />;
}

function Ring({ ring }) {
  // eingravierte Striche und Beschriftung eines Rings (wird nur als Ganzes gedreht)
  const mitte = (ring.innen + ring.aussen) / 2;
  const s = schritt(ring);
  return (
    <>
      {Array.from({ length: ring.anzahl }, (_, k) => {
        const t = ring.text(k);
        return (
          <g key={k} transform={`rotate(${k * s} ${MITTE.x} ${MITTE.y})`}>
            <line
              x1={MITTE.x}
              y1={MITTE.y - ring.aussen + 1}
              x2={MITTE.x}
              y2={MITTE.y - ring.aussen + (t ? 5 : 3.5)}
              className="dr-strich"
            />
            {t ? (
              <text x={MITTE.x} y={MITTE.y - mitte + ring.schrift * 0.55} fontSize={ring.schrift} className="dr-text">
                {t}
              </text>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

export default function Datumsrad({ onSpiel, laedt, fehler, hinweis, metall = "gold", anfang, flip }) {
  // Startwerte: 1. Jänner 1985, 12 Uhr (oder die zuletzt eingestellten Werte dieser Person)
  const [drehung, setDrehung] = useState(() => {
    const a = anfang ?? { jahr: 1985, monat: 0, tag: 1, stunde: 12 };
    return {
      jahr: -(a.jahr - JAHR_VON) * schritt(RINGE[0]),
      monat: -a.monat * schritt(RINGE[1]),
      tag: -(a.tag - 1) * schritt(RINGE[2]),
      stunde: -a.stunde * schritt(RINGE[3]),
    };
  });
  const [stundeBewegt, setStundeBewegt] = useState(anfang?.uhrzeitBekannt ?? false);
  const [ort, setOrt] = useState(null);
  const [gedrueckt, setGedrueckt] = useState(null);
  const drehRef = useRef(drehung);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const anim = useRef(0);

  function setze(teil) {
    drehRef.current = { ...drehRef.current, ...teil };
    setDrehung(drehRef.current);
  }

  const werte = useMemo(() => {
    const [j, m, t, h] = RINGE.map((r) => indexAus(r, drehung[r.id]));
    return { jahr: JAHR_VON + j, monat: m, tag: t + 1, stunde: h };
  }, [drehung]);

  function svgPunkt(e) {
    const p = svgRef.current.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svgRef.current.getScreenCTM().inverse());
  }
  const winkelVon = ({ x, y }) => (Math.atan2(x - MITTE.x, MITTE.y - y) * 180) / Math.PI; // 0 = oben, im Uhrzeigersinn

  function animiere(ziele, dauer, fertig) {
    cancelAnimationFrame(anim.current);
    const von = { ...drehRef.current };
    const start = performance.now();
    const tick = (jetzt) => {
      const t = Math.min(1, (jetzt - start) / dauer);
      const e = 1 - (1 - t) ** 3;
      const neu = {};
      for (const [k, z] of Object.entries(ziele)) neu[k] = von[k] + (z - von[k]) * e;
      setze(neu);
      if (t < 1) anim.current = requestAnimationFrame(tick);
      else fertig?.();
    };
    anim.current = requestAnimationFrame(tick);
  }

  function einrasten() {
    // alle Ringe auf die naechste Raste; ungueltigen Tag auf den letzten des Monats zuruecklaufen lassen
    const ziele = {};
    for (const r of RINGE) ziele[r.id] = Math.round(drehRef.current[r.id] / schritt(r)) * schritt(r);
    animiere(ziele, 160, () => {
      const jahr = JAHR_VON + indexAus(RINGE[0], drehRef.current.jahr);
      const monat = indexAus(RINGE[1], drehRef.current.monat);
      const tag = indexAus(RINGE[2], drehRef.current.tag) + 1;
      const max = tageImMonat(jahr, monat);
      if (tag > max) {
        zahnrad(tag - max + 2, 0.35, 2200);
        animiere({ tag: drehRef.current.tag + (tag - max) * schritt(RINGE[2]) }, 380);
      }
    });
  }

  function druecken(e) {
    if (laedt) return;
    const p = svgPunkt(e);
    const r = Math.hypot(p.x - MITTE.x, p.y - MITTE.y);
    const ring = RINGE.find((x) => r >= x.innen - 2 && r <= x.aussen + 4);
    if (!ring) return;
    cancelAnimationFrame(anim.current);
    drag.current = { ring, winkel: winkelVon(p), index: indexAus(ring, drehRef.current[ring.id]) };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function bewegen(e) {
    const d = drag.current;
    if (!d) return;
    const w = winkelVon(svgPunkt(e));
    let delta = w - d.winkel;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.winkel = w;
    setze({ [d.ring.id]: drehRef.current[d.ring.id] + delta });
    const idx = indexAus(d.ring, drehRef.current[d.ring.id]);
    if (idx !== d.index) {
      rastKlick();
      if (d.ring.id === "stunde") setStundeBewegt(true);
      d.index = idx;
    }
  }

  function loslassen() {
    const d = drag.current;
    drag.current = null;
    if (d) einrasten();
  }

  function knopf(e, spiel) {
    e.stopPropagation();
    if (laedt) {
      sperre();
      return;
    }
    hebel();
    setGedrueckt(spiel);
    setTimeout(() => setGedrueckt(null), 180);
    const { jahr, monat, tag, stunde } = werte;
    const zwei = (n) => String(n).padStart(2, "0");
    const t = Math.min(tag, tageImMonat(jahr, monat));
    onSpiel(spiel, {
      geburtsdatum: `${jahr}-${zwei(monat + 1)}-${zwei(t)}`,
      uhrzeit: `${zwei(stunde)}:00`,
      uhrzeitBekannt: stundeBewegt, // fuer spaetere Auswertung (noch nicht gespeichert)
      ort,
      roh: { jahr, monat, tag: t, stunde, uhrzeitBekannt: stundeBewegt, ort },
    });
  }

  const ringInhalt = useMemo(() => RINGE.map((r) => ({ band: <Band ring={r} />, gravur: <Ring ring={r} /> })), []);
  const gueltig = werte.tag <= tageImMonat(werte.jahr, werte.monat);
  const [hell, mittel, dunkel] = METALL[metall];

  return (
    <main className="sp">
      <svg
        ref={svgRef}
        viewBox={`0 0 400 ${HOEHE}`}
        className={`sp-svg dr-svg dr-${metall}${flip ? " dr-flip" : ""}`}
        onPointerDown={druecken}
        onPointerMove={bewegen}
        onPointerUp={loslassen}
        onPointerCancel={loslassen}
        role="group"
        aria-label="Geburtsdatum und Geburtsort einstellen"
      >
        <defs>
          <radialGradient id="sp-messing" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor={hell} />
            <stop offset="0.55" stopColor={mittel} />
            <stop offset="1" stopColor={dunkel} />
          </radialGradient>
          <radialGradient id="ow-platte" cx={MITTE.x} cy={MITTE.y} r={WALZEN.stadt + 40} gradientUnits="userSpaceOnUse">
            <stop offset="0.5" stopColor={metall === "gold" ? "#8a6a3c" : "#7d848c"} />
            <stop offset="1" stopColor={metall === "gold" ? "#4a3720" : "#3d4248"} />
          </radialGradient>
          {/* Gravur: dunkle Kante oben, helle Lichtkante unten (Licht von oben). Liegt um die drehenden
              Ringe herum, damit das Licht beim Drehen nicht mitwandert. */}
          <filter id="dr-gravur" x="-5%" y="-5%" width="110%" height="110%">
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

        {/* Ortswalzen unter dem Kreis */}
        <OrtWalzen svgPunkt={svgPunkt} anfang={anfang?.ort} onOrt={setOrt} />

        <circle cx={MITTE.x} cy={MITTE.y} r="166" fill="url(#sp-messing)" />

        {RINGE.map((r, i) => (
          <g key={r.id} transform={`rotate(${drehung[r.id]} ${MITTE.x} ${MITTE.y})`}>
            {ringInhalt[i].band}
          </g>
        ))}
        <g filter="url(#dr-gravur)">
          {RINGE.map((r, i) => (
            <g key={r.id} transform={`rotate(${drehung[r.id]} ${MITTE.x} ${MITTE.y})`}>
              {ringInhalt[i].gravur}
            </g>
          ))}
        </g>
        {/* Trennfugen zwischen den Ringen */}
        {[...RINGE.map((r) => r.aussen), 56].map((r) => (
          <circle key={r} cx={MITTE.x} cy={MITTE.y} r={r} className="dr-fuge" />
        ))}

        {/* feste Marke oben: Fenster ueber alle Ringe */}
        <rect x={MITTE.x - 13} y={MITTE.y - 163} width="26" height="108" rx="5" className="dr-fenster" />
        <path d={`M ${MITTE.x - 7} ${MITTE.y - 172} L ${MITTE.x + 7} ${MITTE.y - 172} L ${MITTE.x} ${MITTE.y - 163} Z`} className="dr-marke" />

        {/* Mitte: Ergebnis lesbar (spaeter vielleicht ein magisches Auge) */}
        <circle cx={MITTE.x} cy={MITTE.y} r="55" className="dr-mitte" />
        <text x={MITTE.x} y={MITTE.y - 12} className="dr-anzeige">
          {werte.tag}. {MONATE_LANG[werte.monat]}
        </text>
        <text x={MITTE.x} y={MITTE.y + 7} className="dr-anzeige">
          {werte.jahr}
        </text>
        <text x={MITTE.x} y={MITTE.y + 30} className="dr-anzeige zeit">
          {String(werte.stunde).padStart(2, "0")}:00
        </text>
        {!gueltig ? (
          <text x={MITTE.x} y={MITTE.y - 30} className="dr-anzeige klein">
            …
          </text>
        ) : null}

        {/* Spielknoepfe in den Ecken (Platzhalter-Beschriftung A, B, C) */}
        {KNOEPFE.map((k) => (
          <g
            key={k.spiel}
            className={`dr-knopf${gedrueckt === k.spiel ? " gedrueckt" : ""}${laedt ? " gesperrt" : ""}`}
            onPointerDown={(e) => knopf(e, k.spiel)}
            role="button"
            aria-label={`Spiel ${k.spiel}`}
          >
            <circle cx={k.x} cy={k.y} r="26" fill="url(#sp-messing)" className="dr-knopfrand" />
            <circle cx={k.x} cy={k.y} r="19" className="dr-knopfmitte" />
            <text x={k.x} y={k.y} dy="0.36em" className="dr-knopftext" filter="url(#dr-gravur)">
              {k.spiel}
            </text>
          </g>
        ))}
      </svg>

      <div className="sp-fuss dr-fuss">
        <p className="sc-hinweis">
          {ort ? `${ort.name}, ${ort.landName}` : "Geburtsort unbekannt"}
        </p>
        <p className="sc-hinweis">{laedt ? "Die Schatulle öffnet sich …" : hinweis}</p>
        {fehler ? <p className="sc-fehler">{fehler}</p> : null}
      </div>
    </main>
  );
}
