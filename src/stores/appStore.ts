/**
 * App Store - 应用全局状态
 * 主题、语言、侧边栏状态
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Theme, Language } from "../types";
import { DEFAULT_CONFIG } from "../constants";

interface AppState {
  theme: Theme;
  language: Language;
  sidebarCollapsed: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: DEFAULT_CONFIG.THEME,
      language: DEFAULT_CONFIG.LANGUAGE,
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
