import { ref } from "vue";
import { useRouter } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { gsap } from "gsap";
import { useToast } from "./useToast";
import { useUndoRedo } from "./useUndoRedo";
import type { Ref } from "vue";
import type { Router } from "vue-router";
import type { ArchiveData } from "@/types";

// Cache of recently deleted archives for undo (max 20 entries)
const deletedArchivesCache = new Map<number, ArchiveData>();
const MAX_CACHE_SIZE = 20;
// Pending permanent deletes: after toast closes, wait 5s then delete
const pendingPermanentDeletes = new Map<number, ReturnType<typeof setTimeout>>();

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
      toast.showError("Failed to toggle visibility: " + (error as Error).message);
      if (onError) onError(error);
    }
  };

  const handleEdit = (archive: ArchiveData): void => {
    router.push({
      name: "EditArchive",
      params: { archiveData: JSON.stringify(archive) },
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

      // Cache deleted archive for potential undo
      deletedArchivesCache.set(archiveId, archiveSnapshot);
      if (deletedArchivesCache.size > MAX_CACHE_SIZE) {
        const firstKey = deletedArchivesCache.keys().next().value!;
        deletedArchivesCache.delete(firstKey);
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
              toast.showError("Failed to restore file");
              return;
            }
          }
          // Restore in frontend data
          const cached = deletedArchivesCache.get(archiveId);
          if (cached) {
            archiveData.archives.value.unshift(cached);
            if (callbacks.onRefresh) await callbacks.onRefresh();
          }
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
      const schedulePermanentDelete = () => {
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

      toast.showSuccess(`${archiveName} deleted`, {
        duration: 6000,
        actions: [
          {
            text: "Undo",
            onClick: async () => {
              const p = pendingPermanentDeletes.get(archiveId);
              if (p) {
                clearTimeout(p);
                pendingPermanentDeletes.delete(archiveId);
              }
              try {
                await undo();
                toast.showInfo(`Undo delete of "${archiveName}"`, { duration: 3000 });
              } catch (e) {
                toast.showError("Undo failed");
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
      toast.showError("Delete failed: " + ((error as Error).message || error));
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
      toast.showFolder("Save folder opened");
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
    const batchSnapshots: Array<{ index: number; snapshot: ArchiveData }> = [];

    for (const archive of archiveList) {
      try {
        const archiveIndex = archiveData.archives.value.findIndex((a) => a.id === archive.id);

        if (archiveIndex === -1) {
          console.warn(`[batchDelete] Archive not found: ${archive.id}`);
          continue;
        }

        const snapshot: ArchiveData = { ...archiveData.archives.value[archiveIndex] };
        batchSnapshots.push({ index: archiveIndex, snapshot });

        if (archive.path) {
          await invoke("soft_delete_file", { filePath: archive.path });
        }

        archiveData.archives.value.splice(archiveIndex, 1);
        deleteResults.success.push(archive.id);
      } catch (error) {
        console.error(`[batchDelete] Failed to delete: ${archive.id}`, error);
        deleteResults.failed.push({ id: archive.id, error });
      }
    }

    // Register batch delete as single undo action
    if (batchSnapshots.length > 0) {
      pushAction({
        description: `Batch delete ${batchSnapshots.length} archives`,
        undo: async () => {
          // Cancel all pending permanent deletes for this batch
          for (const { snapshot } of batchSnapshots) {
            const p = pendingPermanentDeletes.get(snapshot.id);
            if (p) {
              clearTimeout(p);
              pendingPermanentDeletes.delete(snapshot.id);
            }
          }
          // Actually restore each file from trash
          for (const { snapshot } of batchSnapshots) {
            if (snapshot.path) {
              try {
                await invoke("restore_file", { filePath: snapshot.path });
              } catch (e) {
                console.warn("[undo batch] Failed to restore file:", e);
              }
            }
          }
          // Restore in frontend data
          for (const { snapshot } of batchSnapshots) {
            archiveData.archives.value.push(snapshot);
          }
          if (callbacks.onRefresh) await callbacks.onRefresh();
        },
        redo: async () => {
          // Re-delete via soft-delete
          for (const { snapshot } of batchSnapshots) {
            if (snapshot.path) {
              try {
                await invoke("soft_delete_file", { filePath: snapshot.path });
              } catch (e) {
                console.warn("[redo batch] Failed to delete:", e);
              }
            }
            const idx = archiveData.archives.value.findIndex((a) => a.id === snapshot.id);
            if (idx !== -1) {
              archiveData.archives.value.splice(idx, 1);
            }
          }
        },
      });

      // After toast closes, schedule permanent delete for each file (5s grace)
      const scheduleBatchPermanentDelete = () => {
        for (const { snapshot } of batchSnapshots) {
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

      toast.showSuccess(`Deleted ${batchSnapshots.length} archives`, {
        duration: 6000,
        actions: [
          {
            text: "Undo",
            onClick: async () => {
              for (const { snapshot } of batchSnapshots) {
                const p = pendingPermanentDeletes.get(snapshot.id);
                if (p) {
                  clearTimeout(p);
                  pendingPermanentDeletes.delete(snapshot.id);
                }
              }
              try {
                await undo();
                toast.showInfo("Batch delete undone", { duration: 3000 });
              } catch (e) {
                toast.showError("Undo failed");
              }
            },
          },
        ],
        onClose: scheduleBatchPermanentDelete,
      });
    }

    if (deleteResults.failed.length > 0) {
      toast.showError(
        `Batch delete complete: ${deleteResults.success.length} succeeded, ${deleteResults.failed.length} failed`,
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
            if (desc) toast.showInfo(`Undone: ${desc}`, { duration: 3000 });
          });
        }
      } else if (event.key === "z" && event.shiftKey) {
        event.preventDefault();
        const tag = document.activeElement?.tagName || "";
        if (!["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
          redo().then((desc: string | null) => {
            if (desc) toast.showInfo(`Redone: ${desc}`, { duration: 3000 });
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
