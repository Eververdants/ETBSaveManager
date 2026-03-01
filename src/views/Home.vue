<template>
  <div class="home-container">
    <div class="archive-list-container" :class="{ 'no-scroll': showSearch }" ref="scrollContainerRef">
      <!-- 有存档时使用虚拟滚动 -->
      <template v-if="displayArchives.length > 0">
        <div class="archive-grid-virtual" :style="{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }">
          <!-- 虚拟滚动行 -->
          <div v-for="virtualRow in rowVirtualizer.getVirtualItems()" :key="virtualRow.key" class="archive-row" :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }">
            <div class="archive-grid">
              <ArchiveCard v-for="archive in getRowItems(virtualRow.index)" :key="archive.id" :archive="archive"
                :index="archive._originalIndex" :data-archive-id="archive.id"
                :class="{ deleting: deletingCardId === archive.id }" @toggle-visibility="handleToggleVisibility"
                @edit="handleEdit" @delete="deleteArchive" @select="selectArchive" />
            </div>
          </div>
          <!-- 保险机制：当虚拟列表返回空时，强制渲染第一行 -->
          <div v-if="rowVirtualizer.getVirtualItems().length === 0" class="archive-row" :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '180px',
          }">
            <div class="archive-grid">
              <ArchiveCard v-for="archive in getRowItems(0)" :key="archive.id" :archive="archive"
                :index="archive._originalIndex" :data-archive-id="archive.id"
                :class="{ deleting: deletingCardId === archive.id }" @toggle-visibility="handleToggleVisibility"
                @edit="handleEdit" @delete="deleteArchive" @select="selectArchive" />
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <template v-else>
        <div v-if="archives.length > 0 && hasActiveFilters" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">🔍</div>
            <h3 class="empty-title">{{ $t("archiveSearch.noResults") }}</h3>
            <p class="empty-description">
              {{ $t("archiveSearch.noMatchingArchives") }}
            </p>
            <p class="empty-hint">
              {{ $t("archiveSearch.adjustSearchOrClearFilters") }}
            </p>
            <button class="empty-action" @click="clearAllFilters">
              {{ $t("archiveSearch.clearFilters") }}
            </button>
          </div>
        </div>
        <div v-else-if="dataLoadComplete && archives.length === 0" class="empty-state">
          <div class="empty-content">
            <div class="empty-icon">📁</div>
            <h3 class="empty-title">{{ $t("archiveSearch.noArchives") }}</h3>
            <p class="empty-description">
              {{ $t("archiveSearch.createNewArchive") }}
            </p>
            <button class="empty-action" @click="createNewArchive">
              {{ $t("archiveSearch.createArchive") }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- 搜索面板 -->
    <Teleport to="body">
      <transition name="search-panel" @before-enter="beforeSearchEnter" @enter="searchEnter" @leave="searchLeave">
        <div v-show="showSearch && !loading" class="search-overlay">
          <ArchiveSearchFilter :archives="archives" :initial-filters="lastSearchFilters" :visible="showSearch"
            @filtered="handleFilteredArchives" @filters-changed="updateLastFilters" @close="toggleSearch"
            ref="archiveSearchFilter" />
        </div>
      </transition>
    </Teleport>

    <!-- 删除确认 -->
    <Teleport to="body">
      <ConfirmModal v-model:show="showDeleteConfirm" :title="$t('confirmModal.deleteArchiveTitle')" :message="$t('confirmModal.deleteArchiveMessage', {
        name: archiveToDelete?.name || '',
      })
        " :description="$t('confirmModal.deleteArchiveDescription')" type="danger"
        :confirm-text="$t('confirmModal.confirm')" :cancel-text="$t('confirmModal.cancel')" :loading="isDeleting"
        :archive-details="archiveToDelete" @confirm="confirmDelete" @cancel="cancelDelete" />
    </Teleport>

    <!-- 性能设置 -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showPerformanceSettings" class="modal-overlay" @click.self="showPerformanceSettings = false">
          <div class="modal-container">
            <div class="modal-header">
              <h2 class="modal-title">性能设置</h2>
              <button class="modal-close" @click="showPerformanceSettings = false">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <PerformanceSettings v-model:performanceMode="performanceMode" v-model:animationQuality="animationQuality"
                v-model:hardwareAcceleration="hardwareAcceleration"
                v-model:virtualizationEnabled="virtualizationEnabled" />
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 浮动按钮 -->
    <FloatingActionButton :class="loading ? 'loading' : ''" :current-index="fabCurrentIndex"
      @update:current-index="fabCurrentIndex = $event" @search-click="toggleSearch" @refresh-click="refreshArchives"
      @folder-click="openSaveGamesFolder" />
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  onActivated,
  onDeactivated,
  nextTick,
  watch,
  computed,
} from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { protectFloatingButtonPosition } from "../utils/floatingButtonProtection.js";
import ArchiveCard from "../components/archive/ArchiveCard.vue";
import ArchiveSearchFilter from "../components/archive/ArchiveSearchFilter.vue";
import FloatingActionButton from "../components/feature/FloatingActionButton.vue";
import ConfirmModal from "../components/modal/ConfirmModal.vue";
import PerformanceSettings from "../components/system/PerformanceSettings.vue";
import { useArchiveData } from "../composables/useArchiveData";
import { useArchiveFilters } from "../composables/useArchiveFilters";
import { useArchiveActions } from "../composables/useArchiveActions";
import { usePerformanceMonitor } from "../composables/usePerformanceMonitor";
import { useAnimations } from "../composables/useAnimations";
import { useFloatingButton } from "../composables/useFloatingButton";
import { useToast } from "../composables/useToast";

// Composables
const archiveData = useArchiveData();
const {
  archives,
  displayArchives,
  loading,
  dataLoadComplete,
  initializeArchives,
  refreshArchives: refreshArchivesBase,
  refreshArchivesSilent,
} = archiveData;

const archiveFilters = useArchiveFilters();
const {
  lastSearchFilters,
  hasActiveFilters,
  debouncedApplyFilters,
  updateFilters,
  resetFilters,
} = archiveFilters;

const archiveActions = useArchiveActions(archiveData, archiveFilters);
const {
  showDeleteConfirm,
  archiveToDelete,
  isDeleting,
  deletingCardId,
  selectArchive,
  handleToggleVisibility: handleToggleVisibilityBase,
  handleEdit,
  deleteArchive,
  confirmDelete: confirmDeleteBase,
  cancelDelete,
  createNewArchive,
  openSaveGamesFolder: openSaveGamesFolderBase,
} = archiveActions;

const performanceMonitor = usePerformanceMonitor();
const {
  showPerformanceSettings,
  performanceMode,
  animationQuality,
  hardwareAcceleration,
  virtualizationEnabled,
  initPerformanceMonitor,
  cleanup: cleanupPerformance,
} = performanceMonitor;

const animations = useAnimations(performanceMode, animationQuality);
const { beforeSearchEnter, searchEnter, searchLeave } = animations;

const floatingButton = useFloatingButton();
const {
  fabCurrentIndex,
  enhancedProtectFloatingButton,
  initFloatingButtonProtection,
  startPositionChecker,
  cleanup: cleanupFloatingButton,
} = floatingButton;

const toast = useToast();

// 本地状态
const scrollContainerRef = ref(null);
const archiveSearchFilter = ref(null);
const showSearch = ref(false);
const isPageActive = ref(false);
const columnsPerRow = ref(4);
const shouldResetScroll = ref(false); // 是否需要重置滚动

// 监听数据或列数变化，强制刷新虚拟滚动
watch([displayArchives, columnsPerRow], (newVal, oldVal) => {
  // 忽略初始化时的触发
  if (!scrollContainerRef.value) return;

  nextTick(() => {
    requestAnimationFrame(() => {
      if (rowVirtualizer && typeof rowVirtualizer.measure === 'function') {
        rowVirtualizer.measure();
      }
      // 再次刷新确保渲染
      requestAnimationFrame(() => {
        if (rowVirtualizer && typeof rowVirtualizer.measure === 'function') {
          rowVirtualizer.measure();
        }
      });
    });
  });
}, { flush: 'post' });

// 计算列数
const calcColumnsPerRow = () => {
  if (!scrollContainerRef.value) return 4;
  const width = scrollContainerRef.value.clientWidth - 40;
  // 最小卡片宽度320px + gap 20px
  return Math.max(1, Math.floor((width + 20) / 340));
};

// 计算行数
const rowCount = computed(() => {
  if (displayArchives.value.length === 0) return 0;
  return Math.ceil(displayArchives.value.length / columnsPerRow.value);
});

// 获取某行的卡片
const getRowItems = (rowIndex) => {
  const cols = columnsPerRow.value;
  const startIdx = rowIndex * cols;
  const endIdx = Math.min(startIdx + cols, displayArchives.value.length);
  return displayArchives.value.slice(startIdx, endIdx).map((archive, i) => ({
    ...archive,
    _originalIndex: startIdx + i,
  }));
};

// 虚拟化器配置
const virtualizerOptions = computed(() => ({
  count: rowCount.value,
  getScrollElement: () => scrollContainerRef.value,
  estimateSize: () => 180, // 卡片高度160px + gap 20px
  overscan: 2, // 减少 overscan，降低渲染数量
}));

// 虚拟化器
const rowVirtualizer = useVirtualizer(virtualizerOptions);

// 方法
const toggleSearch = () => {
  showSearch.value = !showSearch.value;
  if (showSearch.value) nextTick(() => protectFloatingButtonPosition());
};

const updateLastFilters = (filters) => updateFilters(filters);

const handleFilteredArchives = (filteredArchives) => {
  if (!loading.value) {
    shouldResetScroll.value = true; // 筛选变化时重置滚动
    displayArchives.value = filteredArchives;
    nextTick(() => enhancedProtectFloatingButton());
  }
};

const clearAllFilters = () => {
  displayArchives.value = [];
  if (archiveSearchFilter.value?.clearAllFilters)
    archiveSearchFilter.value.clearAllFilters();
  resetFilters();
  shouldResetScroll.value = true; // 清除筛选时重置滚动
  nextTick(() =>
    setTimeout(() => {
      displayArchives.value = [...archives.value];
      enhancedProtectFloatingButton();
    }, 400)
  );
};

const handleToggleVisibility = (archive) => {
  handleToggleVisibilityBase(archive, {
    onSuccess: () => protectFloatingButtonPosition(),
  });
};

const confirmDelete = () => {
  confirmDeleteBase({
    onSuccess: () => {
      debouncedApplyFilters(
        archives.value,
        lastSearchFilters.value,
        (filtered) => {
          displayArchives.value = filtered;
        }
      );
      protectFloatingButtonPosition();
    },
  });
};

const refreshArchives = async () => {
  await refreshArchivesBase();
  debouncedApplyFilters(archives.value, lastSearchFilters.value, (filtered) => {
    displayArchives.value = filtered;
  });
  toast.showSuccess("存档列表已刷新");
};

const openSaveGamesFolder = () => {
  openSaveGamesFolderBase({
    onSuccess: () => {
      enhancedProtectFloatingButton();
      setTimeout(enhancedProtectFloatingButton, 300);
    },
  });
};

const updateContainerSize = () => {
  columnsPerRow.value = calcColumnsPerRow();
};

// 在路由切换/尺寸变化后强制同步虚拟列表状态，避免首行卡片偶发不渲染
const syncVirtualList = ({ resetScroll = false } = {}) => {
  const container = scrollContainerRef.value;
  if (!container) return;

  if (resetScroll) {
    container.scrollTop = 0;
    if (typeof rowVirtualizer.scrollToOffset === "function") {
      rowVirtualizer.scrollToOffset(0);
    }
  }

  if (typeof rowVirtualizer.measure === "function") {
    rowVirtualizer.measure();
  }
};

const scheduleVirtualListSync = (options = {}) => {
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => syncVirtualList(options));
    });
  });
};

// 生命周期
let isUnmounted = false;
let resizeObserver = null;

// keep-alive 激活时
onActivated(async () => {
  isPageActive.value = true;

  // 强制刷新虚拟列表状态，避免首行不渲染
  await nextTick();

  // 重置滚动位置
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0;
  }

  // 刷新数据
  await refreshArchivesSilent();

  // 强制重新测量和渲染 - 使用多次 requestAnimationFrame 确保 DOM 已更新
  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 强制虚拟滚动器重新计算
        if (rowVirtualizer && typeof rowVirtualizer.measure === 'function') {
          rowVirtualizer.measure();
        }
        // 强制滚动到顶部
        if (typeof rowVirtualizer?.scrollToOffset === 'function') {
          rowVirtualizer.scrollToOffset(0, { align: 'start', behavior: 'auto' });
        }
        // 再次测量确保渲染正确
        requestAnimationFrame(() => {
          if (rowVirtualizer && typeof rowVirtualizer.measure === 'function') {
            rowVirtualizer.measure();
          }
          // 第三次测量，确保首行渲染
          setTimeout(() => {
            if (rowVirtualizer && typeof rowVirtualizer.measure === 'function') {
              rowVirtualizer.measure();
            }
          }, 50);
        });
      });
    });
  });
});

// keep-alive 停用时
onDeactivated(() => {
  isPageActive.value = false;
});

onMounted(async () => {
  initPerformanceMonitor();
  setTimeout(initFloatingButtonProtection, 1000);
  startPositionChecker();

  await initializeArchives(true);
  displayArchives.value = [...archives.value];

  // 等待 DOM 更新后再初始化虚拟滚动
  await nextTick();
  updateContainerSize();

  // 多次强制刷新确保首行渲染
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (rowVirtualizer && typeof rowVirtualizer.measure === 'function') {
        rowVirtualizer.measure();
      }
      requestAnimationFrame(() => {
        if (rowVirtualizer && typeof rowVirtualizer.measure === 'function') {
          rowVirtualizer.measure();
        }
      });
    });
  });

  isPageActive.value = true;
  await refreshArchivesSilent();

  // 数据刷新后再次强制刷新
  nextTick(() => {
    requestAnimationFrame(() => {
      if (rowVirtualizer && typeof rowVirtualizer.measure === 'function') {
        rowVirtualizer.measure();
      }
      setTimeout(() => {
        if (rowVirtualizer && typeof rowVirtualizer.measure === 'function') {
          rowVirtualizer.measure();
        }
      }, 100);
    });
  });

  window.cleanupRouteWatcher = () => { };

  const handleResize = () => {
    if (!isUnmounted) {
      updateContainerSize();
      scheduleVirtualListSync();
      protectFloatingButtonPosition();
    }
  };
  window.addEventListener("resize", handleResize);

  if (scrollContainerRef.value && "ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      if (!isUnmounted) {
        updateContainerSize();
        scheduleVirtualListSync();
      }
    });
    resizeObserver.observe(scrollContainerRef.value);
  }
});

onUnmounted(() => {
  isUnmounted = true;
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  cleanupPerformance();
  cleanupFloatingButton();
  if (window.cleanupRouteWatcher) {
    try {
      window.cleanupRouteWatcher();
      delete window.cleanupRouteWatcher;
    } catch (e) { }
  }
  window.removeEventListener("resize", () => { });
});

watch(
  archives,
  (newArchives) => {
    debouncedApplyFilters(newArchives, lastSearchFilters.value, (filtered) => {
      displayArchives.value = filtered;
    });
  },
  { deep: true }
);

watch(
  displayArchives,
  () => {
    const needResetScroll = shouldResetScroll.value;
    // 只在需要时重置滚动位置（筛选变化时）
    if (needResetScroll && scrollContainerRef.value) {
      scrollContainerRef.value.scrollTop = 0;
      shouldResetScroll.value = false;
    }
    nextTick(() => {
      updateContainerSize();
      scheduleVirtualListSync({ resetScroll: needResetScroll });
    });
  },
  { deep: false }
);

watch(columnsPerRow, () => {
  scheduleVirtualListSync();
});
</script>

<style scoped>
.home-container {
  position: relative;
  height: 100%;
  width: 100%;
  background: var(--bg-primary);
}

.archive-list-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
  padding: 20px;
  box-sizing: border-box;
  /* 优化滚动性能 */
  -webkit-overflow-scrolling: touch;
}

.archive-list-container.no-scroll {
  overflow: hidden;
}

.archive-grid-virtual {
  padding-bottom: 80px;
}

.archive-row {
  padding: 0;
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
  transition: box-shadow 0.2s ease, transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center center;
}

.archive-grid :deep(.archive-card.deleting) {
  pointer-events: none;
  transition: opacity 0.2s linear !important;
  transform: none !important;
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
  background: linear-gradient(135deg,
      var(--primary-color),
      var(--primary-light));
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

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
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
