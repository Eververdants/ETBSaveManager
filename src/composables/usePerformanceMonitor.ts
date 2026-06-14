import { ref, onUnmounted, watch, type Ref, type WatchStopHandle } from "vue";
import { detectDevicePerformance, createPerformanceMonitor } from "../utils/performance";

import type { PerformanceMonitor } from "../utils/performance";

let monitorInitialized = false;
let globalPerformanceMonitor: PerformanceMonitor | null = null;
let globalCleanup: (() => void) | null = null;

interface PerformanceMonitorReturn {
  showPerformanceSettings: Ref<boolean>;
  performanceMode: Ref<string>;
  animationQuality: Ref<string>;
  hardwareAcceleration: Ref<boolean>;
  virtualizationEnabled: Ref<boolean>;
  initPerformanceMonitor: () => void;
  resetPerformanceMode: () => void;
  cleanup: () => void;
}

/**
 * Performance monitor composable
 */
export function usePerformanceMonitor(): PerformanceMonitorReturn {
  const showPerformanceSettings = ref(false);
  const performanceMode = ref("auto");
  const animationQuality = ref("medium");
  const hardwareAcceleration = ref(true);
  const virtualizationEnabled = ref(true);

  let cleanupDisplayWatcher: WatchStopHandle | null = null;

  const applyDisplayEffects = (): void => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.performanceMode = performanceMode.value || "auto";
    root.dataset.animationQuality = animationQuality.value || "medium";
  };

  const startDisplayWatcher = (): void => {
    if (cleanupDisplayWatcher) return;
    const stop = watch([performanceMode, animationQuality], () => applyDisplayEffects(), { immediate: true });
    cleanupDisplayWatcher = stop;
  };

  /**
   * Initialize performance monitor (singleton pattern)
   */
  const initPerformanceMonitor = (): void => {
    if (monitorInitialized) {
      startDisplayWatcher();
      return;
    }
    monitorInitialized = true;

    const devicePerf = detectDevicePerformance();
    const longTaskThreshold = devicePerf.isVeryLowEndDevice ? 30 : 50;
    const fpsThreshold = devicePerf.isVeryLowEndDevice ? 20 : 30;
    let longTaskCount = 0;
    let isLowPerfMode = false;

    globalPerformanceMonitor = createPerformanceMonitor({
      longTaskThreshold,
      fpsThreshold,
      onLowPerformance: () => {
        performanceMode.value = "low";
        animationQuality.value = "low";
        console.log("检测到性能问题，已切换到低性能模式");
        isLowPerfMode = true;
      },
      onPerformanceRecovery: () => {
        if (performanceMode.value === "low") {
          performanceMode.value = "auto";
          animationQuality.value = "medium";
          console.log("性能已恢复，已切换到自动性能模式");
          isLowPerfMode = false;
        }
      },
      onFPSUpdate: (fps: number) => {
        if (fps < fpsThreshold && fps > 0) {
          longTaskCount++;
          if (longTaskCount >= 3 && !isLowPerfMode) {
            console.warn(`检测到帧率过低 (${fps} FPS)，自动切换到低性能模式`);
            performanceMode.value = "low";
            animationQuality.value = "low";
            isLowPerfMode = true;
            longTaskCount = 0;
          }
        } else {
          if (longTaskCount > 0) {
            longTaskCount = Math.max(0, longTaskCount - 1);
          }
        }
      },
    });

    globalPerformanceMonitor.start();

    if (devicePerf.isLowEndDevice) {
      performanceMode.value = "low";
      animationQuality.value = "low";
    } else if (devicePerf.performanceLevel === "high") {
      performanceMode.value = "auto";
      animationQuality.value = "high";
    }
    if (devicePerf.prefersReducedMotion) {
      animationQuality.value = "disabled";
    }
    startDisplayWatcher();
  };

  /**
   * Reset performance mode
   */
  const resetPerformanceMode = (): void => {
    performanceMode.value = "normal";
  };

  /**
   * Clean up resources
   */
  const cleanup = (): void => {
    if (globalPerformanceMonitor) {
      globalPerformanceMonitor.stop();
      globalPerformanceMonitor = null;
    }

    if (cleanupDisplayWatcher) {
      cleanupDisplayWatcher();
      cleanupDisplayWatcher = null;
    }
    monitorInitialized = false;
  };

  return {
    showPerformanceSettings,
    performanceMode,
    animationQuality,
    hardwareAcceleration,
    virtualizationEnabled,
    initPerformanceMonitor,
    resetPerformanceMode,
    cleanup,
  };
}
