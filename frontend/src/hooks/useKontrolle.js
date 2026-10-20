import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// Laedt die Kontrollvektoren (Perzentil/Skill) im Hintergrund, sobald /vektor eine session_id geliefert hat.
// Die Fragephase gibt dem Backend dafuer genug Zeit; das Ergebnis wird erst auf der Ergebnisseite gebraucht.
export function useKontrolle(inputs, geburtsdatum, uhrzeit, systeme, geburtsname, geschlecht) {
  const [kontrollvektoren, setKontrollvektoren] = useState(null);
  const [kontrolle, setKontrolle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sessionId = inputs?.session_id ?? null;
  const stichtag = inputs?.stichtag ?? null;

  useEffect(() => {
    setKontrollvektoren(null);
    setKontrolle(null);
    setError(null);
    if (!sessionId || !geburtsdatum) {
      return;
    }
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const body = { geburtsdatum, uhrzeit, systeme: systeme || [], session_id: sessionId };
        if (stichtag) {
          body.stichtag = stichtag;
        }
        if (geburtsname != null && String(geburtsname).trim()) {
          body.geburtsname = String(geburtsname).trim();
        }
        if (geschlecht === "weiblich" || geschlecht === "maennlich") {
          body.geschlecht = geschlecht;
        }
        const response = await fetch(`${API_BASE}/kontrolle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Kontroll-Request fehlgeschlagen (${response.status})`);
        }
        const data = await response.json();
        setKontrollvektoren(data.kontrollvektoren);
        setKontrolle(data.kontrolle);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [sessionId, stichtag, geburtsdatum, uhrzeit, JSON.stringify(systeme), geburtsname, geschlecht]);

  return { kontrollvektoren, kontrolle, loading, error };
}
