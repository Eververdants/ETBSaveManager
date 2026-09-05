/**
 * 存档页右键菜单 — 页面 / 卡片 / 多选三种菜单项的构建与开关
 *
 * 页面持有唯一 useContextMenu 实例；菜单项快照在 open 调用时构建，
 * 因此回调永远拿到当次渲染的 actions / 状态。
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckSquare,
  Eye,
  EyeOff,
  FolderOpen,
  Redo2,
  RefreshCw,
  SquarePen,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import { useContextMenu } from "../../../components/ui";
import type { ArchiveData } from "../../../types";
import type { useArchiveActions } from "./useArchiveActions";

type ArchiveActions = ReturnType<typeof useArchiveActions>;

export interface SavesMenusDeps {
  actions: ArchiveActions;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenFolder: () => void;
  onCreate: () => void;
  /** 页面包装过的可见性切换（携带 silent refresh 回调） */
  onToggleVisibility: (archive: ArchiveData) => void;
  isMultiSelectMode: boolean;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleMultiSelect: () => void;
  onBatchDelete: () => void;
}

export function useSavesMenus(deps: SavesMenusDeps) {
  const { t } = useTranslation();
  const { menu, open, close } = useContextMenu();

  /** 空白区域右键：刷新 / 文件夹 / 新建 / 多选 / 撤销重做 */
  const openPageMenu = useCallback(
    (e: React.MouseEvent) => {
      open(e, [
        {
          label: t("common.refreshList"),
          icon: RefreshCw,
          disabled: deps.isRefreshing,
          onSelect: deps.onRefresh,
        },
        { label: t("common.openFolder"), icon: FolderOpen, onSelect: deps.onOpenFolder },
        { separator: true },
        { label: t("archiveSearch.createArchive"), icon: SquarePen, onSelect: deps.onCreate },
        {
          label: t("common.multiSelectDelete"),
          icon: CheckSquare,
          onSelect: deps.onToggleMultiSelect,
        },
        { separator: true },
        {
          label: t("archive.actions.undo"),
          icon: Undo2,
          shortcut: "Ctrl+Z",
          disabled: !deps.actions.canUndo,
          onSelect: () => void deps.actions.undo(),
        },
        {
          label: t("archive.actions.redo"),
          icon: Redo2,
          shortcut: "Ctrl+Shift+Z",
          disabled: !deps.actions.canRedo,
          onSelect: () => void deps.actions.redo(),
        },
      ]);
    },
    [open, t, deps]
  );

  /** 存档卡片右键：编辑 / 隐藏显示 / 删除 */
  const openCardMenu = useCallback(
    (e: React.MouseEvent, archive: ArchiveData) => {
      open(e, [
        {
          label: t("archiveCard.editLabel"),
          icon: SquarePen,
          onSelect: () => deps.actions.handleEdit(archive),
        },
        {
          label: archive.isVisible ? t("archiveCard.hideLabel") : t("archiveCard.showLabel"),
          icon: archive.isVisible ? EyeOff : Eye,
          onSelect: () => deps.onToggleVisibility(archive),
        },
        { separator: true },
        {
          label: t("archiveCard.deleteLabel"),
          icon: Trash2,
          danger: true,
          onSelect: () => deps.actions.deleteArchive(archive),
        },
      ]);
    },
    [open, t, deps]
  );

  /** 多选模式右键（卡片与空白一致）：全选 / 批量删除 / 退出 */
  const openMultiSelectMenu = useCallback(
    (e: React.MouseEvent) => {
      open(e, [
        {
          label: t("archiveSearch.multiSelect.selectAll"),
          icon: CheckSquare,
          onSelect: deps.onSelectAll,
        },
        {
          label: t("archiveSearch.multiSelect.deselectAll"),
          icon: X,
          onSelect: deps.onDeselectAll,
        },
        { separator: true },
        {
          label: t("archiveSearch.multiSelect.batchDelete"),
          icon: Trash2,
          danger: true,
          disabled: deps.selectedCount === 0,
          onSelect: deps.onBatchDelete,
        },
        { separator: true },
        {
          label: t("archiveSearch.multiSelect.exit"),
          icon: X,
          onSelect: deps.onToggleMultiSelect,
        },
      ]);
    },
    [open, t, deps]
  );

  return { menu, close, openPageMenu, openCardMenu, openMultiSelectMenu };
}
