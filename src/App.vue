<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getI18n } from './i18n/loader.js';
import Sidebar from './components/Sidebar.vue';
import TitleBar from './components/TitleBar.vue';
import PerformanceMonitor from "./components/PerformanceMonitor.vue";
import { showPopup } from '@/services/popupService';

// 示例调用 - 发行版禁用弹窗功能
// showPopup({
//   message: '这是一个提示！',
//   direction: 'top-right', // 支持八个方向
//   icon: ['fas', 'heart'],
//   duration: 5000, // 5秒后自动关闭，0 为不自动关闭
// });

const i18n = getI18n();
const router = useRouter();

const sidebarExpanded = ref(false);
// 发行版禁用性能监控 - 设置为false确保默认不显示
const performanceMonitorEnabled = ref(false);

const handleSidebarExpand = (expanded) => {
  sidebarExpanded.value = expanded;
};

onMounted(() => {
    // 强制启用硬件加速，防止图层合成问题
    const forceHardwareAcceleration = () => {
      const elements = document.querySelectorAll('.main-content, .sidebar, .archive-grid, .archive-card');
      elements.forEach(el => {
        if (el) {
          el.style.transform = 'translateZ(0)';
          el.style.willChange = 'transform';
        }
      });
    };

    // 应用保存的主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (window.themeManager) {
      window.themeManager.setTheme(savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // 延迟执行硬件加速强制，确保DOM完全加载
    setTimeout(forceHardwareAcceleration, 100);

  // 监听性能监控开关事件 - 发行版禁用
  // window.addEventListener('performance-monitor-toggle', (event) => {
  //   performanceMonitorEnabled.value = event.detail.enabled;
  // });

  // 监听路由变更事件
  window.addEventListener('sidebar-route-change', (event) => {
    const routeName = event.detail.route;
    if (routeName && router.hasRoute(routeName)) {
      router.push({ name: routeName });
    }
  });

  // 路由切换时滚动到顶部
  router.afterEach((to, from) => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
    
    // 路由切换后强制重绘，防止图层卡住
    requestAnimationFrame(() => {
      document.body.style.display = 'none';
      document.body.offsetHeight; // 触发重排
      document.body.style.display = '';
    });
  });
});
</script>

<template>
  <div class="app-container">
    <TitleBar />
    <div class="content-wrapper">
      <Sidebar @sidebar-expand="handleSidebarExpand" />
      <main class="main-content"
        :class="{ 'sidebar-collapsed': !sidebarExpanded, 'sidebar-expanded': sidebarExpanded }">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
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
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
  transform: translateZ(0); /* 强制硬件加速 */
  backface-visibility: hidden; /* 防止图层闪烁 */
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
  border-radius: 8px;
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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Helvetica Neue', sans-serif;
  background: var(--bg);
  color: var(--text);
  transition: background 0.3s ease, color 0.3s ease;
  overflow: hidden;
  cursor: default;
  /* 防止图层合成问题 */
  transform: translateZ(0);
  will-change: transform;
}

#app {
  height: 100vh;
  overflow: hidden;
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
  height: calc(100vh - 38px);
}
</style>
