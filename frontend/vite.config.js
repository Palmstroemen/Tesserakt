import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        // Prototyp der Schatulle (Fragerunde), eigene Seite neben dem bestehenden Spiel
        schatulle: resolve(__dirname, "schatulle.html"),
      },
    },
  },
});
