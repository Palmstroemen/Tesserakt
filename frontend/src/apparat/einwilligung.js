// Einwilligungen aus dem Vorblatt (Kamera, Datenverwendung), lokal auf dem Geraet gespeichert. Aendert sich die
// version im Kopf von src/sprache/de/einwilligung.md, fragt das Vorblatt neu. Die Version gilt fuer alle
// Sprachen: wer den Text aendert, aendert ihn ueberall und zaehlt sie im deutschen Text hoch.
import { grunddatei } from "../sprache";
import { lesen } from "./markdown";

const SCHLUESSEL = "tesserakt-einwilligung";
export const VERSION = lesen(grunddatei("einwilligung")).kopf.version ?? "1";

let aktuell = null;

// gespeicherte Einwilligung der aktuellen Textversion oder null
export function einwilligungLaden() {
  try {
    const e = JSON.parse(localStorage.getItem(SCHLUESSEL));
    aktuell = e?.version === VERSION ? e : null;
  } catch {
    aktuell = null;
  }
  return aktuell;
}

export function einwilligungSpeichern({ kamera, daten }) {
  aktuell = {
    version: VERSION,
    kamera,
    daten,
    datum: new Date().toISOString().slice(0, 10),
  };
  try {
    localStorage.setItem(SCHLUESSEL, JSON.stringify(aktuell));
  } catch {
    // ohne Speicher (z. B. privates Fenster): gilt fuer diese Sitzung
  }
  return aktuell;
}

// Kamera: nur nach Freigabe im Vorblatt anfordern (sonst kaemen die Abfragen des Systems mitten im Spiel)
export const kameraErlaubt = () => aktuell?.kamera === true;
// Speichern der Antworten fuer die Auswertung: nur mit Einwilligung
export const datenErlaubt = () => aktuell?.daten === true;
