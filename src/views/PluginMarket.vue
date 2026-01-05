<template>
  <div class="plugin-market">
    <!-- 秘密解锁模态框 -->
    <transition name="modal-fade">
      <div v-if="showSecretModal" class="secret-modal-overlay" @click="cancelSecretUnlock">
        <div class="secret-modal" @click.stop>
          <div class="secret-modal-icon">
            <font-awesome-icon icon="key" />
          </div>
          <h2 class="secret-modal-title">{{ $t('plugin.secretUnlockTitle') }}</h2>
          <p class="secret-modal-message">{{ $t('plugin.secretUnlockMessage') }}</p>
          <p class="secret-modal-hint">{{ $t('plugin.secretUnlockHint') }}</p>
          <div v-if="secretUnlocked" class="secret-unlocked">
            <font-awesome-icon icon="check-circle" />
            <span>{{ $t('plugin.secretUnlocked') }}</span>
          </div>
          <div v-else class="secret-modal-buttons">
            <button class="secret-btn secret-btn-cancel" @click="cancelSecretUnlock">
              {{ $t('common.cancel') }}
            </button>
            <button class="secret-btn secret-btn-confirm" @click="confirmSecretUnlock">
              {{ $t('plugin.secretUnlockConfirm') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 灰度测试未开放提示 -->
    <div v-if="!isBetaUser" class="beta-notice">
      <div class="beta-notice-icon" @click="handleSecretClick" title="🤫">
        <font-awesome-icon icon="puzzle-piece" />
      </div>
      <h2 class="beta-notice-title">{{ $t('plugin.betaNotAvailable') }}</h2>
      <p class="beta-notice-message">{{ $t('plugin.betaNotAvailableDesc') }}</p>
    </div>

    <!-- 插件市场内容 - 仅灰度测试用户可见 -->
    <div v-else class="plugin-market-content">
    <!-- 搜索栏 -->
    <div class="search-container">
      <div class="search-bar">
        <font-awesome-icon :icon="['fas', 'search']" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('plugin.searchPlaceholder')"
          class="search-input"
        />
      </div>
      <button class="local-install-button" @click="openLocalInstall">
        <font-awesome-icon :icon="['fas', 'plus']" />
        {{ t("plugin.installLocal") }}
      </button>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-tab"
        :class="{ active: selectedCategory === category.id }"
        @click="selectCategory(category.id)"
      >
        {{ category.name }}
        <span
          v-if="category.id === 'installed' && installedPluginsList.length > 0"
          class="tab-badge"
        >
          {{ installedPluginsList.length }}
        </span>
      </button>
    </div>

    <!-- 已安装插件管理 -->
    <div
      v-if="selectedCategory === 'installed'"
      class="plugins-grid"
      ref="pluginsGrid"
    >
      <!-- 空状态 -->
      <div v-if="installedPluginsList.length === 0" class="empty-state">
        <font-awesome-icon :icon="['fas', 'puzzle-piece']" />
        <p>{{ $t('plugin.noInstalledPlugins') }}</p>
        <p class="empty-hint">{{ $t('plugin.installFromStore') }}</p>
      </div>

      <!-- 已安装插件卡片 -->
      <div
        v-else
        v-for="plugin in installedPluginsList"
        :key="plugin.id"
        class="installed-plugin-card"
        @click="openInstalledPluginDetail(plugin)"
      >
        <div class="installed-card-header">
          <div
            class="installed-plugin-icon"
            :class="getPluginTypeClass(plugin.type)"
          >
            <font-awesome-icon :icon="['fas', getPluginIcon(plugin.type)]" />
          </div>
          <div class="installed-plugin-info">
            <h3 class="installed-plugin-name">{{ plugin.name }}</h3>
            <div class="installed-plugin-meta">
              <span
                class="plugin-type-badge"
                :class="getPluginTypeClass(plugin.type)"
              >
                {{ getPluginTypeLabel(plugin.type) }}
              </span>
              <span class="plugin-version">v{{ plugin.version }}</span>
              <span v-if="plugin.locale" class="plugin-locale">{{
                plugin.locale
              }}</span>
            </div>
          </div>
        </div>
        <div class="installed-card-body">
          <p class="installed-plugin-desc">
            {{ plugin.description || plugin.localeName || $t('plugin.noDescription') }}
          </p>
          <div class="installed-plugin-details">
            <span v-if="plugin.author" class="detail-item">
              <font-awesome-icon :icon="['fas', 'user']" />
              {{ plugin.author }}
            </span>
            <span v-if="plugin.localeName" class="detail-item">
              <font-awesome-icon :icon="['fas', 'globe']" />
              {{ plugin.localeName }}
            </span>
          </div>
        </div>
        <div class="installed-card-footer">
          <span
            class="plugin-status"
            :class="{
              active: plugin.status === 'active',
              inactive: plugin.status !== 'active',
            }"
          >
            <font-awesome-icon
              :icon="[
                'fas',
                plugin.status === 'active' ? 'check-circle' : 'pause-circle',
              ]"
            />
            {{ plugin.status === "active" ? $t('plugin.enabled') : $t('plugin.disabled') }}
          </span>
          <div class="plugin-actions-group">
            <button
              class="toggle-btn"
              :class="{ enabled: plugin.status === 'active' }"
              @click.stop="handleTogglePlugin(plugin)"
              :title="plugin.status === 'active' ? $t('plugin.disablePlugin') : $t('plugin.enablePlugin')"
            >
              <font-awesome-icon
                :icon="[
                  'fas',
                  plugin.status === 'active' ? 'toggle-on' : 'toggle-off',
                ]"
              />
            </button>
            <button
              class="uninstall-btn"
              @click.stop="handleUninstallPlugin(plugin)"
              :title="$t('plugin.uninstallPlugin')"
            >
              <font-awesome-icon :icon="['fas', 'trash']" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 插件网格（商店） -->
    <div v-else class="plugins-grid" ref="pluginsGrid">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ $t("plugin.loading") }}</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <font-awesome-icon :icon="['fas', 'exclamation-triangle']" />
        <p>{{ error }}</p>
        <button class="retry-button" @click="fetchPlugins">
          <font-awesome-icon :icon="['fas', 'redo']" />
          {{ $t("plugin.retry") }}
        </button>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredPlugins.length === 0" class="empty-state">
        <font-awesome-icon :icon="['fas', 'search']" />
        <p>{{ $t("plugin.noResults") }}</p>
      </div>

      <!-- 插件卡片 -->
      <div
        v-else
        v-for="plugin in filteredPlugins"
        :key="plugin.id"
        class="installed-plugin-card store-plugin-card"
        @click="openPluginDetail(plugin)"
      >
        <div class="installed-card-header">
          <div
            class="installed-plugin-icon"
            :class="getPluginTypeClass(plugin.type)"
          >
            <font-awesome-icon :icon="['fas', getPluginIcon(plugin.type)]" />
          </div>
          <div class="installed-plugin-info">
            <h3 class="installed-plugin-name">{{ plugin.name }}</h3>
            <div class="installed-plugin-meta">
              <span
                class="plugin-type-badge"
                :class="getPluginTypeClass(plugin.type)"
              >
                {{ getPluginTypeLabel(plugin.type) }}
              </span>
              <span class="plugin-version">v{{ plugin.version }}</span>
              <span v-if="plugin.locale" class="plugin-locale">{{
                plugin.locale
              }}</span>
            </div>
          </div>
        </div>
        <div class="installed-card-body">
          <p class="installed-plugin-desc">
            {{ plugin.description || t('plugin.noDescription') }}
          </p>
          <div class="installed-plugin-details">
            <span v-if="plugin.author" class="detail-item">
              <font-awesome-icon :icon="['fas', 'user']" />
              {{ plugin.author }}
            </span>
            <span v-if="plugin.localeName" class="detail-item">
              <font-awesome-icon :icon="['fas', 'globe']" />
              {{ plugin.localeName }}
            </span>
          </div>
        </div>
        <div class="installed-card-footer">
          <span v-if="plugin.installed" class="plugin-status active">
            <font-awesome-icon :icon="['fas', 'check-circle']" />
            {{ $t('plugin.installed') }}
          </span>
          <span v-else class="plugin-status inactive">
            <font-awesome-icon :icon="['fas', 'circle']" />
            {{ $t('plugin.notInstalled') }}
          </span>
          <button
            v-if="plugin.installed"
            class="uninstall-btn"
            @click.stop="togglePlugin(plugin)"
            :title="$t('plugin.uninstallPlugin')"
          >
            <font-awesome-icon :icon="['fas', 'trash']" />
          </button>
          <button
            v-else
            class="install-btn"
            @click.stop="installPlugin(plugin)"
            :title="$t('plugin.installPlugin')"
          >
            <font-awesome-icon :icon="['fas', 'download']" />
            {{ $t('plugin.install') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 插件详情模态框 - 重新设计 -->
    <transition name="modal-fade">
      <div
        v-if="selectedPlugin"
        class="plugin-detail-overlay"
        @click="closePluginDetail"
      >
        <div class="plugin-detail-modal" @click.stop>
          <!-- 关闭按钮 -->
          <button class="modal-close-btn" @click="closePluginDetail">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>

          <!-- 头部区域 -->
          <div class="modal-hero">
            <div class="hero-background" :class="getPluginTypeClass(selectedPlugin.type)"></div>
            <div class="hero-content">
              <div class="plugin-icon-wrapper">
                <div class="plugin-icon-glow" :class="getPluginTypeClass(selectedPlugin.type)"></div>
                <div class="plugin-icon-main" :class="getPluginTypeClass(selectedPlugin.type)">
                  <font-awesome-icon :icon="['fas', getPluginIcon(selectedPlugin.type)]" />
                </div>
              </div>
              <div class="plugin-title-section">
                <h1 class="plugin-title">{{ selectedPlugin.name }}</h1>
                <div class="plugin-meta-tags">
                  <span class="meta-tag type-tag" :class="getPluginTypeClass(selectedPlugin.type)">
                    <font-awesome-icon :icon="['fas', getPluginIcon(selectedPlugin.type)]" />
                    {{ getPluginTypeLabel(selectedPlugin.type) }}
                  </span>
                  <span class="meta-tag version-tag">
                    <font-awesome-icon :icon="['fas', 'code-branch']" />
                    v{{ selectedPlugin.version }}
                  </span>
                  <span v-if="selectedPlugin.status" class="meta-tag status-tag" :class="{ active: selectedPlugin.status === 'active' }">
                    <font-awesome-icon :icon="['fas', selectedPlugin.status === 'active' ? 'check-circle' : 'pause-circle']" />
                    {{ selectedPlugin.status === 'active' ? $t('plugin.enabled') : $t('plugin.disabled') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 内容区域 -->
          <div class="modal-content-area">
            <!-- 描述部分 -->
            <div class="content-section">
              <div class="section-header">
                <font-awesome-icon :icon="['fas', 'align-left']" class="section-icon" />
                <h3>{{ $t("plugin.description") }}</h3>
              </div>
              <p class="plugin-description">
                {{ selectedPlugin.description || $t('plugin.noDescription') }}
              </p>
            </div>

            <!-- 详细信息 -->
            <div class="content-section">
              <div class="section-header">
                <font-awesome-icon :icon="['fas', 'info-circle']" class="section-icon" />
                <h3>{{ $t('plugin.detailsTitle') }}</h3>
              </div>
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'user']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t("plugin.author") }}</span>
                    <span class="info-value">{{ selectedPlugin.author || "Unknown" }}</span>
                  </div>
                </div>
                <div v-if="selectedPlugin.license" class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'certificate']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t("plugin.license") }}</span>
                    <span class="info-value">{{ selectedPlugin.license }}</span>
                  </div>
                </div>
                <div v-if="selectedPlugin.locale" class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'language']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t('plugin.languageCode') }}</span>
                    <span class="info-value">{{ selectedPlugin.locale }}</span>
                  </div>
                </div>
                <div v-if="selectedPlugin.localeName" class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'globe']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t('plugin.languageName') }}</span>
                    <span class="info-value">{{ selectedPlugin.localeName }}</span>
                  </div>
                </div>
                <div v-if="selectedPlugin.themeId" class="info-card">
                  <div class="info-icon">
                    <font-awesome-icon :icon="['fas', 'palette']" />
                  </div>
                  <div class="info-text">
                    <span class="info-label">{{ $t('plugin.themeId') }}</span>
                    <span class="info-value">{{ selectedPlugin.themeId }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="modal-actions">
            <!-- 已安装插件的操作 -->
            <template v-if="selectedPlugin.status !== undefined">
              <button
                class="action-btn secondary-btn"
                :class="{ active: selectedPlugin.status === 'active' }"
                @click="handleTogglePluginInModal"
              >
                <font-awesome-icon :icon="['fas', selectedPlugin.status === 'active' ? 'pause' : 'play']" />
                <span>{{ selectedPlugin.status === "active" ? $t('plugin.disablePlugin') : $t('plugin.enablePlugin') }}</span>
              </button>
              <button class="action-btn danger-btn" @click="handleUninstallPluginInModal">
                <font-awesome-icon :icon="['fas', 'trash-alt']" />
                <span>{{ $t('plugin.uninstallPlugin') }}</span>
              </button>
            </template>
            <!-- 商店插件的操作 -->
            <template v-else>
              <button
                v-if="selectedPlugin.installed"
                class="action-btn success-btn full-width"
                @click="togglePlugin(selectedPlugin)"
              >
                <font-awesome-icon :icon="['fas', 'check-circle']" />
                <span>{{ $t("plugin.installed") }}</span>
              </button>
              <button
                v-else
                class="action-btn primary-btn full-width"
                @click="installPlugin(selectedPlugin)"
              >
                <font-awesome-icon :icon="['fas', 'download']" />
                <span>{{ $t("plugin.install") }}</span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </transition>

    <!-- 本地插件安装模态框 - 重新设计 -->
    <transition name="modal-fade">
      <div
        v-if="showLocalInstall"
        class="plugin-detail-overlay"
        @click="closeLocalInstall"
      >
        <div class="local-install-modal" @click.stop>
          <!-- 关闭按钮 -->
          <button class="modal-close-btn" @click="closeLocalInstall">
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>

          <!-- 头部 -->
          <div class="local-modal-header">
            <div class="header-icon">
              <font-awesome-icon :icon="['fas', 'folder-open']" />
            </div>
            <h2>{{ t("plugin.installLocal") }}</h2>
            <p class="header-subtitle">{{ t('plugin.installFromLocal') }}</p>
          </div>

          <!-- 内容区域 -->
          <div class="local-modal-body">
            <div
              class="upload-zone"
              :class="{ dragging: isDragging, loading: localInstallLoading }"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
            >
              <!-- 加载状态 -->
              <div v-if="localInstallLoading" class="upload-state">
                <div class="state-spinner"></div>
                <p class="state-text">{{ $t('plugin.installing') }}</p>
              </div>

              <!-- 成功状态 -->
              <div v-else-if="localInstallSuccess" class="upload-state success">
                <div class="state-icon success">
                  <font-awesome-icon :icon="['fas', 'check-circle']" />
                </div>
                <p class="state-text">{{ localInstallSuccess }}</p>
                <button class="state-button" @click="localInstallSuccess = null">
                  <font-awesome-icon :icon="['fas', 'plus']" />
                  {{ $t('plugin.continueInstall') }}
                </button>
              </div>

              <!-- 错误状态 -->
              <div v-else-if="localInstallError" class="upload-state error">
                <div class="state-icon error">
                  <font-awesome-icon :icon="['fas', 'exclamation-circle']" />
                </div>
                <p class="state-text">{{ localInstallError }}</p>
                <button class="state-button" @click="localInstallError = null">
                  <font-awesome-icon :icon="['fas', 'redo']" />
                  {{ $t('plugin.retry') }}
                </button>
              </div>

              <!-- 默认上传状态 -->
              <template v-else>
                <div class="upload-icon-wrapper">
                  <div class="upload-icon-glow"></div>
                  <div class="upload-icon">
                    <font-awesome-icon :icon="['fas', 'folder-open']" />
                  </div>
                </div>
                <h3 class="upload-title">{{ $t('plugin.selectPluginFolder') }}</h3>
                <p class="upload-description">
                  {{ $t('plugin.selectFolderWithPluginJson') }}
                </p>
                <button class="upload-button primary" @click="selectPluginFolder">
                  <font-awesome-icon :icon="['fas', 'folder-open']" />
                  <span>{{ $t('plugin.browseFolder') }}</span>
                </button>
                <div class="upload-hint">
                  <font-awesome-icon :icon="['fas', 'info-circle']" />
                  <span>{{ $t('plugin.pluginFolderMustContainJson') }}</span>
                </div>
              </template>
            </div>

            <!-- 说明卡片 -->
            <div class="info-cards">
              <div class="info-card-item">
                <div class="card-icon">
                  <font-awesome-icon :icon="['fas', 'folder-tree']" />
                </div>
                <div class="card-content">
                  <h4>{{ $t('plugin.pluginFolderStructure') }}</h4>
                  <p>{{ $t('plugin.pluginJsonRequired') }}</p>
                </div>
              </div>
              <div class="info-card-item">
                <div class="card-icon">
                  <font-awesome-icon :icon="['fas', 'file-code']" />
                </div>
                <div class="card-content">
                  <h4>plugin.json</h4>
                  <p>{{ $t('plugin.pluginJsonMetadata') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { gsap } from "gsap";
import {
  safeModifyBodyStyles,
  protectFloatingButtonPosition,
} from "../utils/floatingButtonProtection.js";
import {
  installLanguagePlugin,
  uninstallLanguagePlugin,
  getInstalledLanguagePlugins,
  installThemePlugin,
  uninstallThemePlugin,
  getInstalledThemePlugins,
  pluginManager,
  PluginStatus,
} from "../plugins";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile, readDir } from "@tauri-apps/plugin-fs";
import storage from "../services/storageService";

// 使用国际化
const { t } = useI18n({ useScope: "global" });

// 检查是否为灰度测试用户
const isBetaUser = computed(() => storage.getItem("pluginSystemBetaUser") === true);

// 秘密解锁相关
const showSecretModal = ref(false);
const secretUnlocked = ref(false);

// 响应式数据
const plugins = ref([]);
const searchQuery = ref("");
const selectedCategory = ref("all");
const selectedPlugin = ref(null);
const showLocalInstall = ref(false);
const loading = ref(false);
const error = ref(null);
const pluginsGrid = ref(null);

// 本地安装相关
const localInstallLoading = ref(false);
const localInstallError = ref(null);
const localInstallSuccess = ref(null);
const isDragging = ref(false);

// 已安装插件列表
const installedPluginsList = ref([]);

// 秘密解锁功能 - 点击图标解锁插件系统
const handleSecretClick = () => {
  if (!isBetaUser.value) {
    showSecretModal.value = true;
  }
};

const confirmSecretUnlock = () => {
  storage.setItem("pluginSystemBetaUser", true);
  storage.removeItem("pluginSystemBetaNotified"); // 允许显示欢迎弹窗
  secretUnlocked.value = true;
  
  // 延迟关闭模态框并刷新页面
  setTimeout(() => {
    showSecretModal.value = false;
    // 刷新页面以重新初始化插件系统
    window.location.reload();
  }, 1500);
};

const cancelSecretUnlock = () => {
  showSecretModal.value = false;
};

// 分类数据
const categories = ref([
  { id: "all", name: t("plugin.all") },
  { id: "installed", name: t("plugin.installed") },
]);

// 刷新已安装插件列表
const refreshInstalledPlugins = () => {
  const plugins = pluginManager.getAllPlugins();
  console.log(
    "🔄 刷新已安装插件列表:",
    plugins.length,
    plugins.map((p) => p.id)
  );
  installedPluginsList.value = [...plugins];
};

// 获取插件类型图标
const getPluginIcon = (type) => {
  const icons = {
    language: "globe",
    theme: "palette",
    feature: "puzzle-piece",
  };
  return icons[type] || "puzzle-piece";
};

// 获取插件类型样式类
const getPluginTypeClass = (type) => {
  return `type-${type || "feature"}`;
};

// 获取插件类型标签
const getPluginTypeLabel = (type) => {
  const key = `plugin.type.${type}`;
  const translated = t(key);
  // 如果翻译不存在，返回默认值
  return translated !== key ? translated : t("plugin.type.plugin");
};

// 插件索引 URL
const PLUGIN_INDEX_URL =
  "https://raw.githubusercontent.com/Eververdants/ETBSaveManager/master/plugins/plugins.json";

// 获取插件数据
const fetchPlugins = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(PLUGIN_INDEX_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    // 获取已安装的插件
    const installedPlugins = getInstalledLanguagePlugins();
    const installedIds = new Set(installedPlugins.map((p) => p.id));

    plugins.value = data.plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      author: plugin.author,
      version: plugin.version,
      license: plugin.license,
      downloadUrl: plugin.downloadUrl || plugin.download_url,
      icon: plugin.icon || getIconForPlugin(plugin.id),
      category: plugin.category || "utility",
      installed: installedIds.has(plugin.id),
      type: plugin.type || "feature",
      locale: plugin.locale,
      localeName: plugin.localeName,
    }));
  } catch (err) {
    console.error("获取插件数据失败:", err);
    error.value = "获取插件列表失败，请检查网络连接";
    plugins.value = [];
  } finally {
    loading.value = false;
  }
};

// 根据插件ID获取合适的图标
const getIconForPlugin = (pluginId) => {
  const iconMap = {
    backup: "cloud-download-alt",
    sync: "sync",
    editor: "edit",
    security: "shield-alt",
    analytics: "chart-line",
    example: "puzzle-piece",
    lang: "globe",
    language: "globe",
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (pluginId.includes(key)) {
      return icon;
    }
  }

  return "puzzle-piece"; // 默认图标
};

// 计算属性
const filteredPlugins = computed(() => {
  let filtered = plugins.value;

  // 搜索过滤
  if (searchQuery.value) {
    filtered = filtered.filter(
      (plugin) =>
        plugin.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        plugin.description
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase())
    );
  }

  // 分类过滤
  if (selectedCategory.value !== "all") {
    filtered = filtered.filter(
      (plugin) => plugin.category === selectedCategory.value
    );
  }

  return filtered;
});

// 方法
const selectCategory = (categoryId) => {
  selectedCategory.value = categoryId;
  animateCards();
};

const openPluginDetail = (plugin) => {
  selectedPlugin.value = plugin;

  // 使用全局保护工具安全修改body样式
  safeModifyBodyStyles(() => {
    document.body.style.overflow = "hidden";
  });
};

const closePluginDetail = () => {
  selectedPlugin.value = null;

  // 使用全局保护工具安全修改body样式
  safeModifyBodyStyles(() => {
    document.body.style.overflow = "";
  });

  // 使用全局保护工具确保浮动按钮位置正确
  protectFloatingButtonPosition();
};

// 打开已安装插件详情
const openInstalledPluginDetail = (plugin) => {
  selectedPlugin.value = plugin;
  safeModifyBodyStyles(() => {
    document.body.style.overflow = "hidden";
  });
};

// 在模态框中切换插件状态
const handleTogglePluginInModal = async () => {
  if (!selectedPlugin.value) return;
  await handleTogglePlugin(selectedPlugin.value);
  // 刷新选中的插件状态
  const updated = pluginManager.getPlugin(selectedPlugin.value.id);
  if (updated) {
    selectedPlugin.value = { ...updated };
  }
};

// 在模态框中卸载插件
const handleUninstallPluginInModal = async () => {
  if (!selectedPlugin.value) return;
  const pluginName = selectedPlugin.value.name;
  await handleUninstallPlugin(selectedPlugin.value);
  closePluginDetail();
  console.log(`✅ 已卸载插件: ${pluginName}`);
};

const installPlugin = async (plugin) => {
  console.log("📦 开始安装插件:", plugin.id, plugin);

  try {
    // 如果是语言插件，从远程下载并安装
    if (plugin.type === "language" && plugin.downloadUrl) {
      // 构建翻译文件的URL（downloadUrl是插件文件夹路径）
      const translationsUrl = `${plugin.downloadUrl}/translations.json`;
      console.log("📥 下载翻译文件:", translationsUrl);

      const response = await fetch(translationsUrl);

      if (!response.ok) {
        throw new Error(`下载翻译文件失败: HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ 翻译数据下载成功:", Object.keys(data));

      await installLanguagePlugin({
        id: plugin.id,
        name: plugin.name,
        locale: plugin.locale,
        localeName: plugin.localeName,
        data: data,
        version: plugin.version,
        author: plugin.author,
        description: plugin.description,
      });

      console.log("✅ 插件安装成功:", plugin.id);
      plugin.installed = true;
      refreshInstalledPlugins();
    } else if (plugin.type === "theme" && plugin.downloadUrl) {
      // 构建主题文件的URL
      const themeUrl = `${plugin.downloadUrl}/theme.json`;
      console.log("📥 下载主题文件:", themeUrl);

      const response = await fetch(themeUrl);

      if (!response.ok) {
        throw new Error(`下载主题文件失败: HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ 主题数据下载成功");

      await installThemePlugin({
        id: plugin.id,
        name: plugin.name,
        themeId: plugin.themeId || plugin.id,
        data: data,
        version: plugin.version,
        author: plugin.author,
        description: plugin.description,
      });

      console.log("✅ 主题插件安装成功:", plugin.id);
      plugin.installed = true;
      
      // 通知主题插件变化
      window.dispatchEvent(new CustomEvent("theme-plugin-changed"));
      
      refreshInstalledPlugins();
    } else {
      console.warn(
        "⚠️ 不支持的插件类型或缺少下载链接:",
        plugin.type,
        plugin.downloadUrl
      );
    }

    animateButton(plugin);
  } catch (err) {
    console.error("❌ 安装插件失败:", err);
    alert(`安装插件失败: ${err.message}`);
  }
};

const togglePlugin = async (plugin) => {
  if (plugin.installed) {
    // 卸载插件
    try {
      if (plugin.type === "language") {
        await uninstallLanguagePlugin(plugin.id);
      } else if (plugin.type === "theme") {
        await uninstallThemePlugin(plugin.id);
        window.dispatchEvent(new CustomEvent("theme-plugin-changed"));
      } else {
        await pluginManager.removePlugin(plugin.id);
      }
      plugin.installed = false;
      refreshInstalledPlugins();
    } catch (err) {
      console.error("卸载插件失败:", err);
    }
  } else {
    await installPlugin(plugin);
  }
};

const openLocalInstall = () => {
  showLocalInstall.value = true;
  localInstallError.value = null;
  localInstallSuccess.value = null;
};

const closeLocalInstall = () => {
  showLocalInstall.value = false;
  localInstallError.value = null;
  localInstallSuccess.value = null;
};

// 选择插件文件夹
const selectPluginFolder = async () => {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: t("plugin.selectPluginFolder"),
    });

    if (selected) {
      await processPluginFolder(selected);
    }
  } catch (err) {
    console.error("选择文件夹失败:", err);
    localInstallError.value = `${t('plugin.selectFolderFailed')}: ${err.message}`;
  }
};

// 处理拖拽
const handleDragOver = (event) => {
  event.preventDefault();
  isDragging.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  isDragging.value = false;
};

const handleDrop = async (event) => {
  event.preventDefault();
  isDragging.value = false;

  // 拖拽暂不支持文件夹，提示用户使用按钮
  localInstallError.value = "请点击「选择文件夹」按钮来选择插件目录";
};

// 处理插件文件夹
const processPluginFolder = async (folderPath) => {
  localInstallLoading.value = true;
  localInstallError.value = null;
  localInstallSuccess.value = null;

  try {
    // 读取 plugin.json 元数据文件
    const pluginJsonPath = `${folderPath}/plugin.json`;
    let pluginMeta;

    try {
      const metaContent = await readTextFile(pluginJsonPath);
      pluginMeta = JSON.parse(metaContent);
    } catch (err) {
      localInstallError.value =
        "未找到 plugin.json 文件，请确保选择了正确的插件文件夹";
      return;
    }

    // 验证元数据
    if (!pluginMeta.id || !pluginMeta.type || !pluginMeta.name) {
      localInstallError.value =
        "plugin.json 格式无效，缺少必需字段（id, type, name）";
      return;
    }

    // 检查插件是否已安装
    const existingPlugin = pluginManager.getPlugin(pluginMeta.id);
    if (existingPlugin) {
      localInstallError.value = `插件「${pluginMeta.name}」已安装`;
      return;
    }

    // 根据插件类型处理
    if (pluginMeta.type === "language") {
      await processLanguagePlugin(folderPath, pluginMeta);
    } else if (pluginMeta.type === "theme") {
      await processThemePlugin(folderPath, pluginMeta);
    } else {
      localInstallError.value = `暂不支持的插件类型: ${pluginMeta.type}`;
    }
  } catch (err) {
    console.error("处理插件文件夹失败:", err);
    localInstallError.value = `安装失败: ${err.message}`;
  } finally {
    localInstallLoading.value = false;
  }
};

// 处理语言插件
const processLanguagePlugin = async (folderPath, pluginMeta) => {
  // 读取翻译数据文件
  const mainFile = pluginMeta.main || "translations.json";
  const translationsPath = `${folderPath}/${mainFile}`;

  let translationsData;
  try {
    const content = await readTextFile(translationsPath);
    translationsData = JSON.parse(content);
  } catch (err) {
    localInstallError.value = `未找到翻译文件 ${mainFile}，请确保插件文件夹结构正确`;
    return;
  }

  // 验证翻译数据
  if (!translationsData || typeof translationsData !== "object") {
    localInstallError.value = t("plugin.invalidTranslationFile");
    return;
  }

  // 安装语言插件
  await installLanguagePlugin({
    id: pluginMeta.id,
    name: pluginMeta.name,
    locale: pluginMeta.locale,
    localeName: pluginMeta.localeName || pluginMeta.name,
    data: translationsData,
    version: pluginMeta.version || "1.0.0",
    author: pluginMeta.author || "Unknown",
    description: pluginMeta.description || "",
  });

  localInstallSuccess.value = `成功安装语言插件: ${pluginMeta.name}`;

  // 刷新插件列表
  await fetchPlugins();
  refreshInstalledPlugins();
};

// 处理主题插件
const processThemePlugin = async (folderPath, pluginMeta) => {
  // 读取主题数据文件
  const mainFile = pluginMeta.main || "theme.json";
  const themePath = `${folderPath}/${mainFile}`;

  let themeData;
  try {
    const content = await readTextFile(themePath);
    themeData = JSON.parse(content);
  } catch (err) {
    localInstallError.value = `未找到主题文件 ${mainFile}，请确保插件文件夹结构正确`;
    return;
  }

  // 验证主题数据
  if (!themeData || typeof themeData !== "object") {
    localInstallError.value = t("plugin.invalidThemeFile");
    return;
  }

  // 安装主题插件
  await installThemePlugin({
    id: pluginMeta.id,
    name: pluginMeta.name,
    themeId: pluginMeta.themeId || pluginMeta.id,
    data: themeData,
    version: pluginMeta.version || "1.0.0",
    author: pluginMeta.author || "Unknown",
    description: pluginMeta.description || "",
  });

  localInstallSuccess.value = `成功安装主题插件: ${pluginMeta.name}`;

  // 通知主题插件变化
  window.dispatchEvent(new CustomEvent("theme-plugin-changed"));

  // 刷新插件列表
  await fetchPlugins();
  refreshInstalledPlugins();
};

// 卸载插件
const handleUninstallPlugin = async (plugin) => {
  try {
    if (plugin.type === "language") {
      await uninstallLanguagePlugin(plugin.id);
    } else if (plugin.type === "theme") {
      await uninstallThemePlugin(plugin.id);
      // 通知主题插件变化
      window.dispatchEvent(new CustomEvent("theme-plugin-changed"));
    } else {
      await pluginManager.removePlugin(plugin.id);
    }
    refreshInstalledPlugins();
    // 更新商店列表中对应插件的安装状态
    const storePlugin = plugins.value.find((p) => p.id === plugin.id);
    if (storePlugin) {
      storePlugin.installed = false;
    }
    console.log(`✅ 已卸载插件: ${plugin.name}`);
  } catch (err) {
    console.error("卸载插件失败:", err);
  }
};

// 启用/禁用插件
const handleTogglePlugin = async (plugin) => {
  try {
    if (plugin.status === "active") {
      // 禁用插件
      await pluginManager.unloadPlugin(plugin.id);
      console.log(`⏸️ 已禁用插件: ${plugin.name}`);
    } else {
      // 启用插件
      await pluginManager.loadPlugin(plugin.id);
      console.log(`▶️ 已启用插件: ${plugin.name}`);
    }
    // 如果是主题插件，通知变化
    if (plugin.type === "theme") {
      window.dispatchEvent(new CustomEvent("theme-plugin-changed"));
    }
    refreshInstalledPlugins();
  } catch (err) {
    console.error("切换插件状态失败:", err);
  }
};

// GSAP 动画
const animateCards = async () => {
  await nextTick();
  if (pluginsGrid.value) {
    const cards = pluginsGrid.value.querySelectorAll(".plugin-card");
    // 只有当有卡片时才执行动画
    if (cards && cards.length > 0) {
      gsap.fromTo(
        cards,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" }
      );
    }
  }
};

const animateButton = (plugin) => {
  const button = event?.target;
  if (button) {
    gsap.to(button, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
  }
};

// 生命周期
onMounted(async () => {
  // 先加载已安装的插件（本地数据，不依赖网络）
  refreshInstalledPlugins();
  // 再获取商店插件列表（网络请求，可能失败）
  await fetchPlugins();
  animateCards();
});
</script>

<style scoped>
/* 灰度测试未开放提示 */
.beta-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  min-height: 400px;
}

.beta-notice-icon {
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  background: var(--bg-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.beta-notice-icon:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.beta-notice-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.beta-notice-message {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 500px;
}

/* 秘密解锁模态框 */
.secret-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

.secret-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #ffd700;
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.2);
  animation: slideUpBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
  overflow: hidden;
}

.secret-modal::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
  animation: rotate 10s linear infinite;
}

.secret-modal-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #1a1a2e;
  box-shadow: 0 8px 20px rgba(255, 215, 0, 0.4);
  animation: pulse 2s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

.secret-modal-title {
  font-size: 26px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 16px;
  color: #ffd700;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
  position: relative;
  z-index: 1;
}

.secret-modal-message {
  font-size: 18px;
  text-align: center;
  color: #e0e0e0;
  line-height: 1.6;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.secret-modal-hint {
  font-size: 16px;
  text-align: center;
  color: #ffed4e;
  line-height: 1.6;
  margin-bottom: 32px;
  font-style: italic;
  position: relative;
  z-index: 1;
}

.secret-modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.secret-btn {
  padding: 14px 32px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.secret-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.secret-btn:hover::before {
  width: 300px;
  height: 300px;
}

.secret-btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #e0e0e0;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.secret-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.secret-btn-confirm {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #1a1a2e;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
}

.secret-btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.6);
}

.secret-btn-confirm:active {
  transform: translateY(0);
}

.secret-unlocked {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: rgba(76, 175, 80, 0.2);
  border: 2px solid #4caf50;
  border-radius: 12px;
  color: #4caf50;
  font-size: 18px;
  font-weight: 600;
  animation: successPulse 1s ease-in-out;
  position: relative;
  z-index: 1;
}

.secret-unlocked svg {
  font-size: 24px;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUpBounce {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.8);
  }
  50% {
    transform: translateY(-10px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes successPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 主容器 */
.plugin-market {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 插件市场内容容器 */
.plugin-market-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* 搜索栏 - 优化版 */
.search-container {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  align-items: center;
}

.search-bar {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 14px 20px 14px 50px;
  border: 2px solid var(--border-color);
  border-radius: 16px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
  background: var(--bg-primary);
}

.search-input:focus + .search-icon {
  color: var(--accent-color);
}

.filter-button {
  padding: 12px 16px;
  border: none;
  border-radius: 18px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.filter-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 本地安装按钮 */
.local-install-button {
  padding: 12px 16px;
  border: none;
  border-radius: 18px;
  background: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.7);
  border: 1px solid rgba(128, 128, 128, 0.2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.local-install-button:hover {
  background: rgba(128, 128, 128, 0.2);
  color: rgba(128, 128, 128, 0.9);
  border: 1px solid rgba(128, 128, 128, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-tab {
  padding: 8px 16px;
  border: none;
  border-radius: 18px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.category-tab:hover {
  background: var(--bg-tertiary);
}

.category-tab.active {
  background: var(--accent-color);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

/* 插件网格 */
.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  padding-bottom: 20px;
}

/* 限制最大列数，避免卡片过多 */
@media (min-width: 1400px) {
  .plugins-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1000px) and (max-width: 1399px) {
  .plugins-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 999px) {
  .plugins-grid {
    grid-template-columns: 1fr;
  }
}

/* 自定义滚动条 */
.plugins-grid::-webkit-scrollbar {
  width: 8px;
}

.plugins-grid::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.plugins-grid::-webkit-scrollbar-thumb {
  background: var(--accent-color);
  border-radius: 4px;
}

.plugins-grid::-webkit-scrollbar-thumb:hover {
  background: var(--accent-hover);
}

.plugin-card {
  background: var(--bg-secondary);
  border-radius: 18px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.plugin-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 加载、错误、空状态 - 重新设计 */
.loading-state,
.error-state,
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 32px;
  text-align: center;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 56px;
  height: 56px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.2);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state p,
.error-state p,
.empty-state p {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.error-state svg,
.empty-state svg {
  font-size: 64px;
  margin-bottom: 20px;
  color: var(--text-tertiary);
  opacity: 0.5;
}

.error-state svg {
  color: #ff9f0a;
  opacity: 0.8;
}

.retry-button {
  margin-top: 20px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4);
}

.empty-hint {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-top: 12px;
}

.plugin-icon {
  width: 48px;
  height: 48px;
  background: var(--accent-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  margin-bottom: 16px;
}

.plugin-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.plugin-description {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plugin-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.plugin-author {
  font-size: 13px;
  color: var(--text-tertiary);
}

.plugin-rating {
  font-size: 13px;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.plugin-rating svg {
  color: #ffd700;
}

.plugin-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  align-items: center;
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  font-weight: 500;
  background: rgba(128, 128, 128, 0.1);
  color: rgba(128, 128, 128, 0.7);
  border: 1px solid rgba(128, 128, 128, 0.2);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.action-btn.install {
  background: rgba(52, 199, 89, 0.1);
  color: rgba(52, 199, 89, 0.7);
  border: 1px solid rgba(52, 199, 89, 0.2);
}

.action-btn.install:hover {
  background: rgba(52, 199, 89, 0.2);
  color: #34c759;
  border: 1px solid rgba(52, 199, 89, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.action-btn.installed {
  background: rgba(0, 122, 255, 0.1);
  color: rgba(0, 122, 255, 0.7);
  border: 1px solid rgba(0, 122, 255, 0.2);
}

.action-btn.installed:hover {
  background: rgba(0, 122, 255, 0.2);
  color: #007aff;
  border: 1px solid rgba(0, 122, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.action-btn.uninstall {
  background: rgba(255, 59, 48, 0.1);
  color: rgba(255, 59, 48, 0.7);
  border: 1px solid rgba(255, 59, 48, 0.2);
}

.action-btn.uninstall:hover {
  background: rgba(255, 59, 48, 0.2);
  color: #ff3b30;
  border: 1px solid rgba(255, 59, 48, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 59, 48, 0.15);
}

/* 已安装插件卡片 */
.installed-card {
  border: 1px solid var(--border-color);
}

.plugin-icon.icon-language {
  background: linear-gradient(135deg, #007aff, #5856d6);
}

/* 新版已安装插件卡片样式 - 优化版 */
.installed-plugin-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 0;
  height: 240px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: pointer;
}

.installed-plugin-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.installed-plugin-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
  border-color: var(--accent-color);
}

.installed-plugin-card:hover::before {
  opacity: 1;
}

.installed-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.installed-plugin-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
}

.installed-plugin-card:hover .installed-plugin-icon {
  transform: scale(1.1) rotate(5deg);
}

.installed-plugin-icon.type-language {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.installed-plugin-icon.type-theme {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.installed-plugin-icon.type-feature {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.installed-plugin-info {
  flex: 1;
  min-width: 0;
}

.installed-plugin-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.3px;
}

.installed-plugin-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.plugin-type-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 8px;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.plugin-type-badge.type-language {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.plugin-type-badge.type-theme {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.plugin-type-badge.type-feature {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.plugin-version {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.plugin-locale {
  font-size: 11px;
  font-weight: 600;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.installed-card-body {
  padding: 16px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.installed-plugin-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 12px 0;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.installed-plugin-details {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: auto;
}

.detail-item {
  font-size: 12px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: 6px;
}

.detail-item svg {
  font-size: 11px;
  color: var(--accent-color);
}

.installed-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
}

.plugin-status {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.plugin-status.active {
  color: #34c759;
}

.plugin-status.inactive {
  color: var(--text-tertiary);
}

.plugin-status svg {
  font-size: 14px;
}

/* 卸载按钮 - 优化版 */
.uninstall-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 15px;
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.uninstall-btn:hover {
  background: rgba(255, 59, 48, 0.2);
  border-color: rgba(255, 59, 48, 0.4);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

/* 插件操作按钮组 */
.plugin-actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 启用/禁用开关按钮 - 优化版 */
.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toggle-btn.enabled {
  color: #34c759;
  background: rgba(52, 199, 89, 0.1);
  border-color: rgba(52, 199, 89, 0.3);
}

.toggle-btn.enabled:hover {
  color: #ff9500;
  background: rgba(255, 149, 0, 0.1);
  border-color: rgba(255, 149, 0, 0.3);
}

/* 安装按钮 - 优化版 */
.install-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #34c759, #30d158);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(52, 199, 89, 0.3);
}

.install-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.4);
}

.toggle-btn.enabled {
  color: #34c759;
}

.toggle-btn.enabled:hover {
  color: #ff9500;
}

/* 安装按钮 */
.install-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #34c759;
  background: rgba(52, 199, 89, 0.1);
  border: 1px solid rgba(52, 199, 89, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.install-btn:hover {
  background: rgba(52, 199, 89, 0.2);
  border-color: rgba(52, 199, 89, 0.3);
  transform: translateY(-1px);
}

/* 商店插件卡片 - 可点击样式 */
.store-plugin-card {
  cursor: pointer;
}

/* 标签徽章 */
.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  margin-left: 6px;
  font-size: 11px;
  font-weight: 600;
  background: var(--accent-color);
  color: white;
  border-radius: 9px;
}

/* 空状态提示 */
.empty-hint {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 8px;
}

.action-button {
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-button.install {
  background: var(--accent-color);
  color: white;
}

.action-button.install:hover {
  background: var(--accent-hover);
}

.action-button.installed {
  background: var(--success-color);
  color: white;
}

.action-button.installed:hover {
  background: #28a745;
}

.action-button.large {
  padding: 12px 24px;
  font-size: 16px;
}

/* 模态框 */
.plugin-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 24px;
  max-width: 750px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 32px 96px rgba(0, 0, 0, 0.5), 
              0 8px 32px rgba(0, 0, 0, 0.3),
              0 0 1px rgba(255, 255, 255, 0.1) inset;
  animation: modalSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  margin: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.92);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px 36px;
  border-bottom: 1px solid var(--divider-color);
  flex-shrink: 0;
  background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
}

.plugin-icon-large {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
  flex-shrink: 0;
  box-shadow: 0 12px 32px rgba(0, 122, 255, 0.35),
              0 4px 12px rgba(0, 122, 255, 0.2);
  transition: transform 0.3s ease;
}

.plugin-icon-large:hover {
  transform: scale(1.05) rotate(5deg);
}

.plugin-info {
  flex: 1;
  min-width: 0;
}

.plugin-info h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.plugin-author-detail {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.close-button {
  padding: 10px;
  border: none;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 22px;
  border-radius: 12px;
  transition: all 0.2s ease;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: scale(1.05);
}

.modal-body {
  padding: 32px 36px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: var(--accent-color) var(--bg-tertiary);
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: var(--accent-color);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--accent-hover);
}

.plugin-screenshots {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  overflow-x: auto;
}

.screenshot {
  width: 200px;
  height: 120px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

.plugin-details h3 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  padding-bottom: 14px;
  border-bottom: 2px solid var(--divider-color);
  display: flex;
  align-items: center;
  gap: 10px;
}

.plugin-details h3::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, var(--accent-color), var(--accent-hover));
  border-radius: 2px;
}

.plugin-full-desc {
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 24px;
  font-size: 15px;
}

.plugin-info-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-tertiary);
  border-radius: 14px;
  transition: all 0.25s ease;
  border: 1px solid transparent;
}

.info-item:hover {
  background: var(--bg-hover);
  transform: translateX(6px);
  border-color: var(--accent-color);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
}

.info-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 100px;
  font-size: 14px;
}

.info-value {
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 500;
}

.status-active {
  color: #34c759;
  font-weight: 600;
}

.plugin-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 24px;
}

.stat {
  text-align: center;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 12px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-footer {
  padding: 24px 36px;
  border-top: 1px solid var(--divider-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: linear-gradient(180deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  flex-shrink: 0;
}

/* 现代本地安装样式 */
.local-install-area {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.upload-zone-modern {
  text-align: center;
  padding: 48px 32px;
  border: 2px dashed var(--border-color);
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--bg-tertiary) 100%
  );
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-zone-modern:hover {
  border-color: var(--accent-color);
  background: linear-gradient(
    135deg,
    var(--bg-tertiary) 0%,
    var(--bg-secondary) 100%
  );
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.upload-zone-modern.dragging {
  border-color: var(--accent-color);
  background: linear-gradient(
    135deg,
    rgba(0, 122, 255, 0.1) 0%,
    rgba(0, 122, 255, 0.05) 100%
  );
  transform: scale(1.02);
  box-shadow: 0 8px 32px rgba(0, 122, 255, 0.2);
}

.upload-zone-modern.loading {
  pointer-events: none;
  opacity: 0.8;
}

.upload-loading,
.upload-success,
.upload-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-loading .loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--divider-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.success-icon {
  font-size: 64px;
  color: #34c759;
}

.error-icon {
  font-size: 64px;
  color: #ff3b30;
}

.upload-icon-container {
  margin-bottom: 16px;
}

.upload-icon-modern {
  font-size: 64px;
  color: var(--accent-color);
  margin-bottom: 8px;
  filter: drop-shadow(0 4px 8px rgba(0, 122, 255, 0.3));
}

.upload-zone-modern h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.upload-description {
  margin: 0 0 24px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.upload-button {
  display: inline-block;
  padding: 12px 24px;
  background: var(--accent-color);
  color: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 16px;
}

.upload-button:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.file-input-hidden {
  display: none;
}

.drag-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.install-info-modern {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.info-icon {
  font-size: 32px;
  color: var(--accent-color);
  flex-shrink: 0;
}

.info-content h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.info-content p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plugin-market {
    padding: 16px;
  }

  .market-title {
    font-size: 28px;
  }

  .search-container {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-button {
    align-self: flex-end;
  }

  .category-tabs {
    overflow-x: scroll;
    -webkit-overflow-scrolling: touch;
  }

  .modal-content {
    margin: 0;
    border-radius: 0;
    height: 100%;
    max-height: 100%;
  }

  .filter-content {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .plugin-market {
    padding: 12px;
  }

  .plugins-grid {
    gap: 16px;
  }

  .plugin-card {
    padding: 16px;
  }

  .plugin-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

/* 插件信息列表 */
.plugin-info-list {
  margin-top: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--divider-color);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: var(--text-primary);
}

.info-value {
  color: var(--text-secondary);
}

/* 模态框中的大图标类型样式 */
.plugin-icon-large.type-language {
  background: linear-gradient(135deg, #007aff, #5856d6);
}

.plugin-icon-large.type-theme {
  background: linear-gradient(135deg, #ff9500, #ff2d55);
}

.plugin-icon-large.type-feature {
  background: linear-gradient(135deg, #34c759, #30d158);
}

/* 完整描述（无截断） */
.plugin-full-desc {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 状态激活样式 */
.status-active {
  color: #34c759;
  font-weight: 500;
}

/* 模态框操作按钮 */
.action-button.toggle-action {
  background: rgba(0, 122, 255, 0.1);
  color: #007aff;
  border: 1px solid rgba(0, 122, 255, 0.2);
}

.action-button.toggle-action:hover {
  background: rgba(0, 122, 255, 0.2);
  border-color: rgba(0, 122, 255, 0.3);
}

.action-button.toggle-action.enabled {
  background: rgba(255, 149, 0, 0.1);
  color: #ff9500;
  border: 1px solid rgba(255, 149, 0, 0.2);
}

.action-button.toggle-action.enabled:hover {
  background: rgba(255, 149, 0, 0.2);
  border-color: rgba(255, 149, 0, 0.3);
}

.action-button.uninstall-action {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
  border: 1px solid rgba(255, 59, 48, 0.2);
}

.action-button.uninstall-action:hover {
  background: rgba(255, 59, 48, 0.2);
}

/* ==================== 插件详情模态框 - 全新设计 ==================== */

/* 模态框过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .plugin-detail-modal,
.modal-fade-leave-active .plugin-detail-modal {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.modal-fade-enter-from .plugin-detail-modal,
.modal-fade-leave-to .plugin-detail-modal {
  transform: scale(0.9) translateY(20px);
  opacity: 0;
}

/* 遮罩层 */
.plugin-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  overflow-y: auto;
}

/* 模态框主体 */
.plugin-detail-modal {
  position: relative;
  width: 100%;
  max-width: 680px;
  background: var(--bg-secondary);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  margin: auto;
}

/* 关闭按钮 */
.modal-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.6);
  transform: rotate(90deg) scale(1.1);
}

/* 头部英雄区域 */
.modal-hero {
  position: relative;
  padding: 48px 32px 32px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.15;
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-hover) 100%);
}

.hero-background.type-language {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hero-background.type-theme {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.hero-background.type-feature {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.hero-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
}

/* 插件图标 */
.plugin-icon-wrapper {
  position: relative;
  flex-shrink: 0;
}

.plugin-icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.6;
  background: var(--accent-color);
}

.plugin-icon-glow.type-language {
  background: #667eea;
}

.plugin-icon-glow.type-theme {
  background: #f093fb;
}

.plugin-icon-glow.type-feature {
  background: #4facfe;
}

.plugin-icon-main {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: white;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.plugin-icon-main.type-language {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.plugin-icon-main.type-theme {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.plugin-icon-main.type-feature {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* 标题区域 */
.plugin-title-section {
  flex: 1;
  min-width: 0;
}

.plugin-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  line-height: 1.2;
}

.plugin-meta-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.meta-tag svg {
  font-size: 12px;
}

.type-tag.type-language {
  background: rgba(102, 126, 234, 0.15);
  color: #667eea;
  border-color: rgba(102, 126, 234, 0.3);
}

.type-tag.type-theme {
  background: rgba(240, 147, 251, 0.15);
  color: #f093fb;
  border-color: rgba(240, 147, 251, 0.3);
}

.type-tag.type-feature {
  background: rgba(79, 172, 254, 0.15);
  color: #4facfe;
  border-color: rgba(79, 172, 254, 0.3);
}

.version-tag {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.3);
}

.status-tag {
  background: rgba(255, 159, 10, 0.15);
  color: #ff9f0a;
  border-color: rgba(255, 159, 10, 0.3);
}

.status-tag.active {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
  border-color: rgba(52, 199, 89, 0.3);
}

/* 内容区域 */
.modal-content-area {
  padding: 0 32px 24px;
  max-height: 400px;
  overflow-y: auto;
}

.modal-content-area::-webkit-scrollbar {
  width: 6px;
}

.modal-content-area::-webkit-scrollbar-track {
  background: transparent;
}

.modal-content-area::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.modal-content-area::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* 内容区块 */
.content-section {
  margin-bottom: 28px;
}

.content-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.section-icon {
  font-size: 18px;
  color: var(--accent-color);
}

.section-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.plugin-description {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-secondary);
  margin: 0;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border-left: 3px solid var(--accent-color);
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.info-card:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.info-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 底部操作栏 */
.modal-actions {
  padding: 20px 32px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.action-btn:hover::before {
  width: 300px;
  height: 300px;
}

.action-btn svg {
  font-size: 16px;
  position: relative;
  z-index: 1;
}

.action-btn span {
  position: relative;
  z-index: 1;
}

.action-btn.full-width {
  flex: 1 1 100%;
}

/* 主要按钮 */
.primary-btn {
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4);
}

.primary-btn:active {
  transform: translateY(0);
}

/* 次要按钮 */
.secondary-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.secondary-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.secondary-btn.active {
  background: rgba(52, 199, 89, 0.15);
  border-color: #34c759;
  color: #34c759;
}

/* 成功按钮 */
.success-btn {
  background: linear-gradient(135deg, #34c759, #30d158);
  color: white;
  box-shadow: 0 4px 16px rgba(52, 199, 89, 0.3);
}

.success-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(52, 199, 89, 0.4);
}

/* 危险按钮 */
.danger-btn {
  background: linear-gradient(135deg, #ff3b30, #ff453a);
  color: white;
  box-shadow: 0 4px 16px rgba(255, 59, 48, 0.3);
}

.danger-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(255, 59, 48, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .plugin-detail-modal {
    max-width: 100%;
    border-radius: 20px;
  }

  .modal-hero {
    padding: 40px 24px 24px;
  }

  .hero-content {
    flex-direction: column;
    text-align: center;
  }

  .plugin-title {
    font-size: 24px;
  }

  .plugin-meta-tags {
    justify-content: center;
  }

  .modal-content-area {
    padding: 0 24px 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    padding: 16px 24px;
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}

/* ==================== 本地安装模态框样式 ==================== */

.local-install-modal {
  position: relative;
  width: 100%;
  max-width: 600px;
  background: var(--bg-secondary);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 
    0 32px 64px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  margin: auto;
}

.local-modal-header {
  padding: 40px 32px 32px;
  text-align: center;
  background: linear-gradient(180deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border-bottom: 1px solid var(--border-color);
}

.header-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
}

.local-modal-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.header-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.local-modal-body {
  padding: 32px;
}

/* 上传区域 */
.upload-zone {
  padding: 48px 32px;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  background: var(--bg-tertiary);
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 24px;
}

.upload-zone.dragging {
  border-color: var(--accent-color);
  background: rgba(0, 122, 255, 0.05);
  transform: scale(1.02);
}

.upload-zone.loading {
  pointer-events: none;
  opacity: 0.7;
}

/* 上传图标 */
.upload-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.upload-icon-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent-color);
  filter: blur(30px);
  opacity: 0.4;
}

.upload-icon {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
}

.upload-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.upload-description {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 24px 0;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.upload-button.primary {
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.upload-button:hover {
  transform: translateY(-2px);
}

.upload-button.primary:hover {
  box-shadow: 0 6px 24px rgba(0, 122, 255, 0.4);
}

.upload-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-tertiary);
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.upload-hint svg {
  font-size: 14px;
  color: var(--accent-color);
}

/* 状态显示 */
.upload-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.state-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.state-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.state-icon.success {
  background: rgba(52, 199, 89, 0.15);
  color: #34c759;
}

.state-icon.error {
  background: rgba(255, 59, 48, 0.15);
  color: #ff3b30;
}

.state-text {
  font-size: 15px;
  color: var(--text-primary);
  margin: 0;
}

.state-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 2px solid var(--border-color);
}

.state-button:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

/* 信息卡片 */
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.info-card-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: var(--bg-tertiary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.info-card-item:hover {
  background: var(--bg-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-content h4 {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 6px 0;
}

.card-content p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 768px) {
  .local-install-modal {
    max-width: 100%;
    border-radius: 20px;
  }

  .local-modal-header {
    padding: 32px 24px 24px;
  }

  .local-modal-body {
    padding: 24px;
  }

  .upload-zone {
    padding: 40px 24px;
  }

  .info-cards {
    grid-template-columns: 1fr;
  }
}

/* ==================== 额外的动画和效果 ==================== */

/* 卡片进入动画 */
@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.installed-plugin-card,
.store-plugin-card {
  animation: cardFadeIn 0.4s ease-out backwards;
}

.installed-plugin-card:nth-child(1),
.store-plugin-card:nth-child(1) {
  animation-delay: 0.05s;
}

.installed-plugin-card:nth-child(2),
.store-plugin-card:nth-child(2) {
  animation-delay: 0.1s;
}

.installed-plugin-card:nth-child(3),
.store-plugin-card:nth-child(3) {
  animation-delay: 0.15s;
}

.installed-plugin-card:nth-child(4),
.store-plugin-card:nth-child(4) {
  animation-delay: 0.2s;
}

.installed-plugin-card:nth-child(5),
.store-plugin-card:nth-child(5) {
  animation-delay: 0.25s;
}

.installed-plugin-card:nth-child(6),
.store-plugin-card:nth-child(6) {
  animation-delay: 0.3s;
}

/* 标签动画 */
.category-tab {
  position: relative;
  overflow: hidden;
}

.category-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.category-tab:hover::before {
  left: 100%;
}

/* 搜索框聚焦效果 */
.search-input {
  position: relative;
}

.search-input:focus {
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.15), 0 2px 8px rgba(0, 122, 255, 0.1);
}

/* 按钮点击效果 */
.action-btn:active,
.upload-button:active,
.state-button:active {
  transform: scale(0.95);
}

/* 图标旋转动画 */
@keyframes iconFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-state svg,
.error-state svg {
  animation: iconFloat 3s ease-in-out infinite;
}

/* 加载旋转器脉冲效果 */
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.2);
  }
  50% {
    box-shadow: 0 4px 24px rgba(0, 122, 255, 0.4);
  }
}

.loading-spinner {
  animation: spin 0.8s linear infinite, pulse 2s ease-in-out infinite;
}

/* 徽章闪烁效果 */
@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.tab-badge {
  animation: badgePulse 2s ease-in-out infinite;
}

/* 悬停时的光晕效果 */
.plugin-icon-main::after,
.upload-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: inherit;
  filter: blur(20px);
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: opacity 0.3s ease;
  z-index: -1;
}

.plugin-detail-modal:hover .plugin-icon-main::after,
.local-install-modal:hover .upload-icon::after {
  opacity: 0.6;
}

/* 信息卡片闪光效果 */
.info-card::before,
.info-card-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.info-card:hover::before,
.info-card-item:hover::before {
  left: 100%;
}

/* 平滑滚动 */
.modal-content-area,
.local-modal-body {
  scroll-behavior: smooth;
}

/* 选中状态的视觉反馈 */
.action-btn:focus-visible,
.upload-button:focus-visible,
.modal-close-btn:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

/* 禁用状态 */
.action-btn:disabled,
.upload-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 渐变文字效果 */
.plugin-title {
  background: linear-gradient(135deg, var(--text-primary), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 响应式动画优化 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
