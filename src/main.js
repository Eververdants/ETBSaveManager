// main.js
import { createApp } from "vue";
import App from "./App.vue";
import i18nPlugin, { waitForI18n } from "./i18n"; // 引入国际化配置和等待函数

// 创建 Vue 应用
const app = createApp(App);

// 等待 i18next 初始化完成后再挂载应用
waitForI18n().then(() => {
  // 使用 i18n 插件
  app.use(i18nPlugin);
  
  // 挂载应用
  app.mount("#app");
  
  console.log("应用已挂载，i18next 初始化完成");
});

// 禁用右键菜单
document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});
document.oncontextmenu = function () {
  return false;
};

// 禁用文本选择
document.onselectstart = function () {
  return false;
};

// 禁用拖拽
document.addEventListener('dragstart', function (event) {
  event.preventDefault();
});