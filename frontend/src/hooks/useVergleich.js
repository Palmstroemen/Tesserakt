import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

export function useVergleich(doy, stunde, frageId) {
  const [data, setData] = useState(null);
  const [granularitaet, setGranularitaet] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof doy !== "number" || typeof stunde !== "number" || !frageId) {
      return;
    }
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${API_BASE}/vergleich`);
        url.searchParams.set("doy", String(doy));
        url.searchParams.set("stunde", String(stunde));
        url.searchParams.set("frage_id", String(frageId));

        const response = await fetch(url.toString(), { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Vergleich fehlgeschlagen (${response.status})`);
        }
        const payload = await response.json();
        setData(payload);
        setGranularitaet(payload.granularitaet ?? 1);
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
  }, [doy, stunde, frageId]);

  return { granularitaet, daten: data, loading, error };
}
