const DEFAULT_SYSTEMS = ["Westlich", "Bazi", "Numerologie", "KO"];

export function getGewicht(matrix, system, dimension, frageGewichte) {
  const konsens = matrix?.konsens_gewichtung ?? {};
  const matrixWeight = konsens?.[dimension]?.[system] ?? 1 / DEFAULT_SYSTEMS.length;
  const frageWeight = frageGewichte?.[system] ?? 1;
  return matrixWeight * frageWeight;
}

export function calculateRating(vektoren, antworten, matrix) {
  const systems = Object.keys(vektoren ?? {});
  const kumulFehler = Object.fromEntries(systems.map((s) => [s, 0]));
  const kumulGewicht = Object.fromEntries(systems.map((s) => [s, 0]));

  for (const eintrag of antworten) {
    const selbst = Number(eintrag.selbst_wert);
    const frageGewichte = eintrag.gewichte ?? {};

    for (const system of systems) {
      const wert = Number(eintrag.system_werte?.[system]);
      if (Number.isNaN(wert)) {
        continue;
      }
      const w = getGewicht(matrix, system, eintrag.dimension, frageGewichte);
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

  const values = Object.values(normiert);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const systemDetails = {};
  for (const system of systems) {
    if (!(system in normiert)) {
      systemDetails[system] = { rating: null, fehler: null, rang: null };
      continue;
    }
    const score = 100 * (1 - (normiert[system] - min) / span);
    systemDetails[system] = {
      rating: Number(score.toFixed(1)),
      fehler: Number(normiert[system].toFixed(4)),
      rang: null,
    };
  }

  const ranking = systems
    .filter((s) => systemDetails[s].rating !== null)
    .sort((a, b) => systemDetails[b].rating - systemDetails[a].rating);

  ranking.forEach((system, idx) => {
    systemDetails[system].rang = idx + 1;
  });

  return { ranking, systemDetails };
}
