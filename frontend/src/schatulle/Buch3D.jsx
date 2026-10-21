// Das Horoskopbuch als stehendes Buch in 3D (reines CSS): Vorderdeckel mit Titel und Datumsscheibe, Ruecken
// mit Titel, oben der Papierblock, darunter ein weicher Schatten. Die Dicke waechst mit der Zahl der Horoskope.
import Datumsscheibe, { datumAus } from "./Datumsscheibe";

export default function Buch3D({ titel, geburt, anzahl }) {
  const dicke = 10 + anzahl * 3;
  return (
    <div className="b3-buehne" aria-hidden="true">
      <div className="b3-schatten" style={{ "--dicke": `${dicke}px` }} />
      <div className="b3-buch" style={{ "--dicke": `${dicke}px` }}>
        <div className="b3-oben" />
        <div className="b3-ruecken">
          <span className="b3-ruecken-titel">{titel}</span>
          <span className="b3-ruecken-marke">T</span>
        </div>
        <div className="b3-deckel">
          <div className="b3-zeichen">TESSERAKT</div>
          <div className="b3-titel">{titel}</div>
          {geburt?.a ? (
            <div className={geburt.b ? "b3-scheiben paar" : "b3-scheiben"}>
              <Datumsscheibe
                datum={datumAus(geburt.a.geburtsdatum, geburt.a.uhrzeit)}
                praefix="b3-a"
              />
              {geburt.b ? (
                <Datumsscheibe
                  datum={datumAus(geburt.b.geburtsdatum, geburt.b.uhrzeit)}
                  metall="silber"
                  praefix="b3-b"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
