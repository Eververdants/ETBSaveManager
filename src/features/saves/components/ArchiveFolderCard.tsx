/**
 * ArchiveFolderCard — 整理文件夹卡片
 *
 * 与 MemoizedArchiveCard 同高度契约（见 virtualGridLayout.ts）：
 * 根节点 h-full 填满定位容器的显式高度；图标区 flex-1 吸收剩余高度，
 * 信息区 shrink-0 保证文本完整，布局侧无需感知卡片类型差异。
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Folder } from "lucide-react";

import { cn } from "../../../utils";

export interface ArchiveFolderCardData {
  id: string;
  name: string;
  count: number;
}

export interface ArchiveFolderCardProps {
  folder: ArchiveFolderCardData;
  /** 有存档正拖拽悬停（网盘式投放高亮） */
  isDropTarget?: boolean;
  onOpen: (folder: ArchiveFolderCardData) => void;
}

export default function ArchiveFolderCard({
  folder,
  isDropTarget,
  onOpen,
}: ArchiveFolderCardProps) {
  const { t } = useTranslation();

  const handleClick = useCallback(() => onOpen(folder), [onOpen, folder]);

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
        "transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out",
        "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[0_12px_32px_-8px_var(--color-shadow-lg)]",
        "active:scale-[0.98]",
        isDropTarget
          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/70 ring-2 ring-[var(--color-ring)]"
          : "border-[var(--color-border-light)]"
      )}
    >
      {/* 图标区：flex-1 填满剩余高度，与存档卡片图片区一致 */}
      <div
        className={cn(
          "relative w-full min-h-0 flex-1 overflow-hidden rounded-[10px] flex items-center justify-center",
          "border border-[var(--color-border-light)]/80",
          isDropTarget
            ? "bg-[var(--color-primary-subtle)]"
            : "bg-[var(--color-bg-muted)]"
        )}
      >
        <Folder
          size={42}
          strokeWidth={1.1}
          className={cn(
            "transition-transform duration-200 group-hover:scale-105",
            isDropTarget
              ? "text-[var(--color-primary)]"
              : "text-[var(--color-primary)] opacity-55"
          )}
        />
      </div>

      {/* 信息区：shrink-0，行结构与存档卡片一致以对齐高度 */}
      <div className="flex shrink-0 flex-col gap-2.5 px-0.5 pt-3 pb-0.5">
        <p
          className="line-clamp-1 text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]"
          title={folder.name}
        >
          {folder.name}
        </p>
        <div className="flex items-center text-[11.5px] text-[var(--color-text-muted)] pt-0.5">
          <span className="tabular-nums">
            {t("organizer.folderItemsCount", { count: folder.count })}
          </span>
        </div>
      </div>
    </div>
  );
}
