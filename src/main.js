/**
 * 应用入口 - 极致启动优化版
 * 优化策略：
 * 1. 延迟非关键模块加载
 * 2. 并行初始化
 * 3. 按需加载图标
 * 4. 减少同步阻塞
 */

// Polyfills - 必须最先加载
import "./utils/polyfills.js";

// 控制台转发 - 尽早初始化，便于调试
import { initConsoleForwarder } from "./utils/consoleForwarder.js";
initConsoleForwarder();

import { createApp } from "vue";
import App from "./App.vue";

// 立即创建应用实例（不等待任何异步操作）
const app = createApp(App);

// 关键路径：只加载启动必需的模块
import router from "./router";
import "./styles/animations.css";

// 延迟加载的模块引用
let i18nInstance = null;

// 加载关键图标（启动必需）
const loadCriticalIcons = async () => {
  const { FontAwesomeIcon: FAIcon } = await import("@fortawesome/vue-fontawesome");
  const { registerCriticalIcons } = await import("./utils/icons.js");
  
  registerCriticalIcons();
  
  return FAIcon;
};

// 延迟加载完整图标集
const loadAllIcons = async () => {
  const { registerIcons } = await import("./utils/icons.js");
  registerIcons();
};

// 初始化 i18n（轻量级）
const initI18n = async () => {
  const { createI18n } = await import("vue-i18n");
  const storage = (await import("./services/storageService")).default;
  
  // 内联语言检测，避免额外导入
  const getSavedLocale = () => {
    const saved = storage.getItem("language");
    if (saved && ["zh-CN", "en-US", "zh-TW"].includes(saved)) return saved;
    const lang = navigator.language || "zh-CN";
    if (["zh-TW", "zh-HK", "zh-MO"].includes(lang)) return "zh-TW";
    if (lang.startsWith("zh")) return "zh-CN";
    if (lang.startsWith("en")) return "en-US";
    return "zh-CN";
  };

  // 动态导入语言文件
  const locale = getSavedLocale();
  const messages = {};
  
  // 只加载当前语言
  if (locale === "zh-CN") {
    messages["zh-CN"] = (await import("./i18n/locales/zh-CN.json")).default;
  } else if (locale === "en-US") {
    messages["en-US"] = (await import("./i18n/locales/en-US.json")).default;
  } else if (locale === "zh-TW") {
    messages["zh-TW"] = (await import("./i18n/locales/zh-TW.json")).default;
  }

  i18nInstance = createI18n({
    legacy: false,
    locale,
    fallbackLocale: "en-US",
    messages,
    silentTranslationWarn: true,
    missingWarn: false,
    fallbackWarn: false,
  });

  return i18nInstance;
};

// 延迟加载其他语言
const loadOtherLocales = async () => {
  if (!i18nInstance) return;
  
  const currentLocale = i18nInstance.global.locale.value;
  const locales = ["zh-CN", "en-US", "zh-TW"].filter(l => l !== currentLocale);
  
  for (const locale of locales) {
    if (!i18nInstance.global.messages.value[locale]) {
      const messages = (await import(`./i18n/locales/${locale}.json`)).default;
      i18nInstance.global.setLocaleMessage(locale, messages);
    }
  }
};

// 主初始化流程
async function initApp() {
  const startTime = performance.now();
  
  // 阶段1：并行初始化关键模块
  console.log("[Startup] 开始初始化关键模块...");
  const [, FAIcon, i18n] = await Promise.all([
    import("./services/storageService").then(m => {
      m.initStorage();
      return m.default;
    }),
    loadCriticalIcons(),
    initI18n(),
  ]);

  console.log(`[Startup] 关键模块加载: ${(performance.now() - startTime).toFixed(0)}ms`);

  // 阶段2：配置 Vue 应用
  console.log("[Startup] 配置 Vue 应用...");
  app.use(router);
  app.use(i18n);
  app.component("font-awesome-icon", FAIcon);
  
  // 暴露 i18n 到全局
  window.$i18n = i18n.global;

  // 阶段3：挂载应用（用户可见）
  console.log("[Startup] 挂载应用...");
  app.mount("#app");
  console.log(`[Startup] 应用挂载: ${(performance.now() - startTime).toFixed(0)}ms`);

  // 阶段4：等待渲染完成后显示窗口
  // 禁用过渡动画，避免启动时主题切换闪烁
  document.documentElement.classList.add("no-transition");
  
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50);
      });
    });
  });

  console.log("[Startup] 准备显示窗口...");
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const appWindow = getCurrentWindow();
    await appWindow.show();
    console.log(`[Startup] 窗口显示: ${(performance.now() - startTime).toFixed(0)}ms`);
  } catch (error) {
    console.warn("[Startup] 显示窗口失败:", error instanceof Error ? error.message : error);
  }

  // 窗口显示后恢复过渡动画
  requestAnimationFrame(() => {
    document.documentElement.classList.remove("no-transition");
  });

  // 阶段5：后台加载非关键模块（不阻塞渲染）
  requestIdleCallback(() => {
    Promise.all([
      loadAllIcons(),
      loadOtherLocales(),
      initPluginSystem(),
      initWindowTitle(i18n),
    ]).then(() => {
      console.log(`[Startup] 完整初始化: ${(performance.now() - startTime).toFixed(0)}ms`);
    });
  }, { timeout: 2000 });

  return app;
}

// 插件系统初始化（延迟）
async function initPluginSystem() {
  try {
    const { initializePluginSystem, languagePluginLoader } = await import("./plugins");
    languagePluginLoader.setI18nInstance(i18nInstance);
    await initializePluginSystem();
  } catch (error) {
    console.warn("[Plugins] 初始化失败:", error);
  }
}

// 窗口标题设置（延迟）
async function initWindowTitle(i18n) {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const appWindow = getCurrentWindow();
    const title = i18n.global.t("app.name");
    await appWindow.setTitle(title);
    
    // 监听语言变化
    window.addEventListener("language-changed", async () => {
      const newTitle = i18n.global.t("app.name");
      await appWindow.setTitle(newTitle);
    });
  } catch (error) {
    console.warn("[Window] 设置标题失败:", error);
  }
}

// 启动应用
initApp().catch((error) => {
  const errorMsg = error instanceof Error 
    ? `${error.message}\n${error.stack}` 
    : String(error);
  console.error("[Startup] 应用启动失败:", errorMsg);
});

// 浮动按钮保护（延迟初始化）
requestIdleCallback(() => {
  import("./utils/floatingButtonProtection.js").then(({ initGlobalFloatingButtonProtection }) => {
    initGlobalFloatingButtonProtection();
  });
}, { timeout: 3000 });

// 生产模式下禁用交互（防止快捷键、文字选中等）
if (import.meta.env.PROD) {
  import("./utils/disableInteractions.js").then(({ disableInteractions }) => {
    disableInteractions();
  });
}
