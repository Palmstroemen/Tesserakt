// Systeme des Apparats: Reihenfolge = Bogen von innen nach aussen. Innen die Zahl, aussen der Himmel:
// neben dem eigenen Schieber die Numerologie (rechnet nur mit dem eigenen Datum), dann Buchstabe, Kalender
// und die Himmelsastrologien bis zum hellenistischen Ursprung am Rand.
// Farben aus "Visuals Fantasien" (Farbsystem-Vorschlag). Auf den Schiebern stehen Icons (HoroskopIcon.jsx);
// die Kuerzel bleiben als Ersatz, wo kein Icon gezeichnet wird.
// id = interner Schluessel (Datenbank, Regeldateien, Wertung) - nie aendern. Aus der Sprachdatei
// (systeme.<id>): name = Anzeigename, unter = optionale Unterzeile mit dem Fachbegriff, gravur =
// eingraviertes Kuerzel links am Schlitz, kurz = Ersatz, wo kein Icon gezeichnet wird.
import { t } from "../sprache";

const FARBEN = {
  Numerologie: "#3d8bfd",
  Kabbalah: "#b9bcc2",
  Bazi: "#f2c14e",
  Vedisch: "#f28c28",
  Arabisch: "#2bb3a8",
  Westlich: "#7d63e6",
  Hellenistisch: "#d0674a",
};
export const SYSTEME = Object.entries(FARBEN).map(([id, farbe]) => ({
  id,
  farbe,
  ...t(`systeme.${id}`),
}));

// Anzeigename eines Systems (faellt auf die id zurueck)
export function anzeigeName(id) {
  return SYSTEME.find((s) => s.id === id)?.name ?? id;
}

// Einfuehrung eines Systems mit dem Absatz zur Grafik (bildtext aus den visualPayloads) als zweitem Absatz:
// vor dem Teil "[TAG] INTRO_<SYSTEM>_SPECIAL" eingeschoben, sonst angehaengt
export function introMitBild(intro, bildtext) {
  if (!intro || !bildtext) return intro;
  const k = intro.search(/\[TAG\]\s*INTRO_\w+_SPECIAL/);
  if (k < 0) return `${intro}\n\n${bildtext}`;
  return `${intro.slice(0, k)}${bildtext}\n\n${intro.slice(k)}`;
}
