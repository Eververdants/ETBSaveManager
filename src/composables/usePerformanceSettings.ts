import { ref, watch, onMounted, onUnmounted } from "vue";
import { detectDevicePerformance } from "@/utils/performance";
import type { Ref } from "vue";
import type { DevicePerformanceInfo } from "@/types";

interface PerformanceSettingsProps {
  performanceMode: string;
  animationQuality: string;
  hardwareAcceleration: boolean;
  virtualizationEnabled: boolean;
}

type EmitFn = (event: string, value: unknown) => void;
type TranslateFn = (key: string) => string;

interface PerformanceSettingsReturn {
  localPerformanceMode: Ref<string>;
  localAnimationQuality: Ref<string>;
  localHardwareAcceleration: Ref<boolean>;
  localVirtualizationEnabled: Ref<boolean>;
  deviceInfo: Ref<DevicePerformanceInfo>;
  currentFPS: Ref<number>;
  longTaskCount: Ref<number>;
  updatePerformanceMode: () => void;
  updateAnimationQuality: () => void;
  updateHardwareAcceleration: () => void;
  updateVirtualization: () => void;
  getPerformanceLevelText: (level: string) => string;
}

export function usePerformanceSettings(
  props: PerformanceSettingsProps,
  emit: EmitFn,
  t: TranslateFn,
): PerformanceSettingsReturn {
  const localPerformanceMode = ref(props.performanceMode);
  const localAnimationQuality = ref(props.animationQuality);
  const localHardwareAcceleration = ref(props.hardwareAcceleration);
  const localVirtualizationEnabled = ref(props.virtualizationEnabled);

  const deviceInfo = ref(detectDevicePerformance());

  const currentFPS = ref(60);
  const longTaskCount = ref(0);

  let frameCount = 0;
  let lastTime = performance.now();
  let fpsMonitorInterval: number | null = null;
  let longTaskObserver: PerformanceObserver | null = null;

  watch(
    () => props.performanceMode,
    (newVal: string) => {
      localPerformanceMode.value = newVal;
    },
  );

  watch(
    () => props.animationQuality,
    (newVal: string) => {
      localAnimationQuality.value = newVal;
    },
  );

  watch(
    () => props.hardwareAcceleration,
    (newVal: boolean) => {
      localHardwareAcceleration.value = newVal;
    },
  );

  watch(
    () => props.virtualizationEnabled,
    (newVal: boolean) => {
      localVirtualizationEnabled.value = newVal;
    },
  );

  const updatePerformanceMode = (): void => {
    emit("update:performanceMode", localPerformanceMode.value);
  };

  const updateAnimationQuality = (): void => {
    emit("update:animationQuality", localAnimationQuality.value);
  };

  const updateHardwareAcceleration = (): void => {
    emit("update:hardwareAcceleration", localHardwareAcceleration.value);
  };

  const updateVirtualization = (): void => {
    emit("update:virtualizationEnabled", localVirtualizationEnabled.value);
  };

  const getPerformanceLevelText = (level: string): string => {
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

  const startPerformanceMonitoring = (): void => {
    const monitorFPS = (): void => {
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
        longTaskObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
          longTaskCount.value = list.getEntries().length;
        });

        longTaskObserver.observe({ entryTypes: ["longtask"] });
      } catch (e) {
        console.warn("长任务监控不支持:", e);
      }
    }
  };

  const stopPerformanceMonitoring = (): void => {
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
