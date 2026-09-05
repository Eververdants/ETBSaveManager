/**
 * 关卡选择器 — 分组胶囊页签 + 跨组搜索 + 图片卡片网格
 * （对应 master LevelPicker；GSAP 按压动画以 CSS scale 替代）
 */
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Search, X } from "lucide-react";

import { LazyImage } from "../ui";
import { EASE } from "../../constants";
import { cn } from "../../utils";

export interface LevelCardItem {
  levelKey: string;
  name: string;
  image: string;
  altName?: string;
  /** 额外搜索文本（跨语言名等） */
  _search?: string;
  /** 主线通用分支关卡徽标 */
  unlockMain?: boolean;
  /** 搜索结果上显示的来源路线 */
  routeLabel?: string;
}

export interface LevelGroup {
  id: string;
  label: string;
  levels: LevelCardItem[];
  /** false 时该组不参与全局搜索 */
  searchable?: boolean;
}

export interface LevelPickerProps {
  groups: LevelGroup[];
  selectedKey: string;
  activeGroup: number;
  onActiveGroupChange: (index: number) => void;
  onSelect: (card: LevelCardItem) => void;
  searchPlaceholder?: string;
  emptyText?: string;
  /** 搜索时主线关卡图片上的徽标文案 */
  badgeText?: string;
  /** 切换分组时清空搜索（创建向导重置；编辑器保留） */
  clearSearchOnGroupChange?: boolean;
}

export default function LevelPicker({
  groups,
  selectedKey,
  activeGroup,
  onActiveGroupChange,
  onSelect,
  searchPlaceholder,
  emptyText,
  badgeText,
  clearSearchOnGroupChange = false,
}: LevelPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchActive = searchQuery.trim() !== "";

  const searchPool = useMemo(
    () =>
      groups
        .filter((g) => g.searchable !== false)
        .flatMap((g, gi) => g.levels.map((c) => ({ ...c, __groupIndex: gi }))),
    [groups]
  );

  const displayList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return searchPool.filter((c) => {
        const hay = (c._search ?? `${c.name ?? ""} ${c.altName ?? ""} ${c.levelKey ?? ""}`).toLowerCase();
        return hay.includes(q);
      });
    }
    const group = groups[activeGroup];
    if (!group) return [];
    return group.levels.map((c) => ({ ...c, __groupIndex: groups.indexOf(group) }));
  }, [searchQuery, searchPool, groups, activeGroup]);

  const handleGroupClick = (index: number) => {
    if (index === activeGroup) return;
    onActiveGroupChange(index);
    if (clearSearchOnGroupChange) setSearchQuery("");
  };

  return (
    <div>
      {/* 分组页签（滑动高亮） */}
      <div className="mb-4 flex justify-center">
        <div className="inline-flex gap-0.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] p-1">
          {groups.map((group, index) => {
            const active = index === activeGroup;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleGroupClick(index)}
                className={cn(
                  "relative rounded-lg px-4 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all duration-150",
                  "active:scale-[0.96]",
                  active
                    ? "text-[var(--color-primary-fg)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="level-picker-pill"
                    className="absolute inset-0 rounded-lg bg-[var(--color-primary)] shadow-sm"
                    transition={{ duration: 0.25, ease: EASE.OUT }}
                  />
                )}
                <span className="relative z-10">{group.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 搜索 */}
      <div className="relative mb-4">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] pl-10 pr-9 text-[13px] text-[var(--color-text-primary)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-ring)]"
        />
        {searchActive && (
          <button
            type="button"
            aria-label="clear"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-bg-muted)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* 卡片网格 */}
      <CardPanel>
        <AnimatePresence mode="wait">
          <motion.div
            key={searchActive ? "search" : `group-${activeGroup}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            /* 退出瞬时完成：切换分组 / 搜索时旧网格立即移除，消除中间停顿 */
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: 0.15, ease: EASE.OUT }}
          >
            {displayList.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4 p-1">
                {displayList.map((card) => {
                  const selected = card.levelKey === selectedKey;
                  return (
                    <button
                      key={`${card.__groupIndex}-${card.levelKey}`}
                      type="button"
                      onClick={() => onSelect(card)}
                      className={cn(
                        "group overflow-hidden rounded-xl border bg-[var(--color-bg-secondary)] text-left",
                        "transition-all duration-200 ease-out",
                        selected
                          ? "border-[var(--color-primary)] shadow-[0_0_0_2px_var(--color-ring),0_8px_20px_var(--color-shadow)]"
                          : "border-[var(--color-border-light)] hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_12px_24px_var(--color-shadow-lg)] active:translate-y-0 active:scale-[0.98]"
                      )}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        <LazyImage
                          src={card.image}
                          alt={card.name}
                          className="h-full w-full [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-110"
                        />
                        {searchActive && card.unlockMain && badgeText && (
                          <span className="absolute bottom-2 left-2 z-[2] rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[var(--color-primary-fg)] shadow-md">
                            {badgeText}
                          </span>
                        )}
                        {selected && (
                          <CheckCircle2
                            size={24}
                            className="absolute right-2.5 top-2.5 z-[2] text-[var(--color-primary-fg)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                            style={{ color: "var(--color-primary)" }}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          "block truncate border-t border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-3.5 py-3 text-center text-[13px] font-semibold transition-colors",
                          selected
                            ? "text-[var(--color-primary)]"
                            : "text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]"
                        )}
                      >
                        {searchActive && card.routeLabel && (
                          <span className="mb-0.5 block text-[10px] font-normal text-[var(--color-text-secondary)]">
                            {card.routeLabel}
                          </span>
                        )}
                        {card.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-[var(--color-text-muted)]">
                <Search size={36} strokeWidth={1.5} className="opacity-35" />
                <span className="text-sm">{emptyText}</span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardPanel>
    </div>
  );
}

/** 内部滚动容器（高度由宿主布局决定） */
function CardPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] p-5">
      {children}
    </div>
  );
}
