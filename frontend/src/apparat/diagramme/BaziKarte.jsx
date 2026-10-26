// Bazi im Auge: die rote Bazi-Karte. Ueberliefert sind solche Karten auf rotem (Reis-)Papier, mit den acht
// Zeichen in schwarzer Tusche (z. B. National Museum of Singapore, Karten 1922-1931; Verlobungskarten 庚帖).
// Fachlich wie Visuals.md 2.3: vier Saeulen, je Himmelsstamm ueber Erdzweig, senkrecht und von rechts nach
// links gelesen (Jahr, Monat, Tag, Stunde); Tagesmeister hervorgehoben; fuenf Elemente.
// Hervorhebung: goldenes Rautenblatt (斗方) hinter dem Tagesmeister. Reines SVG.
import { t } from "../../sprache";

const G = 300;
const M = G / 2;

export const STAMM = {
  jia: "甲",
  yi: "乙",
  bing: "丙",
  ding: "丁",
  wu: "戊",
  ji: "己",
  geng: "庚",
  xin: "辛",
  ren: "壬",
  gui: "癸",
};
export const ZWEIG = {
  zi: "子",
  chou: "丑",
  yin: "寅",
  mao: "卯",
  chen: "辰",
  si: "巳",
  wu: "午",
  wei: "未",
  shen: "申",
  you: "酉",
  xu: "戌",
  hai: "亥",
};
// Saeulen von rechts nach links; Kopf: 年 月 日 时 (die Pinselschrift hat nur die vereinfachte Form 时)
const SAEULEN = [
  { id: "year", kopf: "年", x: 222 },
  { id: "month", kopf: "月", x: 174 },
  { id: "day", kopf: "日", x: 126 },
  { id: "hour", kopf: "时", x: 78 },
];
// Fuenf Elemente in der Reihenfolge des naehrenden Zyklus, traditionelle Farben
const ELEMENTE = [
  { id: "wood", zeichen: "木", farbe: "#2f7d4a" },
  { id: "fire", zeichen: "火", farbe: "#e2541c" },
  { id: "earth", zeichen: "土", farbe: "#d9a62e" },
  { id: "metal", zeichen: "金", farbe: "#f3efe6" },
  { id: "water", zeichen: "水", farbe: "#1a1a22" },
];

const Y_KOPF = 76;
const Y_STAMM = 128;
const Y_ZWEIG = 180;

// fester Goldstaub auf dem Papier
function goldstaub(anzahl) {
  let z = 88;
  const zufall = () => {
    z = (z * 1664525 + 1013904223) % 4294967296;
    return z / 4294967296;
  };
  return Array.from({ length: anzahl }, () => {
    const w = zufall() * Math.PI * 2;
    const r = Math.sqrt(zufall()) * (G / 2 - 6);
    return {
      x: M + r * Math.cos(w),
      y: M + r * Math.sin(w),
      g: 0.3 + zufall() * 1.1,
      o: 0.25 + zufall() * 0.5,
    };
  });
}
const STAUB = goldstaub(70);

export default function BaziKarte({ payload }) {
  if (!payload || payload.chartType !== "fourPillars") return null;
  const saeulen = payload.pillars ?? {};
  const anteile = payload.fiveElements ?? {};

  return (
    <svg
      viewBox={`0 0 ${G} ${G}`}
      className="bk"
      role="img"
      aria-label={t("diagramme.bazi.bild")}
    >
      <defs>
        <radialGradient id="bk-papier" cx="45%" cy="40%" r="70%">
          <stop offset="0" stopColor="#d23a2a" />
          <stop offset="0.65" stopColor="#b2241b" />
          <stop offset="1" stopColor="#7d1410" />
        </radialGradient>
        {/* Reispapier: lange Fasern (gestrecktes Rauschen), leicht hell und dunkel */}
        <filter id="bk-fasern" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02 0.25"
            numOctaves="3"
            seed="3"
            result="rauschen"
          />
          <feColorMatrix
            in="rauschen"
            type="saturate"
            values="0"
            result="grau"
          />
          <feComponentTransfer in="grau" result="leise">
            <feFuncA type="linear" slope="0" intercept="0.1" />
          </feComponentTransfer>
          <feComposite
            in="leise"
            in2="SourceGraphic"
            operator="in"
            result="maske"
          />
          <feBlend in="SourceGraphic" in2="maske" mode="soft-light" />
        </filter>
        {/* Tusche: Raender leicht ausgefranst, als waere sie ins Papier gelaufen */}
        <filter id="bk-tusche" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="1"
            seed="11"
            result="r"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="r"
            scale="1.4"
            xChannelSelector="R"
            yChannelSelector="G"
            result="ausgefranst"
          />
          <feGaussianBlur in="ausgefranst" stdDeviation="0.25" />
        </filter>
        <linearGradient id="bk-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7a1" />
          <stop offset="0.45" stopColor="#e2b551" />
          <stop offset="1" stopColor="#a8761f" />
        </linearGradient>
      </defs>

      {/* base: rotes Reispapier mit Goldstaub */}
      <circle
        cx={M}
        cy={M}
        r={G / 2}
        fill="url(#bk-papier)"
        filter="url(#bk-fasern)"
      />
      {STAUB.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.g}
          fill="#f3cf6e"
          opacity={s.o}
        />
      ))}

      {/* Spaltenlinien in Tusche, wie auf einer beschriebenen Karte */}
      <g className="bk-linien">
        {[198, 150, 102].map((x) => (
          <line key={x} x1={x} y1={52} x2={x} y2={206} />
        ))}
        <line x1={58} y1={93} x2={242} y2={93} />
      </g>

      {/* highlight: goldenes Rautenblatt hinter dem Tagesmeister */}
      {(() => {
        const s = SAEULEN.find((x) => x.id === "day");
        const d = 23;
        return (
          <polygon
            points={`${s.x},${Y_STAMM - d - 4} ${s.x + d + 4},${Y_STAMM} ${s.x},${Y_STAMM + d + 4} ${s.x - d - 4},${Y_STAMM}`}
            fill="url(#bk-gold)"
            className="bk-raute"
          />
        );
      })()}

      {/* data: Koepfe und die acht Zeichen */}
      <g filter="url(#bk-tusche)" className="bk-tusche">
        {SAEULEN.map((s) => {
          const p = saeulen[s.id];
          return (
            <g key={s.id} opacity={p?.estimated ? 0.4 : 1}>
              <text x={s.x} y={Y_KOPF} className="bk-kopf">
                {s.kopf}
              </text>
              <text x={s.x} y={Y_STAMM} dy="0.36em" className="bk-zeichen">
                {STAMM[p?.stem] ?? "？"}
              </text>
              <text x={s.x} y={Y_ZWEIG} dy="0.36em" className="bk-zeichen">
                {ZWEIG[p?.branch] ?? "？"}
              </text>
            </g>
          );
        })}
      </g>

      {/* Fuenf Elemente: Punkte in den traditionellen Farben, Groesse nach Anteil */}
      <g>
        {ELEMENTE.map((e, i) => {
          const x = M + (i - 2) * 30;
          const a = Number(anteile[e.id] ?? 0);
          return (
            <g key={e.id}>
              <circle
                cx={x}
                cy={232}
                r={2.5 + a * 14}
                fill={e.farbe}
                className="bk-element"
              />
              <text
                x={x}
                y={258}
                dy="0.35em"
                className="bk-elementzeichen"
                filter="url(#bk-tusche)"
              >
                {e.zeichen}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
