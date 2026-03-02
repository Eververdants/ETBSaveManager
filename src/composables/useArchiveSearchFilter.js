import { ref, computed, watch } from "vue";

export function useSearchState(initialFilters) {
  const filters = initialFilters?.value || initialFilters;
  const searchQuery = ref(filters?.searchQuery || "");
  const selectedArchiveDifficulty = ref(filters?.selectedArchiveDifficulty || "");
  const selectedActualDifficulty = ref(filters?.selectedActualDifficulty || "");
  const selectedVisibility = ref(filters?.selectedVisibility || "");

  return { searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility };
}

export function useArchiveFilter(archives, searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility) {
  const filteredArchives = computed(() => {
    const archivesArray = archives?.value || archives;
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

export function useFilterState(searchQuery, selectedArchiveDifficulty, selectedActualDifficulty, selectedVisibility) {
  const hasActiveFilters = computed(() => {
    return (
      searchQuery.value ||
      selectedArchiveDifficulty.value ||
      selectedActualDifficulty.value ||
      selectedVisibility.value
    );
  });

  return { hasActiveFilters };
}
