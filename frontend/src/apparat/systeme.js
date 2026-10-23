// Systeme des Apparats: Reihenfolge = Bogen von innen nach aussen. Innen die Zahl, aussen der Himmel:
// neben dem eigenen Schieber die Numerologie (rechnet nur mit dem eigenen Datum), dann Buchstabe, Kalender
// und die Himmelsastrologien bis zum hellenistischen Ursprung am Rand.
// Farben aus "Visuals Fantasien" (Farbsystem-Vorschlag). Auf den Schiebern stehen Icons (HoroskopIcon.jsx);
// die Kuerzel bleiben als Ersatz, wo kein Icon gezeichnet wird.
// id = interner Schluessel (Datenbank, Regeldateien, Wertung) - nie aendern. name = Anzeigename,
// unter = optionale Unterzeile mit dem Fachbegriff, gravur = eingraviertes Kuerzel links am Schlitz.
export const SYSTEME = [
  { id: "Numerologie", gravur: "Num", kurz: "N", farbe: "#3d8bfd" },
  { id: "Kabbalah", gravur: "Kaba", kurz: "K", farbe: "#b9bcc2" },
  {
    id: "Bazi",
    gravur: "Chin",
    name: "Chinesisch",
    unter: "Vier Säulen (Bazi)",
    kurz: "Ch",
    farbe: "#f2c14e",
  },
  { id: "Vedisch", gravur: "Ved", kurz: "J", farbe: "#f28c28" },
  { id: "Arabisch", gravur: "Arab", kurz: "Ar", farbe: "#2bb3a8" },
  { id: "Westlich", gravur: "Wes", kurz: "W", farbe: "#7d63e6" },
  { id: "Hellenistisch", gravur: "Hel", kurz: "H", farbe: "#d0674a" },
];

// Anzeigename eines Systems (faellt auf die id zurueck)
export function anzeigeName(id) {
  return SYSTEME.find((s) => s.id === id)?.name ?? id;
}
