// src/i18n/loader.js
import { createI18n } from 'vue-i18n'

// 静态导入 JSON 文件（保证被打包）
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import enUS from './locales/en-US.json'

// 更新公告数据（确保被打包）
import releaseNotesZhCN from './locales/release-notes.zh-CN.json'
import releaseNotesEnUS from './locales/release-notes.en-US.json'
import releaseNotesZhTW from './locales/release-notes.zh-TW.json'

// 统一封装
const loadLocaleMessages = () => {
  console.log('🔄 [i18n/loader.js] 开始加载语言文件...')
  const messages = {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en-US': enUS,
  }
  console.log('✅ [i18n/loader.js] 语言文件已加载:', Object.keys(messages))
  console.log('🔍 [i18n/loader.js] 语言包详情:', {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en-US': enUS
  })
  return messages
}

// 加载更新公告数据
const loadReleaseNotesData = () => {
  console.log('🔄 [i18n/loader.js] 开始加载更新公告数据...')
  const releaseNotes = {
    'zh-CN': releaseNotesZhCN,
    'zh-TW': releaseNotesZhTW,
    'en-US': releaseNotesEnUS,
  }
  console.log('✅ [i18n/loader.js] 更新公告数据已加载:', Object.keys(releaseNotes))
  console.log('📊 [i18n/loader.js] 简体中文公告数量:', releaseNotesZhCN.length)
  console.log('📊 [i18n/loader.js] 繁体中文公告数量:', releaseNotesZhTW.length)
  console.log('📊 [i18n/loader.js] 英文公告数量:', releaseNotesEnUS.length)
  console.log('🔍 [i18n/loader.js] 最新版本信息:', {
    'zh-CN': releaseNotesZhCN[0]?.version,
    'zh-TW': releaseNotesZhTW[0]?.version,
    'en-US': releaseNotesEnUS[0]?.version
  })
  return releaseNotes
}

// 获取用户语言偏好
const getUserLocale = () => {
  const savedLocale = localStorage.getItem('locale')
  console.log('🌐 [i18n/loader.js] 检测语言偏好...', {
    '保存的语言': savedLocale,
    '浏览器语言': navigator.language,
    '用户语言': navigator.userLanguage
  })
  
  if (savedLocale && ['zh-CN', 'zh-TW', 'en-US'].includes(savedLocale)) {
    console.log('✅ [i18n/loader.js] 使用保存的语言:', savedLocale)
    return savedLocale
  }

  const browserLanguage = navigator.language || navigator.userLanguage
  console.log('🌐 [i18n/loader.js] 浏览器检测到语言:', browserLanguage)
  
  if (['zh-TW', 'zh-HK', 'zh-MO'].includes(browserLanguage)) {
    console.log('✅ [i18n/loader.js] 选择繁体中文 (zh-TW)')
    return 'zh-TW'
  } else if (browserLanguage.startsWith('zh')) {
    console.log('✅ [i18n/loader.js] 选择简体中文 (zh-CN)')
    return 'zh-CN'
  } else if (browserLanguage.startsWith('en')) {
    console.log('✅ [i18n/loader.js] 选择英文 (en-US)')
    return 'en-US'
  }
  console.log('✅ [i18n/loader.js] 默认选择简体中文 (zh-CN)')
  return 'zh-CN'
}

// 单例 i18n 实例
let i18nInstance = null

export const createI18nInstance = () => {
  if (i18nInstance) return i18nInstance

  console.log('🌍 正在加载国际化配置...')
  const messages = loadLocaleMessages()
  const releaseNotes = loadReleaseNotesData()
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
  console.log(`✅ 更新公告数据已准备:`, Object.keys(releaseNotes))
  
  // 将 releaseNotes 数据挂载到 i18n 实例上
  i18nInstance.releaseNotes = releaseNotes
  
  return i18nInstance
}

// 获取当前 i18n 实例
export const getI18n = () => i18nInstance

// 切换语言
export const switchLanguage = (newLocale) => {
  console.log('🔄 [i18n/loader.js] 开始切换语言...', newLocale)
  console.log('📍 [i18n/loader.js] 当前语言:', i18n.global.locale.value)
  
  if (!['zh-CN', 'zh-TW', 'en-US'].includes(newLocale)) {
    console.warn('⚠️ [i18n/loader.js] 不支持的语言:', newLocale)
    console.warn('📋 [i18n/loader.js] 支持的语言:', ['zh-CN', 'zh-TW', 'en-US'])
    return
  }
  
  const oldLocale = i18n.global.locale.value
  i18n.global.locale.value = newLocale
  localStorage.setItem('locale', newLocale)
  
  console.log('✅ [i18n/loader.js] 语言切换成功:', {
    'from': oldLocale,
    'to': newLocale,
    'saved': newLocale,
    'current': i18n.global.locale.value
  })
  
  // 检查切换后的数据可用性
  const currentReleaseNotes = i18n.global.releaseNotes?.[newLocale]
  console.log('📋 [i18n/loader.js] 切换后可用公告数量:', currentReleaseNotes?.length || 0)
}

export const getCurrentLanguage = () => {
  return i18nInstance ? i18nInstance.global.locale.value : 'zh-CN'
}

// 预加载器
export const preloadI18n = () => {
  return createI18nInstance()
}

// 获取更新公告数据
export const getReleaseNotesData = (locale) => {
  if (!i18nInstance) {
    createI18nInstance()
  }
  
  if (i18nInstance && i18nInstance.releaseNotes) {
    return i18nInstance.releaseNotes[locale] || i18nInstance.releaseNotes['zh-CN'] || []
  }
  
  console.warn('⚠️ 更新公告数据未准备好，返回空数组')
  return []
}
