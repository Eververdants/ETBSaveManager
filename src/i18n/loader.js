/**
 * i18n 加载器 - 优化版
 * 支持按需加载语言包
 */
import { createI18n } from "vue-i18n";
import storage from "../services/storageService";

// 单例实例
let i18nInstance = null;

// 语言包缓存
const messagesCache = {};
const releaseNotesCache = {};

/**
 * 获取用户语言偏好
 */
const getUserLocale = () => {
  const saved = storage.getItem("locale") || storage.getItem("language");
  if (saved && ["zh-CN", "zh-TW", "en-US"].includes(saved)) {
    return saved;
  }

  const lang = navigator.language || "zh-CN";
  if (["zh-TW", "zh-HK", "zh-MO"].includes(lang)) return "zh-TW";
  if (lang.startsWith("zh")) return "zh-CN";
  if (lang.startsWith("en")) return "en-US";
  return "zh-CN";
};

/**
 * 加载语言包
 */
const loadLocaleMessages = async (locale) => {
  if (messagesCache[locale]) {
    return messagesCache[locale];
  }

  let messages;
  switch (locale) {
    case "zh-CN":
      messages = (await import("./locales/zh-CN/index.js")).default;
      break;
    case "zh-TW":
      messages = (await import("./locales/zh-TW/index.js")).default;
      break;
    case "en-US":
      messages = (await import("./locales/en-US/index.js")).default;
      break;
    default:
      messages = (await import("./locales/zh-CN/index.js")).default;
  }

  messagesCache[locale] = messages;
  return messages;
};

/**
 * 加载更新公告数据（现在是单个对象而不是数组）
 */
const loadReleaseNotes = async (locale) => {
  if (releaseNotesCache[locale]) {
    return releaseNotesCache[locale];
  }

  let notes;
  try {
    switch (locale) {
      case "zh-CN":
        notes = (await import("./locales/release-notes.zh-CN.json")).default;
        break;
      case "zh-TW":
        notes = (await import("./locales/release-notes.zh-TW.json")).default;
        break;
      case "en-US":
        notes = (await import("./locales/release-notes.en-US.json")).default;
        break;
      default:
        notes = (await import("./locales/release-notes.zh-CN.json")).default;
    }
    releaseNotesCache[locale] = notes;
  } catch {
    notes = null;
  }

  return notes;
};

/**
 * 创建 i18n 实例
 */
export const createI18nInstance = async () => {
  if (i18nInstance) return i18nInstance;

  const locale = getUserLocale();
  const messages = await loadLocaleMessages(locale);

  i18nInstance = createI18n({
    legacy: false,
    locale,
    fallbackLocale: "en-US",
    messages: { [locale]: messages },
    silentTranslationWarn: true,
    missingWarn: false,
    fallbackWarn: false,
  });

  // 延迟加载其他语言
  requestIdleCallback(async () => {
    const otherLocales = ["zh-CN", "zh-TW", "en-US"].filter(l => l !== locale);
    for (const loc of otherLocales) {
      const msg = await loadLocaleMessages(loc);
      i18nInstance.global.setLocaleMessage(loc, msg);
    }
  }, { timeout: 5000 });

  return i18nInstance;
};

/**
 * 获取当前 i18n 实例
 */
export const getI18n = () => i18nInstance;

/**
 * 切换语言
 */
export const switchLanguage = async (newLocale) => {
  if (!i18nInstance || !["zh-CN", "zh-TW", "en-US"].includes(newLocale)) {
    return;
  }

  // 确保语言包已加载
  if (!i18nInstance.global.messages.value[newLocale]) {
    const messages = await loadLocaleMessages(newLocale);
    i18nInstance.global.setLocaleMessage(newLocale, messages);
  }

  i18nInstance.global.locale.value = newLocale;
  storage.setItem("locale", newLocale);
  storage.setItem("language", newLocale);

  // 触发语言变化事件
  window.dispatchEvent(new CustomEvent("language-changed", { detail: { locale: newLocale } }));
};

/**
 * 获取当前语言
 */
export const getCurrentLanguage = () => {
  return i18nInstance?.global.locale.value || getUserLocale();
};

/**
 * 获取更新公告数据
 */
export const getReleaseNotesData = async (locale) => {
  const targetLocale = locale || getCurrentLanguage();
  return loadReleaseNotes(targetLocale);
};

/**
 * 预加载 i18n
 */
export const preloadI18n = () => createI18nInstance();

export default {
  createI18nInstance,
  getI18n,
  switchLanguage,
  getCurrentLanguage,
  getReleaseNotesData,
  preloadI18n,
};
