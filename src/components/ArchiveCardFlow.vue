<template>
  <div class="archive-card-flow">
    <!-- 工具栏 -->
    <div class="flow-toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="$emit('select-all')">
          <font-awesome-icon :icon="['fas', 'check-double']" />
          {{ $t('quickCreate.cardFlow.selectAll') }}
        </button>
        <button class="toolbar-btn" @click="$emit('invert-selection')">
          <font-awesome-icon :icon="['fas', 'exchange-alt']" />
          {{ $t('quickCreate.cardFlow.invertSelection') }}
        </button>
        <button 
          class="toolbar-btn batch-edit" 
          :disabled="selectedIds.size === 0"
          @click="$emit('batch-edit')"
        >
          <font-awesome-icon :icon="['fas', 'edit']" />
          {{ $t('quickCreate.cardFlow.batchEdit') }}
        </button>
      </div>
      <div class="toolbar-right">
        <span class="selection-count">
          {{ $t('quickCreate.cardFlow.selected', { count: selectedIds.size, total: archives.length }) }}
        </span>
        <!-- 虚拟滚动指示器 -->
        <span v-if="useVirtualScroll" class="virtual-indicator" :title="$t('quickCreate.cardFlow.virtualScrollHint')">
          <font-awesome-icon :icon="['fas', 'bolt']" />
        </span>
        <div class="view-toggle">
          <button 
            class="view-btn" 
            :class="{ active: viewMode === 'grid' }"
            @click="viewMode = 'grid'"
            :title="$t('quickCreate.cardFlow.gridView')"
          >
            <font-awesome-icon :icon="['fas', 'th-large']" />
          </button>
          <button 
            class="view-btn" 
            :class="{ active: viewMode === 'list' }"
            @click="viewMode = 'list'"
            :title="$t('quickCreate.cardFlow.listView')"
          >
            <font-awesome-icon :icon="['fas', 'list']" />
          </button>
        </div>
      </div>
    </div>

    <!-- 卡片容器 -->
    <div class="flow-content" :class="[`view-${viewMode}`]">
      <div v-if="archives.length === 0" class="empty-state">
        <font-awesome-icon :icon="['fas', 'layer-group']" class="empty-icon" />
        <p>{{ $t('quickCreate.cardFlow.emptyHint') }}</p>
      </div>
      
      <!-- 虚拟滚动模式 (当存档数量 > 50 时启用) -->
      <RecycleScroller
        v-else-if="useVirtualScroll"
        ref="scrollerRef"
        class="virtual-scroller"
        :items="archives"
        :item-size="viewMode === 'grid' ? 180 : 120"
        :grid-items="viewMode === 'grid' ? gridColumns : 1"
        key-field="id"
        v-slot="{ item }"
      >
        <QuickCreateArchiveCard
          :archive="item"
          :selected="selectedIds.has(item.id)"
          :config-source="getConfigSource(item)"
          @select="handleSelect"
          @edit="handleEdit"
          @copy="handleCopy"
          @remove="handleRemove"
        />
      </RecycleScroller>
      
      <!-- 普通模式 (存档数量 <= 50) -->
      <TransitionGroup 
        v-else 
        name="card-list" 
        tag="div" 
        class="card-container"
        :class="[`view-${viewMode}`]"
      >
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import QuickCreateArchiveCard from './QuickCreateArchiveCard.vue'
import { resolve } from '@/composables/useConfigResolver'

const { t } = useI18n({ useScope: 'global' })

/**
 * 虚拟滚动阈值
 * Requirements: 16.1 - 当存档数量 > 50 时启用虚拟滚动
 */
const VIRTUAL_SCROLL_THRESHOLD = 50

const props = defineProps({
  archives: {
    type: Array,
    required: true,
    default: () => []
  },
  selectedIds: {
    type: Set,
    required: true,
    default: () => new Set()
  },
  uniformConfig: {
    type: Object,
    default: () => ({})
  },
  smartRules: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'select',
  'select-all',
  'invert-selection',
  'edit',
  'copy',
  'remove',
  'reorder',
  'batch-edit'
])

// 视图模式
const viewMode = ref('grid')

// 虚拟滚动器引用
const scrollerRef = ref(null)

// 计算网格列数（用于虚拟滚动）
const gridColumns = ref(4)

/**
 * 是否启用虚拟滚动
 * Requirements: 16.1 - 当存档数量 > 50 时启用虚拟滚动
 */
const useVirtualScroll = computed(() => {
  return props.archives.length > VIRTUAL_SCROLL_THRESHOLD
})

/**
 * 计算网格列数
 */
const calculateGridColumns = () => {
  const containerWidth = document.querySelector('.flow-content')?.clientWidth || 800
  const cardMinWidth = 220 // 卡片最小宽度
  const gap = 12 // 间距
  gridColumns.value = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)))
}

// 监听窗口大小变化
let resizeObserver = null

onMounted(() => {
  calculateGridColumns()
  
  // 使用 ResizeObserver 监听容器大小变化
  const container = document.querySelector('.flow-content')
  if (container && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      calculateGridColumns()
    })
    resizeObserver.observe(container)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// 获取配置来源
const getConfigSource = (archive) => {
  if (props.uniformConfig && props.smartRules) {
    const resolved = resolve(archive, props.uniformConfig, props.smartRules)
    return resolved.source
  }
  return {
    level: 'default',
    difficulty: 'default',
    actualDifficulty: 'default',
    inventory: 'default'
  }
}

// 事件处理
const handleSelect = (archiveId) => {
  emit('select', archiveId)
}

const handleEdit = (archiveId) => {
  emit('edit', archiveId)
}

const handleCopy = (archiveId) => {
  emit('copy', archiveId)
}

const handleRemove = (archiveId) => {
  emit('remove', archiveId)
}
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

/* 虚拟滚动器样式 */
.virtual-scroller {
  height: 100%;
  overflow-y: auto;
}

.virtual-scroller :deep(.vue-recycle-scroller__item-wrapper) {
  display: grid;
  gap: var(--space-3);
}

.virtual-scroller.view-grid :deep(.vue-recycle-scroller__item-wrapper) {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.virtual-scroller.view-list :deep(.vue-recycle-scroller__item-wrapper) {
  grid-template-columns: 1fr;
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
