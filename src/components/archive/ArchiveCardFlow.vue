<template>
  <div class="archive-card-flow">
    <!-- 工具栏 -->
    <div class="flow-toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="$emit('select-all')">
          <font-awesome-icon :icon="['fas', 'check-double']" />
          {{ $t("quickCreate.cardFlow.selectAll") }}
        </button>
        <button class="toolbar-btn" @click="$emit('invert-selection')">
          <font-awesome-icon :icon="['fas', 'exchange-alt']" />
          {{ $t("quickCreate.cardFlow.invertSelection") }}
        </button>
        <button class="toolbar-btn batch-edit" :disabled="selectedIds.size === 0" @click="$emit('batch-edit')">
          <font-awesome-icon :icon="['fas', 'edit']" />
          {{ $t("quickCreate.cardFlow.batchEdit") }}
        </button>
      </div>
      <div class="toolbar-right">
        <span class="selection-count">
          {{
            $t("quickCreate.cardFlow.selected", {
              count: selectedIds.size,
              total: archives.length,
            })
          }}
        </span>
        <!-- 虚拟滚动指示器 -->
        <span
          v-if="isVirtualScrollEnabled"
          class="virtual-indicator"
          :title="$t('quickCreate.cardFlow.virtualScrollHint')"
        >
          <font-awesome-icon :icon="['fas', 'bolt']" />
        </span>
        <div class="view-toggle">
          <button
            class="view-btn"
            :class="{ active: viewMode === 'grid' }"
            :title="$t('quickCreate.cardFlow.gridView')"
            @click="viewMode = 'grid'"
          >
            <font-awesome-icon :icon="['fas', 'th-large']" />
          </button>
          <button
            class="view-btn"
            :class="{ active: viewMode === 'list' }"
            :title="$t('quickCreate.cardFlow.listView')"
            @click="viewMode = 'list'"
          >
            <font-awesome-icon :icon="['fas', 'list']" />
          </button>
        </div>
      </div>
    </div>

    <!-- 卡片容器 -->
    <div
      ref="scrollContainerRef"
      class="flow-content"
      :class="[`view-${viewMode}`, { 'virtual-scroll-active': isVirtualScrollEnabled }]"
    >
      <div v-if="archives.length === 0" class="empty-state">
        <font-awesome-icon :icon="['fas', 'layer-group']" class="empty-icon" />
        <p>{{ $t("quickCreate.cardFlow.emptyHint") }}</p>
      </div>

      <!-- 虚拟滚动模式 (当存档数量 > 50 时启用) -->
      <template v-else-if="isVirtualScrollEnabled">
        <div
          class="virtual-scroller"
          :style="{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }"
        >
          <div
            v-for="virtualRow in virtualizer.getVirtualItems()"
            :key="virtualRow.key"
            class="virtual-row-wrapper"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }"
          >
            <!-- 网格视图：每行多列 -->
            <div
              v-if="viewMode === 'grid'"
              class="virtual-row-grid"
              :style="{
                display: 'grid',
                gap: 'var(--space-3)',
                gridTemplateColumns: `repeat(${gridColumns}, minmax(220px, 1fr))`,
              }"
            >
              <QuickCreateArchiveCard
                v-for="archive in getGridRowItems(virtualRow.index)"
                :key="archive.id"
                :archive="archive"
                :selected="selectedIds.has(archive.id)"
                :config-source="getConfigSource(archive)"
                @select="handleSelect"
                @edit="handleEdit"
                @copy="handleCopy"
                @remove="handleRemove"
              />
            </div>
            <!-- 列表视图：每行一项 -->
            <QuickCreateArchiveCard
              v-else
              :archive="archives[virtualRow.index]"
              :selected="selectedIds.has(archives[virtualRow.index].id)"
              :config-source="getConfigSource(archives[virtualRow.index])"
              @select="handleSelect"
              @edit="handleEdit"
              @copy="handleCopy"
              @remove="handleRemove"
            />
          </div>
        </div>
      </template>

      <!-- 普通模式 (存档数量 <= 50) -->
      <TransitionGroup v-else name="card-list" tag="div" class="card-container" :class="[`view-${viewMode}`]">
        <QuickCreateArchiveCard
          v-for="archive in archives"
          :key="archive.id"
          :archive="archive"
          :selected="selectedIds.has(archive.id)"
          :config-source="getConfigSource(archive)"
          @select="handleSelect"
          @edit="handleEdit"
          @copy="handleCopy"
          @remove="handleRemove"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { computed, toRef, onMounted, onUnmounted, ref } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { useI18n } from "vue-i18n";
import QuickCreateArchiveCard from "./QuickCreateArchiveCard.vue";
import { resolve } from "@/composables/useConfigResolver";
import {
  useViewMode,
  useVirtualScroll,
  useGridColumns,
  useArchiveCardFlowEventHandlers,
} from "@/composables/useArchiveCardFlow";

const { t } = useI18n({ useScope: "global" });

const props = defineProps({
  archives: {
    type: Array,
    required: true,
    default: () => [],
  },
  selectedIds: {
    type: Set,
    required: true,
    default: () => new Set(),
  },
  uniformConfig: {
    type: Object,
    default: () => ({}),
  },
  smartRules: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits([
  "select",
  "select-all",
  "invert-selection",
  "edit",
  "copy",
  "remove",
  "reorder",
  "batch-edit",
]);

const archivesRef = toRef(props, "archives");
const uniformConfigRef = toRef(props, "uniformConfig");
const smartRulesRef = toRef(props, "smartRules");

const { viewMode } = useViewMode();
const { useVirtualScroll: isVirtualScrollEnabled } = useVirtualScroll(archivesRef);
const { gridColumns, calculateGridColumns, setupResizeObserver, cleanupResizeObserver } = useGridColumns();
const { handleSelect, handleEdit, handleCopy, handleRemove } = useArchiveCardFlowEventHandlers(emit);

// Scroll container ref for virtualizer
const scrollContainerRef = ref(null);

// Virtualizer: grid mode virtualizes by row, list mode virtualizes by item
const virtualCount = computed(() => {
  return viewMode.value === "grid"
    ? Math.ceil(props.archives.length / gridColumns.value)
    : props.archives.length;
});

const estimateItemSize = computed(() => {
  return viewMode.value === "grid" ? 180 : 120;
});

const virtualizer = useVirtualizer({
  count: virtualCount,
  getScrollElement: () => scrollContainerRef.value,
  estimateSize: () => estimateItemSize.value,
  overscan: 2,
});

// Get items for a grid row
function getGridRowItems(rowIndex) {
  const cols = gridColumns.value;
  const start = rowIndex * cols;
  const end = Math.min(start + cols, props.archives.length);
  const items = [];
  for (let i = start; i < end; i++) {
    items.push(props.archives[i]);
  }
  return items;
}

const getConfigSource = (archive) => {
  if (uniformConfigRef.value && smartRulesRef.value) {
    const resolved = resolve(archive, uniformConfigRef.value, smartRulesRef.value);
    return resolved.source;
  }
  return {
    level: "default",
    difficulty: "default",
    actualDifficulty: "default",
    inventory: "default",
  };
};

onMounted(() => {
  calculateGridColumns();
  setupResizeObserver();
});

onUnmounted(() => {
  cleanupResizeObserver();
});
</script>

<style scoped>
.archive-card-flow {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 工具栏 */
.flow-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--divider-light);
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--accent-color);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.batch-edit {
  background: rgba(var(--accent-color-rgb), 0.1);
  color: var(--accent-color);
  border-color: rgba(var(--accent-color-rgb), 0.3);
}

.toolbar-btn.batch-edit:hover:not(:disabled) {
  background: rgba(var(--accent-color-rgb), 0.2);
}

.selection-count {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 0 var(--space-2);
}

/* 视图切换 */
.view-toggle {
  display: flex;
  background: var(--bg-tertiary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s var(--ease-default);
}

.view-btn:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.view-btn.active {
  color: var(--accent-color);
  background: rgba(var(--accent-color-rgb), 0.1);
}

/* 内容区域 */
.flow-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-3);
}

/* 虚拟滚动 - 移除容器内边距，由虚拟行自己控制 */
.flow-content.virtual-scroll-active {
  padding: 0;
}

.virtual-scroller {
  position: relative;
  width: 100%;
}

.virtual-row-wrapper {
  padding: 0 var(--space-3);
  box-sizing: border-box;
  will-change: transform;
}

.virtual-row-wrapper:first-child {
  padding-top: var(--space-3);
}

.virtual-row-wrapper:last-child {
  padding-bottom: var(--space-3);
}

.virtual-row-grid {
  display: grid;
  gap: var(--space-3);
}

/* 虚拟滚动指示器 */
.virtual-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(var(--accent-color-rgb), 0.1);
  border-radius: var(--radius-sm);
  color: var(--accent-color);
  font-size: 11px;
  cursor: help;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  text-align: center;
  padding: var(--space-8);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
  opacity: 0.3;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 卡片容器 */
.card-container {
  display: grid;
  gap: var(--space-3);
}

.card-container.view-grid {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.card-container.view-list {
  grid-template-columns: 1fr;
}

/* 过渡动画 */
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.3s var(--ease-default);
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.95);
}

.card-list-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.card-list-move {
  transition: transform 0.3s var(--ease-default);
}

/* 响应式 */
@media (max-width: 768px) {
  .flow-toolbar {
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .toolbar-btn {
    padding: var(--space-1) var(--space-2);
    font-size: 11px;
  }

  .card-container.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 480px) {
  .card-container.view-grid {
    grid-template-columns: 1fr;
  }
}
</style>
