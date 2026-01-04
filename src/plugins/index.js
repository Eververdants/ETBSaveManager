/**
 * 插件系统入口
 * 导出插件管理器和相关工具
 */

import { invoke } from "@tauri-apps/api/core";
import { pluginManager, PluginType, PluginStatus } from "./core/PluginManager";
import { languagePluginLoader } from "./loaders/LanguagePluginLoader";
import { themePluginLoader } from "./loaders/ThemePluginLoader";

// 注册内置加载器
pluginManager.registerLoader(PluginType.LANGUAGE, languagePluginLoader);
pluginManager.registerLoader(PluginType.THEME, themePluginLoader);

/**
 * 初始化插件系统
 */
export async function initializePluginSystem() {
  console.log("🔌 [Plugins] 正在初始化插件系统...");

  await pluginManager.initialize();

  // 自动加载已安装的插件（从 localStorage 恢复）
  const plugins = pluginManager.getAllPlugins();
  for (const plugin of plugins) {
    if (plugin.autoLoad !== false && plugin.status !== PluginStatus.ACTIVE) {
      try {
        await pluginManager.loadPlugin(plugin.id);
      } catch (error) {
        console.error(`❌ [Plugins] 自动加载插件失败: ${plugin.name}`, error);
      }
    }
  }

  console.log("✅ [Plugins] 插件系统初始化完成");
}

/**
 * 安装语言插件
 * @param {Object} options - 插件选项
 */
export async function installLanguagePlugin(options) {
  const {
    id,
    name,
    locale,
    localeName,
    data,
    version = "1.0.0",
    author = "Unknown",
    description = "",
  } = options;

  const pluginMeta = {
    id,
    type: PluginType.LANGUAGE,
    name,
    version,
    author,
    description,
    locale,
    localeName,
    data,
    autoLoad: true,
  };

  await pluginManager.registerPlugin(pluginMeta);
  await pluginManager.loadPlugin(id);

  return pluginMeta;
}

/**
 * 卸载语言插件
 * @param {string} pluginId - 插件ID
 */
export async function uninstallLanguagePlugin(pluginId) {
  return pluginManager.removePlugin(pluginId);
}

/**
 * 获取已安装的语言插件
 */
export function getInstalledLanguagePlugins() {
  return pluginManager.getPluginsByType(PluginType.LANGUAGE);
}

/**
 * 获取所有可用语言（内置 + 插件）
 */
export function getAllAvailableLanguages() {
  const builtIn = [
    { locale: "zh-CN", name: "简体中文", isBuiltIn: true },
    { locale: "zh-TW", name: "繁體中文", isBuiltIn: true },
    { locale: "en-US", name: "English", isBuiltIn: true },
  ];

  const plugins = getInstalledLanguagePlugins()
    .filter((p) => p.status === PluginStatus.ACTIVE)
    .map((p) => ({
      locale: p.locale,
      name: p.localeName || p.name,
      isBuiltIn: false,
      pluginId: p.id,
    }));

  return [...builtIn, ...plugins];
}

/**
 * 安装主题插件
 * @param {Object} options - 插件选项
 */
export async function installThemePlugin(options) {
  const {
    id,
    name,
    themeId,
    data,
    version = "1.0.0",
    author = "Unknown",
    description = "",
  } = options;

  const pluginMeta = {
    id,
    type: PluginType.THEME,
    name,
    version,
    author,
    description,
    themeId,
    data,
    autoLoad: true,
  };

  await pluginManager.registerPlugin(pluginMeta);
  await pluginManager.loadPlugin(id);

  return pluginMeta;
}

/**
 * 卸载主题插件
 * @param {string} pluginId - 插件ID
 */
export async function uninstallThemePlugin(pluginId) {
  return pluginManager.removePlugin(pluginId);
}

/**
 * 获取已安装的主题插件
 */
export function getInstalledThemePlugins() {
  return pluginManager.getPluginsByType(PluginType.THEME);
}

/**
 * 获取所有可用主题（内置 + 插件）
 */
export function getAllAvailableThemes() {
  return themePluginLoader.getAvailableThemes();
}

// 导出
export {
  pluginManager,
  languagePluginLoader,
  themePluginLoader,
  PluginType,
  PluginStatus,
};

export default {
  pluginManager,
  languagePluginLoader,
  themePluginLoader,
  initializePluginSystem,
  installLanguagePlugin,
  uninstallLanguagePlugin,
  getInstalledLanguagePlugins,
  getAllAvailableLanguages,
  installThemePlugin,
  uninstallThemePlugin,
  getInstalledThemePlugins,
  getAllAvailableThemes,
  PluginType,
  PluginStatus,
};
