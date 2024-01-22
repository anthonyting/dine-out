import path from "path";
import react from "@vitejs/plugin-react";
import fs from "fs";
import { defineConfig } from "vite";

const DINE_OUT_CHUNK_COUNT = fs.readdirSync(
  path.resolve(__dirname, "../scraping/dist/menu/chunks")
).length;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env.DINE_OUT_CHUNK_COUNT": DINE_OUT_CHUNK_COUNT,
  },
});
