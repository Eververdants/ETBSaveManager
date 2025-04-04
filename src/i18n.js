import i18next from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { ref } from 'vue';

// 创建一个响应式变量来跟踪 i18next 加载状态
export const i18nLoaded = ref(false);

// 初始化 i18next
i18next
  .use(Backend) // 动态加载翻译文件
  .use(LanguageDetector) // 自动检测用户语言
  .init({
    fallbackLng: 'en', // 默认语言
    debug: true, // 开启调试模式
    interpolation: {
      escapeValue: false, // Vue 已经处理了 XSS 问题
    },
    backend: {
      loadPath: './locales/{{lng}}.json', // 翻译文件路径
    },
  })
  .then(() => {
    console.log('i18next 初始化完成');
    i18nLoaded.value = true;
  });

// 等待 i18next 初始化完成的方法
export const waitForI18n = () => {
  return new Promise((resolve) => {
    if (i18nLoaded.value || i18next.isInitialized) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (i18next.isInitialized) {
          clearInterval(checkInterval);
          i18nLoaded.value = true;
          resolve();
        }
      }, 50);
    }
  });
};

// 创建 Vue 插件
const i18nPlugin = {
  install: (app) => {
    // 添加全局属性
    app.config.globalProperties.$t = (key, options) => i18next.t(key, options);
    app.config.globalProperties.$i18n = i18next;
    
    // 添加全局指令
    app.directive('t', {
      mounted(el, binding) {
        el.textContent = i18next.t(binding.value);
      },
      updated(el, binding) {
        el.textContent = i18next.t(binding.value);
      }
    });
  }
};

export const changeLanguage = (lang) => {
  return i18next.changeLanguage(lang); // 切换语言
};

export default i18nPlugin;