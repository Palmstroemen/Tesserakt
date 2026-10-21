// Adresse des Backends. Ohne VITE_API_BASE: derselbe Rechner, von dem die Seite geladen wurde, Port 8000.
// So funktioniert es am PC (localhost) und vom Handy im WLAN (IP des Rechners) ohne weitere Einstellung.
export const API_BASE =
  import.meta.env.VITE_API_BASE ?? `${window.location.protocol}//${window.location.hostname}:8000`;
