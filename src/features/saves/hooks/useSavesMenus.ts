/**
 * 存档页右键菜单 — 页面 / 卡片 / 文件夹 / 多选的菜单项构建与开关
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
  Folder,
  FolderInput,
  FolderMinus,
  FolderOpen,
  FolderPlus,
  ListChecks,
  Pencil,
  Redo2,
  RefreshCw,
  Sparkles,
  SquarePen,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import { useContextMenu } from "../../../components/ui";
import type { ContextMenuItem } from "../../../components/ui";
import type { OrganizeRule } from "../../../stores";
import type { ArchiveData } from "../../../types";
import type { useArchiveActions } from "./useArchiveActions";
import type { ArchiveFolderWithCount, FolderOption } from "./useArchiveFolders";

type ArchiveActions = ReturnType<typeof useArchiveActions>;

/** 文件夹视图 API（useArchiveFolders 的裁剪子集） */
export interface MenusFoldersApi {
  isInFolder: boolean;
  currentFolder: ArchiveFolderWithCount | null;
  hasAssignments: boolean;
  folderIdOf: (archive: ArchiveData) => string | null;
  folderOptions: FolderOption[];
  getDescendantIds: (folderId: string) => string[];
}

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
  /** 文件夹能力（数据层就绪后传入） */
  folders?: MenusFoldersApi;
  /** 当前目录下可整理的存档数（一键整理的可用性：整理以当前目录为基准） */
  organizeCount: number;
  onNewFolder: () => void;
  onRenameFolder: (folder: ArchiveFolderWithCount) => void;
  onDeleteFolder: (folder: ArchiveFolderWithCount) => void;
  onOpenFolderCard: (folder: ArchiveFolderWithCount) => void;
  onMoveArchives: (paths: string[], folderId: string | null) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
  onMoveToNewFolder: (paths: string[]) => void;
  onOrganize: (rule: OrganizeRule) => void;
  onClearAll: () => void;
}

export function useSavesMenus(deps: SavesMenusDeps) {
  const { t } = useTranslation();
  const { menu, open, close } = useContextMenu();

  /** 整理规则子菜单 */
  const organizeRuleItems = useCallback(
    (): ContextMenuItem[] => [
      {
        label: t("organizer.organizeByArchiveDifficulty"),
        onSelect: () => deps.onOrganize("archiveDifficulty"),
      },
      {
        label: t("organizer.organizeByActualDifficulty"),
        onSelect: () => deps.onOrganize("actualDifficulty"),
      },
      {
        label: t("organizer.organizeByVisibility"),
        onSelect: () => deps.onOrganize("visibility"),
      },
    ],
    [t, deps]
  );

  /** 「移动到文件夹」子菜单：扁平文件夹列表（路径全名）+ 移出 + 新建 */
  const buildMoveToItems = useCallback(
    (archive: ArchiveData): ContextMenuItem[] => {
      const currentId = deps.folders?.folderIdOf(archive) ?? null;
      const items: ContextMenuItem[] = (deps.folders?.folderOptions ?? []).map((o) => ({
        label: o.label,
        icon: Folder,
        checked: currentId === o.id,
        onSelect: () => deps.onMoveArchives([archive.path], o.id),
      }));
      items.push({ separator: true });
      items.push({
        label: t("organizer.removeFromFolder"),
        icon: FolderMinus,
        disabled: !currentId,
        onSelect: () => deps.onMoveArchives([archive.path], null),
      });
      items.push({
        label: t("organizer.newFolder"),
        icon: FolderPlus,
        onSelect: () => deps.onMoveToNewFolder([archive.path]),
      });
      return items;
    },
    [t, deps]
  );

  /** 文件夹移动子菜单：排除自身与后代（防成环），并按当前归属勾选 */
  const buildFolderMoveToItems = useCallback(
    (folder: ArchiveFolderWithCount): ContextMenuItem[] => {
      const folders = deps.folders;
      if (!folders) return [];
      const excluded = new Set([folder.id, ...folders.getDescendantIds(folder.id)]);
      const items: ContextMenuItem[] = folders.folderOptions
        .filter((o) => !excluded.has(o.id))
        .map((o) => ({
          label: o.label,
          icon: Folder,
          checked: folder.parentId === o.id,
          onSelect: () => deps.onMoveFolder(folder.id, o.id),
        }));
      items.push({ separator: true });
      items.push({
        label: t("organizer.removeFromFolder"),
        icon: FolderMinus,
        disabled: folder.parentId === null,
        onSelect: () => deps.onMoveFolder(folder.id, null),
      });
      return items;
    },
    [t, deps]
  );

  /** 空白区域右键：刷新 / 文件夹 / 新建 / 整理 / 目录管理 / 多选 / 撤销重做 */
  const openPageMenu = useCallback(
    (e: React.MouseEvent) => {
      const folders = deps.folders;
      const items: ContextMenuItem[] = [
        {
          label: t("common.refreshList"),
          icon: RefreshCw,
          disabled: deps.isRefreshing,
          onSelect: deps.onRefresh,
        },
        { label: t("common.openFolder"), icon: FolderOpen, onSelect: deps.onOpenFolder },
        { separator: true },
        { label: t("archiveSearch.createArchive"), icon: SquarePen, onSelect: deps.onCreate },
        { label: t("organizer.newFolder"), icon: FolderPlus, onSelect: deps.onNewFolder },
        { separator: true },
        {
          label: t("organizer.quickOrganize"),
          icon: Sparkles,
          disabled: deps.organizeCount === 0,
          onSelect: () => deps.onOrganize("archiveDifficulty"),
        },
        {
          label: t("organizer.moreOrganize"),
          icon: ListChecks,
          disabled: deps.organizeCount === 0,
          children: organizeRuleItems(),
        },
      ];

      // 文件夹管理（此前在整理胶囊里，胶囊移除后并入页面菜单）
      if (folders?.isInFolder && folders.currentFolder) {
        const current = folders.currentFolder;
        items.push({ separator: true });
        items.push({
          label: t("organizer.renameFolder"),
          icon: Pencil,
          onSelect: () => deps.onRenameFolder(current),
        });
        items.push({
          label: t("organizer.deleteFolder"),
          icon: Trash2,
          danger: true,
          onSelect: () => deps.onDeleteFolder(current),
        });
      }
      items.push({
        label: t("organizer.clearAll"),
        icon: FolderMinus,
        disabled: !folders?.hasAssignments,
        onSelect: deps.onClearAll,
      });

      items.push(
        { separator: true },
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
        }
      );
      open(e, items);
    },
    [open, t, deps, organizeRuleItems]
  );

  /** 存档卡片右键：编辑 / 隐藏显示 / 移动到文件夹 / 删除 */
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
        {
          label: t("organizer.moveToFolder"),
          icon: FolderInput,
          children: buildMoveToItems(archive),
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
    [open, t, deps, buildMoveToItems]
  );

  /** 文件夹卡片右键：打开 / 重命名 / 移动到文件夹 / 删除 */
  const openFolderMenu = useCallback(
    (e: React.MouseEvent, folder: ArchiveFolderWithCount) => {
      open(e, [
        {
          label: t("organizer.openFolder"),
          icon: FolderOpen,
          onSelect: () => deps.onOpenFolderCard(folder),
        },
        { label: t("organizer.renameFolder"), icon: Pencil, onSelect: () => deps.onRenameFolder(folder) },
        {
          label: t("organizer.moveToFolder"),
          icon: FolderInput,
          children: buildFolderMoveToItems(folder),
        },
        { separator: true },
        {
          label: t("organizer.deleteFolder"),
          icon: Trash2,
          danger: true,
          onSelect: () => deps.onDeleteFolder(folder),
        },
      ]);
    },
    [open, t, deps, buildFolderMoveToItems]
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

  return { menu, close, openPageMenu, openCardMenu, openFolderMenu, openMultiSelectMenu };
}
