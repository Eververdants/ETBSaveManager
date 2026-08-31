/**
 * 全局类型定义
 */
export * from "./save";

// 主题类型
export type Theme = "light" | "dark" | "system";

// 语言类型
export type Language = "zh-CN" | "zh-TW" | "en-US";

// API 响应包装
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// API 错误
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// 组件 Props 基础类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
