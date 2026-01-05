import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import { Window } from "@tauri-apps/api/window";
import App from "./App.vue";
import router from "./router";
import "./styles/animations.css";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import storage, { initStorage } from "./services/storageService";
// Solid icons
import {
  faArrowLeft,
  faArrowRight,
  faArrowRotateRight,
  faBug,
  faCheck,
  faCheckCircle,
  faCloud,
  faCloudUploadAlt,
  faCode,
  faCog,
  faDatabase,
  faDownload,
  faEdit,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFileAlt,
  faFileArchive,
  faFileCode,
  faFlask,
  faFolder,
  faFrown,
  faGear,
  faGlobe,
  faHandPaper,
  faHeart,
  faInfoCircle,
  faKey,
  faLayerGroup,
  faList,
  faLock,
  faMagnifyingGlass,
  faMeh,
  faMicrochip,
  faMinus,
  faMousePointer,
  faPalette,
  faPlus,
  faPlusCircle,
  faPuzzlePiece,
  faRedo,
  faRefresh,
  faSave,
  faSearch,
  faSkull,
  faSmile,
  faSpinner,
  faSquare,
  faStore,
  faTachometerAlt,
  faTimes,
  faTrash,
  faUsers,
  faWindowMaximize,
  faChartPie,
  faThLarge,
  faDraftingCompass,
  faTimesCircle,
  faRocket,
  faSort,
  faArrowsUpDown,
  faHashtag,
  faUser,
  faBrain,
  faSuitcase,
  faChevronUp,
  faChevronDown,
  faKeyboard,
  faPaste,
  faFileImport,
  faClipboardList,
  faSlidersH,
  faTrashAlt,
  faCheckDouble,
  faExchangeAlt,
  faCopy,
  faGraduationCap,
  faPlayCircle,
  faPlay,
  faClock,
  faUndo,
  faFileExport,
  faSnowflake,
  faCommentDots,
  faInbox,
  faPaperPlane,
  faComment,
  faHistory,
  faLightbulb,
  faMap,
  faUserPlus,
  faHandPointer,
  faCube,
  faDoorOpen,
  faGamepad,
  faFolderOpen,
  faCircle,
  faToggleOn,
  faToggleOff,
  faPauseCircle,
  faChevronLeft,
  faChevronRight,
  faCodeBranch,
  faAlignLeft,
  faCertificate,
  faLanguage,
  faBolt,
  faPause,
  faFolderTree
} from "@fortawesome/free-solid-svg-icons";

// Brand icons
import {
  faBilibili,
  faGithub,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons";

library.add(
  // Solid icons
  faArrowLeft,
  faArrowRight,
  faArrowRotateRight,
  faBug,
  faCheck,
  faCheckCircle,
  faCloud,
  faCloudUploadAlt,
  faCode,
  faCog,
  faDatabase,
  faDownload,
  faEdit,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFileAlt,
  faFileArchive,
  faFileCode,
  faFlask,
  faFolder,
  faFrown,
  faGear,
  faGlobe,
  faHandPaper,
  faHeart,
  faInfoCircle,
  faKey,
  faLayerGroup,
  faList,
  faLock,
  faMagnifyingGlass,
  faMeh,
  faMicrochip,
  faMinus,
  faMousePointer,
  faPalette,
  faPlus,
  faPlusCircle,
  faPuzzlePiece,
  faRedo,
  faRefresh,
  faSave,
  faSearch,
  faSkull,
  faSmile,
  faSpinner,
  faSquare,
  faStore,
  faTachometerAlt,
  faTimes,
  faTrash,
  faUsers,
  faWindowMaximize,
  // Brand icons
  faBilibili,
  faGithub,
  faTiktok,
  faChartPie,
  faThLarge,
  faDraftingCompass,
  faTimesCircle,
  faRocket,
  faSort,
  faArrowsUpDown,
  faHashtag,
  faUser,
  faBrain,
  faSuitcase,
  faChevronUp,
  faChevronDown,
  faKeyboard,
  faPaste,
  faFileImport,
  faClipboardList,
  faSlidersH,
  faTrashAlt,
  faCheckDouble,
  faExchangeAlt,
  faCopy,
  faGraduationCap,
  faPlayCircle,
  faPlay,
  faClock,
  faUndo,
  faFileExport,
  faSnowflake,
  faCommentDots,
  faInbox,
  faPaperPlane,
  faComment,
  faHistory,
  faLightbulb,
  faMap,
  faUserPlus,
  faHandPointer,
  faCube,
  faDoorOpen,
  faGamepad,
  faFolderOpen,
  faCircle,
  faToggleOn,
  faToggleOff,
  faPauseCircle,
  faChevronLeft,
  faChevronRight,
  faCodeBranch,
  faAlignLeft,
  faCertificate,
  faLanguage,
  faBolt,
  faPause,
  faFolderTree
);
import "./styles/theme-config.js";
import {
  initGlobalFloatingButtonProtection,
  protectFloatingButtonPosition,
  safeModifyBodyStyles,
} from "./utils/floatingButtonProtection.js";
import { disableInteractions } from "./utils/disableInteractions";

// 导入翻译文件
import zhCN from "./i18n/locales/zh-CN.json";
import enUS from "./i18n/locales/en-US.json";
import zhTW from "./i18n/locales/zh-TW.json";

// 导入插件系统
import { initializePluginSystem, languagePluginLoader } from "./plugins";

// 初始化更新公告数据（简化版，数据由 useReleaseNotes composable 按需加载）
const initializeReleaseNotesData = () => {
  // 验证全局常量是否可用
  const hasData = typeof __RELEASE_NOTES_ZH_CN__ !== "undefined";
  if (!hasData) {
    console.warn("[main.js] 公告数据全局常量未定义");
  }
};

// 从本地存储读取保存的语言设置
function getSavedLocale() {
  const saved = storage.getItem("language");
  if (saved && ["zh-CN", "en-US", "zh-TW"].includes(saved)) {
    return saved;
  }

  // 如果没有保存的语言，使用系统语言
  const lang = navigator.language || "zh-CN";
  if (["zh-TW", "zh-HK", "zh-MO"].includes(lang)) return "zh-TW";
  if (lang.startsWith("zh")) return "zh-CN";
  if (lang.startsWith("en")) return "en-US";
  return "zh-CN";
}

// 检查插件系统灰度测试资格
function checkPluginBetaEligibility() {
  const existingStatus = storage.getItem("pluginSystemBetaUser");
  
  // 如果已经有记录，不再重新抽取
  if (existingStatus !== null) {
    console.log(`[main.js] 插件系统灰度测试状态: ${existingStatus ? '已选中' : '未选中'}`);
    return;
  }

  // 40% 概率被选为灰度测试用户
  const isBetaUser = Math.random() < 0.4;
  storage.setItem("pluginSystemBetaUser", isBetaUser);
  
  console.log(`[main.js] 插件系统灰度测试抽取结果: ${isBetaUser ? '已选中 🎉' : '未选中'}`);
}

// 异步初始化应用
async function initApp() {
  // 1. 先初始化存储服务
  await initStorage();
  console.log("[main.js] 存储服务初始化完成");

  // 2. 检查插件系统灰度测试
  checkPluginBetaEligibility();

  // 3. 创建 Vue 应用
  const app = createApp(App);

  disableInteractions();

  // 3. 创建 i18n（现在可以正确读取存储的语言设置）
  const i18n = createI18n({
    legacy: false,
    locale: getSavedLocale(),
    fallbackLocale: "en-US",
    messages: {
      "zh-CN": zhCN,
      "en-US": enUS,
      "zh-TW": zhTW,
    },
  });

  app.use(router);
  app.use(i18n);
  app.component("font-awesome-icon", FontAwesomeIcon);

  // 设置 i18n 实例到语言插件加载器
  languagePluginLoader.setI18nInstance(i18n);

  // 初始化更新公告数据
  initializeReleaseNotesData();

  // 4. 初始化插件系统
  try {
    await initializePluginSystem();
    console.log("[main.js] 插件系统初始化完成");
  } catch (error) {
    console.error("[main.js] 插件系统初始化失败:", error);
  }

  // 将i18n实例暴露到全局window对象
  window.$i18n = i18n.global;

  // 打印一下看看
  const currentLocale = i18n.global.locale.value || i18n.global.locale;
  console.log("[i18n] current", currentLocale);

  // 根据语言设置窗口标题
  const updateWindowTitle = async () => {
    try {
      const appWindow = new Window("main");
      const title = i18n.global.t("app.name");
      await appWindow.setTitle(title);
      console.log("[main.js] 窗口标题已设置为:", title);
    } catch (error) {
      console.warn("[main.js] 设置窗口标题失败:", error);
    }
  };

  // 启动时设置窗口标题
  updateWindowTitle();

  // 监听语言变化事件，更新窗口标题
  window.addEventListener("language-changed", () => {
    updateWindowTitle();
  });

  // 5. 挂载应用
  app.mount("#app");

  // 初始化全局浮动按钮保护
  initGlobalFloatingButtonProtection();

  return app;
}

// 启动应用
initApp().catch((error) => {
  console.error("[main.js] 应用启动失败:", error);
});

// 全局图层合成问题修复
const fixCompositingLayerIssues = () => {
  // 监听可能导致图层卡住的事件
  const eventsThatMayCauseLayerIssues = [
    "resize",
    "scroll",
    "visibilitychange",
    "focus",
  ];

  eventsThatMayCauseLayerIssues.forEach((event) => {
    window.addEventListener(
      event,
      () => {
        requestAnimationFrame(() => {
          // 强制重绘整个文档
          document.documentElement.style.transform = "translateZ(0)";
          setTimeout(() => {
            document.documentElement.style.transform = "";
          }, 0);
        });
      },
      { passive: true }
    );
  });

  // 监听WebView的GPU进程恢复
  if (window.chrome && window.chrome.gpu) {
    window.chrome.gpu.onGpuProcessCrashed?.addListener?.(() => {
      console.warn("GPU进程崩溃，执行恢复操作");
      location.reload();
    });
  }
};

// 应用挂载后修复图层问题
fixCompositingLayerIssues();

// 性能优化：使用更智能的强制重绘策略，减少不必要的重排
let lastRepaintTime = 0;
let isRepainting = false;
const REPAINT_INTERVAL = 5000; // 增加间隔时间到5秒
const MIN_REPAINT_INTERVAL = 1000; // 最小间隔1秒

// 智能重绘函数，只在必要时执行
const smartRepaint = () => {
  const now = Date.now();

  // 避免频繁重绘
  if (isRepainting || now - lastRepaintTime < MIN_REPAINT_INTERVAL) {
    return;
  }

  isRepainting = true;
  lastRepaintTime = now;

  window.requestAnimationFrame(() => {
    // 检查页面是否可见，避免在后台执行重绘
    if (document.hidden) {
      isRepainting = false;
      return;
    }

    // 使用更轻量的方式触发重绘
    const body = document.body;
    if (body) {
      // 使用更高效的方式触发重绘，避免直接修改transform
      body.style.willChange = "transform";
      body.style.transform = "translateZ(0)";

      setTimeout(() => {
        body.style.willChange = "auto";
        body.style.transform = "";
        isRepainting = false;
      }, 16); // 约一帧的时间
    }

    // 使用全局保护工具确保浮动按钮位置正确
    protectFloatingButtonPosition();
  });
};

// 使用更长的间隔和更智能的触发条件
const repaintInterval = setInterval(smartRepaint, REPAINT_INTERVAL);

// 页面不可见时停止重绘，可见时恢复
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInterval(repaintInterval);
  } else {
    // 页面变为可见时立即执行一次重绘
    smartRepaint();
    // 重新设置定时器
    setInterval(smartRepaint, REPAINT_INTERVAL);
  }
});
