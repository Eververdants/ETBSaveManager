import { ref, computed, nextTick } from "vue";

const VIRTUAL_SCROLL_THRESHOLD = 50;
let columnCache = null;

export function useViewMode() {
  const viewMode = ref("grid");
  return { viewMode };
}

export function useVirtualScroll(archives) {
  const isVirtualScrollEnabled = computed(() => {
    return archives.value?.length > VIRTUAL_SCROLL_THRESHOLD;
  });
  return { useVirtualScroll: isVirtualScrollEnabled };
}

export function useGridColumns() {
  const gridColumns = ref(4);
  let resizeObserver = null;
  let resizeRafId = null;

  const calculateGridColumns = () => {
    const containerWidth = columnCache || document.querySelector(".flow-content")?.clientWidth || 800;
    const cardMinWidth = 220;
    const gap = 12;
    gridColumns.value = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)));
  };

  const setupResizeObserver = () => {
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

  const cleanupResizeObserver = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (resizeRafId) {
      cancelAnimationFrame(resizeRafId);
      resizeRafId = null;
    }
  };

  const updateColumnCache = () => {
    const container = document.querySelector(".flow-content");
    if (container) {
      columnCache = container.clientWidth;
    }
  };

  return { gridColumns, calculateGridColumns, setupResizeObserver, cleanupResizeObserver, updateColumnCache };
}

export function useArchiveCardFlowEventHandlers(emit) {
  const handleSelect = (archiveId) => emit("select", archiveId);
  const handleEdit = (archiveId) => emit("edit", archiveId);
  const handleCopy = (archiveId) => emit("copy", archiveId);
  const handleRemove = (archiveId) => emit("remove", archiveId);

  return { handleSelect, handleEdit, handleCopy, handleRemove };
}
