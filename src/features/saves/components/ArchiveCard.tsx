/**
 * 存档卡片 — 关卡封面 + 名称高亮 + 难度标签 + 操作按钮
 * （对应 master ArchiveCard）
 */
import { useTranslation } from "react-i18next";
import { EyeOff, Eye, SquarePen, Trash2, CheckCircle2, Circle } from "lucide-react";

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
      {/* 封面 */}
      <div className="relative aspect-video overflow-hidden">
        <LazyImage
          src={getLevelImage(archive.currentLevel || "Level0")}
          alt={archive.name}
          className="h-full w-full [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105"
        />
        {!archive.isVisible && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <EyeOff size={12} />
            {t("archiveCard.hidden")}
          </div>
        )}
        {isMultiSelectMode && (
          <div className="absolute right-2 top-2 text-white drop-shadow-md">
            {isSelected ? (
              <CheckCircle2 size={22} style={{ color: "var(--color-primary)" }} />
            ) : (
              <Circle size={20} className="opacity-80" />
            )}
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--color-text-primary)]">
            <Highlight text={displayName} query={searchQuery} />
          </p>
          <Badge tone={archive.isVisible ? "success" : "neutral"}>
            {archive.isVisible ? t("archiveCard.visible") : t("archiveCard.hidden")}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="primary">{t(DIFFICULTY_I18N[archive.archiveDifficulty] ?? "archiveCard.normal")}</Badge>
          {!FEATURES.MERGE_DIFFICULTY && archive.actualDifficulty !== archive.archiveDifficulty && (
            <Badge tone="neutral">
              {t(DIFFICULTY_I18N[archive.actualDifficulty] ?? archive.actualDifficulty)}
            </Badge>
          )}
        </div>

        <p className="mt-auto truncate text-xs text-[var(--color-text-muted)]">
          {t("archiveCard.currentLevel")}:
          <span className="ml-1 font-medium text-[var(--color-text-secondary)]">
            {getLevelName(archive.currentLevel)}
          </span>
        </p>
      </div>

      {/* 操作栏 */}
      {!isMultiSelectMode && (
        <div className="flex items-center justify-around border-t border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-2 py-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <CardAction
            label={t("archiveCard.editLabel")}
            onClick={() => onEdit(archive)}
            icon={<SquarePen size={14} />}
          />
          <CardAction
            label={archive.isVisible ? t("archiveCard.hideLabel") : t("archiveCard.showLabel")}
            onClick={() => onToggleVisibility(archive)}
            icon={archive.isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
          />
          <CardAction
            label={t("archiveCard.deleteLabel")}
            onClick={() => onDelete(archive)}
            icon={<Trash2 size={14} />}
            danger
          />
        </div>
      )}
    </div>
  );
}

function CardAction({
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
        "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
        danger
          ? "text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)]"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
      )}
    >
      {icon}
    </button>
  );
}
