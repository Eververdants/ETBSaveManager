/**
 * 系统 API — 窗口 / GPU / 进程 / 路径
 */
import { tauriInvoke } from "./index";

export const systemApi = {
  /** 获取 %LOCALAPPDATA% 路径 */
  async getLocalAppdata(): Promise<string> {
    return tauriInvoke<string>("get_local_appdata");
  },

  /** 重启应用 */
  async restartApp(): Promise<void> {
    return tauriInvoke<void>("restart_app");
  },

  /** 设置窗口标题（语言切换时同步） */
  async setWindowTitle(title: string): Promise<void> {
    return tauriInvoke<void>("set_window_title", { title });
  },

  /** 获取 GPU 加速是否被禁用 */
  async getGpuAccelerationStatus(): Promise<boolean> {
    return tauriInvoke<boolean>("get_gpu_acceleration_status");
  },

  /** 设置 GPU 加速禁用（需手动重启生效） */
  async setGpuAcceleration(disabled: boolean): Promise<void> {
    return tauriInvoke<void>("set_gpu_acceleration", { disabled });
  },

  /** 设置进程优先级（如 "high"） */
  async setProcessPriority(priority: string): Promise<void> {
    return tauriInvoke<void>("set_process_priority", { priority });
  },
};
