// Probeseite (nur Entwicklung, /korn.html): die Grafiken des Buchs je in drei Fassungen nebeneinander, um zu
// entscheiden, ob sie mit Fotokorn oder als Papierdruck weniger kuenstlich wirken. A4-Blaetter (210 x 297 mm),
// zum Ausdrucken; tools/kornprobe.py rechnet daraus ein PDF mit 300 dpi. Beispieldatum ?datum=1985-04-12.
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { API_BASE } from "../logic/api";
import { VOLLBILD } from "./Ergebnisplatte";
import { SYSTEME, anzeigeName } from "./systeme";
import "../components/diagramme.css";
import "./apparat.css";

const FASSUNGEN = [
  { id: "ohne", name: "ohne Filter" },
  { id: "korn", name: "Fotokorn" },
  { id: "papier", name: "Papierdruck" },
];
const JE_BLATT = 4;

// Filter in CSS-Pixeln (1 px = 0,26 mm im Druck). Fotokorn: feines, leicht klumpiges Rauschen, aufgehellt und
// abgedunkelt um den Mittelwert. Papierdruck: Kanten ziehen leicht ins Papier (rau, weich), Wolken und Fasern
// des Papiers dunkeln die Farbe ungleichmaessig ab.
function Filter() {
  const grau =
    "0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1";
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id="kp-korn" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="2.2"
            numOctaves="2"
            seed="3"
            result="rauschen"
          />
          <feColorMatrix
            in="rauschen"
            type="matrix"
            values={grau}
            result="korn"
          />
          <feComposite
            in="SourceGraphic"
            in2="korn"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="0.2"
            k4="-0.1"
            result="gekoernt"
          />
          <feComposite in="gekoernt" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="kp-papier" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="11"
            result="fasern"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fasern"
            scale="0.6"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rau"
          />
          <feGaussianBlur in="rau" stdDeviation="0.18" result="weich" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="3"
            seed="7"
            result="wolken"
          />
          <feColorMatrix
            in="wolken"
            type="matrix"
            values={grau}
            result="wolkengrau"
          />
          <feColorMatrix
            in="fasern"
            type="matrix"
            values={grau}
            result="fasergrau"
          />
          {/* Farbe * (1 + m * (Papier - 0,5)): Wolken m = 0,24, Fasern m = 0,1 */}
          <feComposite
            in="weich"
            in2="wolkengrau"
            operator="arithmetic"
            k1="0.24"
            k2="0.88"
            k3="0"
            k4="0"
            result="wolkig"
          />
          <feComposite
            in="wolkig"
            in2="fasergrau"
            operator="arithmetic"
            k1="0.1"
            k2="0.95"
            k3="0"
            k4="0"
            result="gedruckt"
          />
          <feComposite in="gedruckt" in2="weich" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

function Probe() {
  const datum =
    new URLSearchParams(location.search).get("datum") ?? "1985-04-12";
  const [payloads, setPayloads] = useState(null);
  const [fehler, setFehler] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/vektor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        geburtsdatum: datum,
        uhrzeit: "14:00",
        systeme: SYSTEME.map((s) => s.id),
      }),
    })
      .then((r) => r.json())
      .then((v) => setPayloads(v.inputs?.visualPayloads ?? {}))
      .catch((e) => setFehler(String(e)));
  }, [datum]);
  if (fehler) return <p>{fehler}</p>;
  if (!payloads) return <p>Lade …</p>;
  const systeme = SYSTEME.filter((s) => VOLLBILD[s.id] && payloads[s.id]);
  const blaetter = [];
  for (let i = 0; i < systeme.length; i += JE_BLATT)
    blaetter.push(systeme.slice(i, i + JE_BLATT));
  return (
    <>
      <Filter />
      {blaetter.map((liste, b) => (
        <section key={b} className="kp-blatt">
          <h1>
            Probeseite Korn · Blatt {b + 1} von {blaetter.length} · Geburtsdatum{" "}
            {datum}
          </h1>
          {liste.map((s) => {
            const Bild = VOLLBILD[s.id];
            return (
              <div key={s.id} className="kp-zeile">
                <h2>{anzeigeName(s.id)}</h2>
                <div className="kp-fassungen">
                  {FASSUNGEN.map((f) => (
                    <figure key={f.id}>
                      <div className="buch-grafik kp-grafik">
                        <div
                          className="kp-filter"
                          style={
                            f.id === "ohne"
                              ? undefined
                              : { filter: `url(#kp-${f.id})` }
                          }
                        >
                          <Bild payload={payloads[s.id]} />
                        </div>
                      </div>
                      <figcaption>{f.name}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}

const STIL = `
  body { margin: 0; background: #6b5a44; font-family: Georgia, serif; color: #3a2c1a; }
  .kp-blatt { width: 210mm; height: 297mm; box-sizing: border-box; margin: 8mm auto; padding: 12mm 10mm;
    background: #fbf7ee; display: flex; flex-direction: column; gap: 4mm; overflow: hidden; container-type: size; }
  .kp-blatt h1 { font-size: 9pt; font-weight: normal; margin: 0 0 2mm; color: #8a7350; }
  .kp-zeile h2 { font-size: 10pt; margin: 0 0 1.5mm; }
  .kp-fassungen { display: flex; justify-content: space-between; }
  .kp-fassungen figure { margin: 0; display: flex; flex-direction: column; align-items: center; }
  .kp-grafik { width: 52mm; height: 52mm; box-shadow: 0 0 0 1.2mm #c9a66b, 0 0 0 1.8mm #8a6a3c; }
  .kp-filter, .kp-filter svg { display: block; width: 100%; height: 100%; }
  figcaption { font-size: 8pt; margin-top: 3.5mm; color: #8a7350; }
  @page { size: A4; margin: 0; }
  @media print { body { background: none; } .kp-blatt { margin: 0; } }
`;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <style>{STIL}</style>
    <Probe />
  </React.StrictMode>,
);
