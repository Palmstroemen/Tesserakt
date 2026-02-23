export function getQuestionWeights(systems, dimension, frageGewichte, matrix) {
  const konsens = matrix?.konsens_gewichtung ?? {};
  const raws = systems.map((system) => {
    const matrixWeight = konsens?.[dimension]?.[system] ?? 0;
    const frageWeight = frageGewichte?.[system] ?? 1;
    return { system, raw: matrixWeight * frageWeight };
  });

  let sum = raws.reduce((acc, item) => acc + item.raw, 0);
  if (sum <= 0) {
    raws.forEach((item) => {
      item.raw = frageGewichte?.[item.system] ?? 1;
    });
    sum = raws.reduce((acc, item) => acc + item.raw, 0);
  }

  if (sum <= 0) {
    const equal = 1 / Math.max(1, systems.length);
    return Object.fromEntries(systems.map((system) => [system, equal]));
  }

  return Object.fromEntries(raws.map((item) => [item.system, item.raw / sum]));
}

// For two independent U(1,5) variables: E[(X-Y)^2] = 8/3.
const RANDOM_BASELINE_MSE = 8 / 3;

export function calculateRating(vektoren, antworten, matrix) {
  const systems = Object.keys(vektoren ?? {});
  const kumulFehler = Object.fromEntries(systems.map((s) => [s, 0]));
  const kumulGewicht = Object.fromEntries(systems.map((s) => [s, 0]));

  for (const eintrag of antworten) {
    const selbst = Number(eintrag.selbst_wert);
    const frageGewichte = eintrag.gewichte ?? {};
    const questionWeights = getQuestionWeights(systems, eintrag.dimension, frageGewichte, matrix);

    for (const system of systems) {
      const wert = Number(eintrag.system_werte?.[system]);
      if (Number.isNaN(wert)) {
        continue;
      }
      const w = questionWeights[system] ?? 0;
      if (!w) {
        continue;
      }
      const diff = selbst - wert;
      const fehler = diff ** 2;
      kumulFehler[system] += fehler * w;
      kumulGewicht[system] += w;
    }
  }

  const normiert = {};
  for (const system of systems) {
    if (kumulGewicht[system] > 0) {
      normiert[system] = kumulFehler[system] / kumulGewicht[system];
    }
  }

  if (!Object.keys(normiert).length) {
    return { ranking: [], systemDetails: {} };
  }

  const systemDetails = {};
  for (const system of systems) {
    if (!(system in normiert)) {
      systemDetails[system] = { fitScore: null, skillScore: null, fehler: null, rang: null };
      continue;
    }
    const mse = normiert[system];
    const rmse = Math.sqrt(normiert[system]);
    const fitScore = Math.max(0, 100 * (1 - rmse / 4));
    const skillScore = Math.max(0, 100 * (1 - mse / RANDOM_BASELINE_MSE));
    systemDetails[system] = {
      fitScore: Number(fitScore.toFixed(1)),
      skillScore: Number(skillScore.toFixed(1)),
      fehler: Number(mse.toFixed(4)),
      rang: null,
    };
  }

  const ranking = systems
    .filter((s) => systemDetails[s].fitScore !== null)
    .sort((a, b) => {
      if (a === "KO") return 1;
      if (b === "KO") return -1;
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

  const koFit = systemDetails.KO?.fitScore ?? null;
  const koSkill = systemDetails.KO?.skillScore ?? null;
  const fitVsKO = {};
  const skillVsKO = {};
  if (koFit !== null) {
    for (const system of systems) {
      if (systemDetails[system]?.fitScore !== null) {
        fitVsKO[system] = Number((systemDetails[system].fitScore - koFit).toFixed(1));
      }
    }
  }
  if (koSkill !== null) {
    for (const system of systems) {
      if (systemDetails[system]?.skillScore !== null) {
        skillVsKO[system] = Number((systemDetails[system].skillScore - koSkill).toFixed(1));
      }
    }
  }

  return { ranking, systemDetails, fitVsKO, skillVsKO };
}
