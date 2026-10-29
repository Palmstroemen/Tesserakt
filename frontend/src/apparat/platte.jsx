import { useEffect, useId, useState } from "react";
import { MITTE, WALZENPLATTE, bogenPfad, plattePfad } from "./geometrie";
import kratzerBild from "./oberflaeche/kratzer.webp";
import abdrueckeBild from "./oberflaeche/abdruecke.webp";

// Messing der Drehscheibe, konzentrisch um ihren Mittelpunkt (hell am Auge, dunkler nach aussen): Dreht
// sich die Scheibe, bleibt das Licht stehen, und Faecher- und Walzenplatte sehen an jeder Stelle gleich aus.
export function PlattenVerlauf({ id, aussen }) {
  return (
    <radialGradient
      id={id}
      cx={MITTE.x}
      cy={MITTE.y}
      r={aussen}
      gradientUnits="userSpaceOnUse"
    >
      <stop offset="0.3" stopColor="#f0d394" />
      <stop offset="0.5" stopColor="#c9a462" />
      <stop offset="0.8" stopColor="#a5824a" />
      <stop offset="1" stopColor="#7d6035" />
    </radialGradient>
  );
}

// Knopf C der Datumsseite liegt rechts unten in der Ecke unter der Walzenplatte (Datumsrad.jsx: KNOEPFE); die
// Platte laesst ihn mit einer runden Ausnehmung frei, bis sie beim Drehen darueberfaehrt. Im Faecher sitzt
// die Ausnehmung dann rechts oben, um den Druckknopf.
// Messingknoepfe in den Ecken (Datumsseite A, B, C; im Faecher "‹" und Buch): so gross, wie es neben der
// Datumsscheibe geht (Rand 4 vom Bildrand, 3 Luft zur Scheibe)
export const KNOPF = { rand: 32, mitte: 24, ecke: 36 };
export const KNOPF_C = { x: 400 - KNOPF.ecke, y: 400 - KNOPF.ecke };
const KERBE = {
  r: Math.hypot(KNOPF_C.x - MITTE.x, KNOPF_C.y - MITTE.y),
  radius: KNOPF.rand + 6,
};

// Gebrauchsspuren auf Messing: eine grosse Platte mit Riefen und Kratzern (hell) und eine mit
// Fingerabdruecken und Schlieren (dunkel), aus der jedes Bauteil an seiner eigenen Stelle "ausgestanzt" wird
// (versatz, drehung). Die Bilder sind Graustufen und dienen als Maske (oberflaeche/QUELLEN.md).
// Fingerabdruecke nur dort, wo man hinfasst (stellen: [x, y, r]).
// Einheiten pro Kachel (1024 Bildpunkte): die Kratzer fein, die Fingerabdruecke in Lebensgroesse
const KACHEL = { kratzer: 260, abdruecke: 360 };
const WEIT = { x: -400, y: -400, width: 1200, height: 1600 };

export function Gebrauchsspuren({
  d,
  versatz = [0, 0],
  drehung = 0,
  stellen = [],
  kratzer = 0.28,
  abdruecke = 0.4,
}) {
  const id = useId().replace(/:/g, "");
  const muster = (name, bild) => (
    <pattern
      id={`${id}-${name}-muster`}
      patternUnits="userSpaceOnUse"
      width={KACHEL[name]}
      height={KACHEL[name]}
      patternTransform={`rotate(${drehung} ${MITTE.x} ${MITTE.y}) translate(${versatz[0]} ${versatz[1]})`}
    >
      <image
        href={bild}
        width={KACHEL[name]}
        height={KACHEL[name]}
        preserveAspectRatio="none"
      />
    </pattern>
  );
  return (
    <>
      <defs>
        {muster("kratzer", kratzerBild)}
        {muster("abdruecke", abdrueckeBild)}
        <mask id={`${id}-kratzer`} maskUnits="userSpaceOnUse" {...WEIT}>
          <rect {...WEIT} fill={`url(#${id}-kratzer-muster)`} />
        </mask>
        <radialGradient id={`${id}-stelle`}>
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-stellen`} maskUnits="userSpaceOnUse" {...WEIT}>
          {stellen.map(([x, y, r]) => (
            <circle
              key={`${x}-${y}`}
              cx={x}
              cy={y}
              r={r}
              fill={`url(#${id}-stelle)`}
            />
          ))}
        </mask>
        <mask id={`${id}-abdruecke`} maskUnits="userSpaceOnUse" {...WEIT}>
          <rect
            {...WEIT}
            fill={`url(#${id}-abdruecke-muster)`}
            mask={`url(#${id}-stellen)`}
          />
        </mask>
      </defs>
      <path
        d={d}
        fill="#ffe9b4"
        opacity={kratzer}
        mask={`url(#${id}-kratzer)`}
      />
      {stellen.length ? (
        <path
          d={d}
          fill="#24170a"
          opacity={abdruecke}
          mask={`url(#${id}-abdruecke)`}
        />
      ) : null}
    </>
  );
}

// Dieselben Spuren als fertig gerechnetes Bild, fuer Teile, die sich unter dem Finger drehen (Ringe der
// Datumsscheibe): Masken wuerden dort in jedem Bild neu gerechnet, das Bild wird nur mitgedreht. box ist der
// Ausschnitt in Einheiten, den das Bild abdeckt. Einmal je Teil gerechnet und behalten.
const DICHTE = 2; // Bildpunkte je Einheit (grosse Teile koennen weniger nehmen)
const getoent = new Map();
const fertig = new Map();

// Graustufen-Textur als Farbe mit Alphakanal (hell = deckend)
function getoentesBild(quelle, [r, g, b]) {
  const schluessel = `${quelle}|${r},${g},${b}`;
  if (!getoent.has(schluessel))
    getoent.set(
      schluessel,
      new Promise((ok, fehler) => {
        const bild = new Image();
        bild.onload = () => {
          const c = document.createElement("canvas");
          c.width = bild.width;
          c.height = bild.height;
          const k = c.getContext("2d");
          k.drawImage(bild, 0, 0);
          const daten = k.getImageData(0, 0, c.width, c.height);
          const p = daten.data;
          for (let i = 0; i < p.length; i += 4) {
            p[i + 3] = p[i];
            p[i] = r;
            p[i + 1] = g;
            p[i + 2] = b;
          }
          k.putImageData(daten, 0, 0);
          ok(c);
        };
        bild.onerror = fehler;
        bild.src = quelle;
      }),
    );
  return getoent.get(schluessel);
}

async function spurenRechnen({
  d,
  box,
  versatz,
  drehung,
  stellen,
  kratzer,
  abdruecke,
  dichte,
}) {
  const DICHTE = dichte;
  const [kr, ab] = await Promise.all([
    getoentesBild(kratzerBild, [255, 233, 180]),
    getoentesBild(abdrueckeBild, [36, 23, 10]),
  ]);
  const neu = () => {
    const c = document.createElement("canvas");
    c.width = Math.ceil(box.width * DICHTE);
    c.height = Math.ceil(box.height * DICHTE);
    const k = c.getContext("2d");
    k.setTransform(DICHTE, 0, 0, DICHTE, -box.x * DICHTE, -box.y * DICHTE);
    return [c, k];
  };
  // wie patternTransform in Gebrauchsspuren: um die Mitte gedreht, verschoben, auf die Kachelgroesse
  const muster = (k, bild, name) => {
    const m = k.createPattern(bild, "repeat");
    m.setTransform(
      new DOMMatrix()
        .translate(MITTE.x, MITTE.y)
        .rotate(drehung)
        .translate(-MITTE.x, -MITTE.y)
        .translate(versatz[0], versatz[1])
        .scale(KACHEL[name] / bild.width),
    );
    return m;
  };
  const [c, k] = neu();
  k.clip(new Path2D(d));
  k.globalAlpha = kratzer;
  k.fillStyle = muster(k, kr, "kratzer");
  k.fillRect(box.x, box.y, box.width, box.height);
  if (stellen.length) {
    // Fingerabdruecke nur an den Stellen: Muster, ausgeschnitten mit weichen Kreisen
    const [ci, ki] = neu();
    for (const [x, y, r] of stellen) {
      const v = ki.createRadialGradient(x, y, 0, x, y, r);
      v.addColorStop(0, "#fff");
      v.addColorStop(0.6, "rgba(255,255,255,0.7)");
      v.addColorStop(1, "rgba(255,255,255,0)");
      ki.fillStyle = v;
      ki.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    const [ca, ka] = neu();
    ka.fillStyle = muster(ka, ab, "abdruecke");
    ka.fillRect(box.x, box.y, box.width, box.height);
    ka.setTransform(1, 0, 0, 1, 0, 0);
    ka.globalCompositeOperation = "destination-in";
    ka.drawImage(ci, 0, 0);
    k.setTransform(1, 0, 0, 1, 0, 0);
    k.globalAlpha = abdruecke;
    k.drawImage(ca, 0, 0);
  }
  const blob = await new Promise((ok) => c.toBlob(ok, "image/png"));
  return URL.createObjectURL(blob);
}

export function SpurenBild({
  d,
  box,
  versatz = [0, 0],
  drehung = 0,
  stellen = [],
  kratzer = 0.28,
  abdruecke = 0.4,
  dichte = DICHTE,
}) {
  const schluessel = JSON.stringify([
    d,
    box,
    versatz,
    drehung,
    stellen,
    dichte,
  ]);
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let aus = false;
    if (!fertig.has(schluessel))
      fertig.set(
        schluessel,
        spurenRechnen({
          d,
          box,
          versatz,
          drehung,
          stellen,
          kratzer,
          abdruecke,
          dichte,
        }),
      );
    fertig
      .get(schluessel)
      .then((u) => !aus && setUrl(u))
      .catch(() => {});
    return () => {
      aus = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schluessel]);
  return url ? (
    <image
      href={url}
      x={box.x}
      y={box.y}
      width={box.width}
      height={box.height}
      preserveAspectRatio="none"
      // nur Zierde: das Bild ist quadratisch und wuerde mit seinen (durchsichtigen) Ecken Beruehrungen fuer
      // die Spielknoepfe darunter abfangen
      pointerEvents="none"
    />
  ) : null;
}

// Walzenplatte (Ortseingabe), unten um 6 Uhr; gleiche Radien wie die Faecherplatte. Fingerabdruecke dort, wo
// man beim Wischen ueber die Walzen hinfasst: unter dem Zeiger und an den Enden.
// Platte der Drehscheibe zwischen innen und aussen, von links bis rechts (Winkel ab 6 Uhr), ohne Umrisslinie:
// eine Fase, die oben (innen, zum Auge hin) das Licht faengt und nach aussen im Schatten liegt, und ein weicher
// Schatten auf die Grundplatte: zwei versetzte, durchscheinende Kopien der Form statt eines Filters (der wuerde
// bei jeder Bewegung auf der Platte neu gerechnet). Der Versatz liegt ausserhalb der Drehung (transform),
// damit der Schatten immer nach unten faellt. Gebrauchsspuren als fertiges Bild (spuren: versatz, drehung,
// stellen).
export function Platte({
  innen,
  aussen,
  links,
  rechts = links,
  kerbe = null,
  fuellung,
  transform,
  spuren,
}) {
  const id = useId().replace(/:/g, "");
  const d = plattePfad(innen, aussen, links, rechts, kerbe);
  const breiteste = Math.max(links, rechts);
  return (
    <g>
      {[
        [4, 0.12],
        [2, 0.22],
      ].map(([dy, deckung]) => (
        <g key={dy} transform={`translate(0 ${dy})`}>
          <path d={d} transform={transform} fill="#1a1006" opacity={deckung} />
        </g>
      ))}
      <defs>
        <radialGradient
          id={`${id}-fase`}
          cx={MITTE.x}
          cy={MITTE.y}
          r={aussen}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={innen / aussen} stopColor="#fbe7b4" />
          <stop offset={(innen + 60) / aussen} stopColor="#d9b571" />
          <stop offset="1" stopColor="#5e4626" />
        </radialGradient>
      </defs>
      <g transform={transform}>
        <path
          d={d}
          fill={fuellung}
          stroke={`url(#${id}-fase)`}
          strokeWidth="1.6"
        />
        <SpurenBild
          d={d}
          box={{
            x: MITTE.x - aussen * Math.sin(links),
            y: MITTE.y + innen * Math.cos(breiteste),
            width: aussen * (Math.sin(links) + Math.sin(rechts)),
            height: aussen - innen * Math.cos(breiteste),
          }}
          dichte={1.5}
          {...spuren}
        />
      </g>
    </g>
  );
}

// Walzenplatte (Ortseingabe), unten um 6 Uhr; gleiche Radien wie die Faecherplatte. Fingerabdruecke dort, wo
// man beim Wischen ueber die Walzen hinfasst: unter den Marken und an den Enden.
export function Walzenplatte({ innen, aussen, fuellung, transform }) {
  return (
    <Platte
      innen={innen}
      aussen={aussen}
      links={WALZENPLATTE}
      kerbe={KERBE}
      fuellung={fuellung}
      transform={transform}
      spuren={{
        versatz: [57, 131],
        drehung: -12,
        stellen: [
          [228, 545, 60],
          [95, 470, 45],
          [330, 585, 40],
        ],
      }}
    />
  );
}

// Kante eines Schlitzes in einer Platte (Bogen um die Mitte, Breite breite, ohne Umrisslinie): oben (innen)
// faellt die Fase vom Licht weg, unten (aussen) faengt sie es. Liegt unter dem, was im Schlitz zu sehen ist.
export function Schlitzkante({ r, theta, breite, fase = 2 }) {
  const id = useId().replace(/:/g, "");
  const innen = breite / 2;
  const aussen = innen + fase;
  return (
    <>
      <defs>
        <radialGradient
          id={`${id}-kante`}
          cx={MITTE.x}
          cy={MITTE.y}
          r={r + aussen}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={(r - aussen) / (r + aussen)} stopColor="#6e5129" />
          <stop offset={(r - innen) / (r + aussen)} stopColor="#8a6a38" />
          <stop offset={(r + innen) / (r + aussen)} stopColor="#e9cd8f" />
          <stop offset="1" stopColor="#fbe7b4" />
        </radialGradient>
      </defs>
      <path
        d={bogenPfad(r, theta)}
        fill="none"
        stroke={`url(#${id}-kante)`}
        strokeWidth={breite + 2 * fase}
        strokeLinecap="round"
      />
    </>
  );
}
