import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import i18next from "i18next"; // 显式引入 i18next
import "./assets/css/variables.css";

// 单独初始化 i18next 实例并使用插件
i18next
  .use(Backend)
  .use(LanguageDetector)
  .init({
    fallbackLng: "en",
    debug: false,
    backend: {
      loadPath: "/locales/{{lng}}/{{lng}}.json",
    },
    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator"],
      lookupQuerystring: "lang",
      lookupCookie: "i18next",
      lookupLocalStorage: "i18nextLng",
    },
  });

// 创建 vue-i18n 实例时传入已初始化的 i18next 实例
const i18n = createI18n({
  legacy: false,
  locale: i18next.language, // 使用 i18next 检测的语言
  fallbackLocale: "en",
  messages: {}, // 留空，由 i18next 异步加载
  i18n: i18next, // 显式将 i18next 实例传递给 vue-i18n
});

const app = createApp(App);

app.use(i18n);
app.mount("#app");
