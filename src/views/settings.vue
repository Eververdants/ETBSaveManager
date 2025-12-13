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

    <!-- 高级设置组 -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">{{ t('settings.advancedSettings') }}</div>
      </transition>

      <!-- 禁用GPU加速开关 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'microchip']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.disableGpuAcceleration') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.disableGpuAccelerationDescription')
              }}</div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="gpuAccelerationDisabled" @change="handleGpuAccelerationToggle">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 系统与更新设置组 -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">{{ t('settings.systemAndUpdates') }}</div>
      </transition>

      <!-- 更新源设置 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'cloud']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.updateSource') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.updateSourceDescription') }}</div>
          </transition>
        </div>
        <div class="setting-action">
          <CustomDropdown v-model="currentUpdateSource" :options="updateSourceOptions"
            @change="handleUpdateSourceChange" @dropdown-open="handleDropdownOpen('updateSource')"
            :is-open="activeDropdown === 'updateSource'" :placeholder="t('common.select')" />
        </div>
      </div>

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

    <!-- Steam API 设置组 -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">{{ t('settings.steamApi.title') }}</div>
      </transition>

      <!-- API Key 设置 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'key']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.steamApi.apiKey') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.steamApi.apiKeyDescription') }}</div>
          </transition>
        </div>
        <div class="setting-action">
          <div class="api-key-container">
            <div class="api-key-input-wrapper">
              <input v-model="steamApiKey" :type="showApiKey ? 'text' : 'password'" class="api-key-input"
                :placeholder="t('settings.steamApi.apiKeyPlaceholder')" />
              <button class="toggle-visibility-btn" @click="showApiKey = !showApiKey"
                :title="showApiKey ? t('settings.steamApi.hideApiKey') : t('settings.steamApi.showApiKey')">
                <font-awesome-icon :icon="showApiKey ? ['fas', 'eye-slash'] : ['fas', 'eye']" />
              </button>
              <button class="save-api-key-btn" @click="saveSteamApiKey" :title="t('settings.steamApi.saveApiKey')">
                <font-awesome-icon :icon="['fas', 'save']" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 缓存状态 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'database']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.steamApi.cacheStatus') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.steamApi.cacheStatusDescription') }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <div class="cache-info">
            <transition name="text-swift" mode="out-in">
              <span class="cache-count" :key="currentLanguage + '-' + cacheEntryCount">{{ cacheEntryCount }} {{
                t('settings.steamApi.cacheEntries') }}</span>
            </transition>
            <button class="view-cache-btn" @click="navigateToSteamCache">
              <font-awesome-icon :icon="['fas', 'eye']" />
              <transition name="text-swift" mode="out-in">
                <span :key="currentLanguage + '-viewCache'">{{ t('settings.steamApi.viewCache') }}</span>
              </transition>
            </button>
            <button class="clear-cache-btn" @click="clearSteamCache">
              <font-awesome-icon :icon="['fas', 'trash']" />
              <transition name="text-swift" mode="out-in">
                <span :key="currentLanguage + '-clearCache'">{{ t('settings.steamApi.clearCache') }}</span>
              </transition>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 开发者选项设置组 -->
    <div class="setting-group" v-if="developerOptionsEnabled">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">{{ t('settings.developerOptions') }}</div>
      </transition>

      <!-- 开发者模式开关 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'code']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.developerMode') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.developerModeDescription') }}</div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="developerModeEnabled" @change="handleDeveloperModeToggle">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- 日志功能开关 -->
      <div class="setting-item" v-if="developerModeEnabled">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'file-alt']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.enableLogging') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.enableLoggingDescription') }}</div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="logMenuEnabled" @change="handleLogMenuToggle">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- 性能监控开关 -->
      <div class="setting-item" v-if="developerModeEnabled">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'tachometer-alt']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.performanceMonitor') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.performanceMonitorDescription') }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="performanceMonitorEnabled" @change="handlePerformanceMonitorToggle">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- 测试存档显示开关 -->
      <div class="setting-item" v-if="developerModeEnabled">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'flask']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">{{ t('settings.testArchiveDisplay') }}</div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">{{ t('settings.testArchiveDisplayDescription') }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="testArchiveEnabled" @change="handleTestArchiveToggle">
            <span class="slider"></span>
          </label>
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
      <div v-if="updateMessage" :class="['update-message', updateMessage.type]"
        :key="updateMessage.key || updateMessage.text">
        <font-awesome-icon :icon="updateMessage.icon" />
        <transition name="text-swift" mode="out-in">
          <span :key="currentLanguage + '-' + updateMessage.text">{{ updateMessage.text }}</span>
        </transition>

        <!-- 更新操作按钮 -->
        <transition name="expand" mode="out-in">
          <div v-if="updateStatus === UpdateStatus.AVAILABLE" class="update-actions"
            :key="'actions-' + updateMessage.key">
            <button class="update-btn" @click="downloadAndInstall" :disabled="isProcessing">
              <font-awesome-icon :icon="['fas', 'external-link-alt']" />
              {{ t('settings.goToDownload') }}
            </button>
            <button class="update-btn secondary" @click="closeUpdateMessage">
              {{ t('common.later') }}
            </button>
          </div>
        </transition>

        <!-- 自定义操作按钮 -->
        <transition name="expand" mode="out-in">
          <div v-if="updateMessage.showActions" class="update-actions" :key="'custom-actions-' + updateMessage.key">
            <button v-for="(action, index) in updateMessage.actions" :key="index" :class="['update-btn', action.class]"
              @click="action.action">
              {{ action.text }}
            </button>
          </div>
        </transition>

        <!-- 更新详情 -->
        <transition name="expand" mode="out-in">
          <div v-if="updateInfo && updateStatus === UpdateStatus.AVAILABLE" class="update-details"
            :key="'details-' + updateMessage.key">
            <h4>{{ t('settings.updateNotesForVersion', { version: updateInfo.version }) }}</h4>
            <div class="update-content" v-html="formatUpdateNotes(updateInfo.body)"></div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { updateService, UpdateStatus } from '../services/updateService.js';
import { getAllUpdateSources, getUserUpdateSource, setUserUpdateSource } from '../config/updateConfig.js';
import CustomDropdown from '../components/CustomDropdown.vue';
import { useI18n } from 'vue-i18n';
import { invoke } from '@tauri-apps/api/core';

export default {
  name: 'Settings',
  components: {
    CustomDropdown
  },
  data() {
    return {
      currentTheme: localStorage.getItem('theme') || 'light',
      currentLanguage: localStorage.getItem('language') || 'zh-CN',
      currentUpdateSource: localStorage.getItem('updateSource') || 'GITEE',
      performanceMonitorEnabled: localStorage.getItem('performanceMonitor') !== 'false', // 默认开启
      developerModeEnabled: localStorage.getItem('developerMode') === 'true', // 开发者模式状态
      developerOptionsEnabled: localStorage.getItem('developerMode') === 'true', // 开发者选项是否显示
      logMenuEnabled: localStorage.getItem('logMenuEnabled') === 'true', // 日志功能开关状态
      testArchiveEnabled: localStorage.getItem('testArchiveEnabled') !== 'false', // 测试存档显示开关状态，默认开启
      gpuAccelerationDisabled: localStorage.getItem('gpuAccelerationDisabled') === 'true', // GPU加速开关状态
      // Steam API 相关
      steamApiKey: '',
      showApiKey: false,
      cacheEntryCount: 0,
      checkingUpdate: false,
      updateMessage: null,
      appVersion: '3.0.0-Alpha-6.3',
      activeDropdown: null,
      updateInfo: null,
      updateStatus: UpdateStatus.IDLE,
      UpdateStatus: UpdateStatus, // 将UpdateStatus暴露给模板使用
      isProcessing: false,
      messageId: 0
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
        { value: 'zh-CN', label: "简体中文" },
        { value: 'zh-TW', label: "繁體中文" },
        { value: 'en-US', label: "English" }
      ];
    },
    updateSourceOptions() {
      const sources = getAllUpdateSources();
      return Object.entries(sources).map(([key, source]) => ({
        value: key,
        label: source.name
      }));
    }
  },
  setup() {
    const { t, locale } = useI18n({ useScope: 'global' });
    return { t, locale };
  },
  methods: {
    formatUpdateNotes(body) {
      if (!body) return this.t('settings.noUpdateNotes');

      let html = body;

      // 处理代码块
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

      // 处理标题
      html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
      html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
      html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

      // 处理列表
      html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
      html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
      html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

      // 处理粗体和斜体
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
      html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
      html = html.replace(/_(.*?)_/g, '<em>$1</em>');

      // 处理链接 [text](url)
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

      // 处理换行
      html = html.replace(/\n\n/g, '</p><p>');
      html = html.replace(/\n/g, '<br>');

      // 包装段落
      if (!html.includes('<h') && !html.includes('<pre') && !html.includes('<ul')) {
        html = '<p>' + html + '</p>';
      }

      return html;
    },

    handleDropdownOpen(dropdown) {
      this.activeDropdown = this.activeDropdown === dropdown ? null : dropdown;
    },

    handleThemeChange(option) {
      const theme = option.value;
      localStorage.setItem('theme', theme);

      if (window.themeManager) {
        window.themeManager.setTheme(theme);
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }

      // 强制触发背景更新以确保立即可见
      this.forceThemeBackgroundUpdate(theme);

      // 选择后关闭下拉框
      this.activeDropdown = null;
    },

    forceThemeBackgroundUpdate(theme) {
      // 额外的背景更新保障，确保主题切换立即生效
      const root = document.documentElement;
      const body = document.body;

      if (theme === 'dark') {
        root.style.setProperty('--bg', '#1c1c1e');
        root.style.setProperty('--bg-primary', '#1c1c1e');
        root.style.setProperty('--bg-secondary', '#2c2c2e');
        if (body) {
          body.style.backgroundColor = '#1c1c1e';
          body.style.setProperty('--bg', '#1c1c1e');
        }
      } else {
        root.style.setProperty('--bg', '#f8f9fa');
        root.style.setProperty('--bg-primary', '#f8f9fa');
        root.style.setProperty('--bg-secondary', '#ffffff');
        if (body) {
          body.style.backgroundColor = '#f8f9fa';
          body.style.setProperty('--bg', '#f8f9fa');
        }
      }

      // 强制重绘
      void document.body.offsetHeight;
    },

    async handleLanguageChange(option) {
      const lang = option.value;
      await this.setLanguage(lang);

      // 选择后关闭下拉框
      this.activeDropdown = null;
    },

    async setLanguage(lang) {
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

        // 更新窗口标题为语言文件中的 app.name
        await this.updateWindowTitle();
      } catch (error) {
        console.error(this.t('settings.languageSwitchFailed'), error);
      }
    },

    async updateWindowTitle() {
      try {
        // 获取当前语言文件中的应用名称
        const appName = this.t('app.name');

        // 调用后端设置窗口标题
        await invoke('set_window_title', { title: appName });

        console.log('窗口标题已更新为:', appName);
      } catch (error) {
        console.error('更新窗口标题失败:', error);
        // 不抛出错误，语言切换不应该因为标题更新失败而失败
      }
    },

    handleUpdateSourceChange(option) {
      const source = option.value;
      try {
        setUserUpdateSource(source);
        this.currentUpdateSource = source;
        localStorage.setItem('updateSource', source);

        // 显示成功提示
        this.updateMessage = {
          text: this.t('settings.updateSourceChanged', { source: option.label }),
          type: 'success',
          icon: ['fas', 'check'],
          key: `source-changed-${this.messageId++}`
        };

        // 3秒后自动隐藏提示
        setTimeout(() => {
          this.closeUpdateMessage();
        }, 3000);

      } catch (error) {
        console.error(this.t('settings.updateSourceChangeFailed'), error);
        this.updateMessage = {
          text: this.t('settings.updateSourceChangeFailed'),
          type: 'error',
          icon: ['fas', 'times'],
          key: `source-error-${this.messageId++}`
        };
      }
    },

    async checkForUpdates() {
      if (this.isProcessing) return;

      this.isProcessing = true;
      this.checkingUpdate = true;
      this.updateMessage = null;
      this.updateStatus = UpdateStatus.CHECKING;
      this.messageId++;

      try {
        const update = await updateService.checkForUpdates();

        if (update.shouldUpdate) {
          this.updateInfo = update;
          this.updateStatus = UpdateStatus.AVAILABLE;
          this.updateMessage = {
            text: this.t('settings.newVersionAvailable', { version: update.version }),
            type: 'info',
            icon: ['fas', 'external-link-alt'],
            key: `available-${this.messageId}`
          };
        } else {
          this.updateStatus = UpdateStatus.NOT_AVAILABLE;
          this.updateMessage = {
            text: this.$t('settings.latestVersion'),
            type: 'success',
            icon: ['fas', 'check'],
            key: `latest-${this.messageId}`
          };
        }
      } catch (error) {
        this.updateStatus = UpdateStatus.ERROR;
        this.messageId++;

        // 使用更详细的错误信息
        let errorText = this.$t('settings.updateFailed');
        if (error.type === this.t('settings.errorType.rateLimit') || error.message?.includes('rate limit') || error.message?.includes('429')) {
          errorText = this.$t('settings.rateLimitError');
        } else if (error.type === this.t('settings.errorType.networkConnection')) {
          errorText = this.$t('settings.networkError');
        } else if (error.type === this.t('settings.errorType.resourceNotFound')) {
          errorText = this.$t('settings.resourceNotFound');
        } else if (error.type === this.t('settings.errorType.accessDenied')) {
          errorText = this.$t('settings.accessDenied');
        }

        this.updateMessage = {
          text: errorText,
          type: 'error',
          icon: ['fas', 'times'],
          key: `error-${this.messageId}`
        };
      } finally {
        this.checkingUpdate = false;
        this.isProcessing = false;

        // 8秒后自动隐藏错误提示（给更多时间阅读错误信息）
        setTimeout(() => {
          if (this.updateStatus !== UpdateStatus.AVAILABLE) {
            this.closeUpdateMessage();
          }
        }, this.updateStatus === UpdateStatus.ERROR ? 8000 : 5000);
      }
    },
    handlePerformanceMonitorToggle() {
      localStorage.setItem('performanceMonitor', this.performanceMonitorEnabled);
      // 触发自定义事件通知App.vue更新状态
      window.dispatchEvent(new CustomEvent('performance-monitor-toggle', {
        detail: { enabled: this.performanceMonitorEnabled }
      }));
    },

    handleDeveloperModeToggle() {
      localStorage.setItem('developerMode', this.developerModeEnabled);
      this.developerOptionsEnabled = this.developerModeEnabled;

      // 触发自定义事件通知其他组件
      window.dispatchEvent(new CustomEvent('developer-mode-changed', {
        detail: { enabled: this.developerModeEnabled }
      }));

      // 如果关闭开发者模式，同时关闭所有相关设置
      if (!this.developerModeEnabled) {
        // 关闭日志功能
        this.logMenuEnabled = false;
        localStorage.setItem('logMenuEnabled', 'false');
        window.dispatchEvent(new CustomEvent('log-menu-toggle', {
          detail: { enabled: false }
        }));

        // 关闭性能监控
        this.performanceMonitorEnabled = false;
        localStorage.setItem('performanceMonitor', 'false');

        // 关闭测试存档显示
        this.testArchiveEnabled = false;
        localStorage.setItem('testArchiveEnabled', 'false');
        window.dispatchEvent(new CustomEvent('test-archive-toggle', {
          detail: { enabled: false }
        }));
      }
    },

    handleLogMenuToggle() {
      localStorage.setItem('logMenuEnabled', this.logMenuEnabled);
      // 触发自定义事件通知其他组件
      window.dispatchEvent(new CustomEvent('log-menu-toggle', {
        detail: { enabled: this.logMenuEnabled }
      }));
    },

    handleTestArchiveToggle() {
      localStorage.setItem('testArchiveEnabled', this.testArchiveEnabled);
      // 触发自定义事件通知侧边栏更新状态
      window.dispatchEvent(new CustomEvent('test-archive-toggle', {
        detail: { enabled: this.testArchiveEnabled }
      }));
    },

    async handleGpuAccelerationToggle() {
      try {
        // 调用Tauri命令设置GPU加速状态
        await invoke('set_gpu_acceleration', {
          disabled: this.gpuAccelerationDisabled
        });

        // 保存状态到localStorage
        localStorage.setItem('gpuAccelerationDisabled', this.gpuAccelerationDisabled.toString());

        // 显示提示信息，告知用户需要手动重启应用
        const message = this.gpuAccelerationDisabled
          ? this.t('settings.gpuAccelerationDisabled')
          : this.t('settings.gpuAccelerationEnabled');

        this.updateMessage = {
          text: message,
          type: 'info',
          icon: ['fas', 'info-circle'],
          key: `gpu-info-${this.messageId++}`
        };

        // 5秒后自动隐藏提示
        setTimeout(() => {
          this.closeUpdateMessage();
        }, 5000);

      } catch (error) {
        console.error(this.t('settings.gpuAccelerationChangeFailed'), error);
        // 恢复开关状态
        this.gpuAccelerationDisabled = !this.gpuAccelerationDisabled;
        localStorage.setItem('gpuAccelerationDisabled', this.gpuAccelerationDisabled.toString());

        // 显示错误提示
        this.updateMessage = {
          text: this.t('settings.gpuAccelerationChangeFailed') + ': ' + error,
          type: 'error',
          icon: ['fas', 'times'],
          key: `gpu-error-${this.messageId++}`
        };

        // 3秒后自动隐藏提示
        setTimeout(() => {
          this.closeUpdateMessage();
        }, 3000);
      }
    },

    closeUpdateMessage() {
      this.updateMessage = null;
      // 添加延迟确保动画完成
      setTimeout(() => {
        this.updateStatus = UpdateStatus.IDLE;
        this.updateInfo = null;
      }, 400);
    },

    async downloadAndInstall() {
      if (!this.updateInfo || this.isProcessing) return;

      this.isProcessing = true;
      this.messageId++;

      try {
        this.updateStatus = UpdateStatus.AVAILABLE;
        this.updateMessage = {
          text: this.t('settings.openingDownloadPage'),
          type: 'info',
          icon: ['fas', 'external-link-alt'],
          key: `downloading-${this.messageId}`
        };

        await updateService.downloadAndInstall();

        // 成功打开下载页面
        this.updateMessage = {
          text: this.t('settings.downloadPageOpened'),
          type: 'success',
          icon: ['fas', 'check'],
          key: `success-${this.messageId}`
        };

        // 3秒后清除提示
        setTimeout(() => {
          this.closeUpdateMessage();
        }, 3000);

      } catch (error) {
        console.error(this.t('settings.openDownloadPageFailed'), error);
        this.updateStatus = UpdateStatus.ERROR;
        this.messageId++;
        this.updateMessage = {
          text: this.t('settings.openDownloadPageFailed'),
          type: 'error',
          icon: ['fas', 'times'],
          key: `error-${this.messageId}`
        };
      } finally {
        this.isProcessing = false;
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
        console.error(this.t('settings.languageInitFailed'), error);
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
    },

    // 处理开发者模式变化事件
    handleDeveloperModeChanged(event) {
      const enabled = event.detail.enabled;
      this.developerModeEnabled = enabled;
      this.developerOptionsEnabled = enabled;

      // 如果关闭开发者模式，重置所有相关设置
      if (!enabled) {
        // 关闭日志功能
        this.logMenuEnabled = false;
        localStorage.setItem('logMenuEnabled', 'false');
        window.dispatchEvent(new CustomEvent('log-menu-toggle', {
          detail: { enabled: false }
        }));

        // 关闭性能监控
        this.performanceMonitorEnabled = false;
        localStorage.setItem('performanceMonitor', 'false');

        // 关闭测试存档显示
        this.testArchiveEnabled = false;
        localStorage.setItem('testArchiveEnabled', 'false');
        window.dispatchEvent(new CustomEvent('test-archive-toggle', {
          detail: { enabled: false }
        }));
      }
    },

    // 初始化GPU加速状态
    async initializeGpuAccelerationStatus() {
      try {
        // 从localStorage获取状态
        const localStorageState = localStorage.getItem('gpuAccelerationDisabled') === 'true';

        // 尝试从Tauri后端获取状态
        try {
          const backendState = await invoke('get_gpu_acceleration_status');
          // 如果后端状态与localStorage不同，以后端状态为准
          if (backendState !== localStorageState) {
            this.gpuAccelerationDisabled = backendState;
            localStorage.setItem('gpuAccelerationDisabled', backendState.toString());
          }
        } catch (error) {
          console.warn(this.t('settings.gpuStatusFetchFailed'), error);
          // 使用localStorage状态
          this.gpuAccelerationDisabled = localStorageState;
        }
      } catch (error) {
        console.error(this.t('settings.gpuStatusInitFailed'), error);
        // 默认启用GPU加速
        this.gpuAccelerationDisabled = false;
      }
    },

    // 初始化Steam API设置
    async initializeSteamApiSettings() {
      try {
        // 获取加密存储的API密钥
        const encryptedApiKey = localStorage.getItem('steamApiKey');
        if (encryptedApiKey) {
          try {
            // 调用后端解密API密钥
            this.steamApiKey = await invoke('decrypt_steam_api_key', { encryptedKey: encryptedApiKey });
          } catch (error) {
            console.error(this.t('settings.steamApi.decryptKeyFailed'), error);
            // 如果解密失败，清除存储的密钥
            localStorage.removeItem('steamApiKey');
          }
        }

        // 获取缓存条目数量
        this.updateCacheEntryCount();
      } catch (error) {
        console.error(this.t('settings.steamApi.initFailed'), error);
      }
    },

    // 保存Steam API密钥
    async saveSteamApiKey() {
      if (!this.steamApiKey.trim()) {
        this.updateMessage = {
          text: this.t('settings.steamApi.apiKeyPlaceholder'),
          type: 'error',
          icon: ['fas', 'times'],
          key: `api-key-error-${this.messageId++}`
        };
        return;
      }

      try {
        // 显示测试中提示
        this.updateMessage = {
          text: this.t('settings.steamApi.validatingKey'),
          type: 'info',
          icon: ['fas', 'spinner'],
          spin: true,
          key: `api-key-testing-${this.messageId++}`
        };

        // 生成一个随机的Steam ID用于测试
        const testSteamId = this.generateRandomSteamId();
        console.log(this.t('settings.steamApi.testSteamId'), testSteamId, this.t('settings.steamApi.idLength'), testSteamId.length);

        // 测试API密钥是否有效
        let apiTestPassed = false;
        try {
          console.log(this.t('settings.steamApi.startKeyTest'));
          // 直接使用用户输入的API密钥进行测试，而不是从配置文件读取
          const result = await invoke('test_steam_api_key', { apiKey: this.steamApiKey, steamId: testSteamId });
          console.log(this.t('settings.steamApi.apiCallSuccess'), result);
          // 如果成功，说明API密钥有效
          apiTestPassed = true;
        } catch (error) {
          const errorMsg = error.toString();
          console.log(this.t('settings.steamApi.apiCallFailed'), errorMsg);

          // 如果是403错误，说明API密钥无效
          if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
            console.log(this.t('settings.steamApi.detected403Error'));
            this.updateMessage = {
              text: this.t('settings.steamApi.keyInvalid'),
              type: 'error',
              icon: ['fas', 'times'],
              key: `api-key-invalid-${this.messageId++}`
            };
            return; // 直接返回，不保存密钥
          }

          // 如果是Steam ID格式错误，说明我们生成的ID有问题，但这不是API密钥的问题
          if (errorMsg.includes(this.t('settings.steamApi.error.invalidSteamIdFormat')) || errorMsg.includes('Invalid Steam ID format')) {
            console.log(this.t('settings.steamApi.detectedSteamIdFormatError'));
            // 这是我们生成ID的问题，不是API密钥的问题，可以继续保存
            apiTestPassed = true;
          }
          // 如果是Steam API返回的错误，说明API密钥有效，只是我们生成的ID不存在
          else if (errorMsg.includes(this.t('settings.steamApi.error.steamApiError'))) {
            console.log(this.t('settings.steamApi.detectedSteamApiError'));
            apiTestPassed = true;
          }
          // 其他错误可能是网络问题，可以继续保存
          else {
            console.warn(this.t('settings.steamApi.otherError'), error);
            apiTestPassed = true;
          }
        }

        // 只有API测试通过时才保存密钥
        if (!apiTestPassed) {
          console.log(this.t('settings.steamApi.apiTestFailed'));
          this.updateMessage = {
            text: this.t('settings.steamApi.keyTestFailed'),
            type: 'error',
            icon: ['fas', 'times'],
            key: `api-key-test-failed-${this.messageId++}`
          };
          return;
        }

        console.log(this.t('settings.steamApi.keyValidationPassed'));
        // 调用后端保存API密钥到配置文件
        await invoke('save_steam_api_key', { apiKey: this.steamApiKey });
        console.log(this.t('settings.steamApi.keySavedToConfig'));

        // 同时保存到localStorage以保持兼容性
        const encryptedApiKey = await invoke('encrypt_steam_api_key', { apiKey: this.steamApiKey });
        localStorage.setItem('steamApiKey', encryptedApiKey);
        console.log(this.t('settings.steamApi.keySavedToLocalStorage'));

        // 显示成功提示
        this.updateMessage = {
          text: this.t('settings.steamApi.keySaved'),
          type: 'success',
          icon: ['fas', 'check'],
          key: `api-key-success-${this.messageId++}`
        };

        // 3秒后自动隐藏提示
        setTimeout(() => {
          this.closeUpdateMessage();
        }, 3000);
      } catch (error) {
        console.error(this.t('settings.steamApi.saveKeyFailed'), error);
        this.updateMessage = {
          text: this.t('settings.steamApi.saveKeyFailed') + ': ' + error,
          type: 'error',
          icon: ['fas', 'times'],
          key: `api-key-error-${this.messageId++}`
        };
      }
    },

    // 生成随机Steam ID用于测试
    generateRandomSteamId() {
      // Steam ID格式通常是7656119XXXXXXXXX (17位数字)
      // 7656119是Steam ID的前缀，后面需要10位数字才能达到17位
      const prefix = '7656119';
      const randomSuffix = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      return prefix + randomSuffix;
    },

    // 清空Steam缓存
    async clearSteamCache() {
      try {
        // 调用后端清空缓存
        await invoke('clear_steam_cache');

        // 更新缓存条目数量
        this.updateCacheEntryCount();

        // 显示成功提示
        this.updateMessage = {
          text: this.t('settings.steamApi.cacheCleared'),
          type: 'success',
          icon: ['fas', 'check'],
          key: `cache-clear-success-${this.messageId++}`
        };

        // 3秒后自动隐藏提示
        setTimeout(() => {
          this.closeUpdateMessage();
        }, 3000);
      } catch (error) {
        console.error(this.t('settings.steamApi.clearCacheFailed'), error);
        this.updateMessage = {
          text: this.t('settings.steamApi.clearCacheFailed') + ': ' + error,
          type: 'error',
          icon: ['fas', 'times'],
          key: `cache-clear-error-${this.messageId++}`
        };
      }
    },

    // 更新缓存条目数量
    async updateCacheEntryCount() {
      try {
        // 调用后端获取缓存条目数量
        this.cacheEntryCount = await invoke('get_steam_cache_count');
      } catch (error) {
        console.error(this.t('settings.steamApi.getCacheCountFailed'), error);
        this.cacheEntryCount = 0;
      }
    },

    // 导航到Steam缓存页面
    navigateToSteamCache() {
      this.$router.push('/steam-cache');
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
  },
  beforeUnmount() {
    // 清理倒计时
    this.clearRestartCountdown();
  },
  async mounted() {
    // 应用保存的主题
    if (window.themeManager) {
      window.themeManager.setTheme(this.currentTheme);
    } else {
      document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    await this.initializeLanguage();

    // 添加点击外部关闭下拉框的事件监听
    document.addEventListener('click', this.handleClickOutside);

    // 监听开发者模式变化事件
    window.addEventListener('developer-mode-changed', this.handleDeveloperModeChanged);

    // 初始化GPU加速状态
    this.initializeGpuAccelerationStatus();

    // 初始化Steam API设置
    await this.initializeSteamApiSettings();

    // 检查更新
    if (updateService.canCheckUpdate && updateService.canCheckUpdate()) {
      try {
        await updateService.checkForUpdates();
        updateService.recordLastCheck && updateService.recordLastCheck();
      } catch (error) {
        console.error(this.t('settings.startupUpdateCheckFailed'), error);
      }
    }
  },
  beforeUnmount() {
    // 移除事件监听
    document.removeEventListener('click', this.handleClickOutside);
    window.removeEventListener('developer-mode-changed', this.handleDeveloperModeChanged);
  }
};
</script>

<style scoped>
/* 设置界面样式 */
.settings-container {
  height: 100%;
  padding: var(--space-8) var(--space-6);
  background-color: var(--bg-primary);
  overflow-y: auto;
  transition: background-color 0.25s ease;
}

.setting-group {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-card);
  margin-bottom: var(--space-6);
  overflow: hidden;
  /* 统一阴影效果 */
  box-shadow: var(--shadow-sm);
  /* 添加毛玻璃效果 */
  backdrop-filter: blur(20px);
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
}

.section-header {
  padding: var(--space-4) var(--space-5) var(--space-3);
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
  padding: var(--space-4) var(--space-5);
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
  margin-right: var(--space-3);
  color: var(--accent-color);
  transition: color 0.25s ease;
  /* 添加圆角背景 */
  border-radius: var(--radius-sm);
  background-color: rgba(0, 122, 255, 0.1);
}

.check-update-btn {
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease, background-color 0.25s ease, color 0.25s ease, transform 0.25s ease;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1-5);
  /* 添加微妙的阴影 */
  box-shadow: var(--shadow-sm);
}

.check-update-btn:hover:not(:disabled) {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  /* 增强悬停阴影 */
  box-shadow: var(--shadow-md);
}

.check-update-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.check-update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transition: opacity 0.25s ease;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked+.slider {
  background-color: var(--accent-color);
}

input:checked+.slider:before {
  transform: translateX(26px);
}

.version-info {
  text-align: center;
  padding: var(--space-10) var(--space-5);
  color: var(--text-tertiary);
  transition: color 0.25s ease;
}

.version-text {
  font-size: 15px;
  margin-bottom: var(--space-2);
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
    padding: var(--space-4) var(--space-4);
  }

  .setting-item {
    padding: var(--space-3) var(--space-4);
  }

  .setting-item:not(:last-child)::after {
    left: var(--space-4);
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
    padding: var(--space-3) var(--space-3);
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .setting-icon {
    margin-bottom: var(--space-2);
  }

  .setting-action {
    margin-left: 0;
    margin-top: var(--space-3);
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
  gap: var(--space-2);
  margin-left: auto;
}

.setting-action .custom-dropdown {
  min-width: 140px;
  width: 140px;
}

/* 更新消息样式 */
.update-message {
  position: fixed;
  top: 70px;
  /* 考虑标题栏高度 */
  right: var(--space-5);
  padding: 1rem 1.5rem;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-lg);
  z-index: 10000;
  /* 提高z-index确保在最上层 */
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 420px;
  min-width: 320px;
  backdrop-filter: blur(20px);
  background: var(--card-bg);
  color: var(--text);
  border: 1px solid var(--divider-color);
}

.update-message:hover {
  box-shadow: var(--shadow-xl);
}

.update-message svg,
.update-message span,
.update-message .update-btn,
.update-message .update-content,
.update-message .update-details h4 {
  color: var(--text);
}

.update-message.success {
  background: var(--card-bg);
  color: var(--text);
  border: 1px solid var(--success-color);
}

.update-message.error {
  background: var(--card-bg);
  color: var(--text);
  border: 1px solid var(--error-color);
}

.update-message.info {
  background: var(--card-bg);
  color: var(--text);
  border: 1px solid var(--info-color);
}

.update-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.update-btn {
  background: var(--primary-color);
  color: white;
  border: 1px solid var(--primary-color);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  flex: 1;
  text-align: center;
}

.update-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.update-btn:active:not(:disabled) {
  transform: translateY(0);
}

.update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.update-btn.secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--divider-color);
}

.update-btn.secondary:hover {
  background: var(--bg-tertiary);
}

.update-details {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--divider-color);
}

.update-details h4 {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
  opacity: 0.9;
}

.update-content {
  font-size: 0.75rem;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  color: var(--text);
}

.update-content :deep(p) {
  margin: 0.125rem 0;
  line-height: 1.3;
}

.update-content :deep(ul) {
  margin: 0.25rem 0;
  padding-left: 0.75rem;
}

.update-content :deep(li) {
  margin-bottom: 0.125rem;
  line-height: 1.2;
}

.update-content :deep(strong) {
  font-weight: 600;
}

.update-content :deep(h1),
.update-content :deep(h2),
.update-content :deep(h3) {
  font-weight: 600;
  margin: 0.25rem 0 0.125rem 0;
  color: var(--text);
}

.update-content :deep(h1) {
  font-size: 0.875rem;
  border-bottom: 1px solid var(--divider-color);
  padding-bottom: 0.25rem;
}

.update-content :deep(h2) {
  font-size: 0.825rem;
}

.update-content :deep(h3) {
  font-size: 0.8rem;
}

.update-content :deep(code) {
  background: var(--bg-tertiary);
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Lucida Console', monospace;
  font-size: 0.7rem;
  color: var(--text);
}

.update-content :deep(pre) {
  background: var(--bg-tertiary);
  padding: 0.4rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.25rem 0;
  font-family: 'Consolas', 'Monaco', 'Lucida Console', monospace;
  font-size: 0.7rem;
  line-height: 1.3;
  border: 1px solid var(--divider-color);
}

.update-content :deep(pre code) {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

.update-content :deep(a) {
  color: var(--accent-color);
  text-decoration: none;
}

.update-content :deep(a:hover) {
  text-decoration: underline;
}

/* 更新提示动画 - 简洁自然的滑动效果 */
.slide-enter-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

.slide-leave-active {
  transition: all 0.25s cubic-bezier(0.7, 0, 0.84, 0);
  will-change: transform, opacity;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(100%) translateY(-10px);
}

.slide-enter-to {
  opacity: 1;
  transform: translateX(0) translateY(0);
}

.slide-leave-from {
  opacity: 1;
  transform: translateX(0) translateY(0);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(100%) translateY(-5px);
}

/* 文字切换动画 - 简洁的淡入淡出 */
.text-swift-enter-active {
  transition: opacity 0.2s ease-out;
}

.text-swift-leave-active {
  transition: opacity 0.15s ease-in;
}

.text-swift-enter-from {
  opacity: 0;
}

.text-swift-enter-to {
  opacity: 1;
}

.text-swift-leave-from {
  opacity: 1;
}

.text-swift-leave-to {
  opacity: 0;
}

/* 展开动画 - 简洁的高度变化 */
.expand-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 300px;
  overflow: hidden;
  will-change: max-height, opacity;
}

.expand-leave-active {
  transition: all 0.25s ease-out;
  max-height: 300px;
  overflow: hidden;
  will-change: max-height, opacity;
}

.expand-enter-from {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to {
  opacity: 1;
  max-height: 300px;
}

.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}

.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

/* 更新检查中的动画 */
.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--text-tertiary);
  border-radius: 50%;
  border-top-color: var(--text);
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
  padding: var(--space-2) var(--space-3);
  font-size: 14px;
  border-radius: var(--radius-sm);
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
  margin-left: var(--space-1-5);
}

.setting-action .dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  width: 100%;
  background: var(--dropdown-bg);
  border: 1px solid var(--dropdown-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  z-index: 1001;
  backdrop-filter: blur(20px);
  cursor: default;
  min-width: 140px;
}

.setting-action .dropdown-option {
  padding: var(--space-2) var(--space-3);
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

/* 重启按钮样式 */
.restart-now-btn {
  background: var(--accent-color) !important;
  color: white !important;
  border: none !important;
}

.restart-now-btn:hover {
  background: var(--accent-color-hover) !important;
  filter: brightness(1.1);
}

.cancel-restart-btn {
  background: var(--bg-secondary) !important;
  color: var(--text-secondary) !important;
  border: 1px solid var(--border-color) !important;
}

.cancel-restart-btn:hover {
  background: var(--bg-tertiary) !important;
  color: var(--text-primary) !important;
}

/* Steam API 相关样式 */
.api-key-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.api-key-input-wrapper {
  display: flex;
  position: relative;
  gap: var(--space-2);
}

.api-key-input {
  flex: 1;
  padding: var(--space-2) 36px var(--space-2) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: var(--input-bg);
  color: var(--text);
  font-size: 14px;
  transition: all 0.2s ease;
  width: 100%;
  min-width: 0;
}

.api-key-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
}

.toggle-visibility-btn {
  position: absolute;
  right: calc(var(--space-2) + 55px);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-xs);
  transition: all 0.2s ease;
}

.toggle-visibility-btn:hover {
  color: var(--text-primary);
  background-color: var(--bg-tertiary);
}

.save-api-key-btn {
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  min-width: 44px;
  height: 40px;
  flex-shrink: 0;
}

.save-api-key-btn:hover {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
}

.cache-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding: var(--space-3);
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.cache-count {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
  padding: var(--space-1) var(--space-2);
  background: var(--bg-quaternary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.view-cache-btn,
.clear-cache-btn {
  background-color: var(--accent-color);
  color: white;
  border: 1px solid var(--accent-color);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 122, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.view-cache-btn::before,
.clear-cache-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.view-cache-btn:hover::before,
.clear-cache-btn:hover::before {
  left: 100%;
}

.view-cache-btn:hover,
.clear-cache-btn:hover {
  background-color: var(--accent-hover);
  border-color: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 122, 255, 0.25);
}

.clear-cache-btn {
  background-color: var(--error-color);
  border-color: var(--error-color);
  box-shadow: 0 2px 4px rgba(255, 59, 48, 0.15);
}

.clear-cache-btn::before {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.clear-cache-btn:hover {
  background-color: var(--error-hover, #e53e3e);
  border-color: var(--error-hover, #e53e3e);
  box-shadow: 0 4px 8px rgba(255, 59, 48, 0.25);
}
</style>