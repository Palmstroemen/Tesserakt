// Systeme der Schatulle: Reihenfolge = Bogen von innen nach aussen.
// Farben aus "Visuals Fantasien" (Farbsystem-Vorschlag). Auf den Schiebern stehen Icons (HoroskopIcon.jsx);
// die Kuerzel bleiben als Ersatz, wo kein Icon gezeichnet wird.
// id = interner Schluessel (Datenbank, Regeldateien, Wertung) - nie aendern. name = Anzeigename,
// unter = optionale Unterzeile mit dem Fachbegriff.
export const SYSTEME = [
  { id: "Westlich", kurz: "W", farbe: "#7d63e6" },
  {
    id: "Bazi",
    name: "Chinesisch",
    unter: "Vier Säulen (Bazi)",
    kurz: "Ch",
    farbe: "#f2c14e",
  },
  { id: "Numerologie", kurz: "N", farbe: "#3d8bfd" },
  { id: "Kabbalah", kurz: "K", farbe: "#b9bcc2" },
  { id: "Arabisch", kurz: "Ar", farbe: "#2bb3a8" },
  { id: "Hellenistisch", kurz: "H", farbe: "#d0674a" },
  { id: "Vedisch", kurz: "J", farbe: "#f28c28" },
];

// Anzeigename eines Systems (faellt auf die id zurueck)
export function anzeigeName(id) {
  return SYSTEME.find((s) => s.id === id)?.name ?? id;
}
