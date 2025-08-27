<template>
  <div class="settings-container">
    <!-- 外观与语言设置组 -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">{{ t('settings.appearanceAndLanguage') }}</div>
      </transition>

      <!-- 主题设置 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'palette']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.theme') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.themeDescription') }}</div>
          </transition>
        </div>
        <div class="setting-action">
          <CustomDropdown v-model="currentTheme" :options="themeOptions" @change="handleThemeChange"
            @dropdown-open="handleDropdownOpen('theme')" :is-open="activeDropdown === 'theme'"
            :placeholder="t('common.select')" />
        </div>
      </div>

      <!-- 语言设置 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'globe']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.language') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.languageDescription') }}</div>
          </transition>
        </div>
        <div class="setting-action">
          <CustomDropdown v-model="currentLanguage" :options="languageOptions" @change="handleLanguageChange"
            @dropdown-open="handleDropdownOpen('language')" :is-open="activeDropdown === 'language'"
            :placeholder="t('common.select')" />
        </div>
      </div>
    </div>

    <!-- 系统与更新设置组 -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">{{ t('settings.systemAndUpdates') }}</div>
      </transition>

      <!-- 检查更新 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'download']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.checkUpdates') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.checkUpdatesDescription') }}</div>
          </transition>
        </div>
        <div class="setting-action">
          <button class="check-update-btn" @click="checkForUpdates" :disabled="checkingUpdate">
            <font-awesome-icon v-if="checkingUpdate" :icon="['fas', 'spinner']" spin />
            <transition name="text-swift" mode="out-in">
              <span :key="currentLanguage + '-' + checkingUpdate">
                {{ checkingUpdate ? t('settings.checking') : t('settings.check') }}
              </span>
            </transition>
          </button>
        </div>
      </div>
    </div>

    <!-- 版本信息 -->
    <div class="version-info">
      <transition name="text-swift" mode="out-in">
        <div class="version-text" :key="currentLanguage">{{ t('settings.versionInfo', { version: appVersion }) }}</div>
      </transition>
      <transition name="text-swift" mode="out-in">
        <div class="version-detail" :key="currentLanguage">{{ t('settings.developedBy') }}</div>
      </transition>
    </div>

    <!-- 更新提示 -->
    <transition name="slide">
      <div v-if="updateMessage" :class="['update-message', updateMessage.type]" :key="updateMessage.text">
        <font-awesome-icon :icon="updateMessage.icon" />
        <transition name="text-swift" mode="out-in">
          <span :key="currentLanguage + '-' + updateMessage.text">{{ updateMessage.text }}</span>
        </transition>
        
        <!-- 更新操作按钮 -->
        <div v-if="updateStatus === UpdateStatus.AVAILABLE" class="update-actions">
          <button class="update-btn" @click="downloadAndInstall">
            <font-awesome-icon :icon="['fas', 'download']" />
            立即更新
          </button>
          <button class="update-btn secondary" @click="updateMessage = null">
            稍后
          </button>
        </div>
        
        <!-- 更新详情 -->
        <div v-if="updateInfo && updateStatus === UpdateStatus.AVAILABLE" class="update-details">
          <h4>版本 {{ updateInfo.version }} 更新内容:</h4>
          <div class="update-content" v-html="formatUpdateNotes(updateInfo.body)"></div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { updateService, UpdateStatus } from '../services/updateService.js';
import CustomDropdown from '../components/CustomDropdown.vue';
import { useI18n } from 'vue-i18n';

export default {
  name: 'Settings',
  components: {
    CustomDropdown
  },
  data() {
    return {
      currentTheme: 'light',
      currentLanguage: 'zh-CN',
      checkingUpdate: false,
      updateMessage: null,
      appVersion: '3.0.0-Alpha-3',
      activeDropdown: null,
      updateInfo: null,
      updateStatus: UpdateStatus.IDLE
    };
  },
  computed: {
    themeOptions() {
      return [
        { value: 'light', label: this.$t('common.light') },
        { value: 'dark', label: this.$t('common.dark') }
      ];
    },
    languageOptions() {
      return [
        { value: 'zh-CN', label: '简体中文' },
        { value: 'zh-TW', label: '繁體中文' },
        { value: 'en-US', label: 'English' }
      ];
    }
  },
  setup() {
    const { t, locale } = useI18n({ useScope: 'global' });
    return { t, locale };
  },
  methods: {
    formatUpdateNotes(body) {
      if (!body) return '暂无更新说明';
      
      // 将Markdown格式转换为HTML
      return body
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/- (.*?)(\n|$)/g, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
    },

    handleDropdownOpen(dropdownName) {
      // 当一个新的下拉框打开时，关闭其他所有下拉框
      // 如果点击的是已经打开的下拉框，则关闭它
      if (this.activeDropdown === dropdownName) {
        this.activeDropdown = null;
      } else {
        this.activeDropdown = dropdownName;
      }
    },

    handleThemeChange(option) {
      const theme = option.value;
      localStorage.setItem('theme', theme);

      if (window.themeManager) {
        window.themeManager.setTheme(theme);
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }

      // 选择后关闭下拉框
      this.activeDropdown = null;
    },

    handleLanguageChange(option) {
      const lang = option.value;
      this.setLanguage(lang);

      // 选择后关闭下拉框
      this.activeDropdown = null;
    },

    setLanguage(lang) {
      this.currentLanguage = lang;
      try {
        // 使用全局 i18n 实例设置语言
        if (this.$i18n) {
          this.$i18n.locale = lang;
        } else if (window.$i18n) {
          window.$i18n.locale = lang;
        }
        localStorage.setItem('language', lang);
        // 触发自定义事件通知其他组件
        window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
      } catch (error) {
        console.error('语言切换失败:', error);
      }
    },

    async checkForUpdates() {
      this.checkingUpdate = true;
      this.updateMessage = null;
      this.updateStatus = UpdateStatus.CHECKING;

      try {
        const update = await updateService.checkForUpdates();
        
        if (update.shouldUpdate) {
          this.updateInfo = update;
          this.updateStatus = UpdateStatus.AVAILABLE;
          this.updateMessage = {
            text: `发现新版本 ${update.version}，点击下载更新`,
            type: 'info',
            icon: ['fas', 'download']
          };
        } else {
          this.updateStatus = UpdateStatus.NOT_AVAILABLE;
          this.updateMessage = {
            text: this.$t('settings.latestVersion'),
            type: 'success',
            icon: ['fas', 'check']
          };
        }
      } catch (error) {
        this.updateStatus = UpdateStatus.ERROR;
        this.updateMessage = {
          text: this.$t('settings.updateFailed'),
          type: 'error',
          icon: ['fas', 'times']
        };
      } finally {
        this.checkingUpdate = false;

        // 5秒后自动隐藏提示
        setTimeout(() => {
          if (this.updateStatus !== UpdateStatus.AVAILABLE) {
            this.updateMessage = null;
          }
        }, 5000);
      }
    },

    async downloadAndInstall() {
      if (!this.updateInfo) return;

      try {
        this.updateStatus = UpdateStatus.DOWNLOADING;
        this.updateMessage = {
          text: '正在下载更新...',
          type: 'info',
          icon: ['fas', 'spinner']
        };

        await updateService.downloadAndInstall();
        
        // 更新完成会在服务中处理重启
      } catch (error) {
        this.updateStatus = UpdateStatus.ERROR;
        this.updateMessage = {
          text: '下载更新失败: ' + error.message,
          type: 'error',
          icon: ['fas', 'times']
        };
      }
    },

    async initializeLanguage() {
      try {
        const savedLanguage = localStorage.getItem('language') || 'zh-CN';
        this.currentLanguage = savedLanguage;
        // 使用全局 i18n 实例设置语言
        if (this.$i18n) {
          this.$i18n.locale = savedLanguage;
        } else if (window.$i18n) {
          window.$i18n.locale = savedLanguage;
        }
      } catch (error) {
        console.error('初始化语言失败:', error);
        this.currentLanguage = 'zh-CN';
      }
    },

    // 处理点击外部区域关闭下拉框
    handleClickOutside(event) {
      const dropdownContainers = document.querySelectorAll('.setting-action');
      let clickedInsideDropdown = false;

      dropdownContainers.forEach(container => {
        if (container.contains(event.target)) {
          clickedInsideDropdown = true;
        }
      });

      if (!clickedInsideDropdown) {
        this.activeDropdown = null;
      }
    }
  },
  async mounted() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.currentTheme = savedTheme;

    if (window.themeManager) {
      window.themeManager.setTheme(savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    await this.initializeLanguage();

    // 添加点击外部关闭下拉框的事件监听
    document.addEventListener('click', this.handleClickOutside);

    // 检查更新
    if (updateService.canCheckUpdate && updateService.canCheckUpdate()) {
      try {
        await updateService.checkForUpdates();
        updateService.recordLastCheck && updateService.recordLastCheck();
      } catch (error) {
        console.error('启动时检查更新失败:', error);
      }
    }
  },
  beforeUnmount() {
    // 移除事件监听
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>

<style scoped>
/* 设置界面样式 */
.settings-container {
  height: 100%;
  padding: 32px 24px;
  background-color: var(--bg-primary);
  overflow-y: auto;
  transition: background-color 0.25s ease;
}

.setting-group {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
  /* 统一阴影效果 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  /* 添加毛玻璃效果 */
  backdrop-filter: blur(20px);
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
}

.section-header {
  padding: 16px 20px 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 0.5px solid var(--divider-color);
  transition: color 0.25s ease, border-bottom-color 0.25s ease;
  /* 添加微妙的背景色 */
  background-color: rgba(0, 0, 0, 0.02);
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  transition: background-color 0.2s ease;
  position: relative;
  /* 添加更平滑的过渡 */
  transition: all 0.3s cubic-bezier(0.65, 0, 0.35, 1);
}

.setting-item:hover {
  background-color: var(--bg-tertiary);
  /* 添加微妙的缩放效果 */
  transform: translateY(-0.5px);
}

.setting-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: var(--accent-color);
  transition: color 0.25s ease;
  /* 添加圆角背景 */
  border-radius: 8px;
  background-color: rgba(0, 122, 255, 0.1);
}

.check-update-btn {
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease, background-color 0.25s ease, color 0.25s ease, transform 0.25s ease;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  /* 添加微妙的阴影 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.check-update-btn:hover:not(:disabled) {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  /* 增强悬停阴影 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.check-update-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.check-update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transition: opacity 0.25s ease;
}

.version-info {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-tertiary);
  transition: color 0.25s ease;
}

.version-text {
  font-size: 15px;
  margin-bottom: 8px;
  transition: color 0.25s ease;
}

.version-detail {
  font-size: 13px;
  opacity: 0.8;
  transition: opacity 0.25s ease, color 0.25s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-container {
    padding: 16px 16px;
  }

  .setting-item {
    padding: 12px 16px;
  }

  .setting-item:not(:last-child)::after {
    left: 16px;
  }

  .setting-title {
    font-size: 16px;
  }

  .setting-description {
    font-size: 14px;
  }

  .setting-action .custom-dropdown {
    width: 120px;
  }
}

@media (max-width: 480px) {
  .settings-container {
    padding: 12px 12px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .setting-icon {
    margin-bottom: 8px;
  }

  .setting-action {
    margin-left: 0;
    margin-top: 12px;
    align-self: stretch;
    width: 100%;
  }

  .setting-action .custom-dropdown {
    width: 100%;
  }
}

/* 暗色主题适配 */
[data-theme="dark"] {
  .setting-group {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .section-header {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .setting-item:not(:last-child)::after {
    background: rgba(255, 255, 255, 0.1);
  }
}

.setting-action {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.setting-action .custom-dropdown {
  min-width: 140px;
  width: 140px;
}

/* 更新消息样式 */
.update-message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 420px;
  min-width: 320px;
  backdrop-filter: blur(20px);
  transition: all 0.3s cubic-bezier(0.65, 0, 0.35, 1);
}

.update-message.success {
  background: var(--success-color);
  color: white;
}

.update-message.error {
  background: var(--error-color);
  color: white;
}

.update-message.info {
  background: var(--info-color);
  color: white;
}

.update-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.update-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
}

.update-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.update-btn:active {
  transform: translateY(0);
}

.update-btn.secondary {
  background: transparent;
}

.update-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.update-details h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.update-content {
  font-size: 0.75rem;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  color: rgba(255, 255, 255, 0.9);
}

.update-content :deep(p) {
  margin: 0.25rem 0;
}

.update-content :deep(ul) {
  margin: 0.5rem 0;
  padding-left: 1rem;
}

.update-content :deep(li) {
  margin-bottom: 0.25rem;
}

.update-content :deep(strong) {
  font-weight: 600;
}

/* 更新检查中的动画 */
.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .update-message {
    left: 10px;
    right: 10px;
    max-width: none;
    min-width: auto;
  }
  
  .update-actions {
    flex-direction: column;
  }
  
  .update-btn {
    width: 100%;
  }
}

.setting-action .dropdown-display {
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 8px;
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  color: var(--dropdown-text);
  transition: all 0.2s ease;
  width: 100%;
}

.setting-action .dropdown-display:hover {
  background: var(--dropdown-hover-bg);
}

.setting-action .dropdown-icon {
  font-size: 10px;
  margin-left: 6px;
}

.setting-action .dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  width: 100%;
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--dropdown-shadow);
  overflow: hidden;
  z-index: 1001;
  backdrop-filter: blur(20px);
  cursor: default;
  min-width: 140px;
}

.setting-action .dropdown-option {
  padding: 8px 12px;
  font-size: 14px;
  color: var(--dropdown-text);
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
}

.setting-action .dropdown-option:hover {
  background: var(--dropdown-hover-bg);
}

.setting-action .dropdown-option.selected {
  background: var(--dropdown-selected-bg);
  color: var(--dropdown-selected-text);
}
</style>