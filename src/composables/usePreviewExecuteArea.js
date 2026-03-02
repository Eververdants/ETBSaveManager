import { computed } from "vue";

export function usePreviewExecuteArea(archives, selectedCount, isCreating) {
  const uniformCount = computed(() => {
    return archives.value?.filter((a) => !a.hasIndividualSettings).length || 0;
  });

  const individualCount = computed(() => {
    return archives.value?.filter((a) => a.hasIndividualSettings).length || 0;
  });

  const missingCount = computed(() => {
    return archives.value?.filter(
      (a) => a.validationErrors && a.validationErrors.length > 0
    ).length || 0;
  });

  const canCreate = computed(() => {
    if (!archives.value || archives.value.length === 0) return false;
    return missingCount.value === 0;
  });

  const estimatedTime = computed(() => {
    const count = archives.value?.length || 0;
    if (count === 0) return "0s";

    const batches = Math.ceil(count / 5);
    const seconds = batches * 2;

    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
    }
  });

  return {
    uniformCount,
    individualCount,
    missingCount,
    canCreate,
    estimatedTime,
  };
}
