/**
 * Arabisch: Firdaria – aktuelle Periode (0–75 Jahre), optional nächste Periode.
 * Payload: firdariaChart from backend.
 */

export default function FirdariaChart({ payload }) {
  if (!payload || payload.chartType !== "firdariaChart") {
    return (
      <div className="firdaria-chart firdaria-chart--empty">
        <p>Keine Firdaria-Daten.</p>
      </div>
    );
  }

  const { age, isDayChart, currentPeriod, nextPeriod } = payload;

  return (
    <div className="firdaria-chart" role="img" aria-label={`Firdaria: ${currentPeriod?.label ?? "—"}`}>
      <p className="firdaria-chart__meta">
        Alter: {age} · {isDayChart ? "Tag" : "Nacht"}-Horoskop
      </p>
      {currentPeriod?.planet && (
        <div className="firdaria-chart__current">
          <span className="firdaria-chart__symbol">{currentPeriod.symbol}</span>
          <div className="firdaria-chart__period-info">
            <strong>Aktuelle Periode: {currentPeriod.label}</strong>
            <span className="firdaria-chart__years">
              {currentPeriod.startAge}–{currentPeriod.endAge} Jahre
            </span>
          </div>
        </div>
      )}
      {nextPeriod?.planet && (
        <p className="firdaria-chart__next">
          Nächste: {nextPeriod.symbol} {nextPeriod.label} ab {nextPeriod.startAge} Jahre
        </p>
      )}
      <div className="firdaria-chart__timeline-wrap">
        <div className="firdaria-chart__timeline" aria-hidden="true">
          <div className="firdaria-chart__timeline-bar" />
          <div
            className="firdaria-chart__timeline-marker"
            style={{ left: `${Math.min(100, (age / 75) * 100)}%` }}
          />
        </div>
        <span className="firdaria-chart__timeline-label">0</span>
        <span className="firdaria-chart__timeline-label firdaria-chart__timeline-label--end">75 Jahre</span>
      </div>
    </div>
  );
}
