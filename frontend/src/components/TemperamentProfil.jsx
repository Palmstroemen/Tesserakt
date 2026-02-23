export default function TemperamentProfil({ temperament, profil }) {
  if (!temperament?.primaer) {
    return <p>Temperament kann noch nicht berechnet werden.</p>;
  }

  return (
    <section className="card">
      <h3>Temperament</h3>
      <p>
        Primaer: <strong>{temperament.primaer}</strong>
        {temperament.sekundaer ? ` | Sekundaer: ${temperament.sekundaer}` : ""}
      </p>
      <p>
        Verteilung: {Object.entries(temperament.verteilung)
          .map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`)
          .join(" | ")}
      </p>
      {profil ? <p>Profil: {profil}</p> : null}
    </section>
  );
}
