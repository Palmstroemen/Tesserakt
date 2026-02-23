export default function SelbsteinschaetzungSlider({ value, onChange }) {
  return (
    <label className="slider">
      <span>Deine Einschaetzung: {value.toFixed(1)}</span>
      <input
        type="range"
        min="1"
        max="5"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
