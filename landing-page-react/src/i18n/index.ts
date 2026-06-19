/**
 * i18next 配置：3 语言 + localStorage 持久化 + 自动语言探测。
 * 默认语言在 localStorage 与 navigator 都没有匹配时回退到 en-US。
 *
 * 用法：在 main.tsx 顶部 import "@/i18n" 一次即可,无需 Provider 包裹。
 * 组件中通过 `useTranslation()` 消费文案。
 */
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enUS from "@/i18n/locales/en-US";
import zhCN from "@/i18n/locales/zh-CN";
import zhTW from "@/i18n/locales/zh-TW";

export const SUPPORTED_LANGUAGES = ["en-US", "zh-CN", "zh-TW"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en-US";
export const STORAGE_KEY = "etb-locale";

export const LANGUAGE_META: Record<
  SupportedLanguage,
  { label: string; shortLabel: string; htmlLang: string; dir: "ltr" | "rtl" }
> = {
  "en-US": { label: "English", shortLabel: "EN", htmlLang: "en", dir: "ltr" },
  "zh-CN": { label: "简体中文", shortLabel: "中", htmlLang: "zh-Hans", dir: "ltr" },
  "zh-TW": { label: "繁體中文", shortLabel: "繁", htmlLang: "zh-Hant", dir: "ltr" },
};

/**
 * i18next 启动 Promise。setup.ts / main.tsx 需要 await 它，
 * 否则组件在 i18n 完成 init 前 render，`t()` 会返回键名。
 */
// i18next.init() 在重载签名下会返回 Promise<t>。生产端用 const _initReady = i18nReady
// 来抑制 no-unused-vars,这里改成 void Promise 让类型不取推断值。
export const i18nReady: Promise<unknown> = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "en-US": { translation: enUS },
      "zh-CN": { translation: zhCN },
      "zh-TW": { translation: zhTW },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    // 不加 load: "currentOnly" —— happy-dom 下与 LanguageDetector 配合会
    // 让 t() 走 fallback 链,反而拿不到具体资源。生产端 LanguageDetector
    // 仍能在 changeLanguage 时按需预加载。
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes
      // i18next v23+ 默认 prefix 是 {{ }},此处还原为单大括号,兼容现有文案
      prefix: "{",
      suffix: "}",
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
      convertDetectedLanguage: (lng: string): string => {
        if (lng.toLowerCase().startsWith("zh")) {
          // navigator 报告 zh-CN / zh-Hans / zh-Hant / zh-TW 统一归类
          if (lng === "zh-TW" || lng === "zh-Hant" || lng === "zh-HK" || lng === "zh-MO") {
            return "zh-TW";
          }
          return "zh-CN";
        }
        if (lng === "en" || lng === "en-US") return "en-US";
        return DEFAULT_LANGUAGE;
      },
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
