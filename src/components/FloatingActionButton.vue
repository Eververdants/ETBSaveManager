<template>
  <teleport to="body">
    <div
      v-show="shouldRender"
      class="floating-action-container"
      ref="floatingActionContainer"
      :class="$attrs.class"
    >
      <div class="function-tooltip" ref="tooltip">
        <span class="tooltip-text">{{ getCurrentTooltip }}</span>
      </div>
      <div
        class="action-button"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @wheel="handleWheel"
        @click="handleClick"
        ref="actionButton"
      >
        <div class="icon-wrapper current-icon" ref="currentIconEl">
          <font-awesome-icon :icon="['fas', displayIcon]" />
        </div>
        <div class="icon-wrapper next-icon" ref="nextIconEl">
          <font-awesome-icon :icon="['fas', nextIcon]" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { gsap } from "gsap";
import storage from "../services/storageService";

defineOptions({ inheritAttrs: false });

const { t } = useI18n({ useScope: "global" });
const route = useRoute();
const emit = defineEmits(["search-click", "folder-click", "refresh-click"]);

// DOM refs
const actionButton = ref(null);
const currentIconEl = ref(null);
const nextIconEl = ref(null);
const tooltip = ref(null);
const floatingActionContainer = ref(null);

// 状态
const icons = ["search", "folder", "refresh"];
const currentIndex = ref(0);
const displayIndex = ref(0); // 当前显示的图标索引
const nextDisplayIndex = ref(1); // 下一个图标索引
const isHovered = ref(false);
const isAnimating = ref(false);
let tooltipTimer = null;
let styleObserver = null;

// 映射配置
const iconMap = {
  search: "magnifying-glass",
  folder: "folder",
  refresh: "arrow-rotate-right",
};
const tooltipKeys = {
  search: "floatingButton.searchArchive",
  folder: "floatingButton.openFolder",
  refresh: "floatingButton.refreshList",
};
const eventMap = {
  search: "search-click",
  folder: "folder-click",
  refresh: "refresh-click",
};

// 通用GSAP配置
const gsapDefaults = {
  ease: "power2.out",
  force3D: false,
  immediateRender: false,
};

// 容器固定样式
const containerStyles = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
  top: "auto",
  left: "auto",
  transform: "none",
  margin: "0",
  padding: "0",
};

const isHomePage = computed(() => route.name === "Home");
const shouldRender = ref(isHomePage.value); // 控制DOM是否渲染
const isVisible = ref(isHomePage.value); // 控制动画状态
const displayIcon = computed(
  () => iconMap[icons[displayIndex.value]] || "magnifying-glass"
);
const nextIcon = computed(
  () => iconMap[icons[nextDisplayIndex.value]] || "magnifying-glass"
);
const getCurrentTooltip = computed(() =>
  t(tooltipKeys[icons[currentIndex.value]] || tooltipKeys.search)
);

const applyContainerStyles = (container, extra = {}) => {
  if (!container) return;
  Object.entries({ ...containerStyles, ...extra }).forEach(([k, v]) =>
    container.style.setProperty(k, v, "important")
  );
};

// 动画状态标记，防止styleObserver干扰动画
let isTransitioning = false;

const showFloatingButton = () => {
  const container = floatingActionContainer.value;
  if (!container) {
    setTimeout(showFloatingButton, 100);
    return;
  }

  isTransitioning = true;
  gsap.fromTo(
    container,
    { opacity: 0, scale: 0.8, y: 20 },
    {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.35,
      ease: "back.out(1.2)",
      onComplete: () => {
        isTransitioning = false;
      },
    }
  );
};

const hideFloatingButton = () => {
  const container = floatingActionContainer.value;
  if (!container) {
    shouldRender.value = false;
    return;
  }

  isTransitioning = true;
  gsap.to(container, {
    opacity: 0,
    scale: 0.8,
    y: 20,
    duration: 0.25,
    ease: "power2.in",
    onComplete: () => {
      shouldRender.value = false; // 动画完成后才移除DOM
      isTransitioning = false;
    },
  });
};

watch(isHomePage, (newVal, oldVal) => {
  if (newVal === oldVal) return;
  if (newVal) {
    // 进入Home页面：先渲染DOM，再播放显示动画
    shouldRender.value = true;
    isVisible.value = true;
    nextTick(() => setTimeout(showFloatingButton, 100));
  } else {
    // 离开Home页面：先播放隐藏动画，动画完成后再移除DOM
    isVisible.value = false;
    hideFloatingButton();
  }
});

const clearTooltipTimer = () => {
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }
};

const handleMouseEnter = () => {
  isHovered.value = true;
  clearTooltipTimer();
  gsap.killTweensOf(tooltip.value);
  tooltipTimer = setTimeout(() => {
    if (isHovered.value && tooltip.value) {
      gsap.to(tooltip.value, {
        opacity: 1,
        y: 0,
        visibility: "visible",
        duration: 0.3,
        ...gsapDefaults,
      });
    }
  }, 100);
};

const handleMouseLeave = () => {
  isHovered.value = false;
  clearTooltipTimer();
  gsap.killTweensOf(tooltip.value);
  // 恢复按钮大小（防止按下后移出不松开的情况）
  gsap.to(actionButton.value, { scale: 1, duration: 0.08, ease: "power2.out" });
  tooltipTimer = setTimeout(() => {
    if (!isHovered.value && tooltip.value) {
      gsap.to(tooltip.value, {
        opacity: 0,
        y: 10,
        duration: 0.2,
        ...gsapDefaults,
        onComplete: () => {
          if (tooltip.value) tooltip.value.style.visibility = "hidden";
        },
      });
    }
  }, 150);
};

const handleWheel = (event) => {
  event.preventDefault();
  if (isAnimating.value) return;
  isAnimating.value = true;

  const direction = event.deltaY > 0 ? 1 : -1;
  const newIndex =
    (currentIndex.value + direction + icons.length) % icons.length;

  // 设置下一个图标
  nextDisplayIndex.value = newIndex;

  gsap.killTweensOf(currentIconEl.value);
  gsap.killTweensOf(nextIconEl.value);
  gsap.killTweensOf(tooltip.value);

  // tooltip淡出淡入
  gsap.to(tooltip.value, {
    opacity: 0,
    duration: 0.1,
    ...gsapDefaults,
    onComplete: () => {
      currentIndex.value = newIndex;
      gsap.to(tooltip.value, {
        opacity: 1,
        y: 0,
        visibility: "visible",
        duration: 0.15,
        ...gsapDefaults,
      });
    },
  });

  // 设置下一个图标初始位置（从下方进入）
  gsap.set(nextIconEl.value, { y: direction * 40, opacity: 1 });

  // 当前图标滑出 + 下一个图标滑入（同步）
  const duration = 0.25;
  gsap.to(currentIconEl.value, {
    y: -direction * 40,
    opacity: 0,
    duration,
    ease: "power2.inOut",
  });
  gsap.to(nextIconEl.value, {
    y: 0,
    opacity: 1,
    duration,
    ease: "power2.inOut",
    onComplete: () => {
      // 动画完成后，更新显示索引并重置位置
      displayIndex.value = newIndex;
      gsap.set(currentIconEl.value, { y: 0, opacity: 1 });
      gsap.set(nextIconEl.value, { y: 40, opacity: 0 });
      isAnimating.value = false;
    },
  });
};

const handleMouseDown = () => {
  gsap.to(actionButton.value, {
    scale: 0.92,
    duration: 0.05,
    ease: "power2.out",
  });
};

const handleMouseUp = () => {
  gsap.to(actionButton.value, {
    scale: 1,
    duration: 0.08,
    ease: "back.out(2)",
  });
};

const handleClick = () => {
  applyContainerStyles(floatingActionContainer.value);
  const action = icons[currentIndex.value];
  if (eventMap[action]) emit(eventMap[action]);
};

const showScrollHint = () => {
  const hint = document.createElement("div");
  hint.className = "scroll-hint";
  hint.innerHTML = `<div class="scroll-hint-content"><div class="scroll-hint-icon">🖱️</div><div class="scroll-hint-text">${t(
    "floatingButton.scrollHint"
  )}</div></div>`;
  document.body.appendChild(hint);
  gsap.fromTo(
    hint,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      delay: 0.5,
      ...gsapDefaults,
      onComplete: () =>
        gsap.to(hint, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          delay: 3,
          ease: "power2.in",
          force3D: false,
          immediateRender: false,
          onComplete: () => hint.remove(),
        }),
    }
  );
};

const initStyleObserver = (container) => {
  const expected = {
    position: "fixed",
    bottom: "30px",
    right: "30px",
    top: "auto",
    left: "auto",
  };
  styleObserver = new MutationObserver((mutations) => {
    // 动画期间不干扰
    if (isTransitioning) return;
    for (const m of mutations) {
      if (m.type !== "attributes" || m.attributeName !== "style") continue;
      // 只检查定位相关属性，不检查opacity和visibility
      const needsRestore = Object.entries(expected).some(([k, v]) => {
        const c = container.style.getPropertyValue(k);
        return c && c !== v;
      });
      if (needsRestore)
        Object.entries(expected).forEach(([k, v]) =>
          container.style.setProperty(k, v, "important")
        );
    }
  });
  styleObserver.observe(container, {
    attributes: true,
    attributeFilter: ["style"],
  });
};

onMounted(() => {
  const container = floatingActionContainer.value;
  if (container) {
    // 初始状态：隐藏
    gsap.set(container, { opacity: 0, scale: 0.8, y: 20 });
    applyContainerStyles(container, {
      "z-index": "10000",
      isolation: "isolate",
    });
    initStyleObserver(container);
  }
  // 初始化：当前图标可见，下一个图标隐藏在下方
  if (currentIconEl.value) gsap.set(currentIconEl.value, { y: 0, opacity: 1 });
  if (nextIconEl.value) gsap.set(nextIconEl.value, { y: 40, opacity: 0 });
  if (tooltip.value)
    gsap.set(tooltip.value, { opacity: 0, y: 10, visibility: "hidden" });
  // 延迟显示动画
  if (shouldRender.value && isHomePage.value) {
    nextTick(() => setTimeout(showFloatingButton, 100));
  }
  if (
    !storage.getItem("fabScrollHintShown") &&
    shouldRender.value &&
    isHomePage.value
  ) {
    setTimeout(showScrollHint, 1000);
    storage.setItem("fabScrollHintShown", "true");
  }
});

onUnmounted(() => {
  clearTooltipTimer();
  if (styleObserver) {
    styleObserver.disconnect();
    styleObserver = null;
  }
});
</script>

<style scoped>
.floating-action-container {
  position: fixed !important;
  bottom: 30px !important;
  right: 30px !important;
  z-index: 10000 !important;
  top: auto !important;
  left: auto !important;
  transform-origin: center center;
  isolation: isolate;
  clip: auto !important;
  clip-path: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  will-change: transform, opacity;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-button {
  position: relative;
  width: var(--fab-size, 60px) !important;
  height: var(--fab-size, 60px) !important;
  min-width: var(--fab-size, 60px) !important;
  min-height: var(--fab-size, 60px) !important;
  max-width: var(--fab-size, 60px) !important;
  max-height: var(--fab-size, 60px) !important;
  border-radius: 50%;
  background: var(--glass-bg, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  color: var(--accent-color, #007aff);
  cursor: pointer;
  display: flex !important;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  box-sizing: border-box !important;
  font-size: 0 !important;
  overflow: hidden !important;
  will-change: transform, opacity;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button:hover {
  background: var(--sidebar-item-hover-bg, var(--bg-tertiary));
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: var(--card-hover-transform);
}

.action-button:active {
  transform: scale(0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.icon-wrapper {
  position: absolute;
  color: var(--accent-color, #007aff);
  font-size: 24px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
  min-height: 24px !important;
  line-height: 1 !important;
}

.current-icon,
.next-icon {
  position: absolute;
  color: var(--accent-color, #007aff);
  font-size: 24px !important;
  width: 24px !important;
  height: 24px !important;
}

.function-tooltip {
  position: absolute;
  bottom: calc(var(--fab-size, 60px) + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-tooltip);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1001;
  box-shadow: var(--card-shadow);
  border: var(--card-border);
  visibility: hidden;
  opacity: 0;
}

.function-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--glass-bg);
}

.scroll-hint {
  position: fixed;
  bottom: 120px;
  right: 30px;
  z-index: 10000;
  pointer-events: none;
}

.scroll-hint-content {
  display: flex;
  align-items: center;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  color: var(--text-primary);
  padding: 12px 16px;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--card-shadow);
  border: var(--card-border);
}

.scroll-hint-icon {
  margin-right: 8px;
  font-size: 16px;
}

.scroll-hint-text {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .floating-action-container {
    bottom: 20px !important;
    right: 20px !important;
    --fab-size: 56px;
  }
  .action-button {
    width: var(--fab-size, 56px) !important;
    height: var(--fab-size, 56px) !important;
    min-width: var(--fab-size, 56px) !important;
    min-height: var(--fab-size, 56px) !important;
    max-width: var(--fab-size, 56px) !important;
    max-height: var(--fab-size, 56px) !important;
  }
  .current-icon,
  .next-icon {
    font-size: 22px !important;
  }
}

@media (max-width: 480px) {
  .floating-action-container {
    bottom: 15px !important;
    right: 15px !important;
    --fab-size: 50px;
  }
  .action-button {
    width: var(--fab-size, 50px) !important;
    height: var(--fab-size, 50px) !important;
    min-width: var(--fab-size, 50px) !important;
    min-height: var(--fab-size, 50px) !important;
    max-width: var(--fab-size, 50px) !important;
    max-height: var(--fab-size, 50px) !important;
  }
  .current-icon,
  .next-icon {
    font-size: 20px !important;
  }
}
</style>
