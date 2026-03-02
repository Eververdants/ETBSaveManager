import { ref, computed } from "vue";

const VIRTUAL_SCROLL_THRESHOLD = 50;

export function useViewMode() {
  const viewMode = ref("grid");
  return { viewMode };
}

export function useVirtualScroll(archives) {
  const useVirtualScroll = computed(() => {
    return archives.value?.length > VIRTUAL_SCROLL_THRESHOLD;
  });
  return { useVirtualScroll };
}

export function useGridColumns() {
  const gridColumns = ref(4);
  let resizeObserver = null;

  const calculateGridColumns = () => {
    const containerWidth = document.querySelector(".flow-content")?.clientWidth || 800;
    const cardMinWidth = 220;
    const gap = 12;
    gridColumns.value = Math.max(1, Math.floor((containerWidth + gap) / (cardMinWidth + gap)));
  };

  const setupResizeObserver = () => {
    const container = document.querySelector(".flow-content");
    if (container && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        calculateGridColumns();
      });
      resizeObserver.observe(container);
    }
  };

  const cleanupResizeObserver = () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  };

  return { gridColumns, calculateGridColumns, setupResizeObserver, cleanupResizeObserver };
}

export function useArchiveCardFlowEventHandlers(emit) {
  const handleSelect = (archiveId) => emit("select", archiveId);
  const handleEdit = (archiveId) => emit("edit", archiveId);
  const handleCopy = (archiveId) => emit("copy", archiveId);
  const handleRemove = (archiveId) => emit("remove", archiveId);

  return { handleSelect, handleEdit, handleCopy, handleRemove };
}
