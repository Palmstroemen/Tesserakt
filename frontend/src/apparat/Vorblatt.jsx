// Vorblatt beim ersten Start: zwei Blaetter auf dem Apparat. Erst die Kamera (Freigabe gleich hier, damit die
// Abfragen des Systems nicht mitten im Spiel kommen), dann die Datenverwendung mit der Bitte um ernsthafte
// Antworten und der ausfuehrlichen Erklaerung. Die Texte stehen in src/texte/einwilligung.md und
// datenverwendung.md.
import { useState } from "react";
import EINWILLIGUNG from "../texte/einwilligung.md?raw";
import DATENVERWENDUNG from "../texte/datenverwendung.md?raw";
import { Markdown, abschnitte, lesen } from "./markdown";
import { einwilligungSpeichern } from "./einwilligung";

const [KAMERA, DATEN] = abschnitte(lesen(EINWILLIGUNG).rumpf);
const ERKLAERUNG = lesen(DATENVERWENDUNG).rumpf;

export default function Vorblatt({ onFertig }) {
  const [blatt, setBlatt] = useState("kamera"); // kamera | daten | erklaerung
  const [kamera, setKamera] = useState(false);
  const [fragt, setFragt] = useState(false);

  function kameraFreigeben() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setBlatt("daten");
      return;
    }
    setFragt(true);
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((s) => {
        // nur die Freigabe einholen; der Apparat startet die Kameras selbst
        s.getTracks().forEach((t) => t.stop());
        setKamera(true);
      })
      .catch(() => setKamera(false))
      .finally(() => {
        setFragt(false);
        setBlatt("daten");
      });
  }

  function fertig(daten) {
    onFertig(einwilligungSpeichern({ kamera, daten }));
  }

  return (
    <div className="vb-ebene">
      {blatt === "kamera" ? (
        <div className="vb-blatt" key="kamera">
          <h2>{KAMERA.titel}</h2>
          <Markdown text={KAMERA.text} />
          <div className="vb-knoepfe">
            <button
              type="button"
              className="sc-start"
              disabled={fragt}
              onClick={kameraFreigeben}
            >
              Kamera freigeben
            </button>
            <button
              type="button"
              className="vb-leise"
              disabled={fragt}
              onClick={() => setBlatt("daten")}
            >
              Ohne Kamera spielen
            </button>
          </div>
        </div>
      ) : null}
      {blatt === "daten" ? (
        <div className="vb-blatt" key="daten">
          <h2>{DATEN.titel}</h2>
          <Markdown text={DATEN.text} />
          <button
            type="button"
            className="vb-link"
            onClick={() => setBlatt("erklaerung")}
          >
            Ausführlich erklärt: was mit deinen Daten geschieht
          </button>
          <div className="vb-knoepfe">
            <button
              type="button"
              className="sc-start"
              onClick={() => fertig(true)}
            >
              Ich willige ein
            </button>
            <button
              type="button"
              className="vb-leise"
              onClick={() => fertig(false)}
            >
              Ohne Speicherung spielen
            </button>
          </div>
        </div>
      ) : null}
      {blatt === "erklaerung" ? (
        <div className="vb-blatt vb-erklaerung" key="erklaerung">
          <Markdown text={ERKLAERUNG} />
          <div className="vb-knoepfe">
            <button
              type="button"
              className="sc-start"
              onClick={() => setBlatt("daten")}
            >
              Zurück
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
