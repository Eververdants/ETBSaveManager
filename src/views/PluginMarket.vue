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
      </button>
    </div>

    <!-- 插件网格 -->
    <div class="plugins-grid" ref="pluginsGrid">
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
        class="plugin-card archive-card"
        @click="openPluginDetail(plugin)"
      >
        <div class="card-background">
          <div class="plugin-icon">
            <font-awesome-icon :icon="['fas', plugin.icon]" />
          </div>
          <div class="archive-info">
            <h3 class="archive-name plugin-name">{{ plugin.name }}</h3>
            <div class="game-mode-info">
              <span class="mode-tag mode-single">
                <span class="tag-short">{{ $t("plugin.plugin") }}</span>
                <span class="tag-full">{{ $t("plugin.plugin") }}</span>
              </span>
              <span class="difficulty-tags">
                <span class="difficulty-tag archive-difficulty difficulty-easy">
                  <span class="tag-short">v{{ plugin.version }}</span>
                  <span class="tag-full"
                    >{{ $t("plugin.version") }}: v{{ plugin.version }}</span
                  >
                </span>
              </span>
            </div>
          </div>
        </div>
        <div class="card-info">
          <div class="level-info">
            <span class="current-level plugin-description">{{
              plugin.description
            }}</span>
          </div>
          <div class="action-buttons">
            <button
              v-if="plugin.installed"
              class="action-btn installed"
              @click.stop="togglePlugin(plugin)"
            >
              <font-awesome-icon :icon="['fas', 'check']" />
            </button>
            <button
              v-else
              class="action-btn install"
              @click.stop="installPlugin(plugin)"
            >
              <font-awesome-icon :icon="['fas', 'download']" />
            </button>
          </div>
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
            <div class="plugin-icon-large">
              <font-awesome-icon :icon="['fas', selectedPlugin.icon]" />
            </div>
            <div class="plugin-info">
              <h2>{{ selectedPlugin.name }}</h2>
              <p class="plugin-author-detail">{{ selectedPlugin.author }}</p>
            </div>
            <button class="close-button" @click="closePluginDetail">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>

          <div class="modal-body">
            <div class="plugin-details">
              <h3>{{ $t("plugin.description") }}</h3>
              <p>{{ selectedPlugin.description }}</p>

              <div class="plugin-info-list">
                <div class="info-item">
                  <span class="info-label">{{ $t("plugin.author") }}:</span>
                  <span class="info-value">{{ selectedPlugin.author }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t("plugin.version") }}:</span>
                  <span class="info-value">v{{ selectedPlugin.version }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ $t("plugin.license") }}:</span>
                  <span class="info-value">{{ selectedPlugin.license }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
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
          </div>
        </div>
      </div>
    </transition>

    <!-- 本地插件安装模态框 -->
    <transition name="modal">
      <div
        v-if="showLocalInstall"
        class="plugin-modal"
        @click="showLocalInstall = false"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>{{ t("plugin.installLocal") }}</h3>
            <button class="close-button" @click="showLocalInstall = false">
              <font-awesome-icon :icon="['fas', 'times']" />
            </button>
          </div>
          <div class="modal-body">
            <div class="local-install-area">
              <div class="upload-zone-modern">
                <div class="upload-icon-container">
                  <font-awesome-icon
                    :icon="['fas', 'cloud-upload-alt']"
                    class="upload-icon-modern"
                  />
                </div>
                <h3>{{ t("plugin.uploadPlugin") }}</h3>
                <p class="upload-description">
                  {{ t("plugin.uploadDescription") }}
                </p>
                <label class="upload-button">
                  <input
                    type="file"
                    accept=".zip,.json"
                    class="file-input-hidden"
                  />
                  <span>{{ t("plugin.selectFile") }}</span>
                </label>
                <div class="drag-hint">
                  <font-awesome-icon :icon="['fas', 'mouse-pointer']" />
                  <span>{{ t("plugin.dragHint") }}</span>
                </div>
              </div>

              <div class="install-info-modern">
                <div class="info-card">
                  <font-awesome-icon
                    :icon="['fas', 'file-archive']"
                    class="info-icon"
                  />
                  <div class="info-content">
                    <h4>{{ t("plugin.zipFormat") }}</h4>
                    <p>{{ t("plugin.zipDescription") }}</p>
                  </div>
                </div>
                <div class="info-card">
                  <font-awesome-icon
                    :icon="['fas', 'file-code']"
                    class="info-icon"
                  />
                  <div class="info-content">
                    <h4>{{ t("plugin.jsonFormat") }}</h4>
                    <p>{{ t("plugin.jsonDescription") }}</p>
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

// 分类数据
const categories = ref([{ id: "all", name: t("plugin.all") }]);

// 获取插件数据
const fetchPlugins = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/Eververdants/ETBSaveX/master/ExpansionPack/plugins.json"
    );
    const data = await response.json();

    plugins.value = data.plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      author: plugin.author,
      version: plugin.version,
      license: plugin.license,
      download_url: plugin.download_url,
      icon: getIconForPlugin(plugin.id),
      category: plugin.category || "utility",
      installed: false,
    }));
  } catch (err) {
    console.error("获取插件数据失败:", err);
    error.value = "获取插件列表失败，请检查网络连接";

    // 回退到默认数据
    plugins.value = [
      {
        id: "plugin-example",
        name: "测试插件",
        description: "此项插件仅供测试使用。",
        author: "ETBSaveManager团队",
        version: "1.0.0",
        license: "MIT",
        download_url: "#",
        icon: "puzzle-piece",
        category: "utility",
        installed: false,
      },
    ];
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

const installPlugin = (plugin) => {
  plugin.installed = true;
  // 这里可以添加实际的安装逻辑
  animateButton(plugin);
};

const togglePlugin = (plugin) => {
  plugin.installed = !plugin.installed;
  // 这里可以添加启用/禁用逻辑
};

const openLocalInstall = () => {
  showLocalInstall.value = true;
};

// GSAP 动画
const animateCards = async () => {
  await nextTick();
  if (pluginsGrid.value) {
    const cards = pluginsGrid.value.querySelectorAll(".plugin-card");
    gsap.fromTo(
      cards,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" }
    );
  }
};

const animateButton = (plugin) => {
  const button = event.target;
  gsap.to(button, { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 });
};

// 生命周期
onMounted(async () => {
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
</style>
