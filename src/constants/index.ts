/**
 * 应用常量定义
 * 所有常量统一在此处定义，避免魔法数字和字符串
 */

// 应用信息
export const APP_NAME = "ETBToolkit";
export const APP_VERSION = "4.0.0";

// 存储键名
export const STORAGE_KEYS = {
  THEME: "theme",
  LANGUAGE: "i18nextLng",
  SAVE_PATH: "save-path",
  APP_STATE: "app-storage",
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  THEME: "light" as const,
  LANGUAGE: "zh-CN" as const,
  PAGE_SIZE: 20,
  MAX_BACKUP_COUNT: 10,
} as const;

// 文件类型
export const FILE_EXTENSIONS = {
  SAVE: ".sav",
  BACKUP: ".bak",
  CONFIG: ".json",
} as const;

// UI 相关
export const UI_CONFIG = {
  SIDEBAR_WIDTH: 200,
  SIDEBAR_COLLAPSED_WIDTH: 56,
  TITLEBAR_HEIGHT: 40,
  ANIMATION_DURATION: 300,
  TOAST_DURATION: 3000,
} as const;

// Query Keys（TanStack Query）
export const QUERY_KEYS = {
  SAVES: "saves",
  BACKUPS: "backups",
  SETTINGS: "settings",
  USER: "user",
} as const;

// API 端点（如需后端 API）
export const API_ENDPOINTS = {
  // 预留
} as const;

export * from "./navigation";
