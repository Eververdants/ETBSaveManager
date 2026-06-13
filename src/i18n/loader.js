/**
 * i18n loader - optimized
 * Supports on-demand language pack loading
 */
import { createI18n } from "vue-i18n";
import storage from "../services/storageService";

// Singleton instance
let i18nInstance = null;

// Language pack cache
const messagesCache = {};
const releaseNotesCache = {};

/**
 * Get user language preference
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
 * Load language pack
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
 * Load release notes data (now a single object instead of an array)
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
 * Create i18n instance
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

  // Lazily load other languages
  requestIdleCallback(
    async () => {
      const otherLocales = ["zh-CN", "zh-TW", "en-US"].filter((l) => l !== locale);
      for (const loc of otherLocales) {
        const msg = await loadLocaleMessages(loc);
        i18nInstance.global.setLocaleMessage(loc, msg);
      }
    },
    { timeout: 5000 },
  );

  return i18nInstance;
};

/**
 * Get current i18n instance
 */
export const getI18n = () => i18nInstance;

/**
 * Switch language
 */
export const switchLanguage = async (newLocale) => {
  if (!i18nInstance || !["zh-CN", "zh-TW", "en-US"].includes(newLocale)) {
    return;
  }

  // Ensure language pack is loaded
  if (!i18nInstance.global.messages.value[newLocale]) {
    const messages = await loadLocaleMessages(newLocale);
    i18nInstance.global.setLocaleMessage(newLocale, messages);
  }

  i18nInstance.global.locale.value = newLocale;
  storage.setItem("locale", newLocale);
  storage.setItem("language", newLocale);

  // Dispatch language change event
  window.dispatchEvent(new CustomEvent("language-changed", { detail: { locale: newLocale } }));
};

/**
 * Get current language
 */
export const getCurrentLanguage = () => {
  return i18nInstance?.global.locale.value || getUserLocale();
};

/**
 * Get release notes data
 */
export const getReleaseNotesData = async (locale) => {
  const targetLocale = locale || getCurrentLanguage();
  return loadReleaseNotes(targetLocale);
};

/**
 * Preload i18n
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
