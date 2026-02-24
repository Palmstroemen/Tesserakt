import { useEffect, useMemo, useState } from "react";
import GeburtsdatumInput from "./components/GeburtsdatumInput";
import GameSelector from "./components/GameSelector";
import GamePlaceholder from "./components/GamePlaceholder";
import SystemSelector from "./components/SystemSelector";
import SelbsteinschaetzungSlider from "./components/SelbsteinschaetzungSlider";
import SystemVergleichBalken from "./components/SystemVergleichBalken";
import VergleichsGruppeViz from "./components/VergleichsGruppeViz";
import Zwischenstand from "./components/Zwischenstand";
import RankingTabelle from "./components/RankingTabelle";
import TemperamentProfil from "./components/TemperamentProfil";
import { useVektoren } from "./hooks/useVektoren";
import { useRating } from "./hooks/useRating";
import { FRAGEN } from "./logic/questions";
import { getQuestionWeights } from "./logic/rating";

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
    "KO",
  ]);
  const [selectedSystems, setSelectedSystems] = useState(["Westlich", "Bazi", "Numerologie"]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionOrder, setQuestionOrder] = useState([]);
  const [currentValue, setCurrentValue] = useState(3);
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

  const { vektoren, inputs, loading, error } = useVektoren(
    assessmentStarted ? birthDate : null,
    assessmentStarted ? birthTime : null,
    selectedSystems
  );
  const rating = useRating(vektoren, answers, inputs);

  const activeFrage = questionOrder[currentIndex];
  const isFinished =
    selectedGame === "personality" &&
    assessmentStarted &&
    questionOrder.length > 0 &&
    currentIndex >= questionOrder.length;
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
    if (selectedGame !== "personality" || !isFinished || saved || !inputs?.session_id) {
      return;
    }

    async function saveSession() {
      const payload = {
        session_id: inputs.session_id,
        geburtsdatum: birthDate,
        geburtszeit: birthTime,
        antworten: answers,
        metadaten: { dsgvo_zustimmung: true },
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
  }, [selectedGame, isFinished, saved, inputs, birthDate, birthTime, answers, rating]);

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

  function toggleSystem(system) {
    setSelectedSystems((prev) =>
      prev.includes(system) ? prev.filter((item) => item !== system) : [...prev, system]
    );
  }

  function startAssessment() {
    if (selectedGame !== "personality" || !selectedSystems.length) {
      return;
    }
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
    setCurrentValue(3);
    setCurrentIndex((idx) => idx + 1);
  }

  return (
    <main className="layout">
      <h1>Horoskop Assessment</h1>
      <GeburtsdatumInput value={birthDate} timeValue={birthTime} onConfirm={handleConfirm} />

      {setupReady ? (
        <>
          <GameSelector selectedGame={selectedGame} onSelect={handleGameSelect} />
          {selectedGame === "personality" ? (
            <SystemSelector
              systems={availableSystems}
              selectedSystems={selectedSystems}
              onToggle={toggleSystem}
              onStart={startAssessment}
            />
          ) : null}
          {selectedGame === "forecast" ? (
            <GamePlaceholder title="Prognose und Zeiteinschaetzung" onBack={backToGameSelection} />
          ) : null}
          {selectedGame === "relationship" ? (
            <GamePlaceholder title="Beziehungseinschaetzung" onBack={backToGameSelection} />
          ) : null}
        </>
      ) : null}

      {loading ? <p>Vektoren werden berechnet...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {selectedGame === "personality" && assessmentStarted && !loading && vektoren && !isFinished ? (
        <section className="card">
          <h2>
            Frage {currentIndex + 1}/{questionOrder.length}
          </h2>
          <p>{activeFrage.text}</p>
          <SelbsteinschaetzungSlider value={currentValue} onChange={setCurrentValue} />
          <SystemVergleichBalken
            systemWerte={Object.fromEntries(
              selectedSystems.map((system) => [system, vektoren?.[system]?.[activeFrage.dimension]])
            )}
            systemGewichte={currentQuestionWeights}
            selbst={currentValue}
          />
          <VergleichsGruppeViz
            doy={doy}
            stunde={stunde}
            frage_id={activeFrage.id}
            selbst={currentValue}
          />
          <button type="button" onClick={submitAnswer}>
            Antwort speichern und weiter
          </button>
        </section>
      ) : null}

      {selectedGame === "personality" && assessmentStarted ? (
        <Zwischenstand ratingHistory={ratingHistory} />
      ) : null}

      {selectedGame === "personality" && assessmentStarted && isFinished ? (
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
        </section>
      ) : null}
    </main>
  );
}
