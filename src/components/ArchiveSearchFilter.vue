<template>
  <div class="archive-search-filter">
    <div class="search-and-filter-container">
      <!-- 悬浮式搜索区域 -->
      <div class="floating-search">
        <div class="search-input-group">
          <font-awesome-icon icon="fa-solid fa-search" class="search-icon" />
          <input v-model="searchQuery" type="text" :placeholder="$t('archiveSearch.searchPlaceholder')"
            class="search-input" @input="handleSearchChange" />
          <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
            <font-awesome-icon icon="fa-solid fa-times" />
          </button>
        </div>
      </div>

      <!-- 悬浮式筛选面板 -->
      <div class="floating-filter-panel">
        <div class="filter-grid">
          <div class="filter-item">
            <label class="filter-label">{{ $t('archiveSearch.gameMode') }}</label>
            <CustomDropdown v-model="selectedGameMode" :options="gameModeOptions"
              :placeholder="$t('archiveSearch.gameMode')" @change="handleFilterChange" />
          </div>

          <div class="filter-item">
            <label class="filter-label">{{ $t('archiveSearch.archiveDifficulty') }}</label>
            <CustomDropdown v-model="selectedArchiveDifficulty" :options="difficultyOptions"
              :placeholder="$t('archiveSearch.archiveDifficulty')" @change="handleFilterChange" />
          </div>

          <div class="filter-item">
            <label class="filter-label">{{ $t('archiveSearch.actualDifficulty') }}</label>
            <CustomDropdown v-model="selectedActualDifficulty" :options="difficultyOptions"
              :placeholder="$t('archiveSearch.actualDifficulty')" @change="handleFilterChange" />
          </div>

          <div class="filter-item">
            <label class="filter-label">{{ $t('archiveSearch.visibility') }}</label>
            <CustomDropdown v-model="selectedVisibility" :options="visibilityOptions"
              :placeholder="$t('archiveSearch.visibility')" @change="handleFilterChange" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomDropdown from './CustomDropdown.vue'

const { t } = useI18n({ useScope: 'global' })

// Props
const props = defineProps({
  archives: {
    type: Array,
    default: () => []
  },
  initialFilters: {
    type: Object,
    default: () => ({
      searchQuery: '',
      selectedGameMode: '',
      selectedArchiveDifficulty: '',
      selectedActualDifficulty: '',
      selectedVisibility: ''
    })
  }
})

// Emits
const emit = defineEmits(['filtered', 'filters-changed'])

// 响应式数据 - 使用initialFilters初始化
const searchQuery = ref(props.initialFilters.searchQuery || '')
const selectedGameMode = ref(props.initialFilters.selectedGameMode || '')
const selectedArchiveDifficulty = ref(props.initialFilters.selectedArchiveDifficulty || '')
const selectedActualDifficulty = ref(props.initialFilters.selectedActualDifficulty || '')
const selectedVisibility = ref(props.initialFilters.selectedVisibility || '')



// 选项数据
const gameModeOptions = computed(() => [
  { value: '', label: t('archiveSearch.allModes') },
  { value: 'singleplayer', label: t('createArchive.gameModes.singleplayer') },
  { value: 'multiplayer', label: t('createArchive.gameModes.multiplayer') }
])

const difficultyOptions = computed(() => [
  { value: '', label: t('archiveSearch.allDifficulties') },
  { value: 'easy', label: t('createArchive.difficultyLevels.easy') },
  { value: 'normal', label: t('createArchive.difficultyLevels.normal') },
  { value: 'hard', label: t('createArchive.difficultyLevels.hard') },
  { value: 'nightmare', label: t('createArchive.difficultyLevels.nightmare') }
])

const visibilityOptions = computed(() => [
  { value: '', label: t('archiveSearch.allVisibilities') },
  { value: 'visible', label: t('archiveSearch.visible') },
  { value: 'hidden', label: t('archiveSearch.hidden') }
])

// 计算属性
const hasActiveFilters = computed(() => {
  return searchQuery.value ||
    selectedGameMode.value ||
    selectedArchiveDifficulty.value ||
    selectedActualDifficulty.value ||
    selectedVisibility.value
})

// 过滤逻辑
const filteredArchives = computed(() => {
  if (!props.archives || props.archives.length === 0) return []

  let filtered = props.archives

  // 按名称搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(archive =>
      archive.name.toLowerCase().includes(query)
    )
  }

  // 按游戏模式筛选
  if (selectedGameMode.value) {
    filtered = filtered.filter(archive =>
      archive.gameMode === selectedGameMode.value
    )
  }

  // 按存档难度筛选
  if (selectedArchiveDifficulty.value) {
    filtered = filtered.filter(archive =>
      archive.archiveDifficulty === selectedArchiveDifficulty.value
    )
  }

  // 按实际难度筛选
  if (selectedActualDifficulty.value) {
    filtered = filtered.filter(archive =>
      archive.actualDifficulty === selectedActualDifficulty.value
    )
  }

  // 按可见性筛选
  if (selectedVisibility.value) {
    const isVisible = selectedVisibility.value === 'visible'
    filtered = filtered.filter(archive =>
      archive.isVisible === isVisible
    )
  }

  return filtered
})

// 方法
const handleSearchChange = () => {
  emit('filtered', filteredArchives.value)
  emitFiltersChanged()
}

const handleFilterChange = () => {
  emit('filtered', filteredArchives.value)
  emitFiltersChanged()
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('filtered', filteredArchives.value)
  emitFiltersChanged()
}

// 清除所有筛选条件
const clearAllFilters = () => {
  searchQuery.value = ''
  selectedGameMode.value = ''
  selectedArchiveDifficulty.value = ''
  selectedActualDifficulty.value = ''
  selectedVisibility.value = ''
  emit('filtered', filteredArchives.value)
  emitFiltersChanged()
}

const emitFiltersChanged = () => {
  emit('filters-changed', {
    searchQuery: searchQuery.value,
    selectedGameMode: selectedGameMode.value,
    selectedArchiveDifficulty: selectedArchiveDifficulty.value,
    selectedActualDifficulty: selectedActualDifficulty.value,
    selectedVisibility: selectedVisibility.value
  })
}



// 监听数据变化 - 仅当存档数据变化时重新筛选，不重置筛选条件
watch(() => props.archives, () => {
  emit('filtered', filteredArchives.value)
}, { deep: true })

// 初始化
if (props.archives.length > 0) {
  emit('filtered', filteredArchives.value)
}
</script>

<style scoped>
.archive-search-filter {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-and-filter-container {
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
}

/* 悬浮式搜索区域样式 */
.floating-search {
  position: sticky;
  top: 80px;
  background: var(--glass-bg, rgba(30, 30, 30, 0.95));
  backdrop-filter: var(--glass-backdrop-filter, blur(10px));
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: var(--card-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  border: var(--card-border, 1px solid rgba(255, 255, 255, 0.1));
  z-index: 100;
  flex: 0 0 auto;
  min-width: 300px;
  max-width: 400px;
}

/* 悬浮式筛选面板样式 */
.floating-filter-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--glass-bg, rgba(30, 30, 30, 0.95));
  backdrop-filter: var(--glass-backdrop-filter, blur(10px));
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: var(--card-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  border: var(--card-border, 1px solid rgba(255, 255, 255, 0.1));
  z-index: 100;
  flex: 0 0 auto;
}

.search-input-group {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-icon {
  color: var(--text-secondary, #666);
  font-size: 18px;
}

.clear-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary, #666);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  color: var(--error-color, #ff6b6b);
  background: rgba(255, 107, 107, 0.1);
}

/* 悬浮式筛选面板样式 */
.floating-filter-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--glass-bg, rgba(30, 30, 30, 0.95));
  backdrop-filter: var(--glass-backdrop-filter, blur(10px));
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: var(--card-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  border: var(--card-border, 1px solid rgba(255, 255, 255, 0.1));
  z-index: 100;
  flex: 2;
}

.filter-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
}

.filter-label {
  font-size: 12px;
  color: var(--text-secondary, #888);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}



/* 响应式设计 */
@media (max-width: 1024px) {
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .filter-item {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .floating-filter-panel {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .search-input-group {
    padding: 0 16px;
  }

  .search-input {
    font-size: 14px;
    padding: 12px 0;
  }
}

@media (max-width: 480px) {

  .floating-search,
  .floating-filter-panel {
    margin-left: 10px;
    margin-right: 10px;
  }

  .floating-filter-panel {
    padding: 12px 16px;
  }
}
</style>