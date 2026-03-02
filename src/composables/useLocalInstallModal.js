import { ref, watch } from "vue";

export function useLocalInstallModal(props, emit) {
  const isDragging = ref(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    isDragging.value = true;
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    isDragging.value = false;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    isDragging.value = false;
    emit("reset");
  };

  const selectFolder = () => {
    emit("select-folder");
  };

  const resetState = () => {
    emit("reset");
  };

  watch(
    () => props.show,
    (val) => {
      document.body.style.overflow = val ? "hidden" : "";
    }
  );

  return {
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    selectFolder,
    resetState,
  };
}
