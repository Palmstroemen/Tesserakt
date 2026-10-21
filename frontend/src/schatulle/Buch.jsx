// Das Horoskopbuch, 21 x 21 cm: Titelseite, Rangliste, je gewaehltem Horoskop vier Seiten (links die Grafik,
// rechts der Text, dann zwei Textseiten) und am Ende die Hintergrundseiten zum Experiment. Am Bildschirm als
// Vorschau (Seiten untereinander), beim Drucken eine Seite je Blatt (@page 210 x 210 mm). Die Grafiken sind
// dieselben Vektorgrafiken wie im Auge; Schriftgroessen in cqw, damit Vorschau und Druck gleich umbrechen.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_BASE } from "../logic/api";
import { Paragraphs } from "../components/SystemDeutungTabs";
import HoroskopIcon from "./HoroskopIcon";
import { PAARBILD, VOLLBILD } from "./Ergebnisplatte";
import { SYSTEME, anzeigeName } from "./systeme";

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
const vorzeichen = (x) => (x > 0 ? `+${x.toFixed(0)}` : x.toFixed(0));

// **fett** in den Erklaertexten
function Inline({ text }) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((t, i) =>
      t.startsWith("**") && t.endsWith("**") ? (
        <b key={i}>{t.slice(2, -2)}</b>
      ) : (
        t
      ),
    );
}

function Seite({ art = "", nummer, children }) {
  return (
    <section className={`buch-seite ${art}`}>
      {children}
      {nummer ? <span className="buch-nummer">{nummer}</span> : null}
    </section>
  );
}

function Grafik({ id, spiel, visualPayloads, paar }) {
  const Paarbild = PAARBILD[id];
  const Bild = VOLLBILD[id];
  if (spiel === "C" && Paarbild && paar?.systeme?.[id])
    return <Paarbild daten={paar.systeme[id]} />;
  if (Bild && visualPayloads?.[id])
    return <Bild payload={visualPayloads[id]} />;
  return null;
}

function Lebensbereiche({ daten, nur = DIMENSIONEN }) {
  return nur.map((d) => {
    const zeilen = (daten?.dimensions?.[d] ?? "")
      .replace(/\[TAG\][^\n]*/g, "")
      .split("\n")
      .map((z) => z.trim())
      .filter(Boolean);
    if (!zeilen.length) return null;
    return (
      <p key={d} className="buch-bereich">
        <b>{zeilen[0]}</b> {zeilen.slice(1).join(" ")}
      </p>
    );
  });
}

export default function Buch({
  spiel,
  auswahl,
  ergebnis,
  vergleich,
  visualPayloads,
  paar,
  texte,
  ausblick,
  heute,
  onSchliessen,
}) {
  const [erklaerungen, setErklaerungen] = useState([]);
  useEffect(() => {
    fetch(`${API_BASE}/horoscope/erklaerungen?locale=de`)
      .then((r) => r.json())
      .then((d) => setErklaerungen(d.themen ?? []))
      .catch(() => {});
  }, []);

  const paarSpiel = spiel === "C";
  const titel = paarSpiel ? "Unser Horoskopbuch" : "Mein Horoskopbuch";
  const datum = new Date().toLocaleDateString("de-AT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const ranking = ergebnis?.alle?.ranking ?? auswahl;
  let nummer = 2; // Seitenzahl ab der Rangliste

  const seiten = [
    <Seite key="titel" art="titel">
      <div className="buch-titelzeichen">TESSERAKT</div>
      <h1>{titel}</h1>
      <div className="buch-titelicons">
        {auswahl.map((id) => (
          <svg key={id} viewBox="-12 -12 24 24" aria-hidden="true">
            <HoroskopIcon id={id} r={10} />
          </svg>
        ))}
      </div>
      <p className="buch-datum">{datum}</p>
    </Seite>,
    <Seite key="ergebnis" art="text" nummer={nummer++}>
      <h2>{paarSpiel ? "Euer Ergebnis" : "Dein Ergebnis"}</h2>
      <table className="buch-rangliste">
        <tbody>
          {ranking.map((id) => (
            <tr key={id} className={auswahl.includes(id) ? "gewaehlt" : ""}>
              <td>{anzeigeName(id)}</td>
              <td>
                {ergebnis?.alle?.systemDetails?.[id]
                  ? vorzeichen(ergebnis.alle.systemDetails[id].skillScore)
                  : "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {ergebnis ? (
        <p className="buch-klein">
          Skill 0 = Zufall, +100 = besser als alle {vergleich}. Ohne jede
          Aussagekraft erreicht das beste von {SYSTEME.length} Horoskopen im
          Mittel etwa +{ergebnis.erwartung.toFixed(0)}.
        </p>
      ) : null}
    </Seite>,
  ];

  auswahl.forEach((id) => {
    const sys = SYSTEME.find((x) => x.id === id);
    const t = texte?.systems?.[id];
    const d = ergebnis?.alle?.systemDetails?.[id];
    const jahr = ausblick?.systeme?.[id];
    const h = heute?.systeme?.[id];
    const euer = paar?.systeme?.[id];
    const bereiche = DIMENSIONEN.filter((dim) => t?.dimensions?.[dim]);
    // Textseiten des Horoskops; leere fallen weg
    const texteSeiten = [
      <>
        <h2>{anzeigeName(id)}</h2>
        {sys?.unter ? <p className="buch-unter">{sys.unter}</p> : null}
        {d ? (
          <p className="buch-klein">
            Skill {vorzeichen(d.skillScore)} · besser als{" "}
            {d.perzentil.toFixed(0)} von 100 {vergleich}
          </p>
        ) : null}
        {paarSpiel ? (
          <>
            <h3>Euer Paar</h3>
            {(euer?.aussagen ?? []).map((a, i) => (
              <p key={i}>{a}</p>
            ))}
          </>
        ) : (
          <>
            <h3>So denkt dieses Horoskop</h3>
            <Paragraphs text={t?.intro ?? ""} />
          </>
        )}
      </>,
      paarSpiel ? (
        t?.intro ? (
          <>
            <h3>So denkt dieses Horoskop</h3>
            <Paragraphs text={t.intro} />
          </>
        ) : null
      ) : t?.horoskop_ausfuehrlich ? (
        <>
          <h3>Dein Horoskop</h3>
          <Paragraphs text={t.horoskop_ausfuehrlich} />
        </>
      ) : h ? (
        <>
          <h3>Dein Horoskop für heute</h3>
          {[...h.faktoren, ...h.tendenzen].filter(Boolean).map((x, i) => (
            <p key={i}>{x}</p>
          ))}
        </>
      ) : null,
      !paarSpiel && jahr?.length ? (
        <>
          <h3>Dein Jahr</h3>
          {jahr.map((e, i) => {
            const k = e.text.indexOf(": ");
            return (
              <p key={i} className="buch-jahr">
                <b>{e.text.slice(0, k)}</b> – {e.text.slice(k + 2)}
              </p>
            );
          })}
        </>
      ) : null,
      !paarSpiel && bereiche.length ? (
        <>
          <h3>Deine Lebensbereiche</h3>
          <Lebensbereiche daten={t} nur={bereiche.slice(0, 4)} />
        </>
      ) : null,
      !paarSpiel && bereiche.length > 4 ? (
        <>
          <Lebensbereiche daten={t} nur={bereiche.slice(4)} />
          <div className="buch-schluss">
            <Paragraphs text={t?.paracelsus_outro ?? ""} />
          </div>
        </>
      ) : t?.paracelsus_outro ? (
        <div className="buch-schluss">
          <Paragraphs text={t.paracelsus_outro} />
        </div>
      ) : null,
    ].filter(Boolean);
    seiten.push(
      <Seite key={`${id}-g`} art="grafik" nummer={nummer++}>
        <div className="buch-grafik">
          <Grafik
            id={id}
            spiel={spiel}
            visualPayloads={visualPayloads}
            paar={paar}
          />
        </div>
        <div className="buch-bildunterschrift">{anzeigeName(id)}</div>
      </Seite>,
      ...texteSeiten.map((inhalt, i) => (
        <Seite key={`${id}-${i}`} art="text" nummer={nummer++}>
          {inhalt}
        </Seite>
      )),
    );
    // die naechste Grafik soll wieder links stehen: notfalls eine Notizseite
    if ((1 + texteSeiten.length) % 2)
      seiten.push(
        <Seite key={`${id}-notiz`} art="notiz" nummer={nummer++}>
          <h3>Notizen</h3>
        </Seite>,
      );
  });

  erklaerungen.forEach((thema) => {
    seiten.push(
      <Seite key={`h-${thema.id}`} art="text hintergrund" nummer={nummer++}>
        <h2>{thema.titel}</h2>
        {thema.abschnitte.map((a) => (
          <div key={a.id}>
            <h3>{a.titel}</h3>
            {a.bloecke.map((b, i) =>
              b.typ === "liste" ? (
                <ul key={i}>
                  {b.punkte.map((p, k) => (
                    <li key={k}>
                      <Inline text={p} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={i}>
                  <Inline text={b.text} />
                </p>
              ),
            )}
          </div>
        ))}
      </Seite>,
    );
  });
  // gerade Seitenzahl fuer den Druck (Doppelseiten)
  if (seiten.length % 2) seiten.push(<Seite key="leer" art="leer" />);

  return createPortal(
    <div className="buch-ebene">
      <div className="buch-leiste">
        <button
          type="button"
          className="sc-zurueck buch-zurueck"
          aria-label="Zurück"
          onClick={onSchliessen}
        >
          ‹
        </button>
        <span>{seiten.length} Seiten · 21 × 21 cm</span>
        <button
          type="button"
          className="sc-start"
          onClick={() => window.print()}
        >
          Drucken / PDF
        </button>
      </div>
      <div className="buch">{seiten}</div>
    </div>,
    document.body,
  );
}
