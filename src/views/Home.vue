<template>
  <div class="home-container">
    <div 
      class="archive-list-container" 
      :class="{ 'no-scroll': showSearch }" 
      ref="scrollContainerRef"
    >
      <!-- 有存档时使用虚拟滚动 -->
      <template v-if="displayArchives.length > 0">
        <div
          class="archive-grid-virtual"
          :style="{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }"
        >
          <div
            v-for="virtualRow in rowVirtualizer.getVirtualItems()"
            :key="virtualRow.key"
            class="archive-row"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }"
          >
            <div class="archive-grid">
              <ArchiveCard 
                v-for="archive in getRowItems(virtualRow.index)" 
                :key="archive.id" 
                :archive="archive"
                :index="archive._originalIndex"
                :data-archive-id="archive.id"
                :class="{ 'deleting': deletingCardId === archive.id }"
                @toggle-visibility="handleToggleVisibility"
                @edit="handleEdit" 
                @delete="deleteArchive" 
                @select="selectArchive" 
              />
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <template v-else>
        <div v-if="archives.length > 0 && hasActiveFilters" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">🔍</div>
            <h3 class="empty-title">{{ $t('archiveSearch.noResults') }}</h3>
            <p class="empty-description">{{ $t('archiveSearch.noMatchingArchives') }}</p>
            <p class="empty-hint">{{ $t('archiveSearch.adjustSearchOrClearFilters') }}</p>
            <button class="empty-action" @click="clearAllFilters">{{ $t('archiveSearch.clearFilters') }}</button>
          </div>
        </div>
        <div v-else-if="dataLoadComplete && archives.length === 0" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">📁</div>
            <h3 class="empty-title">{{ $t('archiveSearch.noArchives') }}</h3>
            <p class="empty-description">{{ $t('archiveSearch.createNewArchive') }}</p>
            <button class="empty-action" @click="createNewArchive">{{ $t('archiveSearch.createArchive') }}</button>
          </div>
        </div>
      </template>
    </div>

    <!-- 搜索面板 -->
    <Teleport to="body">
      <transition name="search-panel" @before-enter="beforeSearchEnter" @enter="searchEnter" @leave="searchLeave">
        <div v-show="showSearch && !loading" class="search-overlay">
          <ArchiveSearchFilter 
            :archives="archives" 
            :initial-filters="lastSearchFilters" 
            :visible="showSearch"
            @filtered="handleFilteredArchives" 
            @filters-changed="updateLastFilters" 
            @close="toggleSearch"
            ref="archiveSearchFilter" 
          />
        </div>
      </transition>
    </Teleport>

    <!-- 删除确认 -->
    <ConfirmModal 
      v-model:show="showDeleteConfirm" 
      :title="$t('confirmModal.deleteArchiveTitle')"
      :message="$t('confirmModal.deleteArchiveMessage', { name: archiveToDelete?.name || '' })"
      :description="$t('confirmModal.deleteArchiveDescription')" 
      type="danger"
      :confirm-text="$t('confirmModal.confirm')" 
      :cancel-text="$t('confirmModal.cancel')" 
      :loading="isDeleting"
      @confirm="confirmDelete" 
      @cancel="cancelDelete" 
    />

    <!-- 性能设置 -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showPerformanceSettings" class="modal-overlay" @click.self="showPerformanceSettings = false">
          <div class="modal-container">
            <div class="modal-header">
              <h2 class="modal-title">性能设置</h2>
              <button class="modal-close" @click="showPerformanceSettings = false">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <PerformanceSettings 
                v-model:performanceMode="performanceMode"
                v-model:animationQuality="animationQuality" 
                v-model:hardwareAcceleration="hardwareAcceleration"
                v-model:virtualizationEnabled="virtualizationEnabled" 
              />
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 浮动按钮 -->
    <FloatingActionButton 
      :class="loading ? 'loading' : ''" 
      :current-index="fabCurrentIndex"
      @update:current-index="fabCurrentIndex = $event" 
      @search-click="toggleSearch" 
      @refresh-click="refreshArchives"
      @folder-click="openSaveGamesFolder" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, nextTick, watch, computed } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { protectFloatingButtonPosition } from '../utils/floatingButtonProtection.js'
import ArchiveCard from '../components/ArchiveCard.vue'
import ArchiveSearchFilter from '../components/ArchiveSearchFilter.vue'
import FloatingActionButton from '../components/FloatingActionButton.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import PerformanceSettings from '../components/PerformanceSettings.vue'
import { useArchiveData } from '../composables/useArchiveData'
import { useArchiveFilters } from '../composables/useArchiveFilters'
import { useArchiveActions } from '../composables/useArchiveActions'
import { usePerformanceMonitor } from '../composables/usePerformanceMonitor'
import { useAnimations } from '../composables/useAnimations'
import { useFloatingButton } from '../composables/useFloatingButton'

// Composables
const archiveData = useArchiveData()
const { archives, displayArchives, loading, dataLoadComplete, initializeArchives, refreshArchives: refreshArchivesBase, refreshArchivesSilent } = archiveData

const archiveFilters = useArchiveFilters()
const { lastSearchFilters, hasActiveFilters, debouncedApplyFilters, updateFilters, resetFilters } = archiveFilters

const archiveActions = useArchiveActions(archiveData, archiveFilters)
const { showDeleteConfirm, archiveToDelete, isDeleting, deletingCardId, selectArchive, handleToggleVisibility: handleToggleVisibilityBase, handleEdit, deleteArchive, confirmDelete: confirmDeleteBase, cancelDelete, createNewArchive, openSaveGamesFolder: openSaveGamesFolderBase } = archiveActions

const performanceMonitor = usePerformanceMonitor()
const { showPerformanceSettings, performanceMode, animationQuality, hardwareAcceleration, virtualizationEnabled, initPerformanceMonitor, cleanup: cleanupPerformance } = performanceMonitor

const animations = useAnimations(performanceMode, animationQuality)
const { beforeSearchEnter, searchEnter, searchLeave } = animations

const floatingButton = useFloatingButton()
const { fabCurrentIndex, enhancedProtectFloatingButton, initFloatingButtonProtection, startPositionChecker, cleanup: cleanupFloatingButton } = floatingButton

// 本地状态
const scrollContainerRef = ref(null)
const archiveSearchFilter = ref(null)
const showSearch = ref(false)
const isPageActive = ref(false)
const columnsPerRow = ref(4)
const savedScrollTop = ref(0) // 保存滚动位置
const shouldResetScroll = ref(false) // 是否需要重置滚动

// 计算列数
const calcColumnsPerRow = () => {
  if (!scrollContainerRef.value) return 4
  const width = scrollContainerRef.value.clientWidth - 40
  // 最小卡片宽度320px + gap 20px
  return Math.max(1, Math.floor((width + 20) / 340))
}

// 计算行数
const rowCount = computed(() => {
  if (displayArchives.value.length === 0) return 0
  return Math.ceil(displayArchives.value.length / columnsPerRow.value)
})

// 获取某行的卡片
const getRowItems = (rowIndex) => {
  const cols = columnsPerRow.value
  const startIdx = rowIndex * cols
  const endIdx = Math.min(startIdx + cols, displayArchives.value.length)
  return displayArchives.value.slice(startIdx, endIdx).map((archive, i) => ({
    ...archive,
    _originalIndex: startIdx + i
  }))
}

// 虚拟化器配置
const virtualizerOptions = computed(() => ({
  count: rowCount.value,
  getScrollElement: () => scrollContainerRef.value,
  estimateSize: () => 180, // 卡片高度160px + gap 20px
  overscan: 5
}))

// 虚拟化器
const rowVirtualizer = useVirtualizer(virtualizerOptions)

// 方法
const toggleSearch = () => {
  showSearch.value = !showSearch.value
  if (showSearch.value) nextTick(() => protectFloatingButtonPosition())
}

const updateLastFilters = (filters) => updateFilters(filters)

const handleFilteredArchives = (filteredArchives) => {
  if (!loading.value) {
    shouldResetScroll.value = true // 筛选变化时重置滚动
    displayArchives.value = filteredArchives
    nextTick(() => enhancedProtectFloatingButton())
  }
}

const clearAllFilters = () => {
  displayArchives.value = []
  if (archiveSearchFilter.value?.clearAllFilters) archiveSearchFilter.value.clearAllFilters()
  resetFilters()
  shouldResetScroll.value = true // 清除筛选时重置滚动
  nextTick(() => setTimeout(() => {
    displayArchives.value = [...archives.value]
    enhancedProtectFloatingButton()
  }, 400))
}

const handleToggleVisibility = (archive) => {
  handleToggleVisibilityBase(archive, {
    onRefresh: () => initializeArchives(true),
    onSuccess: () => protectFloatingButtonPosition()
  })
}

const confirmDelete = () => {
  confirmDeleteBase({
    onSuccess: () => {
      debouncedApplyFilters(archives.value, lastSearchFilters.value, (filtered) => { displayArchives.value = filtered })
      protectFloatingButtonPosition()
    }
  })
}

const refreshArchives = async () => {
  await refreshArchivesBase()
  debouncedApplyFilters(archives.value, lastSearchFilters.value, (filtered) => { displayArchives.value = filtered })
}

const openSaveGamesFolder = () => {
  openSaveGamesFolderBase({
    onSuccess: () => {
      enhancedProtectFloatingButton()
      setTimeout(enhancedProtectFloatingButton, 300)
    }
  })
}

const updateContainerSize = () => {
  columnsPerRow.value = calcColumnsPerRow()
}

// 生命周期
let isUnmounted = false
let resizeObserver = null

// 恢复滚动位置的函数
const restoreScrollPosition = () => {
  if (savedScrollTop.value > 0 && scrollContainerRef.value) {
    updateContainerSize()
    scrollContainerRef.value.scrollTop = savedScrollTop.value
    scrollContainerRef.value.dispatchEvent(new Event('scroll'))
  }
}

// keep-alive 激活时
onActivated(async () => {
  isPageActive.value = true
  // 先立即恢复滚动位置
  restoreScrollPosition()
  // 刷新数据
  await refreshArchivesSilent()
  // 数据更新后再次恢复滚动位置
  nextTick(() => restoreScrollPosition())
})

// keep-alive 停用时
onDeactivated(() => {
  // 保存滚动位置
  if (scrollContainerRef.value) {
    savedScrollTop.value = scrollContainerRef.value.scrollTop
  }
  isPageActive.value = false
})

onMounted(async () => {
  initPerformanceMonitor()
  setTimeout(initFloatingButtonProtection, 1000)
  startPositionChecker()
  
  await initializeArchives(true)
  displayArchives.value = [...archives.value]
  
  nextTick(() => updateContainerSize())
  
  isPageActive.value = true
  await refreshArchivesSilent()
  
  window.cleanupRouteWatcher = () => {}
  
  const handleResize = () => {
    if (!isUnmounted) {
      updateContainerSize()
      protectFloatingButtonPosition()
    }
  }
  window.addEventListener('resize', handleResize)
  
  if (scrollContainerRef.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => {
      if (!isUnmounted) updateContainerSize()
    })
    resizeObserver.observe(scrollContainerRef.value)
  }
})

onUnmounted(() => {
  isUnmounted = true
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null }
  cleanupPerformance()
  cleanupFloatingButton()
  if (window.cleanupRouteWatcher) { try { window.cleanupRouteWatcher(); delete window.cleanupRouteWatcher } catch (e) {} }
  window.removeEventListener('resize', () => {})
})

watch(archives, (newArchives) => {
  debouncedApplyFilters(newArchives, lastSearchFilters.value, (filtered) => { displayArchives.value = filtered })
}, { deep: true })

watch(displayArchives, () => {
  // 只在需要时重置滚动位置（筛选变化时）
  if (shouldResetScroll.value && scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
    shouldResetScroll.value = false
  }
  nextTick(() => updateContainerSize())
}, { deep: false })
</script>

<style scoped>
.home-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.archive-list-container {
  height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
  padding: 20px;
  box-sizing: border-box;
  /* 优化滚动性能 */
  -webkit-overflow-scrolling: touch;
  contain: strict;
}

.archive-list-container.no-scroll {
  overflow: hidden;
}

.archive-grid-virtual {
  padding-bottom: 80px;
  contain: layout style;
}

.archive-row {
  padding: 0;
  contain: layout style;
}

.archive-grid {
  display: grid;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.archive-grid :deep(.archive-card) {
  width: 100%;
  min-width: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease;
  transform-origin: center center;
  contain: layout style paint;
}

.archive-grid :deep(.archive-card.deleting) {
  pointer-events: none;
}

.archive-grid :deep(.archive-card:hover) {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  padding: 48px 24px;
  width: 100%;
}

.empty-content {
  text-align: center;
  max-width: 400px;
  padding: 48px;
  background: var(--card-bg);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.empty-content:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.empty-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--text-tertiary);
  margin-bottom: 24px;
}

.empty-action {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-action:hover {
  transform: translateY(-2px);
}

.search-overlay {
  position: fixed !important;
  inset: 0 !important;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.modal-container {
  background: var(--card-bg);
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 8px;
}

.modal-close:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 20px;
}

.loading {
  opacity: 0.6;
  pointer-events: none;
}

.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container, .modal-leave-to .modal-container {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .archive-list-container {
    padding: 12px;
  }
  .archive-grid {
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .archive-list-container {
    padding: 8px;
  }
  .archive-grid {
    gap: 12px;
    grid-template-columns: 1fr;
  }
}

@media (prefers-color-scheme: dark) {
  .empty-content {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.05);
  }
}

.archive-list-container::-webkit-scrollbar {
  width: 8px;
}

.archive-list-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

.archive-list-container::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 4px;
}
</style>
