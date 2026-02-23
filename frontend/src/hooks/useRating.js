import { useEffect, useMemo, useState } from "react";
import { calculateRating } from "../logic/rating";
import { calculateTemperament } from "../logic/temperament";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

const FALLBACK_MATRIX = {
  konsens_gewichtung: {
    liebe: { Westlich: 0.25, Bazi: 0.25, Numerologie: 0.25, KO: 0.25 },
    beruf: { Westlich: 0.25, Bazi: 0.25, Numerologie: 0.25, KO: 0.25 },
    finanzen: { Westlich: 0.25, Bazi: 0.25, Numerologie: 0.25, KO: 0.25 },
    gesundheit: { Westlich: 0.25, Bazi: 0.25, Numerologie: 0.25, KO: 0.25 },
    soziales: { Westlich: 0.25, Bazi: 0.25, Numerologie: 0.25, KO: 0.25 },
    kreativitaet: { Westlich: 0.25, Bazi: 0.25, Numerologie: 0.25, KO: 0.25 },
    veraenderung: { Westlich: 0.25, Bazi: 0.25, Numerologie: 0.25, KO: 0.25 },
    spiritualitaet: { Westlich: 0.25, Bazi: 0.25, Numerologie: 0.25, KO: 0.25 },
  },
};

export function useRating(vektoren, antworten, inputs) {
  const [matrix, setMatrix] = useState(FALLBACK_MATRIX);
  const [matrixLoading, setMatrixLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function loadMatrix() {
      try {
        const response = await fetch(`${API_BASE}/matrix`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error("Matrix endpoint unavailable");
        }
        const payload = await response.json();
        setMatrix(payload);
      } catch {
        setMatrix(FALLBACK_MATRIX);
      } finally {
        setMatrixLoading(false);
      }
    }
    loadMatrix();
    return () => controller.abort();
  }, []);

  return useMemo(() => {
    const base = calculateRating(vektoren ?? {}, antworten ?? [], matrix);
    const temperament = calculateTemperament(base, inputs ?? {});
    return {
      ranking: base.ranking,
      systemDetails: base.systemDetails,
      fitVsKO: base.fitVsKO ?? {},
      skillVsKO: base.skillVsKO ?? {},
      temperament,
      matrix,
      matrixLoading,
    };
  }, [vektoren, antworten, matrix, inputs, matrixLoading]);
}
