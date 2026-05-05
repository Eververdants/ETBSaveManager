import { ref, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "./useToast";

/**
 * 存档数据管理 composable
 */
export function useArchiveData() {
  const toast = useToast();
  const archives = ref([]);
  const displayArchives = ref([]);
  const visibleSaves = ref(new Set());

  const loading = ref(false);
  const dataLoadComplete = ref(false);

  const difficultyMap = {
    简单难度: "easy",
    普通难度: "normal",
    困难难度: "hard",
    噩梦难度: "nightmare",
  };

  const mapArchive = (item) => {
    const gameMode =
      item.mode === "单人模式"
        ? "singleplayer"
        : item.mode === "多人模式"
        ? "multiplayer"
        : item.mode.toLowerCase();

    return {
      id: item.id ?? 0,
      name: item.name ?? "未命名存档",
      currentLevel: item.current_level ?? "Level0",
      gameMode,
      archiveDifficulty:
        difficultyMap[item.difficulty] || item.difficulty?.toLowerCase() || "normal",
      actualDifficulty:
        difficultyMap[item.actual_difficulty] ||
        item.actual_difficulty?.toLowerCase() || "normal",
      isVisible: item.is_visible === true,
      path: item.path ?? "",
      date: item.date ?? new Date().toISOString(),
    };
  };

  const loadVisibleSaves = async () => {
    try {
      const response = await invoke("handle_file", {
        action: "read",
        filePath: "MAINSAVE.sav",
      });

      if (response && response.success && response.data) {
        const singleplayerSaves = response.data.SingleplayerSaves || [];
        visibleSaves.value = new Set(singleplayerSaves);
      } else {
        visibleSaves.value = new Set();
      }
    } catch (error) {
      console.error("获取可见存档列表失败:", error);
      visibleSaves.value = new Set();
    }
  };

  const loadRealArchives = async () => {
    try {
      const response = await invoke("load_all_saves");

      if (response && Array.isArray(response)) {
        return response.map(mapArchive);
      }
      return [];
    } catch (error) {
      console.error("加载存档失败:", error);
      const errorMessage = error?.message || error?.msg || JSON.stringify(error) || "未知错误";
      if (errorMessage.includes("Save directory not found")) {
        toast.showError("请先打开游戏，初始化存档目录后再使用此功能");
      } else {
        toast.showError("加载存档失败: " + errorMessage);
      }
      return [];
    }
  };

  const initializeArchives = async (silent = false) => {
    if (!silent) {
      loading.value = true;
      archives.value = [];
      displayArchives.value = [];
      dataLoadComplete.value = false;
    }

    try {
      const [_, realArchives] = await Promise.all([
        loadVisibleSaves(),
        loadRealArchives()
      ]);

      archives.value = realArchives;
      displayArchives.value = realArchives;
      dataLoadComplete.value = true;

      if (realArchives.length === 0) {
        console.warn("未找到可加载的存档");
      }
    } catch (error) {
      console.error("初始化存档失败:", error);
      if (!silent) {
        archives.value = [];
        displayArchives.value = [];
      }
      dataLoadComplete.value = true;
    } finally {
      if (!silent) {
        setTimeout(() => {
          loading.value = false;
        }, 300);
      }
    }
  };

  const refreshArchives = async () => {
    loading.value = true;

    try {
      const [_, realArchives] = await Promise.all([
        loadVisibleSaves(),
        loadRealArchives()
      ]);
      archives.value = realArchives;
    } catch (error) {
      console.error("刷新存档失败:", error);
    } finally {
      setTimeout(() => {
        loading.value = false;
      }, 300);
    }
  };

  const refreshArchivesSilent = async () => {
    try {
      const [_, realArchives] = await Promise.all([
        loadVisibleSaves(),
        loadRealArchives()
      ]);
      archives.value = realArchives;
    } catch (error) {
      console.error("刷新存档失败:", error);
    }
  };

  const removeArchive = (archiveId) => {
    const index = archives.value.findIndex((a) => a.id === archiveId);
    if (index > -1) {
      archives.value.splice(index, 1);
    }
  };

  const updateArchiveVisibility = (archiveId, isVisible) => {
    const archiveIndex = archives.value.findIndex((a) => a.id === archiveId);
    if (archiveIndex > -1) {
      archives.value[archiveIndex].isVisible = isVisible;
    }

    const displayIndex = displayArchives.value.findIndex(
      (a) => a.id === archiveId
    );
    if (displayIndex > -1) {
      displayArchives.value[displayIndex].isVisible = isVisible;
    }
  };

  const archiveStats = computed(() => ({
    total: archives.value.length,
    visible: archives.value.filter((a) => a.isVisible).length,
    hidden: archives.value.filter((a) => !a.isVisible).length,
  }));

  return {
    archives,
    displayArchives,
    visibleSaves,
    loading,
    dataLoadComplete,
    archiveStats,
    loadVisibleSaves,
    loadRealArchives,
    initializeArchives,
    refreshArchives,
    refreshArchivesSilent,
    removeArchive,
    updateArchiveVisibility,
  };
}
