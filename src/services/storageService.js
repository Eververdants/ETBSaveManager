/**
 * 本地存储服务
 * 使用 Tauri 文件系统 API 完全替代 localStorage
 * 支持同步读取（从缓存）和异步持久化到本地文件
 */

import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";

// 存储目录和文件名
const STORAGE_DIR = "data";
const STORAGE_FILE = "settings.json";

// 内存缓存
let cache = {};
let initialized = false;
let saveTimeout = null;

// 需要从 localStorage 迁移的键（一次性迁移后删除）
const KEYS_TO_MIGRATE = [
  "theme",
  "language",
  "updateSource",
  "performanceMonitor",
  "developerMode",
  "logMenuEnabled",
  "testArchiveEnabled",
  "gpuAccelerationDisabled",
  "newYearThemeMode",
  "themeBeforeNewYear",
  "quick_create_tutorial_completed",
  "steamApiKey",
  "locale",
  "fabScrollHintShown",
  "hubUnlocked",
  "lastUpdateCheck",
  "user-custom-theme",
  "pluginSystemBetaUser",
  "pluginSystemBetaNotified",
];

/**
 * 初始化存储服务（异步）
 */
async function init() {
  if (initialized) return;

  try {
    // 确保存储目录存在
    const dirExists = await exists(STORAGE_DIR, {
      baseDir: BaseDirectory.AppData,
    });
    if (!dirExists) {
      await mkdir(STORAGE_DIR, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
      });
      console.log("📁 [Storage] 创建存储目录");
    }

    // 读取现有数据
    const filePath = `${STORAGE_DIR}/${STORAGE_FILE}`;
    const fileExists = await exists(filePath, {
      baseDir: BaseDirectory.AppData,
    });

    if (fileExists) {
      const content = await readTextFile(filePath, {
        baseDir: BaseDirectory.AppData,
      });
      cache = JSON.parse(content);
      console.log(
        `✅ [Storage] 已加载本地存储 (${Object.keys(cache).length} 项)`
      );
    }

    initialized = true;

    // 迁移 localStorage 数据（一次性）
    await migrateFromLocalStorage();
  } catch (error) {
    console.error("❌ [Storage] 初始化失败:", error);
    initialized = true;
  }
}

/**
 * 保存到文件（防抖）
 */
function debouncedSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(async () => {
    await saveToFile();
  }, 300);
}

/**
 * 立即保存到文件
 */
async function saveToFile() {
  try {
    const filePath = `${STORAGE_DIR}/${STORAGE_FILE}`;
    const content = JSON.stringify(cache, null, 2);
    await writeTextFile(filePath, content, { baseDir: BaseDirectory.AppData });
    console.log(
      `💾 [Storage] 已保存 (${(content.length / 1024).toFixed(1)} KB)`
    );
  } catch (error) {
    console.error("❌ [Storage] 保存失败:", error);
  }
}

/**
 * 从 localStorage 迁移数据（一次性迁移后清除）
 */
async function migrateFromLocalStorage() {
  // 检查是否已迁移
  if (cache._migrated) return;

  let migrated = false;

  for (const key of KEYS_TO_MIGRATE) {
    const value = localStorage.getItem(key);
    if (value !== null && cache[key] === undefined) {
      try {
        cache[key] = JSON.parse(value);
      } catch {
        cache[key] = value;
      }
      migrated = true;
    }
  }

  if (migrated) {
    cache._migrated = true;
    await saveToFile();

    // 清除 localStorage 中的旧数据
    for (const key of KEYS_TO_MIGRATE) {
      localStorage.removeItem(key);
    }

    console.log("✅ [Storage] localStorage 数据迁移完成并已清除");
  } else {
    // 标记已检查过迁移
    cache._migrated = true;
    debouncedSave();
  }
}

/**
 * 获取存储项（同步，从缓存读取）
 * @param {string} key - 键名
 * @param {any} defaultValue - 默认值
 * @returns {any}
 */
export function getItem(key, defaultValue = null) {
  if (cache[key] !== undefined) {
    return cache[key];
  }
  return defaultValue;
}

/**
 * 设置存储项
 * @param {string} key - 键名
 * @param {any} value - 值
 */
export function setItem(key, value) {
  cache[key] = value;
  if (initialized) {
    debouncedSave();
  }
}

/**
 * 移除存储项
 * @param {string} key - 键名
 */
export function removeItem(key) {
  delete cache[key];
  if (initialized) {
    debouncedSave();
  }
}

/**
 * 清空所有存储
 */
export function clear() {
  cache = { _migrated: true };
  if (initialized) {
    debouncedSave();
  }
}

/**
 * 获取所有键
 * @returns {string[]}
 */
export function keys() {
  return Object.keys(cache).filter((k) => !k.startsWith("_"));
}

/**
 * 检查是否已初始化
 * @returns {boolean}
 */
export function isInitialized() {
  return initialized;
}

/**
 * 强制立即保存
 */
export async function flush() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  await saveToFile();
}

/**
 * 初始化存储服务
 */
export async function initStorage() {
  await init();
}

// 导出默认对象
export default {
  getItem,
  setItem,
  removeItem,
  clear,
  keys,
  isInitialized,
  flush,
  initStorage,
};
