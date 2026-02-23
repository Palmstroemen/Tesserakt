import { useState } from "react";

export default function GeburtsdatumInput({ value, timeValue, onConfirm }) {
  const [date, setDate] = useState(value ?? "");
  const [time, setTime] = useState(timeValue ?? "12:00");

  return (
    <section className="card">
      <h2>Geburtsdaten</h2>
      <div className="row">
        <label>
          Geburtsdatum
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Uhrzeit
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <button type="button" onClick={() => onConfirm(date, time)} disabled={!date}>
        Vektoren berechnen
      </button>
    </section>
  );
}
