export default function Zwischenstand({ ratingHistory }) {
  if (!ratingHistory?.length) {
    return null;
  }

  const latest = ratingHistory[ratingHistory.length - 1];
  return (
    <section className="card">
      <h3>Zwischenstand</h3>
      <ul>
        {latest.ranking.map((system) => (
          <li key={system}>
            {system}: Fit (absolut) {latest.systemDetails[system].fitScore.toFixed(1)}
          </li>
        ))}
      </ul>
    </section>
  );
}
