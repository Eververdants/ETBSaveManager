import { ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { gsap } from "gsap";
import { useToast } from "./useToast";
import { useUndoRedo } from "./useUndoRedo";
import type { Ref } from "vue";
import type { Router } from "vue-router";
import type { ArchiveData } from "@/types";

// Store for edit archive data (avoids passing large JSON via route params)
export const editArchiveDataStore = new Map<string, string>();

// Pending permanent deletes: after toast closes, wait 5s then delete
const pendingPermanentDeletes = new Map<number, ReturnType<typeof setTimeout>>();

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
  deletingCardId: Ref<number | null>;
  selectArchive: (archive: ArchiveData) => void;
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
  updateArchiveVisibility?: (id: number, visible: boolean) => void;
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
  const deletingCardId = ref<number | null>(null);
  const isProcessingClick = new Set<number>();

  const selectArchive = (archive: ArchiveData): void => {
    if (isProcessingClick.has(archive.id)) return;
    isProcessingClick.add(archive.id);
    setTimeout(() => isProcessingClick.delete(archive.id), 300);
  };

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
        archiveData.updateArchiveVisibility(updatedArchive.id, newVisibility);
      }

      if (updatedArchive.path) {
        const result = await invoke("handle_file", {
          filePath: updatedArchive.path,
          action: "toggle_visibility",
          archiveName: updatedArchive.name,
        });
        let resultObj: { success?: boolean; error?: string } | null;
        try {
          resultObj = typeof result === "string" ? JSON.parse(result) : result;
        } catch (e) {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          throw new Error("Failed to parse backend response");
        }
        if (!resultObj || !resultObj.success) {
          // Rollback optimistic update
          if (archiveData.updateArchiveVisibility) {
            archiveData.updateArchiveVisibility(updatedArchive.id, originalVisibility);
          }
          throw new Error(resultObj?.error || "Operation failed");
        }

        // Register undo action
        const archiveId = updatedArchive.id;
        const archiveSnapshot: ArchiveData = { ...updatedArchive, isVisible: originalVisibility };
        pushAction({
          description: `Toggle visibility of "${updatedArchive.name}"`,
          undo: async () => {
            // Restore original visibility
            if (archiveData.updateArchiveVisibility) {
              archiveData.updateArchiveVisibility(archiveId, originalVisibility);
            }
            try {
              await invoke("handle_file", {
                filePath: archiveSnapshot.path,
                action: "toggle_visibility",
                archiveName: archiveSnapshot.name,
              });
            } catch (e) {
              console.warn("[undo] Failed to toggle visibility:", e);
            }
          },
          redo: async () => {
            // Re-apply new visibility (same as original action)
            if (archiveData.updateArchiveVisibility) {
              archiveData.updateArchiveVisibility(archiveId, newVisibility);
            }
            try {
              await invoke("handle_file", {
                filePath: archiveSnapshot.path,
                action: "toggle_visibility",
                archiveName: archiveSnapshot.name,
              });
            } catch (e) {
              console.warn("[redo] Failed to toggle visibility:", e);
            }
          },
        });

        if (onRefresh) await onRefresh();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.showError(t("archive.actions.toggleVisibilityFailed", { error: (error as Error).message }));
      if (onError) onError(error);
    }
  };

  const handleEdit = (archive: ArchiveData): void => {
    const key = `edit_${archive.id}_${Date.now()}`;
    editArchiveDataStore.set(key, JSON.stringify(archive));
    router.push({
      name: "EditArchive",
      params: { archiveData: key },
    });
  };

  const deleteArchive = (archive: ArchiveData): void => {
    archiveToDelete.value = archive;
    showDeleteConfirm.value = true;
  };

  const confirmDelete = async (callbacks: ArchiveActionsCallbacks = {}): Promise<void> => {
    const { onSuccess, onError } = callbacks;
    if (!archiveToDelete.value || isDeleting.value) return;

    isDeleting.value = true;
    deletingCardId.value = archiveToDelete.value.id;

    try {
      const archiveIndex = archiveData.archives.value.findIndex((a) => a.id === archiveToDelete.value!.id);
      if (archiveIndex === -1) throw new Error("Archive data not found for deletion");

      const archive = archiveData.archives.value[archiveIndex];
      showDeleteConfirm.value = false;

      // Save snapshot for undo
      const archiveSnapshot: ArchiveData = { ...archive };
      const archiveId = archive.id;
      const archiveName = archive.name || "Archive";

      const cardElement = document.querySelector(`[data-archive-id="${archive.id}"]`) as HTMLElement | null;

      // Play fade-out animation for delete card
      if (cardElement) {
        await new Promise<void>((resolve) => {
          gsap.to(cardElement, {
            opacity: 0,
            duration: 0.15,
            ease: "none",
            onComplete: resolve,
          });
        });
      }

      // Call backend soft-delete (rename .sav → .sav.trash)
      if (archive.path) {
        await invoke("soft_delete_file", { filePath: archive.path });
      }

      // Remove from data (virtual scrolling will handle position changes automatically)
      if (archiveIndex >= 0 && archiveIndex < archiveData.archives.value.length) {
        archiveData.archives.value.splice(archiveIndex, 1);
      } else {
        console.warn("[useArchiveActions] Invalid archive index during deletion:", archiveIndex);
      }

      // Register undo action with toast
      pushAction({
        description: `Delete "${archiveName}"`,
        undo: async () => {
          // Cancel pending permanent delete (safety)
          const p = pendingPermanentDeletes.get(archiveId);
          if (p) {
            clearTimeout(p);
            pendingPermanentDeletes.delete(archiveId);
          }
          // Actually restore the file from trash
          if (archiveSnapshot.path) {
            try {
              await invoke("restore_file", { filePath: archiveSnapshot.path });
            } catch (e) {
              console.warn("[undo] Failed to restore file:", e);
              toast.showWarning(t("archive.actions.restoreFailed"));
            }
          }
          // Restore in frontend data, maintaining name-sorted order
          insertSortedByName(archiveData.archives.value, archiveSnapshot);
          if (callbacks.onRefresh) await callbacks.onRefresh();
        },
        redo: async () => {
          // Re-delete via soft-delete
          if (archiveSnapshot.path) {
            try {
              await invoke("soft_delete_file", { filePath: archiveSnapshot.path });
            } catch (e) {
              console.warn("[redo] Failed to delete:", e);
            }
          }
          // Remove from data
          const idx = archiveData.archives.value.findIndex((a) => a.id === archiveId);
          if (idx !== -1) {
            archiveData.archives.value.splice(idx, 1);
          }
        },
      });

      // Show undo toast; once it actually closes, wait 5s then permanently delete
      let undoPerformed = false;

      const schedulePermanentDelete = () => {
        if (undoPerformed) return;
        const timer = setTimeout(async () => {
          pendingPermanentDeletes.delete(archiveId);
          if (archiveSnapshot.path) {
            try {
              await invoke("permanent_delete_file", { filePath: archiveSnapshot.path });
            } catch (e) {
              console.warn("[permanent_delete] Failed to permanently delete:", e);
            }
          }
        }, 5000);
        pendingPermanentDeletes.set(archiveId, timer);
      };

      toast.showSuccess(t("archive.actions.deleteSuccess", { name: archiveName }), {
        duration: 6000,
        actions: [
          {
            text: t("archive.actions.undo"),
            onClick: async () => {
              undoPerformed = true;
              const p = pendingPermanentDeletes.get(archiveId);
              if (p) {
                clearTimeout(p);
                pendingPermanentDeletes.delete(archiveId);
              }
              try {
                await undo();
                toast.showInfo(t("archive.actions.undoDeleteOf", { name: archiveName }), { duration: 3000 });
              } catch {
                toast.showError(t("archive.actions.undoFailed"));
              }
            },
          },
        ],
        onClose: schedulePermanentDelete,
      });

      archiveToDelete.value = null;
      isDeleting.value = false;
      deletingCardId.value = null;
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.showError(t("archive.actions.deleteFailed", { error: (error as Error).message || error }));
      closeDeleteModal();
      if (onError) onError(error);
    }
  };

  const cancelDelete = (): void => closeDeleteModal();

  const closeDeleteModal = (): void => {
    showDeleteConfirm.value = false;
    archiveToDelete.value = null;
    isDeleting.value = false;
    deletingCardId.value = null;
  };

  const createNewArchive = (): void => {
    router.push({ name: "CreateArchive" });
  };

  const openSaveGamesFolder = async (callbacks: Pick<ArchiveActionsCallbacks, "onSuccess"> = {}): Promise<void> => {
    try {
      await invoke("open_save_games_folder");
      toast.showFolder(t("archive.actions.folderOpened"));
      if (callbacks.onSuccess) callbacks.onSuccess();
    } catch (error) {
      console.error("Failed to open folder:", error);
    }
  };

  const batchDeleteArchives = async (
    archiveList: ArchiveData[],
    callbacks: BatchDeleteCallbacks = {},
  ): Promise<DeleteResults> => {
    const { onSuccess, onError } = callbacks;
    const deleteResults: DeleteResults = { success: [], failed: [] };
    const batchSnapshots: ArchiveData[] = [];

    // Phase 1: collect snapshots before any mutation
    for (const archive of archiveList) {
      const found = archiveData.archives.value.find((a) => a.id === archive.id);
      if (found) {
        batchSnapshots.push({ ...found });
      } else {
        console.warn(`[batchDelete] Archive not found: ${archive.id}`);
      }
    }

    // Phase 2: process soft_delete_file sequentially to avoid MAINSAVE.sav concurrent write conflicts
    for (let i = 0; i < batchSnapshots.length; i++) {
      const snapshot = batchSnapshots[i];
      callbacks.onProgress?.(i + 1, batchSnapshots.length, snapshot.name);
      if (snapshot.path) {
        try {
          await invoke("soft_delete_file", { filePath: snapshot.path });
          deleteResults.success.push(snapshot.id);
        } catch (e) {
          console.error(`[batchDelete] Failed to delete: ${snapshot.id}`, e);
          deleteResults.failed.push({ id: snapshot.id, error: e });
        }
      } else {
        deleteResults.success.push(snapshot.id);
      }
    }

    // Phase 3: remove only successfully deleted items from array
    if (deleteResults.success.length > 0) {
      const successIds = new Set(deleteResults.success);
      archiveData.archives.value = archiveData.archives.value.filter((a) => !successIds.has(a.id));
    }

    // Register batch delete as single undo action
    if (batchSnapshots.length > 0) {
      pushAction({
        description: `Batch delete ${batchSnapshots.length} archives`,
        undo: async () => {
          // Cancel all pending permanent deletes for this batch
          for (const snapshot of batchSnapshots) {
            const p = pendingPermanentDeletes.get(snapshot.id);
            if (p) {
              clearTimeout(p);
              pendingPermanentDeletes.delete(snapshot.id);
            }
          }
          // Restore all files in parallel
          const restores = batchSnapshots
            .filter((s) => s.path)
            .map((s) =>
              invoke("restore_file", { filePath: s.path }).catch((e) =>
                console.warn("[undo batch] Failed to restore file:", e),
              ),
            );
          await Promise.allSettled(restores);
          // Restore in frontend data, maintaining name-sorted order
          for (const snapshot of batchSnapshots) {
            insertSortedByName(archiveData.archives.value, snapshot);
          }
          if (callbacks.onRefresh) await callbacks.onRefresh();
        },
        redo: async () => {
          // Re-delete all files in parallel
          const deletes = batchSnapshots
            .filter((s) => s.path)
            .map((s) =>
              invoke("soft_delete_file", { filePath: s.path }).catch((e) =>
                console.warn("[redo batch] Failed to delete:", e),
              ),
            );
          await Promise.allSettled(deletes);
          // Remove all in one pass
          const redoIds = new Set(batchSnapshots.map((s) => s.id));
          archiveData.archives.value = archiveData.archives.value.filter((a) => !redoIds.has(a.id));
        },
      });

      // Show undo toast; once it actually closes, wait 5s then permanently delete
      let batchUndoPerformed = false;

      const scheduleBatchPermanentDelete = () => {
        if (batchUndoPerformed) return;
        for (const snapshot of batchSnapshots) {
          if (!snapshot.path) continue;
          const timer = setTimeout(async () => {
            pendingPermanentDeletes.delete(snapshot.id);
            try {
              await invoke("permanent_delete_file", { filePath: snapshot.path });
            } catch (e) {
              console.warn("[permanent_delete batch] Failed to permanently delete:", e);
            }
          }, 5000);
          pendingPermanentDeletes.set(snapshot.id, timer);
        }
      };

      toast.showSuccess(t("archive.actions.batchDeleteSuccess", { count: batchSnapshots.length }), {
        duration: 6000,
        actions: [
          {
            text: t("archive.actions.undo"),
            onClick: async () => {
              batchUndoPerformed = true;
              for (const snapshot of batchSnapshots) {
                const p = pendingPermanentDeletes.get(snapshot.id);
                if (p) {
                  clearTimeout(p);
                  pendingPermanentDeletes.delete(snapshot.id);
                }
              }
              try {
                await undo();
                toast.showInfo(t("archive.actions.batchDeleteUndone"), { duration: 3000 });
              } catch {
                toast.showError(t("archive.actions.undoFailed"));
              }
            },
          },
        ],
        onClose: scheduleBatchPermanentDelete,
      });
    }

    if (deleteResults.failed.length > 0) {
      toast.showError(
        t("archive.actions.batchDeleteComplete", {
          success: deleteResults.success.length,
          failed: deleteResults.failed.length,
        }),
      );
      if (onError) onError(deleteResults);
    }

    if (onSuccess) onSuccess(deleteResults);

    return deleteResults;
  };

  // Register global Ctrl+Z / Ctrl+Shift+Z for undo/redo
  let keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  function registerUndoShortcuts(): void {
    if (keydownHandler) return; // Already registered
    keydownHandler = (event: KeyboardEvent): void => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      if (!isCtrlOrCmd) return;

      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        // Only undo if there's something to undo and not in an input field
        const tag = document.activeElement?.tagName || "";
        if (!["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
          undo().then((desc: string | null) => {
            if (desc) toast.showInfo(t("archive.actions.undone", { desc }), { duration: 3000 });
          });
        }
      } else if (event.key === "z" && event.shiftKey) {
        event.preventDefault();
        const tag = document.activeElement?.tagName || "";
        if (!["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
          redo().then((desc: string | null) => {
            if (desc) toast.showInfo(t("archive.actions.redone", { desc }), { duration: 3000 });
          });
        }
      }
    };
    document.addEventListener("keydown", keydownHandler);
  }

  function unregisterUndoShortcuts(): void {
    if (keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
      keydownHandler = null;
    }
  }

  return {
    showDeleteConfirm,
    archiveToDelete,
    isDeleting,
    deletingCardId,
    selectArchive,
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
