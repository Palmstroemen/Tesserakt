/**
 * Numerologie: Lebenspfadzahl zentral, Reduktionsschritte, optional Meisterzahl-Hinweis.
 * Payload: numerologyChart from backend.
 */

export default function NumerologyChart({ payload }) {
  if (!payload || payload.chartType !== "numerologyChart") {
    return (
      <div className="numerology-chart numerology-chart--empty">
        <p>Keine Numerologie-Daten.</p>
      </div>
    );
  }

  const { lifePathNumber, isMasterNumber, reductionSteps, birthDateComponents } = payload;
  const birthStr =
    birthDateComponents &&
    `${String(birthDateComponents.day).padStart(2, "0")}.${String(birthDateComponents.month).padStart(2, "0")}.${birthDateComponents.year}`;

  return (
    <div className="numerology-chart" role="img" aria-label={`Lebenspfadzahl ${lifePathNumber}`}>
      {birthStr && (
        <p className="numerology-chart__birthdate">Geburtsdatum: {birthStr}</p>
      )}
      <div className="numerology-chart__life-path">{lifePathNumber}</div>
      {isMasterNumber && (
        <p className="numerology-chart__master">Meisterzahl</p>
      )}
      {reductionSteps && reductionSteps.length > 0 && (
        <div className="numerology-chart__steps">
          {reductionSteps.map((step, i) => (
            <div key={i} className="numerology-chart__step">
              <span className="numerology-chart__step-label">{step.label}</span>
              <span className="numerology-chart__step-value">{step.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
