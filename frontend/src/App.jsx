import { useEffect, useMemo, useState } from "react";
import GeburtsdatumInput from "./components/GeburtsdatumInput";
import GameSelector from "./components/GameSelector";
import GamePlaceholder from "./components/GamePlaceholder";
import PartnerGeburtsdatumInput from "./components/PartnerGeburtsdatumInput";
import PartnerSlider from "./components/PartnerSlider";
import SystemSelector from "./components/SystemSelector";
import SelbsteinschaetzungSlider from "./components/SelbsteinschaetzungSlider";
import SystemVergleichBalken from "./components/SystemVergleichBalken";
import RankingTabelle from "./components/RankingTabelle";
import TemperamentProfil from "./components/TemperamentProfil";
import SystemDeutungTabs, { useSystemTexts, Paragraphs } from "./components/SystemDeutungTabs";
import { useVektoren } from "./hooks/useVektoren";
import { useRating } from "./hooks/useRating";
import { FRAGEN } from "./logic/questions";
import { PARTNER_FRAGEN } from "./logic/partnerQuestions";
import { getQuestionWeights } from "./logic/rating";
import { expectedPartner, calculatePartnerRating } from "./logic/partnerRating";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

function dayOfYear(isoDate) {
  const dt = new Date(`${isoDate}T00:00:00`);
  const start = new Date(dt.getFullYear(), 0, 0);
  const diff = dt - start;
  return Math.floor(diff / 86400000);
}

function shuffleQuestions(questions) {
  const copy = [...questions];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function App() {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [setupReady, setSetupReady] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [availableSystems, setAvailableSystems] = useState([
    "Westlich",
    "Bazi",
    "Numerologie",
    "Kabbalah",
    "Arabisch",
    "Hellenistisch",
    "Vedisch",
  ]);
  const [selectedSystems, setSelectedSystems] = useState(["Westlich", "Bazi", "Numerologie"]);
  const [optionalName, setOptionalName] = useState("");
  const [optionalGender, setOptionalGender] = useState("");
  const [assessmentTestMode, setAssessmentTestMode] = useState(false);
  const [systemEstimatesOpen, setSystemEstimatesOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionOrder, setQuestionOrder] = useState([]);
  const [currentValue, setCurrentValue] = useState(-1);
  const [answers, setAnswers] = useState([]);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [saved, setSaved] = useState(false);

  const [partnerBirthDate, setPartnerBirthDate] = useState("");
  const [partnerBirthTime, setPartnerBirthTime] = useState("12:00");
  const [partnerData, setPartnerData] = useState(null);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState(null);
  const [partnerQuestionOrder, setPartnerQuestionOrder] = useState([]);
  const [partnerCurrentIndex, setPartnerCurrentIndex] = useState(0);
  const [partnerAnswers, setPartnerAnswers] = useState([]);
  const [partnerCurrentValue, setPartnerCurrentValue] = useState(-1);
  const [partnerFinished, setPartnerFinished] = useState(false);
  const [partnerTexts, setPartnerTexts] = useState(null);
  const [partnerTextsLoading, setPartnerTextsLoading] = useState(false);
  const [partnerActiveSystem, setPartnerActiveSystem] = useState(null);

  useEffect(() => {
    if (!partnerFinished) return;
    let cancelled = false;
    setPartnerTextsLoading(true);
    fetch(`${API_BASE}/horoscope/spiel_c/texts?locale=de`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setPartnerTexts(data);
      })
      .catch(() => {
        if (!cancelled) setPartnerTexts(null);
      })
      .finally(() => {
        if (!cancelled) setPartnerTextsLoading(false);
      });
    return () => { cancelled = true; };
  }, [partnerFinished]);

  useEffect(() => {
    async function loadSystems() {
      try {
        const response = await fetch(`${API_BASE}/systeme`);
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        if (Array.isArray(payload.verfuegbar)) {
          setAvailableSystems(payload.verfuegbar);
        }
        if (Array.isArray(payload.default) && payload.default.length) {
          setSelectedSystems(payload.default);
        }
      } catch {
        // Keep frontend fallback values.
      }
    }
    loadSystems();
  }, []);

  const { vektoren, inputs, loading, error } = useVektoren(
    assessmentStarted ? birthDate : null,
    assessmentStarted ? birthTime : null,
    selectedSystems,
    optionalName || undefined,
    optionalGender || undefined
  );
  const rating = useRating(vektoren, answers, inputs);

  const partnerRating = useMemo(
    () => calculatePartnerRating(partnerAnswers, partnerData?.vektorenA, partnerData?.vektorenB, rating.matrix),
    [partnerAnswers, partnerData?.vektorenA, partnerData?.vektorenB, rating.matrix]
  );
  const partnerSystems = useMemo(() => {
    const rank = partnerRating?.ranking ?? [];
    return rank.filter((s) => s !== "KO" && partnerTexts?.by_system?.[s]?.horoskop_ausfuehrlich);
  }, [partnerRating?.ranking, partnerTexts]);
  useEffect(() => {
    if (partnerFinished && partnerSystems?.length && (!partnerActiveSystem || !partnerSystems.includes(partnerActiveSystem))) {
      setPartnerActiveSystem(partnerSystems[0]);
    }
  }, [partnerFinished, partnerSystems, partnerActiveSystem]);

  const isAssessmentGame = selectedGame === "personality" || selectedGame === "fremd";
  const activeFrage = questionOrder[currentIndex];
  const isFinished =
    isAssessmentGame &&
    assessmentStarted &&
    questionOrder.length > 0 &&
    currentIndex >= questionOrder.length;

  const { systemTexts, loading: textsLoading, error: textsError } = useSystemTexts(
    isFinished ? rating.ranking : null,
    isFinished
  );

  const doy = useMemo(() => (birthDate ? dayOfYear(birthDate) : null), [birthDate]);
  const stunde = useMemo(() => Number((birthTime || "12:00").split(":")[0]), [birthTime]);
  const currentQuestionWeights = useMemo(() => {
    if (!activeFrage || !selectedSystems.length) {
      return {};
    }
    const frageGewichte = Object.fromEntries(
      selectedSystems.map((system) => [system, activeFrage.gewichte?.[system] ?? 1])
    );
    return getQuestionWeights(selectedSystems, activeFrage.dimension, frageGewichte, rating.matrix);
  }, [activeFrage, selectedSystems, rating.matrix]);

  useEffect(() => {
    if (!answers.length || !rating.ranking.length) {
      return;
    }
    setRatingHistory((prev) => [...prev, { ranking: rating.ranking, systemDetails: rating.systemDetails }]);
  }, [answers.length, rating.ranking.join("|")]);

  useEffect(() => {
    if (!isAssessmentGame || !isFinished || saved || !inputs?.session_id) {
      return;
    }

    async function saveSession() {
      const metadaten = { dsgvo_zustimmung: true };
      if (selectedGame === "personality") metadaten.spieltyp = "Selbstbild";
      if (selectedGame === "fremd") metadaten.spieltyp = "Fremdbild";
      if (optionalGender === "weiblich" || optionalGender === "maennlich") {
        metadaten.geschlecht = optionalGender;
      }
      const payload = {
        session_id: inputs.session_id,
        geburtsdatum: birthDate,
        geburtszeit: birthTime,
        antworten: answers,
        metadaten,
        inputs,
        rating,
        temperament: rating.temperament,
        abgeschlossen: true,
        veroeffentlichen: true,
      };

      const response = await fetch(`${API_BASE}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSaved(true);
      }
    }

    saveSession();
  }, [isAssessmentGame, selectedGame, isFinished, saved, inputs, birthDate, birthTime, answers, rating, optionalGender]);

  function handleConfirm(date, time) {
    setBirthDate(date);
    setBirthTime(time || "12:00");
    setSetupReady(true);
    setSelectedGame(null);
    setAssessmentStarted(false);
    setCurrentIndex(0);
    setQuestionOrder([]);
    setAnswers([]);
    setRatingHistory([]);
    setSaved(false);
  }

  function handleGameSelect(gameId) {
    setSelectedGame(gameId);
    setAssessmentStarted(false);
    setCurrentIndex(0);
    setQuestionOrder([]);
    setAnswers([]);
    setRatingHistory([]);
    setSaved(false);
    setPartnerData(null);
    setPartnerBirthDate("");
    setPartnerBirthTime("");
    setPartnerQuestionOrder([]);
    setPartnerCurrentIndex(0);
    setPartnerAnswers([]);
    setPartnerFinished(false);
    setPartnerError(null);
  }

  function backToGameSelection() {
    setSelectedGame(null);
    setAssessmentStarted(false);
    setCurrentIndex(0);
    setQuestionOrder([]);
    setAnswers([]);
    setRatingHistory([]);
    setSaved(false);
    setPartnerData(null);
    setPartnerBirthDate("");
    setPartnerBirthTime("");
    setPartnerQuestionOrder([]);
    setPartnerCurrentIndex(0);
    setPartnerAnswers([]);
    setPartnerFinished(false);
    setPartnerError(null);
  }

  async function handlePartnerDateConfirm(partnerDate, partnerTime) {
    setPartnerError(null);
    setPartnerLoading(true);
    try {
      const response = await fetch(`${API_BASE}/partner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          geburtsdatum_a: birthDate,
          uhrzeit_a: birthTime || "12:00",
          geburtsdatum_b: partnerDate,
          uhrzeit_b: partnerTime || "12:00",
          systeme: availableSystems.length ? availableSystems : ["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Vedisch"],
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || response.statusText);
      }
      const data = await response.json();
      setPartnerData({
        vektorenA: data.vektorenA,
        vektorenB: data.vektorenB,
        inputsA: data.inputsA,
        inputsB: data.inputsB,
      });
      setPartnerBirthDate(partnerDate);
      setPartnerBirthTime(partnerTime || "12:00");
      setPartnerQuestionOrder(shuffleQuestions([...PARTNER_FRAGEN]));
      setPartnerCurrentIndex(0);
      setPartnerAnswers([]);
      setPartnerCurrentValue(-1);
      setPartnerFinished(false);
    } catch (e) {
      setPartnerError(e.message || "Partner-Daten konnten nicht geladen werden.");
    } finally {
      setPartnerLoading(false);
    }
  }

  function startPartnerFromResult() {
    setSelectedGame("relationship");
    setPartnerData(null);
    setPartnerBirthDate("");
    setPartnerBirthTime("");
    setPartnerQuestionOrder([]);
    setPartnerCurrentIndex(0);
    setPartnerAnswers([]);
    setPartnerFinished(false);
    setPartnerError(null);
  }

  function resetPartnerAndShowForm() {
    setPartnerData(null);
    setPartnerQuestionOrder([]);
    setPartnerCurrentIndex(0);
    setPartnerAnswers([]);
    setPartnerFinished(false);
    setPartnerActiveSystem(null);
  }

  function submitPartnerAnswer() {
    const activePartnerFrage = partnerQuestionOrder[partnerCurrentIndex];
    if (!activePartnerFrage || !partnerData) return;
    const expected =
      rating.matrix &&
      expectedPartner(
        partnerData.vektorenA,
        partnerData.vektorenB,
        activePartnerFrage.dimension,
        rating.matrix
      );
    setPartnerAnswers((prev) => [
      ...prev,
      {
        frage_id: activePartnerFrage.id,
        dimension: activePartnerFrage.dimension,
        partner_wert: partnerCurrentValue,
        expected,
      },
    ]);
    setPartnerCurrentValue(-1);
    setPartnerCurrentIndex((i) => i + 1);
    if (partnerCurrentIndex + 1 >= partnerQuestionOrder.length) {
      setPartnerFinished(true);
    }
  }

  /** Spiel komplett zuruecksetzen: zurueck zur Spielauswahl, gleiches Geburtsdatum. */
  function restartGame() {
    setSelectedGame(null);
    setAssessmentStarted(false);
    setCurrentIndex(0);
    setQuestionOrder([]);
    setAnswers([]);
    setRatingHistory([]);
    setSaved(false);
  }

  function toggleSystem(system) {
    setSelectedSystems((prev) =>
      prev.includes(system) ? prev.filter((item) => item !== system) : [...prev, system]
    );
  }

  function startAssessment(testMode = false) {
    if (!isAssessmentGame || !selectedSystems.length) {
      return;
    }
    setAssessmentTestMode(testMode);
    setSystemEstimatesOpen(false);
    setQuestionOrder(shuffleQuestions(FRAGEN));
    setAssessmentStarted(true);
    setCurrentIndex(0);
    setAnswers([]);
    setRatingHistory([]);
    setSaved(false);
  }

  function submitAnswer() {
    const frage = activeFrage;
    if (!frage) {
      return;
    }
    const systemWerte = Object.fromEntries(
      selectedSystems.map((system) => [system, Number(vektoren?.[system]?.[frage.dimension])])
    );

    setAnswers((prev) => [
      ...prev,
      {
        frage_id: frage.id,
        text: frage.text,
        dimension: frage.dimension,
        selbst_wert: currentValue,
        system_werte: systemWerte,
        gewichte: Object.fromEntries(
          selectedSystems.map((system) => [system, frage.gewichte?.[system] ?? 1])
        ),
      },
    ]);
    setCurrentValue(-1);
    setCurrentIndex((idx) => idx + 1);
  }

  return (
    <main className="layout">
      <h1>Tesserakt</h1>
      <GeburtsdatumInput value={birthDate} timeValue={birthTime} onConfirm={handleConfirm} />

      {setupReady ? (
        <>
          <GameSelector selectedGame={selectedGame} onSelect={handleGameSelect} />
          {isAssessmentGame ? (
            <SystemSelector
              systems={availableSystems}
              selectedSystems={selectedSystems}
              onToggle={toggleSystem}
              onStart={startAssessment}
              optionalName={optionalName}
              onOptionalNameChange={setOptionalName}
              optionalGender={optionalGender}
              onOptionalGenderChange={setOptionalGender}
            />
          ) : null}
          {selectedGame === "forecast" ? (
            <GamePlaceholder title="Zeitenhoroskope und Prognose" onBack={backToGameSelection} />
          ) : null}
          {selectedGame === "relationship" && !partnerData ? (
            <>
              <PartnerGeburtsdatumInput
                onConfirm={handlePartnerDateConfirm}
                onBack={backToGameSelection}
              />
              {partnerLoading ? <p>Partner-Vektoren werden berechnet...</p> : null}
              {partnerError ? <p className="error">{partnerError}</p> : null}
            </>
          ) : null}
        </>
      ) : null}

      {selectedGame === "relationship" && partnerData && !partnerFinished && partnerQuestionOrder.length > 0 ? (
        <section className="card">
          <h2>
            Beziehungsfrage {partnerCurrentIndex + 1}/{partnerQuestionOrder.length}
          </h2>
          <div className="question-text">
            <p>{partnerQuestionOrder[partnerCurrentIndex]?.text}</p>
          </div>
          <PartnerSlider
            value={partnerCurrentValue}
            onChange={setPartnerCurrentValue}
          />
          <div className="question-submit-wrap">
            <button type="button" onClick={submitPartnerAnswer}>
              Antwort speichern und weiter
            </button>
          </div>
        </section>
      ) : null}

      {selectedGame === "relationship" && partnerFinished ? (
        <section className="card">
          <h2>Partnerhoroskop – Ergebnis</h2>
          <>
            {partnerRating.fitScore != null ? (
              <p>
                Übereinstimmung mit den Horoskop-Tendenzen: <strong>{partnerRating.fitScore} %</strong>
              </p>
            ) : null}
            {partnerRating.ranking?.length > 0 ? (
              <table className="table partner-ranking-table">
                <thead>
                  <tr>
                    <th>Rang</th>
                    <th>System</th>
                    <th>Fit</th>
                    <th>Skill vs Zufall</th>
                    <th aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {partnerRating.ranking.map((system, index) => (
                    <tr key={system}>
                      <td>{index + 1}</td>
                      <td>{system}</td>
                      <td>{partnerRating.systemDetails[system]?.fitScore != null ? partnerRating.systemDetails[system].fitScore.toFixed(1) : "-"}</td>
                      <td>{partnerRating.systemDetails[system]?.skillScore != null ? partnerRating.systemDetails[system].skillScore.toFixed(1) : "-"}</td>
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {partnerTextsLoading ? (
              <p>Partnerschaftstexte werden geladen…</p>
            ) : partnerSystems.length === 0 ? (
              <p className="partner-text-fallback">Fuer eure Systeme ist noch kein Partnerschaftstext hinterlegt.</p>
            ) : (
              <div className="system-deutung-tabs">
                <p className="tabs-hint">Reihenfolge entspricht dem Ranking.</p>
                <div className="tabs-header" role="tablist">
                  {partnerSystems.map((system) => (
                    <button
                      key={system}
                      type="button"
                      role="tab"
                      aria-selected={partnerActiveSystem === system}
                      className={partnerActiveSystem === system ? "tab active" : "tab"}
                      onClick={() => setPartnerActiveSystem(system)}
                    >
                      {system}
                    </button>
                  ))}
                </div>
                {partnerActiveSystem && partnerTexts?.by_system?.[partnerActiveSystem]?.horoskop_ausfuehrlich ? (
                  <div role="tabpanel" className="tabs-content">
                    <h3>Ihr Partnerschaftshoroskop – {partnerActiveSystem}</h3>
                    <div className="deutung-horoskop-ausfuehrlich">
                      <Paragraphs text={partnerTexts.by_system[partnerActiveSystem].horoskop_ausfuehrlich} />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
            <p className="partner-result-hint">
              Die Auswertung basiert auf euren Geburtsdaten und euren Einschätzungen zu den Beziehungsfragen.
            </p>
            <p>
              <button type="button" className="button-restart" onClick={resetPartnerAndShowForm}>
                Nochmal andere Partner:in
              </button>
              <button type="button" className="button-restart" onClick={restartGame}>
                Neue Analyse
              </button>
            </p>
          </>
        </section>
      ) : null}

      {loading ? <p>Vektoren werden berechnet...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {isAssessmentGame && assessmentStarted && !loading && vektoren && !isFinished ? (
        <section className="card">
          <h2>
            Frage {currentIndex + 1}/{questionOrder.length}
          </h2>
          <div className="question-text">
            <p>{activeFrage.text}</p>
          </div>
          <SelbsteinschaetzungSlider value={currentValue} onChange={setCurrentValue} />
          {assessmentTestMode ? (
            <SystemVergleichBalken
              systemWerte={Object.fromEntries(
                selectedSystems.map((system) => [system, vektoren?.[system]?.[activeFrage.dimension]])
              )}
              systemGewichte={currentQuestionWeights}
            />
          ) : (
            <div className="system-estimates-collapse">
              <button
                type="button"
                className="system-estimates-collapse-trigger"
                onClick={() => setSystemEstimatesOpen((open) => !open)}
                aria-expanded={systemEstimatesOpen}
              >
                <span className="system-estimates-collapse-icon" aria-hidden>
                  {systemEstimatesOpen ? "▼" : "▶"}
                </span>
                Systemeinschätzungen
              </button>
              {systemEstimatesOpen ? (
                <div className="system-estimates-collapse-panel">
                  <SystemVergleichBalken
                    systemWerte={Object.fromEntries(
                      selectedSystems.map((system) => [
                        system,
                        vektoren?.[system]?.[activeFrage.dimension],
                      ])
                    )}
                    systemGewichte={currentQuestionWeights}
                  />
                </div>
              ) : null}
            </div>
          )}
          <div className="question-submit-wrap">
            <button type="button" onClick={submitAnswer}>
              Antwort speichern und weiter
            </button>
          </div>
        </section>
      ) : null}

      {isAssessmentGame && assessmentStarted && isFinished ? (
        <>
          <section className="card">
            <h2>Ergebnis</h2>
            <RankingTabelle
              systeme={rating.systemDetails}
              ranking={rating.ranking}
              fitVsKO={rating.fitVsKO}
              skillVsKO={rating.skillVsKO}
            />
            <TemperamentProfil temperament={rating.temperament} />
            <p>{saved ? "Session gespeichert." : "Session wird gespeichert..."}</p>
            <p className="science-link">
              <a href={import.meta.env.VITE_SCIENCE_URL ?? "#"} target="_blank" rel="noopener noreferrer">
                Zum wissenschaftlichen Hintergrund und zu Ergebnissen des Projekts
              </a>
            </p>
            <p>
              <button type="button" className="button-restart" onClick={startPartnerFromResult}>
                Beziehungshoroskop
              </button>
              <button type="button" className="button-restart" onClick={restartGame}>
                Spiel neu starten
              </button>
            </p>
          </section>
          {textsLoading ? (
            <section className="card">
              <p>Systemtexte werden geladen...</p>
            </section>
          ) : textsError ? (
            <section className="card">
              <p className="error">Systemtexte konnten nicht geladen werden: {textsError}</p>
            </section>
          ) : (
            <SystemDeutungTabs
              ranking={rating.ranking}
              systemTexts={systemTexts}
              visualPayloads={inputs?.visualPayloads}
            />
          )}
        </>
      ) : null}
    </main>
  );
}
