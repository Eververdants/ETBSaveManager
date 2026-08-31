/**
 * 存档列表页（master Home → /saves/all）
 *
 * 工具栏（搜索 / 刷新 / 打开文件夹 / 多选）+ 卡片网格 +
 * 搜索覆盖层 + 单个/批量删除确认 + 批量进度。
 * FAB（滚轮切换）改为固定工具栏按钮，贴合 v4 轻专业风格。
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  CheckSquare,
  FolderOpen,
  PackageOpen,
  RefreshCw,
  SearchX,
  Search,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";

import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  ProgressBar,
  Spinner,
} from "../../components/ui";
import { useArchiveStore } from "../../stores";
import { useArchiveActions } from "./hooks/useArchiveActions";
import { useArchiveList } from "./hooks/useArchiveList";
import { useMultiSelect } from "./hooks/useMultiSelect";
import { useLevelName } from "../../utils/levelUtils";
// ArchiveData 类型通过 VirtualArchiveGrid 间接使用
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
  const [batchDelete, setBatchDelete] = useState<{ open: boolean; current: number; total: number; name: string }>({
    open: false,
    current: 0,
    total: 0,
    name: "",
  });

  // ---- 初始化 ----
  useEffect(() => {
    void initializeArchives();
  }, [initializeArchives]);

  // ---- 撤销快捷键（Ctrl+Z / Ctrl+Shift+Z）----
  useEffect(() => actions.registerUndoShortcuts(), [actions.registerUndoShortcuts]);

  // ---- 多选模式时屏蔽卡片 hover 操作 ----
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
      {/* 工具栏 */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-2.5">
        <h1 className="mr-2 text-sm font-semibold text-[var(--color-text-primary)]">
          {t("nav.saves-all")}
        </h1>
        <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--color-text-secondary)]">
          {archives.length}
        </span>

        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label={t("archiveSearch.title")}
            onClick={() => setSearchOpen((v) => !v)}
            active={searchOpen || list.hasActiveFilters}
          >
            <Search />
          </IconButton>
          <IconButton label={t("common.refreshList")} onClick={() => void handleRefresh()} disabled={isRefreshing}>
            <RefreshCw className={isRefreshing ? "animate-spin" : undefined} />
          </IconButton>
          <IconButton label={t("common.openFolder")} onClick={() => void actions.openSaveGamesFolder()}>
            <FolderOpen />
          </IconButton>
          <IconButton
            label={t("common.multiSelectDelete")}
            onClick={multi.toggleMultiSelectMode}
            active={multi.isMultiSelectMode}
          >
            <CheckSquare />
          </IconButton>
          <Button
            variant="primary"
            size="sm"
            className="ml-1"
            icon={<SquarePen size={13} />}
            onClick={actions.createNewArchive}
          >
            {t("archiveSearch.createArchive")}
          </Button>
        </div>
      </div>

      {/* 多选工具条 */}
      <AnimatePresence>
        {multi.isMultiSelectMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="shrink-0 overflow-hidden border-b border-[var(--color-border-light)] bg-[var(--color-primary-subtle)]"
          >
            <div className="flex items-center gap-2 px-5 py-2">
              <Button size="sm" variant="ghost" icon={<X size={13} />} onClick={multi.toggleMultiSelectMode}>
                {t("archiveSearch.multiSelect.exit")}
              </Button>
              <Button size="sm" variant="ghost" onClick={multi.selectAll}>
                {t("archiveSearch.multiSelect.selectAll")}
              </Button>
              <Button size="sm" variant="ghost" onClick={multi.deselectAll}>
                {t("archiveSearch.multiSelect.deselectAll")}
              </Button>
              <span className="ml-2 text-xs tabular-nums text-[var(--color-text-secondary)]">
                {t("archiveSearch.multiSelect.selected", {
                  count: multi.selectedCount,
                  total: list.displayArchives.length,
                })}
              </span>
              <Button
                size="sm"
                variant="danger"
                className="ml-auto"
                icon={<Trash2 size={13} />}
                disabled={multi.selectedCount === 0}
                onClick={() => void handleBatchDelete()}
              >
                {t("archiveSearch.multiSelect.batchDelete")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 搜索覆盖层 */}
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

      {/* 批量删除进度 */}
      <AnimatePresence>
        {batchDelete.open && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="pointer-events-none fixed inset-x-0 bottom-10 z-[120] flex justify-center"
          >
            <div className="pointer-events-auto w-[320px] rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] p-4 shadow-[0_12px_32px_var(--color-shadow-lg)]">
              <p className="mb-2 truncate text-xs text-[var(--color-text-secondary)]">
                {batchDelete.name} · {batchDelete.current}/{batchDelete.total}
              </p>
              <ProgressBar
                value={batchDelete.total ? (batchDelete.current / batchDelete.total) * 100 : 0}
                tone="danger"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
