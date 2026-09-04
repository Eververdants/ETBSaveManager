/**
 * 存档动作 Hook — 组合入口
 *
 * 页面只需 useArchiveActions()：
 * - 可见性切换 → useArchiveVisibility
 * - 删除 / 批量删除 → useArchiveDelete
 * - 撤销快捷键 → useUndoShortcuts
 * - 导航与文件夹操作 → 本文件
 */
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { saveApi } from "../../../api";
import { toast, useEditArchiveStore } from "../../../stores";
import type { ArchiveData } from "../../../types";
import { useArchiveDelete } from "./useArchiveDelete";
import { useArchiveVisibility } from "./useArchiveVisibility";
import { useUndoShortcuts } from "./useUndoShortcuts";

export type { ArchiveActionCallbacks, BatchDeleteCallbacks, DeleteResults } from "./types";

export function useArchiveActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { handleToggleVisibility } = useArchiveVisibility();
  const deletion = useArchiveDelete();
  const { registerUndoShortcuts, undo, redo, canUndo, canRedo } = useUndoShortcuts();

  const handleEdit = useCallback(
    (archive: ArchiveData) => {
      // 编辑页通过 store 读取完整数据（路由不携带大 JSON）
      useEditArchiveStore.getState().setPayload(JSON.stringify(archive));
      navigate("/games/edit");
    },
    [navigate]
  );

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

  return {
    ...deletion,
    handleToggleVisibility,
    handleEdit,
    createNewArchive,
    openSaveGamesFolder,
    registerUndoShortcuts,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
