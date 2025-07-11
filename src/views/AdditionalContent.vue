<template>
  <div :class="['market-container', theme]">
    <div v-if="!confirmed" class="confirmation-panel">
      <div class="confirmation-card">
        <i class="fas fa-cloud fa-3x"></i>
        <h2>需要联网操作</h2>
        <p>使用拓展市场需要连接互联网下载内容</p>
        <button class="confirm-btn" @click="confirmConnection">
          确认并连接
        </button>
      </div>
    </div>

    <div v-else>
      <div class="market-header">
        <h1>拓展市场</h1>
        <div class="controls">
          <div class="source-selector">
            <button
              :class="{ active: source === 'jsdelivr' }"
              @click="source = 'jsdelivr'"
            >
              <i class="fas fa-cloud"></i> jsdelivr
            </button>
            <button
              :class="{ active: source === 'github' }"
              @click="source = 'github'"
            >
              <i class="fab fa-github"></i> GitHub
            </button>
          </div>

          <button class="refresh-btn" @click="fetchPlugins">
            <i class="fas fa-sync-alt"></i> 刷新列表
          </button>
        </div>
      </div>

      <div class="category-tabs">
        <div
          v-for="category in categories"
          :key="category"
          class="category-tab"
          :class="{ active: activeCategory === category }"
          @click="activeCategory = category"
        >
          {{ category }}
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>正在加载拓展内容...</p>
      </div>

      <div v-else-if="error" class="error-container">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ error }}</p>
        <button @click="fetchPlugins">重试</button>
      </div>

      <div v-else class="plugins-grid">
        <div
          v-for="plugin in filteredPlugins"
          :key="plugin.id"
          class="plugin-card"
        >
          <div class="card-header">
            <div class="plugin-icon">
              <i class="fas fa-puzzle-piece"></i>
            </div>
            <div class="title-wrapper">
              <h3>{{ plugin.name }}</h3>
              <span class="version">v{{ plugin.version }}</span>
            </div>
          </div>

          <div class="card-content">
            <p class="description">{{ plugin.description }}</p>
            <div class="meta-info">
              <div class="info-item">
                <i class="fas fa-user"></i>
                <span>{{ plugin.author }}</span>
              </div>
              <div class="info-item">
                <i class="fas fa-balance-scale"></i>
                <span>{{ plugin.license }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <button class="download-btn" @click="downloadPlugin(plugin)">
              <i class="fas fa-download"></i> 下载
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from "vue";
import ConfirmDialog from "../components/ConfirmDialog.vue";

export default {
  components: {
    ConfirmDialog,
  },
  setup() {
    // 主题状态
    const theme = ref("light");
    const themeIcon = computed(() =>
      theme.value === "dark" ? "fas fa-sun" : "fas fa-moon"
    );
    const themeLabel = computed(() =>
      theme.value === "dark" ? "浅色模式" : "深色模式"
    );

    // 数据源状态
    const source = ref("github");
    const confirmed = ref(false);
    const loading = ref(false);
    const error = ref(null);

    // 插件数据
    const plugins = ref([]);
    const categories = ref([
      "全部",
      "功能增强",
      "界面美化",
      "工具",
      "游戏扩展",
      "其他",
    ]);
    const activeCategory = ref("全部");

    // 导入状态
    const showImportDialog = ref(false);
    const importUrl = ref("");
    const importFile = ref(null);

    // 过滤后的插件列表
    const filteredPlugins = computed(() => {
      if (activeCategory.value === "全部") return plugins.value;
      return plugins.value.filter(
        (p) => p.categories && p.categories.includes(activeCategory.value)
      );
    });

    // 切换主题
    const toggleTheme = () => {
      theme.value = theme.value === "dark" ? "light" : "dark";
    };

    // 确认连接
    const confirmConnection = () => {
      confirmed.value = true;
      fetchPlugins();
    };

    // 获取插件列表
    const fetchPlugins = async () => {
      loading.value = true;
      error.value = null;

      try {
        const url =
          source.value === "jsdelivr"
            ? "https://cdn.jsdelivr.net/gh/llzgdc/ETBSaveX@master/ExpansionPack/plugins.json"
            : "https://raw.githubusercontent.com/llzgdc/ETBSaveX/master/ExpansionPack/plugins.json";

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`网络错误: ${response.status}`);
        }

        const data = await response.json();
        plugins.value = data.plugins || [];

        // 提取所有分类
        const allCategories = new Set();
        plugins.value.forEach((plugin) => {
          if (plugin.categories) {
            plugin.categories.forEach((cat) => allCategories.add(cat));
          }
        });

        // 更新分类列表
        categories.value = ["全部", ...Array.from(allCategories)];
      } catch (err) {
        error.value = "加载插件失败: " + err.message;
        console.error("加载插件失败:", err);
      } finally {
        loading.value = false;
      }
    };

    // 下载插件
    const downloadPlugin = (plugin) => {
      if (!plugin.download_url) {
        alert("该插件没有提供下载链接");
        return;
      }

      // 在实际应用中，这里应该实现下载逻辑
      console.log("下载插件:", plugin.name, "URL:", plugin.download_url);
      alert(`开始下载: ${plugin.name}\nURL: ${plugin.download_url}`);
    };

    // 处理文件上传
    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      importFile.value = file;
    };

    // 处理外部导入
    const processExternalImport = async () => {
      try {
        if (importUrl.value) {
          // 通过URL导入
          const response = await fetch(importUrl.value);
          if (!response.ok) {
            throw new Error(`获取数据失败: ${response.status}`);
          }
          const data = await response.json();
          addExternalPlugins(data.plugins || []);
        } else if (importFile.value) {
          // 通过文件导入
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = JSON.parse(e.target.result);
              addExternalPlugins(data.plugins || []);
            } catch (err) {
              alert("解析JSON文件失败: " + err.message);
            }
          };
          reader.readAsText(importFile.value);
        } else {
          alert("请提供URL或选择文件");
          return;
        }

        showImportDialog.value = false;
      } catch (err) {
        alert("导入失败: " + err.message);
      }
    };

    // 添加外部插件
    const addExternalPlugins = (newPlugins) => {
      // 简单去重
      const existingIds = new Set(plugins.value.map((p) => p.id));
      const uniquePlugins = newPlugins.filter((p) => !existingIds.has(p.id));

      plugins.value = [...plugins.value, ...uniquePlugins];
      alert(`成功导入 ${uniquePlugins.length} 个新插件`);
    };

    // 监听数据源变化
    watch(source, () => {
      if (confirmed.value) {
        fetchPlugins();
      }
    });

    return {
      theme,
      themeIcon,
      themeLabel,
      source,
      confirmed,
      loading,
      error,
      plugins,
      categories,
      activeCategory,
      filteredPlugins,
      showImportDialog,
      importUrl,
      toggleTheme,
      confirmConnection,
      fetchPlugins,
      downloadPlugin,
      handleFileUpload,
      processExternalImport,
    };
  },
};
</script>

<style scoped>
/* 深色主题 */
.market-container.dark {
  background: var(--AddiCon-dark-bg);
  color: var(--AddiCon-dark-text);
}

/* 浅色主题 */
.market-container.light {
  background: var(--AddiCon-light-bg);
  color: var(--AddiCon-light-text);
}

.market-container {
  font-family: "Inter", sans-serif;
  min-height: 100vh;
  padding: 2rem;
  transition: background 0.3s ease, color 0.3s ease;
}

.confirmation-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 70vh;
}

.confirmation-card {
  background: var(--AddiCon-dark-card);
  border-radius: var(--AddiCon-radius);
  padding: 3rem;
  text-align: center;
  width: 100%;
  max-width: 500px;
  box-shadow: var(--AddiCon-shadow);
  border: 1px solid var(--AddiCon-dark-border);
  animation: fadeIn 0.5s ease;
}

.market-container.light .confirmation-card {
  background: var(--AddiCon-light-card);
  border: 1px solid var(--AddiCon-light-border);
}

.confirmation-card i {
  margin-bottom: 1.5rem;
  color: var(--AddiCon-dark-accent);
}

.market-container.light .confirmation-card i {
  color: var(--AddiCon-light-accent);
}

.confirmation-card h2 {
  margin-bottom: 1rem;
  font-size: 1.8rem;
  font-weight: 700;
}

.confirmation-card p {
  margin-bottom: 1.5rem;
  line-height: 1.6;
  color: var(--AddiCon-dark-text-secondary);
}

.market-container.light .confirmation-card p {
  color: var(--AddiCon-light-text-secondary);
}

.warning {
  color: var(--AddiCon-warning) !important;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
}

.confirm-btn {
  background: var(--AddiCon-dark-accent);
  color: white;
  border: none;
  padding: 0.8rem 2.5rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--AddiCon-transition);
  margin-top: 1rem;
}

.market-container.light .confirm-btn {
  background: var(--AddiCon-light-accent);
}

.confirm-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
}

.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: auto;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--AddiCon-dark-border);
}

.market-container.light .market-header {
  border-bottom: 1px solid var(--AddiCon-light-border);
}

.market-header h1 {
  font-size: 2.2rem;
  margin: 0;
  font-weight: 700;
  background: linear-gradient(90deg, var(--AddiCon-dark-accent), #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  line-height: 1.2;
  -webkit-text-fill-color: transparent;
}

.market-container.light .market-header h1 {
  background: linear-gradient(90deg, var(--AddiCon-light-accent), #7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.source-selector {
  display: flex;
  gap: 0.5rem;
  margin-right: 1rem;
}

.source-selector button {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: var(--AddiCon-transition);
  font-weight: 500;
  background: rgba(99, 102, 241, 0.1);
  color: var(--AddiCon-dark-text);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.market-container.light .source-selector button {
  background: rgba(79, 70, 229, 0.1);
  color: var(--AddiCon-light-text);
}

.source-selector button.active {
  background: var(--AddiCon-dark-accent);
  color: white;
}

.market-container.light .source-selector button.active {
  background: var(--AddiCon-light-accent);
  color: white;
}

.controls button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: var(--AddiCon-transition);
  background: rgba(99, 102, 241, 0.1);
  color: var(--AddiCon-dark-text);
}

.market-container.light .controls button {
  background: rgba(79, 70, 229, 0.1);
  color: var(--AddiCon-light-text);
}

.controls button:hover {
  transform: translateY(-2px);
  box-shadow: var(--AddiCon-shadow);
}

.category-tabs {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-tab {
  padding: 0.6rem 1.4rem;
  border-radius: 20px;
  background: rgba(99, 102, 241, 0.1);
  cursor: pointer;
  transition: var(--AddiCon-transition);
  font-size: 0.9rem;
  font-weight: 500;
}

.market-container.light .category-tab {
  background: rgba(79, 70, 229, 0.1);
}

.category-tab.active {
  background: var(--AddiCon-dark-accent);
  color: white;
}

.market-container.light .category-tab.active {
  background: var(--AddiCon-light-accent);
  color: white;
}

.category-tab:hover:not(.active) {
  background: rgba(99, 102, 241, 0.2);
}

.market-container.light .category-tab:hover:not(.active) {
  background: rgba(79, 70, 229, 0.2);
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.plugin-card {
  background: var(--AddiCon-dark-card);
  border-radius: var(--AddiCon-radius);
  overflow: hidden;
  border: 1px solid var(--AddiCon-dark-border);
  transition: var(--AddiCon-transition);
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: var(--AddiCon-shadow);
}

.market-container.light .plugin-card {
  background: var(--AddiCon-light-card);
  border: 1px solid var(--AddiCon-light-border);
}

.plugin-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--AddiCon-dark-border);
}

.market-container.light .card-header {
  border-bottom: 1px solid var(--AddiCon-light-border);
}

.plugin-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plugin-icon i {
  font-size: 1.5rem;
  color: var(--AddiCon-dark-accent);
}

.market-container.light .plugin-icon {
  background: rgba(79, 70, 229, 0.1);
}

.market-container.light .plugin-icon i {
  color: var(--AddiCon-light-accent);
}

.title-wrapper {
  flex: 1;
}

.title-wrapper h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.version {
  font-size: 0.85rem;
  color: var(--AddiCon-dark-text-secondary);
  background: rgba(99, 102, 241, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  display: inline-block;
}

.market-container.light .version {
  color: var(--AddiCon-light-text-secondary);
  background: rgba(79, 70, 229, 0.1);
}

.card-content {
  padding: 1.5rem;
  flex-grow: 1;
}

.description {
  margin-bottom: 1.5rem;
  line-height: 1.6;
  color: var(--AddiCon-dark-text);
}

.market-container.light .description {
  color: var(--AddiCon-light-text);
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  font-size: 0.9rem;
  color: var(--AddiCon-dark-text-secondary);
  margin-top: 1rem;
}

.market-container.light .meta-info {
  color: var(--AddiCon-light-text-secondary);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--AddiCon-dark-border);
}

.market-container.light .card-footer {
  border-top: 1px solid var(--AddiCon-light-border);
}

.download-btn {
  background: var(--AddiCon-dark-accent);
  color: white;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--AddiCon-transition);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.market-container.light .download-btn {
  background: var(--AddiCon-light-accent);
}

.download-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 1.5rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(99, 102, 241, 0.1);
  border-radius: 50%;
  border-top-color: var(--AddiCon-dark-accent);
  animation: spin 1s ease-in-out infinite;
}

.market-container.light .spinner {
  border-top-color: var(--AddiCon-light-accent);
}

.error-container i {
  font-size: 3rem;
  color: var(--AddiCon-error);
}

.error-container button {
  background: var(--AddiCon-dark-accent);
  color: white;
  border: none;
  padding: 0.7rem 1.8rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.market-container.light .error-container button {
  background: var(--AddiCon-light-accent);
}

/* 导入选项样式 */
.import-options {
  padding: 1rem;
}

.option {
  margin-bottom: 1.5rem;
}

.option h3 {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.url-input,
.file-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--AddiCon-dark-border);
  background: var(--AddiCon-dark-card);
  color: var(--AddiCon-dark-text);
  font-family: inherit;
}

.market-container.light .url-input,
.market-container.light .file-input {
  border: 1px solid var(--AddiCon-light-border);
  background: var(--AddiCon-light-card);
  color: var(--AddiCon-light-text);
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 42%;
  height: 1px;
  background: var(--AddiCon-dark-border);
}

.market-container.light .divider::before,
.market-container.light .divider::after {
  background: var(--AddiCon-light-border);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.warning-box {
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1.5rem;
  display: flex;
  gap: 0.8rem;
  color: var(--AddiCon-warning);
}

.warning-box i {
  font-size: 1.2rem;
}

.warning-box p {
  margin: 0;
}

/* 动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .market-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .controls {
    width: 100%;
    flex-wrap: wrap;
  }

  .source-selector {
    width: 100%;
    margin-right: 0;
    margin-bottom: 0.5rem;
  }

  .plugins-grid {
    grid-template-columns: 1fr;
  }
}
</style>
