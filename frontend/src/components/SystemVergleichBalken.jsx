function widthFromScore(value) {
  return `${Math.max(0, Math.min(100, ((value - 1) / 4) * 100))}%`;
}

export default function SystemVergleichBalken({ systemWerte, selbst }) {
  const entries = Object.entries(systemWerte ?? {});
  if (!entries.length) {
    return <p>Keine Systemwerte vorhanden.</p>;
  }

  return (
    <div className="bars">
      {entries.map(([system, wert]) => (
        <div className="bar-row" key={system}>
          <span className="bar-label">{system}</span>
          <div className="bar-track">
            <span className="bar-fill" style={{ width: widthFromScore(wert) }} />
          </div>
          <span className="bar-value">{Number(wert).toFixed(2)}</span>
        </div>
      ))}
      <div className="self-line">Du: {selbst.toFixed(1)}</div>
    </div>
  );
}
