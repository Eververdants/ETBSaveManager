/**
 * Zustand 状态管理
 * 每个 Store 应独立文件，遵循单一职责原则
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Theme, Language } from "../types";
import { DEFAULT_CONFIG } from "../constants";

// ============================================
// App Store - 应用全局状态
// ============================================
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
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
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

// ============================================
// Save Store - 存档管理状态
// ============================================
interface SaveState {
  currentPath: string;
  selectedSaves: string[];
  setCurrentPath: (path: string) => void;
  selectSave: (id: string) => void;
  deselectSave: (id: string) => void;
  clearSelection: () => void;
}

export const useSaveStore = create<SaveState>()((set) => ({
  currentPath: "",
  selectedSaves: [],
  setCurrentPath: (currentPath) => set({ currentPath }),
  selectSave: (id) =>
    set((state) => ({
      selectedSaves: [...state.selectedSaves, id],
    })),
  deselectSave: (id) =>
    set((state) => ({
      selectedSaves: state.selectedSaves.filter((s) => s !== id),
    })),
  clearSelection: () => set({ selectedSaves: [] }),
}));

// ============================================
// UI Store - UI 临时状态（不需要持久化）
// ============================================
interface UIState {
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isLoading: false,
  error: null,
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
