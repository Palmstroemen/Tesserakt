import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Apparat from "./Apparat";
import Vorblatt from "./Vorblatt";
import { einwilligungLaden } from "./einwilligung";
import { werkstattEinrichten } from "./werkstatt";
import "../components/diagramme.css";
import "./apparat.css";

werkstattEinrichten(); // Testschalter ueber die Adresse (?neu, ?messen, ?ohne=...)

// Beim ersten Start (oder nach geaenderten Einwilligungstexten) zuerst das Vorblatt, dann der Apparat
function App() {
  const [bereit, setBereit] = useState(() => einwilligungLaden() !== null);
  return bereit ? <Apparat /> : <Vorblatt onFertig={() => setBereit(true)} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
