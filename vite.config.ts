import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import VueI18nVitePlugin from "@intlify/unplugin-vue-i18n/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async ({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [vue(), tailwindcss(), VueI18nVitePlugin({})],
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
        treeshake: {
          moduleSideEffects: (id) => {
            // 明确标记有副作用的模块（如图标注册）
            if (id.includes("icons-critical") || id.includes("icons-full")) {
              return true;
            }
            return false;
          },
        },
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
            // Pinia - 与 Vue Router 同优先级
            if (id.includes("pinia")) {
              return "vue-core"; // 与 Vue 核心共享 chunk
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
            // 虚拟滚动 - 首页需要
            if (id.includes("@tanstack/vue-virtual")) {
              return "virtual-scroll";
            }
            // 中文拼音库 - 较大 (~866KB)，单独 chunk
            if (id.includes("pinyin-pro")) {
              return "pinyin";
            }
            // HTML 清理库 - 较大 (~1.5MB)，单独 chunk
            if (id.includes("dompurify")) {
              return "dompurify";
            }
            // Vue Flow 图谱库 - 按需加载
            if (id.includes("@vue-flow")) {
              return "vue-flow";
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
      // 跳过 gzip/brotli 体积统计，减少构建时间
      reportCompressedSize: false,
      // 优化chunk大小警告阈值
      chunkSizeWarningLimit: 500,
      // 启用压缩 (esbuild 比 terser 快 ~30%，产物体积相当)
      minify: "esbuild",
      // 启用模块预加载
      modulePreload: {
        polyfill: false, // 现代浏览器不需要polyfill
      },
    },

    // 依赖预构建优化
    optimizeDeps: {
      // 预构建关键依赖
      include: ["vue", "vue-router"],
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
      // 生产环境移除 debugger
      drop: isProd ? ["debugger"] : [],
      // 生产环境去除低价值日志，保留 warn/error 便于排障
      pure: isProd ? ["console.log", "console.info", "console.debug"] : [],
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

    // Vitest 配置：landing-page-react 是独立子项目（有自己的 alias 与依赖），
    // 根 vitest 不应扫描它的测试
    test: {
      exclude: [
        "**/node_modules/**",
        "**/landing-page-react/**",
        "**/dist/**",
        "**/cypress/**",
        "**/.{idea,git,cache,output,temp}/**",
      ],
    },
  };
});
