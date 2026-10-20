/**
 * Eine Zeile: "Deine Einschätzung:" | Slider | Wert (gleiches Raster wie System-Balken).
 */
export default function SelbsteinschaetzungSlider({ value, onChange }) {
  return (
    <div className="bar-row bar-row--slider">
      <span className="bar-label">Deine Einschätzung:</span>
      <input
        type="range"
        className="slider-in-row"
        min="-1"
        max="1"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Deine Einschätzung"
      />
      <span className="bar-value">{value >= 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}</span>
    </div>
  );
}
