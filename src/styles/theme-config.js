/**
 * ThemeManager - 核心主题管理器
 *
 * 提供统一的主题管理 API，支持预设主题和自定义主题。
 * 实现原子化 CSS 变量应用、预览功能和主题切换动画。
 *
 * Requirements: 1.1, 1.3, 1.4, 5.3, 7.1, 7.2, 7.3
 */

import { ref, readonly, computed } from "vue";
import {
  themeValidator,
  CSS_VARIABLE_MAP,
  DEFAULT_THEME_TEMPLATE,
} from "../services/themeValidator.js";
import { themeStorage } from "../services/themeStorage.js";
import storage from "../services/storageService";

/**
 * 限时主题配置
 * 定义主题的可用时间范围
 */
export const SEASONAL_THEMES = {
  "spring-festival-dark": {
    startDate: "2026-02-13",
    endDate: "2026-02-24",
  },
  "spring-festival-light": {
    startDate: "2026-02-13",
    endDate: "2026-02-24",
  },
};

/**
 * 检查限时主题是否在可用时间范围内
 * @param {string} themeId - 主题 ID
 * @returns {boolean} 是否可用
 */
export function isSeasonalThemeAvailable(themeId) {
  const config = SEASONAL_THEMES[themeId];
  if (!config) {
    return true; // 非限时主题始终可用
  }

  // 检查开发者选项中的限时主题模式
  try {
    const mode = localStorage.getItem("seasonalThemeMode") || "auto";
    if (mode === "force") return true;
    if (mode === "hide") return false;
  } catch (e) {
    // localStorage 不可用时忽略
  }

  const now = new Date();
  const start = new Date(config.startDate + "T00:00:00");
  const end = new Date(config.endDate + "T23:59:59");

  return now >= start && now <= end;
}

/**
 * 获取限时主题的可用时间描述
 * @param {string} themeId - 主题 ID
 * @returns {string|null} 时间描述或 null
 */
export function getSeasonalThemeAvailability(themeId) {
  const config = SEASONAL_THEMES[themeId];
  if (!config) {
    return null;
  }
  return `${config.startDate} ~ ${config.endDate}`;
}

/**
 * 预设主题定义
 */
export const PRESET_THEMES = {
  light: {
    id: "light",
    name: "亮色",
    type: "preset",
  },
  dark: {
    id: "dark",
    name: "暗色",
    type: "preset",
  },
  "new-year": {
    id: "new-year",
    name: "元旦",
    type: "preset",
  },
  "spring-festival-dark": {
    id: "spring-festival-dark",
    name: "春节 (深色)",
    type: "preset",
    seasonal: true,
    icon: "🧧",
  },
  "spring-festival-light": {
    id: "spring-festival-light",
    name: "春节 (浅色)",
    type: "preset",
    seasonal: true,
    icon: "🧧",
  },
  "high-contrast": {
    id: "high-contrast",
    name: "高对比度",
    type: "preset",
  },
  ocean: {
    id: "ocean",
    name: "海洋",
    type: "preset",
  },
  forest: {
    id: "forest",
    name: "森林",
    type: "preset",
  },
  sunset: {
    id: "sunset",
    name: "日落",
    type: "preset",
  },
  lavender: {
    id: "lavender",
    name: "薰衣草",
    type: "preset",
  },
  rose: {
    id: "rose",
    name: "玫瑰",
    type: "preset",
  },
  mint: {
    id: "mint",
    name: "薄荷",
    type: "preset",
  },
  peach: {
    id: "peach",
    name: "蜜桃",
    type: "preset",
  },
  sky: {
    id: "sky",
    name: "天空",
    type: "preset",
  },
};

/**
 * 默认主题 ID
 */
const DEFAULT_THEME_ID = "light";

/**
 * 主题切换过渡时长 (ms)
 */
const TRANSITION_DURATION = 250;

/**
 * CSS 变量映射 - 从 camelCase 到 CSS 变量名
 */
const cssVariableMap = CSS_VARIABLE_MAP;

/**
 * 检测用户是否偏好减少动画
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * ThemeManager 类
 * 提供主题管理的核心功能
 */
class ThemeManager {
  constructor() {
    // 响应式状态
    this._currentThemeId = ref(null);
    this._isPreviewing = ref(false);
    this._customThemes = ref([]);
    this._previewColors = ref(null);
    this._isInitialized = ref(false);

    // 缓存当前应用的颜色
    this._appliedColors = null;

    // 过渡动画状态
    this._transitionEnabled = true;
  }

  /**
   * 当前主题 ID (只读响应式)
   */
  get currentThemeId() {
    return readonly(this._currentThemeId);
  }

  /**
   * 是否处于预览模式 (只读响应式)
   */
  get isPreviewing() {
    return readonly(this._isPreviewing);
  }

  /**
   * 自定义主题列表 (只读响应式)
   */
  get customThemes() {
    return readonly(this._customThemes);
  }

  /**
   * 是否已初始化
   */
  get isInitialized() {
    return readonly(this._isInitialized);
  }

  /**
   * 初始化主题管理器
   * 从存储加载保存的主题设置
   */
  async init() {
    if (this._isInitialized.value) {
      return;
    }

    try {
      // 从 DOM 获取当前主题（可能由内联脚本设置）
      const domTheme = document.documentElement.getAttribute("data-theme");

      // 尝试从 Tauri 后端加载活跃主题 ID
      let activeThemeId = null;
      try {
        activeThemeId = await themeStorage.getActiveThemeId();
      } catch (e) {
        // Tauri 不可用时，从 localStorage 回退
        activeThemeId = storage.getItem("theme");
      }

      // 加载自定义主题列表
      try {
        const themes = await themeStorage.loadCustomThemes();
        this._customThemes.value = themes;
      } catch (e) {
        console.warn("Failed to load custom themes:", e);
        this._customThemes.value = [];
      }

      // 确定要应用的主题
      const themeToApply = activeThemeId || domTheme || DEFAULT_THEME_ID;

      // 设置当前主题（不触发过渡动画）
      this._transitionEnabled = false;
      await this.setTheme(themeToApply);
      this._transitionEnabled = true;

      // 设置过渡样式
      this._setupTransitionStyles();

      this._isInitialized.value = true;
    } catch (error) {
      console.error("Failed to initialize ThemeManager:", error);
      // 回退到默认主题
      this._currentThemeId.value = DEFAULT_THEME_ID;
      document.documentElement.setAttribute("data-theme", DEFAULT_THEME_ID);
      this._isInitialized.value = true;
    }
  }

  /**
   * 设置过渡样式
   * @private
   */
  _setupTransitionStyles() {
    // 检查是否已添加过渡样式
    if (document.getElementById("theme-transition-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "theme-transition-styles";
    style.textContent = `
      /* 主题切换过渡 - 只对关键容器元素添加过渡，避免性能问题 */
      :root.theme-transitioning {
        transition: 
          background-color ${TRANSITION_DURATION}ms ease,
          color ${TRANSITION_DURATION}ms ease !important;
      }

      :root.theme-transitioning body,
      :root.theme-transitioning .settings-container,
      :root.theme-transitioning .setting-group,
      :root.theme-transitioning .setting-item,
      :root.theme-transitioning .sidebar,
      :root.theme-transitioning .main-content {
        transition: 
          background-color ${TRANSITION_DURATION}ms ease,
          color ${TRANSITION_DURATION}ms ease,
          border-color ${TRANSITION_DURATION}ms ease !important;
      }

      /* 尊重用户动画偏好 */
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

  /**
   * 获取当前主题对象
   * @returns {Object} 当前主题对象
   */
  getCurrentTheme() {
    const themeId = this._currentThemeId.value;

    if (!themeId) {
      return PRESET_THEMES[DEFAULT_THEME_ID];
    }

    // 检查是否是预设主题
    if (PRESET_THEMES[themeId]) {
      return PRESET_THEMES[themeId];
    }

    // 检查是否是自定义主题
    const customTheme = this._customThemes.value.find((t) => t.id === themeId);
    if (customTheme) {
      return customTheme;
    }

    // 回退到默认主题
    return PRESET_THEMES[DEFAULT_THEME_ID];
  }

  /**
   * 设置主题（预设或自定义）
   * @param {string} themeId - 主题 ID
   * @returns {Promise<boolean>} 是否成功
   */
  async setTheme(themeId) {
    if (!themeId) {
      console.warn("Invalid theme ID");
      return false;
    }

    // 取消预览模式
    if (this._isPreviewing.value) {
      this._isPreviewing.value = false;
      this._previewColors.value = null;
    }

    // 检查是否是预设主题
    const isPreset = !!PRESET_THEMES[themeId];

    // 检查是否是自定义主题
    const customTheme = this._customThemes.value.find((t) => t.id === themeId);

    if (!isPreset && !customTheme) {
      console.warn(`Theme not found: ${themeId}`);
      return false;
    }

    // 检查限时主题是否在可用时间范围内
    if (isPreset && !isSeasonalThemeAvailable(themeId)) {
      const availability = getSeasonalThemeAvailability(themeId);
      console.warn(`Seasonal theme "${themeId}" is not available. Available: ${availability}`);
      return false;
    }

    // 启用过渡动画
    if (this._transitionEnabled && !prefersReducedMotion()) {
      document.documentElement.classList.add("theme-transitioning");
    }

    try {
      if (isPreset) {
        // 应用预设主题 - 通过 data-theme 属性
        document.documentElement.setAttribute("data-theme", themeId);
        // 清除自定义 CSS 变量
        this._clearCustomCSSVariables();
      } else {
        // 应用自定义主题
        // 先设置基础主题（light 或 dark）
        const baseTheme = this._detectBaseTheme(customTheme.colors);
        document.documentElement.setAttribute("data-theme", baseTheme);
        // 然后应用自定义颜色
        this._applyColorsAtomically(customTheme.colors);
      }

      // 更新状态
      this._currentThemeId.value = themeId;

      // 持久化设置
      try {
        await themeStorage.setActiveThemeId(themeId);
      } catch (e) {
        // Tauri 不可用时，回退到 localStorage
        storage.setItem("theme", themeId);
      }

      // 移除过渡类
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

  /**
   * 应用自定义主题颜色（原子操作）
   * @param {Object} colors - 主题颜色对象
   */
  applyCustomColors(colors) {
    if (!colors || typeof colors !== "object") {
      console.warn("Invalid colors object");
      return;
    }

    // 验证所有颜色
    const validation = themeValidator.validateAllColors(colors);
    if (!validation.valid) {
      console.warn("Color validation failed:", validation.error);
      return;
    }

    // 合并默认模板确保完整性
    const completeColors = themeValidator.mergeWithTemplate(colors);

    // 原子化应用
    this._applyColorsAtomically(completeColors);
    this._appliedColors = completeColors;
  }

  /**
   * 原子化应用 CSS 变量
   * @param {Object} colors - 颜色对象
   * @private
   */
  _applyColorsAtomically(colors) {
    const root = document.documentElement;

    // 使用 requestAnimationFrame 批量更新，确保原子性
    requestAnimationFrame(() => {
      Object.entries(colors).forEach(([key, value]) => {
        const cssVar = cssVariableMap[key];
        if (cssVar) {
          root.style.setProperty(cssVar, value);
        }
      });
    });
  }

  /**
   * 清除自定义 CSS 变量
   * @private
   */
  _clearCustomCSSVariables() {
    const root = document.documentElement;

    requestAnimationFrame(() => {
      Object.values(cssVariableMap).forEach((cssVar) => {
        root.style.removeProperty(cssVar);
      });
    });

    this._appliedColors = null;
  }

  /**
   * 检测自定义主题的基础主题（亮色或暗色）
   * @param {Object} colors - 颜色对象
   * @returns {string} 'light' 或 'dark'
   * @private
   */
  _detectBaseTheme(colors) {
    if (!colors || !colors.bg) {
      return "light";
    }

    // 解析背景色
    const bgColor = themeValidator.parseColor(colors.bg);
    if (!bgColor) {
      return "light";
    }

    // 计算亮度
    const luminance =
      (0.299 * bgColor.r + 0.587 * bgColor.g + 0.114 * bgColor.b) / 255;

    return luminance > 0.5 ? "light" : "dark";
  }

  /**
   * 预览主题（隔离预览，不保存）
   * @param {Object} colors - 要预览的颜色
   */
  previewTheme(colors) {
    if (!colors || typeof colors !== "object") {
      return;
    }

    // 保存预览状态
    this._isPreviewing.value = true;
    this._previewColors.value = colors;

    // 合并默认模板
    const completeColors = themeValidator.mergeWithTemplate(colors);

    // 应用预览颜色到 document
    this._applyColorsAtomically(completeColors);
  }

  /**
   * 取消预览，恢复当前主题
   */
  cancelPreview() {
    if (!this._isPreviewing.value) {
      return;
    }

    this._isPreviewing.value = false;
    this._previewColors.value = null;

    // 恢复当前主题
    const currentTheme = this.getCurrentTheme();

    if (currentTheme.type === "preset") {
      // 清除自定义变量，让 CSS 主题生效
      this._clearCustomCSSVariables();
    } else if (currentTheme.colors) {
      // 重新应用自定义主题颜色
      this._applyColorsAtomically(currentTheme.colors);
    }
  }

  /**
   * 重置为默认主题
   */
  async resetToDefault() {
    await this.setTheme(DEFAULT_THEME_ID);
  }

  /**
   * 获取所有可用主题（过滤掉不在时间范围内的限时主题）
   * @param {boolean} includeUnavailable - 是否包含不可用的限时主题（默认 false）
   * @returns {Object[]} 主题列表
   */
  getAllThemes(includeUnavailable = false) {
    const presets = Object.values(PRESET_THEMES).map((theme) => {
      const availability = getSeasonalThemeAvailability(theme.id);
      const isAvailable = isSeasonalThemeAvailable(theme.id);
      return {
        ...theme,
        availability,
        isAvailable,
      };
    });

    // 过滤不可用的限时主题
    const filteredPresets = includeUnavailable
      ? presets
      : presets.filter((theme) => theme.isAvailable);

    const customs = this._customThemes.value;
    return [...filteredPresets, ...customs];
  }

  /**
   * 获取所有主题（包括不可用的限时主题）
   * @returns {Object[]} 主题列表
   */
  getAllThemesIncludingUnavailable() {
    return this.getAllThemes(true);
  }

  /**
   * 获取默认变量模板
   * @returns {Object} 默认颜色模板
   */
  getDefaultTemplate() {
    return { ...DEFAULT_THEME_TEMPLATE };
  }

  /**
   * 刷新自定义主题列表
   */
  async refreshCustomThemes() {
    try {
      const themes = await themeStorage.loadCustomThemes();
      this._customThemes.value = themes;
    } catch (e) {
      console.warn("Failed to refresh custom themes:", e);
    }
  }

  /**
   * 添加自定义主题
   * @param {Object} theme - 主题对象
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async addCustomTheme(theme) {
    const result = await themeStorage.saveCustomTheme(theme);
    if (result.success) {
      await this.refreshCustomThemes();
    }
    return result;
  }

  /**
   * 删除自定义主题
   * @param {string} themeId - 主题 ID
   * @returns {Promise<boolean>}
   */
  async deleteCustomTheme(themeId) {
    const success = await themeStorage.deleteCustomTheme(themeId);

    if (success) {
      // 如果删除的是当前主题，切换到默认主题
      if (this._currentThemeId.value === themeId) {
        await this.setTheme(DEFAULT_THEME_ID);
      }
      await this.refreshCustomThemes();
    }

    return success;
  }

  /**
   * 获取系统主题偏好
   * @returns {string} 'light' 或 'dark'
   */
  getSystemTheme() {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  /**
   * 检查主题是否存在
   * @param {string} themeId - 主题 ID
   * @returns {boolean}
   */
  themeExists(themeId) {
    if (PRESET_THEMES[themeId]) {
      return true;
    }
    return this._customThemes.value.some((t) => t.id === themeId);
  }

  /**
   * 获取 CSS 变量映射
   * @returns {Object}
   */
  getCSSVariableMap() {
    return { ...cssVariableMap };
  }
}

// 创建单例实例
const themeManager = new ThemeManager();

// 导出实例和类
export { themeManager, ThemeManager };
export default themeManager;

// 兼容旧版 API
export const themePresets = PRESET_THEMES;

export const userThemeStorage = {
  save: (theme) => {
    storage.setItem("user-custom-theme", JSON.stringify(theme));
  },
  load: () => {
    const saved = storage.getItem("user-custom-theme");
    return saved ? JSON.parse(saved) : null;
  },
  clear: () => {
    storage.removeItem("user-custom-theme");
  },
};

// 颜色验证工具（兼容旧版）
export const colorValidator = {
  isValidHex: (hex) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex),
  isValidRgba: (rgba) => /^rgba?\(([^)]+)\)$/.test(rgba),
  toRgba: (hex, alpha = 1) => {
    if (!colorValidator.isValidHex(hex)) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },
};
