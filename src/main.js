import { createApp } from "vue"
import { createI18n } from "vue-i18n"
import App from "./App.vue"
import router from "./router"
import "./styles/animations.css"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { library } from "@fortawesome/fontawesome-svg-core"
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
  faChevronDown
} from "@fortawesome/free-solid-svg-icons"

// Brand icons
import {
  faBilibili,
  faGithub,
  faTiktok
} from "@fortawesome/free-brands-svg-icons"

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
  faChevronDown
)
import "./styles/theme-config.js"
import { initGlobalFloatingButtonProtection, protectFloatingButtonPosition, safeModifyBodyStyles } from "./utils/floatingButtonProtection.js"
import { disableInteractions } from "./utils/disableInteractions"

// 导入翻译文件
import zhCN from './i18n/locales/zh-CN.json'
import enUS from './i18n/locales/en-US.json'
import zhTW from './i18n/locales/zh-TW.json'

// 初始化更新公告数据，使用Vite配置的内联数据
const initializeReleaseNotesData = (i18nInstance) => {
  // 使用Vite配置的内联数据
  let releaseNotesZhCN, releaseNotesEnUS, releaseNotesZhTW;
  
  try {
    // 直接使用全局常量对象，避免JSON.parse错误
    releaseNotesZhCN = Array.isArray(__RELEASE_NOTES_ZH_CN__) ? __RELEASE_NOTES_ZH_CN__ : [];
    releaseNotesEnUS = Array.isArray(__RELEASE_NOTES_EN_US__) ? __RELEASE_NOTES_EN_US__ : [];
    releaseNotesZhTW = Array.isArray(__RELEASE_NOTES_ZH_TW__) ? __RELEASE_NOTES_ZH_TW__ : [];
    
    console.log('[main.js] 从全局常量获取更新公告数据:', {
      'zh-CN长度': releaseNotesZhCN.length,
      'en-US长度': releaseNotesEnUS.length,
      'zh-TW长度': releaseNotesZhTW.length,
      '示例数据': releaseNotesZhCN[0] || '无数据'
    });
  } catch (error) {
    console.error('[main.js] 处理更新公告数据失败:', error);
    releaseNotesZhCN = [];
    releaseNotesEnUS = [];
    releaseNotesZhTW = [];
  }
  
  console.log('[main.js] 正在初始化更新公告数据...');
  console.log('[main.js] 中文版本数量:', releaseNotesZhCN.length);
  console.log('[main.js] 英文版本数量:', releaseNotesEnUS.length);
  console.log('[main.js] 繁体版本数量:', releaseNotesZhTW.length);
  
  // 验证数据结构
  if (releaseNotesZhCN.length > 0) {
    console.log('[main.js] 最新中文版本:', releaseNotesZhCN[0].version);
    console.log('[main.js] 最新版本标题:', releaseNotesZhCN[0].title);
  }
  
  // 将数据直接挂载到i18n实例，确保数据被保留
  if (i18nInstance && !i18nInstance.global.releaseNotes) {
    i18nInstance.global.releaseNotes = {};
  }
  if (i18nInstance) {
    i18nInstance.global.releaseNotes['zh-CN'] = releaseNotesZhCN;
    i18nInstance.global.releaseNotes['en-US'] = releaseNotesEnUS;
    i18nInstance.global.releaseNotes['zh-TW'] = releaseNotesZhTW;
  }
  
  // 强制保留数据的引用，防止Tree Shaking
  window.__RELEASE_NOTES_ZH_CN__ = releaseNotesZhCN;
  window.__RELEASE_NOTES_EN_US__ = releaseNotesEnUS;
  window.__RELEASE_NOTES_ZH_TW__ = releaseNotesZhTW;
  
  // 访问数据以确保不被优化
  console.log('[main.js] 数据验证:', {
    zh: releaseNotesZhCN[0]?.version,
    en: releaseNotesEnUS[0]?.version,
    tw: releaseNotesZhTW[0]?.version
  });
};

const app = createApp(App)

// 从localStorage读取保存的语言设置
function getSavedLocale() {
    const saved = localStorage.getItem('language')
    if (saved && ['zh-CN', 'en-US', 'zh-TW'].includes(saved)) {
        return saved
    }
    
    // 如果没有保存的语言，使用系统语言
    const lang = navigator.language || 'zh-CN'
    if (['zh-TW', 'zh-HK', 'zh-MO'].includes(lang)) return 'zh-TW'
    if (lang.startsWith('zh')) return 'zh-CN'
    if (lang.startsWith('en')) return 'en-US'
    return 'zh-CN'
}

const i18n = createI18n({
    legacy: false,  // 使用 Composition API
    locale: getSavedLocale(),  // 从保存的设置或系统语言获取
    fallbackLocale: 'en-US',  // 回退语言
    messages: {
        'zh-CN': zhCN,
        'en-US': enUS,
        'zh-TW': zhTW
    }
})

app.use(router)
app.use(i18n)
app.component("font-awesome-icon", FontAwesomeIcon)

// 初始化更新公告数据，确保数据被正确打包
initializeReleaseNotesData(i18n)

// 将i18n实例暴露到全局window对象
window.$i18n = i18n.global

// 打印一下看看
const currentLocale = i18n.global.locale.value || i18n.global.locale
console.log("[i18n] current", currentLocale)

// 输出更新公告数据到控制台以便调试
console.log('[main.js] i18n 全局属性:', Object.keys(i18n.global))
console.log('[main.js] 更新公告数据:', {
  'zh-CN长度': i18n.global.releaseNotes?.['zh-CN']?.length || 0,
  'en-US长度': i18n.global.releaseNotes?.['en-US']?.length || 0,
  'zh-TW长度': i18n.global.releaseNotes?.['zh-TW']?.length || 0,
  '示例数据': {
    'zh-CN': i18n.global.releaseNotes?.['zh-CN']?.[0] || null,
    'en-US': i18n.global.releaseNotes?.['en-US']?.[0] || null
  }
})

// 禁用所有快捷键、文字选中和图片拖拽
disableInteractions()

app.mount("#app")

// 初始化全局浮动按钮保护
initGlobalFloatingButtonProtection()

// 全局图层合成问题修复
const fixCompositingLayerIssues = () => {
  // 监听可能导致图层卡住的事件
  const eventsThatMayCauseLayerIssues = ['resize', 'scroll', 'visibilitychange', 'focus'];
  
  eventsThatMayCauseLayerIssues.forEach(event => {
    window.addEventListener(event, () => {
      requestAnimationFrame(() => {
        // 强制重绘整个文档
        document.documentElement.style.transform = 'translateZ(0)';
        setTimeout(() => {
          document.documentElement.style.transform = '';
        }, 0);
      });
    }, { passive: true });
  });
  
  // 监听WebView的GPU进程恢复
  if (window.chrome && window.chrome.gpu) {
    window.chrome.gpu.onGpuProcessCrashed?.addListener?.(() => {
      console.warn('GPU进程崩溃，执行恢复操作');
      location.reload();
    });
  }
};

// 应用挂载后修复图层问题
fixCompositingLayerIssues()

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
      body.style.willChange = 'transform';
      body.style.transform = 'translateZ(0)';
      
      setTimeout(() => {
        body.style.willChange = 'auto';
        body.style.transform = '';
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
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(repaintInterval);
  } else {
    // 页面变为可见时立即执行一次重绘
    smartRepaint();
    // 重新设置定时器
    setInterval(smartRepaint, REPAINT_INTERVAL);
  }
});
