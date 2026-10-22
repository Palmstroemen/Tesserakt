import { useMemo, useRef, useState } from "react";
import { MITTE } from "./geometrie";
import OrtWalzen, { WALZEN } from "./OrtWalzen";
import { hebel, rastKlick, sperre, zahnrad } from "./klang";

// Geburtsdatum als vier drehbare Ringe im oberen Kreis (wie ein Astrolabium), von aussen nach innen:
// Jahr, Monat, Tag, Stunde. Die Marke oben zeigt die gewaehlten Werte; die Mitte zeigt sie lesbar.
// Der Tag-Ring hat immer 31 Rasten; ungueltige Tage (31.2.) laufen nach dem Loslassen zurueck.
// Die Stunde steht auf 12; wer sie nicht kennt, laesst sie einfach stehen (12:00 wie im Backend).
// In den Ecken des Quadrats die Spiele: A links oben, B rechts oben, C links unten. Die Knoepfe sind erst
// aktiv, wenn das Datum eingestellt wurde. A und B starten ihr Spiel; C dreht die Scheibe wie eine Muenze
// auf die silberne Seite (zweite Person), die Ortswalzen laufen dazu auf Silber; ein weiteres C startet
// Spiel C. Auf der silbernen Seite haben A und B keine Funktion. Darunter die Ortswalzen.
const JAHR_BIS = new Date().getFullYear();
export const JAHR_VON = 1920;
const MONATE = [
  "Jan",
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
export const MONATE_LANG = [
  "Jänner",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

// Ringe: Band zwischen innen und aussen (viewBox-Einheiten), Anzahl Rasten, Beschriftung je Rast
export const RINGE = [
  {
    id: "jahr",
    innen: 152,
    aussen: 192,
    anzahl: JAHR_BIS - JAHR_VON + 1,
    // jedes 5. Jahr beschriftet; an der Nahtstelle (letzte Jahre vor 1920) frei lassen
    text: (k) =>
      (JAHR_VON + k) % 5 === 0 && JAHR_BIS - (JAHR_VON + k) >= 3
        ? String(JAHR_VON + k)
        : "",
    schrift: 13,
  },
  {
    id: "monat",
    innen: 124,
    aussen: 152,
    anzahl: 12,
    text: (k) => MONATE[k],
    schrift: 14,
  },
  {
    id: "tag",
    innen: 96,
    aussen: 124,
    anzahl: 31,
    text: (k) => String(k + 1),
    schrift: 12,
  },
  {
    id: "stunde",
    innen: 68,
    aussen: 96,
    anzahl: 24,
    text: (k) => String(k),
    schrift: 12,
  },
];
const KNOEPFE = [
  { spiel: "A", x: 34, y: 34 },
  { spiel: "B", x: 366, y: 34 },
  { spiel: "C", x: 34, y: 366, silber: true }, // Spiel C: zweite Person auf der silbernen Seite
];
const HOEHE = MITTE.y + WALZEN.stadt + 44;
export const METALL = {
  gold: ["#f3d79a", "#b08d57", "#5a4325"],
  silber: ["#f4f6f8", "#a9b1ba", "#4e555c"],
};

function tageImMonat(jahr, monat) {
  return new Date(jahr, monat + 1, 0).getDate();
}

const mod = (a, n) => ((a % n) + n) % n;
export const schritt = (ring) => 360 / ring.anzahl;
const indexAus = (ring, drehung) =>
  mod(Math.round(-drehung / schritt(ring)), ring.anzahl);

export function Band({ ring }) {
  const mitte = (ring.innen + ring.aussen) / 2;
  return (
    <circle
      cx={MITTE.x}
      cy={MITTE.y}
      r={mitte}
      className={`dr-band dr-${ring.id}`}
      strokeWidth={ring.aussen - ring.innen - 1}
    />
  );
}

export function Ring({ ring }) {
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
              <text
                x={MITTE.x}
                y={MITTE.y - mitte + ring.schrift * 0.55}
                fontSize={ring.schrift}
                className="dr-text"
              >
                {t}
              </text>
            ) : null}
          </g>
        );
      })}
    </>
  );
}

// Startstellung der Ringe: 1. Jänner 1985, 12 Uhr
const START = {
  jahr: -(1985 - JAHR_VON) * schritt(RINGE[0]),
  monat: 0,
  tag: 0,
  stunde: -12 * schritt(RINGE[3]),
};
const FLIP_MS = 1400;

export default function Datumsrad({ onSpiel, laedt, fehler, abgang = false }) {
  const [drehung, setDrehung] = useState(START);
  const [seite, setSeite] = useState("gold"); // gold = erste Person, silber = zweite Person (Spiel C)
  const [scheibe, setScheibe] = useState({ metall: "gold", skala: 1 }); // Muenzdrehung der Scheibe
  const [eingestellt, setEingestellt] = useState(false); // Datum dieser Seite bewegt?
  const [stundeBewegt, setStundeBewegt] = useState(false);
  const [ort, setOrt] = useState(null);
  const [erstePerson, setErstePerson] = useState(null);
  const [gesperrtMeldung, setGesperrtMeldung] = useState(null);
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
  const winkelVon = ({ x, y }) =>
    (Math.atan2(x - MITTE.x, MITTE.y - y) * 180) / Math.PI; // 0 = oben, im Uhrzeigersinn

  function animiere(ziele, dauer, fertig) {
    cancelAnimationFrame(anim.current);
    const von = { ...drehRef.current };
    const start = performance.now();
    const tick = (jetzt) => {
      const t = Math.min(1, (jetzt - start) / dauer);
      const e = 1 - (1 - t) ** 3;
      const neu = {};
      for (const [k, z] of Object.entries(ziele))
        neu[k] = von[k] + (z - von[k]) * e;
      setze(neu);
      if (t < 1) anim.current = requestAnimationFrame(tick);
      else fertig?.();
    };
    anim.current = requestAnimationFrame(tick);
  }

  function einrasten() {
    // alle Ringe auf die naechste Raste; ungueltigen Tag auf den letzten des Monats zuruecklaufen lassen
    const ziele = {};
    for (const r of RINGE)
      ziele[r.id] = Math.round(drehRef.current[r.id] / schritt(r)) * schritt(r);
    animiere(ziele, 160, () => {
      const jahr = JAHR_VON + indexAus(RINGE[0], drehRef.current.jahr);
      const monat = indexAus(RINGE[1], drehRef.current.monat);
      const tag = indexAus(RINGE[2], drehRef.current.tag) + 1;
      const max = tageImMonat(jahr, monat);
      if (tag > max) {
        zahnrad(tag - max + 2, 0.35, 2200);
        animiere(
          { tag: drehRef.current.tag + (tag - max) * schritt(RINGE[2]) },
          380,
        );
      }
    });
  }

  function druecken(e) {
    if (laedt) return;
    const p = svgPunkt(e);
    const r = Math.hypot(p.x - MITTE.x, p.y - MITTE.y);
    // Tipp auf das Datum in der Mitte: Abkuerzung zum Ergebnis (Entwicklung)
    if (r < 64 && scheibe.skala === 1) {
      hebel();
      // auf der silbernen Seite: Abkuerzung durch Spiel C (erste Person gold, zweite die eingestellte)
      if (seite === "silber") onSpiel("XC", { a: erstePerson, b: eingabe() });
      else onSpiel("X", eingabe());
      return;
    }
    const ring = RINGE.find((x) => r >= x.innen - 2 && r <= x.aussen + 4);
    if (!ring) return;
    cancelAnimationFrame(anim.current);
    drag.current = {
      ring,
      winkel: winkelVon(p),
      index: indexAus(ring, drehRef.current[ring.id]),
    };
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
      else setEingestellt(true);
      setGesperrtMeldung(null);
      d.index = idx;
    }
  }

  function loslassen() {
    const d = drag.current;
    drag.current = null;
    if (d) einrasten();
  }

  function eingabe() {
    const { jahr, monat, tag, stunde } = werte;
    const zwei = (n) => String(n).padStart(2, "0");
    return {
      geburtsdatum: `${jahr}-${zwei(monat + 1)}-${zwei(Math.min(tag, tageImMonat(jahr, monat)))}`,
      uhrzeit: `${zwei(stunde)}:00`,
      uhrzeitBekannt: stundeBewegt, // fuer spaetere Auswertung (noch nicht gespeichert)
      ort,
    };
  }

  const wechselt = scheibe.skala < 1;
  const aktiv = (spiel) =>
    !laedt && !wechselt && eingestellt && (seite === "gold" || spiel === "C");

  function knopf(e, spiel) {
    e.stopPropagation();
    if (!aktiv(spiel)) {
      sperre();
      if (!eingestellt && !(seite === "silber" && spiel !== "C"))
        setGesperrtMeldung("Erst das Geburtsdatum einstellen.");
      return;
    }
    hebel();
    setGedrueckt(spiel);
    setTimeout(() => setGedrueckt(null), 180);
    if (spiel === "C" && seite === "gold") {
      seiteWechseln();
      return;
    }
    if (spiel === "C") onSpiel("C", { a: erstePerson, b: eingabe() });
    else onSpiel(spiel, eingabe());
  }

  function seiteWechseln() {
    // Scheibe dreht sich wie eine Muenze; in der Mitte (unsichtbar schmal) wechseln Metall und Ringe
    setErstePerson(eingabe());
    setSeite("silber");
    setEingestellt(false);
    setStundeBewegt(false);
    const start = performance.now();
    let gewechselt = false;
    const tick = (jetzt) => {
      const t = Math.min(1, (jetzt - start) / FLIP_MS);
      if (!gewechselt && t >= 0.5) {
        gewechselt = true;
        cancelAnimationFrame(anim.current);
        setze(START);
      }
      setScheibe({
        metall: t < 0.5 ? "gold" : "silber",
        skala: t < 1 ? Math.max(0.02, Math.abs(Math.cos(Math.PI * t))) : 1,
      });
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const ringInhalt = useMemo(
    () =>
      RINGE.map((r) => ({
        band: <Band ring={r} />,
        gravur: <Ring ring={r} />,
      })),
    [],
  );
  const gueltig = werte.tag <= tageImMonat(werte.jahr, werte.monat);
  const [hell, mittel, dunkel] = METALL[scheibe.metall];
  const scheibeTransform = `translate(${MITTE.x} ${MITTE.y}) scale(${scheibe.skala} 1) translate(${-MITTE.x} ${-MITTE.y})`;
  const hinweis =
    seite === "gold"
      ? "Dreh die Ringe auf dein Geburtsdatum, dann wähle ein Spiel: A, B oder C."
      : "Jetzt das Geburtsdatum deines Partners oder deiner Partnerin – dann C.";

  return (
    <main className="sp">
      <svg
        ref={svgRef}
        viewBox={`0 0 400 ${HOEHE}`}
        className={abgang ? "sp-svg dr-svg dr-abgang" : "sp-svg dr-svg"}
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
          <radialGradient
            id="ow-platte-gold"
            cx={MITTE.x}
            cy={MITTE.y}
            r={WALZEN.stadt + 40}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.5" stopColor="#8a6a3c" />
            <stop offset="1" stopColor="#4a3720" />
          </radialGradient>
          {/* Rahmen (Knoepfe): bleibt immer Gold */}
          <radialGradient id="dr-rahmen" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor={METALL.gold[0]} />
            <stop offset="0.55" stopColor={METALL.gold[1]} />
            <stop offset="1" stopColor={METALL.gold[2]} />
          </radialGradient>
          {/* Knopf C (zweite Person): Silber */}
          <radialGradient id="dr-rahmen-silber" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor={METALL.silber[0]} />
            <stop offset="0.55" stopColor={METALL.silber[1]} />
            <stop offset="1" stopColor={METALL.silber[2]} />
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
        {/* beim Abgang schwenken die Walzen um den Kreismittelpunkt nach rechts weg */}
        <g className="dr-walzen">
          <OrtWalzen svgPunkt={svgPunkt} metall={seite} onOrt={setOrt} />
        </g>

        {/* runde Scheibe: dreht sich beim Seitenwechsel wie eine Muenze; beim Abgang zum magischen Auge */}
        <g className="dr-scheibe">
          <g transform={scheibeTransform} className={`dr-${scheibe.metall}`}>
            <circle cx={MITTE.x} cy={MITTE.y} r="196" fill="url(#sp-messing)" />

            {RINGE.map((r, i) => (
              <g
                key={r.id}
                transform={`rotate(${drehung[r.id]} ${MITTE.x} ${MITTE.y})`}
              >
                {ringInhalt[i].band}
              </g>
            ))}
            {/* Gravur waehrend der Muenzdrehung aus: der Filter muesste sonst jedes Bild neu rechnen (ruckelt) */}
            <g filter={wechselt ? undefined : "url(#dr-gravur)"}>
              {RINGE.map((r, i) => (
                <g
                  key={r.id}
                  transform={`rotate(${drehung[r.id]} ${MITTE.x} ${MITTE.y})`}
                >
                  {ringInhalt[i].gravur}
                </g>
              ))}
            </g>
            {/* Trennfugen zwischen den Ringen */}
            {[...RINGE.map((r) => r.aussen), 68].map((r) => (
              <circle
                key={r}
                cx={MITTE.x}
                cy={MITTE.y}
                r={r}
                className="dr-fuge"
              />
            ))}

            {/* feste Marke oben: Fenster ueber alle Ringe */}
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

            {/* Mitte: Ergebnis lesbar (spaeter vielleicht ein magisches Auge) */}
            <circle cx={MITTE.x} cy={MITTE.y} r="67" className="dr-mitte" />
            <text x={MITTE.x} y={MITTE.y - 15} className="dr-anzeige">
              {werte.tag}. {MONATE_LANG[werte.monat]}
            </text>
            <text x={MITTE.x} y={MITTE.y + 8} className="dr-anzeige">
              {werte.jahr}
            </text>
            <text x={MITTE.x} y={MITTE.y + 36} className="dr-anzeige zeit">
              {String(werte.stunde).padStart(2, "0")}:00
            </text>
            {!gueltig ? (
              <text x={MITTE.x} y={MITTE.y - 38} className="dr-anzeige klein">
                …
              </text>
            ) : null}
          </g>
        </g>

        {/* Spielknoepfe in den Ecken (Platzhalter-Beschriftung A, B, C) */}
        <g className="dr-knoepfe">
          {KNOEPFE.map((k) => (
            <g
              key={k.spiel}
              className={`dr-knopf${gedrueckt === k.spiel ? " gedrueckt" : ""}${aktiv(k.spiel) ? "" : " gesperrt"}`}
              onPointerDown={(e) => knopf(e, k.spiel)}
              role="button"
              aria-label={`Spiel ${k.spiel}`}
            >
              <circle
                cx={k.x}
                cy={k.y}
                r="26"
                fill={k.silber ? "url(#dr-rahmen-silber)" : "url(#dr-rahmen)"}
                className="dr-knopfrand"
              />
              <circle cx={k.x} cy={k.y} r="19" className="dr-knopfmitte" />
              <text
                x={k.x}
                y={k.y}
                dy="0.36em"
                className={k.silber ? "dr-knopftext silber" : "dr-knopftext"}
                filter="url(#dr-gravur)"
              >
                {k.spiel}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="sp-fuss dr-fuss">
        {ort ? (
          <p className="sc-hinweis">{`${ort.name}, ${ort.landName}`}</p>
        ) : null}
        <p className="sc-hinweis">
          {laedt ? "Der Apparat öffnet sich …" : (gesperrtMeldung ?? hinweis)}
        </p>
        {fehler ? <p className="sc-fehler">{fehler}</p> : null}
      </div>
    </main>
  );
}
