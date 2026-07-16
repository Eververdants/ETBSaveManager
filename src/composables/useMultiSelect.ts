import { ref, computed, type Ref } from "vue";
import type { ArchiveData } from "@/types";

interface DeleteResults {
  success: number[];
  failed: Array<{ id: number; error: unknown }>;
}

interface BatchDeleteCallbacks {
  onSuccess?: (results: DeleteResults) => void;
  onError?: (results: DeleteResults) => void;
}

export interface MultiSelectActions {
  batchDeleteArchives: (archiveList: ArchiveData[], callbacks?: BatchDeleteCallbacks) => Promise<DeleteResults>;
}

/**
 * Multi-select mode composable for the archive list page.
 * Manages selection state, toolbar actions, and batch delete flow.
 */
export function useMultiSelect(
  displayArchives: Ref<ArchiveData[]>,
  archives: Ref<ArchiveData[]>,
  actions: MultiSelectActions,
) {
  const isMultiSelectMode = ref(false);
  const selectedArchives = ref(new Set<number>());
  const showBatchDeleteConfirm = ref(false);
  const isBatchDeleting = ref(false);

  const isAllSelected = computed(() => {
    return displayArchives.value.length > 0 && selectedArchives.value.size === displayArchives.value.length;
  });

  const enterMultiSelectMode = (): void => {
    isMultiSelectMode.value = true;
    selectedArchives.value = new Set();
    // Disable page scrolling
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.documentElement.style.overflow = "hidden";
  };

  const exitMultiSelectMode = (): void => {
    isMultiSelectMode.value = false;
    selectedArchives.value = new Set();
    // Restore page scrolling
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.height = "";
    document.documentElement.style.overflow = "";
  };

  const toggleArchiveSelection = (archiveId: number): void => {
    const newSet = new Set(selectedArchives.value);
    if (newSet.has(archiveId)) {
      newSet.delete(archiveId);
    } else {
      newSet.add(archiveId);
    }
    selectedArchives.value = newSet;
  };

  const toggleSelectAll = (): void => {
    if (isAllSelected.value) {
      selectedArchives.value = new Set();
    } else {
      selectedArchives.value = new Set(displayArchives.value.map((a) => a.id));
    }
  };

  const handleShowBatchDeleteConfirm = (): void => {
    showBatchDeleteConfirm.value = true;
  };

  const cancelBatchDelete = (): void => {
    showBatchDeleteConfirm.value = false;
  };

  const confirmBatchDelete = async (): Promise<void> => {
    isBatchDeleting.value = true;
    const idsToDelete = Array.from(selectedArchives.value);
    const archivesToDelete = archives.value.filter((a) => idsToDelete.includes(a.id));

    await actions.batchDeleteArchives(archivesToDelete, {
      onSuccess: () => {
        isBatchDeleting.value = false;
        showBatchDeleteConfirm.value = false;
        exitMultiSelectMode();
      },
      onError: () => {
        isBatchDeleting.value = false;
        showBatchDeleteConfirm.value = false;
        exitMultiSelectMode();
      },
    });
  };

  return {
    isMultiSelectMode,
    selectedArchives,
    showBatchDeleteConfirm,
    isBatchDeleting,
    isAllSelected,
    enterMultiSelectMode,
    exitMultiSelectMode,
    toggleArchiveSelection,
    toggleSelectAll,
    confirmBatchDelete,
    cancelBatchDelete,
    handleShowBatchDeleteConfirm,
  };
}
