/**
 * 更新源配置 — GitHub 为唯一更新源
 */
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
