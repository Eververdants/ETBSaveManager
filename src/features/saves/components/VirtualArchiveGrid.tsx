/**
 * 虚拟存档网格 — 极致性能优化版 v3
 *
 * 优化点：
 * 1. 仅渲染可视区域 + 缓冲区的卡片，DOM 节点恒定
 * 2. 布局经 ResizeObserver 逐帧精确跟踪容器尺寸，卡片定位始终与当前
 *    宽度吻合，任何时刻都不会越出右边距
 * 3. 侧边栏开合时直接以「动画结束后」的容器宽度布局（侧边栏目标宽度
 *    已知，可精确预测），卡片立即落到最终位置、无位置过渡动画；面板
 *    滑动期间新列随面板展开自然露出、右侧留白随面板推进收合，无中间
 *    态重排；动画期间容器实测尺寸更新被冻结，网格不产生任何重渲染
 * 4. 预加载缓冲区图片，滚动时图片已就绪
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { UI_CONFIG } from "../../../constants";
import { useAppStore } from "../../../stores";
import { useVirtualGrid } from "../hooks/useVirtualGrid";
import type { GridConfig } from "../hooks/virtualGridLayout";
import { getLevelImage } from "../../../utils/levelUtils";
import { preloadImage, isImagePreloaded } from "../../../utils/imagePreloader";
import type { ArchiveData } from "../../../types";
import MemoizedArchiveCard from "./MemoizedArchiveCard";
import ArchiveFolderCard from "./ArchiveFolderCard";
import type { ArchiveFolderCardData } from "./ArchiveFolderCard";

/** 拖拽移动存档时的 dataTransfer MIME 标记 */
const DRAG_MIME = "application/x-etb-archive";
/** 拖拽移动文件夹时的 dataTransfer MIME 标记 */
const DRAG_MIME_FOLDER = "application/x-etb-folder";

type DragItem = { kind: "archive" | "folder"; id: string };

export interface VirtualArchiveGridProps<F extends ArchiveFolderCardData = ArchiveFolderCardData> {
  archives: ArchiveData[];
  isMultiSelectMode: boolean;
  selectedIds: Set<number>;
  searchQuery?: string;
  /** 文件夹卡片（渲染在存档之前；仅根目录视图传入） */
  folders?: F[];
  onFolderOpen?: (folder: F) => void;
  onFolderContextMenu?: (e: React.MouseEvent, folder: F) => void;
  /** 拖拽存档投放：folderId 为 null 表示移回未归档 */
  onDropArchiveToFolder?: (archivePath: string, folderId: string | null) => void;
  /** 拖拽文件夹投放（嵌套）：targetId 为 null 表示移回根目录 */
  onDropFolderToFolder?: (folderId: string, targetId: string | null) => void;
  /** 文件夹拖放有效性校验（拖入自身后代形成环的拖拽不响应） */
  isValidFolderDrop?: (folderId: string, targetId: string) => boolean;
  /** 空白区域代表的文件夹（当前浏览的文件夹，根目录为 null） */
  containerFolderId?: string | null;
  onToggleVisibility: (archive: ArchiveData) => void;
  onEdit: (archive: ArchiveData) => void;
  onDelete: (archive: ArchiveData) => void;
  onSelect: (archive: ArchiveData) => void;
  onToggleSelect: (archive: ArchiveData) => void;
  /** 卡片右键（在 wrapper 上拦截，冒泡前调用；卡片组件本身不感知） */
  onCardContextMenu?: (e: React.MouseEvent, archive: ArchiveData) => void;
}

const MIN_COLUMN_WIDTH = 220;
const GAP = 16;
const OVERSCAN_ROWS = 3;
// 侧边栏宽度动画结束后再解除布局宽度覆盖，余量避免动画尾帧落回实测宽度
const SIDEBAR_ANIMATION_GRACE_MS = UI_CONFIG.SIDEBAR_ANIMATION_MS + 50;
// 侧边栏两种宽度之差 = 容器宽度的变化量，用于预测动画结束后的布局宽度
const SIDEBAR_WIDTH_DELTA = UI_CONFIG.SIDEBAR_WIDTH - UI_CONFIG.SIDEBAR_COLLAPSED_WIDTH;
// 页面级上下留白由 SavesPage 内容区的 pt-4 / pb-6 提供，布局数学不再重复计算

// 模块级常量：保持引用稳定，useVirtualGrid 内的布局 memo 不随重渲染重建
const GRID_CONFIG: Partial<GridConfig> = {
  minColumnWidth: MIN_COLUMN_WIDTH,
  gap: GAP,
  overscanRows: OVERSCAN_ROWS,
};

// 滚动条沟槽恒定保留：内容宽度只由外壳决定，与「当前是否出现滚动条」
// 解耦。否则总高度变化 → 滚动条增减 → 内容宽度变化 → 布局再变 → 滚动条
// 再增减，在内容高度接近视口时形成振荡（卡片在新旧排布间反复闪烁），
// 且布局宽度覆盖的预测值永远无法与实测值对齐
const CONTAINER_STYLE: React.CSSProperties = {
  scrollBehavior: "auto", // 禁用 CSS smooth，滚动位置完全由事件驱动
  transform: "translateZ(0)", // GPU 加速
  scrollbarGutter: "stable",
};

/**
 * 预加载缓冲区图片（使用全局预加载器）
 */
const preloadQueue: Set<string> = new Set();
let preloadRaf: number | null = null;

function schedulePreload(urls: string[]) {
  urls.forEach((url) => {
    if (!isImagePreloaded(url) && !preloadQueue.has(url)) {
      preloadQueue.add(url);
    }
  });

  if (preloadRaf === null) {
    preloadRaf = requestAnimationFrame(() => {
      preloadRaf = null;
      preloadQueue.forEach((url) => preloadImage(url));
      preloadQueue.clear();
    });
  }
}

/**
 * 虚拟存档网格
 */
export default function VirtualArchiveGrid<F extends ArchiveFolderCardData = ArchiveFolderCardData>({
  archives,
  isMultiSelectMode,
  selectedIds,
  searchQuery,
  folders,
  onFolderOpen,
  onFolderContextMenu,
  onDropArchiveToFolder,
  onDropFolderToFolder,
  isValidFolderDrop,
  containerFolderId,
  onToggleVisibility,
  onEdit,
  onDelete,
  onSelect,
  onToggleSelect,
  onCardContextMenu,
}: VirtualArchiveGridProps<F>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  /** 当前拖拽悬停的文件夹（投放高亮） */
  const [dropFolderId, setDropFolderId] = useState<string | null>(null);
  /** 正在拖拽的项（文件夹自拖自放不触发高亮与投放） */
  const dragItemRef = useRef<DragItem | null>(null);

  // 侧边栏开合：立即按「动画结束后」的容器宽度布局，卡片直接滑入最终位置
  const [layoutWidthOverride, setLayoutWidthOverride] = useState<number | null>(null);
  const prevCollapsedRef = useRef(sidebarCollapsed);

  const folderCount = folders?.length ?? 0;
  const itemCount = folderCount + archives.length;

  const { visibleItems, totalHeight, containerWidth } = useVirtualGrid({
    itemCount,
    containerRef,
    config: GRID_CONFIG,
    layoutWidthOverride,
  });

  // containerWidth 对应的侧边栏状态：实测宽度只在静止时更新（覆盖期间冻结），
  // 连续快速开合时也能从同一静止基准推算最终宽度，不会取到动画中间值
  const restCollapsedRef = useRef(sidebarCollapsed);
  useEffect(() => {
    restCollapsedRef.current = sidebarCollapsed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth]);

  useEffect(() => {
    if (prevCollapsedRef.current === sidebarCollapsed) return;
    prevCollapsedRef.current = sidebarCollapsed;

    if (containerWidth > 0) {
      // 收起侧边栏 → 内容变宽；展开 → 变窄；快速开合回到原状态 → 宽度不变
      const restDelta =
        restCollapsedRef.current === sidebarCollapsed
          ? 0
          : sidebarCollapsed
            ? SIDEBAR_WIDTH_DELTA
            : -SIDEBAR_WIDTH_DELTA;
      setLayoutWidthOverride(Math.max(containerWidth + restDelta, 0));
    } else {
      setLayoutWidthOverride(null);
    }

    const timer = setTimeout(() => setLayoutWidthOverride(null), SIDEBAR_ANIMATION_GRACE_MS);
    return () => clearTimeout(timer);
  }, [sidebarCollapsed, containerWidth]);

  // 预加载缓冲区图片（跳过文件夹槽位）
  useEffect(() => {
    const urls = visibleItems
      .filter((item) => item.index >= folderCount)
      .map((item) => archives[item.index - folderCount]?.currentLevel)
      .filter(Boolean)
      .map((level) => getLevelImage(level!));

    schedulePreload(urls);
  }, [visibleItems, archives, folderCount]);

  // 稳定的回调函数
  const handlers = useMemo(
    () => ({
      onToggleVisibility,
      onEdit,
      onDelete,
      onSelect,
      onToggleSelect,
      onCardContextMenu,
      onFolderOpen,
      onFolderContextMenu,
      onDropArchiveToFolder,
      onDropFolderToFolder,
      isValidFolderDrop,
      containerFolderId,
    }),
    [
      onToggleVisibility,
      onEdit,
      onDelete,
      onSelect,
      onToggleSelect,
      onCardContextMenu,
      onFolderOpen,
      onFolderContextMenu,
      onDropArchiveToFolder,
      onDropFolderToFolder,
      isValidFolderDrop,
      containerFolderId,
    ]
  );

  /** 投放目标是否接受当前拖拽物（存档或文件夹） */
  const acceptsDrag = (e: React.DragEvent): boolean =>
    e.dataTransfer.types.includes(DRAG_MIME) || e.dataTransfer.types.includes(DRAG_MIME_FOLDER);

  if (itemCount === 0) return null;

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden"
      style={CONTAINER_STYLE}
      onDragOver={(e) => {
        if (!acceptsDrag(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        if (!acceptsDrag(e)) return;
        e.preventDefault();
        setDropFolderId(null);
        // 投放到空白区域 = 移入当前文件夹；根目录下 = 移回未归档 / 根目录
        if (e.dataTransfer.types.includes(DRAG_MIME)) {
          const path = e.dataTransfer.getData(DRAG_MIME);
          if (path) handlers.onDropArchiveToFolder?.(path, handlers.containerFolderId ?? null);
          return;
        }
        const folderId = e.dataTransfer.getData(DRAG_MIME_FOLDER);
        if (folderId) handlers.onDropFolderToFolder?.(folderId, handlers.containerFolderId ?? null);
      }}
    >
      {/* 占位容器 */}
      <div
        style={{
          height: totalHeight,
          position: "relative",
        }}
      >
        {/* 可见卡片：布局在开合首尾各更新一次，位置即最终位置，无中间态 */}
        {visibleItems.map((item) => {
          // 文件夹槽位排前，其余为存档卡片
          if (item.index < folderCount) {
            const folder = folders![item.index];
            return (
              <div
                key={`folder-${folder.id}`}
                draggable={!isMultiSelectMode}
                style={{
                  position: "absolute",
                  left: item.left,
                  top: item.top,
                  width: item.width,
                  height: item.height,
                }}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData(DRAG_MIME_FOLDER, folder.id);
                  dragItemRef.current = { kind: "folder", id: folder.id };
                }}
                onDragEnd={() => {
                  dragItemRef.current = null;
                  setDropFolderId(null);
                }}
                onContextMenu={
                  handlers.onFolderContextMenu
                    ? (e) => {
                        e.stopPropagation();
                        handlers.onFolderContextMenu!(e, folder);
                      }
                    : undefined
                }
                onDragOver={(e) => {
                  if (!acceptsDrag(e)) return;
                  // 文件夹不可拖入自身或其后代（高亮阶段即拦截）
                  if (dragItemRef.current?.kind === "folder") {
                    const dragId = dragItemRef.current.id;
                    if (dragId === folder.id) return;
                    if (handlers.isValidFolderDrop && !handlers.isValidFolderDrop(dragId, folder.id)) {
                      return;
                    }
                  }
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropFolderId(folder.id);
                }}
                onDragLeave={(e) => {
                  // 在卡片内部子元素间移动时不清除高亮
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDropFolderId((cur) => (cur === folder.id ? null : cur));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropFolderId(null);
                  if (dragItemRef.current?.kind === "folder") {
                    const dragId = dragItemRef.current.id;
                    if (dragId === folder.id) return;
                    if (handlers.isValidFolderDrop && !handlers.isValidFolderDrop(dragId, folder.id)) {
                      return;
                    }
                  }
                  const archivePath = e.dataTransfer.getData(DRAG_MIME);
                  if (archivePath) {
                    handlers.onDropArchiveToFolder?.(archivePath, folder.id);
                    return;
                  }
                  const folderId = e.dataTransfer.getData(DRAG_MIME_FOLDER);
                  if (folderId) handlers.onDropFolderToFolder?.(folderId, folder.id);
                }}
              >
                <ArchiveFolderCard
                  folder={folder}
                  isDropTarget={dropFolderId === folder.id}
                  onOpen={handlers.onFolderOpen ?? (() => {})}
                />
              </div>
            );
          }

          const archive = archives[item.index - folderCount];
          if (!archive) return null;

          return (
            <div
              key={archive.path || archive.id}
              draggable={!isMultiSelectMode}
              style={{
                position: "absolute",
                left: item.left,
                top: item.top,
                width: item.width,
                height: item.height,
              }}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData(DRAG_MIME, archive.path);
                dragItemRef.current = { kind: "archive", id: archive.path };
              }}
              onDragEnd={() => {
                dragItemRef.current = null;
                setDropFolderId(null);
              }}
              onContextMenu={
                handlers.onCardContextMenu
                  ? (e) => {
                      e.stopPropagation();
                      handlers.onCardContextMenu!(e, archive);
                    }
                  : undefined
              }
            >
              <MemoizedArchiveCard
                archive={archive}
                isMultiSelectMode={isMultiSelectMode}
                isSelected={selectedIds.has(archive.id)}
                searchQuery={searchQuery}
                onToggleVisibility={handlers.onToggleVisibility}
                onEdit={handlers.onEdit}
                onDelete={handlers.onDelete}
                onSelect={handlers.onSelect}
                onToggleSelect={handlers.onToggleSelect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
