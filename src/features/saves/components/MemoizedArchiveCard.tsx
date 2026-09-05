/**
 * MemoizedArchiveCard — 极致优化的存档卡片 v2
 *
 * 优化：
 * 1. React.memo 避免不必要重渲染
 * 2. 移除 motion 动画，使用纯 CSS transition
 * 3. 使用 CSS contain 隔离渲染
 * 4. 图片预加载由父组件处理
 *
 * 高度契约（虚拟网格依赖，改动前先看 virtualGridLayout.ts）：
 * 根节点 h-full 填满定位容器的显式高度；图片区 flex-1 吸收剩余高度
 * （不再使用固定宽高比），信息区 shrink-0 保证文本完整。布局侧按
 * "图片区宽高比 × 卡宽 + 固定内容高度" 计算同一高度，间距因此精确。
 */
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  EyeOff,
  Eye,
  SquarePen,
  Trash2,
  CheckCircle2,
  Circle,
  MapPin,
  Clock,
  Shield,
  Zap,
  Flame,
  Skull,
} from "lucide-react";

import { LazyImage } from "../../../components/ui";
import { getLevelImage, useLevelName } from "../../../utils/levelUtils";
import type { ArchiveData } from "../../../types";
import { cn } from "../../../utils";

export interface MemoizedArchiveCardProps {
  archive: ArchiveData;
  isMultiSelectMode: boolean;
  isSelected: boolean;
  searchQuery?: string;
  onToggleVisibility: (archive: ArchiveData) => void;
  onEdit: (archive: ArchiveData) => void;
  onDelete: (archive: ArchiveData) => void;
  onSelect: (archive: ArchiveData) => void;
  onToggleSelect: (archive: ArchiveData) => void;
}

const DIFFICULTY_I18N: Record<string, string> = {
  easy: "archiveCard.easy",
  normal: "archiveCard.normal",
  hard: "archiveCard.hard",
  nightmare: "archiveCard.nightmare",
};

const DIFFICULTY_CONFIG: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
  text: string;
  border: string;
}> = {
  easy: { icon: Shield, bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500/25" },
  normal: { icon: Zap, bg: "bg-[var(--color-primary-subtle)]", text: "text-[var(--color-primary)]", border: "border-[var(--color-primary)]/25" },
  hard: { icon: Flame, bg: "bg-[var(--color-danger-subtle)]", text: "text-[var(--color-danger)]", border: "border-[var(--color-danger)]/25" },
  nightmare: { icon: Skull, bg: "bg-purple-500/10 dark:bg-purple-500/20", text: "text-purple-700 dark:text-purple-300", border: "border-purple-500/25" },
};

const MemoizedArchiveCard = memo(function MemoizedArchiveCard({
  archive,
  isMultiSelectMode,
  isSelected,
  searchQuery,
  onToggleVisibility,
  onEdit,
  onDelete,
  onSelect,
  onToggleSelect,
}: MemoizedArchiveCardProps) {
  const { t } = useTranslation();
  const { getLevelName } = useLevelName();

  const displayName = archive.displayName || archive.name;
  const hidden = !archive.isVisible;
  const diffConfig = DIFFICULTY_CONFIG[archive.archiveDifficulty] ?? DIFFICULTY_CONFIG.normal;
  const DiffIcon = diffConfig.icon;

  const handleClick = useCallback(() => {
    if (isMultiSelectMode) onToggleSelect(archive);
    else onSelect(archive);
  }, [isMultiSelectMode, onToggleSelect, onSelect, archive]);

  const handleToggleVisibility = useCallback(() => onToggleVisibility(archive), [onToggleVisibility, archive]);
  const handleEdit = useCallback(() => onEdit(archive), [onEdit, archive]);
  const handleDelete = useCallback(() => onDelete(archive), [onDelete, archive]);

  // 搜索高亮
  const highlightedName = searchQuery && displayName ? (() => {
    const idx = displayName.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return displayName;
    return (
      <>
        {displayName.slice(0, idx)}
        <mark className="rounded-[3px] bg-[var(--color-primary-subtle)] px-0.5 font-semibold text-[var(--color-primary)]">
          {displayName.slice(idx, idx + searchQuery.length)}
        </mark>
        {displayName.slice(idx + searchQuery.length)}
      </>
    );
  })() : displayName;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      style={{ contain: "layout style paint" }}
      className={cn(
        "group relative flex h-full flex-col p-3 rounded-[16px] text-left cursor-pointer select-none",
        "border bg-[var(--color-bg-elevated)] shadow-[0_1px_3px_var(--color-shadow)]",
        "transition-[transform,box-shadow,border-color,background-color,opacity] duration-150 ease-out",
        "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[0_12px_32px_-8px_var(--color-shadow-lg)]",
        "active:scale-[0.98]",
        isSelected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/70 ring-2 ring-[var(--color-ring)]"
          : "border-[var(--color-border-light)]",
        hidden && "opacity-60 hover:opacity-100"
      )}
    >
      {/* 图片区域：flex-1 填满剩余高度，宽度变化时高度随之微调 */}
      <div className="relative w-full min-h-0 flex-1 overflow-hidden rounded-[10px] bg-[var(--color-bg-muted)] border border-[var(--color-border-light)]/80">
        <LazyImage
          src={getLevelImage(archive.currentLevel || "Level0")}
          alt={archive.name}
          className={cn(
            "h-full w-full object-cover",
            "[&_img]:transition-[transform,filter] [&_img]:duration-200",
            "group-hover:[&_img]:scale-[1.04]",
            hidden && "[&_img]:grayscale-[45%]"
          )}
        />
        
        {/* 顶部渐变 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-11 bg-gradient-to-b from-black/35 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

        {/* 多选勾选框 */}
        {isMultiSelectMode && (
          <div className="absolute left-2 top-2 z-10 rounded-[6px] bg-black/45 p-1 backdrop-blur-md">
            {isSelected ? (
              <CheckCircle2 size={16} className="text-[var(--color-primary)] fill-white dark:fill-black" />
            ) : (
              <Circle size={16} className="text-white/80" />
            )}
          </div>
        )}

        {/* 隐藏角标 */}
        <div
          className={cn(
            "absolute left-0 top-0 z-10 inline-flex items-center gap-1 rounded-tl-[10px] rounded-br-[8px]",
            "bg-slate-900/80 dark:bg-slate-800/85 px-2 py-0.5 text-[10px] font-medium text-slate-200",
            "backdrop-blur-md border-r border-b border-white/15",
            "transition-[transform,opacity] duration-150",
            hidden ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
          )}
        >
          <EyeOff size={10} className="text-slate-300" />
          <span>{t("archiveCard.hidden")}</span>
        </div>

        {/* 浮动操作条 */}
        {!isMultiSelectMode && (
          <div className="absolute right-0 top-0 z-10 opacity-0 -translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-150">
            <div className="flex items-center gap-0.5 rounded-tr-[10px] rounded-bl-[8px] bg-neutral-950/80 p-1 backdrop-blur-md border-l border-b border-white/15">
              <button
                type="button"
                aria-label={t("archiveCard.editLabel")}
                title={t("archiveCard.editLabel")}
                onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                className="flex h-6 w-6 items-center justify-center rounded-[6px] text-white/85 hover:bg-white/20 hover:text-white transition-colors"
              >
                <SquarePen size={12} />
              </button>
              <button
                type="button"
                aria-label={hidden ? t("archiveCard.showLabel") : t("archiveCard.hideLabel")}
                title={hidden ? t("archiveCard.showLabel") : t("archiveCard.hideLabel")}
                onClick={(e) => { e.stopPropagation(); handleToggleVisibility(); }}
                className="flex h-6 w-6 items-center justify-center rounded-[6px] text-white/85 hover:bg-white/20 hover:text-white transition-colors"
              >
                {hidden ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
              <div className="mx-0.5 h-3 w-px bg-white/20" />
              <button
                type="button"
                aria-label={t("archiveCard.deleteLabel")}
                title={t("archiveCard.deleteLabel")}
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="flex h-6 w-6 items-center justify-center rounded-[6px] text-white/85 hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 信息区：shrink-0 保证文本行完整，高度计入 CARD_FIXED_CONTENT_HEIGHT */}
      <div className="flex shrink-0 flex-col gap-2.5 px-0.5 pt-3 pb-0.5">
        {/* 标题 + 难度 */}
        <div className="flex items-center justify-between gap-2.5">
          <p
            className={cn(
              "line-clamp-1 text-[13.5px] font-semibold tracking-[-0.01em]",
              archive.isVisible ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
            )}
            title={displayName}
          >
            {highlightedName}
          </p>
          <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-[6px] py-0.5 px-2 border", diffConfig.bg, diffConfig.text, diffConfig.border)}>
            <DiffIcon size={11} className="shrink-0 opacity-80" />
            <span className="text-[10px] font-medium tracking-wide">
              {t(DIFFICULTY_I18N[archive.archiveDifficulty] ?? "archiveCard.normal")}
            </span>
          </span>
        </div>

        {/* 属性栏 */}
        <div className="flex items-center justify-between text-[11.5px] text-[var(--color-text-muted)] pt-0.5">
          <div className="flex min-w-0 items-center gap-1.5 truncate pr-2" title={getLevelName(archive.currentLevel)}>
            <MapPin size={12} className="shrink-0 text-[var(--color-primary)] opacity-85" />
            <span className="truncate font-medium">{getLevelName(archive.currentLevel)}</span>
          </div>
          {archive.date && (
            <div className="flex shrink-0 items-center gap-1 text-[10.5px] tabular-nums opacity-75">
              <Clock size={11} className="shrink-0 opacity-70" />
              <span>{archive.date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MemoizedArchiveCard.displayName = "MemoizedArchiveCard";

export default MemoizedArchiveCard;
