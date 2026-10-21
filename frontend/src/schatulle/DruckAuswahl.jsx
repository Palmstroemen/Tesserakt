// Auswahl fuer das Horoskopbuch: welche Horoskope ins Buch kommen (Reihenfolge wie im Ergebnis), mit
// Preisstaffel. Von hier aus die Buchansicht (zum Ansehen und Drucken als PDF); Bestellen folgt.
import { useState } from "react";
import HoroskopIcon from "./HoroskopIcon";
import { anzeigeName } from "./systeme";
import { buchPreis } from "./buchpreise";

// Vorgabe fuer den Titel: Mein Horoskop / Meine Horoskope, bei Paaren Unser Horoskop / Unsere Horoskope
export function titelVorgabe(n, paarSpiel) {
  if (paarSpiel) return n === 1 ? "Unser Horoskop" : "Unsere Horoskope";
  return n === 1 ? "Mein Horoskop" : "Meine Horoskope";
}

export default function DruckAuswahl({
  reihenfolge,
  paarSpiel,
  vorher,
  onAnsehen,
  onSchliessen,
}) {
  // vorausgewaehlt: die drei Horoskope mit dem besten Ergebnis (oder die Auswahl von vorhin)
  const [auswahl, setAuswahl] = useState(
    () => new Set(vorher?.auswahl ?? reihenfolge.slice(0, 3)),
  );
  const n = auswahl.size;
  // eigener Titel; solange leer, gilt die Vorgabe (passt sich der Anzahl an)
  const [titel, setTitel] = useState(() =>
    vorher?.titel &&
    vorher.titel !== titelVorgabe(vorher.auswahl.length, paarSpiel)
      ? vorher.titel
      : "",
  );
  const vorgabe = titelVorgabe(n, paarSpiel);
  const { grund, preis, aktion } = buchPreis(n);

  function umschalten(id) {
    setAuswahl((alt) => {
      const neu = new Set(alt);
      if (neu.has(id)) neu.delete(id);
      else neu.add(id);
      return neu;
    });
  }

  const gewaehlt = reihenfolge.filter((id) => auswahl.has(id));
  return (
    <div className="da-ebene" role="dialog" aria-label="Horoskopbuch">
      <div className="da-blatt">
        <h2>Dein Horoskopbuch</h2>
        <p className="da-format">21 × 21 cm · je Horoskop vier Seiten</p>
        <label className="da-titel">
          <span>Titel</span>
          <input
            type="text"
            value={titel}
            placeholder={vorgabe}
            maxLength={40}
            onChange={(e) => setTitel(e.target.value)}
          />
        </label>
        <ul className="da-liste">
          {reihenfolge.map((id) => (
            <li key={id}>
              <label>
                <input
                  type="checkbox"
                  checked={auswahl.has(id)}
                  onChange={() => umschalten(id)}
                />
                <svg
                  viewBox="-12 -12 24 24"
                  className="da-icon"
                  aria-hidden="true"
                >
                  <HoroskopIcon id={id} r={10} />
                </svg>
                <span>{anzeigeName(id)}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="da-preis">
          {n === 0
            ? "Wähle mindestens ein Horoskop."
            : `${n} ${n === 1 ? "Horoskop" : "Horoskope"}: `}
          {n ? (
            <>
              {aktion ? <s>{grund} €</s> : null} <b>{preis} €</b>
              {aktion ? (
                <span className="da-aktion"> {aktion.name}</span>
              ) : null}
            </>
          ) : null}
        </p>
        <div className="da-knoepfe">
          <button
            type="button"
            className="sc-start"
            disabled={!n}
            onClick={() => onAnsehen(gewaehlt, titel.trim() || vorgabe)}
          >
            Buch ansehen
          </button>
          <button type="button" className="sc-start" disabled title="folgt">
            Bestellen
          </button>
        </div>
        <button
          type="button"
          className="da-schliessen"
          aria-label="Schließen"
          onClick={onSchliessen}
        >
          ×
        </button>
      </div>
    </div>
  );
}
