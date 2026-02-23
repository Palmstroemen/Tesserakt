const SIGN_TO_TEMPERAMENT = {
  widder: "cholerisch",
  loewe: "cholerisch",
  schuetze: "cholerisch",
  zwillinge: "sanguinisch",
  waage: "sanguinisch",
  wassermann: "sanguinisch",
  krebs: "phlegmatisch",
  skorpion: "phlegmatisch",
  fische: "phlegmatisch",
  stier: "melancholisch",
  jungfrau: "melancholisch",
  steinbock: "melancholisch",
};

const BAZI_ELEMENT_TO_TEMPERAMENT = {
  feuer: "cholerisch",
  holz: "sanguinisch",
  wasser: "phlegmatisch",
  metall: "melancholisch",
  erde: "melancholisch",
};

function numerologieTemperament(lpz) {
  const map = {
    1: "cholerisch",
    2: "phlegmatisch",
    3: "sanguinisch",
    4: "melancholisch",
    5: "sanguinisch",
    6: "phlegmatisch",
    7: "melancholisch",
    8: "cholerisch",
    9: "sanguinisch",
    11: "phlegmatisch",
    22: "melancholisch",
    33: "sanguinisch",
  };
  return map[lpz] ?? null;
}

function systemTemperamente(inputs) {
  return {
    Westlich: SIGN_TO_TEMPERAMENT[inputs?.sonnenzeichen] ?? null,
    Bazi: BAZI_ELEMENT_TO_TEMPERAMENT[inputs?.day_master_element] ?? null,
    Numerologie: numerologieTemperament(Number(inputs?.lebenspfadzahl)),
    KO: null,
  };
}

export function calculateTemperament(ratingResult, inputs) {
  const assignment = systemTemperamente(inputs);
  const distribution = {
    cholerisch: 0,
    sanguinisch: 0,
    phlegmatisch: 0,
    melancholisch: 0,
  };

  let sum = 0;
  for (const [system, details] of Object.entries(ratingResult?.systemDetails ?? {})) {
    const temperament = assignment[system];
    if (!temperament || typeof details?.fitScore !== "number") {
      continue;
    }
    const weight = Math.max(0, details.fitScore) / 100;
    distribution[temperament] += weight;
    sum += weight;
  }

  if (!sum) {
    return { primaer: null, sekundaer: null, verteilung: distribution };
  }

  Object.keys(distribution).forEach((key) => {
    distribution[key] = Number((distribution[key] / sum).toFixed(4));
  });

  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const primaer = sorted[0][0];
  const sekundaer = sorted[1][1] >= 0.25 ? sorted[1][0] : null;

  return {
    primaer,
    sekundaer,
    verteilung: distribution,
    system_zuordnungen: assignment,
  };
}
