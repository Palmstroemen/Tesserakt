import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Schatulle from "./Schatulle";
import Vorblatt from "./Vorblatt";
import { einwilligungLaden } from "./einwilligung";
import "../components/diagramme.css";
import "./schatulle.css";

// Beim ersten Start (oder nach geaenderten Einwilligungstexten) zuerst das Vorblatt, dann die Schatulle
function App() {
  const [bereit, setBereit] = useState(() => einwilligungLaden() !== null);
  return bereit ? <Schatulle /> : <Vorblatt onFertig={() => setBereit(true)} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
