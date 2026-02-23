const GAME_OPTIONS = [
  {
    id: "personality",
    title: "1. Persoenlichkeitseinschaetzung",
    description: "Aktiver Spielmodus mit Selbsteinschaetzung und Systemvergleich.",
  },
  {
    id: "forecast",
    title: "2. Prognose und Zeiteinschaetzung",
    description: "Geplanter Modus fuer zeitbezogene Auswertung.",
  },
  {
    id: "relationship",
    title: "3. Beziehungseinschaetzung",
    description: "Geplanter Modus fuer Beziehungs- und Kompatibilitaetsfragen.",
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
