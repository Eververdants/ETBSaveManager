import { ref, computed, type Ref, type ComputedRef } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useI18n } from "vue-i18n";
import { useToast } from "./useToast";
import type { ArchiveData } from "@/types";

interface RawSaveItem {
  id?: number;
  name?: string;
  current_level?: string;
  mode?: string;
  difficulty?: string;
  actual_difficulty?: string;
  is_visible?: boolean;
  path?: string;
  date?: string;
}

interface FileHandleResponse {
  success: boolean;
  data?: {
    SingleplayerSaves?: number[];
  };
}

interface ArchiveStats {
  total: number;
  visible: number;
  hidden: number;
}

/**
 * Archive data management composable
 */
export function useArchiveData(): {
  archives: Ref<ArchiveData[]>;
  displayArchives: Ref<ArchiveData[]>;
  visibleSaves: Ref<Set<number>>;
  loading: Ref<boolean>;
  dataLoadComplete: Ref<boolean>;
  archiveStats: ComputedRef<ArchiveStats>;
  loadVisibleSaves: () => Promise<void>;
  loadRealArchives: () => Promise<ArchiveData[]>;
  initializeArchives: (silent?: boolean) => Promise<void>;
  refreshArchives: () => Promise<void>;
  refreshArchivesSilent: () => Promise<void>;
  removeArchive: (archiveId: number) => void;
  updateArchiveVisibility: (archiveId: number, isVisible: boolean) => void;
} {
  const { t } = useI18n({ useScope: "global" });
  const toast = useToast();
  const archives = ref<ArchiveData[]>([]);
  const displayArchives = ref<ArchiveData[]>([]);
  const visibleSaves = ref(new Set<number>());

  const loading = ref(false);
  const dataLoadComplete = ref(false);

  // Map Chinese difficulty names from game save files to normalized keys
  const difficultyMap: Record<string, string> = {
    简单难度: "easy",
    普通难度: "normal",
    困难难度: "hard",
    噩梦难度: "nightmare",
  };

  // Map Chinese mode names from game save files to normalized keys
  const modeMap: Record<string, string> = {
    单人模式: "singleplayer",
    多人模式: "multiplayer",
  };

  const mapArchive = (item: RawSaveItem): ArchiveData => {
    const gameMode = modeMap[item.mode!] || item.mode?.toLowerCase() || "singleplayer";

    return {
      id: item.id ?? 0,
      name: item.name ?? t("archiveCard.untitled", "Untitled Archive"),
      currentLevel: item.current_level ?? "Level0",
      gameMode,
      archiveDifficulty: difficultyMap[item.difficulty!] || item.difficulty?.toLowerCase() || "normal",
      actualDifficulty: difficultyMap[item.actual_difficulty!] || item.actual_difficulty?.toLowerCase() || "normal",
      isVisible: item.is_visible === true,
      path: item.path ?? "",
      date: item.date ?? new Date().toISOString(),
    };
  };

  const loadVisibleSaves = async (): Promise<void> => {
    try {
      const response = await invoke<FileHandleResponse>("handle_file", {
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

  const loadRealArchives = async (): Promise<ArchiveData[]> => {
    try {
      const response = await invoke<RawSaveItem[]>("load_all_saves");

      if (response && Array.isArray(response)) {
        return response.map(mapArchive);
      }
      return [];
    } catch (error) {
      console.error("Failed to load archives:", error);
      const errorMessage = (error as { message?: string; msg?: string })?.message || (error as { msg?: string })?.msg || JSON.stringify(error) || t("common.unknown");
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

  const initializeArchives = async (silent = false): Promise<void> => {
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

  const refreshArchives = async (): Promise<void> => {
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

  const refreshArchivesSilent = async (): Promise<void> => {
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

  const removeArchive = (archiveId: number): void => {
    const index = archives.value.findIndex((a) => a.id === archiveId);
    if (index > -1) {
      archives.value.splice(index, 1);
    }
  };

  const updateArchiveVisibility = (archiveId: number, isVisible: boolean): void => {
    const archiveIndex = archives.value.findIndex((a) => a.id === archiveId);
    if (archiveIndex > -1) {
      archives.value[archiveIndex].isVisible = isVisible;
    }

    const displayIndex = displayArchives.value.findIndex((a) => a.id === archiveId);
    if (displayIndex > -1) {
      displayArchives.value[displayIndex].isVisible = isVisible;
    }
  };

  const archiveStats = computed((): ArchiveStats => ({
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
