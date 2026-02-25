function widthFromScore(value) {
  return `${Math.max(0, Math.min(100, ((value - 1) / 4) * 100))}%`;
}

export default function SelbsteinschaetzungSlider({ value, onChange }) {
  return (
    <div className="bars">
      <div className="bar-row">
        <span className="bar-label">Deine Einschätzung:</span>
        <div className="bar-track">
          <span className="bar-fill" style={{ width: widthFromScore(value) }} />
        </div>
        <span className="bar-value">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        className="slider-input"
        min="1"
        max="5"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Deine Einschätzung"
      />
    </div>
  );
}
