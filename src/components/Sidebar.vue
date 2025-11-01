<template>
  <div ref="sidebarRef" class="sidebar" :class="{ 'expanded': isExpanded }" @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave">
    <div class="sidebar-content">
      <!-- 顶部区域 -->
      <div class="sidebar-section top-section">
        <div class="sidebar-item" v-for="item in topMenuItems" :key="item.id"
          :class="['sidebar-item', { active: item.id === activeItemId }]" @click="handleItemClick(item, $event)"
          @mousedown="handleMouseDown" @mouseenter="handleMouseEnterItem" @mouseleave="handleMouseLeaveItem"
          @mouseup="handleMouseUp">
          <div class="sidebar-icon-container">
            <font-awesome-icon :icon="item.icon" class="sidebar-icon" />
          </div>
          <div class="sidebar-text-container">
            <span class="sidebar-text" :data-text="safeT(item.textKey)" :class="{ 'visible': isExpanded }"
              :data-lang="currentLanguage">
              {{ safeT(item.textKey) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 底部区域 -->
      <div class="sidebar-section bottom-section">
        <div class="sidebar-item" v-for="item in bottomMenuItems" :key="item.id"
          :class="['sidebar-item', { active: item.id === activeItemId }]" @click="handleItemClick(item, $event)"
          @mousedown="handleMouseDown" @mouseenter="handleMouseEnterItem" @mouseleave="handleMouseLeaveItem"
          @mouseup="handleMouseUp">
          <div class="sidebar-icon-container">
            <font-awesome-icon :icon="item.icon" class="sidebar-icon" />
          </div>
          <div class="sidebar-text-container">
            <span class="sidebar-text" :data-text="safeT(item.textKey)" :class="{ 'visible': isExpanded }"
              :data-lang="currentLanguage">
              {{ safeT(item.textKey) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { topMenuItems as originalTopMenuItems, bottomMenuItems as originalBottomMenuItems, addBottomMenuItem } from '../config/sidebarMenu.js';
import { gsap } from 'gsap';

const emit = defineEmits(['sidebar-action', 'sidebar-expand']);

const route = useRoute();
const isExpanded = ref(false);
const isDarkTheme = ref(false);
const sidebarRef = ref(null);
const activeItemId = ref(null);

// 创建响应式的菜单项数组
const topMenuItems = reactive([...originalTopMenuItems]);
const bottomMenuItems = reactive([...originalBottomMenuItems]);

// 根据当前路由设置激活的菜单项
const setActiveItemFromRoute = () => {
  // 查找与当前路由匹配的菜单项
  const allMenuItems = [...topMenuItems, ...bottomMenuItems];
  const activeItem = allMenuItems.find(item => item.route === route.name);

  if (activeItem) {
    activeItemId.value = activeItem.id;
  } else {
    // 如果当前路由是SteamCache，保持设置菜单项激活
    if (route.name === 'SteamCache') {
      activeItemId.value = 5; // 设置的ID是5
    } else {
      // 如果没有匹配的路由，默认激活首页
      activeItemId.value = 1; // 首页的ID是1
    }
  }
};

// 鼠标进入侧边栏事件处理函数
const handleMouseEnter = () => {
  isExpanded.value = true;
  emit('sidebar-expand', true);
};

// 鼠标离开侧边栏事件处理函数
const handleMouseLeave = () => {
  isExpanded.value = false;
  emit('sidebar-expand', false);
};

// 检测并应用主题
const detectTheme = () => {
  // 检查是否有全局主题管理器
  if (window.themeManager && typeof window.themeManager.applyTheme === 'function') {
    // 获取当前主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    // 应用主题
    window.themeManager.applyTheme(savedTheme);
  } else {
    // 如果没有主题管理器，使用默认的亮色主题
    document.documentElement.setAttribute('data-theme', 'light');
  }

  // 主题切换后强制重绘，防止图层卡住
  requestAnimationFrame(() => {
    if (sidebarRef.value) {
      sidebarRef.value.style.visibility = 'hidden';
      sidebarRef.value.offsetHeight; // 触发重排
      sidebarRef.value.style.visibility = 'visible';
    }
  });
};

// 组件挂载时设置初始激活项
onMounted(() => {
  setActiveItemFromRoute();
  detectTheme();

  // 监听路由变化
  watch(() => route.name, () => {
    setActiveItemFromRoute();
  });

  // 监听语言变化
  watch(currentLanguage, () => {
    // 强制重新渲染文本
    nextTick(() => {
      // 触发强制更新
    });
  });

  // 监听标题栏的侧边栏切换事件
  window.addEventListener('toggle-sidebar', (e) => {
    const shouldCollapse = e.detail.collapsed;
    if (shouldCollapse && isExpanded.value) {
      handleMouseLeave();
    } else if (!shouldCollapse && !isExpanded.value) {
      handleMouseEnter();
    }
  });

  // 监听日志菜单开关事件
  window.addEventListener('log-menu-toggle', (event) => {
    if (event.detail.enabled) {
      addLogMenuItem();
    } else {
      removeLogMenuItem();
    }
  });

  // 监听开发者模式变化事件
  window.addEventListener('developer-mode-changed', (event) => {
    if (event.detail.enabled && localStorage.getItem('logMenuEnabled') === 'true') {
      addLogMenuItem();
    } else if (!event.detail.enabled) {
      removeLogMenuItem();
    }
  });

  // 监听全局语言变化事件
  window.addEventListener('language-changed', () => {
    // 触发重新计算翻译
    nextTick(() => {
      // 强制更新DOM
    });
  });

  // 初始化时检查日志功能状态
  if (localStorage.getItem('developerMode') === 'true' && localStorage.getItem('logMenuEnabled') === 'true') {
    addLogMenuItem();
  }
});

const t = computed(() => {
  const globalI18n = window.$i18n;
  return globalI18n ? globalI18n.t : (key) => key;
});
const currentLanguage = computed(() => {
  const globalI18n = window.$i18n;
  return globalI18n ? (globalI18n.locale.value || globalI18n.locale) : 'zh-CN';
});

// 安全的翻译函数
const safeT = (key) => {
  const translateFn = t.value;
  return typeof translateFn === 'function' ? translateFn(key) : key;
};

// 添加日志菜单项
const addLogMenuItem = () => {
  // 检查是否已存在日志菜单项
  const existingLogItem = [...topMenuItems, ...bottomMenuItems].find(
    item => item.action === 'openLog'
  );

  if (!existingLogItem) {
    // 使用textKey属性，保持与其他菜单项一致
    bottomMenuItems.push({
      id: 6,
      textKey: "sidebar.logs",
      icon: ["fas", "bug"],
      action: "openLog",
      descriptionKey: "logs.description",
      route: "Log",
    });

    // 立即触发重新渲染，确保图标可见
    nextTick(() => {
      setActiveItemFromRoute();
    });
  }
};

// 移除日志菜单项
const removeLogMenuItem = () => {
  // 找到日志菜单项的索引
  const logItemIndex = bottomMenuItems.findIndex(
    item => item.action === 'openLog'
  );

  if (logItemIndex !== -1) {
    // 移除日志菜单项
    bottomMenuItems.splice(logItemIndex, 1);

    // 如果当前激活的是日志项，需要重置激活状态
    if (activeItemId.value === 6) {
      activeItemId.value = null;
    }

    // 触发重新渲染
    nextTick(() => {
      setActiveItemFromRoute();
    });
  }
};



// 获取文本宽度
const getTextWidth = (text) => {
  const tempElement = document.createElement('span');
  tempElement.style.position = 'absolute';
  tempElement.style.visibility = 'hidden';
  tempElement.style.whiteSpace = 'nowrap';
  tempElement.style.fontSize = '16px';
  tempElement.style.fontFamily = '-apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", sans-serif';
  tempElement.textContent = text;

  document.body.appendChild(tempElement);
  const textWidth = tempElement.offsetWidth;
  document.body.removeChild(tempElement);

  return textWidth;
};

// 检查文本是否需要滚动
const checkTextOverflow = (element, text) => {
  if (!element) return false;
  const textWidth = getTextWidth(text);
  const containerWidth = 150; // 侧边栏展开后文本容器的实际宽度
  return textWidth > containerWidth;
};

// 是否正在按下鼠标
let isMouseDown = false;
// 当前被按下的项目
let currentPressedItem = null;

// 鼠标按下事件处理函数
const handleMouseDown = (event) => {
  isMouseDown = true;
  currentPressedItem = event.currentTarget;
  gsap.to(currentPressedItem, {
    scale: 0.95,
    duration: 0.1,
    ease: 'power2.out'
  });
};

// 鼠标进入项目事件处理函数
const handleMouseEnterItem = (event) => {
  if (isMouseDown) {
    if (currentPressedItem && currentPressedItem !== event.currentTarget) {
      gsap.to(currentPressedItem, { scale: 1, duration: 0.1, ease: 'power2.out' });
    }
    currentPressedItem = event.currentTarget;
    gsap.to(currentPressedItem, { scale: 0.95, duration: 0.1, ease: 'power2.out' });
  }

  const textElement = event.currentTarget.querySelector('.sidebar-text');
  const itemText = textElement?.getAttribute('data-text') || textElement?.textContent || '';
  if (!textElement || !itemText) return;

  if (checkTextOverflow(textElement, itemText)) {
    textElement.classList.add('scroll-needed');
    textElement.classList.add('scroll-active');
    textElement.style.animation = '';
    textElement.style.transform = '';
    textElement.style.transition = '';

    const textWidth = getTextWidth(itemText);
    const scrollDistance = textWidth + 16;
    const duration = Math.max(8, scrollDistance / 25);

    textElement.style.animationDuration = `${duration}s`;
  }
};

// 鼠标离开项目事件处理函数
const handleMouseLeaveItem = (event) => {
  // 鼠标离开时的处理逻辑
  if (!isMouseDown && currentPressedItem) {
    gsap.to(currentPressedItem, {
      scale: 1,
      duration: 0.1,
      ease: 'power2.out'
    });
    currentPressedItem = null;
  }

  const textElement = event.currentTarget.querySelector('.sidebar-text');
  if (textElement && textElement.classList.contains('scroll-active')) {
    // 获取当前transform值
    const style = window.getComputedStyle(textElement);
    const matrix = new DOMMatrix(style.transform);
    const currentX = matrix.m41 || 0;

    // 立即停止动画
    textElement.style.animation = 'none';

    // 设置当前位置并添加过渡
    textElement.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    textElement.style.transform = `translateX(${currentX}px)`;

    // 强制重排确保过渡生效
    textElement.offsetHeight;

    // 平滑回到初始位置
    textElement.style.transform = 'translateX(0)';

    // 移除类并清理
    textElement.classList.remove('scroll-active');

    // 过渡完成后清理样式
    setTimeout(() => {
      textElement.style.transition = '';
      textElement.style.transform = '';
    }, 400);
  }
};

// 鼠标释放事件处理函数
const handleMouseUp = (event) => {
  isMouseDown = false;
  if (currentPressedItem) {
    gsap.to(currentPressedItem, {
      scale: 1,
      duration: 0.1,
      ease: 'power2.out'
    });
    currentPressedItem = null;
  }
};

// 处理菜单项点击
const handleItemClick = (item, event) => {
  activeItemId.value = item.id;
  const text = safeT(item.textKey);
  console.log('项目被点击:', text);

  // 触发动作事件
  if (item.action) {
    window.dispatchEvent(new CustomEvent('sidebar-action', {
      detail: { action: item.action, item: item }
    }));
  }

  // 如果有路由，使用vue-router进行导航
  if (item.route) {
    // 使用window的router实例或者通过事件系统触发路由
    window.dispatchEvent(new CustomEvent('sidebar-route-change', {
      detail: { route: item.route }
    }));
  }

  // 重置任何可能的缩放效果
  if (currentPressedItem) {
    gsap.to(currentPressedItem, {
      scale: 1,
      duration: 0.1,
      ease: 'power2.out'
    });
    currentPressedItem = null;
    isMouseDown = false;
  }
};
</script>

<style scoped>
/* 侧边栏容器样式 */
.sidebar {
  position: fixed;
  top: 38px;
  /* 从标题栏下方开始，标题栏高度38px */
  left: 0;
  height: calc(100vh - 38px);
  /* 减去标题栏高度 */
  width: 70px;
  /* 收起时的宽度 */
  background: var(--sidebar-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  overflow: hidden;
  border-right: 1px solid var(--sidebar-border-color);
  border-radius: 0 var(--radius-sidebar) var(--radius-sidebar) 0;
  font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Helvetica Neue', sans-serif;
  transition: background 0.25s ease, border-right 0.25s ease, box-shadow 0.25s ease, width 0.3s ease;
}

/* 侧边栏展开样式 */
.sidebar.expanded {
  width: 220px;
  /* 展开时的宽度 */
}

/* 侧边栏图标样式 */
.sidebar-icon {
  font-size: 18px;
  color: var(--text);
  transition: color 0.25s ease;
}

/* 侧边栏文本样式 */
.sidebar-text {
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), color 0.25s ease;
  font-size: 16px;
  white-space: nowrap;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Helvetica Neue', sans-serif;
  transform: translateX(-10px);
  display: block;
  position: relative;
  overflow: visible;
  width: max-content;
  max-width: none;
}

/* 侧边栏项样式 */
.sidebar-item {
  display: flex;
  align-items: center;
  padding: var(--space-3) 0;
  cursor: pointer;
  transition: all 0.2s ease, background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
  white-space: nowrap;
  border-radius: var(--radius-sidebar);
  margin: 0 var(--space-4);
  position: relative;
  justify-content: flex-start;
  color: var(--sidebar-text-color);
  min-height: 48px;
  /* 确保收起和展开状态高度一致 */
}

/* 侧边栏项悬停状态样式 */
.sidebar-item:hover {
  background: var(--sidebar-hover-bg);
  box-shadow: var(--shadow-md);
  transition: all 0.2s ease, background-color 0.25s ease, box-shadow 0.25s ease;
}

/* 侧边栏项激活状态样式 */
.sidebar-item.active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-color);
  box-shadow: inset 0 0 0 2px var(--sidebar-active-border);
  transition: all 0.2s ease, background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}

/* 侧边栏项激活+悬停状态样式 */
.sidebar-item.active:hover {
  background: var(--sidebar-active-hover-bg);
  transition: all 0.2s ease, background-color 0.25s ease, box-shadow 0.25s ease;
}

/* 侧边栏内容区域样式 */
.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-4) 0;
  overflow-x: hidden;
  overflow-y: hidden;
  scrollbar-width: none;
  gap: var(--space-4);
  /* 使用统一的间距变量 */

  .sidebar.expanded & {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--color-border);
      border-radius: var(--radius-xs);
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }
}


/* 侧边栏分区样式 */
.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}


/* 顶部区域样式 */
.top-section {
  flex: 1;
  overflow-x: hidden;
  overflow-y: hidden;
  scrollbar-width: none;
  padding-top: var(--space-2);
}

.sidebar.expanded .top-section {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
  transition: scrollbar-color 0.3s ease;
}

.sidebar.expanded .top-section:hover {
  scrollbar-color: var(--scrollbar-thumb-hover) transparent;
}

.sidebar.expanded .top-section::-webkit-scrollbar {
  width: 4px;
}

.sidebar.expanded .top-section::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar.expanded .top-section::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-xs);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform, opacity;
  opacity: 0.6;
  width: 6px !important;
  margin: var(--space-1) !important;
}

.sidebar.expanded .top-section:hover::-webkit-scrollbar-thumb {
  opacity: 1;
}

.sidebar.expanded .top-section:hover::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-hover);
}

.sidebar.expanded .top-section::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

.sidebar.expanded .top-section::-webkit-scrollbar-button {
  display: none !important;
  height: 0 !important;
  width: 0 !important;
  min-height: 0 !important;
  min-width: 0 !important;
  background: transparent !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
  overflow: hidden !important;
  visibility: hidden !important;
}

.sidebar.expanded .top-section::-webkit-scrollbar-corner {
  background: transparent;
}


/* 底部区域样式 */
.bottom-section {
  flex-shrink: 0;
  margin-top: auto;
  padding: var(--space-4) 0;
  /* 使用统一的间距变量 */
}

.bottom-section .sidebar-item:last-child {
  margin-bottom: 0px;
  /* 移除最后一个项目的额外下边距 */
}


/* 侧边栏图标容器样式 */
.sidebar-icon-container {
  position: absolute;
  left: 7px;
  /* 居中图标：70px总宽 - 24px图标 = 46px，23px居中 */
  z-index: 1;
  transition: all 0.3s ease;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}


/* 侧边栏图标样式 */
.sidebar-icon {
  font-size: 18px;
  color: var(--text);
  transition: all 0.3s ease;
}


/* 侧边栏文本容器样式 */
.sidebar-text-container {
  margin-left: 55px;
  /* 统一间距为展开状态的标准 */
  transition: all 0.3s ease;
  flex: 1;
  overflow: hidden;
  padding-right: var(--space-5);
  /* 使用统一的间距变量 */
}

/* 侧边栏文本样式 */
.sidebar-text {
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-size: 16px;
  white-space: nowrap;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'San Francisco', 'Helvetica Neue', sans-serif;
  transform: translateX(-10px);
  display: block;
  position: relative;
  overflow: visible;
  width: max-content;
  max-width: none;
}

.sidebar-text.visible {
  opacity: 1;
  transform: translateX(0);
}

/* Swift UI风格的文字切换动画 */
.sidebar-text.fade-enter {
  opacity: 0;
  transform: translateY(4px);
}

.sidebar-text.fade-enter-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-text.fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.sidebar.expanded .sidebar-text-container {
  margin-left: 55px;
  /* 统一间距，保持一致 */
}

.sidebar.expanded .sidebar-item:hover .sidebar-text-container {
  overflow: hidden;
  position: relative;
  width: 100%;
}

.sidebar.expanded .sidebar-item:hover .sidebar-text-container .sidebar-text {
  display: inline-block;
  white-space: nowrap;
  width: max-content;
  position: relative;
  transition: transform 0.4s ease-out;
}

.sidebar.expanded .sidebar-item:hover .sidebar-text-container .sidebar-text.scroll-needed {
  animation: scroll-text var(--animation-duration, 8s) linear infinite;
  animation-delay: 0.8s;
}

.sidebar.expanded .sidebar-item:hover .sidebar-text-container .scroll-active::after {
  content: attr(data-text);
  position: absolute;
  left: 100%;
  top: 0;
  white-space: nowrap;
  width: max-content;
  margin-left: var(--space-4);
  /* 使用统一的间距变量 */
}


/* 文本滚动动画 */
@keyframes scroll-text {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(calc(-100% - var(--space-4)));
    /* 使用统一的间距变量 */
  }
}

/* 通知动画 */
@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -10px);
  }

  20% {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  80% {
    opacity: 1;
    transform: translate(-50%, 0);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -10px);
  }
}

.sidebar.expanded .sidebar-item:not(:hover) .sidebar-text-container .sidebar-text.scroll-active {
  animation: none !important;
}


/* 侧边栏项样式 */
.sidebar-item {
  display: flex;
  align-items: center;
  padding: var(--space-3) 0;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  border-radius: var(--radius-sidebar);
  margin: 0 var(--space-4);
  position: relative;
  justify-content: flex-start;
  color: var(--sidebar-text-color);
  min-height: 48px;
  /* 确保收起和展开状态高度一致 */
}


/* 侧边栏项悬停状态样式 */
.sidebar-item:hover {
  background: var(--sidebar-hover-bg);
  box-shadow: var(--shadow-md);
}


/* 侧边栏项激活状态样式 */
.sidebar-item.active {
  background: var(--sidebar-active-bg);
  color: var(--sidebar-active-color);
  box-shadow: inset 0 0 0 2px var(--sidebar-active-border);
}


/* 侧边栏项激活+悬停状态样式 */
.sidebar-item.active:hover {
  background: var(--sidebar-active-hover-bg);
}
</style>