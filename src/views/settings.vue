<template>
  <div class="settings-container">
    <AutoFeedbackConsentModal
      :show="showAutoFeedbackConsent"
      :title="$t('settings.autoFeedbackConsent.title')"
      :message="$t('settings.autoFeedbackConsent.message')"
      @accept="handleAutoFeedbackAccept"
      @decline="handleAutoFeedbackDecline"
    />
    <!-- Appearance and language settings group -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div :key="currentLanguage" class="section-header">
          {{ t("settings.appearanceAndLanguage") }}
        </div>
      </transition>

      <!-- Theme settings -->
      <div class="setting-item theme-setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'palette']" />
        </div>
        <div class="setting-details full-width">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.theme") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.themeDescription") }}
            </div>
          </transition>
          <!-- Theme selector -->
          <div class="theme-selector-wrapper">
            <ThemeSelector
              ref="themeSelectorRef"
              v-model="currentTheme"
              :show-seasonal-themes="shouldShowSeasonalThemes"
              :seasonal-theme-mode="seasonalThemeMode"
              @change="handleThemeChange"
            />
          </div>
        </div>
      </div>

      <!-- Language settings -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'globe']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.language") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.languageDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <CustomDropdown
            v-model="currentLanguage"
            :options="languageOptions"
            :is-open="activeDropdown === 'language'"
            :placeholder="t('common.select')"
            @change="handleLanguageChange"
            @dropdown-open="handleDropdownOpen('language')"
          />
        </div>
      </div>
    </div>

    <!-- Custom theme settings group -->
    <div class="setting-group custom-theme-group">
      <transition name="text-swift" mode="out-in">
        <div :key="currentLanguage" class="section-header">
          {{ t("theme.customThemes") }}
        </div>
      </transition>

      <div class="custom-theme-content">
        <ThemeList
          @create="handleCreateTheme"
          @edit="handleEditTheme"
          @delete="handleDeleteTheme"
          @select="handleSelectTheme"
          @import="handleImportTheme"
          @export="handleExportTheme"
        />
      </div>
    </div>

    <!-- Theme editor modal -->
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
          <ThemeEditor
            :theme="editingTheme"
            :mode="themeEditorMode"
            @save="handleSaveTheme"
            @cancel="handleCancelThemeEdit"
          />
        </div>
      </div>
    </transition>

    <!-- Advanced settings group -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div :key="currentLanguage" class="section-header">
          {{ t("settings.advancedSettings") }}
        </div>
      </transition>

      <!-- Disable GPU acceleration toggle -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'microchip']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.disableGpuAcceleration") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.disableGpuAccelerationDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input v-model="gpuAccelerationDisabled" type="checkbox" @change="handleGpuAccelerationToggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Auto feedback toggle (available to all users) -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.autoFeedbackEnabled") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.autoFeedbackEnabledDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input v-model="autoFeedbackEnabled" type="checkbox" @change="handleAutoFeedbackToggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- System and updates settings group -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div :key="currentLanguage" class="section-header">
          {{ t("settings.systemAndUpdates") }}
        </div>
      </transition>

      <!-- Check for updates -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'download']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.checkUpdates") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.checkUpdatesDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <button class="check-update-btn" :disabled="checkingUpdate" @click="checkForUpdates">
            <font-awesome-icon v-if="checkingUpdate" :icon="['fas', 'spinner']" spin />
            <transition name="text-swift" mode="out-in">
              <span :key="currentLanguage + '-' + checkingUpdate">
                {{ checkingUpdate ? t("settings.checking") : t("settings.check") }}
              </span>
            </transition>
          </button>
        </div>
      </div>
    </div>

    <!-- Steam API settings group -->
    <div class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div :key="currentLanguage" class="section-header">
          {{ t("settings.steamApi.title") }}
        </div>
      </transition>

      <!-- API Key settings -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'key']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.steamApi.apiKey") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.steamApi.apiKeyDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <div class="api-key-container">
            <div class="api-key-input-wrapper">
              <input
                v-model="steamApiKey"
                :type="showApiKey ? 'text' : 'password'"
                class="api-key-input"
                :placeholder="t('settings.steamApi.apiKeyPlaceholder')"
              />
              <button
                class="toggle-visibility-btn"
                :title="showApiKey ? t('settings.steamApi.hideApiKey') : t('settings.steamApi.showApiKey')"
                @click="showApiKey = !showApiKey"
              >
                <font-awesome-icon :icon="showApiKey ? ['fas', 'eye-slash'] : ['fas', 'eye']" />
              </button>
              <button class="save-api-key-btn" :title="t('settings.steamApi.saveApiKey')" @click="saveSteamApiKey">
                <font-awesome-icon :icon="['fas', 'save']" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Cache status -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'database']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.steamApi.cacheStatus") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.steamApi.cacheStatusDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <div class="cache-info">
            <transition name="text-swift" mode="out-in">
              <span :key="currentLanguage + '-' + cacheEntryCount" class="cache-count"
                >{{ cacheEntryCount }} {{ t("settings.steamApi.cacheEntries") }}</span
              >
            </transition>
            <button class="view-cache-btn" @click="navigateToSteamCache">
              <font-awesome-icon :icon="['fas', 'eye']" />
              <transition name="text-swift" mode="out-in">
                <span :key="currentLanguage + '-viewCache'">{{ t("settings.steamApi.viewCache") }}</span>
              </transition>
            </button>
            <button class="clear-cache-btn" @click="clearSteamCache">
              <font-awesome-icon :icon="['fas', 'trash']" />
              <transition name="text-swift" mode="out-in">
                <span :key="currentLanguage + '-clearCache'">{{ t("settings.steamApi.clearCache") }}</span>
              </transition>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Developer options settings group -->
    <div v-if="developerOptionsEnabled" class="setting-group">
      <transition name="text-swift" mode="out-in">
        <div :key="currentLanguage" class="section-header">
          {{ t("settings.developerOptions") }}
        </div>
      </transition>

      <!-- Developer mode toggle -->
      <div class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'code']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.developerMode") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.developerModeDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input v-model="developerModeEnabled" type="checkbox" @change="handleDeveloperModeToggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Logging feature toggle -->
      <div v-if="developerModeEnabled" class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'file-alt']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.enableLogging") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.enableLoggingDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input v-model="logMenuEnabled" type="checkbox" @change="handleLogMenuToggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Performance monitor toggle -->
      <div v-if="developerModeEnabled" class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'tachometer-alt']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.performanceMonitor") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.performanceMonitorDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input v-model="performanceMonitorEnabled" type="checkbox" @change="handlePerformanceMonitorToggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Test archive display toggle -->
      <div v-if="developerModeEnabled" class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'flask']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.testArchiveDisplay") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.testArchiveDisplayDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <label class="switch">
            <input v-model="testArchiveEnabled" type="checkbox" @change="handleTestArchiveToggle" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Seasonal theme control -->
      <div v-if="developerModeEnabled" class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'snowflake']" style="color: #e53935" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.seasonalThemeControl") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.seasonalThemeControlDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <CustomDropdown
            v-model="seasonalThemeMode"
            :options="seasonalThemeModeOptions"
            :is-open="activeDropdown === 'seasonalTheme'"
            :placeholder="t('common.select')"
            @change="handleSeasonalThemeModeChange"
            @dropdown-open="handleDropdownOpen('seasonalTheme')"
          />
        </div>
      </div>

      <!-- Reset tutorial button -->
      <div v-if="developerModeEnabled" class="setting-item">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'graduation-cap']" />
        </div>
        <div class="setting-details">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.resetTutorial") }}
            </div>
          </transition>
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-description">
              {{ t("settings.resetTutorialDescription") }}
            </div>
          </transition>
        </div>
        <div class="setting-action">
          <button class="reset-tutorial-btn" @click="handleResetTutorial">
            <font-awesome-icon :icon="['fas', 'redo']" />
            <transition name="text-swift" mode="out-in">
              <span :key="currentLanguage">{{ t("settings.resetTutorialButton") }}</span>
            </transition>
          </button>
        </div>
      </div>

      <!-- Save file tools -->
      <div v-if="developerModeEnabled" class="setting-item sav-tools-section">
        <div class="setting-icon">
          <font-awesome-icon :icon="['fas', 'file-code']" />
        </div>
        <div class="setting-details full-width">
          <transition name="text-swift" mode="out-in">
            <div :key="currentLanguage" class="setting-title">
              {{ t("settings.savFileTools") }}
            </div>
          </transition>

          <div class="sav-tools-container">
            <!-- Parse save file -->
            <div
              class="drop-zone"
              :class="{ 'drag-over': parseDragOver, processing: isParsing }"
              @dragover.prevent="parseDragOver = true"
              @dragleave.prevent="parseDragOver = false"
              @drop.prevent="handleParseDrop"
              @click="triggerParseFileInput"
            >
              <div class="drop-zone-content">
                <font-awesome-icon
                  :icon="isParsing ? ['fas', 'spinner'] : ['fas', 'file-import']"
                  :spin="isParsing"
                  class="drop-icon"
                />
                <div class="drop-title">
                  {{ isParsing ? t("settings.parsing") : t("settings.parseSavFile") }}
                </div>
              </div>
            </div>

            <!-- Pack save file -->
            <div
              class="drop-zone"
              :class="{ 'drag-over': packDragOver, processing: isPacking }"
              @dragover.prevent="packDragOver = true"
              @dragleave.prevent="packDragOver = false"
              @drop.prevent="handlePackDrop"
              @click="triggerPackFileInput"
            >
              <div class="drop-zone-content">
                <font-awesome-icon
                  :icon="isPacking ? ['fas', 'spinner'] : ['fas', 'file-export']"
                  :spin="isPacking"
                  class="drop-icon"
                />
                <div class="drop-title">
                  {{ isPacking ? t("settings.packing") : t("settings.packSavFile") }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Version info -->
    <div class="version-info">
      <transition name="text-swift" mode="out-in">
        <div :key="currentLanguage" class="version-text">
          {{ t("settings.versionInfo", { version: appVersion }) }}
        </div>
      </transition>
      <transition name="text-swift" mode="out-in">
        <div :key="currentLanguage" class="version-detail">
          {{ t("settings.developedBy") }}
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { updateService, UpdateStatus } from "../services/updateService.js";
import CustomDropdown from "../components/ui/CustomDropdown.vue";
import ThemeSelector from "../components/theme/ThemeSelector.vue";
import ThemeList from "../components/theme/ThemeList.vue";
import ThemeEditor from "../components/theme/ThemeEditor.vue";
import AutoFeedbackConsentModal from "../components/modal/AutoFeedbackConsentModal.vue";
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
    AutoFeedbackConsentModal,
  },
  setup() {
    const { t, locale } = useI18n({ useScope: "global" });
    return { t, locale };
  },
  data() {
    return {
      currentTheme: storage.getItem("theme", "light"),
      currentLanguage: storage.getItem("language", "zh-CN"),
      performanceMonitorEnabled: storage.getItem("performanceMonitor", true) !== false, // Enabled by default
      developerModeEnabled: storage.getItem("developerMode", false) === true, // Developer mode state
      developerOptionsEnabled: storage.getItem("developerMode", false) === true, // Whether developer options are visible
      logMenuEnabled: storage.getItem("logMenuEnabled", false) === true, // Log feature toggle state
      autoFeedbackEnabled:
        storage.getItem("autoFeedbackEnabled", true) === true ||
        storage.getItem("autoFeedbackEnabled", true) === "true" ||
        storage.getItem("autoFeedbackEnabled", true) === null ||
        storage.getItem("autoFeedbackEnabled", true) === undefined, // Auto feedback toggle state, enabled by default
      testArchiveEnabled: storage.getItem("testArchiveEnabled", true) !== false, // Test archive display toggle state, enabled by default
      gpuAccelerationDisabled: storage.getItem("gpuAccelerationDisabled", false) === true, // GPU acceleration toggle state
      // Steam API related
      steamApiKey: "",
      showApiKey: false,
      cacheEntryCount: 0,
      checkingUpdate: false,
      appVersion: APP_VERSION,
      activeDropdown: null,
      updateInfo: null,
      updateStatus: UpdateStatus.IDLE,
      UpdateStatus: UpdateStatus, // Expose UpdateStatus for template use
      isProcessing: false,
      // Save file tools related
      parseDragOver: false,
      packDragOver: false,
      isParsing: false,
      isPacking: false,
      // Seasonal theme control
      seasonalThemeMode: storage.getItem("seasonalThemeMode", "auto"),
      // Custom theme related
      showThemeEditor: false,
      themeEditorMode: "create", // 'create' or 'edit'
      editingTheme: null,
      isImporting: false,
      isExporting: false,
      showAutoFeedbackConsent: false,
      pendingAutoFeedbackState: null,
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
      // Decide whether to show seasonal theme options based on mode and date
      if (this.shouldShowSeasonalThemes) {
        // New Year theme
        if (this.isNewYearPeriod() || this.seasonalThemeMode === "force") {
          options.push({ value: "new-year", label: this.$t("common.newYear") });
        }
        // Spring Festival theme
        if (this.isSpringFestivalPeriod() || this.seasonalThemeMode === "force") {
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
      // Check seasonal theme control in developer mode
      const mode = this.seasonalThemeMode;
      if (mode === "force") return true;
      if (mode === "hide") return false;
      // auto mode: at least one seasonal theme is currently valid
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
  beforeUnmount() {
    // Clear countdown
    this.clearRestartCountdown();
    // Remove event listeners
    document.removeEventListener("click", this.handleClickOutside);
    window.removeEventListener("developer-mode-changed", this.handleDeveloperModeChanged);
  },
  async mounted() {
    // Apply saved theme
    if (window.themeManager) {
      window.themeManager.setTheme(this.currentTheme);
    } else {
      document.documentElement.setAttribute("data-theme", this.currentTheme);
    }

    await this.initializeLanguage();

    // Add click outside event listener to close dropdown
    document.addEventListener("click", this.handleClickOutside);

    // Listen for developer mode change events
    window.addEventListener("developer-mode-changed", this.handleDeveloperModeChanged);

    // Check auto feedback consent
    this.checkAndShowAutoFeedbackConsent();

    // Initialize GPU acceleration state
    this.initializeGpuAccelerationStatus();

    // Initialize Steam API settings
    await this.initializeSteamApiSettings();

    // Check for updates
    if (updateService.canCheckUpdate && updateService.canCheckUpdate()) {
      try {
        await updateService.checkForUpdates();
        updateService.recordLastCheck && updateService.recordLastCheck();
      } catch (error) {
        console.error(this.t("settings.startupUpdateCheckFailed"), error);
      }
    }
  },
  methods: {
    checkAndShowAutoFeedbackConsent() {
      // No longer auto-popup when opening settings page
      // Only popup when user tries to enable auto feedback
    },
    handleAutoFeedbackAccept() {
      storage.setItem("autoFeedbackEnabled", true);
      storage.setItem("autoFeedbackConsentShown", true);
      this.autoFeedbackEnabled = true;
      this.pendingAutoFeedbackState = null;
      this.showAutoFeedbackConsent = false;
      window.dispatchEvent(
        new CustomEvent("auto-feedback-toggle", {
          detail: { enabled: true },
        }),
      );
    },
    handleAutoFeedbackDecline() {
      storage.setItem("autoFeedbackEnabled", false);
      storage.setItem("autoFeedbackConsentShown", true);
      this.autoFeedbackEnabled = false;
      this.pendingAutoFeedbackState = null;
      this.showAutoFeedbackConsent = false;
      window.dispatchEvent(
        new CustomEvent("auto-feedback-toggle", {
          detail: { enabled: false },
        }),
      );
    },
    formatUpdateNotes(body) {
      if (!body) return this.t("settings.noUpdateNotes");

      let html = body;

      // Process code blocks
      html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
      html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

      // Process headings
      html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
      html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
      html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

      // Process lists
      html = html.replace(/^\* (.*$)/gm, "<li>$1</li>");
      html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
      html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

      // Process bold and italic
      html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
      html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
      html = html.replace(/_(.*?)_/g, "<em>$1</em>");

      // Process links [text](url)
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

      // Process line breaks
      html = html.replace(/\n\n/g, "</p><p>");
      html = html.replace(/\n/g, "<br>");

      // Wrap in paragraphs
      if (!html.includes("<h") && !html.includes("<pre") && !html.includes("<ul")) {
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

      // If New Year theme is selected, save the previous non-New Year theme for restoration
      if (theme === "new-year") {
        // Only record if previous theme was not New Year
        if (previousTheme && previousTheme !== "new-year") {
          storage.setItem("themeBeforeNewYear", previousTheme);
        }
      } else {
        // If a non-New Year theme is selected, also update themeBeforeNewYear
        // So even if user switches directly from New Year to dark, next restore will be dark
        storage.setItem("themeBeforeNewYear", theme);
      }

      // Update current theme
      this.currentTheme = theme;
      storage.setItem("theme", theme);

      if (window.themeManager) {
        window.themeManager.setTheme(theme);
      } else {
        document.documentElement.setAttribute("data-theme", theme);
      }

      // Force background update to ensure immediate visibility
      this.forceThemeBackgroundUpdate(theme);

      // Close dropdown after selection
      this.activeDropdown = null;
    },

    forceThemeBackgroundUpdate(theme) {
      // Additional background update safeguard to ensure theme switch takes effect immediately
      const root = document.documentElement;
      const body = document.body;

      // Theme background color mapping
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

      // If it's a plugin theme, get colors from plugin data
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
          // Final fallback
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

      // Force redraw
      void document.body.offsetHeight;
    },

    async handleLanguageChange(option) {
      const lang = option.value;
      await this.setLanguage(lang);

      // Close dropdown after selection
      this.activeDropdown = null;
    },

    async setLanguage(lang) {
      this.currentLanguage = lang;
      try {
        // Use global i18n instance to set language
        if (this.$i18n) {
          this.$i18n.locale = lang;
        }
        storage.setItem("language", lang);

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent("language-changed", { detail: { lang } }));

        // Update window title to app.name from language file
        await this.updateWindowTitle();
      } catch (error) {
        console.error(this.t("settings.languageSwitchFailed"), error);
      }
    },

    async updateWindowTitle() {
      try {
        // Get app name from current language file
        const appName = this.t("app.name");

        // Call backend to set window title
        await invoke("set_window_title", { title: appName });

        console.log("Window title updated to:", appName);
      } catch (error) {
        console.error("Failed to update window title:", error);
        // Don't throw error; language switch should not fail due to title update failure
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

          // Use new notification system with buttons
          notify.info(this.t("settings.newVersionAvailable", { version: update.version }), {
            title: this.t("settings.updateAvailable"),
            icon: ["fas", "download"],
            details: update.releaseNotes ? { description: update.releaseNotes.substring(0, 100) + "..." } : null,
            actions: [
              {
                text: this.t("settings.goToDownload"),
                type: "primary",
                icon: ["fas", "external-link-alt"],
                onClick: () => this.downloadAndInstall(),
              },
              {
                text: this.t("common.later"),
                type: "secondary",
              },
            ],
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
          errorText = this.t("settings.resourceNotFound");
        } else if (error.type === this.t("settings.errorType.accessDenied")) {
          errorText = this.t("settings.accessDenied");
        }

        notify.error(errorText, { duration: 8000 });
      } finally {
        this.checkingUpdate = false;
        this.isProcessing = false;
      }
    },
    handlePerformanceMonitorToggle() {
      storage.setItem("performanceMonitor", this.performanceMonitorEnabled);
      // Dispatch custom event to notify App.vue to update state
      window.dispatchEvent(
        new CustomEvent("performance-monitor-toggle", {
          detail: { enabled: this.performanceMonitorEnabled },
        }),
      );
    },

    handleDeveloperModeToggle() {
      storage.setItem("developerMode", this.developerModeEnabled);
      this.developerOptionsEnabled = this.developerModeEnabled;

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("developer-mode-changed", {
          detail: { enabled: this.developerModeEnabled },
        }),
      );

      // If developer mode is turned off, also disable all related settings
      if (!this.developerModeEnabled) {
        // Disable logging feature
        this.logMenuEnabled = false;
        storage.setItem("logMenuEnabled", "false");
        window.dispatchEvent(
          new CustomEvent("log-menu-toggle", {
            detail: { enabled: false },
          }),
        );

        // Disable performance monitor
        this.performanceMonitorEnabled = false;
        storage.setItem("performanceMonitor", "false");

        // Disable test archive display
        this.testArchiveEnabled = false;
        storage.setItem("testArchiveEnabled", "false");
        window.dispatchEvent(
          new CustomEvent("test-archive-toggle", {
            detail: { enabled: false },
          }),
        );
      }
    },

    handleLogMenuToggle() {
      storage.setItem("logMenuEnabled", this.logMenuEnabled);
      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("log-menu-toggle", {
          detail: { enabled: this.logMenuEnabled },
        }),
      );
    },

    handleAutoFeedbackToggle() {
      if (this.autoFeedbackEnabled) {
        this.pendingAutoFeedbackState = true;
        this.showAutoFeedbackConsent = true;
        this.autoFeedbackEnabled = false;
        return;
      }

      storage.setItem("autoFeedbackEnabled", this.autoFeedbackEnabled);
      window.dispatchEvent(
        new CustomEvent("auto-feedback-toggle", {
          detail: { enabled: this.autoFeedbackEnabled },
        }),
      );
    },

    handleTestArchiveToggle() {
      storage.setItem("testArchiveEnabled", this.testArchiveEnabled);
      // Dispatch custom event to notify sidebar to update state
      window.dispatchEvent(
        new CustomEvent("test-archive-toggle", {
          detail: { enabled: this.testArchiveEnabled },
        }),
      );
    },

    // Check if current date is during New Year period (Dec 31 - Jan 4)
    isNewYearPeriod() {
      return checkNewYearPeriod();
    },

    // Check if current date is during Spring Festival period (dates read from seasonalThemeConfig)
    isSpringFestivalPeriod() {
      return checkSpringFestivalPeriod();
    },

    // Check if theme is a seasonal theme
    isSeasonalTheme(themeId) {
      return ["new-year", "spring-festival-dark", "spring-festival-light"].includes(themeId);
    },

    // Check if seasonal theme is currently available
    isSeasonalThemeAvailable(themeId) {
      return checkSeasonalThemeAvailable(themeId, {
        mode: this.seasonalThemeMode,
      });
    },

    handleSeasonalThemeModeChange(option) {
      const mode = option.value;
      this.seasonalThemeMode = mode;
      storage.setItem("seasonalThemeMode", mode);

      // If current theme is seasonal but hidden, restore previous theme
      if (mode === "hide" && this.isSeasonalTheme(this.currentTheme)) {
        const themeBeforeSeasonal = storage.getItem("themeBeforeNewYear") || "light";
        this.currentTheme = themeBeforeSeasonal;
        storage.setItem("theme", themeBeforeSeasonal);
        if (window.themeManager) {
          window.themeManager.setTheme(themeBeforeSeasonal);
        } else {
          document.documentElement.setAttribute("data-theme", themeBeforeSeasonal);
        }
        this.forceThemeBackgroundUpdate(themeBeforeSeasonal);
      }

      // If switching to auto mode and current theme is seasonal but not valid, also restore
      if (
        mode === "auto" &&
        this.isSeasonalTheme(this.currentTheme) &&
        !this.isSeasonalThemeAvailable(this.currentTheme)
      ) {
        const themeBeforeSeasonal = storage.getItem("themeBeforeNewYear") || "light";
        this.currentTheme = themeBeforeSeasonal;
        storage.setItem("theme", themeBeforeSeasonal);
        if (window.themeManager) {
          window.themeManager.setTheme(themeBeforeSeasonal);
        } else {
          document.documentElement.setAttribute("data-theme", themeBeforeSeasonal);
        }
        this.forceThemeBackgroundUpdate(themeBeforeSeasonal);
      }

      // Close dropdown
      this.activeDropdown = null;

      // Show notification
      notify.success(this.t("settings.seasonalThemeModeChanged"));
    },

    handleResetTutorial() {
      // Clear quick create tutorial completion flag
      storage.removeItem("quick_create_tutorial_completed");

      // Show success notification
      notify.success(this.t("settings.tutorialReset"));
    },

    // ========== Save file tool methods ==========
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
      // Drag also triggers file selection dialog
      this.parseSavFile();
    },

    handlePackDrop(event) {
      this.packDragOver = false;
      // Drag also triggers file selection dialog
      this.packJsonFile();
    },

    handleParseFileSelect(event) {
      // No longer used, switched to Tauri dialog
      event.target.value = "";
    },

    handlePackFileSelect(event) {
      // No longer used, switched to Tauri dialog
      event.target.value = "";
    },

    async parseSavFile() {
      this.isParsing = true;

      try {
        // Use Tauri dialog to select file for full path
        const { open } = await import("@tauri-apps/plugin-dialog");
        const filePath = await open({
          multiple: false,
          filters: [{ name: "Save Files", extensions: ["sav"] }],
        });

        if (!filePath) {
          this.isParsing = false;
          return;
        }

        // Call backend to parse save file
        const result = await invoke("convert_sav_to_json", {
          filePath: filePath,
        });

        if (result.success && result.json) {
          // Generate output filename (same name .json)
          const fileName = filePath.split("\\").pop().split("/").pop();
          const outputFileName = fileName.replace(/\.sav$/i, ".json");
          const outputDir = filePath.substring(0, Math.max(filePath.lastIndexOf("\\"), filePath.lastIndexOf("/")));
          const outputPath = `${outputDir}/${outputFileName}`.replace(/\//g, "\\");

          // Write file using Tauri fs plugin
          const { writeTextFile } = await import("@tauri-apps/plugin-fs");
          await writeTextFile(outputPath, result.json);

          notify.success(this.t("settings.parseSuccess", { filename: outputFileName }));
        } else {
          throw new Error("Parse result is invalid");
        }
      } catch (error) {
        console.error("Failed to parse save file:", error);
        notify.error(this.t("settings.parseError", { error: error.toString() }));
      } finally {
        this.isParsing = false;
      }
    },

    async packJsonFile() {
      this.isPacking = true;

      try {
        // Use Tauri dialog to select file for full path
        const { open } = await import("@tauri-apps/plugin-dialog");
        const filePath = await open({
          multiple: false,
          filters: [{ name: "JSON Files", extensions: ["json"] }],
        });

        if (!filePath) {
          this.isPacking = false;
          return;
        }

        // Read JSON file content
        const { readTextFile } = await import("@tauri-apps/plugin-fs");
        const jsonContent = await readTextFile(filePath);

        // Generate output filename (same name -edited.sav)
        const fileName = filePath.split("\\").pop().split("/").pop();
        const baseName = fileName.replace(/\.json$/i, "");
        const outputFileName = `${baseName}-edited.sav`;
        const outputDir = filePath.substring(0, Math.max(filePath.lastIndexOf("\\"), filePath.lastIndexOf("/")));
        const outputPath = `${outputDir}/${outputFileName}`.replace(/\//g, "\\");

        // Call backend to pack save file
        const result = await invoke("convert_json_to_sav", {
          jsonContent: jsonContent,
          outputPath: outputPath,
        });

        if (result.success) {
          notify.success(this.t("settings.packSuccess", { filename: outputFileName }));
        } else {
          throw new Error(result.message || "Packaging failed");
        }
      } catch (error) {
        console.error("Failed to pack save file:", error);
        notify.error(this.t("settings.packError", { error: error.toString() }));
      } finally {
        this.isPacking = false;
      }
    },

    async handleGpuAccelerationToggle() {
      try {
        // Call Tauri command to set GPU acceleration state
        await invoke("set_gpu_acceleration", {
          disabled: this.gpuAccelerationDisabled,
        });

        // Save state to localStorage
        storage.setItem("gpuAccelerationDisabled", this.gpuAccelerationDisabled.toString());

        // Show prompt informing user to restart the application manually
        const message = this.gpuAccelerationDisabled
          ? this.t("settings.gpuAccelerationDisabled")
          : this.t("settings.gpuAccelerationEnabled");

        notify.info(message, { duration: 5000 });
      } catch (error) {
        console.error(this.t("settings.gpuAccelerationChangeFailed"), error);
        // Restore toggle state
        this.gpuAccelerationDisabled = !this.gpuAccelerationDisabled;
        storage.setItem("gpuAccelerationDisabled", this.gpuAccelerationDisabled.toString());

        // Show error prompt
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

        // Successfully opened download page
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
        // Use global i18n instance to set language
        if (this.$i18n) {
          this.$i18n.locale = savedLanguage;
        }
      } catch (error) {
        console.error(this.t("settings.languageInitFailed"), error);
        this.currentLanguage = "zh-CN";
      }
    },

    // Handle clicking outside to close dropdown
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

    // Handle developer mode change event
    handleDeveloperModeChanged(event) {
      const enabled = event.detail.enabled;
      this.developerModeEnabled = enabled;
      this.developerOptionsEnabled = enabled;

      // If developer mode is off, reset all related settings
      if (!enabled) {
        // Disable logging
        this.logMenuEnabled = false;
        storage.setItem("logMenuEnabled", "false");
        window.dispatchEvent(
          new CustomEvent("log-menu-toggle", {
            detail: { enabled: false },
          }),
        );

        // Disable performance monitor
        this.performanceMonitorEnabled = false;
        storage.setItem("performanceMonitor", "false");

        // Disable test archive display
        this.testArchiveEnabled = false;
        storage.setItem("testArchiveEnabled", "false");
        window.dispatchEvent(
          new CustomEvent("test-archive-toggle", {
            detail: { enabled: false },
          }),
        );
      }
    },

    // Initialize GPU acceleration state
    async initializeGpuAccelerationStatus() {
      try {
        // Get state from localStorage
        const localStorageState = storage.getItem("gpuAccelerationDisabled") === "true";

        // Try to get state from Tauri backend
        try {
          const backendState = await invoke("get_gpu_acceleration_status");
          // If backend state differs from localStorage, use backend state
          if (backendState !== localStorageState) {
            this.gpuAccelerationDisabled = backendState;
            storage.setItem("gpuAccelerationDisabled", backendState.toString());
          }
        } catch (error) {
          console.warn(this.t("settings.gpuStatusFetchFailed"), error);
          // Use localStorage state
          this.gpuAccelerationDisabled = localStorageState;
        }
      } catch (error) {
        console.error(this.t("settings.gpuStatusInitFailed"), error);
        // Enable GPU acceleration by default
        this.gpuAccelerationDisabled = false;
      }
    },

    // Initialize Steam API settings
    async initializeSteamApiSettings() {
      try {
        // Get encrypted API key from storage
        const encryptedApiKey = storage.getItem("steamApiKey");
        if (encryptedApiKey) {
          try {
            // Call backend to decrypt API key
            this.steamApiKey = await invoke("decrypt_steam_api_key", {
              encryptedKey: encryptedApiKey,
            });
          } catch (error) {
            console.error(this.t("settings.steamApi.decryptKeyFailed"), error);
            // If decryption fails, clear stored key
            storage.removeItem("steamApiKey");
          }
        }

        // Get cache entry count
        this.updateCacheEntryCount();
      } catch (error) {
        console.error(this.t("settings.steamApi.initFailed"), error);
      }
    },

    // Save Steam API key
    async saveSteamApiKey() {
      if (!this.steamApiKey.trim()) {
        notify.error(this.t("settings.steamApi.apiKeyPlaceholder"));
        return;
      }

      try {
        // Show testing prompt
        notify.info(this.t("settings.steamApi.validatingKey"));

        // Generate a random Steam ID for testing
        const testSteamId = this.generateRandomSteamId();
        console.log(
          this.t("settings.steamApi.testSteamId"),
          testSteamId,
          this.t("settings.steamApi.idLength"),
          testSteamId.length,
        );

        // Test if API key is valid
        let apiTestPassed = false;
        try {
          console.log(this.t("settings.steamApi.startKeyTest"));
          // Directly use the user-entered API key for testing, instead of reading from config
          const result = await invoke("test_steam_api_key", {
            apiKey: this.steamApiKey,
            steamId: testSteamId,
          });
          console.log(this.t("settings.steamApi.apiCallSuccess"), result);
          // If successful, the API key is valid
          apiTestPassed = true;
        } catch (error) {
          // Handle error object, could be string or {message: string} object
          const errorMsg = typeof error === "string" ? error : error.message || error.toString();
          console.log(this.t("settings.steamApi.apiCallFailed"), errorMsg);

          // If it's a 403 error, the API key is invalid
          if (errorMsg.includes("403") || errorMsg.includes("Forbidden")) {
            console.log(this.t("settings.steamApi.detected403Error"));
            notify.error(this.t("settings.steamApi.keyInvalid"));
            return; // Return directly, do not save key
          }

          // If it's a Steam ID format error, our generated ID has an issue, but it's not an API key issue
          if (
            errorMsg.includes(this.t("settings.steamApi.error.invalidSteamIdFormat")) ||
            errorMsg.includes("Invalid Steam ID format")
          ) {
            console.log(this.t("settings.steamApi.detectedSteamIdFormatError"));
            // It's our generated ID issue, not API key issue, can continue saving
            apiTestPassed = true;
          }
          // If it's a Steam API error, the API key is valid, just our generated ID doesn't exist
          else if (errorMsg.includes(this.t("settings.steamApi.error.steamApiError"))) {
            console.log(this.t("settings.steamApi.detectedSteamApiError"));
            apiTestPassed = true;
          }
          // Other errors may be network issues, can continue saving
          else {
            console.warn(this.t("settings.steamApi.otherError"), error);
            apiTestPassed = true;
          }
        }

        // Only save key if API test passes
        if (!apiTestPassed) {
          console.log(this.t("settings.steamApi.apiTestFailed"));
          notify.error(this.t("settings.steamApi.keyTestFailed"));
          return;
        }

        console.log(this.t("settings.steamApi.keyValidationPassed"));
        // Call backend to save API key to config file
        await invoke("save_steam_api_key", { apiKey: this.steamApiKey });
        console.log(this.t("settings.steamApi.keySavedToConfig"));

        // Also save to localStorage for compatibility
        const encryptedApiKey = await invoke("encrypt_steam_api_key", {
          apiKey: this.steamApiKey,
        });
        storage.setItem("steamApiKey", encryptedApiKey);
        console.log(this.t("settings.steamApi.keySavedToLocalStorage"));

        // Show success notification
        notify.success(this.t("settings.steamApi.keySaved"));
      } catch (error) {
        console.error(this.t("settings.steamApi.saveKeyFailed"), error);
        notify.error(this.t("settings.steamApi.saveKeyFailed") + ": " + error);
      }
    },

    // Generate random Steam ID for testing
    generateRandomSteamId() {
      // Steam ID format is typically 7656119XXXXXXXXX (17 digits)
      // 7656119 is Steam ID prefix, need 10 more digits to reach 17
      const prefix = "7656119";
      const randomSuffix = Math.floor(Math.random() * 10000000000)
        .toString()
        .padStart(10, "0");
      return prefix + randomSuffix;
    },

    // Clear Steam cache
    async clearSteamCache() {
      try {
        // Call backend to clear cache
        await invoke("clear_steam_cache");

        // Update cache entry count
        this.updateCacheEntryCount();

        // Show success notification
        notify.success(this.t("settings.steamApi.cacheCleared"));
      } catch (error) {
        console.error(this.t("settings.steamApi.clearCacheFailed"), error);
        notify.error(this.t("settings.steamApi.clearCacheFailed") + ": " + error);
      }
    },

    // Update cache entry count
    async updateCacheEntryCount() {
      try {
        // Call backend to get cache entry count
        this.cacheEntryCount = await invoke("get_steam_cache_count");
      } catch (error) {
        console.error(this.t("settings.steamApi.getCacheCountFailed"), error);
        this.cacheEntryCount = 0;
      }
    },

    // Navigate to Steam cache page
    navigateToSteamCache() {
      this.$router.push("/steam-cache");
    },

    // Format date
    formatDate(timestamp) {
      if (!timestamp) return this.t("common.unknown");
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    },

    // Steam ID masking
    maskSteamId(steamId) {
      if (!steamId) return "";
      // Steam ID format is typically 7656119XXXXXXXXX (17 digits)
      if (steamId.length >= 8) {
        const start = steamId.substring(0, 4);
        const end = steamId.substring(steamId.length - 4);
        const middle = "*".repeat(steamId.length - 8);
        return start + middle + end;
      }
      // If length is less than 8, only show first two digits
      return steamId.substring(0, 2) + "*".repeat(steamId.length - 2);
    },

    // ========== Custom theme methods ==========

    // Open create theme editor - navigate to theme editor page
    handleCreateTheme() {
      this.$router.push("/theme-editor");
    },

    // Open edit theme editor - navigate to theme editor page (with theme ID)
    handleEditTheme(theme) {
      this.$router.push(`/theme-editor/${theme.id}`);
    },

    // Handle theme deletion
    handleDeleteTheme(theme) {
      // ThemeList component already handles deletion logic, we can add extra prompts here
      notify.success(this.t("theme.themeDeleted", { name: theme.name }));
    },

    // Handle theme selection
    handleSelectTheme(themeId) {
      // Update current theme status
      this.currentTheme = themeId;
      storage.setItem("theme", themeId);
    },

    // Handle theme import
    async handleImportTheme() {
      if (this.isImporting) return;

      this.isImporting = true;

      try {
        const result = await themeStorage.importTheme();

        if (result.success && result.theme) {
          // Save imported theme
          const saveResult = await themeManager.addCustomTheme(result.theme);

          if (saveResult.success) {
            notify.success(this.t("theme.importSuccess", { name: result.theme.name }));
          } else {
            throw new Error(saveResult.error || this.t("theme.importFailed"));
          }
        } else if (result.error) {
          throw new Error(result.error);
        }
        // If result.success is false and no error, user cancelled the dialog
      } catch (error) {
        console.error("Failed to import theme:", error);
        notify.error(this.t("theme.importFailed") + ": " + (error.message || error));
      } finally {
        this.isImporting = false;
      }
    },

    // Handle theme export
    async handleExportTheme(theme) {
      if (this.isExporting) return;

      this.isExporting = true;

      try {
        const exportPath = await themeStorage.exportTheme(theme.id);

        if (exportPath) {
          notify.success(this.t("theme.exportSuccess", { name: theme.name }));
        }
        // If exportPath is null, user cancelled the dialog
      } catch (error) {
        console.error("Failed to export theme:", error);
        notify.error(this.t("theme.exportFailed") + ": " + (error.message || error));
      } finally {
        this.isExporting = false;
      }
    },

    // Save theme (create or update)
    async handleSaveTheme(themeData) {
      try {
        const result = await themeManager.addCustomTheme(themeData);

        if (result.success) {
          this.showThemeEditor = false;
          this.editingTheme = null;

          // Apply newly saved theme
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

    // Cancel theme editing
    handleCancelThemeEdit() {
      // Cancel preview
      themeManager.cancelPreview();
      this.showThemeEditor = false;
      this.editingTheme = null;
    },
  },
};
</script>

<style scoped>
/* Settings page styles */
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
  /* Unified shadow effect */
  box-shadow: var(--shadow-sm);
  /* Add frosted glass effect */
  backdrop-filter: blur(20px);
  transition:
    background-color 0.25s ease,
    box-shadow 0.25s ease;
}

.section-header {
  padding: var(--space-4) var(--space-5) var(--space-3);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 0.5px solid var(--divider-color);
  transition:
    color 0.25s ease,
    border-bottom-color 0.25s ease;
  /* Add subtle background color */
  background-color: rgba(0, 0, 0, 0.02);
}

.setting-item {
  display: flex;
  align-items: center;
  padding: var(--space-4) var(--space-5);
  position: relative;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.setting-item.theme-setting-item {
  flex-direction: column;
  align-items: flex-start;
  overflow: visible;
  /* Ensure scroll buttons are not clipped */
}

.setting-item.theme-setting-item .setting-icon {
  position: absolute;
  top: var(--space-4);
  left: var(--space-5);
}

.setting-item.theme-setting-item .setting-details {
  padding-left: 52px;
  overflow: visible;
  /* Ensure scroll buttons are not clipped */
}

.setting-details.full-width {
  width: 100%;
  overflow: visible;
  /* Ensure scroll buttons are not clipped */
}

.theme-selector-wrapper {
  margin-top: var(--space-3);
  padding-left: 0;
  margin-left: -52px;
  width: calc(100% + 52px);
  overflow: visible;
  /* Ensure scroll buttons are not clipped */
}

.setting-item:hover {
  background-color: var(--bg-tertiary);
  /* Add subtle scale effect */
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
  /* Add rounded background */
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
  transition:
    all 0.2s ease,
    background-color 0.25s ease,
    color 0.25s ease,
    transform 0.25s ease;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1-5);
  /* Add subtle shadow */
  box-shadow: var(--shadow-sm);
}

.check-update-btn:hover:not(:disabled) {
  background-color: var(--accent-hover);
  transform: translateY(-1px);
  /* Enhance hover shadow */
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

/* Toggle switch styles */
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

input:checked + .slider {
  background-color: var(--accent-color);
}

input:checked + .slider:before {
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
  transition:
    opacity 0.25s ease,
    color 0.25s ease;
}

/* Responsive design */
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

/* Dark theme adaptation */
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

/* Update message styles */
.update-message {
  position: fixed;
  top: 70px;
  /* Account for title bar height */
  right: var(--space-5);
  padding: 1rem 1.5rem;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-lg);
  z-index: 10000;
  /* Increase z-index to ensure on top */
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

/* Update notification animation - clean natural slide effect */
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

/* Text switch animation - clean fade in/out */
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

/* Expand animation - clean height transition */
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

/* Update checking animation */
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

/* Restart button styles */
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

/* Steam API related styles */
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

/* Reset tutorial button */
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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
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

/* Save file tool styles */
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

/* New Year theme limited-time hint styles */
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

/* ========== Custom theme styles ========== */

/* Custom theme settings group */
.custom-theme-group {
  overflow: visible;
  display: none;
}

.custom-theme-content {
  padding: var(--space-4) var(--space-5);
}

/* Theme editor modal */
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

/* Modal animation */
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

/* Responsive design */
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
