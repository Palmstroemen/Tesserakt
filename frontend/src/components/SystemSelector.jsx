export default function SystemSelector({ systems, selectedSystems, onToggle, onStart }) {
  return (
    <section className="card">
      <h2>Systemauswahl</h2>
      <p>Waehle die Systeme fuer diesen Testlauf. Du kannst beliebige Kombinationen verwenden.</p>
      <div className="checkbox-grid">
        {systems.map((system) => (
          <label key={system} className="checkbox-row">
            <input
              type="checkbox"
              checked={selectedSystems.includes(system)}
              onChange={() => onToggle(system)}
            />
            <span>{system}</span>
          </label>
        ))}
      </div>
      <button type="button" disabled={!selectedSystems.length} onClick={onStart}>
        Test starten ({selectedSystems.length} Systeme)
      </button>
    </section>
  );
}
