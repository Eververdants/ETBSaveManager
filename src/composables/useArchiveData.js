import { ref, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";

/**
 * 存档数据管理 composable
 */
export function useArchiveData() {
  // 存档数据
  const archives = ref([]);
  const displayArchives = ref([]);
  const visibleSaves = ref(new Set());

  // 状态
  const loading = ref(false);
  const dataLoadComplete = ref(false);

  // 难度映射
  const difficultyMap = {
    简单难度: "easy",
    普通难度: "normal",
    困难难度: "hard",
    噩梦难度: "nightmare",
  };

  /**
   * 获取MAINSAVE中的可见存档列表
   */
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

  /**
   * 加载真实存档数据
   */
  const loadRealArchives = async () => {
    try {
      const response = await invoke("load_all_saves");

      if (response && Array.isArray(response)) {
        return response.map((item) => {
          const gameMode =
            item.mode === "单人模式"
              ? "singleplayer"
              : item.mode === "多人模式"
              ? "multiplayer"
              : item.mode.toLowerCase();

          const isVisible = item.is_visible === true;

          return {
            id: item.id ?? 0,
            name: item.name ?? "未命名存档",
            currentLevel: item.current_level ?? "Level0",
            gameMode: gameMode,
            archiveDifficulty:
              difficultyMap[item.difficulty] || item.difficulty?.toLowerCase() || "normal",
            actualDifficulty:
              difficultyMap[item.actual_difficulty] ||
              item.actual_difficulty?.toLowerCase() || "normal",
            isVisible: isVisible,
            path: item.path ?? "",
            date: item.date ?? new Date().toISOString(),
          };
        });
      }
      return [];
    } catch (error) {
      console.error("加载存档失败:", error);
      return [];
    }
  };

  /**
   * 初始化存档数据
   */
  const initializeArchives = async (silent = false) => {
    if (!silent) {
      loading.value = true;
      archives.value = [];
      displayArchives.value = [];
      dataLoadComplete.value = false;
    }

    try {
      await loadVisibleSaves();
      const realArchives = await loadRealArchives();
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

  /**
   * 刷新存档列表
   */
  const refreshArchives = async () => {
    loading.value = true;

    try {
      await loadVisibleSaves();
      const realArchives = await loadRealArchives();
      archives.value = realArchives;
    } catch (error) {
      console.error("刷新存档失败:", error);
    } finally {
      setTimeout(() => {
        loading.value = false;
      }, 300);
    }
  };

  /**
   * 静默刷新存档列表
   */
  const refreshArchivesSilent = async () => {
    try {
      await loadVisibleSaves();
      const realArchives = await loadRealArchives();
      archives.value = realArchives;
    } catch (error) {
      console.error("刷新存档失败:", error);
    }
  };

  /**
   * 删除存档
   */
  const removeArchive = (archiveId) => {
    const index = archives.value.findIndex((a) => a.id === archiveId);
    if (index > -1) {
      archives.value.splice(index, 1);
    }
  };

  /**
   * 更新存档可见性
   */
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

  // 计算属性
  const archiveStats = computed(() => ({
    total: archives.value.length,
    visible: archives.value.filter((a) => a.isVisible).length,
    hidden: archives.value.filter((a) => !a.isVisible).length,
  }));

  return {
    // 状态
    archives,
    displayArchives,
    visibleSaves,
    loading,
    dataLoadComplete,
    archiveStats,
    // 方法
    loadVisibleSaves,
    loadRealArchives,
    initializeArchives,
    refreshArchives,
    refreshArchivesSilent,
    removeArchive,
    updateArchiveVisibility,
  };
}
