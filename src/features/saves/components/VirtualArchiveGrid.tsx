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

export interface VirtualArchiveGridProps {
  archives: ArchiveData[];
  isMultiSelectMode: boolean;
  selectedIds: Set<number>;
  searchQuery?: string;
  onToggleVisibility: (archive: ArchiveData) => void;
  onEdit: (archive: ArchiveData) => void;
  onDelete: (archive: ArchiveData) => void;
  onSelect: (archive: ArchiveData) => void;
  onToggleSelect: (archive: ArchiveData) => void;
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
export default function VirtualArchiveGrid({
  archives,
  isMultiSelectMode,
  selectedIds,
  searchQuery,
  onToggleVisibility,
  onEdit,
  onDelete,
  onSelect,
  onToggleSelect,
}: VirtualArchiveGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  // 侧边栏开合：立即按「动画结束后」的容器宽度布局，卡片直接滑入最终位置
  const [layoutWidthOverride, setLayoutWidthOverride] = useState<number | null>(null);
  const prevCollapsedRef = useRef(sidebarCollapsed);

  const { visibleItems, totalHeight, containerWidth } = useVirtualGrid({
    itemCount: archives.length,
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

  // 预加载缓冲区图片
  useEffect(() => {
    const urls = visibleItems
      .map((item) => archives[item.index]?.currentLevel)
      .filter(Boolean)
      .map((level) => getLevelImage(level!));

    schedulePreload(urls);
  }, [visibleItems, archives]);

  // 稳定的回调函数
  const handlers = useMemo(
    () => ({
      onToggleVisibility,
      onEdit,
      onDelete,
      onSelect,
      onToggleSelect,
    }),
    [onToggleVisibility, onEdit, onDelete, onSelect, onToggleSelect]
  );

  if (archives.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden"
      style={CONTAINER_STYLE}
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
          const archive = archives[item.index];
          if (!archive) return null;

          return (
            <div
              key={archive.path || archive.id}
              style={{
                position: "absolute",
                left: item.left,
                top: item.top,
                width: item.width,
                height: item.height,
              }}
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
