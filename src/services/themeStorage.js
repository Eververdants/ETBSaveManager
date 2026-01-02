/**
 * ThemeStorage Service
 *
 * Provides storage operations for custom themes using Tauri backend.
 * Encapsulates Tauri command calls for theme persistence.
 *
 * Requirements: 3.1, 3.2, 4.5, 4.6
 */

import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { themeValidator, DEFAULT_THEME_TEMPLATE } from "./themeValidator.js";

/**
 * Save result structure
 * @typedef {Object} SaveResult
 * @property {boolean} success - Whether the save was successful
 * @property {string|null} error - Error message if save failed
 */

/**
 * Import result structure
 * @typedef {Object} ImportResult
 * @property {boolean} success - Whether the import was successful
 * @property {Object|null} theme - Imported theme if successful
 * @property {string|null} error - Error message if import failed
 */

/**
 * Maximum number of custom themes allowed
 */
const MAX_CUSTOM_THEMES = 10;

/**
 * ThemeStorage class providing storage operations for custom themes
 */
export class ThemeStorage {
  constructor() {
    this.validator = themeValidator;
  }

  /**
   * Saves a custom theme to local storage via Tauri backend
   *
   * @param {Object} theme - The theme object to save
   * @returns {Promise<SaveResult>} Save result
   */
  async saveCustomTheme(theme) {
    try {
      // Validate theme before saving
      const validation = this.validator.validateTheme(theme);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Ensure theme has required fields
      const themeToSave = {
        id: theme.id,
        name: theme.name.trim(),
        type: "custom",
        colors: this.validator.mergeWithTemplate(theme.colors),
        version: theme.version || 1,
        createdAt: theme.createdAt || Date.now(),
        updatedAt: Date.now(),
      };

      await invoke("save_custom_theme", { theme: themeToSave });

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error("Failed to save custom theme:", error);
      return {
        success: false,
        error:
          typeof error === "string"
            ? error
            : error.message || "Failed to save theme",
      };
    }
  }

  /**
   * Loads all custom themes from local storage via Tauri backend
   *
   * @returns {Promise<Object[]>} Array of custom themes
   */
  async loadCustomThemes() {
    try {
      const themes = await invoke("load_custom_themes");

      // Merge each theme with template to ensure completeness
      return themes.map((theme) => ({
        ...theme,
        colors: this.validator.mergeWithTemplate(theme.colors),
      }));
    } catch (error) {
      console.error("Failed to load custom themes:", error);
      return [];
    }
  }

  /**
   * Deletes a custom theme from local storage via Tauri backend
   *
   * @param {string} themeId - The ID of the theme to delete
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  async deleteCustomTheme(themeId) {
    try {
      if (!themeId || typeof themeId !== "string") {
        console.error("Invalid theme ID for deletion");
        return false;
      }

      const result = await invoke("delete_custom_theme", { themeId });
      return result;
    } catch (error) {
      console.error("Failed to delete custom theme:", error);
      return false;
    }
  }

  /**
   * Exports a theme to a JSON file
   * Opens a save dialog for the user to choose the export location
   *
   * @param {string} themeId - The ID of the theme to export
   * @returns {Promise<string|null>} The export path if successful, null otherwise
   */
  async exportTheme(themeId) {
    try {
      if (!themeId || typeof themeId !== "string") {
        throw new Error("Invalid theme ID for export");
      }

      // Open save dialog
      const filePath = await save({
        defaultPath: `${themeId}.json`,
        filters: [
          {
            name: "JSON Files",
            extensions: ["json"],
          },
        ],
      });

      if (!filePath) {
        // User cancelled the dialog
        return null;
      }

      await invoke("export_theme_to_file", {
        themeId,
        path: filePath,
      });

      return filePath;
    } catch (error) {
      console.error("Failed to export theme:", error);
      throw error;
    }
  }

  /**
   * Imports a theme from a JSON file
   * Opens a file dialog for the user to choose the import file
   *
   * @returns {Promise<ImportResult>} Import result with theme if successful
   */
  async importTheme() {
    try {
      // Open file dialog
      const filePath = await open({
        multiple: false,
        filters: [
          {
            name: "JSON Files",
            extensions: ["json"],
          },
        ],
      });

      if (!filePath) {
        // User cancelled the dialog
        return {
          success: false,
          theme: null,
          error: null, // Not an error, just cancelled
        };
      }

      // Check current theme count before importing
      const existingThemes = await this.loadCustomThemes();
      if (existingThemes.length >= MAX_CUSTOM_THEMES) {
        return {
          success: false,
          theme: null,
          error: `Maximum ${MAX_CUSTOM_THEMES} custom themes reached. Delete one first.`,
        };
      }

      const importedTheme = await invoke("import_theme_from_file", {
        path: filePath,
      });

      // Merge with template to ensure completeness
      const completeTheme = {
        ...importedTheme,
        colors: this.validator.mergeWithTemplate(importedTheme.colors),
      };

      return {
        success: true,
        theme: completeTheme,
        error: null,
      };
    } catch (error) {
      console.error("Failed to import theme:", error);
      return {
        success: false,
        theme: null,
        error:
          typeof error === "string"
            ? error
            : error.message || "Failed to import theme",
      };
    }
  }

  /**
   * Gets the currently active theme ID from configuration
   *
   * @returns {Promise<string|null>} Active theme ID or null
   */
  async getActiveThemeId() {
    try {
      const config = await invoke("get_theme_config");
      return config?.activeThemeId || null;
    } catch (error) {
      console.error("Failed to get active theme ID:", error);
      return null;
    }
  }

  /**
   * Sets the active theme ID in configuration
   *
   * @param {string} themeId - The theme ID to set as active
   * @returns {Promise<boolean>} Whether the operation was successful
   */
  async setActiveThemeId(themeId) {
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

  /**
   * Gets a specific custom theme by ID
   *
   * @param {string} themeId - The theme ID to retrieve
   * @returns {Promise<Object|null>} The theme object or null if not found
   */
  async getCustomTheme(themeId) {
    try {
      const themes = await this.loadCustomThemes();
      return themes.find((t) => t.id === themeId) || null;
    } catch (error) {
      console.error("Failed to get custom theme:", error);
      return null;
    }
  }

  /**
   * Checks if a theme ID already exists
   *
   * @param {string} themeId - The theme ID to check
   * @returns {Promise<boolean>} Whether the theme ID exists
   */
  async themeExists(themeId) {
    try {
      const themes = await this.loadCustomThemes();
      return themes.some((t) => t.id === themeId);
    } catch (error) {
      console.error("Failed to check theme existence:", error);
      return false;
    }
  }

  /**
   * Gets the count of custom themes
   *
   * @returns {Promise<number>} Number of custom themes
   */
  async getThemeCount() {
    try {
      const themes = await this.loadCustomThemes();
      return themes.length;
    } catch (error) {
      console.error("Failed to get theme count:", error);
      return 0;
    }
  }

  /**
   * Checks if more themes can be added
   *
   * @returns {Promise<boolean>} Whether more themes can be added
   */
  async canAddMoreThemes() {
    const count = await this.getThemeCount();
    return count < MAX_CUSTOM_THEMES;
  }

  /**
   * Generates a unique theme ID based on the theme name
   *
   * @param {string} name - The theme name
   * @returns {Promise<string>} A unique theme ID
   */
  async generateUniqueId(name) {
    // Convert name to kebab-case ID
    let baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);

    if (!baseId) {
      baseId = "custom-theme";
    }

    // Check if ID exists and add suffix if needed
    let id = baseId;
    let counter = 1;

    while (await this.themeExists(id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }

    return id;
  }
}

// Export singleton instance
export const themeStorage = new ThemeStorage();

export default themeStorage;
