/**
 * App Store - 应用全局状态
 * 主题、侧边栏状态、开发者模式
 *
 * 语言由 i18next 自管（localStorage i18nextLng），不在此存储。
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Theme } from "../types";
import { DEFAULT_CONFIG } from "../constants";

interface AppState {
  theme: Theme;
  sidebarCollapsed: boolean;
  /** 开发者模式（解锁 .sav 工具等隐藏能力，About 页连续点击开启） */
  developerMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setDeveloperMode: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: DEFAULT_CONFIG.THEME,
      sidebarCollapsed: false,
      developerMode: false,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setDeveloperMode: (developerMode) => set({ developerMode }),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        developerMode: state.developerMode,
      }),
    }
  )
);
