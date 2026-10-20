import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export function useVektoren(geburtsdatum, uhrzeit, systeme, geburtsname, geschlecht) {
  const [vektoren, setVektoren] = useState(null);
  const [inputs, setInputs] = useState(null);
  const [kontrollvektoren, setKontrollvektoren] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!geburtsdatum) {
      return;
    }
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const body = { geburtsdatum, uhrzeit, systeme: systeme || [] };
        if (geburtsname != null && String(geburtsname).trim()) {
          body.geburtsname = String(geburtsname).trim();
        }
        if (geschlecht === "weiblich" || geschlecht === "maennlich") {
          body.geschlecht = geschlecht;
        }
        const response = await fetch(`${API_BASE}/vektor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Vektor-Request fehlgeschlagen (${response.status})`);
        }
        const data = await response.json();
        setVektoren(data.vektoren);
        setInputs(data.inputs);
        setKontrollvektoren(data.kontrollvektoren ?? null);
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
  }, [geburtsdatum, uhrzeit, JSON.stringify(systeme), geburtsname, geschlecht]);

  return { vektoren, inputs, kontrollvektoren, loading, error };
}
