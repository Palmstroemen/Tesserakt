export default function RankingTabelle({ systeme, ranking, fitVsKO, skillVsKO, perzentilErwartungBester }) {
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
          <th>Fit (absolut)</th>
          <th>Skill vs Zufall</th>
          <th>Perzentil</th>
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
            <td>{typeof systeme[system].perzentil === "number" ? systeme[system].perzentil.toFixed(1) : "-"}</td>
            <td>{typeof fitVsKO?.[system] === "number" ? `${fitVsKO[system].toFixed(1)}` : "-"}</td>
            <td>{typeof skillVsKO?.[system] === "number" ? `${skillVsKO[system].toFixed(1)}` : "-"}</td>
            <td>{systeme[system].fehler.toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {typeof perzentilErwartungBester === "number" ? (
      <p className="hint">
        Perzentil: Anteil zufaelliger anderer Geburtsdaten, die schlechter zu deinen Antworten passen als dein eigenes.
        Ohne Aussagekraft laege ein System im Mittel bei 50, das beste von {ranking.filter((s) => s !== "KO").length} Systemen
        im Mittel bei {perzentilErwartungBester.toFixed(1)}.
      </p>
    ) : null}
    </>
  );
}
