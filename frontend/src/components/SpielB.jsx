import { useEffect, useMemo, useState } from "react";
import SelbsteinschaetzungSlider from "./SelbsteinschaetzungSlider";
import RankingTabelle from "./RankingTabelle";
import { calculateRating } from "../logic/rating";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

const FENSTER_LABEL = { monat: "Letzter Monat", quartal: "Letzte drei Monate" };

// Antwortoptionen fuer "Wann war das etwa?" (Tage vor heute; null = weiss nicht mehr)
const ZEITPUNKTE = [
  { label: "vor etwa 1 Woche", tage: 7 },
  { label: "vor etwa 2 Wochen", tage: 14 },
  { label: "vor etwa 1 Monat", tage: 30 },
  { label: "vor etwa 2 Monaten", tage: 60 },
  { label: "vor etwa 3 Monaten", tage: 90 },
  { label: "weiss ich nicht mehr", tage: null },
];
const ERINNERUNG_AB = 0.2; // ab dieser Zustimmung wird nach dem Zeitpunkt gefragt

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function postJson(path, body, signal) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    throw new Error(`${path} fehlgeschlagen (${response.status})`);
  }
  return response.json();
}

function tageSeit(datum) {
  const ms = Date.now() - new Date(`${datum}T12:00:00`).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function antwortText(wert) {
  if (wert >= 0.6) return "trifft zu";
  if (wert >= 0.2) return "trifft eher zu";
  if (wert > -0.2) return "teils, teils";
  if (wert > -0.6) return "trifft eher nicht zu";
  return "trifft nicht zu";
}

function HoroskopHeute({ body }) {
  const [heute, setHeute] = useState(null);
  const [fehler, setFehler] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    postJson("/horoscope/heute", body, controller.signal)
      .then(setHeute)
      .catch((err) => err.name !== "AbortError" && setFehler(err.message));
    return () => controller.abort();
  }, [body]);

  if (fehler) return <p className="hint">Das Horoskop für heute konnte nicht geladen werden.</p>;
  if (!heute) return <p className="hint">Wird berechnet ...</p>;
  return Object.entries(heute.systeme).map(([system, teil]) => (
    <div key={system} className="horoskop-heute-system">
      <h3>{system}</h3>
      {teil.faktoren.map((text, i) => (
        <p key={`f${i}`}>{text}</p>
      ))}
      <p>
        <em>{teil.tendenzen.join(" ")}</em>
      </p>
    </div>
  ));
}

/**
 * Spiel B - Rueckblick: Horoskop der letzten 30 Tage / drei Monate gegen das eigene Erleben.
 * Gewertete Fragen: Mittel der Horoskope im Zeitfenster (Skill je Fenster gegen Kontroll-Geburtsdaten).
 * Auffaellige Fragen: staerkster Ausschlag je System, nicht gewertet, optional mit Zeitpunkt-Nachfrage.
 */
export default function SpielB({ birthDate, birthTime, optionalName, optionalGender, matrix, onBack }) {
  const [katalog, setKatalog] = useState(null);
  const [daten, setDaten] = useState(null); // /rueckblick
  const [kontrolle, setKontrolle] = useState(null); // /rueckblick/kontrolle
  const [kontrollFehler, setKontrollFehler] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [started, setStarted] = useState(false);
  const [reihenfolge, setReihenfolge] = useState([]);
  const [index, setIndex] = useState(0);
  const [wert, setWert] = useState(-1);
  const [antworten, setAntworten] = useState([]);
  const [nachfrage, setNachfrage] = useState(null); // auffaellige Frage, deren Zeitpunkt erfragt wird
  const [datumEingabe, setDatumEingabe] = useState("");
  const [saved, setSaved] = useState(false);

  const basisBody = useMemo(() => {
    const body = {
      geburtsdatum: birthDate,
      uhrzeit: birthTime,
      systeme: ["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Vedisch"],
    };
    if (optionalName?.trim()) body.geburtsname = optionalName.trim();
    if (optionalGender === "weiblich" || optionalGender === "maennlich") body.geschlecht = optionalGender;
    return body;
  }, [birthDate, birthTime, optionalName, optionalGender]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_BASE}/fragen/rueckblick`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Fragen (${r.status})`))))
      .then(setKatalog)
      .catch((err) => err.name !== "AbortError" && setFehler(err.message));
    return () => controller.abort();
  }, []);

  async function start() {
    setFehler(null);
    try {
      const rueckblick = await postJson("/rueckblick", basisBody);
      setDaten(rueckblick);
      const einleitung = katalog._meta.fenster_einleitung;
      const auffaellig = rueckblick.auffaellig.map((m) => {
        const formulierung = katalog.auffaellig[m.dimension][m.richtung];
        return {
          id: formulierung.id,
          typ: "auffaellig",
          fenster: m.fenster,
          dimension: m.dimension,
          moment: m,
          // Einleitung nach dem tatsaechlichen Zeitpunkt (ein Moment vor 10 Tagen liegt auch im letzten Monat)
          text: `${einleitung[m.tage_zurueck <= 30 ? "monat" : "quartal"]} ${formulierung.text}`,
        };
      });
      // Gewertete und auffaellige Fragen gemischt, damit die Auffaelligen nicht erkennbar sind
      setReihenfolge(shuffle([...katalog.gewertet.map((f) => ({ ...f, typ: "gewertet" })), ...auffaellig]));
      setStarted(true);
      setIndex(0);
      setAntworten([]);
      setWert(-1);
      // Kontrollgruppe im Hintergrund, waehrend die Fragen beantwortet werden
      postJson("/rueckblick/kontrolle", {
        ...basisBody,
        session_id: rueckblick.inputs.session_id,
        stichtag: rueckblick.inputs.stichtag,
      })
        .then(setKontrolle)
        .catch((err) => setKontrollFehler(err.message));
    } catch (err) {
      setFehler(err.message);
    }
  }

  const aktuelleFrage = reihenfolge[index];
  const fertig = started && reihenfolge.length > 0 && index >= reihenfolge.length && !nachfrage;

  function weiter(eintrag) {
    setAntworten((prev) => [...prev, eintrag]);
    setIndex((i) => i + 1);
    setWert(-1);
  }

  function antwortSpeichern() {
    const frage = aktuelleFrage;
    const systemWerte =
      frage.typ === "gewertet"
        ? Object.fromEntries(
            daten.inputs.systeme.map((s) => [s, Number(daten.mittel[frage.fenster][s][frage.dimension])])
          )
        : {};
    const eintrag = {
      frage_id: frage.id,
      typ: frage.typ,
      fenster: frage.fenster,
      dimension: frage.dimension,
      text: frage.text,
      selbst_wert: wert,
      system_werte: systemWerte,
      moment: frage.moment ?? null,
    };
    if (frage.typ === "auffaellig" && wert >= ERINNERUNG_AB) {
      setNachfrage(eintrag);
      return;
    }
    weiter(eintrag);
  }

  function zeitpunktSpeichern(tage, datum = null) {
    weiter({ ...nachfrage, erinnerung: { tage_zurueck: tage, datum } });
    setNachfrage(null);
    setDatumEingabe("");
  }

  const ergebnisse = useMemo(() => {
    if (!fertig || !daten) return null;
    const result = {};
    for (const fenster of ["monat", "quartal"]) {
      const eintraege = antworten.filter((a) => a.typ === "gewertet" && a.fenster === fenster);
      result[fenster] = calculateRating(daten.mittel[fenster], eintraege, matrix, kontrolle?.kontrollvektoren?.[fenster] ?? {});
    }
    return result;
  }, [fertig, daten, antworten, matrix, kontrolle]);

  const kontrolleBereit = Boolean(kontrolle) || Boolean(kontrollFehler);

  useEffect(() => {
    if (!fertig || saved || !kontrolleBereit || !ergebnisse) return;
    const payload = {
      session_id: daten.inputs.session_id,
      geburtsdatum: birthDate,
      geburtszeit: birthTime,
      antworten: antworten.map((a) => ({
        frage_id: a.frage_id,
        dimension: a.dimension,
        selbst_wert: a.selbst_wert,
        system_werte: a.system_werte,
      })),
      metadaten: {
        dsgvo_zustimmung: true,
        spieltyp: "Rueckblick",
        ...(optionalGender === "weiblich" || optionalGender === "maennlich" ? { geschlecht: optionalGender } : {}),
      },
      inputs: { ...daten.inputs, kontrolle: kontrolle?.kontrolle ?? null },
      rating: {
        skillMetrik: ergebnisse.monat.skillMetrik,
        monat: { ranking: ergebnisse.monat.ranking, systemDetails: ergebnisse.monat.systemDetails },
        quartal: { ranking: ergebnisse.quartal.ranking, systemDetails: ergebnisse.quartal.systemDetails },
        auffaellig: antworten
          .filter((a) => a.typ === "auffaellig")
          .map((a) => ({ frage_id: a.frage_id, moment: a.moment, selbst_wert: a.selbst_wert, erinnerung: a.erinnerung ?? null })),
      },
      abgeschlossen: true,
      veroeffentlichen: true,
    };
    postJson("/session", payload)
      .then(() => setSaved(true))
      .catch(() => {});
  }, [fertig, saved, kontrolleBereit, ergebnisse]);

  if (!started) {
    return (
      <section className="card">
        <h2>Rückblick: Was haben die Sterne für dich vorhergesagt?</h2>
        <p>
          Wir berechnen, was die Systeme für deine letzten 30 Tage und deine letzten drei Monate vorhergesagt
          hätten – und fragen dich, wie du diese Zeit erlebt hast. Keine Prognosen für die Zukunft, sondern ein
          Test der Prognosen der Vergangenheit.
        </p>
        <p className="hint">
          Stell dir vor, du hättest dir vor einem Monat und vor drei Monaten ein Horoskop erstellen lassen. Hätte
          es gestimmt? Manche Systeme beschreiben eher den einzelnen Monat, andere lange Lebensphasen – geprüft
          wird beides.
        </p>
        {fehler ? <p className="error">{fehler}</p> : null}
        <button type="button" onClick={start} disabled={!katalog || !birthDate}>
          Rückblick starten
        </button>{" "}
        <button type="button" className="button-restart" onClick={onBack}>
          Zurück zur Spielauswahl
        </button>
      </section>
    );
  }

  if (nachfrage) {
    return (
      <section className="card">
        <h2>Weißt du noch ungefähr, wann das war?</h2>
        <p>{nachfrage.text}</p>
        <div className="zeitpunkt-optionen">
          {ZEITPUNKTE.map((z) => (
            <button key={z.label} type="button" onClick={() => zeitpunktSpeichern(z.tage)}>
              {z.label}
            </button>
          ))}
        </div>
        <p>
          Oder genaues Datum:{" "}
          <input type="date" value={datumEingabe} onChange={(e) => setDatumEingabe(e.target.value)} />{" "}
          <button type="button" disabled={!datumEingabe} onClick={() => zeitpunktSpeichern(tageSeit(datumEingabe), datumEingabe)}>
            Übernehmen
          </button>
        </p>
      </section>
    );
  }

  if (!fertig) {
    return (
      <section className="card">
        <h2>
          Frage {index + 1}/{reihenfolge.length}
        </h2>
        <p>{aktuelleFrage.text}</p>
        <SelbsteinschaetzungSlider value={wert} onChange={setWert} />
        <p className="hint">-1 = trifft nicht zu, +1 = trifft zu</p>
        <div className="question-submit-wrap">
          <button type="button" onClick={antwortSpeichern}>
            Antwort speichern und weiter
          </button>
        </div>
      </section>
    );
  }

  const auffaellige = antworten.filter((a) => a.typ === "auffaellig");

  return (
    <>
      <section className="card">
        <h2>Ergebnis: Rückblick</h2>
        {!kontrolleBereit ? (
          <p className="mechanik-wartet" aria-live="polite">
            Das Räderwerk vergleicht deine Zeiträume mit hundert anderen Geburtsdaten ...
          </p>
        ) : (
          ["monat", "quartal"].map((fenster) => (
            <div key={fenster}>
              <h3>{FENSTER_LABEL[fenster]}</h3>
              <RankingTabelle
                systeme={ergebnisse[fenster].systemDetails}
                ranking={ergebnisse[fenster].ranking}
                skillErwartungBester={ergebnisse[fenster].skillErwartungBester}
              />
            </div>
          ))
        )}
        {kontrollFehler ? <p className="hint">Kontrollgruppe konnte nicht berechnet werden; Skill ist nicht verfügbar.</p> : null}
        <p>{saved ? "Session gespeichert." : "Session wird gespeichert..."}</p>
      </section>

      {auffaellige.length ? (
        <section className="card">
          <h2>Was die Systeme besonders betont haben</h2>
          <p className="hint">
            Diese Fragen waren unter die anderen gemischt. Sie zählen nicht zum Skill, weil sie nach deinem eigenen
            Horoskop ausgewählt wurden.
          </p>
          <ul>
            {auffaellige.map((a) => (
              <li key={a.frage_id}>
                <strong>{a.moment.system}</strong> sah vor etwa {a.moment.tage_zurueck} Tagen: „{a.text}“ – deine
                Antwort: {antwortText(a.selbst_wert)}
                {a.erinnerung
                  ? a.erinnerung.tage_zurueck == null
                    ? " (Zeitpunkt weißt du nicht mehr)"
                    : ` – du erinnerst dich an etwa ${a.erinnerung.tage_zurueck} Tage zurück (Unterschied: ${Math.abs(
                        a.erinnerung.tage_zurueck - a.moment.tage_zurueck
                      )} Tage)`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card">
        <h2>Dein Horoskop für heute</h2>
        <p className="hint">Als Dank fürs Mitmachen: was die Systeme für deinen heutigen Tag sehen.</p>
        <HoroskopHeute body={basisBody} />
        <button type="button" className="button-restart" onClick={onBack}>
          Zurück zur Spielauswahl
        </button>
      </section>
    </>
  );
}
