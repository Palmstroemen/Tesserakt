import { useEffect, useState } from "react";

import { API_BASE } from "../logic/api";

// Erklaertexte (Themen mit kurz, Abschnitten und Bloecken) aus content/horoscope/de/erklaerungen_v1.json.
export function useErklaerungen(locale = "de") {
  const [themen, setThemen] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`${API_BASE}/horoscope/erklaerungen?locale=${locale}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Erklaerungen-Request fehlgeschlagen (${response.status})`);
        }
        const data = await response.json();
        setThemen(data.themen ?? []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      }
    }
    load();
    return () => controller.abort();
  }, [locale]);

  return { themen, error };
}
