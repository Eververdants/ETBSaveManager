<template>
  <teleport to="body">
    <div
      v-show="shouldRender"
      ref="floatingActionContainer"
      class="floating-action-container"
      :class="$attrs.class"
      @mouseenter="handleContainerMouseEnter"
      @mouseleave="handleContainerMouseLeave"
    >
      <div ref="tooltip" class="function-tooltip">
        <span class="tooltip-text">{{ getCurrentTooltip }}</span>
      </div>
      <div
        ref="actionButton"
        class="action-button"
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @wheel="handleWheel"
        @click="handleClick"
      >
        <div ref="currentIconEl" class="icon-wrapper current-icon">
          <font-awesome-icon :icon="['fas', displayIcon]" />
        </div>
        <div ref="nextIconEl" class="icon-wrapper next-icon">
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
import storage from "../../services/storageService";

defineOptions({ inheritAttrs: false });

const { t } = useI18n({ useScope: "global" });
const route = useRoute();
const emit = defineEmits(["search-click", "folder-click", "refresh-click", "multi-select-click"]);

// DOM refs
const actionButton = ref(null);
const currentIconEl = ref(null);
const nextIconEl = ref(null);
const tooltip = ref(null);
const floatingActionContainer = ref(null);

// State
const icons = ["search", "folder", "refresh", "multi-select-delete"];
const currentIndex = ref(0);
const displayIndex = ref(0); // Currently displayed icon index
const nextDisplayIndex = ref(1); // Next icon index
const isHovered = ref(false);
const isAnimating = ref(false);
let tooltipTimer = null;
let styleObserver = null;

// Scroll-hide configuration
const getScrollHideConfig = () => {
  const width = window.innerWidth;
  if (width <= 480) {
    return { triggerThreshold: 250, maxTranslateY: 120 };
  } else if (width <= 768) {
    return { triggerThreshold: 300, maxTranslateY: 140 };
  }
  return { triggerThreshold: 350, maxTranslateY: 160 };
};

let scrollListener = null;

const getArchiveScrollBottom = () => {
  // First check the virtual-scroll container (archive list)
  const archiveEl = document.querySelector(".archive-list-container");
  if (archiveEl && archiveEl.scrollHeight > archiveEl.clientHeight) {
    const scrollBottom = archiveEl.scrollHeight - archiveEl.scrollTop - archiveEl.clientHeight;
    return { scrollBottom, canScroll: true };
  }
  // Fallback: check main-content (the actual page scroll container)
  const mainEl = document.querySelector(".main-content");
  if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
    const scrollBottom = mainEl.scrollHeight - mainEl.scrollTop - mainEl.clientHeight;
    return { scrollBottom, canScroll: true };
  }
  return { scrollBottom: 0, canScroll: false };
};

const updateFabPosition = () => {
  const container = floatingActionContainer.value;
  if (!container) return;

  const config = getScrollHideConfig();
  const { scrollBottom, canScroll } = getArchiveScrollBottom();

  // If content doesn't overflow (no scroll possible), always show the FAB
  if (!canScroll) {
    container.classList.remove("fab-scroll-hidden");
    return;
  }

  // Calculate movement progress
  const progress = Math.max(0, Math.min(1, 1 - scrollBottom / config.triggerThreshold));

  // At the bottom: hide the FAB so it doesn't block card buttons
  container.classList.toggle("fab-scroll-hidden", progress >= 1);
};

// Mapping configuration
const iconMap = {
  search: "magnifying-glass",
  folder: "folder",
  refresh: "arrow-rotate-right",
  "multi-select-delete": "trash-alt",
};
const tooltipKeys = {
  search: "floatingButton.searchArchive",
  folder: "floatingButton.openFolder",
  refresh: "floatingButton.refreshList",
  "multi-select-delete": "floatingButton.multiSelectDelete",
};
const eventMap = {
  search: "search-click",
  folder: "folder-click",
  refresh: "refresh-click",
  "multi-select-delete": "multi-select-click",
};

// Common GSAP config
const gsapDefaults = {
  ease: "power2.out",
  force3D: false,
  immediateRender: false,
};

// Container fixed styles
const containerStyles = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
  top: "auto",
  left: "auto",
  margin: "0",
  padding: "0",
};

const isHomePage = computed(() => route.name === "Home");
const shouldRender = ref(isHomePage.value); // Controls whether DOM is rendered
const isVisible = ref(isHomePage.value); // Controls animation state
const displayIcon = computed(() => iconMap[icons[displayIndex.value]] || "magnifying-glass");
const nextIcon = computed(() => iconMap[icons[nextDisplayIndex.value]] || "magnifying-glass");
const getCurrentTooltip = computed(() => `${t(tooltipKeys[icons[currentIndex.value]] || tooltipKeys.search)} · ${t("floatingButton.scrollTooltip")}`);

const applyContainerStyles = (container, extra = {}) => {
  if (!container) return;
  Object.entries({ ...containerStyles, ...extra }).forEach(([k, v]) => container.style.setProperty(k, v, "important"));
};

// Animation state flag, prevents styleObserver from interfering with animations
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
    },
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
      shouldRender.value = false; // Only remove DOM after animation completes
      isTransitioning = false;
    },
  });
};

watch(isHomePage, (newVal, oldVal) => {
  if (newVal === oldVal) return;
  if (newVal) {
    // Entering Home page: render DOM first, then play show animation
    shouldRender.value = true;
    isVisible.value = true;
    nextTick(() => setTimeout(showFloatingButton, 100));
  } else {
    // Leaving Home page: play hide animation first, then remove DOM
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

const handleContainerMouseEnter = () => {
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

const handleContainerMouseLeave = () => {
  isHovered.value = false;
  clearTooltipTimer();

  gsap.killTweensOf(tooltip.value);
  gsap.killTweensOf(actionButton.value);
  gsap.set(actionButton.value, { clearProps: "transform" });

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
  const newIndex = (currentIndex.value + direction + icons.length) % icons.length;

  // Set next icon index
  nextDisplayIndex.value = newIndex;

  gsap.killTweensOf(currentIconEl.value);
  gsap.killTweensOf(nextIconEl.value);
  gsap.killTweensOf(tooltip.value);

  // Fade out/in tooltip
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

  // Set next icon initial position (entering from below)
  gsap.set(nextIconEl.value, { y: direction * 40, opacity: 1 });

  // Current icon slides out + next icon slides in (synchronized)
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
      // After animation, update display index and reset positions
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
    onComplete: () => {
      gsap.set(actionButton.value, { clearProps: "transform" });
    },
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
  hint.innerHTML = `<div class="scroll-hint-content"><div class="scroll-hint-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="5" ry="5"/><line x1="12" y1="6" x2="12" y2="10"/></svg></div><div class="scroll-hint-text">${t(
    "floatingButton.scrollHint",
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
    },
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
    // Skip during active transitions
    if (isTransitioning) return;
    for (const m of mutations) {
      if (m.type !== "attributes" || m.attributeName !== "style") continue;
      // Only check positioning properties, not transform/opacity/visibility
      const needsRestore = Object.entries(expected).some(([k, v]) => {
        const c = container.style.getPropertyValue(k);
        return c && c !== v;
      });
      if (needsRestore) Object.entries(expected).forEach(([k, v]) => container.style.setProperty(k, v, "important"));
    }
  });
  styleObserver.observe(container, {
    attributes: true,
    attributeFilter: ["style"],
    attributeOldValue: true,
  });
};

onMounted(() => {
  const container = floatingActionContainer.value;
  if (container) {
    // Initial state: hidden
    gsap.set(container, { opacity: 0, scale: 0.8, y: 20 });
    applyContainerStyles(container, {
      "z-index": "10000",
      isolation: "isolate",
    });
    initStyleObserver(container);
  }
  // Initialize: current icon visible, next icon hidden below
  if (currentIconEl.value) gsap.set(currentIconEl.value, { y: 0, opacity: 1 });
  if (nextIconEl.value) gsap.set(nextIconEl.value, { y: 40, opacity: 0 });
  if (tooltip.value) gsap.set(tooltip.value, { opacity: 0, y: 10, visibility: "hidden" });
  // Delayed show animation
  if (shouldRender.value && isHomePage.value) {
    nextTick(() => setTimeout(showFloatingButton, 100));
  }
  if (!storage.getItem("fabScrollHintShown") && shouldRender.value && isHomePage.value) {
    setTimeout(showScrollHint, 1000);
    storage.setItem("fabScrollHintShown", "true");
  }
  // Add scroll listener — use window with capture to catch ALL scroll events
  scrollListener = () => {
    requestAnimationFrame(updateFabPosition);
  };
  window.addEventListener("scroll", scrollListener, { passive: true, capture: true });
  updateFabPosition();

  // Disconnect styleObserver after brief delay to avoid interfering with transform animations
  setTimeout(() => {
    if (styleObserver) {
      styleObserver.disconnect();
      styleObserver = null;
    }
  }, 500);
});

onUnmounted(() => {
  clearTooltipTimer();
  if (styleObserver) {
    styleObserver.disconnect();
    styleObserver = null;
  }
  if (scrollListener) {
    window.removeEventListener("scroll", scrollListener, { capture: true });
    scrollListener = null;
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
  contain: layout;
  clip: auto !important;
  clip-path: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scroll to bottom: slide FAB off-screen below the viewport */
.floating-action-container.fab-scroll-hidden {
  transform: translateY(160px) !important;
}

.action-button {
  position: relative;
  width: var(--fab-size, 60px) !important;
  height: var(--fab-size, 60px) !important;
  min-width: var(--fab-size, 60px) !important;
  min-height: var(--fab-size, 60px) !important;
  max-width: var(--fab-size, 60px) !important;
  max-height: var(--fab-size, 60px) !important;
  border-radius: var(--radius-circle);
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
  background: var(--bg-tertiary);
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
  position: absolute !important;
  top: auto !important;
  bottom: 100% !important;
  left: auto !important;
  right: 0 !important;
  margin-bottom: 10px !important;
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
  right: 12px;
  left: auto;
  transform: translateX(0);
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
