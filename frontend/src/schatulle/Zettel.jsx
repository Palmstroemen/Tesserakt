// Gefalteter Zettel in der Schatulle (nur auf dem Startbild): eine Legende, keine Anleitung. Aufgefaltet zeigt
// er die Horoskope mit ihren Zeichen und Namen, von Hand geschrieben, dazu eine Bleistiftnotiz.
import { useState } from "react";
import HoroskopIcon from "./HoroskopIcon";
import { SYSTEME, anzeigeName } from "./systeme";
import { papier } from "./klang";

// Bleistiftnotizen neben einzelnen Horoskopen
const NOTIZ = { Vedisch: "indisch" };
// Handschrift: jede Zeile etwas anders geneigt und eingerueckt
const ZEILE = [
  [-0.8, 0],
  [0.6, 3],
  [-0.3, 1],
  [1, 5],
  [-1.1, 2],
  [0.4, 6],
  [-0.6, 3],
];

export default function Zettel() {
  const [offen, setOffen] = useState(false);

  function umschalten(neu) {
    papier(neu);
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
          <div className="zt-schatten">
            <div
              className="zt-blatt"
              role="dialog"
              aria-label="Horoskopsysteme"
            >
              <h2>Horoskopsysteme</h2>
              {/* mit dem Bleistift unterstrichen */}
              <svg
                className="zt-strich"
                viewBox="0 0 200 10"
                aria-hidden="true"
              >
                <path d="M4 6 C 40 3, 80 8, 120 5 S 180 3, 196 6" />
                <path d="M30 8 C 70 6, 120 9, 170 6" />
              </svg>
              <ul>
                {SYSTEME.map((s, i) => (
                  <li
                    key={s.id}
                    style={{
                      transform: `rotate(${ZEILE[i % ZEILE.length][0]}deg)`,
                      paddingLeft: ZEILE[i % ZEILE.length][1],
                    }}
                  >
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
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
