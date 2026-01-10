<template>
  <div class="performance-settings">
    <h3 class="settings-title">{{ t("performanceSettings.title") }}</h3>

    <div class="setting-group">
      <div class="setting-item">
        <label class="setting-label">{{
          t("performanceSettings.title")
          }}</label>
        <div class="setting-control">
          <select v-model="localPerformanceMode" class="setting-select" @change="updatePerformanceMode">
            <option value="auto">
              {{ t("common.auto") }} ({{ t("common.recommended") }})
            </option>
            <option value="normal">{{ t("common.normal") }}</option>
            <option value="low">{{ t("common.low") }}</option>
          </select>
          <div class="setting-description">
            {{
              t("performanceSettings.enablePerformanceMonitoringDescription")
            }}
          </div>
        </div>
      </div>

      <div class="setting-item">
        <label class="setting-label">{{
          t("performanceSettings.updateInterval")
          }}</label>
        <div class="setting-control">
          <select v-model="localAnimationQuality" class="setting-select" @change="updateAnimationQuality">
            <option value="high">{{ t("common.high") }}</option>
            <option value="medium">{{ t("common.medium") }}</option>
            <option value="low">{{ t("common.low") }}</option>
            <option value="disabled">{{ t("common.disabled") }}</option>
          </select>
          <div class="setting-description">
            {{ t("performanceSettings.updateIntervalDescription") }}
          </div>
        </div>
      </div>

      <div class="setting-item">
        <label class="setting-label">{{
          t("settings.disableGpuAcceleration")
          }}</label>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="localHardwareAcceleration" @change="updateHardwareAcceleration" />
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">
            {{ t("settings.disableGpuAccelerationDescription") }}
          </div>
        </div>
      </div>

      <div class="setting-item">
        <label class="setting-label">{{
          t("performanceSettings.maxDataPoints")
          }}</label>
        <div class="setting-control">
          <label class="toggle-switch">
            <input type="checkbox" v-model="localVirtualizationEnabled" @change="updateVirtualization" />
            <span class="toggle-slider"></span>
          </label>
          <div class="setting-description">
            {{ t("performanceSettings.maxDataPointsDescription") }}
          </div>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <h4 class="group-title">{{ t("performanceMonitor.title") }}</h4>
      <div class="device-info">
        <div class="info-item">
          <span class="info-label">{{ t("performanceMonitor.cpu") }}:</span>
          <span class="info-value">{{ deviceInfo.cpuCores }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t("performanceMonitor.memory") }}:</span>
          <span class="info-value">{{ deviceInfo.deviceMemory }} GB</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t("common.deviceType") }}:</span>
          <span class="info-value">{{
            deviceInfo.isMobile ? t("common.mobile") : t("common.desktop")
            }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t("performanceSettings.title") }}:</span>
          <span class="info-value" :class="`perf-${deviceInfo.performanceLevel}`">
            {{ getPerformanceLevelText(deviceInfo.performanceLevel) }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">{{ t("performanceSettings.title") }}:</span>
          <span class="info-value">{{ deviceInfo.performanceScore }}/100</span>
        </div>
      </div>
    </div>

    <div class="setting-group">
      <h4 class="group-title">{{ t("performanceMonitor.title") }}</h4>
      <div class="performance-stats">
        <div class="stat-item">
          <span class="stat-label">{{ t("performanceMonitor.fps") }}:</span>
          <span class="stat-value">{{ currentFPS }} FPS</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t("common.taskCount") }}:</span>
          <span class="stat-value">{{ longTaskCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { detectDevicePerformance } from "../utils/performance";

export default {
  name: "PerformanceSettings",
  props: {
    performanceMode: {
      type: String,
      default: "auto",
    },
    animationQuality: {
      type: String,
      default: "medium",
    },
    hardwareAcceleration: {
      type: Boolean,
      default: true,
    },
    virtualizationEnabled: {
      type: Boolean,
      default: true,
    },
  },
  emits: [
    "update:performanceMode",
    "update:animationQuality",
    "update:hardwareAcceleration",
    "update:virtualizationEnabled",
  ],
  setup(props, { emit }) {
    const { t } = useI18n();

    // 本地状态
    const localPerformanceMode = ref(props.performanceMode);
    const localAnimationQuality = ref(props.animationQuality);
    const localHardwareAcceleration = ref(props.hardwareAcceleration);
    const localVirtualizationEnabled = ref(props.virtualizationEnabled);

    // 设备信息
    const deviceInfo = ref(detectDevicePerformance());

    // 性能监控
    const currentFPS = ref(60);
    const longTaskCount = ref(0);
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsMonitorInterval = null;
    let longTaskObserver = null;

    // 监听props变化
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

    // 更新函数
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

    // 获取性能等级文本
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

    // 性能监控
    const startPerformanceMonitoring = () => {
      // FPS监控
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

      // 长任务监控
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
  },
};
</script>

<style scoped>
.performance-settings {
  padding: 20px;
  background-color: var(--bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.settings-title {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--text-color);
  font-size: 1.5rem;
  font-weight: 600;
}

.setting-group {
  margin-bottom: 30px;
}

.group-title {
  margin-bottom: 15px;
  color: var(--text-color);
  font-size: 1.1rem;
  font-weight: 500;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-color);
  font-weight: 500;
}

.setting-control {
  position: relative;
}

.setting-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-color-secondary);
  color: var(--text-color);
  font-size: 0.9rem;
}

.setting-description {
  margin-top: 5px;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked+.toggle-slider {
  background-color: var(--primary-color);
}

input:checked+.toggle-slider:before {
  transform: translateX(26px);
}

.device-info,
.performance-stats {
  background-color: var(--bg-color-secondary);
  border-radius: 6px;
  padding: 15px;
}

.info-item,
.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item:last-child,
.stat-item:last-child {
  margin-bottom: 0;
}

.info-label,
.stat-label {
  color: var(--text-color-secondary);
}

.info-value,
.stat-value {
  font-weight: 500;
  color: var(--text-color);
}

.perf-high {
  color: #4caf50;
}

.perf-medium {
  color: #ff9800;
}

.perf-low {
  color: #f44336;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .performance-settings {
    background-color: var(--bg-color);
    color: var(--text-color);
  }

  .setting-select {
    background-color: var(--bg-color-secondary);
    color: var(--text-color);
    border-color: var(--border-color);
  }

  .device-info,
  .performance-stats {
    background-color: var(--bg-color-secondary);
  }
}
</style>
