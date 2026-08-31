/**
 * localStorage 薄封装（JSON 序列化）
 *
 * 仅用于零散键值（mods 游戏路径、更新检查时间等）。
 * 应用全局状态（主题、侧边栏）走 zustand persist（app-storage）。
 * i18n 语言由 i18next 自管（i18nextLng）。
 */
export const storage = {
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  setItem(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 空间不足 / 隐私模式：静默失败
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
