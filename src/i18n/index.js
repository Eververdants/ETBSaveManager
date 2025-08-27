import { createI18n } from 'vue-i18n'

// 本地写死的语言包
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import enUS from './locales/en-US.json'

const messages = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
}

function getUserLocale() {
  const saved = localStorage.getItem('locale')
  if (saved && messages[saved]) return saved
  const lang = navigator.language || 'zh-CN'
  if (['zh-TW', 'zh-HK', 'zh-MO'].includes(lang)) return 'zh-TW'
  if (lang.startsWith('zh')) return 'zh-CN'
  if (lang.startsWith('en')) return 'en-US'
  return 'zh-CN'
}

export const i18n = createI18n({
  legacy: true,
  globalInjection: true,
  locale: getUserLocale(),
  fallbackLocale: 'en-US',
  messages,
})

export default i18n
