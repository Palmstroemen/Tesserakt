// Gefalteter Zettel in der Schatulle (nur auf dem Startbild): eine Legende, keine Anleitung. Aufgefaltet zeigt
// er die Horoskope mit ihren Zeichen und Namen, dazu eine Bleistiftnotiz. Ganz unten fuehrt "Kamera & Daten"
// zurueck zum Vorblatt (Einwilligungen aendern).
import { useState } from "react";
import HoroskopIcon from "./HoroskopIcon";
import { SYSTEME, anzeigeName } from "./systeme";
import { blatt } from "./klang";

// Bleistiftnotizen neben einzelnen Horoskopen
const NOTIZ = { Vedisch: "indisch" };

export default function Zettel({ onVorblatt }) {
  const [offen, setOffen] = useState(false);

  function umschalten(neu) {
    blatt();
    setOffen(neu);
  }

  return (
    <>
      <button
        type="button"
        className="zt-gefaltet"
        hidden={offen}
        aria-label="Zettel"
        onClick={() => umschalten(true)}
      />
      {offen ? (
        <div className="zt-ebene" onClick={() => umschalten(false)}>
          <div className="zt-blatt" role="dialog" aria-label="Horoskopsysteme">
            <h2>Horoskopsysteme</h2>
            <ul>
              {SYSTEME.map((s) => (
                <li key={s.id}>
                  <svg viewBox="-12 -12 24 24" aria-hidden="true">
                    <HoroskopIcon id={s.id} r={10} />
                  </svg>
                  <span>{anzeigeName(s.id)}</span>
                  {NOTIZ[s.id] ? (
                    <span className="zt-notiz">← {NOTIZ[s.id]}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="zt-fuss"
              onClick={(e) => {
                e.stopPropagation();
                onVorblatt();
              }}
            >
              Kamera &amp; Daten
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
