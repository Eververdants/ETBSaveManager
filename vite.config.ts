import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: '/ETBSaveManager/',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 生产环境移除注释
          comments: false
        }
      }
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // 输出目录
    outDir: 'dist',
    // 生成源码映射（生产环境可关闭）
    sourcemap: false,
    // 代码分割阈值
    chunkSizeWarningLimit: 1000,
    // Rollup 配置
    rollupOptions: {
      output: {
        // 手动分包
        manualChunks: {
          // Vue 核心
          'vue-vendor': ['vue', 'vue-i18n'],
          // FontAwesome
          'fontawesome': [
            '@fortawesome/fontawesome-svg-core',
            '@fortawesome/vue-fontawesome',
            '@fortawesome/free-solid-svg-icons',
            '@fortawesome/free-brands-svg-icons',
            '@fortawesome/free-regular-svg-icons'
          ]
        },
        // 资源文件命名
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.')
          const ext = info?.[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
            return 'img/[name]-[hash][extname]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return 'fonts/[name]-[hash][extname]'
          }
          if (ext === 'css') {
            return 'css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除 console
        drop_console: true,
        // 移除 debugger
        drop_debugger: true,
        // 移除无用代码
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      format: {
        // 移除注释
        comments: false
      }
    },
    // CSS 代码分割
    cssCodeSplit: true,
    // 启用 CSS 压缩
    cssMinify: true
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-i18n',
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/vue-fontawesome',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/free-brands-svg-icons'
    ]
  },
  // 服务器配置
  server: {
    port: 3000,
    open: true,
    cors: true
  },
  // 预览服务器配置
  preview: {
    port: 4173,
    open: true
  }
})
