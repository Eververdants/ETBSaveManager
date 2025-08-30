<template>
  <div class="archive-list-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <h3>{{ $t('archiveSearch.loadingArchives') }}</h3>
      <p>{{ $t('archiveSearch.scanningFiles') }}</p>
    </div>

    <!-- 存档网格 -->
    <transition-group name="archive-card" appear tag="div" class="archive-grid" ref="archiveGrid">
      <ArchiveCard v-for="(archive, index) in displayArchives" :key="archive.id" :archive="archive" :index="index"
        @click="selectArchive(archive)" @toggle-visibility="handleToggleVisibility" @edit="handleEdit"
        @delete="deleteArchive" />

      <div v-if="displayArchives.length === 0 && archives.length > 0" key="no-results" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>{{ $t('archiveSearch.noResults') }}</h3>
        <p>{{ $t('archiveSearch.noMatchingArchives') }}</p>
        <p style="margin-top: 8px; font-size: 14px; color: var(--text-secondary);">
          {{ $t('archiveSearch.adjustSearchOrClearFilters') }}
        </p>
      </div>

      <div v-else-if="displayArchives.length === 0 && archives.length === 0" key="no-archives" class="empty-state">
        <div class="empty-icon">📁</div>
        <h3>{{ $t('archiveSearch.noArchives') }}</h3>
        <p style="margin-top: 8px; font-size: 14px; color: var(--text-secondary);">
          {{ $t('archiveSearch.createNewArchive') }}
        </p>
      </div>
    </transition-group>

    <!-- 搜索存档组件 -->
    <transition name="search-panel">
      <ArchiveSearchFilter v-if="showSearch" :archives="archives" :initial-filters="lastSearchFilters"
        @filtered="handleFilteredArchives" @filters-changed="updateLastFilters" class="search-overlay" />
    </transition>

    <!-- 浮动操作按钮 -->
    <FloatingActionButton @search-click="toggleSearch" @refresh-click="refreshArchives"
      @folder-click="openSaveGamesFolder" />

    <!-- 删除确认模态框 -->
    <ConfirmModal v-model:show="showDeleteConfirm" :title="$t('confirmModal.deleteArchiveTitle')"
      :message="$t('confirmModal.deleteArchiveMessage', { name: archiveToDelete?.name || '' })"
      :description="$t('confirmModal.deleteArchiveDescription')" type="danger"
      :confirm-text="$t('confirmModal.confirm')" :cancel-text="$t('confirmModal.cancel')" :loading="isDeleting"
      @confirm="confirmDelete" @cancel="cancelDelete" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import ArchiveCard from '../components/ArchiveCard.vue'
import ArchiveSearchFilter from '../components/ArchiveSearchFilter.vue'
import FloatingActionButton from '../components/FloatingActionButton.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

// 从后端加载的真实存档数据
const archives = ref([])
const router = useRouter()

// 加载状态
const loading = ref(true)

// 加载真实存档数据
const loadRealArchives = async () => {
  try {
    // 调用后端的 load_all_saves 命令
    const response = await invoke('load_all_saves')
    if (response && Array.isArray(response)) {
      // 中文难度到英文的映射
      const difficultyMap = {
        '简单难度': 'easy',
        '普通难度': 'normal',
        '困难难度': 'hard',
        '噩梦难度': 'nightmare'
      }

      // 将后端返回的数据格式转换为前端需要的格式
      return response.map(item => ({
        id: item.id,
        name: item.name,
        currentLevel: item.current_level,
        gameMode: item.mode === '单人模式' ? 'singleplayer' :
          item.mode === '多人模式' ? 'multiplayer' :
            item.mode.toLowerCase(),
        archiveDifficulty: difficultyMap[item.difficulty] || item.difficulty.toLowerCase(),
        actualDifficulty: difficultyMap[item.actual_difficulty] || item.actual_difficulty.toLowerCase(),
        isVisible: !item.hidden,
        path: item.path,
        date: item.date
      }))
    }
    return []
  } catch (error) {
    console.error('加载存档失败:', error)
    return []
  }
}

// 初始化真实存档数据
const initializeArchives = async () => {
  loading.value = true
  const realArchives = await loadRealArchives()
  archives.value = realArchives

  // 如果没有找到存档，显示空列表
  if (realArchives.length === 0) {
    console.warn('未找到可加载的存档')
    archives.value = []
  }
  loading.value = false
}



// 搜索相关状态
const showSearch = ref(false)
const filteredArchives = ref([])
const displayArchives = ref([])

// 删除确认相关状态
const showDeleteConfirm = ref(false)
const archiveToDelete = ref(null)
const isDeleting = ref(false)

// 筛选状态持久化（内存中，不保存到本地存储）
const lastSearchFilters = ref({
  searchQuery: '',
  selectedGameMode: '',
  selectedArchiveDifficulty: '',
  selectedActualDifficulty: '',
  selectedVisibility: ''
})

// 初始化显示所有存档
displayArchives.value = [...archives.value]

// 应用筛选逻辑
const applyFilters = (archives, filters) => {
  if (!archives || archives.length === 0) return []

  let filtered = archives

  // 按名称搜索
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    filtered = filtered.filter(archive =>
      archive.name.toLowerCase().includes(query)
    )
  }

  // 按游戏模式筛选
  if (filters.selectedGameMode) {
    filtered = filtered.filter(archive =>
      archive.gameMode === filters.selectedGameMode
    )
  }

  // 按存档难度筛选
  if (filters.selectedArchiveDifficulty) {
    filtered = filtered.filter(archive =>
      archive.archiveDifficulty === filters.selectedArchiveDifficulty
    )
  }

  // 按实际难度筛选
  if (filters.selectedActualDifficulty) {
    filtered = filtered.filter(archive =>
      archive.actualDifficulty === filters.selectedActualDifficulty
    )
  }

  // 按可见性筛选
  if (filters.selectedVisibility) {
    const isVisible = filters.selectedVisibility === 'visible'
    filtered = filtered.filter(archive =>
      archive.isVisible === isVisible
    )
  }

  return filtered
}

// 性能监控：监听系统性能状态
const performanceObserver = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const longTaskCount = entries.filter(entry => entry.duration > 50).length

      if (longTaskCount > 5) {
        console.warn('检测到性能问题，建议减少动画或卡片数量')
      }
    })
    observer.observe({ entryTypes: ['longtask'] })
  }
}

// 页面加载完成后显示存档数量统计
setTimeout(() => {
  console.log(`📊 当前存档数量: ${archives.value.length} 个`)
}, 1500)

performanceObserver()

const archiveGrid = ref(null)

// 搜索相关方法
const toggleSearch = () => {
  showSearch.value = !showSearch.value
  // 不再重置显示，保持筛选结果
}

const updateLastFilters = (filters) => {
  lastSearchFilters.value = { ...filters }
}

const handleFilteredArchives = (archives) => {
  filteredArchives.value = archives
  displayArchives.value = archives
}

// 选择存档
const selectArchive = (archive) => {
  console.log('选择存档:', archive.name)
}

const handleToggleVisibility = async (updatedArchive) => {
  console.log('切换存档可见性:', updatedArchive.name)

  try {
    // 调用后端API移动文件
    if (updatedArchive.path) {
      const newPath = await invoke('handle_file', { filePath: updatedArchive.path })
      console.log('文件移动成功:', newPath)

      // 更新存档路径和隐藏状态
      updatedArchive.path = newPath
      updatedArchive.hidden = !updatedArchive.hidden
    }

    // 找到并更新对应的存档
    const index = archives.value.findIndex(a => a.id === updatedArchive.id)
    if (index > -1) {
      archives.value[index] = updatedArchive

      // 同步更新displayArchives，确保视图立即更新
      const displayIndex = displayArchives.value.findIndex(a => a.id === updatedArchive.id)
      if (displayIndex > -1) {
        displayArchives.value[displayIndex] = updatedArchive
      }

      // 如果当前有筛选器，重新应用筛选器（不刷新整个列表）
      if (lastSearchFilters.value && Object.keys(lastSearchFilters.value).length > 0) {
        const filtered = applyFilters(archives.value, lastSearchFilters.value)
        displayArchives.value = filtered
      }
    }
  } catch (error) {
    console.error('切换可见性失败:', error)
    alert('切换可见性失败: ' + error)

    // 如果失败，恢复原来的状态
    const index = archives.value.findIndex(a => a.id === updatedArchive.id)
    if (index > -1) {
      updatedArchive.isVisible = !updatedArchive.isVisible
      archives.value[index] = updatedArchive

      const displayIndex = displayArchives.value.findIndex(a => a.id === updatedArchive.id)
      if (displayIndex > -1) {
        displayArchives.value[displayIndex] = updatedArchive
      }
    }
  }
}

const handleEdit = (archive) => {
  console.log('编辑存档:', archive)
  router.push({
    name: 'EditArchive',
    params: { archiveData: JSON.stringify(archive) }
  })
}

const deleteArchive = (archive) => {
  console.log('准备删除存档:', archive.name)
  archiveToDelete.value = archive
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!archiveToDelete.value) return

  isDeleting.value = true
  const archive = archiveToDelete.value
  const index = archives.value.findIndex(a => a.id === archive.id)

  if (index > -1) {
    try {
      // 先调用后端删除实际文件
      if (archive.path) {
        await invoke('delete_file', { filePath: archive.path })
        console.log('成功删除存档文件:', archive.path)
      }

      // 从前端数据中移除
      archives.value.splice(index, 1)

      // 直接更新displayArchives，这会触发transition-group的离开动画
      if (lastSearchFilters.value && Object.keys(lastSearchFilters.value).some(key => lastSearchFilters.value[key])) {
        // 如果有筛选条件，重新应用筛选
        displayArchives.value = applyFilters(archives.value, lastSearchFilters.value)
      } else {
        // 如果没有筛选条件，直接显示所有存档
        displayArchives.value = [...archives.value]
      }

      // 等待动画完成后关闭模态框
      setTimeout(() => {
        closeDeleteModal()
      }, 400) // 与CSS动画时长匹配

    } catch (error) {
      console.error('删除存档失败:', error)
      alert('删除存档失败: ' + error)
      closeDeleteModal()
    }
  }
}

const cancelDelete = () => {
  closeDeleteModal()
}

const closeDeleteModal = () => {
  showDeleteConfirm.value = false
  archiveToDelete.value = null
  isDeleting.value = false
}

// 刷新存档列表
const refreshArchives = async () => {
  console.log('正在刷新存档列表...')
  loading.value = true

  try {
    // 重新加载真实存档数据
    const realArchives = await loadRealArchives()
    archives.value = realArchives

    // 如果没有找到存档，显示空列表
    if (realArchives.length === 0) {
      console.warn('未找到存档')
      archives.value = []
    }

    // 重新应用当前筛选器
    const filtered = applyFilters(archives.value, lastSearchFilters.value)
    displayArchives.value = filtered

    console.log(`已刷新存档列表，共找到 ${archives.value.length} 个存档`)

  } catch (error) {
    console.error('刷新存档失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开存档文件夹
const openSaveGamesFolder = async () => {
  console.log('正在打开存档文件夹...')

  try {
    await invoke('open_save_games_folder')
    console.log('成功打开存档文件夹')
  } catch (error) {
    console.error('打开文件夹失败:', error)
    alert('打开文件夹失败: ' + error)
  }
}

// 页面加载动画
onMounted(async () => {
  await nextTick()

  // 加载真实存档数据
  await initializeArchives()

  // 更新显示
  displayArchives.value = [...archives.value]

  // 让卡片动画在ArchiveCard组件内部处理，这里不再重复设置
})
</script>

<style scoped>
.archive-list-container {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 24px;
}

/* 存档网格 */
.archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 320px);
  gap: 24px;
  justify-content: center;
  max-width: 1400px;
  margin: 0 auto;
}

/* 动画 - 确保补位动画正常工作 */
.archive-card-enter-active,
.archive-card-leave-active,
.archive-card-move {
  transition: all 0.5s ease;
}

.archive-card-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.archive-card-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.archive-card-leave-active {
  position: absolute;
  z-index: 0;
}

/* 搜索面板样式 */
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: var(--search-overlay-bg, rgba(0, 0, 0, 0.5));
  backdrop-filter: var(--search-overlay-backdrop, blur(8px));
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;
  padding-top: 60px;
  width: 100%;
}

.search-overlay>.archive-search-filter {
  max-width: 1920px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  margin: 20px 0;
}

/* 搜索面板动画 */
.search-panel-enter-active,
.search-panel-leave-active {
  transition: all 0.3s ease;
}

.search-panel-enter-from,
.search-panel-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 24px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .archive-list-container {
    padding: 16px;
  }

  .page-title {
    font-size: 28px;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-container {
    max-width: none;
  }

  .archive-grid {
    grid-template-columns: repeat(auto-fill, 280px);
    gap: 20px;
  }

  .search-overlay {
    padding: 16px;
  }

  .search-overlay>.archive-search-filter {
    max-width: 100%;
    max-height: 85vh;
    margin: 16px 0;
  }
}

@media (max-width: 480px) {
  .archive-list-container {
    padding: 12px;
  }

  .swift-button {
    padding: 10px 20px;
    font-size: 14px;
  }

  .swift-search-input {
    padding: 10px 12px 10px 40px;
    font-size: 14px;
  }

  .archive-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .search-overlay {
    padding: 12px;
  }

  .search-overlay>.archive-search-filter {
    max-height: 80vh;
    margin: 12px 0;
  }
}
</style>