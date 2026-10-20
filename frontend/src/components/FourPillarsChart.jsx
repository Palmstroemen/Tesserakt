/**
 * Bazi / Vier Säulen (八字): 4 pillars (Year, Month, Day, Hour), Day Master, five elements.
 * Payload: fourPillars from backend.
 */

const PILLAR_LABELS = { year: "Jahr", month: "Monat", day: "Tag", hour: "Stunde" };
const ELEMENT_COLORS = {
  wood: "#2d6a4f",
  fire: "#c1121f",
  earth: "#b08968",
  metal: "#6c757d",
  water: "#0077b6",
};

function PillarColumn({ label, pillar, isDayMaster }) {
  if (!pillar || (pillar.estimated && (pillar.stem === "unknown" || !pillar.stem))) {
    return (
      <div className="four-pillars__column">
        <div className="four-pillars__column-label">{label}</div>
        <div className="four-pillars__cell four-pillars__cell--unknown">?</div>
        <div className="four-pillars__cell four-pillars__cell--unknown">?</div>
      </div>
    );
  }
  const stemEl = pillar.stemElement || "earth";
  const branchEl = pillar.branchElement || "earth";
  return (
    <div
      className={`four-pillars__column${isDayMaster ? " four-pillars__column--day-master" : ""}`}
    >
      <div className="four-pillars__column-label">{label}</div>
      <div
        className="four-pillars__cell four-pillars__cell--stem"
        style={{ borderColor: ELEMENT_COLORS[stemEl] || "#333" }}
        title={pillar.stemElement}
      >
        {pillar.stem}
      </div>
      <div
        className="four-pillars__cell four-pillars__cell--branch"
        style={{ borderColor: ELEMENT_COLORS[branchEl] || "#333" }}
        title={pillar.branchElement}
      >
        {pillar.branch}
      </div>
      {pillar.estimated && (
        <span className="four-pillars__estimated" aria-label="Geschätzt">
          *
        </span>
      )}
    </div>
  );
}

export default function FourPillarsChart({ payload }) {
  if (!payload || payload.chartType !== "fourPillars") {
    return (
      <div className="four-pillars four-pillars--empty">
        <p>Keine Bazi-Daten.</p>
      </div>
    );
  }

  const { pillars, dayMaster, fiveElements, renderHints } = payload;
  const showElementBars = renderHints?.showElementBars !== false;

  return (
    <div className="four-pillars">
      <div className="four-pillars__grid" role="img" aria-label="Vier Säulen Bazi">
        {["year", "month", "day", "hour"].map((key) => (
          <PillarColumn
            key={key}
            label={PILLAR_LABELS[key]}
            pillar={pillars?.[key]}
            isDayMaster={key === "day"}
          />
        ))}
      </div>
      {dayMaster && (
        <p className="four-pillars__day-master">
          Day Master: <strong>{dayMaster.stem}</strong> ({dayMaster.element})
        </p>
      )}
      {showElementBars && fiveElements && (
        <div className="four-pillars__elements">
          <span className="four-pillars__elements-label">Fünf Elemente:</span>
          <div className="four-pillars__elements-bars">
            {Object.entries(fiveElements).map(([el, value]) => (
              <div key={el} className="four-pillars__element-row">
                <span className="four-pillars__element-name">{el}</span>
                <div className="four-pillars__element-track">
                  <div
                    className="four-pillars__element-fill"
                    style={{
                      width: `${(value * 100).toFixed(0)}%`,
                      backgroundColor: ELEMENT_COLORS[el] || "#999",
                    }}
                  />
                </div>
                <span className="four-pillars__element-value">{(value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
