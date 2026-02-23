import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export function useVektoren(geburtsdatum, uhrzeit, systeme) {
  const [vektoren, setVektoren] = useState(null);
  const [inputs, setInputs] = useState(null);
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
        const response = await fetch(`${API_BASE}/vektor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ geburtsdatum, uhrzeit, systeme }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Vektor-Request fehlgeschlagen (${response.status})`);
        }
        const data = await response.json();
        setVektoren(data.vektoren);
        setInputs(data.inputs);
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
  }, [geburtsdatum, uhrzeit, JSON.stringify(systeme)]);

  return { vektoren, inputs, loading, error };
}
