/**
 * 虚拟网格滚动 Hook — 极致性能优化版 v3
 *
 * 核心优化：
 * 1. 仅渲染可视区域 + 缓冲区的卡片，DOM 节点恒定
 * 2. 双缓冲机制：预渲染下一帧可能出现的卡片
 * 3. 布局变化时使用 CSS transition 平滑过渡
 * 4. 预加载缓冲区图片，滚动时图片已就绪
 * 5. 使用 transform 而非 left/top，触发 GPU 合成层
 *
 * 布局数学抽到 ./virtualGridLayout（纯函数），本文件只管状态与事件订阅。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_CONFIG,
  DEFAULT_PADDING,
  buildRenderItems,
  calculateGridLayout,
  calculateVisibleRange,
  type ContainerPadding,
  type GridConfig,
} from "./virtualGridLayout";

export type { GridConfig, ContainerPadding, VirtualGridRenderItem } from "./virtualGridLayout";

export interface UseVirtualGridOptions {
  itemCount: number;
  containerRef: React.RefObject<HTMLElement | null>;
  config?: Partial<GridConfig>;
  /** 容器内边距，用于计算正确的滚动区域高度 */
  containerPadding?: ContainerPadding;
}

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
    () =>
      calculateVisibleRange(
        scrollTopRef.current,
        containerSize.height,
        itemCount,
        layout.columnCount,
        config,
        containerPadding.top
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scrollTopRef.current, containerSize.height, itemCount, layout.columnCount, config, containerPadding.top]
  );

  // 生成可见项列表
  const visibleItems = useMemo(
    () => buildRenderItems(visibleRange, layout, config, containerPadding),
    [visibleRange, layout, config, containerPadding]
  );

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
    if (!container) return;
    layoutVersionRef.current++;
    setContainerSize({
      width: container.clientWidth,
      height: container.clientHeight,
    });
    scrollTopRef.current = container.scrollTop;
    forceUpdate((n) => n + 1);
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
