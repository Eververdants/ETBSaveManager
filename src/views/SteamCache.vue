<template>
  <div class="steam-cache-container">
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <font-awesome-icon :icon="['fas', 'arrow-left']" />
        {{ t('common.back') }}
      </button>
      <h1>{{ t('settings.steamApi.cacheTitle') }}</h1>
    </div>

    <div class="cache-content">
      <div class="cache-actions">
        <button class="cleanup-expired-btn" @click="cleanupExpiredCache" :disabled="isCleaning">
          <font-awesome-icon :icon="['fas', 'trash']" />
          {{ t('settings.steamApi.cleanupExpired') }}
        </button>
        <div class="cache-count-info">
          {{ t('settings.steamApi.cacheCount', { count: cacheCount }) }}
        </div>
      </div>

      <div class="cache-table-container">
        <table class="cache-table" v-if="cacheEntries.length > 0">
          <thead>
            <tr>
              <th>{{ t('settings.steamApi.cacheTable.steamId') }}</th>
              <th>{{ t('settings.steamApi.cacheTable.username') }}</th>
              <th>{{ t('settings.steamApi.cacheTable.lastUpdated') }}</th>
              <th>{{ t('settings.steamApi.cacheTable.callCount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in cacheEntries" :key="entry.steamId">
              <td class="steam-id-cell">{{ maskSteamId(entry.steamId) }}</td>
              <td>{{ entry.username }}</td>
              <td>{{ formatDate(entry.lastUpdated) }}</td>
              <td>{{ entry.callCount }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="no-cache-entries">
          {{ t('settings.steamApi.noCacheEntries') }}
        </div>
      </div>
    </div>

    <!-- 成功提示消息 -->
    <div v-if="showSuccessMessage" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<script>
import { invoke } from '@tauri-apps/api/core';
import { useI18n } from 'vue-i18n';
import { showError } from '../services/popupService';

export default {
  name: 'SteamCache',
  setup() {
    const { t } = useI18n();
    return { t };
  },
  data() {
    return {
      cacheEntries: [],
      cacheCount: 0,
      isCleaning: false,
      showSuccessMessage: false,
      successMessage: ''
    };
  },
  mounted() {
    this.loadCacheEntries();
  },
  methods: {
    // 返回上一页
    goBack() {
      this.$router.go(-1);
    },
    
    // 加载缓存条目
    async loadCacheEntries() {
      try {
        const entries = await invoke('get_all_steam_cache_entries');
        // 将后端返回的数组格式转换为前端需要的对象格式
        this.cacheEntries = entries.map(([steamId, username, lastUpdated, callCount]) => ({
          steamId,
          username,
          lastUpdated,
          callCount
        }));
        this.cacheCount = this.cacheEntries.length;
      } catch (error) {
        console.error('获取缓存条目失败:', error);
        showError(this.t('settings.steamApi.cacheViewError', { error: error }));
      }
    },
    
    // 清理过期缓存
    async cleanupExpiredCache() {
      this.isCleaning = true;
      try {
        const count = await invoke('cleanup_expired_steam_cache');
        this.showSuccess(this.t('settings.steamApi.cleanupCompleted', { count }));
        // 重新加载缓存条目
        await this.loadCacheEntries();
      } catch (error) {
        console.error('清理过期缓存失败:', error);
        showError(this.t('settings.steamApi.cleanupError', { error: error }));
      } finally {
        this.isCleaning = false;
      }
    },
    
    // 显示成功消息
    showSuccess(message) {
      this.successMessage = message;
      this.showSuccessMessage = true;
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 3000);
    },
    
    // 格式化日期
    formatDate(timestamp) {
      if (!timestamp) return this.t('common.unknown');
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    },
    
    // Steam ID脱敏处理
    maskSteamId(steamId) {
      if (!steamId) return '';
      // Steam ID格式通常是7656119XXXXXXXXX (17位数字)
      if (steamId.length >= 8) {
        const start = steamId.substring(0, 4);
        const end = steamId.substring(steamId.length - 4);
        const middle = '*'.repeat(steamId.length - 8);
        return start + middle + end;
      }
      // 如果长度不足8位，只显示前两位
      return steamId.substring(0, 2) + '*'.repeat(steamId.length - 2);
    }
  }
};
</script>

<style scoped>
.steam-cache-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);
  max-height: calc(100vh - 40px);
  background-color: var(--bg-primary);
  color: var(--text);
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.steam-cache-container::before,
.steam-cache-container::after {
  display: none !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 16px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.cache-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  min-height: 0;
}

.cache-content::before,
.cache-content::after {
  display: none !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.cache-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.cleanup-expired-btn {
  background-color: #ff6b35;
  color: white;
  border: 2px solid #ff6b35;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(255, 107, 53, 0.2);
}

.cleanup-expired-btn:hover:not(:disabled) {
  background-color: #e55a2b;
  border-color: #e55a2b;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 107, 53, 0.3);
}

.cleanup-expired-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cache-count-info {
  font-size: 14px;
  color: var(--text-secondary);
}

.cache-table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  min-height: 0;
}

.cache-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.cache-table th, .cache-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.cache-table th {
  background-color: var(--bg-tertiary);
  font-weight: 600;
  color: var(--text-primary);
  position: sticky;
  top: 0;
}

.cache-table td {
  color: var(--text-secondary);
}

.cache-table tr:last-child td {
  border-bottom: none;
}

.cache-table tr:hover {
  background-color: var(--bg-tertiary);
}

.steam-id-cell {
  font-family: monospace;
  font-size: 13px;
}

.no-cache-entries {
  padding: 40px;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: var(--success-color);
  color: white;
  padding: 12px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .steam-cache-container {
    padding: 12px;
  }
  
  .page-header {
    margin-bottom: 16px;
  }
  
  .page-header h1 {
    font-size: 20px;
  }
  
  .cache-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .cache-table-container {
    font-size: 12px;
  }
  
  .cache-table th, .cache-table td {
    padding: 8px;
  }
}

/* 确保没有任何紫色虚线边框 */
.steam-cache-container *,
.cache-content * {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.steam-cache-container *::before,
.steam-cache-container *::after,
.cache-content *::before,
.cache-content *::after {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}
</style>