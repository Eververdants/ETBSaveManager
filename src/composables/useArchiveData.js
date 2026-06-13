import { ref, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "vue-i18n";
import { useToast } from "./useToast";

/**
 * Archive data management composable
 */
export function useArchiveData() {
  const { t } = useI18n({ useScope: "global" });
  const toast = useToast();
  const archives = ref([]);
  const displayArchives = ref([]);
  const visibleSaves = ref(new Set());

  const loading = ref(false);
  const dataLoadComplete = ref(false);

  // Map Chinese difficulty names from game save files to normalized keys
  const difficultyMap = {
    简单难度: "easy",
    普通难度: "normal",
    困难难度: "hard",
    噩梦难度: "nightmare",
  };

  // Map Chinese mode names from game save files to normalized keys
  const modeMap = {
    单人模式: "singleplayer",
    多人模式: "multiplayer",
  };

  const mapArchive = (item) => {
    const gameMode = modeMap[item.mode] || item.mode?.toLowerCase() || "singleplayer";

    return {
      id: item.id ?? 0,
      name: item.name ?? t("archiveCard.untitled", "Untitled Archive"),
      currentLevel: item.current_level ?? "Level0",
      gameMode,
      archiveDifficulty: difficultyMap[item.difficulty] || item.difficulty?.toLowerCase() || "normal",
      actualDifficulty: difficultyMap[item.actual_difficulty] || item.actual_difficulty?.toLowerCase() || "normal",
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
      console.error("Failed to load visible saves:", error);
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
      console.error("Failed to load archives:", error);
      const errorMessage = error?.message || error?.msg || JSON.stringify(error) || t("common.unknown");
      if (errorMessage.includes("Save directory not found")) {
        toast.showError(
          t("archiveCard.saveDirNotFound", "Please open the game first to initialize the save directory"),
        );
      } else {
        toast.showError(t("archiveCard.loadFailed", "Failed to load archives") + ": " + errorMessage);
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
      await Promise.all([
        loadVisibleSaves(),
        loadRealArchives().then((realArchives) => {
          archives.value = realArchives;
          displayArchives.value = realArchives;
        }),
      ]);

      dataLoadComplete.value = true;

      if (archives.value.length === 0) {
        console.warn("No archives found");
      }
    } catch (error) {
      console.error("Failed to initialize archives:", error);
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
      await Promise.all([
        loadVisibleSaves(),
        loadRealArchives().then((realArchives) => {
          archives.value = realArchives;
        }),
      ]);
    } catch (error) {
      console.error("Failed to refresh archives:", error);
    } finally {
      setTimeout(() => {
        loading.value = false;
      }, 300);
    }
  };

  const refreshArchivesSilent = async () => {
    try {
      await Promise.all([
        loadVisibleSaves(),
        loadRealArchives().then((realArchives) => {
          archives.value = realArchives;
        }),
      ]);
    } catch (error) {
      console.error("Failed to refresh archives:", error);
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

    const displayIndex = displayArchives.value.findIndex((a) => a.id === archiveId);
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
