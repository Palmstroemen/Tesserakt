import { useEffect, useRef, useState } from "react";
import RadixWheel from "../components/RadixWheel";
import FourPillarsChart from "../components/FourPillarsChart";
import NumerologyChart from "../components/NumerologyChart";
import KabbalahTree from "../components/KabbalahTree";
import ProfectionChart from "../components/ProfectionChart";
import FirdariaChart from "../components/FirdariaChart";
import DashaChart from "../components/DashaChart";
import { Paragraphs } from "../components/SystemDeutungTabs";
import { SYSTEME } from "./systeme";
import { AUGE_RADIUS, LINSE_RADIUS, MITTE } from "./geometrie";

// Ergebnis in der Schatulle: oben im magischen Auge die Horoskopgrafik des Systems, unten ein Textfeld,
// dessen Oberkante dem Kreis folgt. Seitlich wischen fuehrt zum naechsten System; die Grafik im Auge gleitet
// dabei synchron mit wie ein Dia. Die erste Karte ist die Uebersicht (Rangliste).
const DIAGRAMME = {
  Westlich: RadixWheel,
  Bazi: FourPillarsChart,
  Numerologie: NumerologyChart,
  Kabbalah: KabbalahTree,
  Hellenistisch: ProfectionChart,
  Arabisch: FirdariaChart,
  Vedisch: DashaChart,
};
const DIMENSIONEN = [
  "liebe",
  "beruf",
  "finanzen",
  "gesundheit",
  "soziales",
  "kreativitaet",
  "veraenderung",
  "spiritualitaet",
];
const PLATTE_OBEN = 300; // Textfeld beginnt bei y = 300 (viewBox), Kreisbogen schneidet die Oberkante aus
const BOGEN = 186; // Radius des ausgeschnittenen Bogens um MITTE
const DIAGRAMM_BREITE = 300; // natuerliche Breite, in der die Diagramme gezeichnet werden

// Diagramm in seiner natuerlichen Breite zeichnen, dann so verkleinern, dass es nach Breite UND Hoehe
// in den Kreis passt (das Quadrat im Kreis hat ~71 % des Durchmessers)
function Eingepasst({ linsePx, children }) {
  const ref = useRef(null);
  const [hoehe, setHoehe] = useState(DIAGRAMM_BREITE);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() =>
      setHoehe(el.offsetHeight || DIAGRAMM_BREITE),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const platz = linsePx * 0.72;
  const k = Math.min(platz / DIAGRAMM_BREITE, platz / hoehe);
  return (
    <div
      className="eg-diagramm"
      ref={ref}
      style={{ width: DIAGRAMM_BREITE, transform: `scale(${k})` }}
    >
      {children}
    </div>
  );
}

const vorzeichen = (x) => (x > 0 ? `+${x.toFixed(0)}` : x.toFixed(0));

function Dimensionen({ daten }) {
  return DIMENSIONEN.map((d) => {
    const block = daten?.dimensions?.[d];
    if (!block) return null;
    const zeilen = block
      .replace(/\[TAG\][^\n]*/g, "")
      .split("\n")
      .map((z) => z.trim())
      .filter(Boolean);
    return (
      <div key={d}>
        <h4>{zeilen[0]}</h4>
        {zeilen.slice(1).map((z, i) => (
          <p key={i}>{z}</p>
        ))}
      </div>
    );
  });
}

export default function Ergebnisplatte({
  spiel,
  ergebnis,
  vergleich,
  antwortZahl,
  visualPayloads,
  heute,
  texte,
  hinweis,
  onNochmal,
}) {
  const mainRef = useRef(null);
  const bandRef = useRef(null);
  const [breite, setBreite] = useState(390);
  const [pos, setPos] = useState(0); // 0 = Uebersicht, 1.. = Systeme (fliessend beim Wischen)

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setBreite(el.clientWidth));
    ro.observe(el);
    setBreite(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const k = breite / 400; // CSS-Pixel je viewBox-Einheit
  const linsePx = 2 * LINSE_RADIUS * k;
  const reihenfolge = ergebnis?.alle.ranking ?? SYSTEME.map((s) => s.id);
  const karten = ["uebersicht", ...reihenfolge];

  function scrollen() {
    const b = bandRef.current;
    if (b) setPos(b.scrollLeft / Math.max(1, b.clientWidth));
  }

  function zuKarte(i) {
    const b = bandRef.current;
    b?.scrollTo({ left: i * b.clientWidth, behavior: "smooth" });
  }

  const linse = {
    left: `${((MITTE.x - LINSE_RADIUS) / 400) * 100}%`,
    width: `${((2 * LINSE_RADIUS) / 400) * 100}%`,
    top: `${(MITTE.y - LINSE_RADIUS) * k}px`,
    height: `${2 * LINSE_RADIUS * k}px`,
  };

  return (
    <main className="sp eg" ref={mainRef} style={{ "--eg-k": `${k}px` }}>
      <div className="sp-buehne">
        <svg viewBox="0 0 400 400" className="sp-svg" aria-hidden="true">
          <defs>
            <radialGradient id="eg-messing" cx="35%" cy="30%" r="80%">
              <stop offset="0" stopColor="#f3d79a" />
              <stop offset="0.55" stopColor="#b08d57" />
              <stop offset="1" stopColor="#5a4325" />
            </radialGradient>
            <radialGradient id="eg-linse" cx="45%" cy="40%" r="70%">
              <stop offset="0" stopColor="#f6efdc" />
              <stop offset="0.7" stopColor="#d9ccaa" />
              <stop offset="1" stopColor="#8f7a52" />
            </radialGradient>
          </defs>
          <circle
            cx={MITTE.x}
            cy={MITTE.y}
            r={AUGE_RADIUS}
            fill="url(#eg-messing)"
          />
          <circle
            cx={MITTE.x}
            cy={MITTE.y}
            r={LINSE_RADIUS}
            fill="url(#eg-linse)"
            stroke="#3a2c1a"
            strokeWidth="2"
          />
        </svg>

        {/* Linse: Dia-Streifen mit Uebersicht und den Grafiken; folgt dem Wischen im Textfeld */}
        <div className="sp-linse eg-linse" style={linse}>
          <div
            className="eg-streifen"
            style={{ transform: `translateX(${-pos * linsePx}px)` }}
          >
            {karten.map((id) => {
              const Diagramm = DIAGRAMME[id];
              const payload = visualPayloads?.[id];
              const sys = SYSTEME.find((s) => s.id === id);
              return (
                <div key={id} className="eg-dia" style={{ width: linsePx }}>
                  {id === "uebersicht" ? (
                    <div className="eg-rangliste">
                      <div className="eg-rangtitel">
                        {spiel === "C" ? "Euer Ergebnis" : "Dein Ergebnis"}
                      </div>
                      {ergebnis
                        ? reihenfolge.map((s) => (
                            <div
                              key={s}
                              className="eg-rang"
                              style={{
                                "--farbe": SYSTEME.find((x) => x.id === s)
                                  .farbe,
                              }}
                            >
                              <i />
                              <span>{s}</span>
                              <b>
                                {vorzeichen(
                                  ergebnis.alle.systemDetails[s].skillScore,
                                )}
                              </b>
                            </div>
                          ))
                        : "Das Räderwerk rechnet …"}
                    </div>
                  ) : Diagramm && payload ? (
                    <Eingepasst linsePx={linsePx}>
                      <Diagramm payload={payload} />
                    </Eingepasst>
                  ) : (
                    <div className="eg-ohne" style={{ "--farbe": sys?.farbe }}>
                      {sys?.kurz}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Textfeld: Oberkante folgt dem Kreis; seitlich wischen = naechstes System */}
      <section
        className="eg-platte"
        style={{
          marginTop: `${-(400 - PLATTE_OBEN) * k}px`,
          "--eg-ausschnitt": `radial-gradient(circle ${BOGEN * k}px at 50% ${(MITTE.y - PLATTE_OBEN) * k}px, transparent 99.4%, #000 100%)`,
          "--eg-oben": `${(MITTE.y + BOGEN - PLATTE_OBEN + 10) * k}px`,
        }}
      >
        <div className="eg-band" ref={bandRef} onScroll={scrollen}>
          {karten.map((id) => {
            if (id === "uebersicht") {
              return (
                <article key={id} className="eg-karte">
                  {ergebnis ? (
                    <>
                      <p>
                        Skill 0 = Zufall, +100 = besser als alle {vergleich}.
                        Auch ohne jede Aussagekraft erreicht das beste von{" "}
                        {reihenfolge.length} Systemen im Mittel etwa +
                        {ergebnis.erwartung.toFixed(0)}.
                      </p>
                      <p className="eg-leise">
                        Wisch zur Seite für die einzelnen Systeme und ihr
                        Horoskop.
                      </p>
                      {hinweis ? <p className="eg-leise">{hinweis}</p> : null}
                      <button
                        type="button"
                        className="sc-start"
                        onClick={onNochmal}
                      >
                        Noch einmal
                      </button>
                    </>
                  ) : (
                    <p>Das Räderwerk vergleicht mit hundert {vergleich} …</p>
                  )}
                </article>
              );
            }
            const sys = SYSTEME.find((s) => s.id === id);
            const d = ergebnis?.alle.systemDetails[id];
            const h = heute?.systeme?.[id];
            const t = texte?.systems?.[id];
            return (
              <article
                key={id}
                className="eg-karte"
                style={{ "--farbe": sys.farbe }}
              >
                <header className="eg-kopf">
                  <span>{id}</span>
                  {d ? <b>{vorzeichen(d.skillScore)}</b> : null}
                </header>
                {d ? (
                  <p className="eg-leise">
                    besser als {d.perzentil.toFixed(0)} von 100 {vergleich} ·
                    mitgespielt bei {ergebnis.mitgespielt[id]} von {antwortZahl}{" "}
                    Fragen
                  </p>
                ) : null}
                {h ? (
                  <>
                    <h4>Heute</h4>
                    {[...h.faktoren, ...h.tendenzen]
                      .filter(Boolean)
                      .map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                  </>
                ) : null}
                {t ? (
                  <>
                    {t.horoskop_ausfuehrlich ? (
                      <>
                        <h4>Dein Horoskop</h4>
                        <Paragraphs text={t.horoskop_ausfuehrlich} />
                      </>
                    ) : null}
                    <Paragraphs text={t.intro} />
                    <Dimensionen daten={t} />
                    <Paragraphs text={t.paracelsus_outro} />
                  </>
                ) : spiel === "C" ? (
                  <p className="eg-leise">
                    Die Deutungstexte für Paare folgen.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
        <nav className="eg-punkte" aria-label="Systeme">
          {karten.map((id, i) => (
            <button
              key={id}
              type="button"
              aria-label={id === "uebersicht" ? "Übersicht" : id}
              className={Math.round(pos) === i ? "an" : ""}
              style={{
                "--farbe": SYSTEME.find((s) => s.id === id)?.farbe ?? "#f0d59c",
              }}
              onClick={() => zuKarte(i)}
            />
          ))}
        </nav>
      </section>
    </main>
  );
}
