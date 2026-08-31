/**
 * 虚拟存档网格 — 极致性能优化版 v3
 *
 * 优化点：
 * 1. 布局变化时使用 CSS transition 平滑过渡，避免卡片重叠
 * 2. 图片预加载：缓冲区内的图片提前加载
 * 3. 使用 transform 定位，触发 GPU 合成层
 * 4. 减少不必要的重渲染
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { useVirtualGrid } from "../hooks/useVirtualGrid";
import { useAppStore } from "../../../stores";
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

const CARD_HEIGHT = 200;
const MIN_COLUMN_WIDTH = 220;
const GAP = 16;
const OVERSCAN_ROWS = 3;
// 容器内边距（px），对应 Tailwind 的 pt-4 和 pb-6
const CONTAINER_PADDING = { top: 16, bottom: 24 };

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
  const prevSidebarCollapsed = useRef(sidebarCollapsed);
  
  // 布局过渡状态
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { visibleItems, totalHeight, recalculate } = useVirtualGrid({
    itemCount: archives.length,
    containerRef,
    config: {
      minColumnWidth: MIN_COLUMN_WIDTH,
      cardHeight: CARD_HEIGHT,
      gap: GAP,
      overscanRows: OVERSCAN_ROWS,
    },
    containerPadding: CONTAINER_PADDING,
  });

  // 预加载缓冲区图片
  useEffect(() => {
    const urls = visibleItems
      .map((item) => archives[item.index]?.currentLevel)
      .filter(Boolean)
      .map((level) => getLevelImage(level!));
    
    schedulePreload(urls);
  }, [visibleItems, archives]);

  // 侧边栏变化时平滑过渡
  useEffect(() => {
    if (prevSidebarCollapsed.current !== sidebarCollapsed) {
      prevSidebarCollapsed.current = sidebarCollapsed;
      
      // 开始过渡
      setIsTransitioning(true);
      
      // 清除之前的定时器
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      
      // 延迟重新计算（等待侧边栏动画完成）
      transitionTimerRef.current = setTimeout(() => {
        // 等待两帧确保布局稳定
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            recalculate();
            
            // 过渡结束
            transitionTimerRef.current = setTimeout(() => {
              setIsTransitioning(false);
            }, 150);
          });
        });
      }, 100);
    }

    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [sidebarCollapsed, recalculate]);

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
      style={{
        // 平滑滚动
        scrollBehavior: "auto", // 禁用 CSS smooth，我们自己控制
        // GPU 加速
        transform: "translateZ(0)",
      }}
    >
      {/* 占位容器 */}
      <div
        style={{
          height: totalHeight,
          position: "relative",
        }}
      >
        {/* 可见卡片 */}
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
                // 布局变化时添加过渡动画
                transition: isTransitioning
                  ? "left 0.15s ease-out, top 0.15s ease-out, width 0.15s ease-out"
                  : "none",
                // GPU 加速
                willChange: isTransitioning ? "transform" : "auto",
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
