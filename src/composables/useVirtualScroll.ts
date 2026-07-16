import { useVirtualizer } from "@tanstack/vue-virtual";
import { ref, computed, watch, type Ref } from "vue";
import type { ArchiveData } from "@/types";

/**
 * Virtual scrolling composable using @tanstack/vue-virtual.
 * Handles column calculation via ResizeObserver and provides
 * items for the visible virtual rows.
 *
 * The ResizeObserver auto-initializes as soon as scrollContainerRef
 * is set (via a watch), eliminating the fragile requirement for an
 * explicit initObserver() call at exactly the right time.  The
 * column count is correct before any reactive render of card data.
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
    // Overscan of 1 row ensures no blank flash during resize or scroll.
    // Keeps ~15-20 cards in the DOM on a 1920px viewport, which is well
    // within the compositor's capacity, especially now that box-shadow
    // and filter blur have been removed from the hover paint path.
    overscan: 1,
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

  // ─── Auto-init ResizeObserver when ref becomes available ──
  let resizeObserver: ResizeObserver | null = null;

  const destroyObserver = (): void => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  };

  // Watch the scrollContainerRef: as soon as it's set (after mount),
  // initialize the column count and set up the ResizeObserver.
  // This runs synchronously before any async data loading, so
  // columnsPerRow is correct for the first card render.
  //
  // ResizeObserver callback is RAF-debounced to avoid redundant
  // column recalculations during window resize — the browser fires
  // resize events at 60fps but we only need the final column count.
  watch(
    scrollContainerRef,
    (el) => {
      if (!el || resizeObserver || !("ResizeObserver" in window)) return;

      columnsPerRow.value = getColumnCount();

      let rafId: number | null = null;
      resizeObserver = new ResizeObserver(() => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          columnsPerRow.value = getColumnCount();
          rafId = null;
        });
      });
      resizeObserver.observe(el);
    },
    { immediate: true },
  );

  /**
   * Recalculate column count and re-observe the container.
   * Call this when the container's layout might have changed
   * (e.g., after a showCards transition or visibility change).
   */
  const recalculateColumns = (): void => {
    columnsPerRow.value = getColumnCount();
    destroyObserver();
    if (scrollContainerRef.value && "ResizeObserver" in window) {
      let rafId: number | null = null;
      resizeObserver = new ResizeObserver(() => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          columnsPerRow.value = getColumnCount();
          rafId = null;
        });
      });
      resizeObserver.observe(scrollContainerRef.value);
    }
  };

  return {
    rowVirtualizer,
    columnsPerRow,
    getRowItems,
    destroyObserver,
    recalculateColumns,
  };
}
