/**
 * 文件夹面包屑 — 进入文件夹后显示的细导航行（根目录不渲染，不占空间）
 */
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";

export interface FolderBreadcrumbProps {
  folderName: string;
  count: number;
  onExit: () => void;
}

export default function FolderBreadcrumb({ folderName, count, onExit }: FolderBreadcrumbProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-8 shrink-0 select-none items-center gap-1 px-5 text-xs">
      <button
        type="button"
        onClick={onExit}
        className="rounded-md px-1.5 py-0.5 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-primary)]"
      >
        {t("organizer.allArchives")}
      </button>
      <ChevronRight size={12} className="shrink-0 text-[var(--color-text-muted)]" />
      <span className="max-w-[280px] truncate font-medium text-[var(--color-text-primary)]">
        {folderName}
      </span>
      <span className="ml-1 shrink-0 tabular-nums text-[11px] text-[var(--color-text-muted)]">
        {count}
      </span>
    </div>
  );
}
