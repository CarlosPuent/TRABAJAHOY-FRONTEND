import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  // Base path for GitHub Pages deployment (production only)

  base: mode === "production" ? "/TRABAJAHOY-FRONTEND/" : "/",
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@js": path.resolve(__dirname, "src/js"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@services": path.resolve(__dirname, "src/js/services"),
      "@components": path.resolve(__dirname, "src/js/components"),
      "@utils": path.resolve(__dirname, "src/js/utils"),
      "@core": path.resolve(__dirname, "src/js/core"),
      "@styles": path.resolve(__dirname, "src/styles"),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
}));
