<template>
    <div class="perf-monitor" style="pointer-events: none;">
        <h3>性能监控</h3>
        <div class="stats">
            <div class="stat-item">
                <span>⚡ FPS: {{ fps }}</span>
                <div class="rating" :class="fpsRating.class">
                    {{ fpsRating.icon }}
                </div>
            </div>
            <div class="stat-item">
                <span>🧠 Memory: {{ formatMemory(memory.usedJSHeapSize) }} / {{ formatMemory(memory.totalJSHeapSize)
                }}</span>
                <div class="rating" :class="memoryRating.class">
                    {{ memoryRating.icon }}
                </div>
            </div>
            <div class="stat-item">
                <span>🖥️ CPU (估算): {{ cpuLoad.toFixed(1) }}%</span>
                <div class="rating" :class="cpuRating.class">
                    {{ cpuRating.icon }}
                </div>
            </div>
            <div>⏱️ Load Time: {{ loadTime.toFixed(2) }} ms</div>
        </div>

        <div class="charts">
            <canvas ref="fpsChart"></canvas>
            <canvas ref="memChart"></canvas>
            <canvas ref="cpuChart"></canvas>
        </div>
    </div>
</template>

<script>
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    CategoryScale,
} from "chart.js";
import { markRaw } from "vue";

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale);

export default {
    name: "PerformanceMonitor",
    data() {
        return {
            fps: 0,
            memory: { usedJSHeapSize: 0, totalJSHeapSize: 0 },
            cpuLoad: 0,
            loadTime: 0,
            _frame: null,
            _lastFrameTime: performance.now(),
            _lastCpuCheck: performance.now(),
            _cpuIdle: 0,
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

            if (fpsScore >= 80) {  // 48 FPS以上为优秀
                return {
                    class: 'excellent',
                    icon: '🏆'
                };
            } else if (fpsScore >= 60) {  // 36 FPS以上为良好
                return {
                    class: 'good',
                    icon: '👍'
                };
            } else if (fpsScore >= 40) {  // 24 FPS以上为一般
                return {
                    class: 'average',
                    icon: '👌'
                };
            } else if (fpsScore >= 20) {  // 12 FPS以上为较差
                return {
                    class: 'poor',
                    icon: '⚠️'
                };
            } else {
                return {
                    class: 'terrible',
                    icon: '❌'
                };
            }
        },

        // 内存评估 (蓝色线)
        memoryRating() {
            // 内存评分 (使用率越低越好，但考虑实际情况调整评级标准)
            const memoryUsage = this.memory.totalJSHeapSize ?
                (this.memory.usedJSHeapSize / this.memory.totalJSHeapSize) * 100 : 0;
            const memoryScore = Math.max(0, 100 - memoryUsage);

            if (memoryScore >= 85) {  // 内存使用率15%以下为优秀
                return {
                    class: 'excellent',
                    icon: '🏆'
                };
            } else if (memoryScore >= 70) {  // 内存使用率30%以下为良好
                return {
                    class: 'good',
                    icon: '👍'
                };
            } else if (memoryScore >= 50) {  // 内存使用率50%以下为一般
                return {
                    class: 'average',
                    icon: '👌'
                };
            } else if (memoryScore >= 30) {  // 内存使用率70%以下为较差
                return {
                    class: 'poor',
                    icon: '⚠️'
                };
            } else {
                return {
                    class: 'terrible',
                    icon: '❌'
                };
            }
        },

        // CPU评估 (橙色线)
        cpuRating() {
            // CPU评分 (使用率越低越好，但考虑实际情况调整评级标准)
            const cpuScore = Math.max(0, 100 - this.cpuLoad);

            if (cpuScore >= 90) {  // CPU使用率10%以下为优秀
                return {
                    class: 'excellent',
                    icon: '🏆'
                };
            } else if (cpuScore >= 75) {  // CPU使用率25%以下为良好
                return {
                    class: 'good',
                    icon: '👍'
                };
            } else if (cpuScore >= 50) {  // CPU使用率50%以下为一般
                return {
                    class: 'average',
                    icon: '👌'
                };
            } else if (cpuScore >= 25) {  // CPU使用率75%以下为较差
                return {
                    class: 'poor',
                    icon: '⚠️'
                };
            } else {
                return {
                    class: 'terrible',
                    icon: '❌'
                };
            }
        }
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
        this.startMonitoring();
    },
    beforeUnmount() {
        cancelAnimationFrame(this._frame);
        this.fpsChart && this.fpsChart.destroy();
        this.memChart && this.memChart.destroy();
        this.cpuChart && this.cpuChart.destroy();
    },
    methods: {
        startMonitoring() {
            const loop = (now) => {
                // FPS
                const delta = now - this._lastFrameTime;
                this.fps = Math.round(1000 / delta);
                this._lastFrameTime = now;

                // Memory
                if (performance.memory) {
                    this.memory = {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                    };
                }

                // CPU (事件循环延迟估算)
                const elapsed = now - this._lastCpuCheck;
                this._cpuIdle = 0.95 * this._cpuIdle + 0.05 * Math.min(elapsed, 50);
                this.cpuLoad = Math.min(100, (1 - this._cpuIdle / 50) * 100);
                this._lastCpuCheck = now;

                // 更新数据数组（最多保存 60 点，代表最近 1 分钟）
                this.updateData();

                // 下一帧
                this._frame = requestAnimationFrame(loop);
            };
            this._frame = requestAnimationFrame(loop);
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
                scales: {
                    x: { display: false },
                    y: { beginAtZero: true },
                },
                plugins: { legend: { display: false } },
            };

            this.fpsChart = markRaw(new Chart(this.$refs.fpsChart, {
                type: "line",
                data: { labels: [], datasets: [{ label: "FPS", borderColor: "lime", data: [] }] },
                options: commonOptions,
            }));

            this.memChart = markRaw(new Chart(this.$refs.memChart, {
                type: "line",
                data: { labels: [], datasets: [{ label: "Memory (MB)", borderColor: "cyan", data: [] }] },
                options: commonOptions,
            }));

            this.cpuChart = markRaw(new Chart(this.$refs.cpuChart, {
                type: "line",
                data: { labels: [], datasets: [{ label: "CPU (%)", borderColor: "orange", data: [] }] },
                options: commonOptions,
            }));
        },
        updateCharts() {
            const labels = Array.from({ length: this.fpsData.length }, (_, i) => i);

            this.fpsChart.data.labels = [...labels];
            this.fpsChart.data.datasets[0].data = [...this.fpsData];
            this.fpsChart.update();

            this.memChart.data.labels = [...labels];
            this.memChart.data.datasets[0].data = [...this.memData];
            this.memChart.update();

            this.cpuChart.data.labels = [...labels];
            this.cpuChart.data.datasets[0].data = [...this.cpuData];
            this.cpuChart.update();
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
    pointer-events: none;
    /* 鼠标穿透 */
}

.perf-monitor h3 {
    margin: 0 0 5px;
    font-size: 14px;
    color: #fff;
    pointer-events: none;
    /* 鼠标穿透 */
}

.stats {
    margin-bottom: 10px;
    pointer-events: none;
    /* 鼠标穿透 */
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
    pointer-events: none;
    /* 鼠标穿透 */
}

.rating {
    font-size: 12px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    pointer-events: none;
    /* 鼠标穿透 */
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
    pointer-events: none;
    /* 鼠标穿透 */
}

.charts {
    pointer-events: none;
    /* 鼠标穿透 */
}
</style>
