/**
 * Map value in [-1, 1] to bar layout: centered track, fill grows left (negative) or right (positive).
 * Returns { leftPercent, widthPercent } for a fill inside a 100%-width track.
 */
function barStyleFromScore(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return { leftPercent: 50, widthPercent: 0 };
  const clamped = Math.max(-1, Math.min(1, num));
  const magnitude = Math.abs(clamped);
  const widthPercent = 50 * magnitude; // 0..50% of track
  const leftPercent = clamped >= 0 ? 50 : 50 - widthPercent;
  return { leftPercent, widthPercent };
}

export default function SystemVergleichBalken({ systemWerte, systemGewichte }) {
  const entries = Object.entries(systemWerte ?? {});
  if (!entries.length) {
    return <p>Keine Systemwerte vorhanden.</p>;
  }

  return (
    <div className="bars">
      {entries.map(([system, wert]) => {
        const { leftPercent, widthPercent } = barStyleFromScore(wert);
        return (
          <div className="bar-row" key={system}>
            <span className="bar-label">
              {system}
              <span className="bar-weight">
                {" "}
                (w=
                {typeof systemGewichte?.[system] === "number"
                  ? systemGewichte[system].toFixed(2)
                  : "-"}
                )
              </span>
            </span>
            <div className="bar-track">
              <span
                className="bar-fill"
                style={{
                  position: "absolute",
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: "100%",
                }}
              />
            </div>
            <span className="bar-value">{Number(wert).toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}
