export default function RankingTabelle({ systeme, ranking }) {
  if (!ranking?.length) {
    return <p>Noch kein Ergebnis.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Rang</th>
          <th>System</th>
          <th>Rating</th>
          <th>Norm. Fehler</th>
        </tr>
      </thead>
      <tbody>
        {ranking.map((system, index) => (
          <tr key={system}>
            <td>{index + 1}</td>
            <td>{system}</td>
            <td>{systeme[system].rating.toFixed(1)}%</td>
            <td>{systeme[system].fehler.toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
