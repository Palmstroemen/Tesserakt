// Schlitze der Horoskop-Schieber als runde Balkenanzeige: links vom Knopf ist das Muster des Horoskops frei
// gelegt (wie in seiner Ergebnisgrafik), rechts deckt ein goldenes, ziseliertes Plaettchen mit gepraegter
// Wellenlinie den Schlitz ab; es haengt am Knopf und gleitet mit ihm. Bei den Paarfragen (Spiel C) wird von
// der Mitte aus frei gelegt (zwei Plaettchen, links und rechts). Schatten an der Oberkante geben Tiefe.
// Muster werden entlang des Bogens erzeugt: s = Weg entlang des Schlitzes, v = quer dazu.
import { useMemo } from "react";
import { bogenPfad, punktU, uAusWert } from "./geometrie";

function zufallVon(saat) {
  let z = saat;
  return () => {
    z = (z * 1664525 + 1013904223) % 4294967296;
    return z / 4294967296;
  };
}

// Werkzeug je Schlitz: Punkt aus (s, v), Linie entlang s, Laenge
function werkzeug(r, theta) {
  const laenge = 2 * theta * r;
  const pt = (s, v) => punktU(r + v, s / laenge, theta);
  const linie = (punkte) =>
    punkte
      .map(([s, v], i) => {
        const p = pt(s, v);
        return `${i ? "L" : "M"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      })
      .join(" ");
  return { laenge, pt, linie };
}

// Punkte entlang des Bogens im Abstand v von der Mitte (damit Linien der Kruemmung folgen, nicht als Sehne)
function entlang(sVon, sBis, v, schritt = 2) {
  const n = Math.max(1, Math.ceil((sBis - sVon) / schritt));
  return Array.from({ length: n + 1 }, (_, i) => [
    sVon + ((sBis - sVon) * i) / n,
    v,
  ]);
}

// Muster je Horoskop: Grundfarbe und Zeichnung (in Farben der Ergebnisgrafiken)
function muster(id, r, theta, w) {
  const { laenge, pt, linie } = werkzeug(r, theta);
  const L = laenge + w; // ueber die runden Enden hinaus
  const s0 = -w / 2;
  const z = zufallVon(id.length * 977 + Math.round(r));
  const teile = [];
  let grund = "#555";
  switch (id) {
    case "Westlich": {
      grund = "#22113f";
      for (let s = s0; s < L; s += 3.2) {
        const p = pt(s + z() * 3, (z() - 0.5) * w * 0.9);
        teile.push(
          <circle
            key={s}
            cx={p.x}
            cy={p.y}
            r={0.25 + z() * 0.7}
            fill="#fff6e0"
            opacity={0.45 + z() * 0.5}
          />,
        );
      }
      ["#ffd56b", "#86ffb5", "#ff6450", "#9fe7ff"].forEach((f, i) => {
        const p = pt(laenge * (0.18 + i * 0.22), (z() - 0.5) * w * 0.4);
        teile.push(
          <circle key={`p${i}`} cx={p.x} cy={p.y} r={w * 0.07} fill={f} />,
        );
      });
      break;
    }
    case "Hellenistisch": {
      grund = "#c46a36";
      const T = w * 0.95;
      const haken = [
        [0, 0],
        [0, 3.4],
        [3, 3.4],
        [3, 0.9],
        [1.1, 0.9],
        [1.1, 2.3],
        [2, 2.3],
      ];
      for (let s = s0; s < L; s += T)
        teile.push(
          <path
            key={s}
            d={linie(
              haken.map(([a, b]) => [
                s + (a / 4) * T,
                -w * 0.33 + (b / 4) * w * 0.66 * 1.15,
              ]),
            )}
            fill="none"
            stroke="#17100c"
            strokeWidth={w * 0.07}
          />,
        );
      [-1, 1].forEach((k) =>
        teile.push(
          <path
            key={`r${k}`}
            d={linie(entlang(s0, L, k * w * 0.42))}
            fill="none"
            stroke="#17100c"
            strokeWidth={w * 0.05}
          />,
        ),
      );
      break;
    }
    case "Bazi": {
      grund = "#b2241b";
      const T = w * 0.75;
      const zack = [];
      for (let s = s0, k = 0; s < L; s += T / 2, k += 1)
        zack.push([s, (k % 2 ? 1 : -1) * w * 0.27]);
      teile.push(
        <path
          key="z"
          d={linie(zack)}
          fill="none"
          stroke="#f3cf6e"
          strokeWidth={w * 0.09}
          strokeLinejoin="round"
        />,
      );
      zack.forEach(([s, v], i) => {
        const p = pt(s + T / 4, -Math.sign(v || 1) * w * 0.25);
        teile.push(
          <circle
            key={`d${i}`}
            cx={p.x}
            cy={p.y}
            r={w * 0.05}
            fill="#f3cf6e"
            opacity="0.85"
          />,
        );
      });
      break;
    }
    case "Vedisch": {
      grund = "#3a2a20";
      const farben = ["#f6c21c", "#e2432b", "#2fa84f", "#3b6fd6", "#e0569a"];
      for (let s = s0, i = 0; s < L; s += w * 0.35, i += 1)
        [-1, 1].forEach((k) => {
          const p = pt(s, k * w * 0.36);
          teile.push(
            <circle
              key={`${s}${k}`}
              cx={p.x}
              cy={p.y}
              r={w * 0.05}
              fill="#f0eadb"
              opacity="0.9"
            />,
          );
        });
      for (let s = s0 + w * 0.4, i = 0; s < L; s += w * 0.85, i += 1) {
        const p = pt(s, 0);
        teile.push(
          <g key={`b${i}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={w * 0.2}
              fill={farben[i % farben.length]}
              opacity="0.9"
            />
            <circle cx={p.x} cy={p.y} r={w * 0.05} fill="#f0eadb" />
          </g>,
        );
      }
      break;
    }
    case "Arabisch": {
      grund = "#efe9da";
      const d = w * 0.3;
      for (let s = s0, i = 0; s < L; s += w * 0.7, i += 1)
        teile.push(
          <path
            key={s}
            d={`${linie([
              [s - d, 0],
              [s, -d],
              [s + d, 0],
              [s, d],
            ])} Z`}
            fill={i % 2 ? "#1f4fa3" : "#2aa69b"}
          />,
        );
      break;
    }
    case "Kabbalah": {
      grund = "#efdcae";
      [-1, 1].forEach((k) =>
        teile.push(
          <path
            key={`l${k}`}
            d={linie(entlang(s0, L, k * w * 0.12))}
            fill="none"
            stroke="#5a3d22"
            strokeWidth={w * 0.05}
          />,
        ),
      );
      for (let s = s0 + w * 0.5; s < L; s += w * 1.3) {
        const p = pt(s, 0);
        teile.push(
          <circle
            key={s}
            cx={p.x}
            cy={p.y}
            r={w * 0.2}
            fill="#efdcae"
            stroke="#2d1f12"
            strokeWidth={w * 0.06}
          />,
        );
      }
      break;
    }
    case "Numerologie": {
      grund = "#fbfaf4";
      const g = w / 3.5;
      for (let s = s0; s < L; s += g)
        teile.push(
          <path
            key={`q${s}`}
            d={linie([
              [s, -w / 2],
              [s, w / 2],
            ])}
            stroke="#9fb6d6"
            strokeWidth="0.4"
            fill="none"
          />,
        );
      for (let v = -w / 2 + g / 2; v < w / 2; v += g)
        teile.push(
          <path
            key={`l${v}`}
            d={linie(entlang(s0, L, v))}
            stroke="#9fb6d6"
            strokeWidth="0.4"
            fill="none"
          />,
        );
      break;
    }
    default:
      break;
  }
  return { grund, teile };
}

// goldenes Plaettchen zwischen u-Werten von..bis; Welle und Kanten am Anker (dort sitzt der Knopf)
function Goldplatte({ r, theta, w, von, bis, anker }) {
  const { laenge, linie } = werkzeug(r, theta);
  const sVon = von * laenge;
  const sBis = bis * laenge;
  if (sBis - sVon < 0.5) return null;
  const sAnker = anker * laenge;
  const P = w * 1.1;
  const A = w * 0.2;
  const welle = [];
  for (let s = sVon; s <= sBis; s += 1.2)
    welle.push([s, A * Math.sin((2 * Math.PI * (s - sAnker)) / P)]);
  const kante = (s, v1, v2) =>
    linie([
      [s, v1],
      [s, v2],
    ]);
  return (
    <g>
      <path
        d={linie(entlang(sVon, sBis, 0))}
        stroke="url(#sp-gold)"
        strokeWidth={w + 6}
        fill="none"
      />
      {/* Ziselierung: Rillen nahe den Raendern und die gepraegte Welle (Schatten unten, Licht oben) */}
      {[-1, 1].map((k) => (
        <g key={k}>
          <path
            d={linie(welle.map(([s]) => [s, k * w * 0.36 + 0.4]))}
            stroke="#6b4a14"
            strokeWidth={w * 0.05}
            fill="none"
            opacity="0.7"
          />
          <path
            d={linie(welle.map(([s]) => [s, k * w * 0.36 - 0.3]))}
            stroke="#fff1c4"
            strokeWidth={w * 0.035}
            fill="none"
            opacity="0.8"
          />
        </g>
      ))}
      <path
        d={linie(welle.map(([s, v]) => [s, v + 0.5]))}
        stroke="#6b4a14"
        strokeWidth={w * 0.075}
        fill="none"
        opacity="0.75"
      />
      <path
        d={linie(welle.map(([s, v]) => [s, v - 0.35]))}
        stroke="#fff1c4"
        strokeWidth={w * 0.05}
        fill="none"
        opacity="0.85"
      />
      {/* Kanten des Plaettchens: Schatten auf das Muster, Lichtkante auf dem Gold */}
      {[sVon, sBis].map((s, i) =>
        s > -w / 2 && s < laenge + w / 2 ? (
          <g key={i}>
            <path
              d={kante(s + (i ? 1.2 : -1.2), -w / 2, w / 2)}
              stroke="#000"
              strokeWidth="2.6"
              opacity="0.35"
            />
            <path
              d={kante(s + (i ? -0.5 : 0.5), -w / 2, w / 2)}
              stroke="#fff1c4"
              strokeWidth="0.8"
              opacity="0.8"
            />
          </g>
        ) : null,
      )}
    </g>
  );
}

// Farbverlauf fuer das Gold (einmal in <defs> der Spielplatte)
export function SchlitzDefs() {
  return (
    <linearGradient id="sp-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#f6dc9c" />
      <stop offset="0.5" stopColor="#d4a84f" />
      <stop offset="1" stopColor="#8f6a28" />
    </linearGradient>
  );
}

export default function Schlitz({
  id,
  k,
  r,
  theta,
  w,
  u,
  vonMitte = false,
  hoehe,
}) {
  const { grund, teile } = useMemo(
    () => muster(id, r, theta, w),
    [id, r, theta, w],
  );
  const RAND = (w / (2 * theta * r)) * 0.6; // ueber die runden Enden hinaus
  const mitte = uAusWert(0);
  let platten;
  if (!vonMitte) platten = [{ von: u, bis: 1 + RAND, anker: u }];
  else if (u < 0.12) platten = [{ von: -RAND, bis: 1 + RAND, anker: u }];
  else {
    const lo = Math.min(u, mitte);
    const hi = Math.max(u, mitte);
    platten = [
      { von: -RAND, bis: lo, anker: lo },
      { von: hi, bis: 1 + RAND, anker: hi },
    ];
  }
  return (
    <g>
      <mask
        id={`sp-sm-${k}`}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="400"
        height={hoehe}
      >
        <path
          d={bogenPfad(r, theta)}
          stroke="#fff"
          strokeWidth={w}
          strokeLinecap="round"
          fill="none"
        />
      </mask>
      <g mask={`url(#sp-sm-${k})`}>
        <path
          d={bogenPfad(r, theta)}
          stroke={grund}
          strokeWidth={w + 2}
          strokeLinecap="round"
          fill="none"
        />
        {teile}
        {platten.map((p, i) => (
          <Goldplatte key={i} r={r} theta={theta} w={w} {...p} />
        ))}
        {/* Tiefe: Schatten an der oberen (inneren) Kante, feine Lichtkante unten */}
        <path
          d={bogenPfad(r - w / 2 + 1.3, theta)}
          stroke="#000"
          strokeWidth="2.6"
          opacity="0.5"
          fill="none"
        />
        <path
          d={bogenPfad(r - w / 2 + 3.6, theta)}
          stroke="#000"
          strokeWidth="2.6"
          opacity="0.18"
          fill="none"
        />
        <path
          d={bogenPfad(r + w / 2 - 0.6, theta)}
          stroke="#fff"
          strokeWidth="1"
          opacity="0.15"
          fill="none"
        />
      </g>
    </g>
  );
}
