// Kabbalah im Auge: ein Teller aus getriebenem Silber. Der Baum des Lebens ist als Relief eingetrieben:
// Mulden fuer die zehn Sephiroth, Rinnen fuer die 22 Pfade (mit ihren hebraeischen Buchstaben aus
// kabbalah_pfade.json). Ein Studierteller zum Spielen: unten seitlich Aufbewahrungsmulden mit unbenutzten
// Edelsteinen, ein Perlrand, die Flaeche leicht gehaemmert. Hervorhebung: ein nicht ganz runder, farbiger
// Edelstein liegt in der Mulde der aktiven Sephira, in die Rinne des aktiven Pfads ist farbiger Sand
// gestreut (bewusst kein Wein: Wein ist im Judentum Ritual). Keine religioesen Zeichen. Visuals.md 2.5.
//
// Technik: Das Relief wird als Hoehenkarte gezeichnet (Rot = Vertiefung, Gruen = Erhebung) und von einem
// SVG-Lichtfilter (feDiffuseLighting/feSpecularLighting) in Metall mit Licht und Schatten umgerechnet.
import { t } from "../../sprache";

const G = 300;
const M = G / 2;
const R = 55; // Sechseckradius = Abstand benachbarter Sephiroth
const OBEN = M - 2 * R - 4; // y von Kether: Baum (Kether..Malkuth = 4R) mittig
const MULDE = 15;
const RINNE = 8;

function ecke(winkel) {
  const w = ((winkel - 90) * Math.PI) / 180;
  return { x: M + R * Math.cos(w), y: OBEN + R + R * Math.sin(w) };
}
const S6 = ecke(180);
const KNOTEN = {
  1: ecke(0),
  2: ecke(60),
  3: ecke(300),
  4: ecke(120),
  5: ecke(240),
  6: S6,
  7: { x: ecke(120).x, y: ecke(120).y + R },
  8: { x: ecke(240).x, y: ecke(240).y + R },
  9: { x: S6.x, y: S6.y + R },
  10: { x: S6.x, y: S6.y + 2 * R },
};

// Lage des Buchstabens auf dem Pfad: meist die Mitte; Kether-Tiphereth kreuzt zwei Querpfade, die
// Seitenpfade Chesed-Netzach und Geburah-Hod liegen auf Hoehe des Namens Tiphereth
function lageBuchstabe(p) {
  if (p.from === 1 && p.to === 6) return 0.3;
  if ((p.from === 4 && p.to === 7) || (p.from === 5 && p.to === 8)) return 0.36;
  return 0.5;
}

// Farben der Sephiroth nach der "Koeniginnen-Skala" (Golden Dawn, Crowley 777)
const STEIN = {
  1: ["#ffffff", "#c9d6f2"], // Kether: weisser Glanz (Diamant)
  2: ["#e0e4ea", "#6f7987"], // Chokmah: grau
  3: ["#6a6a8a", "#121219"], // Binah: schwarz
  4: ["#8fb2ff", "#1c3a9e"], // Chesed: blau
  5: ["#ff8a78", "#9a1016"], // Geburah: scharlachrot
  6: ["#ffe68a", "#b97d08"], // Tiphereth: gold
  7: ["#86f2b8", "#0b6e3e"], // Netzach: smaragdgruen
  8: ["#ffc68a", "#b84c0a"], // Hod: orange
  9: ["#cfa6ff", "#4f1d9a"], // Yesod: violett
  10: ["#e6c784", "#62431b"], // Malkuth: Zitrin/Olive/Rostbraun (vereinfacht)
};

// fester Zufall (gleiches Bild bei jedem Aufruf)
function zufallVon(saat) {
  let z = saat;
  return () => {
    z = (z * 1664525 + 1013904223) % 4294967296;
    return z / 4294967296;
  };
}

// Umriss einer von Hand getriebenen Mulde: nicht ganz rund
function muldenPfad(x, y, r, saat) {
  const zufall = zufallVon(saat);
  const punkte = Array.from({ length: 14 }, (_, i) => {
    const w = (i / 14) * Math.PI * 2;
    const rr = r * (0.95 + zufall() * 0.1);
    return [x + rr * Math.cos(w), y + rr * Math.sin(w)];
  });
  const mitte = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${mitte(punkte[punkte.length - 1], punkte[0]).join(" ")} `;
  punkte.forEach((p, i) => {
    d += `Q ${p.join(" ")} ${mitte(p, punkte[(i + 1) % punkte.length]).join(" ")} `;
  });
  return `${d}Z`;
}

// hebraeische Zahlzeichen der Sephiroth (1 = Aleph ... 10 = Jod)
const ZAHLZEICHEN = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י"];

// nicht ganz runder Cabochon: leicht unregelmaessiger Umriss, Glanz, Schatten in der Mulde
function Edelstein({ x, y, r, nummer, id }) {
  const [hell, dunkel] = STEIN[nummer] ?? STEIN[6];
  const zufall = zufallVon(nummer * 7919 + Math.round(r * 10));
  const punkte = Array.from({ length: 11 }, (_, i) => {
    const w = (i / 11) * Math.PI * 2;
    const rr = r * (0.9 + zufall() * 0.18);
    return [x + rr * Math.cos(w), y + rr * 0.94 * Math.sin(w)];
  });
  // weich gerundeter Umriss durch Mittelpunkte zwischen den Ecken
  const mitte = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${mitte(punkte[punkte.length - 1], punkte[0]).join(" ")} `;
  punkte.forEach((p, i) => {
    d += `Q ${p.join(" ")} ${mitte(p, punkte[(i + 1) % punkte.length]).join(" ")} `;
  });
  return (
    <g>
      <defs>
        <radialGradient id={id} cx="36%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.2" stopColor={hell} />
          <stop offset="0.75" stopColor={dunkel} />
          <stop offset="1" stopColor={dunkel} />
        </radialGradient>
      </defs>
      <ellipse
        cx={x + 1.2}
        cy={y + 1.8}
        rx={r * 1.02}
        ry={r * 0.95}
        fill="#1d2126"
        opacity="0.45"
      />
      <path d={`${d}Z`} fill={`url(#${id})`} />
      <ellipse
        cx={x - r * 0.33}
        cy={y - r * 0.36}
        rx={r * 0.32}
        ry={r * 0.17}
        fill="#fff"
        opacity="0.8"
        transform={`rotate(-28 ${x - r * 0.33} ${y - r * 0.36})`}
      />
      <ellipse
        cx={x + r * 0.35}
        cy={y + r * 0.42}
        rx={r * 0.2}
        ry={r * 0.08}
        fill="#fff"
        opacity="0.25"
        transform={`rotate(-28 ${x + r * 0.35} ${y + r * 0.42})`}
      />
    </g>
  );
}

// Aufbewahrungsmulden unten links und rechts (Bildschirmwinkel, Radius 113)
const ABLAGE = [155, 140, 125, 55, 40, 25].map((grad) => {
  const w = (grad * Math.PI) / 180;
  return { x: M + 113 * Math.cos(w), y: M + 113 * Math.sin(w) };
});
const ABLAGE_R = 8.5;

// gestreuter Sand in der Rinne: viele feine Koerner, in der Mitte etwas breiter (fester Zufall)
function Sand({ a, b, farbe }) {
  const zufall = zufallVon(4242);
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / l;
  const uy = (b.y - a.y) / l;
  const koerner = Array.from({ length: Math.round(l * 3.2) }, () => {
    const t = zufall();
    const quer =
      (zufall() - 0.5) * (RINNE - 2.6) * (0.75 + 0.25 * Math.sin(t * Math.PI));
    const ton = zufall();
    return {
      x: a.x + ux * t * l - uy * quer,
      y: a.y + uy * t * l + ux * quer,
      r: 0.35 + zufall() * 0.55,
      f: ton < 0.55 ? farbe[1] : ton < 0.85 ? farbe[0] : "#fffbe8",
    };
  });
  return (
    <g>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={farbe[1]}
        strokeWidth={RINNE - 3.2}
        strokeLinecap="round"
        opacity="0.55"
      />
      {koerner.map((k, i) => (
        <circle key={i} cx={k.x} cy={k.y} r={k.r} fill={k.f} />
      ))}
    </g>
  );
}

const PERLEN = Array.from({ length: 64 }, (_, i) => {
  const w = (i / 64) * Math.PI * 2;
  return { x: M + 134 * Math.cos(w), y: M + 134 * Math.sin(w) };
});

export default function KabbalahSilber({ payload }) {
  if (!payload || payload.chartType !== "kabbalahTree") return null;
  const aktiv = payload.activeSephira?.number;
  const pfad = payload.activePath;
  const namen = Object.fromEntries(
    (payload.sephirothList ?? []).map((s) => [s.number, s.name]),
  );
  const pfade = payload.paths ?? [];
  const farbe = STEIN[aktiv] ?? STEIN[6];

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="ks"
      role="img"
      aria-label={t("diagramme.kabbalah.bild", { name: namen[aktiv] ?? "" })}
    >
      <defs>
        <radialGradient id="ks-woelbung" cx="42%" cy="38%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#d4dae1" />
          <stop offset="1" stopColor="#8d959e" />
        </radialGradient>
        <clipPath id="ks-teller">
          <circle cx={M} cy={M} r={G / 2} />
        </clipPath>
        {/* Tiefenprofil einer Kugelkalotte (Rot = Tiefe): in der Mitte am tiefsten, zum Rand auslaufend */}
        <radialGradient id="ks-kalotte">
          <stop offset="0" stopColor="rgb(255,0,0)" />
          <stop offset="0.5" stopColor="rgb(221,0,0)" />
          <stop offset="0.7" stopColor="rgb(181,0,0)" />
          <stop offset="0.85" stopColor="rgb(135,0,0)" />
          <stop offset="0.95" stopColor="rgb(80,0,0)" />
          <stop offset="1" stopColor="rgb(0,0,0)" />
        </radialGradient>
        {/* Hoehenkarte -> getriebenes Silber */}
        <filter
          id="ks-treibarbeit"
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="1.3"
            result="weich"
          />
          {/* Relief: 0.5 + 0.5 * Gruen (Erhebung) - 0.62 * Rot (Vertiefung, Mulden als Kugelkalotten) */}
          <feColorMatrix
            in="weich"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -0.62 0.5 0 0 0.5"
            result="reliefWeich"
          />
          {/* Gravur: Blau, nur leicht weichgezeichnet, damit Buchstaben scharf eingeschnitten bleiben */}
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation="0.45"
            result="scharf"
          />
          <feColorMatrix
            in="scharf"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0.3 0 0"
            result="gravurTiefe"
          />
          <feComposite
            in="reliefWeich"
            in2="gravurTiefe"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="-1"
            k4="0"
            result="relief"
          />
          {/* gehaemmerte Flaeche: feine Dellen */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.22"
            numOctaves="2"
            seed="4"
            result="dellen"
          />
          <feColorMatrix
            in="dellen"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.022 0 0 0 0"
            result="dellenAlpha"
          />
          <feComposite
            in="relief"
            in2="dellenAlpha"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="-0.011"
            result="hoehe"
          />
          <feDiffuseLighting
            in="hoehe"
            surfaceScale="9"
            diffuseConstant="1.05"
            lightingColor="#eef1f5"
            result="licht"
          >
            <feDistantLight azimuth="225" elevation="48" />
          </feDiffuseLighting>
          <feSpecularLighting
            in="hoehe"
            surfaceScale="9"
            specularConstant="0.85"
            specularExponent="24"
            lightingColor="#ffffff"
            result="glanz"
          >
            <feDistantLight azimuth="225" elevation="48" />
          </feSpecularLighting>
          <feComposite
            in="glanz"
            in2="SourceAlpha"
            operator="in"
            result="glanzIn"
          />
          <feComposite
            in="licht"
            in2="glanzIn"
            operator="arithmetic"
            k1="0"
            k2="0.92"
            k3="0.9"
            k4="0"
          />
        </filter>
      </defs>

      <g clipPath="url(#ks-teller)">
        {/* Relief als Hoehenkarte, vom Lichtfilter in Silber verwandelt */}
        <g filter="url(#ks-treibarbeit)">
          <rect x="0" y="0" width={G} height={G} fill="#000" />
          {/* erhabener Rand und Perlrand */}
          <circle
            cx={M}
            cy={M}
            r={144}
            fill="none"
            stroke="#00ff00"
            strokeWidth="8"
          />
          {PERLEN.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.4" fill="#00ff00" />
          ))}
          {/* Aufbewahrungsmulden */}
          {ABLAGE.map((p, i) => (
            <path
              key={`ablage${i}`}
              d={muldenPfad(p.x, p.y, ABLAGE_R, 50 + i)}
              fill="url(#ks-kalotte)"
            />
          ))}
          {/* eingetriebene Rinnen (Halbrohr: aussen flacher, in der Mitte tiefer) */}
          {pfade.map((p) => {
            const a = KNOTEN[p.from];
            const b = KNOTEN[p.to];
            return (
              <g key={p.number}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="rgb(120,0,0)"
                  strokeWidth={RINNE + 1}
                  strokeLinecap="round"
                />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="rgb(200,0,0)"
                  strokeWidth={RINNE - 3.5}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
          {/* Mulden als Kugelkalotten */}
          {Object.entries(KNOTEN).map(([n, k]) => (
            <path
              key={n}
              d={muldenPfad(k.x, k.y, MULDE + 1, Number(n) * 13)}
              fill="url(#ks-kalotte)"
            />
          ))}
          {/* Gravuren (Blau-Kanal, zur Tiefe hinzugemischt): Pfadbuchstaben und Zahlzeichen am Muldenboden */}
          <g style={{ mixBlendMode: "screen" }} className="ks-gravur">
            {pfade.map((p) => {
              const a = KNOTEN[p.from];
              const b = KNOTEN[p.to];
              const t = lageBuchstabe(p);
              return (
                <text
                  key={`g${p.number}`}
                  x={a.x + (b.x - a.x) * t}
                  y={a.y + (b.y - a.y) * t}
                  dy="0.36em"
                  className="ks-gravur-buchstabe"
                >
                  {p.letter}
                </text>
              );
            })}
            {Object.entries(KNOTEN).map(([n, k]) => (
              <text
                key={`z${n}`}
                x={k.x}
                y={k.y}
                dy="0.36em"
                className="ks-gravur-zahl"
              >
                {ZAHLZEICHEN[Number(n) - 1]}
              </text>
            ))}
          </g>
        </g>
        {/* leichter Silberton und Woelbung des Tellers */}
        <circle cx={M} cy={M} r={G / 2} className="ks-toenung" />
      </g>

      {/* aktiver Pfad: farbiger Sand in die Rinne gestreut, nur zwischen den Mulden */}
      {pfad && KNOTEN[pfad.from] && KNOTEN[pfad.to]
        ? (() => {
            const a = KNOTEN[pfad.from];
            const b = KNOTEN[pfad.to];
            const l = Math.hypot(b.x - a.x, b.y - a.y);
            const k = MULDE - 1;
            const p1 = {
              x: a.x + ((b.x - a.x) / l) * k,
              y: a.y + ((b.y - a.y) / l) * k,
            };
            const p2 = {
              x: b.x - ((b.x - a.x) / l) * k,
              y: b.y - ((b.y - a.y) / l) * k,
            };
            return <Sand a={p1} b={p2} farbe={farbe} />;
          })()
        : null}

      {/* unbenutzte Edelsteine in vier der sechs Aufbewahrungsmulden (nicht die Farbe des aktiven) */}
      {[1, 4, 5, 7, 9, 3]
        .filter((n) => n !== aktiv)
        .slice(0, 4)
        .map((n, i) => {
          const p = ABLAGE[[0, 2, 3, 4][i]];
          return (
            <Edelstein
              key={`vorrat${n}`}
              x={p.x}
              y={p.y}
              r={ABLAGE_R - 1.8}
              nummer={n}
              id={`ks-vorrat-${n}`}
            />
          );
        })}

      {/* Patina in den Gravuren (macht sie lesbar), Lage wie im Relief */}
      <g className="ks-patina">
        {pfade.map((p) => {
          const a = KNOTEN[p.from];
          const b = KNOTEN[p.to];
          const t = lageBuchstabe(p);
          return (
            <text
              key={`p${p.number}`}
              x={a.x + (b.x - a.x) * t}
              y={a.y + (b.y - a.y) * t}
              dy="0.36em"
              className="ks-gravur-buchstabe"
            >
              {p.letter}
            </text>
          );
        })}
        {Object.entries(KNOTEN).map(([n, k]) => (
          <text
            key={`pz${n}`}
            x={k.x}
            y={k.y}
            dy="0.36em"
            className="ks-gravur-zahl"
          >
            {ZAHLZEICHEN[Number(n) - 1]}
          </text>
        ))}
      </g>

      {/* Edelstein in der Mulde der aktiven Sephira */}
      {aktiv && KNOTEN[aktiv] ? (
        <Edelstein
          x={KNOTEN[aktiv].x}
          y={KNOTEN[aktiv].y}
          r={MULDE - 3.5}
          nummer={aktiv}
          id="ks-stein-sephira"
        />
      ) : null}
    </svg>
  );
}
