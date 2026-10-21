import { useState, useEffect } from "react";
import RadixWheel from "./RadixWheel";
import FourPillarsChart from "./FourPillarsChart";
import NumerologyChart from "./NumerologyChart";
import KabbalahTree from "./KabbalahTree";
import ProfectionChart from "./ProfectionChart";
import FirdariaChart from "./FirdariaChart";
import DashaChart from "./DashaChart";

import { API_BASE } from "../logic/api";

/** Entfernt [TAG] Zeilen aus dem Text fuer die Anzeige. */
function stripTagLines(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\n\[TAG\]\s*\S+[^\n]*/g, "")
    .replace(/\[TAG\]\s*\S+[^\n]*/g, "")
    .trim();
}

/** Rendert einen Block Fliesstext (Absaetze durch Doppelumbrueche). Exportiert fuer Wiederverwendung (z. B. Partnerschaftshoroskop). */
export function Paragraphs({ text }) {
  const cleaned = stripTagLines(text);
  if (!cleaned) return null;
  const blocks = cleaned.split(/\n\n+/).filter(Boolean);
  return (
    <>
      {blocks.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

const DIMENSION_ORDER = [
  "liebe",
  "beruf",
  "finanzen",
  "gesundheit",
  "soziales",
  "kreativitaet",
  "veraenderung",
  "spiritualitaet",
];

export default function SystemDeutungTabs({ ranking, systemTexts, visualPayloads }) {
  // Nur Systeme anzeigen, die sowohl im Ranking als auch in den Texten vorkommen
  const systems = (ranking || []).filter(
    (s) => systemTexts?.systems?.[s]
  );
  const [activeSystem, setActiveSystem] = useState(systems[0] ?? null);

  // Aktiven Tab zuruecksetzen, wenn sich die Systemliste aendert
  useEffect(() => {
    if (systems.length === 0) return;
    if (!activeSystem || !systems.includes(activeSystem)) {
      setActiveSystem(systems[0]);
    }
  }, [systems, activeSystem]);

  const activeData = activeSystem && systemTexts?.systems?.[activeSystem];

  if (systems.length === 0) {
    return (
      <section className="card">
        <h2>Deutung nach System</h2>
        <p>Keine Systemtexte geladen. Nur gewählte Systeme werden hier angezeigt.</p>
      </section>
    );
  }

  return (
    <section className="card system-deutung-tabs">
      <h2>Deutung nach System</h2>
      <p className="tabs-hint">Nur die von dir gewählten Systeme; Reihenfolge entspricht dem Ranking.</p>
      <div className="tabs-header" role="tablist">
        {systems.map((system) => (
          <button
            key={system}
            type="button"
            role="tab"
            aria-selected={activeSystem === system}
            className={activeSystem === system ? "tab active" : "tab"}
            onClick={() => setActiveSystem(system)}
          >
            {system}
          </button>
        ))}
      </div>
      {activeData && (
        <div className="tabs-content" role="tabpanel">
          <h3>{activeSystem}</h3>
          {activeSystem === "Westlich" &&
          visualPayloads?.Westlich?.chartType === "radixWheel" ? (
            <RadixWheel payload={visualPayloads.Westlich} />
          ) : activeSystem === "Bazi" &&
            visualPayloads?.Bazi?.chartType === "fourPillars" ? (
            <FourPillarsChart payload={visualPayloads.Bazi} />
          ) : activeSystem === "Numerologie" &&
            visualPayloads?.Numerologie?.chartType === "numerologyChart" ? (
            <NumerologyChart payload={visualPayloads.Numerologie} />
          ) : activeSystem === "Kabbalah" &&
            visualPayloads?.Kabbalah?.chartType === "kabbalahTree" ? (
            <KabbalahTree payload={visualPayloads.Kabbalah} />
          ) : activeSystem === "Hellenistisch" &&
            visualPayloads?.Hellenistisch?.chartType === "profectionChart" ? (
            <ProfectionChart payload={visualPayloads.Hellenistisch} />
          ) : activeSystem === "Arabisch" &&
            visualPayloads?.Arabisch?.chartType === "firdariaChart" ? (
            <FirdariaChart payload={visualPayloads.Arabisch} />
          ) : activeSystem === "Vedisch" &&
            visualPayloads?.Vedisch?.chartType === "dashaChart" ? (
            <DashaChart payload={visualPayloads.Vedisch} />
          ) : (
            <div className="bild-stub">
              [Bild folgt: Diagramm fuer {activeSystem}]
            </div>
          )}
          {activeData.horoskop_ausfuehrlich ? (
            <div className="deutung-horoskop-ausfuehrlich">
              <h4>Dein Horoskop</h4>
              <Paragraphs text={activeData.horoskop_ausfuehrlich} />
            </div>
          ) : null}
          <div className="deutung-intro">
            <Paragraphs text={activeData.intro} />
          </div>
          {DIMENSION_ORDER.map((dimKey) => {
            const block = activeData.dimensions?.[dimKey];
            if (!block) return null;
            const cleaned = stripTagLines(block);
            const lines = cleaned.split(/\n/).map((s) => s.trim()).filter(Boolean);
            const firstLine = lines[0];
            const restLines = lines.slice(1);
            return (
              <div key={dimKey} className="deutung-dimension">
                <h4>{firstLine || dimKey}</h4>
                {restLines.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            );
          })}
          <div className="deutung-outro">
            <Paragraphs text={activeData.paracelsus_outro} />
          </div>
        </div>
      )}
    </section>
  );
}

/** Hook: Systemtexte vom Backend laden (einmalig bei isFinished). */
export function useSystemTexts(ranking, isFinished) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isFinished || !ranking?.length) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/horoscope/texts?locale=de`)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isFinished, ranking?.length]);

  return { systemTexts: data, loading, error };
}
