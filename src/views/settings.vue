<template>
  <div class="settings-container">
    <!-- 外观与语言设置组 -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">
          {{ t("settings.appearanceAndLanguage") }}
        </div>
      </transition>

      <!-- 主题设置 -->
      <div class="setting-item theme-setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'palette']" />
        </div>
        <div class="setting-details full-width">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.theme") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.themeDescription") }}
            </div>
          </transition>
          <!-- 主题选择器 -->
          <div class="theme-selector-wrapper">
            <ThemeSelector ref="themeSelectorRef" v-model="currentTheme"
              :show-seasonal-themes="shouldShowSeasonalThemes" :seasonal-theme-mode="seasonalThemeMode"
              @change="handleThemeChange" />
          </div>
        </div>
      </div>

      <!-- 语言设置 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'globe']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.language") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.languageDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <CustomDropdown v-model="currentLanguage" :options="languageOptions" @change="handleLanguageChange"
            @dropdown-open="handleDropdownOpen('language')" :is-open="activeDropdown === 'language'"
            :placeholder="t('common.select')" />
        </div>
      </div>
    </div>

    <!-- 自定义主题设置组 -->
    <div class="setting-group custom-theme-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">
          {{ t("theme.customThemes") }}
        </div>
      </transition>

      <div class="custom-theme-content">
        <ThemeList @create="handleCreateTheme" @edit="handleEditTheme" @delete="handleDeleteTheme"
          @select="handleSelectTheme" @import="handleImportTheme" @export="handleExportTheme" />
      </div>
    </div>

    <!-- 主题编辑模态框 -->
    <transition name="modal-fade">
      <div v-if="showThemeEditor" class="theme-editor-modal" @click.self="handleCancelThemeEdit">
        <div class="theme-editor-container">
          <div class="modal-header">
            <h2 class="modal-title">
              {{
                themeEditorMode === "create"
                  ? t("theme.createCustomTheme")
                  : t("theme.editTheme", {
                    name: editingTheme?.name || "",
                  })
              }}
            </h2>
            <button class="modal-close-btn" @click="handleCancelThemeEdit">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
          <ThemeEditor :theme="editingTheme" :mode="themeEditorMode" @save="handleSaveTheme"
            @cancel="handleCancelThemeEdit" />
        </div>
      </div>
    </transition>

    <!-- 高级设置组 -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">
          {{ t("settings.advancedSettings") }}
        </div>
      </transition>

      <!-- 禁用GPU加速开关 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'microchip']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.disableGpuAcceleration") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.disableGpuAccelerationDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="gpuAccelerationDisabled" @change="handleGpuAccelerationToggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- 自动反馈开关（所有用户可用） -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.autoFeedbackEnabled") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.autoFeedbackEnabledDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="autoFeedbackEnabled" @change="handleAutoFeedbackToggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- 系统与更新设置组 -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">
          {{ t("settings.systemAndUpdates") }}
        </div>
      </transition>

      <!-- 检查更新 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'download']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.checkUpdates") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.checkUpdatesDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <button class="check-update-btn" @click="checkForUpdates" :disabled="checkingUpdate">
            <font-awesome-icon v-if="checkingUpdate" :icon="['fas', 'spinner']" spin />
            <transition name="text-swift" mode="out-in">
              <span :key="currentLanguage + '-' + checkingUpdate">
                {{
                  checkingUpdate ? t("settings.checking") : t("settings.check")
                }}
              </span>
            </transition>
          </button>
        </div>
      </div>
    </div>

    <!-- Steam API 设置组 -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">
          {{ t("settings.steamApi.title") }}
        </div>
      </transition>

      <!-- API Key 设置 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'key']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.steamApi.apiKey") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.steamApi.apiKeyDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <div class="api-key-container">
            <div class="api-key-input-wrapper">
              <input v-model="steamApiKey" :type="showApiKey ? 'text' : 'password'" class="api-key-input"
                :placeholder="t('settings.steamApi.apiKeyPlaceholder')" />
              <button class="toggle-visibility-btn" @click="showApiKey = !showApiKey" :title="showApiKey
                ? t('settings.steamApi.hideApiKey')
                : t('settings.steamApi.showApiKey')
                ">
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
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.steamApi.cacheStatus") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.steamApi.cacheStatusDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <div class="cache-info">
            <transition name="text-swift" mode="out-in">
              <span class="cache-count" :key="currentLanguage + '-' + cacheEntryCount">{{ cacheEntryCount }}
                {{ t("settings.steamApi.cacheEntries") }}</span>
            </transition>
            <button class="view-cache-btn" @click="navigateToSteamCache">
              <font-awesome-icon :icon="['fas', 'eye']" />
              <transition name="text-swift" mode="out-in">
                <span :key="currentLanguage + '-viewCache'">{{
                  t("settings.steamApi.viewCache")
                }}</span>
              </transition>
            </button>
            <button class="clear-cache-btn" @click="clearSteamCache">
              <font-awesome-icon :icon="['fas', 'trash']" />
              <transition name="text-swift" mode="out-in">
                <span :key="currentLanguage + '-clearCache'">{{
                  t("settings.steamApi.clearCache")
                }}</span>
              </transition>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 开发者选项设置组 -->
    <div class="setting-group" v-if="developerOptionsEnabled">
      <transition name="text-swift" mode="out-in">
        <div class="section-header" :key="currentLanguage">
          {{ t("settings.developerOptions") }}
        </div>
      </transition>

      <!-- 开发者模式开关 -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'code']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.developerMode") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.developerModeDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="developerModeEnabled" @change="handleDeveloperModeToggle" />
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
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.enableLogging") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.enableLoggingDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="logMenuEnabled" @change="handleLogMenuToggle" />
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
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.performanceMonitor") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.performanceMonitorDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="performanceMonitorEnabled" @change="handlePerformanceMonitorToggle" />
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
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.testArchiveDisplay") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.testArchiveDisplayDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input type="checkbox" v-model="testArchiveEnabled" @change="handleTestArchiveToggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- 限时主题控制 -->
      <div class="setting-item" v-if="developerModeEnabled">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'snowflake']" style="color: #e53935" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.seasonalThemeControl") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.seasonalThemeControlDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <CustomDropdown v-model="seasonalThemeMode" :options="seasonalThemeModeOptions"
            @change="handleSeasonalThemeModeChange" @dropdown-open="handleDropdownOpen('seasonalTheme')"
            :is-open="activeDropdown === 'seasonalTheme'" :placeholder="t('common.select')" />
        </div>
      </div>

      <!-- 重置教程按钮 -->
      <div class="setting-item" v-if="developerModeEnabled">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'graduation-cap']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.resetTutorial") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div class="setting-description" :key="currentLanguage">
              {{ t("settings.resetTutorialDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <button class="reset-tutorial-btn" @click="handleResetTutorial">
            <font-awesome-icon :icon="['fas', 'redo']" />
            <transition name="text-swift" mode="out-in">
              <span :key="currentLanguage">{{
                t("settings.resetTutorialButton")
              }}</span>
            </transition>
          </button>
        </div>
      </div>

      <!-- 存档文件工具 -->
      <div class="setting-item sav-tools-section" v-if="developerModeEnabled">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'file-code']" />
        </div>
        <div class="setting-details full-width">
          <transition name="text-swift" mode="out-in">
            <div class="setting-title" :key="currentLanguage">
              {{ t("settings.savFileTools") }}
            </div>
          </transition>

          <div class="sav-tools-container">
            <!-- 解析存档文件 -->
            <div class="drop-zone" :class="{ 'drag-over': parseDragOver, processing: isParsing }"
              @dragover.prevent="parseDragOver = true" @dragleave.prevent="parseDragOver = false"
              @drop.prevent="handleParseDrop" @click="triggerParseFileInput">
              <div class="drop-zone-content">
                <font-awesome-icon :icon="isParsing ? ['fas', 'spinner'] : ['fas', 'file-import']
                  " :spin="isParsing" class="drop-icon" />
                <div class="drop-title">
                  {{
                    isParsing
                      ? t("settings.parsing")
                      : t("settings.parseSavFile")
                  }}
                </div>
              </div>
            </div>

            <!-- 打包存档文件 -->
            <div class="drop-zone" :class="{ 'drag-over': packDragOver, processing: isPacking }"
              @dragover.prevent="packDragOver = true" @dragleave.prevent="packDragOver = false"
              @drop.prevent="handlePackDrop" @click="triggerPackFileInput">
              <div class="drop-zone-content">
                <font-awesome-icon :icon="isPacking ? ['fas', 'spinner'] : ['fas', 'file-export']
                  " :spin="isPacking" class="drop-icon" />
                <div class="drop-title">
                  {{
                    isPacking
                      ? t("settings.packing")
                      : t("settings.packSavFile")
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 版本信息 -->
    <div class="version-info">
      <transition name="text-swift" mode="out-in">
        <div class="version-text" :key="currentLanguage">
          {{ t("settings.versionInfo", { version: appVersion }) }}
        </div>
      </transition>
      <transition name="text-swift" mode="out-in">
        <div class="version-detail" :key="currentLanguage">
          {{ t("settings.developedBy") }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { updateService, UpdateStatus } from "../services/updateService.js";
import CustomDropdown from "../components/CustomDropdown.vue";
import ThemeSelector from "../components/ThemeSelector.vue";
import ThemeList from "../components/ThemeList.vue";
import ThemeEditor from "../components/ThemeEditor.vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import themeManager from "../styles/theme-config.js";
import { themeStorage } from "../services/themeStorage.js";
import { getAllAvailableLanguages, getInstalledThemePlugins } from "../plugins";
import storage from "../services/storageService";
import { notify } from "../services/notificationService";
import { APP_VERSION } from "../config/version";
import {
  isNewYearPeriod as checkNewYearPeriod,
  isSpringFestivalPeriod as checkSpringFestivalPeriod,
  isSeasonalThemeAvailable as checkSeasonalThemeAvailable,
} from "../config/seasonalThemeConfig";

export default {
  name: "Settings",
  components: {
    CustomDropdown,
    ThemeSelector,
    ThemeList,
    ThemeEditor,
  },
  data() {
    return {
      currentTheme: storage.getItem("theme", "light"),
      currentLanguage: storage.getItem("language", "zh-CN"),
      performanceMonitorEnabled:
        storage.getItem("performanceMonitor", true) !== false, // 默认开启
      developerModeEnabled: storage.getItem("developerMode", false) === true, // 开发者模式状态
      developerOptionsEnabled: storage.getItem("developerMode", false) === true, // 开发者选项是否显示
      logMenuEnabled: storage.getItem("logMenuEnabled", false) === true, // 日志功能开关状态
      autoFeedbackEnabled:
        storage.getItem("autoFeedbackEnabled", true) !== false &&
        storage.getItem("autoFeedbackEnabled", true) !== "false", // 自动反馈开关状态，默认开启
      testArchiveEnabled: storage.getItem("testArchiveEnabled", true) !== false, // 测试存档显示开关状态，默认开启
      gpuAccelerationDisabled:
        storage.getItem("gpuAccelerationDisabled", false) === true, // GPU加速开关状态
      // Steam API 相关
      steamApiKey: "",
      showApiKey: false,
      cacheEntryCount: 0,
      checkingUpdate: false,
      appVersion: APP_VERSION,
      activeDropdown: null,
      updateInfo: null,
      updateStatus: UpdateStatus.IDLE,
      UpdateStatus: UpdateStatus, // 将UpdateStatus暴露给模板使用
      isProcessing: false,
      // 存档文件工具相关
      parseDragOver: false,
      packDragOver: false,
      isParsing: false,
      isPacking: false,
      // 限时主题控制
      seasonalThemeMode: storage.getItem("seasonalThemeMode", "auto"),
      // 自定义主题相关
      showThemeEditor: false,
      themeEditorMode: "create", // 'create' or 'edit'
      editingTheme: null,
      isImporting: false,
      isExporting: false,
    };
  },
  computed: {
    themeOptions() {
      const options = [
        { value: "light", label: this.$t("common.light") },
        { value: "dark", label: this.$t("common.dark") },
        { value: "ocean", label: this.$t("common.ocean") },
        { value: "forest", label: this.$t("common.forest") },
        { value: "sunset", label: this.$t("common.sunset") },
        { value: "lavender", label: this.$t("common.lavender") },
        { value: "rose", label: this.$t("common.rose") },
        { value: "mint", label: this.$t("common.mint") },
        { value: "peach", label: this.$t("common.peach") },
        { value: "sky", label: this.$t("common.sky") },
      ];
      // 根据限时主题模式和日期决定是否显示限时主题选项
      if (this.shouldShowSeasonalThemes) {
        // 元旦主题
        if (this.isNewYearPeriod() || this.seasonalThemeMode === "force") {
          options.push({ value: "new-year", label: this.$t("common.newYear") });
        }
        // 春节主题
        if (
          this.isSpringFestivalPeriod() ||
          this.seasonalThemeMode === "force"
        ) {
          options.push({
            value: "spring-festival-dark",
            label: this.$t("common.springFestivalDark"),
          });
          options.push({
            value: "spring-festival-light",
            label: this.$t("common.springFestivalLight"),
          });
        }
      }
      return options;
    },
    shouldShowSeasonalThemes() {
      // 检查开发者模式下的限时主题控制
      const mode = this.seasonalThemeMode;
      if (mode === "force") return true;
      if (mode === "hide") return false;
      // auto 模式：至少有一个限时主题在有效期内
      return this.isNewYearPeriod() || this.isSpringFestivalPeriod();
    },
    seasonalThemeModeOptions() {
      return [
        { value: "auto", label: this.$t("settings.seasonalThemeModeAuto") },
        { value: "force", label: this.$t("settings.seasonalThemeModeForce") },
        { value: "hide", label: this.$t("settings.seasonalThemeModeHide") },
      ];
    },
    languageOptions() {
      const languages = getAllAvailableLanguages();
      return languages.map((lang) => ({
        value: lang.locale,
        label: lang.name,
      }));
    },
  },
  setup() {
    const { t, locale } = useI18n({ useScope: "global" });
    return { t, locale };
  },
  methods: {
    formatUpdateNotes(body) {
      if (!body) return this.t("settings.noUpdateNotes");

      let html = body;

      // 处理代码块
      html = html.replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        '<pre><code class="language-$1">$2</code></pre>'
      );
      html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

      // 处理标题
      html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
      html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
      html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

      // 处理列表
      html = html.replace(/^\* (.*$)/gm, "<li>$1</li>");
      html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
      html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

      // 处理粗体和斜体
      html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
      html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
      html = html.replace(/_(.*?)_/g, "<em>$1</em>");

      // 处理链接 [text](url)
      html = html.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      // 处理换行
      html = html.replace(/\n\n/g, "</p><p>");
      html = html.replace(/\n/g, "<br>");

      // 包装段落
      if (
        !html.includes("<h") &&
        !html.includes("<pre") &&
        !html.includes("<ul")
      ) {
        html = "<p>" + html + "</p>";
      }

      return html;
    },

    handleDropdownOpen(dropdown) {
      this.activeDropdown = this.activeDropdown === dropdown ? null : dropdown;
    },

    handleThemeChange(option) {
      const theme = option.value;
      const previousTheme = this.currentTheme;

      // 如果选择元旦主题，记录之前的非元旦主题以便恢复
      if (theme === "new-year") {
        // 只有当之前不是元旦主题时才记录
        if (previousTheme && previousTheme !== "new-year") {
          storage.setItem("themeBeforeNewYear", previousTheme);
        }
      } else {
        // 如果选择的是非元旦主题，也更新 themeBeforeNewYear
        // 这样即使用户直接从元旦切换到深色，下次恢复也是深色
        storage.setItem("themeBeforeNewYear", theme);
      }

      // 更新当前主题
      this.currentTheme = theme;
      storage.setItem("theme", theme);

      if (window.themeManager) {
        window.themeManager.setTheme(theme);
      } else {
        document.documentElement.setAttribute("data-theme", theme);
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

      // 主题背景色映射
      const themeBackgrounds = {
        dark: {
          bg: "#0d0d0f",
          bgPrimary: "#0d0d0f",
          bgSecondary: "#161618",
        },
        "new-year": {
          bg: "#1a0a0a",
          bgPrimary: "#1a0a0a",
          bgSecondary: "rgba(45, 21, 21, 0.95)",
        },
        "spring-festival-dark": {
          bg: "#1c0a14",
          bgPrimary: "#1c0a14",
          bgSecondary: "rgba(45, 16, 32, 0.95)",
        },
        "spring-festival-light": {
          bg: "#fefce8",
          bgPrimary: "#fefce8",
          bgSecondary: "rgba(255, 255, 255, 0.95)",
        },
        ocean: {
          bg: "#0c1929",
          bgPrimary: "#0c1929",
          bgSecondary: "#132337",
        },
        forest: {
          bg: "#0f1a14",
          bgPrimary: "#0f1a14",
          bgSecondary: "#162920",
        },
        sunset: {
          bg: "#1a1210",
          bgPrimary: "#1a1210",
          bgSecondary: "#261a16",
        },
        lavender: {
          bg: "#14101a",
          bgPrimary: "#14101a",
          bgSecondary: "#1e1826",
        },
        rose: {
          bg: "#1a1215",
          bgPrimary: "#1a1215",
          bgSecondary: "#261a1f",
        },
        mint: {
          bg: "#f0fdf4",
          bgPrimary: "#f0fdf4",
          bgSecondary: "#ffffff",
        },
        peach: {
          bg: "#fff5f5",
          bgPrimary: "#fff5f5",
          bgSecondary: "#ffffff",
        },
        sky: {
          bg: "#f0f9ff",
          bgPrimary: "#f0f9ff",
          bgSecondary: "#ffffff",
        },
        light: {
          bg: "#f8f8fa",
          bgPrimary: "#f8f8fa",
          bgSecondary: "#ffffff",
        },
      };

      let colors = themeBackgrounds[theme];

      // 如果是插件主题，从插件数据中获取颜色
      if (!colors) {
        const themePlugins = getInstalledThemePlugins();
        const pluginTheme = themePlugins.find((p) => p.themeId === theme);

        if (pluginTheme && pluginTheme.data && pluginTheme.data.variables) {
          const vars = pluginTheme.data.variables;
          colors = {
            bg: vars["--bg"] || vars["--bg-primary"] || "#0a0a0f",
            bgPrimary: vars["--bg-primary"] || vars["--bg"] || "#0a0a0f",
            bgSecondary: vars["--bg-secondary"] || "#12121a",
          };
        } else {
          // 最后回退
          colors = themeBackgrounds.light;
        }
      }

      root.style.setProperty("--bg", colors.bg);
      root.style.setProperty("--bg-primary", colors.bgPrimary);
      root.style.setProperty("--bg-secondary", colors.bgSecondary);
      if (body) {
        body.style.backgroundColor = colors.bg;
        body.style.setProperty("--bg", colors.bg);
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
        }
        storage.setItem("language", lang);

        // 触发自定义事件通知其他组件
        window.dispatchEvent(
          new CustomEvent("language-changed", { detail: { lang } })
        );

        // 更新窗口标题为语言文件中的 app.name
        await this.updateWindowTitle();
      } catch (error) {
        console.error(this.t("settings.languageSwitchFailed"), error);
      }
    },

    async updateWindowTitle() {
      try {
        // 获取当前语言文件中的应用名称
        const appName = this.t("app.name");

        // 调用后端设置窗口标题
        await invoke("set_window_title", { title: appName });

        console.log("窗口标题已更新为:", appName);
      } catch (error) {
        console.error("更新窗口标题失败:", error);
        // 不抛出错误，语言切换不应该因为标题更新失败而失败
      }
    },

    async checkForUpdates() {
      if (this.isProcessing) return;

      this.isProcessing = true;
      this.checkingUpdate = true;
      this.updateStatus = UpdateStatus.CHECKING;

      try {
        const update = await updateService.checkForUpdates();

        if (update.shouldUpdate) {
          this.updateInfo = update;
          this.updateStatus = UpdateStatus.AVAILABLE;

          // 使用新通知系统，带按钮
          notify.info(this.t("settings.newVersionAvailable", { version: update.version }), {
            title: this.t("settings.updateAvailable"),
            icon: ["fas", "download"],
            details: update.releaseNotes ? { description: update.releaseNotes.substring(0, 100) + '...' } : null,
            actions: [
              {
                text: this.t("settings.goToDownload"),
                type: 'primary',
                icon: ["fas", "external-link-alt"],
                onClick: () => this.downloadAndInstall()
              },
              {
                text: this.t("common.later"),
                type: 'secondary'
              }
            ]
          });
        } else {
          this.updateStatus = UpdateStatus.NOT_AVAILABLE;
          notify.success(this.$t("settings.latestVersion"));
        }
      } catch (error) {
        this.updateStatus = UpdateStatus.ERROR;

        let errorText = this.$t("settings.updateFailed");
        if (error.message?.includes("rate limit") || error.message?.includes("429")) {
          errorText = this.$t("settings.rateLimitError");
        } else if (error.type === this.t("settings.errorType.networkConnection")) {
          errorText = this.$t("settings.networkError");
        } else if (error.type === this.t("settings.errorType.resourceNotFound")) {
          errorText = this.$t("settings.resourceNotFound");
        } else if (error.type === this.t("settings.errorType.accessDenied")) {
          errorText = this.$t("settings.accessDenied");
        }

        notify.error(errorText, { duration: 8000 });
      } finally {
        this.checkingUpdate = false;
        this.isProcessing = false;
      }
    },
    handlePerformanceMonitorToggle() {
      storage.setItem("performanceMonitor", this.performanceMonitorEnabled);
      // 触发自定义事件通知App.vue更新状态
      window.dispatchEvent(
        new CustomEvent("performance-monitor-toggle", {
          detail: { enabled: this.performanceMonitorEnabled },
        })
      );
    },

    handleDeveloperModeToggle() {
      storage.setItem("developerMode", this.developerModeEnabled);
      this.developerOptionsEnabled = this.developerModeEnabled;

      // 触发自定义事件通知其他组件
      window.dispatchEvent(
        new CustomEvent("developer-mode-changed", {
          detail: { enabled: this.developerModeEnabled },
        })
      );

      // 如果关闭开发者模式，同时关闭所有相关设置
      if (!this.developerModeEnabled) {
        // 关闭日志功能
        this.logMenuEnabled = false;
        storage.setItem("logMenuEnabled", "false");
        window.dispatchEvent(
          new CustomEvent("log-menu-toggle", {
            detail: { enabled: false },
          })
        );

        // 关闭性能监控
        this.performanceMonitorEnabled = false;
        storage.setItem("performanceMonitor", "false");

        // 关闭测试存档显示
        this.testArchiveEnabled = false;
        storage.setItem("testArchiveEnabled", "false");
        window.dispatchEvent(
          new CustomEvent("test-archive-toggle", {
            detail: { enabled: false },
          })
        );
      }
    },

    handleLogMenuToggle() {
      storage.setItem("logMenuEnabled", this.logMenuEnabled);
      // 触发自定义事件通知其他组件
      window.dispatchEvent(
        new CustomEvent("log-menu-toggle", {
          detail: { enabled: this.logMenuEnabled },
        })
      );
    },

    handleAutoFeedbackToggle() {
      storage.setItem("autoFeedbackEnabled", this.autoFeedbackEnabled);
      window.dispatchEvent(
        new CustomEvent("auto-feedback-toggle", {
          detail: { enabled: this.autoFeedbackEnabled },
        })
      );
    },

    handleTestArchiveToggle() {
      storage.setItem("testArchiveEnabled", this.testArchiveEnabled);
      // 触发自定义事件通知侧边栏更新状态
      window.dispatchEvent(
        new CustomEvent("test-archive-toggle", {
          detail: { enabled: this.testArchiveEnabled },
        })
      );
    },

    // 检查当前日期是否在元旦期间 (12.31 - 1.4)
    isNewYearPeriod() {
      return checkNewYearPeriod();
    },

    // 检查当前日期是否在春节期间（日期从 seasonalThemeConfig 读取）
    isSpringFestivalPeriod() {
      return checkSpringFestivalPeriod();
    },

    // 检查主题是否是限时主题
    isSeasonalTheme(themeId) {
      return [
        "new-year",
        "spring-festival-dark",
        "spring-festival-light",
      ].includes(themeId);
    },

    // 检查限时主题当前是否可用
    isSeasonalThemeAvailable(themeId) {
      return checkSeasonalThemeAvailable(themeId, {
        mode: this.seasonalThemeMode,
      });
    },

    handleSeasonalThemeModeChange(option) {
      const mode = option.value;
      this.seasonalThemeMode = mode;
      storage.setItem("seasonalThemeMode", mode);

      // 如果当前主题是限时主题但被隐藏了，恢复之前的主题
      if (mode === "hide" && this.isSeasonalTheme(this.currentTheme)) {
        const themeBeforeSeasonal =
          storage.getItem("themeBeforeNewYear") || "light";
        this.currentTheme = themeBeforeSeasonal;
        storage.setItem("theme", themeBeforeSeasonal);
        if (window.themeManager) {
          window.themeManager.setTheme(themeBeforeSeasonal);
        } else {
          document.documentElement.setAttribute(
            "data-theme",
            themeBeforeSeasonal
          );
        }
        this.forceThemeBackgroundUpdate(themeBeforeSeasonal);
      }

      // 如果切换到自动模式且当前是限时主题但不在有效期内，也要恢复
      if (
        mode === "auto" &&
        this.isSeasonalTheme(this.currentTheme) &&
        !this.isSeasonalThemeAvailable(this.currentTheme)
      ) {
        const themeBeforeSeasonal =
          storage.getItem("themeBeforeNewYear") || "light";
        this.currentTheme = themeBeforeSeasonal;
        storage.setItem("theme", themeBeforeSeasonal);
        if (window.themeManager) {
          window.themeManager.setTheme(themeBeforeSeasonal);
        } else {
          document.documentElement.setAttribute(
            "data-theme",
            themeBeforeSeasonal
          );
        }
        this.forceThemeBackgroundUpdate(themeBeforeSeasonal);
      }

      // 关闭下拉框
      this.activeDropdown = null;

      // 显示提示
      notify.success(this.t("settings.seasonalThemeModeChanged"));
    },

    handleResetTutorial() {
      // 清除快速创建教程完成标记
      storage.removeItem("quick_create_tutorial_completed");

      // 显示成功提示
      notify.success(this.t("settings.tutorialReset"));
    },

    // ========== 存档文件工具方法 ==========
    triggerParseFileInput() {
      if (!this.isParsing) {
        this.parseSavFile();
      }
    },

    triggerPackFileInput() {
      if (!this.isPacking) {
        this.packJsonFile();
      }
    },

    handleParseDrop(event) {
      this.parseDragOver = false;
      // 拖拽也触发文件选择对话框
      this.parseSavFile();
    },

    handlePackDrop(event) {
      this.packDragOver = false;
      // 拖拽也触发文件选择对话框
      this.packJsonFile();
    },

    handleParseFileSelect(event) {
      // 不再使用，改用 Tauri 对话框
      event.target.value = "";
    },

    handlePackFileSelect(event) {
      // 不再使用，改用 Tauri 对话框
      event.target.value = "";
    },

    async parseSavFile() {
      this.isParsing = true;

      try {
        // 使用 Tauri 对话框选择文件获取完整路径
        const { open } = await import("@tauri-apps/plugin-dialog");
        const filePath = await open({
          multiple: false,
          filters: [{ name: "Save Files", extensions: ["sav"] }],
        });

        if (!filePath) {
          this.isParsing = false;
          return;
        }

        // 调用后端解析存档文件
        const result = await invoke("convert_sav_to_json", {
          filePath: filePath,
        });

        if (result.success && result.json) {
          // 生成输出文件名（同名 .json）
          const fileName = filePath.split("\\").pop().split("/").pop();
          const outputFileName = fileName.replace(/\.sav$/i, ".json");
          const outputDir = filePath.substring(
            0,
            Math.max(filePath.lastIndexOf("\\"), filePath.lastIndexOf("/"))
          );
          const outputPath = `${outputDir}/${outputFileName}`.replace(
            /\//g,
            "\\"
          );

          // 使用 Tauri fs 插件写入文件
          const { writeTextFile } = await import("@tauri-apps/plugin-fs");
          await writeTextFile(outputPath, result.json);

          notify.success(this.t("settings.parseSuccess", { filename: outputFileName }));
        } else {
          throw new Error("解析结果无效");
        }
      } catch (error) {
        console.error("解析存档文件失败:", error);
        notify.error(this.t("settings.parseError", { error: error.toString() }));
      } finally {
        this.isParsing = false;
      }
    },

    async packJsonFile() {
      this.isPacking = true;

      try {
        // 使用 Tauri 对话框选择文件获取完整路径
        const { open } = await import("@tauri-apps/plugin-dialog");
        const filePath = await open({
          multiple: false,
          filters: [{ name: "JSON Files", extensions: ["json"] }],
        });

        if (!filePath) {
          this.isPacking = false;
          return;
        }

        // 读取 JSON 文件内容
        const { readTextFile } = await import("@tauri-apps/plugin-fs");
        const jsonContent = await readTextFile(filePath);

        // 生成输出文件名（同名-edited.sav）
        const fileName = filePath.split("\\").pop().split("/").pop();
        const baseName = fileName.replace(/\.json$/i, "");
        const outputFileName = `${baseName}-edited.sav`;
        const outputDir = filePath.substring(
          0,
          Math.max(filePath.lastIndexOf("\\"), filePath.lastIndexOf("/"))
        );
        const outputPath = `${outputDir}/${outputFileName}`.replace(
          /\//g,
          "\\"
        );

        // 调用后端打包存档文件
        const result = await invoke("convert_json_to_sav", {
          jsonContent: jsonContent,
          outputPath: outputPath,
        });

        if (result.success) {
          notify.success(this.t("settings.packSuccess", { filename: outputFileName }));
        } else {
          throw new Error(result.message || "打包失败");
        }
      } catch (error) {
        console.error("打包存档文件失败:", error);
        notify.error(this.t("settings.packError", { error: error.toString() }));
      } finally {
        this.isPacking = false;
      }
    },

    async handleGpuAccelerationToggle() {
      try {
        // 调用Tauri命令设置GPU加速状态
        await invoke("set_gpu_acceleration", {
          disabled: this.gpuAccelerationDisabled,
        });

        // 保存状态到localStorage
        storage.setItem(
          "gpuAccelerationDisabled",
          this.gpuAccelerationDisabled.toString()
        );

        // 显示提示信息，告知用户需要手动重启应用
        const message = this.gpuAccelerationDisabled
          ? this.t("settings.gpuAccelerationDisabled")
          : this.t("settings.gpuAccelerationEnabled");

        notify.info(message, { duration: 5000 });
      } catch (error) {
        console.error(this.t("settings.gpuAccelerationChangeFailed"), error);
        // 恢复开关状态
        this.gpuAccelerationDisabled = !this.gpuAccelerationDisabled;
        storage.setItem(
          "gpuAccelerationDisabled",
          this.gpuAccelerationDisabled.toString()
        );

        // 显示错误提示
        notify.error(this.t("settings.gpuAccelerationChangeFailed") + ": " + error);
      }
    },

    async downloadAndInstall() {
      if (!this.updateInfo || this.isProcessing) return;

      this.isProcessing = true;

      try {
        this.updateStatus = UpdateStatus.AVAILABLE;
        notify.info(this.t("settings.openingDownloadPage"));

        await updateService.downloadAndInstall();

        // 成功打开下载页面
        notify.success(this.t("settings.downloadPageOpened"));
      } catch (error) {
        console.error(this.t("settings.openDownloadPageFailed"), error);
        this.updateStatus = UpdateStatus.ERROR;
        notify.error(this.t("settings.openDownloadPageFailed"));
      } finally {
        this.isProcessing = false;
      }
    },

    async initializeLanguage() {
      try {
        const savedLanguage = storage.getItem("language") || "zh-CN";
        this.currentLanguage = savedLanguage;
        // 使用全局 i18n 实例设置语言
        if (this.$i18n) {
          this.$i18n.locale = savedLanguage;
        }
      } catch (error) {
        console.error(this.t("settings.languageInitFailed"), error);
        this.currentLanguage = "zh-CN";
      }
    },

    // 处理点击外部区域关闭下拉框
    handleClickOutside(event) {
      const dropdownContainers = document.querySelectorAll(".setting-action");
      let clickedInsideDropdown = false;

      dropdownContainers.forEach((container) => {
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
        storage.setItem("logMenuEnabled", "false");
        window.dispatchEvent(
          new CustomEvent("log-menu-toggle", {
            detail: { enabled: false },
          })
        );

        // 关闭性能监控
        this.performanceMonitorEnabled = false;
        storage.setItem("performanceMonitor", "false");

        // 关闭测试存档显示
        this.testArchiveEnabled = false;
        storage.setItem("testArchiveEnabled", "false");
        window.dispatchEvent(
          new CustomEvent("test-archive-toggle", {
            detail: { enabled: false },
          })
        );
      }
    },

    // 初始化GPU加速状态
    async initializeGpuAccelerationStatus() {
      try {
        // 从localStorage获取状态
        const localStorageState =
          storage.getItem("gpuAccelerationDisabled") === "true";

        // 尝试从Tauri后端获取状态
        try {
          const backendState = await invoke("get_gpu_acceleration_status");
          // 如果后端状态与localStorage不同，以后端状态为准
          if (backendState !== localStorageState) {
            this.gpuAccelerationDisabled = backendState;
            storage.setItem("gpuAccelerationDisabled", backendState.toString());
          }
        } catch (error) {
          console.warn(this.t("settings.gpuStatusFetchFailed"), error);
          // 使用localStorage状态
          this.gpuAccelerationDisabled = localStorageState;
        }
      } catch (error) {
        console.error(this.t("settings.gpuStatusInitFailed"), error);
        // 默认启用GPU加速
        this.gpuAccelerationDisabled = false;
      }
    },

    // 初始化Steam API设置
    async initializeSteamApiSettings() {
      try {
        // 获取加密存储的API密钥
        const encryptedApiKey = storage.getItem("steamApiKey");
        if (encryptedApiKey) {
          try {
            // 调用后端解密API密钥
            this.steamApiKey = await invoke("decrypt_steam_api_key", {
              encryptedKey: encryptedApiKey,
            });
          } catch (error) {
            console.error(this.t("settings.steamApi.decryptKeyFailed"), error);
            // 如果解密失败，清除存储的密钥
            storage.removeItem("steamApiKey");
          }
        }

        // 获取缓存条目数量
        this.updateCacheEntryCount();
      } catch (error) {
        console.error(this.t("settings.steamApi.initFailed"), error);
      }
    },

    // 保存Steam API密钥
    async saveSteamApiKey() {
      if (!this.steamApiKey.trim()) {
        notify.error(this.t("settings.steamApi.apiKeyPlaceholder"));
        return;
      }

      try {
        // 显示测试中提示
        notify.info(this.t("settings.steamApi.validatingKey"));

        // 生成一个随机的Steam ID用于测试
        const testSteamId = this.generateRandomSteamId();
        console.log(
          this.t("settings.steamApi.testSteamId"),
          testSteamId,
          this.t("settings.steamApi.idLength"),
          testSteamId.length
        );

        // 测试API密钥是否有效
        let apiTestPassed = false;
        try {
          console.log(this.t("settings.steamApi.startKeyTest"));
          // 直接使用用户输入的API密钥进行测试，而不是从配置文件读取
          const result = await invoke("test_steam_api_key", {
            apiKey: this.steamApiKey,
            steamId: testSteamId,
          });
          console.log(this.t("settings.steamApi.apiCallSuccess"), result);
          // 如果成功，说明API密钥有效
          apiTestPassed = true;
        } catch (error) {
          const errorMsg = error.toString();
          console.log(this.t("settings.steamApi.apiCallFailed"), errorMsg);

          // 如果是403错误，说明API密钥无效
          if (errorMsg.includes("403") || errorMsg.includes("Forbidden")) {
            console.log(this.t("settings.steamApi.detected403Error"));
            notify.error(this.t("settings.steamApi.keyInvalid"));
            return; // 直接返回，不保存密钥
          }

          // 如果是Steam ID格式错误，说明我们生成的ID有问题，但这不是API密钥的问题
          if (
            errorMsg.includes(
              this.t("settings.steamApi.error.invalidSteamIdFormat")
            ) ||
            errorMsg.includes("Invalid Steam ID format")
          ) {
            console.log(this.t("settings.steamApi.detectedSteamIdFormatError"));
            // 这是我们生成ID的问题，不是API密钥的问题，可以继续保存
            apiTestPassed = true;
          }
          // 如果是Steam API返回的错误，说明API密钥有效，只是我们生成的ID不存在
          else if (
            errorMsg.includes(this.t("settings.steamApi.error.steamApiError"))
          ) {
            console.log(this.t("settings.steamApi.detectedSteamApiError"));
            apiTestPassed = true;
          }
          // 其他错误可能是网络问题，可以继续保存
          else {
            console.warn(this.t("settings.steamApi.otherError"), error);
            apiTestPassed = true;
          }
        }

        // 只有API测试通过时才保存密钥
        if (!apiTestPassed) {
          console.log(this.t("settings.steamApi.apiTestFailed"));
          notify.error(this.t("settings.steamApi.keyTestFailed"));
          return;
        }

        console.log(this.t("settings.steamApi.keyValidationPassed"));
        // 调用后端保存API密钥到配置文件
        await invoke("save_steam_api_key", { apiKey: this.steamApiKey });
        console.log(this.t("settings.steamApi.keySavedToConfig"));

        // 同时保存到localStorage以保持兼容性
        const encryptedApiKey = await invoke("encrypt_steam_api_key", {
          apiKey: this.steamApiKey,
        });
        storage.setItem("steamApiKey", encryptedApiKey);
        console.log(this.t("settings.steamApi.keySavedToLocalStorage"));

        // 显示成功提示
        notify.success(this.t("settings.steamApi.keySaved"));
      } catch (error) {
        console.error(this.t("settings.steamApi.saveKeyFailed"), error);
        notify.error(this.t("settings.steamApi.saveKeyFailed") + ": " + error);
      }
    },

    // 生成随机Steam ID用于测试
    generateRandomSteamId() {
      // Steam ID格式通常是7656119XXXXXXXXX (17位数字)
      // 7656119是Steam ID的前缀，后面需要10位数字才能达到17位
      const prefix = "7656119";
      const randomSuffix = Math.floor(Math.random() * 10000000000)
        .toString()
        .padStart(10, "0");
      return prefix + randomSuffix;
    },

    // 清空Steam缓存
    async clearSteamCache() {
      try {
        // 调用后端清空缓存
        await invoke("clear_steam_cache");

        // 更新缓存条目数量
        this.updateCacheEntryCount();

        // 显示成功提示
        notify.success(this.t("settings.steamApi.cacheCleared"));
      } catch (error) {
        console.error(this.t("settings.steamApi.clearCacheFailed"), error);
        notify.error(this.t("settings.steamApi.clearCacheFailed") + ": " + error);
      }
    },

    // 更新缓存条目数量
    async updateCacheEntryCount() {
      try {
        // 调用后端获取缓存条目数量
        this.cacheEntryCount = await invoke("get_steam_cache_count");
      } catch (error) {
        console.error(this.t("settings.steamApi.getCacheCountFailed"), error);
        this.cacheEntryCount = 0;
      }
    },

    // 导航到Steam缓存页面
    navigateToSteamCache() {
      this.$router.push("/steam-cache");
    },

    // 格式化日期
    formatDate(timestamp) {
      if (!timestamp) return this.t("common.unknown");
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    },

    // Steam ID脱敏处理
    maskSteamId(steamId) {
      if (!steamId) return "";
      // Steam ID格式通常是7656119XXXXXXXXX (17位数字)
      if (steamId.length >= 8) {
        const start = steamId.substring(0, 4);
        const end = steamId.substring(steamId.length - 4);
        const middle = "*".repeat(steamId.length - 8);
        return start + middle + end;
      }
      // 如果长度不足8位，只显示前两位
      return steamId.substring(0, 2) + "*".repeat(steamId.length - 2);
    },

    // ========== 自定义主题方法 ==========

    // 打开创建主题编辑器 - 导航到主题编辑器页面
    handleCreateTheme() {
      this.$router.push("/theme-editor");
    },

    // 打开编辑主题编辑器 - 导航到主题编辑器页面（带主题ID）
    handleEditTheme(theme) {
      this.$router.push(`/theme-editor/${theme.id}`);
    },

    // 处理主题删除
    handleDeleteTheme(theme) {
      // ThemeList 组件已处理删除逻辑，这里可以添加额外的提示
      notify.success(this.t("theme.themeDeleted", { name: theme.name }));
    },

    // 处理主题选择
    handleSelectTheme(themeId) {
      // 更新当前主题状态
      this.currentTheme = themeId;
      storage.setItem("theme", themeId);
    },

    // 处理主题导入
    async handleImportTheme() {
      if (this.isImporting) return;

      this.isImporting = true;

      try {
        const result = await themeStorage.importTheme();

        if (result.success && result.theme) {
          // 保存导入的主题
          const saveResult = await themeManager.addCustomTheme(result.theme);

          if (saveResult.success) {
            notify.success(this.t("theme.importSuccess", { name: result.theme.name }));
          } else {
            throw new Error(saveResult.error || this.t("theme.importFailed"));
          }
        } else if (result.error) {
          throw new Error(result.error);
        }
        // 如果 result.success 为 false 且没有 error，说明用户取消了对话框
      } catch (error) {
        console.error("Failed to import theme:", error);
        notify.error(this.t("theme.importFailed") + ": " + (error.message || error));
      } finally {
        this.isImporting = false;
      }
    },

    // 处理主题导出
    async handleExportTheme(theme) {
      if (this.isExporting) return;

      this.isExporting = true;

      try {
        const exportPath = await themeStorage.exportTheme(theme.id);

        if (exportPath) {
          notify.success(this.t("theme.exportSuccess", { name: theme.name }));
        }
        // 如果 exportPath 为 null，说明用户取消了对话框
      } catch (error) {
        console.error("Failed to export theme:", error);
        notify.error(this.t("theme.exportFailed") + ": " + (error.message || error));
      } finally {
        this.isExporting = false;
      }
    },

    // 保存主题（创建或更新）
    async handleSaveTheme(themeData) {
      try {
        const result = await themeManager.addCustomTheme(themeData);

        if (result.success) {
          this.showThemeEditor = false;
          this.editingTheme = null;

          // 应用新保存的主题
          await themeManager.setTheme(themeData.id);
          this.currentTheme = themeData.id;

          notify.success(this.t("theme.themeSaved", { name: themeData.name }));
        } else {
          throw new Error(result.error || this.t("theme.saveFailed"));
        }
      } catch (error) {
        console.error("Failed to save theme:", error);
        notify.error(this.t("theme.saveFailed") + ": " + (error.message || error));
      }
    },

    // 取消主题编辑
    handleCancelThemeEdit() {
      // 取消预览
      themeManager.cancelPreview();
      this.showThemeEditor = false;
      this.editingTheme = null;
    },
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
      document.documentElement.setAttribute("data-theme", this.currentTheme);
    }

    await this.initializeLanguage();

    // 添加点击外部关闭下拉框的事件监听
    document.addEventListener("click", this.handleClickOutside);

    // 监听开发者模式变化事件
    window.addEventListener(
      "developer-mode-changed",
      this.handleDeveloperModeChanged
    );

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
        console.error(this.t("settings.startupUpdateCheckFailed"), error);
      }
    }
  },
  beforeUnmount() {
    // 移除事件监听
    document.removeEventListener("click", this.handleClickOutside);
    window.removeEventListener(
      "developer-mode-changed",
      this.handleDeveloperModeChanged
    );
  },
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
  position: relative;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.setting-item.theme-setting-item {
  flex-direction: column;
  align-items: flex-start;
  overflow: visible;
  /* 确保滚动按钮不被裁剪 */
}

.setting-item.theme-setting-item .setting-icon {
  position: absolute;
  top: var(--space-4);
  left: var(--space-5);
}

.setting-item.theme-setting-item .setting-details {
  padding-left: 52px;
  overflow: visible;
  /* 确保滚动按钮不被裁剪 */
}

.setting-details.full-width {
  width: 100%;
  overflow: visible;
  /* 确保滚动按钮不被裁剪 */
}

.theme-selector-wrapper {
  margin-top: var(--space-3);
  padding-left: 0;
  margin-left: -52px;
  width: calc(100% + 52px);
  overflow: visible;
  /* 确保滚动按钮不被裁剪 */
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
  transition: all 0.2s ease, background-color 0.25s ease, color 0.25s ease,
    transform 0.25s ease;
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

  .update-source-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(255, 193, 7, 0.1);
    border-left: 3px solid #ffc107;
    border-radius: 4px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .update-source-hint svg {
    color: #ffc107;
    font-size: 14px;
    flex-shrink: 0;
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
  font-family: "Consolas", "Monaco", "Lucida Console", monospace;
  font-size: 0.7rem;
  color: var(--text);
}

.update-content :deep(pre) {
  background: var(--bg-tertiary);
  padding: 0.4rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.25rem 0;
  font-family: "Consolas", "Monaco", "Lucida Console", monospace;
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
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent);
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
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent);
}

.clear-cache-btn:hover {
  background-color: var(--error-hover, #e53e3e);
  border-color: var(--error-hover, #e53e3e);
  box-shadow: 0 4px 8px rgba(255, 59, 48, 0.25);
}

/* 重置教程按钮 */
.reset-tutorial-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-warning);
  color: white;
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
  position: relative;
  overflow: hidden;
}

.reset-tutorial-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent);
  transition: left 0.5s ease;
}

.reset-tutorial-btn:hover::before {
  left: 100%;
}

.reset-tutorial-btn:hover {
  background-color: var(--color-warning-hover, #e58600);
  border-color: var(--color-warning-hover, #e58600);
  box-shadow: 0 4px 8px rgba(255, 149, 0, 0.25);
  transform: translateY(-1px);
}

/* 存档文件工具样式 */
.sav-tools-section {
  flex-direction: column;
  align-items: flex-start;
}

.sav-tools-section .setting-details.full-width {
  width: 100%;
  margin-right: 0;
}

.sav-tools-container {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.drop-zone {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  border: 1.5px dashed var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 180px;
}

.drop-zone:hover {
  border-color: var(--accent-color);
  background-color: rgba(0, 122, 255, 0.05);
}

.drop-zone.drag-over {
  border-color: var(--accent-color);
  background-color: rgba(0, 122, 255, 0.1);
  border-style: solid;
}

.drop-zone.processing {
  pointer-events: none;
  opacity: 0.7;
  border-color: var(--accent-color);
}

.drop-zone-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.drop-icon {
  font-size: 18px;
  color: var(--accent-color);
}

.drop-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.drop-description,
.drop-hint,
.drop-sub-hint {
  display: none;
}

@media (max-width: 480px) {
  .sav-tools-container {
    flex-direction: column;
  }

  .drop-zone {
    min-width: auto;
    width: 100%;
  }
}

/* 元旦主题限时提示样式 */
.setting-hint {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.setting-hint.new-year-hint {
  color: #e53935;
  background: linear-gradient(90deg, rgba(229, 57, 53, 0.1), transparent);
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 6px;
}

.setting-hint.new-year-hint svg {
  font-size: 10px;
}

/* ========== 自定义主题样式 ========== */

/* 自定义主题设置组 */
.custom-theme-group {
  overflow: visible;
  display: none;
}

.custom-theme-content {
  padding: var(--space-4) var(--space-5);
}

/* 主题编辑模态框 */
.theme-editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: var(--space-4);
}

.theme-editor-container {
  background: var(--bg-secondary);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-xl);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--divider-color);
  background: var(--bg-tertiary);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* 模态框动画 */
.modal-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-leave-active {
  transition: all 0.2s ease-out;
}

.modal-fade-enter-from {
  opacity: 0;
}

.modal-fade-enter-from .theme-editor-container {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}

.modal-fade-enter-to {
  opacity: 1;
}

.modal-fade-enter-to .theme-editor-container {
  transform: scale(1) translateY(0);
  opacity: 1;
}

.modal-fade-leave-from {
  opacity: 1;
}

.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-leave-to .theme-editor-container {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .theme-editor-modal {
    padding: var(--space-2);
  }

  .theme-editor-container {
    max-height: 95vh;
  }

  .modal-header {
    padding: var(--space-3) var(--space-4);
  }

  .modal-title {
    font-size: 16px;
  }
}
</style>
