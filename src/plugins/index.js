/**
 * Plugin system entry point
 * Exports the plugin manager and related utilities
 */

import { invoke } from "@tauri-apps/api/core";
import { pluginManager, PluginType, PluginStatus } from "./core/PluginManager";
import { languagePluginLoader } from "./loaders/LanguagePluginLoader";
import { themePluginLoader } from "./loaders/ThemePluginLoader";
import { pagePluginLoader } from "./loaders/PagePluginLoader";

// Register built-in loaders
pluginManager.registerLoader(PluginType.LANGUAGE, languagePluginLoader);
pluginManager.registerLoader(PluginType.THEME, themePluginLoader);
pluginManager.registerLoader(PluginType.PAGE, pagePluginLoader);

/**
 * Initialize the plugin system
 */
export async function initializePluginSystem() {
  console.log("🔌 [Plugins] 正在初始化插件系统...");

  await pluginManager.initialize();

  // Auto-load installed plugins (restored from localStorage)
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
 * Install a language plugin
 * @param {Object} options - Plugin options
 */
export async function installLanguagePlugin(options) {
  const { id, name, locale, localeName, data, version = "1.0.0", author = "Unknown", description = "" } = options;

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
 * Uninstall a language plugin
 * @param {string} pluginId - Plugin ID
 */
export async function uninstallLanguagePlugin(pluginId) {
  return pluginManager.removePlugin(pluginId);
}

/**
 * Get installed language plugins
 */
export function getInstalledLanguagePlugins() {
  return pluginManager.getPluginsByType(PluginType.LANGUAGE);
}

/**
 * Get all available languages (built-in + plugins)
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
 * Install a theme plugin
 * @param {Object} options - Plugin options
 */
export async function installThemePlugin(options) {
  const { id, name, themeId, data, version = "1.0.0", author = "Unknown", description = "" } = options;

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
 * Uninstall a theme plugin
 * @param {string} pluginId - Plugin ID
 */
export async function uninstallThemePlugin(pluginId) {
  return pluginManager.removePlugin(pluginId);
}

/**
 * Get installed theme plugins
 */
export function getInstalledThemePlugins() {
  return pluginManager.getPluginsByType(PluginType.THEME);
}

/**
 * Get all available themes (built-in + plugins)
 */
export function getAllAvailableThemes() {
  return themePluginLoader.getAvailableThemes();
}

/**
 * Install a page plugin
 * @param {Object} options - Plugin options
 */
export async function installPagePlugin(options) {
  const { id, name, data, version = "1.0.0", author = "Unknown", description = "" } = options;

  const pluginMeta = {
    id,
    type: PluginType.PAGE,
    name,
    version,
    author,
    description,
    data,
    autoLoad: true,
  };

  await pluginManager.registerPlugin(pluginMeta);
  await pluginManager.loadPlugin(id);

  return pluginMeta;
}

/**
 * Uninstall a page plugin
 * @param {string} pluginId - Plugin ID
 */
export async function uninstallPagePlugin(pluginId) {
  return pluginManager.removePlugin(pluginId);
}

/**
 * Get installed page plugins
 */
export function getInstalledPagePlugins() {
  return pluginManager.getPluginsByType(PluginType.PAGE);
}

// Exports
export { pluginManager, languagePluginLoader, themePluginLoader, pagePluginLoader, PluginType, PluginStatus };

export default {
  pluginManager,
  languagePluginLoader,
  themePluginLoader,
  pagePluginLoader,
  initializePluginSystem,
  installLanguagePlugin,
  uninstallLanguagePlugin,
  getInstalledLanguagePlugins,
  getAllAvailableLanguages,
  installThemePlugin,
  uninstallThemePlugin,
  getInstalledThemePlugins,
  getAllAvailableThemes,
  installPagePlugin,
  uninstallPagePlugin,
  getInstalledPagePlugins,
  PluginType,
  PluginStatus,
};
