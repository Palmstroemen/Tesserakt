import { useMemo, useRef, useState } from "react";
import { MITTE, layoutAusFenster } from "./geometrie";
import { KNOPF, KNOPF_C, PlattenVerlauf, SpurenBild } from "./platte";
import Knopfsymbol from "./Knopfsymbole";
import OrtWalzen, { WALZEN } from "./OrtWalzen";
import Mantel, { HALBDICKE } from "./Mantel";
import Zaehlwerk from "./Zaehlwerk";
import { hebel, rastKlick, sperre, zahnrad } from "./klang";
import { t } from "../sprache";

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
const MONATE = t("monate.ring");

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
  { spiel: "A", x: KNOPF.ecke, y: KNOPF.ecke },
  { spiel: "B", x: 400 - KNOPF.ecke, y: KNOPF.ecke },
  { spiel: "C", ...KNOPF_C, silber: true }, // Spiel C: zweite Person auf der silbernen Seite; unter der Walzenplatte
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

// Kreisring als Pfad (aussen im, innen gegen den Uhrzeigersinn), fuer die Gebrauchsspuren
function ringPfad(innen, aussen) {
  const kreis = (r, richtung) =>
    `M${MITTE.x - r} ${MITTE.y}a${r} ${r} 0 1 ${richtung} ${2 * r} 0a${r} ${r} 0 1 ${richtung} ${-2 * r} 0Z`;
  return `${kreis(aussen, 1)} ${kreis(innen, 0)}`;
}

// Gebrauchsspuren je Ring: jeder aus einer anderen Stelle der Platte gestanzt; Fingerabdruecke an ein paar
// Stellen rundum, denn gedreht wird an jeder Stelle (sie drehen sich mit dem Ring; als fertiges Bild, siehe
// SpurenBild)
const SPUREN = {
  jahr: { versatz: [31, -77], drehung: 40, winkel: [20, 150, 255] },
  monat: { versatz: [-112, 18], drehung: -65, winkel: [95, 310] },
  tag: { versatz: [74, 133], drehung: 110, winkel: [200] },
  stunde: { versatz: [-9, -151], drehung: 5, winkel: [60] },
};

export function Band({ ring }) {
  const mitte = (ring.innen + ring.aussen) / 2;
  const spuren = SPUREN[ring.id];
  return (
    <>
      <circle
        cx={MITTE.x}
        cy={MITTE.y}
        r={mitte}
        className={`dr-band dr-${ring.id}`}
        strokeWidth={ring.aussen - ring.innen - 1}
      />
      {spuren ? (
        <SpurenBild
          d={ringPfad(ring.innen + 0.5, ring.aussen - 0.5)}
          box={{
            x: MITTE.x - ring.aussen,
            y: MITTE.y - ring.aussen,
            width: 2 * ring.aussen,
            height: 2 * ring.aussen,
          }}
          versatz={spuren.versatz}
          drehung={spuren.drehung}
          stellen={spuren.winkel.map((w) => [
            MITTE.x + mitte * Math.sin((w * Math.PI) / 180),
            MITTE.y - mitte * Math.cos((w * Math.PI) / 180),
            (ring.aussen - ring.innen) * 1.1,
          ])}
        />
      ) : null}
    </>
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
const FLIP_MS = 2100;

export default function Datumsrad({
  onSpiel,
  laedt,
  fehler,
  abgang = false,
  onMuenze, // Muenzdrehung nach Silber: true am Anfang, false am Ende
}) {
  // Masse der Drehscheibe wie im Faecher (die Walzenplatte hat dieselben Radien wie die Faecherplatte)
  const platte = useMemo(() => layoutAusFenster(), []);
  const [drehung, setDrehung] = useState(START);
  const [seite, setSeite] = useState("gold"); // gold = erste Person, silber = zweite Person (Spiel C)
  // Muenzdrehung der Scheibe um die waagrechte Achse, Oberkante nach hinten (wie ein Fallblatt): kipp 0..90 Grad
  // und zurueck, seite +1 (Gold rueckt nach oben, man sieht die Unterkante) / -1 (Silber kommt von unten, man
  // sieht die Oberkante)
  const [scheibe, setScheibe] = useState({
    metall: "gold",
    skala: 1,
    kipp: 0,
    seite: 1,
  });
  const [eingestellt, setEingestellt] = useState(false); // Datum dieser Seite bewegt?
  const [stundeBewegt, setStundeBewegt] = useState(false);
  const [ort, setOrt] = useState(null);
  const [erstePerson, setErstePerson] = useState(null);
  const [gesperrtMeldung, setGesperrtMeldung] = useState(null);
  const [gedrueckt, setGedrueckt] = useState(null);
  const drehRef = useRef(drehung);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const [zieht, setZieht] = useState(false); // ein Ring wird gerade gedreht (Zaehlwerk springt mit)
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
    // Tipp auf das Datum in der Mitte: Abkuerzung zum Ergebnis (nur im Entwicklungsserver)
    if (import.meta.env.DEV && r < 64 && scheibe.skala === 1) {
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
    setZieht(true);
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
    setZieht(false);
    if (d) einrasten();
  }

  function eingabe() {
    const { jahr, monat, tag, stunde } = werte;
    const zwei = (n) => String(n).padStart(2, "0");
    return {
      geburtsdatum: `${jahr}-${zwei(monat + 1)}-${zwei(Math.min(tag, tageImMonat(jahr, monat)))}`,
      uhrzeit: `${zwei(stunde)}:00`,
      uhrzeitBekannt: stundeBewegt, // fuer die Forschung (forschung.js: nur ja oder nein)
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
        setGesperrtMeldung(t("datum.erst_datum"));
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
    // Scheibe kippt wie ein Fallblatt; in der Mitte (unsichtbar schmal) wechseln Metall und Ringe
    setErstePerson(eingabe());
    setSeite("silber");
    setEingestellt(false);
    setStundeBewegt(false);
    onMuenze?.(true);
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
        kipp: t < 1 ? 180 * Math.min(t, 1 - t) : 0,
        seite: t < 0.5 ? 1 : -1,
      });
      if (t < 1) requestAnimationFrame(tick);
      else onMuenze?.(false);
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
  // die sichtbare Seite rueckt um die halbe Dicke des Pucks nach oben oder unten (Drehachse in seiner Mitte)
  const versatz =
    scheibe.seite * HALBDICKE * Math.sin((scheibe.kipp * Math.PI) / 180);
  const scheibeTransform = `translate(${MITTE.x} ${MITTE.y - versatz}) scale(1 ${scheibe.skala}) translate(${-MITTE.x} ${-MITTE.y})`;
  // Auf der goldenen Seite kein Hinweis (entdecken statt erklaeren); die silberne Seite fragt nach der zweiten
  // Person
  const hinweis = seite === "gold" ? null : t("datum.partner");
  const meldung = laedt ? t("datum.oeffnet") : (gesperrtMeldung ?? hinweis);

  return (
    <main className="sp">
      {/* Drei Ebenen uebereinander: Knoepfe, darueber die Walzenplatte, oben die Datumsscheibe. Beim Uebergang
          bewegen sich die oberen beiden als Ganzes und muessen nicht in jedem Bild neu gezeichnet werden. */}
      <div className={abgang ? "sp-buehne dr-abgang" : "sp-buehne"}>
        <svg viewBox={`0 0 400 ${HOEHE}`} className="sp-svg dr-svg">
          <defs>
            <radialGradient id="dr-messing" cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor={hell} />
              <stop offset="0.55" stopColor={mittel} />
              <stop offset="1" stopColor={dunkel} />
            </radialGradient>
            {/* Rand der Scheibe ohne Umrisslinie: Fase oben im Licht, unten im Schatten */}
            <linearGradient id="dr-scheibenkante" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={hell} />
              <stop offset="0.5" stopColor={mittel} />
              <stop offset="1" stopColor={dunkel} />
            </linearGradient>
            <PlattenVerlauf id="ow-platte-gold" aussen={platte.platteAussen} />
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

          {/* Spielknoepfe in den Ecken mit gravierten Symbolen (A Sonne, B Sanduhr, C Sonne und Mond); C liegt
              unter der Walzenplatte */}
          <g className="dr-knoepfe">
            {KNOEPFE.map((k) => (
              <g
                key={k.spiel}
                className={`dr-knopf dr-knopf-${k.spiel}${gedrueckt === k.spiel ? " gedrueckt" : ""}${aktiv(k.spiel) ? "" : " gesperrt"}`}
                onPointerDown={(e) => knopf(e, k.spiel)}
                role="button"
                aria-label={t("datum.spiel", { spiel: k.spiel })}
              >
                <circle
                  cx={k.x}
                  cy={k.y}
                  r={KNOPF.rand}
                  fill={k.silber ? "url(#dr-rahmen-silber)" : "url(#dr-rahmen)"}
                  className="dr-knopfrand"
                />
                <circle
                  cx={k.x}
                  cy={k.y}
                  r={KNOPF.mitte}
                  className="dr-knopfmitte"
                />
                <Knopfsymbol
                  spiel={k.spiel}
                  x={k.x}
                  y={k.y}
                  filter="url(#dr-gravur)"
                />
              </g>
            ))}
          </g>
        </svg>

        {/* Ortswalzen unter dem Kreis: beim Abgang drehen sie um den Kreismittelpunkt rechts hinaus */}
        <svg
          viewBox={`0 0 400 ${HOEHE}`}
          className="sp-svg dr-svg dr-ebene dr-walzen"
          style={{ transformOrigin: `50% ${(MITTE.y / HOEHE) * 100}%` }}
        >
          <g>
            <OrtWalzen
              svgPunkt={svgPunkt}
              metall={seite}
              onOrt={setOrt}
              platteInnen={platte.platteInnen}
              platteAussen={platte.platteAussen}
            />
          </g>
        </svg>

        {/* Mantel des Pucks unter der Scheibe, nur waehrend sie sich dreht */}
        {abgang || wechselt ? (
          <Mantel
            praefix="dr"
            hoehe={HOEHE}
            radius={196}
            liegend={wechselt}
            licht={scheibe.seite === 1 ? "unten" : "oben"}
            style={
              wechselt
                ? // liegend ist der Mantel um 90 Grad gedreht: dort zeigt +x nach unten
                  { "--kipp": `${scheibe.kipp}deg`, "--seite": -scheibe.seite }
                : undefined
            }
          />
        ) : null}

        {/* runde Scheibe: dreht sich beim Seitenwechsel wie eine Muenze; beim Abgang zum magischen Auge */}
        <svg
          ref={svgRef}
          viewBox={`0 0 400 ${HOEHE}`}
          className="sp-svg dr-svg dr-ebene dr-scheibe"
          style={{ transformOrigin: `50% ${(MITTE.y / HOEHE) * 100}%` }}
          onPointerDown={druecken}
          onPointerMove={bewegen}
          onPointerUp={loslassen}
          onPointerCancel={loslassen}
          role="group"
          aria-label={t("datum.scheibe")}
        >
          <g transform={scheibeTransform} className={`dr-${scheibe.metall}`}>
            {/* Schatten der Scheibe auf die Platte darunter (versetzte Kopien statt Filter) */}
            {[
              [4, 0.12],
              [2, 0.22],
            ].map(([dy, deckung]) => (
              <circle
                key={dy}
                cx={MITTE.x}
                cy={MITTE.y + dy}
                r="196"
                fill="#1a1006"
                opacity={deckung}
              />
            ))}
            <circle
              cx={MITTE.x}
              cy={MITTE.y}
              r="196"
              fill="url(#dr-messing)"
              stroke="url(#dr-scheibenkante)"
              strokeWidth="1.6"
            />

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
            {/* Trennfugen zwischen den Ringen: schmale Rille, dunkel, darunter eine Lichtkante */}
            {[...RINGE.map((r) => r.aussen), 68].map((r) => (
              <g key={r}>
                <circle
                  cx={MITTE.x}
                  cy={MITTE.y + 0.8}
                  r={r}
                  className="dr-fuge-licht"
                  stroke={hell}
                />
                <circle cx={MITTE.x} cy={MITTE.y} r={r} className="dr-fuge" />
              </g>
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
          </g>
        </svg>

        {/* Mitte als eigene Ebene ueber der Scheibe: das Zaehlwerk bewegt sich mit der Neigung des Geraets,
            ohne dass die Ringe neu gezeichnet werden muessen; folgt der Scheibe bei Muenzdrehung und Abgang */}
        <svg
          viewBox={`0 0 400 ${HOEHE}`}
          className="sp-svg dr-svg dr-ebene dr-scheibe-mitte"
          style={{ transformOrigin: `50% ${(MITTE.y / HOEHE) * 100}%` }}
          aria-hidden="true"
        >
          <g transform={scheibeTransform}>
            {/* Mitte: kleine Linse ueber einem Rollenzaehlwerk, das das eingestellte Datum zeigt */}
            <Zaehlwerk
              tag={werte.tag}
              monat={werte.monat}
              jahr={werte.jahr}
              stunde={werte.stunde}
              hell={hell}
              mittel={mittel}
              dunkel={dunkel}
              rollt={!zieht}
              parallaxe
            />
          </g>
        </svg>
      </div>

      <div className="sp-fuss dr-fuss">
        {ort ? (
          <p className="sc-hinweis">{`${ort.name}, ${ort.landName}`}</p>
        ) : null}
        {meldung ? <p className="sc-hinweis">{meldung}</p> : null}
        {fehler ? <p className="sc-fehler">{fehler}</p> : null}
      </div>
    </main>
  );
}
