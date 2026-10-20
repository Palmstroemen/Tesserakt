/**
 * Vedisch: Vimshottari Dasha – 120-Jahre-Zyklus.
 * Kreis: äußerer Planetenring, exzentrische transparente Kreise (2/3 Radius) pro Planet,
 * die in der Mitte eine bunte Farbfigur ergeben; aktive Mahadasha hervorgehoben.
 */

const PLANET_COLORS = {
  ketu: "rgba(128, 0, 128, 0.42)",
  venus: "rgba(255, 105, 180, 0.42)",
  sonne: "rgba(255, 165, 0, 0.42)",
  mond: "rgba(176, 224, 230, 0.5)",
  mars: "rgba(200, 50, 50, 0.42)",
  rahu: "rgba(60, 60, 80, 0.45)",
  jupiter: "rgba(255, 200, 100, 0.42)",
  saturn: "rgba(70, 130, 180, 0.42)",
  merkur: "rgba(100, 180, 100, 0.42)",
};

export default function DashaChart({ payload }) {
  if (!payload || payload.chartType !== "dashaChart") {
    return (
      <div className="dasha-chart dasha-chart--empty">
        <p>Keine Dasha-Daten.</p>
      </div>
    );
  }

  const { age, activeMahadasha, periods = [], nakshatraIndex } = payload;
  const activePlanet = activeMahadasha?.planet ?? null;

  const R = 95;
  const r = (R * 2) / 3;
  const viewSize = 220;

  const periodsWithAngles = periods.map((p, i) => {
    const startAngle = (p.startAge / 120) * 360;
    const endAngle = (p.endAge / 120) * 360;
    const midAngleDeg = (startAngle + endAngle) / 2;
    const midRad = (midAngleDeg - 90) * (Math.PI / 180);
    return {
      ...p,
      startAngle,
      endAngle,
      midAngleDeg,
      cx: R * Math.cos(midRad),
      cy: R * Math.sin(midRad),
      fill: PLANET_COLORS[p.planet] || "rgba(160,160,160,0.35)",
      isActive: p.planet === activePlanet,
    };
  });

  return (
    <div className="dasha-chart" role="img" aria-label={`Mahadasha: ${activeMahadasha?.label ?? "—"}`}>
      <p className="dasha-chart__meta">Alter: {age} · 120-Jahre-Zyklus</p>
      {activeMahadasha?.planet && (
        <div className="dasha-chart__current">
          <strong className="dasha-chart__label">Aktuelle Mahadasha: {activeMahadasha.label}</strong>
          <span className="dasha-chart__years">
            {activeMahadasha.startAge}–{activeMahadasha.endAge} Jahre
          </span>
        </div>
      )}

      <div className="dasha-chart__circle-wrap">
        <svg
          className="dasha-chart__svg"
          viewBox={`${-viewSize / 2} ${-viewSize / 2} ${viewSize} ${viewSize}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <g transform={`translate(0, 0)`}>
            {/* Exzentrische transparente Kreise (von Planeten „mitgenommen“) → bunte Mitte */}
            {periodsWithAngles.map((p) => (
              <circle
                key={p.planet}
                cx={p.cx}
                cy={p.cy}
                r={r}
                fill={p.fill}
                className={`dasha-chart__eccentric ${p.isActive ? "dasha-chart__eccentric--active" : ""}`}
                aria-hidden="true"
              />
            ))}
            {/* Äußerer Planetenring: Kreis + Trennlinien der 9 Phasen */}
            {periodsWithAngles.map((p) => {
              const startRad = ((p.startAngle - 90) * Math.PI) / 180;
              const x1 = R * Math.cos(startRad);
              const y1 = R * Math.sin(startRad);
              return (
                <line
                  key={`div-${p.planet}`}
                  x1={0}
                  y1={0}
                  x2={x1}
                  y2={y1}
                  stroke="rgba(70,70,90,0.4)"
                  strokeWidth={1}
                />
              );
            })}
            <circle cx={0} cy={0} r={R} fill="none" stroke="rgba(50,50,70,0.55)" strokeWidth={1.5} />
            {/* Planet-Labels am Ring (kurz) */}
            {periodsWithAngles.map((p) => {
              const labelR = R + 14;
              const rad = ((p.midAngleDeg - 90) * Math.PI) / 180;
              const lx = labelR * Math.cos(rad);
              const ly = labelR * Math.sin(rad);
              return (
                <text
                  key={`label-${p.planet}`}
                  x={lx}
                  y={ly}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`dasha-chart__ring-label ${p.isActive ? "dasha-chart__ring-label--active" : ""}`}
                >
                  {p.label.slice(0, 3)}
                </text>
              );
            })}
          </g>
        </svg>
      </div>

      {nakshatraIndex != null && (
        <p className="dasha-chart__nakshatra">Nakshatra-Index: {nakshatraIndex + 1}/27</p>
      )}
      <div className="dasha-chart__timeline-wrap">
        <div className="dasha-chart__timeline" aria-hidden="true">
          <div className="dasha-chart__timeline-bar" />
          <div
            className="dasha-chart__timeline-marker"
            style={{ left: `${Math.min(100, (age / 120) * 100)}%` }}
          />
        </div>
        <span className="dasha-chart__timeline-label">0</span>
        <span className="dasha-chart__timeline-label dasha-chart__timeline-label--end">120 Jahre</span>
      </div>
    </div>
  );
}
