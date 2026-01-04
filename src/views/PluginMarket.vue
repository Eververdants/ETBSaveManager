<template>
  <div class="plugin-market">
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
        <span v-if="category.id === 'installed' && installedPluginsList.length > 0" class="tab-badge">
          {{ installedPluginsList.length }}
        </span>
      </button>
    </div>

    <!-- 已安装插件管理 -->
    <div v-if="selectedCategory === 'installed'" class="plugins-grid" ref="pluginsGrid">
      <!-- 空状态 -->
      <div v-if="installedPluginsList.length === 0" class="empty-state">
        <font-awesome-icon :icon="['fas', 'puzzle-piece']" />
        <p>暂无已安装的插件</p>
        <p class="empty-hint">从商店安装插件或导入本地插件</p>
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
          <div class="installed-plugin-icon" :class="getPluginTypeClass(plugin.type)">
            <font-awesome-icon :icon="['fas', getPluginIcon(plugin.type)]" />
          </div>
          <div class="installed-plugin-info">
            <h3 class="installed-plugin-name">{{ plugin.name }}</h3>
            <div class="installed-plugin-meta">
              <span class="plugin-type-badge" :class="getPluginTypeClass(plugin.type)">
                {{ getPluginTypeLabel(plugin.type) }}
              </span>
              <span class="plugin-version">v{{ plugin.version }}</span>
              <span v-if="plugin.locale" class="plugin-locale">{{ plugin.locale }}</span>
            </div>
          </div>
        </div>
        <div class="installed-card-body">
          <p class="installed-plugin-desc">{{ plugin.description || plugin.localeName || '暂无描述' }}</p>
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
            :class="{ active: plugin.status === 'active', inactive: plugin.status !== 'active' }"
          >
            <font-awesome-icon :icon="['fas', plugin.status === 'active' ? 'check-circle' : 'pause-circle']" />
            {{ plugin.status === 'active' ? '已启用' : '已禁用' }}
          </span>
          <div class="plugin-actions-group">
            <button
              class="toggle-btn"
              :class="{ enabled: plugin.status === 'active' }"
              @click.stop="handleTogglePlugin(plugin)"
              :title="plugin.status === 'active' ? '禁用插件' : '启用插件'"
            >
              <font-awesome-icon :icon="['fas', plugin.status === 'active' ? 'toggle-on' : 'toggle-off']" />
            </button>
            <button
              class="uninstall-btn"
              @click.stop="handleUninstallPlugin(plugin)"
              title="卸载插件"
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
          <div class="installed-plugin-icon" :class="getPluginTypeClass(plugin.type)">
            <font-awesome-icon :icon="['fas', getPluginIcon(plugin.type)]" />
          </div>
          <div class="installed-plugin-info">
            <h3 class="installed-plugin-name">{{ plugin.name }}</h3>
            <div class="installed-plugin-meta">
              <span class="plugin-type-badge" :class="getPluginTypeClass(plugin.type)">
                {{ getPluginTypeLabel(plugin.type) }}
              </span>
              <span class="plugin-version">v{{ plugin.version }}</span>
              <span v-if="plugin.locale" class="plugin-locale">{{ plugin.locale }}</span>
            </div>
          </div>
        </div>
        <div class="installed-card-body">
          <p class="installed-plugin-desc">{{ plugin.description || '暂无描述' }}</p>
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
            已安装
          </span>
          <span v-else class="plugin-status inactive">
            <font-awesome-icon :icon="['fas', 'circle']" />
            未安装
          </span>
          <button
            v-if="plugin.installed"
            class="uninstall-btn"
            @click.stop="togglePlugin(plugin)"
            title="卸载插件"
          >
            <font-awesome-icon :icon="['fas', 'trash']" />
          </button>
          <button
            v-else
            class="install-btn"
            @click.stop="installPlugin(plugin)"
            title="安装插件"
          >
            <font-awesome-icon :icon="['fas', 'download']" />
            安装
          </button>
        </div>
      </div>
    </div>

    <!-- 插件详情模态框 -->
    <transition name="modal">
      <div
        v-if="selectedPlugin"
        class="plugin-modal"
        @click="closePluginDetail"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <div class="plugin-icon-large" :class="getPluginTypeClass(selectedPlugin.type)">
              <font-awesome-icon :icon="['fas', getPluginIcon(selectedPlugin.type)]" />
            </div>
            <div class="plugin-info">
              <h2>{{ selectedPlugin.name }}</h2>
              <p class="plugin-author-detail">{{ selectedPlugin.author || 'Unknown' }}</p>
            </div>
            <button class="close-button" @click="closePluginDetail">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>

          <div class="modal-body">
            <div class="plugin-details">
              <h3>{{ $t("plugin.description") }}</h3>
              <p class="plugin-full-desc">{{ selectedPlugin.description || '暂无描述' }}</p>

              <div class="plugin-info-list">
                <div class="info-item">
                  <span class="info-label">{{ $t("plugin.author") }}:</span>
                  <span class="info-value">{{ selectedPlugin.author || 'Unknown' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t("plugin.version") }}:</span>
                  <span class="info-value">v{{ selectedPlugin.version }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">类型:</span>
                  <span class="info-value">{{ getPluginTypeLabel(selectedPlugin.type) }}</span>
                </div>
                <div v-if="selectedPlugin.locale" class="info-item">
                  <span class="info-label">语言代码:</span>
                  <span class="info-value">{{ selectedPlugin.locale }}</span>
                </div>
                <div v-if="selectedPlugin.localeName" class="info-item">
                  <span class="info-label">语言名称:</span>
                  <span class="info-value">{{ selectedPlugin.localeName }}</span>
                </div>
                <div v-if="selectedPlugin.themeId" class="info-item">
                  <span class="info-label">主题ID:</span>
                  <span class="info-value">{{ selectedPlugin.themeId }}</span>
                </div>
                <div v-if="selectedPlugin.license" class="info-item">
                  <span class="info-label">{{ $t("plugin.license") }}:</span>
                  <span class="info-value">{{ selectedPlugin.license }}</span>
                </div>
                <div v-if="selectedPlugin.status" class="info-item">
                  <span class="info-label">状态:</span>
                  <span class="info-value" :class="{ 'status-active': selectedPlugin.status === 'active' }">
                    {{ selectedPlugin.status === 'active' ? '已启用' : '已禁用' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <!-- 已安装插件的操作 -->
            <template v-if="selectedPlugin.status !== undefined">
              <button
                class="action-button toggle-action"
                :class="{ enabled: selectedPlugin.status === 'active' }"
                @click="handleTogglePluginInModal"
              >
                <font-awesome-icon :icon="['fas', selectedPlugin.status === 'active' ? 'pause' : 'play']" />
                {{ selectedPlugin.status === 'active' ? '禁用' : '启用' }}
              </button>
              <button
                class="action-button uninstall-action"
                @click="handleUninstallPluginInModal"
              >
                <font-awesome-icon :icon="['fas', 'trash']" />
                卸载
              </button>
            </template>
            <!-- 商店插件的操作 -->
            <template v-else>
              <button
                v-if="selectedPlugin.installed"
                class="action-button installed large"
                @click="togglePlugin(selectedPlugin)"
              >
                <font-awesome-icon :icon="['fas', 'check']" />
                {{ $t("plugin.installed") }}
              </button>
              <button
                v-else
                class="action-button install large"
                @click="installPlugin(selectedPlugin)"
              >
                <font-awesome-icon :icon="['fas', 'download']" />
                {{ $t("plugin.install") }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </transition>

    <!-- 本地插件安装模态框 -->
    <transition name="modal">
      <div
        v-if="showLocalInstall"
        class="plugin-modal"
        @click="closeLocalInstall"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ t("plugin.installLocal") }}</h3>
            <button class="close-button" @click="closeLocalInstall">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
          <div class="modal-body">
            <div class="local-install-area">
              <div 
                class="upload-zone-modern"
                :class="{ 'dragging': isDragging, 'loading': localInstallLoading }"
                @dragover="handleDragOver"
                @dragleave="handleDragLeave"
                @drop="handleDrop"
              >
                <!-- 加载状态 -->
                <div v-if="localInstallLoading" class="upload-loading">
                  <div class="loading-spinner"></div>
                  <p>正在安装插件...</p>
                </div>
                
                <!-- 成功状态 -->
                <div v-else-if="localInstallSuccess" class="upload-success">
                  <font-awesome-icon :icon="['fas', 'check-circle']" class="success-icon" />
                  <p>{{ localInstallSuccess }}</p>
                  <button class="upload-button" @click="localInstallSuccess = null">
                    继续安装
                  </button>
                </div>
                
                <!-- 错误状态 -->
                <div v-else-if="localInstallError" class="upload-error">
                  <font-awesome-icon :icon="['fas', 'exclamation-circle']" class="error-icon" />
                  <p>{{ localInstallError }}</p>
                  <button class="upload-button" @click="localInstallError = null">
                    重试
                  </button>
                </div>
                
                <!-- 默认上传状态 -->
                <template v-else>
                  <div class="upload-icon-container">
                    <font-awesome-icon
                      :icon="['fas', 'folder-open']"
                      class="upload-icon-modern"
                    />
                  </div>
                  <h3>选择插件文件夹</h3>
                  <p class="upload-description">
                    选择包含 plugin.json 的插件文件夹
                  </p>
                  <button class="upload-button" @click="selectPluginFolder">
                    <font-awesome-icon :icon="['fas', 'folder-open']" />
                    <span>选择文件夹</span>
                  </button>
                  <div class="drag-hint">
                    <font-awesome-icon :icon="['fas', 'info-circle']" />
                    <span>插件文件夹必须包含 plugin.json 元数据文件</span>
                  </div>
                </template>
              </div>

              <div class="install-info-modern">
                <div class="info-card">
                  <font-awesome-icon
                    :icon="['fas', 'folder']"
                    class="info-icon"
                  />
                  <div class="info-content">
                    <h4>插件文件夹结构</h4>
                    <p>plugin.json（必需）+ translations.json（语言插件）</p>
                  </div>
                </div>
                <div class="info-card">
                  <font-awesome-icon
                    :icon="['fas', 'file-code']"
                    class="info-icon"
                  />
                  <div class="info-content">
                    <h4>plugin.json</h4>
                    <p>包含插件 ID、名称、类型、版本等元数据信息</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
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

// 使用国际化
const { t } = useI18n({ useScope: "global" });

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

// 分类数据
const categories = ref([
  { id: "all", name: t("plugin.all") },
  { id: "installed", name: "已安装" }
]);

// 刷新已安装插件列表
const refreshInstalledPlugins = () => {
  const plugins = pluginManager.getAllPlugins();
  console.log('🔄 刷新已安装插件列表:', plugins.length, plugins.map(p => p.id));
  installedPluginsList.value = [...plugins];
};

// 获取插件类型图标
const getPluginIcon = (type) => {
  const icons = {
    language: 'globe',
    theme: 'palette',
    feature: 'puzzle-piece',
  };
  return icons[type] || 'puzzle-piece';
};

// 获取插件类型样式类
const getPluginTypeClass = (type) => {
  return `type-${type || 'feature'}`;
};

// 获取插件类型标签
const getPluginTypeLabel = (type) => {
  const key = `plugin.type.${type}`;
  const translated = t(key);
  // 如果翻译不存在，返回默认值
  return translated !== key ? translated : t('plugin.type.plugin');
};

// 插件索引 URL
const PLUGIN_INDEX_URL = "https://raw.githubusercontent.com/Eververdants/ETBSaveManager/master/plugins/plugins.json";

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
    const installedIds = new Set(installedPlugins.map(p => p.id));

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
      type: plugin.type || 'feature',
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
  console.log('📦 开始安装插件:', plugin.id, plugin);
  
  try {
    // 如果是语言插件，从远程下载并安装
    if (plugin.type === 'language' && plugin.downloadUrl) {
      // 构建翻译文件的URL（downloadUrl是插件文件夹路径）
      const translationsUrl = `${plugin.downloadUrl}/translations.json`;
      console.log('📥 下载翻译文件:', translationsUrl);
      
      const response = await fetch(translationsUrl);
      
      if (!response.ok) {
        throw new Error(`下载翻译文件失败: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ 翻译数据下载成功:', Object.keys(data));
      
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
      
      console.log('✅ 插件安装成功:', plugin.id);
      plugin.installed = true;
      refreshInstalledPlugins();
    } else if (plugin.type === 'theme' && plugin.downloadUrl) {
      // 构建主题文件的URL
      const themeUrl = `${plugin.downloadUrl}/theme.json`;
      console.log('📥 下载主题文件:', themeUrl);
      
      const response = await fetch(themeUrl);
      
      if (!response.ok) {
        throw new Error(`下载主题文件失败: HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ 主题数据下载成功');
      
      await installThemePlugin({
        id: plugin.id,
        name: plugin.name,
        themeId: plugin.themeId || plugin.id,
        data: data,
        version: plugin.version,
        author: plugin.author,
        description: plugin.description,
      });
      
      console.log('✅ 主题插件安装成功:', plugin.id);
      plugin.installed = true;
      refreshInstalledPlugins();
    } else {
      console.warn('⚠️ 不支持的插件类型或缺少下载链接:', plugin.type, plugin.downloadUrl);
    }
    
    animateButton(plugin);
  } catch (err) {
    console.error('❌ 安装插件失败:', err);
    alert(`安装插件失败: ${err.message}`);
  }
};

const togglePlugin = async (plugin) => {
  if (plugin.installed) {
    // 卸载插件
    try {
      if (plugin.type === 'language') {
        await uninstallLanguagePlugin(plugin.id);
      } else if (plugin.type === 'theme') {
        await uninstallThemePlugin(plugin.id);
        window.dispatchEvent(new CustomEvent('theme-plugin-changed'));
      } else {
        await pluginManager.removePlugin(plugin.id);
      }
      plugin.installed = false;
      refreshInstalledPlugins();
    } catch (err) {
      console.error('卸载插件失败:', err);
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
      title: '选择插件文件夹',
    });
    
    if (selected) {
      await processPluginFolder(selected);
    }
  } catch (err) {
    console.error('选择文件夹失败:', err);
    localInstallError.value = `选择文件夹失败: ${err.message}`;
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
  localInstallError.value = '请点击「选择文件夹」按钮来选择插件目录';
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
      localInstallError.value = '未找到 plugin.json 文件，请确保选择了正确的插件文件夹';
      return;
    }
    
    // 验证元数据
    if (!pluginMeta.id || !pluginMeta.type || !pluginMeta.name) {
      localInstallError.value = 'plugin.json 格式无效，缺少必需字段（id, type, name）';
      return;
    }
    
    // 检查插件是否已安装
    const existingPlugin = pluginManager.getPlugin(pluginMeta.id);
    if (existingPlugin) {
      localInstallError.value = `插件「${pluginMeta.name}」已安装`;
      return;
    }
    
    // 根据插件类型处理
    if (pluginMeta.type === 'language') {
      await processLanguagePlugin(folderPath, pluginMeta);
    } else if (pluginMeta.type === 'theme') {
      await processThemePlugin(folderPath, pluginMeta);
    } else {
      localInstallError.value = `暂不支持的插件类型: ${pluginMeta.type}`;
    }
  } catch (err) {
    console.error('处理插件文件夹失败:', err);
    localInstallError.value = `安装失败: ${err.message}`;
  } finally {
    localInstallLoading.value = false;
  }
};

// 处理语言插件
const processLanguagePlugin = async (folderPath, pluginMeta) => {
  // 读取翻译数据文件
  const mainFile = pluginMeta.main || 'translations.json';
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
  if (!translationsData || typeof translationsData !== 'object') {
    localInstallError.value = '翻译文件格式无效';
    return;
  }
  
  // 安装语言插件
  await installLanguagePlugin({
    id: pluginMeta.id,
    name: pluginMeta.name,
    locale: pluginMeta.locale,
    localeName: pluginMeta.localeName || pluginMeta.name,
    data: translationsData,
    version: pluginMeta.version || '1.0.0',
    author: pluginMeta.author || 'Unknown',
    description: pluginMeta.description || '',
  });
  
  localInstallSuccess.value = `成功安装语言插件: ${pluginMeta.name}`;
  
  // 刷新插件列表
  await fetchPlugins();
  refreshInstalledPlugins();
};

// 处理主题插件
const processThemePlugin = async (folderPath, pluginMeta) => {
  // 读取主题数据文件
  const mainFile = pluginMeta.main || 'theme.json';
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
  if (!themeData || typeof themeData !== 'object') {
    localInstallError.value = '主题文件格式无效';
    return;
  }
  
  // 安装主题插件
  await installThemePlugin({
    id: pluginMeta.id,
    name: pluginMeta.name,
    themeId: pluginMeta.themeId || pluginMeta.id,
    data: themeData,
    version: pluginMeta.version || '1.0.0',
    author: pluginMeta.author || 'Unknown',
    description: pluginMeta.description || '',
  });
  
  localInstallSuccess.value = `成功安装主题插件: ${pluginMeta.name}`;
  
  // 刷新插件列表
  await fetchPlugins();
  refreshInstalledPlugins();
};

// 卸载插件
const handleUninstallPlugin = async (plugin) => {
  try {
    if (plugin.type === 'language') {
      await uninstallLanguagePlugin(plugin.id);
    } else if (plugin.type === 'theme') {
      await uninstallThemePlugin(plugin.id);
      // 通知主题插件变化
      window.dispatchEvent(new CustomEvent('theme-plugin-changed'));
    } else {
      await pluginManager.removePlugin(plugin.id);
    }
    refreshInstalledPlugins();
    // 更新商店列表中对应插件的安装状态
    const storePlugin = plugins.value.find(p => p.id === plugin.id);
    if (storePlugin) {
      storePlugin.installed = false;
    }
    console.log(`✅ 已卸载插件: ${plugin.name}`);
  } catch (err) {
    console.error('卸载插件失败:', err);
  }
};

// 启用/禁用插件
const handleTogglePlugin = async (plugin) => {
  try {
    if (plugin.status === 'active') {
      // 禁用插件
      await pluginManager.unloadPlugin(plugin.id);
      console.log(`⏸️ 已禁用插件: ${plugin.name}`);
    } else {
      // 启用插件
      await pluginManager.loadPlugin(plugin.id);
      console.log(`▶️ 已启用插件: ${plugin.name}`);
    }
    // 如果是主题插件，通知变化
    if (plugin.type === 'theme') {
      window.dispatchEvent(new CustomEvent('theme-plugin-changed'));
    }
    refreshInstalledPlugins();
  } catch (err) {
    console.error('切换插件状态失败:', err);
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
/* 主容器 */
.plugin-market {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
}

/* 搜索栏 */
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
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  font-size: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  border: none;
  border-radius: 18px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.search-input:focus {
  outline: none;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.15);
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
  grid-template-columns: repeat(auto-fill, 320px);
  gap: 24px;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
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

/* 加载状态 */
.loading-state,
.error-state,
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--divider-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.error-state svg,
.empty-state svg {
  font-size: 48px;
  margin-bottom: 16px;
  color: var(--text-tertiary);
}

.retry-button {
  margin-top: 16px;
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  background: var(--accent-color);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
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

/* 新版已安装插件卡片样式 */
.installed-plugin-card {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 0;
  height: 240px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.installed-plugin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--accent-color);
}

.installed-card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 18px 14px;
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border-bottom: 1px solid var(--border-color);
}

.installed-plugin-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.installed-plugin-icon.type-language {
  background: linear-gradient(135deg, #007aff, #5856d6);
}

.installed-plugin-icon.type-theme {
  background: linear-gradient(135deg, #ff9500, #ff2d55);
}

.installed-plugin-icon.type-feature {
  background: linear-gradient(135deg, #34c759, #30d158);
}

.installed-plugin-info {
  flex: 1;
  min-width: 0;
}

.installed-plugin-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.installed-plugin-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.plugin-type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  color: white;
}

.plugin-type-badge.type-language {
  background: linear-gradient(135deg, #007aff, #5856d6);
}

.plugin-type-badge.type-theme {
  background: linear-gradient(135deg, #ff9500, #ff2d55);
}

.plugin-type-badge.type-feature {
  background: linear-gradient(135deg, #34c759, #30d158);
}

.plugin-version {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 8px;
}

.plugin-locale {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(0, 122, 255, 0.1);
  padding: 2px 8px;
  border-radius: 8px;
}

.installed-card-body {
  padding: 14px 18px;
  flex: 1;
}

.installed-plugin-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 10px 0;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.installed-plugin-details {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-item {
  font-size: 12px;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-item svg {
  font-size: 10px;
}

.installed-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
}

.plugin-status {
  font-size: 12px;
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

/* 卸载按钮 */
.uninstall-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 14px;
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.uninstall-btn:hover {
  background: rgba(255, 59, 48, 0.2);
  border-color: rgba(255, 59, 48, 0.3);
  transform: translateY(-1px);
}

/* 插件操作按钮组 */
.plugin-actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 启用/禁用开关按钮 */
.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 18px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
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
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: 24px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--divider-color);
}

.plugin-icon-large {
  width: 64px;
  height: 64px;
  background: var(--accent-color);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
}

.plugin-info h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.plugin-author-detail {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.close-button {
  margin-left: auto;
  padding: 8px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 20px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-button:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
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
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 24px 0 12px 0;
}

.plugin-details p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.plugin-details ul {
  margin: 0;
  padding-left: 20px;
}

.plugin-details li {
  color: var(--text-secondary);
  margin-bottom: 8px;
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
  padding: 24px;
  border-top: 1px solid var(--divider-color);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

.info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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

  .plugins-grid {
    grid-template-columns: repeat(auto-fill, 280px);
    gap: 20px;
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
    grid-template-columns: 1fr;
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
  border-color: rgba(255, 59, 48, 0.3);
}


</style>