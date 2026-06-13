/**
 * 主题插件加载器
 * 负责加载、验证和管理主题插件
 */

import storage from "../../services/storageService";

// 主题插件必需的 CSS 变量
const REQUIRED_VARIABLES = ["--bg-primary", "--bg-secondary", "--text-primary", "--accent-color"];

class ThemePluginLoader {
  constructor() {
    this.loadedThemes = new Map();
    this.styleElements = new Map();
  }

  /**
   * 验证主题插件数据
   * @param {Object} plugin - 插件元数据
   */
  validate(plugin) {
    const { themeId, data } = plugin;

    if (!themeId) {
      throw new Error("主题插件必须指定 themeId");
    }

    if (!data || typeof data !== "object") {
      throw new Error("主题插件必须包含主题数据");
    }

    // 检查必需的 CSS 变量
    const missingVars = REQUIRED_VARIABLES.filter((v) => !data.variables || !data.variables[v]);
    if (missingVars.length > 0) {
      console.warn(`⚠️ [ThemeLoader] 主题插件缺少变量: ${missingVars.join(", ")}`);
    }

    return true;
  }

  /**
   * 加载主题插件
   * @param {Object} plugin - 插件元数据
   */
  async load(plugin) {
    const { id, themeId, name, data } = plugin;

    console.log(`🎨 [ThemeLoader] 正在加载主题插件: ${name} (${themeId})`);

    // 验证插件
    this.validate(plugin);

    // 生成 CSS 样式
    const css = this.generateThemeCSS(themeId, data);

    // 创建 style 元素并注入
    const styleEl = document.createElement("style");
    styleEl.id = `theme-plugin-${id}`;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // 记录已加载
    this.loadedThemes.set(id, {
      themeId,
      name,
      data,
      loadedAt: Date.now(),
    });
    this.styleElements.set(id, styleEl);

    console.log(`✅ [ThemeLoader] 主题插件加载成功: ${name}`);

    return true;
  }

  /**
   * 卸载主题插件
   * @param {Object} plugin - 插件元数据
   */
  async unload(plugin) {
    const { id, themeId, name } = plugin;

    console.log(`🔄 [ThemeLoader] 正在卸载主题插件: ${name}`);

    // 移除 style 元素
    const styleEl = this.styleElements.get(id);
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }

    // 如果当前正在使用该主题，切换到默认主题
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme === themeId) {
      document.documentElement.setAttribute("data-theme", "light");
      storage.setItem("theme", "light");
      console.log(`🎨 [ThemeLoader] 已切换到默认主题`);
    }

    this.loadedThemes.delete(id);
    this.styleElements.delete(id);

    console.log(`✅ [ThemeLoader] 主题插件卸载成功: ${name}`);

    return true;
  }

  /**
   * 生成主题 CSS
   * @param {string} themeId - 主题ID
   * @param {Object} data - 主题数据
   */
  generateThemeCSS(themeId, data) {
    const { variables = {}, customCSS = "" } = data;

    // 生成 CSS 变量
    const cssVars = Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n");

    return `
/* 插件主题: ${themeId} */
[data-theme="${themeId}"] {
${cssVars}
}

${customCSS}
`.trim();
  }

  /**
   * 获取已加载的主题列表
   */
  getLoadedThemes() {
    return Array.from(this.loadedThemes.entries()).map(([id, info]) => ({
      id,
      ...info,
    }));
  }

  /**
   * 获取所有可用主题（内置 + 插件）
   */
  getAvailableThemes() {
    const builtIn = [
      { id: "light", name: "浅色", isBuiltIn: true },
      { id: "dark", name: "深色", isBuiltIn: true },
      { id: "ocean", name: "海洋", isBuiltIn: true },
      { id: "forest", name: "森林", isBuiltIn: true },
      { id: "sunset", name: "日落", isBuiltIn: true },
      { id: "lavender", name: "薰衣草", isBuiltIn: true },
      { id: "rose", name: "玫瑰", isBuiltIn: true },
      { id: "mint", name: "薄荷", isBuiltIn: true },
      { id: "peach", name: "蜜桃", isBuiltIn: true },
      { id: "sky", name: "天空", isBuiltIn: true },
      { id: "new-year", name: "元旦", isBuiltIn: true },
      { id: "high-contrast", name: "高对比度", isBuiltIn: true },
    ];

    const plugins = Array.from(this.loadedThemes.values()).map((theme) => ({
      id: theme.themeId,
      name: theme.name,
      isBuiltIn: false,
      pluginId: theme.id,
    }));

    return [...builtIn, ...plugins];
  }

  /**
   * 检查主题是否已加载
   * @param {string} themeId - 主题ID
   */
  isThemeLoaded(themeId) {
    return Array.from(this.loadedThemes.values()).some((t) => t.themeId === themeId);
  }

  /**
   * 切换到指定主题
   * @param {string} themeId - 主题ID
   */
  switchTheme(themeId) {
    document.documentElement.setAttribute("data-theme", themeId);
    storage.setItem("theme", themeId);
    console.log(`🎨 [ThemeLoader] 已切换主题: ${themeId}`);
    return true;
  }
}

// 单例导出
export const themePluginLoader = new ThemePluginLoader();
export default themePluginLoader;
