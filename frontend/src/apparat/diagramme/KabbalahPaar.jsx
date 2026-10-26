// Kabbalah fuer Paare (Spiel C): dieselbe gedruckte Buchseite wie KabbalahBuch, aber zwei Menschen haben
// darin gearbeitet. Du mit einem Goldstift, dein Gegenueber mit einem Graphitstift: jede Sephira
// schraffiert (in gekreuzter Richtung) und umkringelt, je eine Randnotiz in eigener Handschrift.
// Die Verbindung (backend/paar.py) ist eingezeichnet: direkter Pfad - beide haben ihn von ihrer Seite her
// bis zur Mitte ausgemalt und den Buchstaben umkringelt; gleiche Saeule - die Saeule zwischen beiden
// gestrichelt in beiden Farben nachgezogen; getrennt - jede Linie gestrichelt zur Mitte, nach Tiphereth.
import {
  KNOTEN,
  KREIS,
  M,
  Notiz,
  Seite,
  buchstabenOrt,
  kringel,
  schraffur,
  zickzack,
} from "./KabbalahBuch";
import { t } from "../../sprache";

const GOLD = "#b88a12";
const GRAPHIT = "#555c66";
const TIPHERETH = 6;

// Strecke zwischen zwei Sephiroth von Kreisrand zu Kreisrand
function strecke(a, b) {
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / l;
  const uy = (b.y - a.y) / l;
  return `M ${a.x + ux * (KREIS + 2)} ${a.y + uy * (KREIS + 2)} L ${b.x - ux * (KREIS + 2)} ${b.y - uy * (KREIS + 2)}`;
}

// Randnotizen beider Personen, je Seite von oben nach unten ohne Ueberlappung
function notizen(baumA, baumB, sa, sb) {
  const ZEILE = 11;
  const liste = [
    {
      wer: "a",
      seph: sa,
      baum: baumA,
      farbe: GOLD,
      name: t("diagramme.du_klammer"),
    },
    {
      wer: "b",
      seph: sb,
      baum: baumB,
      farbe: GRAPHIT,
      name: t("diagramme.gegenueber_klammer"),
    },
  ].map((n) => {
    const k = KNOTEN[n.seph];
    // Mittelsaeule: du rechts, dein Gegenueber links; dieselbe Sephira: beide Seiten
    let seite =
      k.x < M - 1
        ? "links"
        : k.x > M + 1
          ? "rechts"
          : n.wer === "a"
            ? "rechts"
            : "links";
    if (sa === sb) seite = n.wer === "a" ? "rechts" : "links";
    return {
      ...n,
      seite,
      zeilen: [n.baum?.notes?.sephira?.deutsch, n.name].filter(Boolean),
      wunsch: k.y + 30,
      ziel: {
        x: k.x + (seite === "links" ? -KREIS - 4 : KREIS + 4),
        y: k.y + (n.wer === "a" ? 3 : -3),
      },
    };
  });
  ["links", "rechts"].forEach((seite) => {
    let frei = 98;
    liste
      .filter((t) => t.seite === seite)
      .sort((x, y) => x.wunsch - y.wunsch)
      .forEach((t) => {
        const hoehe = (t.zeilen.length - 1) * ZEILE;
        t.y = Math.min(222 - hoehe / 2, Math.max(frei + hoehe / 2, t.wunsch));
        frei = t.y + hoehe / 2 + ZEILE + 6;
      });
  });
  return liste.map((t, i) => (
    <Notiz
      key={t.wer}
      zeilen={t.zeilen}
      farbe={t.farbe}
      seite={t.seite}
      y={t.y}
      ziel={t.ziel}
      saat={i + 1}
      klasse={t.wer === "a" ? "kb-notiz" : "kb-notiz kp-zweite-hand"}
    />
  ));
}

export default function KabbalahPaar({ daten }) {
  const baumA = daten?.baum?.a;
  const baumB = daten?.baum?.b;
  const [sa, sb] = daten?.sephiroth ?? [];
  if (!baumA || !KNOTEN[sa] || !KNOTEN[sb]) return null;
  const pfade = baumA.paths ?? [];
  const namen = Object.fromEntries(
    (baumA.sephirothList ?? []).map((s) => [s.number, s.name]),
  );
  const art = daten.art;
  const A = KNOTEN[sa];
  const B = KNOTEN[sb];
  const pfad =
    art === "pfad"
      ? pfade.find(
          (p) =>
            (p.from === sa && p.to === sb) || (p.from === sb && p.to === sa),
        )
      : null;
  const laenge = Math.hypot(B.x - A.x, B.y - A.y);

  return (
    <svg
      viewBox="0 0 300 300"
      className="kb"
      role="img"
      aria-label={t("diagramme.kabbalah.paar", {
        a: namen[sa] ?? "",
        b: namen[sb] ?? "",
      })}
    >
      <Seite pfade={pfade} namen={namen} />

      {/* Farbstift ueber dem Druck: Schraffuren, Pfad, Saeule, Wege zur Mitte */}
      <g
        filter="url(#kb-stift)"
        className="kb-stift"
        style={{ mixBlendMode: "multiply" }}
      >
        <path d={schraffur(A.x, A.y, KREIS - 2.5, 3)} stroke={GOLD} />
        <path d={schraffur(B.x, B.y, KREIS - 2.5, 4, -1)} stroke={GRAPHIT} />
        {pfad ? (
          <>
            {/* jede Seite malt von ihrer Sephira bis zur Mitte */}
            <path d={zickzack(A, B, 7, KREIS + 1, laenge / 2)} stroke={GOLD} />
            <path
              d={zickzack(B, A, 9, KREIS + 1, laenge / 2)}
              stroke={GRAPHIT}
            />
          </>
        ) : null}
        {art === "saeule" ? (
          <>
            <path d={strecke(A, B)} stroke={GOLD} className="kp-strich" />
            <path
              d={strecke(A, B)}
              stroke={GRAPHIT}
              className="kp-strich versetzt"
            />
          </>
        ) : null}
        {art === "getrennt" ? (
          <>
            <path
              d={strecke(A, KNOTEN[TIPHERETH])}
              stroke={GOLD}
              className="kp-strich"
            />
            <path
              d={strecke(B, KNOTEN[TIPHERETH])}
              stroke={GRAPHIT}
              className="kp-strich"
            />
            {/* Tiphereth, die Mitte, in beiden Farben gestrichelt umkreist */}
            <circle
              cx={KNOTEN[TIPHERETH].x}
              cy={KNOTEN[TIPHERETH].y}
              r={KREIS + 5}
              fill="none"
              stroke={GOLD}
              className="kp-strich"
            />
            <circle
              cx={KNOTEN[TIPHERETH].x}
              cy={KNOTEN[TIPHERETH].y}
              r={KREIS + 5}
              fill="none"
              stroke={GRAPHIT}
              className="kp-strich versetzt"
            />
          </>
        ) : null}
      </g>

      {/* Kringel: um die Sephiroth, beim direkten Pfad auch um seinen Buchstaben */}
      <path
        d={kringel(A.x, A.y, KREIS + 3.5, 11)}
        stroke={GOLD}
        className="kb-kringel"
        filter="url(#kb-stift)"
      />
      <path
        d={kringel(B.x, B.y, KREIS + (sa === sb ? 7 : 3.5), 17)}
        stroke={GRAPHIT}
        className="kb-kringel"
        filter="url(#kb-stift)"
      />
      {pfad ? (
        <>
          <path
            d={kringel(buchstabenOrt(pfad).x, buchstabenOrt(pfad).y, 9, 23)}
            stroke={GOLD}
            className="kb-kringel"
            filter="url(#kb-stift)"
          />
          <path
            d={kringel(buchstabenOrt(pfad).x, buchstabenOrt(pfad).y, 11.5, 29)}
            stroke={GRAPHIT}
            className="kb-kringel"
            filter="url(#kb-stift)"
          />
        </>
      ) : null}

      {notizen(baumA, baumB, sa, sb)}
    </svg>
  );
}
