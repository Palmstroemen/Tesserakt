import { useEffect, useMemo, useState } from "react";
import { calculateRating, erwarteterSkillBester } from "../logic/rating";
import { ortFelder } from "../logic/ort";
import { SYSTEME } from "./systeme";
import Datumsrad from "./Datumsrad";
import Spielplatte from "./Spielplatte";
import Ergebnisplatte from "./Ergebnisplatte";
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
  // start | laden | uebergang (Rad -> Fragen) | frage | abschluss (Fragen -> Ergebnis)
  // | abkuerzung (Rad -> Ergebnis, Entwicklung) | ende
  const [phase, setPhase] = useState("start");
  const [spiel, setSpiel] = useState("A");
  const [fehler, setFehler] = useState(null);

  const [fragen, setFragen] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [vektoren, setVektoren] = useState(null); // A: Vektoren der Person; C: Unterschied (B - A) / 2
  const [kontroll, setKontroll] = useState(null);
  const [visualPayloads, setVisualPayloads] = useState(null);
  const [heute, setHeute] = useState(null);
  const [texte, setTexte] = useState(null);
  const [abkuerzung, setAbkuerzung] = useState(false);

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
    fetch(`${API_BASE}/horoscope/texts?locale=de`)
      .then((r) => r.json())
      .then(setTexte)
      .catch(() => {});
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

  function wechsel(zwischen, ziel) {
    setPhase(zwischen);
    zahnrad(26, UEBERGANG_MS / 1000, 1700);
    setTimeout(() => setPhase(ziel), UEBERGANG_MS);
  }

  // B ist in der Schatulle noch kein Spiel: dient vorerst als Abkuerzung zum Ergebnis (Entwicklung).
  // Die Antworten werden gewuerfelt; gerechnet wird wie in Spiel A.
  async function spielWahl(wahl, eingabe) {
    setFehler(null);
    setSpiel(wahl === "C" ? "C" : "A");
    setAbkuerzung(wahl === "B");
    rastKlick(); // erste Beruehrung: Audio freigeben
    setPhase("laden");
    if (wahl !== "B") kameraStarten();
    setVisualPayloads(null);
    setHeute(null);
    try {
      let body;
      let kontrollPfad;
      let katalogFragen;
      let vek;
      if (wahl === "C") {
        body = {
          ...personFelder("a", eingabe.a),
          ...personFelder("b", eingabe.b),
          systeme: ALLE,
        };
        const [katalog, v] = await Promise.all([
          fetch(`${API_BASE}/fragen/beziehung`).then((r) => r.json()),
          postJson("/partner", body),
        ]);
        katalogFragen = katalog.fragen ?? [];
        vek = v.differenz;
        body = {
          ...body,
          session_id: v.inputs.session_id,
          stichtag: v.inputs.stichtag,
        };
        kontrollPfad = "/partner/kontrolle";
      } else {
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
        katalogFragen = katalog.fragen ?? [];
        vek = v.vektoren;
        setVisualPayloads(v.inputs.visualPayloads ?? null);
        // Horoskop fuer heute (Teil des Ergebnisses), im Hintergrund
        postJson("/horoscope/heute", body)
          .then(setHeute)
          .catch(() => {});
        body = {
          ...body,
          session_id: v.inputs.session_id,
          stichtag: v.inputs.stichtag,
        };
        kontrollPfad = "/kontrolle";
      }
      setFragen(mischen(katalogFragen));
      setVektoren(vek);
      setKontroll(null);
      setRunde((r) => r + 1);
      if (wahl === "B") {
        setAntworten(
          katalogFragen.map((f) => ({
            frage_id: f.id,
            dimension: f.dimension,
            selbst_wert: Math.round((Math.random() * 2 - 1) * 5) / 5,
            angezeigt: [],
            system_werte: Object.fromEntries(
              ALLE.map((s) => [s, Number(vek[s][f.dimension])]),
            ),
            gewichte: Object.fromEntries(
              ALLE.map((s) => [s, f.gewichte?.[s] ?? 1]),
            ),
          })),
        );
        wechsel("abkuerzung", "ende");
      } else {
        setAntworten([]);
        // Uebergang: Datumsscheibe dreht sich zum magischen Auge, die Ortswalzen schwenken weg
        wechsel("uebergang", "frage");
      }
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
    if (
      !["abschluss", "abkuerzung", "ende"].includes(phase) ||
      !kontroll ||
      !matrix
    )
      return null;
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
  // Alle Platten liegen uebereinander: Waehrend eines Uebergangs spielt die alte Platte ihren Abgang als
  // Deckschicht ueber der schon fertigen neuen (Rad -> Fragen, Fragen -> Ergebnis, Rad -> Ergebnis).
  const zeigeRad = ["start", "laden", "uebergang", "abkuerzung"].includes(
    phase,
  );
  const zeigeSpiel = ["uebergang", "frage", "abschluss"].includes(phase);
  const zeigeErgebnis = ["abschluss", "abkuerzung", "ende"].includes(phase);
  return (
    <div className="sc-buehne">
      {zeigeErgebnis ? (
        <Ergebnisplatte
          spiel={spiel}
          ergebnis={ergebnis}
          vergleich={SPIELE[spiel].vergleich}
          antwortZahl={antworten.length}
          visualPayloads={visualPayloads}
          heute={heute}
          texte={spiel === "A" ? texte : null}
          hinweis={
            abkuerzung
              ? "Abkürzung über B (Entwicklung): Die Antworten wurden gewürfelt."
              : null
          }
          onNochmal={() => setPhase("start")}
        />
      ) : null}
      {zeigeSpiel ? (
        <div className={phase === "abschluss" ? "sc-deckschicht" : undefined}>
          <Spielplatte
            key={runde}
            fragen={fragen}
            pole={SPIELE[spiel].pole}
            zielWert={(s, dim) =>
              anzeigeWert(stat, s, dim, Number(vektoren[s][dim]))
            }
            onAntwort={antwort}
            onFertig={() => wechsel("abschluss", "ende")}
            kamera={kamera}
            kameraInfo={kameraInfo}
            auftritt={phase === "uebergang"}
            abgang={phase === "abschluss"}
          />
        </div>
      ) : null}
      {zeigeRad ? (
        <div
          className={
            phase === "uebergang" || phase === "abkuerzung"
              ? "sc-deckschicht"
              : undefined
          }
        >
          <Datumsrad
            onSpiel={spielWahl}
            laedt={phase !== "start"}
            fehler={fehler}
            abgang={phase === "uebergang" || phase === "abkuerzung"}
          />
        </div>
      ) : null}
    </div>
  );
}
