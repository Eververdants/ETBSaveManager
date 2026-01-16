import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [vue()],
  base: "./",
  assetsInclude: ["**/*.md"],
  publicDir: "public",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  define: {
    __VUE_I18N_FULL_INSTALL__: false, // 禁用完整安装，减少包体积
    __VUE_I18N_LEGACY_API__: false,
    __VUE_I18N_PROD_DEVTOOLS__: false,
  },

  // 构建优化配置
  build: {
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 目标现代浏览器
    target: "esnext",
    // 启用Tree Shaking
    rollupOptions: {
      output: {
        // 优化chunk分割策略
        manualChunks(id) {
          // Vue核心 - 最高优先级
          if (id.includes("node_modules/vue/") || id.includes("node_modules/@vue/")) {
            return "vue-core";
          }
          // Vue Router - 启动必需
          if (id.includes("vue-router")) {
            return "vue-router";
          }
          // i18n - 按需加载
          if (id.includes("vue-i18n")) {
            return "i18n";
          }
          // FontAwesome - 延迟加载
          if (id.includes("@fortawesome")) {
            return "icons";
          }
          // Tauri API - 延迟加载
          if (id.includes("@tauri-apps")) {
            return "tauri";
          }
          // 图表库 - 按需加载
          if (id.includes("chart.js")) {
            return "charts";
          }
          // 动画库 - 延迟加载
          if (id.includes("gsap")) {
            return "animations";
          }
          // 拖拽库 - 按需加载
          if (id.includes("vuedraggable") || id.includes("sortablejs")) {
            return "draggable";
          }
          // Markdown - 按需加载
          if (id.includes("markdown-it") || id.includes("marked")) {
            return "markdown";
          }
          // 虚拟滚动 - 首页需要
          if (id.includes("@tanstack/vue-virtual") || id.includes("vue-virtual-scroller")) {
            return "virtual-scroll";
          }
        },
        // 优化chunk文件名
        chunkFileNames: "js/[name]-[hash:8].js",
        entryFileNames: "js/[name]-[hash:8].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "css/[name]-[hash:8].css";
          }
          return "assets/[name]-[hash:8][extname]";
        },
      },
    },
    // 禁用source map
    sourcemap: false,
    // 优化chunk大小警告阈值
    chunkSizeWarningLimit: 500,
    // 启用压缩
    minify: "terser",
    terserOptions: {
      compress: {
        drop_debugger: true,
        dead_code: true,
        conditionals: true,
        collapse_vars: true,
        unused: true,
        passes: 2, // 多次压缩
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    // 启用模块预加载
    modulePreload: {
      polyfill: false, // 现代浏览器不需要polyfill
    },
  },

  // 依赖预构建优化
  optimizeDeps: {
    // 预构建关键依赖
    include: [
      "vue",
      "vue-router",
    ],
    // 排除大型依赖，让它们按需加载
    exclude: [
      "@fortawesome/fontawesome-svg-core",
      "@fortawesome/free-solid-svg-icons",
      "@fortawesome/free-brands-svg-icons",
      "chart.js",
      "gsap",
    ],
    // 强制预构建
    force: false,
  },

  // esbuild 优化
  esbuild: {
    // 移除console（生产环境）
    drop: process.env.NODE_ENV === "production" ? ["debugger"] : [],
    // 启用tree shaking
    treeShaking: true,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1430,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1431,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // CSS优化配置
  css: {
    // 开发环境禁用CSS代码分割以加快HMR
    devSourcemap: false,
  },

  // 服务器配置
  preview: {
    port: 4173,
    strictPort: true,
    headers: {
      "Cache-Control": "public, max-age=31536000",
    },
  },
}));
