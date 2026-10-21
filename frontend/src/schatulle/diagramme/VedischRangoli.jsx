// Vedisch (Jyotish) im Auge: ein Rangoli, ein Bodenbild aus gestreutem Farbpulver.
// Fachlich die Vimshottari-Dasha (Visuals.md 2.7): die Mahadasha-Perioden des Lebens als Pulverbogen,
// deren Mittelpunkte auf dem Rand liegen, so dass nur die innere Haelfte hereinreicht. Lage = wann im
// Leben (0 Jahre oben, im Uhrzeigersinn bis 120), Groesse = Dauer der Periode, Farbe = traditionelle
// Navagraha-Farbe. Vergangene Perioden verblasst, die aktive mit Punkten umrandet. Innen ein Kolam-Ring aus
// 27 Reismehlpunkten (Nakshatras), das Geburts-Nakshatra mit dem Stab umkringelt; eine mit dem Stab
// gezogene Rille zeigt das heutige Lebensalter. Reines SVG.
const G = 300;
const M = G / 2;
const R_RUND = 124; // Rand des Rundes: hier liegen die Mittelpunkte der Pulverbogen
const R_KOLAM = 34; // Ring der 27 Nakshatra-Punkte (innerhalb der Pulverbogen)

// Navagraha-Farben (Surya rot, Chandra weiss, Mangala rot, Budha gruen, Guru gelb, Shukra weiss,
// Shani schwarz/indigo, Rahu rauchfarben, Ketu bunt); auf dunklem Boden Saturn als Indigo
const FARBE = {
  sonne: ["#e2432b", "#a8200f"],
  mond: ["#f4f1ea", "#c9c4b8"],
  mars: ["#c8102e", "#7d0a1c"],
  merkur: ["#2fa84f", "#16692e"],
  jupiter: ["#f6c21c", "#c48b05"],
  venus: ["#fbe9f0", "#d9a9bd"],
  saturn: ["#3b4cc0", "#1d2470"],
  rahu: ["#8d929c", "#4f535b"],
  ketu: ["#b07ad6", "#5e8f3a"],
};

function zufallVon(saat) {
  let z = saat;
  return () => {
    z = (z * 1664525 + 1013904223) % 4294967296;
    return z / 4294967296;
  };
}

// Lebensalter -> Bildschirmwinkel (0 Jahre oben, im Uhrzeigersinn)
const winkel = (alter) => ((alter / 120) * 360 - 90) * (Math.PI / 180);
const punkt = (r, w) => ({ x: M + r * Math.cos(w), y: M + r * Math.sin(w) });

export default function VedischRangoli({ payload }) {
  if (!payload || payload.chartType !== "dashaChart") return null;
  const alter = Number(payload.age ?? 0);
  const aktiv = payload.activeMahadasha;
  const perioden = payload.periods ?? [];
  const nakshatra = payload.nakshatraIndex;

  // Pulverbogen: zuerst die langen (unten), dann die kurzen; die aktive zuletzt (obenauf)
  const bogen = perioden
    .map((p, i) => {
      const mitte = (p.startAge + p.endAge) / 2;
      return {
        ...p,
        i,
        mitte: punkt(R_RUND, winkel(mitte)),
        r: 20 + p.years * 2.1,
        vorbei: p.endAge <= alter,
        istAktiv:
          aktiv && p.planet === aktiv.planet && p.startAge === aktiv.startAge,
      };
    })
    .sort((a, b) => a.istAktiv - b.istAktiv || b.r - a.r);

  const zufall = zufallVon(1727);
  const streu = Array.from({ length: 120 }, () => {
    const w = zufall() * Math.PI * 2;
    const r = R_RUND - 6 + zufall() * 26;
    const p = punkt(r, w);
    return { ...p, g: 0.4 + zufall() * 0.8 };
  });

  const zp = zufallVon(31); // feste kleine Unregelmaessigkeiten der Reismehlpunkte
  const jetzt = punkt(R_RUND - 4, winkel(alter));
  const nakPunkt = (i) => punkt(R_KOLAM, (i / 27) * Math.PI * 2 - Math.PI / 2);

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="vr"
      role="img"
      aria-label={`Vimshottari-Dasha: aktiv ${aktiv?.label ?? ""}`}
    >
      <defs>
        <radialGradient id="vr-boden" cx="45%" cy="40%" r="70%">
          <stop offset="0" stopColor="#4a3a2e" />
          <stop offset="1" stopColor="#21170f" />
        </radialGradient>
        <filter id="vr-erde" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves="2"
            seed="9"
            result="r"
          />
          <feColorMatrix in="r" type="saturate" values="0" result="g" />
          <feComponentTransfer in="g" result="leise">
            <feFuncA type="linear" slope="0" intercept="0.18" />
          </feComponentTransfer>
          <feComposite
            in="leise"
            in2="SourceGraphic"
            operator="in"
            result="m"
          />
          <feBlend in="SourceGraphic" in2="m" mode="overlay" />
        </filter>
        {/* Pulver: ausgefranste Raender und koerniger Auftrag */}
        <filter id="vr-pulver" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.3"
            numOctaves="1"
            seed="3"
            result="fein"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fein"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rand"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="2.4"
            numOctaves="1"
            seed="17"
            result="korn"
          />
          <feColorMatrix
            in="korn"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -0.15"
            result="kornAlpha"
          />
          <feComposite in="rand" in2="kornAlpha" operator="in" />
        </filter>
        {/* feineres Pulver fuer die kleinen Reismehlpunkte */}
        <filter
          id="vr-pulver-fein"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.8"
            numOctaves="1"
            seed="21"
            result="fein"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="fein"
            scale="1.1"
            xChannelSelector="R"
            yChannelSelector="G"
            result="rand"
          />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="3"
            numOctaves="1"
            seed="5"
            result="korn"
          />
          <feColorMatrix
            in="korn"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 0 0 0 0.35"
            result="kornAlpha"
          />
          <feComposite in="rand" in2="kornAlpha" operator="in" />
        </filter>
        <clipPath id="vr-rund">
          <circle cx={M} cy={M} r={R_RUND} />
        </clipPath>
        {bogen.map((b) => (
          <radialGradient
            key={`f${b.i}`}
            id={`vr-f${b.i}`}
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop
              offset="0.55"
              stopColor={(FARBE[b.planet] ?? FARBE.rahu)[0]}
            />
            <stop offset="1" stopColor={(FARBE[b.planet] ?? FARBE.rahu)[1]} />
          </radialGradient>
        ))}
      </defs>

      {/* Boden */}
      <circle
        cx={M}
        cy={M}
        r={G / 2}
        fill="url(#vr-boden)"
        filter="url(#vr-erde)"
      />

      {/* Pulverbogen, auf das Rund begrenzt: nur die innere Haelfte reicht herein */}
      <g clipPath="url(#vr-rund)">
        <g filter="url(#vr-pulver)">
          {bogen.map((b) => (
            <circle
              key={b.i}
              cx={b.mitte.x}
              cy={b.mitte.y}
              r={b.istAktiv ? b.r * 1.1 : b.r}
              fill={`url(#vr-f${b.i})`}
              opacity={b.vorbei ? 0.38 : b.istAktiv ? 1 : 0.82}
            />
          ))}
          {/* Ketu: bunt gesprenkelt */}
          {bogen
            .filter((b) => b.planet === "ketu")
            .map((b) => {
              const z = zufallVon(77 + b.i);
              return Array.from({ length: 40 }, (_, k) => {
                const w = z() * Math.PI * 2;
                const r = Math.sqrt(z()) * b.r;
                const farben = ["#f6c21c", "#2fa84f", "#e2432b", "#3b4cc0"];
                return (
                  <circle
                    key={`k${b.i}-${k}`}
                    cx={b.mitte.x + r * Math.cos(w)}
                    cy={b.mitte.y + r * Math.sin(w)}
                    r={0.9 + z() * 1.2}
                    fill={farben[k % 4]}
                    opacity={b.vorbei ? 0.35 : 0.85}
                  />
                );
              });
            })}
        </g>
        {/* Umrandung der aktiven Periode mit gestreuten Reismehlpunkten */}
        <g filter="url(#vr-pulver-fein)">
          {bogen
            .filter((b) => b.istAktiv)
            .map((b) => {
              const r = b.r * 1.1 + 4;
              return Array.from({ length: 36 }, (_, k) => {
                const w = (k / 36) * Math.PI * 2 + (zp() - 0.5) * 0.05;
                const rr = r + (zp() - 0.5) * 2;
                return (
                  <circle
                    key={`u${k}`}
                    cx={b.mitte.x + rr * Math.cos(w)}
                    cy={b.mitte.y + rr * Math.sin(w)}
                    r={1.3 + zp() * 0.5}
                    className="vr-punkt"
                  />
                );
              });
            })}
        </g>
      </g>

      {/* Rand des Rundes: eine Linie aus weissem Reismehl, aussen verstreutes Pulver */}
      <circle
        cx={M}
        cy={M}
        r={R_RUND}
        className="vr-rand"
        filter="url(#vr-pulver)"
      />
      {streu.map((s, i) => (
        <circle key={`s${i}`} cx={s.x} cy={s.y} r={s.g} className="vr-streu" />
      ))}

      {/* Kolam: 27 Reismehlpunkte fuer die Nakshatras, von Hand gestreut (leicht unregelmaessig) */}
      <g filter="url(#vr-pulver-fein)">
        {Array.from({ length: 27 }, (_, i) => {
          const p = nakPunkt(i);
          return (
            <circle
              key={`n${i}`}
              cx={p.x + (zp() - 0.5) * 1.2}
              cy={p.y + (zp() - 0.5) * 1.2}
              r={(i === nakshatra ? 2.4 : 1.5) + zp() * 0.4}
              className="vr-punkt"
            />
          );
        })}
      </g>

      {/* mit dem Stab gezogen: Kringel um das Geburts-Nakshatra und die Rille zum heutigen Alter */}
      <g className="vr-stab">
        {nakshatra != null ? (
          <circle
            cx={nakPunkt(nakshatra).x}
            cy={nakPunkt(nakshatra).y}
            r="6.5"
          />
        ) : null}
        <line x1={M} y1={M} x2={jetzt.x} y2={jetzt.y} />
        <circle cx={M} cy={M} r="3" />
      </g>
      <g className="vr-stab-licht">
        <line x1={M + 0.6} y1={M + 0.8} x2={jetzt.x + 0.6} y2={jetzt.y + 0.8} />
      </g>
    </svg>
  );
}
