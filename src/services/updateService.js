/**
 * 更新服务 - 检查更新、下载更新、版本比较
 */
import { invoke } from '@tauri-apps/api/core';
import { check } from '@tauri-apps/plugin-updater';
import { ask } from '@tauri-apps/plugin-dialog';
import { relaunch } from '@tauri-apps/plugin-process';

// 版本信息
const CURRENT_VERSION = '3.0.0-Alpha-3';

// GitHub API 配置
const GITHUB_OWNER = 'Eververdants';
const GITHUB_REPO = 'ETBSaveManager';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

// 更新状态枚举
export const UpdateStatus = {
  IDLE: 'idle',
  CHECKING: 'checking',
  AVAILABLE: 'available',
  NOT_AVAILABLE: 'not_available',
  DOWNLOADING: 'downloading',
  DOWNLOADED: 'downloaded',
  ERROR: 'error'
};

class UpdateService {
  constructor() {
    this.status = UpdateStatus.IDLE;
    this.progress = 0;
    this.updateInfo = null;
    this.error = null;
  }

  /**
   * 检查是否有新版本
   * @returns {Promise<Object>} 更新信息
   */
  async checkForUpdates() {
    try {
      this.status = UpdateStatus.CHECKING;
      this.error = null;

      // 方法1: 使用 Tauri 的更新检查器
      try {
        const update = await check();
        if (update) {
          this.status = UpdateStatus.AVAILABLE;
          this.updateInfo = {
            version: update.version,
            date: update.date,
            body: update.body || '暂无更新说明',
            downloadUrl: update.downloadUrl,
            signature: update.signature,
            shouldUpdate: true
          };
          return this.updateInfo;
        }
      } catch (tauriError) {
        console.warn('Tauri更新器检查失败，尝试GitHub API:', tauriError);
      }

      // 方法2: 使用 GitHub API 作为备用
      try {
        const githubUpdate = await this.checkGitHubRelease();
        if (githubUpdate && this.isNewVersion(githubUpdate.version, CURRENT_VERSION)) {
          this.status = UpdateStatus.AVAILABLE;
          this.updateInfo = githubUpdate;
          return this.updateInfo;
        }
      } catch (githubError) {
        console.warn('GitHub API检查失败:', githubError);
      }

      this.status = UpdateStatus.NOT_AVAILABLE;
      return { shouldUpdate: false, message: '当前已是最新版本' };

    } catch (error) {
      console.error('检查更新失败:', error);
      this.status = UpdateStatus.ERROR;
      this.error = error.message;
      throw new Error(`更新检查失败: ${error.message}`);
    }
  }

  /**
   * 从GitHub检查最新发布版本
   * @returns {Promise<Object|null>} GitHub发布信息
   */
  async checkGitHubRelease() {
    try {
      const response = await fetch(GITHUB_API_URL);
      if (!response.ok) throw new Error('无法获取发布信息');

      const release = await response.json();
      
      return {
        version: release.tag_name.replace('v', ''),
        date: release.published_at,
        body: release.body,
        downloadUrl: release.assets.find(asset => 
          asset.name.includes('setup') || asset.name.includes('msi') || asset.name.includes('exe')
        )?.browser_download_url,
        shouldUpdate: true
      };
    } catch (error) {
      console.error('GitHub API检查失败:', error);
      return null;
    }
  }

  /**
   * 比较版本号
   * @param {string} newVersion - 新版本号
   * @param {string} currentVersion - 当前版本号
   * @returns {boolean} 是否为新版本
   */
  isNewVersion(newVersion, currentVersion) {
    const parseVersion = (version) => {
      return version.replace(/[^\d.]/g, '').split('.').map(Number);
    };

    const newParts = parseVersion(newVersion);
    const currentParts = parseVersion(currentVersion);

    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }
    
    return false;
  }

  /**
   * 下载并安装更新
   * @returns {Promise<void>}
   */
  async downloadAndInstall() {
    if (!this.updateInfo) {
      throw new Error('没有可用的更新');
    }

    try {
      this.status = UpdateStatus.DOWNLOADING;
      
      // 使用 Tauri 的更新器
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        this.status = UpdateStatus.DOWNLOADED;
        
        // 询问用户是否重启应用
        const shouldRestart = await ask(
          '更新已下载完成，是否立即重启应用？',
          '更新完成'
        );
        
        if (shouldRestart) {
          await relaunch();
        }
      } else {
        // 备用方案：打开下载页面
        if (this.updateInfo.downloadUrl) {
          await invoke('open_external_url', { url: this.updateInfo.downloadUrl });
        }
      }

    } catch (error) {
      console.error('下载更新失败:', error);
      this.status = UpdateStatus.ERROR;
      this.error = error.message;
      throw error;
    }
  }

  /**
   * 获取更新进度
   * @returns {number} 进度百分比
   */
  getProgress() {
    return this.progress;
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
    this.progress = 0;
    this.updateInfo = null;
    this.error = null;
  }

  /**
   * 检查更新频率控制
   * @returns {boolean} 是否可以检查更新
   */
  canCheckUpdate() {
    const lastCheck = localStorage.getItem('lastUpdateCheck');
    if (!lastCheck) return true;
    
    const now = Date.now();
    const lastCheckTime = parseInt(lastCheck);
    const hoursSinceLastCheck = (now - lastCheckTime) / (1000 * 60 * 60);
    
    // 每6小时检查一次
    return hoursSinceLastCheck >= 6;
  }

  /**
   * 记录最后检查时间
   */
  recordLastCheck() {
    localStorage.setItem('lastUpdateCheck', Date.now().toString());
  }

  /**
   * 获取当前版本号
   * @returns {string} 当前版本号
   */
  getCurrentVersion() {
    return CURRENT_VERSION;
  }
}

// 创建单例实例
export const updateService = new UpdateService();

// 自动检查更新（启动时）
export const checkUpdateOnStartup = async () => {
  if (updateService.canCheckUpdate()) {
    try {
      await updateService.checkForUpdates();
      updateService.recordLastCheck();
    } catch (error) {
      console.error('启动时检查更新失败:', error);
    }
  }
};