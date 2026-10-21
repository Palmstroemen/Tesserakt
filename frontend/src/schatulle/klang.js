// Mechanische Geraeusche, synthetisch per Web Audio (keine Tondateien noetig).
// Der AudioContext darf erst nach einer Beruehrung starten (Browser-Regel), daher lazy.
let ctx = null;
let stumm = false;

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
  for (let i = 0; i < laenge; i += 1) daten[i] = (Math.random() * 2 - 1) * (1 - i / laenge) ** 3;
  const quelle = ac.createBufferSource();
  quelle.buffer = puffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = frequenz;
  filter.Q.value = 6;
  const gain = ac.createGain();
  gain.gain.value = lautstaerke;
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

export function zahnrad(anzahl, dauerSekunden, frequenz = 2400) {
  // Folge von Klicks waehrend sich ein Zeiger bewegt
  for (let i = 0; i < anzahl; i += 1) {
    rauschStoss(0.018, frequenz * (0.9 + Math.random() * 0.2), 0.18, (i / anzahl) * dauerSekunden);
  }
}
