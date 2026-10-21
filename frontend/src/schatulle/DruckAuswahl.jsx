// Auswahl fuer das Horoskopbuch: welche Horoskope ins Buch kommen (Reihenfolge wie im Ergebnis), mit
// Preisstaffel. Von hier aus die Buchansicht (zum Ansehen und Drucken als PDF); Bestellen folgt.
import { useState } from "react";
import HoroskopIcon from "./HoroskopIcon";
import { anzeigeName } from "./systeme";
import { buchPreis } from "./buchpreise";

export default function DruckAuswahl({ reihenfolge, onAnsehen, onSchliessen }) {
  // vorausgewaehlt: die drei Horoskope mit dem besten Ergebnis
  const [auswahl, setAuswahl] = useState(
    () => new Set(reihenfolge.slice(0, 3)),
  );
  const n = auswahl.size;
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
            onClick={() => onAnsehen(gewaehlt)}
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
