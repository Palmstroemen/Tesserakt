/**
 * Kabbalah: Baum des Lebens (Tree of Life).
 * 1, 2, 4, 6, 5, 3 liegen auf einem Sechseck (oberes Sechseck).
 * 8 unter 5, 9 unter 6, 7 unter 4, 10 unter 9 — jeweils gleicher Abstand wie zum Punkt darüber.
 */

// Regulares Sechseck (flacher Deckel): Mittelpunkt (CX, CY), Radius R. Reihenfolge: 1, 2, 4, 6, 5, 3.
const CX = 110;
const CY = 78;
const R = 48;

function hexVertex(angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { cx: CX + R * Math.cos(rad), cy: CY + R * Math.sin(rad) };
}

// Oberes Sechseck: 1 oben (0°), dann im Uhrzeigersinn 2 (60°), 4 (120°), 6 (180°), 5 (240°), 3 (300°)
const H1 = hexVertex(0);   // 1 Kether
const H2 = hexVertex(60);  // 2 Chokmah rechts
const H4 = hexVertex(120); // 4 Chesed rechts
const H6 = hexVertex(180); // 6 Tiphereth unten
const H5 = hexVertex(240);// 5 Geburah links
const H3 = hexVertex(300);// 3 Binah links

// Abstand = Sechseck-Kantenlänge = R (bei Radius R ist die Seite auch R)
const D = R;

const NODES = {
  1: H1,
  2: H2,
  3: H3,
  4: H4,
  5: H5,
  6: H6,
  7: { cx: H4.cx, cy: H4.cy + D },   // 7 unter 4
  8: { cx: H5.cx, cy: H5.cy + D },   // 8 unter 5
  9: { cx: H6.cx, cy: H6.cy + D },   // 9 unter 6
  10: { cx: H6.cx, cy: H6.cy + 2 * D }, // 10 unter 9
};

// 22 Pfade (laut kabbalah_pfade.json): von → zu
const PATHS = [
  [1, 2], [1, 3], [1, 6],
  [2, 3], [2, 6], [2, 4],
  [3, 6], [3, 5],
  [4, 5], [4, 6], [4, 7],
  [5, 6], [5, 8],
  [6, 7], [6, 9], [6, 8],
  [7, 8], [7, 9], [7, 10],
  [8, 9], [8, 10],
  [9, 10],
];

export default function KabbalahTree({ payload }) {
  if (!payload || payload.chartType !== "kabbalahTree") {
    return (
      <div className="kabbalah-tree kabbalah-tree--empty">
        <p>Keine Kabbalah-Daten.</p>
      </div>
    );
  }

  const { lifePathNumber, activeSephira, sephirothList } = payload;
  const activeNum = activeSephira?.number ?? 0;

  const getByName = (num) => sephirothList?.find((s) => s.number === num)?.name ?? `Sephira ${num}`;

  return (
    <div className="kabbalah-tree" role="img" aria-label={`Baum des Lebens, aktive Sephira ${activeSephira?.name ?? activeNum}`}>
      {lifePathNumber != null && (
        <p className="kabbalah-tree__life-path">Lebenspfadzahl: {lifePathNumber}</p>
      )}
      <div className="kabbalah-tree__svg-wrap">
        <svg viewBox="0 0 220 260" className="kabbalah-tree__svg">
          <g className="kabbalah-tree__edges">
            {PATHS.map(([a, b]) => {
              const from = NODES[a];
              const to = NODES[b];
              if (!from || !to) return null;
              return (
                <line
                  key={`${a}-${b}`}
                  x1={from.cx}
                  y1={from.cy}
                  x2={to.cx}
                  y2={to.cy}
                />
              );
            })}
          </g>
          <g className="kabbalah-tree__nodes">
            {Object.entries(NODES).map(([numStr, pos]) => {
              const num = Number(numStr);
              const isActive = num === activeNum;
              return (
                <g key={num}>
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r="16"
                    className={`kabbalah-tree__node ${isActive ? "kabbalah-tree__node--active" : ""}`}
                  />
                  <text
                    x={pos.cx}
                    y={pos.cy - 5}
                    className="kabbalah-tree__node-num"
                    textAnchor="middle"
                  >
                    {num}
                  </text>
                  <text
                    x={pos.cx}
                    y={pos.cy + 10}
                    className="kabbalah-tree__node-name"
                    textAnchor="middle"
                  >
                    {getByName(num)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
