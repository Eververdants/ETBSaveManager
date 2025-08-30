<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getI18n } from './i18n/loader.js';
import Sidebar from './components/Sidebar.vue';
import TitleBar from './components/TitleBar.vue';

const i18n = getI18n();
const t = computed(() => i18n?.global?.t || ((key) => key));
const router = useRouter();
const route = useRoute();

const sidebarExpanded = ref(false);

const handleSidebarExpand = (expanded) => {
  sidebarExpanded.value = expanded;
};

onMounted(() => {
  // 应用保存的主题
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (window.themeManager) {
    window.themeManager.setTheme(savedTheme);
  } else {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // 监听路由变更事件
  window.addEventListener('sidebar-route-change', (event) => {
    const routeName = event.detail.route;
    if (routeName && router.hasRoute(routeName)) {
      router.push({ name: routeName });
    }
  });

  // 路由切换时滚动到顶部
  router.afterEach((to, from) => {
    // 滚动主内容区域到顶部
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
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
      </main>
    </div>
  </div>
</template>

<style scoped>
.logo.vite:hover {
  filter: drop-shadow(0 0 2em #747bff);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #249b73);
}

/* 模态窗口动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
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
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: default;
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
  transition: margin-left 0.3s cubic-bezier(0.65, 0, 0.35, 1);
  margin-top: 38px;
  height: calc(100vh - 38px);
}

.main-content.sidebar-expanded {
  margin-left: 220px;
}

.main-content.sidebar-collapsed {
  margin-left: 70px;
}

/* 移除container的padding和内边距 */
.container {
  display: none;
}

.logo {
  height: 5em;
  padding: 1em;
  will-change: filter;
  transition: 0.75s;
}

.logo.vite:hover {
  filter: drop-shadow(0 0 2em #747bff);
}

.logo.tauri:hover {
  filter: drop-shadow(0 0 2em #24c8db);
}

.row {
  display: flex;
  justify-content: center;
}

a {
  font-weight: 500;
  color: var(--primary);
  text-decoration: inherit;
}

a:hover {
  color: var(--primary);
  opacity: 0.8;
}

input,
button {
  border-radius: 8px;
  border: 1px solid var(--sidebar-border-color);
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  color: var(--text);
  background: var(--card-bg);
  transition: all 0.25s ease;
  box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);
}

/* 输入框和按钮的动画 */
.input-wrapper {
  position: relative;
  display: inline-block;
}

.animated-input {
  transition: all 0.3s ease;
  background: var(--card-bg);
}

.floating-placeholder {
  position: absolute;
  left: 1.2em;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #888);
  font-size: 1em;
  font-weight: 500;
  pointer-events: none;
  transition: all 0.3s ease;
  background: transparent;
}

button span {
  display: inline-block;
}

button {
  cursor: pointer;
}

button:hover {
  border-color: var(--primary);
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

input,
button {
  outline: none;
}

#greet-input {
  margin-right: 5px;
}
</style>
