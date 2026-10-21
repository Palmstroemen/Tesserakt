import { useEffect, useMemo, useState } from "react";
import { OrtSuche } from "../components/GeburtsdatumInput";
import { calculateRating, erwarteterSkillBester } from "../logic/rating";
import { ortFelder } from "../logic/ort";
import { SYSTEME } from "./systeme";
import Spielplatte from "./Spielplatte";
import { rastKlick } from "./klang";
import { belichtungFesthalten } from "./kamera";

import { API_BASE } from "../logic/api";
const ALLE = SYSTEME.map((s) => s.id);

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

export default function Schatulle() {
  const [phase, setPhase] = useState("start"); // start | laden | frage | ende
  const [datum, setDatum] = useState("");
  const [zeit, setZeit] = useState("12:00");
  const [ort, setOrt] = useState(null);
  const [fehler, setFehler] = useState(null);

  const [fragen, setFragen] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [vektoren, setVektoren] = useState(null);
  const [kontroll, setKontroll] = useState(null);

  const [antworten, setAntworten] = useState([]);
  const [runde, setRunde] = useState(0);
  const [kamera, setKamera] = useState(null);
  const [kameraInfo, setKameraInfo] = useState("");

  // Kamera beim Verlassen der Fragerunde abschalten
  useEffect(() => {
    if (phase === "frage" || phase === "laden" || !kamera) return;
    kamera.getTracks().forEach((t) => t.stop());
    setKamera(null);
  }, [phase, kamera]);

  useEffect(() => {
    fetch(`${API_BASE}/fragen`).then((r) => r.json()).then((d) => setFragen(d.fragen ?? [])).catch(() => {});
    fetch(`${API_BASE}/matrix`).then((r) => r.json()).then(setMatrix).catch(() => {});
  }, []);


  const stat = useMemo(() => anzeigeStatistik(kontroll), [kontroll]);

  async function starten() {
    setFehler(null);
    rastKlick(); // erste Beruehrung: Audio freigeben
    setPhase("laden");
    // Magisches Auge: Rueckkamera als Durchlicht (nur ueber HTTPS oder localhost; sonst bleibt die Linse hell)
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        setKamera(stream);
        return belichtungFesthalten(stream).then(setKameraInfo);
      })
      .catch((err) => {
        setKamera(null);
        setKameraInfo(`Kamera: ${err.name}`);
      });
    try {
      const body = { geburtsdatum: datum, uhrzeit: zeit, systeme: ALLE, ...ortFelder(ort) };
      const v = await postJson("/vektor", body);
      setVektoren(v.vektoren);
      setFragen((f) => mischen(f));
      setAntworten([]);
      setRunde((r) => r + 1);
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

  // Antwort festhalten: Systemwerte fuer alle 7 (das Aufziehen wirkt nur auf die Anzeige)
  function antwort(frage, selbstWert, angezeigt) {
    setAntworten((prev) => [
      ...prev,
      {
        frage_id: frage.id,
        dimension: frage.dimension,
        selbst_wert: Number(selbstWert.toFixed(2)),
        angezeigt,
        system_werte: Object.fromEntries(ALLE.map((s) => [s, Number(vektoren[s][frage.dimension])])),
        gewichte: Object.fromEntries(ALLE.map((s) => [s, frage.gewichte?.[s] ?? 1])),
      },
    ]);
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
    const mitgespielt = Object.fromEntries(ALLE.map((s) => [s, antworten.filter((a) => a.angezeigt.includes(s)).length]));
    return { alle, mitgespielt, erwartung: erwarteterSkillBester(ALLE.length) };
  }, [phase, kontroll, matrix, vektoren, antworten]);

  // --- Darstellung ------------------------------------------------------------
  if (phase === "start" || phase === "laden") {
    return (
      <main className="sc">
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
          {fehler ? <p className="sc-fehler">{fehler}</p> : null}
          <button
            type="button"
            className="sc-start"
            disabled={!datum || !fragen.length || phase === "laden"}
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
        <h2 className="sc-titel">Dein Ergebnis</h2>
        {!ergebnis ? (
          <p className="sc-hinweis">Das Räderwerk vergleicht dich mit hundert anderen Geburtsdaten …</p>
        ) : (
          <>
            <div className="sc-karten">
              {ergebnis.alle.ranking.map((s) => {
                const sys = SYSTEME.find((x) => x.id === s);
                const d = ergebnis.alle.systemDetails[s];
                return (
                  <article key={s} className="sc-ergebniskarte" style={{ "--farbe": sys.farbe }}>
                    <header>{s}</header>
                    <div className="sc-skill">{d.skillScore > 0 ? `+${d.skillScore.toFixed(0)}` : d.skillScore.toFixed(0)}</div>
                    <div className="sc-perzentil">besser als {d.perzentil.toFixed(0)} von 100 anderen Geburtsdaten</div>
                    <div className="sc-perzentil">
                      mitgespielt bei {ergebnis.mitgespielt[s]} von {antworten.length} Fragen
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="sc-hinweis">
              Skill 0 = Zufall, +100 = besser als alle anderen Geburtsdaten. Auch ohne jede Aussagekraft erreicht das
              beste von {ALLE.length} Systemen im Mittel etwa +{ergebnis.erwartung.toFixed(0)}.
              <br />
              Prototyp: Es wird nichts gespeichert. Gewertet werden immer alle Fragen, auch wenn ein System nicht aufgezogen war.
            </p>
          </>
        )}
        <button type="button" className="sc-start" onClick={() => setPhase("start")}>
          Noch einmal
        </button>
      </main>
    );
  }

  return (
    <Spielplatte
      key={runde}
      fragen={fragen}
      zielWert={(s, dim) => anzeigeWert(stat, s, dim, Number(vektoren[s][dim]))}
      onAntwort={antwort}
      onFertig={() => setPhase("ende")}
      kamera={kamera}
      kameraInfo={kameraInfo}
    />
  );
}
