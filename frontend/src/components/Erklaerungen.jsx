import { useErklaerungen } from "../hooks/useErklaerungen";

// Schlichte Prototyp-Darstellung. Die Daten (Thema -> kurz + Abschnitte mit ids) sind so
// gegliedert, dass eine spaetere grafische Oberflaeche einzelne Teile gezielt einblenden kann.

function InlineText({ text }) {
  // Unterstuetzt nur **fett**, wie in tools/md_to_erklaerungen.py dokumentiert.
  return text.split(/(\*\*[^*]+\*\*)/g).map((teil, i) =>
    teil.startsWith("**") && teil.endsWith("**") ? <strong key={i}>{teil.slice(2, -2)}</strong> : teil
  );
}

function Block({ block }) {
  if (block.typ === "liste") {
    return (
      <ul>
        {block.punkte.map((punkt, i) => (
          <li key={i}>
            <InlineText text={punkt} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p>
      <InlineText text={block.text} />
    </p>
  );
}

export default function Erklaerungen() {
  const { themen, error } = useErklaerungen();

  if (error) {
    return null;
  }
  if (!themen.length) {
    return null;
  }

  return (
    <section className="card erklaerungen">
      <h2>Hintergrund</h2>
      {themen.map((thema) => (
        <details key={thema.id} className="erklaerung" id={`erklaerung-${thema.id}`}>
          <summary>{thema.titel}</summary>
          <p className="erklaerung-kurz">{thema.kurz}</p>
          {thema.einleitung?.map((block, i) => <Block key={i} block={block} />)}
          {thema.abschnitte.map((abschnitt) => (
            <div key={abschnitt.id} className="erklaerung-abschnitt" id={`erklaerung-${thema.id}-${abschnitt.id}`}>
              <h3>{abschnitt.titel}</h3>
              {abschnitt.bloecke.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </div>
          ))}
        </details>
      ))}
    </section>
  );
}
