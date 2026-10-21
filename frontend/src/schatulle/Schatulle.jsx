import { useEffect, useMemo, useRef, useState } from "react";
import { OrtSuche } from "../components/GeburtsdatumInput";
import { calculateRating, erwarteterSkillBester } from "../logic/rating";
import { ortFelder } from "../logic/ort";
import { SYSTEME } from "./systeme";
import { BOGEN_RADIEN, MITTE, SCHIEBER_RADIUS, bogenPfad, punkt, winkel, wertAusPunkt } from "./geometrie";
import { hebel, rastKlick, setStumm, zahnrad } from "./klang";

import { API_BASE } from "../logic/api";
const ALLE = SYSTEME.map((s) => s.id);
const RUHE = 90; // Zeigerstellung vor dem Ausloesen (Mitte)
const SCHRITT = 0.2; // Schieber: 11 Rasten von -1 bis +1

async function postJson(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} (${r.status})`);
  return r.json();
}

function mischen(liste) {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

// Anzeige: Betonung eines Lebensbereichs relativ zu den Kontroll-Geburtsdaten (z-Wert / 2, begrenzt auf -1..+1).
// Die Rohwerte der Systeme sind klein; so wird sichtbar, ob ein System den Bereich bei dir staerker oder
// schwaecher sieht als bei anderen Geburtsdaten.
function anzeigeStatistik(kontroll) {
  const stat = {};
  for (const [system, liste] of Object.entries(kontroll ?? {})) {
    stat[system] = {};
    if (!liste.length) continue;
    for (const dim of Object.keys(liste[0])) {
      const werte = liste.map((v) => Number(v[dim]));
      const mittel = werte.reduce((a, b) => a + b, 0) / werte.length;
      const sd = Math.sqrt(werte.reduce((a, b) => a + (b - mittel) ** 2, 0) / werte.length);
      stat[system][dim] = { mittel, sd };
    }
  }
  return stat;
}

function anzeigeWert(stat, system, dim, wert) {
  const s = stat?.[system]?.[dim];
  if (!s || s.sd < 1e-6) return Math.max(-1, Math.min(1, wert));
  return Math.max(-1, Math.min(1, (wert - s.mittel) / (2 * s.sd)));
}

function easeMechanisch(t) {
  // leichtes Ueberschwingen und Einrasten
  const c = 1.4;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

export default function Schatulle() {
  const [phase, setPhase] = useState("start"); // start | laden | frage | ende
  const [datum, setDatum] = useState("");
  const [zeit, setZeit] = useState("12:00");
  const [ort, setOrt] = useState(null);
  const [gewaehlt, setGewaehlt] = useState(ALLE);
  const [stumm, setStummState] = useState(false);
  const [fehler, setFehler] = useState(null);

  const [fragen, setFragen] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [vektoren, setVektoren] = useState(null);
  const [kontroll, setKontroll] = useState(null);

  const [index, setIndex] = useState(0);
  const [wert, setWert] = useState(0);
  const [ausgeloest, setAusgeloest] = useState(false);
  const [bewegt, setBewegt] = useState(false); // Animation fertig
  const [zeiger, setZeiger] = useState(() => Object.fromEntries(ALLE.map((s) => [s, RUHE])));
  const [antworten, setAntworten] = useState([]);

  const svgRef = useRef(null);
  const ziehen = useRef(false);
  const animation = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/fragen`).then((r) => r.json()).then((d) => setFragen(d.fragen ?? [])).catch(() => {});
    fetch(`${API_BASE}/matrix`).then((r) => r.json()).then(setMatrix).catch(() => {});
  }, []);

  useEffect(() => setStumm(stumm), [stumm]);

  const stat = useMemo(() => anzeigeStatistik(kontroll), [kontroll]);
  const frage = fragen.length && phase === "frage" ? fragen[index] : null;

  async function starten() {
    setFehler(null);
    rastKlick(); // erste Beruehrung: Audio freigeben
    setPhase("laden");
    try {
      const body = { geburtsdatum: datum, uhrzeit: zeit, systeme: ALLE, ...ortFelder(ort) };
      const v = await postJson("/vektor", body);
      setVektoren(v.vektoren);
      setFragen((f) => mischen(f));
      setIndex(0);
      setAntworten([]);
      neueFrage();
      setPhase("frage");
      // Kontrollgruppe im Hintergrund (fuer Anzeige-Skalierung und Skill)
      postJson("/kontrolle", { ...body, session_id: v.inputs.session_id, stichtag: v.inputs.stichtag })
        .then((k) => setKontroll(k.kontrollvektoren))
        .catch(() => setKontroll({}));
    } catch (err) {
      setFehler(err.message);
      setPhase("start");
    }
  }

  function neueFrage() {
    setWert(0);
    setAusgeloest(false);
    setBewegt(false);
    setZeiger(Object.fromEntries(ALLE.map((s) => [s, RUHE])));
  }

  // --- Schieber -----------------------------------------------------------
  function svgPunkt(e) {
    const svg = svgRef.current;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  function schieberSetzen(e) {
    const { x, y } = svgPunkt(e);
    const roh = wertAusPunkt(x, y);
    const gerastet = Math.round(roh / SCHRITT) * SCHRITT;
    const neu = Math.max(-1, Math.min(1, Number(gerastet.toFixed(1))));
    setWert((alt) => {
      if (alt !== neu) rastKlick();
      return neu;
    });
  }

  function aufPlatteDruecken(e) {
    if (ausgeloest) return;
    ziehen.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    schieberSetzen(e);
  }

  // --- Ausloesen --------------------------------------------------------------
  function ausloesen() {
    if (ausgeloest || !frage) return;
    hebel();
    setAusgeloest(true);
    const ziele = Object.fromEntries(
      gewaehlt.map((s) => [s, winkel(anzeigeWert(stat, s, frage.dimension, Number(vektoren[s][frage.dimension])))])
    );
    const start = { ...zeiger };
    const beginn = performance.now();
    const VERZOEGERUNG = 140;
    const DAUER = 1100;
    gewaehlt.forEach((s, i) => {
      const weg = Math.abs(ziele[s] - start[s]);
      zahnrad(Math.max(3, Math.round(weg / 6)), DAUER / 1000, 1800 + i * 180);
    });
    cancelAnimationFrame(animation.current);
    const schritt = (jetzt) => {
      let fertig = true;
      const neu = { ...start };
      gewaehlt.forEach((s, i) => {
        const t = Math.min(1, Math.max(0, (jetzt - beginn - i * VERZOEGERUNG) / DAUER));
        if (t < 1) fertig = false;
        neu[s] = start[s] + (ziele[s] - start[s]) * easeMechanisch(t);
      });
      setZeiger(neu);
      if (fertig) {
        setBewegt(true);
      } else {
        animation.current = requestAnimationFrame(schritt);
      }
    };
    animation.current = requestAnimationFrame(schritt);
    // Antwort festhalten (Systemwerte fuer alle 7: Skill wird auch fuer abgewaehlte Systeme berechnet)
    setAntworten((prev) => [
      ...prev,
      {
        frage_id: frage.id,
        dimension: frage.dimension,
        selbst_wert: wert,
        system_werte: Object.fromEntries(ALLE.map((s) => [s, Number(vektoren[s][frage.dimension])])),
        gewichte: Object.fromEntries(ALLE.map((s) => [s, frage.gewichte?.[s] ?? 1])),
      },
    ]);
  }

  function weiter() {
    if (index + 1 >= fragen.length) {
      setPhase("ende");
      return;
    }
    setIndex((i) => i + 1);
    neueFrage();
  }

  // --- Ergebnis ---------------------------------------------------------------
  const ergebnis = useMemo(() => {
    if (phase !== "ende" || !kontroll || !matrix) return null;
    const alle = calculateRating(
      Object.fromEntries(ALLE.map((s) => [s, vektoren[s]])),
      antworten,
      matrix,
      kontroll
    );
    const sichtbar = alle.ranking.filter((s) => gewaehlt.includes(s));
    return { alle, sichtbar, erwartung: erwarteterSkillBester(sichtbar.length) };
  }, [phase, kontroll, matrix, vektoren, antworten, gewaehlt]);

  // --- Darstellung ------------------------------------------------------------
  const stummKnopf = (
    <button type="button" className="sc-stumm" onClick={() => setStummState((s) => !s)} aria-label="Ton an/aus">
      {stumm ? "🔇" : "🔊"}
    </button>
  );

  if (phase === "start" || phase === "laden") {
    return (
      <main className="sc">
        {stummKnopf}
        <div className="sc-deckel" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <defs>
              <radialGradient id="sc-messing" cx="35%" cy="30%" r="80%">
                <stop offset="0" stopColor="#f3d79a" />
                <stop offset="0.55" stopColor="#b08d57" />
                <stop offset="1" stopColor="#5a4325" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="96" fill="url(#sc-messing)" />
            <circle cx="100" cy="100" r="78" fill="#1d1712" stroke="#e8c98a" strokeWidth="1.5" />
            {/* Sonne (links, Gold) und Mond (rechts, Silber) greifen mit gezackter Naht ineinander - kein Taijitu */}
            <path d="M100 32 A68 68 0 0 0 100 168 L92 151 L106 134 L92 117 L106 100 L92 83 L106 66 L92 49 Z" fill="#e8c98a" />
            <path d="M100 32 A68 68 0 0 1 100 168 L92 151 L106 134 L92 117 L106 100 L92 83 L106 66 L92 49 Z" fill="#a9b1ba" />
            <circle cx="70" cy="100" r="14" fill="none" stroke="#9c7a3e" strokeWidth="2" />
            {Array.from({ length: 8 }, (_, k) => {
              const a = (k * Math.PI) / 4;
              return <line key={k} x1={70 + 19 * Math.cos(a)} y1={100 + 19 * Math.sin(a)} x2={70 + 26 * Math.cos(a)} y2={100 + 26 * Math.sin(a)} stroke="#9c7a3e" strokeWidth="2" />;
            })}
            <path d="M138 82 A20 20 0 1 0 138 118 A15 15 0 1 1 138 82" fill="#6f7882" />
          </svg>
        </div>
        <h1 className="sc-titel">Tesserakt</h1>
        <section className="sc-karte">
          <label>
            Geburtsdatum
            <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
          </label>
          <label>
            Uhrzeit
            <input type="time" value={zeit} onChange={(e) => setZeit(e.target.value)} />
          </label>
          <OrtSuche ort={ort} onChange={setOrt} />
          <p className="sc-hinweis">Welche Systeme interessieren dich heute?</p>
          <div className="sc-chips">
            {SYSTEME.map((s) => {
              const an = gewaehlt.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={an ? "sc-chip an" : "sc-chip"}
                  style={{ "--farbe": s.farbe }}
                  onClick={() => setGewaehlt((g) => (an ? g.filter((x) => x !== s.id) : [...g, s.id]))}
                >
                  {s.id}
                </button>
              );
            })}
          </div>
          {fehler ? <p className="sc-fehler">{fehler}</p> : null}
          <button
            type="button"
            className="sc-start"
            disabled={!datum || !gewaehlt.length || !fragen.length || phase === "laden"}
            onClick={starten}
          >
            {phase === "laden" ? "Die Schatulle öffnet sich …" : "Schatulle öffnen"}
          </button>
        </section>
      </main>
    );
  }

  if (phase === "ende") {
    return (
      <main className="sc">
        {stummKnopf}
        <h2 className="sc-titel">Dein Ergebnis</h2>
        {!ergebnis ? (
          <p className="sc-hinweis">Das Räderwerk vergleicht dich mit hundert anderen Geburtsdaten …</p>
        ) : (
          <>
            <div className="sc-karten">
              {ergebnis.sichtbar.map((s) => {
                const sys = SYSTEME.find((x) => x.id === s);
                const d = ergebnis.alle.systemDetails[s];
                return (
                  <article key={s} className="sc-ergebniskarte" style={{ "--farbe": sys.farbe }}>
                    <header>{s}</header>
                    <div className="sc-skill">{d.skillScore > 0 ? `+${d.skillScore.toFixed(0)}` : d.skillScore.toFixed(0)}</div>
                    <div className="sc-perzentil">besser als {d.perzentil.toFixed(0)} von 100 anderen Geburtsdaten</div>
                  </article>
                );
              })}
            </div>
            <p className="sc-hinweis">
              Skill 0 = Zufall, +100 = besser als alle anderen Geburtsdaten. Auch ohne jede Aussagekraft erreicht das
              beste von {ergebnis.sichtbar.length} Systemen im Mittel etwa +{ergebnis.erwartung.toFixed(0)}.
              <br />
              Prototyp: Es wird nichts gespeichert. Berechnet wurde der Skill für alle sieben Systeme.
            </p>
          </>
        )}
        <button type="button" className="sc-start" onClick={() => setPhase("start")}>
          Noch einmal
        </button>
      </main>
    );
  }

  const nutzerGrad = winkel(wert);
  const knauf = punkt(SCHIEBER_RADIUS, nutzerGrad);
  const linieEnde = punkt(SCHIEBER_RADIUS + 8, nutzerGrad);
  const linieStart = punkt(46, nutzerGrad);

  return (
    <main className="sc sc-spiel">
      {stummKnopf}
      <div className="sc-zaehler">
        Frage {index + 1}/{fragen.length}
      </div>
      <section className="sc-auge">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <radialGradient id="sc-linse" cx="45%" cy="40%" r="70%">
              <stop offset="0" stopColor="#f6efdc" />
              <stop offset="0.7" stopColor="#d9ccaa" />
              <stop offset="1" stopColor="#8f7a52" />
            </radialGradient>
            <radialGradient id="sc-messing2" cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#f3d79a" />
              <stop offset="0.55" stopColor="#b08d57" />
              <stop offset="1" stopColor="#5a4325" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="98" fill="url(#sc-messing2)" />
          <circle cx="100" cy="100" r="86" fill="url(#sc-linse)" stroke="#3a2c1a" strokeWidth="2" />
        </svg>
        {/* key: jede neue Frage gleitet wie ein Dia aus der Unschaerfe herein */}
        <p key={index} className="sc-frage">
          {frage?.text}
        </p>
      </section>

      <section className="sc-platte">
        <svg
          ref={svgRef}
          viewBox="0 0 400 236"
          onPointerDown={aufPlatteDruecken}
          onPointerMove={(e) => ziehen.current && !ausgeloest && schieberSetzen(e)}
          onPointerUp={() => {
            ziehen.current = false;
          }}
          role="slider"
          aria-label="Deine Einschätzung"
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={Math.round((wert + 1) * 5)}
        >
          {/* System-Boegen */}
          {SYSTEME.map((s, i) => {
            const an = gewaehlt.includes(s.id);
            const r = BOGEN_RADIEN[i];
            const p = punkt(r, zeiger[s.id]);
            const etikett = punkt(r, 184);
            return (
              <g key={s.id} opacity={an ? 1 : 0.28}>
                <path d={bogenPfad(r)} className="sc-schlitz" />
                <path d={bogenPfad(r)} stroke={s.farbe} className="sc-bogen" />
                <text x={etikett.x} y={etikett.y + 4} className="sc-etikett" fill={s.farbe}>
                  {s.kurz}
                </text>
                {an ? <circle cx={p.x} cy={p.y} r="6" fill={s.farbe} className="sc-zeiger" /> : null}
              </g>
            );
          })}

          {/* Spieler-Schieber: aeusserer Bogen mit 11 Rasten (Sonnenstrahlen) */}
          <path d={bogenPfad(SCHIEBER_RADIUS)} className="sc-schiene" />
          {Array.from({ length: 11 }, (_, k) => {
            const g = 180 - k * 18;
            const a = punkt(SCHIEBER_RADIUS - 7, g);
            const b = punkt(SCHIEBER_RADIUS + 7, g);
            return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="sc-raste" />;
          })}
          {ausgeloest ? (
            <line x1={linieStart.x} y1={linieStart.y} x2={linieEnde.x} y2={linieEnde.y} className="sc-nutzerlinie" />
          ) : null}
          <circle cx={knauf.x} cy={knauf.y} r="13" className="sc-knauf" />
          <text x={MITTE.x - SCHIEBER_RADIUS} y={MITTE.y + 20} className="sc-ende" textAnchor="middle">
            ☾
          </text>
          <text x={MITTE.x + SCHIEBER_RADIUS} y={MITTE.y + 20} className="sc-ende" textAnchor="middle">
            ☀
          </text>

          {/* Ausloeser in der Nabe */}
          <g
            className={ausgeloest ? "sc-ausloeser gedrueckt" : "sc-ausloeser"}
            onPointerDown={(e) => {
              e.stopPropagation();
              ausloesen();
            }}
            role="button"
            aria-label="Auslösen"
          >
            <circle cx={MITTE.x} cy={MITTE.y} r="40" />
            <text x={MITTE.x} y={MITTE.y - 10} textAnchor="middle">
              {ausgeloest ? "✓" : "▼"}
            </text>
          </g>
        </svg>
        <div className="sc-skala">
          <span>trifft nicht zu</span>
          <span>trifft zu</span>
        </div>
      </section>

      <div className="sc-fuss">
        {bewegt ? (
          <button type="button" className="sc-start" onClick={weiter}>
            {index + 1 >= fragen.length ? "Zum Ergebnis" : "Nächste Frage"}
          </button>
        ) : (
          <p className="sc-hinweis">
            {ausgeloest ? "Die Systeme antworten …" : "Stell deine Einschätzung ein und drück auf den Auslöser."}
          </p>
        )}
      </div>
    </main>
  );
}
