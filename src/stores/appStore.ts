/**
 * App-level shared state store
 * Replaces window.dispatchEvent / addEventListener pattern for cross-component communication.
 * Single source of truth for: language, developer mode, performance monitor, sidebar/titlebar visibility.
 */
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import storage from "@/services/storageService";

export const useAppStore = defineStore("app", () => {
  // ─── State ────────────────────────────────────────────
  const language = ref<string>(storage.getItem("language", "zh-CN") ?? "zh-CN");
  const performanceMonitorEnabled = ref<boolean>(storage.getItem("performanceMonitor") ?? false);
  const developerModeEnabled = ref<boolean>(!!storage.getItem("developerMode", false));
  const sidebarVisible = ref<boolean>(true);
  const titleBarVisible = ref<boolean>(true);

  // Persist to storage on change
  watch(language, (val) => storage.setItem("language", val));
  watch(performanceMonitorEnabled, (val) => storage.setItem("performanceMonitor", val));
  watch(developerModeEnabled, (val) => storage.setItem("developerMode", val));

  // ─── Actions ──────────────────────────────────────────

  function setLanguage(lang: string) {
    language.value = lang;
  }

  function setPerformanceMonitor(enabled: boolean) {
    performanceMonitorEnabled.value = enabled;
  }

  function setDeveloperMode(enabled: boolean) {
    developerModeEnabled.value = enabled;

    if (!enabled) {
      disableDeveloperSubSettings();
    }
  }

  /** Disable all sub-settings that depend on developer mode */
  function disableDeveloperSubSettings() {
    performanceMonitorEnabled.value = false;
    storage.setItem("performanceMonitor", false);
  }

  function toggleSidebar() {
    sidebarVisible.value = !sidebarVisible.value;
  }

  function toggleTitleBar() {
    titleBarVisible.value = !titleBarVisible.value;
  }

  return {
    language,
    performanceMonitorEnabled,
    developerModeEnabled,
    sidebarVisible,
    titleBarVisible,
    setLanguage,
    setPerformanceMonitor,
    setDeveloperMode,
    disableDeveloperSubSettings,
    toggleSidebar,
    toggleTitleBar,
  };
});
