/**
 * Performance monitoring types
 * Types for device performance detection and monitoring.
 */

/** Device performance capabilities */
export interface DevicePerformanceInfo {
  cpuCores: number;
  deviceMemory: number;
  isMobile: boolean;
  isLowEndDevice: boolean;
  isVeryLowEndDevice: boolean;
  prefersReducedMotion: boolean;
  performanceScore: number;
  performanceLevel: "high" | "medium" | "low";
}

/** Options for the performance monitor */
export interface PerformanceMonitorOptions {
  longTaskThreshold?: number;
  fpsThreshold?: number;
  longTaskLimit?: number;
  lowFpsLimit?: number;
  onLowPerformance?: () => void;
  onPerformanceRecovery?: () => void;
  onFPSUpdate?: (fps: number) => void;
}
