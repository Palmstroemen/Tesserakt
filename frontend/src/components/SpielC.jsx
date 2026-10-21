import { useEffect, useMemo, useState } from "react";
import PartnerGeburtsdatumInput from "./PartnerGeburtsdatumInput";
import PartnerSlider from "./PartnerSlider";
import RankingTabelle from "./RankingTabelle";
import { calculateRating } from "../logic/rating";
import { ortFelder } from "../logic/ort";

import { API_BASE } from "../logic/api";
import { spracheFelder } from "../logic/sprache";
const SYSTEME = ["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Vedisch"];

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function postJson(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `${path} fehlgeschlagen (${response.status})`);
  }
  return response.json();
}

function personFelder(x, { date, time, ort, geschlecht, name }) {
  const f = ortFelder(ort);
  return {
    [`geburtsdatum_${x}`]: date,
    [`uhrzeit_${x}`]: time || "12:00",
    ...(name?.trim() ? { [`geburtsname_${x}`]: name.trim() } : {}),
    ...(geschlecht === "weiblich" || geschlecht === "maennlich" ? { [`geschlecht_${x}`]: geschlecht } : {}),
    ...(f.latitude != null ? { [`latitude_${x}`]: f.latitude, [`longitude_${x}`]: f.longitude, [`zeitzone_${x}`]: f.zeitzone } : {}),
  };
}

/**
 * Spiel C - Beziehung: vergleichende Fragen ("eher ich ... eher Partner:in") gegen den Unterschied der beiden
 * Horoskope je System; Skill gegen 100 zufaellige Paare (beide Geburtsdaten zufaellig).
 */
export default function SpielC({ birthDate, birthTime, birthPlace, optionalName, optionalGender, matrix, onBack, onRestart }) {
  const [katalog, setKatalog] = useState(null);
  const [partnerDaten, setPartnerDaten] = useState(null); // { date, time, ort } fuer die Speicherung
  const [daten, setDaten] = useState(null); // /partner
  const [kontrolle, setKontrolle] = useState(null);
  const [kontrollFehler, setKontrollFehler] = useState(null);
  const [fehler, setFehler] = useState(null);
  const [laedt, setLaedt] = useState(false);
  const [reihenfolge, setReihenfolge] = useState([]);
  const [index, setIndex] = useState(0);
  const [wert, setWert] = useState(0); // Start: ausgewogen
  const [antworten, setAntworten] = useState([]);
  const [saved, setSaved] = useState(false);
  const [anfrage, setAnfrage] = useState(null); // Geburtsdaten beider Personen fuer /horoscope/paar
  const [texte, setTexte] = useState(null); // /horoscope/paar
  const [aktivesSystem, setAktivesSystem] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/fragen/beziehung`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Fragen (${r.status})`))))
      .then(setKatalog)
      .catch((err) => setFehler(err.message));
  }, []);

  async function start(partner) {
    setFehler(null);
    setLaedt(true);
    try {
      const requestBody = {
        ...personFelder("a", { date: birthDate, time: birthTime, ort: birthPlace, geschlecht: optionalGender, name: optionalName }),
        ...personFelder("b", partner),
        systeme: SYSTEME,
      };
      const ergebnis = await postJson("/partner", requestBody);
      setPartnerDaten(partner);
      setAnfrage(requestBody);
      setTexte(null);
      setDaten(ergebnis);
      setReihenfolge(shuffle(katalog.fragen));
      setIndex(0);
      setAntworten([]);
      setWert(0);
      setSaved(false);
      // Kontrollgruppe (zufaellige Paare) waehrend der Fragen im Hintergrund
      postJson("/partner/kontrolle", { ...requestBody, session_id: ergebnis.inputs.session_id, stichtag: ergebnis.inputs.stichtag })
        .then(setKontrolle)
        .catch((err) => setKontrollFehler(err.message));
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaedt(false);
    }
  }

  const fertig = Boolean(daten) && reihenfolge.length > 0 && index >= reihenfolge.length;
  const kontrolleBereit = Boolean(kontrolle) || Boolean(kontrollFehler);

  function antwortSpeichern() {
    const frage = reihenfolge[index];
    setAntworten((prev) => [
      ...prev,
      {
        frage_id: frage.id,
        dimension: frage.dimension,
        selbst_wert: wert,
        system_werte: Object.fromEntries(SYSTEME.map((s) => [s, Number(daten.differenz[s][frage.dimension])])),
        gewichte: {},
      },
    ]);
    setIndex((i) => i + 1);
    setWert(0);
  }

  const ergebnis = useMemo(() => {
    if (!fertig) return null;
    return calculateRating(daten.differenz, antworten, matrix, kontrolle?.kontrollvektoren ?? {});
  }, [fertig, daten, antworten, matrix, kontrolle]);

  useEffect(() => {
    if (!fertig) return;
    postJson("/horoscope/paar", anfrage)
      .then(setTexte)
      .catch(() => setTexte(null));
  }, [fertig, anfrage]);

  const systemeMitText = useMemo(
    () => (ergebnis?.ranking ?? []).filter((s) => texte?.systeme?.[s]?.aussagen?.length),
    [ergebnis, texte]
  );
  useEffect(() => {
    if (systemeMitText.length && !systemeMitText.includes(aktivesSystem)) setAktivesSystem(systemeMitText[0]);
  }, [systemeMitText, aktivesSystem]);

  useEffect(() => {
    if (!fertig || saved || !kontrolleBereit || !ergebnis) return;
    postJson("/session", {
      session_id: daten.inputs.session_id,
      geburtsdatum: birthDate,
      geburtszeit: birthTime || "12:00",
      antworten: antworten.map(({ frage_id, dimension, selbst_wert, system_werte }) => ({ frage_id, dimension, selbst_wert, system_werte })),
      metadaten: { dsgvo_zustimmung: true, partner_einwilligung: true, spieltyp: "Beziehung" },
      inputs: {
        ...daten.inputs,
        partner: { geburtsdatum: partnerDaten.date, geburtszeit: partnerDaten.time || "12:00" },
        kontrolle: kontrolle?.kontrolle ?? null,
      },
      rating: { skillMetrik: ergebnis.skillMetrik, ranking: ergebnis.ranking, systemDetails: ergebnis.systemDetails },
      abgeschlossen: true,
      veroeffentlichen: true,
      ...spracheFelder(),
    })
      .then(() => setSaved(true))
      .catch(() => {});
  }, [fertig, saved, kontrolleBereit, ergebnis]);

  if (!daten) {
    return (
      <>
        <PartnerGeburtsdatumInput onConfirm={start} onBack={onBack} />
        {laedt ? <p>Partner-Horoskope werden berechnet...</p> : null}
        {fehler ? <p className="error">{fehler}</p> : null}
      </>
    );
  }

  if (!fertig) {
    return (
      <section className="card">
        <h2>
          Beziehungsfrage {index + 1}/{reihenfolge.length}
        </h2>
        <div className="question-text">
          <p>{reihenfolge[index].text}</p>
        </div>
        <PartnerSlider value={wert} onChange={setWert} />
        <div className="question-submit-wrap">
          <button type="button" onClick={antwortSpeichern}>
            Antwort speichern und weiter
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Partnerhoroskop – Ergebnis</h2>
      <p className="hint">
        Skill: Erkennt ein System, wer von euch in welchem Bereich stärker ist – besser als bei hundert zufälligen Paaren?
      </p>
      {!kontrolleBereit ? (
        <p className="mechanik-wartet" aria-live="polite">
          Das Räderwerk vergleicht euch mit hundert anderen Paaren ...
        </p>
      ) : (
        <RankingTabelle systeme={ergebnis.systemDetails} ranking={ergebnis.ranking} skillErwartungBester={ergebnis.skillErwartungBester} />
      )}
      {kontrollFehler ? <p className="hint">Kontrollgruppe konnte nicht berechnet werden; Skill ist nicht verfügbar.</p> : null}
      <p>{saved ? "Session gespeichert." : "Session wird gespeichert..."}</p>
      {systemeMitText.length ? (
        <div className="system-deutung-tabs">
          <p className="tabs-hint">Reihenfolge entspricht dem Ranking.</p>
          <div className="tabs-header" role="tablist">
            {systemeMitText.map((system) => (
              <button
                key={system}
                type="button"
                role="tab"
                aria-selected={aktivesSystem === system}
                className={aktivesSystem === system ? "tab active" : "tab"}
                onClick={() => setAktivesSystem(system)}
              >
                {system}
              </button>
            ))}
          </div>
          {aktivesSystem ? (
            <div role="tabpanel" className="tabs-content">
              <h3>Ihr Partnerschaftshoroskop – {aktivesSystem}</h3>
              <div className="deutung-horoskop-ausfuehrlich">
                {texte.systeme[aktivesSystem].aussagen.map((a, i) => (
                  <p key={i}>{a}</p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <p>
        <button type="button" className="button-restart" onClick={() => setDaten(null)}>
          Nochmal andere Partner:in
        </button>
        <button type="button" className="button-restart" onClick={onRestart}>
          Neue Analyse
        </button>
      </p>
    </section>
  );
}
