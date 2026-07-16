/**
 * Local storage service - Optimized
 * Supports synchronous reading (from cache) and async persistence
 */

// In-memory cache - immediately available
let cache: Record<string, unknown> = {};
let initialized = false;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let initPromise: Promise<void> | null = null;

// Storage configuration
const STORAGE_DIR = "data";
const STORAGE_FILE = "settings.json";

// Keys to migrate
const KEYS_TO_MIGRATE: readonly string[] = [
  "theme",
  "language",
  "updateSource",
  "performanceMonitor",
  "developerMode",
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
  "seasonalThemeMode",
];

// Keys to keep in localStorage (for fast startup)
const KEYS_TO_KEEP_IN_LOCALSTORAGE: readonly string[] = ["theme", "language", "locale"];

// Critical keys that need immediate file persistence
const CRITICAL_KEYS: readonly string[] = ["theme", "language", "locale"];

/**
 * Get storage item (sync, read from cache)
 */
export function getItem<T = unknown>(key: string, defaultValue: T | null = null): T | null {
  // Prefer reading from cache
  if (cache[key] !== undefined) {
    return cache[key] as T;
  }
  // Before initialization, try reading from localStorage (for compatibility)
  if (!initialized) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }
    } catch (e) {
      console.warn("Failed to get storage item:", key, e);
    }
  }
  return defaultValue;
}

/**
 * Set storage item
 */
export function setItem(key: string, value: unknown): void {
  cache[key] = value;

  // Write critical config to localStorage synchronously (for fast startup)
  if (KEYS_TO_KEEP_IN_LOCALSTORAGE.includes(key)) {
    try {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    } catch (e) {
      console.warn("Failed to set localStorage item:", key, e);
    }
  }

  if (initialized) {
    // Critical keys: write to file immediately to prevent data loss on crash
    if (CRITICAL_KEYS.includes(key)) {
      Promise.resolve().then(() => saveToFile());
    } else {
      debouncedSave();
    }
  }
}

/**
 * Remove storage item
 */
export function removeItem(key: string): void {
  delete cache[key];
  if (initialized) {
    debouncedSave();
  }
}

/**
 * Clear all storage
 */
export function clear(): void {
  cache = { _migrated: true };
  if (initialized) {
    debouncedSave();
  }
}

/**
 * Get all keys
 */
export function keys(): string[] {
  return Object.keys(cache).filter((k) => !k.startsWith("_"));
}

/**
 * Check if initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Debounced save
 */
function debouncedSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToFile, 500);
}

/**
 * Save to file
 */
async function saveToFile(): Promise<void> {
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
export async function flush(): Promise<void> {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  await saveToFile();
}

/**
 * Set up page lifecycle flush hooks (visibilitychange + beforeunload)
 * Called internally after init, or can be called manually.
 */
function setupLifecycleFlush(): void {
  // Flush when tab becomes hidden (mobile/smartphone tab switch, desktop minimize)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      // Flush without blocking the visibilitychange event
      flush();
    }
  });

  // Flush on page unload/refresh/close
  window.addEventListener("beforeunload", () => {
    // Synchronous flush since beforeunload needs to complete before page unloads
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    // Use sendBeacon for reliability in beforeunload context
    // but since we're writing to local file system, just do sync localStorage
    const pendingJson = JSON.stringify(cache);
    try {
      localStorage.setItem("__storage_flush_backup", pendingJson);
    } catch (e) {
      console.warn("[Storage] beforeunload flush failed:", e);
    }
  });
}

/**
 * Initialize storage service
 */
export async function initStorage(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { BaseDirectory, exists, mkdir, readTextFile } = await import("@tauri-apps/plugin-fs");

      // Ensure directory exists
      const dirExists = await exists(STORAGE_DIR, { baseDir: BaseDirectory.AppData });
      if (!dirExists) {
        await mkdir(STORAGE_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
      }

      // Read existing data
      const filePath = `${STORAGE_DIR}/${STORAGE_FILE}`;
      const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData });

      if (fileExists) {
        const content = await readTextFile(filePath, { baseDir: BaseDirectory.AppData });
        try {
          cache = JSON.parse(content);
        } catch (parseError) {
          console.warn("[Storage] 缓存文件解析失败，使用空缓存:", parseError);
          cache = {};
        }
      }

      initialized = true;

      // Set up lifecycle flush hooks after init
      setupLifecycleFlush();

      // Migrate from localStorage (runs in background)
      if (!cache._migrated) {
        migrateFromLocalStorage();
      }
    } catch (error) {
      console.warn("[Storage] 初始化失败，使用内存缓存:", error);
      initialized = true;
      // Still try to set up lifecycle hooks even when init fails
      setupLifecycleFlush();
    }
  })();

  return initPromise;
}

/**
 * Migrate data from localStorage
 */
function migrateFromLocalStorage(): void {
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

    // Clear old data, but keep keys needed for fast startup
    for (const key of KEYS_TO_MIGRATE) {
      if (!KEYS_TO_KEEP_IN_LOCALSTORAGE.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  } else {
    cache._migrated = true;
    debouncedSave();
  }

  // Ensure fast startup keys are synced to localStorage
  for (const key of KEYS_TO_KEEP_IN_LOCALSTORAGE) {
    if (cache[key] !== undefined) {
      try {
        const value = cache[key];
        localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
      } catch (e) {
        console.warn("Failed to sync localStorage item during flush:", key, e);
      }
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
