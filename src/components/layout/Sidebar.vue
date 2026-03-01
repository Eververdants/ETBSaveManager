<template>
  <div ref="sidebarRef" class="sidebar" :class="{ expanded: isExpanded }" @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave">
    <div class="sidebar-content">
      <!-- 顶部区域 -->
      <div class="sidebar-section top-section">
        <div class="sidebar-item" v-for="item in filteredTopMenuItems" :key="item.id"
          :class="['sidebar-item', { active: item.id === activeItemId }]" @click="handleItemClick(item, $event)"
          @mousedown="handleMouseDown" @mouseenter="handleMouseEnterItem" @mouseleave="handleMouseLeaveItem"
          @mouseup="handleMouseUp">
          <div class="sidebar-icon-container">
            <font-awesome-icon :icon="item.icon" class="sidebar-icon" />
          </div>
          <div class="sidebar-text-container">
            <span class="sidebar-text" :data-text="safeT(item.textKey)" :class="{ visible: isExpanded }"
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
            <span class="sidebar-text" :data-text="safeT(item.textKey)" :class="{ visible: isExpanded }"
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
import {
  ref,
  computed,
  onMounted,
  nextTick,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { topMenuItems, bottomMenuItems } from "../../config/sidebarMenu.js";
import { gsap } from "gsap";
import storageService from "@/services/storageService";
import { getAppContext } from "@/appContext.js";

const emit = defineEmits(["sidebar-action", "sidebar-expand"]);
const route = useRoute();

const useSidebarState = () => {
  const isExpanded = ref(false);
  const sidebarRef = ref(null);
  const activeItemId = ref(null);

  const handleMouseEnter = () => {
    isExpanded.value = true;
    emit("sidebar-expand", true);
  };

  const handleMouseLeave = () => {
    isExpanded.value = false;
    emit("sidebar-expand", false);
  };

  return { isExpanded, sidebarRef, activeItemId, handleMouseEnter, handleMouseLeave };
};

const useSidebarI18n = () => {
  const { i18n } = getAppContext();

  const t = computed(() => {
    return i18n ? i18n.t : (key) => key;
  });

  const currentLanguage = computed(() => {
    return i18n ? i18n.locale.value || i18n.locale : "zh-CN";
  });

  const safeT = (key) => {
    const translateFn = t.value;
    return typeof translateFn === "function" ? translateFn(key) : key;
  };

  return { t, currentLanguage, safeT };
};

const useSidebarMenuItems = () => {
  const filteredTopMenuItems = computed(() => {
    return [...topMenuItems.value];
  });

  return { filteredTopMenuItems };
};

const useSidebarRouteHandler = (activeItemId) => {
  const setActiveItemFromRoute = () => {
    const allMenuItems = [...topMenuItems.value, ...bottomMenuItems.value];
    let activeItem = null;

    if (route.name === "SelectCreateMode") {
      activeItem = allMenuItems.find((item) => item.route === "CreateArchive");
    } else if (["CreateArchive", "QuickCreateArchive", "BatchCreateArchive"].includes(route.name)) {
      activeItem = allMenuItems.find((item) => item.route === "CreateArchive");
    } else if (route.name === "SteamCache") {
      activeItem = allMenuItems.find((item) => item.route === "Settings");
    } else {
      activeItem = allMenuItems.find((item) => item.route === route.name);
    }

    activeItemId.value = activeItem ? activeItem.id : 1;
  };

  return { setActiveItemFromRoute };
};

const useSidebarTheme = (sidebarRef) => {
  const detectTheme = () => {
    if (window.themeManager && typeof window.themeManager.applyTheme === "function") {
      const savedTheme = storageService.getItem("theme") || "light";
      window.themeManager.applyTheme(savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }

    requestAnimationFrame(() => {
      if (sidebarRef.value) {
        sidebarRef.value.style.visibility = "hidden";
        sidebarRef.value.offsetHeight;
        sidebarRef.value.style.visibility = "visible";
      }
    });
  };

  return { detectTheme };
};

const useSidebarMenuItemManager = (activeItemId, setActiveItemFromRoute) => {
  const addLogMenuItem = () => {
    const existingLogItem = [...topMenuItems.value, ...bottomMenuItems.value].find(
      (item) => item.action === "openLog"
    );

    if (!existingLogItem) {
      const allItems = [...topMenuItems.value, ...bottomMenuItems.value];
      const maxId = Math.max(...allItems.map((item) => item.id));
      const uniqueLogId = maxId + 1;

      bottomMenuItems.value.push({
        id: uniqueLogId,
        textKey: "sidebar.logs",
        icon: ["fas", "bug"],
        action: "openLog",
        descriptionKey: "logs.description",
        route: "Log",
      });

      nextTick(() => setActiveItemFromRoute());
    }
  };

  const removeLogMenuItem = () => {
    const logItemIndex = bottomMenuItems.value.findIndex((item) => item.action === "openLog");

    if (logItemIndex !== -1) {
      const logItemId = bottomMenuItems.value[logItemIndex].id;
      bottomMenuItems.value.splice(logItemIndex, 1);

      if (activeItemId.value === logItemId) {
        activeItemId.value = null;
      }

      nextTick(() => setActiveItemFromRoute());
    }
  };

  const addTestArchiveMenuItem = () => {
    const existingTestArchiveItem = [...topMenuItems.value, ...bottomMenuItems.value].find(
      (item) => item.action === "openTestArchive"
    );

    if (!existingTestArchiveItem) {
      const allItems = [...topMenuItems.value, ...bottomMenuItems.value];
      const maxId = Math.max(...allItems.map((item) => item.id));
      const uniqueTestArchiveId = maxId + 1;

      topMenuItems.value.push({
        id: uniqueTestArchiveId,
        textKey: "sidebar.testArchive",
        icon: ["fas", "flask"],
        action: "openTestArchive",
        descriptionKey: "archive.testDescription",
        route: "TestArchive",
      });

      nextTick(() => setActiveItemFromRoute());
    }
  };

  const removeTestArchiveMenuItem = () => {
    const testArchiveItemIndex = topMenuItems.value.findIndex(
      (item) => item.action === "openTestArchive"
    );

    if (testArchiveItemIndex !== -1) {
      const testArchiveItemId = topMenuItems.value[testArchiveItemIndex].id;
      topMenuItems.value.splice(testArchiveItemIndex, 1);

      if (activeItemId.value === testArchiveItemId) {
        activeItemId.value = null;
      }

      nextTick(() => setActiveItemFromRoute());
    }
  };

  return { addLogMenuItem, removeLogMenuItem, addTestArchiveMenuItem, removeTestArchiveMenuItem };
};

const useSidebarTextMeasurement = () => {
  const getTextWidth = (text) => {
    const tempElement = document.createElement("span");
    tempElement.style.position = "absolute";
    tempElement.style.visibility = "hidden";
    tempElement.style.whiteSpace = "nowrap";
    tempElement.style.fontSize = "16px";
    tempElement.style.fontFamily =
      '-apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", sans-serif';
    tempElement.textContent = text;

    document.body.appendChild(tempElement);
    const textWidth = tempElement.offsetWidth;
    document.body.removeChild(tempElement);

    return textWidth;
  };

  const checkTextOverflow = (element, text) => {
    if (!element) return false;
    const textWidth = getTextWidth(text);
    return textWidth > 150;
  };

  return { getTextWidth, checkTextOverflow };
};

const useSidebarMouseInteractions = (checkTextOverflow, getTextWidth) => {
  let isMouseDown = false;
  let currentPressedItem = null;

  const handleMouseDown = (event) => {
    isMouseDown = true;
    currentPressedItem = event.currentTarget;
    gsap.to(currentPressedItem, { scale: 0.95, duration: 0.1, ease: "power2.out" });
  };

  const handleMouseEnterItem = (event) => {
    if (isMouseDown) {
      if (currentPressedItem && currentPressedItem !== event.currentTarget) {
        gsap.to(currentPressedItem, { scale: 1, duration: 0.1, ease: "power2.out" });
      }
      currentPressedItem = event.currentTarget;
      gsap.to(currentPressedItem, { scale: 0.95, duration: 0.1, ease: "power2.out" });
    }

    const textElement = event.currentTarget.querySelector(".sidebar-text");
    const itemText = textElement?.getAttribute("data-text") || textElement?.textContent || "";
    if (!textElement || !itemText) return;

    if (checkTextOverflow(textElement, itemText)) {
      textElement.classList.add("scroll-needed", "scroll-active");
      textElement.style.animation = "";
      textElement.style.transform = "";
      textElement.style.transition = "";

      const textWidth = getTextWidth(itemText);
      const scrollDistance = textWidth + 16;
      const duration = Math.max(8, scrollDistance / 25);

      textElement.style.animationDuration = `${duration}s`;
    }
  };

  const handleMouseLeaveItem = (event) => {
    if (!isMouseDown && currentPressedItem) {
      gsap.to(currentPressedItem, { scale: 1, duration: 0.1, ease: "power2.out" });
      currentPressedItem = null;
    }

    const textElement = event.currentTarget.querySelector(".sidebar-text");
    if (textElement && textElement.classList.contains("scroll-active")) {
      const style = window.getComputedStyle(textElement);
      const matrix = new DOMMatrix(style.transform);
      const currentX = matrix.m41 || 0;

      textElement.style.animation = "none";
      textElement.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      textElement.style.transform = `translateX(${currentX}px)`;

      textElement.offsetHeight;
      textElement.style.transform = "translateX(0)";
      textElement.classList.remove("scroll-active");

      setTimeout(() => {
        textElement.style.transition = "";
        textElement.style.transform = "";
      }, 400);
    }
  };

  const handleMouseUp = () => {
    isMouseDown = false;
    if (currentPressedItem) {
      gsap.to(currentPressedItem, { scale: 1, duration: 0.1, ease: "power2.out" });
      currentPressedItem = null;
    }
  };

  return { handleMouseDown, handleMouseEnterItem, handleMouseLeaveItem, handleMouseUp };
};

const useSidebarActions = (activeItemId, safeT) => {
  let currentPressedItem = null;

  const handleItemClick = (item) => {
    activeItemId.value = item.id;
    console.log("项目被点击:", safeT(item.textKey));

    if (item.action) {
      window.dispatchEvent(
        new CustomEvent("sidebar-action", { detail: { action: item.action, item } })
      );
    }

    if (item.route) {
      window.dispatchEvent(
        new CustomEvent("sidebar-route-change", { detail: { route: item.route } })
      );
    }

    if (currentPressedItem) {
      gsap.to(currentPressedItem, { scale: 1, duration: 0.1, ease: "power2.out" });
      currentPressedItem = null;
    }
  };

  return { handleItemClick };
};

const { isExpanded, sidebarRef, activeItemId, handleMouseEnter, handleMouseLeave } = useSidebarState();
const { t, currentLanguage, safeT } = useSidebarI18n();
const { filteredTopMenuItems } = useSidebarMenuItems();
const { setActiveItemFromRoute } = useSidebarRouteHandler(activeItemId);
const { detectTheme } = useSidebarTheme(sidebarRef);
const { addLogMenuItem, removeLogMenuItem, addTestArchiveMenuItem, removeTestArchiveMenuItem } =
  useSidebarMenuItemManager(activeItemId, setActiveItemFromRoute);
const { getTextWidth, checkTextOverflow } = useSidebarTextMeasurement();
const { handleMouseDown, handleMouseEnterItem, handleMouseLeaveItem, handleMouseUp } =
  useSidebarMouseInteractions(checkTextOverflow, getTextWidth);
const { handleItemClick } = useSidebarActions(activeItemId, safeT);

onMounted(() => {
  setActiveItemFromRoute();
  detectTheme();

  watch(() => route.name, () => setActiveItemFromRoute());

  watch(currentLanguage, () => nextTick(() => { }));

  window.addEventListener("toggle-sidebar", (e) => {
    if (e.detail.collapsed && isExpanded.value) handleMouseLeave();
    else if (!e.detail.collapsed && !isExpanded.value) handleMouseEnter();
  });

  window.addEventListener("log-menu-toggle", (event) => {
    event.detail.enabled ? addLogMenuItem() : removeLogMenuItem();
  });

  window.addEventListener("developer-mode-changed", (event) => {
    if (event.detail.enabled && storageService.getItem("logMenuEnabled") === "true") {
      addLogMenuItem();
    } else if (!event.detail.enabled) {
      removeLogMenuItem();
    }
  });

  window.addEventListener("plugin-menu-added", () => nextTick(() => setActiveItemFromRoute()));
  window.addEventListener("plugin-menu-removed", () => nextTick(() => setActiveItemFromRoute()));

  window.addEventListener("test-archive-toggle", (event) => {
    event.detail.enabled ? addTestArchiveMenuItem() : removeTestArchiveMenuItem();
  });

  window.addEventListener("language-changed", () => nextTick(() => { }));

  if (storageService.getItem("testArchiveEnabled") === "true") {
    addTestArchiveMenuItem();
  }

  if (
    storageService.getItem("developerMode") === "true" &&
    storageService.getItem("logMenuEnabled") === "true"
  ) {
    addLogMenuItem();
  }
});
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
  --sidebar-width: 70px;
  background: var(--sidebar-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  overflow: hidden;
  border-right: 1px solid var(--sidebar-border-color);
  border-radius: 0 var(--radius-sidebar) var(--radius-sidebar) 0;
  font-family: -apple-system, BlinkMacSystemFont, "San Francisco",
    "Helvetica Neue", sans-serif;
  transition: background 0.25s ease, border-right 0.25s ease,
    box-shadow 0.25s ease, width 0.3s ease, --sidebar-width 0.3s ease;
}

/* 侧边栏展开样式 */
.sidebar.expanded {
  width: 220px;
  /* 展开时的宽度 */
  --sidebar-width: 220px;
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
  transition: opacity 0.3s ease,
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), color 0.25s ease;
  font-size: 16px;
  white-space: nowrap;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "San Francisco",
    "Helvetica Neue", sans-serif;
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
  transition: all 0.2s ease, background-color 0.25s ease, color 0.25s ease,
    box-shadow 0.25s ease;
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
  transition: all 0.2s ease, background-color 0.25s ease, color 0.25s ease,
    box-shadow 0.25s ease;
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
  transition: opacity 0.3s ease,
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-size: 16px;
  white-space: nowrap;
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "San Francisco",
    "Helvetica Neue", sans-serif;
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
