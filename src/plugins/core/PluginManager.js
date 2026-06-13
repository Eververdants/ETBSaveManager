/**
 * 插件管理器 - 核心模块
 * 负责插件的注册、加载、卸载和生命周期管理
 * 插件数据存储在 AppData/plugins/<plugin-id>/ 目录下
 */

import { reactive, readonly } from "vue";
import pluginStorage from "../../services/pluginStorage";
import storage from "../../services/storageService";

// 插件类型枚举
export const PluginType = {
  LANGUAGE: "language",
  THEME: "theme",
  FEATURE: "feature",
  PAGE: "page", // 新增：页面插件类型
};

// 插件状态枚举
export const PluginStatus = {
  UNLOADED: "unloaded",
  LOADING: "loading",
  ACTIVE: "active",
  ERROR: "error",
  DISABLED: "disabled",
};

class PluginManager {
  constructor() {
    // 响应式状态
    this.state = reactive({
      plugins: new Map(),
      loadedPlugins: new Set(),
      pluginErrors: new Map(),
    });

    // 插件加载器注册表
    this.loaders = new Map();

    // 事件监听器
    this.listeners = new Map();

    // 初始化标志
    this.initialized = false;
  }

  /**
   * 初始化插件管理器
   */
  async initialize() {
    if (this.initialized) return;

    console.log("🔌 [PluginManager] 初始化插件系统...");

    // 从本地文件恢复已安装的插件
    await this.restorePlugins();

    this.initialized = true;
    console.log("✅ [PluginManager] 插件系统初始化完成");
  }

  /**
   * 注册插件加载器
   * @param {string} type - 插件类型
   * @param {Object} loader - 加载器实例
   */
  registerLoader(type, loader) {
    if (this.loaders.has(type)) {
      console.warn(`⚠️ [PluginManager] 加载器 ${type} 已存在，将被覆盖`);
    }
    this.loaders.set(type, loader);
    console.log(`📦 [PluginManager] 已注册加载器: ${type}`);
  }

  /**
   * 获取插件加载器
   * @param {string} type - 插件类型
   */
  getLoader(type) {
    return this.loaders.get(type);
  }

  /**
   * 注册插件
   * @param {Object} pluginMeta - 插件元数据
   */
  async registerPlugin(pluginMeta) {
    const { id, type, name, version } = pluginMeta;

    if (!id || !type || !name) {
      throw new Error("插件元数据不完整，需要 id, type, name");
    }

    if (this.state.plugins.has(id)) {
      console.warn(`⚠️ [PluginManager] 插件 ${id} 已注册`);
      return false;
    }

    const plugin = {
      ...pluginMeta,
      status: PluginStatus.UNLOADED,
      installedAt: Date.now(),
    };

    this.state.plugins.set(id, plugin);

    // 保存到本地文件
    await pluginStorage.savePlugin(plugin);

    console.log(`📥 [PluginManager] 已注册插件: ${name} v${version}`);
    this.emit("plugin:registered", plugin);

    return true;
  }

  /**
   * 加载插件
   * @param {string} pluginId - 插件ID
   */
  async loadPlugin(pluginId) {
    const plugin = this.state.plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`插件 ${pluginId} 未注册`);
    }

    if (plugin.status === PluginStatus.ACTIVE) {
      console.log(`ℹ️ [PluginManager] 插件 ${pluginId} 已加载`);
      return true;
    }

    const loader = this.loaders.get(plugin.type);
    if (!loader) {
      throw new Error(`未找到类型 ${plugin.type} 的加载器`);
    }

    try {
      plugin.status = PluginStatus.LOADING;
      console.log(`🔄 [PluginManager] 正在加载插件: ${plugin.name}...`);

      await loader.load(plugin);

      plugin.status = PluginStatus.ACTIVE;
      this.state.loadedPlugins.add(pluginId);

      // 更新状态到本地文件
      await pluginStorage.updatePluginMeta(pluginId, {
        status: PluginStatus.ACTIVE,
      });

      console.log(`✅ [PluginManager] 插件加载成功: ${plugin.name}`);
      this.emit("plugin:loaded", plugin);

      return true;
    } catch (error) {
      plugin.status = PluginStatus.ERROR;
      this.state.pluginErrors.set(pluginId, error.message);
      console.error(`❌ [PluginManager] 插件加载失败: ${plugin.name}`, error);
      this.emit("plugin:error", { plugin, error });
      throw error;
    }
  }

  /**
   * 卸载插件
   * @param {string} pluginId - 插件ID
   */
  async unloadPlugin(pluginId) {
    const plugin = this.state.plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`插件 ${pluginId} 未注册`);
    }

    if (plugin.status !== PluginStatus.ACTIVE) {
      console.log(`ℹ️ [PluginManager] 插件 ${pluginId} 未加载`);
      return true;
    }

    const loader = this.loaders.get(plugin.type);
    if (!loader) {
      throw new Error(`未找到类型 ${plugin.type} 的加载器`);
    }

    try {
      console.log(`🔄 [PluginManager] 正在卸载插件: ${plugin.name}...`);

      await loader.unload(plugin);

      plugin.status = PluginStatus.UNLOADED;
      this.state.loadedPlugins.delete(pluginId);

      // 更新状态到本地文件
      await pluginStorage.updatePluginMeta(pluginId, {
        status: PluginStatus.UNLOADED,
      });

      console.log(`✅ [PluginManager] 插件卸载成功: ${plugin.name}`);
      this.emit("plugin:unloaded", plugin);

      return true;
    } catch (error) {
      console.error(`❌ [PluginManager] 插件卸载失败: ${plugin.name}`, error);
      throw error;
    }
  }

  /**
   * 移除插件
   * @param {string} pluginId - 插件ID
   */
  async removePlugin(pluginId) {
    const plugin = this.state.plugins.get(pluginId);

    if (!plugin) {
      return false;
    }

    // 先卸载
    if (plugin.status === PluginStatus.ACTIVE) {
      await this.unloadPlugin(pluginId);
    }

    this.state.plugins.delete(pluginId);
    this.state.pluginErrors.delete(pluginId);

    // 从本地文件删除
    await pluginStorage.deletePlugin(pluginId);

    console.log(`🗑️ [PluginManager] 已移除插件: ${plugin.name}`);
    this.emit("plugin:removed", plugin);

    return true;
  }

  /**
   * 获取所有插件
   */
  getAllPlugins() {
    return Array.from(this.state.plugins.values());
  }

  /**
   * 按类型获取插件
   * @param {string} type - 插件类型
   */
  getPluginsByType(type) {
    return this.getAllPlugins().filter((p) => p.type === type);
  }

  /**
   * 获取已加载的插件
   */
  getLoadedPlugins() {
    return this.getAllPlugins().filter((p) => p.status === PluginStatus.ACTIVE);
  }

  /**
   * 获取插件
   * @param {string} pluginId - 插件ID
   */
  getPlugin(pluginId) {
    return this.state.plugins.get(pluginId);
  }

  /**
   * 检查插件是否已加载
   * @param {string} pluginId - 插件ID
   */
  isPluginLoaded(pluginId) {
    return this.state.loadedPlugins.has(pluginId);
  }

  /**
   * 从本地文件恢复插件
   */
  async restorePlugins() {
    try {
      const plugins = await pluginStorage.loadAllPlugins();
      let validCount = 0;

      for (const plugin of plugins) {
        // 验证语言插件必须有 data 字段
        if (plugin.type === "language" && !plugin.data) {
          console.warn(`⚠️ [PluginManager] 跳过无效插件 ${plugin.id}：缺少翻译数据`);
          continue;
        }

        // 验证主题插件必须有 data 字段
        if (plugin.type === "theme" && !plugin.data) {
          console.warn(`⚠️ [PluginManager] 跳过无效插件 ${plugin.id}：缺少主题数据`);
          continue;
        }

        // 重置状态为未加载
        plugin.status = PluginStatus.UNLOADED;
        this.state.plugins.set(plugin.id, plugin);
        validCount++;
      }

      console.log(`📂 [PluginManager] 已恢复 ${validCount} 个插件`);
    } catch (error) {
      console.error("❌ [PluginManager] 恢复插件失败:", error);
    }
  }

  /**
   * 添加事件监听器
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  /**
   * 移除事件监听器
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          console.error(`❌ [PluginManager] 事件处理器错误:`, error);
        }
      });
    }
  }

  /**
   * 检查插件系统是否可用
   */
  isPluginSystemAvailable() {
    return true;
  }

  /**
   * 获取只读状态
   */
  getState() {
    return readonly(this.state);
  }
}

// 单例导出
export const pluginManager = new PluginManager();
export default pluginManager;
