import { computed } from "vue";
import type { Ref, ComputedRef } from "vue";
import type { ArchiveConfig } from "@/types";

interface PreviewExecuteAreaReturn {
  uniformCount: ComputedRef<number>;
  individualCount: ComputedRef<number>;
  missingCount: ComputedRef<number>;
  canCreate: ComputedRef<boolean>;
  estimatedTime: ComputedRef<string>;
}

export function usePreviewExecuteArea(
  archives: Ref<ArchiveConfig[]>,
  _selectedCount: Ref<number>,
  _isCreating: Ref<boolean>,
): PreviewExecuteAreaReturn {
  const uniformCount = computed((): number => {
    return archives.value?.filter((a) => !a.hasIndividualSettings).length || 0;
  });

  const individualCount = computed((): number => {
    return archives.value?.filter((a) => a.hasIndividualSettings).length || 0;
  });

  const missingCount = computed((): number => {
    return archives.value?.filter((a) => a.validationErrors && a.validationErrors.length > 0).length || 0;
  });

  const canCreate = computed((): boolean => {
    if (!archives.value || archives.value.length === 0) return false;
    return missingCount.value === 0;
  });

  const estimatedTime = computed((): string => {
    const count = archives.value?.length || 0;
    if (count === 0) return "0s";

    const batches = Math.ceil(count / 5);
    const seconds = batches * 2;

    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
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
