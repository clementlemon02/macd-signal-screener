import { defineConfig } from "vite";
import { defines } from './env.mjs';
import path from "path";
import react from "@vitejs/plugin-react";

// Vite configuration
export default defineConfig({
  define: {
    __DEFINES__: defines.__DEFINES__,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
