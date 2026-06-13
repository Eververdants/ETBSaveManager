import { ref, computed } from "vue";

/**
 * Archive filter composable
 */
export function useArchiveFilters() {
  // Filter state
  const lastSearchFilters = ref({
    searchQuery: "",
    selectedGameMode: "",
    selectedArchiveDifficulty: "",
    selectedActualDifficulty: "",
    selectedVisibility: "",
  });

  // Debounce related
  let lastUpdateTime = 0;

  /**
   * Check if there are active filter conditions
   */
  const hasActiveFilters = computed(() => {
    return (
      lastSearchFilters.value.searchQuery ||
      lastSearchFilters.value.selectedArchiveDifficulty ||
      lastSearchFilters.value.selectedActualDifficulty ||
      lastSearchFilters.value.selectedVisibility
    );
  });

  /**
   * Apply filters immediately
   */
  const applyFiltersImmediate = (archives, filters) => {
    if (!archives || archives.length === 0) return [];

    let filtered = archives;

    // Filter by name
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter((archive) => archive.name.toLowerCase().includes(query));
    }

    // Filter by archive difficulty
    if (filters.selectedArchiveDifficulty) {
      filtered = filtered.filter((archive) => archive.archiveDifficulty === filters.selectedArchiveDifficulty);
    }

    // Filter by actual difficulty
    if (filters.selectedActualDifficulty) {
      filtered = filtered.filter((archive) => archive.actualDifficulty === filters.selectedActualDifficulty);
    }

    // Filter by visibility
    if (filters.selectedVisibility) {
      const isVisible = filters.selectedVisibility === "visible";
      filtered = filtered.filter((archive) => archive.isVisible === isVisible);
    }

    return filtered;
  };

  /**
   * Debounced apply filters
   */
  const debouncedApplyFilters = (archives, filters, callback) => {
    const now = Date.now();

    if (now - lastUpdateTime < 50) {
      return;
    }

    const filtered = applyFiltersImmediate(archives, filters);
    lastUpdateTime = now;

    if (callback) {
      callback(filtered);
    }

    return filtered;
  };

  /**
   * Update filter conditions
   */
  const updateFilters = (filters) => {
    lastSearchFilters.value = { ...filters };
  };

  /**
   * Reset filter conditions
   */
  const resetFilters = () => {
    lastSearchFilters.value = {
      searchQuery: "",
      selectedGameMode: "",
      selectedArchiveDifficulty: "",
      selectedActualDifficulty: "",
      selectedVisibility: "",
    };
  };

  return {
    lastSearchFilters,
    hasActiveFilters,
    applyFiltersImmediate,
    debouncedApplyFilters,
    updateFilters,
    resetFilters,
  };
}
