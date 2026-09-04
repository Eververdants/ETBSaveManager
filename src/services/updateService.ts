/**
 * 更新服务 — 检查 GitHub Releases 并打开下载页
 */
import { openUrl } from "@tauri-apps/plugin-opener";

import { UPDATE_SOURCES } from "../constants/update";
import type { UpdateInfo, UpdateSourceConfig } from "../types";
import { APP_VERSION, STORAGE_KEYS } from "../constants";
import { storage } from "../utils/storage";

export const UpdateStatus = {
  IDLE: "idle",
  CHECKING: "checking",
  AVAILABLE: "available",
  NOT_AVAILABLE: "not_available",
  ERROR: "error",
} as const;

export type UpdateStatusValue = (typeof UpdateStatus)[keyof typeof UpdateStatus];

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  preRelease: {
    type: string;
    typePriority: number;
    numbers: number[];
  } | null;
  isPreRelease: boolean;
}

interface ReleaseAsset {
  browser_download_url?: string;
  download_url?: string;
  url?: string;
  name?: string;
  filename?: string;
  [key: string]: unknown;
}

interface ReleaseInfo {
  tag_name: string;
  created_at?: string;
  published_at?: string;
  body?: string;
  description?: string;
  prerelease?: boolean;
  html_url?: string;
  url?: string;
  assets?: ReleaseAsset[];
  [key: string]: unknown;
}

interface ProcessedVersion {
  version: string;
  published_at: string;
  body: string;
  prerelease: boolean;
  html_url: string;
  assets: ReleaseAsset[];
}

export interface UpdateCheckError {
  type: string;
  message: string;
  originalError?: string;
}

export class UpdateService {
  status: UpdateStatusValue = UpdateStatus.IDLE;
  updateInfo: UpdateInfo | null = null;
  error: UpdateCheckError | string | null = null;

  /** 检查更新；有新版本时返回 UpdateInfo，否则返回 { shouldUpdate: false } */
  async checkForUpdates(): Promise<UpdateInfo | { shouldUpdate: false; message: string }> {
    try {
      this.status = UpdateStatus.CHECKING;
      this.error = null;

      const sourceConfig: UpdateSourceConfig = this.getCurrentUpdateSource();
      const releasesUrl = sourceConfig.releasesUrl;

      const response = await fetch(sourceConfig.apiUrl);
      if (!response.ok) {
        throw new Error(`无法获取版本信息 (HTTP ${response.status})`);
      }

      const data = await response.json();
      const releases: ReleaseInfo[] = Array.isArray(data) ? data : [data];
      if (releases.length === 0) {
        throw new Error("No versions found");
      }

      const allVersions: ProcessedVersion[] = releases.map((r) => {
        const version = r.tag_name.replace("v", "");
        const isPreReleaseByVersion = version.includes("-");
        return {
          version,
          published_at: r.published_at || r.created_at || "",
          body: r.body || r.description || "No update notes available",
          prerelease: isPreReleaseByVersion || r.prerelease || false,
          html_url: r.html_url || r.url || "",
          assets: r.assets || [],
        };
      });

      const stableVersions = allVersions.filter((v) => !v.prerelease);
      const preReleaseVersions = allVersions.filter((v) => v.prerelease);

      let latestVersion: ProcessedVersion | null = null;

      if (stableVersions.length > 0) {
        latestVersion = stableVersions.reduce((latest, current) =>
          this.isNewVersion(current.version, latest.version) ? current : latest
        );
        if (!this.isNewVersion(latestVersion.version, APP_VERSION) && preReleaseVersions.length > 0) {
          const latestPreRelease = preReleaseVersions.reduce((latest, current) =>
            this.isNewVersion(current.version, latest.version) ? current : latest
          );
          if (this.isNewVersion(latestPreRelease.version, APP_VERSION)) {
            latestVersion = latestPreRelease;
          }
        }
      } else if (preReleaseVersions.length > 0) {
        latestVersion = preReleaseVersions.reduce((latest, current) =>
          this.isNewVersion(current.version, latest.version) ? current : latest
        );
      }

      if (!latestVersion) {
        throw new Error("No available version found");
      }

      if (this.isNewVersion(latestVersion.version, APP_VERSION)) {
        this.status = UpdateStatus.AVAILABLE;

        let directDownloadUrl: string | null = null;
        if (latestVersion.assets.length > 0) {
          const zipAsset = latestVersion.assets.find((asset) => {
            const downloadUrl = asset.browser_download_url || asset.download_url || asset.url;
            const fileName = asset.name || asset.filename || "";
            return downloadUrl && (fileName.endsWith(".zip") || fileName.endsWith(".exe"));
          });
          const asset = zipAsset || latestVersion.assets[0];
          directDownloadUrl =
            asset.browser_download_url || asset.download_url || asset.url || null;
        }

        this.updateInfo = {
          version: latestVersion.version,
          date: latestVersion.published_at,
          body: latestVersion.body,
          downloadUrl: latestVersion.html_url || releasesUrl,
          directDownloadUrl: directDownloadUrl || latestVersion.html_url || releasesUrl,
          prerelease: latestVersion.prerelease,
          shouldUpdate: true,
          source: sourceConfig.name,
        };
        return this.updateInfo;
      }

      this.status = UpdateStatus.NOT_AVAILABLE;
      return { shouldUpdate: false, message: "Already up to date" };
    } catch (error: unknown) {
      console.error("检查更新失败:", error);
      this.status = UpdateStatus.ERROR;

      const err = error instanceof Error ? error : new Error(String(error));

      let errorMessage = err.message;
      let errorType = "Network error";

      if (err.message?.includes("rate limit") || err.message?.includes("429")) {
        errorMessage = "Request too frequent, please try again later";
        errorType = "Rate Limit";
      } else if (err.message?.includes("network") || err.message?.includes("timeout")) {
        errorMessage = "Network connection timeout, please check network and retry";
        errorType = "Network Connection";
      } else if (err.message?.includes("404")) {
        errorMessage = "Failed to get update info, please try again later";
        errorType = "Resource Not Found";
      } else if (err.message?.includes("403")) {
        errorMessage = "Access restricted, please try again later";
        errorType = "Access Restricted";
      }

      this.error = { type: errorType, message: errorMessage, originalError: err.message };
      throw { type: errorType, message: errorMessage, originalError: err.message };
    }
  }

  /** 版本比较（支持 pre-release） */
  isNewVersion(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string): ParsedVersion => {
      const [mainVersion, ...preReleaseParts] = version.split("-");
      const [major, minor, patch] = mainVersion.split(".").map(Number);

      let preRelease: ParsedVersion["preRelease"] = null;
      if (preReleaseParts.length > 0) {
        const preReleaseStr = preReleaseParts.join("-");
        const match = preReleaseStr.match(/^(Alpha|Beta|RC|alpha|beta|rc)(?:[-.](\d+(?:\.\d+)*))?$/i);
        if (match) {
          const [, type, numStr] = match;
          const numParts = numStr ? numStr.split(".").map(Number) : [0];
          const typePriority: Record<string, number> = { alpha: 0, beta: 1, rc: 2 };
          const typeKey = type.toLowerCase();
          preRelease = {
            type: typeKey,
            typePriority: typePriority[typeKey] ?? 3,
            numbers: numParts,
          };
        } else {
          preRelease = { type: "unknown", typePriority: -1, numbers: [0] };
        }
      }

      return { major, minor, patch, preRelease, isPreRelease: preRelease !== null };
    };

    const newVer = parseVersion(newVersion);
    const currentVer = parseVersion(currentVersion);

    if (newVer.major !== currentVer.major) return newVer.major > currentVer.major;
    if (newVer.minor !== currentVer.minor) return newVer.minor > currentVer.minor;
    if (newVer.patch !== currentVer.patch) return newVer.patch > currentVer.patch;

    if (newVer.isPreRelease && currentVer.isPreRelease) {
      if (newVer.preRelease!.typePriority !== currentVer.preRelease!.typePriority) {
        return newVer.preRelease!.typePriority > currentVer.preRelease!.typePriority;
      }
      const newNums = newVer.preRelease!.numbers;
      const currentNums = currentVer.preRelease!.numbers;
      const maxLen = Math.max(newNums.length, currentNums.length);
      for (let i = 0; i < maxLen; i++) {
        const newNum = newNums[i] || 0;
        const currentNum = currentNums[i] || 0;
        if (newNum !== currentNum) return newNum > currentNum;
      }
      return false;
    } else if (!newVer.isPreRelease && currentVer.isPreRelease) {
      return true;
    } else if (newVer.isPreRelease && !currentVer.isPreRelease) {
      return false;
    }

    return false;
  }

  /** 打开下载页 */
  async downloadAndInstall(): Promise<void> {
    if (!this.updateInfo) {
      throw new Error("没有可用的更新");
    }
    try {
      await openUrl(this.updateInfo.directDownloadUrl);
    } catch (error: unknown) {
      console.error("打开下载链接失败:", error);
      this.status = UpdateStatus.ERROR;
      this.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /** 24 小时限流 */
  canCheckUpdate(): boolean {
    const lastCheck = storage.getItem<string>(STORAGE_KEYS.LAST_UPDATE_CHECK);
    if (!lastCheck) return true;
    const hoursSinceLastCheck = (Date.now() - parseInt(lastCheck, 10)) / (1000 * 60 * 60);
    return hoursSinceLastCheck >= 24;
  }

  recordLastCheck(): void {
    storage.setItem(STORAGE_KEYS.LAST_UPDATE_CHECK, Date.now().toString());
  }

  getCurrentUpdateSource(): UpdateSourceConfig {
    return UPDATE_SOURCES.GITHUB;
  }
}

export const updateService = new UpdateService();
