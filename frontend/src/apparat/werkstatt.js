// Werkstatt-Schalter fuer Tests auf dem Handy, ueber die Adresse (nicht fuer Spieler gedacht):
//   ?neu            Einwilligung und Zettel vergessen: Vorblatt und Zettel kommen wieder
//   ?messen         Anzeige oben links: Dauer der Bilder, solange ein Finger auf dem Bildschirm ist
//   ?ohne=schatten  SVG-Schatten aus; ?ohne=masken Masken der Schlitze aus (beides kombinierbar,
//                   z. B. ?messen&ohne=schatten,masken), um herauszufinden, was auf dem Geraet bremst
export function werkstattEinrichten() {
  const q = new URLSearchParams(window.location.search);
  if (q.has("neu")) {
    try {
      localStorage.removeItem("tesserakt-einwilligung");
      localStorage.removeItem("tesserakt-zettel");
    } catch {
      // ohne Speicher gibt es nichts zu vergessen
    }
    q.delete("neu");
    const rest = q.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (rest ? `?${rest}` : ""),
    );
  }
  for (const teil of (q.get("ohne") ?? "").split(",").filter(Boolean))
    document.documentElement.classList.add(`ohne-${teil}`);
  if (q.has("messen")) messanzeige();
}

function messanzeige() {
  const tafel = document.createElement("div");
  tafel.className = "werkstatt-messung";
  tafel.textContent = "Schieber ziehen …";
  document.body.appendChild(tafel);
  const ergebnisse = [];
  let bilder = null;
  let zuletzt = 0;
  const bild = (t) => {
    if (!bilder) return;
    if (zuletzt) bilder.push(t - zuletzt);
    zuletzt = t;
    requestAnimationFrame(bild);
  };
  window.addEventListener(
    "pointerdown",
    () => {
      bilder = [];
      zuletzt = 0;
      requestAnimationFrame(bild);
    },
    true,
  );
  window.addEventListener(
    "pointerup",
    () => {
      const b = bilder;
      bilder = null;
      if (!b || b.length < 5) return;
      const mittel = b.reduce((s, x) => s + x, 0) / b.length;
      const langsam = b.filter((x) => x > 50).length;
      ergebnisse.unshift(
        `${Math.round(mittel)} ms · max ${Math.round(Math.max(...b))} · ${langsam}/${b.length} langsam`,
      );
      ergebnisse.length = Math.min(ergebnisse.length, 4);
      const ohne = [...document.documentElement.classList]
        .filter((k) => k.startsWith("ohne-"))
        .join(" ");
      tafel.textContent = [ohne || "alles an", ...ergebnisse].join("\n");
    },
    true,
  );
}
