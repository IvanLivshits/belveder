import preact from "@preact/preset-vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [preact()],
  // Images are served by id from /assets.json; the folder is the repo-level assets/.
  publicDir: resolve(__dirname, "../../assets"),
  server: { host: true, port: 5173, allowedHosts: true },
  build: { outDir: "dist", emptyOutDir: true, target: "es2020" },
});
