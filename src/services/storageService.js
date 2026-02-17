/**
 * Local storage service - Optimized
 * Supports synchronous reading (from cache) and async persistence
 */

// 内存缓存 - 立即可用
let cache = {};
let initialized = false;
let saveTimeout = null;
let initPromise = null;

// 存储配置
const STORAGE_DIR = "data";
const STORAGE_FILE = "settings.json";

// Keys to migrate
const KEYS_TO_MIGRATE = [
  "theme", "language", "updateSource", "performanceMonitor",
  "developerMode", "logMenuEnabled", "testArchiveEnabled",
  "gpuAccelerationDisabled", "newYearThemeMode", "themeBeforeNewYear",
  "quick_create_tutorial_completed", "steamApiKey", "locale",
  "fabScrollHintShown", "hubUnlocked", "lastUpdateCheck",
  "user-custom-theme", "pluginSystemBetaUser", "pluginSystemBetaNotified",
  "seasonalThemeMode"
];

// 需要保留在 localStorage 的键（用于快速启动）
const KEYS_TO_KEEP_IN_LOCALSTORAGE = ["theme", "language", "locale"];

/**
 * Get storage item (sync, read from cache)
 */
export function getItem(key, defaultValue = null) {
  // 优先从缓存读取
  if (cache[key] !== undefined) {
    return cache[key];
  }
  // 未初始化时尝试从 localStorage 读取（兼容）
  if (!initialized) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
    } catch {}
  }
  return defaultValue;
}

/**
 * 设置存储项
 */
export function setItem(key, value) {
  cache[key] = value;
  
  // 关键配置同步写入 localStorage（用于快速启动）
  if (KEYS_TO_KEEP_IN_LOCALSTORAGE.includes(key)) {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch {}
  }
  
  if (initialized) {
    debouncedSave();
  }
}

/**
 * Remove storage item
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
 * Get all keys
 */
export function keys() {
  return Object.keys(cache).filter(k => !k.startsWith("_"));
}

/**
 * Check if initialized
 */
export function isInitialized() {
  return initialized;
}

/**
 * 防抖保存
 */
function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToFile, 500);
}

/**
 * 保存到文件
 */
async function saveToFile() {
  try {
    const { BaseDirectory, writeTextFile } = await import("@tauri-apps/plugin-fs");
    const filePath = `${STORAGE_DIR}/${STORAGE_FILE}`;
    const content = JSON.stringify(cache, null, 2);
    await writeTextFile(filePath, content, { baseDir: BaseDirectory.AppData });
  } catch (error) {
    console.warn("[Storage] 保存失败:", error);
  }
}

/**
 * Force immediate save
 */
export async function flush() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  await saveToFile();
}

/**
 * Initialize storage service
 */
export async function initStorage() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { BaseDirectory, exists, mkdir, readTextFile } = await import("@tauri-apps/plugin-fs");
      
      // 确保目录存在
      const dirExists = await exists(STORAGE_DIR, { baseDir: BaseDirectory.AppData });
      if (!dirExists) {
        await mkdir(STORAGE_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
      }

      // 读取现有数据
      const filePath = `${STORAGE_DIR}/${STORAGE_FILE}`;
      const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData });

      if (fileExists) {
        const content = await readTextFile(filePath, { baseDir: BaseDirectory.AppData });
        cache = JSON.parse(content);
      }

      initialized = true;

      // 迁移 localStorage（后台执行）
      if (!cache._migrated) {
        migrateFromLocalStorage();
      }
    } catch (error) {
      console.warn("[Storage] 初始化失败，使用内存缓存:", error);
      initialized = true;
    }
  })();

  return initPromise;
}

/**
 * 从 localStorage 迁移数据
 */
function migrateFromLocalStorage() {
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
    debouncedSave();
    
    // 清除旧数据，但保留快速启动需要的键
    for (const key of KEYS_TO_MIGRATE) {
      if (!KEYS_TO_KEEP_IN_LOCALSTORAGE.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  } else {
    cache._migrated = true;
    debouncedSave();
  }
  
  // 确保快速启动键同步到 localStorage
  for (const key of KEYS_TO_KEEP_IN_LOCALSTORAGE) {
    if (cache[key] !== undefined) {
      try {
        const value = cache[key];
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch {}
    }
  }
}

// Export default object
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
