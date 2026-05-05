import { ref, onUnmounted, watch } from "vue";
import {
  detectDevicePerformance,
  createPerformanceMonitor,
} from "../utils/performance.js";

let monitorInitialized = false;
let globalPerformanceMonitor = null;
let globalCleanup = null;

/**
 * 性能监控 composable
 */
export function usePerformanceMonitor() {
  const showPerformanceSettings = ref(false);
  const performanceMode = ref("auto");
  const animationQuality = ref("medium");
  const hardwareAcceleration = ref(true);
  const virtualizationEnabled = ref(true);

  let cleanupDisplayWatcher = null;

  const applyDisplayEffects = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.performanceMode = performanceMode.value || "auto";
    root.dataset.animationQuality = animationQuality.value || "medium";
  };

  const startDisplayWatcher = () => {
    if (cleanupDisplayWatcher) return;
    const stop = watch(
      [performanceMode, animationQuality],
      () => applyDisplayEffects(),
      { immediate: true }
    );
    cleanupDisplayWatcher = stop;
  };

  /**
   * 初始化性能监控（单例模式）
   */
  const initPerformanceMonitor = () => {
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
      onFPSUpdate: (fps) => {
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
   * 重置性能模式
   */
  const resetPerformanceMode = () => {
    performanceMode.value = "normal";
  };

  /**
   * 清理资源
   */
  const cleanup = () => {
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
