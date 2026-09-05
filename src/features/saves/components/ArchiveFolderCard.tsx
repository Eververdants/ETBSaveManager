/**
 * ArchiveFolderCard — 整理文件夹卡片
 *
 * 封面设计（默认随文件夹内容自动更新，也可手动指定单张）：
 * - 1 张封面（手动指定或唯一存档）→ 单图铺满
 * - 2 张 → 左右分屏；3 张 → 左大右二；4 张 → 2×2 拼贴
 * - 空文件夹 → 主色渐变底 + 半透明文件夹图标
 * - 统一叠加顶部深色渐变与毛玻璃文件夹徽标，与存档卡片的悬浮操作条语言一致
 *
 * 高度契约与 MemoizedArchiveCard 一致（见 virtualGridLayout.ts）：
 * 根节点 h-full 填满定位容器的显式高度；封面区 flex-1 吸收剩余高度，
 * 信息区 shrink-0 保证文本完整，布局侧无需感知卡片类型差异。
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Folder, Folders } from "lucide-react";

import { LazyImage } from "../../../components/ui";
import { cn } from "../../../utils";

export interface ArchiveFolderCardData {
  id: string;
  name: string;
  count: number;
  subfolderCount?: number;
  coverImages?: string[];
}

export interface ArchiveFolderCardProps<F extends ArchiveFolderCardData = ArchiveFolderCardData> {
  folder: F;
  /** 有存档正拖拽悬停（网盘式投放高亮） */
  isDropTarget?: boolean;
  onOpen: (folder: F) => void;
}

export default function ArchiveFolderCard<F extends ArchiveFolderCardData = ArchiveFolderCardData>({
  folder,
  isDropTarget,
  onOpen,
}: ArchiveFolderCardProps<F>) {
  const { t } = useTranslation();
  const coverImages = folder.coverImages ?? [];

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
        "border bg-[var(--color-bg-secondary)] shadow-[0_1px_3px_var(--color-shadow)]",
        "transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out",
        "hover:-translate-y-0.5 hover:border-[var(--color-border-strong)] hover:shadow-[0_12px_32px_-8px_var(--color-shadow-lg)]",
        "active:scale-[0.98]",
        isDropTarget
          ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]/70 ring-2 ring-[var(--color-ring)]"
          : "border-[var(--color-border-light)]"
      )}
    >
      {/* 封面区：flex-1 填满剩余高度，与存档卡片图片区一致 */}
      <div
        className={cn(
          "relative w-full min-h-0 flex-1 overflow-hidden rounded-[10px]",
          "border border-[var(--color-border-light)]/80 bg-[var(--color-bg-muted)]"
        )}
      >
        {coverImages.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-subtle)] via-transparent to-[var(--color-bg-muted)]">
            <Folder
              size={42}
              strokeWidth={1.1}
              className="text-[var(--color-primary)] opacity-40 transition-transform duration-200 ease-out group-hover:scale-105"
            />
          </div>
        ) : coverImages.length === 1 ? (
          <LazyImage
            src={coverImages[0]}
            alt=""
            className="h-full w-full [&_img]:transition-transform [&_img]:duration-200 [&_img]:ease-out group-hover:[&_img]:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 grid h-full auto-rows-fr grid-cols-2 gap-[2px]">
            {coverImages.slice(0, 4).map((src, i) => (
              <LazyImage
                key={`${src}-${i}`}
                src={src}
                alt=""
                className={cn(
                  "h-full w-full [&_img]:transition-transform [&_img]:duration-200 [&_img]:ease-out group-hover:[&_img]:scale-[1.04]",
                  coverImages.length === 3 && i === 0 && "row-span-2"
                )}
              />
            ))}
          </div>
        )}

        {/* 顶部渐变 + 毛玻璃文件夹徽标 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/30 to-transparent" />
        <div
          className={cn(
            "absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-[7px]",
            "bg-neutral-950/70 backdrop-blur-md border border-white/15"
          )}
        >
          <Folder size={12} className="text-white/90" />
        </div>
      </div>

      {/* 信息区：shrink-0，行结构与存档卡片对齐高度，但版式明显区分 */}
      <div className="flex shrink-0 flex-col gap-2.5 px-0.5 pt-3 pb-0.5">
        {/* 名称行：文件夹图标 + 名称，右侧计数徽章（对应存档卡片的难度徽章位） */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-1.5">
            <Folder size={13} className="shrink-0 text-[var(--color-primary)] opacity-85" />
            <p
              className="line-clamp-1 text-[13.5px] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]"
              title={folder.name}
            >
              {folder.name}
            </p>
          </div>
          <span
            className="inline-flex shrink-0 items-center rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10.5px] font-medium tabular-nums text-[var(--color-text-secondary)]"
            title={t("organizer.folderItemsCount", { count: folder.count })}
          >
            {folder.count}
          </span>
        </div>

        {/* 属性行：子文件夹数量（无子文件夹时保持行高与存档卡片对齐） */}
        <div className="flex min-h-[17px] items-center gap-1.5 pt-0.5 text-[11.5px] text-[var(--color-text-muted)]">
          {(folder.subfolderCount ?? 0) > 0 && (
            <>
              <Folders size={12} className="shrink-0 opacity-70" />
              <span className="tabular-nums">
                {t("organizer.subfolderCount", { count: folder.subfolderCount })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
