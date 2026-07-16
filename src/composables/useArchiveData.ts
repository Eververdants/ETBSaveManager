import { ref, shallowRef, computed, type Ref, type ComputedRef } from "vue";
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

interface SaveFileMeta {
  id: number;
  name: string;
  difficulty: string;
  mode: string;
  date: string;
  hidden: boolean;
  path: string;
  is_visible: boolean;
  file_size: number;
}

interface SaveFileDetail {
  path: string;
  current_level: string;
  actual_difficulty: string;
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

export interface IncrementalLoadState {
  phase: "idle" | "metadata" | "details" | "complete";
  totalDetails: number;
  loadedDetails: number;
}

const BATCH_SIZE = 50;
const IMMEDIATE_COUNT = 30; // First N archives get full details before UI shows

/** Shallow array equality — returns true when elements have same IDs */
function arraysEqualById(a: ArchiveData[], b: ArchiveData[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
  }
  return true;
}

/**
 * Archive data management composable
 * Supports two-phase incremental loading for fast initial display:
 *   Phase 1 (metadata) — filename + filesystem only, no .sav parsing
 *   Phase 2 (details)  — batch-parses .sav files to fill currentLevel & actualDifficulty
 */
export function useArchiveData(): {
  archives: Ref<ArchiveData[]>;
  displayArchives: Ref<ArchiveData[]>;
  visibleSaves: Ref<Set<number>>;
  loading: Ref<boolean>;
  dataLoadComplete: Ref<boolean>;
  archiveStats: ComputedRef<ArchiveStats>;
  incrementalLoadState: Ref<IncrementalLoadState>;
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
  const displayArchives = shallowRef<ArchiveData[]>([]);
  const visibleSaves = ref(new Set<number>());

  const loading = ref(false);
  const dataLoadComplete = ref(false);
  const incrementalLoadState = ref<IncrementalLoadState>({
    phase: "idle",
    totalDetails: 0,
    loadedDetails: 0,
  });

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

  /** Map SaveFileMeta (from Rust, no .sav parsing) to ArchiveData.
   *  Uses "Level0" as safe default for currentLevel so the background
   *  image URL is valid from the start. Phase 2 will overwrite it. */
  const mapMetaToArchive = (meta: SaveFileMeta): ArchiveData => {
    const gameMode = modeMap[meta.mode] || meta.mode?.toLowerCase() || "singleplayer";
    const diff = difficultyMap[meta.difficulty] || meta.difficulty?.toLowerCase() || "normal";
    return {
      id: meta.id,
      name: meta.name,
      currentLevel: "Level0",
      gameMode,
      archiveDifficulty: diff,
      actualDifficulty: diff,
      isVisible: meta.is_visible,
      path: meta.path,
      date: meta.date,
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
      const errorMessage =
        (error as { message?: string; msg?: string })?.message ||
        (error as { msg?: string })?.msg ||
        JSON.stringify(error) ||
        t("common.unknown");
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

  /** Phase 1: Load metadata from filenames only (no .sav parsing) */
  const loadMetadata = async (): Promise<ArchiveData[]> => {
    try {
      const metaList = await invoke<SaveFileMeta[]>("load_save_metadata");
      if (metaList && Array.isArray(metaList)) {
        return metaList.map(mapMetaToArchive);
      }
      return [];
    } catch (error) {
      console.error("Failed to load archive metadata:", error);
      return [];
    }
  };

  /**
   * Phase 2: Load detail data (.sav parsing) for archives that only have
   * filename-derived metadata. Loads in batches and replaces ArchiveData
   * objects immutably so Vue reactivity picks up every change.
   */
  const startDetailLoading = async (): Promise<void> => {
    // Archives that still have the default "Level0" (not yet filled by Phase 2)
    const pendingPaths = archives.value.filter((a) => a.currentLevel === "Level0").map((a) => a.path);

    if (pendingPaths.length === 0) {
      incrementalLoadState.value = {
        phase: "complete",
        totalDetails: 0,
        loadedDetails: 0,
      };
      return;
    }

    incrementalLoadState.value = {
      phase: "details",
      totalDetails: pendingPaths.length,
      loadedDetails: 0,
    };

    for (let i = 0; i < pendingPaths.length; i += BATCH_SIZE) {
      const batch = pendingPaths.slice(i, i + BATCH_SIZE);
      try {
        const details = await invoke<SaveFileDetail[]>("load_save_details_batch", { paths: batch });

        // Replace each matched ArchiveData with a new object so Vue detects the change
        const updated = [...archives.value];
        for (const detail of details) {
          const idx = updated.findIndex((a) => a.path === detail.path);
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              currentLevel: detail.current_level,
              actualDifficulty:
                difficultyMap[detail.actual_difficulty] ||
                detail.actual_difficulty?.toLowerCase() ||
                updated[idx].actualDifficulty,
            };
          }
        }
        archives.value = updated;
        displayArchives.value = [...displayArchives.value];

        incrementalLoadState.value.loadedDetails += batch.length;
      } catch (error) {
        console.error(`Failed to load detail batch (${i}–${i + batch.length}):`, error);
      }
    }

    incrementalLoadState.value.phase = "complete";
    console.log(
      `Detail loading complete: ${incrementalLoadState.value.loadedDetails}/${incrementalLoadState.value.totalDetails} saves`,
    );
  };

  /** Cancel any in-progress detail loading by resetting state */
  const cancelDetailLoading = (): void => {
    incrementalLoadState.value = {
      phase: "idle",
      totalDetails: 0,
      loadedDetails: 0,
    };
  };

  const initializeArchives = async (silent = false): Promise<void> => {
    cancelDetailLoading();

    if (!silent) {
      loading.value = true;
      archives.value = [];
      displayArchives.value = [];
      dataLoadComplete.value = false;
    }

    try {
      incrementalLoadState.value = { phase: "metadata", totalDetails: 0, loadedDetails: 0 };

      // Load metadata + first-N details together — cards render ONCE
      const merged = await loadMergedArchives();
      archives.value = merged;
      displayArchives.value = [...merged];
      dataLoadComplete.value = true;

      // Release UI — cards are visible, first N have full details
      if (!silent) {
        loading.value = false;
      }

      // Phase 2 — background batch details for remaining archives (N+1 … end)
      const remaining = archives.value.filter((a) => a.currentLevel === "Level0").length;
      if (remaining > 0) {
        // Defer to avoid blocking first paint
        requestIdleCallback(() => startDetailLoading(), { timeout: 2000 });
      } else {
        incrementalLoadState.value = { phase: "complete", totalDetails: 0, loadedDetails: 0 };
      }
    } catch (error) {
      console.error("Failed to initialize archives:", error);
      if (!silent) {
        archives.value = [];
        displayArchives.value = [];
      }
      dataLoadComplete.value = true;
      incrementalLoadState.value = { phase: "complete", totalDetails: 0, loadedDetails: 0 };
    } finally {
      if (!silent) {
        setTimeout(() => {
          loading.value = false;
        }, 300);
      }
    }
  };

  /** Shared: load metadata + details for first N, return merged ArchiveData[].
   *  First N have real currentLevel/actualDifficulty; the rest use Level0. */
  const loadMergedArchives = async (): Promise<ArchiveData[]> => {
    const [, metaArchives] = await Promise.all([loadVisibleSaves(), loadMetadata()]);
    if (metaArchives.length === 0) return [];

    // Load details for first N before returning
    const firstPaths = metaArchives
      .slice(0, IMMEDIATE_COUNT)
      .map((a) => a.path)
      .filter(Boolean);
    const detailMap = new Map<string, { current_level: string; actual_difficulty: string }>();
    if (firstPaths.length > 0) {
      try {
        const details = await invoke<SaveFileDetail[]>("load_save_details_batch", { paths: firstPaths });
        for (const d of details) detailMap.set(d.path, d);
      } catch (e) {
        console.error("Failed to preload first-batch details:", e);
      }
    }

    return metaArchives.map((item) => {
      const d = detailMap.get(item.path);
      if (d) {
        return {
          ...item,
          currentLevel: d.current_level,
          actualDifficulty:
            difficultyMap[d.actual_difficulty] || d.actual_difficulty?.toLowerCase() || item.actualDifficulty,
        };
      }
      return item;
    });
  };

  const refreshArchives = async (): Promise<void> => {
    loading.value = true;
    cancelDetailLoading();

    try {
      const merged = await loadMergedArchives();
      archives.value = merged;
      // 只有当内容发生变化时才触发 displayArchives 更新
      if (!arraysEqualById(displayArchives.value, merged)) {
        displayArchives.value = [...merged];
      }

      // Background for remaining (N+1 … end)
      const remaining = archives.value.filter((a) => a.currentLevel === "Level0").length;
      if (remaining > 0) startDetailLoading();
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
      const merged = await loadMergedArchives();
      archives.value = merged;
      // 只有当内容发生变化时才触发 displayArchives 更新
      if (!arraysEqualById(displayArchives.value, merged)) {
        displayArchives.value = [...merged];
      }

      const remaining = archives.value.filter((a) => a.currentLevel === "Level0").length;
      if (remaining > 0) requestIdleCallback(() => startDetailLoading(), { timeout: 2000 });
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
      // Immutable update for shallowRef compatibility — replace the entire array
      const updated = [...displayArchives.value];
      updated[displayIndex] = { ...updated[displayIndex], isVisible };
      displayArchives.value = updated;
    }
  };

  const archiveStats = computed(
    (): ArchiveStats => ({
      total: archives.value.length,
      visible: archives.value.filter((a) => a.isVisible).length,
      hidden: archives.value.filter((a) => !a.isVisible).length,
    }),
  );

  return {
    archives,
    displayArchives,
    visibleSaves,
    loading,
    dataLoadComplete,
    archiveStats,
    incrementalLoadState,
    loadVisibleSaves,
    loadRealArchives,
    initializeArchives,
    refreshArchives,
    refreshArchivesSilent,
    removeArchive,
    updateArchiveVisibility,
  };
}
