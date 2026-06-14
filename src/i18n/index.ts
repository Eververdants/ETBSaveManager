import { createI18n } from "vue-i18n";
import type { I18n } from "vue-i18n";
import storage from "../services/storageService";

// Locally bundled language packs
import zhCN from "./locales/zh-CN/index";
import zhTW from "./locales/zh-TW/index";
import enUS from "./locales/en-US/index";

// Release notes data (ensured to be bundled) - now a single object instead of an array
import releaseNotesZhCN from "./locales/release-notes.zh-CN.json";
import releaseNotesEnUS from "./locales/release-notes.en-US.json";
import releaseNotesZhTW from "./locales/release-notes.zh-TW.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
const messages: Record<string, any> = {
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  "en-US": enUS,
};

interface ReleaseNotesData {
  version: string;
  [key: string]: unknown;
}

// Export release notes data for other modules to use
export const releaseNotesData: Record<string, ReleaseNotesData> = {
  "zh-CN": releaseNotesZhCN as ReleaseNotesData,
  "zh-TW": releaseNotesZhTW as ReleaseNotesData,
  "en-US": releaseNotesEnUS as ReleaseNotesData,
};

// Debug output: show loaded data information
console.log("🌍 [i18n/index.js] 语言文件已加载:", Object.keys(messages));
console.log("📋 [i18n/index.js] 更新公告数据已加载:", Object.keys(releaseNotesData));
console.log("📊 [i18n/index.js] 当前版本:", releaseNotesZhCN?.version || "未知");

function getUserLocale(): string {
  const saved = storage.getItem<string>("locale");
  if (saved && messages[saved]) return saved;
  const lang = navigator.language || "zh-CN";
  if (["zh-TW", "zh-HK", "zh-MO"].includes(lang)) return "zh-TW";
  if (lang.startsWith("zh")) return "zh-CN";
  if (lang.startsWith("en")) return "en-US";
  return "zh-CN";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const i18n: I18n = createI18n({
  legacy: true,
  globalInjection: true,
  locale: getUserLocale(),
  fallbackLocale: "en-US",
  silentFallbackWarn: false,
  missingWarn: true,
  messages,
  // Mount release notes data to global
  releaseNotes: releaseNotesData,
} as any);

export default i18n;
