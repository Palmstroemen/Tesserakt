import { useEffect, useRef, useState } from "react";
import { useLichtmesser } from "./lichtmesser";
import { SYSTEME } from "./systeme";
import HoroskopIcon from "./HoroskopIcon";
import Schlitz, { SchlitzDefs } from "./Schlitze";
import {
  AUGE_RADIUS,
  LINSE_RADIUS,
  MITTE,
  RUHE_ANTEIL,
  bogenPfad,
  faecherLayout,
  plattePfad,
  polarAusPunkt,
  punktU,
  uAusWert,
  wertAusU,
} from "./geometrie";
import { einrasten, hebel, ratsche, rastKlick, sperre, zahnrad } from "./klang";

const ALLE = SYSTEME.map((s) => s.id);
const SCHRITT = 0.2; // eigener Schieber: 11 Rasten von -1 bis +1
const SCHWELLE = 0.5; // ab hier rastet ein Schieber rechts ein (bzw. schaltet das Dia weiter)
const HEBEL = { x: 376, oben: 322, weg: 62 }; // rechts unten in der Ecke, ausserhalb des Auges
const RUHE = 0.035; // u-Toleranz fuer "steht in der Ruheposition"
// Prototyp: Belichtung und Lichtmesser-Werte im Auge anzeigen (aus; zum Kamera-Testen auf true)
const MESSWERTE_ZEIGEN = false;

function layoutAusFenster() {
  const breite = Math.min(window.innerWidth, 440);
  const fenster = (window.innerHeight * 400) / breite; // Bildschirmhoehe in viewBox-Einheiten
  const layout = faecherLayout(fenster - 78); // Platz fuer die Polbeschriftung
  // Faecherplatte: Aussenradius fast bis zum unteren Bildschirmrand (mindestens knapp ueber den aeussersten
  // Schlitz hinaus); sie darf ueber das SVG hinaus unter die Beschriftung reichen
  const aussen = layout.radien[layout.radien.length - 1];
  return {
    ...layout,
    platteAussen: Math.max(
      aussen + layout.abstand * 0.62,
      fenster - MITTE.y - 10,
    ),
  };
}

const easeAus = (t) => 1 - (1 - t) ** 3;
function easeMechanisch(t) {
  // leichtes Ueberschwingen und Einrasten
  const c = 1.4;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

/**
 * Fragerunde als Faecher: oben das Auge mit dem Fragedia, unten der eigene Schieber und die Systembögen.
 * Mechanik siehe docs/Konzepte/Schatulle_Mechanik.md. Das Aufziehen wirkt nur auf die Anzeige;
 * onAntwort bekommt die Werte aller Systeme.
 * Nach der letzten Frage: Ergebnis-Dia (blaues Glas); erst wenn alle Systeme und der eigene Schieber ganz
 * rechts stehen, loest der Hebel die Auswertung aus. Dann zeigt das Dia die Rangliste und die Systemschieber
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
}) {
  const [layout, setLayout] = useState(layoutAusFenster);
  const { radien, abstand, symbol, theta, schlitz, hoehe, platteAussen } =
    layout;
  // Lichtfleck der Platte wie frueher, als sie nur knapp ueber den aeussersten Schlitz reichte (dort war der
  // Ton richtig): Mittelpunkt bei 35 % / 30 %, Radius 80 % jener Flaeche
  const platteLicht = (() => {
    const innen = radien[0] - abstand * 0.6;
    const aussen = radien[radien.length - 1] + abstand * 0.62;
    const w = theta + 0.16;
    const x0 = MITTE.x - aussen * Math.sin(w);
    const breite = 2 * aussen * Math.sin(w);
    const y0 = MITTE.y + innen * Math.cos(w);
    const hoeheFlaeche = MITTE.y + aussen - y0;
    return {
      cx: x0 + 0.35 * breite,
      cy: y0 + 0.3 * hoeheFlaeche,
      r: 0.8 * breite,
      stauchung: hoeheFlaeche / breite,
    };
  })();

  const startPos = {
    user: sofort ? 1 : 0,
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

  const svgRef = useRef(null);
  const zusatzRef = useRef(zusatz);
  zusatzRef.current = zusatz;
  const videoRef = useRef(null);
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
    if (videoRef.current) videoRef.current.srcObject = kamera ?? null;
  }, [kamera]);

  const licht = useLichtmesser(videoRef, MESSWERTE_ZEIGEN && Boolean(kamera));

  // Beim ersten Spiel ruckt ein Symbol von selbst an: "hier kann man ziehen"
  useEffect(() => {
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
  }, []);

  // --- Zeiger ------------------------------------------------------------------
  function svgPunkt(e) {
    const svg = svgRef.current;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  function zuruecksetzen(ausser) {
    // nach einem Ergebnis: alle anderen Schieber und der eigene springen in die Ruheposition
    setZustand("aufziehen");
    aufgezogenRef.current.clear();
    aufgezogenAktualisieren();
    ratsche();
    ALLE.filter((s) => !ausser.has(s)).forEach((s, i) =>
      animiere(s, 0, 260, { verz: i * 25 }),
    );
    animiere("user", 0, 260);
  }

  function greifen(r, u) {
    const d = drag.current;
    for (let k = 1; k < radien.length; k += 1) {
      if (Math.abs(r - radien[k]) > abstand * 0.8) continue;
      const s = ALLE[k - 1];
      if (d.gegriffen.has(s)) continue;
      if (zustandRef.current !== "ergebnis" && aufgezogenRef.current.has(s))
        continue;
      const p = posRef.current[s];
      if (Math.abs(u - p) * 2 * theta * radien[k] > symbol * 1.7) continue;
      if (zustandRef.current === "ergebnis")
        zuruecksetzen(new Set([...d.gegriffen.keys(), s]));
      anim.current.delete(s);
      d.gegriffen.set(s, p);
    }
  }

  function diaTreiben() {
    // Das Dia folgt einem Schieber aus der Ruheposition, wenn schon ein anderer aufgezogen ist (oder wird)
    const d = drag.current;
    if (zustandRef.current !== "aufziehen") return;
    if (aufgezogenRef.current.size + d.gegriffen.size - 1 < 1) return;
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
      Math.abs(r - radien[0]) < abstand * 0.6
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
      const neu = Math.max(0, Math.min(1, (y - d.y0) / HEBEL.weg));
      if (Math.abs(y - d.y0) > 4) d.gezogen = true;
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
    for (const s of d.gegriffen.keys()) {
      const wert = Math.max(0, Math.min(1, u));
      neu[s] = wert;
      const stufe = Math.floor(wert * 10);
      if (d.stufe[s] !== undefined && stufe !== d.stufe[s]) rastKlick();
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
      if (posRef.current.hebel >= 0.6 || !d.gezogen) ausloesen();
      else animiere("hebel", 0, 250);
      return;
    }
    if (d.art !== "system") return;
    for (const s of d.gegriffen.keys()) {
      if (posRef.current[s] >= SCHWELLE) {
        aufgezogenRef.current.add(s);
        animiere(s, 1, 180, { fertig: einrasten });
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
    (z === "endaufzug" && anzahl === ALLE.length && user >= USER_RECHTS);
  const gesperrt = !bereit(zustand, pos.user, aufgezogen.length);

  function hebelDruecken(e) {
    e.stopPropagation();
    if (drag.current || zustandRef.current === "laeuft") return;
    if (
      !bereit(
        zustandRef.current,
        posRef.current.user,
        aufgezogenRef.current.size,
      )
    ) {
      sperre();
      animiere("hebel", 0.07, 70, { fertig: () => animiere("hebel", 0, 160) });
      return;
    }
    drag.current = {
      art: "hebel",
      y0: svgPunkt(e).y - posRef.current.hebel * HEBEL.weg,
      gezogen: false,
    };
    svgRef.current.setPointerCapture?.(e.pointerId);
  }

  function ausloesen() {
    if (zustandRef.current === "endaufzug") {
      setZustand("rechnet");
      hebel();
      animiere("hebel", 1, 110, {
        fertig: () => animiere("hebel", 0, 520, { ease: easeMechanisch }),
      });
      if (ergebnisRef.current) auswertungZeigen();
      return;
    }
    const frage = fragen[indexRef.current];
    setZustand("laeuft");
    hebel();
    animiere("hebel", 1, 110, {
      fertig: () => animiere("hebel", 0, 520, { ease: easeMechanisch }),
    });
    const aktiv = ALLE.filter((s) => aufgezogenRef.current.has(s));
    onAntwort(frage, wertAusU(posRef.current.user), aktiv);
    const DAUER = 1100;
    const VERZ = 140;
    aktiv.forEach((s, i) => {
      const ziel = uAusWert(zielWert(s, frage.dimension, frage));
      zahnrad(
        Math.max(3, Math.round((1 - ziel) * 30)),
        DAUER / 1000,
        1800 + i * 180,
      );
      animiere(s, ziel, DAUER, {
        ease: easeMechanisch,
        verz: 120 + i * VERZ,
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

  // --- Ergebnis ----------------------------------------------------------------
  // Nach der letzten Frage (und ohne offene Nachfrage): Schieber in die Ruhe, Ergebnis-Dia nur mit dem Titel.
  // Wie es weitergeht, sollen die Spieler selbst entdecken (alles nach rechts, Hebel; dann im Auge wischen).
  useEffect(() => {
    if (zustand !== "fertig" || zusatz) return undefined;
    const t = setTimeout(() => {
      setZustand("endaufzug");
      aufgezogenRef.current.clear();
      aufgezogenAktualisieren();
      ratsche();
      ALLE.forEach((s, i) => animiere(s, 0, 300, { verz: i * 30 }));
      animiere("user", 0, 300);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zustand, zusatz]);

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
    ALLE.forEach((s, i) => {
      const ziel = uAusWert((details[s]?.skillScore ?? 0) / 100);
      zahnrad(
        Math.max(3, Math.round((1 - ziel) * 30)),
        DAUER / 1000,
        1800 + i * 180,
      );
      animiere(s, ziel, DAUER, { ease: easeMechanisch, verz: 300 + i * 140 });
    });
  }

  // --- Darstellung -------------------------------------------------------------
  const strahlen = Array.from({ length: 11 }, (_, k) =>
    uAusWert(-1 + k * SCHRITT),
  );
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
        {/* Fortschritt als Perlenreihe auf dem Dia: beantwortet, aktuell, offen */}
        <span
          className="sp-perlen"
          aria-label={`Frage ${i + 1} von ${fragen.length}`}
        >
          {fragen.map((f, k) => (
            <i
              key={f.id}
              className={k < i ? "fertig" : k === i ? "jetzt" : ""}
            />
          ))}
        </span>
      </>
    );
  };

  const linse = {
    left: `${((MITTE.x - LINSE_RADIUS) / 400) * 100}%`,
    width: `${((2 * LINSE_RADIUS) / 400) * 100}%`,
    top: `${((MITTE.y - LINSE_RADIUS) / hoehe) * 100}%`,
    height: `${((2 * LINSE_RADIUS) / hoehe) * 100}%`,
  };
  const knaufY = HEBEL.oben + pos.hebel * HEBEL.weg;

  return (
    <main
      className={`sp${auftritt ? " sp-auftritt" : ""}${abgang ? " sp-abgang" : ""}`}
    >
      <div className="sp-buehne">
        <svg
          ref={svgRef}
          viewBox={`0 0 400 ${hoehe}`}
          className="sp-svg"
          onPointerDown={druecken}
          onPointerMove={bewegen}
          onPointerUp={loslassen}
          onPointerCancel={loslassen}
        >
          <defs>
            <SchlitzDefs />
            {/* Platte: Messing wie der Ring, Lichtfleck fest auf die Flaeche um die Schlitze gelegt (unabhaengig
                davon, wie weit die Platte nach unten reicht) */}
            <radialGradient
              id="sp-platte"
              gradientUnits="userSpaceOnUse"
              cx={platteLicht.cx}
              cy={platteLicht.cy}
              r={platteLicht.r}
              gradientTransform={`translate(${platteLicht.cx} ${platteLicht.cy}) scale(1 ${platteLicht.stauchung}) translate(${-platteLicht.cx} ${-platteLicht.cy})`}
            >
              <stop offset="0" stopColor="#f3d79a" />
              <stop offset="0.55" stopColor="#b08d57" />
              <stop offset="1" stopColor="#5a4325" />
            </radialGradient>
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
            {/* Platte: derselbe Messington wie der Ring um das Glas */}
            <path
              d={plattePfad(
                radien[0] - abstand * 0.6,
                platteAussen,
                theta + 0.16,
              )}
              fill="url(#sp-platte)"
              stroke="#2b2014"
              strokeWidth="2"
            />

            {/* Strahlen: Einkerbungen zwischen den Schlitzen = gemeinsame Skala */}
            {strahlen.map((u, k) =>
              radien.slice(0, -1).map((r, j) => {
                const a = punktU(r + schlitz / 2 + 3, u, theta);
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

            {/* Schlitze */}
            {radien.map((r, k) => {
              const sys = k ? SYSTEME[k - 1] : null;
              const sperrA = punktU(r - schlitz / 2, RUHE_ANTEIL * 0.55, theta);
              const sperrB = punktU(r + schlitz / 2, RUHE_ANTEIL * 0.55, theta);
              return (
                <g key={r}>
                  <path
                    d={bogenPfad(r, theta)}
                    className="sp-schlitz"
                    strokeWidth={k ? schlitz + 2.4 : schlitz * 0.55}
                  />
                  {sys ? (
                    <Schlitz
                      id={sys.id}
                      k={k}
                      r={r}
                      theta={theta}
                      w={schlitz}
                      u={pos[sys.id]}
                      vonMitte={vonMitte}
                      hoehe={hoehe}
                    />
                  ) : null}
                  <line
                    x1={sperrA.x}
                    y1={sperrA.y}
                    x2={sperrB.x}
                    y2={sperrB.y}
                    className="sp-sperrzahn"
                  />
                </g>
              );
            })}

            {/* eigener Strahl nach dem Ausloesen */}
            {zeigeUserStrahl
              ? (() => {
                  const a = punktU(radien[0], pos.user, theta);
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

            {/* eigener Schieber */}
            {(() => {
              const p = punktU(radien[0], pos.user, theta);
              return (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={symbol * 0.85}
                  className={pos.user < RUHE ? "sp-knauf ruhe" : "sp-knauf"}
                />
              );
            })()}
          </g>
          {/* Auge (beim Auftritt dreht es sich wie eine Muenze herein) */}
          <g className="sp-auge">
            <circle
              cx={MITTE.x}
              cy={MITTE.y}
              r={AUGE_RADIUS}
              fill="url(#sp-messing)"
            />
            <circle
              cx={MITTE.x}
              cy={MITTE.y}
              r={LINSE_RADIUS}
              fill="url(#sp-linse)"
              stroke="#3a2c1a"
              strokeWidth="2"
            />
          </g>

          {/* Hebel mit Sperrklinke, rechts unten im Quadrat */}
          <g className="sp-hebel" onPointerDown={hebelDruecken}>
            <rect
              x={HEBEL.x - 7}
              y={HEBEL.oben - 10}
              width="14"
              height={HEBEL.weg + 20}
              rx="7"
              className="sp-hebelschlitz"
            />
            <rect
              x={HEBEL.x - 26}
              y={HEBEL.oben - 26}
              width="52"
              height={HEBEL.weg + 52}
              fill="transparent"
            />
            <g
              className={gesperrt ? "sp-klinke zu" : "sp-klinke"}
              style={{
                transformOrigin: `${HEBEL.x + 15}px ${HEBEL.oben + 24}px`,
              }}
            >
              <rect
                x={HEBEL.x - 10}
                y={HEBEL.oben + 21}
                width="27"
                height="6"
                rx="2"
              />
              <circle cx={HEBEL.x + 15} cy={HEBEL.oben + 24} r="4" />
            </g>
            <line
              x1={HEBEL.x}
              y1={knaufY}
              x2={HEBEL.x}
              y2={knaufY - 4}
              stroke="#2b2014"
              strokeWidth="6"
            />
            <circle
              cx={HEBEL.x}
              cy={knaufY}
              r="15"
              className={gesperrt ? "sp-hebelknauf gesperrt" : "sp-hebelknauf"}
            />
          </g>

          {/* Zaehler links unten im Quadrat */}
        </svg>

        {/* Fragedia in der Linse: folgt beim Aufziehen dem Finger */}
        <div className="sp-linse" style={linse} aria-live="polite">
          {/* Durchlicht: stark unscharfes Kamerabild; die Frage liegt darauf wie Tinte auf einem Dia */}
          {kamera ? (
            <video
              ref={videoRef}
              className="sp-kamera"
              autoPlay
              muted
              playsInline
            />
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
                    <span>{SYSTEME.find((x) => x.id === s)?.name ?? s}</span>
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

      <div className="sp-fuss">
        <div className="sp-skala">
          <span>◂ {pole[0]}</span>
          <span>{pole[1]} ▸</span>
        </div>
        {zusatz}
      </div>
    </main>
  );
}
