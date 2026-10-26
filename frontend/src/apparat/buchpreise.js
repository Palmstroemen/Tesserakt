// Preise des gedruckten Horoskopbuchs: Waehrung, Staffel und laufende Aktion kommen vom Server (GET /buch/preise,
// Markt nach dem Land der Zeitzone des Geraets; backend/buchpreise.py). Hier nur die Rechnung und die
// Darstellung des Betrags in der Sprache des Apparats.
import { useEffect, useState } from "react";
import { holen } from "../logic/api";
import { t } from "../sprache";

const ZEITZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
let geladen = null; // einmal je Start

// Markt des Geraets { waehrung, staffel, aktion } oder null, solange er laedt (oder der Server fehlt)
export function useMarkt() {
  const [markt, setMarkt] = useState(null);
  useEffect(() => {
    geladen ??= holen(`/buch/preise?zeitzone=${encodeURIComponent(ZEITZONE)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    let aktiv = true;
    geladen.then((m) => aktiv && setMarkt(m));
    return () => {
      aktiv = false;
    };
  }, []);
  return markt;
}

// Preis fuer n Horoskope im Markt, mit einer laufenden Aktion
export function buchPreis(n, markt) {
  const staffel = markt?.staffel ?? [];
  const grund = staffel[Math.min(n, staffel.length - 1)] ?? 0;
  const aktion = markt?.aktion ?? null;
  const preis = aktion ? Math.round(grund * (1 - aktion.rabatt)) : grund;
  return { grund, preis, aktion };
}

// Betrag in der Waehrung des Markts, geschrieben wie in der Sprache ueblich ("23 €", "$25")
export function geld(betrag, waehrung) {
  return new Intl.NumberFormat(t("intl.gebiet"), {
    style: "currency",
    currency: waehrung,
    minimumFractionDigits: Number.isInteger(betrag) ? 0 : 2,
  }).format(betrag);
}
