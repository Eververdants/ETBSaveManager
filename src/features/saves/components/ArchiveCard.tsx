/**
 * 存档卡片 — 层级封面承载元信息：难度徽章（左上）、隐藏态（右上 + 图片灰度）、
 * 当前层级名（封面底部渐变）。操作按钮 hover / focus-within 浮现于封面右下，
 * 信息区仅保留存档名称 + 修改日期，保证网格静置时焦点最少。
 * （对应 master ArchiveCard）
 */
import { useTranslation } from "react-i18next";
import { EyeOff, Eye, SquarePen, Trash2, CheckCircle2, Circle, MapPin } from "lucide-react";

import { LazyImage, Badge } from "../../../components/ui";
import { getLevelImage, useLevelName } from "../../../utils/levelUtils";
import { FEATURES } from "../../../constants";
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

/** 搜索高亮（纯文本按片段渲染，无 v-html 注入面） */
function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-[var(--color-primary-subtle)] px-0.5 text-[var(--color-primary)]">
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

/** 难度 → 徽章色（设计系统无 warning token，困难/噩梦共用 danger） */
const DIFFICULTY_TONE: Record<string, "success" | "primary" | "danger"> = {
  easy: "success",
  normal: "primary",
  hard: "danger",
  nightmare: "danger",
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
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-[var(--color-bg-elevated)] text-left",
        "transition-all duration-200 ease-out",
        isSelected
          ? "border-[var(--color-primary)] shadow-[0_0_0_2px_var(--color-ring)]"
          : "border-[var(--color-border-light)] hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_12px_28px_var(--color-shadow-lg)]"
      )}
    >
      {/* 封面：层级图 + 叠加元信息 */}
      <div className="relative aspect-video overflow-hidden">
        <LazyImage
          src={getLevelImage(archive.currentLevel || "Level0")}
          alt={archive.name}
          className={cn(
            "h-full w-full [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105",
            hidden && "[&_img]:opacity-60 [&_img]:grayscale"
          )}
        />

        {/* 左上：多选圈 + 难度徽章（z-10：始终位于 LazyImage 的 error 占位层之上） */}
        <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5">
          {isMultiSelectMode && (
            <span className="drop-shadow-md">
              {isSelected ? (
                <CheckCircle2 size={20} style={{ color: "var(--color-primary)" }} />
              ) : (
                <Circle size={18} className="text-white opacity-80" />
              )}
            </span>
          )}
          <Badge tone={DIFFICULTY_TONE[archive.archiveDifficulty] ?? "primary"}>
            {t(DIFFICULTY_I18N[archive.archiveDifficulty] ?? "archiveCard.normal")}
          </Badge>
          {!FEATURES.MERGE_DIFFICULTY && archive.actualDifficulty !== archive.archiveDifficulty && (
            <Badge tone="neutral">
              {t(DIFFICULTY_I18N[archive.actualDifficulty] ?? archive.actualDifficulty)}
            </Badge>
          )}
        </div>

        {/* 右上：隐藏态（隐藏时图片同步灰度弱化） */}
        {hidden && (
          <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <EyeOff size={11} />
            {t("archiveCard.hidden")}
          </span>
        )}

        {/* 底部渐变：当前层级 + hover 浮现的操作 */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-1.5 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-2.5 pb-2 pt-7">
          <span className="flex min-w-0 items-center gap-1 text-[11px] font-medium text-white drop-shadow">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{getLevelName(archive.currentLevel)}</span>
          </span>
          {!isMultiSelectMode && (
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
              <CoverAction
                label={t("archiveCard.editLabel")}
                onClick={() => onEdit(archive)}
                icon={<SquarePen size={13} />}
              />
              <CoverAction
                label={archive.isVisible ? t("archiveCard.hideLabel") : t("archiveCard.showLabel")}
                onClick={() => onToggleVisibility(archive)}
                icon={archive.isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
              />
              <CoverAction
                label={t("archiveCard.deleteLabel")}
                onClick={() => onDelete(archive)}
                icon={<Trash2 size={13} />}
                danger
              />
            </div>
          )}
        </div>
      </div>

      {/* 信息：名称 + 修改日期 */}
      <div className="flex flex-col gap-0.5 p-2.5">
        <p
          className={cn(
            "truncate text-[13px] font-semibold",
            archive.isVisible ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"
          )}
        >
          <Highlight text={displayName} query={searchQuery} />
        </p>
        {archive.date && (
          <p className="truncate text-[11px] text-[var(--color-text-muted)]">
            {t("archiveCard.lastModified")}
            <span className="ml-1 tabular-nums">{archive.date}</span>
          </p>
        )}
      </div>
    </div>
  );
}

/** 封面上的浮动操作按钮（深底胶囊，语义由 tooltip / aria-label 提供） */
function CoverAction({
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
        "flex items-center rounded-md bg-black/55 p-1.5 text-white backdrop-blur-sm transition-colors",
        danger ? "hover:bg-[var(--color-danger)]" : "hover:bg-black/80"
      )}
    >
      {icon}
    </button>
  );
}
