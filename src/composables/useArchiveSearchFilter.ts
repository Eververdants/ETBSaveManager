import { ref, shallowRef, computed, watch, type Ref, type ComputedRef } from "vue";
import type { ArchiveData } from "@/types";

const SEARCH_HISTORY_KEY = "archive-search-history";
const MAX_HISTORY = 5;

export function getSearchHistory(): string[] {
  try {
    const raw = sessionStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  if (!query || !query.trim()) return;
  try {
    const history = getSearchHistory().filter((h) => h !== query.trim());
    history.unshift(query.trim());
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    sessionStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* ignore */
  }
}

export function clearSearchHistory(): void {
  try {
    sessionStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Highlight matching text with <mark> tags.
 */
export function highlightMatch(text: string, query: string): string {
  if (!query || !text) return text;
  try {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  } catch {
    return text;
  }
}

interface InitialFilters {
  searchQuery?: string;
  selectedArchiveDifficulty?: string;
  selectedActualDifficulty?: string;
  selectedVisibility?: string;
}

export function useSearchState(initialFilters?: Ref<InitialFilters> | InitialFilters): {
  searchQuery: Ref<string>;
  selectedArchiveDifficulty: Ref<string>;
  selectedActualDifficulty: Ref<string>;
  selectedVisibility: Ref<string>;
} {
  const resolved = initialFilters && "value" in initialFilters ? initialFilters.value : initialFilters;
  const searchQuery = ref(resolved?.searchQuery || "");
  const selectedArchiveDifficulty = ref(resolved?.selectedArchiveDifficulty || "");
  const selectedActualDifficulty = ref(resolved?.selectedActualDifficulty || "");
  const selectedVisibility = ref(resolved?.selectedVisibility || "");

  return { searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility };
}

function applyFilters(
  archives: Ref<ArchiveData[]> | ArchiveData[],
  searchQuery: string,
  selectedArchiveDifficulty: string,
  selectedActualDifficulty: string,
  selectedVisibility: string,
): ArchiveData[] {
  const archivesArray = "value" in archives ? archives.value : archives;
  if (!archivesArray || archivesArray.length === 0) return [];
  let filtered = archivesArray;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((archive) => {
      const nameMatch = archive.name.toLowerCase().includes(query);
      const levelMatch = archive.currentLevel?.toLowerCase().includes(query) ?? false;
      const diffMatch = archive.archiveDifficulty?.toLowerCase().includes(query) ?? false;
      const actualDiffMatch = archive.actualDifficulty?.toLowerCase().includes(query) ?? false;
      const modeMatch = archive.gameMode?.toLowerCase().includes(query) ?? false;
      return nameMatch || levelMatch || diffMatch || actualDiffMatch || modeMatch;
    });
  }

  if (selectedArchiveDifficulty) {
    filtered = filtered.filter((archive) => archive.archiveDifficulty === selectedArchiveDifficulty);
  }

  if (selectedActualDifficulty) {
    filtered = filtered.filter((archive) => archive.actualDifficulty === selectedActualDifficulty);
  }

  if (selectedVisibility) {
    const isVisible = selectedVisibility === "visible";
    filtered = filtered.filter((archive) => archive.isVisible === isVisible);
  }

  // Always return a shallow copy so the computed consumer detects
  // even in-place array mutations (critical: Phase 2 detail loading
  // mutates individual indices rather than replacing the whole array).
  return [...filtered];
}

function applySuggestions(archives: Ref<ArchiveData[]> | ArchiveData[], searchQuery: string): ArchiveData[] {
  if (!searchQuery) return [];
  const archivesArray = "value" in archives ? archives.value : archives;
  if (!archivesArray || archivesArray.length === 0) return [];
  const query = searchQuery.toLowerCase();

  return archivesArray
    .filter((a) => {
      const nameMatch = a.name.toLowerCase().includes(query);
      const levelMatch = a.currentLevel?.toLowerCase().includes(query) ?? false;
      return nameMatch || levelMatch;
    })
    .slice(0, 3);
}

export function useArchiveFilter(
  archives: Ref<ArchiveData[]> | ArchiveData[],
  searchQuery: Ref<string>,
  selectedArchiveDifficulty: Ref<string>,
  selectedActualDifficulty: Ref<string>,
  selectedVisibility: Ref<string>,
): { filteredArchives: Ref<ArchiveData[]>; searchSuggestions: Ref<ArchiveData[]> } {
  const filteredArchives = shallowRef<ArchiveData[]>([]);
  const searchSuggestions = shallowRef<ArchiveData[]>([]);

  // Run filter synchronously — no computed chain, no lazy eval
  const runFilter = () => {
    filteredArchives.value = applyFilters(
      archives,
      searchQuery.value,
      selectedArchiveDifficulty.value,
      selectedActualDifficulty.value,
      selectedVisibility.value,
    );
    searchSuggestions.value = applySuggestions(archives, searchQuery.value);
  };

  // Watch all filter inputs and re-run on any change
  watch([searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility], runFilter, {
    immediate: true,
  });

  // Also re-run when archive data changes
  if ("value" in archives) {
    watch(() => (archives as Ref<ArchiveData[]>).value.length, runFilter);
  }

  return { filteredArchives, searchSuggestions };
}

export function useFilterState(
  searchQuery: Ref<string>,
  selectedArchiveDifficulty: Ref<string>,
  selectedActualDifficulty: Ref<string>,
  selectedVisibility: Ref<string>,
): { hasActiveFilters: ComputedRef<boolean> } {
  const hasActiveFilters = computed((): boolean => {
    return !!(
      searchQuery.value ||
      selectedArchiveDifficulty.value ||
      selectedActualDifficulty.value ||
      selectedVisibility.value
    );
  });

  return { hasActiveFilters };
}

/**
 * Unified archive list composable — single entry point for the archive list page.
 * Owns filter state and derives displayArchives as a computed, eliminating the
 * manual event-bridge between ArchiveSearchFilter and Home.vue.
 */
export function useArchiveList(archives: Ref<ArchiveData[]>): {
  displayArchives: Ref<ArchiveData[]>;
  searchQuery: Ref<string>;
  selectedArchiveDifficulty: Ref<string>;
  selectedActualDifficulty: Ref<string>;
  selectedVisibility: Ref<string>;
  searchSuggestions: Ref<ArchiveData[]>;
  hasActiveFilters: ComputedRef<boolean>;
  resetFilters: () => void;
} {
  const searchQuery = ref("");
  const selectedArchiveDifficulty = ref("");
  const selectedActualDifficulty = ref("");
  const selectedVisibility = ref("");

  const displayArchives = shallowRef<ArchiveData[]>([]);
  const searchSuggestions = shallowRef<ArchiveData[]>([]);

  // Watch a serialised snapshot of item identities so we only rebuild the
  // filtered list when items are added/removed or isVisible changes — NOT
  // when Phase 2 mutates currentLevel / actualDifficulty on existing items.
  const archiveVersion = computed(() => archives.value.map((a) => `${a.id}:${a.isVisible}`).join("|"));

  const updateFiltered = (): void => {
    displayArchives.value = applyFilters(
      archives.value,
      searchQuery.value,
      selectedArchiveDifficulty.value,
      selectedActualDifficulty.value,
      selectedVisibility.value,
    );
    searchSuggestions.value = applySuggestions(archives.value, searchQuery.value);
  };

  watch(
    [searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility, archiveVersion],
    updateFiltered,
    { immediate: true },
  );

  const hasActiveFilters = computed(
    (): boolean =>
      !!(
        searchQuery.value ||
        selectedArchiveDifficulty.value ||
        selectedActualDifficulty.value ||
        selectedVisibility.value
      ),
  );

  const resetFilters = (): void => {
    searchQuery.value = "";
    selectedArchiveDifficulty.value = "";
    selectedActualDifficulty.value = "";
    selectedVisibility.value = "";
  };

  return {
    displayArchives,
    searchQuery,
    selectedArchiveDifficulty,
    selectedActualDifficulty,
    selectedVisibility,
    searchSuggestions,
    hasActiveFilters,
    resetFilters,
  };
}
