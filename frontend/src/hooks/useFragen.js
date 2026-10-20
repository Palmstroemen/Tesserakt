import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// Fragen inkl. Gewichte je System kommen ausschliesslich vom Backend (backend/fragen.json).
export function useFragen() {
  const [fragen, setFragen] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${API_BASE}/fragen`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Fragen-Request fehlgeschlagen (${response.status})`);
        }
        const data = await response.json();
        setFragen(data.fragen ?? []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      }
    }
    load();
    return () => controller.abort();
  }, []);

  return { fragen, error };
}
