const NAME_SYSTEMS = ["Numerologie", "Kabbalah"];
const GENDER_SYSTEMS = ["Vedisch", "Arabisch", "Bazi"];

export default function SystemSelector({
  systems,
  selectedSystems,
  onToggle,
  onStart,
  startBlocked = false,
  optionalName = "",
  onOptionalNameChange,
  optionalGender = "",
  onOptionalGenderChange,
}) {
  const showNameSection = NAME_SYSTEMS.some((s) => selectedSystems.includes(s));
  const showGenderSection = GENDER_SYSTEMS.some((s) => selectedSystems.includes(s));
  const showOptionalData = showNameSection || showGenderSection;

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

      {showOptionalData ? (
        <div className="system-selector-optional">
          <p className="system-selector-optional-intro">
            Die folgenden Systeme wuerden von weiteren Daten profitieren und exaktere Beschreibungen
            liefern. Du musst aber keine Angaben machen.
          </p>
          <p className="system-selector-optional-privacy">
            Dein Name wird nicht mit den Daten abgespeichert und verbleibt rein auf deinem Computer.
            Das angegebene Geschlecht wird gespeichert, weil es uns interessiert, welche
            Unterschiede sich hier vielleicht abzeichnen.
          </p>
          <div className="system-selector-optional-grid">
            {showNameSection ? (
              <div className="system-selector-optional-col">
                <div className="system-selector-optional-labels">
                  {NAME_SYSTEMS.map((s) => (
                    <span
                      key={s}
                      className={`system-selector-optional-chip ${selectedSystems.includes(s) ? "system-selector-optional-chip--on" : ""}`}
                    >
                      [{selectedSystems.includes(s) ? "x" : " "}] {s}
                    </span>
                  ))}
                </div>
                <label className="system-selector-optional-field">
                  <span className="system-selector-optional-field-label">Name</span>
                  <input
                    type="text"
                    value={optionalName}
                    onChange={(e) => onOptionalNameChange?.(e.target.value)}
                    placeholder="optional"
                    className="system-selector-optional-input"
                  />
                </label>
              </div>
            ) : null}
            {showGenderSection ? (
              <div className="system-selector-optional-col">
                <div className="system-selector-optional-labels">
                  {GENDER_SYSTEMS.map((s) => (
                    <span
                      key={s}
                      className={`system-selector-optional-chip ${selectedSystems.includes(s) ? "system-selector-optional-chip--on" : ""}`}
                    >
                      [{selectedSystems.includes(s) ? "x" : " "}] {s}
                    </span>
                  ))}
                </div>
                <div className="system-selector-optional-field" role="group" aria-label="Geschlecht">
                  <span className="system-selector-optional-field-label">Geschlecht</span>
                  <div className="system-selector-optional-radios">
                    <label className="system-selector-optional-radio">
                      <input
                        type="radio"
                        name="geschlecht"
                        checked={optionalGender === "weiblich"}
                        onChange={() => onOptionalGenderChange?.("weiblich")}
                      />
                      weiblich
                    </label>
                    <label className="system-selector-optional-radio">
                      <input
                        type="radio"
                        name="geschlecht"
                        checked={optionalGender === "maennlich"}
                        onChange={() => onOptionalGenderChange?.("maennlich")}
                      />
                      männlich
                    </label>
                    <label className="system-selector-optional-radio">
                      <input
                        type="radio"
                        name="geschlecht"
                        checked={optionalGender !== "weiblich" && optionalGender !== "maennlich"}
                        onChange={() => onOptionalGenderChange?.("")}
                      />
                      keine Angabe
                    </label>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="system-selector-actions">
        <button
          type="button"
          disabled={!selectedSystems.length || startBlocked}
          onClick={() => onStart(false)}
        >
          Starte deine Analyse
        </button>
        <button
          type="button"
          className="system-selector-test-mode"
          disabled={!selectedSystems.length || startBlocked}
          onClick={() => onStart(true)}
        >
          Starte im Testmodus
        </button>
      </div>
    </section>
  );
}
