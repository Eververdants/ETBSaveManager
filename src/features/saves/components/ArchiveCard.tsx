/**
 * 存档卡片 — WinUI 3 极简留白与自然呼吸感 (Spacious & Balanced Rhythm)
 *
 * 核心呼吸感重构原则（靠比例、留白、层级间距实现，杜绝花哨光效）：
 * 1. 呼吸留白节奏 (Vertical Rhythm)：
 *    - 增加缩略图与文字区、文字行之间的舒展间距（Padding 12px、图文间隙 12px、行间 8px）。
 *    - 彻底移除局促的花哨呼吸灯与紧绷外框，回归 WinUI 3 纯净、舒展、大气的排版。
 * 2. 同心圆比例系统：
 *    - 外卡片：`p-3 rounded-[16px]` (Padding 12px, 外角 16px)
 *    - 缩略图媒体槽：`rounded-[10px]` (16px - 12px = 4~10px 柔和曲率对齐)
 *    - 底部属性栏：开放式通透排版，不再硬塞进狭窄盒子里，空气感充足。
 * 3. 难度指示：
 *    - 回归极简优雅的微胶囊，留白通透，字距舒适。
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
  Shield,
  Zap,
  Flame,
  Skull,
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

/** WinUI 难度样式：极简通透微徽标 */
const DIFFICULTY_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    bg: string;
    text: string;
    border: string;
  }
> = {
  easy: {
    icon: Shield,
    bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/25",
  },
  normal: {
    icon: Zap,
    bg: "bg-[var(--color-primary-subtle)]",
    text: "text-[var(--color-primary)]",
    border: "border-[var(--color-primary)]/25",
  },
  hard: {
    icon: Flame,
    bg: "bg-[var(--color-danger-subtle)]",
    text: "text-[var(--color-danger)]",
    border: "border-[var(--color-danger)]/25",
  },
  nightmare: {
    icon: Skull,
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
  const DiffIcon = diffConfig.icon;

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
      // 外层容器：从容留白 p-3 (12px)，大圆角 rounded-[16px]
      className={cn(
        "group relative flex flex-col p-3 rounded-[16px] text-left cursor-pointer select-none",
        "border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "bg-[var(--color-bg-elevated)] shadow-[0_1px_3px_var(--color-shadow)]",
        "hover:shadow-[0_12px_32px_-8px_var(--color-shadow-lg)] hover:-translate-y-1 hover:border-[var(--color-border-strong)]",
        isSelected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/70 ring-2 ring-[var(--color-ring)]"
          : "border-[var(--color-border-light)]",
        hidden && "opacity-60 hover:opacity-100"
      )}
    >
      {/* 缩略图容器：同心圆角 10px，比例舒展 */}
      <div className="relative aspect-[16/9.5] w-full overflow-hidden rounded-[10px] bg-[var(--color-bg-muted)] border border-[var(--color-border-light)]/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
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

        {/* 隐藏项目角标：WinUI 3 极简深蓝灰磨砂微光态 */}
        {hidden && (
          <div className="absolute left-0 top-0 z-10 inline-flex items-center gap-1 rounded-tl-[10px] rounded-br-[8px] bg-slate-900/80 dark:bg-slate-800/85 px-2 py-0.5 text-[10px] font-medium text-slate-200 shadow-sm backdrop-blur-md border-r border-b border-white/15">
            <EyeOff size={10} className="text-slate-300" />
            <span>{t("archiveCard.hidden")}</span>
          </div>
        )}

        {/* 浮动操作条：同心贴合右上角 */}
        {!isMultiSelectMode && (
          <div className="absolute right-0 top-0 z-10 flex items-center opacity-0 -translate-y-1 scale-95 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100">
            <div className="flex items-center gap-0.5 rounded-tr-[10px] rounded-bl-[8px] bg-neutral-950/80 p-1 shadow-md backdrop-blur-md border-l border-b border-white/15">
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

      {/* 信息区：舒展呼吸感排版 (从容内距 + 空气感属性栏) */}
      <div className="flex flex-col gap-2.5 px-0.5 pt-3 pb-0.5">
        {/* 第一行：主标题 + 难度徽章 */}
        <div className="flex items-center justify-between gap-2.5">
          <p
            className={cn(
              "line-clamp-1 text-[13.5px] font-semibold tracking-[-0.01em]",
              archive.isVisible ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
            )}
            title={displayName}
          >
            <Highlight text={displayName} query={searchQuery} />
          </p>

          {/* 难度指示：纯净微胶囊 (无多余背景块，靠内衬与微字号释放空间) */}
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-[6px] py-0.5 px-2 border transition-all duration-200",
              diffConfig.bg,
              diffConfig.text,
              diffConfig.border
            )}
          >
            <DiffIcon size={11} className="shrink-0 opacity-80" />
            <span className="text-[10px] font-medium tracking-wide">
              {t(DIFFICULTY_I18N[archive.archiveDifficulty] ?? "archiveCard.normal")}
            </span>
          </span>
        </div>

        {/* 第二行：通透属性行 (层级位置 + 修改时间，留白开阔自然) */}
        <div className="flex items-center justify-between text-[11.5px] text-[var(--color-text-muted)] pt-0.5">
          {/* 层级信息 */}
          <div
            className="flex min-w-0 items-center gap-1.5 truncate pr-2 hover:text-[var(--color-text-secondary)] transition-colors"
            title={getLevelName(archive.currentLevel)}
          >
            <MapPin size={12} className="shrink-0 text-[var(--color-primary)] opacity-85" />
            <span className="truncate font-medium">{getLevelName(archive.currentLevel)}</span>
          </div>

          {/* 最后修改时间 */}
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




