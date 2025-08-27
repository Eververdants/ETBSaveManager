// src/i18n/loader.js
import { createI18n } from 'vue-i18n'

// 静态导入 JSON 文件（保证被打包）
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import enUS from './locales/en-US.json'

// 统一封装
const loadLocaleMessages = () => {
  const messages = {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en-US': enUS,
  }
  console.log('✅ 语言文件已加载:', Object.keys(messages))
  return messages
}

// 获取用户语言偏好
const getUserLocale = () => {
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && ['zh-CN', 'zh-TW', 'en-US'].includes(savedLocale)) {
    return savedLocale
  }

  const browserLanguage = navigator.language || navigator.userLanguage
  if (['zh-TW', 'zh-HK', 'zh-MO'].includes(browserLanguage)) {
    return 'zh-TW'
  } else if (browserLanguage.startsWith('zh')) {
    return 'zh-CN'
  } else if (browserLanguage.startsWith('en')) {
    return 'en-US'
  }
  return 'zh-CN'
}

// 单例 i18n 实例
let i18nInstance = null

export const createI18nInstance = () => {
  if (i18nInstance) return i18nInstance

  console.log('🌍 正在加载国际化配置...')
  const messages = loadLocaleMessages()
  const locale = getUserLocale()

  i18nInstance = createI18n({
    legacy: true,
    locale,
    fallbackLocale: 'en-US',
    messages,
    globalInjection: true,
    silentTranslationWarn: true,
    missingWarn: false,
    fallbackWarn: false,
    datetimeFormats: {
      'zh-CN': {
        short: { year: 'numeric', month: '2-digit', day: '2-digit' },
        long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
      },
      'zh-TW': {
        short: { year: 'numeric', month: '2-digit', day: '2-digit' },
        long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
      },
      'en-US': {
        short: { year: 'numeric', month: 'short', day: 'numeric' },
        long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
      },
    },
    numberFormats: {
      'zh-CN': { currency: { style: 'currency', currency: 'CNY' } },
      'zh-TW': { currency: { style: 'currency', currency: 'TWD' } },
      'en-US': { currency: { style: 'currency', currency: 'USD' } },
    },
  })

  console.log(`✅ 国际化加载完成，当前语言: ${locale}`)
  return i18nInstance
}

// 获取当前 i18n 实例
export const getI18n = () => i18nInstance

// 切换语言
export const switchLanguage = (lang) => {
  if (!i18nInstance) return
  if (['zh-CN', 'zh-TW', 'en-US'].includes(lang)) {
    i18nInstance.global.locale.value = lang
    localStorage.setItem('locale', lang)
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }))
  }
}

export const getCurrentLanguage = () => {
  return i18nInstance ? i18nInstance.global.locale.value : 'zh-CN'
}

// 预加载器
export const preloadI18n = () => {
  return createI18nInstance()
}
