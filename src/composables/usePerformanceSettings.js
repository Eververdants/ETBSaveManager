import { ref, watch, onMounted, onUnmounted } from "vue";
import { detectDevicePerformance } from "@/utils/performance";

export function usePerformanceSettings(props, emit, t) {
  const localPerformanceMode = ref(props.performanceMode);
  const localAnimationQuality = ref(props.animationQuality);
  const localHardwareAcceleration = ref(props.hardwareAcceleration);
  const localVirtualizationEnabled = ref(props.virtualizationEnabled);

  const deviceInfo = ref(detectDevicePerformance());

  const currentFPS = ref(60);
  const longTaskCount = ref(0);
  let frameCount = 0;
  let lastTime = performance.now();
  let fpsMonitorInterval = null;
  let longTaskObserver = null;

  watch(
    () => props.performanceMode,
    (newVal) => {
      localPerformanceMode.value = newVal;
    }
  );

  watch(
    () => props.animationQuality,
    (newVal) => {
      localAnimationQuality.value = newVal;
    }
  );

  watch(
    () => props.hardwareAcceleration,
    (newVal) => {
      localHardwareAcceleration.value = newVal;
    }
  );

  watch(
    () => props.virtualizationEnabled,
    (newVal) => {
      localVirtualizationEnabled.value = newVal;
    }
  );

  const updatePerformanceMode = () => {
    emit("update:performanceMode", localPerformanceMode.value);
  };

  const updateAnimationQuality = () => {
    emit("update:animationQuality", localAnimationQuality.value);
  };

  const updateHardwareAcceleration = () => {
    emit("update:hardwareAcceleration", localHardwareAcceleration.value);
  };

  const updateVirtualization = () => {
    emit("update:virtualizationEnabled", localVirtualizationEnabled.value);
  };

  const getPerformanceLevelText = (level) => {
    switch (level) {
      case "high":
        return t("common.high");
      case "medium":
        return t("common.medium");
      case "low":
        return t("common.low");
      default:
        return t("common.unknown");
    }
  };

  const startPerformanceMonitoring = () => {
    const monitorFPS = () => {
      frameCount++;
      const now = performance.now();

      if (now - lastTime >= 1000) {
        currentFPS.value = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
      }

      if (fpsMonitorInterval) {
        fpsMonitorInterval = requestAnimationFrame(monitorFPS);
      }
    };

    fpsMonitorInterval = requestAnimationFrame(monitorFPS);

    if ("PerformanceObserver" in window) {
      try {
        longTaskObserver = new PerformanceObserver((list) => {
          longTaskCount.value = list.getEntries().length;
        });

        longTaskObserver.observe({ entryTypes: ["longtask"] });
      } catch (e) {
        console.warn("长任务监控不支持:", e);
      }
    }
  };

  const stopPerformanceMonitoring = () => {
    if (fpsMonitorInterval) {
      cancelAnimationFrame(fpsMonitorInterval);
      fpsMonitorInterval = null;
    }

    if (longTaskObserver) {
      longTaskObserver.disconnect();
      longTaskObserver = null;
    }
  };

  onMounted(() => {
    startPerformanceMonitoring();
  });

  onUnmounted(() => {
    stopPerformanceMonitoring();
  });

  return {
    localPerformanceMode,
    localAnimationQuality,
    localHardwareAcceleration,
    localVirtualizationEnabled,
    deviceInfo,
    currentFPS,
    longTaskCount,
    updatePerformanceMode,
    updateAnimationQuality,
    updateHardwareAcceleration,
    updateVirtualization,
    getPerformanceLevelText,
  };
}
