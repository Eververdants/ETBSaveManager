import { createI18n } from "vue-i18n";
import storage from "../services/storageService";

// Locally bundled language packs
import zhCN from "./locales/zh-CN/index.js";
import zhTW from "./locales/zh-TW/index.js";
import enUS from "./locales/en-US/index.js";

// Release notes data (ensured to be bundled) - now a single object instead of an array
import releaseNotesZhCN from "./locales/release-notes.zh-CN.json";
import releaseNotesEnUS from "./locales/release-notes.en-US.json";
import releaseNotesZhTW from "./locales/release-notes.zh-TW.json";

const messages = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  "en-US": enUS,
};

// Export release notes data for other modules to use
export const releaseNotesData = {
  "zh-CN": releaseNotesZhCN,
  "zh-TW": releaseNotesZhTW,
  "en-US": releaseNotesEnUS,
};

// Debug output: show loaded data information
console.log("🌍 [i18n/index.js] 语言文件已加载:", Object.keys(messages));
console.log("📋 [i18n/index.js] 更新公告数据已加载:", Object.keys(releaseNotesData));
console.log("📊 [i18n/index.js] 当前版本:", releaseNotesZhCN?.version || "未知");

function getUserLocale() {
  const saved = storage.getItem("locale");
  if (saved && messages[saved]) return saved;
  const lang = navigator.language || "zh-CN";
  if (["zh-TW", "zh-HK", "zh-MO"].includes(lang)) return "zh-TW";
  if (lang.startsWith("zh")) return "zh-CN";
  if (lang.startsWith("en")) return "en-US";
  return "zh-CN";
}

export const i18n = createI18n({
  legacy: true,
  globalInjection: true,
  locale: getUserLocale(),
  fallbackLocale: "en-US",
  silentFallbackWarn: false,
  missingWarn: true,
  messages,
  // Mount release notes data to global
  releaseNotes: releaseNotesData,
});

export default i18n;
