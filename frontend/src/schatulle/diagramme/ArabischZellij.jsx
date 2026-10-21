// Arabisch im Auge: ein glasiertes Zellij-Rund mit angedeuteter Windrose, wie auf einem Astrolabium.
// Fachlich die Firdaria (Visuals.md 2.6): neun Perioden in 75 Jahren (sieben Planeten, Nord- und
// Suedknoten), Reihenfolge nach Tag- oder Nachtgeburt. Ring = die Perioden als Kachelsegmente (Breite =
// Dauer, 0 Jahre oben, im Uhrzeigersinn), die aktive in Blattgold; ein Messingzeiger (Alhidade) zeigt die
// heutige Stelle im Zyklus auf einer Randskala (alle 5 Jahre eine ostarabische Ziffer). Mitte: zwoelfzackiger Kachelstern mit Windrose; die Nabe golden bei Tag-,
// silbern bei Nachtgeburt. Bewusst kein achtzackiger Stern mit Kreis (Rub el Hizb, Zeichen im Koran).
const G = 300;
const M = G / 2;
const R_SKALA = 140; // Randskala 0..75 Jahre (Ziffern und kleine Kacheln)
const R_RING_AUSSEN = 128;
const R_RING_INNEN = 98;
const R_FELD = 94;
const R_STERN = 64;
const R_STERN_INNEN = 36;

// ostarabische Ziffern (wie in arabischer Schrift ueblich), Zahlen werden links nach rechts geschrieben
const OSTARABISCH = (n) =>
  String(n).replace(/\d/g, (z) => String.fromCharCode(0x0660 + Number(z)));
// Kacheln zwischen den Ziffern: Tuerkis, Weiss, Blau, Weiss, ...
const SKALA_FARBEN = ["#2aa69b", "#efe9da", "#1f4fa3", "#efe9da"];

const T = "︎"; // Textdarstellung der Zeichen erzwingen

function zufallVon(saat) {
  let z = saat;
  return () => {
    z = (z * 1664525 + 1013904223) % 4294967296;
    return z / 4294967296;
  };
}

const p = (r, grad) => {
  const w = ((grad - 90) * Math.PI) / 180; // 0° oben, im Uhrzeigersinn
  return [M + r * Math.cos(w), M + r * Math.sin(w)];
};
const pts = (liste) => liste.map((q) => q.join(",")).join(" ");

// Ringsegment zwischen zwei Winkeln
function segment(von, bis) {
  const gross = bis - von > 180 ? 1 : 0;
  const [a1, a2, i2, i1] = [
    p(R_RING_AUSSEN, von),
    p(R_RING_AUSSEN, bis),
    p(R_RING_INNEN, bis),
    p(R_RING_INNEN, von),
  ];
  return `M ${a1} A ${R_RING_AUSSEN} ${R_RING_AUSSEN} 0 ${gross} 1 ${a2} L ${i2} A ${R_RING_INNEN} ${R_RING_INNEN} 0 ${gross} 0 ${i1} Z`;
}

// Kachelfarben mit kleinen Schwankungen (handgemachte Zellij)
const KACHEL = ["#1f4fa3", "#2aa69b", "#efe9da"];
function ton(farbe, z) {
  const f = 0.92 + z * 0.14;
  const n = parseInt(farbe.slice(1), 16);
  const k = (c) => Math.max(0, Math.min(255, Math.round(c * f)));
  return `rgb(${k(n >> 16)}, ${k((n >> 8) & 255)}, ${k(n & 255)})`;
}

export default function ArabischZellij({ payload }) {
  if (!payload || payload.chartType !== "firdariaChart") return null;
  const perioden = payload.periods ?? [];
  const lage = Number(payload.cyclePosition ?? payload.age ?? 0) % 75;
  const aktiv = payload.currentPeriod;
  const zufall = zufallVon(612);

  // zwoelfzackiger Stern und die zwoelf Drachen-Kacheln bis zum Feldrand
  const spitzen = Array.from({ length: 12 }, (_, k) => p(R_STERN, k * 30));
  const kerben = Array.from({ length: 12 }, (_, k) =>
    p(R_STERN_INNEN, k * 30 + 15),
  );
  const aussen = Array.from({ length: 12 }, (_, k) => p(R_FELD, k * 30 + 15));
  const stern = spitzen.flatMap((s, k) => [s, kerben[k]]);

  const winkelVon = (alter) => (alter / 75) * 360;
  const zeiger = winkelVon(lage);

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="az"
      role="img"
      aria-label={`Firdaria: aktiv ${aktiv?.label ?? ""}`}
    >
      <defs>
        <linearGradient id="az-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe6a2" />
          <stop offset="0.5" stopColor="#d9a93e" />
          <stop offset="1" stopColor="#9c6c18" />
        </linearGradient>
        <linearGradient id="az-silber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6f8fa" />
          <stop offset="1" stopColor="#8d959e" />
        </linearGradient>
        <radialGradient id="az-glasur" cx="35%" cy="28%" r="70%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.18" />
        </radialGradient>
        <filter id="az-schatten" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="1.2"
            dy="1.6"
            stdDeviation="1.2"
            floodColor="#071733"
            floodOpacity="0.55"
          />
        </filter>
      </defs>

      {/* Grund: Fugenmoertel */}
      <circle cx={M} cy={M} r={G / 2} fill="#e9e3d3" />

      {/* Kachelfeld: Drachen-Kacheln zwischen den Sternspitzen, dann der Stern, dann die Nabe */}
      <g className="az-fugen">
        {spitzen.map((s, k) => (
          <polygon
            key={`d${k}`}
            points={pts([s, aussen[k], spitzen[(k + 1) % 12], kerben[k]])}
            fill={ton(KACHEL[k % 2 === 0 ? 0 : 1], zufall())}
          />
        ))}
        {/* Randstuecke zwischen den Drachen und dem Feldkreis */}
        {spitzen.map((s, k) => {
          const a = aussen[(k + 11) % 12];
          const b = aussen[k];
          return (
            <path
              key={`r${k}`}
              d={`M ${s} L ${a} A ${R_FELD} ${R_FELD} 0 0 1 ${b} Z`}
              fill={ton(KACHEL[2], zufall())}
            />
          );
        })}
        <polygon points={pts(stern)} fill={ton(KACHEL[2], zufall())} />
        {/* innerer Zwoelfeck-Kranz */}
        {kerben.map((q, k) => (
          <polygon
            key={`i${k}`}
            points={pts([[M, M], q, kerben[(k + 1) % 12]])}
            fill={ton(KACHEL[k % 2 === 0 ? 1 : 0], zufall())}
          />
        ))}
      </g>

      {/* Windrose: vier Haupt- und vier Nebenstrahlen */}
      <g filter="url(#az-schatten)">
        {[0, 90, 180, 270, 45, 135, 225, 315].map((g, i) => {
          const lang = i < 4 ? R_FELD - 6 : R_STERN - 10;
          const breit = i < 4 ? 7 : 5;
          const spitze = p(lang, g);
          const l = p(breit, g - 90);
          const r = p(breit, g + 90);
          return (
            <g key={g}>
              <polygon
                points={pts([spitze, l, [M, M]])}
                fill={i < 4 ? "#fbf6e8" : "#d8cfb6"}
              />
              <polygon
                points={pts([spitze, r, [M, M]])}
                fill={i < 4 ? "#c9a24c" : "#a8925a"}
              />
            </g>
          );
        })}
      </g>

      {/* Ring: die neun Firdaria-Perioden als Kachelsegmente */}
      <g className="az-fugen">
        {perioden.map((per, i) => {
          const von = winkelVon(per.startAge);
          const bis = winkelVon(per.endAge);
          const istAktiv = aktiv && per.planet === aktiv.planet;
          return (
            <path
              key={per.planet}
              d={segment(von, bis)}
              fill={istAktiv ? "url(#az-gold)" : ton(KACHEL[i % 2], zufall())}
            />
          );
        })}
      </g>
      {perioden.map((per) => {
        const mitte = winkelVon((per.startAge + per.endAge) / 2);
        const [x, y] = p((R_RING_AUSSEN + R_RING_INNEN) / 2, mitte);
        const istAktiv = aktiv && per.planet === aktiv.planet;
        const schmal = per.endAge - per.startAge < 4;
        return (
          <text
            key={`z${per.planet}`}
            x={x}
            y={y}
            dy="0.36em"
            className={istAktiv ? "az-zeichen aktiv" : "az-zeichen"}
            fontSize={schmal ? 11 : 16}
          >
            {(per.symbol || "·") + T}
          </text>
        );
      })}

      {/* Randskala: alle 5 Jahre eine Ziffer, dazwischen kleine quadratische Kacheln */}
      {(() => {
        let kachel = 0;
        return Array.from({ length: 75 }, (_, jahr) => {
          const grad = winkelVon(jahr);
          const [x, y] = p(R_SKALA, grad);
          if (jahr % 5 === 0) {
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
          }
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

      {/* Glasur ueber Kacheln */}
      <circle
        cx={M}
        cy={M}
        r={G / 2}
        fill="url(#az-glasur)"
        pointerEvents="none"
      />

      {/* Alhidade: Messingzeiger zur heutigen Stelle im Zyklus */}
      <g filter="url(#az-schatten)" transform={`rotate(${zeiger} ${M} ${M})`}>
        <polygon
          points={pts([
            [M, M - R_SKALA + 6],
            [M + 3.2, M - 20],
            [M + 2.2, M + 30],
            [M - 2.2, M + 30],
            [M - 3.2, M - 20],
          ])}
          fill="url(#az-gold)"
        />
        <line
          x1={M}
          y1={M - R_SKALA + 10}
          x2={M}
          y2={M + 26}
          stroke="#7a5512"
          strokeWidth="0.6"
        />
      </g>

      {/* Nabe: Gold bei Tag-, Silber bei Nachtgeburt */}
      <circle
        cx={M}
        cy={M}
        r="11"
        fill={payload.isDayChart ? "url(#az-gold)" : "url(#az-silber)"}
        filter="url(#az-schatten)"
      />
      <circle cx={M} cy={M} r="3.2" fill="#5a3d0c" opacity="0.7" />
    </svg>
  );
}
