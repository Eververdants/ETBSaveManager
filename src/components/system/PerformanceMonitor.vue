<template>
  <div class="perf-monitor">
    <h3>{{ t("performanceMonitor.title") }}</h3>
    <div class="stats">
      <div class="stat-item">
        <span>⚡ {{ t("performanceMonitor.fps") }}: {{ fps }}</span>
        <div class="rating" :class="fpsRating.class">
          {{ fpsRating.icon }}
        </div>
      </div>
      <div class="stat-item">
        <span
          >🧠 {{ t("performanceMonitor.memory") }}: {{ formatMemory(memory.usedJSHeapSize) }} /
          {{ formatMemory(memory.totalJSHeapSize) }}</span
        >
        <div class="rating" :class="memoryRating.class">
          {{ memoryRating.icon }}
        </div>
      </div>
      <div class="stat-item">
        <span>🖥️ {{ t("performanceMonitor.cpu") }}: {{ cpuLoad.toFixed(1) }}%</span>
        <div class="rating" :class="cpuRating.class">
          {{ cpuRating.icon }}
        </div>
      </div>
      <div>⏱️ {{ t("performanceMonitor.renderTime") }}: {{ loadTime.toFixed(2) }} ms</div>
    </div>

    <div class="charts">
      <canvas ref="fpsChart"></canvas>
      <canvas ref="memChart"></canvas>
      <canvas ref="cpuChart"></canvas>
    </div>
  </div>
</template>

<script>
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale } from "chart.js";
import { markRaw } from "vue";
import { useI18n } from "vue-i18n";

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

export default {
  name: "PerformanceMonitor",
  setup() {
    const { t } = useI18n();
    return { t };
  },
  data() {
    return {
      fps: 0,
      memory: { usedJSHeapSize: 0, totalJSHeapSize: 0 },
      cpuLoad: 0,
      loadTime: 0,
      frame: null,
      lastFrameTime: performance.now(),
      lastFpsTime: performance.now(),
      lastSampleTime: performance.now(),
      lastCpuCheck: performance.now(),
      cpuIdle: 0,
      visibilityHandler: null,
      paused: false,
      sampleInterval: 500,
      frameCount: 0,
      fpsData: [],
      memData: [],
      cpuData: [],
    };
  },
  computed: {
    // FPS评估 (绿色线)
    fpsRating() {
      // FPS评分 (满帧60为优秀，但考虑实际情况调整评级标准)
      const fpsScore = Math.min(100, (this.fps / 60) * 100);

      if (fpsScore >= 80) {
        // 48 FPS以上为优秀
        return {
          class: "excellent",
          icon: "🏆",
        };
      } else if (fpsScore >= 60) {
        // 36 FPS以上为良好
        return {
          class: "good",
          icon: "👍",
        };
      } else if (fpsScore >= 40) {
        // 24 FPS以上为一般
        return {
          class: "average",
          icon: "👌",
        };
      } else if (fpsScore >= 20) {
        // 12 FPS以上为较差
        return {
          class: "poor",
          icon: "⚠️",
        };
      } else {
        return {
          class: "terrible",
          icon: "❌",
        };
      }
    },

    // 内存评估 (蓝色线)
    memoryRating() {
      // 内存评分 (使用率越低越好，但考虑实际情况调整评级标准)
      const memoryUsage = this.memory.totalJSHeapSize
        ? (this.memory.usedJSHeapSize / this.memory.totalJSHeapSize) * 100
        : 0;
      const memoryScore = Math.max(0, 100 - memoryUsage);

      if (memoryScore >= 85) {
        // 内存使用率15%以下为优秀
        return {
          class: "excellent",
          icon: "🏆",
        };
      } else if (memoryScore >= 70) {
        // 内存使用率30%以下为良好
        return {
          class: "good",
          icon: "👍",
        };
      } else if (memoryScore >= 50) {
        // 内存使用率50%以下为一般
        return {
          class: "average",
          icon: "👌",
        };
      } else if (memoryScore >= 30) {
        // 内存使用率70%以下为较差
        return {
          class: "poor",
          icon: "⚠️",
        };
      } else {
        return {
          class: "terrible",
          icon: "❌",
        };
      }
    },

    // CPU评估 (橙色线)
    cpuRating() {
      // CPU评分 (使用率越低越好，但考虑实际情况调整评级标准)
      const cpuScore = Math.max(0, 100 - this.cpuLoad);

      if (cpuScore >= 90) {
        // CPU使用率10%以下为优秀
        return {
          class: "excellent",
          icon: "🏆",
        };
      } else if (cpuScore >= 75) {
        // CPU使用率25%以下为良好
        return {
          class: "good",
          icon: "👍",
        };
      } else if (cpuScore >= 50) {
        // CPU使用率50%以下为一般
        return {
          class: "average",
          icon: "👌",
        };
      } else if (cpuScore >= 25) {
        // CPU使用率75%以下为较差
        return {
          class: "poor",
          icon: "⚠️",
        };
      } else {
        return {
          class: "terrible",
          icon: "❌",
        };
      }
    },
  },
  mounted() {
    // 使用现代API获取页面加载时间
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    if (navigationEntry) {
      // 使用loadEventEnd - fetchStart来计算页面加载时间
      this.loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
    } else if (performance.timing) {
      // 降级到旧API（兼容旧浏览器）
      this.loadTime = performance.timing.loadEventEnd - performance.timing.fetchStart;
    } else {
      // 如果都不支持，设置为0
      this.loadTime = 0;
    }

    this.initCharts();
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.paused = true;
        if (this.frame) {
          cancelAnimationFrame(this.frame);
          this.frame = null;
        }
        return;
      }
      this.paused = false;
      this.lastFrameTime = performance.now();
      this.lastFpsTime = performance.now();
      this.lastSampleTime = performance.now();
      this.startMonitoring();
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.startMonitoring();
  },
  beforeUnmount() {
    cancelAnimationFrame(this.frame);
    if (this.visibilityHandler) {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.fpsChart && this.fpsChart.destroy();
    this.memChart && this.memChart.destroy();
    this.cpuChart && this.cpuChart.destroy();
  },
  methods: {
    startMonitoring() {
      if (this.frame || this.paused) return;
      const loop = (now) => {
        if (this.paused) return;

        // FPS (每秒统计一次，更稳定)
        this.frameCount++;
        if (now - this.lastFpsTime >= 1000) {
          this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
          this.frameCount = 0;
          this.lastFpsTime = now;
        }

        // CPU (事件循环延迟估算)
        const elapsed = now - this.lastCpuCheck;
        this.cpuIdle = 0.95 * this.cpuIdle + 0.05 * Math.min(elapsed, 50);
        this.cpuLoad = Math.min(100, (1 - this.cpuIdle / 50) * 100);
        this.lastCpuCheck = now;

        // 低频率采样，降低监控开销
        if (now - this.lastSampleTime >= this.sampleInterval) {
          if (performance.memory) {
            this.memory = {
              usedJSHeapSize: performance.memory.usedJSHeapSize,
              totalJSHeapSize: performance.memory.totalJSHeapSize,
            };
          }
          // 更新数据数组（最多保存 60 点）
          this.updateData();
          this.lastSampleTime = now;
        }

        // 下一帧
        this.frame = requestAnimationFrame(loop);
      };
      this.frame = requestAnimationFrame(loop);
    },
    updateData() {
      const maxPoints = 60;

      this.fpsData.push(this.fps);
      this.memData.push(this.memory.usedJSHeapSize / 1024 / 1024);
      this.cpuData.push(this.cpuLoad);

      if (this.fpsData.length > maxPoints) this.fpsData.shift();
      if (this.memData.length > maxPoints) this.memData.shift();
      if (this.cpuData.length > maxPoints) this.cpuData.shift();

      this.updateCharts();
    },
    initCharts() {
      const commonOptions = {
        responsive: true,
        animation: false,
        devicePixelRatio: 1,
        maintainAspectRatio: false,
        elements: { point: { radius: 0 } },
        scales: {
          x: { display: false },
          y: { beginAtZero: true },
        },
        plugins: { legend: { display: false } },
      };

      this.fpsChart = markRaw(
        new Chart(this.$refs.fpsChart, {
          type: "line",
          data: {
            labels: [],
            datasets: [{ label: "FPS", borderColor: "lime", data: [] }],
          },
          options: commonOptions,
        }),
      );

      this.memChart = markRaw(
        new Chart(this.$refs.memChart, {
          type: "line",
          data: {
            labels: [],
            datasets: [{ label: "Memory (MB)", borderColor: "cyan", data: [] }],
          },
          options: commonOptions,
        }),
      );

      this.cpuChart = markRaw(
        new Chart(this.$refs.cpuChart, {
          type: "line",
          data: {
            labels: [],
            datasets: [{ label: "CPU (%)", borderColor: "orange", data: [] }],
          },
          options: commonOptions,
        }),
      );
    },
    updateCharts() {
      const labels = Array.from({ length: this.fpsData.length }, (_, i) => i);

      this.fpsChart.data.labels = [...labels];
      this.fpsChart.data.datasets[0].data = [...this.fpsData];
      this.fpsChart.update("none");

      this.memChart.data.labels = [...labels];
      this.memChart.data.datasets[0].data = [...this.memData];
      this.memChart.update("none");

      this.cpuChart.data.labels = [...labels];
      this.cpuChart.data.datasets[0].data = [...this.cpuData];
      this.cpuChart.update("none");
    },
    formatMemory(bytes) {
      if (!bytes) return "N/A";
      return (bytes / 1024 / 1024).toFixed(1) + " MB";
    },
  },
};
</script>

<style scoped>
.perf-monitor {
  width: 100%;
  background: transparent;
  color: #0f0;
  font-family: monospace;
  font-size: 12px;
  padding: 10px;
  border-radius: 8px;
  /* 默认半透明，不干扰主界面 */
  opacity: 0.3;
  transition: opacity 0.2s ease;
}

.perf-monitor:hover {
  /* hover 时完全可见可读 */
  opacity: 1;
}

.perf-monitor h3 {
  margin: 0 0 5px;
  font-size: 14px;
  color: #fff;
}

.stats {
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.rating {
  font-size: 12px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.rating.excellent {
  background-color: #4caf50;
  color: white;
}

.rating.good {
  background-color: #8bc34a;
  color: white;
}

.rating.average {
  background-color: #ffeb3b;
  color: black;
}

.rating.poor {
  background-color: #ff9800;
  color: white;
}

.rating.terrible {
  background-color: #f44336;
  color: white;
}

.charts canvas {
  width: 100% !important;
  height: 80px !important;
  margin-bottom: 8px;
}
</style>
