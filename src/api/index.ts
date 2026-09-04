/**
 * API 层
 * 处理所有与 Tauri 后端的通信
 *
 * 重要规则：
 * 1. 所有 Tauri 调用必须经过此目录（组件/hook 不得直接使用 invoke）
 * 2. 错误处理统一在此层完成，抛出 ApiError
 * 3. Wire 类型字段名与 Rust 序列化保持一致（见 types/save.ts）
 */

import { invoke } from "@tauri-apps/api/core";

// ============================================
// 错误处理
// ============================================
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 归一化 Rust AppError（序列化为 { type, message } 形状）。
 * 直接 String(error) 会得到 "[object Object]"，必须取 message 字段。
 */
export function normalizeInvokeError(error: unknown): string {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    if (typeof err.message === "string" && err.message) return err.message;
    if (typeof err.msg === "string" && err.msg) return err.msg;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError("UNKNOWN", normalizeInvokeError(error));
}

// ============================================
// Tauri API 封装
// ============================================
export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw handleApiError(error);
  }
}

// ============================================
// 各领域能力请使用对应模块：
// - saveApi    → ./save
// - playerApi  → ./player
// - modsApi    → ./mods
// - systemApi  → ./system
// - windowControls → ./system（@tauri-apps/api/window 封装，供标题栏使用）
// - IS_TAURI   → ./system（运行环境探测）
// ============================================
export { saveApi } from "./save";
export { playerApi } from "./player";
export { modsApi, GAME_ROOT_KEY } from "./mods";
export { systemApi, windowControls, IS_TAURI } from "./system";
