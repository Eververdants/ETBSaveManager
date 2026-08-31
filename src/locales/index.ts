import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zhCN from "./zh-CN";
import zhTW from "./zh-TW";
import enUS from "./en-US";

export const resources = {
  "zh-CN": {
    translation: zhCN,
  },
  "zh-TW": {
    translation: zhTW,
  },
  "en-US": {
    translation: enUS,
  },
} as const;

export const supportedLanguages = [
  { code: "zh-CN", name: "简体中文", nativeName: "简体中文" },
  { code: "zh-TW", name: "繁體中文", nativeName: "繁體中文" },
  { code: "en-US", name: "English", nativeName: "English" },
] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zh-CN",
    supportedLngs: ["zh-CN", "zh-TW", "en-US"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
