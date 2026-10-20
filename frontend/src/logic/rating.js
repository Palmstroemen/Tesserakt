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

  const mitSkill = ranking.filter((s) => systemDetails[s].skillScore !== null).length;
  const skillErwartungBester = mitSkill ? Number(erwarteterSkillBester(mitSkill).toFixed(1)) : null;

  return { ranking, systemDetails, skillErwartungBester, skillMetrik: SKILL_METRIK };
}

// Spiel B, Zeitpunkt-Fragen: Abstand (Tage) zwischen erinnertem Ereignis und dem Hoehepunkt des Systems,
// summiert ueber die beantworteten Fragen; Perzentil gegen die Hoehepunkte der Kontroll-Geburtsdaten.
// antworten: [{ frage_id, tage_zurueck }] (nur "Ja" mit Zeitpunkt); timing: { frage_id: { system: tag } };
// kontrollTiming: { frage_id: { system: [tag, ...] } }.
// konstant: Wert, den das Backend fuer "kein Hoehepunkt im Zeitraum" liefert (inputs.timing_konstant).
// Systeme ohne Zeitaussage fuer alle beantworteten Fragen stehen nicht im Ranking (ohneAussage),
// ihr Skill wird trotzdem berechnet und gespeichert.
export function calculateTimingRating(antworten, timing, kontrollTiming, systeme, konstant = null) {
  const gewertet = antworten.filter((a) => typeof a.tage_zurueck === "number" && timing?.[a.frage_id]);
  if (!gewertet.length) {
    return { ranking: [], systemDetails: {}, skillErwartungBester: null, anzahl: 0 };
  }
  const systemDetails = {};
  for (const system of systeme) {
    const abstand = gewertet.reduce((sum, a) => sum + Math.abs(a.tage_zurueck - timing[a.frage_id][system]), 0);
    const n = kontrollTiming?.[gewertet[0].frage_id]?.[system]?.length ?? 0;
    const kontrollAbstaende = Array.from({ length: n }, (_, i) =>
      gewertet.reduce((sum, a) => sum + Math.abs(a.tage_zurueck - kontrollTiming[a.frage_id][system][i]), 0)
    );
    const perzentil = calculatePerzentil(abstand, kontrollAbstaende);
    const skillScore = skillFromPerzentil(perzentil);
    systemDetails[system] = {
      skillScore: skillScore === null ? null : Number(skillScore.toFixed(1)),
      perzentil: perzentil === null ? null : Number(perzentil.toFixed(1)),
      abstandTage: Number((abstand / gewertet.length).toFixed(1)),
    };
  }
  const ohneAussage = systeme.filter(
    (s) => konstant !== null && gewertet.every((a) => timing[a.frage_id][s] === konstant)
  );
  const ranking = systeme.filter((s) => !ohneAussage.includes(s)).sort(
    (a, b) =>
      (systemDetails[b].skillScore ?? -Infinity) - (systemDetails[a].skillScore ?? -Infinity) ||
      systemDetails[a].abstandTage - systemDetails[b].abstandTage
  );
  ranking.forEach((s, i) => {
    systemDetails[s].rang = i + 1;
  });
  const mitSkill = ranking.filter((s) => systemDetails[s].skillScore !== null).length;
  return {
    ranking,
    systemDetails,
    skillErwartungBester: mitSkill ? Number(erwarteterSkillBester(mitSkill).toFixed(1)) : null,
    anzahl: gewertet.length,
    ohneAussage,
    skillMetrik: SKILL_METRIK,
  };
}
