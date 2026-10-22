// Preisstaffel fuer das gedruckte Horoskopbuch (Euro, inkl. USt., ohne Versand). Index = Anzahl Horoskope.
// Platzhalter: Preise und Aktionen werden vor dem Verkauf festgelegt.
export const PREISE = [0, 15, 20, 23, 25, 27, 29, 30];

// Aktionen mit Zeitraum, z. B. ein Weihnachtsrabatt (Anteil 0..1)
export const AKTIONEN = [
  // { name: "Weihnachten", von: "2026-12-01", bis: "2026-12-24", rabatt: 0.2 },
];

function aktionHeute(heute = new Date()) {
  const tag = heute.toISOString().slice(0, 10);
  return AKTIONEN.find((a) => a.von <= tag && tag <= a.bis) ?? null;
}

// Preis fuer n Horoskope, mit einer laufenden Aktion
export function buchPreis(n, heute = new Date()) {
  const grund = PREISE[Math.min(n, PREISE.length - 1)] ?? 0;
  const aktion = aktionHeute(heute);
  const preis = aktion ? Math.round(grund * (1 - aktion.rabatt)) : grund;
  return { grund, preis, aktion };
}
