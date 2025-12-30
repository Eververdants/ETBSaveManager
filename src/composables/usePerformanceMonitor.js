import { ref, onUnmounted } from "vue";
import {
  detectDevicePerformance,
  createPerformanceMonitor,
} from "../utils/performance.js";

/**
 * 性能监控 composable
 */
export function usePerformanceMonitor() {
  // 性能设置状态
  const showPerformanceSettings = ref(false);
  const performanceMode = ref("auto");
  const animationQuality = ref("medium");
  const hardwareAcceleration = ref(true);
  const virtualizationEnabled = ref(true);

  // 监控实例
  let performanceMonitor = null;
  let cleanupPerformanceObserver = null;
  let longTaskObserver = null;
  let longTaskCount = 0;
  let fpsCheckTimer = null;

  const LONG_TASK_THRESHOLD = 50;
  const LONG_TASK_LIMIT = 3;

  /**
   * 初始化性能观察器
   */
  const initPerformanceObserver = () => {
    if (
      !("PerformanceObserver" in window) ||
      !("PerformanceLongTaskTiming" in window)
    ) {
      console.warn("Performance Observer or Long Task Timing not supported");
      return null;
    }

    const devicePerf = detectDevicePerformance();
    const longTaskThreshold = devicePerf.isVeryLowEndDevice ? 30 : 50;
    const fpsThreshold = devicePerf.isVeryLowEndDevice ? 20 : 30;

    longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > longTaskThreshold) {
          longTaskCount++;
          if (longTaskCount >= LONG_TASK_LIMIT) {
            performanceMode.value = "low";
            setTimeout(() => {
              longTaskCount = 0;
            }, 1000);
          }
        }
      });
    });

    longTaskObserver.observe({ entryTypes: ["longtask"] });

    // 帧率监控
    let lastTime = performance.now();
    let frameCount = 0;
    let lowFpsCount = 0;
    let isLowPerfMode = false;

    const checkFPS = () => {
      const now = performance.now();
      frameCount++;

      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));

        if (fps < fpsThreshold) {
          lowFpsCount++;
          if (
            lowFpsCount >= 3 &&
            performanceMode.value !== "low" &&
            !isLowPerfMode
          ) {
            console.warn(`检测到帧率过低 (${fps} FPS)，自动切换到低性能模式`);
            performanceMode.value = "low";
            isLowPerfMode = true;
          }
        } else {
          if (lowFpsCount > 0) {
            lowFpsCount = Math.max(0, lowFpsCount - 1);
          }

          if (fps > 45 && isLowPerfMode && lowFpsCount === 0) {
            console.log(`帧率已恢复 (${fps} FPS)，恢复到自动性能模式`);
            performanceMode.value = "auto";
            isLowPerfMode = false;
          }
        }

        frameCount = 0;
        lastTime = now;
      }

      fpsCheckTimer = requestAnimationFrame(checkFPS);
    };

    fpsCheckTimer = requestAnimationFrame(checkFPS);

    return () => {
      if (longTaskObserver) {
        longTaskObserver.disconnect();
        longTaskObserver = null;
      }
      if (fpsCheckTimer) {
        cancelAnimationFrame(fpsCheckTimer);
      }
    };
  };

  /**
   * 初始化性能监控
   */
  const initPerformanceMonitor = () => {
    cleanupPerformanceObserver = initPerformanceObserver();

    performanceMonitor = createPerformanceMonitor({
      onLowPerformance: () => {
        performanceMode.value = "low";
        animationQuality.value = "low";
        console.log("检测到性能问题，已切换到低性能模式");
      },
      onPerformanceRecovery: () => {
        if (performanceMode.value === "low") {
          performanceMode.value = "auto";
          animationQuality.value = "medium";
          console.log("性能已恢复，已切换到自动性能模式");
        }
      },
      onFPSUpdate: (fps) => {
        if (fps < 30 && fps > 0) {
          console.warn(`当前帧率较低: ${fps} FPS`);
        }
      },
    });

    performanceMonitor.start();

    // 检测设备性能并设置初始性能模式
    const devicePerf = detectDevicePerformance();
    if (devicePerf.isLowEndDevice) {
      performanceMode.value = "low";
      animationQuality.value = "low";
    } else if (devicePerf.performanceLevel === "high") {
      performanceMode.value = "auto";
      animationQuality.value = "high";
    }
  };

  /**
   * 重置性能模式
   */
  const resetPerformanceMode = () => {
    performanceMode.value = "normal";
    longTaskCount = 0;
  };

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (performanceMonitor) {
      performanceMonitor.stop();
      performanceMonitor = null;
    }

    if (cleanupPerformanceObserver) {
      cleanupPerformanceObserver();
    }

    if (longTaskObserver) {
      longTaskObserver.disconnect();
      longTaskObserver = null;
    }
  };

  return {
    // 状态
    showPerformanceSettings,
    performanceMode,
    animationQuality,
    hardwareAcceleration,
    virtualizationEnabled,
    // 方法
    initPerformanceMonitor,
    resetPerformanceMode,
    cleanup,
  };
}
