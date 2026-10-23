// Auswahl fuer das Horoskopbuch: welche Horoskope ins Buch kommen und in welcher Reihenfolge, der Titel und
// die Preisstaffel. Oben das Buch als 3D-Ansicht. Von hier aus die Buchansicht (zum Ansehen und Drucken als
// PDF); Bestellen folgt.
import { useState } from "react";
import HoroskopIcon from "./HoroskopIcon";
import Buch3D from "./Buch3D";
import { SYSTEME, anzeigeName } from "./systeme";
import { buchPreis } from "./buchpreise";

// Vorgabe fuer den Titel: Mein Horoskop / Meine Horoskope, bei Paaren Unser Horoskop / Unsere Horoskope
export function titelVorgabe(n, paarSpiel) {
  if (paarSpiel) return n === 1 ? "Unser Horoskop" : "Unsere Horoskope";
  return n === 1 ? "Mein Horoskop" : "Meine Horoskope";
}

// Vor dem Ergebnis zeigt der Buch-Knopf nur, was es am Ende gibt: das Buch mit allen Horoskopen
export function BuchWerbung({ paarSpiel, geburt, onSchliessen }) {
  return (
    <div className="da-ebene" role="dialog" aria-label="Horoskopbuch">
      <div className="da-blatt">
        <Buch3D
          titel={titelVorgabe(SYSTEME.length, paarSpiel)}
          geburt={geburt}
          auswahl={SYSTEME.map((s) => s.id)}
        />
        <h2>{paarSpiel ? "Euer Horoskopbuch" : "Dein Horoskopbuch"}</h2>
        <p className="da-werbung">
          {paarSpiel
            ? "Wenn ihr fertig seid, könnt ihr alle eure Horoskope als Buch bestellen."
            : "Wenn du fertig bist, kannst du alle deine Horoskope als Buch bestellen."}
        </p>
        <p className="da-format">21 × 21 cm · je Horoskop vier Seiten</p>
        <p className="da-werbung">
          {paarSpiel
            ? "Ein schönes Geschenk, wenn ihr's für jemanden anderen macht."
            : "Ein schönes Geschenk, wenn du's für jemanden anderen machst."}
        </p>
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

export default function DruckAuswahl({
  beste,
  paarSpiel,
  geburt,
  vorher,
  onAnsehen,
  onSchliessen,
}) {
  // Reihenfolge im Buch: frei einstellbar, anfangs die feste Reihenfolge der Horoskope
  const [reihe, setReihe] = useState(
    () => vorher?.reihe ?? SYSTEME.map((s) => s.id),
  );
  // vorausgewaehlt: die drei Horoskope mit dem besten Ergebnis (oder die Auswahl von vorhin)
  const [auswahl, setAuswahl] = useState(
    () => new Set(vorher?.auswahl ?? beste.slice(0, 3)),
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

  function verschieben(i, schritt) {
    setReihe((alt) => {
      const neu = [...alt];
      [neu[i], neu[i + schritt]] = [neu[i + schritt], neu[i]];
      return neu;
    });
  }

  const gewaehlt = reihe.filter((id) => auswahl.has(id));
  return (
    <div className="da-ebene" role="dialog" aria-label="Horoskopbuch">
      <div className="da-blatt">
        <Buch3D
          titel={titel.trim() || vorgabe}
          geburt={geburt}
          auswahl={gewaehlt}
        />
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
          {reihe.map((id, i) => (
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
              <span className="da-pfeile">
                <button
                  type="button"
                  aria-label="nach oben"
                  disabled={i === 0}
                  onClick={() => verschieben(i, -1)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="nach unten"
                  disabled={i === reihe.length - 1}
                  onClick={() => verschieben(i, 1)}
                >
                  ▼
                </button>
              </span>
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
            onClick={() =>
              onAnsehen({
                auswahl: gewaehlt,
                titel: titel.trim() || vorgabe,
                reihe,
              })
            }
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
