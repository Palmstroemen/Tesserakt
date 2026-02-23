import { useVergleich } from "../hooks/useVergleich";

export default function VergleichsGruppeViz({ doy, stunde, frage_id, selbst }) {
  const { granularitaet, daten, loading, error } = useVergleich(doy, stunde, frage_id);

  if (loading) {
    return <p>Vergleichsgruppe laedt...</p>;
  }
  if (error) {
    return <p>Vergleich nicht verfuegbar: {error}</p>;
  }
  if (!daten) {
    return null;
  }

  return (
    <div className="compare-box">
      <h4>Vergleichsgruppe (Stufe {granularitaet})</h4>
      <p>
        Mittelwert: {daten.mittelwert ?? "-"} | Median: {daten.median ?? "-"} | N gesamt:{" "}
        {daten.n_gesamt}
      </p>
      <p>
        Deine Einschaetzung: <strong>{selbst.toFixed(1)}</strong>
      </p>
      <div className="bins">
        <span>1: {daten.bin_1}</span>
        <span>2: {daten.bin_2}</span>
        <span>3: {daten.bin_3}</span>
        <span>4: {daten.bin_4}</span>
        <span>5: {daten.bin_5}</span>
      </div>
    </div>
  );
}
