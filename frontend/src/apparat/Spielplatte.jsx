import { memo, useEffect, useRef, useState } from "react";
import { useLichtmesser } from "./lichtmesser";
import { SYSTEME } from "./systeme";
import HoroskopIcon from "./HoroskopIcon";
import Schlitz, { SchlitzDefs } from "./Schlitze";
import LuenettePraegung, { LuenetteDefs } from "./Luenette";
import Uhrwerk from "./Uhrwerk";
import Diascheibe, { Rotglas, fensterLage } from "./Diascheibe";
import Mantel from "./Mantel";
import { LupenFilter } from "./lupe";
import { Platte, PlattenVerlauf, Schlitzkante, Walzenplatte } from "./platte";
import {
  AUGE_RADIUS,
  FAECHER_RECHTS,
  LINSE_RADIUS,
  MITTE,
  RUHE_ANTEIL,
  bogenPfad,
  layoutAusFenster,
  polarAusPunkt,
  punktU,
  uAusWert,
  wertAusU,
} from "./geometrie";
import { einrasten, hebel, ratsche, rastKlick, sperre, zahnrad } from "./klang";
import { durchlichtStarten } from "./durchlicht";
import { neigungAbonnieren } from "./neigung";

const ALLE = SYSTEME.map((s) => s.id);
// eingravierte Kuerzel links der Schlitze
const KUERZEL = SYSTEME.map((s) => s.gravur);
const SCHRITT = 0.2; // eigener Schieber: 11 Rasten von -1 bis +1
const SCHWELLE = 0.5; // ab hier rastet ein Schieber rechts ein (bzw. schaltet das Dia weiter)
// Ausloesehebel: radial schraeg rechts unten neben dem Auge, ausserhalb der Faecherplatte. Der Schlitz liegt
// auf einem Strahl vom Augenmittelpunkt (Winkel phi aus der Senkrechten), gezogen wird nach aussen.
const HEBEL = { r0: 232, phi: 0.6, weg: 62 };
const HEBEL_RICHTUNG = { x: Math.sin(HEBEL.phi), y: Math.cos(HEBEL.phi) };
const HEBEL_ANKER = {
  x: MITTE.x + HEBEL.r0 * HEBEL_RICHTUNG.x,
  y: MITTE.y + HEBEL.r0 * HEBEL_RICHTUNG.y,
};
const HEBEL_DREHUNG = (-HEBEL.phi * 180) / Math.PI;
const RUHE = 0.035; // u-Toleranz fuer "steht in der Ruheposition"
// Prototyp: Belichtung und Lichtmesser-Werte im Auge anzeigen (aus; zum Kamera-Testen auf true)
const MESSWERTE_ZEIGEN = false;

const easeAus = (t) => 1 - (1 - t) ** 3;
function easeMechanisch(t) {
  // leichtes Ueberschwingen und Einrasten
  const c = 1.4;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

// --- Feste Teile des Faechers ------------------------------------------------------
// Sie aendern sich nur mit der Fenstergroesse. Als memo-Komponenten zeichnet React sie beim Ziehen eines
// Schiebers nicht jedes Mal neu (sonst ruckelt es, vor allem in Safari).

// Messingplatte, Einkerbungen der Skala und der Grund der Schlitze
const Unterbau = memo(function Unterbau({
  radien,
  abstand,
  theta,
  schlitz,
  platteInnen,
  platteAussen,
  rUser,
  userBreite,
}) {
  const strahlen = Array.from({ length: 11 }, (_, k) =>
    uAusWert(-1 + k * SCHRITT),
  );
  return (
    <>
      {/* Platte: derselbe Messington wie der Ring um das Glas; rechts bis 4:30, dort steht der Hebel.
          Fingerabdruecke dort, wo man den eigenen Schieber zieht und am Hebel */}
      <Platte
        innen={platteInnen}
        aussen={platteAussen}
        links={theta + 0.22}
        rechts={FAECHER_RECHTS}
        fuellung="url(#sp-platte)"
        spuren={{
          versatz: [-83, 41],
          drehung: 23,
          stellen: [
            [MITTE.x, MITTE.y + rUser, 70],
            [330, 470, 45],
            [80, 430, 40],
          ],
        }}
      />
      {/* daneben, ueber den Spalt, die Walzenplatte der Ortseingabe (1:30 bis 4:30); ihre Schlitze liegen
          ausserhalb des Bildes */}
      <Walzenplatte
        innen={platteInnen}
        aussen={platteAussen}
        fuellung="url(#sp-platte)"
        transform={`rotate(-90 ${MITTE.x} ${MITTE.y})`}
      />

      {/* Strahlen: Einkerbungen zwischen den Schlitzen = gemeinsame Skala */}
      {strahlen.map((u, k) =>
        radien.slice(0, -1).map((r, j) => {
          const a = j
            ? punktU(r + schlitz / 2 + 3, u, theta)
            : punktU(rUser + userBreite / 2 + 3, u, theta);
          const b = punktU(radien[j + 1] - schlitz / 2 - 3, u, theta);
          const mitte = k === 5;
          return (
            <g key={`${k}-${j}`}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#2a1e12"
                strokeWidth={mitte ? 2.4 : 1.6}
                strokeLinecap="round"
              />
              <line
                x1={a.x + 0.9}
                y1={a.y + 0.6}
                x2={b.x + 0.9}
                y2={b.y + 0.6}
                stroke="#c9a66b"
                strokeWidth="0.6"
                opacity="0.6"
              />
            </g>
          );
        }),
      )}
      {/* Kanten der Schlitze (die Schieber selbst zeichnet Schlitz darueber) */}
      {radien.map((rSys, k) => (
        <Schlitzkante
          key={rSys}
          r={k ? rSys : rUser}
          theta={theta}
          breite={k ? schlitz : userBreite - 2.4}
        />
      ))}
    </>
  );
});

// Sperrzaehne am Ende der Ruheposition, ueber den Schiebern
const Sperrzaehne = memo(function Sperrzaehne({
  radien,
  theta,
  schlitz,
  rUser,
  userBreite,
}) {
  return radien.map((rSys, k) => {
    const r = k ? rSys : rUser;
    const breite = k ? schlitz : userBreite;
    const sperrA = punktU(r - breite / 2, RUHE_ANTEIL * 0.55, theta);
    const sperrB = punktU(r + breite / 2, RUHE_ANTEIL * 0.55, theta);
    return (
      <line
        key={r}
        x1={sperrA.x}
        y1={sperrA.y}
        x2={sperrB.x}
        y2={sperrB.y}
        className="sp-sperrzahn"
      />
    );
  });
});

// eingravierte Kuerzel der Horoskope (die Pole stehen unten auf dem Dia)
const Beschriftung = memo(function Beschriftung({ radien, theta, symbol }) {
  return (
    <>
      {/* Kuerzel der Horoskope: links neben jedem Schlitz, auf der Verlaengerung des Bogens eingraviert */}
      <g className="sp-pole sp-kuerzel">
        {SYSTEME.map((sys, i) => {
          const r = radien[i + 1];
          const proU = 1 / (2 * theta * r); // u je viewBox-Einheit Weg auf diesem Bogen
          const ende = -(symbol * 1.15 + 4) * proU; // vor dem Knopf in Ruhestellung
          return (
            <path
              key={sys.id}
              id={`sp-kuerzelbogen-${i}`}
              d={bogenPfad(r, theta, ende - 70 * proU, ende)}
              fill="none"
            />
          );
        })}
        {[
          ["schatten", "translate(0 -0.6)"],
          ["licht", "translate(0 0.8)"],
          ["", undefined],
        ].map(([art, verschiebung]) => (
          <g key={art || "mitte"} transform={verschiebung} className={art}>
            {KUERZEL.map((kurz, i) => (
              <text key={kurz} dy="0.35em">
                <textPath
                  href={`#sp-kuerzelbogen-${i}`}
                  xlinkHref={`#sp-kuerzelbogen-${i}`}
                  startOffset="100%"
                  textAnchor="end"
                >
                  {kurz}
                </textPath>
              </text>
            ))}
          </g>
        ))}
      </g>
    </>
  );
});

// Auge: Messingring, Glas und Luenette (beim Auftritt dreht es sich wie eine Muenze herein)
const Auge = memo(function Auge() {
  return (
    <g className="sp-auge">
      <circle
        cx={MITTE.x}
        cy={MITTE.y}
        r={AUGE_RADIUS}
        fill="url(#sp-messing)"
        filter="url(#sp-luenette-schatten)"
      />
      <circle
        cx={MITTE.x}
        cy={MITTE.y}
        r={LINSE_RADIUS}
        fill="url(#sp-linse)"
        stroke="#3a2c1a"
        strokeWidth="2"
      />
      <LuenettePraegung praefix="sp" />
    </g>
  );
});

/**
 * Fragerunde als Faecher: oben das Auge mit dem Fragedia, unten der eigene Schieber und die Systembögen.
 * Mechanik siehe docs/Konzepte/Apparat_Mechanik.md. Das Aufziehen wirkt nur auf die Anzeige;
 * onAntwort bekommt die Werte aller Systeme.
 * Nach dem Ausloesen bleibt der Hebel unten; erst wenn man ihn wieder hochschiebt, laufen alle Schieber nach
 * links zurueck und das naechste Aufziehen beginnt.
 * Nach der letzten Frage: Ergebnis-Dia (blaues Glas); erst wenn alle Systeme, die mitgespielt haben, und der
 * eigene Schieber ganz rechts stehen, loest der Hebel die Auswertung aus; die anderen bleiben blockiert. Dann zeigt das Dia die Rangliste und die Systemschieber
 * fahren auf ihren Skill (-100 links .. +100 rechts). Wischen oder Tippen im Auge: onWeiter (Textkarten).
 */
export default function Spielplatte({
  fragen,
  zielWert,
  onAntwort,
  kamera,
  kameraInfo,
  pole = ["trifft nicht zu", "trifft zu"],
  auftritt = false,
  abgang = false,
  uhrwerk = false, // das Uhrwerk im Loch unter dem Auge laeuft (man sieht es, solange die Scheibe auf der Kante steht)
  wartet = false, // Datumsseite: der Faecher liegt links auf der Drehscheibe bereit (Auge und Linse fehlen)
  zusatz = null, // statt Hinweis/Knopf unten (z. B. Messingplaettchen); solange gesetzt, ruht das Aufziehen
  sonderDia = null, // eigenes Dia im Auge (z. B. Nachfrage "Wann war das?")
  ergebnis = null, // Auswertung (ranking, systemDetails.skillScore); kann nach dem Hebelzug noch fehlen
  titel = "Dein Ergebnis",
  erklaerung = null, // Satz zur Skala unter der Rangliste
  hinweis = null, // z. B. "Antworten gewuerfelt" (Abkuerzung)
  sofort = false, // Abkuerzung: gleich mit der Auswertung beginnen
  onAuswertung, // die Rangliste ist sichtbar
  onWeiter, // Wischen/Tippen im Auge waehrend der Auswertung: weiter zu den Textkarten
  vonMitte = false, // Paarfragen: die Balken der Schlitze wachsen von der Mitte aus
  onRueckgaengig, // "‹": die letzte Antwort wird zurueckgenommen (Apparat.jsx)
  steuerung = null, // Ref: Apparat ruft steuerung.current.zurueck() fuer "‹" links oben
}) {
  const [layout, setLayout] = useState(layoutAusFenster);
  const {
    radien,
    abstand,
    symbol,
    theta,
    schlitz,
    hoehe,
    platteInnen,
    platteAussen,
  } = layout;
  // eigener Schieber: duenner Schlitz, etwas naeher am Auge, damit er sich von den Horoskop-Schiebern abhebt
  const rUser = radien[0] - abstand * 0.22;
  const userBreite = schlitz * 0.32;

  // Auf der Datumsseite steht der eigene Schieber in der Mitte seines Bogens: dort liegt er unter der
  // Datumsscheibe, man sieht ihn nicht
  const startPos = {
    user: sofort ? 1 : wartet ? 0.5 : 0,
    dia: 0,
    hebel: 0,
    ...Object.fromEntries(ALLE.map((s) => [s, sofort ? 1 : 0])),
  };
  const [pos, setPos] = useState(startPos);
  const posRef = useRef(startPos);
  // aufziehen | frage | laeuft | ergebnis | fertig | endaufzug (Ergebnis-Dia) | rechnet | auswertung
  const startZustand = sofort ? "rechnet" : "aufziehen";
  const [zustand, setZustandState] = useState(startZustand);
  const zustandRef = useRef(startZustand);
  const ergebnisRef = useRef(ergebnis);
  ergebnisRef.current = ergebnis;
  const [index, setIndexState] = useState(-1); // -1 = Einleitungsdia
  const indexRef = useRef(-1);
  const [aufgezogen, setAufgezogenState] = useState([]);
  const aufgezogenRef = useRef(new Set());
  // Systeme, die bei mindestens einer Frage aufgezogen waren: nur sie kommen ins Ergebnis
  const gespieltRef = useRef(new Set(sofort ? ALLE : []));

  const svgRef = useRef(null);
  const zusatzRef = useRef(zusatz);
  zusatzRef.current = zusatz;
  const videoRef = useRef(null);
  const lichtRef = useRef(null);
  const linseRef = useRef(null);
  const [linseD, setLinseD] = useState(0); // Durchmesser der Linse in CSS-Pixeln (fuer den Lupenfilter)
  const tiefeRef = useRef(null);
  // Parallaxe: kippt man das Geraet, rueckt der Grund der Bohrung (Licht, Dia, Scheibe) zur Seite des Blicks;
  // CSS translate, unabhaengig vom transform beim Hereindrehen. Bei voller Neigung (neigung.js: SPANNE) ist
  // er um einen Linsendurchmesser verschoben, das Dia ganz hinter der Wand (Tiefe und Vergroesserung der Linse).
  useEffect(() => {
    if (!linseD) return undefined;
    const weit = linseD;
    return neigungAbonnieren(({ x, y }) => {
      if (tiefeRef.current)
        tiefeRef.current.style.translate = `${x * weit}px ${y * weit}px`;
    });
  }, [linseD]);
  const drag = useRef(null);
  const anim = useRef(new Map());
  const raf = useRef(0);

  function setzePos(teil) {
    posRef.current = { ...posRef.current, ...teil };
    setPos(posRef.current);
  }
  function setZustand(z) {
    zustandRef.current = z;
    setZustandState(z);
  }
  function setIndex(i) {
    indexRef.current = i;
    setIndexState(i);
  }
  function aufgezogenAktualisieren() {
    setAufgezogenState([...aufgezogenRef.current]);
  }

  useEffect(() => {
    const el = linseRef.current;
    if (!el) return undefined;
    const beobachter = new ResizeObserver(() =>
      setLinseD(Math.round(el.offsetWidth)),
    );
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, []);

  useEffect(() => {
    const f = () => setLayout(layoutAusFenster());
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  // --- Animation ---------------------------------------------------------------
  function tick(jetzt) {
    const neu = {};
    const erledigt = [];
    for (const [k, a] of anim.current) {
      const t = Math.min(1, Math.max(0, (jetzt - a.start) / a.dauer));
      neu[k] = a.von + (a.nach - a.von) * a.ease(t);
      if (t >= 1) erledigt.push(a);
    }
    erledigt.forEach((a) => anim.current.delete(a.key));
    setzePos(neu);
    erledigt.forEach((a) => a.fertig?.());
    raf.current = anim.current.size ? requestAnimationFrame(tick) : 0;
  }

  function animiere(
    key,
    nach,
    dauer,
    { ease = easeAus, verz = 0, fertig } = {},
  ) {
    anim.current.set(key, {
      key,
      von: posRef.current[key],
      nach,
      start: performance.now() + verz,
      dauer,
      ease,
      fertig,
    });
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    video.srcObject = kamera ?? null;
    if (!kamera || !lichtRef.current) return undefined;
    return durchlichtStarten(lichtRef.current, video);
  }, [kamera]);

  const licht = useLichtmesser(videoRef, MESSWERTE_ZEIGEN && Boolean(kamera));

  // Beim Hereindrehen laeuft er unbemerkt nach links in die Ruhe
  useEffect(() => {
    if (!wartet && posRef.current.user === 0.5)
      animiere("user", 0, 350, { ease: easeMechanisch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wartet]);

  // Beim ersten Spiel ruckt ein Symbol von selbst an: "hier kann man ziehen" (erst wenn der Faecher da ist)
  useEffect(() => {
    if (wartet) return undefined;
    const t = setTimeout(() => {
      if (
        drag.current ||
        aufgezogenRef.current.size ||
        indexRef.current !== -1 ||
        zustandRef.current !== "aufziehen"
      )
        return;
      animiere("Numerologie", 0.13, 260, {
        fertig: () => {
          einrasten();
          animiere("Numerologie", 0, 420, { ease: easeMechanisch });
        },
      });
    }, 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wartet]);

  // --- Zeiger ------------------------------------------------------------------
  function svgPunkt(e) {
    const svg = svgRef.current;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  function greifen(r, u) {
    const d = drag.current;
    for (let k = 1; k < radien.length; k += 1) {
      if (Math.abs(r - radien[k]) > abstand * 0.8) continue;
      const s = ALLE[k - 1];
      if (d.gegriffen.has(s)) continue;
      if (!verriegelt(zustandRef.current) && aufgezogenRef.current.has(s))
        continue;
      if (zustandRef.current === "endaufzug" && !gespieltRef.current.has(s)) {
        // nicht mitgespielt: bleibt im Schlussaufzug blockiert
        if (!d.angestossen) sperre();
        d.angestossen = true;
        continue;
      }
      const p = posRef.current[s];
      if (Math.abs(u - p) * 2 * theta * radien[k] > symbol * 1.7) continue;
      anim.current.delete(s);
      d.gegriffen.set(s, p);
    }
    // Mitnehmer: der unterste Schieber nimmt, aus der Ruhe aufgezogen, alle anderen in der Ruhe mit
    const unten = ALLE[ALLE.length - 1];
    if (
      !d.mitnehmer &&
      d.gegriffen.has(unten) &&
      d.gegriffen.get(unten) < RUHE
    ) {
      d.mitnehmer = true;
      for (const s of ALLE) {
        if (d.gegriffen.has(s) || posRef.current[s] >= RUHE) continue;
        if (!verriegelt(zustandRef.current) && aufgezogenRef.current.has(s))
          continue;
        if (zustandRef.current === "endaufzug" && !gespieltRef.current.has(s))
          continue;
        anim.current.delete(s);
        d.gegriffen.set(s, posRef.current[s]);
      }
    }
  }

  function diaTreiben() {
    // Das Dia folgt einem Schieber aus der Ruheposition (schon dem ersten: er hat den vollen Weg)
    const d = drag.current;
    if (zustandRef.current !== "aufziehen") return;
    let weg = 0;
    for (const [s, start] of d.gegriffen)
      if (start < RUHE) weg = Math.max(weg, posRef.current[s]);
    if (weg > 0) {
      anim.current.delete("dia");
      setzePos({ dia: Math.min(1, weg) });
    }
  }

  function userSetzen(u) {
    let neu;
    if (u < RUHE_ANTEIL * 0.5) neu = 0;
    else {
      const w = Math.max(
        -1,
        Math.min(1, Math.round(wertAusU(u) / SCHRITT) * SCHRITT),
      );
      neu = uAusWert(w);
    }
    if (Math.abs(neu - posRef.current.user) > 1e-6) {
      if (posRef.current.user < RUHE || neu < RUHE)
        einrasten(); // Sperrklinke
      else rastKlick();
    }
    setzePos({ user: neu });
  }

  function druecken(e) {
    if (zusatzRef.current) return;
    const z = zustandRef.current;
    if (["laeuft", "fertig", "rechnet"].includes(z) || drag.current) return;
    const { x, y } = svgPunkt(e);
    if (z === "auswertung") {
      // im Auge wischen oder tippen: weiter zu den Textkarten
      if (Math.hypot(x - MITTE.x, y - MITTE.y) < LINSE_RADIUS)
        drag.current = { art: "wisch", x0: x, x };
      return;
    }
    const { r, u } = polarAusPunkt(x, y, theta);
    if (
      (z === "frage" || z === "endaufzug") &&
      Math.abs(r - rUser) < abstand * 0.6
    ) {
      drag.current = { art: "user" };
      e.currentTarget.setPointerCapture?.(e.pointerId);
      userSetzen(u);
      return;
    }
    drag.current = { art: "system", gegriffen: new Map(), stufe: {} };
    greifen(r, u);
    if (!drag.current.gegriffen.size) {
      drag.current = null;
      return;
    }
    if (verriegelt(z)) {
      // solange der Hebel unten steht, sind die Schieber blockiert
      drag.current = null;
      sperre();
      return;
    }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    bewegen(e);
  }

  function bewegen(e) {
    const d = drag.current;
    if (!d) return;
    const { x, y } = svgPunkt(e);
    if (d.art === "wisch") {
      d.x = x;
      return;
    }
    if (d.art === "hebel") {
      // Fingerbewegung auf die Schlitzachse projiziert
      const weg =
        (x - d.p0.x) * HEBEL_RICHTUNG.x + (y - d.p0.y) * HEBEL_RICHTUNG.y;
      const neu = Math.max(0, Math.min(1, d.h0 + weg / HEBEL.weg));
      if (Math.abs(weg) > 4) d.gezogen = true;
      setzePos({ hebel: neu });
      return;
    }
    const { r, u } = polarAusPunkt(x, y, theta);
    if (d.art === "user") {
      userSetzen(u);
      return;
    }
    greifen(r, u);
    const neu = {};
    let geklickt = false; // mitgenommene Schieber rasten gemeinsam: ein Klick
    for (const s of d.gegriffen.keys()) {
      const wert = Math.max(0, Math.min(1, u));
      neu[s] = wert;
      const stufe = Math.floor(wert * 10);
      if (d.stufe[s] !== undefined && stufe !== d.stufe[s] && !geklickt) {
        rastKlick();
        geklickt = true;
      }
      d.stufe[s] = stufe;
    }
    setzePos(neu);
    diaTreiben();
  }

  function loslassen() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.art === "wisch") {
      if (d.x - d.x0 < -30 || Math.abs(d.x - d.x0) < 6) onWeiter?.();
      return;
    }
    if (d.art === "hebel") {
      if (d.hoch) {
        if (posRef.current.hebel <= 0.4 || !d.gezogen) entriegeln();
        else animiere("hebel", 1, 200);
      } else if (posRef.current.hebel >= 0.6 || !d.gezogen) ausloesen();
      else animiere("hebel", 0, 250);
      return;
    }
    if (d.art !== "system") return;
    for (const s of d.gegriffen.keys()) {
      if (posRef.current[s] >= SCHWELLE) {
        aufgezogenRef.current.add(s);
        animiere(s, 1, 180); // Loslassen ohne Ton
      } else {
        animiere(s, 0, 300, { ease: easeMechanisch });
      }
    }
    aufgezogenAktualisieren();
    if (zustandRef.current === "aufziehen" && posRef.current.dia > 0) {
      if (posRef.current.dia >= SCHWELLE) {
        animiere("dia", 1, 260, {
          fertig: () => {
            setIndex(indexRef.current + 1);
            setzePos({ dia: 0 });
            setZustand("frage");
          },
        });
      } else {
        animiere("dia", 0, 300);
      }
    }
  }

  // --- Hebel ----------------------------------------------------------------
  const USER_RECHTS = uAusWert(1) - 1e-3;
  const bereit = (z, user, anzahl) =>
    (z === "frage" && user >= RUHE) ||
    (z === "endaufzug" &&
      anzahl === gespieltRef.current.size &&
      user >= USER_RECHTS);
  // nach dem Ausloesen steht der Hebel unten und haelt die Schieber fest, bis man ihn hochschiebt
  const verriegelt = (z) => z === "ergebnis" || z === "fertig";
  const gesperrt =
    !bereit(zustand, pos.user, aufgezogen.length) && !verriegelt(zustand);

  function hebelDruecken(e) {
    e.stopPropagation();
    if (drag.current || zustandRef.current === "laeuft") return;
    if (verriegelt(zustandRef.current)) {
      if (zusatzRef.current) return; // erst die Nachfrage beantworten
      drag.current = {
        art: "hebel",
        hoch: true,
        p0: svgPunkt(e),
        h0: posRef.current.hebel,
        gezogen: false,
      };
      svgRef.current.setPointerCapture?.(e.pointerId);
      return;
    }
    if (
      !bereit(
        zustandRef.current,
        posRef.current.user,
        aufgezogenRef.current.size,
      )
    ) {
      sperre();
      // steht der Hebel noch unten (nach dem Ausloesen), ruckt er nicht
      if (posRef.current.hebel < 0.5)
        animiere("hebel", 0.07, 70, {
          fertig: () => animiere("hebel", 0, 160),
        });
      return;
    }
    drag.current = {
      art: "hebel",
      p0: svgPunkt(e),
      h0: posRef.current.hebel,
      gezogen: false,
    };
    svgRef.current.setPointerCapture?.(e.pointerId);
  }

  function ausloesen() {
    if (zustandRef.current === "endaufzug") {
      setZustand("rechnet");
      hebel();
      animiere("hebel", 1, 110); // bleibt unten (Auswertung)
      if (ergebnisRef.current) auswertungZeigen();
      return;
    }
    const frage = fragen[indexRef.current];
    setZustand("laeuft");
    hebel();
    animiere("hebel", 1, 110); // bleibt unten, bis man ihn wieder hochschiebt
    const aktiv = ALLE.filter((s) => aufgezogenRef.current.has(s));
    aktiv.forEach((s) => gespieltRef.current.add(s));
    onAntwort(frage, wertAusU(posRef.current.user), aktiv);
    const DAUER = 1100;
    const VERZ = 140;
    aktiv.forEach((s, i) => {
      const ziel = uAusWert(zielWert(s, frage.dimension, frage));
      const verz = 120 + i * VERZ;
      // Klicks im Takt der Bewegung: erst wenn dieser Schieber losfaehrt, dicht am Anfang, dann seltener
      zahnrad(
        Math.max(3, Math.round((1 - ziel) * 30)),
        DAUER / 1000,
        1800 + i * 180,
        { verz: verz / 1000, ease: easeMechanisch },
      );
      animiere(s, ziel, DAUER, {
        ease: easeMechanisch,
        verz,
        fertig:
          i === aktiv.length - 1
            ? () =>
                setZustand(
                  indexRef.current + 1 >= fragen.length ? "fertig" : "ergebnis",
                )
            : undefined,
      });
    });
  }

  function entriegeln() {
    // Hebel hoch: alle Schieber, auch der eigene, laufen nach links zurueck. Nach der letzten Frage kommt
    // das Ergebnis-Dia; wie es weitergeht, sollen die Spieler selbst entdecken (alles nach rechts, Hebel).
    setZustand(zustandRef.current === "fertig" ? "endaufzug" : "aufziehen");
    aufgezogenRef.current.clear();
    aufgezogenAktualisieren();
    einrasten();
    ratsche();
    animiere("hebel", 0, 160);
    ALLE.forEach((s, i) =>
      animiere(s, 0, 300, { verz: 60 + i * 30, ease: easeMechanisch }),
    );
    animiere("user", 0, 300, { verz: 60 });
  }

  // "‹" links oben: eine Frage zurueck. Steht ein Ergebnis da (auch die Rangliste), wird die Frage noch einmal
  // gespielt; in der Ruhe am Anfang einer Frage geht es immer weiter zurueck. Die Antwort der zurueckgenommenen
  // Frage verwirft der Apparat (fuer die Forschung bleibt die erste). Liefert false, wenn es nichts mehr
  // zurueckzunehmen gibt: dann geht es zur Datumsscheibe.
  const [rueckwaerts, setRueckwaerts] = useState(false); // das rote Glas gleitet zurueck
  function zurueck() {
    const z = zustandRef.current;
    if (sofort) return false; // Abkuerzung: gewuerfelte Antworten, nichts zurueckzunehmen
    if (z === "laeuft" || drag.current || zusatzRef.current) return true;
    const i = indexRef.current;
    if (z === "aufziehen" && i < 0) return false;
    // in der Frage ist die aktuelle noch nicht beantwortet; sonst wird sie zurueckgenommen
    if (z !== "frage") onRueckgaengig?.();
    anim.current.clear();
    setIndex(i - 1);
    setzePos({ dia: 0 });
    setZustand("aufziehen");
    aufgezogenRef.current.clear();
    aufgezogenAktualisieren();
    setRueckwaerts(true);
    setTimeout(() => setRueckwaerts(false), 1000);
    ratsche();
    animiere("hebel", 0, 200);
    ALLE.forEach((s, k) =>
      animiere(s, 0, 320, { verz: 40 + k * 30, ease: easeMechanisch }),
    );
    animiere("user", 0, 320, { verz: 40 });
    return true;
  }
  if (steuerung) steuerung.current = { zurueck };

  // --- Ergebnis ----------------------------------------------------------------

  // Auswertung, sobald gerechnet ist: Rangliste ins Auge, Schieber auf den Skill
  useEffect(() => {
    if (zustand === "rechnet" && ergebnis) auswertungZeigen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zustand, ergebnis]);

  function auswertungZeigen() {
    const details = ergebnisRef.current?.alle?.systemDetails ?? {};
    setZustand("auswertung");
    onAuswertung?.();
    const DAUER = 1300;
    ALLE.filter((s) => gespieltRef.current.has(s)).forEach((s, i) => {
      const ziel = uAusWert((details[s]?.skillScore ?? 0) / 100);
      const verz = 300 + i * 140;
      zahnrad(
        Math.max(3, Math.round((1 - ziel) * 30)),
        DAUER / 1000,
        1800 + i * 180,
        { verz: verz / 1000, ease: easeMechanisch },
      );
      animiere(s, ziel, DAUER, { ease: easeMechanisch, verz });
    });
  }

  // --- Darstellung -------------------------------------------------------------
  const zeigeUserStrahl =
    ["laeuft", "ergebnis", "fertig", "rechnet", "auswertung"].includes(
      zustand,
    ) && pos.user >= RUHE;

  const diaText = (i) => {
    if (i < 0) return null; // erstes Dia: leeres Glas (das erste Aufziehen schiebt es weg)
    if (i >= fragen.length) return "";
    return (
      <>
        <span>{fragen[i].text}</span>
        {/* die Pole des Schiebers, klein am unteren Rand des Dias */}
        <span className="sp-dia-pole" aria-hidden="true">
          <span>◂ {pole[0]}</span>
          <span>{pole[1]} ▸</span>
        </span>
      </>
    );
  };
  // Zaehler auf der Scheibe: aktuelle Frage (nach der letzten: alle durch)
  const zaehlerStand = ["endaufzug", "rechnet", "auswertung"].includes(zustand)
    ? fragen.length
    : index;
  const lupe = linseD ? { filter: "url(#sp-lupe)" } : undefined;

  const linse = {
    left: `${((MITTE.x - LINSE_RADIUS) / 400) * 100}%`,
    width: `${((2 * LINSE_RADIUS) / 400) * 100}%`,
    top: `${((MITTE.y - LINSE_RADIUS) / hoehe) * 100}%`,
    height: `${((2 * LINSE_RADIUS) / hoehe) * 100}%`,
  };
  const knaufY = pos.hebel * HEBEL.weg; // im gedrehten Hebel-Koordinatensystem
  // Masse fuer die festen Teile des Faechers (aendern sich nur mit der Fenstergroesse)
  const geo = {
    radien,
    abstand,
    theta,
    schlitz,
    symbol,
    platteInnen,
    platteAussen,
    rUser,
    userBreite,
  };

  return (
    <main
      className={`sp${auftritt ? " sp-auftritt" : ""}${abgang ? " sp-abgang" : ""}${wartet ? " sp-wartet" : ""}`}
    >
      <div className="sp-buehne">
        <Uhrwerk laeuft={uhrwerk} />
        {/* Faecher und Hebel als eigene Ebene: beim Drehen der Scheibe wird sie nur verschoben, nicht in jedem
            Bild neu gezeichnet (sonst ruckelt es auf dem Handy) */}
        <svg
          ref={svgRef}
          viewBox={`0 0 400 ${hoehe}`}
          className="sp-svg sp-drehteil"
          style={{ transformOrigin: `50% ${(MITTE.y / hoehe) * 100}%` }}
          onPointerDown={druecken}
          onPointerMove={bewegen}
          onPointerUp={loslassen}
          onPointerCancel={loslassen}
        >
          <defs>
            <SchlitzDefs />
            <linearGradient id="sp-stein-tafel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b9dcff" />
              <stop offset="0.5" stopColor="#4a8ae6" />
              <stop offset="1" stopColor="#1d4cad" />
            </linearGradient>
            <radialGradient id="sp-stein-glanz" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sp-rubin" cx="45%" cy="40%" r="65%">
              <stop offset="0" stopColor="#d4304e" />
              <stop offset="0.55" stopColor="#8e1027" />
              <stop offset="1" stopColor="#3d0410" />
            </radialGradient>
            <radialGradient id="sp-rubin-schimmer" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#ff6b7d" stopOpacity="0.7" />
              <stop offset="1" stopColor="#ff6b7d" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sp-rubin-glanz" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            {/* Platte: Messing, etwa so hell wie der Ring um das Glas; einfacher Verlauf ueber die Flaeche */}
            <PlattenVerlauf id="sp-platte" aussen={platteAussen} />
            {/* Lichtschein fuer die eigene Einschaetzung (SVG-Filter: CSS-Filter auf SVG-Elementen kann WebKit nicht) */}
            <filter
              id="sp-schein"
              filterUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="400"
              height={hoehe}
            >
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* Faecher: schwenkt beim Abgang zum Ergebnis um den Kreismittelpunkt weg */}
          <g className="sp-faecher">
            <Unterbau {...geo} />

            {/* Schlitze: nur ein bewegter Schieber wird neu gezeichnet (Schlitz ist memo) */}
            {SYSTEME.map((sys, i) => (
              <Schlitz
                key={sys.id}
                id={sys.id}
                k={i + 1}
                r={radien[i + 1]}
                theta={theta}
                w={schlitz}
                u={pos[sys.id]}
                vonMitte={vonMitte}
                hoehe={hoehe}
              />
            ))}
            <Sperrzaehne {...geo} />

            {/* eigener Strahl nach dem Ausloesen */}
            {zeigeUserStrahl
              ? (() => {
                  const a = punktU(rUser, pos.user, theta);
                  const b = punktU(
                    radien[radien.length - 1] + symbol,
                    pos.user,
                    theta,
                  );
                  return (
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      className="sp-userstrahl"
                    />
                  );
                })()
              : null}

            {/* Systemsymbole */}
            {SYSTEME.map((s, i) => {
              const p = punktU(radien[i + 1], pos[s.id], theta);
              const aktiv = aufgezogen.includes(s.id) || pos[s.id] > RUHE;
              return (
                <g key={s.id} opacity={aktiv ? 1 : 0.8} className="sp-symbol">
                  <HoroskopIcon id={s.id} x={p.x} y={p.y} r={symbol * 1.15} />
                </g>
              );
            })}

            <Beschriftung {...geo} />
          </g>
          {/* Hebel mit Sperre: radial schraeg; der Rubin bleibt aufrecht (Licht von links oben). Er steht auf
              der Platte und dreht beim Auftritt mit dem Faecher herein (gleiche Ebene). */}
          <g
            className="sp-hebel"
            onPointerDown={hebelDruecken}
            transform={`translate(${HEBEL_ANKER.x} ${HEBEL_ANKER.y}) rotate(${HEBEL_DREHUNG})`}
          >
            <rect
              x={-7}
              y={-10}
              width="14"
              height={HEBEL.weg + 20}
              rx="7"
              className="sp-hebelschlitz"
            />
            <rect
              x={-26}
              y={-26}
              width="52"
              height={HEBEL.weg + 52}
              fill="transparent"
            />
            {/* Sperrplaettchen hinter dem Schlitz: nur durch die Oeffnung sichtbar */}
            <clipPath id="sp-hebelschlitz-form">
              <rect x={-7} y={-10} width="14" height={HEBEL.weg + 20} rx="7" />
            </clipPath>
            <g clipPath="url(#sp-hebelschlitz-form)">
              {/* verschliesst den ganzen Schlitz unter dem Griff; schnappt erst zurueck, wenn der Hebel oben ist */}
              <g
                className={
                  gesperrt && pos.hebel < 0.02 ? "sp-sperre zu" : "sp-sperre"
                }
              >
                <rect
                  x={-7}
                  y={14}
                  width="14"
                  height={HEBEL.weg - 4}
                  className="sp-sperre-plaettchen"
                />
              </g>
              {/* Schatten der Plattenkante auf dem Plaettchen */}
              <rect
                x={-7}
                y={-10}
                width="14"
                height="3"
                fill="#000"
                opacity="0.35"
              />
            </g>
            {/* Griff: ein grosser weinroter Rubin (Cabochon), ohne Rahmen; gesperrt etwas dunkler */}
            <g
              transform={`translate(0 ${knaufY}) rotate(${-HEBEL_DREHUNG})`}
              className="sp-hebelgriff"
            >
              {/* goldene Fassung, wirft einen kleinen Schatten */}
              <ellipse
                cx="0"
                cy="1"
                rx="16.6"
                ry="16.6"
                fill="#2a1c08"
                opacity="0.45"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="16.4"
                ry="16.4"
                className="sp-rubin-fassung"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="15"
                ry="15"
                fill="none"
                stroke="url(#sp-fase-aussen)"
                strokeWidth="2.2"
              />
              <ellipse
                cx="0"
                cy="0"
                rx="14"
                ry="14"
                fill="url(#sp-rubin)"
                className="sp-rubin"
              />
              <ellipse
                cx="2.8"
                cy="3.2"
                rx="8"
                ry="4.2"
                fill="url(#sp-rubin-schimmer)"
              />
              <ellipse
                cx="-5"
                cy="-4"
                rx="5.2"
                ry="2.4"
                transform="rotate(-18 -5 -4)"
                fill="url(#sp-rubin-glanz)"
              />
              <circle cx="5.6" cy="-4.4" r="0.9" fill="#fff" opacity="0.8" />
              {gesperrt ? (
                <ellipse
                  cx="0"
                  cy="0"
                  rx="14"
                  ry="14"
                  fill="#000"
                  opacity="0.25"
                />
              ) : null}
            </g>
          </g>

          {/* Zaehler links unten im Quadrat */}
        </svg>

        {/* Der eigene Schieber als eigene Ebene ueber dem Faecher, dreht mit ihm: laeuft er beim Hereindrehen
            nach links, muss nur er neu gezeichnet werden, nicht der ganze Faecher */}
        <svg
          viewBox={`0 0 400 ${hoehe}`}
          className="sp-svg sp-drehteil sp-griffteil"
          style={{ transformOrigin: `50% ${(MITTE.y / hoehe) * 100}%` }}
          aria-hidden="true"
        >
          {/* eigener Schieber: breiter Messinggriff mit eingravierter Pfeilspitze nach unten, dreht sich mit dem
              Bogen und reicht bis an die Luenette */}
          {(() => {
            const p = punktU(rUser, pos.user, theta);
            const phi = -theta + 2 * theta * pos.user;
            const e = symbol / 11.4; // Massstab wie die Knoepfe
            return (
              <g
                transform={`translate(${p.x} ${p.y}) rotate(${(-phi * 180) / Math.PI}) scale(${e})`}
                className={pos.user < RUHE ? "sp-griff ruhe" : "sp-griff"}
              >
                <path
                  d="M -27 -19 L 27 -19 Q 30 -19 29.6 -16.5 L 21.6 8 Q 20.2 11 15.2 11.6 L 0 13 L -15.2 11.6 Q -20.2 11 -21.6 8 L -29.6 -16.5 Q -30 -19 -27 -19 Z"
                  className="sp-griff-koerper"
                />
                <path
                  d="M -23.5 -16 L 23.5 -16 L 17.4 6.5 L 0 9.4 L -17.4 6.5 Z"
                  className="sp-griff-flaeche"
                />
                {/* blauer, geschliffener Dreieck-Edelstein, Spitze nach unten zur Skala, in Goldfassung */}
                <path
                  d="M -11.5 -11.5 L 11.5 -11.5 L 0 10.5 Z"
                  fill="#2a1c08"
                  opacity="0.4"
                  transform="translate(0 1)"
                />
                <path
                  d="M -11.5 -11.5 L 11.5 -11.5 L 0 10.5 Z"
                  className="sp-stein-fassung"
                />
                <path
                  d="M -9.4 -10.2 L 9.4 -10.2 L 4.4 -6.6 L -4.4 -6.6 Z"
                  fill="#8cc2ff"
                />
                <path
                  d="M -9.4 -10.2 L -4.4 -6.6 L 0 2.2 L 0 8 Z"
                  fill="#2f6fd1"
                />
                <path
                  d="M 9.4 -10.2 L 4.4 -6.6 L 0 2.2 L 0 8 Z"
                  fill="#163a8a"
                />
                <path
                  d="M -4.4 -6.6 L 4.4 -6.6 L 0 2.2 Z"
                  fill="url(#sp-stein-tafel)"
                />
                <path
                  d="M -9.4 -10.2 L 9.4 -10.2 L 0 8 Z"
                  fill="none"
                  stroke="#0c2154"
                  strokeWidth="0.4"
                  strokeLinejoin="round"
                />
                <path
                  d="M -2.6 -5.6 L -1.4 -5.6"
                  stroke="#fff"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <circle cx="-2" cy="-5.6" r="1.6" fill="url(#sp-stein-glanz)" />
              </g>
            );
          })()}
        </svg>

        {/* Mantel des Pucks unter dem Auge: man sieht ihn, waehrend sich das Auge von der Kante hereindreht */}
        {auftritt ? (
          <Mantel praefix="sp" hoehe={hoehe} radius={AUGE_RADIUS} />
        ) : null}

        {/* Auge darueber: steht still, waehrend sich der Faecher hereindreht */}
        <svg
          viewBox={`0 0 400 ${hoehe}`}
          className="sp-svg sp-augenteil"
          style={{ transformOrigin: `50% ${(MITTE.y / hoehe) * 100}%` }}
          aria-hidden="true"
        >
          <defs>
            <LuenetteDefs praefix="sp" />
            <radialGradient id="sp-messing" cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#f3d79a" />
              <stop offset="0.55" stopColor="#b08d57" />
              <stop offset="1" stopColor="#5a4325" />
            </radialGradient>
            <radialGradient id="sp-linse" cx="45%" cy="40%" r="70%">
              <stop offset="0" stopColor="#f6efdc" />
              <stop offset="0.7" stopColor="#d9ccaa" />
              <stop offset="1" stopColor="#8f7a52" />
            </radialGradient>
          </defs>
          <Auge />
        </svg>

        {/* Fragedia in der Linse: folgt beim Aufziehen dem Finger */}
        <div
          ref={linseRef}
          className="sp-linse"
          style={linse}
          aria-live="polite"
        >
          {/* Tief im Puck, hinter der Rueckseite der Datumsscheibe: Licht, Dia und Scheibe. Beim Hereindrehen
              verschiebt sich das gegen die Oeffnung (Parallaxe); dazwischen sieht man die Wand der Bohrung. */}
          <div className="sp-tiefe" ref={tiefeRef}>
            {/* Durchlicht: stark unscharfes Kamerabild; die Frage liegt darauf wie Tinte auf einem Dia */}
            {kamera ? (
              <>
                <video
                  ref={videoRef}
                  className="sp-kamera-quelle"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas ref={lichtRef} className="sp-kamera" />
              </>
            ) : null}
            {/* Prototyp: Messwerte, um echte Helligkeit trotz Belichtungsautomatik zu erkennen */}
            {MESSWERTE_ZEIGEN && kamera ? (
              <div className="sp-messung">
                {kameraInfo}
                {licht ? (
                  <>
                    <br />
                    B/s {licht.fps ?? "–"} · R {licht.rauschen.toFixed(1)}/
                    {licht.rauschenZeit === null
                      ? "–"
                      : licht.rauschenZeit.toFixed(1)}{" "}
                    · H {licht.hell.toFixed(0)}
                  </>
                ) : null}
              </div>
            ) : null}
            {/* Leuchten hinter dem Dia und den Bohrungen: hellt das Durchlicht auf, die Scheibe bleibt dunkel */}
            <div className="sp-leuchten" />
            {/* hinter der Lupe: das Dia im Fenster der Scheibe; die Tinte mischt sich mit dem Durchlicht */}
            <div
              className={
                zustand === "endaufzug" || zustand === "rechnet"
                  ? "sp-lupe sp-lupe-dia sp-lupe-glas"
                  : "sp-lupe sp-lupe-dia"
              }
              style={lupe}
            >
              <Rotglas
                anzahl={fragen.length}
                stand={zaehlerStand + (zustand === "aufziehen" ? pos.dia : 0)}
                gleitet={zaehlerStand >= fragen.length || rueckwaerts}
              />
              <div className="sp-fenster" style={fensterLage}>
                {zustand === "endaufzug" || zustand === "rechnet" ? (
                  // Ergebnis-Dia auf blauem Glas: nur der Titel, bewusst ohne Anleitung
                  <div key="ergebnisdia" className="sp-dia sp-dia-ergebnis">
                    <span className="sp-ergebnistitel">{titel}</span>
                    {zustand === "rechnet" ? (
                      <span className="sp-ergebnisanleitung">
                        Das Räderwerk rechnet …
                      </span>
                    ) : null}
                  </div>
                ) : zustand === "auswertung" ? (
                  <div key="rangliste" className="sp-dia sp-dia-rang">
                    <div className="eg-rangliste">
                      <div className="eg-rangtitel">{titel}</div>
                      {(ergebnis?.alle?.ranking ?? []).map((s) => (
                        <div
                          key={s}
                          className="eg-rang"
                          style={{
                            "--farbe": SYSTEME.find((x) => x.id === s)?.farbe,
                          }}
                        >
                          <i />
                          <span>
                            {SYSTEME.find((x) => x.id === s)?.name ?? s}
                          </span>
                          <b>
                            {(() => {
                              const v = Math.round(
                                ergebnis.alle.systemDetails[s].skillScore,
                              );
                              return v > 0 ? `+${v}` : `${v}`;
                            })()}
                          </b>
                        </div>
                      ))}
                    </div>
                    {erklaerung ? (
                      <span className="sp-ergebnisklein">{erklaerung}</span>
                    ) : null}
                    {hinweis ? (
                      <span className="sp-ergebnisklein">{hinweis}</span>
                    ) : null}
                  </div>
                ) : sonderDia ? (
                  <div key={sonderDia} className="sp-dia sp-sonderdia">
                    {sonderDia}
                  </div>
                ) : (
                  <div
                    className={index < 0 ? "sp-dia bild" : "sp-dia"}
                    style={{ transform: `translateX(${-pos.dia * 115}%)` }}
                  >
                    {diaText(index)}
                  </div>
                )}
                {pos.dia > 0 ? (
                  <div
                    className="sp-dia"
                    style={{ transform: `translateX(${(1 - pos.dia) * 115}%)` }}
                  >
                    {diaText(index + 1)}
                  </div>
                ) : null}
              </div>
            </div>
            <Diascheibe
              anzahl={fragen.length}
              aktuell={zaehlerStand}
              style={lupe}
            />
          </div>
          <LupenFilter id="sp-lupe" d={linseD} />
          {/* Linse an der Oberflaeche: spiegelt zuerst und gibt erst nach dem Hereindrehen den Blick frei; die
              Lichtreflexe bleiben */}
          <div className="sp-spiegel" />
          <div className="sp-glanz" />
        </div>
      </div>

      <div className="sp-fuss">{zusatz}</div>
    </main>
  );
}
