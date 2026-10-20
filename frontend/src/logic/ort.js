// Geburtsort -> Felder fuer die Backend-Requests (Koordinaten fuer Haeuser/Aszendent, Zeitzone fuer die Weltzeit).
export function ortFelder(ort) {
  if (!ort) return {};
  return { latitude: ort.lat, longitude: ort.lon, zeitzone: ort.zeitzone };
}
