import { useEffect, useMemo, useState } from "react";
import SelbsteinschaetzungSlider from "./SelbsteinschaetzungSlider";
import RankingTabelle from "./RankingTabelle";
import { calculateRating, calculateTimingRating } from "../logic/rating";
import { ortFelder } from "../logic/ort";

import { API_BASE } from "../logic/api";
import { spracheFelder } from "../logic/sprache";

const FENSTER_LABEL = { monat: "Letzter Monat", quartal: "Letzte drei Monate" };

// Antwortoptionen fuer "Wann war das etwa?" (Tage vor heute; null = weiss nicht mehr)
const ZEITPUNKTE = [
  { label: "vor etwa 1 Woche", tage: 7 },
  { label: "vor etwa 2 Wochen", tage: 14 },
  { label: "vor etwa 1 Monat", tage: 30 },
  { label: "vor etwa 2 Monaten", tage: 60 },
  { label: "vor etwa 3 Monaten", tage: 90 },
  { label: "weiß ich nicht mehr", tage: null },
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
export default function SpielB({ birthDate, birthTime, birthPlace, optionalName, optionalGender, matrix, onBack }) {
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
  // Zeitpunkt-Fragen (fest fuer alle, gewertet als Skill "Timing")
  const [zIndex, setZIndex] = useState(0);
  const [zAntworten, setZAntworten] = useState([]);
  const [zJa, setZJa] = useState(false);
  const [datumEingabe, setDatumEingabe] = useState("");
  const [saved, setSaved] = useState(false);

  const basisBody = useMemo(() => {
    const body = {
      geburtsdatum: birthDate,
      uhrzeit: birthTime,
      systeme: ["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Vedisch"],
      ...ortFelder(birthPlace),
    };
    if (optionalName?.trim()) body.geburtsname = optionalName.trim();
    if (optionalGender === "weiblich" || optionalGender === "maennlich") body.geschlecht = optionalGender;
    return body;
  }, [birthDate, birthTime, birthPlace, optionalName, optionalGender]);

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
      // Sehen mehrere Systeme denselben Moment (gleicher Lebensbereich, gleiche Richtung), wird einmal gefragt
      const nachFormulierung = new Map();
      for (const m of rueckblick.auffaellig) {
        const formulierung = katalog.auffaellig[m.dimension][m.richtung];
        const frage = nachFormulierung.get(formulierung.id) ?? {
          id: formulierung.id,
          typ: "auffaellig",
          fenster: m.fenster,
          dimension: m.dimension,
          momente: [],
          formulierung: formulierung.text,
        };
        frage.momente.push(m);
        nachFormulierung.set(formulierung.id, frage);
      }
      const auffaellig = [...nachFormulierung.values()].map((frage) => {
        // Einleitung nach dem juengsten Zeitpunkt (ein Moment vor 10 Tagen liegt auch im letzten Monat)
        const juengster = Math.min(...frage.momente.map((m) => m.tage_zurueck));
        return { ...frage, text: `${einleitung[juengster <= 30 ? "monat" : "quartal"]} ${frage.formulierung}` };
      });
      // Gewertete und auffaellige Fragen gemischt, damit die Auffaelligen nicht erkennbar sind
      setReihenfolge(shuffle([...katalog.gewertet.map((f) => ({ ...f, typ: "gewertet" })), ...auffaellig]));
      setStarted(true);
      setIndex(0);
      setAntworten([]);
      setZIndex(0);
      setZAntworten([]);
      setZJa(false);
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
  const fragenFertig = started && reihenfolge.length > 0 && index >= reihenfolge.length && !nachfrage;
  const zeitpunktFragen = katalog?.zeitpunkt ?? [];
  const fertig = fragenFertig && zIndex >= zeitpunktFragen.length;

  function zeitpunktAntwort(antwort, tage = null, datum = null) {
    const frage = zeitpunktFragen[zIndex];
    setZAntworten((prev) => [
      ...prev,
      { frage_id: frage.id, dimension: frage.dimension, antwort, tage_zurueck: tage, datum },
    ]);
    setZJa(false);
    setDatumEingabe("");
    setZIndex((i) => i + 1);
  }

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
      momente: frage.momente ?? [],
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
    result.timing = calculateTimingRating(
      zAntworten.filter((a) => a.antwort === "ja"),
      daten.timing,
      kontrolle?.timing ?? {},
      daten.inputs.systeme,
      daten.inputs.timing_konstant ?? null
    );
    return result;
  }, [fertig, daten, antworten, zAntworten, matrix, kontrolle]);

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
      })).concat(
        // Zeitpunkt-Fragen: selbst_wert 1 = ja, -1 = nein, 0 = weiss nicht; system_werte = Hoehepunkte (Tage zurueck)
        zAntworten.map((a) => ({
          frage_id: a.frage_id,
          dimension: a.dimension,
          selbst_wert: a.antwort === "ja" ? 1 : a.antwort === "nein" ? -1 : 0,
          system_werte: daten.timing?.[a.frage_id] ?? {},
        }))
      ),
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
        timing: {
          ranking: ergebnisse.timing.ranking,
          systemDetails: ergebnisse.timing.systemDetails,
          antworten: zAntworten,
          ohneAussage: ergebnisse.timing.ohneAussage,
        },
        auffaellig: antworten
          .filter((a) => a.typ === "auffaellig")
          .flatMap((a) =>
            a.momente.map((moment) => ({ frage_id: a.frage_id, moment, selbst_wert: a.selbst_wert, erinnerung: a.erinnerung ?? null }))
          ),
      },
      abgeschlossen: true,
      veroeffentlichen: true,
      ...spracheFelder(),
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

  if (fragenFertig && !fertig) {
    const frage = zeitpunktFragen[zIndex];
    return (
      <section className="card">
        <h2>
          Zum Schluss: Erinnerung {zIndex + 1}/{zeitpunktFragen.length}
        </h2>
        <p>{frage.text}</p>
        {!zJa ? (
          <div className="zeitpunkt-optionen">
            <button type="button" onClick={() => setZJa(true)}>
              Ja
            </button>
            <button type="button" onClick={() => zeitpunktAntwort("nein")}>
              Nein
            </button>
            <button type="button" onClick={() => zeitpunktAntwort("weiss_nicht")}>
              Weiß ich nicht
            </button>
          </div>
        ) : (
          <>
            <p>Wann war das ungefähr?</p>
            <div className="zeitpunkt-optionen">
              {ZEITPUNKTE.map((z) => (
                <button key={z.label} type="button" onClick={() => zeitpunktAntwort("ja", z.tage)}>
                  {z.label}
                </button>
              ))}
            </div>
            <p>
              Oder genaues Datum:{" "}
              <input type="date" value={datumEingabe} onChange={(e) => setDatumEingabe(e.target.value)} />{" "}
              <button
                type="button"
                disabled={!datumEingabe}
                onClick={() => zeitpunktAntwort("ja", tageSeit(datumEingabe), datumEingabe)}
              >
                Übernehmen
              </button>
            </p>
          </>
        )}
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
        {kontrolleBereit ? (
          <div>
            <h3>Timing: Wann ist es passiert?</h3>
            {ergebnisse.timing.anzahl ? (
              <>
                <p className="hint">
                  Wie nah lag der Höhepunkt, den ein System für das Ereignis berechnet hat, an deiner Erinnerung –
                  verglichen mit hundert anderen Geburtsdaten ({ergebnisse.timing.anzahl} von {zeitpunktFragen.length}{" "}
                  Erinnerungsfragen mit Zeitpunkt).
                </p>
                <RankingTabelle
                  systeme={ergebnisse.timing.systemDetails}
                  ranking={ergebnisse.timing.ranking}
                  skillErwartungBester={ergebnisse.timing.skillErwartungBester}
                  timing
                />
                {ergebnisse.timing.ohneAussage.length ? (
                  <p className="hint">
                    Keine Aussage zum Zeitpunkt (ihr Horoskop schwankt in diesem Zeitraum nicht):{" "}
                    {ergebnisse.timing.ohneAussage.join(", ")}.
                  </p>
                ) : null}
              </>
            ) : (
              <p className="hint">Keine Erinnerung mit Zeitpunkt angegeben – dafür gibt es diesmal kein Timing-Ergebnis.</p>
            )}
          </div>
        ) : null}
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
            {auffaellige.flatMap((a) =>
              a.momente.map((moment) => (
                <li key={`${a.frage_id}-${moment.system}`}>
                  <strong>{moment.system}</strong> sah vor etwa {moment.tage_zurueck} Tagen: „{a.text}“ – deine
                  Antwort: {antwortText(a.selbst_wert)}
                  {a.erinnerung
                    ? a.erinnerung.tage_zurueck == null
                      ? " (Zeitpunkt weißt du nicht mehr)"
                      : ` – du erinnerst dich an etwa ${a.erinnerung.tage_zurueck} Tage zurück (Unterschied: ${Math.abs(
                          a.erinnerung.tage_zurueck - moment.tage_zurueck
                        )} Tage)`
                    : ""}
                </li>
              ))
            )}
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
