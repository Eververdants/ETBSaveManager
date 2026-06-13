/**
 * Application entry point - optimized startup
 * Optimization strategies:
 * 1. Lazy-load non-critical modules
 * 2. Parallel initialization
 * 3. On-demand icon loading
 * 4. Minimize synchronous blocking
 */

// Polyfills - must be loaded first
import "./utils/polyfills.js";

// FontAwesome styles (prevent icon size issues if style injection fails in production)
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config as faConfig } from "@fortawesome/fontawesome-svg-core";
faConfig.autoAddCss = false;

import * as vueRuntime from "vue";
import App from "./App.vue";

import { setAppContext } from "./appContext.js";
import storage, { initStorage } from "./services/storageService";
const { createApp } = vueRuntime;

// Create app instance immediately (no async wait)
const app = createApp(App);

// Critical path: only load modules required for startup
import router from "./router";
import "./styles/animations.css";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import "@vue-flow/controls/dist/style.css";

// Lazy-loaded module references
let i18nInstance = null;

// Load critical icons (required for startup)
const loadCriticalIcons = async () => {
  const { FontAwesomeIcon: FAIcon } = await import("@fortawesome/vue-fontawesome");
  const { registerCriticalIcons } = await import("./utils/icons-critical.js");

  registerCriticalIcons();

  return FAIcon;
};

// Lazy load full icon set
const loadAllIcons = async () => {
  const { registerIcons } = await import("./utils/icons-full.js");
  registerIcons();
};

// Initialize i18n (lightweight)
const initI18n = async () => {
  const { createI18n } = await import("vue-i18n");

  // Inline language detection to avoid extra imports
  const getSavedLocale = () => {
    const saved = storage.getItem("language");
    if (saved && ["zh-CN", "en-US", "zh-TW"].includes(saved)) return saved;
    const lang = navigator.language || "zh-CN";
    if (["zh-TW", "zh-HK", "zh-MO"].includes(lang)) return "zh-TW";
    if (lang.startsWith("zh")) return "zh-CN";
    if (lang.startsWith("en")) return "en-US";
    return "zh-CN";
  };

  // Dynamically import language files
  const locale = getSavedLocale();
  const messages = {};

  // Only load current language
  if (locale === "zh-CN") {
    messages["zh-CN"] = (await import("./i18n/locales/zh-CN/index.js")).default;
  } else if (locale === "en-US") {
    messages["en-US"] = (await import("./i18n/locales/en-US/index.js")).default;
  } else if (locale === "zh-TW") {
    messages["zh-TW"] = (await import("./i18n/locales/zh-TW/index.js")).default;
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

// Lazy-load other languages
const loadOtherLocales = async () => {
  if (!i18nInstance) return;

  const currentLocale = i18nInstance.global.locale.value;
  const locales = ["zh-CN", "en-US", "zh-TW"].filter((l) => l !== currentLocale);

  for (const locale of locales) {
    if (!i18nInstance.global.messages.value[locale]) {
      const messages = (await import(`./i18n/locales/${locale}/index.js`)).default;
      i18nInstance.global.setLocaleMessage(locale, messages);
    }
  }
};

// Main initialization flow
async function initApp() {
  const startTime = performance.now();

  // Phase 1: Initialize critical modules in parallel
  console.log("[Startup] Initializing critical modules...");
  const [, FAIcon, i18n] = await Promise.all([initStorage(), loadCriticalIcons(), initI18n()]);

  console.log(`[Startup] Critical modules loaded: ${(performance.now() - startTime).toFixed(0)}ms`);

  // Phase 2: Configure Vue app
  console.log("[Startup] Configuring Vue app...");
  app.use(router);
  app.use(i18n);
  app.component("FontAwesomeIcon", FAIcon);

  setAppContext({ i18n: i18n.global, router, vue: vueRuntime, storage });

  // Phase 3: Mount app (user-visible)
  console.log("[Startup] Mounting app...");
  app.mount("#app");
  console.log(`[Startup] App mounted: ${(performance.now() - startTime).toFixed(0)}ms`);

  // Phase 4: Show window after render completes
  // Disable transition animations to prevent theme flash on startup
  document.documentElement.classList.add("no-transition");

  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50);
      });
    });
  });

  console.log("[Startup] Preparing to show window...");
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const appWindow = getCurrentWindow();
    await appWindow.show();
    console.log(`[Startup] Window shown: ${(performance.now() - startTime).toFixed(0)}ms`);
  } catch (error) {
    console.warn("[Startup] Failed to show window:", error instanceof Error ? error.message : error);
  }

  // Restore transition animations after window is shown
  requestAnimationFrame(() => {
    document.documentElement.classList.remove("no-transition");
  });

  // Phase 5: Background-load non-critical modules (non-blocking)
  requestIdleCallback(
    () => {
      Promise.all([
        loadAllIcons(),
        loadOtherLocales(),
        initWindowTitle(i18n),
      ]).then(() => {
        console.log(`[Startup] Full initialization: ${(performance.now() - startTime).toFixed(0)}ms`);
      });
    },
    { timeout: 2000 },
  );

  return app;
}

// Window title setup (delayed)
async function initWindowTitle(i18n) {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const appWindow = getCurrentWindow();
    const title = i18n.global.t("app.name");
    await appWindow.setTitle(title);

    // Listen for language changes
    window.addEventListener("language-changed", async () => {
      const newTitle = i18n.global.t("app.name");
      await appWindow.setTitle(newTitle);
    });
  } catch (error) {
    console.warn("[Window] Failed to set title:", error);
  }
}

// Start the app
initApp().catch((error) => {
  const errorMsg = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
  console.error("[Startup] App failed to start:", errorMsg);
});

// Floating button protection (delayed initialization)
requestIdleCallback(
  () => {
    import("./utils/floatingButtonProtection.js").then(({ initGlobalFloatingButtonProtection }) => {
      initGlobalFloatingButtonProtection();
    });
  },
  { timeout: 3000 },
);

// Disable interactions in production mode (prevent shortcuts, text selection, etc.)
if (import.meta.env.PROD) {
  import("./utils/disableInteractions.js").then(({ disableInteractions }) => {
    disableInteractions();
  });
}

