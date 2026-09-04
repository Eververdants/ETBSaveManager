/**
 * 存档列表页（master Home → /saves/all）
 *
 * 页面只负责 UI 编排：
 * - 工具栏 → components/SavesToolbar
 * - 多选条 → components/MultiSelectBar
 * - 批量进度 → components/BatchDeleteProgress
 * - 列表状态 → hooks/useArchiveList；动作 → hooks/useArchiveActions
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import { PackageOpen, SearchX, SquarePen } from "lucide-react";

import { ConfirmDialog, EmptyState, Spinner } from "../../components/ui";
import { useArchiveStore } from "../../stores";
import { useArchiveActions } from "./hooks/useArchiveActions";
import { useArchiveList } from "./hooks/useArchiveList";
import { useMultiSelect } from "./hooks/useMultiSelect";
import { useLevelName } from "../../utils/levelUtils";
import BatchDeleteProgress from "./components/BatchDeleteProgress";
import MultiSelectBar from "./components/MultiSelectBar";
import SavesToolbar from "./components/SavesToolbar";
import VirtualArchiveGrid from "./components/VirtualArchiveGrid";
import ArchiveSearchFilter from "./components/ArchiveSearchFilter";

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
  const multi = useMultiSelect(list.displayArchives);

  const [searchOpen, setSearchOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [batchDelete, setBatchDelete] = useState({ open: false, current: 0, total: 0, name: "" });

  // ---- 初始化 ----
  useEffect(() => {
    void initializeArchives();
  }, [initializeArchives]);

  // ---- 撤销快捷键（Ctrl+Z / Ctrl+Shift+Z）----
  useEffect(() => actions.registerUndoShortcuts(), [actions.registerUndoShortcuts]);

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

  const showWelcome = dataLoadComplete && archives.length === 0;
  const showNoMatch = dataLoadComplete && archives.length > 0 && list.displayArchives.length === 0;

  return (
    <div className="relative flex h-full flex-col">
      <SavesToolbar
        count={archives.length}
        searchOpen={searchOpen}
        hasActiveFilters={list.hasActiveFilters}
        isRefreshing={isRefreshing}
        isMultiSelectMode={multi.isMultiSelectMode}
        onToggleSearch={() => setSearchOpen((v) => !v)}
        onRefresh={() => void handleRefresh()}
        onOpenFolder={() => void actions.openSaveGamesFolder()}
        onToggleMultiSelect={multi.toggleMultiSelectMode}
        onCreate={actions.createNewArchive}
      />

      <MultiSelectBar
        visible={multi.isMultiSelectMode}
        selectedCount={multi.selectedCount}
        totalCount={list.displayArchives.length}
        onExit={multi.toggleMultiSelectMode}
        onSelectAll={multi.selectAll}
        onDeselectAll={multi.deselectAll}
        onBatchDelete={() => void handleBatchDelete()}
      />

      {/* 搜索遮罩 */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 bg-[var(--color-bg-overlay)]"
            onClick={() => setSearchOpen(false)}
          />
        )}
      </AnimatePresence>

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
        ) : (
          <VirtualArchiveGrid
            archives={list.displayArchives}
            isMultiSelectMode={multi.isMultiSelectMode}
            selectedIds={multi.selectedIds}
            searchQuery={list.searchQuery}
            onToggleVisibility={(a) =>
              void actions.handleToggleVisibility(a, { onRefresh: refreshArchivesSilent })
            }
            onEdit={actions.handleEdit}
            onDelete={actions.deleteArchive}
            onSelect={actions.handleEdit}
            onToggleSelect={(a) => multi.toggleSelect(a.id)}
          />
        )}
      </div>

      {/* 搜索筛选面板（浮于内容上方） */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
        <div className="pointer-events-auto">
          <ArchiveSearchFilter
            visible={searchOpen}
            onClose={() => setSearchOpen(false)}
            searchQuery={list.searchQuery}
            onSearchQueryChange={list.setSearchQuery}
            archiveDifficulty={list.archiveDifficulty}
            onArchiveDifficultyChange={list.setArchiveDifficulty}
            actualDifficulty={list.actualDifficulty}
            onActualDifficultyChange={list.setActualDifficulty}
            visibility={list.visibility}
            onVisibilityChange={list.setVisibility}
            suggestions={list.searchSuggestions}
            totalCount={archives.length}
            filteredCount={list.displayArchives.length}
            onResetFilters={list.resetFilters}
            onCommit={() => setSearchOpen(false)}
          />
        </div>
      </div>

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
    </div>
  );
}
