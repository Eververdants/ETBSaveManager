import { ref, shallowRef, computed, watch, onScopeDispose, type Ref, type ComputedRef } from "vue";
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
 * Escapes HTML special characters to their entity equivalents.
 * This prevents XSS attacks when user input is rendered via v-html.
 *
 * @param text - The text to escape
 * @returns The text with HTML special characters converted to entities
 */
function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

/**
 * Highlight matching text with <mark> tags.
 * Escapes HTML entities in both text and query to prevent XSS attacks.
 *
 * WARNING: Returns a raw HTML string intended ONLY for `v-html` binding.
 * The caller MUST ensure both `text` and `query` are user-controlled input
 * that has NOT been pre-escaped. Passing already-escaped or unescaped
 * content from an untrusted source may result in XSS. When in doubt, pass
 * the raw user input directly — this function handles escaping internally.
 */
export function highlightMatch(text: string, query: string): string {
  if (!query || !text) return text;
  try {
    // Escape both text and query to prevent XSS
    const escapedText = escapeHtml(text);
    const escapedQuery = escapeHtml(query);

    // Escape regex special characters in the query
    const escapedPattern = escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeRegex = new RegExp(`(${escapedPattern})`, "gi");

    // Wrap matches in <mark> tags
    return escapedText.replace(safeRegex, '<mark class="search-highlight">$1</mark>');
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
      // Match the filename-derived name AND the MAINSAVE display name so a
      // custom-named archive is findable by either name.
      const nameMatch =
        archive.name.toLowerCase().includes(query) || (archive.displayName?.toLowerCase().includes(query) ?? false);
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
      const nameMatch = a.name.toLowerCase().includes(query) || (a.displayName?.toLowerCase().includes(query) ?? false);
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
  // Persist filter conditions across navigation. Home is keep-alive'd, but a full
  // app restart or an unmount/remount (key changes) would otherwise clear the
  // user's filter — restore them from sessionStorage so returning from the edit
  // page keeps showing the filtered list instead of all archives.
  const FILTER_STORAGE_KEY = "archive-list-filters";
  let savedFilters: InitialFilters = {};
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    if (raw) savedFilters = JSON.parse(raw) as InitialFilters;
  } catch {
    /* ignore corrupt storage */
  }

  const searchQuery = ref(savedFilters.searchQuery || "");
  const selectedArchiveDifficulty = ref(savedFilters.selectedArchiveDifficulty || "");
  const selectedActualDifficulty = ref(savedFilters.selectedActualDifficulty || "");
  const selectedVisibility = ref(savedFilters.selectedVisibility || "");

  // Persist on every change.
  watch([searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility], () => {
    try {
      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({
          searchQuery: searchQuery.value,
          selectedArchiveDifficulty: selectedArchiveDifficulty.value,
          selectedActualDifficulty: selectedActualDifficulty.value,
          selectedVisibility: selectedVisibility.value,
        }),
      );
    } catch {
      /* ignore storage errors */
    }
  });

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

  // Also watch the archives ref directly so that reassigning archives.value
  // (e.g. refreshArchives) always rebuilds displayArchives even when the
  // serialised identity snapshot (archiveVersion) hasn't changed — i.e. when
  // archive IDs and visibility are the same but the actual data may differ.
  // Without this, clicking FAB "refresh" would appear to do nothing because
  // displayArchives would never be re-derived from the new archive objects.
  //
  // searchQuery changes are debounced by 60ms — this batches keystrokes
  // so the filter loop (iterating 1000+ archives with string matching)
  // doesn't block the main thread on every keypress.  60ms is imperceptible
  // to the user but prevents per-character jank.  Other filters
  // (difficulty, visibility) are immediate since they change infrequently.
  let searchDebounce: ReturnType<typeof setTimeout> | null = null;
  watch(
    [searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility, archiveVersion, archives],
    () => {
      if (searchDebounce) clearTimeout(searchDebounce);
      searchDebounce = setTimeout(
        () => {
          searchDebounce = null;
          updateFiltered();
        },
        searchQuery.value ? 60 : 0,
      );
    },
    { immediate: true },
  );

  // Clean up debounce timer when the composable scope is disposed (unmount/HMR)
  onScopeDispose(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
      searchDebounce = null;
    }
  });

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
    try {
      sessionStorage.removeItem(FILTER_STORAGE_KEY);
    } catch {
      /* ignore */
    }
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
