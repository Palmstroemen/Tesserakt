import { useEffect, useMemo, useState } from "react";
import GeburtsdatumInput from "./components/GeburtsdatumInput";
import GameSelector from "./components/GameSelector";
import SpielB from "./components/SpielB";
import SpielC from "./components/SpielC";
import SystemSelector from "./components/SystemSelector";
import SelbsteinschaetzungSlider from "./components/SelbsteinschaetzungSlider";
import SystemVergleichBalken from "./components/SystemVergleichBalken";
import RankingTabelle from "./components/RankingTabelle";
import TemperamentProfil from "./components/TemperamentProfil";
import Erklaerungen from "./components/Erklaerungen";
import SystemDeutungTabs, { useSystemTexts, Paragraphs } from "./components/SystemDeutungTabs";
import { useVektoren } from "./hooks/useVektoren";
import { useKontrolle } from "./hooks/useKontrolle";
import { useFragen } from "./hooks/useFragen";
import { useRating } from "./hooks/useRating";
import { getQuestionWeights } from "./logic/rating";

import { API_BASE } from "./logic/api";
import { spracheFelder } from "./logic/sprache";

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
  const [birthPlace, setBirthPlace] = useState(null);
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
  const [selectedSystems, setSelectedSystems] = useState(["Westlich", "Bazi", "Numerologie", "Kabbalah", "Arabisch", "Hellenistisch", "Vedisch"]);
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

  const { fragen, error: fragenError } = useFragen();
  const { vektoren, inputs, loading, error } = useVektoren(
    assessmentStarted ? birthDate : null,
    assessmentStarted ? birthTime : null,
    selectedSystems,
    optionalName || undefined,
    optionalGender || undefined,
    birthPlace
  );
  const kontrollState = useKontrolle(
    assessmentStarted ? inputs : null,
    birthDate,
    birthTime,
    selectedSystems,
    optionalName || undefined,
    optionalGender || undefined,
    birthPlace
  );
  const { kontrollvektoren } = kontrollState;
  // Ergebnis erst zeigen/speichern, wenn die Kontrollgruppe da ist (oder endgueltig fehlgeschlagen).
  const kontrolleBereit = Boolean(kontrollvektoren) || Boolean(kontrollState.error);
  const rating = useRating(vektoren, answers, inputs, kontrollvektoren);


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
    if (!isAssessmentGame || !isFinished || saved || !inputs?.session_id || !kontrolleBereit) {
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
        inputs: { ...inputs, kontrolle: kontrollState.kontrolle },
        rating,
        temperament: rating.temperament,
        abgeschlossen: true,
        veroeffentlichen: true,
        ...spracheFelder(),
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
  }, [isAssessmentGame, selectedGame, isFinished, saved, inputs, birthDate, birthTime, answers, rating, optionalGender, kontrolleBereit, kontrollState.kontrolle]);

  function handleConfirm(date, time, ort) {
    setBirthDate(date);
    setBirthTime(time || "12:00");
    setBirthPlace(ort ?? null);
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
  }

  function backToGameSelection() {
    setSelectedGame(null);
    setAssessmentStarted(false);
    setCurrentIndex(0);
    setQuestionOrder([]);
    setAnswers([]);
    setRatingHistory([]);
    setSaved(false);
  }

  function startPartnerFromResult() {
    setSelectedGame("relationship");
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
    if (!isAssessmentGame || !selectedSystems.length || !fragen.length) {
      return;
    }
    setAssessmentTestMode(testMode);
    setSystemEstimatesOpen(false);
    setQuestionOrder(shuffleQuestions(fragen));
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
      <GeburtsdatumInput value={birthDate} timeValue={birthTime} placeValue={birthPlace} onConfirm={handleConfirm} />

      {setupReady ? (
        <>
          <GameSelector selectedGame={selectedGame} onSelect={handleGameSelect} />
          {isAssessmentGame && fragenError ? (
            <p className="hint">Fragen konnten nicht geladen werden ({fragenError}).</p>
          ) : null}
          {isAssessmentGame ? (
            <SystemSelector
              systems={availableSystems}
              selectedSystems={selectedSystems}
              onToggle={toggleSystem}
              onStart={startAssessment}
              startBlocked={!fragen.length}
              optionalName={optionalName}
              onOptionalNameChange={setOptionalName}
              optionalGender={optionalGender}
              onOptionalGenderChange={setOptionalGender}
            />
          ) : null}
          {selectedGame === "forecast" ? (
            <SpielB
              birthDate={birthDate}
              birthTime={birthTime}
              birthPlace={birthPlace}
              optionalName={optionalName}
              optionalGender={optionalGender}
              matrix={rating.matrix}
              onBack={backToGameSelection}
            />
          ) : null}
          {selectedGame === "relationship" ? (
            <SpielC
              birthDate={birthDate}
              birthTime={birthTime}
              birthPlace={birthPlace}
              optionalName={optionalName}
              optionalGender={optionalGender}
              matrix={rating.matrix}
              onBack={backToGameSelection}
              onRestart={restartGame}
            />
          ) : null}
        </>
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
            {kontrolleBereit ? (
              <RankingTabelle
                systeme={rating.systemDetails}
                ranking={rating.ranking}
                skillErwartungBester={rating.skillErwartungBester}
              />
            ) : (
              <p className="mechanik-wartet" aria-live="polite">
                Das Räderwerk vergleicht dein Geburtsdatum mit hundert anderen ...
              </p>
            )}
            {kontrollState.error ? (
              <p className="hint">Kontrollgruppe konnte nicht berechnet werden; Skill ist deshalb nicht verfügbar.</p>
            ) : null}
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
          <Erklaerungen />
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
