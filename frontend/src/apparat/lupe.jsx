// Lupe vor dem Dia im magischen Auge: SVG-Filter mit Polsterverzerrung (zum Rand hin staerker vergroessert,
// gerade Kanten biegen sich nach innen) und Unschaerfe, die zum Rand hin zunimmt. Die Verschiebung steht als
// Bild in einer Karte (Rot = x, Gruen = y), einmal per Canvas gerechnet.

const STAERKE = 0.16; // Polster: Quellradius = r / (1 + STAERKE * r^2), r = 1 am Rand der Linse
const N = 256; // Aufloesung der Karten (werden auf die Linse gestreckt)
const SPANNE = 0.4; // Wertebereich der Verschiebung (Anteile des Radius), passend zur STAERKE

let karten = null;

function kartenRechnen() {
  const leinwand = document.createElement("canvas");
  leinwand.width = N;
  leinwand.height = N;
  const ctx = leinwand.getContext("2d");
  const verschiebung = ctx.createImageData(N, N);
  const rand = ctx.createImageData(N, N);
  for (let j = 0; j < N; j += 1) {
    for (let i = 0; i < N; i += 1) {
      const x = ((i + 0.5) / N) * 2 - 1;
      const y = ((j + 0.5) / N) * 2 - 1;
      const r = Math.min(Math.hypot(x, y), 1.1);
      const g = 1 / (1 + STAERKE * r * r) - 1; // Quelle = Ziel * (1 + g)
      const o = (j * N + i) * 4;
      verschiebung.data[o] = Math.round((0.5 + (x * g) / SPANNE) * 255);
      verschiebung.data[o + 1] = Math.round((0.5 + (y * g) / SPANNE) * 255);
      verschiebung.data[o + 2] = 128;
      verschiebung.data[o + 3] = 255;
      // Randunschaerfe: innen nichts, ab gut der Haelfte des Radius zunehmend
      const t = Math.min(1, Math.max(0, (r - 0.5) / 0.45));
      rand.data[o + 3] = Math.round(t * t * (3 - 2 * t) * 255);
    }
  }
  ctx.putImageData(verschiebung, 0, 0);
  const karte = leinwand.toDataURL("image/png");
  ctx.clearRect(0, 0, N, N);
  ctx.putImageData(rand, 0, 0);
  return { karte, rand: leinwand.toDataURL("image/png") };
}

// Filter fuer eine Linse mit dem Durchmesser d (CSS-Pixel, nur fuer die Unschaerfe); in Einheiten des
// gefilterten Elements, denn WebKit legt userSpaceOnUse bei HTML-Elementen nicht an deren Ecke
export function LupenFilter({ id, d }) {
  if (!d) return null;
  karten ??= kartenRechnen();
  return (
    <svg className="sp-lupe-defs" width="0" height="0" aria-hidden="true">
      <filter
        id={id}
        x="0"
        y="0"
        width="1"
        height="1"
        filterUnits="objectBoundingBox"
        primitiveUnits="objectBoundingBox"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={karten.karte}
          xlinkHref={karten.karte}
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="none"
          result="karte"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="karte"
          scale={SPANNE / 2}
          xChannelSelector="R"
          yChannelSelector="G"
          result="verzerrt"
        />
        <feGaussianBlur in="verzerrt" stdDeviation={0.35 / d} result="scharf" />
        <feGaussianBlur
          in="verzerrt"
          stdDeviation={1.5 / d}
          result="unscharf"
        />
        <feImage
          href={karten.rand}
          xlinkHref={karten.rand}
          x="0"
          y="0"
          width="1"
          height="1"
          preserveAspectRatio="none"
          result="rand"
        />
        <feComposite in="unscharf" in2="rand" operator="in" result="randbild" />
        <feComposite in="scharf" in2="rand" operator="out" result="mitte" />
        <feComposite
          in="randbild"
          in2="mitte"
          operator="arithmetic"
          k2="1"
          k3="1"
        />
      </filter>
    </svg>
  );
}
