import { ref, computed, watch, type Ref, type ComputedRef } from "vue";
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
  } catch { /* ignore */ }
}

export function clearSearchHistory(): void {
  try {
    sessionStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch { /* ignore */ }
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

export function useArchiveFilter(
  archives: Ref<ArchiveData[]> | ArchiveData[],
  searchQuery: Ref<string>,
  selectedArchiveDifficulty: Ref<string>,
  selectedActualDifficulty: Ref<string>,
  selectedVisibility: Ref<string>,
): { filteredArchives: ComputedRef<ArchiveData[]>; searchSuggestions: ComputedRef<ArchiveData[]> } {
  const filteredArchives = computed((): ArchiveData[] => {
    const archivesArray: ArchiveData[] = "value" in archives ? archives.value : archives;
    if (!archivesArray || archivesArray.length === 0) return [];
    let filtered = archivesArray;

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter((archive) => {
        // Match archive name, level name, difficulty tag, game mode
        const nameMatch = archive.name.toLowerCase().includes(query);
        const levelMatch = archive.currentLevel?.toLowerCase().includes(query) ?? false;
        const diffMatch = archive.archiveDifficulty?.toLowerCase().includes(query) ?? false;
        const actualDiffMatch = archive.actualDifficulty?.toLowerCase().includes(query) ?? false;
        const modeMatch = archive.gameMode?.toLowerCase().includes(query) ?? false;
        return nameMatch || levelMatch || diffMatch || actualDiffMatch || modeMatch;
      });
    }

    if (selectedArchiveDifficulty.value) {
      filtered = filtered.filter((archive) => archive.archiveDifficulty === selectedArchiveDifficulty.value);
    }

    if (selectedActualDifficulty.value) {
      filtered = filtered.filter((archive) => archive.actualDifficulty === selectedActualDifficulty.value);
    }

    if (selectedVisibility.value) {
      const isVisible = selectedVisibility.value === "visible";
      filtered = filtered.filter((archive) => archive.isVisible === isVisible);
    }

    return filtered;
  });

  // Search suggestions: top 3 matches
  const searchSuggestions = computed((): ArchiveData[] => {
    const archivesArray: ArchiveData[] = "value" in archives ? archives.value : archives;
    if (!searchQuery.value || !archivesArray || archivesArray.length === 0) return [];
    const query = searchQuery.value.toLowerCase();

    return archivesArray
      .filter((a) => {
        const nameMatch = a.name.toLowerCase().includes(query);
        const levelMatch = a.currentLevel?.toLowerCase().includes(query) ?? false;
        return nameMatch || levelMatch;
      })
      .slice(0, 3);
  });

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
