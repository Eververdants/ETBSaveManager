// 性能检测和优化工具函数

import type { DevicePerformanceInfo, AnimationParams, PerformanceMonitorOptions } from "../types";

// 设备性能检测函数
export const detectDevicePerformance = (): DevicePerformanceInfo => {
  // 检测硬件并发数
  const cpuCores = navigator.hardwareConcurrency || 4;

  // 检测设备内存
  const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory || 4;

  // 检测是否为移动设备
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 检测是否为低端设备
  const isLowEndDevice = cpuCores <= 4 || deviceMemory <= 2 || isMobile;

  // 检测是否为极低端设备
  const isVeryLowEndDevice = cpuCores <= 2 || deviceMemory <= 1;

  // 检测用户是否偏好减少动画
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 计算性能分数 (0-100)
  let performanceScore = 50; // 基础分数

  // CPU核心数影响
  performanceScore += Math.min(cpuCores * 5, 25);

  // 内存大小影响
  performanceScore += Math.min(deviceMemory * 10, 25);

  // 移动设备减分
  if (isMobile) performanceScore -= 20;

  // 极低端设备大幅减分
  if (isVeryLowEndDevice) performanceScore -= 30;

  // 用户偏好减少动画
  if (prefersReducedMotion) performanceScore -= 40;

  // 确保分数在0-100范围内
  performanceScore = Math.max(0, Math.min(100, performanceScore));

  return {
    cpuCores,
    deviceMemory,
    isMobile,
    isLowEndDevice,
    isVeryLowEndDevice,
    prefersReducedMotion,
    performanceScore,
    performanceLevel: performanceScore > 70 ? "high" : performanceScore > 40 ? "medium" : "low",
  };
};

// 获取动画参数的函数
export const getAnimationParams = (
  animationType: string = "default",
  performanceMode: string = "auto",
  animationQuality: string = "medium",
): AnimationParams => {
  const devicePerf = detectDevicePerformance();
  const isLowPerfMode = performanceMode === "low";

  // 根据动画质量调整基础参数
  const qualityMultiplier =
    animationQuality === "high" ? 1.2 : animationQuality === "low" ? 0.7 : animationQuality === "disabled" ? 0 : 1;

  // 基础动画参数
  const baseParams: AnimationParams = {
    duration: isLowPerfMode ? 0.2 : 0.3 * qualityMultiplier,
    ease: isLowPerfMode ? "power1.out" : "power2.out",
    delay: 0,
    force3D: true,
  };

  // 如果动画被禁用，返回最小参数
  if (animationQuality === "disabled") {
    return {
      ...baseParams,
      duration: 0.01,
      delay: 0,
      force3D: false,
    };
  }

  // 根据动画类型和设备性能调整参数
  switch (animationType) {
    case "cardEnter":
      return {
        ...baseParams,
        duration: isLowPerfMode ? 0.15 : (devicePerf.isVeryLowEndDevice ? 0.2 : 0.3) * qualityMultiplier,
        delay: 0,
        stagger: isLowPerfMode ? 0 : devicePerf.performanceScore < 50 ? 0.01 : 0.03,
      };

    case "cardLeave":
      return {
        ...baseParams,
        duration: isLowPerfMode ? 0.1 : (devicePerf.isVeryLowEndDevice ? 0.15 : 0.25) * qualityMultiplier,
        ease: "ease-in",
      };

    case "search":
      return {
        ...baseParams,
        duration: isLowPerfMode ? 0.15 : (devicePerf.isVeryLowEndDevice ? 0.2 : 0.3) * qualityMultiplier,
      };

    case "sidebar":
      return {
        ...baseParams,
        duration: isLowPerfMode ? 0.2 : 0.3 * qualityMultiplier,
      };

    case "toast":
      return {
        ...baseParams,
        duration: isLowPerfMode ? 0.2 : 0.3 * qualityMultiplier,
      };

    default:
      return baseParams;
  }
};

// 性能监控类
export class PerformanceMonitor {
  private longTaskThreshold: number;
  private fpsThreshold: number;
  private longTaskLimit: number;
  private lowFpsLimit: number;

  private longTaskCount: number;
  private lowFpsCount: number;
  private isLowPerfMode: boolean;
  private currentFPS: number;
  private frameCount: number;
  private lastTime: number;

  private longTaskObserver: PerformanceObserver | null;
  private fpsMonitorId: number | null;
  private callbacks: {
    onLowPerformance: () => void;
    onPerformanceRecovery: () => void;
    onFPSUpdate: (fps: number) => void;
  };
  private devicePerf: DevicePerformanceInfo;

  constructor(options: PerformanceMonitorOptions = {}) {
    this.longTaskThreshold = options.longTaskThreshold || 50;
    this.fpsThreshold = options.fpsThreshold || 30;
    this.longTaskLimit = options.longTaskLimit || 3;
    this.lowFpsLimit = options.lowFpsLimit || 3;

    this.longTaskCount = 0;
    this.lowFpsCount = 0;
    this.isLowPerfMode = false;
    this.currentFPS = 60;
    this.frameCount = 0;
    this.lastTime = performance.now();

    this.longTaskObserver = null;
    this.fpsMonitorId = null;
    this.callbacks = {
      onLowPerformance: options.onLowPerformance || (() => {}),
      onPerformanceRecovery: options.onPerformanceRecovery || (() => {}),
      onFPSUpdate: options.onFPSUpdate || (() => {}),
    };

    this.devicePerf = detectDevicePerformance();

    // 根据设备性能调整阈值
    if (this.devicePerf.isVeryLowEndDevice) {
      this.longTaskThreshold = 30;
      this.fpsThreshold = 20;
    }
  }

  start(): void {
    this.startLongTaskMonitoring();
    this.startFPSMonitoring();
  }

  stop(): void {
    this.stopLongTaskMonitoring();
    this.stopFPSMonitoring();
  }

  startLongTaskMonitoring(): void {
    if (!("PerformanceObserver" in window) || !("PerformanceLongTaskTiming" in window)) {
      console.warn("Performance Observer or Long Task Timing not supported");
      return;
    }

    this.longTaskObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > this.longTaskThreshold) {
          this.longTaskCount++;
          if (this.longTaskCount >= this.longTaskLimit && !this.isLowPerfMode) {
            this.isLowPerfMode = true;
            this.callbacks.onLowPerformance();

            // 重置计数器
            setTimeout(() => {
              this.longTaskCount = 0;
            }, 1000);
          }
        }
      });
    });

    try {
      this.longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch (e) {
      console.warn("长任务观察器初始化失败:", e);
    }
  }

  stopLongTaskMonitoring(): void {
    if (this.longTaskObserver) {
      this.longTaskObserver.disconnect();
      this.longTaskObserver = null;
    }
  }

  startFPSMonitoring(): void {
    const checkFPS = (): void => {
      this.frameCount++;
      const now = performance.now();

      if (now - this.lastTime >= 1000) {
        this.currentFPS = Math.round((this.frameCount * 1000) / (now - this.lastTime));
        this.callbacks.onFPSUpdate(this.currentFPS);

        if (this.currentFPS < this.fpsThreshold) {
          this.lowFpsCount++;
          if (this.lowFpsCount >= this.lowFpsLimit && !this.isLowPerfMode) {
            this.isLowPerfMode = true;
            this.callbacks.onLowPerformance();
          }
        } else {
          if (this.lowFpsCount > 0) {
            this.lowFpsCount = Math.max(0, this.lowFpsCount - 1);
          }

          if (this.currentFPS > 45 && this.isLowPerfMode && this.lowFpsCount === 0) {
            this.isLowPerfMode = false;
            this.callbacks.onPerformanceRecovery();
          }
        }

        this.frameCount = 0;
        this.lastTime = now;
      }

      this.fpsMonitorId = requestAnimationFrame(checkFPS);
    };

    this.fpsMonitorId = requestAnimationFrame(checkFPS);
  }

  stopFPSMonitoring(): void {
    if (this.fpsMonitorId) {
      cancelAnimationFrame(this.fpsMonitorId);
      this.fpsMonitorId = null;
    }
  }

  getPerformanceInfo(): {
    currentFPS: number;
    longTaskCount: number;
    lowFpsCount: number;
    isLowPerfMode: boolean;
    deviceInfo: DevicePerformanceInfo;
  } {
    return {
      currentFPS: this.currentFPS,
      longTaskCount: this.longTaskCount,
      lowFpsCount: this.lowFpsCount,
      isLowPerfMode: this.isLowPerfMode,
      deviceInfo: this.devicePerf,
    };
  }

  reset(): void {
    this.longTaskCount = 0;
    this.lowFpsCount = 0;
    this.isLowPerfMode = false;
  }
}

// 创建性能监控实例的便捷函数
export const createPerformanceMonitor = (options: PerformanceMonitorOptions): PerformanceMonitor => {
  return new PerformanceMonitor(options);
};

// 应用硬件加速
export const applyHardwareAcceleration = (element: HTMLElement | null, enable: boolean = true): void => {
  if (!element) return;

  if (enable) {
    element.style.transform = "translateZ(0)";
    element.style.willChange = "transform, opacity";
  } else {
    element.style.transform = "";
    element.style.willChange = "";
  }
};

// 优化重排和重绘
export const optimizeLayout = (): void => {
  // 使用 requestAnimationFrame 确保在下一帧执行
  requestAnimationFrame(() => {
    // 强制重排
    void document.body.offsetHeight;

    // 再次使用 requestAnimationFrame 确保在下一帧应用样式
    requestAnimationFrame(() => {
      // 应用样式优化
      document.body.style.contain = "layout style paint";
    });
  });
};

// 防抖函数
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    const later = (): void => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
