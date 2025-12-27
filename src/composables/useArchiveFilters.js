import { ref, computed } from 'vue'

/**
 * 存档筛选 composable
 */
export function useArchiveFilters() {
  // 筛选状态
  const lastSearchFilters = ref({
    searchQuery: '',
    selectedGameMode: '',
    selectedArchiveDifficulty: '',
    selectedActualDifficulty: '',
    selectedVisibility: ''
  })

  // 防抖相关
  let lastUpdateTime = 0

  /**
   * 检查是否有激活的筛选条件
   */
  const hasActiveFilters = computed(() => {
    return lastSearchFilters.value.searchQuery ||
      lastSearchFilters.value.selectedArchiveDifficulty ||
      lastSearchFilters.value.selectedActualDifficulty ||
      lastSearchFilters.value.selectedVisibility
  })

  /**
   * 立即应用筛选逻辑
   */
  const applyFiltersImmediate = (archives, filters) => {
    if (!archives || archives.length === 0) return []

    let filtered = archives

    // 按名称搜索
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(archive =>
        archive.name.toLowerCase().includes(query)
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

  /**
   * 防抖应用筛选
   */
  const debouncedApplyFilters = (archives, filters, callback) => {
    const now = Date.now()

    if (now - lastUpdateTime < 50) {
      return
    }

    const filtered = applyFiltersImmediate(archives, filters)
    lastUpdateTime = now

    if (callback) {
      callback(filtered)
    }

    return filtered
  }

  /**
   * 更新筛选条件
   */
  const updateFilters = (filters) => {
    lastSearchFilters.value = { ...filters }
  }

  /**
   * 重置筛选条件
   */
  const resetFilters = () => {
    lastSearchFilters.value = {
      searchQuery: '',
      selectedGameMode: '',
      selectedArchiveDifficulty: '',
      selectedActualDifficulty: '',
      selectedVisibility: ''
    }
  }

  return {
    lastSearchFilters,
    hasActiveFilters,
    applyFiltersImmediate,
    debouncedApplyFilters,
    updateFilters,
    resetFilters
  }
}
