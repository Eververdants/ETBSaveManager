/**
 * 应用常量定义
 * 所有常量统一在此处定义，避免魔法数字和字符串
 */

// 应用信息
export const APP_VERSION = "4.0.0";

// 功能开关
export const FEATURES = {
  /**
   * 合并"存档难度"与"实际难度"为单一难度显示。
   * 启用时：UI 隐藏实际难度，实际难度在后端始终镜像存档难度。
   */
  MERGE_DIFFICULTY: true,
} as const;

// 存档难度选项（顺序即展示顺序）
export const DIFFICULTY_LEVELS = ["easy", "normal", "hard", "nightmare"] as const;

// 存储键名
export const STORAGE_KEYS = {
  THEME: "theme",
  LANGUAGE: "i18nextLng",
  SAVE_PATH: "save-path",
  APP_STATE: "app-storage",
  LAST_UPDATE_CHECK: "lastUpdateCheck",
  PERFORMANCE_MONITOR: "performanceMonitor",
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  THEME: "light" as const,
  LANGUAGE: "zh-CN" as const,
  PAGE_SIZE: 20,
  MAX_BACKUP_COUNT: 10,
} as const;

// UI 相关
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 200,
  SIDEBAR_COLLAPSED_WIDTH: 56,
  TITLEBAR_HEIGHT: 40,
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 3000,
} as const;

// 注：QUERY_KEYS / API_ENDPOINTS / FILE_EXTENSIONS / APP_NAME 曾在此定义，
// 均全局零引用，按 AGENTS.md「无死代码」移除。

export * from "./navigation";
