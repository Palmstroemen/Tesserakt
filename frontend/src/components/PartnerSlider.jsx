/**
 * Slider für Beziehungsfragen: -1 (eher ich) … 0 … +1 (eher Partner:in). Skala wie Spiel A.
 */
export default function PartnerSlider({ value, onChange }) {
  const valueLabel = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
  return (
    <div className="partner-slider partner-slider--five-col">
      <div className="partner-slider__col partner-slider__col--label">Eher ich</div>
      <div className="partner-slider__col partner-slider__col--empty" />
      <div className="partner-slider__col partner-slider__col--slider">
        <div className="partner-slider__center-label" aria-hidden="true">Ausgewogen</div>
        <input
          type="range"
          className="partner-slider__input"
          min="-1"
          max="1"
          step="0.1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Eher ich bis eher Partner:in"
        />
      </div>
      <div className="partner-slider__col partner-slider__col--value">{valueLabel}</div>
      <div className="partner-slider__col partner-slider__col--label">Eher Partner:in</div>
    </div>
  );
}
