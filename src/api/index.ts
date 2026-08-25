/**
 * API 层
 * 处理所有与 Tauri 后端或远程服务器的通信
 * 
 * 重要规则：
 * 1. 所有 API 调用必须经过此文件
 * 2. 组件不应直接使用 invoke 或 fetch
 * 3. 错误处理应统一在此层完成
 */

import { invoke } from "@tauri-apps/api/core";
import type { ApiResponse } from "../types";

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

// 统一错误处理
function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error) {
    return new ApiError("UNKNOWN", error.message);
  }
  return new ApiError("UNKNOWN", "An unknown error occurred");
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
// 文件操作 API（示例）
// ============================================
export const fileApi = {
  // 读取文件
  async readFile(path: string): Promise<Uint8Array> {
    return tauriInvoke<Uint8Array>("read_file", { path });
  },

  // 写入文件
  async writeFile(path: string, data: Uint8Array): Promise<void> {
    return tauriInvoke<void>("write_file", { path, data });
  },

  // 删除文件
  async deleteFile(path: string): Promise<void> {
    return tauriInvoke<void>("delete_file", { path });
  },

  // 列出目录
  async listDirectory(path: string): Promise<string[]> {
    return tauriInvoke<string[]>("list_directory", { path });
  },
};

// ============================================
// 存档管理 API（示例）
// ============================================
export const saveApi = {
  // 获取存档列表
  async getSaves(): Promise<ApiResponse<string[]>> {
    // return tauriInvoke('get_saves');
    return { success: true, data: [] };
  },
};
