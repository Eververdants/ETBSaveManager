/**
 * Update configuration
 * Uses GitHub as the sole update source
 */

import storage from "../services/storageService";
import type { UpdateSourceConfig } from "../types";

export const UPDATE_SOURCES: Record<string, UpdateSourceConfig> = {
  GITHUB: {
    name: "GitHub",
    description: "官方源，全球访问",
    apiUrl: "https://api.github.com/repos/Eververdants/ETBSaveManager/releases",
    releasesUrl: "https://github.com/Eververdants/ETBSaveManager/releases",
    enabled: true,
  },
};

export const DEFAULT_UPDATE_SOURCE: string = "GITHUB";

/**
 * Get the user-selected update source
 * @returns {string} Update source identifier
 */
export function getUserUpdateSource(): string {
  return DEFAULT_UPDATE_SOURCE;
}

/**
 * Set the user-selected update source
 * @param {string} source - Update source identifier
 */
export function setUserUpdateSource(source: string): boolean {
  if (UPDATE_SOURCES[source]) {
    storage.setItem("updateSource", source);
    return true;
  }
  return false;
}

/**
 * Get detailed information about the current update source
 * @returns {Object} Update source configuration
 */
export function getCurrentUpdateSource(): UpdateSourceConfig {
  return UPDATE_SOURCES[DEFAULT_UPDATE_SOURCE];
}

/**
 * Get all available update sources
 * @returns {Object} All update sources
 */
export function getAllUpdateSources(): Record<string, UpdateSourceConfig> {
  return UPDATE_SOURCES;
}
