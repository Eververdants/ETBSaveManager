<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getI18n } from "./i18n/loader.js";
import Sidebar from "./components/Sidebar.vue";
import TitleBar from "./components/TitleBar.vue";
import PerformanceMonitor from "./components/PerformanceMonitor.vue";
import {
  protectFloatingButtonPosition,
  safeModifyBodyStyles,
} from "./utils/floatingButtonProtection.js";
import storage from "./services/storageService";

const i18n = getI18n();
const router = useRouter();

const sidebarExpanded = ref(false);
// 发行版禁用性能监控 - 设置为false确保默认不显示
const performanceMonitorEnabled = ref(false);

// 组件缓存管理
const cachedComponents = ref([
  "Home",
  "Settings",
  "CreateArchive",
  "PluginMarket",
  "CoreArchive",
  "Log",
]);
const excludedComponents = ref([
  "BatchCreateArchive",
  "EditArchive",
  "SteamCache",
]);

const handleSidebarExpand = (expanded) => {
  sidebarExpanded.value = expanded;
};

onMounted(() => {

  // 强制启用硬件加速，防止图层合成问题
  const forceHardwareAcceleration = () => {
    const elements = document.querySelectorAll(
      ".main-content, .sidebar, .archive-grid, .archive-card"
    );
    elements.forEach((el) => {
      if (el && !el.classList.contains("floating-action-container")) {
        el.style.transform = "translateZ(0)";
        el.style.willChange = "transform";
      }
    });
  };

  // 确保浮动按钮固定定位的函数
  const ensureFloatingButtonPosition = () => {
    protectFloatingButtonPosition();
  };

  // 检查当前日期是否在元旦期间 (12.31 - 1.3)
  const isNewYearPeriod = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return (
      (month === 12 && day === 31) || (month === 1 && day >= 1 && day <= 3)
    );
  };

  // 检查当前日期是否在春节期间 (2.13 - 2.24)
  const isSpringFestivalPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    return year === 2026 && month === 2 && day >= 13 && day <= 24;
  };

  // 检查主题是否是限时主题
  const isSeasonalTheme = (themeId) => {
    return [
      "new-year",
      "spring-festival-dark",
      "spring-festival-light",
    ].includes(themeId);
  };

  // 检查限时主题是否可用
  const isSeasonalThemeAvailable = (themeId) => {
    const mode = storage.getItem("seasonalThemeMode") || "auto";
    if (mode === "force") return true;
    if (mode === "hide") return false;

    if (themeId === "new-year") return isNewYearPeriod();
    if (
      themeId === "spring-festival-dark" ||
      themeId === "spring-festival-light"
    ) {
      return isSpringFestivalPeriod();
    }
    return true;
  };

  // 应用保存的主题，如果是限时主题但不可用则恢复之前的主题
  let savedTheme = storage.getItem("theme") || "light";

  // 确保 themeBeforeNewYear 有值（用于恢复）
  // 如果当前主题不是限时主题且没有记录过，就用当前主题作为备份
  if (!storage.getItem("themeBeforeNewYear") && !isSeasonalTheme(savedTheme)) {
    storage.setItem("themeBeforeNewYear", savedTheme);
  }

  if (isSeasonalTheme(savedTheme) && !isSeasonalThemeAvailable(savedTheme)) {
    // 限时主题不可用，恢复之前的主题
    const themeBeforeSeasonal =
      storage.getItem("themeBeforeNewYear") || "light";
    savedTheme = themeBeforeSeasonal;
    storage.setItem("theme", savedTheme);
  }

  if (window.themeManager) {
    window.themeManager.setTheme(savedTheme);
  } else {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  // 强制更新body背景色，确保主题立即生效
  const updateBodyBackground = (theme) => {
    const body = document.body;
    if (body) {
      if (theme === "dark") {
        body.style.backgroundColor = "#1c1c1e";
        body.style.setProperty("--bg", "#1c1c1e");
      } else if (theme === "new-year") {
        // 元旦主题 - 喜庆红金配色
        body.style.backgroundColor = "#1a0a0a";
        body.style.setProperty("--bg", "#1a0a0a");
      } else if (theme === "spring-festival-dark") {
        // 春节深色主题 - 紫檀色
        body.style.backgroundColor = "#1c0a14";
        body.style.setProperty("--bg", "#1c0a14");
      } else if (theme === "spring-festival-light") {
        // 春节浅色主题 - 宣纸色
        body.style.backgroundColor = "#fefce8";
        body.style.setProperty("--bg", "#fefce8");
      } else {
        body.style.backgroundColor = "#f8f9fa";
        body.style.setProperty("--bg", "#f8f9fa");
      }

      // 延迟清除内联样式，让CSS变量接管
      setTimeout(() => {
        body.style.backgroundColor = "";
        body.style.setProperty("--bg", "");
      }, 100);
    }
  };

  updateBodyBackground(savedTheme);

  // 延迟执行硬件加速强制，确保DOM完全加载
  setTimeout(forceHardwareAcceleration, 100);

  // 延迟执行浮动按钮位置确保，确保组件已挂载
  setTimeout(ensureFloatingButtonPosition, 200);

  // 定期检查并修复浮动按钮位置
  setInterval(ensureFloatingButtonPosition, 1000);

  // 在午夜检查限时主题是否过期
  const checkSeasonalThemeExpiry = () => {
    const currentTheme = storage.getItem("theme");
    if (
      isSeasonalTheme(currentTheme) &&
      !isSeasonalThemeAvailable(currentTheme)
    ) {
      // 限时主题已过期，回退到之前的非限时主题
      const themeBeforeSeasonal =
        storage.getItem("themeBeforeNewYear") || "light";
      storage.setItem("theme", themeBeforeSeasonal);

      if (window.themeManager) {
        window.themeManager.setTheme(themeBeforeSeasonal);
      } else {
        document.documentElement.setAttribute(
          "data-theme",
          themeBeforeSeasonal
        );
      }
      updateBodyBackground(themeBeforeSeasonal);

      console.log(
        `Seasonal theme "${currentTheme}" expired, reverted to "${themeBeforeSeasonal}"`
      );
    }
  };

  // 计算距离下一个午夜的毫秒数
  const scheduleNextMidnightCheck = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      checkSeasonalThemeExpiry();
      // 检查完后，设置下一个午夜的检查
      scheduleNextMidnightCheck();
    }, msUntilMidnight);
  };

  // 启动午夜检查调度
  scheduleNextMidnightCheck();

  // 监听性能监控开关事件 - 发行版禁用
  // window.addEventListener('performance-monitor-toggle', (event) => {
  //   performanceMonitorEnabled.value = event.detail.enabled;
  // });

  // 监听路由变更事件
  window.addEventListener("sidebar-route-change", (event) => {
    const routeName = event.detail.route;
    if (routeName && router.hasRoute(routeName)) {
      router.push({ name: routeName });
    }
  });

  // 路由切换时处理滚动位置
  router.afterEach((to, from) => {
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      // 只在页面底部时才重置滚动位置
      const scrollThreshold = 100; // 距离底部100px内视为底部
      const isAtBottom =
        mainContent.scrollHeight - mainContent.scrollTop <=
        mainContent.clientHeight + scrollThreshold;

      // 如果在页面底部且切换到不同页面，则重置滚动位置
      if (isAtBottom && to.name !== from.name) {
        mainContent.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }

    // 路由切换后强制重绘，防止图层卡住
    // 使用更温和的方式触发重绘，避免页面闪烁
    requestAnimationFrame(() => {
      const mainContent = document.querySelector(".main-content");
      if (mainContent) {
        // 通过修改 transform 触发重绘，不会导致视觉闪烁
        mainContent.style.transform = "translateZ(0)";
        void mainContent.offsetHeight; // 触发重排
      }
    });

    // 路由切换后多重保护浮动按钮位置
    setTimeout(ensureFloatingButtonPosition, 50);
    setTimeout(ensureFloatingButtonPosition, 200);
    setTimeout(ensureFloatingButtonPosition, 500);
    setTimeout(ensureFloatingButtonPosition, 1000);
  });
});
</script>

<template>
  <div class="app-container">
    <TitleBar />
    <div class="content-wrapper">
      <Sidebar @sidebar-expand="handleSidebarExpand" />
      <main
        class="main-content"
        :class="{
          'sidebar-collapsed': !sidebarExpanded,
          'sidebar-expanded': sidebarExpanded,
        }"
      >
        <router-view v-slot="{ Component, route }">
          <transition name="page-fade" mode="out-in">
            <!-- 使用keep-alive缓存常用组件 -->
            <keep-alive
              :include="cachedComponents"
              :exclude="excludedComponents"
            >
              <component :is="Component" :key="route.fullPath" />
            </keep-alive>
          </transition>
        </router-view>
        <!-- 性能监控组件 - 发行版禁用 -->
        <!-- <PerformanceMonitor v-if="performanceMonitorEnabled" class="performance-monitor" /> -->
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

/* 性能监控组件样式 - 发行版禁用 */
/*
.performance-monitor {
  position: fixed;
  top: 50px;
  right: 20px;
  width: 300px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid #0f0;
  border-radius: var(--radius-lg);
  backdrop-filter: blur(4px);
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
*/
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
  background: var(--bg);
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
