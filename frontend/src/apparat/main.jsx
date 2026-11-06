import React, { Suspense, lazy, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import Vorblatt from "./Vorblatt";
import { einwilligungLaden } from "./einwilligung";
import { filmFreischalten, filmVideo } from "./film";
import { neigungErlauben } from "./neigung";
import { t } from "../sprache";
import { FILM_GESEHEN, TESTPHASE, werkstattEinrichten } from "./werkstatt";
import "../components/diagramme.css";
import "./apparat.css";

// Fuer die Webseite: zuerst kommt nur das Vorblatt; Apparat und Kaestchen laden erst danach, im Hintergrund, waehrend
// man noch liest. Die Gesichtserkennung laedt erst nach der Kamerafreigabe (blick.js: blickVorbereiten).
const apparatLaden = () => import("./Apparat");
const kaestchenLaden = () => import("./Kaestchen");
const Apparat = lazy(apparatLaden);
const Kaestchen = lazy(kaestchenLaden);

werkstattEinrichten(); // Testschalter ueber die Adresse (?neu, ?messen, ?ohne=...)
// Lagesensor fuer die Parallaxe: iOS fragt einmal, beim ersten Tippen (meist auf das Kaestchen)
document.addEventListener("click", neigungErlauben, { capture: true });

function filmGesehen() {
  if (TESTPHASE) return false;
  try {
    return localStorage.getItem(FILM_GESEHEN) !== null;
  } catch {
    return false;
  }
}

// Beim ersten Start (oder nach geaenderten Einwilligungstexten) zuerst das Vorblatt, beim allerersten Mal dann
// der Film (in der Testphase bei jedem Besuch). Bei jedem Besuch liegt der Apparat im verschlossenen Kaestchen.
function App() {
  const [bereit, setBereit] = useState(() => einwilligungLaden() !== null);
  const [film, setFilm] = useState(() => bereit && !filmGesehen());
  const [zu, setZu] = useState(true);
  useEffect(() => {
    if (bereit) return;
    apparatLaden().catch(() => {});
    kaestchenLaden().catch(() => {});
    if (!filmGesehen()) filmVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!bereit)
    return (
      <Vorblatt
        onFertig={() => {
          if (!filmGesehen()) filmFreischalten();
          setFilm(!filmGesehen());
          setBereit(true);
        }}
      />
    );
  return (
    <Suspense
      fallback={
        <div className="ka-warten">
          <div className="ka-moment">{t("kaestchen.moment")}</div>
        </div>
      }
    >
      <Apparat />
      {zu ? <Kaestchen film={film} onOffen={() => setZu(false)} /> : null}
    </Suspense>
  );
}

// Webseite: Dateien fuer den naechsten Besuch aufheben (public/sw.js); in der App liegen sie ohnehin im Paket
if (import.meta.env.PROD && !window.Capacitor && "serviceWorker" in navigator)
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
