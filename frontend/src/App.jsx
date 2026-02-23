import { useEffect, useMemo, useState } from "react";
import GeburtsdatumInput from "./components/GeburtsdatumInput";
import SelbsteinschaetzungSlider from "./components/SelbsteinschaetzungSlider";
import SystemVergleichBalken from "./components/SystemVergleichBalken";
import VergleichsGruppeViz from "./components/VergleichsGruppeViz";
import Zwischenstand from "./components/Zwischenstand";
import RankingTabelle from "./components/RankingTabelle";
import TemperamentProfil from "./components/TemperamentProfil";
import { useVektoren } from "./hooks/useVektoren";
import { useRating } from "./hooks/useRating";
import { FRAGEN } from "./logic/questions";

const SYSTEME = ["Westlich", "Bazi", "Numerologie", "KO"];
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

function dayOfYear(isoDate) {
  const dt = new Date(`${isoDate}T00:00:00`);
  const start = new Date(dt.getFullYear(), 0, 0);
  const diff = dt - start;
  return Math.floor(diff / 86400000);
}

export default function App() {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("12:00");
  const [confirmed, setConfirmed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentValue, setCurrentValue] = useState(3);
  const [answers, setAnswers] = useState([]);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [saved, setSaved] = useState(false);

  const { vektoren, inputs, loading, error } = useVektoren(
    confirmed ? birthDate : null,
    confirmed ? birthTime : null,
    SYSTEME
  );
  const rating = useRating(vektoren, answers, inputs);

  const activeFrage = FRAGEN[currentIndex];
  const isFinished = currentIndex >= FRAGEN.length;
  const doy = useMemo(() => (birthDate ? dayOfYear(birthDate) : null), [birthDate]);
  const stunde = useMemo(() => Number((birthTime || "12:00").split(":")[0]), [birthTime]);

  useEffect(() => {
    if (!answers.length || !rating.ranking.length) {
      return;
    }
    setRatingHistory((prev) => [...prev, { ranking: rating.ranking, systemDetails: rating.systemDetails }]);
  }, [answers.length, rating.ranking.join("|")]);

  useEffect(() => {
    if (!isFinished || saved || !inputs?.session_id) {
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
  }, [isFinished, saved, inputs, birthDate, birthTime, answers, rating]);

  function handleConfirm(date, time) {
    setBirthDate(date);
    setBirthTime(time || "12:00");
    setConfirmed(true);
    setCurrentIndex(0);
    setAnswers([]);
    setRatingHistory([]);
    setSaved(false);
  }

  function submitAnswer() {
    const frage = FRAGEN[currentIndex];
    const systemWerte = Object.fromEntries(
      SYSTEME.map((system) => [system, Number(vektoren?.[system]?.[frage.dimension])])
    );

    setAnswers((prev) => [
      ...prev,
      {
        frage_id: frage.id,
        text: frage.text,
        dimension: frage.dimension,
        selbst_wert: currentValue,
        system_werte: systemWerte,
        gewichte: frage.gewichte,
      },
    ]);
    setCurrentValue(3);
    setCurrentIndex((idx) => idx + 1);
  }

  return (
    <main className="layout">
      <h1>Horoskop Assessment</h1>
      <GeburtsdatumInput value={birthDate} timeValue={birthTime} onConfirm={handleConfirm} />

      {loading ? <p>Vektoren werden berechnet...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {confirmed && !loading && vektoren && !isFinished ? (
        <section className="card">
          <h2>
            Frage {currentIndex + 1}/{FRAGEN.length}
          </h2>
          <p>{activeFrage.text}</p>
          <SelbsteinschaetzungSlider value={currentValue} onChange={setCurrentValue} />
          <SystemVergleichBalken
            systemWerte={Object.fromEntries(
              SYSTEME.map((system) => [system, vektoren?.[system]?.[activeFrage.dimension]])
            )}
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

      {confirmed ? <Zwischenstand ratingHistory={ratingHistory} /> : null}

      {isFinished ? (
        <section className="card">
          <h2>Ergebnis</h2>
          <RankingTabelle systeme={rating.systemDetails} ranking={rating.ranking} />
          <TemperamentProfil temperament={rating.temperament} />
          <p>{saved ? "Session gespeichert." : "Session wird gespeichert..."}</p>
        </section>
      ) : null}
    </main>
  );
}
