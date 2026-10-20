import { useState } from "react";

/**
 * Zweites Geburtsdatum für Partner-Analyse (Spiel C).
 * Eigenes Datum ist bereits gesetzt; hier nur Partner-Datum/-Uhrzeit.
 */
export default function PartnerGeburtsdatumInput({ onConfirm, onBack }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");

  return (
    <section className="card">
      <h2>Partner:in – Geburtsdaten</h2>
      <p>Geburtsdatum und Uhrzeit der anderen Person eingeben.</p>
      <div className="row">
        <label>
          Geburtsdatum Partner:in
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Uhrzeit
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <div className="button-row">
        {onBack ? (
          <button type="button" onClick={onBack}>
            Zurück
          </button>
        ) : null}
        <button type="button" onClick={() => onConfirm(date, time)} disabled={!date}>
          Beziehungsfragen starten
        </button>
      </div>
    </section>
  );
}
