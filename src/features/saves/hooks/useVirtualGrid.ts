/**
 * 虚拟网格滚动 Hook — 极致性能优化版 v3
 *
 * 核心优化：
 * 1. 仅渲染可视区域 + 缓冲区的卡片，DOM 节点恒定
 * 2. 双缓冲机制：预渲染下一帧可能出现的卡片
 * 3. 布局变化时使用 CSS transition 平滑过渡
 * 4. 预加载缓冲区图片，滚动时图片已就绪
 * 5. 使用 transform 而非 left/top，触发 GPU 合成层
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

/** 卡片尺寸配置 */
export interface GridConfig {
  /** 卡片最小宽度 (px) */
  minColumnWidth: number;
  /** 卡片固定高度 (px) */
  cardHeight: number;
  /** 卡片间距 (px) */
  gap: number;
  /** 缓冲区渲染行数 */
  overscanRows: number;
}

/** 容器内边距配置 */
export interface ContainerPadding {
  /** 顶部内边距 (px) */
  top: number;
  /** 底部内边距 (px) */
  bottom: number;
}

const DEFAULT_CONFIG: GridConfig = {
  minColumnWidth: 220,
  cardHeight: 200,
  gap: 16,
  overscanRows: 3, // 增加缓冲区，预加载更多图片
};

const DEFAULT_PADDING: ContainerPadding = {
  top: 0,
  bottom: 0,
};

export interface VirtualGridRenderItem {
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface UseVirtualGridOptions {
  itemCount: number;
  containerRef: React.RefObject<HTMLElement | null>;
  config?: Partial<GridConfig>;
  /** 容器内边距，用于计算正确的滚动区域高度 */
  containerPadding?: ContainerPadding;
}

/**
 * 计算网格布局
 * @param containerPadding 容器内边距 { top, bottom }
 */
function calculateGridLayout(
  itemCount: number,
  containerWidth: number,
  config: GridConfig,
  containerPadding: { top: number; bottom: number } = { top: 0, bottom: 0 }
): { columnCount: number; totalHeight: number; actualCardWidth: number } {
  if (containerWidth <= 0 || itemCount === 0) {
    return { columnCount: 0, totalHeight: 0, actualCardWidth: 0 };
  }

  const { minColumnWidth, cardHeight, gap } = config;
  const columnCount = Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap)));
  const actualCardWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
  const rowCount = Math.ceil(itemCount / columnCount);
  // 总高度 = 顶部内边距 + 卡片区域高度 + 底部内边距
  const cardsHeight = rowCount * cardHeight + (rowCount - 1) * gap;
  const totalHeight = containerPadding.top + cardsHeight + containerPadding.bottom;

  return { columnCount, totalHeight, actualCardWidth };
}

/**
 * 计算可视范围（包含缓冲区）
 * @param containerPaddingTop 容器顶部内边距
 */
function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemCount: number,
  columnCount: number,
  config: GridConfig,
  containerPaddingTop: number = 0
): { startIndex: number; endIndex: number } {
  if (itemCount === 0 || columnCount === 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const { cardHeight, gap, overscanRows } = config;
  const rowHeight = cardHeight + gap;
  
  // 计算相对于卡片区域的滚动位置（减去顶部内边距）
  const adjustedScrollTop = Math.max(0, scrollTop - containerPaddingTop);
  
  // 扩大缓冲区，确保滚动时图片已加载
  const bufferedTop = Math.max(0, adjustedScrollTop - overscanRows * rowHeight);
  const bufferedBottom = adjustedScrollTop + containerHeight + overscanRows * rowHeight;

  const startRow = Math.floor(bufferedTop / rowHeight);
  const endRow = Math.min(Math.ceil(bufferedBottom / rowHeight), Math.ceil(itemCount / columnCount));

  return {
    startIndex: Math.max(0, startRow * columnCount),
    endIndex: Math.max(0, Math.min(endRow * columnCount, itemCount) - 1),
  };
}

/**
 * 虚拟网格滚动 Hook
 */
export function useVirtualGrid({
  itemCount,
  containerRef,
  config: userConfig,
  containerPadding: userPadding,
}: UseVirtualGridOptions) {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);
  const containerPadding = useMemo(() => ({ ...DEFAULT_PADDING, ...userPadding }), [userPadding]);

  // 容器尺寸
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // 滚动位置（使用 rAF 更新，避免频繁状态更新）
  const scrollTopRef = useRef(0);
  const [, forceUpdate] = useState(0);
  
  // 布局版本（用于强制重新渲染）
  const layoutVersionRef = useRef(0);

  // 计算网格布局
  const layout = useMemo(
    () => calculateGridLayout(itemCount, containerSize.width, config, containerPadding),
    [itemCount, containerSize.width, config, containerPadding]
  );

  // 计算可视范围
  const visibleRange = useMemo(
    () => calculateVisibleRange(scrollTopRef.current, containerSize.height, itemCount, layout.columnCount, config, containerPadding.top),
    [scrollTopRef.current, containerSize.height, itemCount, layout.columnCount, config, containerPadding.top]
  );

  // 生成可见项列表
  const visibleItems = useMemo((): VirtualGridRenderItem[] => {
    const items: VirtualGridRenderItem[] = [];
    const { startIndex, endIndex } = visibleRange;

    if (startIndex > endIndex || layout.columnCount === 0) return items;

    const { columnCount, actualCardWidth } = layout;
    const { cardHeight, gap } = config;

    for (let i = startIndex; i <= endIndex; i++) {
      const row = Math.floor(i / columnCount);
      const col = i % columnCount;
      items.push({
        index: i,
        left: col * (actualCardWidth + gap),
        // 卡片顶部位置 = 容器顶部内边距 + 行偏移
        top: containerPadding.top + row * (cardHeight + gap),
        width: actualCardWidth,
        height: cardHeight,
      });
    }

    return items;
  }, [visibleRange, layout, config, containerPadding]);

  // ResizeObserver - 使用防抖
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let prevWidth = container.clientWidth;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      // 防抖：同一帧内只处理一次
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const { width, height } = entry.contentRect;
        
        // 宽度变化时，增加布局版本号触发平滑过渡
        if (Math.abs(width - prevWidth) > 1) {
          layoutVersionRef.current++;
          prevWidth = width;
        }
        
        setContainerSize({ width, height });
      });
    });

    resizeObserver.observe(container);
    return () => {
      resizeObserver.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [containerRef]);

  // 滚动处理 - 直接更新 ref，不触发重渲染
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 16; // 约 60fps

    const handleScroll = () => {
      const now = performance.now();
      
      // 节流：限制更新频率
      if (now - lastUpdateTime < UPDATE_INTERVAL) {
        // 即使节流，也要记录当前滚动位置
        scrollTopRef.current = container.scrollTop;
        return;
      }

      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        lastUpdateTime = now;
        scrollTopRef.current = container.scrollTop;
        
        // 强制更新以重新计算可视范围
        forceUpdate((n) => n + 1);
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [containerRef]);

  // 手动触发重新计算（用于侧边栏展开/收起）
  const recalculate = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      layoutVersionRef.current++;
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      scrollTopRef.current = container.scrollTop;
      forceUpdate((n) => n + 1);
    }
  }, [containerRef]);

  return {
    visibleItems,
    totalHeight: layout.totalHeight,
    columnCount: layout.columnCount,
    cardWidth: layout.actualCardWidth,
    layoutVersion: layoutVersionRef.current,
    recalculate,
  };
}
