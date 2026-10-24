import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CanvasTexture,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Shape,
  Vector2,
  WebGLRenderer,
} from "three";
import DECKEL from "./kaestchen/deckel.json";
import deckelBild from "./kaestchen/deckel.webp";
import filmDatei from "./kaestchen/film.mp4";
import { einrasten, hebel, rastKlick, sperre } from "./klang";

// Das verschlossene Kaestchen vor dem Apparat (bei jedem Besuch; beim allerersten Mal davor der Film, der auf
// dem Deckel endet). Der Deckel ist zweiteilig: Sonne links, Mond rechts, die Fuge laeuft im Holz gerade und
// in der Einlage entlang der Gesichtsprofile (tools/kaestchen.py zeichnet sie nach). Die Haelften haben eine
// echte Dicke (etwa 5 mm, die Einlage 2 mm tief) und schwingen an Scharnieren ausserhalb des Bildschirms nach
// links und rechts auf. Oeffnen: Riegel unter dem Titel zur Seite schieben, der Deckel springt einen Spalt
// auf, dann eine Haelfte mit dem Finger aufziehen.
//
// Masse in Bildpunkten des Deckelbilds; auf dem Bildschirm liegt der Mittelpunkt der Einlage ueber dem der
// Datumsscheibe, der Deckel ist etwas breiter als der Bildschirm (die Scharniere liegen ausserhalb).

const { breite: W, hoehe: H, einlage: EINLAGE, fuge: FUGE } = DECKEL;
const QUELLE = { breite: 1152, hoehe: 2048 }; // Bildausschnitt am Ende des Films (Deckel_1)
const DICKE = 46; // etwa 5 mm
const METALL = 18; // etwa 2 mm
const ANTEIL = 0.85; // Anteil der Deckelbreite auf dem Bildschirm
const SPALT = 4; // Grad, wenn der Riegel offen ist
const OFFEN = 108; // Grad, ganz aufgeschwungen
const RIEGEL = { y: 1530, weg: 70 };
export const FILM_GESEHEN = "tesserakt-film";

// --- Fuge --------------------------------------------------------------------------------------------------

const FUGE_LAENGEN = (() => {
  const s = [0];
  for (let i = 1; i < FUGE.length; i += 1)
    s.push(
      s[i - 1] +
        Math.hypot(FUGE[i][0] - FUGE[i - 1][0], FUGE[i][1] - FUGE[i - 1][1]),
    );
  return s;
})();
const FUGE_LAENGE = FUGE_LAENGEN[FUGE_LAENGEN.length - 1];

function fugeX(y) {
  for (let i = 1; i < FUGE.length; i += 1)
    if (FUGE[i][1] >= y) {
      const [x0, y0] = FUGE[i - 1];
      const [x1, y1] = FUGE[i];
      return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0 || 1);
    }
  return FUGE[FUGE.length - 1][0];
}

// Punkt und Normale (zur Haelfte hin) bei Bogenlaenge t
function fugePunkt(t) {
  let i = 1;
  while (i < FUGE.length - 1 && FUGE_LAENGEN[i] < t) i += 1;
  const [x0, y0] = FUGE[i - 1];
  const [x1, y1] = FUGE[i];
  const l = FUGE_LAENGEN[i] - FUGE_LAENGEN[i - 1] || 1;
  const u = Math.min(1, Math.max(0, (t - FUGE_LAENGEN[i - 1]) / l));
  const tx = (x1 - x0) / l;
  const ty = (y1 - y0) / l;
  return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, nx: -ty, ny: tx }; // n zeigt nach links
}

// --- Bilder ------------------------------------------------------------------------------------------------

function zufallsquelle(saat) {
  let a = saat >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Wertrauschen in einer Richtung (fuer Holzfasern entlang der Kante)
function rauschen1d(laenge, abstand, zufall) {
  const stuetz = Array.from(
    { length: Math.ceil(laenge / abstand) + 2 },
    zufall,
  );
  const erg = new Float32Array(laenge);
  for (let i = 0; i < laenge; i += 1) {
    const p = i / abstand;
    const k = Math.floor(p);
    const f = p - k;
    const g = f * f * (3 - 2 * f);
    erg[i] = stuetz[k] * (1 - g) + stuetz[k + 1] * g;
  }
  return erg;
}

function rundRechteck(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function patina(ctx, x, y, w, h, zufall, menge) {
  for (let i = 0; i < menge; i += 1) {
    const dunkel = zufall() < 0.7;
    ctx.fillStyle = dunkel
      ? `rgba(40,25,8,${0.08 + zufall() * 0.18})`
      : `rgba(255,236,180,${0.06 + zufall() * 0.12})`;
    ctx.beginPath();
    ctx.arc(
      x + zufall() * w,
      y + zufall() * h,
      0.4 + zufall() * 1.6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function messingFlaeche(ctx, x, y, w, h, r, { schatten = 4 } = {}) {
  ctx.save();
  ctx.shadowColor = "rgba(20,8,2,0.6)";
  ctx.shadowBlur = schatten * 1.6;
  ctx.shadowOffsetX = schatten * 0.5;
  ctx.shadowOffsetY = schatten;
  const g = ctx.createLinearGradient(x, y, x + w * 0.5, y + h);
  g.addColorStop(0, "#d9b86c");
  g.addColorStop(0.5, "#a17d3b");
  g.addColorStop(1, "#5e4420");
  ctx.fillStyle = g;
  rundRechteck(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
  // Kanten: Licht oben links, Schatten unten rechts
  ctx.save();
  rundRechteck(ctx, x + 1, y + 1, w - 2, h - 2, r - 1);
  ctx.clip();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,240,190,0.55)";
  rundRechteck(ctx, x + 2.5, y + 2.5, w + 4, h + 4, r);
  ctx.stroke();
  ctx.strokeStyle = "rgba(40,22,5,0.5)";
  rundRechteck(ctx, x - 4, y - 4, w + 1.5, h + 1.5, r);
  ctx.stroke();
  ctx.restore();
}

function schraube(ctx, x, y, r, winkel) {
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r);
  g.addColorStop(0, "#e8cf8e");
  g.addColorStop(0.6, "#9a773a");
  g.addColorStop(1, "#4a3415");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(30,15,3,0.8)";
  ctx.lineWidth = r * 0.3;
  ctx.beginPath();
  ctx.moveTo(x - Math.cos(winkel) * r * 0.75, y - Math.sin(winkel) * r * 0.75);
  ctx.lineTo(x + Math.cos(winkel) * r * 0.75, y + Math.sin(winkel) * r * 0.75);
  ctx.stroke();
}

// Lage der Riegelteile (Bildpunkte)
function riegelMasse() {
  const fx = fugeX(RIEGEL.y);
  const y = RIEGEL.y;
  return {
    fx,
    y,
    platte: { x: fx + 6, y: y - 38, w: 160, h: 76 }, // rechte Haelfte, Fuehrung
    gegen: { x: fx - 64, y: y - 30, w: 56, h: 60 }, // linke Haelfte, Grundplatte unter der Krampe
    krampe: { x: fx - 54, y: y - 34, w: 34, h: 68 },
    riegel: { x: fx - 58, w: 150, h: 18 }, // geschlossen; Knauf am rechten Ende
  };
}

// Deckeloberseite: Foto plus die festen Messingteile der Schliesse
function deckelZeichnen(bild) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  ctx.drawImage(bild, 0, 0);
  const m = riegelMasse();
  const zufall = zufallsquelle(11);
  const { platte: p, gegen: g } = m;
  messingFlaeche(ctx, p.x, p.y, p.w, p.h, 9);
  messingFlaeche(ctx, g.x, g.y, g.w, g.h, 7);
  // Fuehrungsschlitz in der Platte
  ctx.fillStyle = "#2a1a08";
  rundRechteck(ctx, p.x + 4, m.y - 12, p.w - 40, 24, 6);
  ctx.fill();
  ctx.fillStyle = "rgba(255,230,170,0.35)";
  ctx.fillRect(p.x + 8, m.y + 10, p.w - 48, 2);
  schraube(ctx, p.x + p.w - 18, p.y + 16, 7, 0.6);
  schraube(ctx, p.x + p.w - 18, p.y + p.h - 16, 7, 2.1);
  schraube(ctx, g.x + 12, g.y + 12, 6, 1.2);
  schraube(ctx, g.x + 12, g.y + g.h - 12, 6, 0.2);
  patina(ctx, p.x, p.y, p.w, p.h, zufall, 140);
  patina(ctx, g.x, g.y, g.w, g.h, zufall, 50);
  return c;
}

function riegelBild() {
  const { riegel: r } = riegelMasse();
  const rand = 14;
  const knauf = 19;
  const hoehe = knauf * 2 + rand * 2;
  const c = document.createElement("canvas");
  const k = 2;
  c.width = (r.w + rand * 2) * k;
  c.height = hoehe * k;
  const ctx = c.getContext("2d");
  ctx.scale(k, k);
  const mitte = hoehe / 2;
  ctx.save();
  ctx.shadowColor = "rgba(15,6,0,0.65)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;
  // Stange (rund: Licht oben)
  const g = ctx.createLinearGradient(0, mitte - r.h / 2, 0, mitte + r.h / 2);
  g.addColorStop(0, "#f0d692");
  g.addColorStop(0.35, "#c29b52");
  g.addColorStop(1, "#4c3514");
  ctx.fillStyle = g;
  rundRechteck(ctx, rand, mitte - r.h / 2, r.w, r.h, r.h / 2);
  ctx.fill();
  // Knauf
  const kx = rand + r.w - knauf - 6;
  const gk = ctx.createRadialGradient(
    kx - knauf * 0.35,
    mitte - knauf * 0.4,
    1,
    kx,
    mitte,
    knauf,
  );
  gk.addColorStop(0, "#f6e2a8");
  gk.addColorStop(0.5, "#b08a45");
  gk.addColorStop(1, "#4a3313");
  ctx.fillStyle = gk;
  ctx.beginPath();
  ctx.arc(kx, mitte, knauf, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Riffeln am Knauf
  ctx.strokeStyle = "rgba(50,30,8,0.45)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 24; i += 1) {
    const w = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(
      kx + Math.cos(w) * knauf * 0.78,
      mitte + Math.sin(w) * knauf * 0.78,
    );
    ctx.lineTo(
      kx + Math.cos(w) * knauf * 0.98,
      mitte + Math.sin(w) * knauf * 0.98,
    );
    ctx.stroke();
  }
  patina(ctx, rand, mitte - knauf, r.w, knauf * 2, zufallsquelle(5), 60);
  return { canvas: c, breite: r.w + rand * 2, hoehe, versatz: rand };
}

function krampeBild() {
  const { krampe: kr } = riegelMasse();
  const rand = 10;
  const c = document.createElement("canvas");
  const k = 2;
  c.width = (kr.w + rand * 2) * k;
  c.height = (kr.h + rand * 2) * k;
  const ctx = c.getContext("2d");
  ctx.scale(k, k);
  messingFlaeche(ctx, rand, rand, kr.w, kr.h, 6, { schatten: 5 });
  // Wulst: der Buegel woelbt sich ueber den Riegel
  const g = ctx.createLinearGradient(rand, 0, rand + kr.w, 0);
  g.addColorStop(0, "rgba(255,240,190,0.35)");
  g.addColorStop(0.5, "rgba(255,240,190,0)");
  g.addColorStop(1, "rgba(30,15,0,0.35)");
  ctx.fillStyle = g;
  ctx.fillRect(rand, rand + 4, kr.w, kr.h - 8);
  patina(ctx, rand, rand, kr.w, kr.h, zufallsquelle(9), 40);
  return { canvas: c, breite: kr.w + rand * 2, hoehe: kr.h + rand * 2 };
}

// Schnittkante entlang der Fuge: Holz im Querschnitt, in der Einlage oben das Metall (2 mm), wo die
// Schnitzerei die Fuge kreuzt eine Kerbe. Die Farben kommen aus dem Deckelbild neben der Fuge.
// Rechts schliesst ein Stueck glattes Holz fuer die uebrigen Kanten an.
const KANTE_ZEILEN = 64;
const KANTE_REST = 256;
function kanteZeichnen(pixel, seite, zufall) {
  const laenge = Math.ceil(FUGE_LAENGE);
  const breite = laenge + KANTE_REST;
  const c = document.createElement("canvas");
  c.width = breite;
  c.height = KANTE_ZEILEN;
  const ctx = c.getContext("2d");
  const daten = ctx.createImageData(breite, KANTE_ZEILEN);
  const d = daten.data;
  const probe = (x, y) => {
    const xi = Math.min(W - 1, Math.max(0, Math.round(x)));
    const yi = Math.min(H - 1, Math.max(0, Math.round(y)));
    const i = (yi * W + xi) * 4;
    return [pixel[i], pixel[i + 1], pixel[i + 2]];
  };
  // Farben und Helligkeit entlang der Fuge (etwas neben dem Spalt)
  const farben = [];
  const hell = new Float32Array(laenge);
  const metall = new Uint8Array(laenge);
  for (let t = 0; t < laenge; t += 1) {
    const p = fugePunkt(t);
    const nx = p.nx * seite;
    const ny = p.ny * seite;
    const a = probe(p.x + nx * 6, p.y + ny * 6);
    const b = probe(p.x + nx * 10, p.y + ny * 10);
    const f = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    farben.push(f);
    hell[t] = 0.3 * f[0] + 0.59 * f[1] + 0.11 * f[2];
    metall[t] =
      Math.hypot(p.x - EINLAGE.x, p.y - EINLAGE.y) < EINLAGE.r - 4 ? 1 : 0;
  }
  // Holzfarbe als gleitendes Mittel der hellen Stellen; Kerbe, wo es deutlich dunkler ist
  const holz = [];
  const kerbe = new Float32Array(laenge);
  const fenster = 60;
  for (let t = 0; t < laenge; t += 1) {
    let s = [0, 0, 0];
    let n = 0;
    let h = 0;
    for (
      let u = Math.max(0, t - fenster);
      u < Math.min(laenge, t + fenster);
      u += 4
    ) {
      if (metall[u]) continue;
      s = [s[0] + farben[u][0], s[1] + farben[u][1], s[2] + farben[u][2]];
      h += hell[u];
      n += 1;
    }
    holz.push(n ? [s[0] / n, s[1] / n, s[2] / n] : [92, 40, 22]);
    const mittel = n ? h / n : hell[t];
    kerbe[t] = metall[t]
      ? 0
      : Math.min(1, Math.max(0, (mittel - hell[t]) / mittel - 0.25) * 2.2);
  }
  const fasern = Array.from({ length: KANTE_ZEILEN }, () =>
    rauschen1d(breite, 30 + zufall() * 90, zufall),
  );
  const metallZeilen = Math.round((METALL / DICKE) * KANTE_ZEILEN);
  for (let x = 0; x < breite; x += 1) {
    const t = Math.min(x, laenge - 1);
    const rest = x >= laenge;
    const grund = rest ? holz[laenge - 1] : holz[t];
    const istMetall = !rest && metall[t];
    const tiefe = rest ? 0 : Math.round(kerbe[t] * KANTE_ZEILEN * 0.45);
    for (let z = 0; z < KANTE_ZEILEN; z += 1) {
      const i = (z * breite + x) * 4;
      let farbe;
      let alpha = 255;
      if (z < tiefe) {
        alpha = 0;
        farbe = [0, 0, 0];
      } else if (istMetall && z < metallZeilen) {
        const f = farben[t];
        const glanz = z < 2 ? 1.35 : 1.08 - (z / metallZeilen) * 0.3;
        farbe = [f[0] * glanz, f[1] * glanz, f[2] * glanz];
      } else if (istMetall && z < metallZeilen + 2) {
        farbe = [26, 14, 6]; // Leimfuge unter der Einlage
      } else {
        // Holz im Schnitt: etwas dunkler als die Oberflaeche, Fasern laufen entlang der Kante
        const faser = 0.78 + fasern[z][x] * 0.3 + (zufall() - 0.5) * 0.06;
        const unten = z > KANTE_ZEILEN - 4 ? 0.6 : 1;
        const oben = z === tiefe && !istMetall ? 1.25 : 1;
        const k = 0.82 * faser * unten * oben;
        farbe = [grund[0] * k, grund[1] * k, grund[2] * k];
      }
      d[i] = Math.min(255, farbe[0]);
      d[i + 1] = Math.min(255, farbe[1]);
      d[i + 2] = Math.min(255, farbe[2]);
      d[i + 3] = alpha;
    }
  }
  ctx.putImageData(daten, 0, 0);
  return c;
}

// Unterseite des Deckels: glattes Holz (aus dem angesetzten Stueck unten), dunkler
function unterseiteZeichnen(bild) {
  const c = document.createElement("canvas");
  c.width = W / 2;
  c.height = H / 2;
  const ctx = c.getContext("2d");
  const quelle = { y: 1960, h: 480 };
  const h = quelle.h / 2;
  for (let y = 0, i = 0; y < c.height; y += h, i += 1) {
    ctx.save();
    if (i % 2) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(bild, 0, quelle.y, W, quelle.h, 0, y, c.width, h);
    ctx.restore();
  }
  ctx.fillStyle = "rgba(25,10,4,0.45)";
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

// Das Bild gleich beim Laden der Seite anfordern, nicht erst wenn das Kaestchen erscheint
let deckelVersprechen = null;
function deckelLaden() {
  if (!deckelVersprechen) {
    const bild = new Image();
    bild.src = deckelBild;
    deckelVersprechen = bild.decode().then(() => bild);
  }
  return deckelVersprechen;
}
if (typeof window !== "undefined") deckelLaden();

// --- Geometrie ---------------------------------------------------------------------------------------------

function haelfteBauen(seite, texturen) {
  // seite: -1 links (Sonne), +1 rechts (Mond); Form in Bildpunkten, y nach oben (Bild-y negativ)
  const form = new Shape();
  if (seite < 0) {
    form.moveTo(0, 0);
    for (const [x, y] of FUGE) form.lineTo(x, -y);
    form.lineTo(0, -H);
  } else {
    form.moveTo(W, 0);
    form.lineTo(W, -H);
    for (let i = FUGE.length - 1; i >= 0; i -= 1)
      form.lineTo(FUGE[i][0], -FUGE[i][1]);
  }
  const schluessel = (x, y) => `${x.toFixed(2)},${y.toFixed(2)}`;
  const aufFuge = new Map(
    FUGE.map(([x, y], i) => [schluessel(x, -y), FUGE_LAENGEN[i]]),
  );
  const kanteBreite = Math.ceil(FUGE_LAENGE) + KANTE_REST;
  const uvs = {
    generateTopUV(_g, v, a, b, c) {
      return [a, b, c].map(
        (i) => new Vector2(v[i * 3] / W, 1 + v[i * 3 + 1] / H),
      );
    },
    generateSideWallUV(_g, v, a, b, c, d) {
      const ta = aufFuge.get(schluessel(v[a * 3], v[a * 3 + 1]));
      const tb = aufFuge.get(schluessel(v[b * 3], v[b * 3 + 1]));
      let ua;
      let ub;
      if (ta !== undefined && tb !== undefined) {
        ua = ta / kanteBreite;
        ub = tb / kanteBreite;
      } else {
        const l = Math.hypot(v[a * 3] - v[b * 3], v[a * 3 + 1] - v[b * 3 + 1]);
        ua = (FUGE_LAENGE + 8) / kanteBreite;
        ub = (FUGE_LAENGE + 8 + Math.min(l, KANTE_REST - 16)) / kanteBreite;
      }
      const z = (i) => v[i * 3 + 2] / DICKE;
      return [
        new Vector2(ua, z(a)),
        new Vector2(ub, z(b)),
        new Vector2(ub, z(c)),
        new Vector2(ua, z(d)),
      ];
    },
  };
  const geo = new ExtrudeGeometry(form, {
    depth: DICKE,
    bevelEnabled: false,
    UVGenerator: uvs,
  });
  geo.translate(0, 0, -DICKE);
  // Deckflaechen trennen: zuerst die Unterseite, dann die Oberseite (ExtrudeGeometry ohne Fase)
  const [deck, seiten] = geo.groups;
  geo.clearGroups();
  geo.addGroup(0, deck.count / 2, 2);
  geo.addGroup(deck.count / 2, deck.count / 2, 0);
  geo.addGroup(seiten.start, seiten.count, 1);
  const stoffe = [
    new MeshBasicMaterial({ map: texturen.oben }),
    new MeshBasicMaterial({
      map: seite < 0 ? texturen.kanteLinks : texturen.kanteRechts,
      alphaTest: 0.5,
    }),
    new MeshBasicMaterial({ map: texturen.unten }),
  ];
  const koerper = new Mesh(geo, stoffe);
  // Drehpunkt: Scharnier an der Aussenkante unten
  const gelenk = new Group();
  gelenk.position.set(seite < 0 ? 0 : W, 0, -DICKE);
  koerper.position.set(seite < 0 ? 0 : -W, 0, DICKE);
  gelenk.add(koerper);
  return { gelenk, koerper, stoffe };
}

function textur(canvas) {
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function flaeche(bild, breite, hoehe) {
  const t = textur(bild);
  return new Mesh(
    new PlaneGeometry(breite, hoehe),
    new MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }),
  );
}

// Helligkeit einer Flaeche mit Normale n (Licht von oben links, zum Betrachter hin); Oberseite in Ruhe = 1
const LICHT = (() => {
  const l = [-0.35, 0.45, 0.82];
  const n = Math.hypot(...l);
  return l.map((x) => x / n);
})();
function helligkeit(nx, nz) {
  const d = Math.max(0, nx * LICHT[0] + nz * LICHT[2]);
  return Math.min(1.15, 0.38 + (0.62 * d) / LICHT[2]);
}

// --- Lage auf dem Bildschirm -------------------------------------------------------------------------------

function lageMessen() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rad = document.querySelector(".dr-svg")?.getBoundingClientRect();
  const B = rad?.width || Math.min(vw, 440);
  const cx = rad ? rad.left + rad.width / 2 : vw / 2;
  const cy = rad ? rad.top + rad.width / 2 : B / 2;
  const s = B / (ANTEIL * W);
  return { vw, vh, s, ox: cx - s * EINLAGE.x, oy: cy - s * EINLAGE.y };
}

// wie das letzte Bild des Films: Deckel_1 bildschirmfuellend (object-fit: cover)
function filmLage(lage) {
  const s = Math.max(lage.vw / QUELLE.breite, lage.vh / QUELLE.hoehe);
  return {
    ...lage,
    s,
    ox: (lage.vw - s * QUELLE.breite) / 2,
    oy: (lage.vh - s * QUELLE.hoehe) / 2,
  };
}

const easeAus = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const RAD = Math.PI / 180;

export default function Kaestchen({ film, onOffen }) {
  const halter = useRef(null);
  const videoRef = useRef(null);
  const welt = useRef(null);
  const [bereit, setBereit] = useState(false);
  const [filmLaeuft, setFilmLaeuft] = useState(film);
  const schattenRef = useRef(null);
  const filmVorbei = useRef(false);
  const [weg, setWeg] = useState(false);

  // Film gleich beim Einblenden starten (die Einwilligung davor war eine Beruehrung, Ton ist also erlaubt)
  useLayoutEffect(() => {
    const v = videoRef.current;
    if (!film || !v) return;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(filmEnde);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [film]);

  useEffect(() => {
    let renderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      onOffen();
      return undefined;
    }
    let abgebrochen = false;
    const zustand = {
      lage: lageMessen(),
      von: null, // Filmlage waehrend der Ueberleitung
      fahrt: 1,
      winkel: [0, 0], // links, rechts (Grad)
      riegel: 0, // 0 = zu, 1 = offen
      phase: "zu", // zu | frei | auf
    };
    const szene = new Scene();
    const kamera = new PerspectiveCamera(30, 1, 1, 10000);
    const deckel = new Group();
    szene.add(deckel);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    halter.current.appendChild(renderer.domElement);
    let teile = null;

    function groesse() {
      const { vw, vh } = zustand.lage;
      renderer.setSize(vw, vh);
      const abstand = vh * 1.7;
      kamera.fov = (2 * Math.atan(vh / 2 / abstand)) / RAD;
      kamera.aspect = vw / vh;
      kamera.position.set(0, 0, abstand);
      kamera.near = abstand * 0.2;
      kamera.far = abstand * 3;
      kamera.updateProjectionMatrix();
    }

    function zeichnen() {
      if (!teile) return;
      const { lage, von, fahrt } = zustand;
      const mix = (a, b) => a + (b - a) * fahrt;
      const s = von ? mix(von.s, lage.s) : lage.s;
      const ox = von ? mix(von.ox, lage.ox) : lage.ox;
      const oy = von ? mix(von.oy, lage.oy) : lage.oy;
      deckel.scale.set(s, s, s);
      deckel.position.set(ox - lage.vw / 2, lage.vh / 2 - oy, 0);
      teile.haelften.forEach((h, i) => {
        const seite = i === 0 ? -1 : 1;
        const phi = seite * zustand.winkel[i] * RAD;
        h.gelenk.rotation.y = phi;
        // Normalen nach der Drehung: oben (0,0,1), Fugenkante (-seite,0,0), unten (0,0,-1)
        const [oben, kante, unten] = [
          [0, 1],
          [-seite, 0],
          [0, -1],
        ].map(([nx, nz]) =>
          helligkeit(
            nx * Math.cos(phi) + nz * Math.sin(phi),
            -nx * Math.sin(phi) + nz * Math.cos(phi),
          ),
        );
        h.stoffe[0].color.setScalar(oben);
        h.stoffe[1].color.setScalar(Math.max(0.62, kante));
        h.stoffe[2].color.setScalar(Math.max(0.25, unten * 0.8));
      });
      const m = teile.masse;
      teile.riegel.position.x =
        m.riegel.x -
        teile.riegelBild.versatz +
        teile.riegelBild.breite / 2 +
        zustand.riegel * RIEGEL.weg;
      renderer.render(szene, kamera);
      const offen = (zustand.winkel[0] + zustand.winkel[1]) / 2;
      schattenRef.current.style.opacity = Math.max(0, 1 - offen / 80) ** 1.3;
    }

    // kleine Animationsmaschine: Ziele je Groesse, eine Schleife fuer alles
    const laeufe = new Map();
    let schleife = 0;
    function animiere(name, setzen, von, bis, dauer, ease = easeAus, fertig) {
      laeufe.set(name, {
        setzen,
        von,
        bis,
        dauer,
        ease,
        fertig,
        start: performance.now(),
      });
      if (!schleife) schleife = requestAnimationFrame(takt);
    }
    function takt(jetzt) {
      schleife = 0;
      for (const [name, l] of [...laeufe]) {
        const t = Math.min(1, (jetzt - l.start) / l.dauer);
        l.setzen(l.von + (l.bis - l.von) * l.ease(Math.max(0, t)));
        if (t >= 1) {
          laeufe.delete(name);
          l.fertig?.();
        }
      }
      zeichnen();
      if (laeufe.size && !abgebrochen) schleife = requestAnimationFrame(takt);
    }
    const setWinkel = (i) => (w) => {
      zustand.winkel[i] = w;
    };

    // --- Bilder laden und Deckel bauen ---
    deckelLaden()
      .then((bild) => {
        if (abgebrochen) return;
        const oben = deckelZeichnen(bild);
        const pixel = oben.getContext("2d").getImageData(0, 0, W, H).data;
        const zufall = zufallsquelle(3);
        const texturen = {
          oben: textur(oben),
          kanteLinks: textur(kanteZeichnen(pixel, 1, zufall)),
          kanteRechts: textur(kanteZeichnen(pixel, -1, zufall)),
          unten: textur(unterseiteZeichnen(bild)),
        };
        texturen.oben.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const haelften = [
          haelfteBauen(-1, texturen),
          haelfteBauen(1, texturen),
        ];
        haelften.forEach((h) => deckel.add(h.gelenk));
        const masse = riegelMasse();
        const rb = riegelBild();
        const riegel = flaeche(rb.canvas, rb.breite, rb.hoehe);
        riegel.position.set(0, -masse.y, 1.5);
        haelften[1].koerper.add(riegel);
        const kb = krampeBild();
        const krampe = flaeche(kb.canvas, kb.breite, kb.hoehe);
        krampe.position.set(
          masse.krampe.x + masse.krampe.w / 2,
          -(masse.krampe.y + masse.krampe.h / 2),
          3,
        );
        haelften[0].koerper.add(krampe);
        teile = { haelften, masse, riegel, riegelBild: rb };
        if (film) zustand.fahrt = 0;
        zustand.von = film ? filmLage(zustand.lage) : null;
        groesse();
        zeichnen();
        setBereit(true);
        if (filmVorbei.current) welt.current.ueberleiten();
      })
      .catch(() => onOffen());

    // --- Bedienung ---
    let ziehen = null;
    let ruhe = 0;
    function hinweisPlanen() {
      clearTimeout(ruhe);
      ruhe = setTimeout(() => {
        if (zustand.phase !== "zu" || ziehen || zustand.fahrt < 1) return;
        // der Riegel ruckt ein wenig, als wolle er bewegt werden
        rastKlick();
        animiere(
          "riegel",
          (r) => (zustand.riegel = r),
          0,
          0.08,
          160,
          easeAus,
          () =>
            animiere(
              "riegel",
              (r) => (zustand.riegel = r),
              0.08,
              0,
              260,
              easeInOut,
            ),
        );
        hinweisPlanen();
      }, 6000);
    }

    function riegelAufSchirm() {
      const { lage } = zustand;
      const m = teile.masse;
      const knaufX = m.riegel.x + m.riegel.w - 25 + zustand.riegel * RIEGEL.weg;
      return { x: lage.ox + lage.s * knaufX, y: lage.oy + lage.s * m.y };
    }

    function runter(e) {
      if (!teile || zustand.fahrt < 1 || zustand.phase === "auf") return;
      e.preventDefault();
      hinweisPlanen();
      const { lage } = zustand;
      if (zustand.phase === "zu") {
        const k = riegelAufSchirm();
        if (Math.hypot(e.clientX - k.x, e.clientY - k.y) < 44) {
          ziehen = { art: "riegel", x0: e.clientX, r0: zustand.riegel };
          laeufe.delete("riegel");
        } else {
          // verschlossen: die Haelften ruckeln nur
          sperre();
          [0, 1].forEach((i) =>
            animiere(`w${i}`, setWinkel(i), 0, 0.7, 70, easeAus, () =>
              animiere(`w${i}`, setWinkel(i), 0.7, 0, 140, easeInOut),
            ),
          );
        }
      } else {
        const mitte = lage.ox + lage.s * fugeX((e.clientY - lage.oy) / lage.s);
        const i = e.clientX < mitte ? 0 : 1;
        laeufe.delete(`w${i}`);
        ziehen = {
          art: "deckel",
          i,
          x0: e.clientX,
          w0: zustand.winkel[i],
          t: performance.now(),
          v: 0,
        };
      }
      halter.current.setPointerCapture(e.pointerId);
    }

    function bewegen(e) {
      if (!ziehen) return;
      const { lage } = zustand;
      const dx = e.clientX - ziehen.x0;
      if (ziehen.art === "riegel") {
        zustand.riegel = Math.min(
          1,
          Math.max(0, ziehen.r0 + dx / lage.s / RIEGEL.weg),
        );
      } else {
        const seite = ziehen.i === 0 ? -1 : 1;
        const breite = (lage.s * W) / 2;
        const w = Math.min(
          OFFEN,
          Math.max(SPALT * 0.5, ziehen.w0 + ((seite * dx) / breite) * 95),
        );
        const jetzt = performance.now();
        ziehen.v =
          (w - zustand.winkel[ziehen.i]) / Math.max(1, jetzt - ziehen.t);
        ziehen.t = jetzt;
        zustand.winkel[ziehen.i] = w;
      }
      if (!schleife) schleife = requestAnimationFrame(takt);
    }

    function hoch() {
      if (!ziehen) return;
      const z = ziehen;
      ziehen = null;
      if (z.art === "riegel") {
        if (zustand.riegel > 0.55) {
          animiere(
            "riegel",
            (r) => (zustand.riegel = r),
            zustand.riegel,
            1,
            90,
            easeAus,
            () => {
              einrasten();
              zustand.phase = "frei";
              setTimeout(() => {
                // der Deckel springt einen Spalt auf
                hebel();
                [0, 1].forEach((i) =>
                  animiere(
                    `w${i}`,
                    setWinkel(i),
                    0,
                    SPALT * 1.6,
                    120,
                    easeAus,
                    () =>
                      animiere(
                        `w${i}`,
                        setWinkel(i),
                        SPALT * 1.6,
                        SPALT,
                        260,
                        easeInOut,
                      ),
                  ),
                );
              }, 140);
            },
          );
        } else {
          animiere(
            "riegel",
            (r) => (zustand.riegel = r),
            zustand.riegel,
            0,
            160,
            easeAus,
            sperre,
          );
        }
        return;
      }
      const w = zustand.winkel[z.i];
      if (w > 24 || z.v > 0.12) {
        // ganz auf: die gezogene Haelfte schwingt weiter, die andere folgt
        zustand.phase = "auf";
        const andere = 1 - z.i;
        animiere(
          `w${z.i}`,
          setWinkel(z.i),
          w,
          OFFEN,
          700 * (1 - w / OFFEN) + 250,
          easeAus,
        );
        setTimeout(
          () =>
            animiere(
              `w${andere}`,
              setWinkel(andere),
              zustand.winkel[andere],
              OFFEN,
              900,
              easeInOut,
              () => {
                setWeg(true);
                setTimeout(onOffen, 350);
              },
            ),
          160,
        );
      } else {
        animiere(`w${z.i}`, setWinkel(z.i), w, SPALT, 300, easeInOut);
      }
    }

    function neuMessen() {
      zustand.lage = lageMessen();
      groesse();
      zeichnen();
    }

    const el = halter.current;
    el.addEventListener("pointerdown", runter);
    el.addEventListener("pointermove", bewegen);
    el.addEventListener("pointerup", hoch);
    el.addEventListener("pointercancel", hoch);
    window.addEventListener("resize", neuMessen);
    hinweisPlanen();

    welt.current = {
      // Ende des Films: vom Filmausschnitt auf die Lage ueber der Datumsscheibe fahren
      ueberleiten() {
        if (!teile || !zustand.von) return;
        animiere(
          "fahrt",
          (f) => (zustand.fahrt = f),
          0,
          1,
          1600,
          easeInOut,
          () => {
            zustand.von = null;
            hinweisPlanen();
          },
        );
      },
    };

    return () => {
      abgebrochen = true;
      cancelAnimationFrame(schleife);
      clearTimeout(ruhe);
      el.removeEventListener("pointerdown", runter);
      el.removeEventListener("pointermove", bewegen);
      el.removeEventListener("pointerup", hoch);
      el.removeEventListener("pointercancel", hoch);
      window.removeEventListener("resize", neuMessen);
      szene.traverse((o) => {
        o.geometry?.dispose();
        [o.material].flat().forEach((m) => {
          m?.map?.dispose();
          m?.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function filmEnde() {
    filmVorbei.current = true;
    try {
      localStorage.setItem(FILM_GESEHEN, "1");
    } catch {
      // ohne Speicher kommt der Film eben beim naechsten Mal wieder
    }
    setFilmLaeuft(false);
    welt.current?.ueberleiten();
  }

  // Film ohne fertigen Deckel nicht ausblenden
  const filmZeigen = filmLaeuft || !bereit;
  return (
    <div className={weg ? "ka-ebene ka-weg" : "ka-ebene"}>
      <div ref={schattenRef} className="ka-schatten" />
      <div ref={halter} className="ka-deckel" />
      {film ? (
        <video
          ref={videoRef}
          className={filmZeigen ? "ka-film" : "ka-film ka-film-aus"}
          src={filmDatei}
          playsInline
          preload="auto"
          onEnded={filmEnde}
          onError={filmEnde}
        />
      ) : null}
    </div>
  );
}
