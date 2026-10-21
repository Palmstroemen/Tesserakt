import { useEffect, useMemo, useState } from "react";
import { calculateRating, erwarteterSkillBester } from "../logic/rating";
import { ortFelder } from "../logic/ort";
import { SYSTEME } from "./systeme";
import Datumsrad from "./Datumsrad";
import Spielplatte from "./Spielplatte";
import { rastKlick, zahnrad } from "./klang";
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

// Spiel C: Felder einer Person fuer /partner (x = "a" oder "b")
function personFelder(x, { geburtsdatum, uhrzeit, ort }) {
  const f = ortFelder(ort);
  return {
    [`geburtsdatum_${x}`]: geburtsdatum,
    [`uhrzeit_${x}`]: uhrzeit || "12:00",
    ...(f.latitude != null
      ? {
          [`latitude_${x}`]: f.latitude,
          [`longitude_${x}`]: f.longitude,
          [`zeitzone_${x}`]: f.zeitzone,
        }
      : {}),
  };
}

// Was die Spiele unterscheidet; die Fragerunde selbst ist dieselbe
const SPIELE = {
  A: {
    pole: ["trifft nicht zu", "trifft zu"],
    vergleich: "anderen Geburtsdaten",
  },
  C: { pole: ["eher ich", "eher Partner:in"], vergleich: "zufälligen Paaren" },
};
const UEBERGANG_MS = 1300;

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
      const sd = Math.sqrt(
        werte.reduce((a, b) => a + (b - mittel) ** 2, 0) / werte.length,
      );
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
  const [phase, setPhase] = useState("start"); // start | laden | uebergang | frage | ende
  const [spiel, setSpiel] = useState("A");
  const [fehler, setFehler] = useState(null);

  const [fragen, setFragen] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [vektoren, setVektoren] = useState(null); // A: Vektoren der Person; C: Unterschied (B - A) / 2
  const [kontroll, setKontroll] = useState(null);

  const [antworten, setAntworten] = useState([]);
  const [runde, setRunde] = useState(0);
  const [kamera, setKamera] = useState(null);
  const [kameraInfo, setKameraInfo] = useState("");

  // Kamera beim Verlassen der Fragerunde abschalten
  useEffect(() => {
    if (["laden", "uebergang", "frage"].includes(phase) || !kamera) return;
    kamera.getTracks().forEach((t) => t.stop());
    setKamera(null);
  }, [phase, kamera]);

  useEffect(() => {
    fetch(`${API_BASE}/matrix`)
      .then((r) => r.json())
      .then(setMatrix)
      .catch(() => {});
  }, []);

  const stat = useMemo(() => anzeigeStatistik(kontroll), [kontroll]);

  function kameraStarten() {
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
  }

  async function spielWahl(wahl, eingabe) {
    if (wahl === "B") {
      setFehler("Spiel B gibt es in der Schatulle noch nicht.");
      return;
    }
    setFehler(null);
    setSpiel(wahl);
    rastKlick(); // erste Beruehrung: Audio freigeben
    setPhase("laden");
    kameraStarten();
    try {
      let body;
      let kontrollPfad;
      if (wahl === "A") {
        body = {
          geburtsdatum: eingabe.geburtsdatum,
          uhrzeit: eingabe.uhrzeit,
          systeme: ALLE,
          ...ortFelder(eingabe.ort),
        };
        const [katalog, v] = await Promise.all([
          fetch(`${API_BASE}/fragen`).then((r) => r.json()),
          postJson("/vektor", body),
        ]);
        setFragen(mischen(katalog.fragen ?? []));
        setVektoren(v.vektoren);
        body = {
          ...body,
          session_id: v.inputs.session_id,
          stichtag: v.inputs.stichtag,
        };
        kontrollPfad = "/kontrolle";
      } else {
        body = {
          ...personFelder("a", eingabe.a),
          ...personFelder("b", eingabe.b),
          systeme: ALLE,
        };
        const [katalog, v] = await Promise.all([
          fetch(`${API_BASE}/fragen/beziehung`).then((r) => r.json()),
          postJson("/partner", body),
        ]);
        setFragen(mischen(katalog.fragen ?? []));
        setVektoren(v.differenz);
        body = {
          ...body,
          session_id: v.inputs.session_id,
          stichtag: v.inputs.stichtag,
        };
        kontrollPfad = "/partner/kontrolle";
      }
      setAntworten([]);
      setKontroll(null);
      setRunde((r) => r + 1);
      // Uebergang: Datumsscheibe dreht sich zum magischen Auge, die Ortswalzen schwenken weg
      setPhase("uebergang");
      zahnrad(26, UEBERGANG_MS / 1000, 1700);
      setTimeout(() => setPhase("frage"), UEBERGANG_MS);
      // Kontrollgruppe im Hintergrund (fuer Anzeige-Skalierung und Skill)
      postJson(kontrollPfad, body)
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
        system_werte: Object.fromEntries(
          ALLE.map((s) => [s, Number(vektoren[s][frage.dimension])]),
        ),
        gewichte: Object.fromEntries(
          ALLE.map((s) => [s, frage.gewichte?.[s] ?? 1]),
        ),
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
      kontroll,
    );
    const mitgespielt = Object.fromEntries(
      ALLE.map((s) => [
        s,
        antworten.filter((a) => a.angezeigt.includes(s)).length,
      ]),
    );
    return { alle, mitgespielt, erwartung: erwarteterSkillBester(ALLE.length) };
  }, [phase, kontroll, matrix, vektoren, antworten]);

  // --- Darstellung ------------------------------------------------------------
  if (phase === "ende") {
    return (
      <main className="sc">
        <h2 className="sc-titel">
          {spiel === "C" ? "Euer Ergebnis" : "Dein Ergebnis"}
        </h2>
        {!ergebnis ? (
          <p className="sc-hinweis">
            Das Räderwerk vergleicht mit hundert {SPIELE[spiel].vergleich} …
          </p>
        ) : (
          <>
            <div className="sc-karten">
              {ergebnis.alle.ranking.map((s) => {
                const sys = SYSTEME.find((x) => x.id === s);
                const d = ergebnis.alle.systemDetails[s];
                return (
                  <article
                    key={s}
                    className="sc-ergebniskarte"
                    style={{ "--farbe": sys.farbe }}
                  >
                    <header>{s}</header>
                    <div className="sc-skill">
                      {d.skillScore > 0
                        ? `+${d.skillScore.toFixed(0)}`
                        : d.skillScore.toFixed(0)}
                    </div>
                    <div className="sc-perzentil">
                      besser als {d.perzentil.toFixed(0)} von 100{" "}
                      {SPIELE[spiel].vergleich}
                    </div>
                    <div className="sc-perzentil">
                      mitgespielt bei {ergebnis.mitgespielt[s]} von{" "}
                      {antworten.length} Fragen
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="sc-hinweis">
              Skill 0 = Zufall, +100 = besser als alle {SPIELE[spiel].vergleich}
              . Auch ohne jede Aussagekraft erreicht das beste von {ALLE.length}{" "}
              Systemen im Mittel etwa +{ergebnis.erwartung.toFixed(0)}.
              <br />
              Prototyp: Es wird nichts gespeichert. Gewertet werden immer alle
              Fragen, auch wenn ein System nicht aufgezogen war.
            </p>
          </>
        )}
        <button
          type="button"
          className="sc-start"
          onClick={() => setPhase("start")}
        >
          Noch einmal
        </button>
      </main>
    );
  }

  // Start, Laden, Uebergang und Fragerunde liegen uebereinander: Waehrend des Uebergangs spielt das
  // Datumsrad seinen Abgang ueber der schon fertigen Spielplatte.
  const zeigeSpiel = phase === "uebergang" || phase === "frage";
  const zeigeRad =
    phase === "start" || phase === "laden" || phase === "uebergang";
  return (
    <div className="sc-buehne">
      {zeigeSpiel ? (
        <Spielplatte
          key={runde}
          fragen={fragen}
          pole={SPIELE[spiel].pole}
          zielWert={(s, dim) =>
            anzeigeWert(stat, s, dim, Number(vektoren[s][dim]))
          }
          onAntwort={antwort}
          onFertig={() => setPhase("ende")}
          kamera={kamera}
          kameraInfo={kameraInfo}
          auftritt={phase === "uebergang"}
        />
      ) : null}
      {zeigeRad ? (
        <div className={phase === "uebergang" ? "sc-deckschicht" : undefined}>
          <Datumsrad
            onSpiel={spielWahl}
            laedt={phase !== "start"}
            fehler={fehler}
            abgang={phase === "uebergang"}
          />
        </div>
      ) : null}
    </div>
  );
}
