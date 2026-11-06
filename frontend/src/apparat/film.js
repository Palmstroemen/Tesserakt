import filmDatei from "./kaestchen/film.mp4";

// Das Video des Films, angelegt schon beim Vorblatt: Es laedt, waehrend man liest, und wird beim Antippen fuer den Ton
// freigeschaltet. Safari gibt Ton nur einem Video frei, das in der Beruehrung selbst gestartet wird, Apparat und
// Kaestchen laden aber erst danach (main.jsx).

// ohne Vorschaubild zeigt die Android-WebView bis zum ersten Bild einen grauen Platzhalter mit Abspielpfeil; ein
// durchsichtiges Bild laesst stattdessen den dunklen Grund stehen
const LEERES_BILD =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

let video = null;

export function filmVideo() {
  if (!video) {
    video = document.createElement("video");
    video.poster = LEERES_BILD;
    video.playsInline = true;
    video.preload = "auto";
    video.src = filmDatei;
  }
  return video;
}

// aus der Beruehrung heraus aufrufen
export function filmFreischalten() {
  const v = filmVideo();
  v.play()?.catch(() => {}); // abgebrochen vom pause() gleich darunter, die Freigabe bleibt
  v.pause();
}
