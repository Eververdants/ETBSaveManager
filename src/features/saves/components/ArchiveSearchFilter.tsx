/**
 * 搜索筛选面板 — 全屏覆盖层：搜索框（建议 + 历史）+ 难度 / 可见性筛选
 * （对应 master ArchiveSearchFilter）
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Clock, Search, X } from "lucide-react";

import { FEATURES, DIFFICULTY_LEVELS } from "../../../constants";
import type { ArchiveData } from "../../../types";
import { addSearchHistory, clearSearchHistory, getSearchHistory } from "../hooks/useArchiveList";
import { cn } from "../../../utils";

export interface ArchiveSearchFilterProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  archiveDifficulty: string;
  onArchiveDifficultyChange: (value: string) => void;
  actualDifficulty: string;
  onActualDifficultyChange: (value: string) => void;
  visibility: string;
  onVisibilityChange: (value: string) => void;
  suggestions: ArchiveData[];
  totalCount: number;
  /** 当前过滤后数量（found 计数用） */
  filteredCount: number;
  onResetFilters: () => void;
  /** 提交搜索（Enter）：记录历史并关闭 */
  onCommit: () => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "archiveCard.easy",
  normal: "archiveCard.normal",
  hard: "archiveCard.hard",
  nightmare: "archiveCard.nightmare",
};

export default function ArchiveSearchFilter({
  visible,
  onClose,
  searchQuery,
  onSearchQueryChange,
  archiveDifficulty,
  onArchiveDifficultyChange,
  actualDifficulty,
  onActualDifficultyChange,
  visibility,
  onVisibilityChange,
  suggestions,
  totalCount,
  filteredCount,
  onResetFilters,
  onCommit,
}: ArchiveSearchFilterProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (visible) {
      setHistory(getSearchHistory());
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [visible]);

  const activeFilterCount = [archiveDifficulty, actualDifficulty, visibility].filter(Boolean).length;

  const suggestionLabels = useMemo(
    () => suggestions.map((s) => s.displayName || s.name),
    [suggestions]
  );

  const commit = (query: string) => {
    addSearchHistory(query);
    setHistory(getSearchHistory());
    onCommit();
  };

  const renderDropdown = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: Array<{ value: string; label: string }>
  ) => (
    <div className="relative min-w-[150px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-8 w-full cursor-pointer appearance-none rounded-lg border bg-[var(--color-bg-secondary)] pl-3 pr-7 text-xs outline-none transition-all",
          value
            ? "border-[var(--color-primary)] font-medium text-[var(--color-primary)]"
            : "border-[var(--color-border-default)] text-[var(--color-text-secondary)]"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
      />
      <span className="sr-only">{label}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          className="absolute inset-x-0 top-0 z-30 border-b border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] px-6 py-4 shadow-[0_8px_24px_var(--color-shadow-lg)]"
        >
          {/* 搜索框 */}
          <div className="relative mx-auto max-w-2xl">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onFocus={() => setShowHistory(true)}
              onBlur={() => setTimeout(() => setShowHistory(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit(searchQuery);
                if (e.key === "Escape") onClose();
              }}
              placeholder={t("archiveSearch.searchPlaceholder")}
              className="h-10 w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-10 pr-10 text-sm outline-none transition-all focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-ring)]"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label={t("common.close")}
                onClick={() => onSearchQueryChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X size={14} />
              </button>
            )}

            {/* 历史 + 建议 */}
            {showHistory && (history.length > 0 || suggestionLabels.length > 0) && (
              <div className="absolute inset-x-0 top-full z-10 mt-1.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] p-2 shadow-[0_8px_24px_var(--color-shadow-lg)]">
                {suggestionLabels.length > 0 && (
                  <>
                    <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                      {t("archiveSearch.suggestions")}
                    </p>
                    {suggestionLabels.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onMouseDown={() => {
                          onSearchQueryChange(label);
                          commit(label);
                        }}
                        className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-muted)]"
                      >
                        <Search size={12} className="mr-2 inline opacity-50" />
                        {label}
                      </button>
                    ))}
                  </>
                )}
                {history.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-2 pb-1 pt-1.5">
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
                        onMouseDown={() => {
                          onSearchQueryChange(h);
                          commit(h);
                        }}
                        className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)]"
                      >
                        <Clock size={12} className="mr-2 inline opacity-50" />
                        {h}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* 筛选行 */}
          <div className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-2.5">
            {renderDropdown(
              t("archiveSearch.archiveDifficulty"),
              archiveDifficulty,
              onArchiveDifficultyChange,
              [
                { value: "", label: t("archiveSearch.allDifficulties") },
                ...DIFFICULTY_LEVELS.map((d) => ({
                  value: d,
                  label: t(DIFFICULTY_LABELS[d] ?? d),
                })),
              ]
            )}
            {!FEATURES.MERGE_DIFFICULTY &&
              renderDropdown(
                t("archiveSearch.actualDifficulty"),
                actualDifficulty,
                onActualDifficultyChange,
                [
                  { value: "", label: t("archiveSearch.allDifficulties") },
                  ...DIFFICULTY_LEVELS.map((d) => ({
                    value: d,
                    label: t(DIFFICULTY_LABELS[d] ?? d),
                  })),
                ]
              )}
            {renderDropdown(t("archiveSearch.visibility"), visibility, onVisibilityChange, [
              { value: "", label: t("archiveSearch.allVisibilities") },
              { value: "visible", label: t("archiveSearch.visible") },
              { value: "hidden", label: t("archiveSearch.hidden") },
            ])}

            <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
              {t("archiveSearch.found", { count: filteredCount, total: totalCount })}
            </span>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)]"
              >
                {t("archiveSearch.clearFilters")} ({activeFilterCount})
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
