/**
 * Hellenistisch: Jahresprofektion – 12 Häuser, aktives Haus hervorgehoben, Sekt (Tag/Nacht).
 * Payload: profectionChart from backend.
 */

export default function ProfectionChart({ payload }) {
  if (!payload || payload.chartType !== "profectionChart") {
    return (
      <div className="profection-chart profection-chart--empty">
        <p>Keine Profektions-Daten.</p>
      </div>
    );
  }

  const { age, activeHouse, activeHouseLabel, isDayChart } = payload;

  return (
    <div className="profection-chart" role="img" aria-label={`Jahresherr ${activeHouseLabel}`}>
      <p className="profection-chart__meta">
        Alter: {age} · Jahresherr: {activeHouseLabel}
        {isDayChart != null && (
          <span className="profection-chart__sect"> · {isDayChart ? "Tag-Geburt" : "Nacht-Geburt"}</span>
        )}
      </p>
      <div className="profection-chart__houses">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((house) => {
          const isActive = house === activeHouse;
          return (
            <div
              key={house}
              className={`profection-chart__house ${isActive ? "profection-chart__house--active" : ""}`}
            >
              <span className="profection-chart__house-num">{house}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
