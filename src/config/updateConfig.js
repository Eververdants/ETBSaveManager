/**
 * 更新配置
 * 使用 GitHub 作为唯一更新源
 */

import storage from "../services/storageService";

export const UPDATE_SOURCES = {
  GITHUB: {
    name: "GitHub",
    description: "官方源，全球访问",
    apiUrl: "https://api.github.com/repos/Eververdants/ETBSaveManager/releases",
    releasesUrl: "https://github.com/Eververdants/ETBSaveManager/releases",
    enabled: true,
  },
};

export const DEFAULT_UPDATE_SOURCE = "GITHUB";

/**
 * 获取用户选择的更新源
 * @returns {string} 更新源标识
 */
export function getUserUpdateSource() {
  return DEFAULT_UPDATE_SOURCE;
}

/**
 * 设置用户选择的更新源
 * @param {string} source - 更新源标识
 */
export function setUserUpdateSource(source) {
  if (UPDATE_SOURCES[source]) {
    storage.setItem("updateSource", source);
    return true;
  }
  return false;
}

/**
 * 获取当前更新源的详细信息
 * @returns {Object} 更新源配置
 */
export function getCurrentUpdateSource() {
  return UPDATE_SOURCES[DEFAULT_UPDATE_SOURCE];
}

/**
 * 获取所有可用的更新源
 * @returns {Object} 所有更新源
 */
export function getAllUpdateSources() {
  return UPDATE_SOURCES;
}
