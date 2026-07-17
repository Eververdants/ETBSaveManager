/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const basePath = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: basePath,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "esnext",
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) {
            return "react-core";
          }
          if (id.includes("node_modules/i18next") || id.includes("node_modules/react-i18next")) {
            return "i18n";
          }
          if (id.includes("node_modules/lenis")) {
            return "lenis";
          }
        },
        chunkFileNames: "assets/[name]-[hash:8].js",
        entryFileNames: "assets/[name]-[hash:8].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/[name]-[hash:8].css";
          }
          return "assets/[name]-[hash:8][extname]";
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    css: false,
  },
});
