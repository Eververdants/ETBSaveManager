import { useVirtualizer } from "@tanstack/vue-virtual";
import { ref, computed, type Ref } from "vue";
import type { ArchiveData } from "@/types";

/**
 * Virtual scrolling composable using @tanstack/vue-virtual.
 * Handles column calculation via ResizeObserver and provides
 * items for the visible virtual rows.
 */
export function useVirtualScroll(scrollContainerRef: Ref<HTMLElement | null>, displayArchives: Ref<ArchiveData[]>) {
  const ROW_HEIGHT = 180;
  const columnsPerRow = ref(4);

  const getColumnCount = (): number => {
    if (!scrollContainerRef.value) return 4;
    const width = scrollContainerRef.value.clientWidth - 40;
    // Minimum card width 320px + gap 20px
    return Math.max(1, Math.floor((width + 20) / 340));
  };

  const rowCount = computed(() => {
    const items = displayArchives.value;
    if (items.length === 0) return 0;
    const cols = columnsPerRow.value;
    if (cols === 0) return 0;
    return Math.ceil(items.length / cols);
  });

  const virtualizerOptions = computed(() => ({
    count: rowCount.value,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => ROW_HEIGHT,
    overscan: 3,
  }));

  const rowVirtualizer = useVirtualizer(virtualizerOptions);

  /**
   * Get the ArchiveData[] items for a given virtual row index.
   */
  const getRowItems = (rowIndex: number): ArchiveData[] => {
    const cols = columnsPerRow.value;
    const items = displayArchives.value;
    const start = rowIndex * cols;
    return items.slice(start, start + cols);
  };

  // ─── ResizeObserver for column recalculation ──
  let resizeObserver: ResizeObserver | null = null;

  const initObserver = (): void => {
    if (resizeObserver) return;
    const el = scrollContainerRef.value;
    if (!el || !("ResizeObserver" in window)) return;

    // Initialize column count from current width
    columnsPerRow.value = getColumnCount();

    resizeObserver = new ResizeObserver(() => {
      columnsPerRow.value = getColumnCount();
    });
    resizeObserver.observe(el);
  };

  const destroyObserver = (): void => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  };

  return {
    rowVirtualizer,
    columnsPerRow,
    getRowItems,
    initObserver,
    destroyObserver,
  };
}
