import { getCurrentUpdateSource } from "../config/updateConfig.js";
import storage from "./storageService";

// 版本信息
const CURRENT_VERSION = "3.0.0-Alpha-7";

// 简化版更新状态
export const UpdateStatus = {
  IDLE: "idle",
  CHECKING: "checking",
  AVAILABLE: "available",
  NOT_AVAILABLE: "not_available",
  ERROR: "error",
};

class UpdateService {
  constructor() {
    this.status = UpdateStatus.IDLE;
    this.updateInfo = null;
    this.error = null;
  }

  /**
   * 检查更新 - 支持GitHub和Gitee
   * @returns {Promise<Object>} 更新信息
   */
  async checkForUpdates() {
    try {
      this.status = UpdateStatus.CHECKING;
      this.error = null;

      const sourceConfig = getCurrentUpdateSource();
      const apiUrl = sourceConfig.apiUrl;
      const releasesUrl = sourceConfig.releasesUrl;

      console.log(`使用 ${sourceConfig.name} 检查更新...`);

      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("无法获取版本信息");
      }

      const data = await response.json();

      // 处理 Gitee 和 GitHub 的 API 差异
      let releases;
      if (sourceConfig.name.includes("Gitee")) {
        // Gitee API 返回的是数组
        releases = Array.isArray(data) ? data : [data];
      } else {
        // GitHub API 返回的是数组
        releases = Array.isArray(data) ? data : [data];
      }

      if (!releases || releases.length === 0) {
        throw new Error("没有找到任何版本");
      }

      // 从所有版本中提取版本信息
      const allVersions = releases.map((r) => {
        const version = r.tag_name.replace("v", "");
        // 判断是否为预发布版本：优先使用 API 的 prerelease 字段，但也检查版本号格式
        const isPreReleaseByApi = sourceConfig.name.includes("Gitee")
          ? r.prerelease || false
          : r.prerelease;
        const isPreReleaseByVersion = version.includes('-'); // 版本号包含 - 说明是预发布版本
        
        // 如果版本号格式表明是预发布版本，则强制标记为预发布
        const isPreRelease = isPreReleaseByVersion || isPreReleaseByApi;
        
        return {
          version,
          published_at: sourceConfig.name.includes("Gitee")
            ? r.created_at
            : r.published_at,
          body: sourceConfig.name.includes("Gitee")
            ? r.body || r.description || "暂无更新说明"
            : r.body || "暂无更新说明",
          prerelease: isPreRelease,
          html_url: r.html_url || r.url,
          assets: r.assets || [],
        };
      });

      // 判断当前版本是否为预发布版本
      const currentIsPreRelease = CURRENT_VERSION.includes('-');
      
      console.log(`当前版本: ${CURRENT_VERSION} (${currentIsPreRelease ? '预发布' : '正式版'})`);
      console.log(`找到 ${allVersions.length} 个版本:`, allVersions.map(v => `${v.version}${v.prerelease ? ' (预发布)' : ''}`));
      
      // 分离正式版本和预发布版本
      const stableVersions = allVersions.filter(v => !v.prerelease);
      const preReleaseVersions = allVersions.filter(v => v.prerelease);

      console.log(`正式版本: ${stableVersions.length} 个`, stableVersions.map(v => v.version));
      console.log(`预发布版本: ${preReleaseVersions.length} 个`, preReleaseVersions.map(v => v.version));

      // 优先选择正式版本，如果没有正式版本或正式版本都比当前版本旧，才考虑预发布版本
      let latestVersion = null;

      // 先找最新的正式版本
      if (stableVersions.length > 0) {
        latestVersion = stableVersions.reduce((latest, current) => {
          return this.isNewVersion(current.version, latest.version)
            ? current
            : latest;
        });
        
        console.log(`最新正式版本: ${latestVersion.version}`);
        
        // 如果最新正式版本比当前版本新，就使用它
        if (this.isNewVersion(latestVersion.version, CURRENT_VERSION)) {
          console.log(`✓ 找到更新的正式版本: ${latestVersion.version}`);
        } else {
          console.log(`✗ 最新正式版本 ${latestVersion.version} 不比当前版本 ${CURRENT_VERSION} 新`);
          
          // 正式版本不够新，检查预发布版本
          if (preReleaseVersions.length > 0) {
            const latestPreRelease = preReleaseVersions.reduce((latest, current) => {
              return this.isNewVersion(current.version, latest.version)
                ? current
                : latest;
            });
            
            console.log(`最新预发布版本: ${latestPreRelease.version}`);
            
            // 如果预发布版本比当前版本新，使用它
            if (this.isNewVersion(latestPreRelease.version, CURRENT_VERSION)) {
              latestVersion = latestPreRelease;
              console.log(`✓ 使用预发布版本: ${latestVersion.version}`);
            } else {
              console.log(`✗ 没有找到更新的版本`);
            }
          }
        }
      } else if (preReleaseVersions.length > 0) {
        // 没有正式版本，只能使用预发布版本
        latestVersion = preReleaseVersions.reduce((latest, current) => {
          return this.isNewVersion(current.version, latest.version)
            ? current
            : latest;
        });
        console.log(`只有预发布版本，使用: ${latestVersion.version}`);
      }

      if (!latestVersion) {
        throw new Error("没有找到可用的版本");
      }

      console.log(`最终选择版本: ${latestVersion.version}${latestVersion.prerelease ? ' (预发布)' : ' (正式版)'}`);
      console.log("资产信息:", latestVersion.assets);

      if (this.isNewVersion(latestVersion.version, CURRENT_VERSION)) {
        this.status = UpdateStatus.AVAILABLE;
        // 获取下载链接
        let downloadUrl = latestVersion.html_url || releasesUrl;
        let directDownloadUrl = null;

        // 尝试获取直接下载链接
        if (latestVersion.assets && latestVersion.assets.length > 0) {
          // 优先选择zip文件，如果没有则选择第一个可用文件
          const zipAsset = latestVersion.assets.find((asset) => {
            const downloadUrl =
              asset.browser_download_url || asset.download_url || asset.url;
            const fileName = asset.name || asset.filename || "";
            return (
              downloadUrl &&
              (fileName.endsWith(".zip") ||
                fileName.endsWith(".exe") ||
                fileName.endsWith(".dmg"))
            );
          });

          if (zipAsset) {
            directDownloadUrl =
              zipAsset.browser_download_url ||
              zipAsset.download_url ||
              zipAsset.url;
          } else {
            // 使用第一个可用资产
            const firstAsset = latestVersion.assets[0];
            directDownloadUrl =
              firstAsset.browser_download_url ||
              firstAsset.download_url ||
              firstAsset.url;
          }
        }

        this.updateInfo = {
          version: latestVersion.version,
          date: latestVersion.published_at,
          body: latestVersion.body,
          downloadUrl: latestVersion.html_url || releasesUrl,
          directDownloadUrl:
            directDownloadUrl || latestVersion.html_url || releasesUrl,
          prerelease: latestVersion.prerelease,
          shouldUpdate: true,
          source: sourceConfig.name,
        };
        return this.updateInfo;
      } else {
        this.status = UpdateStatus.NOT_AVAILABLE;
        return { shouldUpdate: false, message: "当前已是最新版本" };
      }
    } catch (error) {
      console.error("检查更新失败:", error);
      this.status = UpdateStatus.ERROR;

      // 检查是否为速率限制错误
      let errorMessage = error.message;
      let errorType = "网络错误";

      if (
        error.message?.includes("rate limit") ||
        error.message?.includes("429")
      ) {
        errorMessage = "请求过于频繁，请稍后再试";
        errorType = "速率限制";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("timeout")
      ) {
        errorMessage = "网络连接超时，请检查网络后重试";
        errorType = "网络连接";
      } else if (error.message?.includes("404")) {
        errorMessage = "更新信息获取失败，请稍后再试";
        errorType = "资源未找到";
      } else if (error.message?.includes("403")) {
        errorMessage = "访问受限，请稍后再试";
        errorType = "访问受限";
      }

      this.error = {
        type: errorType,
        message: errorMessage,
        originalError: error.message,
      };

      throw {
        type: errorType,
        message: errorMessage,
        originalError: error.message,
      };
    }
  }

  /**
   * 支持预发布版本的版本比较
   * @param {string} newVersion - 新版本号
   * @param {string} currentVersion - 当前版本号
   * @returns {boolean} 是否为新版本
   */
  isNewVersion(newVersion, currentVersion) {
    const parseVersion = (version) => {
      // 分割主版本号和预发布标识
      const [mainVersion, ...preReleaseParts] = version.split("-");
      const [major, minor, patch] = mainVersion.split(".").map(Number);

      // 解析预发布版本
      let preRelease = null;
      if (preReleaseParts.length > 0) {
        const preReleaseStr = preReleaseParts.join("-");
        const match = preReleaseStr.match(
          /^(Alpha|Beta|RC|alpha|beta|rc)(?:[-.](\d+(?:\.\d+)*))?$/i
        );
        if (match) {
          const [, type, numStr] = match;
          const numParts = numStr ? numStr.split(".").map(Number) : [0];

          // 预发布类型优先级：Alpha < Beta < RC < 正式版
          const typePriority = {
            alpha: 0,
            beta: 1,
            rc: 2,
          };

          const typeKey = type.toLowerCase();
          preRelease = {
            type: typeKey,
            typePriority: typePriority[typeKey] ?? 3,
            numbers: numParts,
          };
        } else {
          // 无法识别的预发布标识，视为低优先级
          preRelease = { type: "unknown", typePriority: -1, numbers: [0] };
        }
      }

      return {
        major,
        minor,
        patch,
        preRelease,
        isPreRelease: preRelease !== null,
      };
    };

    const newVer = parseVersion(newVersion);
    const currentVer = parseVersion(currentVersion);

    // 比较主版本号
    if (newVer.major !== currentVer.major) {
      return newVer.major > currentVer.major;
    }
    if (newVer.minor !== currentVer.minor) {
      return newVer.minor > currentVer.minor;
    }
    if (newVer.patch !== currentVer.patch) {
      return newVer.patch > currentVer.patch;
    }

    // 主版本号相同，比较预发布版本
    if (newVer.isPreRelease && currentVer.isPreRelease) {
      // 都是预发布版本
      if (
        newVer.preRelease.typePriority !== currentVer.preRelease.typePriority
      ) {
        return (
          newVer.preRelease.typePriority > currentVer.preRelease.typePriority
        );
      }

      // 预发布类型相同，比较版本号
      const newNums = newVer.preRelease.numbers;
      const currentNums = currentVer.preRelease.numbers;
      const maxLen = Math.max(newNums.length, currentNums.length);

      for (let i = 0; i < maxLen; i++) {
        const newNum = newNums[i] || 0;
        const currentNum = currentNums[i] || 0;

        if (newNum !== currentNum) {
          return newNum > currentNum;
        }
      }

      return false; // 完全相同
    } else if (!newVer.isPreRelease && currentVer.isPreRelease) {
      // 新版本是正式版，当前版本是预发布版
      return true;
    } else if (newVer.isPreRelease && !currentVer.isPreRelease) {
      // 新版本是预发布版，当前版本是正式版
      return false;
    }

    return false; // 完全相同
  }

  /**
   * 直接下载更新文件
   * @returns {Promise<void>}
   */
  async downloadAndInstall() {
    if (!this.updateInfo) {
      throw new Error("没有可用的更新");
    }

    try {
      // 使用直接下载链接
      const url = this.updateInfo.directDownloadUrl;

      // 创建临时链接元素进行直接下载
      const link = document.createElement("a");
      link.href = url;
      link.download = ""; // 触发下载而不是导航
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("已开始下载:", url);
    } catch (error) {
      console.error("下载失败:", error);
      this.status = UpdateStatus.ERROR;
      this.error = error.message;
      throw error;
    }
  }

  /**
   * 获取当前状态
   * @returns {string} 状态
   */
  getStatus() {
    return this.status;
  }

  /**
   * 获取更新信息
   * @returns {Object} 更新信息
   */
  getUpdateInfo() {
    return this.updateInfo;
  }

  /**
   * 重置状态
   */
  reset() {
    this.status = UpdateStatus.IDLE;
    this.updateInfo = null;
    this.error = null;
  }

  /**
   * 简化版频率控制 - 每12小时检查一次
   * @returns {boolean} 是否可以检查更新
   */
  canCheckUpdate() {
    const lastCheck = storage.getItem("lastUpdateCheck");
    if (!lastCheck) return true;

    const now = Date.now();
    const lastCheckTime = parseInt(lastCheck);
    const hoursSinceLastCheck = (now - lastCheckTime) / (1000 * 60 * 60);

    return hoursSinceLastCheck >= 12;
  }

  /**
   * 记录最后检查时间
   */
  recordLastCheck() {
    storage.setItem("lastUpdateCheck", Date.now().toString());
  }

  /**
   * 获取当前版本号
   * @returns {string} 当前版本号
   */
  getCurrentVersion() {
    return CURRENT_VERSION;
  }

  /**
   * 获取当前更新源信息
   * @returns {Object} 当前更新源配置
   */
  getCurrentUpdateSource() {
    return getCurrentUpdateSource();
  }
}

// 创建单例实例
export const updateService = new UpdateService();

// 启动时检查更新（简化版）
export const checkUpdateOnStartup = async () => {
  if (updateService.canCheckUpdate()) {
    try {
      await updateService.checkForUpdates();
      updateService.recordLastCheck();
    } catch (error) {
      console.error("启动时检查更新失败:", error);
    }
  }
};
