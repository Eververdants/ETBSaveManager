<script setup>
import { ref, onMounted, onUnmounted, shallowRef, computed, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import storage from "./services/storageService";
import PerformanceMonitor from "./components/system/PerformanceMonitor.vue";
import AutoFeedbackConsentModal from "./components/modal/AutoFeedbackConsentModal.vue";
import GlobalSearchPanel from "./components/feature/GlobalSearchPanel.vue";
import { isSeasonalThemeAvailable } from "./config/seasonalThemeConfig";

const Sidebar = shallowRef(null);
const TitleBar = shallowRef(null);

import SidebarComponent from "./components/layout/Sidebar.vue";
import TitleBarComponent from "./components/layout/TitleBar.vue";

Sidebar.value = SidebarComponent;
TitleBar.value = TitleBarComponent;

const router = useRouter();
const route = useRoute();
const sidebarExpanded = ref(false);
const showGlobalSearch = ref(false);
const globalSearchRef = ref(null);
const normalizeBool = (value) => value === true || value === "true";
const performanceMonitorEnabled = ref(normalizeBool(storage.getItem("performanceMonitor", false)));
const developerModeEnabled = ref(normalizeBool(storage.getItem("developerMode", false)));
const shouldShowPerformanceMonitor = computed(() => performanceMonitorEnabled.value && developerModeEnabled.value);

const showAutoFeedbackConsent = ref(false);
const autoFeedbackConsentShown = ref(false);

const CONSENT_KEY = "autoFeedbackConsentShown";

function checkAndShowAutoFeedbackConsent() {
  const alreadyShown = storage.getItem(CONSENT_KEY, false);
  if (alreadyShown) {
    return;
  }
  showAutoFeedbackConsent.value = true;
}

function handleAutoFeedbackAccept() {
  storage.setItem("autoFeedbackEnabled", true);
  storage.setItem(CONSENT_KEY, true);
  window.dispatchEvent(
    new CustomEvent("auto-feedback-toggle", {
      detail: { enabled: true },
    }),
  );
}

function handleAutoFeedbackDecline() {
  storage.setItem("autoFeedbackEnabled", false);
  storage.setItem(CONSENT_KEY, true);
  window.dispatchEvent(
    new CustomEvent("auto-feedback-toggle", {
      detail: { enabled: false },
    }),
  );
}

const cachedComponents = ["Home", "Settings", "CreateArchive", "PluginMarket", "CoreArchive", "Log"];
const excludedComponents = ["BatchCreateArchive", "EditArchive", "SteamCache"];

const handleSidebarExpand = (expanded) => {
  sidebarExpanded.value = expanded;
};

const closeGlobalSearch = () => {
  showGlobalSearch.value = false;
};

const openHomeSearch = (mode = "open") => {
  window.dispatchEvent(
    new CustomEvent("open-archive-search", {
      detail: { source: "shortcut", mode },
    }),
  );
};

const openGlobalSearch = ({ navigate = false, backward = false } = {}) => {
  showGlobalSearch.value = true;
  nextTick(() => {
    const panel = globalSearchRef.value;
    if (!panel) return;

    if (navigate) {
      if (backward) {
        panel.findPrevious();
      } else {
        panel.findNext();
      }
      return;
    }

    if (panel.focusInput) {
      panel.focusInput();
    }
  });
};

const handleFindShortcut = () => {
  if (route.name === "Home") {
    closeGlobalSearch();
    openHomeSearch("toggle");
    return;
  }

  if (showGlobalSearch.value) {
    closeGlobalSearch();
    return;
  }

  openGlobalSearch({ navigate: false });
};

const handleFindNavigateShortcut = (backward = false) => {
  if (route.name === "Home") {
    closeGlobalSearch();
    openHomeSearch("open");
    return;
  }
  openGlobalSearch({ navigate: true, backward });
};

const handleGlobalKeydown = (event) => {
  const key = String(event.key || "").toLowerCase();
  const isFindShortcut = (event.ctrlKey || event.metaKey) && key === "f";

  if (isFindShortcut) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
    handleFindShortcut();
    return;
  }

  if (event.key === "F3") {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") {
      event.stopImmediatePropagation();
    }
    if (route.name === "Home") {
      closeGlobalSearch();
      openHomeSearch("toggle");
      return;
    }
    if (showGlobalSearch.value) {
      closeGlobalSearch();
      return;
    }
    openGlobalSearch({ navigate: false });
  }
};

const handleFindEventFromLock = () => {
  handleFindShortcut();
};

const handleFindNextEventFromLock = (event) => {
  handleFindNavigateShortcut(!!event?.detail?.backward);
};

let mainContentCache = null;

const getMainContent = () => {
  if (!mainContentCache) {
    mainContentCache = document.querySelector(".main-content");
  }
  return mainContentCache;
};

onMounted(() => {
  document.addEventListener("keydown", handleGlobalKeydown, true);
  window.addEventListener("app-global-find", handleFindEventFromLock);
  window.addEventListener("app-global-find-next", handleFindNextEventFromLock);

  window.addEventListener("performance-monitor-toggle", (event) => {
    performanceMonitorEnabled.value = !!event.detail?.enabled;
  });
  window.addEventListener("developer-mode-changed", (event) => {
    developerModeEnabled.value = !!event.detail?.enabled;
    if (!developerModeEnabled.value) {
      performanceMonitorEnabled.value = false;
    }
  });

  window.addEventListener("sidebar-route-change", (event) => {
    const routeName = event.detail.route;
    if (routeName && router.hasRoute(routeName)) {
      router.push({ name: routeName });
    }
  });

  router.afterEach((to, from) => {
    if (to.name !== from.name) {
      const mainContent = getMainContent();
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    }
  });

  requestIdleCallback(
    () => {
      initThemeSystem();
      checkAndShowAutoFeedbackConsent();
    },
    { timeout: 1000 },
  );
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleGlobalKeydown, true);
  window.removeEventListener("app-global-find", handleFindEventFromLock);
  window.removeEventListener("app-global-find-next", handleFindNextEventFromLock);
  mainContentCache = null;
});

watch(
  () => route.fullPath,
  () => {
    closeGlobalSearch();
  },
);

async function initThemeSystem() {
  if (!storage.isInitialized()) {
    await storage.initStorage();
  }

  const isSeasonalTheme = (id) => ["new-year", "spring-festival-dark", "spring-festival-light"].includes(id);

  const seasonalMode = storage.getItem("seasonalThemeMode") || "auto";
  const isSeasonalAvailable = (id) => isSeasonalThemeAvailable(id, { mode: seasonalMode });

  let theme = storage.getItem("theme") || window.__initialTheme || "light";

  const initialTheme = window.__initialTheme;

  if (isSeasonalTheme(theme) && !isSeasonalAvailable(theme)) {
    theme = storage.getItem("themeBeforeNewYear") || "light";
    storage.setItem("theme", theme);
  }

  if (window.themeManager) {
    window.themeManager.setTheme(theme);
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }

  if (theme !== initialTheme) {
    updateBodyBackground(theme);
  }
}

function updateBodyBackground(theme) {
  const body = document.body;
  if (!body) return;

  const bgColors = {
    dark: "#1c1c1e",
    light: "#f8f9fa",
    "new-year": "#1a0a0a",
    "spring-festival-dark": "#1c0a14",
    "spring-festival-light": "#fefce8",
  };

  const bg = bgColors[theme] || bgColors["light"];
  body.style.backgroundColor = bg;

  setTimeout(() => {
    body.style.backgroundColor = "";
  }, 100);
}
</script>

<template>
  <div class="app-container">
    <component :is="TitleBar" v-if="TitleBar" />
    <PerformanceMonitor v-if="shouldShowPerformanceMonitor" class="performance-monitor" />
    <GlobalSearchPanel ref="globalSearchRef" :visible="showGlobalSearch" @close="closeGlobalSearch" />
    <AutoFeedbackConsentModal
      :show="showAutoFeedbackConsent"
      :title="$t('settings.autoFeedbackConsent.title')"
      :message="$t('settings.autoFeedbackConsent.message')"
      @accept="handleAutoFeedbackAccept"
      @decline="handleAutoFeedbackDecline"
    />
    <div class="content-wrapper">
      <component :is="Sidebar" v-if="Sidebar" @sidebar-expand="handleSidebarExpand" />
      <main
        class="main-content"
        :class="{
          'sidebar-collapsed': !sidebarExpanded,
          'sidebar-expanded': sidebarExpanded,
        }"
      >
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
/* Modal window animation - optimized performance */
.modal-enter-active,
.modal-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: opacity, transform;
  transform: translateZ(0);
  /* Force hardware acceleration */
  backface-visibility: hidden;
  /* Prevent layer flickering */
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
  transition:
    opacity 0.3s ease,
    backdrop-filter 0.3s ease;
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
/* Page transition animation - unified fade effect */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease !important;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0 !important;
}

/* Global base style reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Global border radius */
body {
  font-family: -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", sans-serif;
  background: var(--app-bg, var(--bg));
  color: var(--text);
  transition:
    background 0.3s ease,
    color 0.3s ease;
  overflow: hidden;
  cursor: default;
  /* Remove transform to prevent affecting fixed-position elements */
  /* transform: translateZ(0); */
  /* will-change: transform; */
}

#app {
  height: 100vh;
  overflow: hidden;
}

/* Global button border radius */
button,
.btn,
[role="button"] {
  border-radius: var(--radius-button);
}

/* Global input border radius */
input,
textarea,
select {
  border-radius: var(--radius-input);
}

/* Global card border radius */
.card,
.archive-card,
.level-card,
.modal-card,
.dropdown-content {
  border-radius: var(--radius-card);
}

/* Global tag border radius */
.tag,
.badge,
.label {
  border-radius: var(--radius-tag);
}

/* Global modal border radius */
.modal,
.dialog,
.popup {
  border-radius: var(--radius-modal);
}

/* Global dropdown border radius */
.dropdown,
.menu,
.context-menu {
  border-radius: var(--radius-dropdown);
}

/* Global tooltip border radius */
.tooltip,
.popover {
  border-radius: var(--radius-tooltip);
}

/* Global image container border radius */
.image-container,
.avatar,
.icon-container {
  border-radius: var(--radius-image);
}

/* Hide all scrollbars while keeping scroll functionality */
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
  /* IE and Edge */
}

/* Global floating button style - ensure fixed positioning */
.floating-action-container {
  position: fixed !important;
  bottom: 30px !important;
  right: 30px !important;
  z-index: 10000 !important;

  /* Ensure viewport-relative positioning */
  top: auto !important;
  left: auto !important;

  /* Prevent any transform interference */
  transform: none !important;
  transform-origin: initial !important;
  backface-visibility: visible !important;
  perspective: none !important;

  /* Prevent animation interference - keep transform transition */
  animation: none !important;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  will-change: auto !important;

  /* Apply border radius */
  border-radius: var(--radius-pill);

  /* Ensure initial visibility */
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
