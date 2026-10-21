// Kabbalah im Auge: eine Seite aus einem alten Buch. Der Baum des Lebens ist in brauner Druckertinte
// gedruckt, wie die Holz- und Kupferstiche alter Werke (z. B. Kircher, 1652): Pfade als doppelt umrandete
// Kanaele mit ihren hebraeischen Buchstaben (kabbalah_pfade.json), Sephiroth als doppelt umrandete Kreise
// mit Nummer und Namen. Jemand hat mit Farbstift darin gearbeitet: die aktive Sephira schraffiert und
// umkringelt, den aktiven Pfad ausgemalt. Papier: vergilbtes Pergament. Fachlich: Visuals.md 2.5.
const G = 300;
const M = G / 2;
const R = 57; // Abstand benachbarter Sephiroth
const OBEN = M - 2 * R; // Kether; Baum (Kether..Malkuth = 4R) mittig
const KREIS = 20;
const KANAL = 8;

const TINTE = "#2d1f12";
const PAPIER = "#efdcae";

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

// Lage des Buchstabens auf dem Pfad: die Mitte; Kether-Tiphereth kreuzt zwei Querpfade, daher weiter oben
function lageBuchstabe(p) {
  return p.from === 1 && p.to === 6 ? 0.3 : 0.5;
}

// Mitte des Buchstaben-Medaillons eines Pfads
function buchstabenOrt(p) {
  const a = KNOTEN[p.from];
  const b = KNOTEN[p.to];
  const t = lageBuchstabe(p);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Farbstift je Sephira nach der "Koeniginnen-Skala" (Golden Dawn, Crowley 777), fuer Papier abgedunkelt
const STIFT = {
  1: "#8a8f9c", // Kether: weisser Glanz -> Silbergrau
  2: "#6f7680", // Chokmah: grau
  3: "#2b2b35", // Binah: schwarz
  4: "#2346b0", // Chesed: blau
  5: "#c21d1d", // Geburah: scharlachrot
  6: "#d49a06", // Tiphereth: gold
  7: "#118049", // Netzach: smaragdgruen
  8: "#e0680c", // Hod: orange
  9: "#6c2db0", // Yesod: violett
  10: "#7a5a22", // Malkuth: Zitrin/Olive/Rostbraun (vereinfacht)
};

function zufallVon(saat) {
  let z = saat;
  return () => {
    z = (z * 1664525 + 1013904223) % 4294967296;
    return z / 4294967296;
  };
}

// Schraffur in einem Kreis: schraege, leicht unregelmaessige Striche
function schraffur(x, y, r, saat) {
  const zufall = zufallVon(saat);
  let d = "";
  for (let t = -r; t <= r; t += 2.6) {
    const halb =
      Math.sqrt(Math.max(0, r * r - t * t)) * (0.85 + zufall() * 0.12);
    const v = (zufall() - 0.5) * 1.4;
    // 45° geneigt
    const ax = x + (t - halb) * 0.7071 + v;
    const ay = y + (t + halb) * 0.7071 - v;
    const bx = x + (t + halb) * 0.7071 - v;
    const by = y + (t - halb) * 0.7071 + v;
    d += `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)} `;
  }
  return d;
}

// zwei schnelle, nicht geschlossene Kringel um einen Kreis
function kringel(x, y, r, saat) {
  const zufall = zufallVon(saat);
  const punkte = [];
  for (let i = 0; i <= 64; i += 1) {
    const w = -0.6 + (i / 64) * Math.PI * 2 * 1.85;
    const rr =
      r * (1 + 0.06 * Math.sin(w * 3) + (zufall() - 0.5) * 0.05) + (i / 64) * 3;
    punkte.push(
      `${(x + rr * Math.cos(w)).toFixed(1)} ${(y + rr * 0.93 * Math.sin(w)).toFixed(1)}`,
    );
  }
  return `M ${punkte.join(" L ")}`;
}

// Pfad mit Farbstift ausgemalt: Zickzack quer durch den Kanal
function zickzack(a, b, saat) {
  const zufall = zufallVon(saat);
  const l = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / l;
  const uy = (b.y - a.y) / l;
  const start = KREIS + 1;
  const ende = l - KREIS - 1;
  let d = "";
  let seite = 1;
  for (let s = start; s <= ende; s += 2.2) {
    const q = (KANAL / 2 - 1.2) * seite + (zufall() - 0.5) * 0.8;
    const x = a.x + ux * s - uy * q;
    const y = a.y + uy * s + ux * q;
    d += `${d ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)} `;
    seite = -seite;
  }
  return d;
}

// Stockflecken und Flecken im Pergament (fest)
const FLECKEN = (() => {
  const z = zufallVon(1652);
  return Array.from({ length: 26 }, () => {
    const w = z() * Math.PI * 2;
    const r = Math.sqrt(z()) * 140;
    return {
      x: M + r * Math.cos(w),
      y: M + r * Math.sin(w),
      g: 0.6 + z() * 2.6,
      o: 0.08 + z() * 0.22,
    };
  });
})();

// Randnotizen: kurze Zeilen in Handschrift am Seitenrand, mit gekritzeltem Bezugsstrich zum Element
const BEREICH = {
  liebe: "Liebe",
  beruf: "Beruf",
  finanzen: "Finanzen",
  gesundheit: "Gesundheit",
  soziales: "Soziales",
  kreativitaet: "Kreativität",
  veraenderung: "Veränderung",
  spiritualitaet: "Spiritualität",
};
const liste = (dims) =>
  dims.length ? BEREICH[dims[0]] + (dims.length > 1 ? " u.a." : "") : null;

function Notiz({ zeilen, farbe, seite, y, ziel, saat }) {
  const GR = 9;
  const ZEILE = 11;
  const x = seite === "links" ? 74 : 226;
  const oben = y - ((zeilen.length - 1) * ZEILE) / 2;
  // Bezugsstrich vom Textrand zum Element, leicht gebogen
  const sx = seite === "links" ? x + 2 : x - 2;
  const sy = y;
  const mx = (sx + ziel.x) / 2 + (saat % 2 ? 4 : -4);
  const my = (sy + ziel.y) / 2 - 6;
  return (
    <g filter="url(#kb-stift)" className="kb-notiz" style={{ color: farbe }}>
      <g transform={`rotate(${seite === "links" ? -4 : 3} ${x} ${y})`}>
        {zeilen.map((z, i) => (
          <text
            key={i}
            x={x}
            y={oben + i * ZEILE}
            dy="0.35em"
            fontSize={GR}
            textAnchor={seite === "links" ? "end" : "start"}
            fill={farbe}
          >
            {z}
          </text>
        ))}
      </g>
      <path
        d={`M ${sx} ${sy} Q ${mx} ${my} ${ziel.x} ${ziel.y}`}
        stroke={farbe}
        className="kb-bezug"
      />
      <circle cx={ziel.x} cy={ziel.y} r="1.2" fill={farbe} />
    </g>
  );
}

function randnotizen(payload, aktiv, pfad, stift, stiftPfad) {
  const n = payload.notes;
  if (!n) return null;
  const ZEILE = 11;
  const notizen = [];
  const k = KNOTEN[aktiv];
  if (k && n.sephira) {
    const zeilen = [
      n.sephira.deutsch,
      liste(n.sephira.stark) && `stark: ${liste(n.sephira.stark)}`,
      liste(n.sephira.schwach) && `schwach: ${liste(n.sephira.schwach)}`,
    ].filter(Boolean);
    const seite = k.x < M - 1 ? "links" : "rechts";
    notizen.push({
      key: "s",
      zeilen,
      farbe: stift,
      seite,
      wunsch: k.y + 30,
      ziel: { x: k.x + (seite === "links" ? -KREIS - 4 : KREIS + 4), y: k.y },
    });
  }
  if (pfad && n.pfad && KNOTEN[pfad.from] && KNOTEN[pfad.to]) {
    const b = buchstabenOrt(pfad);
    const zeilen = [
      `${pfad.letter} = ${n.pfad.bedeutung}`,
      n.pfad.tarot && `Tarot: ${n.pfad.tarot}`,
      liste(n.pfad.stark) && `stark: ${liste(n.pfad.stark)}`,
    ].filter(Boolean);
    const seite = b.x < M - 1 ? "links" : "rechts";
    notizen.push({
      key: "p",
      zeilen,
      farbe: stiftPfad,
      seite,
      wunsch: b.y + 24,
      ziel: { x: b.x + (seite === "links" ? -9 : 9), y: b.y },
    });
  }
  // je Seite von oben nach unten setzen, ohne Ueberlappung, im breiten Mittelband des Kreises
  ["links", "rechts"].forEach((seite) => {
    let frei = 98;
    notizen
      .filter((t) => t.seite === seite)
      .sort((a, b) => a.wunsch - b.wunsch)
      .forEach((t) => {
        const hoehe = (t.zeilen.length - 1) * ZEILE;
        t.y = Math.min(222 - hoehe / 2, Math.max(frei + hoehe / 2, t.wunsch));
        frei = t.y + hoehe / 2 + ZEILE + 6;
      });
  });
  return notizen.map((t, i) => (
    <Notiz
      key={t.key}
      zeilen={t.zeilen}
      farbe={t.farbe}
      seite={t.seite}
      y={t.y}
      ziel={t.ziel}
      saat={i + 1}
    />
  ));
}

export default function KabbalahBuch({ payload }) {
  if (!payload || payload.chartType !== "kabbalahTree") return null;
  const aktiv = payload.activeSephira?.number;
  const pfad = payload.activePath;
  const namen = Object.fromEntries(
    (payload.sephirothList ?? []).map((s) => [s.number, s.name]),
  );
  const pfade = payload.paths ?? [];
  const stift = STIFT[aktiv] ?? STIFT[6];
  // zweiter Farbstift fuer den Pfad (verschiedene Aspekte, verschiedene Farben); nicht dieselbe wie die Sephira
  const stiftPfad = aktiv === 4 ? "#6b4420" : "#2f4f86";

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="kb"
      role="img"
      aria-label={`Baum des Lebens, aktive Sephira ${namen[aktiv] ?? ""}`}
    >
      <defs>
        <radialGradient id="kb-pergament" cx="48%" cy="45%" r="62%">
          <stop offset="0" stopColor="#f6e8c4" />
          <stop offset="0.7" stopColor={PAPIER} />
          <stop offset="1" stopColor="#c9a868" />
        </radialGradient>
        {/* Pergament: wolkige, ungleichmaessige Toenung */}
        <filter id="kb-wolken" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018"
            numOctaves="4"
            seed="8"
            result="w"
          />
          <feColorMatrix
            in="w"
            type="matrix"
            values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.12  0 0 0 0.5 -0.1"
            result="toen"
          />
          <feComposite
            in="toen"
            in2="SourceGraphic"
            operator="in"
            result="toenIn"
          />
          <feBlend in="SourceGraphic" in2="toenIn" mode="multiply" />
        </filter>
        {/* Druck: Tinte leicht unregelmaessig ins Papier gezogen */}
        <filter id="kb-druck" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="1"
            seed="4"
            result="r"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="r"
            scale="0.9"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        {/* Farbstift: koerniger, nicht ganz deckender Strich */}
        <filter id="kb-stift" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.5"
            numOctaves="1"
            seed="12"
            result="r"
          />
          <feColorMatrix
            in="r"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.3 0 0 0 0.1"
            result="korn"
          />
          <feComposite in="SourceGraphic" in2="korn" operator="in" />
        </filter>
      </defs>

      {/* Pergament mit Flecken */}
      <circle
        cx={M}
        cy={M}
        r={G / 2}
        fill="url(#kb-pergament)"
        filter="url(#kb-wolken)"
      />
      {FLECKEN.map((f, i) => (
        <circle
          key={i}
          cx={f.x}
          cy={f.y}
          r={f.g}
          fill="#8a5a22"
          opacity={f.o}
        />
      ))}

      {/* gedruckter Baum */}
      <g filter="url(#kb-druck)">
        {/* Kanaele: erst alle Tintenraender, dann das Papierinnere -> saubere Kreuzungen wie im Stich */}
        {pfade.map((p) => {
          const a = KNOTEN[p.from];
          const b = KNOTEN[p.to];
          return (
            <line
              key={`a${p.number}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={TINTE}
              strokeWidth={KANAL + 2.2}
            />
          );
        })}
        {pfade.map((p) => {
          const a = KNOTEN[p.from];
          const b = KNOTEN[p.to];
          const istAktiv = pfad && p.number === pfad.number;
          return (
            <line
              key={`i${p.number}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={PAPIER}
              strokeWidth={KANAL}
            />
          );
        })}
        {pfade.map((p) => {
          const a = KNOTEN[p.from];
          const b = KNOTEN[p.to];
          const t = lageBuchstabe(p);
          const x = a.x + (b.x - a.x) * t;
          const y = a.y + (b.y - a.y) * t;
          return (
            <g key={`b${p.number}`}>
              <circle
                cx={x}
                cy={y}
                r="6.4"
                fill={PAPIER}
                stroke={TINTE}
                strokeWidth="0.8"
              />
              <text x={x} y={y} dy="0.36em" className="kb-buchstabe">
                {p.letter}
              </text>
            </g>
          );
        })}
        {/* Sephiroth: doppelt umrandete Kreise mit Nummer und Namen */}
        {Object.entries(KNOTEN).map(([n, k]) => {
          const nr = Number(n);
          const istAktiv = nr === aktiv;
          return (
            <g key={n}>
              <circle
                cx={k.x}
                cy={k.y}
                r={KREIS}
                fill={PAPIER}
                stroke={TINTE}
                strokeWidth="1.3"
              />
              <circle
                cx={k.x}
                cy={k.y}
                r={KREIS - 2.6}
                fill="none"
                stroke={TINTE}
                strokeWidth="0.6"
              />
              <text x={k.x} y={k.y - 6} dy="0.36em" className="kb-nummer">
                {nr}
              </text>
              <text x={k.x} y={k.y + 4} dy="0.36em" className="kb-name">
                {namen[n]}
              </text>
            </g>
          );
        })}
      </g>

      {/* Farbstift ueber dem Druck, multipliziert wie echter Buntstift auf bedrucktem Papier */}
      <g
        filter="url(#kb-stift)"
        className="kb-stift"
        style={{ mixBlendMode: "multiply" }}
        stroke={stift}
      >
        {pfad && KNOTEN[pfad.from] && KNOTEN[pfad.to] ? (
          <>
            <path
              d={zickzack(KNOTEN[pfad.from], KNOTEN[pfad.to], 7)}
              stroke={stiftPfad}
            />
            {/* auch das Buchstaben-Medaillon des Pfads schraffiert (kurze Pfade sind sonst kaum zu sehen) */}
            <path
              d={schraffur(
                buchstabenOrt(pfad).x,
                buchstabenOrt(pfad).y,
                5.6,
                5,
              )}
              stroke={stiftPfad}
            />
          </>
        ) : null}
        {aktiv && KNOTEN[aktiv] ? (
          <path
            d={schraffur(KNOTEN[aktiv].x, KNOTEN[aktiv].y, KREIS - 2.5, 3)}
          />
        ) : null}
      </g>

      {/* Farbstift-Kringel um das Buchstaben-Medaillon des aktiven Pfads */}
      {pfad && KNOTEN[pfad.from] && KNOTEN[pfad.to] ? (
        <path
          d={kringel(buchstabenOrt(pfad).x, buchstabenOrt(pfad).y, 9, 23)}
          stroke={stiftPfad}
          className="kb-kringel"
          filter="url(#kb-stift)"
        />
      ) : null}

      {/* Farbstift-Kringel um die aktive Sephira (ueber dem Druck) */}
      {aktiv && KNOTEN[aktiv] ? (
        <path
          d={kringel(KNOTEN[aktiv].x, KNOTEN[aktiv].y, KREIS + 3.5, 11)}
          stroke={stift}
          className="kb-kringel"
          filter="url(#kb-stift)"
        />
      ) : null}
      {/* Randnotizen mit Bezugsstrich, je Aspekt in seiner Farbstift-Farbe */}
      {randnotizen(payload, aktiv, pfad, stift, stiftPfad)}
    </svg>
  );
}
