import { useEffect, useRef } from "react";

// Uhrwerk in der Tiefe: ein Loch in der Grundplatte unter der Datumsscheibe und dem Auge. Man sieht hinein,
// solange sich die Scheibe auf die Kante dreht (Muenzdrehung nach Silber, Uebergang zum Auge). Vier Ebenen
// Zahnraeder, hinten viele kleine und dunkle, vorne wenige grosse; Nachbarn einer Ebene greifen ineinander
// (gleiche Zahnteilung, Drehzahl umgekehrt zum Radius). Vorne schwingt die Unruh.
// Gezeichnet auf einer Canvas, nur solange "laeuft" (sonst liegt das Loch verdeckt).

const EBENEN = [
  // Radien und Teilung in Einheiten des Lochradius; hell = Helligkeit des Messings (Tiefe)
  { rMin: 0.025, rMax: 0.06, teilung: 0.018, hell: 0.22, anzahl: 170 },
  { rMin: 0.045, rMax: 0.1, teilung: 0.027, hell: 0.38, anzahl: 80 },
  { rMin: 0.07, rMax: 0.16, teilung: 0.04, hell: 0.6, anzahl: 34 },
  { rMin: 0.13, rMax: 0.27, teilung: 0.058, hell: 0.95, anzahl: 12 },
];
const UNRUH = { x: 0.42, y: -0.38, r: 0.2 };
const MAX_DREHZAHL = 5; // rad/s

function zufallVon(saat) {
  let s = saat >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Raeder einer Ebene: Ketten, die sich von einem Rad aus verzweigen; jedes neue Rad greift in seinen
// Vorgaenger (Abstand = Summe der Teilkreisradien) und ueberlappt kein anderes
function ebeneAnlegen(e, zufall, frei) {
  const raeder = [];
  const passt = (x, y, r) =>
    Math.hypot(x, y) < 1.08 + r &&
    frei(x, y, r) &&
    raeder.every((g) => Math.hypot(g.x - x, g.y - y) > g.r + r + e.teilung);
  const neu = (r) => Math.max(6, Math.round((2 * Math.PI * r) / e.teilung));
  let versuche = 0;
  while (raeder.length < e.anzahl && versuche < e.anzahl * 40) {
    versuche += 1;
    const r0 = e.rMin + zufall() * (e.rMax - e.rMin);
    const kette = raeder.length && zufall() < 0.85;
    if (!kette) {
      const x = (zufall() * 2 - 1) * 1.05;
      const y = (zufall() * 2 - 1) * 1.05;
      if (!passt(x, y, r0)) continue;
      const n = neu(r0);
      raeder.push({
        x,
        y,
        n,
        r: (n * e.teilung) / (2 * Math.PI),
        w: (0.3 + zufall() * 0.9) * (zufall() < 0.5 ? -1 : 1),
        phase: zufall() * Math.PI * 2,
      });
      continue;
    }
    const a = raeder[Math.floor(zufall() * raeder.length)];
    const n = neu(r0);
    const r = (n * e.teilung) / (2 * Math.PI);
    const w = (-a.w * a.r) / r;
    if (Math.abs(w) > MAX_DREHZAHL) continue;
    const winkel = zufall() * Math.PI * 2;
    const x = a.x + Math.cos(winkel) * (a.r + r);
    const y = a.y + Math.sin(winkel) * (a.r + r);
    // der Vorgaenger selbst darf beruehrt werden
    const ohneA = raeder.filter((g) => g !== a);
    if (
      Math.hypot(x, y) > 1.08 + r ||
      !frei(x, y, r) ||
      !ohneA.every((g) => Math.hypot(g.x - x, g.y - y) > g.r + r + e.teilung)
    )
      continue;
    // Eingriff: Zahn des einen in die Luecke des anderen (Summe der Zahnlagen am Beruehrpunkt = 1/2)
    const lageA = (((winkel - a.phase) * a.n) / (2 * Math.PI)) % 1;
    const phase = winkel + Math.PI - ((0.5 - lageA) * 2 * Math.PI) / n;
    raeder.push({ x, y, n, r, w, phase });
  }
  return raeder;
}

function farbe(rgb, hell) {
  return `rgb(${rgb.map((c) => Math.round(c * hell)).join(",")})`;
}

// Zahnrad als Bild (einmal gezeichnet, dann nur noch gedreht): Messing mit konzentrischem Licht, damit es beim
// Drehen nicht mitwandert; groessere Raeder mit Speichen, durch die man tiefer sieht
function radBild(rPx, n, hell, teilungPx, schatten) {
  const h = teilungPx * 0.55;
  const aussen = rPx + h / 2;
  const innen = rPx - h / 2;
  const rand = Math.ceil(aussen * 0.35) + 2;
  const groesse = Math.ceil(2 * aussen + 2 * rand);
  const c = document.createElement("canvas");
  c.width = groesse;
  c.height = groesse;
  const g = c.getContext("2d");
  g.translate(groesse / 2, groesse / 2);
  // Zahnkranz
  g.beginPath();
  const schritt = (2 * Math.PI) / n;
  for (let i = 0; i < n; i += 1) {
    const a = i * schritt;
    g.lineTo(
      Math.cos(a - schritt * 0.3) * innen,
      Math.sin(a - schritt * 0.3) * innen,
    );
    g.lineTo(
      Math.cos(a - schritt * 0.16) * aussen,
      Math.sin(a - schritt * 0.16) * aussen,
    );
    g.lineTo(
      Math.cos(a + schritt * 0.16) * aussen,
      Math.sin(a + schritt * 0.16) * aussen,
    );
    g.lineTo(
      Math.cos(a + schritt * 0.3) * innen,
      Math.sin(a + schritt * 0.3) * innen,
    );
    g.arc(0, 0, innen, a + schritt * 0.3, a + schritt * 0.7);
  }
  g.closePath();
  const verlauf = g.createRadialGradient(0, 0, 0, 0, 0, aussen);
  verlauf.addColorStop(0, farbe([240, 210, 150], hell));
  verlauf.addColorStop(0.55, farbe([190, 145, 75], hell));
  verlauf.addColorStop(0.8, farbe([225, 185, 115], hell));
  verlauf.addColorStop(1, farbe([110, 75, 35], hell));
  g.save();
  // Schatten rundum: das Rad liegt ueber der tieferen Ebene
  g.shadowColor = "rgba(0,0,0,0.75)";
  // (nur vorne: weiche Schatten zu rechnen ist teuer, hinten sieht man sie im Dunkeln kaum)
  g.shadowBlur = schatten ? Math.max(2, aussen * 0.3) : 0;
  g.fillStyle = verlauf;
  g.fill();
  g.restore();
  g.lineWidth = Math.max(0.6, rPx * 0.02);
  g.strokeStyle = "rgba(20,10,0,0.7)";
  g.stroke();
  // Speichen (gleich breit, nicht keilfoermig): Fenster dazwischen ausschneiden
  if (rPx > 12) {
    const speichen = rPx > 40 ? 6 : rPx > 22 ? 5 : 4;
    const rIn = rPx * 0.3;
    const rAus = innen - rPx * 0.1;
    const halb = rPx * 0.055; // halbe Speichenbreite
    const fenster = new Path2D();
    for (let k = 0; k < speichen; k += 1) {
      const a = (k * 2 * Math.PI) / speichen;
      const b = ((k + 1) * 2 * Math.PI) / speichen;
      fenster.moveTo(
        Math.cos(a + halb / rIn) * rIn,
        Math.sin(a + halb / rIn) * rIn,
      );
      fenster.arc(0, 0, rAus, a + halb / rAus, b - halb / rAus);
      fenster.arc(0, 0, rIn, b - halb / rIn, a + halb / rIn, true);
      fenster.closePath();
    }
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.fill(fenster);
    g.restore();
    // Kante der Fenster
    g.strokeStyle = "rgba(20,10,0,0.6)";
    g.lineWidth = Math.max(0.5, rPx * 0.015);
    g.stroke(fenster);
  }
  // Nabe und Achse
  g.beginPath();
  g.arc(0, 0, Math.max(1.5, rPx * 0.2), 0, 2 * Math.PI);
  g.fillStyle = farbe([235, 200, 135], hell);
  g.fill();
  g.stroke();
  g.beginPath();
  g.arc(0, 0, Math.max(0.8, rPx * 0.07), 0, 2 * Math.PI);
  g.fillStyle = farbe([60, 40, 20], hell);
  g.fill();
  return c;
}

// Unruh: Ring mit drei Speichen und Schraubenkoepfen, schwingt hin und her
function unruhBild(rPx) {
  const rand = Math.ceil(rPx * 0.3) + 2;
  const groesse = Math.ceil(2 * rPx + 2 * rand);
  const c = document.createElement("canvas");
  c.width = groesse;
  c.height = groesse;
  const g = c.getContext("2d");
  g.translate(groesse / 2, groesse / 2);
  g.shadowColor = "rgba(0,0,0,0.75)";
  g.shadowBlur = rPx * 0.2;
  g.strokeStyle = "#d9b26a";
  g.lineWidth = rPx * 0.1;
  g.beginPath();
  g.arc(0, 0, rPx * 0.92, 0, 2 * Math.PI);
  g.stroke();
  g.lineWidth = rPx * 0.07;
  for (let k = 0; k < 3; k += 1) {
    const a = (k * 2 * Math.PI) / 3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(a) * rPx * 0.9, Math.sin(a) * rPx * 0.9);
    g.stroke();
  }
  g.shadowBlur = 0;
  for (let k = 0; k < 12; k += 1) {
    const a = (k * 2 * Math.PI) / 12;
    g.beginPath();
    g.arc(Math.cos(a) * rPx, Math.sin(a) * rPx, rPx * 0.055, 0, 2 * Math.PI);
    g.fillStyle = "#f2d9a0";
    g.fill();
  }
  // Spirale (Unruhfeder)
  g.strokeStyle = "rgba(40,50,70,0.9)";
  g.lineWidth = Math.max(0.6, rPx * 0.012);
  g.beginPath();
  for (let t = 0; t < 1; t += 0.005) {
    const a = t * Math.PI * 2 * 6;
    const r = rPx * (0.1 + t * 0.55);
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.stroke();
  g.beginPath();
  g.arc(0, 0, rPx * 0.1, 0, 2 * Math.PI);
  g.fillStyle = "#b8121f"; // Lagerstein
  g.fill();
  return c;
}

function werkAnlegen(R) {
  const zufall = zufallVon(1652);
  const unruh = { ...UNRUH };
  const ebenen = EBENEN.map((e, i) => {
    const vorne = i === EBENEN.length - 1;
    const frei = vorne
      ? (x, y, r) => Math.hypot(x - unruh.x, y - unruh.y) > unruh.r + r + 0.02
      : () => true;
    const raeder = ebeneAnlegen(e, zufall, frei);
    const teilungPx = e.teilung * R;
    // gleiche Zaehnezahl = gleiches Rad: ein Bild fuer alle
    const bilder = new Map();
    return raeder.map((g) => {
      if (!bilder.has(g.n))
        bilder.set(
          g.n,
          radBild(
            (g.n * teilungPx) / (2 * Math.PI),
            g.n,
            e.hell,
            teilungPx,
            i >= 2,
          ),
        );
      return { ...g, bild: bilder.get(g.n) };
    });
  });
  return { ebenen, unruh: { ...unruh, bild: unruhBild(unruh.r * R) } };
}

// einmal angelegt fuer alle Faecher (wartend und im Spiel), solange die Groesse gleich bleibt
let vorrat = null;
function werkFuer(R) {
  if (vorrat?.R !== R) vorrat = { R, werk: werkAnlegen(R) };
  return vorrat.werk;
}

export default function Uhrwerk({ laeuft }) {
  const canvasRef = useRef(null);
  const werk = useRef(null);
  const zeit = useRef(0);

  function zeichnen(t) {
    const c = canvasRef.current;
    const w = werk.current;
    if (!c || !w) return;
    const g = c.getContext("2d");
    const R = c.width / 2;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const grund = g.createRadialGradient(R, R, 0, R, R, R);
    grund.addColorStop(0, "#1c130a");
    grund.addColorStop(1, "#050302");
    g.fillStyle = grund;
    g.fillRect(0, 0, c.width, c.height);
    w.ebenen.forEach((raeder, i) => {
      for (const rad of raeder) {
        const a = rad.phase + rad.w * t;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        g.setTransform(cos, sin, -sin, cos, R + rad.x * R, R + rad.y * R);
        g.drawImage(rad.bild, -rad.bild.width / 2, -rad.bild.height / 2);
      }
      if (i === EBENEN.length - 1) {
        const u = w.unruh;
        const a = 2.2 * Math.sin(t * Math.PI * 2 * 2.5);
        g.setTransform(
          Math.cos(a),
          Math.sin(a),
          -Math.sin(a),
          Math.cos(a),
          R + u.x * R,
          R + u.y * R,
        );
        g.drawImage(u.bild, -u.bild.width / 2, -u.bild.height / 2);
      } else {
        // Dunst zwischen den Ebenen: je tiefer, desto dunkler
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.fillStyle = "rgba(8,5,2,0.28)";
        g.fillRect(0, 0, c.width, c.height);
      }
    });
    // Rand des Lochs: in die Tiefe hinein dunkler
    g.setTransform(1, 0, 0, 1, 0, 0);
    const rand = g.createRadialGradient(R, R, R * 0.7, R, R, R);
    rand.addColorStop(0, "rgba(0,0,0,0)");
    rand.addColorStop(1, "rgba(0,0,0,0.9)");
    g.fillStyle = rand;
    g.fillRect(0, 0, c.width, c.height);
  }

  useEffect(() => {
    const c = canvasRef.current;
    const dichte = Math.min(2, window.devicePixelRatio || 1);
    const R = Math.round((c.getBoundingClientRect().width * dichte) / 2);
    if (!R) return;
    c.width = 2 * R;
    c.height = 2 * R;
    werk.current = werkFuer(R);
    zeichnen(zeit.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!laeuft) return undefined;
    let bild = 0;
    let zuletzt = performance.now();
    const tick = (jetzt) => {
      zeit.current += (jetzt - zuletzt) / 1000;
      zuletzt = jetzt;
      zeichnen(zeit.current);
      bild = requestAnimationFrame(tick);
    };
    bild = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(bild);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laeuft]);

  return (
    <div className="sp-uhrwerk" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
