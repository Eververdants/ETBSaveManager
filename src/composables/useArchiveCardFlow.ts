import { ref, computed, nextTick, type Ref, type ComputedRef } from "vue";
import type { ArchiveData } from "@/types";

const VIRTUAL_SCROLL_THRESHOLD = 50;
let columnCache: number | null = null;

export function useViewMode(): { viewMode: Ref<string> } {
  const viewMode = ref("grid");
  return { viewMode };
}

export function useVirtualScroll(archives: Ref<ArchiveData[]>): {
  useVirtualScroll: ComputedRef<boolean>;
} {
  const isVirtualScrollEnabled = computed((): boolean => {
    return archives.value?.length > VIRTUAL_SCROLL_THRESHOLD;
  });
  return { useVirtualScroll: isVirtualScrollEnabled };
}

export function useGridColumns(): {
  gridColumns: Ref<number>;
  calculateGridColumns: () => void;
  setupResizeObserver: () => void;
  cleanupResizeObserver: () => void;
  updateColumnCache: () => void;
} {
  const gridColumns = ref(4);
  let resizeObserver: ResizeObserver | null = null;
  let resizeRafId: number | null = null;

  const calculateGridColumns = (): void => {
    const containerWidth = columnCache || document.querySelector(".flow-content")?.clientWidth || 800;
    const cardMinWidth = 220;
    const gap = 12;
    gridColumns.value = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)));
  };

  const setupResizeObserver = (): void => {
    const container = document.querySelector(".flow-content");
    if (!container) return;

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (resizeRafId) return;
        resizeRafId = requestAnimationFrame(() => {
          resizeRafId = null;
          calculateGridColumns();
        });
      });
      resizeObserver.observe(container);
    }
  };

  const cleanupResizeObserver = (): void => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (resizeRafId) {
      cancelAnimationFrame(resizeRafId);
      resizeRafId = null;
    }
  };

  const updateColumnCache = (): void => {
    const container = document.querySelector(".flow-content");
    if (container) {
      columnCache = container.clientWidth;
    }
  };

  return { gridColumns, calculateGridColumns, setupResizeObserver, cleanupResizeObserver, updateColumnCache };
}

export function useArchiveCardFlowEventHandlers(emit: (event: string, ...args: unknown[]) => void): {
  handleSelect: (archiveId: number) => void;
  handleEdit: (archiveId: number) => void;
  handleCopy: (archiveId: number) => void;
  handleRemove: (archiveId: number) => void;
} {
  const handleSelect = (archiveId: number): void => emit("select", archiveId);
  const handleEdit = (archiveId: number): void => emit("edit", archiveId);
  const handleCopy = (archiveId: number): void => emit("copy", archiveId);
  const handleRemove = (archiveId: number): void => emit("remove", archiveId);

  return { handleSelect, handleEdit, handleCopy, handleRemove };
}
