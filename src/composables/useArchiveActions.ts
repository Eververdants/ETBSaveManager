import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useToast } from "./useToast";
import { useUndoRedo } from "./useUndoRedo";
import { tauriArchiveAdapter } from "@/adapters/tauri/archiveAdapter";
import type { Ref } from "vue";
import type { Router } from "vue-router";
import type { ArchiveData } from "@/types";

// Store for edit archive data (avoids passing large JSON via route params)
export const editArchiveDataStore = new Map<string, string>();

/**
 * Insert an item into a name-sorted array at the correct position.
 * Used by undo restore to preserve the name-sorted ordering
 * established in useArchiveData.
 */
function insertSortedByName(arr: ArchiveData[], item: ArchiveData): void {
  const insertAt = arr.findIndex((a) => a.name.localeCompare(item.name) > 0);
  if (insertAt === -1) {
    arr.push(item);
  } else {
    arr.splice(insertAt, 0, item);
  }
}

interface ArchiveActionsCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onRefresh?: () => Promise<void>;
}

interface ToggleVisibilityCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onRefresh?: () => Promise<void>;
}

interface DeleteResults {
  success: number[];
  failed: Array<{ id: number; error: unknown }>;
}

interface BatchDeleteCallbacks {
  onSuccess?: (results: DeleteResults) => void;
  onError?: (results: DeleteResults) => void;
  onRefresh?: () => Promise<void>;
  onProgress?: (current: number, total: number, archiveName: string) => void;
}

interface ArchiveActionsReturn {
  showDeleteConfirm: Ref<boolean>;
  archiveToDelete: Ref<ArchiveData | null>;
  isDeleting: Ref<boolean>;
  handleToggleVisibility: (updatedArchive: ArchiveData, callbacks?: ToggleVisibilityCallbacks) => Promise<void>;
  handleEdit: (archive: ArchiveData) => void;
  deleteArchive: (archive: ArchiveData) => void;
  confirmDelete: (callbacks?: ArchiveActionsCallbacks) => Promise<void>;
  cancelDelete: () => void;
  closeDeleteModal: () => void;
  createNewArchive: () => void;
  openSaveGamesFolder: (callbacks?: Pick<ArchiveActionsCallbacks, "onSuccess">) => Promise<void>;
  batchDeleteArchives: (archiveList: ArchiveData[], callbacks?: BatchDeleteCallbacks) => Promise<DeleteResults>;
  registerUndoShortcuts: () => void;
  unregisterUndoShortcuts: () => void;
  canUndo: import("vue").ComputedRef<boolean>;
  canRedo: import("vue").ComputedRef<boolean>;
}

interface ArchiveDataMethods {
  archives: Ref<ArchiveData[]>;
  updateArchiveVisibility?: (id: number, visible: boolean, path?: string) => void;
}

export function useArchiveActions(
  archiveData: ArchiveDataMethods,
  _filters: Record<string, unknown>,
): ArchiveActionsReturn {
  const router: Router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const { pushAction, undo, redo, canUndo, canRedo } = useUndoRedo();

  const showDeleteConfirm = ref(false);
  const archiveToDelete = ref<ArchiveData | null>(null);
  const isDeleting = ref(false);

  const handleToggleVisibility = async (
    updatedArchive: ArchiveData,
    callbacks: ToggleVisibilityCallbacks = {},
  ): Promise<void> => {
    const { onSuccess, onError, onRefresh } = callbacks;
    try {
      const newVisibility = updatedArchive.isVisible;
      const originalVisibility = !newVisibility;

      // Optimistic update
      if (archiveData.updateArchiveVisibility) {
        archiveData.updateArchiveVisibility(updatedArchive.id, newVisibility, updatedArchive.path);
      }

      if (updatedArchive.path) {
        const result = await tauriArchiveAdapter.toggleArchiveVisibility(updatedArchive.path, updatedArchive.name);
        if (!result.success) {
          // Rollback optimistic update
          if (archiveData.updateArchiveVisibility) {
            archiveData.updateArchiveVisibility(updatedArchive.id, originalVisibility, updatedArchive.path);
          }
          throw new Error(result.error || "Operation failed");
        }

        // Register undo action
        const archiveId = updatedArchive.id;
        const archiveSnapshot: ArchiveData = { ...updatedArchive, isVisible: originalVisibility };
        pushAction({
          description: `Toggle visibility of "${updatedArchive.name}"`,
          undo: async () => {
            // Restore original visibility
            if (archiveData.updateArchiveVisibility) {
              archiveData.updateArchiveVisibility(archiveId, originalVisibility, archiveSnapshot.path);
            }
            try {
              await tauriArchiveAdapter.toggleArchiveVisibility(archiveSnapshot.path, archiveSnapshot.name);
            } catch (e) {
              console.warn("[undo] Failed to toggle visibility:", e);
            }
          },
          redo: async () => {
            // Re-apply new visibility (same as original action)
            if (archiveData.updateArchiveVisibility) {
              archiveData.updateArchiveVisibility(archiveId, newVisibility, archiveSnapshot.path);
            }
            try {
              await tauriArchiveAdapter.toggleArchiveVisibility(archiveSnapshot.path, archiveSnapshot.name);
            } catch (e) {
              console.warn("[redo] Failed to toggle visibility:", e);
            }
          },
        });
      }

      onSuccess?.();
      await onRefresh?.();
    } catch (_error) {
      onError?.(_error);
      toast.showError(t("archiveCard.toggleVisibilityFailed"));
    }
  };

  const handleEdit = (archive: ArchiveData): void => {
    editArchiveDataStore.set("current", JSON.stringify(archive));
    router.push({ name: "EditArchive", params: { archiveData: archive.id.toString() } });
  };

  const deleteArchive = (archive: ArchiveData): void => {
    archiveToDelete.value = archive;
    showDeleteConfirm.value = true;
  };

  const confirmDelete = async (callbacks: ArchiveActionsCallbacks = {}): Promise<void> => {
    const { onSuccess, onError, onRefresh } = callbacks;
    const archive = archiveToDelete.value;
    if (!archive) return;

    isDeleting.value = true;
    try {
      if (archive.path) {
        const result = await tauriArchiveAdapter.softDeleteArchive(archive.path);
        if (!result.success) {
          throw new Error(result.error || "Failed to delete archive");
        }
      }

      // Remove from local array
      const index = archiveData.archives.value.findIndex((a) => a.id === archive.id);
      if (index !== -1) {
        const removed = archiveData.archives.value.splice(index, 1)[0];

        // Register undo action
        pushAction({
          description: `Delete archive "${archive.name}"`,
          undo: async () => {
            if (archive.path) {
              try {
                await tauriArchiveAdapter.restoreArchive(archive.path);
                insertSortedByName(archiveData.archives.value, removed);
              } catch (e) {
                console.warn("[undo] Failed to restore archive:", e);
              }
            }
          },
          redo: async () => {
            if (archive.path) {
              try {
                await tauriArchiveAdapter.softDeleteArchive(archive.path);
                const idx = archiveData.archives.value.findIndex((a) => a.id === archive.id);
                if (idx !== -1) {
                  archiveData.archives.value.splice(idx, 1);
                }
              } catch (e) {
                console.warn("[redo] Failed to delete archive:", e);
              }
            }
          },
        });
      }

      toast.showSuccess(t("archiveCard.deleteSuccess"));
      closeDeleteModal();
      onSuccess?.();
      await onRefresh?.();
    } catch (_error) {
      onError?.(_error);
      toast.showError(t("archiveCard.deleteFailed"));
    } finally {
      isDeleting.value = false;
    }
  };

  const cancelDelete = (): void => {
    archiveToDelete.value = null;
    showDeleteConfirm.value = false;
  };

  const closeDeleteModal = (): void => {
    showDeleteConfirm.value = false;
    archiveToDelete.value = null;
  };

  const createNewArchive = (): void => {
    router.push({ name: "SelectCreateMode" });
  };

  const openSaveGamesFolder = async (callbacks: Pick<ArchiveActionsCallbacks, "onSuccess"> = {}): Promise<void> => {
    const { onSuccess } = callbacks;
    try {
      const result = await tauriArchiveAdapter.openSaveGamesFolder();
      if (result.success) {
        onSuccess?.();
      } else {
        toast.showError(t("archiveCard.openFolderFailed"));
      }
    } catch {
      toast.showError(t("archiveCard.openFolderFailed"));
    }
  };

  const batchDeleteArchives = async (
    archiveList: ArchiveData[],
    callbacks: BatchDeleteCallbacks = {},
  ): Promise<DeleteResults> => {
    const { onSuccess, onError, onRefresh, onProgress } = callbacks;
    const results: DeleteResults = { success: [], failed: [] };

    for (let i = 0; i < archiveList.length; i++) {
      const archive = archiveList[i];
      onProgress?.(i + 1, archiveList.length, archive.name);

      try {
        if (archive.path) {
          const result = await tauriArchiveAdapter.softDeleteArchive(archive.path);
          if (!result.success) {
            throw new Error(result.error || "Failed to delete archive");
          }
        }
        results.success.push(archive.id);

        // Remove from local array
        const index = archiveData.archives.value.findIndex((a) => a.id === archive.id);
        if (index !== -1) {
          archiveData.archives.value.splice(index, 1);
        }
      } catch (error) {
        results.failed.push({ id: archive.id, error });
      }
    }

    if (results.failed.length === 0) {
      toast.showSuccess(t("archiveCard.batchDeleteSuccess"));
      onSuccess?.(results);
      await onRefresh?.();
    } else {
      onError?.(results);
      toast.showError(t("archiveCard.batchDeletePartialFailed"));
    }

    return results;
  };

  const registerUndoShortcuts = (): void => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
  };

  const unregisterUndoShortcuts = (): void => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.removeEventListener("keydown", handleKeyDown);
  };

  return {
    showDeleteConfirm,
    archiveToDelete,
    isDeleting,
    handleToggleVisibility,
    handleEdit,
    deleteArchive,
    confirmDelete,
    cancelDelete,
    closeDeleteModal,
    createNewArchive,
    openSaveGamesFolder,
    batchDeleteArchives,
    registerUndoShortcuts,
    unregisterUndoShortcuts,
    canUndo,
    canRedo,
  };
}

