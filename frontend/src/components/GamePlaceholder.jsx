export default function GamePlaceholder({ title, onBack }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <p>Dieser Spielmodus ist noch in Arbeit. Bitte nutze vorerst Spiel 1.</p>
      <button type="button" onClick={onBack}>
        Zurueck zur Spielauswahl
      </button>
    </section>
  );
}
