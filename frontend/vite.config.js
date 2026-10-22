import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// start-dev.sh --handy setzt TESSERAKT_HTTPS_DIR: HTTPS mit selbst signiertem Zertifikat (Kamera im WLAN).
const httpsDir = process.env.TESSERAKT_HTTPS_DIR;

export default defineConfig({
  plugins: [react()],
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
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        // Prototyp des Apparats (Fragerunde), eigene Seite neben dem bestehenden Spiel
        apparat: resolve(__dirname, "apparat.html"),
      },
    },
  },
});
