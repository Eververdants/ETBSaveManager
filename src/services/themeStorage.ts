/**
 * ThemeStorage Service (simplified)
 * Only keeps active theme config persistence for built-in theme switching.
 */

import { invoke } from "@tauri-apps/api/core";

interface ThemeConfig {
  activeThemeId: string | null;
}

export class ThemeStorage {
  /**
   * Gets the currently active theme ID from configuration
   * @returns Active theme ID or null
   */
  async getActiveThemeId(): Promise<string | null> {
    try {
      const config = await invoke<ThemeConfig>("get_theme_config");
      return config?.activeThemeId || null;
    } catch (error) {
      console.error("Failed to get active theme ID:", error);
      return null;
    }
  }

  /**
   * Sets the active theme ID in configuration
   * @param themeId - The theme ID to set as active
   * @returns Whether the operation was successful
   */
  async setActiveThemeId(themeId: string): Promise<boolean> {
    try {
      if (!themeId || typeof themeId !== "string") {
        console.error("Invalid theme ID");
        return false;
      }
      await invoke("set_active_theme", { themeId });
      return true;
    } catch (error) {
      console.error("Failed to set active theme:", error);
      return false;
    }
  }
}

// Export singleton instance
export const themeStorage = new ThemeStorage();

export default themeStorage;
