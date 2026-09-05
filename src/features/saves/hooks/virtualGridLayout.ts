/**
 * 虚拟网格布局计算 — 纯函数，无 React 依赖
 *
 * 从 useVirtualGrid 拆出：布局数学与组件生命周期无关，可独立测试与复用。
 *
 * 卡片高度模型：图片区随卡片宽度按固定宽高比缩放，信息区高度固定，
 * 因此卡片高度是宽度的函数（computeCardHeight）。布局与 MemoizedArchiveCard
 * 的渲染必须使用同一高度来源，行间距才能在任意容器宽度下保持精确一致。
 */

// ---- 卡片视觉规格，与 MemoizedArchiveCard 的样式保持同步 ----
/** 图片区高宽比（卡片内图片容器为 16 : 9.5，高度 = 宽度 × 9.5/16） */
const CARD_IMAGE_HEIGHT_RATIO = 9.5 / 16;
/** 图片区宽度 = 卡片宽度 - 左右 p-3（12px × 2） */
const CARD_IMAGE_INSET = 24;
/** 卡片固定内容高度 = 上下 p-3（12px × 2）+ 信息区约 64px（标题/难度行 + 属性行） */
const CARD_FIXED_CONTENT_HEIGHT = 88;

/** 卡片高度随宽度变化：图片区按固定宽高比缩放，信息区固定 */
function computeCardHeight(cardWidth: number): number {
  const imageHeight = Math.max(0, (cardWidth - CARD_IMAGE_INSET) * CARD_IMAGE_HEIGHT_RATIO);
  return Math.round(imageHeight) + CARD_FIXED_CONTENT_HEIGHT;
}

/** 卡片尺寸配置 */
export interface GridConfig {
  /** 卡片最小宽度 (px) */
  minColumnWidth: number;
  /** 卡片间距 (px)，横向与纵向统一使用该值 */
  gap: number;
  /** 缓冲区渲染行数 */
  overscanRows: number;
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
  /** 随宽度变化的实际卡片高度，与 MemoizedArchiveCard 渲染高度一致 */
  actualCardHeight: number;
}

export interface VisibleRange {
  startIndex: number;
  endIndex: number;
}

export const DEFAULT_CONFIG: GridConfig = {
  minColumnWidth: 220,
  gap: 16,
  overscanRows: 3, // 缓冲区，预加载更多图片
};

/** 计算网格布局：列数 / 总高度 / 实际卡片尺寸 */
export function calculateGridLayout(
  itemCount: number,
  containerWidth: number,
  config: GridConfig
): GridLayout {
  if (containerWidth <= 0 || itemCount === 0) {
    return { columnCount: 0, totalHeight: 0, actualCardWidth: 0, actualCardHeight: 0 };
  }

  const { minColumnWidth, gap } = config;
  const columnCount = Math.max(1, Math.floor((containerWidth + gap) / (minColumnWidth + gap)));
  const actualCardWidth = (containerWidth - gap * (columnCount - 1)) / columnCount;
  const actualCardHeight = computeCardHeight(actualCardWidth);
  const rowCount = Math.ceil(itemCount / columnCount);
  const totalHeight = rowCount * actualCardHeight + (rowCount - 1) * gap;

  return { columnCount, totalHeight, actualCardWidth, actualCardHeight };
}

/** 计算可视范围（含缓冲区） */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemCount: number,
  layout: GridLayout,
  config: GridConfig
): VisibleRange {
  if (itemCount === 0 || layout.columnCount === 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  const { actualCardHeight, columnCount } = layout;
  const { gap, overscanRows } = config;
  const rowHeight = actualCardHeight + gap;

  // 扩大缓冲区，确保滚动时图片已加载
  const bufferedTop = Math.max(0, scrollTop - overscanRows * rowHeight);
  const bufferedBottom = scrollTop + containerHeight + overscanRows * rowHeight;

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
  config: GridConfig
): VirtualGridRenderItem[] {
  const items: VirtualGridRenderItem[] = [];
  const { startIndex, endIndex } = visibleRange;
  if (startIndex > endIndex || layout.columnCount === 0) return items;

  const { columnCount, actualCardWidth, actualCardHeight } = layout;
  const { gap } = config;

  for (let i = startIndex; i <= endIndex; i++) {
    const row = Math.floor(i / columnCount);
    const col = i % columnCount;
    items.push({
      index: i,
      left: col * (actualCardWidth + gap),
      top: row * (actualCardHeight + gap),
      width: actualCardWidth,
      height: actualCardHeight,
    });
  }

  return items;
}
