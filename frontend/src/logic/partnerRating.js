/**
 * Erwarteter Wert und Rating für Partner-Fragen.
 * Skala -1 (eher A) … 0 (ausgewogen) … +1 (eher B). Vektoren -1..+1; expected = (vecB - vecA) / 2.
 */

const DIMENSIONS = [
  "liebe", "beruf", "finanzen", "gesundheit",
  "soziales", "kreativitaet", "veraenderung", "spiritualitaet",
];

/**
 * Gewichteter erwarteter Slider-Wert für eine Dimension (-1..+1).
 * vektorenA/B: -1..+1 pro Dimension; (vb-va)/2 liegt in [-1,1].
 */
export function expectedPartner(vektorenA, vektorenB, dimension, matrix) {
  if (!vektorenA || !vektorenB) return 0;
  const konsens = matrix?.konsens_gewichtung ?? {};
  const dimWeights = konsens[dimension] ?? {};
  let weightedSum = 0;
  let weightSum = 0;
  for (const system of Object.keys(vektorenA)) {
    const va = Number(vektorenA[system]?.[dimension]);
    const vb = Number(vektorenB[system]?.[dimension]);
    if (Number.isNaN(va) || Number.isNaN(vb)) continue;
    const rawW = Number(dimWeights[system]);
    const w = Number.isNaN(rawW) || rawW <= 0 ? 1 : rawW;
    const diff = (vb - va) / 2;
    weightedSum += diff * w;
    weightSum += w;
  }
  if (weightSum <= 0) return 0;
  const raw = weightedSum / weightSum;
  return Math.max(-1, Math.min(1, raw));
}

/** E[((X-Y)/2)^2] for independent U(-1,1): (2/3)/4 = 1/6. */
const RANDOM_BASELINE_PARTNER_MSE = 1 / 6;

/**
 * Erwarteter Slider-Wert für eine Dimension bei einem System (-1..+1).
 * expected = (vecB - vecA) / 2.
 */
function expectedForSystem(vektorenA, vektorenB, system, dimension) {
  const va = Number(vektorenA[system]?.[dimension]);
  const vb = Number(vektorenB[system]?.[dimension]);
  if (Number.isNaN(va) || Number.isNaN(vb)) return 0;
  return Math.max(-1, Math.min(1, (vb - va) / 2));
}

/**
 * Berechnet pro-System-Rating (wie Spiel A) und Gesamt-Fit.
 * Liefert ranking, systemDetails (fitScore, skillScore, fehler, rang); Spalte 5 in der Anzeige bleibt frei.
 */
export function calculatePartnerRating(antworten, vektorenA, vektorenB, matrix) {
  if (!antworten?.length || !vektorenA || !vektorenB) {
    return {
      fitScore: null,
      totalError: null,
      expectedByDimension: {},
      ranking: [],
      systemDetails: {},
    };
  }
  const systems = Object.keys(vektorenA).filter((s) => s !== "KO");
  const konsens = matrix?.konsens_gewichtung ?? {};
  const expectedByDimension = {};
  for (const dim of DIMENSIONS) {
    expectedByDimension[dim] = expectedPartner(vektorenA, vektorenB, dim, matrix);
  }

  const kumulFehler = Object.fromEntries(systems.map((s) => [s, 0]));
  const kumulGewicht = Object.fromEntries(systems.map((s) => [s, 0]));

  for (const a of antworten) {
    const dim = a.dimension;
    const userVal = a.partner_wert ?? 0;
    const dimWeights = konsens[dim] ?? {};
    for (const system of systems) {
      const expected = expectedForSystem(vektorenA, vektorenB, system, dim);
      let w = Number(dimWeights[system]);
      if (Number.isNaN(w) || w <= 0) w = 1;
      const diff = userVal - expected;
      kumulFehler[system] += diff * diff * w;
      kumulGewicht[system] += w;
    }
  }

  const normiert = {};
  for (const system of systems) {
    if (kumulGewicht[system] > 0) {
      normiert[system] = kumulFehler[system] / kumulGewicht[system];
    }
  }

  const systemDetails = {};
  for (const system of systems) {
    if (!(system in normiert)) {
      systemDetails[system] = { fitScore: null, skillScore: null, fehler: null, rang: null };
      continue;
    }
    const mse = normiert[system];
    const rmse = Math.sqrt(mse);
    const fitScore = Math.max(0, 100 * (1 - rmse / 2)); // max deviation 2 on -1..+1
    const skillScore = 100 * (1 - mse / RANDOM_BASELINE_PARTNER_MSE);
    systemDetails[system] = {
      fitScore: Number(fitScore.toFixed(1)),
      skillScore: Number(skillScore.toFixed(1)),
      fehler: Number(mse.toFixed(4)),
      rang: null,
    };
  }

  const ranking = systems
    .filter((s) => systemDetails[s].fitScore != null)
    .sort((a, b) => {
      if (systemDetails[b].skillScore !== systemDetails[a].skillScore) {
        return systemDetails[b].skillScore - systemDetails[a].skillScore;
      }
      if (systemDetails[b].fitScore !== systemDetails[a].fitScore) {
        return systemDetails[b].fitScore - systemDetails[a].fitScore;
      }
      return normiert[a] - normiert[b];
    });
  ranking.forEach((system, idx) => {
    systemDetails[system].rang = idx + 1;
  });

  const totalError = Object.values(kumulFehler).reduce((a, b) => a + b, 0);
  const totalWeight = Object.values(kumulGewicht).reduce((a, b) => a + b, 0);
  const mseGesamt = totalWeight > 0 ? totalError / totalWeight : 0;
  const fitScore = totalWeight > 0 ? Math.max(0, 100 * (1 - Math.sqrt(mseGesamt) / 2)) : null;

  return {
    fitScore: fitScore != null ? Number(fitScore.toFixed(1)) : null,
    totalError: totalWeight > 0 ? Number(totalError.toFixed(4)) : null,
    expectedByDimension,
    ranking,
    systemDetails,
  };
}
