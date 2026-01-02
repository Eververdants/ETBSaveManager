import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import router from "./router";
import "./styles/animations.css";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
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
  faDoorOpen
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

// 初始化更新公告数据（简化版，数据由 useReleaseNotes composable 按需加载）
const initializeReleaseNotesData = () => {
  // 验证全局常量是否可用
  const hasData = typeof __RELEASE_NOTES_ZH_CN__ !== "undefined";
  if (!hasData) {
    console.warn("[main.js] 公告数据全局常量未定义");
  }
};

const app = createApp(App);

// 从localStorage读取保存的语言设置
function getSavedLocale() {
  const saved = localStorage.getItem("language");
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

const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: getSavedLocale(), // 从保存的设置或系统语言获取
  fallbackLocale: "en-US", // 回退语言
  messages: {
    "zh-CN": zhCN,
    "en-US": enUS,
    "zh-TW": zhTW,
  },
});

app.use(router);
app.use(i18n);
app.component("font-awesome-icon", FontAwesomeIcon);

// 初始化更新公告数据
initializeReleaseNotesData();

// 将i18n实例暴露到全局window对象
window.$i18n = i18n.global;

// 打印一下看看
const currentLocale = i18n.global.locale.value || i18n.global.locale;
console.log("[i18n] current", currentLocale);

// 禁用所有快捷键、文字选中和图片拖拽
disableInteractions()

app.mount("#app");

// 初始化全局浮动按钮保护
initGlobalFloatingButtonProtection();

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
