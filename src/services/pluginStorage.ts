/**
 * Plugin storage service
 * Each plugin is stored in a separate plugins/<plugin-id>/ folder
 * Structure:
 *   plugins/
 *     <plugin-id>/
 *       plugin.json    - Plugin metadata
 *       data.json      - Plugin data (translations/themes/etc.)
 */

import { BaseDirectory, exists, mkdir, readTextFile, writeTextFile, readDir, remove } from "@tauri-apps/plugin-fs";
import type { PluginData } from "../types";

// Plugin storage directory
const PLUGINS_DIR = "plugins";

/**
 * Ensure the plugins directory exists
 */
async function ensurePluginsDir(): Promise<void> {
  try {
    const dirExists = await exists(PLUGINS_DIR, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) {
      await mkdir(PLUGINS_DIR, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });
      console.log("📁 [PluginStorage] 创建插件目录");
    }
  } catch (error) {
    console.error("❌ [PluginStorage] 创建插件目录失败:", error);
  }
}

/**
 * Save plugin to local storage
 * @param plugin - Plugin object
 */
export async function savePlugin(plugin: PluginData): Promise<boolean> {
  try {
    await ensurePluginsDir();

    const pluginDir = `${PLUGINS_DIR}/${plugin.id}`;

    // Create plugin directory
    const dirExists = await exists(pluginDir, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) {
      await mkdir(pluginDir, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });
    }

    // Separate metadata and data
    const { data, ...metadata } = plugin;

    // Save metadata (plugin.json)
    const metaPath = `${pluginDir}/plugin.json`;
    await writeTextFile(metaPath, JSON.stringify(metadata, null, 2), {
      baseDir: BaseDirectory.AppData,
    });

    // Save data (data.json) - translation data or theme data
    if (data) {
      const dataPath = `${pluginDir}/data.json`;
      await writeTextFile(dataPath, JSON.stringify(data, null, 2), {
        baseDir: BaseDirectory.AppData,
      });
    }

    console.log(`💾 [PluginStorage] 已保存插件: ${plugin.id}`);
    return true;
  } catch (error) {
    console.error(`❌ [PluginStorage] 保存插件失败 (${plugin.id}):`, error);
    return false;
  }
}

/**
 * Load a single plugin
 * @param pluginId - Plugin ID
 */
export async function loadPlugin(pluginId: string): Promise<PluginData | null> {
  try {
    const pluginDir = `${PLUGINS_DIR}/${pluginId}`;

    // Check if plugin directory exists
    const dirExists = await exists(pluginDir, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) {
      return null;
    }

    // Read metadata
    const metaPath = `${pluginDir}/plugin.json`;
    const metaExists = await exists(metaPath, {
      baseDir: BaseDirectory.AppData,
    });
    if (!metaExists) {
      console.warn(`⚠️ [PluginStorage] 插件 ${pluginId} 缺少 plugin.json`);
      return null;
    }

    const metaContent = await readTextFile(metaPath, {
      baseDir: BaseDirectory.AppData,
    });
    const metadata = JSON.parse(metaContent) as Omit<PluginData, "data">;

    // Read data
    const dataPath = `${pluginDir}/data.json`;
    const dataExists = await exists(dataPath, {
      baseDir: BaseDirectory.AppData,
    });
    let data: Record<string, unknown> | undefined = undefined;

    if (dataExists) {
      const dataContent = await readTextFile(dataPath, {
        baseDir: BaseDirectory.AppData,
      });
      data = JSON.parse(dataContent);
    }

    const result: PluginData = { ...metadata, data: data as Record<string, unknown> | undefined } as PluginData;
    return result;
  } catch (error) {
    console.error(`❌ [PluginStorage] 加载插件失败 (${pluginId}):`, error);
    return null;
  }
}

/**
 * Load all installed plugins
 */
export async function loadAllPlugins(): Promise<PluginData[]> {
  try {
    await ensurePluginsDir();

    // Read the plugins directory
    const entries = await readDir(PLUGINS_DIR, {
      baseDir: BaseDirectory.AppData,
    });
    const plugins: PluginData[] = [];

    for (const entry of entries) {
      // Only process directories
      if (entry.isDirectory) {
        const plugin = await loadPlugin(entry.name!);
        if (plugin) {
          plugins.push(plugin);
        }
      }
    }

    console.log(`📂 [PluginStorage] 已加载 ${plugins.length} 个插件`);
    return plugins;
  } catch (error) {
    console.error("❌ [PluginStorage] 加载插件列表失败:", error);
    return [];
  }
}

/**
 * Delete a plugin
 * @param pluginId - Plugin ID
 */
export async function deletePlugin(pluginId: string): Promise<boolean> {
  try {
    const pluginDir = `${PLUGINS_DIR}/${pluginId}`;

    const dirExists = await exists(pluginDir, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) {
      return true;
    }

    await remove(pluginDir, {
      baseDir: BaseDirectory.AppData,
      recursive: true,
    });
    console.log(`🗑️ [PluginStorage] 已删除插件: ${pluginId}`);
    return true;
  } catch (error) {
    console.error(`❌ [PluginStorage] 删除插件失败 (${pluginId}):`, error);
    return false;
  }
}

/**
 * Update plugin metadata
 * @param pluginId - Plugin ID
 * @param updates - Fields to update
 */
export async function updatePluginMeta(pluginId: string, updates: Partial<Omit<PluginData, "data">>): Promise<boolean> {
  try {
    const plugin = await loadPlugin(pluginId);
    if (!plugin) {
      return false;
    }

    const { data: _data, ...metadata } = plugin;
    const updatedMeta = { ...metadata, ...updates };

    const metaPath = `${PLUGINS_DIR}/${pluginId}/plugin.json`;
    await writeTextFile(metaPath, JSON.stringify(updatedMeta, null, 2), {
      baseDir: BaseDirectory.AppData,
    });

    return true;
  } catch (error) {
    console.error(`❌ [PluginStorage] 更新插件元数据失败 (${pluginId}):`, error);
    return false;
  }
}

/**
 * Check if a plugin exists
 * @param pluginId - Plugin ID
 */
export async function pluginExists(pluginId: string): Promise<boolean> {
  try {
    const pluginDir = `${PLUGINS_DIR}/${pluginId}`;
    return await exists(pluginDir, { baseDir: BaseDirectory.AppData });
  } catch {
    return false;
  }
}

export default {
  savePlugin,
  loadPlugin,
  loadAllPlugins,
  deletePlugin,
  updatePluginMeta,
  pluginExists,
};
