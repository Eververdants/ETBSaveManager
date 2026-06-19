import "@/i18n"; // 触发 i18next 初始化（同步注册资源、LanguageDetector、react-i18next 绑定）
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";
import i18next from "i18next";

import { i18nReady, LANGUAGE_META, STORAGE_KEY } from "@/i18n";

/**
 * i18n 初始化是异步的（load resources + detector），如果不等就 render
 * 组件，t() 会返回键名而不是翻译。所有测试用例 render 前 i18n 必须 ready。
 */
beforeAll(async () => {
  // 等到 resources 全部加载完成；重复 await 不会重复 init
  await i18nReady;
  // 显式把语言切到 en-US（受 supportedLngs 约束），保证本地化资源激活
  await i18next.changeLanguage("en-US");
});

beforeEach(() => {
  // 测试套件默认英文环境，避免 navigator 推断为其他语言
  localStorage.setItem(STORAGE_KEY, "en-US");
  document.documentElement.lang = LANGUAGE_META["en-US"].htmlLang;
});

afterEach(() => {
  cleanup();
  // 清理 useThemeMode 在 localStorage 与 <html> 上留下的副作用
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.lang = "en";
});
