import { createApp } from "vue"
import { createI18n } from "vue-i18n"
import App from "./App.vue"
import router from "./router"
import "./styles/animations.css"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
import { library } from "@fortawesome/fontawesome-svg-core"
import { fas } from "@fortawesome/free-solid-svg-icons"
import { fab } from "@fortawesome/free-brands-svg-icons"
import "./styles/theme-config.js"
import { initGlobalFloatingButtonProtection, protectFloatingButtonPosition, safeModifyBodyStyles } from "./utils/floatingButtonProtection.js"
// import { disableInteractions } from "./utils/disableInteractions"

// 导入翻译文件
import zhCN from './i18n/locales/zh-CN.json'
import enUS from './i18n/locales/en-US.json'
import zhTW from './i18n/locales/zh-TW.json'

library.add(fas, fab)

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

// 将i18n实例暴露到全局window对象
window.$i18n = i18n.global

// 打印一下看看
const currentLocale = i18n.global.locale.value || i18n.global.locale
console.log("[i18n] current", currentLocale)

// 禁用所有快捷键、文字选中和图片拖拽
// disableInteractions()

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

// 定期强制重绘以防止GPU合成层问题
setInterval(() => {
  window.requestAnimationFrame(() => {
    // 使用全局保护工具安全修改body样式
    safeModifyBodyStyles(() => {
      document.body.style.transform = 'translateZ(0)'; // 强制触发GPU合成层刷新
      setTimeout(() => {
        document.body.style.transform = '';
      }, 0);
    });
    
    // 使用全局保护工具确保浮动按钮位置正确
    protectFloatingButtonPosition();
  });
}, 3000); // 每3秒执行一次
