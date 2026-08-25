import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 5174,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    // 代码分割配置
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库拆分为独立 chunk
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // 将动画库拆分为独立 chunk
          "motion-vendor": ["motion"],
          // 将状态管理库拆分为独立 chunk
          "state-vendor": ["zustand", "@tanstack/react-query"],
          // 将国际化库拆分为独立 chunk
          "i18n-vendor": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
        },
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 设置 chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（开发环境）
    sourcemap: false,
    // 压缩配置
    minify: "esbuild",
    // 目标浏览器
    target: "es2020",
  },
}));
