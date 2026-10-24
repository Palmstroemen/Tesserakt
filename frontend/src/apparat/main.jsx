import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Apparat from "./Apparat";
import Kaestchen, { FILM_GESEHEN } from "./Kaestchen";
import Vorblatt from "./Vorblatt";
import { einwilligungLaden } from "./einwilligung";
import { werkstattEinrichten } from "./werkstatt";
import "../components/diagramme.css";
import "./apparat.css";

werkstattEinrichten(); // Testschalter ueber die Adresse (?neu, ?messen, ?ohne=...)

function filmGesehen() {
  try {
    return localStorage.getItem(FILM_GESEHEN) !== null;
  } catch {
    return false;
  }
}

// Beim ersten Start (oder nach geaenderten Einwilligungstexten) zuerst das Vorblatt, beim allerersten Mal dann
// der Film. Bei jedem Besuch liegt der Apparat im verschlossenen Kaestchen.
function App() {
  const [bereit, setBereit] = useState(() => einwilligungLaden() !== null);
  const [film, setFilm] = useState(false);
  const [zu, setZu] = useState(true);
  if (!bereit)
    return (
      <Vorblatt
        onFertig={() => {
          setFilm(!filmGesehen());
          setBereit(true);
        }}
      />
    );
  return (
    <>
      <Apparat />
      {zu ? <Kaestchen film={film} onOffen={() => setZu(false)} /> : null}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
