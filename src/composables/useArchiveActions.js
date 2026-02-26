import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { invoke } from "@tauri-apps/api/core";
import { gsap } from "gsap";
import { useToast } from "./useToast";

export function useArchiveActions(archiveData, filters) {
  const router = useRouter();
  const toast = useToast();

  const showDeleteConfirm = ref(false);
  const archiveToDelete = ref(null);
  const isDeleting = ref(false);
  const deletingCardId = ref(null);
  const isProcessingClick = new Set();

  const selectArchive = (archive) => {
    if (isProcessingClick.has(archive.id)) return;
    isProcessingClick.add(archive.id);
    setTimeout(() => isProcessingClick.delete(archive.id), 300);
  };

  const handleToggleVisibility = async (updatedArchive, callbacks = {}) => {
    const { onSuccess, onError, onRefresh } = callbacks;
    try {
      // updatedArchive.isVisible 已经是切换后的新值（由 ArchiveCard 组件传入）
      const newVisibility = updatedArchive.isVisible;
      const originalVisibility = !newVisibility;
      if (archiveData.updateArchiveVisibility) {
        archiveData.updateArchiveVisibility(updatedArchive.id, newVisibility);
      }
      if (updatedArchive.path) {
        const result = await invoke("handle_file", {
          filePath: updatedArchive.path,
          action: "toggle_visibility",
          archiveName: updatedArchive.name,
        });
        let resultObj;
        try {
          resultObj = typeof result === "string" ? JSON.parse(result) : result;
        } catch (e) {
          throw new Error("解析后端返回结果失败");
        }
        if (!resultObj || !resultObj.success) {
          if (archiveData.updateArchiveVisibility) {
            archiveData.updateArchiveVisibility(
              updatedArchive.id,
              originalVisibility
            );
          }
          throw new Error(resultObj?.error || "操作失败");
        }
        if (onRefresh) await onRefresh();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.showError("切换可见性失败: " + error.message);
      if (onError) onError(error);
    }
  };

  const handleEdit = (archive) => {
    router.push({
      name: "EditArchive",
      params: { archiveData: JSON.stringify(archive) },
    });
  };

  const deleteArchive = (archive) => {
    archiveToDelete.value = archive;
    showDeleteConfirm.value = true;
  };



  const confirmDelete = async (callbacks = {}) => {
    const { onSuccess, onError } = callbacks;
    if (!archiveToDelete.value || isDeleting.value) return;

    isDeleting.value = true;
    deletingCardId.value = archiveToDelete.value.id;

    try {
      const archiveIndex = archiveData.archives.value.findIndex(
        (a) => a.id === archiveToDelete.value.id
      );
      if (archiveIndex === -1) throw new Error("未找到要删除的存档数据");

      const archive = archiveData.archives.value[archiveIndex];
      showDeleteConfirm.value = false;

      const cardElement = document.querySelector(
        `[data-archive-id="${archive.id}"]`
      );

      // 播放删除卡片的淡出动画
      if (cardElement) {
        await new Promise((resolve) => {
          gsap.to(cardElement, {
            opacity: 0,
            duration: 0.15,
            ease: "none",
            onComplete: resolve,
          });
        });
      }

      // 调用后端删除
      if (archive.path) {
        await invoke("delete_file", { filePath: archive.path });
      }

      // 从数据中移除（虚拟滚动会自动处理位置变化）
      if (archiveIndex >= 0 && archiveIndex < archiveData.archives.value.length) {
        archiveData.archives.value.splice(archiveIndex, 1);
      } else {
        console.warn("[useArchiveActions] 删除时存档索引无效:", archiveIndex);
      }

      toast.showSuccess(`${archive?.name ?? "存档"} 已删除`);
      archiveToDelete.value = null;
      isDeleting.value = false;
      deletingCardId.value = null;
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.showError("删除失败: " + (error.message || error));
      closeDeleteModal();
      if (onError) onError(error);
    }
  };

  const cancelDelete = () => closeDeleteModal();

  const closeDeleteModal = () => {
    showDeleteConfirm.value = false;
    archiveToDelete.value = null;
    isDeleting.value = false;
    deletingCardId.value = null;
  };

  const createNewArchive = () => router.push({ name: "CreateArchive" });

  const openSaveGamesFolder = async (callbacks = {}) => {
    try {
      await invoke("open_save_games_folder");
      toast.showFolder("已打开存档文件夹");
      if (callbacks.onSuccess) callbacks.onSuccess();
    } catch (error) {
      console.error("打开文件夹失败:", error);
    }
  };

  return {
    showDeleteConfirm,
    archiveToDelete,
    isDeleting,
    deletingCardId,
    selectArchive,
    handleToggleVisibility,
    handleEdit,
    deleteArchive,
    confirmDelete,
    cancelDelete,
    closeDeleteModal,
    createNewArchive,
    openSaveGamesFolder,
  };
}
