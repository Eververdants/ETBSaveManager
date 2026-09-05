/**
 * 虚拟网格滚动 Hook — 极致性能优化版 v3
 *
 * 核心优化：
 * 1. 仅渲染可视区域 + 缓冲区的卡片，DOM 节点恒定
 * 2. 双缓冲机制：预渲染下一帧可能出现的卡片
 * 3. 布局经 ResizeObserver 逐帧精确跟踪容器尺寸，卡片定位始终与当前
 *    宽度吻合，任何时刻都不会越出容器
 * 4. 布局宽度覆盖（layoutWidthOverride）：容器宽度动画（侧边栏开合）时
 *    直接以动画结束后的目标宽度布局，卡片立即落到最终位置，不随动画
 *    逐帧重排、不做位置过渡动画；覆盖生效期间冻结实测尺寸更新（动画
 *    期间零重渲染），解除时在同一帧恢复缓存的实测值；若实测宽度与预测
 *    有偏差（如滚动条增减），解除时瞬时校正
 * 5. 预加载缓冲区图片，滚动时图片已就绪
 *
 * 布局数学抽到 ./virtualGridLayout（纯函数），本文件只管状态与事件订阅。
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_CONFIG,
  buildRenderItems,
  calculateGridLayout,
  calculateVisibleRange,
  type GridConfig,
} from "./virtualGridLayout";

export type { GridConfig, VirtualGridRenderItem } from "./virtualGridLayout";

export interface UseVirtualGridOptions {
  itemCount: number;
  containerRef: React.RefObject<HTMLElement | null>;
  config?: Partial<GridConfig>;
  /**
   * 布局宽度覆盖（px）。容器宽度正处于动画（如侧边栏开合）时传入动画
   * 结束后的目标宽度：布局立即按最终宽度计算，卡片直接滑入最终位置。
   * 置回 null 恢复实测宽度。
   */
  layoutWidthOverride?: number | null;
}

export function useVirtualGrid({
  itemCount,
  containerRef,
  config: userConfig,
  layoutWidthOverride = null,
}: UseVirtualGridOptions) {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);

  // 容器尺寸。宽度覆盖生效期间（侧边栏开合动画）冻结更新：布局由覆盖值
  // 驱动，实测值缓存到 lastRectRef，解除覆盖时一次性恢复
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const lastRectRef = useRef(containerSize);

  // 滚动位置（使用 rAF 更新，避免频繁状态更新）
  const scrollTopRef = useRef(0);
  const [, forceUpdate] = useState(0);

  // 覆盖值镜像，供 ResizeObserver 的 rAF 回调读取（避免重订阅）
  const overrideRef = useRef(layoutWidthOverride);
  overrideRef.current = layoutWidthOverride;

  // 计算网格布局（卡片高度随宽度变化；有覆盖时直接使用目标宽度）
  const layoutWidth = layoutWidthOverride ?? containerSize.width;
  const layout = useMemo(
    () => calculateGridLayout(itemCount, layoutWidth, config),
    [itemCount, layoutWidth, config]
  );

  // 计算可视范围
  const visibleRange = useMemo(
    () =>
      calculateVisibleRange(scrollTopRef.current, containerSize.height, itemCount, layout, config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scrollTopRef.current, containerSize.height, itemCount, layout, config]
  );

  // 生成可见项列表
  const visibleItems = useMemo(
    () => buildRenderItems(visibleRange, layout, config),
    [visibleRange, layout, config]
  );

  // 解除覆盖时在同一帧恢复被冻结的实测尺寸，避免「覆盖已解除、实测值
  // 还是旧的」造成旧布局闪回一帧
  const prevOverrideRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (layoutWidthOverride === prevOverrideRef.current) return;
    const wasActive = prevOverrideRef.current !== null;
    prevOverrideRef.current = layoutWidthOverride;

    if (layoutWidthOverride === null && wasActive) {
      scrollTopRef.current = containerRef.current?.scrollTop ?? scrollTopRef.current;
      const rect = lastRectRef.current;
      setContainerSize((prev) =>
        prev.width === rect.width && prev.height === rect.height ? prev : rect
      );
    }
  }, [layoutWidthOverride, containerRef]);

  // ResizeObserver - 使用防抖
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      // 实测值始终入缓存；是否提交给 React 由覆盖状态决定
      lastRectRef.current = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };

      // 防抖：同一帧内只处理一次
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        // 宽度覆盖生效期间（侧边栏开合动画）冻结：布局由覆盖值驱动，
        // 动画中间尺寸不值得一次重渲染
        if (overrideRef.current !== null) return;
        setContainerSize(lastRectRef.current);
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

  return {
    visibleItems,
    totalHeight: layout.totalHeight,
    /** 最近一次静止实测宽度；覆盖生效期间冻结为动画前的数值，可用作预测基准 */
    containerWidth: containerSize.width,
  };
}
