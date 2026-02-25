const GAME_OPTIONS = [
  {
    id: "personality",
    title: "Geburtshoroskop für mich",
    description: "(Selbsteinschätzung)",
  },
  {
    id: "fremd",
    title: "Geburtshoroskop für jemanden anderen",
    description: "(Fremdeinschätzung)",
  },
  {
    id: "forecast",
    title: "Zeitenhoroskope und Prognose",
    description: "",
  },
  {
    id: "relationship",
    title: "Beziehungshoroskop",
    description: "",
  },
];

export default function GameSelector({ selectedGame, onSelect }) {
  return (
    <section className="card">
      <h2>Spielauswahl</h2>
      <p>Waehle das Spiel fuer diesen Durchlauf.</p>
      <div className="game-grid">
        {GAME_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`game-option${selectedGame === option.id ? " active" : ""}`}
            onClick={() => onSelect(option.id)}
          >
            <strong>{option.title}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
