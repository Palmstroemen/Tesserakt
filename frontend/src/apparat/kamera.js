// Belichtung der Rueckkamera festhalten, damit das Durchlicht echt bleibt: Die Automatik hellt dunkle Szenen
// sonst auf. Geht nur, wo der Browser es anbietet (Image-Capture-Erweiterung, v. a. Chrome auf Android);
// Safari auf dem iPhone kennt diese Einstellungen bisher nicht.
// Rueckgabe: kurzer Text fuer die Prototyp-Anzeige.
export async function belichtungFesthalten(stream) {
  const track = stream.getVideoTracks()[0];
  const fae = track?.getCapabilities?.() ?? {};
  const mehr = [];
  try {
    if (fae.exposureMode?.includes("manual") && fae.exposureTime) {
      // feste kurze Belichtung (Einheit 100 µs): 4 ms = 1/250 s, dazu die kleinste Empfindlichkeit
      const zeit = Math.max(fae.exposureTime.min, Math.min(fae.exposureTime.max, 40));
      const einstellung = { exposureMode: "manual", exposureTime: zeit };
      if (fae.iso) einstellung.iso = fae.iso.min;
      await track.applyConstraints({ advanced: [einstellung] });
      mehr.push(`fest ${(zeit / 10).toFixed(1)} ms`);
    } else if (fae.exposureCompensation) {
      await track.applyConstraints({ advanced: [{ exposureCompensation: fae.exposureCompensation.min }] });
      mehr.push(`Korrektur ${fae.exposureCompensation.min}`);
    } else {
      return "Belichtung: automatisch (nicht steuerbar)";
    }
    if (fae.whiteBalanceMode?.includes("manual")) {
      await track.applyConstraints({ advanced: [{ whiteBalanceMode: "manual" }] });
    }
    return `Belichtung: ${mehr.join(", ")}`;
  } catch (err) {
    return `Belichtung: Fehler (${err.name})`;
  }
}
