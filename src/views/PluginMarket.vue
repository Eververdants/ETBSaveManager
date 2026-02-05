<template>
  <div class="plugin-market">
    <!-- 搜索栏 -->
    <div class="search-section">
      <div class="search-bar">
        <font-awesome-icon :icon="['fas', 'search']" class="search-icon" />
        <input 
          v-model="searchQuery" 
          type="text" 
          :placeholder="t('plugin.searchPlaceholder')" 
          class="search-input" 
        />
      </div>
      <button class="local-install-btn" @click="openLocalInstall">
        <font-awesome-icon :icon="['fas', 'plus']" />
        {{ t('plugin.installLocal') }}
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

    <!-- 插件网格 -->
    <div class="plugins-grid" ref="pluginsGrid">
      <template v-if="selectedCategory === 'installed'">
        <PluginEmptyState 
          v-if="installedPluginsList.length === 0"
          icon="puzzle-piece"
          :title="$t('plugin.noInstalledPlugins')"
          :hint="$t('plugin.installFromStore')"
        />
        <PluginCard 
          v-else
          v-for="plugin in installedPluginsList" 
          :key="plugin.id"
          :plugin="plugin"
          :show-status="true"
          @click="openPluginDetail"
          @toggle="handleTogglePlugin"
          @uninstall="handleUninstallPlugin"
        />
      </template>

      <template v-else>
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>{{ $t('plugin.loading') }}</p>
        </div>
        <PluginEmptyState 
          v-else-if="error"
          icon="exclamation-triangle"
          :title="error"
        >
          <button class="retry-btn" @click="fetchPlugins">
            <font-awesome-icon :icon="['fas', 'redo']" />
            {{ $t('plugin.retry') }}
          </button>
        </PluginEmptyState>
        <PluginEmptyState 
          v-else-if="filteredPlugins.length === 0"
          icon="search"
          :title="$t('plugin.noResults')"
        />
        <PluginCard 
          v-else
          v-for="plugin in filteredPlugins" 
          :key="plugin.id"
          :plugin="plugin"
          @click="openPluginDetail"
          @install="installPlugin"
          @uninstall="togglePlugin"
        />
      </template>
    </div>

    <PluginDetailModal 
      :show="!!selectedPlugin"
      :plugin="selectedPlugin || {}"
      :show-status="isInstalledPlugin"
      @close="closePluginDetail"
      @toggle="handleTogglePluginInModal"
      @install="installPlugin"
      @uninstall="handleUninstallPluginInModal"
    />

    <LocalInstallModal 
      :show="showLocalInstall"
      :loading="localInstallLoading"
      :success-message="localInstallSuccess"
      :error-message="localInstallError"
      @close="closeLocalInstall"
      @select-folder="selectPluginFolder"
      @reset="resetLocalInstallState"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import PluginCard from '@/components/plugin/PluginCard.vue';
import PluginDetailModal from '@/components/plugin/PluginDetailModal.vue';
import LocalInstallModal from '@/components/plugin/LocalInstallModal.vue';
import PluginEmptyState from '@/components/plugin/PluginEmptyState.vue';
import {
  installLanguagePlugin, uninstallLanguagePlugin, getInstalledLanguagePlugins,
  installThemePlugin, uninstallThemePlugin, installPagePlugin, pluginManager,
} from '../plugins';

const { t } = useI18n({ useScope: 'global' });

const plugins = ref([]);
const searchQuery = ref('');
const selectedCategory = ref('all');
const selectedPlugin = ref(null);
const showLocalInstall = ref(false);
const loading = ref(false);
const error = ref(null);
const pluginsGrid = ref(null);
const localInstallLoading = ref(false);
const localInstallError = ref(null);
const localInstallSuccess = ref(null);
const installedPluginsList = ref([]);

const categories = ref([
  { id: 'all', name: t('plugin.all') },
  { id: 'installed', name: t('plugin.installed') },
]);

const PLUGIN_INDEX_URL = 'https://raw.githubusercontent.com/Eververdants/ETBSaveManager/master/plugins/plugins.json';

const filteredPlugins = computed(() => {
  let filtered = plugins.value;
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query));
  }
  if (selectedCategory.value !== 'all' && selectedCategory.value !== 'installed') {
    filtered = filtered.filter(p => p.category === selectedCategory.value);
  }
  return filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
});

const isInstalledPlugin = computed(() => selectedPlugin.value?.status !== undefined);

const refreshInstalledPlugins = () => {
  installedPluginsList.value = [...pluginManager.getAllPlugins()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
};

const fetchPlugins = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(PLUGIN_INDEX_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const installedIds = new Set(getInstalledLanguagePlugins().map(p => p.id));
    plugins.value = data.plugins.map(p => ({
      id: p.id, name: p.name, description: p.description, author: p.author, version: p.version,
      license: p.license, downloadUrl: p.downloadUrl || p.download_url, category: p.category || 'utility',
      installed: installedIds.has(p.id), type: p.type || 'feature', locale: p.locale, localeName: p.localeName,
    }));
  } catch (err) {
    console.error('获取插件数据失败:', err);
    error.value = t('plugin.fetchError');
    plugins.value = [];
  } finally {
    loading.value = false;
  }
};

const selectCategory = (id) => { selectedCategory.value = id; };
const openPluginDetail = (plugin) => { selectedPlugin.value = plugin; };
const closePluginDetail = () => { selectedPlugin.value = null; };

const MAX_PLUGIN_JSON_BYTES = 512 * 1024;
const MAX_PLUGIN_STRING_LEN = 20000;

const validateDownloadUrl = (url) => {
  if (!url || typeof url !== 'string') throw new Error('无效的下载地址');
  let u;
  try { u = new URL(url); } catch { throw new Error('无效的下载地址'); }
  if (!['https:', 'http:'].includes(u.protocol)) throw new Error('不支持的下载协议');
  return u.toString().replace(/\/$/, '');
};

const readJsonWithLimit = async (res) => {
  const lenHeader = res.headers.get('content-length');
  if (lenHeader) {
    const n = Number(lenHeader);
    if (Number.isFinite(n) && n > MAX_PLUGIN_JSON_BYTES) {
      throw new Error('下载内容过大');
    }
  }
  const text = await res.text();
  if (text.length > MAX_PLUGIN_JSON_BYTES) throw new Error('下载内容过大');
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('插件文件不是合法 JSON'); }
  return data;
};

const validateString = (v, field) => {
  if (v == null) return;
  if (typeof v !== 'string') throw new Error(`${field} 必须是字符串`);
  if (v.length > MAX_PLUGIN_STRING_LEN) throw new Error(`${field} 内容过长`);
};

const validateLanguagePack = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('翻译文件格式不正确');
  const requiredTop = ['common', 'sidebar', 'settings'];
  for (const k of requiredTop) {
    if (!(k in data)) throw new Error(`翻译文件缺少字段: ${k}`);
    if (!data[k] || typeof data[k] !== 'object' || Array.isArray(data[k])) throw new Error(`翻译字段 ${k} 格式不正确`);
  }
  const walk = (obj, depth = 0) => {
    if (depth > 20) throw new Error('翻译文件嵌套过深');
    for (const [k, v] of Object.entries(obj)) {
      validateString(k, '翻译键');
      if (typeof v === 'string') validateString(v, '翻译值');
      else if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, depth + 1);
      else throw new Error('翻译文件包含不支持的值类型');
    }
  };
  walk(data);
  return true;
};

const validateThemePack = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('主题文件格式不正确');
  if (!data.variables || typeof data.variables !== 'object' || Array.isArray(data.variables)) {
    throw new Error('主题文件缺少 variables');
  }
  for (const [k, v] of Object.entries(data.variables)) {
    validateString(k, 'CSS 变量名');
    validateString(String(v), 'CSS 变量值');
  }
  if (data.customCSS != null) validateString(String(data.customCSS), 'customCSS');
  return true;
};

const installPlugin = async (plugin) => {
  try {
    if (plugin.type === 'language' && plugin.downloadUrl) {
      const baseUrl = validateDownloadUrl(plugin.downloadUrl);
      const res = await fetch(`${baseUrl}/translations.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`下载翻译文件失败: HTTP ${res.status}`);
      const data = await readJsonWithLimit(res);
      validateLanguagePack(data);
      await installLanguagePlugin({ id: plugin.id, name: plugin.name, locale: plugin.locale, localeName: plugin.localeName, data, version: plugin.version, author: plugin.author, description: plugin.description });
      plugin.installed = true;
      refreshInstalledPlugins();
    } else if (plugin.type === 'theme' && plugin.downloadUrl) {
      const baseUrl = validateDownloadUrl(plugin.downloadUrl);
      const res = await fetch(`${baseUrl}/theme.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`下载主题文件失败: HTTP ${res.status}`);
      const data = await readJsonWithLimit(res);
      validateThemePack(data);
      await installThemePlugin({ id: plugin.id, name: plugin.name, themeId: plugin.themeId || plugin.id, data, version: plugin.version, author: plugin.author, description: plugin.description });
      plugin.installed = true;
      window.dispatchEvent(new CustomEvent('theme-plugin-changed'));
      refreshInstalledPlugins();
    }
  } catch (err) {
    console.error('安装插件失败:', err);
    alert(`安装插件失败: ${err.message}`);
  }
};

const togglePlugin = async (plugin) => { plugin.installed ? await handleUninstallPlugin(plugin) : await installPlugin(plugin); };

const handleTogglePlugin = async (plugin) => {
  try {
    plugin.status === 'active' ? await pluginManager.unloadPlugin(plugin.id) : await pluginManager.loadPlugin(plugin.id);
    if (plugin.type === 'theme') window.dispatchEvent(new CustomEvent('theme-plugin-changed'));
    refreshInstalledPlugins();
  } catch (err) { console.error('切换插件状态失败:', err); }
};

const handleUninstallPlugin = async (plugin) => {
  try {
    if (plugin.type === 'language') await uninstallLanguagePlugin(plugin.id);
    else if (plugin.type === 'theme') { await uninstallThemePlugin(plugin.id); window.dispatchEvent(new CustomEvent('theme-plugin-changed')); }
    else await pluginManager.removePlugin(plugin.id);
    refreshInstalledPlugins();
    const sp = plugins.value.find(p => p.id === plugin.id);
    if (sp) sp.installed = false;
  } catch (err) { console.error('卸载插件失败:', err); }
};

const handleTogglePluginInModal = async () => {
  if (!selectedPlugin.value) return;
  await handleTogglePlugin(selectedPlugin.value);
  const updated = pluginManager.getPlugin(selectedPlugin.value.id);
  if (updated) selectedPlugin.value = { ...updated };
};

const handleUninstallPluginInModal = async () => {
  if (!selectedPlugin.value) return;
  await handleUninstallPlugin(selectedPlugin.value);
  closePluginDetail();
};

const openLocalInstall = () => { showLocalInstall.value = true; localInstallError.value = null; localInstallSuccess.value = null; };
const closeLocalInstall = () => { showLocalInstall.value = false; localInstallError.value = null; localInstallSuccess.value = null; };
const resetLocalInstallState = () => { localInstallError.value = null; localInstallSuccess.value = null; };

const selectPluginFolder = async () => {
  try {
    const selected = await open({ directory: true, multiple: false, title: t('plugin.selectPluginFolder') });
    if (selected) await processPluginFolder(selected);
  } catch (err) { console.error('选择文件夹失败:', err); localInstallError.value = `${t('plugin.selectFolderFailed')}: ${err.message}`; }
};

const processPluginFolder = async (folderPath) => {
  localInstallLoading.value = true;
  localInstallError.value = null;
  localInstallSuccess.value = null;
  try {
    let pluginMeta;
    try { pluginMeta = JSON.parse(await readTextFile(`${folderPath}/plugin.json`)); }
    catch { localInstallError.value = '未找到 plugin.json 文件'; return; }
    if (!pluginMeta.id || !pluginMeta.type || !pluginMeta.name) { localInstallError.value = 'plugin.json 格式无效'; return; }
    if (pluginManager.getPlugin(pluginMeta.id)) { localInstallError.value = `插件「${pluginMeta.name}」已安装`; return; }
    if (pluginMeta.type === 'language') await processLanguagePlugin(folderPath, pluginMeta);
    else if (pluginMeta.type === 'theme') await processThemePlugin(folderPath, pluginMeta);
    else if (pluginMeta.type === 'page') await processPagePlugin(folderPath, pluginMeta);
    else localInstallError.value = `暂不支持的插件类型: ${pluginMeta.type}`;
  } catch (err) { console.error('处理插件文件夹失败:', err); localInstallError.value = `安装失败: ${err.message}`; }
  finally { localInstallLoading.value = false; }
};

const processLanguagePlugin = async (folderPath, meta) => {
  const mainFile = meta.main || 'translations.json';
  let data;
  try { data = JSON.parse(await readTextFile(`${folderPath}/${mainFile}`)); }
  catch { localInstallError.value = `未找到翻译文件 ${mainFile}`; return; }
  if (!data || typeof data !== 'object') { localInstallError.value = t('plugin.invalidTranslationFile'); return; }
  await installLanguagePlugin({ id: meta.id, name: meta.name, locale: meta.locale, localeName: meta.localeName || meta.name, data, version: meta.version || '1.0.0', author: meta.author || 'Unknown', description: meta.description || '' });
  localInstallSuccess.value = `成功安装语言插件: ${meta.name}`;
  await fetchPlugins();
  refreshInstalledPlugins();
};

const processThemePlugin = async (folderPath, meta) => {
  const mainFile = meta.main || 'theme.json';
  let data;
  try { data = JSON.parse(await readTextFile(`${folderPath}/${mainFile}`)); }
  catch { localInstallError.value = `未找到主题文件 ${mainFile}`; return; }
  if (!data || typeof data !== 'object') { localInstallError.value = t('plugin.invalidThemeFile'); return; }
  await installThemePlugin({ id: meta.id, name: meta.name, themeId: meta.themeId || meta.id, data, version: meta.version || '1.0.0', author: meta.author || 'Unknown', description: meta.description || '' });
  localInstallSuccess.value = `成功安装主题插件: ${meta.name}`;
  window.dispatchEvent(new CustomEvent('theme-plugin-changed'));
  await fetchPlugins();
  refreshInstalledPlugins();
};

const processPagePlugin = async (folderPath, meta) => {
  // 读取配置文件
  const configFile = meta.main || 'config.json';
  let config;
  try {
    config = JSON.parse(await readTextFile(`${folderPath}/${configFile}`));
  } catch (error) {
    localInstallError.value = `无法读取配置文件 ${configFile}: ${error.message}`;
    return;
  }
  
  // 读取组件文件
  const componentFile = meta.componentFile || 'component.vue';
  let componentCode;
  try {
    componentCode = await readTextFile(`${folderPath}/${componentFile}`);
  } catch (error) {
    localInstallError.value = `无法读取组件文件 ${componentFile}: ${error.message}`;
    return;
  }
  
  // 安装插件
  await installPagePlugin({
    id: meta.id,
    name: meta.name,
    version: meta.version || '1.0.0',
    author: meta.author || 'Unknown',
    description: meta.description || '',
    data: {
      route: {
        ...config.route,
        componentCode: componentCode
      },
      menu: config.menu
    }
  });
  
  localInstallSuccess.value = `成功安装页面插件: ${meta.name}`;
  await fetchPlugins();
  refreshInstalledPlugins();
};

onMounted(async () => { refreshInstalledPlugins(); await fetchPlugins(); });
</script>


<style scoped>
.plugin-market {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-section {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
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
}

.search-input {
  width: 100%;
  padding: 14px 20px 14px 50px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 15px;
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.15);
}

.local-install-btn {
  padding: 12px 18px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.local-install-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-color);
  color: var(--text-primary);
  transform: translateY(-2px);
}

.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.category-tab {
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.category-tab:hover {
  background: var(--bg-tertiary);
}

.category-tab.active {
  background: var(--accent-color);
  color: white;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.category-tab:not(.active) .tab-badge {
  background: var(--accent-color);
  color: white;
}

.plugins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  overflow-y: auto;
  flex: 1;
  padding-bottom: 20px;
}

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

.loading-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  text-align: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

.retry-btn {
  margin-top: 16px;
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-button);
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

@media (max-width: 768px) {
  .plugin-market {
    padding: 16px;
  }

  .search-section {
    flex-direction: column;
    align-items: stretch;
  }

  .local-install-btn {
    justify-content: center;
  }

  .plugins-grid {
    grid-template-columns: 1fr;
  }
}
</style>
