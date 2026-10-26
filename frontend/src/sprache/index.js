// Sprache des Apparats: aus den Spracheinstellungen des Geraets, ohne Schalter (Entdecken statt erklaeren).
// Gibt es die bevorzugte Sprache nicht, gilt die naechste in der Liste des Geraets, sonst Deutsch. Der Server
// bekommt dieselbe Sprache mit jeder Anfrage (holen in logic/api.js) und waehlt mit derselben Liste
// (backend/sprache.py: SPRACHEN muss hier und dort gleich sein).
//
// Je Sprache ein Ordner (de/, en/, ...) mit
// - oberflaeche.json: alle kurzen Texte der Oberflaeche, verschachtelt nach Bereich; t("bereich.schluessel")
// - einwilligung.md, datenverwendung.md: Vorblatt und ausfuehrliche Erklaerung
// - buchtexte.js: Leitsatz, Einleitung und Quellen des Buchs
// Was in einer Sprache fehlt, kommt aus dem Deutschen.

export const SPRACHEN = ["de"];
const GRUND = "de";

const OBERFLAECHE = import.meta.glob("./*/oberflaeche.json", {
  eager: true,
  import: "default",
});
const DATEIEN = import.meta.glob("./*/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});
const MODULE = import.meta.glob("./*/buchtexte.js", { eager: true });

function waehle(liste) {
  for (const angabe of liste) {
    const kuerzel = String(angabe).toLowerCase().split("-")[0];
    if (SPRACHEN.includes(kuerzel)) return kuerzel;
  }
  return GRUND;
}

export const sprache = waehle(
  typeof navigator === "undefined"
    ? []
    : (navigator.languages ?? [navigator.language]),
);
if (typeof document !== "undefined") document.documentElement.lang = sprache;

function nachschlagen(baum, schluessel) {
  return schluessel
    .split(".")
    .reduce((o, k) => (o == null ? undefined : o[k]), baum);
}

// Text zum Schluessel ("bereich.name"), Platzhalter {name} aus `werte` ersetzt. Ein Schluessel kann auch auf
// eine Liste oder Gruppe zeigen (z. B. Monatsnamen), dann kommt sie unveraendert zurueck.
export function t(schluessel, werte) {
  let text = nachschlagen(
    OBERFLAECHE[`./${sprache}/oberflaeche.json`],
    schluessel,
  );
  if (text === undefined)
    text = nachschlagen(OBERFLAECHE[`./${GRUND}/oberflaeche.json`], schluessel);
  if (text === undefined) {
    if (import.meta.env.DEV) console.warn(`Text fehlt: ${schluessel}`);
    return schluessel;
  }
  if (typeof text !== "string" || !werte) return text;
  return text.replace(/\{(\w+)\}/g, (ganz, name) =>
    name in werte ? String(werte[name]) : ganz,
  );
}

// Langer Text aus einer Markdown-Datei der Sprache (Name ohne Endung)
export function datei(name) {
  return DATEIEN[`./${sprache}/${name}.md`] ?? DATEIEN[`./${GRUND}/${name}.md`];
}

// Datei in der Grundsprache, etwa fuer die Version der Einwilligung (gilt fuer alle Uebersetzungen)
export function grunddatei(name) {
  return DATEIEN[`./${GRUND}/${name}.md`];
}

// Texte des Buchs (Leitsatz, Einleitung, Quellen)
export function buchtexte() {
  return (
    MODULE[`./${sprache}/buchtexte.js`] ?? MODULE[`./${GRUND}/buchtexte.js`]
  );
}

// Zahl im Format der Sprache (Dezimalkomma im Deutschen)
export function zahl(wert, optionen) {
  return new Intl.NumberFormat(sprache, optionen).format(wert);
}
