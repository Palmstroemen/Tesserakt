// Sprache fuer die Auswertung: in welcher Sprache die Fragen gestellt wurden (derzeit nur Deutsch) und die
// Spracheinstellung des Geraets (z. B. de-AT, zh-CN). Uebersetzte Fragen sind streng genommen andere Fragen;
// so laesst sich spaeter pruefen, ob Sprachen oder Regionen unterschiedlich antworten.
export const SPRACHE = "de";

export function spracheFelder() {
  return { sprache: SPRACHE, geraet_sprache: navigator.language ?? null };
}
