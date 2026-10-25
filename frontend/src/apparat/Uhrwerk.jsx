import { useEffect, useRef } from "react";

// Uhrwerk in der Tiefe: ein Loch in der Grundplatte unter der Datumsscheibe und dem Auge. Man sieht hinein,
// solange sich die Scheibe auf die Kante dreht (Muenzdrehung nach Silber, Uebergang zum Auge). Fuenf Ebenen
// Zahnraeder, hinten viele und dunkle, vorne wenige helle; Nachbarn einer Ebene greifen ineinander
// (gleiche Zahnteilung, Drehzahl umgekehrt zum Radius). Vorne schwingt die Unruh.
// Gezeichnet auf einer Canvas, nur solange "laeuft" (sonst liegt das Loch verdeckt).

const EBENEN = [
  // Radien und Teilung in Einheiten des Lochradius; hell = Helligkeit des Messings (Tiefe). Meist Raeder
  // zwischen rMin und rMax, jedes fuenfte ein grosses bis rGross: auch in der Tiefe liegen grosse Raeder.
  // riesen: [von, bis, Anzahl, Abstand von, bis] Raeder fast so gross wie das Loch, langsam; sie werden zuerst
  // gesetzt.
  {
    rMin: 0.035,
    rMax: 0.08,
    rGross: 0.24,
    teilung: 0.02,
    hell: 0.15,
    anzahl: 70,
    riesen: [0.62, 0.88, 2],
  },
  {
    rMin: 0.04,
    rMax: 0.1,
    rGross: 0.27,
    teilung: 0.026,
    hell: 0.25,
    riesen: [0.5, 0.7, 2],
    anzahl: 55,
  },
  {
    rMin: 0.05,
    rMax: 0.12,
    rGross: 0.3,
    teilung: 0.034,
    hell: 0.4,
    riesen: [0.42, 0.6, 1],
    anzahl: 40,
  },
  {
    rMin: 0.07,
    rMax: 0.15,
    rGross: 0.3,
    teilung: 0.044,
    hell: 0.62,
    riesen: [0.34, 0.48, 1],
    anzahl: 22,
  },
  {
    rMin: 0.13,
    rMax: 0.27,
    rGross: 0.27,
    teilung: 0.058,
    hell: 0.95,
    riesen: [0.5, 0.68, 2, 0.6, 0.95], // vorne zwei grosse, eher am Rand
    anzahl: 3, // nur diese drehen sich (mit der Unruh)
  },
];
const UNRUH = { x: 0.42, y: -0.38, r: 0.2 };
// Nur die vorderste Ebene (wenige grosse Raeder) und die Unruh drehen sich. Alles dahinter sind langsame
// Jahresraeder: einmal mit Werkplatte, Dunst und Zwischenplatten in ein festes Bild gebacken (Rechenzeit auf
// dem Handy).
const RUHENDE_EBENEN = EBENEN.length - 1;
// Lichtweg fuer das Dia: in der Mitte bleibt bis zu diesem Radius alles frei (Raeder, Platten, Bruecken)
const LICHTWEG = 0.3;
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
    Math.hypot(x, y) - r > LICHTWEG + e.teilung &&
    frei(x, y, r) &&
    raeder.every((g) => Math.hypot(g.x - x, g.y - y) > g.r + r + e.teilung);
  const neu = (r) => Math.max(6, Math.round((2 * Math.PI * r) / e.teilung));
  if (e.riesen) {
    const [von, bis, anzahl, dVon = 0, dBis = 0.75] = e.riesen;
    for (let k = 0, v = 0; k < anzahl && v < 200; v += 1) {
      const n = neu(von + zufall() * (bis - von));
      const rr = (n * e.teilung) / (2 * Math.PI);
      const a = zufall() * Math.PI * 2;
      const d = dVon + zufall() * (dBis - dVon);
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d;
      if (!passt(x, y, rr)) continue;
      raeder.push({
        x,
        y,
        n,
        r: rr,
        w: (0.08 + zufall() * 0.12) * (zufall() < 0.5 ? -1 : 1),
        phase: zufall() * Math.PI * 2,
      });
      k += 1;
    }
  }
  let versuche = 0;
  while (raeder.length < e.anzahl && versuche < e.anzahl * 40) {
    versuche += 1;
    const r0 =
      zufall() < 0.2
        ? e.rMax + zufall() * (e.rGross - e.rMax)
        : e.rMin + zufall() * (e.rMax - e.rMin);
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
      Math.hypot(x, y) - r < LICHTWEG + e.teilung ||
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
    const speichen = rPx > 150 ? 8 : rPx > 40 ? 6 : rPx > 22 ? 5 : 4;
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
            i >= 1,
          ),
        );
      return { ...g, bild: bilder.get(g.n) };
    });
  });
  // Schichten nach den Ebenen 1, 2 und 3 (zwischen ihnen und der naechsten)
  const schichtZufall = zufallVon(4711);
  const schichten = EBENEN.map((e, i) =>
    i >= 1 && i < EBENEN.length - 1
      ? schichtBild(R, schichtZufall, (e.hell + EBENEN[i + 1].hell) / 2)
      : null,
  );
  const werk = {
    ebenen,
    schichten,
    unruh: { ...unruh, bild: unruhBild(unruh.r * R) },
  };
  // halbfertiges Bild: Werkplatte und die ruhenden Ebenen
  const tiefe = document.createElement("canvas");
  tiefe.width = 2 * R;
  tiefe.height = 2 * R;
  const g = tiefe.getContext("2d");
  g.drawImage(grundBild(R), 0, 0);
  // das Rähmchen liegt vor den tiefsten Ebenen (die seine Mitte ohnehin frei lassen), aber hinter den
  // vorderen Raedern und Bruecken; ueber ihm liegt noch eine Dunstschicht
  const VOR_RAEHMCHEN = RUHENDE_EBENEN - 1;
  ebenenZeichnen(g, werk, R, 0, 0, VOR_RAEHMCHEN);
  raehmchen(g, R);
  ebenenZeichnen(g, werk, R, 0, VOR_RAEHMCHEN, RUHENDE_EBENEN);
  // Rand des Lochs: in die Tiefe hinein dunkler (einmal gerechnet, pro Bild nur aufgelegt)
  const rand = document.createElement("canvas");
  rand.width = 2 * R;
  rand.height = 2 * R;
  const gr = rand.getContext("2d");
  const verlauf = gr.createRadialGradient(R, R, R * 0.7, R, R, R);
  verlauf.addColorStop(0, "rgba(0,0,0,0)");
  verlauf.addColorStop(1, "rgba(0,0,0,0.9)");
  gr.fillStyle = verlauf;
  gr.fillRect(0, 0, 2 * R, 2 * R);
  return { ...werk, tiefe, rand };
}

// Ebenen von .. bis-1 zur Zeit t; nach jeder Ebene ausser der vordersten Dunst und die feste Schicht
function ebenenZeichnen(g, w, R, t, von, bis) {
  for (let i = von; i < bis; i += 1) {
    for (const rad of w.ebenen[i]) {
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
      g.fillStyle = "rgba(8,5,2,0.22)";
      g.fillRect(0, 0, 2 * R, 2 * R);
      if (w.schichten[i]) g.drawImage(w.schichten[i], 0, 0);
    }
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}

// Feste Schicht zwischen zwei Raederebenen: eine Platte vom Rand her mit runden Ausschnitten (dort sieht man
// tiefer) und ein, zwei geschwungene Bruecken quer darueber, mit Schrauben und Lagersteinen. Messing mit
// Genfer Streifen, Fase an der Kante, Schatten nach unten. Einmal gezeichnet, steht still.
function schichtBild(R, zufall, hell) {
  const c = document.createElement("canvas");
  c.width = 2 * R;
  c.height = 2 * R;
  const g = c.getContext("2d");
  g.translate(R, R);
  g.scale(R, R); // Einheiten des Lochradius
  const form = new Path2D();
  const loecher = [];
  // Platte: Kreisabschnitt vom Rand her, mit Ausschnitten
  const a = zufall() * Math.PI * 2;
  const d = 1.15 + zufall() * 0.15;
  const pr = 0.82;
  const px = Math.cos(a) * d;
  const py = Math.sin(a) * d;
  form.arc(px, py, pr, 0, 2 * Math.PI);
  const ausschnitte = 1 + Math.floor(zufall() * 2);
  for (let k = 0; k < ausschnitte; k += 1) {
    const b = a + Math.PI + (zufall() - 0.5) * 0.9;
    const lr = 0.1 + zufall() * 0.1;
    const ld = pr - lr - 0.08 - zufall() * 0.1;
    const lx = px + Math.cos(b) * ld;
    const ly = py + Math.sin(b) * ld;
    form.moveTo(lx + lr, ly);
    form.arc(lx, ly, lr, 0, 2 * Math.PI, true);
    loecher.push([lx, ly, lr]);
  }
  // Bruecken: Bogen zwischen zwei Punkten am Rand, mit runden Enden
  const bruecken = [];
  const anzahl = 1 + Math.floor(zufall() * 2);
  for (let k = 0, v = 0; k < anzahl && v < 100; v += 1) {
    const w0 = zufall() * Math.PI * 2;
    const w1 = w0 + Math.PI * (0.45 + zufall() * 0.5);
    const p0 = [Math.cos(w0) * 1.1, Math.sin(w0) * 1.1];
    const p1 = [Math.cos(w1) * 1.1, Math.sin(w1) * 1.1];
    const m = [
      (p0[0] + p1[0]) * 0.25 + (zufall() - 0.5) * 0.4,
      (p0[1] + p1[1]) * 0.25 + (zufall() - 0.5) * 0.4,
    ];
    const breite = 0.07 + zufall() * 0.06;
    // der Bogen bleibt ausserhalb des Lichtwegs
    let naechste = Infinity;
    let richtung = [0, 0];
    for (let i = 0; i <= 40; i += 1) {
      const t = i / 40;
      const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * m[0] + t * t * p1[0];
      const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * m[1] + t * t * p1[1];
      const d = Math.hypot(x, y);
      if (d < naechste) {
        naechste = d;
        richtung = [x / d, y / d];
      }
    }
    if (naechste - breite / 2 < LICHTWEG + 0.04) continue;
    // noch ein Stueck weiter nach aussen, weg vom Rähmchen in der Mitte
    const [dx, dy] = richtung.map((v) => v * 0.09);
    const weg = ([x, y]) => [x + dx, y + dy];
    bruecken.push({ p0: weg(p0), p1: weg(p1), m: weg(m), breite });
    k += 1;
  }
  const farbe = (rgb, f = 1) =>
    `rgb(${rgb.map((v) => Math.round(v * hell * f)).join(",")})`;
  const zeichneForm = (fuellen) => {
    fuellen(form, "evenodd");
    for (const br of bruecken) {
      g.lineCap = "round";
      g.lineWidth = br.breite;
      const p = new Path2D();
      p.moveTo(...br.p0);
      p.quadraticCurveTo(...br.m, ...br.p1);
      fuellen(p, null, br.breite);
    }
  };
  // Messing, darauf Genfer Streifen (breite schraege Baender, in der Mitte heller)
  zeichneForm((p, regel, breite) => {
    if (breite) {
      g.strokeStyle = "#000";
      g.stroke(p);
    } else {
      g.fillStyle = "#000";
      g.fill(p, regel);
    }
  });
  g.save();
  g.globalCompositeOperation = "source-atop";
  g.rotate(-0.5);
  const band = 0.14;
  for (let x = -1.6; x < 1.6; x += band) {
    const v = g.createLinearGradient(x, 0, x + band, 0);
    v.addColorStop(0, farbe([150, 112, 58]));
    v.addColorStop(0.5, farbe([228, 190, 120]));
    v.addColorStop(1, farbe([150, 112, 58]));
    g.fillStyle = v;
    g.fillRect(x, -1.6, band, 3.2);
  }
  g.restore();
  // dahinter: dunkle Kante und Schatten auf die Ebene darunter
  g.save();
  g.globalCompositeOperation = "destination-over";
  const SAUM = 0.012;
  zeichneForm((p, regel, breite) => {
    g.strokeStyle = "rgba(15,8,0,0.9)";
    g.lineWidth = (breite ?? 0) + SAUM;
    g.stroke(p);
  });
  g.shadowColor = "rgba(0,0,0,0.8)";
  g.shadowBlur = R * 0.05;
  g.shadowOffsetY = R * 0.02;
  zeichneForm((p, regel, breite) => {
    g.strokeStyle = g.fillStyle = "rgba(0,0,0,0.6)";
    if (breite) {
      g.lineWidth = breite + SAUM;
      g.stroke(p);
    } else g.fill(p, regel);
  });
  g.restore();
  for (const [lx, ly, lr] of loecher) {
    g.beginPath();
    g.arc(lx, ly, lr, Math.PI * 1.1, Math.PI * 1.9);
    g.strokeStyle = "rgba(10,5,0,0.8)";
    g.lineWidth = 0.012;
    g.stroke();
    g.beginPath();
    g.arc(lx, ly, lr, Math.PI * 0.1, Math.PI * 0.9);
    g.strokeStyle = `rgba(255,235,180,${0.4 * hell})`;
    g.lineWidth = 0.006;
    g.stroke();
  }
  // Schrauben und Lagersteine auf den Bruecken
  for (const br of bruecken) {
    for (const t of [0.22, 0.5, 0.78]) {
      const x =
        (1 - t) ** 2 * br.p0[0] + 2 * (1 - t) * t * br.m[0] + t ** 2 * br.p1[0];
      const y =
        (1 - t) ** 2 * br.p0[1] + 2 * (1 - t) * t * br.m[1] + t ** 2 * br.p1[1];
      if (Math.hypot(x, y) > 0.98) continue;
      const rs = br.breite * 0.28;
      g.beginPath();
      g.arc(x, y, rs, 0, 2 * Math.PI);
      if (t === 0.5) {
        g.fillStyle = farbe([230, 200, 140]);
        g.fill();
        g.beginPath();
        g.arc(x, y, rs * 0.5, 0, 2 * Math.PI);
        g.fillStyle = farbe([200, 30, 45], 1 / Math.max(hell, 0.6));
        g.fill();
      } else {
        g.fillStyle = farbe([90, 95, 110]); // gebläute Schraube
        g.fill();
        g.save();
        g.translate(x, y);
        g.rotate(zufall() * Math.PI);
        g.fillStyle = "rgba(0,0,0,0.7)";
        g.fillRect(-rs * 0.8, -rs * 0.15, rs * 1.6, rs * 0.3);
        g.restore();
      }
    }
  }
  return c;
}

// Grund: Werkplatte aus gebuerstetem Messing (Sonnenschliff, feine Kreise um die Mitte), mit Lagersteinen;
// sie liegt tief im Schatten (die Ebenen darueber dunkeln sie weiter ab)
function grundBild(R) {
  const c = document.createElement("canvas");
  c.width = 2 * R;
  c.height = 2 * R;
  const g = c.getContext("2d");
  const zufall = zufallVon(77);
  const verlauf = g.createRadialGradient(R * 0.8, R * 0.6, 0, R, R, R * 1.1);
  verlauf.addColorStop(0, "#8a6a38");
  verlauf.addColorStop(1, "#4a3618");
  g.fillStyle = verlauf;
  g.fillRect(0, 0, 2 * R, 2 * R);
  g.lineWidth = Math.max(0.5, R / 400);
  for (let r = 2; r < R * 1.45; r += g.lineWidth * (1 + zufall() * 1.5)) {
    const hell = zufall() < 0.5;
    g.strokeStyle = hell
      ? `rgba(255,230,170,${0.04 + zufall() * 0.07})`
      : `rgba(30,18,5,${0.05 + zufall() * 0.09})`;
    g.beginPath();
    g.arc(R, R, r, 0, 2 * Math.PI);
    g.stroke();
  }
  // Glanzkeile des Sonnenschliffs (Licht von oben links)
  const keil = g.createConicGradient
    ? g.createConicGradient(-Math.PI * 0.75, R, R)
    : null;
  if (keil) {
    keil.addColorStop(0, "rgba(255,235,180,0.16)");
    keil.addColorStop(0.12, "rgba(255,235,180,0)");
    keil.addColorStop(0.5, "rgba(255,235,180,0.12)");
    keil.addColorStop(0.62, "rgba(255,235,180,0)");
    keil.addColorStop(1, "rgba(255,235,180,0.16)");
    g.fillStyle = keil;
    g.fillRect(0, 0, 2 * R, 2 * R);
  }
  for (let k = 0; k < 9; k += 1) {
    const a = zufall() * Math.PI * 2;
    const d = (LICHTWEG + 0.06 + zufall() * 0.55) * R; // die Mitte gehoert dem Rähmchen
    const x = R + Math.cos(a) * d;
    const y = R + Math.sin(a) * d;
    const rs = R * 0.018;
    g.beginPath();
    g.arc(x, y, rs * 1.9, 0, 2 * Math.PI);
    g.fillStyle = "#c9a35e";
    g.fill();
    g.beginPath();
    g.arc(x, y, rs, 0, 2 * Math.PI);
    g.fillStyle = "#8e1426";
    g.fill();
  }
  return c;
}

// Am Ende des Lichtwegs, mitten auf der Werkplatte: das Rähmchen mit der Mattscheibe fuer die Dias, klein und
// kopfueber (wie das Bild hinter einer Linse), unverzerrt. Die Mattscheibe leuchtet schwach von hinten. Darueber
// liegt noch eine Dunstschicht, die Farben sind dafuer heller. Masse wie das Fenster der Diascheibe.
function raehmchen(g, R) {
  const s = R * 0.225; // halbe Fensterbreite; die Ecken duerfen ueber den Lichtweg ragen
  const rand = s * 0.32;
  g.save();
  g.translate(R, R);
  g.rotate(Math.PI);
  // Schein der Lampe um das Rähmchen
  const schein = g.createRadialGradient(0, 0, s * 0.6, 0, 0, s * 2.3);
  schein.addColorStop(0, "rgba(255,214,150,0.2)");
  schein.addColorStop(1, "rgba(255,214,150,0)");
  g.fillStyle = schein;
  g.fillRect(-s * 2.4, -s * 2.4, s * 4.8, s * 4.8);
  // Rahmen: dunkles Messing, Schatten auf die Platte
  const aussenB = s + rand;
  const oben = -s - rand * 2.6; // ueber dem Fenster (vor dem Drehen) die Lochreihe
  g.shadowColor = "rgba(0,0,0,0.7)";
  g.shadowBlur = s * 0.25;
  g.shadowOffsetY = -s * 0.08; // Licht kommt von oben; das Rähmchen ist gedreht
  const metall = g.createLinearGradient(0, oben, 0, s + rand);
  metall.addColorStop(0, "#4a371c");
  metall.addColorStop(1, "#76592e");
  g.fillStyle = metall;
  g.beginPath();
  g.roundRect(-aussenB, oben, 2 * aussenB, s + rand - oben, s * 0.08);
  g.fill();
  g.shadowColor = "transparent";
  // Mattscheibe: warmes Licht, zur Mitte heller, feines Korn
  const glas = g.createRadialGradient(0, 0, 0, 0, 0, s * 1.4);
  glas.addColorStop(0, "#ffe8c0");
  glas.addColorStop(1, "#b08e57");
  g.fillStyle = glas;
  g.fillRect(-s, -s, 2 * s, 2 * s);
  const zufall = zufallVon(31);
  for (let k = 0; k < s * s * 0.6; k += 1) {
    g.fillStyle =
      zufall() < 0.5 ? "rgba(255,248,225,0.18)" : "rgba(70,50,20,0.14)";
    g.fillRect(
      (zufall() * 2 - 1) * s,
      (zufall() * 2 - 1) * s,
      R / 300,
      R / 300,
    );
  }
  // Fase am Fenster: oben und links im Schatten
  g.lineWidth = Math.max(1, s * 0.05);
  g.strokeStyle = "rgba(20,12,4,0.8)";
  g.beginPath();
  g.moveTo(-s, s);
  g.lineTo(-s, -s);
  g.lineTo(s, -s);
  g.stroke();
  g.strokeStyle = "rgba(230,200,140,0.35)";
  g.beginPath();
  g.moveTo(s, -s);
  g.lineTo(s, s);
  g.lineTo(-s, s);
  g.stroke();
  // Lochreihe: das Licht scheint durch
  const n = 12;
  const y = -s - rand * 1.35;
  const r = s * 0.045;
  for (let k = 0; k < n; k += 1) {
    const x = (k / (n - 1) - 0.5) * s * 1.7;
    g.beginPath();
    g.arc(x, y, r, 0, 2 * Math.PI);
    g.fillStyle = "#fff0c8";
    g.fill();
  }
  g.restore();
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
    g.drawImage(w.tiefe, 0, 0);
    ebenenZeichnen(g, w, R, t, RUHENDE_EBENEN, EBENEN.length);
    g.drawImage(w.rand, 0, 0);
  }

  useEffect(() => {
    const c = canvasRef.current;
    const dichte = Math.min(1.5, window.devicePixelRatio || 1);
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
