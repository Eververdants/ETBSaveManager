/**
 * 全局类型定义
 */

// 主题类型
export type Theme = "light" | "dark" | "system";

// 语言类型
export type Language = "zh-CN" | "en-US";

// 通用分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 存档文件信息
export interface SaveFile {
  id: string;
  name: string;
  path: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  gameName?: string;
  tags?: string[];
}

// 备份信息
export interface BackupFile {
  id: string;
  name: string;
  originalPath: string;
  backupPath: string;
  size: number;
  createdAt: string;
  description?: string;
}

// 用户设置
export interface UserSettings {
  theme: Theme;
  language: Language;
  savePath: string;
  autoBackup: boolean;
  backupInterval?: number;
}

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

// 路由元信息
export interface RouteMeta {
  title?: string;
  icon?: string;
  requiresAuth?: boolean;
  hidden?: boolean;
}
