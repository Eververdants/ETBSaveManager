import { ref, computed, watch, type Ref, type ComputedRef } from "vue";
import type { ArchiveData } from "@/types";

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
): { filteredArchives: ComputedRef<ArchiveData[]> } {
  const filteredArchives = computed((): ArchiveData[] => {
    const archivesArray: ArchiveData[] = "value" in archives ? archives.value : archives;
    if (!archivesArray || archivesArray.length === 0) return [];
    let filtered = archivesArray;

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter((archive) => archive.name.toLowerCase().includes(query));
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

  return { filteredArchives };
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
