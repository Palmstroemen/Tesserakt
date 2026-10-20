function formatSkill(value) {
  if (typeof value !== "number") return "-";
  return value > 0 ? `+${value.toFixed(0)}` : value.toFixed(0);
}

function zahl(value, stellen = 1) {
  return typeof value === "number" ? value.toFixed(stellen) : "-";
}

export default function RankingTabelle({ systeme, ranking, skillErwartungBester, timing = false }) {
  if (!ranking?.length) {
    return <p>Noch kein Ergebnis.</p>;
  }

  return (
    <>
    <table className="table">
      <thead>
        <tr>
          <th>Rang</th>
          <th>System</th>
          <th>Skill</th>
          <th>Perzentil</th>
          {timing ? (
            <th>Ø Abstand (Tage)</th>
          ) : (
            <>
              <th>Fit (absolut)</th>
              <th>Norm. Fehler</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {ranking.map((system, index) => (
          <tr key={system}>
            <td>{index + 1}</td>
            <td>{system}</td>
            <td>{formatSkill(systeme[system].skillScore)}</td>
            <td>{typeof systeme[system].perzentil === "number" ? systeme[system].perzentil.toFixed(0) : "-"}</td>
            {timing ? (
              <td>{zahl(systeme[system].abstandTage)}</td>
            ) : (
              <>
                <td>{zahl(systeme[system].fitScore)}</td>
                <td>{zahl(systeme[system].fehler, 4)}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    {typeof skillErwartungBester === "number" ? (
      <p className="hint">
        Skill vergleicht dein Geburtsdatum mit zufaelligen anderen Geburtsdaten: 0 = Zufallsniveau,
        +100 = besser als alle, -100 = schlechter als alle. Auch ohne jede Aussagekraft erreicht das beste
        von {ranking.length} Systemen im Mittel etwa +{skillErwartungBester.toFixed(0)}.
      </p>
    ) : null}
    </>
  );
}
