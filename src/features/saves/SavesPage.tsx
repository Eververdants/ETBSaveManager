/**
 * 存档列表页（master Home → /saves/all）
 *
 * 页面只负责 UI 编排：
 * - 标题栏搜索 → components/TitleSearchCenter（portal 注入 TitleBar 插槽）
 * - 右键菜单 → hooks/useSavesMenus（页面 / 卡片 / 多选）
 * - 多选条 → components/MultiSelectBar
 * - 批量进度 → components/BatchDeleteProgress
 * - 列表状态 → hooks/useArchiveList；动作 → hooks/useArchiveActions
 */
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FolderOpen, PackageOpen, SearchX, SquarePen } from "lucide-react";

import { ConfirmDialog, ContextMenu, EmptyState, Spinner } from "../../components/ui";
import { useArchiveStore } from "../../stores";
import type { ArchiveFolder } from "../../types";
import { useArchiveActions } from "./hooks/useArchiveActions";
import { useArchiveFolders } from "./hooks/useArchiveFolders";
import type { ArchiveFolderWithCount } from "./hooks/useArchiveFolders";
import { useArchiveList } from "./hooks/useArchiveList";
import { useMultiSelect } from "./hooks/useMultiSelect";
import { useSavesMenus } from "./hooks/useSavesMenus";
import { useLevelName } from "../../utils/levelUtils";
import BatchDeleteProgress from "./components/BatchDeleteProgress";
import FolderBreadcrumb from "./components/FolderBreadcrumb";
import FolderNameDialog from "./components/FolderNameDialog";
import MultiSelectBar from "./components/MultiSelectBar";
import TitleSearchCenter from "./components/TitleSearchCenter";
import VirtualArchiveGrid from "./components/VirtualArchiveGrid";

export default function SavesPage() {
  const { t } = useTranslation();
  const { getLevelName } = useLevelName();

  const archives = useArchiveStore((s) => s.archives);
  const loading = useArchiveStore((s) => s.loading);
  const dataLoadComplete = useArchiveStore((s) => s.dataLoadComplete);
  const initializeArchives = useArchiveStore((s) => s.initializeArchives);
  const refreshArchives = useArchiveStore((s) => s.refreshArchives);
  const refreshArchivesSilent = useArchiveStore((s) => s.refreshArchivesSilent);

  const list = useArchiveList(archives);
  const actions = useArchiveActions();
  const foldersView = useArchiveFolders(archives);

  // 网盘行为：搜索 / 筛选时跨全部文件夹；平时按当前目录取存档
  const searching = list.hasActiveFilters;
  const gridArchives = searching ? list.displayArchives : foldersView.scopedArchives;
  const gridFolders = !searching ? foldersView.viewFolders : [];
  const multi = useMultiSelect(gridArchives);

  const [searchOpen, setSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [batchDelete, setBatchDelete] = useState({ open: false, current: 0, total: 0, name: "" });
  const [titlebarSlot, setTitlebarSlot] = useState<HTMLElement | null>(null);
  const [folderDialog, setFolderDialog] = useState<
    { mode: "create"; movePaths?: string[] } | { mode: "rename"; folder: ArchiveFolder } | null
  >(null);
  const [folderConfirm, setFolderConfirm] = useState<
    { kind: "deleteFolder"; folder: ArchiveFolderWithCount; count: number } | { kind: "clearAll" } | null
  >(null);

  // ---- 初始化 ----
  useEffect(() => {
    void initializeArchives();
  }, [initializeArchives]);

  // ---- 撤销快捷键（Ctrl+Z / Ctrl+Shift+Z）----
  useEffect(() => actions.registerUndoShortcuts(), [actions.registerUndoShortcuts]);

  // ---- 标题栏插槽 + Ctrl+K 唤起搜索 ----
  useEffect(() => {
    setTitlebarSlot(document.getElementById("titlebar-center-slot"));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await refreshArchives();
    setIsRefreshing(false);
  }, [isRefreshing, refreshArchives]);

  const handleBatchDelete = useCallback(async () => {
    const targets = [...multi.selectedArchives];
    setBatchDelete({ open: true, current: 0, total: targets.length, name: "" });
    await actions.batchDeleteArchives(targets, {
      onProgress: (current, total, name) => setBatchDelete({ open: true, current, total, name }),
    });
    setBatchDelete((b) => ({ ...b, open: false }));
    multi.deselectAll();
    multi.toggleMultiSelectMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multi.selectedArchives, actions.batchDeleteArchives]);

  const handleToggleVisibility = useCallback(
    (archive: Parameters<typeof actions.handleToggleVisibility>[0]) =>
      void actions.handleToggleVisibility(archive, { onRefresh: refreshArchivesSilent }),
    [actions.handleToggleVisibility, refreshArchivesSilent]
  );

  const menus = useSavesMenus({
    actions,
    isRefreshing,
    onRefresh: () => void handleRefresh(),
    onOpenFolder: () => void actions.openSaveGamesFolder(),
    onCreate: actions.createNewArchive,
    onToggleVisibility: handleToggleVisibility,
    isMultiSelectMode: multi.isMultiSelectMode,
    selectedCount: multi.selectedCount,
    onSelectAll: multi.selectAll,
    onDeselectAll: multi.deselectAll,
    onToggleMultiSelect: multi.toggleMultiSelectMode,
    onBatchDelete: () => void handleBatchDelete(),
    folders: {
      isInFolder: foldersView.isInFolder,
      currentFolder: foldersView.currentFolder,
      hasAssignments: foldersView.hasAssignments,
      folderIdOf: foldersView.folderIdOf,
      folderOptions: foldersView.folderOptions,
      getDescendantIds: foldersView.getDescendantIds,
    },
    organizeCount: foldersView.scopedArchives.length,
    onNewFolder: () => setFolderDialog({ mode: "create" }),
    onRenameFolder: (folder) => setFolderDialog({ mode: "rename", folder }),
    onDeleteFolder: (folder) =>
      setFolderConfirm({
        kind: "deleteFolder",
        folder,
        count: foldersView.getSubtreeArchiveCount(folder.id),
      }),
    onOpenFolderCard: (folder) => foldersView.setCurrentFolder(folder.id),
    onMoveArchives: foldersView.moveArchives,
    onMoveFolder: foldersView.moveFolder,
    onMoveToNewFolder: (paths) => setFolderDialog({ mode: "create", movePaths: paths }),
    onOrganize: foldersView.executeOrganize,
    onClearAll: () => setFolderConfirm({ kind: "clearAll" }),
  });

  // 右键分发：多选模式 → 多选菜单，否则页面菜单（卡片/文件夹菜单由网格拦截，不冒泡到此）
  const handlePageContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (multi.isMultiSelectMode) menus.openMultiSelectMenu(e);
      else menus.openPageMenu(e);
    },
    [multi.isMultiSelectMode, menus]
  );

  const handleCardContextMenu = useCallback(
    (e: React.MouseEvent, archive: Parameters<typeof menus.openCardMenu>[1]) => {
      if (multi.isMultiSelectMode) menus.openMultiSelectMenu(e);
      else menus.openCardMenu(e, archive);
    },
    [multi.isMultiSelectMode, menus]
  );

  const handleFolderContextMenu = useCallback(
    (e: React.MouseEvent, folder: ArchiveFolderWithCount) => menus.openFolderMenu(e, folder),
    [menus]
  );

  const showWelcome = dataLoadComplete && archives.length === 0;
  const gridEmpty = gridArchives.length === 0 && gridFolders.length === 0;
  const showNoMatch = dataLoadComplete && archives.length > 0 && gridEmpty && searching;
  const showFolderEmpty =
    dataLoadComplete && archives.length > 0 && gridEmpty && foldersView.isInFolder;

  return (
    <div className="relative flex h-full flex-col" onContextMenu={handlePageContextMenu}>
      <MultiSelectBar
        visible={multi.isMultiSelectMode}
        selectedCount={multi.selectedCount}
        totalCount={gridArchives.length}
        onExit={multi.toggleMultiSelectMode}
        onSelectAll={multi.selectAll}
        onDeselectAll={multi.deselectAll}
        onBatchDelete={() => void handleBatchDelete()}
      />

      {/* 文件夹面包屑（仅文件夹内且未搜索时，支持多级链路） */}
      {!searching && foldersView.currentFolder && (
        <FolderBreadcrumb
          segments={foldersView.currentPath.map((f) => ({ id: f.id, name: f.name }))}
          count={foldersView.scopedArchives.length}
          onNavigate={(id) => foldersView.setCurrentFolder(id)}
        />
      )}

      {/* 内容区 */}
      <div className="min-h-0 flex-1 overflow-hidden px-5 pb-6 pt-4">
        {loading && archives.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--color-text-muted)]">
            <Spinner size={28} />
            <p className="text-xs">{t("archiveSearch.loadingArchives")}</p>
          </div>
        ) : showWelcome ? (
          <EmptyState
            icon={PackageOpen}
            title={t("archiveSearch.noArchives")}
            description={t("archiveSearch.createNewArchive")}
            actionIcon={SquarePen}
            actionText={t("archiveSearch.createArchive")}
            onAction={actions.createNewArchive}
          />
        ) : showNoMatch ? (
          <EmptyState
            icon={SearchX}
            title={t("archiveSearch.noMatchingArchives")}
            description={t("archiveSearch.adjustSearchOrClearFilters")}
            actionText={t("archiveSearch.clearFilters")}
            onAction={list.resetFilters}
          />
        ) : showFolderEmpty ? (
          <EmptyState
            icon={FolderOpen}
            title={t("organizer.folderEmpty")}
            description={t("organizer.folderEmptyHint")}
          />
        ) : (
          <VirtualArchiveGrid
            archives={gridArchives}
            folders={gridFolders}
            isMultiSelectMode={multi.isMultiSelectMode}
            selectedIds={multi.selectedIds}
            searchQuery={list.searchQuery}
            onFolderOpen={(f) => foldersView.setCurrentFolder(f.id)}
            onFolderContextMenu={handleFolderContextMenu}
            onDropArchiveToFolder={(path, folderId) => foldersView.moveArchives([path], folderId)}
            onDropFolderToFolder={(folderId, targetId) => foldersView.moveFolder(folderId, targetId)}
            isValidFolderDrop={(folderId, targetId) =>
              !foldersView.getDescendantIds(folderId).includes(targetId)
            }
            containerFolderId={foldersView.currentFolderId}
            onToggleVisibility={handleToggleVisibility}
            onEdit={actions.handleEdit}
            onDelete={actions.deleteArchive}
            onSelect={actions.handleEdit}
            onToggleSelect={(a) => multi.toggleSelect(a.id)}
            onCardContextMenu={handleCardContextMenu}
          />
        )}
      </div>

      {/* 右键菜单（页面 / 卡片 / 多选共用一个实例） */}
      <ContextMenu menu={menus.menu} onClose={menus.close} />

      {/* 单个删除确认 */}
      <ConfirmDialog
        open={actions.showDeleteConfirm}
        onConfirm={() => void actions.confirmDelete()}
        onCancel={actions.cancelDelete}
        type="danger"
        title={t("archiveCard.deleteLabel")}
        message={t("confirmModal.deleteArchiveMessage", {
          name: actions.archiveToDelete?.displayName || actions.archiveToDelete?.name || "",
        })}
        description={t("confirmModal.deleteArchiveDescription")}
        confirmText={t("common.delete")}
        loading={actions.isDeleting}
        archiveDetails={
          actions.archiveToDelete
            ? {
                currentLevel: actions.archiveToDelete.currentLevel,
                difficulty: actions.archiveToDelete.archiveDifficulty,
                date: actions.archiveToDelete.date,
              }
            : null
        }
        levelName={getLevelName}
      />

      <BatchDeleteProgress
        open={batchDelete.open}
        current={batchDelete.current}
        total={batchDelete.total}
        name={batchDelete.name}
      />

      {/* 文件夹新建 / 重命名 */}
      <FolderNameDialog
        open={folderDialog !== null}
        mode={folderDialog?.mode ?? "create"}
        selfName={folderDialog?.mode === "rename" ? folderDialog.folder.name : undefined}
        existingNames={foldersView.foldersWithCounts.map((f) => f.name)}
        onClose={() => setFolderDialog(null)}
        onSubmit={(name) => {
          if (!folderDialog) return;
          if (folderDialog.mode === "rename") {
            foldersView.renameFolder(folderDialog.folder.id, name);
          } else {
            const id = foldersView.createFolder(name);
            if (folderDialog.movePaths?.length) {
              foldersView.moveArchives(folderDialog.movePaths, id);
            }
          }
        }}
      />

      {/* 删除文件夹确认 */}
      <ConfirmDialog
        open={folderConfirm?.kind === "deleteFolder"}
        type="danger"
        title={t("organizer.deleteFolder")}
        message={t("organizer.deleteFolderMessage", {
          name: folderConfirm?.kind === "deleteFolder" ? folderConfirm.folder.name : "",
        })}
        description={t("organizer.deleteFolderDescription", {
          count: folderConfirm?.kind === "deleteFolder" ? folderConfirm.count : 0,
        })}
        confirmText={t("common.delete")}
        onCancel={() => setFolderConfirm(null)}
        onConfirm={() => {
          if (folderConfirm?.kind !== "deleteFolder") return;
          foldersView.deleteFolder(folderConfirm.folder.id);
          setFolderConfirm(null);
        }}
      />

      {/* 全部移出文件夹确认 */}
      <ConfirmDialog
        open={folderConfirm?.kind === "clearAll"}
        type="danger"
        title={t("organizer.clearAll")}
        message={t("organizer.clearAllMessage")}
        description={t("organizer.clearAllDescription")}
        confirmText={t("common.confirm")}
        onCancel={() => setFolderConfirm(null)}
        onConfirm={() => {
          foldersView.clearAssignments();
          setFolderConfirm(null);
        }}
      />

      {/* 标题栏搜索中心（portal 注入 TitleBar 插槽，layouts 不引用 features） */}
      {titlebarSlot &&
        createPortal(
          <TitleSearchCenter
            open={searchOpen}
            onOpenChange={setSearchOpen}
            list={list}
            totalCount={archives.length}
          />,
          titlebarSlot
        )}
    </div>
  );
}
