<template>
  <div class="home-container" :class="{ 'multi-select-mode': isMultiSelectMode }">
    <!-- Multi-select mode toolbar -->
    <transition name="toolbar-slide">
      <div v-show="isMultiSelectMode" class="multi-select-toolbar">
        <div class="toolbar-left">
          <button class="toolbar-btn" @click="exitMultiSelectMode">
            <font-awesome-icon icon="fa-solid fa-arrow-left" />
            {{ $t("archiveSearch.multiSelect.exit") }}
          </button>
          <button class="toolbar-btn" @click="selectAll">
            <font-awesome-icon icon="fa-solid fa-check-double" />
            {{ $t("archiveSearch.multiSelect.selectAll") }}
          </button>
          <button class="toolbar-btn" @click="invertSelection">
            <font-awesome-icon icon="fa-solid fa-exchange-alt" />
            {{ $t("archiveSearch.multiSelect.invertSelection") }}
          </button>
        </div>
        <div class="toolbar-right">
          <span class="selection-count">
            {{
              $t("archiveSearch.multiSelect.selected", {
                count: selectedArchives.size,
                total: archives.length,
              })
            }}
          </span>
          <button
            class="toolbar-btn danger"
            :disabled="selectedArchives.size === 0"
            @click="handleShowBatchDeleteConfirm"
          >
            <font-awesome-icon icon="fa-solid fa-trash-alt" />
            {{ $t("archiveSearch.multiSelect.batchDelete") }}
          </button>
        </div>
      </div>
    </transition>

    <div
      ref="scrollContainerRef"
      class="archive-list-container"
      :class="{ 'no-scroll': showSearch, 'multi-select-mode': isMultiSelectMode }"
    >
      <!-- Use virtual scrolling when archives exist -->
      <template v-if="displayArchives.length > 0">
        <div
          class="archive-grid-virtual"
          :style="{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }"
        >
          <!-- Virtual scrolling row -->
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
              transform: `translateY(${virtualRow.start}px)`,
            }"
          >
            <div
            class="archive-grid"
            >
              <ArchiveCard
                v-for="archive in getRowItems(virtualRow.index)"
                :key="archive.id"
                :archive="archive"
                :index="archive._originalIndex"
                :class="{
                  deleting: deletingCardId === archive.id,
                }"
                :is-multi-select-mode="isMultiSelectMode"
                :is-selected="selectedArchives.has(archive.id)"
                :search-query="activeSearchQuery"
                @toggle-visibility="handleToggleVisibility"
                @edit="handleEdit"
                @delete="deleteArchive"
                @select="selectArchive"
                @toggle-select="toggleArchiveSelection"
                @rename="handleRenameArchive"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
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

    <!-- Search panel -->
    <Teleport to="body">
      <transition name="search-panel" @before-enter="beforeSearchEnter" @enter="searchEnter" @leave="searchLeave">
        <div v-show="showSearch && !loading" class="search-overlay">
          <ArchiveSearchFilter
            ref="archiveSearchFilter"
            :archives="archives"
            :initial-filters="lastSearchFilters"
            :visible="showSearch"
            @filtered="handleFilteredArchives"
            @filters-changed="updateLastFilters"
            @close="toggleSearch"
          />
        </div>
      </transition>
    </Teleport>

    <!-- Delete confirmation -->
    <Teleport to="body">
      <ConfirmModal
        v-model:show="showDeleteConfirm"
        :title="$t('confirmModal.deleteArchiveTitle')"
        :message="
          $t('confirmModal.deleteArchiveMessage', {
            name: archiveToDelete?.name || '',
          })
        "
        :description="$t('confirmModal.deleteArchiveDescription')"
        type="danger"
        :confirm-text="$t('confirmModal.confirm')"
        :cancel-text="$t('confirmModal.cancel')"
        :loading="isDeleting"
        :archive-details="archiveToDelete"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </Teleport>

    <!-- Batch delete confirmation -->
    <Teleport to="body">
      <ConfirmModal
        v-model:show="showBatchDeleteConfirm"
        :title="$t('confirmModal.batchDeleteTitle')"
        :message="
          $t('confirmModal.batchDeleteMessage', {
            count: selectedArchives.size,
          })
        "
        :description="$t('confirmModal.batchDeleteDescription')"
        type="danger"
        :confirm-text="$t('confirmModal.confirm')"
        :cancel-text="$t('confirmModal.cancel')"
        :loading="isBatchDeleting"
        @confirm="confirmBatchDelete"
        @cancel="cancelBatchDelete"
      />
    </Teleport>

    <!-- Performance settings -->
    <Teleport to="body">
      <transition name="modal">
        <div v-if="showPerformanceSettings" class="modal-overlay" @click.self="showPerformanceSettings = false">
          <div class="modal-container">
            <div class="modal-header">
              <h2 class="modal-title">{{ $t("performanceSettings.title") }}</h2>
              <button class="modal-close" @click="showPerformanceSettings = false">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <PerformanceSettings
                v-model:performance-mode="performanceMode"
                v-model:animation-quality="animationQuality"
                v-model:hardware-acceleration="hardwareAcceleration"
                v-model:virtualization-enabled="virtualizationEnabled"
              />
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Floating action button -->
    <FloatingActionButton
      :class="loading ? 'loading' : ''"
      :current-index="fabCurrentIndex"
      @update:current-index="fabCurrentIndex = $event"
      @search-click="toggleSearch"
      @refresh-click="refreshArchives"
      @folder-click="openSaveGamesFolder"
      @multi-select-click="enterMultiSelectMode"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, nextTick, watch, computed } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { useI18n } from "vue-i18n";
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
import { markInitialLoadComplete, resetInitialLoad } from "../composables/useArchiveCard";


// Composables
const archiveData = useArchiveData();
const {
  archives,
  displayArchives,
  loading,
  dataLoadComplete,
  incrementalLoadState,
  initializeArchives,
  refreshArchives: refreshArchivesBase,
  refreshArchivesSilent,
} = archiveData;

const archiveFilters = useArchiveFilters();
const { lastSearchFilters, hasActiveFilters, debouncedApplyFilters, updateFilters, resetFilters } = archiveFilters;

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
  batchDeleteArchives,
  registerUndoShortcuts,
  unregisterUndoShortcuts,
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
const { fabCurrentIndex, initButtonProtection, cleanup: cleanupFloatingButton } = floatingButton;

const toast = useToast();

const { t } = useI18n();

// Local state
const scrollContainerRef = ref(null);
const archiveSearchFilter = ref(null);
const showSearch = ref(false);
const isPageActive = ref(false);
const columnsPerRow = ref(4);
const shouldResetScroll = ref(false);
const activeSearchQuery = ref("");

// Multi-select mode state
const isMultiSelectMode = ref(false);
const selectedArchives = ref(new Set());
const showBatchDeleteConfirm = ref(false);
const isBatchDeleting = ref(false);

// Schedule a single virtualizer remeasure after DOM update
const remeasureVirtualizer = () => {
  nextTick(() => {
    rowVirtualizer?.measure?.();
  });
};

// Debounced container size update (300ms) to avoid excessive measurement
let resizeTimer = null;
const debouncedUpdateContainerSize = () => {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    updateContainerSize();
    syncVirtualList();
    protectFloatingButtonPosition();
    resizeTimer = null;
  }, 300);
};

// Watch for data or column count changes, remeasure virtual scrolling
watch(
  [displayArchives, columnsPerRow],
  () => {
    if (!scrollContainerRef.value) return;
    remeasureVirtualizer();
  },
  { flush: "post" },
);

// Calculate column count
const calcColumnsPerRow = () => {
  if (!scrollContainerRef.value) return 4;
  const width = scrollContainerRef.value.clientWidth - 40;
  // Minimum card width 320px + gap 20px
  return Math.max(1, Math.floor((width + 20) / 340));
};

// Calculate row count
const rowCount = computed(() => {
  if (displayArchives.value.length === 0) return 0;
  return Math.ceil(displayArchives.value.length / columnsPerRow.value);
});

// Get cards for a given row
const getRowItems = (rowIndex) => {
  const cols = columnsPerRow.value;
  const startIdx = rowIndex * cols;
  const endIdx = Math.min(startIdx + cols, displayArchives.value.length);
  return displayArchives.value.slice(startIdx, endIdx).map((archive, i) => ({
    ...archive,
    _originalIndex: startIdx + i,
  }));
};

// Virtualizer configuration
const virtualizerOptions = computed(() => ({
  count: rowCount.value,
  getScrollElement: () => scrollContainerRef.value,
  estimateSize: () => 180, // Card height 160px + gap 20px
  overscan: 2, // Reduce overscan to lower render count
}));

// Virtualizer
const rowVirtualizer = useVirtualizer(virtualizerOptions);

// Methods
const toggleSearch = () => {
  showSearch.value = !showSearch.value;
  if (showSearch.value) nextTick(() => protectFloatingButtonPosition());
};

const openArchiveSearchPanel = () => {
  if (!showSearch.value) {
    showSearch.value = true;
  }
  nextTick(() => protectFloatingButtonPosition());
};

const handleOpenArchiveSearchEvent = (event) => {
  if (!isPageActive.value) return;

  const mode = event?.detail?.mode || "open";
  if (mode === "toggle") {
    toggleSearch();
    return;
  }

  if (mode === "close") {
    showSearch.value = false;
    return;
  }

  openArchiveSearchPanel();
};

const updateLastFilters = (filters) => updateFilters(filters);

const handleFilteredArchives = (filteredArchives) => {
  if (!loading.value) {
    shouldResetScroll.value = true; // Reset scroll when filter changes
    displayArchives.value = filteredArchives;
    // Get current search keyword from ArchiveSearchFilter for highlighting
    activeSearchQuery.value = archiveSearchFilter.value?.searchQuery || "";
    nextTick(() => protectFloatingButtonPosition());
  }
};

const clearAllFilters = () => {
  if (archiveSearchFilter.value?.clearAllFilters) archiveSearchFilter.value.clearAllFilters();
  resetFilters();
  shouldResetScroll.value = true;
  displayArchives.value = [...archives.value];
  activeSearchQuery.value = "";
  protectFloatingButtonPosition();
};

const handleToggleVisibility = (archive) => {
  handleToggleVisibilityBase(archive, {
    onSuccess: () => protectFloatingButtonPosition(),
  });
};

const handleRenameArchive = ({ id, name }) => {
  const archive = archives.value.find((a) => a.id === id);
  if (archive) {
    archive.name = name;
  }
  const displayArchive = displayArchives.value.find((a) => a.id === id);
  if (displayArchive) {
    displayArchive.name = name;
  }
  // Can send to backend for saving
  toast.showSuccess(t("archiveSearch.renameSuccess", "存档已重命名"));
};

const confirmDelete = () => {
  confirmDeleteBase({
    onSuccess: () => {
      debouncedApplyFilters(archives.value, lastSearchFilters.value, (filtered) => {
        displayArchives.value = filtered;
      });
      protectFloatingButtonPosition();
    },
  });
};

const refreshArchives = async () => {
  await refreshArchivesBase();
  debouncedApplyFilters(archives.value, lastSearchFilters.value, (filtered) => {
    displayArchives.value = filtered;
  });
  toast.showSuccess(t("archiveSearch.refreshed"));
};

const openSaveGamesFolder = () => {
  openSaveGamesFolderBase({
    onSuccess: () => {
      protectFloatingButtonPosition();
      setTimeout(protectFloatingButtonPosition, 300);
    },
  });
};

// Multi-select mode methods
const enterMultiSelectMode = () => {
  isMultiSelectMode.value = true;
  selectedArchives.value = new Set();
  // Disable page scrolling - disable both body and html
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
  document.documentElement.style.overflow = "hidden";
};

const exitMultiSelectMode = () => {
  isMultiSelectMode.value = false;
  selectedArchives.value = new Set();
  // Restore page scrolling
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
  document.body.style.height = "";
  document.documentElement.style.overflow = "";
};

const toggleArchiveSelection = (archiveId) => {
  const newSet = new Set(selectedArchives.value);
  if (newSet.has(archiveId)) {
    newSet.delete(archiveId);
  } else {
    newSet.add(archiveId);
  }
  selectedArchives.value = newSet;
};

const selectAll = () => {
  selectedArchives.value = new Set(displayArchives.value.map((a) => a.id));
};

const invertSelection = () => {
  const allIds = new Set(displayArchives.value.map((a) => a.id));
  const newSet = new Set(selectedArchives.value);
  allIds.forEach((id) => {
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
  });
  selectedArchives.value = newSet;
};

const handleShowBatchDeleteConfirm = () => {
  showBatchDeleteConfirm.value = true;
};

const cancelBatchDelete = () => {
  showBatchDeleteConfirm.value = false;
};

const confirmBatchDelete = async () => {
  isBatchDeleting.value = true;
  const idsToDelete = Array.from(selectedArchives.value);
  const archivesToDelete = archives.value.filter((a) => idsToDelete.includes(a.id));

  await batchDeleteArchives(archivesToDelete, {
    onSuccess: () => {
      isBatchDeleting.value = false;
      showBatchDeleteConfirm.value = false;
      exitMultiSelectMode();

      debouncedApplyFilters(archives.value, lastSearchFilters.value, (filtered) => {
        displayArchives.value = filtered;
      });
    },
    onError: () => {
      isBatchDeleting.value = false;
      showBatchDeleteConfirm.value = false;
      exitMultiSelectMode();

      debouncedApplyFilters(archives.value, lastSearchFilters.value, (filtered) => {
        displayArchives.value = filtered;
      });
    },
  });
};

const updateContainerSize = () => {
  columnsPerRow.value = calcColumnsPerRow();
};

// Sync virtual list state after changes (resize, route activation)
const syncVirtualList = ({ resetScroll = false } = {}) => {
  const container = scrollContainerRef.value;
  if (!container) return;
  if (!rowVirtualizer || typeof rowVirtualizer.measure !== "function") return;

  if (resetScroll) {
    container.scrollTop = 0;
    rowVirtualizer.scrollToOffset?.(0);
  }

  rowVirtualizer.measure();
};

// Lifecycle
let isUnmounted = false;
let resizeObserver = null;

// On keep-alive activation
onActivated(async () => {
  isPageActive.value = true;
  resetInitialLoad();

  // Reset scroll position and update container size
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0;
  }
  updateContainerSize();

  // Refresh data, then remeasure once after DOM update
  await refreshArchivesSilent();
  nextTick(() => syncVirtualList({ resetScroll: true }));
});

// On keep-alive deactivation
onDeactivated(() => {
  isPageActive.value = false;
});

onMounted(async () => {
  window.addEventListener("open-archive-search", handleOpenArchiveSearchEvent);

  initPerformanceMonitor();
  setTimeout(initButtonProtection, 1000);

  await initializeArchives(true);
  displayArchives.value = [...archives.value];

  // Wait for DOM update, then initialize virtual scrolling
  await nextTick();
  updateContainerSize();
  remeasureVirtualizer();

  isPageActive.value = true;
  await refreshArchivesSilent();

  // Remeasure once after data refresh
  remeasureVirtualizer();

  window.cleanupRouteWatcher = () => {};

  const handleResize = () => {
    if (!isUnmounted) {
      debouncedUpdateContainerSize();
    }
  };
  window.addEventListener("resize", handleResize);

  if (scrollContainerRef.value && "ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      if (!isUnmounted) {
        debouncedUpdateContainerSize();
      }
    });
    resizeObserver.observe(scrollContainerRef.value);
  }

  markInitialLoadComplete();
  registerUndoShortcuts();
});

onUnmounted(() => {
  unregisterUndoShortcuts();
  window.removeEventListener("open-archive-search", handleOpenArchiveSearchEvent);

  isUnmounted = true;
  if (resizeTimer) {
    clearTimeout(resizeTimer);
    resizeTimer = null;
  }
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
    } catch (e) {
      console.warn("Failed to clean up route watcher:", e);
    }
  }
  window.removeEventListener("resize", () => {});
  // Restore page scrolling on component unmount
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
  document.body.style.height = "";
  document.documentElement.style.overflow = "";
});

// Shallow watch: only react to length changes (add/remove), not deep property changes.
// Individual property updates (e.g. isVisible) are handled by direct mutation methods.
watch(
  () => archives.value.length,
  () => {
    debouncedApplyFilters(archives.value, lastSearchFilters.value, (filtered) => {
      displayArchives.value = filtered;
    });
  },
);

watch(
  displayArchives,
  () => {
    const needResetScroll = shouldResetScroll.value;
    // Only reset scroll position when needed (on filter changes)
    if (needResetScroll && scrollContainerRef.value) {
      scrollContainerRef.value.scrollTop = 0;
      shouldResetScroll.value = false;
    }
    nextTick(() => {
      updateContainerSize();
      syncVirtualList({ resetScroll: needResetScroll });
    });
  },
  { deep: false },
);

watch(columnsPerRow, () => {
  syncVirtualList();
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
  height: calc(100% - 40px);
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
  padding: 0 20px;
  box-sizing: border-box;
  /* Optimize scroll performance */
  -webkit-overflow-scrolling: touch;
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 20px;
  border-radius: var(--radius-lg);
}

.archive-list-container.no-scroll {
  overflow: hidden;
}

/* Adjust archive list container height in multi-select mode */
.archive-list-container.multi-select-mode {
  height: calc(100% - 100px);
}

.archive-grid-virtual {
  padding-bottom: 100px;
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
  transition:
    box-shadow 0.2s ease,
    transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform-origin: center center;
}

.archive-grid :deep(.archive-card.deleting) {
  pointer-events: none;
  transition: opacity 0.2s linear !important;
  transform: none !important;
}

.archive-grid :deep(.archive-card:hover) {
  box-shadow: var(--card-shadow-hover);
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

.multi-select-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-5);
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  gap: var(--space-4);
  transition:
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
  transform: translateY(0);
}

.multi-select-toolbar .toolbar-left,
.multi-select-toolbar .toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.multi-select-toolbar .toolbar-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--btn-secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-button);
  color: var(--text-color);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.multi-select-toolbar .toolbar-btn:hover:not(:disabled) {
  background: var(--btn-secondary-bg-hover);
  border-color: var(--primary);
  color: var(--primary);
}

.multi-select-toolbar .toolbar-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.multi-select-toolbar .toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.multi-select-toolbar .toolbar-btn.danger {
  background: var(--btn-danger-bg);
  border-color: var(--btn-danger-bg);
  color: var(--btn-danger-text);
}

.multi-select-toolbar .toolbar-btn.danger:hover:not(:disabled) {
  background: var(--btn-danger-bg-hover);
  border-color: var(--btn-danger-bg-hover);
  color: var(--btn-danger-text);
  box-shadow: var(--shadow-md);
}

.multi-select-toolbar .toolbar-btn.danger:active:not(:disabled) {
  transform: scale(0.97);
}

.multi-select-toolbar .selection-count {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  padding: var(--space-2) var(--space-4);
  background: rgba(0, 122, 255, 0.12);
  border-radius: var(--radius-pill);
}

.multi-select-toolbar .selection-count .count-number {
  font-weight: 600;
  color: var(--primary);
  font-size: 15px;
}

[data-theme="dark"] .multi-select-toolbar .selection-count {
  background: rgba(10, 132, 255, 0.15);
}

.toolbar-slide-enter-active,
.toolbar-slide-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toolbar-slide-enter-from,
.toolbar-slide-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.toolbar-slide-enter-to,
.toolbar-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
