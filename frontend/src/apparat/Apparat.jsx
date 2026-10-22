import Zettel, { zettelWeglegen } from "./Zettel";
import { kameraErlaubt } from "./einwilligung";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateRating,
  calculateTimingRating,
  erwarteterSkillBester,
} from "../logic/rating";
import { ortFelder } from "../logic/ort";
import { SYSTEME } from "./systeme";
import Datumsrad from "./Datumsrad";
import Spielplatte from "./Spielplatte";
import Ergebnisplatte from "./Ergebnisplatte";
import DruckAuswahl from "./DruckAuswahl";
import Buch from "./Buch";
import { rastKlick, zahnrad } from "./klang";
import { belichtungFesthalten } from "./kamera";

import { API_BASE } from "../logic/api";
const ALLE = SYSTEME.map((s) => s.id);

async function postJson(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} (${r.status})`);
  return r.json();
}

// Spiel C: Felder einer Person fuer /partner (x = "a" oder "b")
function personFelder(x, { geburtsdatum, uhrzeit, ort }) {
  const f = ortFelder(ort);
  return {
    [`geburtsdatum_${x}`]: geburtsdatum,
    [`uhrzeit_${x}`]: uhrzeit || "12:00",
    ...(f.latitude != null
      ? {
          [`latitude_${x}`]: f.latitude,
          [`longitude_${x}`]: f.longitude,
          [`zeitzone_${x}`]: f.zeitzone,
        }
      : {}),
  };
}

// Was die Spiele unterscheidet; die Fragerunde selbst ist dieselbe
const SPIELE = {
  A: {
    pole: ["trifft nicht zu", "trifft zu"],
    vergleich: "anderen Geburtsdaten",
  },
  B: {
    pole: ["trifft nicht zu", "trifft zu"],
    vergleich: "anderen Geburtsdaten",
  },
  C: { pole: ["eher ich", "eher Partner:in"], vergleich: "zufälligen Paaren" },
};

// Spiel B: Antworten auf "Wann war das ungefaehr?" (Tage vor heute; null = weiss nicht mehr)
const ZEITPUNKTE = [
  { label: "vor 1 Woche", tage: 7 },
  { label: "vor 2 Wochen", tage: 14 },
  { label: "vor 1 Monat", tage: 30 },
  { label: "vor 2 Monaten", tage: 60 },
  { label: "vor 3 Monaten", tage: 90 },
  { label: "weiß nicht mehr", tage: null },
];
const ERINNERUNG_AB = 0.2; // ab dieser Zustimmung zu einem auffaelligen Moment wird nach dem Zeitpunkt gefragt

// Spiel B: Fragenreihe aus dem Katalog; Sehen mehrere Systeme denselben Moment, wird einmal gefragt
function rueckblickFragen(katalog, rueckblick) {
  const einleitung = katalog._meta.fenster_einleitung;
  const nachFormulierung = new Map();
  for (const m of rueckblick.auffaellig) {
    const formulierung = katalog.auffaellig[m.dimension][m.richtung];
    const frage = nachFormulierung.get(formulierung.id) ?? {
      id: formulierung.id,
      typ: "auffaellig",
      fenster: m.fenster,
      dimension: m.dimension,
      momente: [],
      formulierung: formulierung.text,
    };
    frage.momente.push(m);
    nachFormulierung.set(formulierung.id, frage);
  }
  const auffaellig = [...nachFormulierung.values()].map((frage) => {
    // Einleitung nach dem juengsten Zeitpunkt (ein Moment vor 10 Tagen liegt auch im letzten Monat)
    const juengster = Math.min(...frage.momente.map((m) => m.tage_zurueck));
    return {
      ...frage,
      text: `${einleitung[juengster <= 30 ? "monat" : "quartal"]} ${frage.formulierung}`,
    };
  });
  // gewertete und auffaellige gemischt, damit die auffaelligen nicht erkennbar sind
  return mischen([
    ...katalog.gewertet.map((f) => ({ ...f, typ: "gewertet" })),
    ...auffaellig,
  ]);
}
const UEBERGANG_MS = 1500; // Scheibe -> Auge: zwei Flip-Haelften zu 0,7 s

function mischen(liste) {
  const kopie = [...liste];
  for (let i = kopie.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

// Anzeige: Betonung eines Lebensbereichs relativ zu den Kontroll-Geburtsdaten (z-Wert / 2, begrenzt auf -1..+1).
// Die Rohwerte der Systeme sind klein; so wird sichtbar, ob ein System den Bereich bei dir staerker oder
// schwaecher sieht als bei anderen Geburtsdaten.
function anzeigeStatistik(kontroll) {
  const stat = {};
  for (const [system, liste] of Object.entries(kontroll ?? {})) {
    stat[system] = {};
    if (!liste.length) continue;
    for (const dim of Object.keys(liste[0])) {
      const werte = liste.map((v) => Number(v[dim]));
      const mittel = werte.reduce((a, b) => a + b, 0) / werte.length;
      const sd = Math.sqrt(
        werte.reduce((a, b) => a + (b - mittel) ** 2, 0) / werte.length,
      );
      stat[system][dim] = { mittel, sd };
    }
  }
  return stat;
}

function anzeigeWert(stat, system, dim, wert) {
  const s = stat?.[system]?.[dim];
  if (!s || s.sd < 1e-6) return Math.max(-1, Math.min(1, wert));
  return Math.max(-1, Math.min(1, (wert - s.mittel) / (2 * s.sd)));
}

const auswahlSichtbar = (auswertung, phase) => auswertung && phase === "frage";

export default function Apparat() {
  // start | laden | uebergang (Rad -> Fragen) | frage (Fragerunde und Ergebnis im Faecher)
  const [phase, setPhase] = useState("start");
  const [auswertung, setAuswertung] = useState(false); // Rangliste im Auge sichtbar ("<" links oben)
  const [textkarten, setTextkarten] = useState(false); // Faecher nach links weggeschoben, Textkarten sichtbar
  const [kartenOffen, setKartenOffen] = useState(false); // Textkarten einmal geoeffnet (bleiben dann geladen)
  const [druck, setDruck] = useState(null); // null | "auswahl" | { auswahl, titel, reihe } fuer die Buchansicht
  const [geburt, setGeburt] = useState(null); // eingestellte Geburtsdaten (Titelseite des Buchs): { a, b? }
  const [spiel, setSpiel] = useState("A");
  const [fehler, setFehler] = useState(null);

  const [fragen, setFragen] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [vektoren, setVektoren] = useState(null); // A: Vektoren der Person; C: Unterschied (B - A) / 2
  const [kontroll, setKontroll] = useState(null);
  const [visualPayloads, setVisualPayloads] = useState(null);
  const [heute, setHeute] = useState(null);
  const [ausblick, setAusblick] = useState(null); // Jahreshoroskop: datierte Ereignisse der naechsten 12 Monate
  const [paar, setPaar] = useState(null); // Spiel C: Partnerschaftshoroskop je System
  const [texte, setTexte] = useState(null);
  const [abkuerzung, setAbkuerzung] = useState(false);

  // Spiel B
  const [rueckblick, setRueckblick] = useState(null); // /rueckblick: mittel je Fenster, auffaellig, timing
  const [kontrollB, setKontrollB] = useState(null); // /rueckblick/kontrolle
  const [zeitFragen, setZeitFragen] = useState([]);
  const [nachfrage, setNachfrage] = useState(false); // "Wann war das?" zur letzten auffaelligen Antwort
  const [zIndex, setZIndex] = useState(0);
  const [zJa, setZJa] = useState(false);
  const [zAntworten, setZAntworten] = useState([]);

  const [antworten, setAntworten] = useState([]);
  const [runde, setRunde] = useState(0);
  const [kamera, setKamera] = useState(null);
  const [kameraInfo, setKameraInfo] = useState("");

  // Kamera gleich beim Oeffnen anfordern und laufen lassen (nur wenn im Vorblatt freigegeben; die Abfrage des
  // Systems kam dann schon dort, nicht mitten im Spiel).
  // Abgeschaltet wird erst beim Verlassen der Seite.
  const kameraRef = useRef(null);
  const kameraAbgelehnt = useRef(false);
  useEffect(() => {
    kameraStarten();
    return () => kameraRef.current?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/horoscope/texts?locale=de`)
      .then((r) => r.json())
      .then(setTexte)
      .catch(() => {});
    fetch(`${API_BASE}/matrix`)
      .then((r) => r.json())
      .then(setMatrix)
      .catch(() => {});
  }, []);

  const stat = useMemo(() => anzeigeStatistik(kontroll), [kontroll]);
  const statB = useMemo(
    () => ({
      monat: anzeigeStatistik(kontrollB?.kontrollvektoren?.monat),
      quartal: anzeigeStatistik(kontrollB?.kontrollvektoren?.quartal),
    }),
    [kontrollB],
  );

  function kameraStarten() {
    // Magisches Auge: Rueckkamera als Durchlicht (nur ueber HTTPS oder localhost; sonst bleibt die Linse hell).
    // Laeuft schon ein Strom oder wurde abgelehnt: nicht noch einmal fragen.
    const laeuft = kameraRef.current
      ?.getVideoTracks()
      .some((t) => t.readyState === "live");
    if (laeuft || kameraAbgelehnt.current || !kameraErlaubt()) return;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        kameraRef.current = stream;
        setKamera(stream);
        return belichtungFesthalten(stream).then(setKameraInfo);
      })
      .catch((err) => {
        if (err.name === "NotAllowedError") kameraAbgelehnt.current = true;
        setKamera(null);
        setKameraInfo(`Kamera: ${err.name}`);
      });
  }

  function wechsel(zwischen, ziel) {
    setPhase(zwischen);
    zahnrad(26, UEBERGANG_MS / 1000, 1700);
    setTimeout(() => setPhase(ziel), UEBERGANG_MS);
  }

  // wahl: "A", "B", "C", "X" oder "XC". X und XC sind Abkuerzungen zum Ergebnis per Tipp auf das Datum
  // (Entwicklung, gewuerfelte Antworten): X auf der goldenen Scheibe, gerechnet wie Spiel A; XC auf der
  // silbernen, gerechnet wie Spiel C.
  async function spielWahl(wahl, eingabe) {
    const schnell = wahl === "X" || wahl === "XC";
    const paarSpiel = wahl === "C" || wahl === "XC";
    setGeburt(paarSpiel ? { a: eingabe.a, b: eingabe.b } : { a: eingabe });
    zettelWeglegen(); // der Zettel liegt nur bis zum ersten Spiel im Apparat
    setFehler(null);
    setSpiel(wahl === "X" ? "A" : paarSpiel ? "C" : wahl);
    setAbkuerzung(schnell);
    setAuswertung(false);
    setTextkarten(false);
    setKartenOffen(false);
    rastKlick(); // erste Beruehrung: Audio freigeben
    setPhase("laden");
    if (!schnell) kameraStarten();
    setVisualPayloads(null);
    setHeute(null);
    setAusblick(null);
    setPaar(null);
    setRueckblick(null);
    setKontrollB(null);
    setNachfrage(false);
    setZIndex(0);
    setZJa(false);
    setZAntworten([]);
    try {
      let body;
      let kontrollPfad;
      let katalogFragen;
      let vek;
      if (paarSpiel) {
        body = {
          ...personFelder("a", eingabe.a),
          ...personFelder("b", eingabe.b),
          systeme: ALLE,
        };
        const [katalog, v] = await Promise.all([
          fetch(`${API_BASE}/fragen/beziehung`).then((r) => r.json()),
          postJson("/partner", body),
        ]);
        katalogFragen = mischen(katalog.fragen ?? []);
        vek = v.differenz;
        // Partnerschaftshoroskop (Teil des Ergebnisses), im Hintergrund
        postJson("/horoscope/paar", body)
          .then(setPaar)
          .catch(() => {});
        body = {
          ...body,
          session_id: v.inputs.session_id,
          stichtag: v.inputs.stichtag,
        };
        kontrollPfad = "/partner/kontrolle";
      } else {
        body = {
          geburtsdatum: eingabe.geburtsdatum,
          uhrzeit: eingabe.uhrzeit,
          systeme: ALLE,
          ...ortFelder(eingabe.ort),
        };
        const [katalog, v, rb] = await Promise.all([
          fetch(`${API_BASE}/fragen${wahl === "B" ? "/rueckblick" : ""}`).then(
            (r) => r.json(),
          ),
          postJson("/vektor", body),
          wahl === "B" ? postJson("/rueckblick", body) : Promise.resolve(null),
        ]);
        vek = v.vektoren;
        setVisualPayloads(v.inputs.visualPayloads ?? null);
        // Horoskop fuer heute (Teil des Ergebnisses), im Hintergrund
        postJson("/horoscope/heute", body)
          .then(setHeute)
          .catch(() => {});
        postJson("/horoscope/ausblick", body)
          .then(setAusblick)
          .catch(() => {});
        if (wahl === "B") {
          setRueckblick(rb);
          setZeitFragen(katalog.zeitpunkt ?? []);
          katalogFragen = rueckblickFragen(katalog, rb);
          body = {
            ...body,
            session_id: rb.inputs.session_id,
            stichtag: rb.inputs.stichtag,
          };
          kontrollPfad = "/rueckblick/kontrolle";
        } else {
          katalogFragen = mischen(katalog.fragen ?? []);
          body = {
            ...body,
            session_id: v.inputs.session_id,
            stichtag: v.inputs.stichtag,
          };
          kontrollPfad = "/kontrolle";
        }
      }
      setFragen(katalogFragen);
      setVektoren(vek);
      setKontroll(null);
      setRunde((r) => r + 1);
      if (schnell) {
        setAntworten(
          katalogFragen.map((f) => ({
            frage_id: f.id,
            dimension: f.dimension,
            selbst_wert: Math.round((Math.random() * 2 - 1) * 5) / 5,
            angezeigt: [],
            system_werte: Object.fromEntries(
              ALLE.map((s) => [s, Number(vek[s][f.dimension])]),
            ),
            gewichte: Object.fromEntries(
              ALLE.map((s) => [s, f.gewichte?.[s] ?? 1]),
            ),
          })),
        );
        // Abkuerzung: gleich in den Faecher mit der Auswertung
        wechsel("uebergang", "frage");
      } else {
        setAntworten([]);
        // Uebergang: Datumsscheibe dreht sich zum magischen Auge, die Ortswalzen schwenken weg
        wechsel("uebergang", "frage");
      }
      // Kontrollgruppe im Hintergrund (fuer Anzeige-Skalierung und Skill)
      postJson(kontrollPfad, body)
        .then((k) => {
          if (wahl === "B") setKontrollB(k);
          setKontroll(wahl === "B" ? {} : k.kontrollvektoren);
        })
        .catch(() => setKontroll({}));
    } catch (err) {
      setFehler(err.message);
      setPhase("start");
    }
  }

  // Zielwert eines Systems fuer die Anzeige der Symbole
  function zielWert(s, dim, frage) {
    if (spiel !== "B")
      return anzeigeWert(stat, s, dim, Number(vektoren[s][dim]));
    if (frage.typ === "gewertet")
      return anzeigeWert(
        statB[frage.fenster],
        s,
        dim,
        Number(rueckblick.mittel[frage.fenster][s][dim]),
      );
    // auffaelliger Moment: Systeme, die ihn sehen, zeigen "trifft zu", die anderen bleiben in der Mitte
    return frage.momente.some((m) => m.system === s) ? 0.85 : 0;
  }

  // Antwort festhalten: Systemwerte fuer alle 7 (das Aufziehen wirkt nur auf die Anzeige)
  function antwort(frage, selbstWert, angezeigt) {
    const wert = Number(selbstWert.toFixed(2));
    if (spiel === "B") {
      const gewertet = frage.typ === "gewertet";
      setAntworten((prev) => [
        ...prev,
        {
          frage_id: frage.id,
          typ: frage.typ,
          fenster: frage.fenster,
          dimension: frage.dimension,
          text: frage.text,
          selbst_wert: wert,
          angezeigt,
          system_werte: gewertet
            ? Object.fromEntries(
                ALLE.map((s) => [
                  s,
                  Number(rueckblick.mittel[frage.fenster][s][frage.dimension]),
                ]),
              )
            : {},
          momente: frage.momente ?? [],
        },
      ]);
      if (!gewertet && wert >= ERINNERUNG_AB) setNachfrage(true);
      return;
    }
    setAntworten((prev) => [
      ...prev,
      {
        frage_id: frage.id,
        dimension: frage.dimension,
        selbst_wert: wert,
        angezeigt,
        system_werte: Object.fromEntries(
          ALLE.map((s) => [s, Number(vektoren[s][frage.dimension])]),
        ),
        gewichte: Object.fromEntries(
          ALLE.map((s) => [s, frage.gewichte?.[s] ?? 1]),
        ),
      },
    ]);
  }

  // Spiel B: Nachfrage zur letzten auffaelligen Antwort
  function erinnerung(tage) {
    setAntworten((prev) =>
      prev.map((a, i) =>
        i === prev.length - 1
          ? { ...a, erinnerung: { tage_zurueck: tage } }
          : a,
      ),
    );
    setNachfrage(false);
    rastKlick();
  }

  // Spiel B: Zeitpunkt-Fragen nach der Fragerunde
  function zeitpunktAntwort(antwortArt, tage = null) {
    const frage = zeitFragen[zIndex];
    setZAntworten((prev) => [
      ...prev,
      {
        frage_id: frage.id,
        dimension: frage.dimension,
        antwort: antwortArt,
        tage_zurueck: tage,
      },
    ]);
    setZJa(false);
    setZIndex((i) => i + 1);
    rastKlick();
  }

  const zeitModus =
    spiel === "B" &&
    fragen.length > 0 &&
    antworten.length === fragen.length &&
    !nachfrage &&
    zIndex < zeitFragen.length;

  let zusatz = null;
  let sonderDia = null;
  if (spiel === "B" && phase === "frage") {
    if (nachfrage) {
      sonderDia = "Weißt du noch ungefähr, wann das war?";
      zusatz = (
        <div className="sp-plaettchen">
          {ZEITPUNKTE.map((z) => (
            <button
              key={z.label}
              type="button"
              onClick={() => erinnerung(z.tage)}
            >
              {z.label}
            </button>
          ))}
        </div>
      );
    } else if (zeitModus) {
      const frage = zeitFragen[zIndex];
      sonderDia = zJa ? "Wann war das ungefähr?" : frage.text;
      zusatz = (
        <>
          <p className="sp-frage-klein">
            Zum Schluss: Erinnerung {zIndex + 1} von {zeitFragen.length}
          </p>
          <div className="sp-plaettchen">
            {zJa ? (
              ZEITPUNKTE.map((z) => (
                <button
                  key={z.label}
                  type="button"
                  onClick={() =>
                    zeitpunktAntwort(
                      z.tage === null ? "weiss_nicht" : "ja",
                      z.tage,
                    )
                  }
                >
                  {z.label}
                </button>
              ))
            ) : (
              <>
                <button type="button" onClick={() => setZJa(true)}>
                  Ja
                </button>
                <button type="button" onClick={() => zeitpunktAntwort("nein")}>
                  Nein
                </button>
                <button
                  type="button"
                  onClick={() => zeitpunktAntwort("weiss_nicht")}
                >
                  Weiß ich nicht
                </button>
              </>
            )}
          </div>
        </>
      );
    }
  }

  // --- Ergebnis ---------------------------------------------------------------
  const ergebnis = useMemo(() => {
    if (phase !== "frage" || !kontroll || !matrix) return null;
    const mitgespielt = Object.fromEntries(
      ALLE.map((s) => [
        s,
        antworten.filter(
          (a) => a.typ !== "auffaellig" && a.angezeigt.includes(s),
        ).length,
      ]),
    );
    const erwartung = erwarteterSkillBester(ALLE.length);
    if (spiel !== "B") {
      const alle = calculateRating(
        Object.fromEntries(ALLE.map((s) => [s, vektoren[s]])),
        antworten,
        matrix,
        kontroll,
      );
      return { alle, mitgespielt, erwartung };
    }
    if (!kontrollB || !rueckblick) return null;
    const fenster = {};
    for (const f of ["monat", "quartal"]) {
      const eintraege = antworten.filter(
        (a) => a.typ === "gewertet" && a.fenster === f,
      );
      fenster[f] = calculateRating(
        rueckblick.mittel[f],
        eintraege,
        matrix,
        kontrollB.kontrollvektoren?.[f] ?? {},
      );
    }
    fenster.timing = calculateTimingRating(
      zAntworten.filter((a) => a.antwort === "ja"),
      rueckblick.timing,
      kontrollB.timing ?? {},
      ALLE,
      rueckblick.inputs.timing_konstant ?? null,
    );
    // Gesamtreihenfolge: Mittel aus letztem Monat und letzten drei Monaten
    const mittel = (s, feld) => {
      const w = ["monat", "quartal"]
        .map((f) => fenster[f].systemDetails[s]?.[feld])
        .filter((x) => x != null);
      return w.length ? w.reduce((a, b) => a + b, 0) / w.length : 0;
    };
    const systemDetails = Object.fromEntries(
      ALLE.map((s) => [
        s,
        {
          skillScore: mittel(s, "skillScore"),
          perzentil: mittel(s, "perzentil"),
        },
      ]),
    );
    const ranking = [...ALLE].sort(
      (a, b) => systemDetails[b].skillScore - systemDetails[a].skillScore,
    );
    return {
      alle: { ranking, systemDetails },
      fenster,
      mitgespielt,
      erwartung,
    };
  }, [
    phase,
    kontroll,
    kontrollB,
    matrix,
    vektoren,
    antworten,
    zAntworten,
    rueckblick,
    spiel,
  ]);

  // --- Darstellung ------------------------------------------------------------
  // Datumsscheibe und Faecher liegen uebereinander: beim Uebergang spielt die Scheibe ihren Abgang als
  // Deckschicht ueber dem schon fertigen Faecher. Das Ergebnis bleibt im Faecher; daneben (rechts) liegen die
  // Textkarten, beim Wischen im Auge schiebt sich der Faecher nach links weg.
  const zeigeRad = ["start", "laden", "uebergang"].includes(phase);
  const zeigeSpiel = ["uebergang", "frage"].includes(phase);
  const titel =
    spiel === "C"
      ? "Euer Ergebnis"
      : spiel === "B"
        ? "Dein Rückblick"
        : "Dein Ergebnis";
  function nochmal() {
    setDruck(null);
    setPhase("start");
    setAuswertung(false);
    setTextkarten(false);
    setKartenOffen(false);
  }
  return (
    <div className="sc-buehne">
      {zeigeSpiel ? (
        <div
          className="sc-spur"
          style={{ transform: textkarten ? "translateX(-100%)" : undefined }}
        >
          <div className="sc-spur-seite">
            <Spielplatte
              key={runde}
              fragen={fragen}
              pole={SPIELE[spiel].pole}
              zielWert={zielWert}
              onAntwort={antwort}
              kamera={kamera}
              kameraInfo={kameraInfo}
              auftritt={phase === "uebergang"}
              zusatz={zusatz}
              sonderDia={sonderDia}
              ergebnis={ergebnis}
              titel={titel}
              erklaerung={
                ergebnis
                  ? `Skill 0 = Zufall, +100 = besser als alle ${SPIELE[spiel].vergleich}. Ohne jede Aussagekraft erreicht das beste von ${ALLE.length} Horoskopen im Mittel etwa +${ergebnis.erwartung.toFixed(0)}.` +
                    (ergebnis.fenster
                      ? " Reihenfolge: Mittel aus dem letzten Monat und den letzten drei Monaten."
                      : "")
                  : null
              }
              hinweis={
                abkuerzung
                  ? "Abkürzung über das Datum (Entwicklung): Die Antworten wurden gewürfelt."
                  : null
              }
              sofort={abkuerzung}
              vonMitte={spiel === "C"}
              onAuswertung={() => setAuswertung(true)}
              onWeiter={() => {
                setKartenOffen(true);
                setTextkarten(true);
              }}
            />
          </div>
          {kartenOffen ? (
            <div className="sc-spur-seite">
              <Ergebnisplatte
                spiel={spiel}
                ergebnis={ergebnis}
                vergleich={SPIELE[spiel].vergleich}
                antwortZahl={
                  antworten.filter((a) => a.typ !== "auffaellig").length
                }
                visualPayloads={visualPayloads}
                heute={heute}
                ausblick={ausblick}
                paar={paar}
                texte={spiel !== "C" ? texte : null}
                onZurueck={() => setTextkarten(false)}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      {auswertung && phase === "frage" ? (
        <button
          type="button"
          className="sc-zurueck"
          aria-label="Noch einmal"
          onClick={nochmal}
        >
          ‹
        </button>
      ) : null}
      {auswahlSichtbar(auswertung, phase) ? (
        <button
          type="button"
          className="sc-zurueck sc-drucken"
          aria-label="Drucken"
          onClick={() => setDruck("auswahl")}
        >
          <svg viewBox="-12 -12 24 24" aria-hidden="true">
            {/* aufgeschlagenes Buch */}
            <path d="M0 -5 C -3 -7 -7 -7 -9 -6 L -9 6 C -7 5 -3 5 0 7 C 3 5 7 5 9 6 L 9 -6 C 7 -7 3 -7 0 -5 Z M0 -5 L0 7" />
          </svg>
        </button>
      ) : null}
      {druck === "auswahl" || druck?.zurueck ? (
        <DruckAuswahl
          beste={ergebnis?.alle?.ranking ?? ALLE}
          paarSpiel={spiel === "C"}
          geburt={geburt}
          vorher={druck}
          onAnsehen={(wahl) => setDruck(wahl)}
          onSchliessen={() => setDruck(null)}
        />
      ) : null}
      {druck?.auswahl && !druck.zurueck ? (
        <Buch
          spiel={spiel}
          auswahl={druck.auswahl}
          titel={druck.titel}
          geburt={geburt}
          visualPayloads={visualPayloads}
          paar={paar}
          texte={texte}
          ausblick={ausblick}
          heute={heute}
          onSchliessen={() => setDruck({ ...druck, zurueck: true })}
        />
      ) : null}
      {zeigeRad ? (
        <div className={phase === "uebergang" ? "sc-deckschicht" : undefined}>
          <Datumsrad
            onSpiel={spielWahl}
            laedt={phase !== "start"}
            fehler={fehler}
            abgang={phase === "uebergang"}
          />
        </div>
      ) : null}
      {phase === "start" ? <Zettel /> : null}
    </div>
  );
}
