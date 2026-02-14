<script setup>
import { ref, onMounted, shallowRef, computed } from "vue";
import { useRouter } from "vue-router";
import storage from "./services/storageService";
import PerformanceMonitor from "./components/PerformanceMonitor.vue";
import { isSeasonalThemeAvailable } from "./config/seasonalThemeConfig";

// 延迟导入非关键组件
const Sidebar = shallowRef(null);
const TitleBar = shallowRef(null);

// 立即加载关键组件
import SidebarComponent from "./components/Sidebar.vue";
import TitleBarComponent from "./components/TitleBar.vue";

Sidebar.value = SidebarComponent;
TitleBar.value = TitleBarComponent;

const router = useRouter();
const sidebarExpanded = ref(false);
const normalizeBool = (value) => value === true || value === "true";
const performanceMonitorEnabled = ref(
  normalizeBool(storage.getItem("performanceMonitor", false))
);
const developerModeEnabled = ref(
  normalizeBool(storage.getItem("developerMode", false))
);
const shouldShowPerformanceMonitor = computed(
  () => performanceMonitorEnabled.value && developerModeEnabled.value
);

// 组件缓存配置
const cachedComponents = ["Home", "Settings", "CreateArchive", "PluginMarket", "CoreArchive", "Log"];
const excludedComponents = ["BatchCreateArchive", "EditArchive", "SteamCache"];

const handleSidebarExpand = (expanded) => {
  sidebarExpanded.value = expanded;
};

onMounted(() => {
  window.addEventListener("performance-monitor-toggle", (event) => {
    performanceMonitorEnabled.value = !!event.detail?.enabled;
  });
  window.addEventListener("developer-mode-changed", (event) => {
    developerModeEnabled.value = !!event.detail?.enabled;
    if (!developerModeEnabled.value) {
      performanceMonitorEnabled.value = false;
    }
  });

  // 监听路由变更事件
  window.addEventListener("sidebar-route-change", (event) => {
    const routeName = event.detail.route;
    if (routeName && router.hasRoute(routeName)) {
      router.push({ name: routeName });
    }
  });

  // 路由切换时处理滚动
  router.afterEach((to, from) => {
    if (to.name !== from.name) {
      const mainContent = document.querySelector(".main-content");
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    }
  });

  // 延迟初始化非关键功能
  requestIdleCallback(() => {
    initThemeSystem();
    initFloatingButtonProtection();
  }, { timeout: 1000 });
});

// 主题系统初始化（延迟）
async function initThemeSystem() {
  // 等待存储初始化完成
  if (!storage.isInitialized()) {
    await storage.initStorage();
  }

  const isSeasonalTheme = (id) => ["new-year", "spring-festival-dark", "spring-festival-light"].includes(id);

  const seasonalMode = storage.getItem("seasonalThemeMode") || "auto";
  const isSeasonalAvailable = (id) =>
    isSeasonalThemeAvailable(id, { mode: seasonalMode });

  // 从存储读取主题，如果没有则使用初始主题
  let theme = storage.getItem("theme") || window.__initialTheme || "light";

  // 如果存储中的主题与初始主题不同，需要更新
  const initialTheme = window.__initialTheme;

  if (isSeasonalTheme(theme) && !isSeasonalAvailable(theme)) {
    theme = storage.getItem("themeBeforeNewYear") || "light";
    storage.setItem("theme", theme);
  }

  // 应用主题
  if (window.themeManager) {
    window.themeManager.setTheme(theme);
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }

  // 如果主题与初始不同，需要更新 body 背景
  if (theme !== initialTheme) {
    updateBodyBackground(theme);
  }
}

// 更新 body 背景色
function updateBodyBackground(theme) {
  const body = document.body;
  if (!body) return;

  const bgColors = {
    'dark': '#1c1c1e',
    'light': '#f8f9fa',
    'new-year': '#1a0a0a',
    'spring-festival-dark': '#1c0a14',
    'spring-festival-light': '#fefce8',
  };

  const bg = bgColors[theme] || bgColors['light'];
  body.style.backgroundColor = bg;

  // 延迟清除，让 CSS 变量接管
  setTimeout(() => {
    body.style.backgroundColor = '';
  }, 100);
}

// 浮动按钮保护（延迟）
async function initFloatingButtonProtection() {
  const { protectFloatingButtonPosition } = await import("./utils/floatingButtonProtection.js");

  // 定期检查（降低频率）
  setInterval(protectFloatingButtonPosition, 2000);
}
</script>

<template>
  <div class="app-container">
    <component :is="TitleBar" v-if="TitleBar" />
    <PerformanceMonitor v-if="shouldShowPerformanceMonitor" class="performance-monitor" />
    <div class="content-wrapper">
      <component :is="Sidebar" v-if="Sidebar" @sidebar-expand="handleSidebarExpand" />
      <main class="main-content" :class="{
        'sidebar-collapsed': !sidebarExpanded,
        'sidebar-expanded': sidebarExpanded,
      }">
        <router-view v-slot="{ Component, route }">
          <transition name="page-fade" mode="out-in">
            <keep-alive :include="cachedComponents" :exclude="excludedComponents">
              <component :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 模态窗口动画 - 优化性能 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
  transform: translateZ(0);
  /* 强制硬件加速 */
  backface-visibility: hidden;
  /* 防止图层闪烁 */
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.9) translateZ(0);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateZ(0);
}

.performance-monitor {
  position: fixed;
  top: 56px;
  right: 20px;
  width: 300px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 255, 0, 0.4);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(6px);
  pointer-events: auto;
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
}

.performance-monitor:hover {
  opacity: 0.3;
  backdrop-filter: none;
}

.performance-monitor * {
  pointer-events: none !important;
}
</style>
<style>
/* 页面切换过渡动画 - 统一的淡入淡出效果 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease !important;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0 !important;
}

/* 全局基础样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 全局圆角应用 */
body {
  font-family: -apple-system, BlinkMacSystemFont, "San Francisco",
    "Helvetica Neue", sans-serif;
  background: var(--app-bg, var(--bg));
  color: var(--text);
  transition: background 0.3s ease, color 0.3s ease;
  overflow: hidden;
  cursor: default;
  /* 移除transform以防止影响固定定位元素 */
  /* transform: translateZ(0); */
  /* will-change: transform; */
}

#app {
  height: 100vh;
  overflow: hidden;
}

/* 全局按钮圆角 */
button,
.btn,
[role="button"] {
  border-radius: var(--radius-button);
}

/* 全局输入框圆角 */
input,
textarea,
select {
  border-radius: var(--radius-input);
}

/* 全局卡片圆角 */
.card,
.archive-card,
.level-card,
.modal-card,
.dropdown-content {
  border-radius: var(--radius-card);
}

/* 全局标签圆角 */
.tag,
.badge,
.label {
  border-radius: var(--radius-tag);
}

/* 全局模态框圆角 */
.modal,
.dialog,
.popup {
  border-radius: var(--radius-modal);
}

/* 全局下拉菜单圆角 */
.dropdown,
.menu,
.context-menu {
  border-radius: var(--radius-dropdown);
}

/* 全局提示框圆角 */
.tooltip,
.popover {
  border-radius: var(--radius-tooltip);
}

/* 全局图片容器圆角 */
.image-container,
.avatar,
.icon-container {
  border-radius: var(--radius-image);
}

/* 隐藏所有滚动条但保留滚动功能 */
::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: transparent;
}

/* Firefox */
* {
  scrollbar-width: none;
  -ms-overflow-style: none;
  /* IE 和 Edge */
}

/* 全局浮动按钮样式 - 确保固定定位 */
.floating-action-container {
  position: fixed !important;
  bottom: 30px !important;
  right: 30px !important;
  z-index: 10000 !important;

  /* 确保相对于视口定位 */
  top: auto !important;
  left: auto !important;

  /* 防止任何变换影响 */
  transform: none !important;
  transform-origin: initial !important;
  backface-visibility: visible !important;
  perspective: none !important;

  /* 防止动画影响 - 但保留transform过渡 */
  animation: none !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: auto !important;

  /* 应用圆角 */
  border-radius: var(--radius-pill);

  /* 确保初始状态可见 */
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container {
  display: flex;
  height: 100vh;
  flex-direction: column;
}

.content-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  margin-left: var(--sidebar-width, 70px);
  transition: margin-left 0.3s cubic-bezier(0.65, 0, 0.35, 1);
  margin-top: 38px;
  height: 100vh;
  scroll-behavior: smooth;
}
</style>
