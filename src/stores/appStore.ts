/**
 * App-level shared state store
 * Replaces window.dispatchEvent / addEventListener pattern for cross-component communication.
 * Single source of truth for: language, developer mode, performance monitor, log menu, test archive.
 */
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import storage from "@/services/storageService";

export const useAppStore = defineStore("app", () => {
  // ─── State ────────────────────────────────────────────
  const language = ref<string>(storage.getItem("language", "zh-CN") ?? "zh-CN");
  const performanceMonitorEnabled = ref<boolean>(storage.getItem("performanceMonitor") ?? true);
  const developerModeEnabled = ref<boolean>(!!storage.getItem("developerMode", false));
  const logMenuEnabled = ref<boolean>(!!storage.getItem("logMenuEnabled", false));
  const testArchiveEnabled = ref<boolean>(!!storage.getItem("testArchiveEnabled", false));

  // Persist to storage on change
  watch(language, (val) => storage.setItem("language", val));
  watch(performanceMonitorEnabled, (val) => storage.setItem("performanceMonitor", val));
  watch(developerModeEnabled, (val) => storage.setItem("developerMode", val));
  watch(logMenuEnabled, (val) => storage.setItem("logMenuEnabled", val));
  watch(testArchiveEnabled, (val) => storage.setItem("testArchiveEnabled", val));

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

  function setLogMenu(enabled: boolean) {
    logMenuEnabled.value = enabled;
  }

  function setTestArchive(enabled: boolean) {
    testArchiveEnabled.value = enabled;
  }

  /** Disable all sub-settings that depend on developer mode */
  function disableDeveloperSubSettings() {
    logMenuEnabled.value = false;
    storage.setItem("logMenuEnabled", false);

    performanceMonitorEnabled.value = false;
    storage.setItem("performanceMonitor", false);

    testArchiveEnabled.value = false;
    storage.setItem("testArchiveEnabled", false);
  }

  return {
    language,
    performanceMonitorEnabled,
    developerModeEnabled,
    logMenuEnabled,
    testArchiveEnabled,
    setLanguage,
    setPerformanceMonitor,
    setDeveloperMode,
    setLogMenu,
    setTestArchive,
    disableDeveloperSubSettings,
  };
});
