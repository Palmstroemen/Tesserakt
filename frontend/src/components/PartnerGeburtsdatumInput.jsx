import { useState } from "react";
import { OrtSuche } from "./GeburtsdatumInput";

/**
 * Geburtsdaten der Partnerperson (Spiel C). Ort, Geschlecht und Name sind optional;
 * die Einwilligung der anderen Person ist Pflicht.
 */
export default function PartnerGeburtsdatumInput({ onConfirm, onBack }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [ort, setOrt] = useState(null);
  const [geschlecht, setGeschlecht] = useState("");
  const [name, setName] = useState("");
  const [einverstanden, setEinverstanden] = useState(false);

  return (
    <section className="card">
      <h2>Partner:in – Geburtsdaten</h2>
      <p>Geburtsdatum, Uhrzeit und möglichst den Geburtsort der anderen Person eingeben.</p>
      <div className="row">
        <label>
          Geburtsdatum Partner:in
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Uhrzeit
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <OrtSuche ort={ort} onChange={setOrt} />
      </div>
      <div className="row">
        <label>
          Name (optional, für die Numerologie; wird nicht gespeichert)
          <input type="text" value={name} placeholder="optional" onChange={(e) => setName(e.target.value)} />
        </label>
        <fieldset className="geschlecht-auswahl">
          <legend>Geschlecht (optional, für Bazi)</legend>
          {[
            ["weiblich", "weiblich"],
            ["maennlich", "männlich"],
            ["", "keine Angabe"],
          ].map(([wert, label]) => (
            <label key={label}>
              <input type="radio" name="partner-geschlecht" checked={geschlecht === wert} onChange={() => setGeschlecht(wert)} />{" "}
              {label}
            </label>
          ))}
        </fieldset>
      </div>
      <label className="einwilligung">
        <input type="checkbox" checked={einverstanden} onChange={(e) => setEinverstanden(e.target.checked)} /> Die andere Person
        weiß, dass ich ihre Geburtsdaten hier eingebe, und ist einverstanden. Gespeichert werden Geburtsdatum und -zeit,
        vom Ort nur Zeitzone und eine grobe Region (~100 km), kein Name.
      </label>
      <div className="button-row">
        {onBack ? (
          <button type="button" onClick={onBack}>
            Zurück
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onConfirm({ date, time, ort, geschlecht, name })}
          disabled={!date || !einverstanden}
        >
          Beziehungsfragen starten
        </button>
      </div>
    </section>
  );
}
