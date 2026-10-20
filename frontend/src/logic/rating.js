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

// User and vector scale -1..+1. expected = user value directly.
// Skill = 2 * (Perzentil - 50): 0 = Zufallsniveau, +100 = besser als alle Kontroll-Geburtsdaten,
// -100 = schlechter als alle. Version wird mit dem Rating gespeichert.
export const SKILL_METRIK = "perzentil_v1";

export function skillFromPerzentil(perzentil) {
  return perzentil === null ? null : 2 * (perzentil - 50);
}

// Erwarteter Skill des besten von k Systemen ohne Aussagekraft: 100 * (k - 1) / (k + 1).
export function erwarteterSkillBester(k) {
  return k > 0 ? (100 * (k - 1)) / (k + 1) : null;
}

// Perzentil: Anteil der Kontroll-Geburtsdaten (gleiches System, zufaelliges anderes Datum),
// die schlechter passen als das echte Geburtsdatum. Ohne Aussagekraft im Mittel 50.
export function calculatePerzentil(mse, kontrollMse) {
  if (!kontrollMse?.length) {
    return null;
  }
  let schlechter = 0;
  let gleich = 0;
  for (const wert of kontrollMse) {
    if (wert > mse) schlechter += 1;
    else if (wert === mse) gleich += 1;
  }
  return (100 * (schlechter + 0.5 * gleich)) / kontrollMse.length;
}

export function calculateRating(vektoren, antworten, matrix, kontrollvektoren = {}) {
  const systems = Object.keys(vektoren ?? {});
  const kumulFehler = Object.fromEntries(systems.map((s) => [s, 0]));
  const kumulGewicht = Object.fromEntries(systems.map((s) => [s, 0]));
  const kumulKontrollFehler = Object.fromEntries(
    systems.map((s) => [s, (kontrollvektoren?.[s] ?? []).map(() => 0)])
  );

  for (const eintrag of antworten) {
    const selbst = Number(eintrag.selbst_wert); // -1..+1
    const expected = selbst;
    const frageGewichte = eintrag.gewichte ?? {};
    const questionWeights = getQuestionWeights(systems, eintrag.dimension, frageGewichte, matrix);

    for (const system of systems) {
      const wert = Number(eintrag.system_werte?.[system]); // -1..+1
      if (Number.isNaN(wert)) {
        continue;
      }
      const w = questionWeights[system] ?? 0;
      if (!w) {
        continue;
      }
      const diff = expected - wert;
      const fehler = diff ** 2;
      kumulFehler[system] += fehler * w;
      kumulGewicht[system] += w;
      (kontrollvektoren?.[system] ?? []).forEach((kontrollVektor, i) => {
        const kontrollWert = Number(kontrollVektor?.[eintrag.dimension] ?? 0);
        kumulKontrollFehler[system][i] += (expected - kontrollWert) ** 2 * w;
      });
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
      systemDetails[system] = { fitScore: null, skillScore: null, perzentil: null, fehler: null, rang: null };
      continue;
    }
    const mse = normiert[system];
    const rmse = Math.sqrt(normiert[system]);
    const fitScore = Math.max(0, 100 * (1 - rmse / 2)); // max deviation = 2
    const kontrollMse = kumulKontrollFehler[system].map((summe) => summe / kumulGewicht[system]);
    const perzentil = calculatePerzentil(mse, kontrollMse);
    const skillScore = skillFromPerzentil(perzentil);
    systemDetails[system] = {
      fitScore: Number(fitScore.toFixed(1)),
      skillScore: skillScore === null ? null : Number(skillScore.toFixed(1)),
      perzentil: perzentil === null ? null : Number(perzentil.toFixed(1)),
      fehler: Number(mse.toFixed(4)),
      rang: null,
    };
  }

  const ranking = systems
    .filter((s) => systemDetails[s].fitScore !== null)
    .sort((a, b) => {
      if (a === "KO") return 1;
      if (b === "KO") return -1;
      const skillA = systemDetails[a].skillScore ?? -Infinity;
      const skillB = systemDetails[b].skillScore ?? -Infinity;
      if (skillB !== skillA) {
        return skillB - skillA;
      }
      if (systemDetails[b].fitScore !== systemDetails[a].fitScore) {
        return systemDetails[b].fitScore - systemDetails[a].fitScore;
      }
      return normiert[a] - normiert[b];
    });

  ranking.forEach((system, idx) => {
    systemDetails[system].rang = idx + 1;
  });

  const mitSkill = ranking.filter((s) => s !== "KO" && systemDetails[s].skillScore !== null).length;
  const skillErwartungBester = mitSkill ? Number(erwarteterSkillBester(mitSkill).toFixed(1)) : null;

  return { ranking, systemDetails, skillErwartungBester, skillMetrik: SKILL_METRIK };
}
