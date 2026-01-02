import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import fs from "fs";

const host = process.env.TAURI_DEV_HOST;

// 读取公告数据文件
const releaseNotesZhCN = fs.readFileSync(
  path.resolve(__dirname, "src/i18n/locales/release-notes.zh-CN.json"),
  "utf8"
);
const releaseNotesEnUS = fs.readFileSync(
  path.resolve(__dirname, "src/i18n/locales/release-notes.en-US.json"),
  "utf8"
);
const releaseNotesZhTW = fs.readFileSync(
  path.resolve(__dirname, "src/i18n/locales/release-notes.zh-TW.json"),
  "utf8"
);

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
    __VUE_I18N_FULL_INSTALL__: true,
    __VUE_I18N_LEGACY_API__: false,
    __VUE_I18N_PROD_DEVTOOLS__: false,

    // 强制包含更新公告数据，防止Tree Shaking移除
    __RELEASE_NOTES_ZH_CN__: releaseNotesZhCN,
    __RELEASE_NOTES_EN_US__: releaseNotesEnUS,
    __RELEASE_NOTES_ZH_TW__: releaseNotesZhTW,
  },

  // 构建优化配置
  build: {
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 启用Tree Shaking
    rollupOptions: {
      output: {
        // 手动分割chunk，优化加载顺序
        manualChunks: {
          // Vue相关依赖
          "vue-vendor": ["vue", "vue-router", "vue-i18n"],
          // UI相关依赖
          "ui-vendor": [
            "@fortawesome/fontawesome-svg-core",
            "@fortawesome/free-solid-svg-icons",
            "@fortawesome/free-brands-svg-icons",
          ],
          // 其他工具库
          utils: ["chart.js", "gsap", "vuedraggable"],
          // Tauri相关
          tauri: ["@tauri-apps/api"],
        },
        // 优化chunk文件名
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split("/").pop().replace(".vue", "")
            : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/[name]-[hash].css";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
      // 外部化大型依赖，减少bundle大小
      external: (id) => {
        // 在开发环境中外部化某些依赖
        if (process.env.NODE_ENV === "development") {
          return false;
        }
        return false;
      },
    },
    // 启用source map用于生产环境调试
    sourcemap: false,
    // 优化chunk大小警告阈值
    chunkSizeWarningLimit: 600,
    // 启用压缩
    minify: "terser",
    terser_options: {
      compress: {
        // 移除console等调试代码
        // drop_console: true,  // 注释掉，保留console输出
        drop_debugger: true,
        // 移除未使用的代码
        dead_code: true,
        // 优化条件语句
        conditionals: true,
        // 合并变量声明
        collapse_vars: true,
        // 移除未引用的参数
        unused: true,
      },
      mangle: {
        // 保留类名
        keep_fnames: true,
      },
      format: {
        // 保持注释
        comments: false,
      },
    },
  },

  // 依赖优化
  optimizeDeps: {
    include: ["vue", "vue-router", "vue-i18n", "@tauri-apps/api"],
    exclude: [
      // 排除大型依赖，让它们按需加载
      "@fortawesome/fontawesome-svg-core",
    ],
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
    // CSS代码分割
    codeSplit: true,
    // CSS预处理器配置
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.css";`,
      },
    },
  },

  // 服务器配置 - 用于gzip压缩
  preview: {
    port: 4173,
    strictPort: true,
    headers: {
      "Cache-Control": "public, max-age=31536000",
      "Content-Encoding": "gzip",
    },
  },
}));
