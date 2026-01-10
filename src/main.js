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

import { createApp } from "vue";
import App from "./App.vue";

// 立即创建应用实例（不等待任何异步操作）
const app = createApp(App);

// 关键路径：只加载启动必需的模块
import router from "./router";
import "./styles/animations.css";

// 延迟加载的模块引用
let i18nInstance = null;
let FontAwesomeIcon = null;

// 最小化图标集 - 只加载启动时必需的图标
const loadCriticalIcons = async () => {
  const { library } = await import("@fortawesome/fontawesome-svg-core");
  const { FontAwesomeIcon: FAIcon } = await import("@fortawesome/vue-fontawesome");
  FontAwesomeIcon = FAIcon;
  
  // 启动时必需的图标（侧边栏 + 标题栏）
  const { 
    faHome, faCog, faPlus, faStore, faInfoCircle,
    faMinus, faWindowMaximize, faTimes, faList, faPlusCircle,
    faCommentDots, faSearch, faMagnifyingGlass, faFolder, faEdit,
    faEye, faEyeSlash, faTrash
  } = await import("@fortawesome/free-solid-svg-icons");
  
  library.add(faHome, faCog, faPlus, faStore, faInfoCircle, faMinus,
    faWindowMaximize, faTimes, faList, faPlusCircle, faCommentDots,
    faSearch, faMagnifyingGlass, faFolder, faEdit, faEye, faEyeSlash,
    faTrash);
  
  return FAIcon;
};

// 延迟加载完整图标集
const loadAllIcons = async () => {
  const { library } = await import("@fortawesome/fontawesome-svg-core");
  const solidIcons = await import("@fortawesome/free-solid-svg-icons");
  const brandIcons = await import("@fortawesome/free-brands-svg-icons");
  
  // 批量添加所有图标
  const iconsToAdd = [
    solidIcons.faArrowLeft, solidIcons.faArrowRight, solidIcons.faArrowRotateRight,
    solidIcons.faBug, solidIcons.faCheck, solidIcons.faCheckCircle,
    solidIcons.faCloud, solidIcons.faCloudUploadAlt, solidIcons.faCode,
    solidIcons.faDatabase, solidIcons.faDownload, 
    solidIcons.faEnvelope, solidIcons.faExclamationCircle, solidIcons.faExclamationTriangle,
    solidIcons.faExternalLinkAlt, 
    solidIcons.faFileAlt, solidIcons.faFileArchive, solidIcons.faFileCode,
    solidIcons.faFlask, solidIcons.faFrown,
    solidIcons.faGear, solidIcons.faGlobe, solidIcons.faHandPaper,
    solidIcons.faHeart, solidIcons.faKey, solidIcons.faLayerGroup,
    solidIcons.faList, solidIcons.faLock, solidIcons.faMagnifyingGlass,
    solidIcons.faMeh, solidIcons.faMicrochip, solidIcons.faMousePointer,
    solidIcons.faPalette, solidIcons.faPlusCircle, solidIcons.faPuzzlePiece,
    solidIcons.faRedo, solidIcons.faRefresh, solidIcons.faSave,
    solidIcons.faSearch, solidIcons.faSkull, solidIcons.faSmile,
    solidIcons.faSpinner, solidIcons.faSquare, solidIcons.faTachometerAlt,
    solidIcons.faTrash, solidIcons.faUsers, solidIcons.faChartPie,
    solidIcons.faThLarge, solidIcons.faDraftingCompass, solidIcons.faTimesCircle,
    solidIcons.faRocket, solidIcons.faSort, solidIcons.faArrowsUpDown,
    solidIcons.faHashtag, solidIcons.faUser, solidIcons.faBrain,
    solidIcons.faSuitcase, solidIcons.faChevronUp, solidIcons.faChevronDown,
    solidIcons.faKeyboard, solidIcons.faPaste, solidIcons.faFileImport,
    solidIcons.faClipboardList, solidIcons.faSlidersH, solidIcons.faTrashAlt,
    solidIcons.faCheckDouble, solidIcons.faExchangeAlt, solidIcons.faCopy,
    solidIcons.faGraduationCap, solidIcons.faPlayCircle, solidIcons.faPlay,
    solidIcons.faClock, solidIcons.faUndo, solidIcons.faFileExport,
    solidIcons.faSnowflake, solidIcons.faCommentDots, solidIcons.faInbox,
    solidIcons.faPaperPlane, solidIcons.faComment, solidIcons.faHistory,
    solidIcons.faLightbulb, solidIcons.faMap, solidIcons.faUserPlus,
    solidIcons.faHandPointer, solidIcons.faCube, solidIcons.faDoorOpen,
    solidIcons.faGamepad, solidIcons.faFolderOpen, solidIcons.faCircle,
    solidIcons.faToggleOn, solidIcons.faToggleOff, solidIcons.faPauseCircle,
    solidIcons.faChevronLeft, solidIcons.faChevronRight, solidIcons.faCodeBranch,
    solidIcons.faAlignLeft, solidIcons.faCertificate, solidIcons.faLanguage,
    solidIcons.faBolt, solidIcons.faPause, solidIcons.faFolderTree,
    brandIcons.faBilibili, brandIcons.faGithub, brandIcons.faTiktok,
    brandIcons.faXTwitter
  ];
  
  library.add(...iconsToAdd);
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
  const [storage, FAIcon, i18n] = await Promise.all([
    import("./services/storageService").then(m => {
      m.initStorage();
      return m.default;
    }),
    loadCriticalIcons(),
    initI18n(),
  ]);

  console.log(`[Startup] 关键模块加载: ${(performance.now() - startTime).toFixed(0)}ms`);

  // 阶段2：配置 Vue 应用
  app.use(router);
  app.use(i18n);
  app.component("font-awesome-icon", FAIcon);
  
  // 暴露 i18n 到全局
  window.$i18n = i18n.global;

  // 阶段3：挂载应用（用户可见）
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

  try {
    const { Window } = await import("@tauri-apps/api/window");
    const appWindow = new Window("main");
    await appWindow.show();
    console.log(`[Startup] 窗口显示: ${(performance.now() - startTime).toFixed(0)}ms`);
  } catch (error) {
    console.warn("[Startup] 显示窗口失败:", error);
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
    const { Window } = await import("@tauri-apps/api/window");
    const appWindow = new Window("main");
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
  console.error("[Startup] 应用启动失败:", error);
});

// 浮动按钮保护（延迟初始化）
requestIdleCallback(() => {
  import("./utils/floatingButtonProtection.js").then(({ initGlobalFloatingButtonProtection }) => {
    initGlobalFloatingButtonProtection();
  });
}, { timeout: 3000 });
