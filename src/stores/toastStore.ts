/**
 * Toast 通知 Store — 全站唯一通知能力（对应 master 的 notificationService）
 */
import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastAction {
  text: string;
  onClick: (id: string) => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  actions?: ToastAction[];
}

interface ToastState {
  toasts: ToastItem[];
  show: (type: ToastType, message: string, options?: { duration?: number; actions?: ToastAction[] }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

let toastSeq = 0;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  show: (type, message, options) => {
    const id = `toast_${Date.now()}_${++toastSeq}`;
    const toast: ToastItem = {
      id,
      type,
      message,
      duration: options?.duration ?? 3000,
      actions: options?.actions,
    };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    return id;
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

/** 命令式 API — 非 React 上下文（store action / service）中使用 */
export const toast = {
  success: (message: string, options?: { duration?: number; actions?: ToastAction[] }) =>
    useToastStore.getState().show("success", message, options),
  error: (message: string, options?: { duration?: number; actions?: ToastAction[] }) =>
    useToastStore.getState().show("error", message, options),
  warning: (message: string, options?: { duration?: number; actions?: ToastAction[] }) =>
    useToastStore.getState().show("warning", message, options),
  info: (message: string, options?: { duration?: number; actions?: ToastAction[] }) =>
    useToastStore.getState().show("info", message, options),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
