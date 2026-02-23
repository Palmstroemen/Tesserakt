export default function RankingTabelle({ systeme, ranking, fitVsKO, skillVsKO }) {
  if (!ranking?.length) {
    return <p>Noch kein Ergebnis.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Rang</th>
          <th>System</th>
          <th>Fit (absolut)</th>
          <th>Skill vs Zufall</th>
          <th>Delta Fit zu KO</th>
          <th>Delta Skill zu KO</th>
          <th>Norm. Fehler</th>
        </tr>
      </thead>
      <tbody>
        {ranking.map((system, index) => (
          <tr key={system}>
            <td>{index + 1}</td>
            <td>{system}</td>
            <td>{systeme[system].fitScore.toFixed(1)}</td>
            <td>{systeme[system].skillScore.toFixed(1)}</td>
            <td>{typeof fitVsKO?.[system] === "number" ? `${fitVsKO[system].toFixed(1)}` : "-"}</td>
            <td>{typeof skillVsKO?.[system] === "number" ? `${skillVsKO[system].toFixed(1)}` : "-"}</td>
            <td>{systeme[system].fehler.toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
