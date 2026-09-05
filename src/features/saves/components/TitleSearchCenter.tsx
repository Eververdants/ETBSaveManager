/**
 * 标题栏搜索中心 — VSCode Command Center 风格
 *
 * 由 SavesPage 通过 portal 注入 TitleBar 的 #titlebar-center-slot
 * （layouts 不可引用 features，状态保留在 SavesPage 的 React 树内）。
 * 常态为搜索 pill；点击展开 quick-input 面板：实时搜索 + 建议 / 历史 + 筛选条件，
 * 下方存档列表同步过滤，无全屏遮罩。
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Check, Clock, Search, X } from "lucide-react";

import { FEATURES, DIFFICULTY_LEVELS } from "../../../constants";
import { useClickOutside } from "../../../hooks";
import { cn } from "../../../utils";
import { addSearchHistory, clearSearchHistory, getSearchHistory, useArchiveList } from "../hooks/useArchiveList";

type ArchiveList = ReturnType<typeof useArchiveList>;

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "archiveCard.easy",
  normal: "archiveCard.normal",
  hard: "archiveCard.hard",
  nightmare: "archiveCard.nightmare",
};

export interface TitleSearchCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: ArchiveList;
  totalCount: number;
}

export default function TitleSearchCenter({
  open,
  onOpenChange,
  list,
  totalCount,
}: TitleSearchCenterProps) {
  const { t } = useTranslation();
  const rootRef = useClickOutside<HTMLDivElement>(() => {
    if (open) onOpenChange(false);
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setHistory(getSearchHistory());
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const activeFilterCount =
    [list.archiveDifficulty, list.actualDifficulty, list.visibility].filter(Boolean).length +
    (list.searchQuery ? 1 : 0);
  const filteredCount = list.displayArchives.length;

  const commit = (query: string) => {
    addSearchHistory(query);
    onOpenChange(false);
  };

  const choose = (query: string) => {
    list.setSearchQuery(query);
    commit(query);
  };

  const renderOptionRow = (
    label: string,
    selected: boolean,
    onSelect: () => void
  ) => (
    <button
      key={label}
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] transition-colors duration-100",
        selected
          ? "bg-[var(--color-primary-subtle)] font-medium text-[var(--color-primary)]"
          : "text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]"
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected && <Check size={13} className="shrink-0" />}
    </button>
  );

  const renderGroupLabel = (label: string) => (
    <p className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
      {label}
    </p>
  );

  return (
    <div ref={rootRef} className="relative">
      {/* 搜索 pill（常态） */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={cn(
          "flex h-[26px] items-center gap-1.5 rounded-md border px-2.5 text-[12px] transition-all duration-150",
          "border-[var(--color-shell-divider)] bg-[var(--color-shell-item-hover)]",
          "text-[var(--color-shell-text-muted)] hover:text-[var(--color-shell-text-active)]",
          open && "border-[var(--color-primary)]/50 text-[var(--color-shell-text-active)]"
        )}
      >
        <Search size={12} className="shrink-0" />
        <span className="max-w-[220px] truncate">
          {list.searchQuery || t("archiveSearch.title")}
        </span>
        {activeFilterCount > 0 && (
          <span className="flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[var(--color-primary-subtle)] px-1 text-[10px] font-semibold tabular-nums text-[var(--color-primary)]">
            {activeFilterCount}
          </span>
        )}
        <span className="ml-1 rounded border border-[var(--color-shell-divider)] px-1 text-[10px] leading-[14px] text-[var(--color-shell-text-muted)]">
          Ctrl K
        </span>
      </button>

      {/* quick-input 面板 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            className={cn(
              "absolute left-1/2 top-[calc(100%+6px)] z-[105] w-[560px] max-w-[calc(100vw-16px)] -translate-x-1/2",
              "overflow-hidden rounded-xl border border-[var(--color-border-light)]",
              "bg-[var(--color-bg-elevated)] shadow-[0_16px_48px_var(--color-shadow-lg)]"
            )}
          >
            {/* 输入行 */}
            <div className="flex h-10 items-center gap-2 border-b border-[var(--color-border-light)] px-3">
              <Search size={15} className="shrink-0 text-[var(--color-text-muted)]" />
              <input
                ref={inputRef}
                type="text"
                value={list.searchQuery}
                onChange={(e) => list.setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit(list.searchQuery);
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    onOpenChange(false);
                  }
                }}
                placeholder={t("archiveSearch.searchPlaceholder")}
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
              />
              {list.searchQuery && (
                <button
                  type="button"
                  aria-label={t("common.close")}
                  onClick={() => list.setSearchQuery("")}
                  className="rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* 建议 / 历史 / 筛选 */}
            <div className="max-h-[400px] overflow-y-auto p-1.5">
              {!list.searchQuery && list.searchSuggestions.length > 0 && (
                <>
                  {renderGroupLabel(t("archiveSearch.suggestions"))}
                  {list.searchSuggestions.map((s) => {
                    const label = s.displayName || s.name;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => choose(label)}
                        className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] text-[var(--color-text-primary)] transition-colors duration-100 hover:bg-[var(--color-bg-muted)]"
                      >
                        <Search size={12} className="shrink-0 opacity-50" />
                        <span className="min-w-0 flex-1 truncate">{label}</span>
                      </button>
                    );
                  })}
                </>
              )}

              {!list.searchQuery && history.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-2.5 pb-1 pt-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {t("archiveSearch.searchHistory")}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        clearSearchHistory();
                        setHistory([]);
                      }}
                      className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                    >
                      {t("archiveSearch.clearHistory")}
                    </button>
                  </div>
                  {history.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => choose(h)}
                      className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] text-[var(--color-text-secondary)] transition-colors duration-100 hover:bg-[var(--color-bg-muted)]"
                    >
                      <Clock size={12} className="shrink-0 opacity-50" />
                      <span className="min-w-0 flex-1 truncate">{h}</span>
                    </button>
                  ))}
                </>
              )}

              {renderGroupLabel(t("archiveSearch.archiveDifficulty"))}
              {renderOptionRow(t("archiveSearch.allDifficulties"), !list.archiveDifficulty, () =>
                list.setArchiveDifficulty("")
              )}
              {DIFFICULTY_LEVELS.map((d) =>
                renderOptionRow(t(DIFFICULTY_LABELS[d] ?? d), list.archiveDifficulty === d, () =>
                  list.setArchiveDifficulty(list.archiveDifficulty === d ? "" : d)
                )
              )}

              {!FEATURES.MERGE_DIFFICULTY && (
                <>
                  {renderGroupLabel(t("archiveSearch.actualDifficulty"))}
                  {renderOptionRow(
                    t("archiveSearch.allDifficulties"),
                    !list.actualDifficulty,
                    () => list.setActualDifficulty("")
                  )}
                  {DIFFICULTY_LEVELS.map((d) =>
                    renderOptionRow(
                      t(DIFFICULTY_LABELS[d] ?? d),
                      list.actualDifficulty === d,
                      () => list.setActualDifficulty(list.actualDifficulty === d ? "" : d)
                    )
                  )}
                </>
              )}

              {renderGroupLabel(t("archiveSearch.visibility"))}
              {renderOptionRow(t("archiveSearch.allVisibilities"), !list.visibility, () =>
                list.setVisibility("")
              )}
              {renderOptionRow(t("archiveSearch.visible"), list.visibility === "visible", () =>
                list.setVisibility(list.visibility === "visible" ? "" : "visible")
              )}
              {renderOptionRow(t("archiveSearch.hidden"), list.visibility === "hidden", () =>
                list.setVisibility(list.visibility === "hidden" ? "" : "hidden")
              )}
            </div>

            {/* 底部：计数 + 清除筛选 */}
            <div className="flex items-center justify-between border-t border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-3 py-2">
              <span className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
                {t("archiveSearch.found", { count: filteredCount, total: totalCount })}
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => list.resetFilters()}
                  className="rounded px-2 py-0.5 text-[11px] font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
                >
                  {t("archiveSearch.clearFilters")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
