import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export function OrtSuche({ ort, onChange }) {
  const [text, setText] = useState(ort ? ort.name : "");
  const [vorschlaege, setVorschlaege] = useState([]);

  useEffect(() => {
    if (ort && text === ort.name) {
      setVorschlaege([]);
      return undefined;
    }
    if (text.trim().length < 2) {
      setVorschlaege([]);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/orte?q=${encodeURIComponent(text.trim())}&limit=6`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { orte: [] }))
        .then((data) => setVorschlaege(data.orte ?? []))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, ort]);

  return (
    <label className="ort-suche">
      Geburtsort
      <input
        type="text"
        value={text}
        placeholder="z. B. Wien"
        onChange={(e) => {
          setText(e.target.value);
          if (ort) onChange(null);
        }}
      />
      {vorschlaege.length ? (
        <ul className="ort-vorschlaege">
          {vorschlaege.map((v) => (
            <li key={`${v.name}-${v.lat}-${v.lon}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(v);
                  setText(v.name);
                }}
              >
                {v.name}, {v.land}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </label>
  );
}

export default function GeburtsdatumInput({ value, timeValue, placeValue, onConfirm }) {
  const [date, setDate] = useState(value ?? "");
  const [time, setTime] = useState(timeValue ?? "12:00");
  const [ort, setOrt] = useState(placeValue ?? null);

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
        <OrtSuche ort={ort} onChange={setOrt} />
      </div>
      <p className="hint">
        {ort
          ? `${ort.name}, ${ort.land} – Zeitzone ${ort.zeitzone}.`
          : "Der Geburtsort ist optional, macht Aszendent und Häuser aber erst genau (Zeitzone und Sommerzeit werden umgerechnet). Kleinere Orte: nächstgelegene Stadt wählen."}{" "}
        <span className="quelle">Ortsdaten: GeoNames (CC BY 4.0).</span>
      </p>
      <button type="button" onClick={() => onConfirm(date, time, ort)} disabled={!date}>
        Wähle eine Analyse.
      </button>
    </section>
  );
}
