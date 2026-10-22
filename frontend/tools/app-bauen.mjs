// Baut das Frontend fuer die App (Capacitor): wie "vite build", aber nach dist-app und mit dem Apparat als
// Startseite (index.html), denn die App startet immer mit index.html.
// Das Backend kommt aus VITE_API_BASE (z. B. http://10.0.2.2:8000 fuer den Android-Emulator, der so den
// Entwicklungsrechner erreicht).
import { execSync } from "node:child_process";
import { renameSync, rmSync } from "node:fs";

if (!process.env.VITE_API_BASE) {
  console.error("VITE_API_BASE fehlt, z. B. VITE_API_BASE=http://10.0.2.2:8000 npm run build:app");
  process.exit(1);
}
rmSync("dist-app", { recursive: true, force: true });
execSync("npx vite build --outDir dist-app", { stdio: "inherit" });
rmSync("dist-app/index.html");
renameSync("dist-app/apparat.html", "dist-app/index.html");
