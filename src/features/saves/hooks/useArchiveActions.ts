/**
 * 存档动作 Hook — 可见性切换 / 删除 / 批量删除 / 打开文件夹（对应 master useArchiveActions）
 *
 * 一致性要点（与 master 相同）：
 * - 单飞守卫：同一存档的 toggle 在途时丢弃后续点击
 * - 乐观更新 + 后端验证回滚：UI 永远与 MAINSAVE 实际状态对齐
 * - 撤销/重做使用显式目标状态（不使用相对翻转）
 * - 按稳定文件路径优先匹配（id 是枚举下标，刷新后漂移）
 */
import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { saveApi } from "../../../api";
import { useArchiveStore } from "../../../stores";
import { useHistoryStore } from "../../../stores";
import { useEditArchiveStore } from "../../../stores";
import { toast } from "../../../stores";
import type { ArchiveData } from "../../../types";

export interface ArchiveActionCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  onRefresh?: () => Promise<void>;
}

export interface BatchDeleteCallbacks extends ArchiveActionCallbacks {
  onProgress?: (current: number, total: number, archiveName: string) => void;
}

export interface DeleteResults {
  success: number[];
  failed: Array<{ id: number; error: unknown }>;
}

/** 按稳定路径优先查找存档下标 */
function findArchiveIndex(archives: ArchiveData[], archive: ArchiveData): number {
  if (archive.path) {
    const normalized = archive.path.toLowerCase();
    const byPath = archives.findIndex((a) => a.path && a.path.toLowerCase() === normalized);
    if (byPath !== -1) return byPath;
  }
  return archives.findIndex((a) => a.id === archive.id);
}

/** 在磁盘上应用显式可见性状态，并以后端验证结果对齐 UI */
async function applyVerifiedVisibility(
  archive: ArchiveData,
  target: boolean,
  updateVisibility: (id: number, visible: boolean, path?: string) => void,
  getArchives: () => ArchiveData[]
): Promise<boolean> {
  if (!archive.path) return target;
  const live = getArchives();
  const priorIndex = findArchiveIndex(live, archive);
  const priorState = priorIndex !== -1 ? live[priorIndex].isVisible : undefined;

  const result = await saveApi.toggleVisibility(archive.path, archive.name, target);
  const verified = result.isVisible;
  updateVisibility(archive.id, verified ?? priorState ?? target, archive.path);
  if (verified !== target) {
    throw new Error("Visibility change was not applied");
  }
  return verified;
}

export function useArchiveActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const getArchives = useCallback(() => useArchiveStore.getState().archives, []);
  const updateVisibility = useArchiveStore((s) => s.updateArchiveVisibility);
  const removeArchiveByPath = useArchiveStore((s) => s.removeArchiveByPath);
  const restoreArchive = useArchiveStore((s) => s.restoreArchive);
  const pushAction = useHistoryStore((s) => s.pushAction);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [archiveToDelete, setArchiveToDelete] = useState<ArchiveData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const togglingArchives = useRef(new Set<string>());

  const handleToggleVisibility = useCallback(
    async (updatedArchive: ArchiveData, callbacks: ArchiveActionCallbacks = {}) => {
      const { onSuccess, onRefresh } = callbacks;
      const archivePath = updatedArchive.path;

      try {
        if (!archivePath) throw new Error("Archive has no file path");
        if (togglingArchives.current.has(archivePath)) return;
        togglingArchives.current.add(archivePath);

        const desiredVisibility = updatedArchive.isVisible;
        const live = getArchives();
        const liveIndex = findArchiveIndex(live, updatedArchive);
        const originalVisibility =
          liveIndex !== -1 ? live[liveIndex].isVisible : !desiredVisibility;

        // 乐观更新
        updateVisibility(updatedArchive.id, desiredVisibility, archivePath);

        // 发送显式目标状态；失败重试一次（MAINSAVE 可能被游戏占用）
        let verified: boolean | undefined;
        try {
          const result = await saveApi.toggleVisibility(archivePath, updatedArchive.name, desiredVisibility);
          verified = result.isVisible;
          if (verified !== desiredVisibility) {
            console.warn("[toggle] Verification failed, retrying once");
            const retry = await saveApi.toggleVisibility(archivePath, updatedArchive.name, desiredVisibility);
            verified = retry.isVisible;
          }
        } catch (error) {
          console.warn("[toggle] Attempt failed:", error);
        }

        if (verified !== desiredVisibility) {
          updateVisibility(updatedArchive.id, verified ?? originalVisibility, archivePath);
          throw new Error("Toggle verification failed");
        }

        const archiveSnapshot: ArchiveData = { ...updatedArchive, isVisible: originalVisibility };
        pushAction({
          description: `Toggle visibility of "${updatedArchive.name}"`,
          undo: async () => {
            try {
              await applyVerifiedVisibility(archiveSnapshot, originalVisibility, updateVisibility, getArchives);
            } catch (e) {
              console.warn("[undo] Failed to toggle visibility:", e);
              toast.error(t("archive.actions.toggleVisibilityFailed"));
            }
          },
          redo: async () => {
            try {
              await applyVerifiedVisibility(archiveSnapshot, desiredVisibility, updateVisibility, getArchives);
            } catch (e) {
              console.warn("[redo] Failed to toggle visibility:", e);
              toast.error(t("archive.actions.toggleVisibilityFailed"));
            }
          },
        });

        onSuccess?.();
        await onRefresh?.();
      } catch (error) {
        callbacks.onError?.(error);
        toast.error(t("archive.actions.toggleVisibilityFailed"));
      } finally {
        if (archivePath) togglingArchives.current.delete(archivePath);
      }
    },
    [getArchives, updateVisibility, pushAction, t]
  );

  const handleEdit = useCallback(
    (archive: ArchiveData) => {
      // 编辑页通过 store 读取完整数据（路由不携带大 JSON）
      useEditArchiveStore.getState().setPayload(JSON.stringify(archive));
      navigate("/games/edit");
    },
    [navigate]
  );

  const deleteArchive = useCallback((archive: ArchiveData) => {
    setArchiveToDelete(archive);
    setShowDeleteConfirm(true);
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
        setShowDeleteConfirm(false);
        setArchiveToDelete(null);
        callbacks.onSuccess?.();
        await callbacks.onRefresh?.();
      } catch (error) {
        callbacks.onError?.(error);
        toast.error(t("archive.actions.deleteFailed"));
      } finally {
        setIsDeleting(false);
      }
    },
    [archiveToDelete, removeArchiveByPath, pushAction, t]
  );

  const cancelDelete = useCallback(() => {
    setArchiveToDelete(null);
    setShowDeleteConfirm(false);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteConfirm(false);
    setArchiveToDelete(null);
  }, []);

  const createNewArchive = useCallback(() => {
    navigate("/saves/create");
  }, [navigate]);

  const openSaveGamesFolder = useCallback(async () => {
    try {
      await saveApi.openSaveGamesFolder();
      toast.info(t("archive.actions.folderOpened"));
    } catch {
      toast.error(t("archive.actions.openFolderFailed"));
    }
  }, [t]);

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

  const registerUndoShortcuts = useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const state = useHistoryStore.getState();
        if (e.shiftKey) void state.redo();
        else void state.undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
