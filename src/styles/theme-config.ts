/**
 * ThemeManager - 核心主题管理器 (simplified)
 *
 * 仅负责预设主题的切换与持久化。
 */

import { ref, readonly } from "vue";
import type { Ref, DeepReadonly } from "vue";
import { themeStorage } from "../services/themeStorage.js";
import storage from "../services/storageService";

interface PresetTheme {
  id: string;
  name: string;
  type: string;
}

/**
 * 预设主题定义
 */
export const PRESET_THEMES: Record<string, PresetTheme> = {
  light: { id: "light", name: "亮色", type: "preset" },
  dark: { id: "dark", name: "暗色", type: "preset" },
  "high-contrast": { id: "high-contrast", name: "高对比度", type: "preset" },
  ocean: { id: "ocean", name: "海洋", type: "preset" },
  forest: { id: "forest", name: "森林", type: "preset" },
  sunset: { id: "sunset", name: "日落", type: "preset" },
  lavender: { id: "lavender", name: "薰衣草", type: "preset" },
  rose: { id: "rose", name: "玫瑰", type: "preset" },
  mint: { id: "mint", name: "薄荷", type: "preset" },
  peach: { id: "peach", name: "蜜桃", type: "preset" },
  sky: { id: "sky", name: "天空", type: "preset" },
};

const DEFAULT_THEME_ID = "light";
const TRANSITION_DURATION = 250;

function prefersReducedMotion(): boolean {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

class ThemeManager {
  private _currentThemeId: Ref<string | null>;
  private _isInitialized: Ref<boolean>;
  private _transitionEnabled: boolean = false;

  constructor() {
    this._currentThemeId = ref<string | null>(null);
    this._isInitialized = ref(false);
  }

  get currentThemeId(): DeepReadonly<Ref<string | null>> {
    return readonly(this._currentThemeId);
  }

  get isInitialized(): DeepReadonly<Ref<boolean>> {
    return readonly(this._isInitialized);
  }

  async init(): Promise<void> {
    if (this._isInitialized.value) return;

    try {
      const domTheme = document.documentElement.getAttribute("data-theme");

      let activeThemeId: string | null = null;
      try {
        activeThemeId = await themeStorage.getActiveThemeId();
      } catch (e) {
        activeThemeId = storage.getItem<string>("theme");
      }

      const themeToApply = activeThemeId || domTheme || DEFAULT_THEME_ID;
      this._transitionEnabled = false;
      await this.setTheme(themeToApply);
      this._transitionEnabled = true;
      this._setupTransitionStyles();
      this._isInitialized.value = true;
    } catch (error) {
      console.error("Failed to initialize ThemeManager:", error);
      this._currentThemeId.value = DEFAULT_THEME_ID;
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME_ID);
      this._isInitialized.value = true;
    }
  }

  private _setupTransitionStyles(): void {
    if (document.getElementById("theme-transition-styles")) return;

    const style = document.createElement("style");
    style.id = "theme-transition-styles";
    style.textContent = `
      :root.theme-transitioning {
        transition: background-color ${TRANSITION_DURATION}ms ease, color ${TRANSITION_DURATION}ms ease !important;
      }
      :root.theme-transitioning body,
      :root.theme-transitioning .settings-container,
      :root.theme-transitioning .setting-group,
      :root.theme-transitioning .setting-item,
      :root.theme-transitioning .sidebar,
      :root.theme-transitioning .main-content {
        transition: background-color ${TRANSITION_DURATION}ms ease, color ${TRANSITION_DURATION}ms ease, border-color ${TRANSITION_DURATION}ms ease !important;
      }
      @media (prefers-reduced-motion: reduce) {
        :root.theme-transitioning,
        :root.theme-transitioning body,
        :root.theme-transitioning .settings-container,
        :root.theme-transitioning .setting-group,
        :root.theme-transitioning .setting-item,
        :root.theme-transitioning .sidebar,
        :root.theme-transitioning .main-content {
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  getCurrentTheme(): PresetTheme {
    const themeId = this._currentThemeId.value;
    return PRESET_THEMES[themeId as string] || PRESET_THEMES[DEFAULT_THEME_ID];
  }

  async setTheme(themeId: string): Promise<boolean> {
    if (!themeId) {
      console.warn("Invalid theme ID");
      return false;
    }

    if (!PRESET_THEMES[themeId]) {
      console.warn(`Theme not found: ${themeId}`);
      return false;
    }

    if (this._transitionEnabled && !prefersReducedMotion()) {
      document.documentElement.classList.add("theme-transitioning");
    }

    try {
      document.documentElement.setAttribute("data-theme", themeId);
      this._currentThemeId.value = themeId;

      try {
        await themeStorage.setActiveThemeId(themeId);
      } catch (e) {
        storage.setItem("theme", themeId);
      }

      if (this._transitionEnabled) {
        setTimeout(() => {
          document.documentElement.classList.remove("theme-transitioning");
        }, TRANSITION_DURATION);
      }

      return true;
    } catch (error) {
      console.error("Failed to set theme:", error);
      document.documentElement.classList.remove("theme-transitioning");
      return false;
    }
  }

  async resetToDefault(): Promise<void> {
    await this.setTheme(DEFAULT_THEME_ID);
  }

  getAllThemes(): PresetTheme[] {
    return Object.values(PRESET_THEMES);
  }

  getSystemTheme(): string {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  themeExists(themeId: string): boolean {
    return !!PRESET_THEMES[themeId];
  }
}

// 创建单例实例
const themeManager = new ThemeManager();

export { themeManager, ThemeManager };
export default themeManager;

// 兼容旧版 API
export const themePresets: Record<string, PresetTheme> = PRESET_THEMES;
