import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../logic/api";
import { MITTE, bogenPfad, plattePfad } from "./geometrie";
import { rastKlick } from "./klang";

// Geburtsort als zwei Walzen unter dem Kreis, wie die Skala eines alten MW-Radios: Die Namen stehen
// entlang des Schlitzes und gleiten beim Wischen durch; gewaehlt ist, was am roten Zeiger (Mitte) steht.
// Innen das Land (vorbelegt aus der Zeitzone des Geraets), aussen die groesseren Orte des Landes.
// Ganz links auf der Ortswalze: "unbekannt" (dann rechnet das Backend ohne Ort).
export const WALZEN = { land: 262, stadt: 322, theta: 0.6, schlitz: 30 };
const ZEITZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";

let regionNamen = null;
function landName(code, fallback) {
  try {
    regionNamen ??= new Intl.DisplayNames(["de"], { type: "region" });
    return regionNamen.of(code) ?? fallback;
  } catch {
    return fallback;
  }
}

function Walze({ r, eintraege, index, onIndex, svgPunkt, schrift = 13 }) {
  const { theta } = WALZEN;
  // Lage der Eintraege auf dem Band (Bogenlaenge): Breite nach Textlaenge geschaetzt
  const lagen = useMemo(() => {
    let x = 0;
    return eintraege.map((e) => {
      const breite = e.breite ?? e.label.length * schrift * 0.52 + 30;
      const mitte = x + breite / 2;
      x += breite;
      return mitte;
    });
  }, [eintraege, schrift]);

  const [versatz, setVersatz] = useState(lagen[index] ?? 0);
  const vRef = useRef(versatz);
  const drag = useRef(null);
  const anim = useRef(0);

  function setze(v) {
    vRef.current = v;
    setVersatz(v);
  }

  useEffect(() => {
    cancelAnimationFrame(anim.current);
    setze(lagen[index] ?? 0);
  }, [lagen, index]);

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  // nur waehlbare Eintraege rasten ein (Pfeil und Leerraum auf der Ortswalze nicht)
  const naechster = (v) => {
    let best = 0;
    lagen.forEach((l, i) => {
      if (eintraege[i].waehlbar !== false && Math.abs(l - v) < Math.abs(lagen[best] - v)) best = i;
    });
    return best;
  };

  const winkel = (p) => Math.atan2(p.x - MITTE.x, p.y - MITTE.y);

  function druecken(e) {
    e.stopPropagation();
    cancelAnimationFrame(anim.current);
    drag.current = { phi: winkel(svgPunkt(e)), zeit: performance.now(), tempo: 0, idx: naechster(vRef.current) };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function bewegen(e) {
    const d = drag.current;
    if (!d) return;
    const phi = winkel(svgPunkt(e));
    const jetzt = performance.now();
    const weg = -(phi - d.phi) * r;
    d.tempo = weg / Math.max(1, jetzt - d.zeit); // Einheiten pro ms
    d.phi = phi;
    d.zeit = jetzt;
    bewege(vRef.current + weg, d);
  }

  function bewege(v, d) {
    const min = lagen[0] ?? 0;
    const max = lagen[lagen.length - 1] ?? 0;
    setze(Math.max(min - 40, Math.min(max + 40, v)));
    const i = naechster(vRef.current);
    if (i !== d.idx) {
      rastKlick();
      d.idx = i;
    }
  }

  function loslassen() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    // Schwung: Walze laeuft nach und bremst ab, dann rastet sie auf dem naechsten Eintrag ein
    let tempo = d.tempo * 16;
    const lauf = () => {
      tempo *= 0.93;
      bewege(vRef.current + tempo, d);
      if (Math.abs(tempo) > 0.6) {
        anim.current = requestAnimationFrame(lauf);
        return;
      }
      const i = naechster(vRef.current);
      const von = vRef.current;
      const start = performance.now();
      const rasten = (jetzt) => {
        const t = Math.min(1, (jetzt - start) / 180);
        setze(von + (lagen[i] - von) * (1 - (1 - t) ** 3));
        if (t < 1) anim.current = requestAnimationFrame(rasten);
        else onIndex(i);
      };
      anim.current = requestAnimationFrame(rasten);
    };
    anim.current = requestAnimationFrame(lauf);
  }

  const gewaehlt = naechster(versatz);
  // Schrift folgt dem Bogen (textPath); der Pfad laeuft von links durch den tiefsten Punkt nach rechts
  const BOGEN = 1.4; // halber Winkel des Schriftpfads (rad), groesser als der sichtbare Schlitz
  const pfadId = `ow-pfad-${r}`;
  const maskeId = `ow-maske-${r}`;
  const links = { x: MITTE.x - r * Math.sin(BOGEN), y: MITTE.y + r * Math.cos(BOGEN) };
  const rechts = { x: MITTE.x + r * Math.sin(BOGEN), y: links.y };

  return (
    <g onPointerDown={druecken} onPointerMove={bewegen} onPointerUp={loslassen} onPointerCancel={loslassen} className="ow-walze">
      <defs>
        <path id={pfadId} d={`M ${links.x} ${links.y} A ${r} ${r} 0 0 0 ${rechts.x} ${rechts.y}`} />
        {/* Schlitzmaske: die Schrift liegt darunter und wird an den Enden beschnitten */}
        <mask id={maskeId} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="800">
          <path d={bogenPfad(r, theta)} stroke="white" strokeWidth={WALZEN.schlitz - 4} strokeLinecap="round" fill="none" />
        </mask>
      </defs>
      {/* heller Messingstreifen mit dunklem Rand, wie die Ringe des Datumsrads */}
      <path d={bogenPfad(r, theta)} className="ow-rand" strokeWidth={WALZEN.schlitz + 3} />
      <path d={bogenPfad(r, theta)} className="ow-schlitz" strokeWidth={WALZEN.schlitz} />
      <g mask={`url(#${maskeId})`}>
        <g filter="url(#dr-gravur)">
          {eintraege.map((e, i) => {
            const abstand = lagen[i] - versatz;
            if (!e.label || Math.abs(abstand) / r > theta + 0.5) return null;
            return (
              <text key={e.key} dy="0.35em" fontSize={schrift} className={i === gewaehlt ? "ow-name gewaehlt" : "ow-name"}>
                <textPath href={`#${pfadId}`} xlinkHref={`#${pfadId}`} startOffset={BOGEN * r + abstand} textAnchor="middle">
                  {e.label}
                </textPath>
              </text>
            );
          })}
        </g>
      </g>
      {/* breiter unsichtbarer Griffbereich */}
      <path d={bogenPfad(r, theta)} stroke="transparent" strokeWidth={WALZEN.schlitz + 18} fill="none" />
    </g>
  );
}

// Anfang der Ortswalze: "Ort unbekannt", ein Pfeil und etwas Leerraum. In der Ruhestellung ist so keine
// Stadt zu sehen (die erste liegt gerade unter dem Schlitzende), ein Landeswechsel aendert nichts Sichtbares.
const ANFANG_ORTE = [
  { key: "?", label: "Ort unbekannt", ort: null },
  { key: "pfeil", label: "——————→", breite: 130, waehlbar: false },
  { key: "leer", label: "", breite: 60, waehlbar: false },
];

export default function OrtWalzen({ svgPunkt, anfang, onOrt }) {
  const [laender, setLaender] = useState([]);
  const [landIdx, setLandIdx] = useState(0);
  const [staedte, setStaedte] = useState(ANFANG_ORTE);
  const [stadtIdx, setStadtIdx] = useState(0);
  const ersteStadt = useRef(anfang?.name ?? null);

  useEffect(() => {
    fetch(`${API_BASE}/orte/laender?zeitzone=${encodeURIComponent(ZEITZONE)}`)
      .then((r) => r.json())
      .then((d) => {
        const liste = d.laender
          .map((l) => ({ key: l.code, code: l.code, label: landName(l.code, l.name) }))
          .sort((a, b) => a.label.localeCompare(b.label, "de"));
        setLaender(liste);
        const ziel = anfang?.code ?? d.vorschlag ?? "AT";
        setLandIdx(Math.max(0, liste.findIndex((l) => l.code === ziel)));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const land = laender[landIdx];

  useEffect(() => {
    if (!land) return undefined;
    const ab = new AbortController();
    fetch(`${API_BASE}/orte/staedte?land=${land.code}&limit=60`, { signal: ab.signal })
      .then((r) => r.json())
      .then((d) => {
        const liste = [
          ...ANFANG_ORTE,
          ...d.staedte.map((s) => ({ key: `${s.name}-${s.lat}`, label: s.name, ort: s })),
        ];
        setStaedte(liste);
        const i = ersteStadt.current ? liste.findIndex((s) => s.label === ersteStadt.current) : 0;
        ersteStadt.current = null;
        setStadtIdx(Math.max(0, i));
      })
      .catch(() => {});
    return () => ab.abort();
  }, [land]);

  const stadt = staedte[stadtIdx];
  useEffect(() => {
    onOrt(stadt?.ort ? { ...stadt.ort, code: land?.code, landName: land?.label } : null, land);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stadt, land]);

  const { theta } = WALZEN;
  return (
    <g className="ow">
      <path d={plattePfad(WALZEN.land - 34, WALZEN.stadt + 34, theta + 0.07)} fill="url(#ow-platte)" stroke="#2b2014" strokeWidth="2" />
      {laender.length ? (
        <Walze r={WALZEN.land} eintraege={laender} index={landIdx} onIndex={setLandIdx} svgPunkt={svgPunkt} />
      ) : null}
      <Walze r={WALZEN.stadt} eintraege={staedte} index={stadtIdx} onIndex={setStadtIdx} svgPunkt={svgPunkt} />
      {/* fester Zeiger in der Mitte, wie die Nadel einer Radioskala */}
      <line
        x1={MITTE.x}
        y1={MITTE.y + WALZEN.land - WALZEN.schlitz / 2 - 4}
        x2={MITTE.x}
        y2={MITTE.y + WALZEN.stadt + WALZEN.schlitz / 2 + 4}
        className="ow-zeiger"
      />
    </g>
  );
}
