// Mechanische Geraeusche, synthetisch per Web Audio (keine Tondateien noetig).
// Der AudioContext darf erst nach einer Beruehrung starten (Browser-Regel), daher lazy.
let ctx = null;
let stumm = false;
// Gesamtlautstaerke aller Geraeusche: der Apparat ist ein feiner Mechanismus (Test: halb so laut)
const GESAMT = 0.5;

export function setStumm(wert) {
  stumm = wert;
}

function audio() {
  if (stumm) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function rauschStoss(dauer, frequenz, lautstaerke, verzoegerung = 0) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + verzoegerung;
  const laenge = Math.max(1, Math.floor(ac.sampleRate * dauer));
  const puffer = ac.createBuffer(1, laenge, ac.sampleRate);
  const daten = puffer.getChannelData(0);
  for (let i = 0; i < laenge; i += 1)
    daten[i] = (Math.random() * 2 - 1) * (1 - i / laenge) ** 3;
  const quelle = ac.createBufferSource();
  quelle.buffer = puffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequenz;
  filter.Q.value = 6;
  const gain = ac.createGain();
  gain.gain.value = lautstaerke * GESAMT;
  quelle.connect(filter).connect(gain).connect(ac.destination);
  quelle.start(t);
}

export function rastKlick() {
  rauschStoss(0.025, 3200, 0.35);
}

export function hebel() {
  // dumpfes Einrasten: tiefer Stoss + metallisches Klacken
  rauschStoss(0.12, 180, 0.9);
  rauschStoss(0.05, 1400, 0.4, 0.05);
}

export function ratsche() {
  // alle Schieber schnappen zurueck
  zahnrad(7, 0.16, 2100);
}

export function sperre() {
  // Hebel blockiert: dumpfes Anschlagen
  rauschStoss(0.06, 260, 0.7);
}

// Papier knistert: leises breites Rauschen mit vielen kleinen Knacksern, an- und abschwellend wie die Bewegung
// der Hand; hochpassgefiltert, damit es trocken klingt und nicht nach Wind.
function knistern(dauer, lautstaerke, verzoegerung = 0) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + verzoegerung;
  const rate = ac.sampleRate;
  const laenge = Math.max(1, Math.floor(rate * dauer));
  const puffer = ac.createBuffer(1, laenge, rate);
  const daten = puffer.getChannelData(0);
  let knacks = 0;
  let knacksLaut = 0;
  for (let i = 0; i < laenge; i += 1) {
    const x = i / laenge;
    const huelle = Math.sin(Math.PI * x) ** 1.5;
    // neuer Knackser (etwa 120 pro Sekunde, in der Mitte der Bewegung dichter)
    if (Math.random() < (120 / rate) * (0.4 + huelle)) {
      knacks = Math.floor(rate * (0.001 + Math.random() * 0.004));
      knacksLaut = 0.3 + Math.random() * 0.7;
    }
    let wert = (Math.random() * 2 - 1) * 0.12 * huelle;
    if (knacks > 0) {
      wert += (Math.random() * 2 - 1) * knacksLaut * huelle;
      knacks -= 1;
      knacksLaut *= 0.997;
    }
    daten[i] = wert;
  }
  const quelle = ac.createBufferSource();
  quelle.buffer = puffer;
  const hoch = ac.createBiquadFilter();
  hoch.type = "highpass";
  hoch.frequency.value = 1500;
  hoch.Q.value = 0.7;
  const tief = ac.createBiquadFilter();
  tief.type = "lowpass";
  tief.frequency.value = 9000;
  const gain = ac.createGain();
  gain.gain.value = lautstaerke * GESAMT;
  quelle.connect(hoch).connect(tief).connect(gain).connect(ac.destination);
  quelle.start(t);
}

export function papier(auf = true) {
  // Zettel auf- oder zufalten: zwei Knicke nacheinander (auffalten etwas laenger)
  if (auf) {
    knistern(0.26, 0.5);
    knistern(0.3, 0.42, 0.3);
  } else {
    knistern(0.18, 0.4);
    knistern(0.2, 0.35, 0.16);
  }
}

export function einrasten() {
  rauschStoss(0.04, 900, 0.5);
}

export function zahnrad(
  anzahl,
  dauerSekunden,
  frequenz = 2400,
  { verz = 0, ease = null } = {},
) {
  // Folge von Klicks waehrend sich ein Zeiger bewegt. Mit ease (Verlauf der Bewegung, 0..1) klickt es dort,
  // wo der Zeiger eine Rast ueberfaehrt: schnell am Anfang, langsamer zum Ende hin.
  const MESSPUNKTE = 200;
  let k = 0;
  for (let i = 0; i < anzahl; i += 1) {
    let anteil = i / anzahl;
    if (ease) {
      const ziel = (i + 0.5) / anzahl;
      while (k < MESSPUNKTE && ease(k / MESSPUNKTE) < ziel) k += 1;
      anteil = k / MESSPUNKTE;
    }
    rauschStoss(
      0.018,
      frequenz * (0.9 + Math.random() * 0.2),
      0.18,
      verz + anteil * dauerSekunden,
    );
  }
}
