// Webseite: die Dateien des Apparats fuer den naechsten Besuch aufheben. Dateien unter /assets/ tragen eine
// Pruefsumme im Namen und aendern sich nie, also genuegt einmal holen; die Seite selbst kommt immer zuerst aus dem
// Netz, damit eine neue Fassung sofort ankommt. Das Backend bleibt aussen vor, ebenso der Film (Safari verlangt
// fuer Videos Teilantworten, die ein Zwischenlager nicht ohne Weiteres liefert).

const LAGER = "tesserakt-1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((namen) =>
        Promise.all(namen.filter((n) => n !== LAGER).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

// film-AbCd1234.mp4 -> film.mp4: der Name ohne Pruefsumme
const stamm = (pfad) => pfad.replace(/-[\w-]{8}(\.\w+)$/, "$1");

async function ausLager(anfrage, pfad) {
  const lager = await caches.open(LAGER);
  const treffer = await lager.match(anfrage);
  if (treffer) return treffer;
  const antwort = await fetch(anfrage);
  if (antwort.ok) {
    // aeltere Fassungen derselben Datei weg, sonst waechst das Lager mit jeder Veroeffentlichung
    const alt = (await lager.keys()).filter(
      (k) => stamm(new URL(k.url).pathname) === stamm(pfad),
    );
    await Promise.all(alt.map((k) => lager.delete(k)));
    await lager.put(anfrage, antwort.clone());
  }
  return antwort;
}

async function seite(anfrage) {
  const lager = await caches.open(LAGER);
  try {
    const antwort = await fetch(anfrage);
    if (antwort.ok) await lager.put("/", antwort.clone());
    return antwort;
  } catch (err) {
    const treffer = await lager.match("/");
    if (treffer) return treffer;
    throw err;
  }
}

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/") e.respondWith(seite(e.request));
  else if (url.pathname.startsWith("/assets/") && !url.pathname.endsWith(".mp4"))
    e.respondWith(ausLager(e.request, url.pathname));
});
