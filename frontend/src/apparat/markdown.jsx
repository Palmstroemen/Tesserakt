// Kleiner Markdown-Leser fuer die Texte in src/texte/*.md: Kopf (--- version: 1 ---), Kommentare (<!-- -->),
// Ueberschriften (#, ##, ###), Absaetze, Listen (- ), **fett** und \\ am Zeilenende als Umbruch. Mehr brauchen die Texte nicht.

// md -> { kopf: { schluessel: wert }, rumpf } ohne Kopf und Kommentare
export function lesen(md) {
  let rumpf = md.replace(/<!--[\s\S]*?-->/g, "");
  const kopf = {};
  const m = rumpf.match(/^\s*---\n([\s\S]*?)\n---\n/);
  if (m) {
    m[1].split("\n").forEach((z) => {
      const i = z.indexOf(":");
      if (i > 0) kopf[z.slice(0, i).trim()] = z.slice(i + 1).trim();
    });
    rumpf = rumpf.slice(m[0].length);
  }
  return { kopf, rumpf: rumpf.trim() };
}

// Rumpf in Abschnitte je "##"-Ueberschrift: [{ titel, text }]
export function abschnitte(rumpf) {
  return rumpf
    .split(/^## /m)
    .slice(1)
    .map((teil) => {
      const i = teil.indexOf("\n");
      return {
        titel: (i < 0 ? teil : teil.slice(0, i)).trim(),
        text: i < 0 ? "" : teil.slice(i + 1).trim(),
      };
    });
}

function Inline({ text }) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((t, i) =>
      t.startsWith("**") && t.endsWith("**") ? (
        <b key={i}>{t.slice(2, -2)}</b>
      ) : (
        t
      ),
    );
}

export function Markdown({ text }) {
  // Bloecke: durch Leerzeilen getrennt; Listenpunkte duerfen eingerueckt weiterlaufen
  return text
    .split(/\n\s*\n/)
    .filter((b) => b.trim())
    .map((block, k) => {
      const zeilen = block.split("\n");
      const erste = zeilen[0];
      if (erste.startsWith("### ")) return <h3 key={k}>{erste.slice(4)}</h3>;
      if (erste.startsWith("## ")) return <h2 key={k}>{erste.slice(3)}</h2>;
      if (erste.startsWith("# ")) return <h1 key={k}>{erste.slice(2)}</h1>;
      if (erste.startsWith("- ")) {
        const punkte = [];
        zeilen.forEach((z) => {
          if (z.startsWith("- ")) punkte.push(z.slice(2));
          else punkte[punkte.length - 1] += ` ${z.trim()}`;
        });
        return (
          <ul key={k}>
            {punkte.map((p, i) => (
              <li key={i}>
                <Inline text={p} />
              </li>
            ))}
          </ul>
        );
      }
      // Absatz: Zeilen laufen zusammen; ein "\\" am Zeilenende erzwingt einen Umbruch (z. B. Anschrift)
      const teile = zeilen.join("\n").split(/\\\n/);
      return (
        <p key={k}>
          {teile.map((t, i) => (
            <span key={i}>
              {i ? <br /> : null}
              <Inline text={t.replace(/\s*\n\s*/g, " ")} />
            </span>
          ))}
        </p>
      );
    });
}
