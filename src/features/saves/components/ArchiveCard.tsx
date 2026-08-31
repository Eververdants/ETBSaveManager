/**
 * 存档卡片 — WinUI 3 现代同心圆（Concentric Radii / Nested Curvature）设计
 *
 * 核心设计原则 (Concentric Radii Formula: R_inner = R_outer - Padding):
 * 1. 外卡片容器：`p-2.5` (10px padding)，外圆角 `rounded-[16px]` (16px)。
 * 2. 内缩略图媒体槽：内圆角 `rounded-[8px]` (16px - 10px = 6px~8px 同心曲率对齐)，带来极致和谐的嵌套平滑感。
 * 3. 内部元素同心递减：
 *    - 浮动命令栏胶囊：`p-1 rounded-[10px]`，内按钮 `rounded-[6px]` (10px - 4px = 6px)。
 *    - 难度徽章与状态灯：微圆角嵌套同心小圆。
 * 4. Windows 资源管理器原生质感：
 *    - 隐藏文件拟态、高精度微边框、呼吸感 hover 动效。
 */
import React from "react";
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
} from "lucide-react";

import { LazyImage } from "../../../components/ui";
import { getLevelImage, useLevelName } from "../../../utils/levelUtils";
import type { ArchiveData } from "../../../types";
import { cn } from "../../../utils";

export interface ArchiveCardProps {
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

/** 搜索高亮 */
function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-[3px] bg-[var(--color-primary-subtle)] px-0.5 font-semibold text-[var(--color-primary)]">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const DIFFICULTY_I18N: Record<string, string> = {
  easy: "archiveCard.easy",
  normal: "archiveCard.normal",
  hard: "archiveCard.hard",
  nightmare: "archiveCard.nightmare",
};

/** WinUI 难度样式：同心微胶囊 + 发光点 */
const DIFFICULTY_CONFIG: Record<
  string,
  { dot: string; bg: string; text: string; border: string }
> = {
  easy: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/20",
  },
  normal: {
    dot: "bg-[var(--color-primary)]",
    bg: "bg-[var(--color-primary-subtle)]",
    text: "text-[var(--color-primary)]",
    border: "border-[var(--color-primary)]/20",
  },
  hard: {
    dot: "bg-[var(--color-danger)]",
    bg: "bg-[var(--color-danger-subtle)]",
    text: "text-[var(--color-danger)]",
    border: "border-[var(--color-danger)]/20",
  },
  nightmare: {
    dot: "bg-purple-500",
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/25",
  },
};

export default function ArchiveCard({
  archive,
  isMultiSelectMode,
  isSelected,
  searchQuery,
  onToggleVisibility,
  onEdit,
  onDelete,
  onSelect,
  onToggleSelect,
}: ArchiveCardProps) {
  const { t } = useTranslation();
  const { getLevelName } = useLevelName();

  const displayName = archive.displayName || archive.name;
  const hidden = !archive.isVisible;
  const diffConfig =
    DIFFICULTY_CONFIG[archive.archiveDifficulty] ?? DIFFICULTY_CONFIG.normal;

  const handleClick = () => {
    if (isMultiSelectMode) onToggleSelect(archive);
    else onSelect(archive);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      // 外层容器：Padding 10px (p-2.5)，外圆角 16px (rounded-[16px])
      className={cn(
        "group relative flex flex-col p-2.5 rounded-[16px] text-left cursor-pointer select-none",
        "border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "bg-[var(--color-bg-elevated)] shadow-[0_1px_3px_var(--color-shadow)]",
        "hover:shadow-[0_10px_28px_-6px_var(--color-shadow-lg)] hover:-translate-y-1 hover:border-[var(--color-border-strong)]",
        isSelected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/70 ring-2 ring-[var(--color-ring)]"
          : "border-[var(--color-border-light)]",
        hidden && "opacity-60 hover:opacity-100"
      )}
    >
      {/* 缩略图容器：同心圆角 8px (16px - 10px = 6~8px)，内外曲率完全同心 */}
      <div className="relative aspect-[16/9.5] w-full overflow-hidden rounded-[8px] bg-[var(--color-bg-muted)] border border-[var(--color-border-light)]/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
        <LazyImage
          src={getLevelImage(archive.currentLevel || "Level0")}
          alt={archive.name}
          className={cn(
            "h-full w-full object-cover [&_img]:transition-transform [&_img]:duration-500 [&_img]:ease-out group-hover:[&_img]:scale-[1.04]",
            hidden && "[&_img]:grayscale-[45%]"
          )}
        />

        {/* 顶部微光渐变层 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-11 bg-gradient-to-b from-black/35 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        {/* 多选勾选框 (Win11 样式) */}
        {isMultiSelectMode && (
          <div className="absolute left-2 top-2 z-10 rounded-[6px] bg-black/45 p-1 backdrop-blur-md transition-transform active:scale-90">
            {isSelected ? (
              <CheckCircle2 size={16} className="text-[var(--color-primary)] fill-white dark:fill-black" />
            ) : (
              <Circle size={16} className="text-white/80 hover:text-white" />
            )}
          </div>
        )}

        {/* 隐藏项目角标 (Windows 拟态) */}
        {hidden && (
          <div className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-[6px] bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white/90 shadow-sm backdrop-blur-md border border-white/10">
            <EyeOff size={10} className="text-white/80" />
            <span>{t("archiveCard.hidden")}</span>
          </div>
        )}

        {/* 浮动操作胶囊条：同心微圆角 (外壳 10px / 内按钮 6px) */}
        {!isMultiSelectMode && (
          <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1 opacity-0 -translate-y-1 scale-90 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100">
            <div className="flex items-center gap-0.5 rounded-[10px] bg-neutral-950/75 p-1 shadow-lg backdrop-blur-md border border-white/15">
              <WinActionBtn
                label={t("archiveCard.editLabel")}
                onClick={() => onEdit(archive)}
                icon={<SquarePen size={12} />}
              />
              <WinActionBtn
                label={archive.isVisible ? t("archiveCard.hideLabel") : t("archiveCard.showLabel")}
                onClick={() => onToggleVisibility(archive)}
                icon={archive.isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
              />
              <div className="mx-0.5 h-3 w-px bg-white/20" />
              <WinActionBtn
                label={t("archiveCard.deleteLabel")}
                onClick={() => onDelete(archive)}
                icon={<Trash2 size={12} />}
                danger
              />
            </div>
          </div>
        )}
      </div>

      {/* 信息区：Windows 资源管理器元数据排版 */}
      <div className="flex flex-col gap-1.5 px-0.5 pt-2.5 pb-0.5">
        {/* 第一行：文件名与状态 */}
        <div className="flex items-start justify-between gap-1.5">
          <p
            className={cn(
              "line-clamp-1 text-[13px] font-semibold leading-tight tracking-tight",
              archive.isVisible ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
            )}
            title={displayName}
          >
            <Highlight text={displayName} query={searchQuery} />
          </p>

          {/* 难度微胶囊 (同心圆角 6px) */}
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-[6px] px-1.5 py-0.5 text-[10px] font-medium leading-none border",
              diffConfig.bg,
              diffConfig.text,
              diffConfig.border
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", diffConfig.dot)} />
            {t(DIFFICULTY_I18N[archive.archiveDifficulty] ?? "archiveCard.normal")}
          </span>
        </div>

        {/* 第二行：层级位置 + 修改时间 */}
        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] pt-0.5">
          {/* 层级信息 */}
          <span
            className="flex min-w-0 items-center gap-1 truncate pr-1 hover:text-[var(--color-text-secondary)] transition-colors"
            title={getLevelName(archive.currentLevel)}
          >
            <MapPin size={11} className="shrink-0 text-[var(--color-primary)] opacity-80" />
            <span className="truncate">{getLevelName(archive.currentLevel)}</span>
          </span>

          {/* 最后修改时间 */}
          {archive.date && (
            <span className="flex shrink-0 items-center gap-1 text-[10px] tabular-nums opacity-75">
              <Clock size={10} className="shrink-0 opacity-80" />
              <span>{archive.date}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** WinUI 3 风格同心圆按钮 (rounded-[6px]) */
function WinActionBtn({
  label,
  icon,
  onClick,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-[6px] text-white/85 transition-all duration-150 active:scale-90",
        danger
          ? "hover:bg-red-500 hover:text-white"
          : "hover:bg-white/20 hover:text-white"
      )}
    >
      {icon}
    </button>
  );
}



