import { ref, computed, type Ref, type ComputedRef } from "vue";
import type { ArchiveData } from "@/types";

interface SearchFilters {
  searchQuery: string;
  selectedGameMode: string;
  selectedArchiveDifficulty: string;
  selectedActualDifficulty: string;
  selectedVisibility: string;
}

/**
 * Archive filter composable
 */
export function useArchiveFilters(): {
  lastSearchFilters: Ref<SearchFilters>;
  hasActiveFilters: ComputedRef<boolean>;
  applyFiltersImmediate: (archives: ArchiveData[], filters: SearchFilters) => ArchiveData[];
  debouncedApplyFilters: (
    archives: ArchiveData[],
    filters: SearchFilters,
    callback?: ((filtered: ArchiveData[]) => void) | null,
  ) => ArchiveData[] | undefined;
  updateFilters: (filters: SearchFilters) => void;
  resetFilters: () => void;
} {
  // Filter state
  const lastSearchFilters = ref<SearchFilters>({
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
  const hasActiveFilters = computed((): boolean => {
    return !!(
      lastSearchFilters.value.searchQuery ||
      lastSearchFilters.value.selectedArchiveDifficulty ||
      lastSearchFilters.value.selectedActualDifficulty ||
      lastSearchFilters.value.selectedVisibility
    );
  });

  /**
   * Apply filters immediately
   */
  const applyFiltersImmediate = (archives: ArchiveData[], filters: SearchFilters): ArchiveData[] => {
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
  const debouncedApplyFilters = (
    archives: ArchiveData[],
    filters: SearchFilters,
    callback?: ((filtered: ArchiveData[]) => void) | null,
  ): ArchiveData[] | undefined => {
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
  const updateFilters = (filters: SearchFilters): void => {
    lastSearchFilters.value = { ...filters };
  };

  /**
   * Reset filter conditions
   */
  const resetFilters = (): void => {
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
