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
      v-squircle="44"
      :class="{ 'no-scroll': showSearch, 'multi-select-mode': isMultiSelectMode }"
    >
      <!-- Virtual scrolling via @tanstack/vue-virtual -->
      <template v-if="displayArchives.length > 0">
        <div
          :style="{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }"
        >
          <div
            v-for="virtualRow in rowVirtualizer.getVirtualItems()"
            :key="String(virtualRow.key)"
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
            <div class="archive-grid">
              <ArchiveCard
                v-for="(archive, colIndex) in getRowItems(virtualRow.index)"
                :key="archive.id"
                :data-archive-id="archive.id"
                :archive="archive"
                :index="virtualRow.index * columnsPerRow + colIndex"
                :class="{
                  deleting: deletingCardId === archive.id,
                }"
                :is-multi-select-mode="isMultiSelectMode"
                :is-selected="selectedArchives.has(archive.id)"
                :search-query="searchQuery"
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
          <div class="empty-content" v-squircle="52">
            <div class="empty-icon">🔍</div>
            <h3 class="empty-title">{{ $t("archiveSearch.noResults") }}</h3>
            <p class="empty-description">
              {{ $t("archiveSearch.noMatchingArchives") }}
            </p>
            <p class="empty-hint">
              {{ $t("archiveSearch.adjustSearchOrClearFilters") }}
            </p>
            <button class="empty-action" v-squircle:pill @click="clearAllFilters">
              {{ $t("archiveSearch.clearFilters") }}
            </button>
          </div>
        </div>
        <div v-else-if="dataLoadComplete && archives.length === 0" class="empty-state">
          <div class="empty-content" v-squircle="52">
            <div class="empty-icon">📁</div>
            <h3 class="empty-title">{{ $t("archiveSearch.noArchives") }}</h3>
            <p class="empty-description">
              {{ $t("archiveSearch.createNewArchive") }}
            </p>
            <button class="empty-action" v-squircle:pill @click="createNewArchive">
              {{ $t("archiveSearch.createArchive") }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Search panel -->
    <transition name="search-panel" @before-enter="(el: Element) => beforeSearchEnter(el as HTMLElement)" @enter="(el: Element, done: () => void) => searchEnter(el as HTMLElement, done)" @leave="(el: Element, done: () => void) => searchLeave(el as HTMLElement, done)">
      <div v-show="showSearch && !loading" class="search-inline">
        <ArchiveSearchFilter
          ref="archiveSearchFilter"
          :search-query="searchQuery"
          :selected-archive-difficulty="selectedArchiveDifficulty"
          :selected-actual-difficulty="selectedActualDifficulty"
          :selected-visibility="selectedVisibility"
          :search-suggestions="searchSuggestions"
          @update:search-query="searchQuery = $event"
          @update:selected-archive-difficulty="selectedArchiveDifficulty = $event"
          @update:selected-actual-difficulty="selectedActualDifficulty = $event"
          @update:selected-visibility="selectedVisibility = $event"
          @close="toggleSearch"
        />
      </div>
    </transition>

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
          <div class="modal-container" v-squircle="52">
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

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onActivated, onDeactivated, nextTick, watch } from "vue";
import { useI18n } from "vue-i18n";
import { protectFloatingButtonPosition } from "../utils/floatingButtonProtection.js";
import ArchiveCard from "../components/archive/ArchiveCard.vue";
import ArchiveSearchFilter from "../components/archive/ArchiveSearchFilter.vue";
import FloatingActionButton from "../components/feature/FloatingActionButton.vue";
import ConfirmModal from "../components/modal/ConfirmModal.vue";
import PerformanceSettings from "../components/system/PerformanceSettings.vue";
import { useArchiveData } from "../composables/useArchiveData";
import type { ArchiveData } from "@/types";
import { useArchiveList } from "../composables/useArchiveSearchFilter";
import { useArchiveActions } from "../composables/useArchiveActions";
import { useVirtualScroll } from "../composables/useVirtualScroll";
import { useMultiSelect } from "../composables/useMultiSelect";
import { usePerformanceMonitor } from "../composables/usePerformanceMonitor";
import { useAnimations } from "../composables/useAnimations";
import { useFloatingButton } from "../composables/useFloatingButton";
import { useToast } from "../composables/useToast";
import { markInitialLoadComplete, resetInitialLoad } from "../composables/useArchiveCard";


// Composables
const archiveData = useArchiveData();
const {
  archives,
  loading,
  dataLoadComplete,
  initializeArchives,
  refreshArchives: refreshArchivesBase,
  refreshArchivesSilent,
} = archiveData;

const {
  displayArchives,
  searchQuery,
  selectedArchiveDifficulty,
  selectedActualDifficulty,
  selectedVisibility,
  searchSuggestions,
  hasActiveFilters,
  resetFilters,
} = useArchiveList(archives);

const archiveActions = useArchiveActions(archiveData, {});
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

// Local state — declared before composable calls that use them
const scrollContainerRef = ref<HTMLElement | null>(null);
const showSearch = ref(false);
const isPageActive = ref(false);
const shouldResetScroll = ref(false);

// ─── Virtual scrolling with @tanstack/vue-virtual ──
const {
  rowVirtualizer,
  columnsPerRow,
  getRowItems,
  initObserver: initVirtualScrollObserver,
  destroyObserver: destroyVirtualScrollObserver,
} = useVirtualScroll(scrollContainerRef, displayArchives);

// ─── Multi-select mode ──
const {
  isMultiSelectMode,
  selectedArchives,
  showBatchDeleteConfirm,
  isBatchDeleting,
  enterMultiSelectMode,
  exitMultiSelectMode,
  toggleArchiveSelection,
  selectAll,
  invertSelection,
  confirmBatchDelete,
  cancelBatchDelete,
  handleShowBatchDeleteConfirm,
} = useMultiSelect(displayArchives, archives, {
  batchDeleteArchives,
});

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

// Local state (scrollContainerRef, showSearch, isPageActive, shouldResetScroll declared above)


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

const handleOpenArchiveSearchEvent = (event: CustomEvent) => {
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

const clearAllFilters = () => {
  resetFilters();
  shouldResetScroll.value = true;
  protectFloatingButtonPosition();
};

const handleToggleVisibility = (archive: ArchiveData) => {
  handleToggleVisibilityBase(archive, {
    onSuccess: () => protectFloatingButtonPosition(),
  });
};

const handleRenameArchive = ({ id, name }: { id: number; name: string }) => {
  const archive = archives.value.find((a) => a.id === id);
  if (archive) {
    archive.name = name;
  }
  toast.showSuccess(t("archiveSearch.renameSuccess", "存档已重命名"));
};

const confirmDelete = () => {
  confirmDeleteBase({
    onSuccess: () => {
      protectFloatingButtonPosition();
    },
  });
};

const refreshArchives = async () => {
  await refreshArchivesBase();
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


// On keep-alive activation
onActivated(async () => {
  isPageActive.value = true;
  resetInitialLoad();

  // Reset scroll position
  if (scrollContainerRef.value) {
    (scrollContainerRef.value as HTMLElement).scrollTop = 0;
  }
  initVirtualScrollObserver();

  // Refresh data, then re-measure virtual rows
  await refreshArchivesSilent();
  nextTick(() => {
    rowVirtualizer.value.measure();
  });
});

// On keep-alive deactivation
onDeactivated(() => {
  isPageActive.value = false;
});

onMounted(async () => {
  window.addEventListener("open-archive-search", handleOpenArchiveSearchEvent as EventListener);

  requestIdleCallback(() => initPerformanceMonitor(), { timeout: 1500 });
  requestIdleCallback(() => initButtonProtection(), { timeout: 2000 });

  await initializeArchives(true);

  // Initialize virtual scroll ResizeObserver (handles column calculation)
  await nextTick();
  initVirtualScrollObserver();

  isPageActive.value = true;

  markInitialLoadComplete();
  registerUndoShortcuts();
});

onUnmounted(() => {
  unregisterUndoShortcuts();
  window.removeEventListener("open-archive-search", handleOpenArchiveSearchEvent as EventListener);

    destroyVirtualScrollObserver();
    cleanupPerformance();
    cleanupFloatingButton();
    document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.width = "";
  document.body.style.height = "";
  document.documentElement.style.overflow = "";
});

// When displayArchives changes (filters applied), reset scroll position
watch(
  displayArchives,
  () => {
    const needResetScroll = shouldResetScroll.value;
    if (needResetScroll && scrollContainerRef.value) {
      (scrollContainerRef.value as HTMLElement).scrollTop = 0;
      shouldResetScroll.value = false;
    }
  },
  { deep: false },
);
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
  margin: 16px;
  border-radius: var(--radius-xl);
}

.archive-list-container.no-scroll {
  overflow: hidden;
}

/* Adjust archive list container height in multi-select mode */
.archive-list-container.multi-select-mode {
  height: calc(100% - 100px);
}

.archive-row {
  padding: 0;
  contain: layout style; /* Scope layout/paint work to each row */
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
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
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
  padding: 12px 28px;
  border-radius: var(--radius-button);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-action:hover {
  transform: translateY(-2px);
}

.search-inline {
  padding: 16px 20px 0;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
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
  border-radius: var(--radius-xl);
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
  padding: 6px;
  border-radius: var(--radius-pill);
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
  border-radius: var(--radius-pill);
}

.archive-list-container::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: var(--radius-pill);
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
  background: color-mix(in srgb, var(--primary) 12%, transparent);
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
