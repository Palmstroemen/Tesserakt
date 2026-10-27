// Speichern fuer die Forschung (nur mit Einwilligung aus dem Vorblatt): am Ende einer Runde gehen Antworten und
// Ergebnisse an POST /runde. Bewusst nicht dabei: Geburtsdatum, Uhrzeit, Ort und die Vektoren der Horoskope;
// vom Geburtsdatum nur das Jahr, das Land nur fuer den Kulturraum (der Server speichert es nicht). Was
// gespeichert wird, steht in backend/forschung.py und muss zu src/sprache/de/datenverwendung.md passen.
import { holen } from "../logic/api";
import { sprache } from "../sprache";
import { datenErlaubt } from "./einwilligung";

const ZEITZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";

// zufaellige Kennung einer Runde (verbindet nur Runde und Antworten, nichts sonst)
export function neueRundeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}

const zahl = (x) => (x == null || Number.isNaN(Number(x)) ? null : Number(x));

function ergebnisse(systemDetails, mitgespielt) {
  return Object.fromEntries(
    Object.entries(systemDetails ?? {}).map(([s, d]) => [
      s,
      {
        skill: zahl(d.skillScore),
        perzentil: zahl(d.perzentil),
        fit: zahl(d.fitScore),
        mitgespielt: mitgespielt?.[s] ?? null,
      },
    ]),
  );
}

// Runde senden; dieselbe runde_id noch einmal ersetzt die alte (Antwort zurueckgenommen und neu beantwortet).
// Fehler bleiben still: das Spiel ist dasselbe, ob gespeichert wurde oder nicht.
export function rundeSenden({
  rundeId,
  spiel,
  person,
  ergebnis,
  antworten,
  zeitpunkte = [],
}) {
  if (!datenErlaubt() || !ergebnis || !person?.geburtsdatum) return;
  const fenster = ergebnis.fenster
    ? Object.fromEntries(
        ["monat", "quartal", "timing"].map((f) => [
          f,
          ergebnisse(ergebnis.fenster[f]?.systemDetails),
        ]),
      )
    : null;
  const body = {
    runde_id: rundeId,
    spiel,
    geburtsjahr: Number(person.geburtsdatum.slice(0, 4)),
    land: person.ort?.code ?? null,
    geraet_zeitzone: person.ort ? null : ZEITZONE,
    uhrzeit_bekannt: Boolean(person.uhrzeitBekannt),
    ort_bekannt: Boolean(person.ort),
    sprache,
    geraet_sprache: navigator.language ?? null,
    ergebnisse: ergebnisse(ergebnis.alle.systemDetails, ergebnis.mitgespielt),
    fenster,
    antworten: antworten.map((a) => ({
      frage_id: a.frage_id,
      dimension: a.dimension,
      typ: a.typ ?? null,
      fenster: a.fenster ?? null,
      wert: a.selbst_wert,
      erster_wert: a.erster_wert ?? a.selbst_wert,
      wiederholt: a.wiederholt ?? 0,
      tage_zurueck: a.erinnerung?.tage_zurueck ?? null,
    })),
    zeitpunkte: zeitpunkte.map((z) => ({
      frage_id: z.frage_id,
      dimension: z.dimension,
      antwort: z.antwort,
      tage_zurueck: z.tage_zurueck ?? null,
    })),
  };
  holen("/runde", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {});
}
