import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN'
import en from './locales/en'

// 获取浏览器语言或本地存储的语言
function getDefaultLocale(): string {
  const stored = localStorage.getItem('locale')
  if (stored && ['zh-CN', 'en'].includes(stored)) {
    return stored
  }
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages: {
    'zh-CN': zhCN,
    'en': en
  }
})

export default i18n
