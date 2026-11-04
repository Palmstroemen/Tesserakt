// Das Horoskopbuch, 21 x 21 cm: Titelseite, Impressum, Leitsatz, Einleitung, je gewaehltem Horoskop (in der
// gewaehlten Reihenfolge) links die Grafik und rechts zweispaltige Textseiten, am Ende die Hintergrundseiten
// zum Experiment, die Quellen und als Rueckseite das Kaestchen. Das Spielergebnis kommt nicht ins Buch. Am
// Bildschirm als Vorschau (Seiten untereinander), beim Drucken eine Seite je Blatt (@page 210 x 210 mm). Die Grafiken sind dieselben
// Vektorgrafiken wie im Auge.
// Seitenumbruch: Die Texte bestehen aus Bausteinen (Ueberschrift, Absatz, ...). Ein Seitensetzer misst sie in
// einer unsichtbaren Musterseite und fuellt jede Seite, bis beide Spalten voll sind; ein zu langer Absatz wird
// zwischen zwei Saetzen geteilt, eine Ueberschrift bleibt nicht allein am Seitenende. Alle Groessen sind in
// cqw (relativ zur Seite), daher gilt der Umbruch der Vorschau auch fuer den Druck.
// Zwei Ausfuehrungen: hell (Papier) und dunkel (fast schwarz, helle Schrift, goldene Ueberschriften).
// Druckvorlagen fuer die Druckerei (in der Entwicklung oder mit ?druckvorlage in der Adresse): Innenteil ohne
// Rueckseite, aufgefuellt auf MINDESTSEITEN, jede Seite mit Beschnitt rundum; Umschlag als ein Bogen aus
// Rueckseite, Ruecken und Titelseite mit Rand (Einschlag und Beschnitt). Die Seiten selbst bleiben 210 mm gross
// und gleich gesetzt, nur ihr Hintergrund laeuft in den Rand weiter.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { holen } from "../logic/api";
import HoroskopIcon from "./HoroskopIcon";
import Datumsscheibe, { datumAus } from "./Datumsscheibe";
import { PAARBILD, VOLLBILD } from "./Ergebnisplatte";
import { SYSTEME, anzeigeName } from "./systeme";
import { buchtexte, t } from "../sprache";
import { datenErlaubt, kameraErlaubt } from "./einwilligung";
import Vorblatt from "./Vorblatt";
import deckelBild from "./kaestchen/deckel.webp";

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
const UEBERSCHRIFTEN = ["h2", "h3", "unter", "klein"];
const MINDESTSEITEN = 24; // kleinster Innenteil der Druckereien (Hardcover)
const VORLAGEN_WAEHLBAR =
  import.meta.env.DEV ||
  new URLSearchParams(window.location.search).has("druckvorlage");
const mm = (x) => `calc(${x} * var(--mm))`;

// --- Bausteine ---------------------------------------------------------------------------------------------
// { k: "h2" | "unter" | "klein" | "h3" | "p" | "schluss" | "li" | "rangliste", t, fett?, zeilen? }

// Absaetze aus einem Systemtext ([TAG]-Zeilen entfernt, Absaetze durch Leerzeilen)
function absaetze(text, k = "p") {
  if (!text) return [];
  return text
    .replace(/\n?\[TAG\]\s*\S+[^\n]*/g, "")
    .trim()
    .split(/\n\n+/)
    .filter(Boolean)
    .map((t) => ({ k, t }));
}

// Absatz zur Grafik mit eigener Ueberschrift, vor "So denkt dieses Horoskop"
function darstellung(bildtext) {
  return bildtext
    ? [{ k: "h3", t: t("buch.so_liest") }, ...absaetze(bildtext)]
    : [];
}

// Klare Hinweise aus dem Jahreshoroskop ("Was das für dich bedeutet")
function hinweise(saetze) {
  return saetze?.length
    ? [
        { k: "h3", t: t("buch.deutung") },
        ...saetze.map((x) => ({ k: "p", fett: x.zeit, t: x.text })),
      ]
    : [];
}

const escape = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fettHtml = (t) => escape(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

// HTML eines Bausteins fuer die Musterseite (muss der Darstellung in <Baustein> entsprechen)
function htmlVon(b) {
  const vor = b.fett ? `<b>${escape(b.fett)}</b> ` : "";
  switch (b.k) {
    case "h2":
      return `<h2>${escape(b.t)}</h2>`;
    case "h3":
      return `<h3>${escape(b.t)}</h3>`;
    case "unter":
      return `<p class="buch-unter">${escape(b.t)}</p>`;
    case "klein":
      return `<p class="buch-klein">${escape(b.t)}</p>`;
    case "schluss":
      return `<p class="buch-schluss">${fettHtml(b.t)}</p>`;
    case "li":
      return `<p class="buch-li">${fettHtml(b.t)}</p>`;
    case "rangliste":
      return `<table class="buch-rangliste"><tbody>${b.zeilen
        .map(
          (z) =>
            `<tr><td>${escape(z.name)}</td><td>${escape(z.wert)}</td></tr>`,
        )
        .join("")}</tbody></table>`;
    default:
      return `<p>${vor}${fettHtml(b.t)}</p>`;
  }
}

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

function Baustein({ b }) {
  switch (b.k) {
    case "h2":
      return <h2>{b.t}</h2>;
    case "h3":
      return <h3>{b.t}</h3>;
    case "unter":
      return <p className="buch-unter">{b.t}</p>;
    case "klein":
      return <p className="buch-klein">{b.t}</p>;
    case "schluss":
      return (
        <p className="buch-schluss">
          <Inline text={b.t} />
        </p>
      );
    case "li":
      return (
        <p className="buch-li">
          <Inline text={b.t} />
        </p>
      );
    case "rangliste":
      return (
        <table className="buch-rangliste">
          <tbody>
            {b.zeilen.map((z) => (
              <tr key={z.name} className={z.gewaehlt ? "gewaehlt" : ""}>
                <td>{z.name}</td>
                <td>{z.wert}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    default:
      return (
        <p>
          {b.fett ? <b>{b.fett}</b> : null}
          {b.fett ? " " : null}
          <Inline text={b.t} />
        </p>
      );
  }
}

// --- Seitensetzer ------------------------------------------------------------------------------------------
// Verteilt die Bausteine eines Abschnitts auf Seiten; el ist eine leere, unsichtbare Musterseite.
// Kein Schusterjunge (erste Zeile eines Absatzes allein am Seitenende) und kein Hurenkind (letzte Zeile allein
// oben auf der neuen Seite): ein geteilter Absatz behaelt auf beiden Seiten mindestens zwei Zeilen. Innerhalb
// einer Seite (Spaltenwechsel) sorgen orphans/widows im CSS dafuer.
function setzen(bloecke, el) {
  const voll = () =>
    el.scrollWidth > el.clientWidth + 1 ||
    el.scrollHeight > el.clientHeight + 1;
  // Zeilenzahl eines Bausteins, allein in der Musterseite gemessen
  const zeilen = (b) => {
    const alt = el.innerHTML;
    el.innerHTML = htmlVon(b);
    const z = el.firstElementChild;
    const n = Math.round(
      z.getBoundingClientRect().height /
        parseFloat(getComputedStyle(z).lineHeight),
    );
    el.innerHTML = alt;
    return n;
  };
  const seiten = [];
  let seite = [];
  el.innerHTML = "";
  const neueSeite = () => {
    // keine Ueberschrift allein am Seitenende
    const mit = [];
    while (seite.length && UEBERSCHRIFTEN.includes(seite[seite.length - 1].k))
      mit.unshift(seite.pop());
    if (seite.length) seiten.push(seite);
    seite = mit;
    el.innerHTML = seite.map(htmlVon).join("");
  };
  const rest = [...bloecke];
  while (rest.length) {
    const b = rest.shift();
    el.insertAdjacentHTML("beforeend", htmlVon(b));
    if (!voll()) {
      seite.push(b);
      continue;
    }
    el.lastElementChild.remove();
    // Absatz zwischen zwei Saetzen teilen: so viel wie passt auf diese Seite
    const saetze =
      b.t && !UEBERSCHRIFTEN.includes(b.k) && b.k !== "rangliste"
        ? (b.t.match(/[^.!?]+[.!?]+["“”)]*\s*|[^.!?]+$/g) ?? [])
        : [];
    let passt = 0;
    for (let n = saetze.length - 1; n > 0; n -= 1) {
      const vorne = { ...b, t: saetze.slice(0, n).join("").trim() };
      el.insertAdjacentHTML("beforeend", htmlVon(vorne));
      const ok = !voll();
      el.lastElementChild.remove();
      if (!ok) continue;
      // mindestens zwei Zeilen vorne (sonst hilft ein kuerzerer Teil auch nicht) und zwei hinten
      if (zeilen(vorne) < 2) break;
      if (
        zeilen({ ...b, fett: undefined, t: saetze.slice(n).join("").trim() }) >=
        2
      ) {
        passt = n;
        break;
      }
    }
    if (passt) {
      const teil = { ...b, t: saetze.slice(0, passt).join("").trim() };
      seite.push(teil);
      rest.unshift({
        ...b,
        fett: undefined,
        t: saetze.slice(passt).join("").trim(),
      });
      neueSeite();
    } else if (seite.length) {
      rest.unshift(b);
      neueSeite();
    } else {
      // passt nicht einmal allein: trotzdem setzen (sonst Endlosschleife)
      seite.push(b);
      el.insertAdjacentHTML("beforeend", htmlVon(b));
    }
  }
  if (seite.length) seiten.push(seite);
  el.innerHTML = "";
  return seiten;
}

// --- Seiten ------------------------------------------------------------------------------------------------
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

function bereichBloecke(st, dims) {
  return dims.flatMap((d) => {
    const zeilen = (st?.dimensions?.[d] ?? "")
      .replace(/\[TAG\][^\n]*/g, "")
      .split("\n")
      .map((z) => z.trim())
      .filter(Boolean);
    return zeilen.length
      ? [{ k: "p", fett: zeilen[0], t: zeilen.slice(1).join(" ") }]
      : [];
  });
}

// Abschnitte des Buchs: { art: "titel" | "grafik" | "text" | "horoskop-ende", id?, bloecke? }; jeder
// Textabschnitt beginnt auf einer neuen Seite.
function abschnitte({
  spiel,
  auswahl,
  paar,
  texte,
  ausblick,
  heute,
  erklaerungen,
  visualPayloads,
}) {
  const paarSpiel = spiel === "C";
  const liste = [{ art: "titel" }];
  liste.push({ art: "impressum" }, { art: "leitsatz" });
  liste.push({ art: "text", bloecke: buchtexte().EINLEITUNG });
  auswahl.forEach((id) => {
    const sys = SYSTEME.find((x) => x.id === id);
    const st = texte?.systems?.[id];
    const jahr = ausblick?.systeme?.[id];
    const deutung = ausblick?.deutung?.[id];
    const h = heute?.systeme?.[id];
    const bereiche = DIMENSIONEN.filter((dim) => st?.dimensions?.[dim]);
    liste.push({ art: "grafik", id });
    const kopf = [
      { k: "h2", t: anzeigeName(id) },
      ...(sys?.unter ? [{ k: "unter", t: sys.unter }] : []),
    ];
    const teile = paarSpiel
      ? [
          [
            ...kopf,
            { k: "h3", t: t("buch.euer_paar") },
            ...(paar?.systeme?.[id]?.aussagen ?? []).map((a) => ({
              k: "p",
              t: a,
            })),
          ],
          st?.intro
            ? [
                ...darstellung(paar?.systeme?.[id]?.bildtext),
                { k: "h3", t: t("buch.so_denkt") },
                ...absaetze(st.intro),
                ...hinweise(deutung),
                ...absaetze(st?.paracelsus_outro, "schluss"),
              ]
            : null,
        ]
      : [
          [
            ...kopf,
            ...darstellung(visualPayloads?.[id]?.bildtext),
            ...(st?.intro
              ? [{ k: "h3", t: t("buch.so_denkt") }, ...absaetze(st.intro)]
              : []),
          ],
          st?.horoskop_ausfuehrlich
            ? [
                { k: "h3", t: t("buch.dein_horoskop") },
                ...absaetze(st.horoskop_ausfuehrlich),
              ]
            : h
              ? [
                  { k: "h3", t: t("buch.heute") },
                  ...[...h.faktoren, ...h.tendenzen]
                    .filter(Boolean)
                    .map((x) => ({ k: "p", t: x })),
                ]
              : null,
          jahr?.length
            ? [
                { k: "h3", t: t("buch.dein_jahr") },
                ...jahr.map((e) => {
                  const k = e.text.indexOf(": ");
                  return {
                    k: "p",
                    fett: e.text.slice(0, k),
                    t: `– ${e.text.slice(k + 2)}`,
                  };
                }),
              ]
            : null,
          bereiche.length || deutung?.length
            ? [
                ...(bereiche.length
                  ? [
                      { k: "h3", t: t("buch.lebensbereiche") },
                      ...bereichBloecke(st, bereiche),
                    ]
                  : []),
                ...hinweise(deutung),
                ...absaetze(st?.paracelsus_outro, "schluss"),
              ]
            : null,
        ];
    teile
      .filter(Boolean)
      .forEach((bloecke) => liste.push({ art: "text", bloecke }));
    liste.push({ art: "horoskop-ende" });
  });
  erklaerungen.forEach((thema) => {
    liste.push({
      art: "text",
      bloecke: [
        { k: "h2", t: thema.titel },
        ...thema.abschnitte.flatMap((a) => [
          { k: "h3", t: a.titel },
          ...a.bloecke.flatMap((b) =>
            b.typ === "liste"
              ? b.punkte.map((p) => ({ k: "li", t: `• ${p}` }))
              : [{ k: "p", t: b.text }],
          ),
        ]),
      ],
    });
  });
  liste.push({ art: "text", bloecke: buchtexte().QUELLEN });
  return liste;
}

export default function Buch({
  spiel,
  auswahl,
  visualPayloads,
  paar,
  texte,
  ausblick,
  heute,
  titel,
  geburt,
  onSchliessen,
}) {
  const [erklaerungen, setErklaerungen] = useState([]);
  const [dunkel, setDunkel] = useState(false);
  const [gesetzt, setGesetzt] = useState(null); // Abschnitte mit fertig gesetzten Textseiten
  const [forschung, setForschung] = useState(datenErlaubt);
  const [vorblatt, setVorblatt] = useState(false);
  const [vorlage, setVorlage] = useState("vorschau"); // "vorschau" | "innen" | "umschlag"
  const [masse, setMasse] = useState({ beschnitt: 3, ruecken: 10, rand: 15 }); // in mm
  const muster = useRef(null);

  useEffect(() => {
    holen("/horoscope/erklaerungen")
      .then((r) => r.json())
      .then((d) => setErklaerungen(d.themen ?? []))
      .catch(() => {});
  }, []);

  const liste = abschnitte({
    spiel,
    auswahl,
    paar,
    texte,
    ausblick,
    heute,
    erklaerungen,
    visualPayloads,
  });
  const schluessel = JSON.stringify(liste);

  // Seiten setzen (nach dem Laden der Schriften und bei geaenderter Fensterbreite neu)
  useLayoutEffect(() => {
    let aus = false;
    const los = () => {
      const el = muster.current;
      if (!el || aus) return;
      setGesetzt(
        liste.map((a) =>
          a.art === "text" ? { ...a, seiten: setzen(a.bloecke, el) } : a,
        ),
      );
    };
    los();
    // Kursiv und fett laedt der Browser sonst erst beim ersten Gebrauch, nach dem Setzen
    Promise.all(
      ["400 1em", "italic 400 1em", "700 1em", "italic 700 1em"].map((f) =>
        document.fonts?.load(`${f} "Tesserakt Garamond"`),
      ),
    )
      .catch(() => {})
      .then(() => document.fonts?.ready)
      .then(los);
    window.addEventListener("resize", los);
    return () => {
      aus = true;
      window.removeEventListener("resize", los);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel]);

  const paarSpiel = spiel === "C";
  const datum = new Date().toLocaleDateString(t("intl.gebiet"), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const seiten = [];
  let nummer = 1;
  let imHoroskop = 0; // Seiten des laufenden Horoskops
  let quellenEnde = null; // nach den Quellen (letzter Abschnitt) steht die Einwilligung zur Forschung
  let titelseite = null;
  (gesetzt ?? []).forEach((a, i) => {
    if (a.art === "titel") {
      titelseite = (
        <Seite key="titel" art="titel">
          <div className="buch-titelzeichen">{t("buch.titelzeichen")}</div>
          <h1>{titel}</h1>
          {/* die Datumsscheibe des Apparats mit dem Geburtsdatum (bei Paaren Gold und Silber) */}
          {geburt?.a ? (
            <div className={geburt.b ? "buch-scheiben paar" : "buch-scheiben"}>
              <Datumsscheibe
                datum={datumAus(geburt.a.geburtsdatum, geburt.a.uhrzeit)}
                praefix="buch-a"
              />
              {geburt.b ? (
                <Datumsscheibe
                  datum={datumAus(geburt.b.geburtsdatum, geburt.b.uhrzeit)}
                  metall="silber"
                  praefix="buch-b"
                />
              ) : null}
            </div>
          ) : null}
          <div className="buch-titelicons">
            {auswahl.map((id) => (
              <svg key={id} viewBox="-12 -12 24 24" aria-hidden="true">
                <HoroskopIcon id={id} r={10} />
              </svg>
            ))}
          </div>
          <p className="buch-datum">{datum}</p>
        </Seite>
      );
      seiten.push(titelseite);
      nummer += 1;
    } else if (a.art === "impressum") {
      seiten.push(
        <Seite key="impressum" art="impressum">
          <p className="buch-impressum-titel">{titel}</p>
          {[geburt?.a, geburt?.b].filter(Boolean).map((g, k) => (
            <p key={k}>
              {t(g.uhrzeit ? "buch.geboren_um" : "buch.geboren_am", {
                datum: new Date(`${g.geburtsdatum}T12:00`).toLocaleDateString(
                  t("intl.gebiet"),
                  { day: "numeric", month: "long", year: "numeric" },
                ),
                uhrzeit: g.uhrzeit,
              })}
            </p>
          ))}
          <p>
            {t("buch.berechnet", { datum })}
            <br />
            {t(
              auswahl.length === 1
                ? "buch.enthaelt_eins"
                : "buch.enthaelt_mehrere",
              { liste: auswahl.map(anzeigeName).join(", ") },
            )}
          </p>
          <p>{t("buch.hinweis")}</p>
          <p>{t("buch.rechte", { jahr: new Date().getFullYear() })}</p>
        </Seite>,
      );
      nummer += 1;
    } else if (a.art === "leitsatz") {
      seiten.push(
        <Seite key="leitsatz" art="leitsatz">
          <blockquote>
            {buchtexte().LEITSATZ.map((z) => (
              <span key={z}>{z}</span>
            ))}
          </blockquote>
        </Seite>,
      );
      nummer += 1;
    } else if (a.art === "grafik") {
      // die Grafik steht immer links (gerade Seitenzahl): notfalls eine leere Seite davor
      if (nummer % 2)
        seiten.push(<Seite key={`v-${i}`} art="leer" nummer={nummer++} />);
      imHoroskop = 1;
      seiten.push(
        <Seite key={`g-${a.id}`} art="grafik" nummer={nummer++}>
          <div className="buch-grafik">
            <Grafik
              id={a.id}
              spiel={spiel}
              visualPayloads={visualPayloads}
              paar={paar}
            />
          </div>
          <div className="buch-bildunterschrift">{anzeigeName(a.id)}</div>
        </Seite>,
      );
    } else if (a.art === "text") {
      a.seiten.forEach((bloecke, s) => {
        if (imHoroskop) imHoroskop += 1;
        seiten.push(
          <Seite key={`t-${i}-${s}`} art="text" nummer={nummer++}>
            {bloecke.map((b, k) => (
              <Baustein key={k} b={b} />
            ))}
          </Seite>,
        );
      });
      if (i === gesetzt.length - 1) quellenEnde = seiten.length;
    } else if (a.art === "horoskop-ende") {
      // die naechste Grafik soll wieder links stehen: notfalls eine Notizseite
      if (imHoroskop % 2)
        seiten.push(
          <Seite key={`n-${i}`} art="notiz" nummer={nummer++}>
            <h3>{t("buch.notizen")}</h3>
          </Seite>,
        );
      imHoroskop = 0;
    }
  });
  // Rueckseite: das Kaestchen des Apparats; in der Vorschau die letzte Seite (die Seitenzahl bleibt gerade),
  // in der Druckvorlage auf dem Umschlag
  const rueckseite = (
    <Seite key="rueckseite" art="rueckseite">
      <div className="buch-kaestchen">
        <img src={deckelBild} alt={t("buch.kaestchen_bild")} />
      </div>
      <p className="buch-rueckseite-text">
        <span>{t("buch.titelzeichen")}</span>
        {t("buch.projekt")}
      </p>
    </Seite>
  );
  // Innenteil fuer die Druckerei: gerade Seitenzahl, mindestens MINDESTSEITEN, aufgefuellt mit Notizseiten
  const innen = [...seiten];
  while (innen.length < MINDESTSEITEN || innen.length % 2)
    innen.push(
      <Seite key={`f-${innen.length}`} art="notiz" nummer={nummer++}>
        <h3>{t("buch.notizen")}</h3>
      </Seite>,
    );
  if (seiten.length % 2 === 0) seiten.push(<Seite key="leer" art="leer" />);
  seiten.push(rueckseite);

  const { beschnitt, ruecken, rand } = masse;
  const massFeld = (name) => (
    <label className="buch-mass">
      {t(`buch.${name}`)}
      <input
        type="number"
        min="0"
        step="0.1"
        value={masse[name]}
        onChange={(e) =>
          setMasse((m) => ({ ...m, [name]: Number(e.target.value) || 0 }))
        }
      />
    </label>
  );
  // Bogengroesse fuer den Druck (eine Vorlage je PDF)
  const bogen =
    vorlage === "innen"
      ? [210 + 2 * beschnitt, 210 + 2 * beschnitt]
      : [420 + ruecken + 2 * rand, 210 + 2 * rand];

  return createPortal(
    <div
      className={`buch-ebene${dunkel ? " dunkel" : ""} vorlage-${vorlage}`}
      style={{
        "--beschnitt": mm(beschnitt),
        "--ruecken": mm(ruecken),
        "--rand": mm(rand),
      }}
    >
      {vorlage !== "vorschau" ? (
        <style>{`@media print { @page { size: ${bogen[0]}mm ${bogen[1]}mm; margin: 0; } }`}</style>
      ) : null}
      <div className="buch-leiste">
        <button
          type="button"
          className="sc-zurueck buch-zurueck"
          aria-label={t("buch.zurueck")}
          onClick={onSchliessen}
        >
          ‹
        </button>
        <span>
          {t("buch.seiten", {
            anzahl: vorlage === "vorschau" ? seiten.length : innen.length,
          })}
        </span>
        {VORLAGEN_WAEHLBAR ? (
          <span className="buch-vorlagen">
            <select
              className="buch-wahl"
              value={vorlage}
              onChange={(e) => setVorlage(e.target.value)}
            >
              {["vorschau", "innen", "umschlag"].map((v) => (
                <option key={v} value={v}>
                  {t(`buch.vorlage_${v}`)}
                </option>
              ))}
            </select>
            {vorlage === "innen" ? massFeld("beschnitt") : null}
            {vorlage === "umschlag" ? (
              <>
                {massFeld("ruecken")}
                {massFeld("rand")}
              </>
            ) : null}
          </span>
        ) : null}
        <button
          type="button"
          className="buch-wahl"
          onClick={() => setDunkel((x) => !x)}
        >
          {dunkel ? t("buch.hell") : t("buch.dunkel")}
        </button>
        <button
          type="button"
          className="sc-start"
          onClick={() => window.print()}
        >
          {t("buch.drucken")}
        </button>
      </div>
      {/* unsichtbare Musterseite fuer den Seitensetzer */}
      <div className="buch-muster" aria-hidden="true">
        <section className="buch-seite text" ref={muster} />
      </div>
      {vorlage === "innen" ? (
        <div className="buch">
          {innen.map((s) => (
            <div key={s.key} className={`buch-blatt ${s.props.art}`}>
              {s}
            </div>
          ))}
        </div>
      ) : null}
      {vorlage === "umschlag" ? (
        <div className="buch">
          <div className="buch-umschlag">
            <div className="buch-umschlag-teil hinten">{rueckseite}</div>
            <div className="buch-umschlag-ruecken">
              {ruecken >= 5 ? (
                <span>
                  <b>{t("buch.titelzeichen")}</b>
                  {titel}
                </span>
              ) : null}
            </div>
            <div className="buch-umschlag-teil vorne">{titelseite}</div>
          </div>
        </div>
      ) : null}
      {vorlage === "vorschau" ? (
      <div className="buch">
        {seiten.slice(0, quellenEnde ?? seiten.length)}
        {/* nur am Bildschirm, keine Buchseite */}
        {quellenEnde !== null ? (
          <div className="buch-einwilligung">
            <span>
              {forschung ? t("buch.forschung_ja") : t("buch.forschung_nein")}
            </span>
            <button
              type="button"
              className="vb-link"
              onClick={() => setVorblatt(true)}
            >
              {t("buch.forschung_aendern")}
            </button>
          </div>
        ) : null}
        {seiten.slice(quellenEnde ?? seiten.length)}
      </div>
      ) : null}
      {vorblatt ? (
        <div className="buch-vorblatt">
          <Vorblatt
            start="daten"
            kameraVorher={kameraErlaubt()}
            onFertig={(e) => {
              setForschung(e.daten);
              setVorblatt(false);
            }}
          />
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
