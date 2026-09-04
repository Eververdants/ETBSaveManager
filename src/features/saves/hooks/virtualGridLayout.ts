/**
 * 虚拟网格布局计算 — 纯函数，无 React 依赖
 *
 * 从 useVirtualGrid 拆出：布局数学与组件生命周期无关，可独立测试与复用。
 */

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

/** 单个可见项的定位信息 */
export interface VirtualGridRenderItem {
  index: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface GridLayout {
  columnCount: number;
  totalHeight: number;
  actualCardWidth: number;
}

export interface VisibleRange {
  startIndex: number;
  endIndex: number;
}

export const DEFAULT_CONFIG: GridConfig = {
  minColumnWidth: 220,
  cardHeight: 200,
  gap: 16,
  overscanRows: 3, // 缓冲区，预加载更多图片
};

export const DEFAULT_PADDING: ContainerPadding = {
  top: 0,
  bottom: 0,
};

/** 计算网格布局：列数 / 总高度 / 实际卡片宽度 */
export function calculateGridLayout(
  itemCount: number,
  containerWidth: number,
  config: GridConfig,
  containerPadding: ContainerPadding = DEFAULT_PADDING
): GridLayout {
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

/** 计算可视范围（含缓冲区） */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemCount: number,
  columnCount: number,
  config: GridConfig,
  containerPaddingTop: number = 0
): VisibleRange {
  if (itemCount === 0 || columnCount === 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const { cardHeight, gap, overscanRows } = config;
  const rowHeight = cardHeight + gap;

  // 相对卡片区域的滚动位置（减去顶部内边距）
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

/** 依据可视范围生成渲染项定位 */
export function buildRenderItems(
  visibleRange: VisibleRange,
  layout: GridLayout,
  config: GridConfig,
  containerPadding: ContainerPadding
): VirtualGridRenderItem[] {
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
}
