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
import { disableInteractions } from "./utils/disableInteractions"

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
disableInteractions()

app.mount("#app")
