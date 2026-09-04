/**
 * 存档删除 — 单个删除（带确认态）与批量删除（带进度回调）
 *
 * 删除走软删（移入回收目录），可撤销：undo 恢复文件并回填列表。
 */
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { saveApi } from "../../../api";
import { toast, useArchiveStore, useHistoryStore } from "../../../stores";
import type { ArchiveData } from "../../../types";
import type { ArchiveActionCallbacks, BatchDeleteCallbacks, DeleteResults } from "./types";

export function useArchiveDelete() {
  const { t } = useTranslation();
  const removeArchiveByPath = useArchiveStore((s) => s.removeArchiveByPath);
  const restoreArchive = useArchiveStore((s) => s.restoreArchive);
  const pushAction = useHistoryStore((s) => s.pushAction);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [archiveToDelete, setArchiveToDelete] = useState<ArchiveData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteArchive = useCallback((archive: ArchiveData) => {
    setArchiveToDelete(archive);
    setShowDeleteConfirm(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteConfirm(false);
    setArchiveToDelete(null);
  }, []);

  const confirmDelete = useCallback(
    async (callbacks: ArchiveActionCallbacks = {}) => {
      const archive = archiveToDelete;
      if (!archive) return;

      setIsDeleting(true);
      try {
        if (!archive.path) throw new Error("Archive has no file path");
        await saveApi.softDeleteFile(archive.path);

        removeArchiveByPath(archive.path);
        const removed: ArchiveData = { ...archive };

        pushAction({
          description: `Delete archive "${archive.name}"`,
          undo: async () => {
            try {
              await saveApi.restoreFile(archive.path);
              restoreArchive(removed);
            } catch (e) {
              console.warn("[undo] Failed to restore archive:", e);
              toast.error(t("archive.actions.deleteFailed"));
            }
          },
          redo: async () => {
            try {
              await saveApi.softDeleteFile(archive.path);
              useArchiveStore.getState().removeArchiveByPath(archive.path);
            } catch (e) {
              console.warn("[redo] Failed to delete archive:", e);
            }
          },
        });

        toast.success(t("archive.actions.deleteSuccess", { name: archive.name }));
        closeDeleteModal();
        callbacks.onSuccess?.();
        await callbacks.onRefresh?.();
      } catch (error) {
        callbacks.onError?.(error);
        toast.error(t("archive.actions.deleteFailed"));
      } finally {
        setIsDeleting(false);
      }
    },
    [archiveToDelete, closeDeleteModal, pushAction, removeArchiveByPath, restoreArchive, t]
  );

  const batchDeleteArchives = useCallback(
    async (archiveList: ArchiveData[], callbacks: BatchDeleteCallbacks = {}) => {
      const results: DeleteResults = { success: [], failed: [] };

      for (let i = 0; i < archiveList.length; i++) {
        const archive = archiveList[i];
        callbacks.onProgress?.(i + 1, archiveList.length, archive.name);
        try {
          if (!archive.path) throw new Error("Archive has no file path");
          await saveApi.softDeleteFile(archive.path);
          results.success.push(archive.id);
          removeArchiveByPath(archive.path);
        } catch (error) {
          results.failed.push({ id: archive.id, error });
        }
      }

      if (results.failed.length === 0) {
        toast.success(t("archive.actions.batchDeleteSuccess", { count: results.success.length }));
        callbacks.onSuccess?.();
        await callbacks.onRefresh?.();
      } else {
        callbacks.onError?.(results);
        toast.error(
          t("archive.actions.batchDeleteComplete", {
            success: results.success.length,
            failed: results.failed.length,
          })
        );
      }

      return results;
    },
    [removeArchiveByPath, t]
  );

  return {
    showDeleteConfirm,
    archiveToDelete,
    isDeleting,
    deleteArchive,
    confirmDelete,
    /** 取消删除确认（与 confirmDelete 成功路径语义相同，保留独立命名以便调用方表意） */
    cancelDelete: closeDeleteModal,
    closeDeleteModal,
    batchDeleteArchives,
  };
}
