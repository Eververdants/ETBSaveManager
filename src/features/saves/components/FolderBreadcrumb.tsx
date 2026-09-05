/**
 * 文件夹面包屑 — 进入文件夹后显示的细导航行（根目录不渲染，不占空间）。
 * 支持嵌套：链路中除当前层外的每一段都可点击回跳。
 */
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

export interface FolderBreadcrumbProps {
  /** 根目录到当前文件夹的链路（含当前层） */
  segments: Array<{ id: string; name: string }>;
  count: number;
  onNavigate: (folderId: string | null) => void;
}

export default function FolderBreadcrumb({ segments, count, onNavigate }: FolderBreadcrumbProps) {
  const { t } = useTranslation();
  const current = segments[segments.length - 1];

  return (
    <div className="flex h-8 shrink-0 select-none items-center gap-1 px-5 text-xs">
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className="rounded-md px-1.5 py-0.5 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-primary)]"
      >
        {t("organizer.allArchives")}
      </button>
      {segments.map((segment, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={segment.id} className="flex min-w-0 items-center gap-1">
            <ChevronRight size={12} className="shrink-0 text-[var(--color-text-muted)]" />
            {isLast ? (
              <span className="max-w-[280px] truncate font-medium text-[var(--color-text-primary)]">
                {segment.name}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(segment.id)}
                className="max-w-[200px] truncate rounded-md px-1 py-0.5 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-primary)]"
              >
                {segment.name}
              </button>
            )}
          </span>
        );
      })}
      {current && (
        <span className="ml-1 shrink-0 tabular-nums text-[11px] text-[var(--color-text-muted)]">
          {count}
        </span>
      )}
    </div>
  );
}
