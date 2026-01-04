/**
 * 插件存储服务
 * 每个插件单独存储在 plugins/<plugin-id>/ 文件夹中
 * 结构：
 *   plugins/
 *     <plugin-id>/
 *       plugin.json    - 插件元数据
 *       data.json      - 插件数据（翻译/主题等）
 */

import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
  readDir,
  remove,
} from "@tauri-apps/plugin-fs";

// 插件存储目录
const PLUGINS_DIR = "plugins";

/**
 * 确保插件目录存在
 */
async function ensurePluginsDir() {
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
 * 保存插件到本地
 * @param {Object} plugin - 插件对象
 */
export async function savePlugin(plugin) {
  try {
    await ensurePluginsDir();

    const pluginDir = `${PLUGINS_DIR}/${plugin.id}`;

    // 创建插件目录
    const dirExists = await exists(pluginDir, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) {
      await mkdir(pluginDir, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });
    }

    // 分离元数据和数据
    const { data, ...metadata } = plugin;

    // 保存元数据 (plugin.json)
    const metaPath = `${pluginDir}/plugin.json`;
    await writeTextFile(metaPath, JSON.stringify(metadata, null, 2), {
      baseDir: BaseDirectory.AppData,
    });

    // 保存数据 (data.json) - 翻译数据或主题数据
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
 * 加载单个插件
 * @param {string} pluginId - 插件ID
 */
export async function loadPlugin(pluginId) {
  try {
    const pluginDir = `${PLUGINS_DIR}/${pluginId}`;

    // 检查插件目录是否存在
    const dirExists = await exists(pluginDir, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) {
      return null;
    }

    // 读取元数据
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
    const metadata = JSON.parse(metaContent);

    // 读取数据
    const dataPath = `${pluginDir}/data.json`;
    const dataExists = await exists(dataPath, {
      baseDir: BaseDirectory.AppData,
    });
    let data = null;

    if (dataExists) {
      const dataContent = await readTextFile(dataPath, {
        baseDir: BaseDirectory.AppData,
      });
      data = JSON.parse(dataContent);
    }

    return { ...metadata, data };
  } catch (error) {
    console.error(`❌ [PluginStorage] 加载插件失败 (${pluginId}):`, error);
    return null;
  }
}

/**
 * 加载所有已安装的插件
 */
export async function loadAllPlugins() {
  try {
    await ensurePluginsDir();

    // 读取插件目录
    const entries = await readDir(PLUGINS_DIR, {
      baseDir: BaseDirectory.AppData,
    });
    const plugins = [];

    for (const entry of entries) {
      // 只处理目录
      if (entry.isDirectory) {
        const plugin = await loadPlugin(entry.name);
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
 * 删除插件
 * @param {string} pluginId - 插件ID
 */
export async function deletePlugin(pluginId) {
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
 * 更新插件状态
 * @param {string} pluginId - 插件ID
 * @param {Object} updates - 要更新的字段
 */
export async function updatePluginMeta(pluginId, updates) {
  try {
    const plugin = await loadPlugin(pluginId);
    if (!plugin) {
      return false;
    }

    const { data, ...metadata } = plugin;
    const updatedMeta = { ...metadata, ...updates };

    const metaPath = `${PLUGINS_DIR}/${pluginId}/plugin.json`;
    await writeTextFile(metaPath, JSON.stringify(updatedMeta, null, 2), {
      baseDir: BaseDirectory.AppData,
    });

    return true;
  } catch (error) {
    console.error(
      `❌ [PluginStorage] 更新插件元数据失败 (${pluginId}):`,
      error
    );
    return false;
  }
}

/**
 * 检查插件是否存在
 * @param {string} pluginId - 插件ID
 */
export async function pluginExists(pluginId) {
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
