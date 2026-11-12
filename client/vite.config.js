import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite serves the React app and forwards API calls to Express during development.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5001"
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
