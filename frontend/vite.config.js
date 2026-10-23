import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// start-dev.sh --handy setzt TESSERAKT_HTTPS_DIR: HTTPS mit selbst signiertem Zertifikat (Kamera im WLAN).
const httpsDir = process.env.TESSERAKT_HTTPS_DIR;

// Nur im Entwicklungsserver: Handy-Berichte aus werkstatt.js (POST /__werkstatt) landen in logs/handy.log,
// damit man sieht, was auf dem Testgeraet passiert (Browser, Fehler, Ton, Bilddauer).
const werkstattLog = {
  name: "werkstatt-log",
  configureServer(server) {
    const datei = resolve(__dirname, "../logs/handy.log");
    mkdirSync(resolve(__dirname, "../logs"), { recursive: true });
    server.middlewares.use("/__werkstatt", (req, res) => {
      let text = "";
      req.on("data", (d) => (text += d));
      req.on("end", () => {
        const zeit = new Date().toISOString().slice(11, 19);
        appendFileSync(datei, `${zeit} ${req.socket.remoteAddress} ${text}\n`);
        res.end();
      });
    });
  },
};

export default defineConfig({
  plugins: [react(), werkstattLog],
  server: {
    port: 5173,
    https: httpsDir
      ? { key: readFileSync(resolve(httpsDir, "key.pem")), cert: readFileSync(resolve(httpsDir, "cert.pem")) }
      : undefined,
    // Backend unter /api: so bleibt eine HTTPS-Seite bei HTTPS (sonst blockiert der Browser die Anfragen)
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", rewrite: (pfad) => pfad.replace(/^\/api/, "") },
    },
  },
});
