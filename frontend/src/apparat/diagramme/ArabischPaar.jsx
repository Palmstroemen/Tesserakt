// Arabisch fuer Paare (Spiel C): das Zellij-Rund mit zwei Firdaria-Ringen, denn die Reihenfolge der neun
// Perioden haengt bei jedem von Tag- oder Nachtgeburt ab. Aussen dein Ring (aktive Kachel in Blattgold),
// innen der deines Gegenuebers (aktive Kachel in Silber). Zwei Alhidaden zeigen die heutige Stelle im
// Zyklus: die lange goldene deine, die kuerzere silberne die deines Gegenuebers. Das Feld zwischen den
// Zeigern sagt, wie die beiden Herrscher zueinander stehen (backend/paar.py): Freunde - es glaenzt golden,
// Feinde - es bleibt matt und unglasiert, neutral - schlicht. Randskala alle 5 Jahre wie im Einzelbild.
import {
  KACHEL,
  OSTARABISCH,
  SKALA_FARBEN,
  T,
  p,
  pts,
  ton,
  zufallVon,
} from "./ArabischZellij";
import { t } from "../../sprache";

const G = 300;
const M = G / 2;
const R_SKALA = 140;
const RING_A = [104, 128];
const RING_B = [78, 100];
const R_FELD = 74;
const R_STERN = 50;
const R_STERN_INNEN = 28;

const winkelVon = (alter) => (alter / 75) * 360;

function segment(von, bis, [ri, ra]) {
  const gross = bis - von > 180 ? 1 : 0;
  const [a1, a2, i2, i1] = [p(ra, von), p(ra, bis), p(ri, bis), p(ri, von)];
  return `M ${a1} A ${ra} ${ra} 0 ${gross} 1 ${a2} L ${i2} A ${ri} ${ri} 0 ${gross} 0 ${i1} Z`;
}

// kuerzerer Bogen zwischen zwei Winkeln
function bogen(w1, w2) {
  let von = Math.min(w1, w2);
  let bis = Math.max(w1, w2);
  if (bis - von > 180) [von, bis] = [bis, von + 360];
  return [von, bis];
}

// Kreissektor im Feld zwischen zwei Winkeln
function sektor(w1, w2, r) {
  const [von, bis] = bogen(w1, w2);
  return `M ${M} ${M} L ${p(r, von)} A ${r} ${r} 0 0 1 ${p(r, bis)} Z`;
}

// Band am Feldrand zwischen zwei Winkeln (mindestens ein paar Grad, damit es bei engen Zeigern sichtbar ist)
function band(w1, w2, r) {
  let [von, bis] = bogen(w1, w2);
  if (bis - von < 8) [von, bis] = [(von + bis) / 2 - 4, (von + bis) / 2 + 4];
  return `M ${p(r, von)} A ${r} ${r} 0 0 1 ${p(r, bis)}`;
}

function Ring({ zyklus, ring, metall, gross, zufall }) {
  const aktiv = zyklus.currentPeriod;
  return (
    <>
      <g className="az-fugen">
        {(zyklus.periods ?? []).map((per, i) => {
          const istAktiv = aktiv && per.planet === aktiv.planet;
          return (
            <path
              key={per.planet}
              d={segment(winkelVon(per.startAge), winkelVon(per.endAge), ring)}
              fill={
                istAktiv ? `url(#ap-${metall})` : ton(KACHEL[i % 2], zufall())
              }
            />
          );
        })}
      </g>
      {(zyklus.periods ?? []).map((per) => {
        const [x, y] = p(
          (ring[0] + ring[1]) / 2,
          winkelVon((per.startAge + per.endAge) / 2),
        );
        const istAktiv = aktiv && per.planet === aktiv.planet;
        const schmal = per.endAge - per.startAge < 4;
        return (
          <text
            key={`z${per.planet}`}
            x={x}
            y={y}
            dy="0.36em"
            className={istAktiv ? "az-zeichen aktiv" : "az-zeichen"}
            fontSize={schmal ? gross * 0.7 : gross}
          >
            {(per.symbol || "·") + T}
          </text>
        );
      })}
    </>
  );
}

function Alhidade({ winkel, laenge, metall, breite }) {
  return (
    <g filter="url(#ap-schatten)" transform={`rotate(${winkel} ${M} ${M})`}>
      <polygon
        points={pts([
          [M, M - laenge],
          [M + breite, M - 18],
          [M + breite * 0.7, M + 22],
          [M - breite * 0.7, M + 22],
          [M - breite, M - 18],
        ])}
        fill={`url(#ap-${metall})`}
      />
    </g>
  );
}

export default function ArabischPaar({ daten }) {
  const za = daten?.zyklus?.a;
  const zb = daten?.zyklus?.b;
  if (!za || !zb) return null;
  const zufall = zufallVon(612);
  const wa = winkelVon(Number(za.cyclePosition ?? 0) % 75);
  const wb = winkelVon(Number(zb.cyclePosition ?? 0) % 75);
  const art = daten.art;

  // zwoelfzackiger Stern im Feld (wie im Einzelbild, kleiner)
  const spitzen = Array.from({ length: 12 }, (_, k) => p(R_STERN, k * 30));
  const kerben = Array.from({ length: 12 }, (_, k) =>
    p(R_STERN_INNEN, k * 30 + 15),
  );
  const aussen = Array.from({ length: 12 }, (_, k) => p(R_FELD, k * 30 + 15));

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="az ap"
      role="img"
      aria-label={t("diagramme.arabisch.paar")}
    >
      <defs>
        <linearGradient id="ap-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe6a2" />
          <stop offset="0.5" stopColor="#d9a93e" />
          <stop offset="1" stopColor="#9c6c18" />
        </linearGradient>
        <linearGradient id="ap-silber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f8fa" />
          <stop offset="0.5" stopColor="#c3cad2" />
          <stop offset="1" stopColor="#7f8893" />
        </linearGradient>
        <radialGradient id="ap-glasur" cx="35%" cy="28%" r="70%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </radialGradient>
        <radialGradient id="ap-freunde" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff3c4" stopOpacity="0.95" />
          <stop offset="1" stopColor="#e2b04a" stopOpacity="0.85" />
        </radialGradient>
        <filter id="ap-schatten" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="1.2"
            dy="1.6"
            stdDeviation="1.2"
            floodColor="#071733"
            floodOpacity="0.55"
          />
        </filter>
        <filter id="ap-matt" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="4"
            result="r"
          />
          <feColorMatrix
            in="r"
            type="matrix"
            values="0 0 0 0 0.48  0 0 0 0 0.24  0 0 0 0 0.12  0 0 0 0.6 0.3"
            result="ton"
          />
          <feComposite in="ton" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* Grund: Fugenmoertel; Feld mit Drachen-Kacheln und Stern */}
      <circle cx={M} cy={M} r={G / 2} fill="#e9e3d3" />
      <g className="az-fugen">
        {spitzen.map((s, k) => (
          <polygon
            key={`d${k}`}
            points={pts([s, aussen[k], spitzen[(k + 1) % 12], kerben[k]])}
            fill={ton(KACHEL[k % 2 === 0 ? 0 : 1], zufall())}
          />
        ))}
        {spitzen.map((s, k) => (
          <path
            key={`r${k}`}
            d={`M ${s} L ${aussen[(k + 11) % 12]} A ${R_FELD} ${R_FELD} 0 0 1 ${aussen[k]} Z`}
            fill={ton(KACHEL[2], zufall())}
          />
        ))}
        <polygon
          points={pts(spitzen.flatMap((s, k) => [s, kerben[k]]))}
          fill={ton(KACHEL[2], zufall())}
        />
        {kerben.map((q, k) => (
          <polygon
            key={`i${k}`}
            points={pts([[M, M], q, kerben[(k + 1) % 12]])}
            fill={ton(KACHEL[k % 2 === 0 ? 1 : 0], zufall())}
          />
        ))}
      </g>

      {/* Feld zwischen den Zeigern: Freunde glaenzen golden, Feinde bleiben matt und unglasiert */}
      {art === "freunde" || art === "gleich" || art === "gemischt" ? (
        <g opacity={art === "gemischt" ? 0.5 : 1}>
          <path d={sektor(wa, wb, R_FELD)} fill="url(#ap-freunde)" />
          <path
            d={band(wa, wb, R_FELD + 1.5)}
            className="ap-band"
            stroke="url(#ap-gold)"
          />
        </g>
      ) : art === "feinde" ? (
        <g filter="url(#ap-matt)">
          <path d={sektor(wa, wb, R_FELD)} fill="#000" />
          <path
            d={band(wa, wb, R_FELD + 1.5)}
            className="ap-band"
            stroke="#000"
          />
        </g>
      ) : null}

      {/* die beiden Firdaria-Ringe */}
      <Ring
        zyklus={za}
        ring={RING_A}
        metall="gold"
        gross={14}
        zufall={zufall}
      />
      <Ring
        zyklus={zb}
        ring={RING_B}
        metall="silber"
        gross={12}
        zufall={zufall}
      />

      {/* Randskala: alle 5 Jahre eine ostarabische Ziffer, dazwischen kleine Kacheln */}
      {(() => {
        let kachel = 0;
        return Array.from({ length: 75 }, (_, jahr) => {
          const grad = winkelVon(jahr);
          const [x, y] = p(R_SKALA, grad);
          if (jahr % 5 === 0)
            return (
              <text
                key={`j${jahr}`}
                x={x}
                y={y}
                dy="0.32em"
                className="az-ziffer"
                transform={`rotate(${grad} ${x} ${y})`}
              >
                {OSTARABISCH(jahr)}
              </text>
            );
          const farbe = SKALA_FARBEN[kachel % SKALA_FARBEN.length];
          kachel += 1;
          return (
            <rect
              key={`j${jahr}`}
              x={x - 2.4}
              y={y - 2.4}
              width="4.8"
              height="4.8"
              fill={farbe}
              className="az-skalakachel"
              transform={`rotate(${grad} ${x} ${y})`}
            />
          );
        });
      })()}

      <circle
        cx={M}
        cy={M}
        r={G / 2}
        fill="url(#ap-glasur)"
        pointerEvents="none"
      />

      {/* Alhidaden: Silber (Gegenueber, bis zum inneren Ring), Gold (du, bis zum aeusseren) */}
      <Alhidade
        winkel={wb}
        laenge={RING_B[1] - 4}
        metall="silber"
        breite={2.8}
      />
      <Alhidade winkel={wa} laenge={R_SKALA - 8} metall="gold" breite={3.2} />
      <circle
        cx={M}
        cy={M}
        r="11"
        fill="url(#ap-gold)"
        filter="url(#ap-schatten)"
      />
      <circle cx={M} cy={M} r="6" fill="url(#ap-silber)" />
      <circle cx={M} cy={M} r="2.4" fill="#5a3d0c" opacity="0.7" />
    </svg>
  );
}
