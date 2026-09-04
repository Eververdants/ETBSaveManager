/**
 * 存档列表页工具栏 — 标题 / 计数 / 搜索 / 刷新 / 打开文件夹 / 多选 / 新建
 */
import { useTranslation } from "react-i18next";
import { CheckSquare, FolderOpen, RefreshCw, Search, SquarePen } from "lucide-react";

import { Button, IconButton } from "../../../components/ui";

export interface SavesToolbarProps {
  count: number;
  searchOpen: boolean;
  hasActiveFilters: boolean;
  isRefreshing: boolean;
  isMultiSelectMode: boolean;
  onToggleSearch: () => void;
  onRefresh: () => void;
  onOpenFolder: () => void;
  onToggleMultiSelect: () => void;
  onCreate: () => void;
}

export default function SavesToolbar({
  count,
  searchOpen,
  hasActiveFilters,
  isRefreshing,
  isMultiSelectMode,
  onToggleSearch,
  onRefresh,
  onOpenFolder,
  onToggleMultiSelect,
  onCreate,
}: SavesToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-2.5">
      <h1 className="mr-2 text-sm font-semibold text-[var(--color-text-primary)]">
        {t("nav.saves-all")}
      </h1>
      <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--color-text-secondary)]">
        {count}
      </span>

      <div className="ml-auto flex items-center gap-1">
        <IconButton
          label={t("archiveSearch.title")}
          onClick={onToggleSearch}
          active={searchOpen || hasActiveFilters}
        >
          <Search />
        </IconButton>
        <IconButton label={t("common.refreshList")} onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={isRefreshing ? "animate-spin" : undefined} />
        </IconButton>
        <IconButton label={t("common.openFolder")} onClick={onOpenFolder}>
          <FolderOpen />
        </IconButton>
        <IconButton
          label={t("common.multiSelectDelete")}
          onClick={onToggleMultiSelect}
          active={isMultiSelectMode}
        >
          <CheckSquare />
        </IconButton>
        <Button
          variant="primary"
          size="sm"
          className="ml-1"
          icon={<SquarePen size={13} />}
          onClick={onCreate}
        >
          {t("archiveSearch.createArchive")}
        </Button>
      </div>
    </div>
  );
}
